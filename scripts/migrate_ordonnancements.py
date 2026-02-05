#!/usr/bin/env python3
"""
Migration des ordonnancements SYGFP vers Supabase
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
    2024: 'eARTI_DB2',     # Now included since engagements were migrated
    2025: 'eARTIDB_2025',
    2026: 'eARTIDB_2026'
}

def generate_uuid(table: str, old_id: int, year: int) -> str:
    """Génère un UUID déterministe"""
    unique_string = f"{table}_{year}_{old_id}"
    hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
    return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"

def get_existing_ordonnancements(supabase):
    """Récupère les IDs des ordonnancements existants"""
    existing = set()
    offset = 0
    while True:
        result = supabase.table('ordonnancements').select('id').range(offset, offset + 999).execute()
        if not result.data:
            break
        for row in result.data:
            existing.add(row['id'])
        offset += 1000
        if len(result.data) < 1000:
            break
    return existing

def get_existing_liquidation_ids(supabase):
    """Récupère tous les IDs des liquidations existantes"""
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

def migrate_ordonnancements():
    """Migration des ordonnancements"""
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Get existing ordonnancements
    existing_ids = get_existing_ordonnancements(supabase)
    print(f"Ordonnancements existants dans Supabase: {len(existing_ids)}")

    # Get existing liquidation IDs
    existing_liquidation_ids = get_existing_liquidation_ids(supabase)
    print(f"Liquidations existantes: {len(existing_liquidation_ids)}")

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

            cursor.execute("SELECT * FROM Ordonnancement")

            ordonnancements = cursor.fetchall()
            print(f"  Ordonnancements trouvés: {len(ordonnancements)}")

            batch = []
            for ord in ordonnancements:
                try:
                    new_id = generate_uuid('ordonnancement', ord['OrdonnancementID'], year)

                    if new_id in existing_ids:
                        total_skipped += 1
                        continue

                    # Find liquidation_id using LiquidationID and deterministic UUID
                    old_liq_id = ord.get('LiquidationID')
                    liquidation_id = None
                    if old_liq_id:
                        liquidation_id = generate_uuid('liquidation', old_liq_id, year)
                        # Verify the liquidation exists
                        if liquidation_id not in existing_liquidation_ids:
                            if total_skipped < 5:
                                print(f"    Skip: Liquidation {old_liq_id} n'existe pas")
                            total_skipped += 1
                            continue

                    # If still not found, skip this record
                    if not liquidation_id:
                        if total_skipped < 5:
                            print(f"    Skip: Pas de LiquidationID")
                        total_skipped += 1
                        continue

                    ord_num = ord.get('Ordonnancement')  # Column name is 'Ordonnancement'

                    # Determine status
                    statut = 'en_attente'
                    if ord.get('EtatValidateDG') == 1:
                        statut = 'valide'
                    elif ord.get('EtatValidateDAAF') == 1:
                        statut = 'valide_daaf'
                    elif ord.get('EtatValidateCB') == 1:
                        statut = 'valide_cb'

                    data = {
                        'id': new_id,
                        'liquidation_id': liquidation_id,
                        'numero': ord_num or f"ORD-{year}-{ord['OrdonnancementID']:05d}",
                        'montant': float(ord.get('MontantMandate') or 0),
                        'beneficiaire': ord.get('RaisonSociale') or 'Non spécifié',
                        'objet': ord.get('Objet1') or '',
                        'mode_paiement': ord.get('ModePaiement') or 'virement',
                        'banque': ord.get('Banque') or '',
                        'rib': ord.get('CpteBancaire') or '',
                        'statut': statut,
                        'exercice': year,
                        'legacy_import': True,
                    }

                    # Add optional fields
                    if ord.get('DateCreation'):
                        data['created_at'] = ord['DateCreation'].isoformat()

                    # Clean None values
                    data = {k: v for k, v in data.items() if v is not None}

                    batch.append(data)

                    # Insert in batches of 100
                    if len(batch) >= 100:
                        try:
                            supabase.table('ordonnancements').upsert(batch).execute()
                            total_inserted += len(batch)
                            print(f"    Inséré batch de {len(batch)}")
                        except Exception as e:
                            # Try one by one
                            for item in batch:
                                try:
                                    supabase.table('ordonnancements').upsert(item).execute()
                                    total_inserted += 1
                                except Exception as e2:
                                    if total_errors < 5:
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
                    supabase.table('ordonnancements').upsert(batch).execute()
                    total_inserted += len(batch)
                    print(f"    Inséré batch final de {len(batch)}")
                except Exception as e:
                    for item in batch:
                        try:
                            supabase.table('ordonnancements').upsert(item).execute()
                            total_inserted += 1
                        except Exception as e2:
                            if total_errors < 5:
                                print(f"    Erreur item final: {str(e2)[:100]}")
                            total_errors += 1

            conn.close()

        except Exception as e:
            print(f"  Erreur connexion: {str(e)[:50]}")

    print(f"\n=== RÉSUMÉ ===")
    print(f"  Total inséré: {total_inserted}")
    print(f"  Total ignoré: {total_skipped}")
    print(f"  Total erreurs: {total_errors}")

if __name__ == '__main__':
    migrate_ordonnancements()
