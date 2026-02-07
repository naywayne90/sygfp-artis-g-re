#!/usr/bin/env python3
"""
Migration des DemandeExpression (SQL Server) -> expressions_besoin (Supabase)
Sources: eARTI_DB2 (2024), eARTIDB_2025 (2025), eARTIDB_2026 (2026)
Total attendu: ~3,167 rows
"""

import pymssql
import requests
import json
import logging
import sys
from datetime import datetime, date

SQL_SERVER = '192.168.0.8'
SQL_PORT = 1433
SQL_USER = r'ARTI\admin'
SQL_PASSWORD = 'tranSPort2021!'

SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

DATABASES = [
    ('eARTI_DB2', 2024),
    ('eARTIDB_2025', 2025),
    ('eARTIDB_2026', 2026),
]

BATCH_SIZE = 50

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/home/angeyannick/sygfp-artis-g-re/scripts/migrate_expressions_besoin.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger(__name__)

DIRECTION_MAP = {
    'Service des Moyens G\u00e9n\u00e9raux': 'd325dbe2-6f4d-4eca-a4fa-391a1f209b8e',
    'Direction  des Affaires Administratives et financi\u00e8res': '160c017f-6fa4-4bc4-aca2-8ad14b8defe6',
    'Direction des Affaires Administratives et financi\u00e8res': '160c017f-6fa4-4bc4-aca2-8ad14b8defe6',
    "Direction de la Gestion Pr\u00e9visionnelle de l\u2019Emploi": '61e761d0-944e-4f97-a123-9c75ca3124ec',
    "Direction de la Gestion Pr\u00e9visionnelle de l'Emploi": '61e761d0-944e-4f97-a123-9c75ca3124ec',
    "Directeur des Syst\u00e8mes d\u2019Information par Int\u00e9rim": '972a439a-bee5-4d52-83c0-a930d4a66063',
    "Directeur des Syst\u00e8mes d'Information par Int\u00e9rim": '972a439a-bee5-4d52-83c0-a930d4a66063',
    'Direction de la Communication  et du Partenariat': 'f4a1bf7d-92cb-4a65-ab5b-e086bc4b9112',
    'Direction de la Communication et du Partenariat': 'f4a1bf7d-92cb-4a65-ab5b-e086bc4b9112',
    "Direction G\u00e9n\u00e9rale de l\u2019ARTI": '82ad9d62-6d77-49c8-ae40-42ecda883988',
    "Direction G\u00e9n\u00e9rale de l'ARTI": '82ad9d62-6d77-49c8-ae40-42ecda883988',
    'Direction des Recours, de la R\u00e9glementation et des Normes': 'd092f177-2417-42d1-8e5b-4d73af3186a9',
    "Direction de la Gestion de l\u2019Emploi et des Comp\u00e9tences": '61e761d0-944e-4f97-a123-9c75ca3124ec',
    "Direction de la Gestion de l'Emploi et des Comp\u00e9tences": '61e761d0-944e-4f97-a123-9c75ca3124ec',
    'Direction des Statistiques, des \u00c9tudes, de la Strat\u00e9gie et de la Prospective': '95707c43-9401-43e0-9c7b-82e4c109581b',
    'Direction du Patrimoine': '44b2c597-b830-4943-b339-99a5587bb035',
    'Directeur du Contr\u00f4le et de la Surveillance du Transport Int\u00e9rieur': '16f0f1ba-ebe7-403f-b1ca-83ef96f3ac21',
}


def map_status(etat, etape):
    if etat is False or etat == 0:
        if etape == 9:
            return 'rejete'
        return 'brouillon'
    # etat is True: use 'valide' (accepted by CHECK constraint, no trigger)
    return 'valide'


def map_validation_status(etat, etape):
    if etat is True or etat == 1:
        if etape >= 1:
            return 'approuve'
        return 'en_attente'
    else:
        if etape == 9:
            return 'rejete'
        return 'en_attente'


