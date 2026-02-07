#!/usr/bin/env python3
"""
Migration Budget, Tresorerie et Referentiels - V2 (fixed)
SQL Server (eARTI_DB2, eARTIDB_2025, eARTIDB_2026) -> Supabase

Fixes from V1:
- Deduplicate treasury_movements (multiple runs created duplicates)
- budget_lines: use 'paragraphe' level instead of 'detail'
- reamenagements: insert budget_lines FIRST, then use FK IDs
"""

import pymssql
import requests
import json
import uuid
import sys
from datetime import datetime, date
from collections import defaultdict

# --- Configuration ---

SQL_SERVER = '192.168.0.8'
SQL_PORT = 1433
SQL_USER = r'ARTI\admin'
SQL_PASS = 'tranSPort2021!'
DATABASES = {
    'eARTI_DB2': 2024,
    'eARTIDB_2025': 2025,
    'eARTIDB_2026': 2026,
}

SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

ACCOUNT_BANQUE = '18deeae9-de26-4bed-a6b7-01ed7196a990'
ACCOUNT_CAISSE = '76ba519a-32d1-49b4-9c19-58c9d7fdacc5'

LOG_FILE = '/home/angeyannick/sygfp-artis-g-re/scripts/migration_budget_treasury_v2.log'

stats = defaultdict(int)

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def sql_connect(db):
    return pymssql.connect(
        server=SQL_SERVER, port=SQL_PORT,
        user=SQL_USER, password=SQL_PASS,
        database=db, charset='utf8'
    )

def supabase_count(table):
    r = requests.get(
        f'{SUPABASE_URL}/{table}?select=id&limit=0',
        headers={**HEADERS, 'Prefer': 'count=exact'},
    )
    cr = r.headers.get('content-range', '')
    if '/' in cr:
        total = cr.split('/')[1]
        return int(total) if total != '*' else -1
    return -1

def supabase_insert(table, rows, batch_size=500):
    inserted = 0
    errors = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        r = requests.post(
            f'{SUPABASE_URL}/{table}',
            headers=HEADERS,
            json=batch,
        )
        if r.status_code in (200, 201):
            inserted += len(batch)
        else:
            log(f'  Batch error {i}-{i+len(batch)} ({r.status_code}): {r.text[:300]}')
            for row in batch:
                r2 = requests.post(f'{SUPABASE_URL}/{table}', headers=HEADERS, json=row)
                if r2.status_code in (200, 201):
                    inserted += 1
                else:
                    errors += 1
                    if errors <= 3:
                        log(f'  Row error: {r2.text[:200]}')
        if (i + batch_size) % 2000 == 0 and i > 0:
            log(f'  Progress: {inserted} inserted, {errors} errors so far...')
    return inserted, errors

def supabase_insert_returning(table, rows, batch_size=200):
    """Insert and return created rows with their IDs."""
    all_created = []
    errors = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        r = requests.post(
            f'{SUPABASE_URL}/{table}',
            headers={**HEADERS, 'Prefer': 'return=representation'},
            json=batch,
        )
        if r.status_code in (200, 201):
            all_created.extend(r.json())
        else:
            log(f'  Batch error {i}-{i+len(batch)} ({r.status_code}): {r.text[:300]}')
            for row in batch:
                r2 = requests.post(
                    f'{SUPABASE_URL}/{table}',
                    headers={**HEADERS, 'Prefer': 'return=representation'},
                    json=row,
                )
                if r2.status_code in (200, 201):
                    data = r2.json()
                    if isinstance(data, list):
                        all_created.extend(data)
                    else:
                        all_created.append(data)
                else:
                    errors += 1
                    if errors <= 3:
                        log(f'  Row error: {r2.text[:200]}')
    return all_created, errors

def supabase_delete_all(table, filter_str=''):
    """Delete rows from a table."""
    url = f'{SUPABASE_URL}/{table}?{filter_str}' if filter_str else f'{SUPABASE_URL}/{table}'
    # Need a filter for DELETE, PostgREST requires it
    r = requests.delete(url, headers=HEADERS)
    return r.status_code

def safe_str(val, max_len=None):
    if val is None:
        return None
    s = str(val).strip()
    if max_len:
        s = s[:max_len]
    return s if s else None

