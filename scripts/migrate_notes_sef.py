#!/usr/bin/env python3
"""
Migration Notes SEF: Cleanup duplicates and ensure completeness.

Current state in Supabase:
- MIG-{year}-{ID}: Good migration with real data from NoteDG
- MIG-NOTE-{year}-{ID}: Bad migration with placeholder objet ("non renseigne")

Strategy:
1. Delete all MIG-NOTE-* records that overlap with MIG-* records (duplicates)
2. For MIG-NOTE-* records with unique IDs, update them with real data from SQL Server
3. Migrate the 4 truly missing records (2 for 2025, 2 for 2026)
4. Verify final counts match SQL Server totals
"""

import pymssql
import requests
import urllib.parse
import json
import sys
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/home/angeyannick/sygfp-artis-g-re/scripts/migrate_notes_sef.log')
    ]
)
logger = logging.getLogger(__name__)

SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co/rest/v1'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
}

SQL_SERVER = '192.168.0.8'
SQL_PORT = 1433
SQL_USER = r'ARTI\admin'
SQL_PASS = 'tranSPort2021!'

DATABASES = [
    ('eARTI_DB2', 2024),
    ('eARTIDB_2025', 2025),
    ('eARTIDB_2026', 2026),
]


def fetch_supabase_numeros(pattern):
    """Fetch all numeros matching a LIKE pattern from Supabase."""
    ids = set()
    offset = 0
    while True:
        url = f'{SUPABASE_URL}/notes_sef?select=numero&numero=like.{urllib.parse.quote(pattern)}&limit=1000&offset={offset}'
        resp = requests.get(url, headers=HEADERS)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            break
        for row in data:
            parts = row['numero'].rsplit('-', 1)
            if len(parts) == 2 and parts[1].isdigit():
                ids.add(int(parts[1]))
        offset += 1000
        if len(data) < 1000:
            break
    return ids


def fetch_sql_server_data(db_name, ids=None):
    """Fetch NoteDG records from SQL Server. If ids provided, only fetch those."""
    conn = pymssql.connect(server=SQL_SERVER, port=SQL_PORT, user=SQL_USER, password=SQL_PASS, database=db_name)
    cursor = conn.cursor(as_dict=True)

    if ids:
        placeholders = ','.join(str(i) for i in ids)
        query = f'SELECT NoteDgID, Reference, Objet, Expose, Avis, Recommandation, DateCreation, EstActif FROM NoteDG WHERE NoteDgID IN ({placeholders})'
    else:
        query = 'SELECT NoteDgID, Reference, Objet, Expose, Avis, Recommandation, DateCreation, EstActif FROM NoteDG'

    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return rows


def delete_supabase_records(numeros):
    """Delete records from Supabase by numero. Process in batches."""
    deleted = 0
    batch_size = 50
    numeros_list = list(numeros)

    for i in range(0, len(numeros_list), batch_size):
        batch = numeros_list[i:i + batch_size]
        # Use OR filter for batch delete
        for numero in batch:
            url = f'{SUPABASE_URL}/notes_sef?numero=eq.{urllib.parse.quote(numero)}'
            resp = requests.delete(url, headers=HEADERS)
            if resp.status_code in (200, 204):
                deleted += 1
            else:
                logger.warning(f'Failed to delete {numero}: {resp.status_code} {resp.text[:200]}')

        if (i + batch_size) % 500 == 0 or i + batch_size >= len(numeros_list):
            logger.info(f'  Deleted {deleted}/{len(numeros_list)} records...')

    return deleted


def update_supabase_record(numero, data):
    """Update a Supabase record by numero."""
    url = f'{SUPABASE_URL}/notes_sef?numero=eq.{urllib.parse.quote(numero)}'
    resp = requests.patch(url, headers=HEADERS, json=data)
    return resp.status_code in (200, 204)


