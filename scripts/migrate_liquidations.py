#!/usr/bin/env python3
"""
Migration des liquidations SYGFP vers Supabase
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

DATABASES = {
    2024: 'eARTI_DB2',
    2025: 'eARTIDB_2025',
    2026: 'eARTIDB_2026'
}

def generate_uuid(table: str, old_id: int, year: int) -> str:
    """Génère un UUID déterministe"""
    unique_string = f"{table}_{year}_{old_id}"
    hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
    return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"

def get_existing_liquidations(supabase):
    """Récupère les IDs des liquidations existantes"""
    existing = set()
    offset = 0
    while True:
        result = supabase.table('budget_liquidations').select('id').range(offset, offset + 999).execute()
        if not result.data:
            break
        for row in result.data:
            existing.add(row['id'])
        offset += 1000
        if len(result.data) < 1000:
            break
    return existing

def get_engagement_mapping(supabase):
    """Récupère le mapping des engagements (numero sans MIG- -> id)"""
    mapping = {}
    offset = 0
    while True:
        result = supabase.table('budget_engagements').select('id,numero').range(offset, offset + 999).execute()
        if not result.data:
            break
        for row in result.data:
            if row['numero']:
                # Remove MIG- prefix if present
                clean_numero = row['numero'][4:] if row['numero'].startswith('MIG-') else row['numero']
                mapping[clean_numero] = row['id']
        offset += 1000
        if len(result.data) < 1000:
            break
    return mapping

def convert_liquidation_to_engagement_num(liq_num):
    """Convert liquidation number to engagement number
    ARTI201260001 -> ARTI101260001
    """
    if not liq_num:
        return None
    # Replace "20" at position 4-6 with "10" (liquidation code -> engagement code)
    if liq_num.startswith('ARTI20'):
        return 'ARTI10' + liq_num[6:]
    elif liq_num.startswith('ARTI30'):  # Ordonnancement
        return 'ARTI10' + liq_num[6:]
    return liq_num

def migrate_liquidations():
    """Migration des liquidations"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get existing liquidations
    existing_ids = get_existing_liquidations(supabase)
    print(f"Liquidations existantes dans Supabase: {len(existing_ids)}")

    # Get engagement mapping
    engagement_mapping = get_engagement_mapping(supabase)
    print(f"Engagements mappés: {len(engagement_mapping)}")

    total_inserted = 0
    total_skipped = 0
    total_errors = 0

    for year, db in DATABASES.items():
        print(f"\n=== Année {year} ({db}) ===")

        try:
            conn = pymssql.connect(
                server=SQL_SERVER,
                user=SQL_USER,
                password=SQL_PASSWORD,
                database=db
            )
            cursor = conn.cursor(as_dict=True)

            cursor.execute("""
                SELECT * FROM Liquidation
            """)

            liquidations = cursor.fetchall()
            print(f"  Liquidations trouvées: {len(liquidations)}")

            batch = []
            for liq in liquidations:
                try:
                    new_id = generate_uuid('liquidation', liq['LiquidationID'], year)

                    if new_id in existing_ids:
                        total_skipped += 1
                        continue

                    # Find engagement_id by converting liquidation number to engagement number
                    engagement_id = None
                    liq_num = liq.get('NumLiquidation')
                    if liq_num:
                        eng_num = convert_liquidation_to_engagement_num(liq_num)
                        if eng_num and eng_num in engagement_mapping:
                            engagement_id = engagement_mapping[eng_num]

                    # If still not found, skip this record
                    if not engagement_id:
                        if total_errors < 5:
                            print(f"    Skip: Engagement non trouvé pour {liq_num}")
                        total_skipped += 1
                        continue

                    # Determine status
                    statut = 'en_attente'
                    if liq.get('EtatValidateDG') == 1:
                        statut = 'valide'
                    elif liq.get('EtatValidateDAAF') == 1:
                        statut = 'valide_daaf'
                    elif liq.get('EtatValidateCB') == 1:
                        statut = 'valide_cb'

                    data = {
                        'id': new_id,
                        'numero': liq.get('NumLiquidation') or f"LIQ-{year}-{liq['LiquidationID']:05d}",
                        'engagement_id': engagement_id,
                        'montant': float(liq.get('MontantLiquide') or 0),
                        'date_liquidation': liq['Date'].strftime('%Y-%m-%d') if liq.get('Date') else None,
                        'statut': statut,
                        'exercice': year,
                        'legacy_import': True,
                        'service_fait': True,
                    }

                    # Add optional fields
                    if liq.get('DateCreation'):
                        data['created_at'] = liq['DateCreation'].isoformat()

                    # Clean None values
                    data = {k: v for k, v in data.items() if v is not None}

                    batch.append(data)

                    # Insert in batches of 100
                    if len(batch) >= 100:
                        try:
                            supabase.table('budget_liquidations').upsert(batch).execute()
                            total_inserted += len(batch)
                            print(f"    Inséré batch de {len(batch)}")
                        except Exception as e:
                            # Try one by one to find the problematic records
                            for item in batch:
                                try:
                                    supabase.table('budget_liquidations').upsert(item).execute()
                                    total_inserted += 1
                                except Exception as e2:
                                    if total_errors < 5:  # Only show first 5 errors
                                        print(f"    Erreur item {item.get('numero')}: {str(e2)[:100]}")
                                    total_errors += 1
                        batch = []

                except Exception as e:
                    total_errors += 1
                    if total_errors <= 5:
                        print(f"    Erreur: {str(e)[:50]}")

            # Insert remaining batch
            if batch:
                try:
                    supabase.table('budget_liquidations').upsert(batch).execute()
                    total_inserted += len(batch)
                    print(f"    Inséré batch final de {len(batch)}")
                except Exception as e:
                    print(f"    Erreur batch final: {str(e)[:50]}")
                    total_errors += len(batch)

            conn.close()

        except Exception as e:
            print(f"  Erreur connexion: {str(e)[:50]}")

    print(f"\n=== RÉSUMÉ ===")
    print(f"  Total inséré: {total_inserted}")
    print(f"  Total ignoré (doublons): {total_skipped}")
    print(f"  Total erreurs: {total_errors}")

if __name__ == '__main__':
    migrate_liquidations()