def resolve_direction(direction_name):
    if not direction_name:
        return None
    cleaned = direction_name.strip().replace('\r\n', '').replace('\r', '').replace('\n', '')
    if cleaned in DIRECTION_MAP:
        return DIRECTION_MAP[cleaned]
    if direction_name in DIRECTION_MAP:
        return DIRECTION_MAP[direction_name]
    cleaned2 = ' '.join(cleaned.split())
    if cleaned2 in DIRECTION_MAP:
        return DIRECTION_MAP[cleaned2]
    cleaned_lower = cleaned.lower()
    for key, val in DIRECTION_MAP.items():
        key_clean = key.strip().replace('\r\n', '').replace('\r', '').replace('\n', '').lower()
        if key_clean in cleaned_lower or cleaned_lower in key_clean:
            return val
    keywords = {
        'moyens': 'd325dbe2-6f4d-4eca-a4fa-391a1f209b8e',
        'administratives': '160c017f-6fa4-4bc4-aca2-8ad14b8defe6',
        'emploi': '61e761d0-944e-4f97-a123-9c75ca3124ec',
        'information': '972a439a-bee5-4d52-83c0-a930d4a66063',
        'communication': 'f4a1bf7d-92cb-4a65-ab5b-e086bc4b9112',
        'patrimoine': '44b2c597-b830-4943-b339-99a5587bb035',
        'recours': 'd092f177-2417-42d1-8e5b-4d73af3186a9',
        'statistiques': '95707c43-9401-43e0-9c7b-82e4c109581b',
        'transport': '16f0f1ba-ebe7-403f-b1ca-83ef96f3ac21',
    }
    for kw, uuid in keywords.items():
        if kw in cleaned_lower:
            return uuid
    log.warning(f"Direction non mappee: {repr(direction_name)}")
    return None


def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
}

HEADERS_COUNT = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'count=exact',
}


def supabase_count(table):
    resp = requests.get(
        f'{SUPABASE_URL}/rest/v1/{table}?select=id&limit=0',
        headers=HEADERS_COUNT
    )
    content_range = resp.headers.get('content-range', '*/0')
    total = content_range.split('/')[-1]
    return int(total)


def supabase_get_existing_numeros(table):
    existing = set()
    offset = 0
    page_size = 1000
    while True:
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/{table}?select=numero&offset={offset}&limit={page_size}',
            headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}
        )
        rows = resp.json()
        if not isinstance(rows, list) or not rows:
            break
        for row in rows:
            if row.get('numero'):
                existing.add(row['numero'])
        offset += page_size
    return existing


def supabase_insert_batch(table, records):
    if not records:
        return 0, []
    resp = requests.post(
        f'{SUPABASE_URL}/rest/v1/{table}',
        headers=HEADERS,
        data=json.dumps(records, default=json_serial)
    )
    if resp.status_code in (200, 201):
        return len(records), []
    else:
        inserted = 0
        errors = []
        for rec in records:
            resp2 = requests.post(
                f'{SUPABASE_URL}/rest/v1/{table}',
                headers=HEADERS,
                data=json.dumps(rec, default=json_serial)
            )
            if resp2.status_code in (200, 201):
                inserted += 1
            else:
                errors.append({
                    'numero': rec.get('numero', 'N/A'),
                    'error': resp2.text[:300]
                })
        return inserted, errors


def fetch_from_sqlserver(database):
    conn = pymssql.connect(server=SQL_SERVER, port=SQL_PORT, user=SQL_USER, password=SQL_PASSWORD, database=database)
    cursor = conn.cursor(as_dict=True)
    cursor.execute("""
        SELECT DemandeExpressionID, FournisseurID, UtilisateurID, Imputation, CodeActivite,
               MontantMarche, Dotationbudgetaire, EngagementsAnterieur, EngagementsActuel,
               TypeDepense, NumDepense, Exercice, Date, Direction, Objet1, ModePaiement,
               RaisonSociale, Etat, Etape, NumMarche, SourceFinancement, SourceDecaissement,
               MotifRejet, NumOS, NatureDepense, CumulEgagement, DisponibleBudgetaire,
               ReferenceNoteDG, Devis_Proforma, FicheContrat, BonCommande
        FROM DemandeExpression ORDER BY DemandeExpressionID
    """)
    rows = cursor.fetchall()
    conn.close()
    return rows