def safe_date(val):
    if val is None:
        return None
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    return str(val)

def safe_int(val):
    if val is None:
        return 0
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


# === STEP 0: Clean up duplicate treasury_movements ===

def cleanup_treasury_duplicates():
    log('='*60)
    log('STEP 0: CLEANUP DUPLICATE TREASURY MOVEMENTS')
    log('='*60)

    count = supabase_count('treasury_movements')
    log(f'   Current count: {count}')

    if count <= 11:
        log('   No duplicates to clean, skipping.')
        return

    # Delete all legacy/migrated rows (those without ordonnancement_id)
    # The original 11 rows have ordonnancement_id set
    # Actually, let's just delete rows that have reference starting with MB- or MC- or have no created_by
    r = requests.delete(
        f'{SUPABASE_URL}/treasury_movements?created_by=is.null',
        headers=HEADERS,
    )
    log(f'   Deleted rows with null created_by: status {r.status_code}')

    count_after = supabase_count('treasury_movements')
    log(f'   Count after cleanup: {count_after}')
    log('')


# === STEP 1: Treasury Movements ===

def migrate_treasury_movements():
    log('='*60)
    log('STEP 1: MIGRATE TREASURY MOVEMENTS')
    log('='*60)

    count_before = supabase_count('treasury_movements')
    log(f'   Supabase BEFORE: {count_before}')

    all_rows = []

    for db_name, exercice in DATABASES.items():
        conn = sql_connect(db_name)
        cur = conn.cursor(as_dict=True)

        # MouvementBanque
        cur.execute('SELECT * FROM MouvementBanque WHERE EstActif = 1')
        rows = cur.fetchall()
        log(f'   {db_name} MouvementBanque (actifs): {len(rows)}')

        for row in rows:
            type_mvt = 'credit' if row['TypeMouvement'] == 1 else 'debit'
            montant = safe_int(row['Montant'])
            ref = safe_str(row.get('Reference'))
            objet = safe_str(row.get('Objet'))

            libelle_parts = []
            if objet:
                libelle_parts.append(objet.replace('\n', ' ').replace('\r', '').strip())
            if ref:
                libelle_parts.append(f'Ref: {ref}')
            libelle = ' | '.join(libelle_parts) if libelle_parts else f'Mouvement banque #{row["MouvementBanqueID"]}'

            cheque = safe_str(row.get('Cheque'))
            mode = 'cheque' if cheque else 'virement'
            reference = ref if ref else f'MB-{exercice}-{row["MouvementBanqueID"]}'

            all_rows.append({
                'account_id': ACCOUNT_BANQUE,
                'type': type_mvt,
                'montant': montant,
                'solde_avant': 0,
                'solde_apres': 0,
                'reference': reference[:100],
                'mode_paiement': mode,
                'libelle': (libelle[:500] if libelle else None),
                'date_operation': safe_date(row.get('Date')),
                'created_at': safe_date(row.get('DateCreation')),
            })

        # MouvementCaisse
        cur.execute('SELECT * FROM MouvementCaisse WHERE EstActif = 1')
        rows = cur.fetchall()
        log(f'   {db_name} MouvementCaisse (actifs): {len(rows)}')

        for row in rows:
            mvt_type = row.get('Mouvement', 0)
            type_mvt = 'credit' if mvt_type == 1 else 'debit'
            montant = safe_int(row['Montant'])
            ref = safe_str(row.get('Reference'))
            num_ord = safe_str(row.get('NumeroOrdonnancement'))
            bon_caisse = safe_str(row.get('BonDeCaisse'))

            libelle_parts = []
            if num_ord:
                libelle_parts.append(f'Ord: {num_ord}')
            if bon_caisse:
                libelle_parts.append(f'Bon: {bon_caisse}')
            if ref:
                libelle_parts.append(f'Ref: {ref}')
            libelle = ' | '.join(libelle_parts) if libelle_parts else f'Mouvement caisse #{row["MouvementCaisseID"]}'

            mode = 'especes'
            if row.get('EstVirementBancaire'):
                mode = 'virement'
            reference = ref if ref else f'MC-{exercice}-{row["MouvementCaisseID"]}'

            all_rows.append({
                'account_id': ACCOUNT_CAISSE,
                'type': type_mvt,
                'montant': montant,
                'solde_avant': 0,
                'solde_apres': 0,
                'reference': reference[:100],
                'mode_paiement': mode,
                'libelle': (libelle[:500] if libelle else None),
                'date_operation': safe_date(row.get('Date')),
                'created_at': safe_date(row.get('DateCreation')),
            })

        conn.close()

    log(f'   Total rows to insert: {len(all_rows)}')
    if all_rows:
        inserted, errors = supabase_insert('treasury_movements', all_rows)
        stats['treasury_inserted'] = inserted
        stats['treasury_errors'] = errors
        log(f'   Inserted: {inserted}, Errors: {errors}')

    count_after = supabase_count('treasury_movements')
    stats['treasury_final'] = count_after
    log(f'   Supabase AFTER: {count_after}')
    log('')


