#!/usr/bin/env python3
"""
Migration des engagements 2024 SYGFP vers Supabase
Les engagements sont extraits à partir des liquidations (conversion ARTI20 -> ARTI10)
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import hashlib
import pymssql
from supabase import create_client

# Configuration
SQL_SERVER = '192.168.0.8'
SQL_USER = 'ARTI\\admin'
SQL_PASSWORD = 'tranSPort2021!'

SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

def generate_uuid(table: str, old_id: int, year: int) -> str:
    """Génère un UUID déterministe"""
    unique_string = f"{table}_{year}_{old_id}"
    hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
    return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"

def convert_liquidation_to_engagement_num(liq_num):
    """Convert liquidation number to engagement number
    ARTI202240001 -> ARTI102240001
    """
    if not liq_num:
        return None
    if liq_num.startswith('ARTI20'):
        return 'ARTI10' + liq_num[6:]
    elif liq_num.startswith('ARTI21'):
        return 'ARTI11' + liq_num[6:]
    elif liq_num.startswith('ARTI30'):
        return 'ARTI10' + liq_num[6:]
    return liq_num

def get_existing_engagements(supabase):
    """Récupère les numéros des engagements existants"""
    existing = set()
    offset = 0
    while True:
        result = supabase.table('budget_engagements').select('numero').range(offset, offset + 999).execute()
        if not result.data:
            break
        for row in result.data:
            if row['numero']:
                # Clean numero for comparison
                clean = row['numero'][4:] if row['numero'].startswith('MIG-') else row['numero']
                existing.add(clean)
        offset += 1000
        if len(result.data) < 1000:
            break
    return existing

def migrate_engagements_2024():
    """Migration des engagements 2024 extraits des liquidations"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get existing engagements
    existing_nums = get_existing_engagements(supabase)
    print(f"Engagements existants dans Supabase: {len(existing_nums)}")

    # Connect to SQL Server
    conn = pymssql.connect(
        server=SQL_SERVER,
        user=SQL_USER,
        password=SQL_PASSWORD,
        database='eARTI_DB2'
    )
    cursor = conn.cursor(as_dict=True)

    # Get unique liquidation numbers to derive engagements
    cursor.execute("""
        SELECT DISTINCT NumLiquidation, MIN(LiquidationID) as FirstLiqID,
               MIN(MontantLiquide) as Montant, MIN(Date) as FirstDate
        FROM Liquidation
        WHERE NumLiquidation IS NOT NULL
        GROUP BY NumLiquidation
    """)

    liquidations = cursor.fetchall()
    print(f"Liquidations uniques trouvées: {len(liquidations)}")

    # Extract unique engagement numbers
    engagements_to_create = {}
    for liq in liquidations:
        liq_num = liq['NumLiquidation']
        eng_num = convert_liquidation_to_engagement_num(liq_num)

        if eng_num and eng_num not in existing_nums and eng_num not in engagements_to_create:
            engagements_to_create[eng_num] = {
                'liq_id': liq['FirstLiqID'],
                'montant': float(liq['Montant'] or 0),
                'date': liq['FirstDate']
            }

    print(f"Engagements à créer: {len(engagements_to_create)}")

    # Get liquidation details (RaisonSociale is directly in Liquidation table for 2024)
    cursor.execute("""
        SELECT NumLiquidation, RaisonSociale, Objet1, MontantLiquide
        FROM Liquidation
        WHERE NumLiquidation IS NOT NULL
    """)

    liq_details = {}
    for row in cursor.fetchall():
        liq_num = row['NumLiquidation']
        if liq_num not in liq_details:
            liq_details[liq_num] = row

    total_inserted = 0
    total_errors = 0
    batch = []

    for eng_num, info in engagements_to_create.items():
        try:
            # Find corresponding liquidation number
            liq_num = 'ARTI20' + eng_num[6:] if eng_num.startswith('ARTI10') else None
            if not liq_num:
                liq_num = 'ARTI21' + eng_num[6:] if eng_num.startswith('ARTI11') else None

            details = liq_details.get(liq_num, {})

            # Generate deterministic ID
            new_id = generate_uuid('engagement', info['liq_id'], 2024)

            data = {
                'id': new_id,
                'numero': f"MIG-{eng_num}",
                'montant': info['montant'],
                'fournisseur': details.get('RaisonSociale') or 'Fournisseur 2024',
                'objet': details.get('Objet1') or f"Engagement migré 2024 - {eng_num}",
                'statut': 'valide',
                'exercice': 2024,
                'legacy_import': True,
                'budget_line_id': '8b0d9cef-c790-468b-8e02-0773241c9cb0',  # Ligne budget 2024 legacy
            }

            if info['date']:
                data['date_engagement'] = info['date'].strftime('%Y-%m-%d')
            else:
                data['date_engagement'] = '2024-01-01'

            batch.append(data)

            if len(batch) >= 50:
                try:
                    supabase.table('budget_engagements').upsert(batch).execute()
                    total_inserted += len(batch)
                    print(f"  Inséré batch de {len(batch)}")
                except Exception as e:
                    for item in batch:
                        try:
                            supabase.table('budget_engagements').upsert(item).execute()
                            total_inserted += 1
                        except Exception as e2:
                            if total_errors < 5:
                                print(f"  Erreur: {str(e2)[:80]}")
                            total_errors += 1
                batch = []

        except Exception as e:
            total_errors += 1
            if total_errors <= 3:
                print(f"  Erreur: {str(e)[:50]}")

    # Insert remaining
    if batch:
        try:
            supabase.table('budget_engagements').upsert(batch).execute()
            total_inserted += len(batch)
            print(f"  Inséré batch final de {len(batch)}")
        except Exception as e:
            for item in batch:
                try:
                    supabase.table('budget_engagements').upsert(item).execute()
                    total_inserted += 1
                except Exception as e2:
                    if total_errors < 5:
                        print(f"  Erreur finale: {str(e2)[:80]}")
                    total_errors += 1

    conn.close()

    print(f"\n=== RÉSUMÉ ===")
    print(f"  Total inséré: {total_inserted}")
    print(f"  Total erreurs: {total_errors}")

if __name__ == '__main__':
    migrate_engagements_2024()
