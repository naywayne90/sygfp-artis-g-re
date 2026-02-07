#!/usr/bin/env python3
"""
Migration Budget, Trésorerie et Référentiels
SQL Server (eARTI_DB2, eARTIDB_2025, eARTIDB_2026) → Supabase

Tables migrées:
1. MouvementBanque → treasury_movements (type=banque)
2. MouvementCaisse → treasury_movements (type=caisse)
3. ProgramBudget → budget_lines
4. SYSCOHADA → plan_comptable_sysco
5. Reamanagement → reamenagements_budgetaires + budget_movements
"""

import pymssql
import requests
import json
import uuid
import sys
from datetime import datetime, date
from collections import defaultdict

# ─── Configuration ───────────────────────────────────────────────

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

# Treasury accounts in Supabase
ACCOUNT_BANQUE = '18deeae9-de26-4bed-a6b7-01ed7196a990'   # Compte Trésor Public (banque)
ACCOUNT_CAISSE = '76ba519a-32d1-49b4-9c19-58c9d7fdacc5'   # Caisse Menues Dépenses (caisse)

LOG_FILE = '/home/angeyannick/sygfp-artis-g-re/scripts/migration_budget_treasury.log'

# ─── Helpers ─────────────────────────────────────────────────────

stats = defaultdict(int)