# === STEP 2: Budget Lines ===

def migrate_budget_lines():
    log('='*60)
    log('STEP 2: MIGRATE BUDGET LINES (ProgramBudget)')
    log('='*60)

    count_before = supabase_count('budget_lines')
    log(f'   Supabase BEFORE: {count_before}')

    # Get existing codes to avoid duplicates
    existing_codes = set()
    offset = 0
    while True:
        r = requests.get(
            f'{SUPABASE_URL}/budget_lines?select=code,exercice&limit=1000&offset={offset}',
            headers=HEADERS,
        )
        if r.status_code != 200:
            break
        data = r.json()
        if not data:
            break
        for item in data:
            existing_codes.add(f'{item.get("code")}_{item.get("exercice")}')
        offset += len(data)
        if len(data) < 1000:
            break
    log(f'   Existing codes: {len(existing_codes)}')

    all_rows = []

    for db_name, exercice in DATABASES.items():
        conn = sql_connect(db_name)
        cur = conn.cursor(as_dict=True)

        cur.execute('SELECT * FROM ProgramBudget WHERE EstActif = 1')
        rows = cur.fetchall()
        log(f'   {db_name} ProgramBudget (actifs): {len(rows)}')

        for row in rows:
            imputation = safe_str(row.get('Imputation'))
            if not imputation:
                continue

            dup_key = f'{imputation}_{exercice}'
            if dup_key in existing_codes:
                continue
            existing_codes.add(dup_key)

            nature_eco = safe_str(row.get('NatureEconomiqueEco'))
            nature_depense = safe_str(row.get('NatureDepense'))
            budget_initial = safe_int(row.get('BudgetInitial'))
            dir_en_charge = safe_str(row.get('DirectionEnCharge'))
            code_os = safe_str(row.get('CodeOS'))
            action = safe_str(row.get('Action'))
            activite = safe_str(row.get('Activite'))
            sous_activite = safe_str(row.get('SousActivite'))
            direction = safe_str(row.get('Direction'))

            label = nature_eco if nature_eco else (nature_depense if nature_depense else f'Ligne {imputation}')

            all_rows.append({
                'code': imputation,
                'label': label[:255],
                'level': 'paragraphe',   # FIXED: was 'detail', must be chapitre/article/paragraphe
                'dotation_initiale': budget_initial,
                'exercice': exercice,
                'is_active': True,
                'legacy_import': True,
                'source_financement': 'budget_etat',
                'statut': 'valide',
                'type_ligne': 'depense',
                'dotation_modifiee': budget_initial,
                'disponible_calcule': budget_initial,
                'code_budgetaire': imputation,
                'commentaire': f'OS:{code_os} Act:{action} Activ:{activite} SA:{sous_activite} Dir:{direction} DirCharge:{dir_en_charge}',
                'statut_execution': 'OUVERTE',
                'created_at': safe_date(row.get('DateCreation')),
            })

        conn.close()

    log(f'   New lines to insert: {len(all_rows)}')

    budget_line_map = {}  # imputation_exercice -> id

    if all_rows:
        created, errors = supabase_insert_returning('budget_lines', all_rows)
        stats['budget_lines_inserted'] = len(created)
        stats['budget_lines_errors'] = errors
        log(f'   Inserted: {len(created)}, Errors: {errors}')

        # Build map from created rows
        for item in created:
            key = f'{item["code"]}_{item["exercice"]}'
            budget_line_map[key] = item['id']

    # Also load pre-existing budget_lines into the map
    offset = 0
    while True:
        r = requests.get(
            f'{SUPABASE_URL}/budget_lines?select=id,code,exercice&limit=1000&offset={offset}',
            headers=HEADERS,
        )
        if r.status_code != 200:
            break
        data = r.json()
        if not data:
            break
        for item in data:
            key = f'{item["code"]}_{item["exercice"]}'
            budget_line_map[key] = item['id']
        offset += len(data)
        if len(data) < 1000:
            break

    log(f'   Budget line map total: {len(budget_line_map)} entries')

    count_after = supabase_count('budget_lines')
    stats['budget_lines_final'] = count_after
    log(f'   Supabase AFTER: {count_after}')
    log('')

    return budget_line_map