def insert_supabase_records(records):
    """Insert records into Supabase. Use upsert with ON CONFLICT."""
    headers = {**HEADERS, 'Prefer': 'resolution=ignore-duplicates'}
    inserted = 0
    batch_size = 100

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        url = f'{SUPABASE_URL}/notes_sef'
        resp = requests.post(url, headers=headers, json=batch)
        if resp.status_code in (200, 201):
            inserted += len(batch)
        else:
            logger.error(f'Failed to insert batch {i}: {resp.status_code} {resp.text[:500]}')
            # Try one by one
            for record in batch:
                resp2 = requests.post(url, headers=headers, json=[record])
                if resp2.status_code in (200, 201):
                    inserted += 1
                else:
                    logger.error(f'  Failed single insert {record["numero"]}: {resp2.status_code} {resp2.text[:200]}')

        logger.info(f'  Inserted {inserted}/{len(records)} records...')

    return inserted


def transform_notedg_to_notes_sef(row, exercice):
    """Transform a SQL Server NoteDG row to a Supabase notes_sef record."""
    objet = row.get('Objet') or ''
    objet = objet.strip() if objet else 'Note SEF migree'
    if not objet:
        objet = 'Note SEF migree'

    created_at = row.get('DateCreation')
    if created_at:
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
    else:
        created_at = f'{exercice}-01-01T00:00:00'

    return {
        'numero': f'MIG-{exercice}-{row["NoteDgID"]}',
        'exercice': exercice,
        'objet': objet,
        'description': (row.get('Expose') or '').strip() or None,
        'commentaire': (row.get('Avis') or '').strip() or None,
        'statut': 'valide',
        'created_at': created_at,
    }