def transform_row(row, db_name):
    exercice = int(row['Exercice']) if row['Exercice'] else 2024
    num_depense = (row['NumDepense'] or '').strip()
    numero = num_depense if num_depense else None

    objet = (row['Objet1'] or '').strip()
    if not objet:
        objet = f"Expression de besoin migree {num_depense}"

    montant = float(row['MontantMarche']) if row['MontantMarche'] else 0
    direction_id = resolve_direction(row['Direction'])
    etat = row['Etat']
    etape = row['Etape'] if row['Etape'] is not None else 0
    statut = map_status(etat, etape)
    validation_status = map_validation_status(etat, etape)

    created_at = None
    if row['Date']:
        if isinstance(row['Date'], (datetime, date)):
            created_at = row['Date'].isoformat()
        else:
            created_at = str(row['Date'])

    desc_parts = []
    for field, label in [
        ('RaisonSociale', 'Fournisseur'),
        ('Imputation', 'Imputation'),
        ('ModePaiement', 'Mode paiement'),
        ('SourceFinancement', 'Source financement'),
        ('NatureDepense', 'Nature depense'),
        ('NumMarche', 'Num marche'),
        ('ReferenceNoteDG', 'Ref Note DG'),
    ]:
        val = row.get(field)
        if val and str(val).strip():
            desc_parts.append(f"{label}: {str(val).strip()}")
    for field, label in [
        ('Dotationbudgetaire', 'Dotation budgetaire'),
        ('EngagementsAnterieur', 'Engagements anterieurs'),
        ('EngagementsActuel', 'Engagements actuels'),
    ]:
        val = row.get(field)
        if val:
            desc_parts.append(f"{label}: {val}")
    desc_parts.append(f"[Migration: {db_name}, ID={row['DemandeExpressionID']}, Etat={etat}, Etape={etape}]")
    description = '\n'.join(desc_parts)

    rejection_reason = None
    if row.get('MotifRejet') and str(row['MotifRejet']).strip():
        rejection_reason = str(row['MotifRejet']).strip()

    record = {
        'objet': objet[:500],
        'exercice': exercice,
        'numero': numero,
        'montant_estime': montant,
        'quantite': 1,
        'unite': 'unite',
        'urgence': 'normale',
        'statut': statut,
        'direction_id': direction_id,
        'description': description[:2000] if description else None,
        'validation_status': validation_status,
        'rejection_reason': rejection_reason,
        'code_locked': False,
    }

    if created_at:
        record['created_at'] = created_at
        record['updated_at'] = created_at

    return record


def migrate_expressions_besoin():
    log.info("=" * 70)
    log.info("MIGRATION DemandeExpression -> expressions_besoin")
    log.info("=" * 70)

    current_count = supabase_count('expressions_besoin')
    log.info(f"Supabase expressions_besoin count before: {current_count}")

    if current_count > 0:
        log.warning(f"Table already has {current_count} rows. Will skip duplicates by numero.")

    existing_numeros = supabase_get_existing_numeros('expressions_besoin')
    log.info(f"Existing numeros in Supabase: {len(existing_numeros)}")

    total_source = 0
    total_inserted = 0
    total_skipped = 0
    total_errors = 0
    all_errors = []
    seen_keys = set()

    for db_name, default_year in DATABASES:
        log.info(f"\n--- Processing {db_name} ---")
        rows = fetch_from_sqlserver(db_name)
        log.info(f"Fetched {len(rows)} rows from {db_name}")
        total_source += len(rows)

        batch = []
        db_inserted = 0
        db_skipped = 0
        db_errors = 0

        for row in rows:
            num = (row['NumDepense'] or '').strip()
            de_id = row['DemandeExpressionID']

            if num and num in existing_numeros:
                db_skipped += 1
                continue

            dedup_key = f"{num}_{de_id}"
            if dedup_key in seen_keys:
                db_skipped += 1
                continue
            seen_keys.add(dedup_key)

            record = transform_row(row, db_name)
            batch.append(record)

            if len(batch) >= BATCH_SIZE:
                inserted, errors = supabase_insert_batch('expressions_besoin', batch)
                db_inserted += inserted
                if errors:
                    db_errors += len(errors)
                    all_errors.extend(errors)
                    for e in errors[:3]:
                        log.error(f"  Error: {e}")
                batch = []
                if (db_inserted + db_skipped + db_errors) % 500 == 0:
                    log.info(f"  Progress {db_name}: ins={db_inserted} skip={db_skipped} err={db_errors}")

        if batch:
            inserted, errors = supabase_insert_batch('expressions_besoin', batch)
            db_inserted += inserted
            if errors:
                db_errors += len(errors)
                all_errors.extend(errors)

        log.info(f"{db_name}: inserted={db_inserted}, skipped={db_skipped}, errors={db_errors}")
        total_inserted += db_inserted
        total_skipped += db_skipped
        total_errors += db_errors

    final_count = supabase_count('expressions_besoin')

    log.info("\n" + "=" * 70)
    log.info("RESULTAT MIGRATION expressions_besoin")
    log.info("=" * 70)
    log.info(f"Source SQL Server total:     {total_source}")
    log.info(f"Inserees dans Supabase:      {total_inserted}")
    log.info(f"Ignorees (doublons):         {total_skipped}")
    log.info(f"Erreurs:                     {total_errors}")
    log.info(f"Count avant migration:       {current_count}")
    log.info(f"Count apres migration:       {final_count}")
    log.info(f"Nouvelles lignes effectives: {final_count - current_count}")

    if all_errors:
        log.info(f"\nDetail des erreurs ({len(all_errors)}):")
        for e in all_errors[:20]:
            log.info(f"  {e}")

    return final_count


if __name__ == '__main__':
    migrate_expressions_besoin()