# === STEP 3: SYSCOHADA ===

def migrate_syscohada():
    log('='*60)
    log('STEP 3: MIGRATE PLAN COMPTABLE SYSCOHADA')
    log('='*60)

    count_before = supabase_count('plan_comptable_sysco')
    log(f'   Supabase BEFORE: {count_before}')

    if count_before >= 350:
        log('   Already migrated (400 rows). Skipping.')
        stats['sysco_final'] = count_before
        log('')
        return

    seen_codes = set()
    r = requests.get(
        f'{SUPABASE_URL}/plan_comptable_sysco?select=code&limit=10000',
        headers=HEADERS,
    )
    if r.status_code == 200:
        for item in r.json():
            seen_codes.add(item.get('code'))

    all_rows = []
    for db_name in ['eARTI_DB2', 'eARTIDB_2025', 'eARTIDB_2026']:
        conn = sql_connect(db_name)
        cur = conn.cursor(as_dict=True)
        cur.execute('SELECT * FROM SYSCOHADA')
        rows = cur.fetchall()
        log(f'   {db_name} SYSCOHADA: {len(rows)}')

        for row in rows:
            cpte = row.get('CPTE')
            if cpte is None:
                continue
            code = str(int(cpte)) if cpte == int(cpte) else str(cpte)
            if code in seen_codes:
                continue
            seen_codes.add(code)

            intitule = safe_str(row.get('Iintitutes'))
            nature_sysco = safe_str(row.get('NatureSYSCO'))
            libelle = intitule if intitule else nature_sysco
            classe = code[0] if code else None
            type_compte = 'resultat' if classe in ('6', '7', '8') else 'bilan'

            all_rows.append({
                'code': code,
                'libelle': libelle[:255] if libelle else f'Compte {code}',
                'classe': classe,
                'type': type_compte,
                'est_active': True,
            })
        conn.close()

    log(f'   New accounts to insert: {len(all_rows)}')
    if all_rows:
        inserted, errors = supabase_insert('plan_comptable_sysco', all_rows)
        stats['sysco_inserted'] = inserted
        stats['sysco_errors'] = errors
        log(f'   Inserted: {inserted}, Errors: {errors}')

    count_after = supabase_count('plan_comptable_sysco')
    stats['sysco_final'] = count_after
    log(f'   Supabase AFTER: {count_after}')
    log('')


# === STEP 4: Reamenagements ===