def main():
    logger.info('=' * 60)
    logger.info('MIGRATION NOTES SEF - Cleanup & Completion')
    logger.info('=' * 60)

    # =========================================================================
    # STEP 1: Identify overlapping and unique MIG-NOTE records
    # =========================================================================
    logger.info('\n--- STEP 1: Analyzing existing data ---')

    total_deleted = 0
    total_updated = 0
    total_inserted = 0

    for db_name, year in DATABASES:
        logger.info(f'\n=== Processing exercice {year} ({db_name}) ===')

        mig_ids = fetch_supabase_numeros(f'MIG-{year}-%')
        note_ids = fetch_supabase_numeros(f'MIG-NOTE-{year}-%')

        overlap = mig_ids & note_ids
        only_note = note_ids - mig_ids

        logger.info(f'  MIG-{year}-*: {len(mig_ids)} records')
        logger.info(f'  MIG-NOTE-{year}-*: {len(note_ids)} records')
        logger.info(f'  Overlap (to delete): {len(overlap)}')
        logger.info(f'  Unique in MIG-NOTE (to update/keep): {len(only_note)}')

        # Delete overlapping MIG-NOTE records
        if overlap:
            logger.info(f'  Deleting {len(overlap)} duplicate MIG-NOTE-{year} records...')
            numeros_to_delete = [f'MIG-NOTE-{year}-{id_}' for id_ in overlap]
            deleted = delete_supabase_records(numeros_to_delete)
            total_deleted += deleted
            logger.info(f'  Deleted {deleted} duplicate records')

        # For unique MIG-NOTE records, fetch real data from SQL Server and update
        if only_note:
            logger.info(f'  Updating {len(only_note)} unique MIG-NOTE-{year} records with real data...')

            # First check which of these IDs exist in THIS database
            sql_data = fetch_sql_server_data(db_name, only_note)
            sql_ids_found = {row['NoteDgID'] for row in sql_data}

            logger.info(f'  Found {len(sql_ids_found)} of {len(only_note)} IDs in {db_name}')

            # Also check other databases for IDs not found
            not_found = only_note - sql_ids_found
            if not_found:
                logger.info(f'  Checking other databases for {len(not_found)} unfound IDs...')
                for other_db, other_year in DATABASES:
                    if other_db == db_name:
                        continue
                    other_data = fetch_sql_server_data(other_db, not_found)
                    if other_data:
                        sql_data.extend(other_data)
                        found_in_other = {row['NoteDgID'] for row in other_data}
                        not_found -= found_in_other
                        logger.info(f'    Found {len(found_in_other)} IDs in {other_db}')

            if not_found:
                logger.warning(f'  {len(not_found)} IDs not found in any SQL Server DB: {sorted(not_found)[:10]}')

            # Now update MIG-NOTE records OR delete and re-insert as MIG records
            for row in sql_data:
                id_ = row['NoteDgID']
                old_numero = f'MIG-NOTE-{year}-{id_}'
                new_data = transform_notedg_to_notes_sef(row, year)
                new_numero = new_data['numero']  # MIG-{year}-{id}

                # Check if MIG-{year}-{id} already exists (shouldn't, since only_note)
                # Delete the MIG-NOTE record and insert a proper MIG record
                delete_supabase_records([old_numero])

                # Insert new proper record
                headers_upsert = {**HEADERS, 'Prefer': 'resolution=ignore-duplicates'}
                resp = requests.post(f'{SUPABASE_URL}/notes_sef', headers=headers_upsert, json=[new_data])
                if resp.status_code in (200, 201):
                    total_updated += 1
                else:
                    logger.error(f'  Failed to re-insert {new_numero}: {resp.status_code} {resp.text[:200]}')

            # For IDs not found in SQL Server, just delete the bad records
            if not_found:
                logger.info(f'  Deleting {len(not_found)} orphan MIG-NOTE records (not in SQL Server)...')
                orphan_numeros = [f'MIG-NOTE-{year}-{id_}' for id_ in not_found]
                del_count = delete_supabase_records(orphan_numeros)
                total_deleted += del_count

        # =====================================================================
        # STEP 2: Check for missing records from SQL Server
        # =====================================================================
        logger.info(f'  Checking for missing records from {db_name}...')

        # Refresh the MIG IDs after cleanup
        current_mig_ids = fetch_supabase_numeros(f'MIG-{year}-%')

        # Get all SQL Server IDs
        all_sql_rows = fetch_sql_server_data(db_name)
        all_sql_ids = {row['NoteDgID'] for row in all_sql_rows}

        missing_ids = all_sql_ids - current_mig_ids

        if missing_ids:
            logger.info(f'  Found {len(missing_ids)} missing records. Migrating...')
            missing_rows = [r for r in all_sql_rows if r['NoteDgID'] in missing_ids]
            records_to_insert = [transform_notedg_to_notes_sef(r, year) for r in missing_rows]
            inserted = insert_supabase_records(records_to_insert)
            total_inserted += inserted
            logger.info(f'  Inserted {inserted} missing records')
        else:
            logger.info(f'  No missing records for {year}!')

    # =========================================================================
    # STEP 3: Final verification
    # =========================================================================
    logger.info('\n--- STEP 3: Final Verification ---')
    logger.info(f'Total deleted (duplicates): {total_deleted}')
    logger.info(f'Total updated (fixed data): {total_updated}')
    logger.info(f'Total inserted (missing): {total_inserted}')

    for db_name, year in DATABASES:
        # Count SQL Server
        conn = pymssql.connect(server=SQL_SERVER, port=SQL_PORT, user=SQL_USER, password=SQL_PASS, database=db_name)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM NoteDG')
        sql_count = cursor.fetchone()[0]
        conn.close()

        # Count Supabase
        mig_count = len(fetch_supabase_numeros(f'MIG-{year}-%'))
        note_count = len(fetch_supabase_numeros(f'MIG-NOTE-{year}-%'))

        status = 'OK' if mig_count == sql_count and note_count == 0 else 'MISMATCH'
        logger.info(f'  {year}: SQL={sql_count}, Supabase MIG={mig_count}, MIG-NOTE={note_count} [{status}]')

    # Total count in Supabase
    url = f'{SUPABASE_URL}/notes_sef?select=numero&numero=like.{urllib.parse.quote("MIG-%")}&limit=1'
    resp = requests.get(url, headers={**HEADERS, 'Prefer': 'count=exact'})
    total_header = resp.headers.get('content-range', '')
    logger.info(f'  Total MIG-* in Supabase (from header): {total_header}')

    # Also get total from non-migrated records
    url2 = f'{SUPABASE_URL}/notes_sef?select=numero&numero=not.like.{urllib.parse.quote("MIG-%")}&limit=1'
    resp2 = requests.get(url2, headers={**HEADERS, 'Prefer': 'count=exact'})
    total_header2 = resp2.headers.get('content-range', '')
    logger.info(f'  Non-migrated (app) records: {total_header2}')

    logger.info('\n=== MIGRATION COMPLETE ===')


if __name__ == '__main__':
    main()
