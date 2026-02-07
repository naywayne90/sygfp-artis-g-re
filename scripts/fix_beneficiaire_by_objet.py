#!/usr/bin/env python3
"""
Fix beneficiaire = "(non renseigné)" in ordonnancements by matching via objet (description).
Uses fuzzy matching (normalize whitespace, case, accents) and prefix matching.
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import re
import unicodedata
import pymssql
from supabase import create_client

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


def normalize(text):
    """Normalize text for fuzzy comparison: lowercase, strip accents, collapse whitespace."""
    if not text:
        return ''
    # Remove accents
    text = unicodedata.normalize('NFKD', text)
    text = ''.join(c for c in text if not unicodedata.combining(c))
    # Lowercase
    text = text.lower()
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get all Supabase records with "(non renseigné)"
    result = supabase.table('ordonnancements') \
        .select('id,numero,objet,exercice') \
        .eq('beneficiaire', '(non renseigné)') \
        .execute()

    records = result.data
    print(f"Records with '(non renseigné)': {len(records)}")

    if not records:
        print("Nothing to fix!")
        return

    # Build SQL Server lookups:
    # 1. Exact objet -> RaisonSociale
    # 2. Normalized objet -> RaisonSociale
    # 3. First 50 chars of normalized objet -> RaisonSociale
    exact_map = {}
    normalized_map = {}
    prefix_map = {}  # first 50 normalized chars

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
                SELECT CAST(Objet1 AS NVARCHAR(MAX)) AS Objet1, RaisonSociale
                FROM Ordonnancement
                WHERE RaisonSociale IS NOT NULL AND RaisonSociale != ''
            """)
            rows = cursor.fetchall()
            for row in rows:
                objet = (row.get('Objet1') or '').strip()
                rs = (row.get('RaisonSociale') or '').strip()
                if objet and rs:
                    exact_map[objet] = rs
                    norm = normalize(objet)
                    normalized_map[norm] = rs
                    if len(norm) >= 40:
                        prefix_map[norm[:50]] = rs
            conn.close()
            print(f"  Year {year}: loaded {len(rows)} mappings")
        except Exception as e:
            print(f"  Error year {year}: {str(e)[:100]}")

    print(f"  Exact: {len(exact_map)}, Normalized: {len(normalized_map)}, Prefix: {len(prefix_map)}")

    # Match Supabase records
    total_updated = 0
    total_not_found = 0
    total_errors = 0

    for rec in records:
        objet = (rec.get('objet') or '').strip()
        rid = rec['id']
        beneficiaire = None

        # Try exact match
        if objet in exact_map:
            beneficiaire = exact_map[objet]
        else:
            # Try normalized match
            norm = normalize(objet)
            if norm in normalized_map:
                beneficiaire = normalized_map[norm]
            else:
                # Try prefix match (first 50 normalized chars)
                if len(norm) >= 40:
                    prefix = norm[:50]
                    if prefix in prefix_map:
                        beneficiaire = prefix_map[prefix]

        if beneficiaire:
            try:
                supabase.table('ordonnancements') \
                    .update({'beneficiaire': beneficiaire}) \
                    .eq('id', rid) \
                    .execute()
                total_updated += 1
                if total_updated <= 15:
                    print(f"  Updated {rec['numero']}: '{beneficiaire}'")
            except Exception as e:
                total_errors += 1
                print(f"  Error {rec['numero']}: {str(e)[:80]}")
        else:
            total_not_found += 1
            if total_not_found <= 10:
                print(f"  Not found: {rec['numero']} objet='{objet[:70]}...'")

    print(f"\nSUMMARY:")
    print(f"  Updated: {total_updated}")
    print(f"  Not found: {total_not_found}")
    print(f"  Errors: {total_errors}")

    # Remaining count
    remaining = supabase.table('ordonnancements') \
        .select('count') \
        .eq('beneficiaire', '(non renseigné)') \
        .execute()
    print(f"  Remaining '(non renseigné)': {remaining.data[0]['count']}")


if __name__ == '__main__':
    main()