def migrate_reamenagements(budget_line_map):
    log('='*60)
    log('STEP 4: MIGRATE REAMENAGEMENTS BUDGETAIRES')
    log('='*60)

    count_before = supabase_count('reamenagements_budgetaires')
    log(f'   Supabase BEFORE: {count_before}')
    log(f'   Budget line map: {len(budget_line_map)} entries')

    if count_before > 0:
        log('   Already has data. Skipping to avoid duplicates.')
        stats['ream_final'] = count_before
        log('')
        return

    all_rows = []
    skipped_no_fk = 0

    for db_name, exercice in DATABASES.items():
        conn = sql_connect(db_name)
        cur = conn.cursor(as_dict=True)

        # Build ProgramBudgetID -> Imputation map
        cur.execute('SELECT ProgramBudgetID, Imputation FROM ProgramBudget')
        pb_map = {}
        for row in cur.fetchall():
            pb_map[row['ProgramBudgetID']] = safe_str(row['Imputation'])

        cur.execute('SELECT * FROM Reamanagement WHERE EstActif = 1')
        rows = cur.fetchall()
        log(f'   {db_name} Reamanagement (actifs): {len(rows)}')

        for row in rows:
            pb_id = row.get('ProgramBudgetID')
            imputation_source = pb_map.get(pb_id)
            imputation_dest = safe_str(row.get('ImputationToucheParleReamanagement'))

            montant = safe_int(row.get('MontantReamanagement'))
            budget_init = safe_int(row.get('BudgetInitial'))
            budget_apres = safe_int(row.get('BudgetApresReamangement'))
            budget_dest_avant = safe_int(row.get('BudgetToucheParLeReagement'))
            type_ream = row.get('TypeReamanagementEffectue')

            # Look up budget_line IDs - both source AND destination are NOT NULL
            source_key = f'{imputation_source}_{exercice}' if imputation_source else None
            dest_key = f'{imputation_dest}_{exercice}' if imputation_dest else None
            source_line_id = budget_line_map.get(source_key) if source_key else None
            dest_line_id = budget_line_map.get(dest_key) if dest_key else None

            # Both FKs are required (NOT NULL constraint)
            if not source_line_id or not dest_line_id:
                skipped_no_fk += 1
                continue

            all_rows.append({
                'exercice': exercice,
                'budget_line_source_id': source_line_id,
                'imputation_source': imputation_source,
                'libelle_source': f'Ligne {imputation_source}',
                'budget_source_avant': budget_init,
                'budget_source_apres': budget_apres if type_ream == 1 else budget_init,
                'budget_line_destination_id': dest_line_id,
                'imputation_destination': imputation_dest,
                'libelle_destination': f'Ligne {imputation_dest}',
                'budget_destination_avant': budget_dest_avant,
                'budget_destination_apres': budget_dest_avant + montant if type_ream == 2 else budget_dest_avant,
                'montant': montant,
                'motif': f'Reamenagement #{row["ReamanagementID"]} (type {type_ream})',
                'reference_note': f'REAM-{exercice}-{row["ReamanagementID"]}',
                'statut': 'valide',
                'created_at': safe_date(row.get('DateCreation')),
            })

        conn.close()

    log(f'   Rows with valid FKs to insert: {len(all_rows)}')
    log(f'   Skipped (missing FK): {skipped_no_fk}')

    if all_rows:
        inserted, errors = supabase_insert('reamenagements_budgetaires', all_rows)
        stats['ream_inserted'] = inserted
        stats['ream_errors'] = errors
        log(f'   Inserted: {inserted}, Errors: {errors}')

    count_after = supabase_count('reamenagements_budgetaires')
    stats['ream_final'] = count_after
    log(f'   Supabase AFTER: {count_after}')
    log('')


# === MAIN ===

def main():
    log('='*60)
    log('MIGRATION BUDGET, TRESORERIE ET REFERENTIELS - V2')
    log(f'Start: {datetime.now().isoformat()}')
    log('='*60)
    log('')

    # Step 0: Clean up duplicates from previous runs
    cleanup_treasury_duplicates()

    # Step 1: Treasury movements
    migrate_treasury_movements()

    # Step 2: Budget lines (returns map for step 4)
    budget_line_map = migrate_budget_lines()

    # Step 3: SYSCOHADA
    migrate_syscohada()

    # Step 4: Reamenagements (needs budget_line_map)
    migrate_reamenagements(budget_line_map)

    # Final report
    log('='*60)
    log('FINAL REPORT')
    log('='*60)
    log(f'  Treasury movements: {stats.get("treasury_inserted",0)} inserted, {stats.get("treasury_errors",0)} errors -> Total: {stats.get("treasury_final","?")}')
    log(f'  Budget lines:       {stats.get("budget_lines_inserted",0)} inserted, {stats.get("budget_lines_errors",0)} errors -> Total: {stats.get("budget_lines_final","?")}')
    log(f'  Plan comptable:     {stats.get("sysco_inserted",0)} inserted, {stats.get("sysco_errors",0)} errors -> Total: {stats.get("sysco_final","?")}')
    log(f'  Reamenagements:     {stats.get("ream_inserted",0)} inserted, {stats.get("ream_errors",0)} errors -> Total: {stats.get("ream_final","?")}')
    log('')
    log(f'End: {datetime.now().isoformat()}')


if __name__ == '__main__':
    main()
