#!/usr/bin/env python3
"""
Fix financial amounts in Supabase migrated data.

Issues fixed:
1. ordonnancements.montant = 0 -> read correct amount from SQL Server (MontantMarche)
2. budget_liquidations.net_a_payer = 0 -> set to montant (no deductions in legacy)
3. ordonnancements.montant_paye = 0 -> set to montant for completed ordonnancements
4. ordonnancements.beneficiaire = "(non renseigné)" -> read from SQL Server (RaisonSociale)

Uses .update().eq('id', ...) instead of upsert to avoid NOT NULL constraint errors
on required FK columns like liquidation_id and engagement_id.
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import hashlib
import pymssql
from supabase import create_client
import time

# Configuration
SQL_SERVER = '192.168.0.8'
SQL_USER = 'ARTI\\admin'
SQL_PASSWORD = 'tranSPort2021!'

SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

DATABASES = {
    2024: 'eARTI_DB2',
    2025: 'eARTIDB_2025',
    2026: 'eARTIDB_2026'
}


def generate_uuid(table: str, old_id: int, year: int) -> str:
    """Generate deterministic UUID (must match migration script)"""
    unique_string = f"{table}_{year}_{old_id}"
    hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
    return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"


def batch_update_by_id(supabase, table_name, updates, label=""):
    """
    Update records one by one using .update().eq('id', ...).
    `updates` is a list of dicts with 'id' key plus fields to update.
    Returns (success_count, error_count).
    """
    success = 0
    errors = 0
    for i, item in enumerate(updates):
        record_id = item.pop('id')
        try:
            supabase.table(table_name).update(item).eq('id', record_id).execute()
            success += 1
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"    Error updating {record_id}: {str(e)[:100]}")
        # Print progress every 200 records
        if (i + 1) % 200 == 0:
            print(f"    {label} Progress: {i + 1}/{len(updates)} (ok: {success}, err: {errors})")
    return success, errors


def fix_issue1_ordonnancement_montants(supabase):
    """
    Issue 1: Fix montant = 0 in ordonnancements by reading MontantMarche from SQL Server.
    """
    print("\n" + "=" * 70)
    print("ISSUE 1: Fixing ordonnancements.montant = 0")
    print("=" * 70)

    total_updated = 0
    total_not_found = 0
    total_still_zero = 0
    total_errors = 0

    for year, db in DATABASES.items():
        print(f"\n--- Year {year} ({db}) ---")

        try:
            conn = pymssql.connect(
                server=SQL_SERVER,
                user=SQL_USER,
                password=SQL_PASSWORD,
                database=db
            )
            cursor = conn.cursor(as_dict=True)

            cursor.execute("""
                SELECT OrdonnancementID, MontantMarche, MontantMandate
                FROM Ordonnancement
            """)
            rows = cursor.fetchall()
            print(f"  SQL Server records: {len(rows)}")

            # Build map: deterministic UUID -> best montant
            sql_montants = {}
            for row in rows:
                uid = generate_uuid('ordonnancement', row['OrdonnancementID'], year)
                montant_marche = float(row.get('MontantMarche') or 0)
                montant_mandate = float(row.get('MontantMandate') or 0)
                best = montant_marche if montant_marche > 0 else montant_mandate
                if best > 0:
                    sql_montants[uid] = best

            conn.close()
            print(f"  SQL Server records with amount > 0: {len(sql_montants)}")

            # Fetch Supabase ordonnancements with montant = 0 for this year
            offset = 0
            updates = []
            while True:
                result = supabase.table('ordonnancements') \
                    .select('id') \
                    .eq('montant', 0) \
                    .eq('exercice', year) \
                    .range(offset, offset + 999) \
                    .execute()

                if not result.data:
                    break

                for rec in result.data:
                    rid = rec['id']
                    if rid in sql_montants:
                        updates.append({'id': rid, 'montant': sql_montants[rid]})
                    elif rid not in sql_montants:
                        # Check if it's not found at all vs found but zero
                        total_not_found += 1

                if len(result.data) < 1000:
                    break
                offset += 1000

            print(f"  Records to update: {len(updates)}")

            if updates:
                ok, err = batch_update_by_id(supabase, 'ordonnancements', updates, f"Year {year}")
                total_updated += ok
                total_errors += err
                print(f"  Updated: {ok}, Errors: {err}")

        except Exception as e:
            print(f"  Connection error: {str(e)[:100]}")

    print(f"\n  TOTAL montant updated: {total_updated}")
    print(f"  Not matched to SQL Server: {total_not_found}")
    print(f"  Errors: {total_errors}")
    return total_updated


def fix_issue2_liquidation_net_a_payer(supabase):
    """
    Issue 2: Fix net_a_payer = 0 in budget_liquidations.
    Set net_a_payer = montant for records where montant > 0.
    """
    print("\n" + "=" * 70)
    print("ISSUE 2: Fixing budget_liquidations.net_a_payer = 0")
    print("=" * 70)

    total_updated = 0
    total_errors = 0

    # Collect all records to update
    offset = 0
    updates = []
    while True:
        result = supabase.table('budget_liquidations') \
            .select('id,montant') \
            .eq('net_a_payer', 0) \
            .gt('montant', 0) \
            .range(offset, offset + 999) \
            .execute()

        if not result.data:
            break

        for rec in result.data:
            updates.append({'id': rec['id'], 'net_a_payer': rec['montant']})

        if len(result.data) < 1000:
            break
        offset += 1000

    print(f"  Records to update: {len(updates)}")

    if updates:
        ok, err = batch_update_by_id(supabase, 'budget_liquidations', updates, "Liquidations")
        total_updated = ok
        total_errors = err

    print(f"\n  TOTAL net_a_payer updated: {total_updated}")
    print(f"  Errors: {total_errors}")
    return total_updated


def fix_issue3_ordonnancement_montant_paye(supabase):
    """
    Issue 3: Fix montant_paye = 0 in ordonnancements.
    Set montant_paye = montant for records with montant > 0.
    """
    print("\n" + "=" * 70)
    print("ISSUE 3: Fixing ordonnancements.montant_paye = 0")
    print("=" * 70)

    total_updated = 0
    total_errors = 0

    offset = 0
    updates = []
    while True:
        result = supabase.table('ordonnancements') \
            .select('id,montant') \
            .eq('montant_paye', 0) \
            .gt('montant', 0) \
            .range(offset, offset + 999) \
            .execute()

        if not result.data:
            break

        for rec in result.data:
            updates.append({'id': rec['id'], 'montant_paye': rec['montant']})

        if len(result.data) < 1000:
            break
        offset += 1000

    print(f"  Records to update: {len(updates)}")

    if updates:
        ok, err = batch_update_by_id(supabase, 'ordonnancements', updates, "MontantPaye")
        total_updated = ok
        total_errors = err

    print(f"\n  TOTAL montant_paye updated: {total_updated}")
    print(f"  Errors: {total_errors}")
    return total_updated


def fix_issue4_ordonnancement_beneficiaire(supabase):
    """
    Issue 4: Fix beneficiaire = "(non renseigné)" in ordonnancements.
    Read correct RaisonSociale from SQL Server.
    """
    print("\n" + "=" * 70)
    print("ISSUE 4: Fixing ordonnancements.beneficiaire = '(non rensigne)'")
    print("=" * 70)

    # Build SQL Server mapping: UUID -> RaisonSociale
    sql_beneficiaires = {}

    for year, db in DATABASES.items():
        try:
            conn = pymssql.connect(
                server=SQL_SERVER,
                user=SQL_USER,
                password=SQL_PASSWORD,
                database=db
            )
            cursor = conn.cursor(as_dict=True)
            cursor.execute("""
                SELECT OrdonnancementID, RaisonSociale
                FROM Ordonnancement
                WHERE RaisonSociale IS NOT NULL AND LTRIM(RTRIM(RaisonSociale)) != ''
            """)
            rows = cursor.fetchall()
            for row in rows:
                uid = generate_uuid('ordonnancement', row['OrdonnancementID'], year)
                rs = (row.get('RaisonSociale') or '').strip()
                if rs:
                    sql_beneficiaires[uid] = rs
            conn.close()
            print(f"  Year {year}: {len(rows)} records with RaisonSociale")
        except Exception as e:
            print(f"  Error year {year}: {str(e)[:80]}")

    print(f"  Total beneficiaires loaded from SQL Server: {len(sql_beneficiaires)}")

    # Fetch Supabase records with "(non renseigné)"
    offset = 0
    updates = []
    not_found = 0

    while True:
        result = supabase.table('ordonnancements') \
            .select('id') \
            .eq('beneficiaire', '(non renseigné)') \
            .range(offset, offset + 999) \
            .execute()

        if not result.data:
            break

        for rec in result.data:
            rid = rec['id']
            if rid in sql_beneficiaires:
                updates.append({'id': rid, 'beneficiaire': sql_beneficiaires[rid]})
            else:
                not_found += 1

        if len(result.data) < 1000:
            break
        offset += 1000

    print(f"  Records to update: {len(updates)}")
    print(f"  Not found in SQL Server: {not_found}")

    total_updated = 0
    total_errors = 0

    if updates:
        ok, err = batch_update_by_id(supabase, 'ordonnancements', updates, "Beneficiaire")
        total_updated = ok
        total_errors = err

    print(f"\n  TOTAL beneficiaire updated: {total_updated}")
    print(f"  Errors: {total_errors}")
    return total_updated


def main():
    start = time.time()
    print("=" * 70)
    print("SYGFP Financial Amounts Fix Script")
    print("=" * 70)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    results = {}

    results['issue1_montant'] = fix_issue1_ordonnancement_montants(supabase)
    results['issue2_net_a_payer'] = fix_issue2_liquidation_net_a_payer(supabase)

    # Issue 3 depends on Issue 1 (needs montant > 0 from Issue 1 fix)
    results['issue3_montant_paye'] = fix_issue3_ordonnancement_montant_paye(supabase)
    results['issue4_beneficiaire'] = fix_issue4_ordonnancement_beneficiaire(supabase)

    elapsed = time.time() - start
    print("\n" + "=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)
    for key, count in results.items():
        print(f"  {key}: {count} records updated")
    print(f"  Time elapsed: {elapsed:.1f}s")
    print("=" * 70)


if __name__ == '__main__':
    main()