def log(msg):
    ts = datetime.now().strftime('%H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(LOG_FILE, 'a') as f:
        f.write(line + '\n')

def sql_connect(db):
    return pymssql.connect(
        server=SQL_SERVER, port=SQL_PORT,
        user=SQL_USER, password=SQL_PASS,
        database=db, charset='utf8'
    )

def supabase_count(table):
    """Get exact count of rows in a Supabase table."""
    r = requests.get(
        f'{SUPABASE_URL}/{table}?select=count',
        headers={**HEADERS, 'Prefer': 'count=exact'},
    )
    if r.status_code == 200:
        data = r.json()
        if data and isinstance(data, list) and 'count' in data[0]:
            return data[0]['count']
    return -1

def supabase_upsert(table, rows, on_conflict=None, batch_size=500):
    """Insert rows into Supabase in batches. Returns (inserted, errors)."""
    inserted = 0
    errors = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        h = {**HEADERS}
        if on_conflict:
            h['Prefer'] = 'resolution=merge-duplicates,return=minimal'
        r = requests.post(
            f'{SUPABASE_URL}/{table}',
            headers=h,
            json=batch,
        )
        if r.status_code in (200, 201):
            inserted += len(batch)
        else:
            # Try individual inserts for the batch
            log(f'  Batch error ({r.status_code}): {r.text[:300]}')
            for row in batch:
                r2 = requests.post(
                    f'{SUPABASE_URL}/{table}',
                    headers=h,
                    json=row,
                )
                if r2.status_code in (200, 201):
                    inserted += 1
                else:
                    errors += 1
                    if errors <= 5:
                        log(f'  Row error: {r2.text[:200]}')
    return inserted, errors

def safe_str(val, max_len=None):
    """Convert value to string safely."""
    if val is None:
        return None
    s = str(val).strip()
    if max_len:
        s = s[:max_len]
    return s if s else None

def safe_date(val):
    """Convert date/datetime to ISO string."""
    if val is None:
        return None
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    return str(val)

def safe_int(val):
    """Convert to int safely."""
    if val is None:
        return 0
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


# ─── 1. Migrate Treasury Movements (MouvementBanque + MouvementCaisse) ──

def migrate_treasury_movements():
    log('='*60)
    log('1. MIGRATION TREASURY MOVEMENTS')
    log('='*60)

    count_before = supabase_count('treasury_movements')
    log(f'   Supabase treasury_movements AVANT: {count_before}')

    all_rows = []

    # Track legacy IDs to prevent duplicates
    existing_refs = set()

    for db_name, exercice in DATABASES.items():
        conn = sql_connect(db_name)
        cur = conn.cursor(as_dict=True)

        # ── MouvementBanque ──
        cur.execute('SELECT * FROM MouvementBanque WHERE EstActif = 1')
        banque_rows = cur.fetchall()
        log(f'   {db_name} MouvementBanque (actifs): {len(banque_rows)}')

        for row in banque_rows:
            legacy_key = f'MB-{db_name}-{row["MouvementBanqueID"]}'
            if legacy_key in existing_refs:
                continue
            existing_refs.add(legacy_key)

            # TypeMouvement: 1=credit, 2=debit
            type_mvt = 'credit' if row['TypeMouvement'] == 1 else 'debit'
            montant = safe_int(row['Montant'])
            ref = safe_str(row.get('Reference'))
            objet = safe_str(row.get('Objet'))

            # Build libelle from objet and reference
            libelle_parts = []
            if objet:
                libelle_parts.append(objet.replace('\n', ' ').replace('\r', '').strip())
            if ref:
                libelle_parts.append(f'Ref: {ref}')
            libelle = ' | '.join(libelle_parts) if libelle_parts else f'Mouvement banque #{row["MouvementBanqueID"]}'

            cheque = safe_str(row.get('Cheque'))
            mode = 'cheque' if cheque else 'virement'
            reference = f'MB-{exercice}-{row["MouvementBanqueID"]}'
            if ref:
                reference = ref

            all_rows.append({
                'account_id': ACCOUNT_BANQUE,
                'ordonnancement_id': None,
                'type': type_mvt,
                'montant': montant,
                'solde_avant': 0,
                'solde_apres': 0,
                'reference': reference,
                'mode_paiement': mode,
                'libelle': libelle[:500] if libelle else None,
                'date_operation': safe_date(row.get('Date')),
                'created_at': safe_date(row.get('DateCreation')),
                'created_by': None,
            })

        # ── MouvementCaisse ──
        cur.execute('SELECT * FROM MouvementCaisse WHERE EstActif = 1')
        caisse_rows = cur.fetchall()
        log(f'   {db_name} MouvementCaisse (actifs): {len(caisse_rows)}')

        for row in caisse_rows:
            legacy_key = f'MC-{db_name}-{row["MouvementCaisseID"]}'
            if legacy_key in existing_refs:
                continue
            existing_refs.add(legacy_key)

            # TypeMouvement: 3=approvisionnement(credit), 4=decaissement(debit)
            # Mouvement: 1=entree(credit), 2=sortie(debit)
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

            reference = f'MC-{exercice}-{row["MouvementCaisseID"]}'
            if ref:
                reference = ref

            all_rows.append({
                'account_id': ACCOUNT_CAISSE,
                'ordonnancement_id': None,
                'type': type_mvt,
                'montant': montant,
                'solde_avant': 0,
                'solde_apres': 0,
                'reference': reference,
                'mode_paiement': mode,
                'libelle': libelle[:500] if libelle else None,
                'date_operation': safe_date(row.get('Date')),
                'created_at': safe_date(row.get('DateCreation')),
                'created_by': None,
            })

        conn.close()

    log(f'   Total mouvements à insérer: {len(all_rows)}')

    if all_rows:
        inserted, errors = supabase_upsert('treasury_movements', all_rows)
        stats['treasury_inserted'] = inserted
        stats['treasury_errors'] = errors
        log(f'   Insérés: {inserted}, Erreurs: {errors}')

    count_after = supabase_count('treasury_movements')
    stats['treasury_final'] = count_after
    log(f'   Supabase treasury_movements APRÈS: {count_after}')
    log('')


# ─── 2. Migrate ProgramBudget → budget_lines ────────────────────

def migrate_budget_lines():
    log('='*60)
    log('2. MIGRATION BUDGET LINES (ProgramBudget)')
    log('='*60)

    count_before = supabase_count('budget_lines')
    log(f'   Supabase budget_lines AVANT: {count_before}')

    all_rows = []
    existing_codes = set()

    # First, get existing budget_lines codes to avoid duplicates
    r = requests.get(
        f'{SUPABASE_URL}/budget_lines?select=code,exercice&limit=10000',
        headers=HEADERS,
    )
    if r.status_code == 200:
        for item in r.json():
            existing_codes.add(f'{item.get("code")}_{item.get("exercice")}')
        log(f'   Codes existants dans Supabase: {len(existing_codes)}')

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

            code_os = safe_str(row.get('CodeOS'))
            action = safe_str(row.get('Action'))
            activite = safe_str(row.get('Activite'))
            sous_activite = safe_str(row.get('SousActivite'))
            direction = safe_str(row.get('Direction'))
            nature_depense = safe_str(row.get('NatureDepense'))
            nature_eco = safe_str(row.get('NatureEconomiqueEco'))
            budget_initial = safe_int(row.get('BudgetInitial'))
            dir_en_charge = safe_str(row.get('DirectionEnCharge'))

            # Build label from nature
            label = nature_eco if nature_eco else (nature_depense if nature_depense else f'Ligne {imputation}')

            # Build code_budgetaire from components
            code_budg = imputation

            all_rows.append({
                'code': imputation,
                'label': label[:255] if label else 'N/A',
                'level': 'detail',
                'dotation_initiale': budget_initial,
                'exercice': exercice,
                'is_active': True,
                'legacy_import': True,
                'source_financement': 'budget_etat',
                'statut': 'valide',
                'type_ligne': 'depense',
                'dotation_modifiee': budget_initial,
                'disponible_calcule': budget_initial,
                'code_budgetaire': code_budg,
                'commentaire': f'OS:{code_os} Act:{action} Activ:{activite} SA:{sous_activite} Dir:{direction} DirCharge:{dir_en_charge}',
                'statut_execution': 'OUVERTE',
                'created_at': safe_date(row.get('DateCreation')),
            })

        conn.close()

    log(f'   Nouvelles lignes à insérer: {len(all_rows)}')

    if all_rows:
        inserted, errors = supabase_upsert('budget_lines', all_rows)
        stats['budget_lines_inserted'] = inserted
        stats['budget_lines_errors'] = errors
        log(f'   Insérés: {inserted}, Erreurs: {errors}')

    count_after = supabase_count('budget_lines')
    stats['budget_lines_final'] = count_after
    log(f'   Supabase budget_lines APRÈS: {count_after}')
    log('')


# ─── 3. Migrate SYSCOHADA → plan_comptable_sysco ────────────────

def migrate_syscohada():
    log('='*60)
    log('3. MIGRATION PLAN COMPTABLE SYSCOHADA')
    log('='*60)

    count_before = supabase_count('plan_comptable_sysco')
    log(f'   Supabase plan_comptable_sysco AVANT: {count_before}')

    all_rows = []
    seen_codes = set()

    # Get existing codes
    r = requests.get(
        f'{SUPABASE_URL}/plan_comptable_sysco?select=code&limit=10000',
        headers=HEADERS,
    )
    if r.status_code == 200:
        for item in r.json():
            seen_codes.add(item.get('code'))
        log(f'   Codes existants: {len(seen_codes)}')

    # Use the most complete database (DB2 has 350 vs 330 in others)
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

            # CPTE is stored as float, convert to string code
            code = str(int(cpte)) if cpte == int(cpte) else str(cpte)

            if code in seen_codes:
                continue
            seen_codes.add(code)

            nature_sysco = safe_str(row.get('NatureSYSCO'))
            intitule = safe_str(row.get('Iintitutes'))
            libelle = intitule if intitule else nature_sysco

            # Determine classe from first digit of code
            classe = code[0] if code else None

            # Determine type based on classe
            type_compte = 'bilan'
            if classe in ('6', '7', '8'):
                type_compte = 'resultat'

            all_rows.append({
                'code': code,
                'libelle': libelle[:255] if libelle else f'Compte {code}',
                'classe': classe,
                'type': type_compte,
                'est_active': True,
            })

        conn.close()

    log(f'   Nouveaux comptes à insérer: {len(all_rows)}')

    if all_rows:
        inserted, errors = supabase_upsert('plan_comptable_sysco', all_rows)
        stats['sysco_inserted'] = inserted
        stats['sysco_errors'] = errors
        log(f'   Insérés: {inserted}, Erreurs: {errors}')

    count_after = supabase_count('plan_comptable_sysco')
    stats['sysco_final'] = count_after
    log(f'   Supabase plan_comptable_sysco APRÈS: {count_after}')
    log('')


# ─── 4. Migrate Reamanagement → reamenagements_budgetaires ──────

def migrate_reamenagements():
    log('='*60)
    log('4. MIGRATION RÉAMÉNAGEMENTS BUDGÉTAIRES')
    log('='*60)

    count_before = supabase_count('reamenagements_budgetaires')
    log(f'   Supabase reamenagements_budgetaires AVANT: {count_before}')

    # First, build a map of imputation → budget_line_id from Supabase
    budget_line_map = {}  # imputation_exercice → id
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

    log(f'   Budget lines map: {len(budget_line_map)} entries')

    all_rows = []

    for db_name, exercice in DATABASES.items():
        conn = sql_connect(db_name)
        cur = conn.cursor(as_dict=True)

        # Also need ProgramBudget mapping: ProgramBudgetID → Imputation
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

            # TypeReamanagementEffectue: 1=diminution(source), 2=augmentation(destination)
            type_ream = row.get('TypeReamanagementEffectue')

            # Look up budget_line IDs
            source_key = f'{imputation_source}_{exercice}' if imputation_source else None
            dest_key = f'{imputation_dest}_{exercice}' if imputation_dest else None
            source_line_id = budget_line_map.get(source_key) if source_key else None
            dest_line_id = budget_line_map.get(dest_key) if dest_key else None

            # Build motif
            motif = f'Réaménagement #{row["ReamanagementID"]} (type {type_ream})'

            all_rows.append({
                'exercice': exercice,
                'budget_line_source_id': source_line_id,
                'imputation_source': imputation_source,
                'libelle_source': f'Ligne {imputation_source}' if imputation_source else None,
                'budget_source_avant': budget_init,
                'budget_source_apres': budget_apres if type_ream == 1 else budget_init,
                'budget_line_destination_id': dest_line_id,
                'imputation_destination': imputation_dest,
                'libelle_destination': f'Ligne {imputation_dest}' if imputation_dest else None,
                'budget_destination_avant': budget_dest_avant,
                'budget_destination_apres': budget_dest_avant + montant if type_ream == 2 else budget_dest_avant,
                'montant': montant,
                'motif': motif,
                'reference_note': f'REAM-{exercice}-{row["ReamanagementID"]}',
                'statut': 'valide',
                'created_at': safe_date(row.get('DateCreation')),
            })

        conn.close()

    log(f'   Réaménagements à insérer: {len(all_rows)}')

    if all_rows:
        inserted, errors = supabase_upsert('reamenagements_budgetaires', all_rows)
        stats['ream_inserted'] = inserted
        stats['ream_errors'] = errors
        log(f'   Insérés: {inserted}, Erreurs: {errors}')

    count_after = supabase_count('reamenagements_budgetaires')
    stats['ream_final'] = count_after
    log(f'   Supabase reamenagements_budgetaires APRÈS: {count_after}')
    log('')


# ─── Main ────────────────────────────────────────────────────────

def main():
    log('='*60)
    log('MIGRATION BUDGET, TRÉSORERIE ET RÉFÉRENTIELS')
    log(f'Démarrage: {datetime.now().isoformat()}')
    log('='*60)
    log('')

    # Step 1: Treasury movements
    migrate_treasury_movements()

    # Step 2: Budget lines
    migrate_budget_lines()

    # Step 3: SYSCOHADA
    migrate_syscohada()

    # Step 4: Réaménagements
    migrate_reamenagements()

    # ── Final report ──
    log('='*60)
    log('RAPPORT FINAL')
    log('='*60)
    log(f'  Treasury movements: {stats.get("treasury_inserted",0)} insérés, {stats.get("treasury_errors",0)} erreurs → Total: {stats.get("treasury_final",0)}')
    log(f'  Budget lines:       {stats.get("budget_lines_inserted",0)} insérés, {stats.get("budget_lines_errors",0)} erreurs → Total: {stats.get("budget_lines_final",0)}')
    log(f'  Plan comptable:     {stats.get("sysco_inserted",0)} insérés, {stats.get("sysco_errors",0)} erreurs → Total: {stats.get("sysco_final",0)}')
    log(f'  Réaménagements:     {stats.get("ream_inserted",0)} insérés, {stats.get("ream_errors",0)} erreurs → Total: {stats.get("ream_final",0)}')
    log('')
    log(f'Fin: {datetime.now().isoformat()}')


if __name__ == '__main__':
    main()
