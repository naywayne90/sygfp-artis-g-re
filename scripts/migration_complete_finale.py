#!/usr/bin/env python3
"""
SCRIPT DE MIGRATION COMPLET ET FINAL - SYGFP
Migre 100% des données SQL Server → Supabase
SANS DOUBLONS - SANS ERREURS - AVEC VÉRIFICATIONS
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import pymssql
from supabase import create_client
import hashlib
from datetime import datetime, date
from collections import defaultdict
import time

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Couleurs pour terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_step(step, message):
    """Affiche une étape avec formatage"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}[{step}]{Colors.END} {message}")

def print_success(message):
    """Affiche un succès"""
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    """Affiche une erreur"""
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    """Affiche un avertissement"""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def generate_uuid(table: str, old_id: int, year: int) -> str:
    """Génère un UUID déterministe pour éviter les doublons"""
    unique_string = f"{table}_{year}_{old_id}"
    hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
    return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"

def safe_date(dt):
    """Convertit une date en string ISO"""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    if isinstance(dt, (datetime, date)):
        return dt.strftime('%Y-%m-%d')
    return None

def get_sql_server_data(databases):
    """Récupère TOUTES les données des 3 bases SQL Server"""

    print_step("ÉTAPE 1/6", "Connexion à SQL Server et récupération des données...")

    all_data = {
        'notes': [],
        'engagements': [],
        'liquidations': [],
        'ordonnancements': []
    }

    for db_name, periode in databases:
        print(f"\n  📦 Connexion à {db_name} ({periode})...")

        try:
            conn = pymssql.connect(
                server='192.168.0.8',
                port=1433,
                user='ARTI\\admin',
                password='tranSPort2021!',
                database=db_name,
                timeout=60
            )
            cursor = conn.cursor(as_dict=True)

            # Notes DG
            print(f"    📝 Récupération Notes DG...")
            cursor.execute("""
                SELECT
                    NoteDgID, DemandeExpressionID, Reference, Objet,
                    DateCreation, DocumentAnnexe, NombrePage
                FROM NoteDG
                WHERE DateCreation IS NOT NULL
                ORDER BY DateCreation
            """)
            notes = cursor.fetchall()
            for note in notes:
                year = note['DateCreation'].year if note.get('DateCreation') else 2024
                note['_exercice'] = year
                note['_database'] = db_name
            all_data['notes'].extend(notes)
            print(f"       ✓ {len(notes)} notes récupérées")

            # Engagements
            print(f"    💰 Récupération Engagements...")
            cursor.execute("""
                SELECT
                    EngagementAnterieurID, DemandeExpressionID,
                    ValeurEngagement, DateCreation, EstActif
                FROM EngagementAnterieur
                WHERE DateCreation IS NOT NULL
                ORDER BY DateCreation
            """)
            engagements = cursor.fetchall()
            for eng in engagements:
                year = eng['DateCreation'].year if eng.get('DateCreation') else 2024
                eng['_exercice'] = year
                eng['_database'] = db_name
            all_data['engagements'].extend(engagements)
            print(f"       ✓ {len(engagements)} engagements récupérés")

            # Liquidations
            print(f"    📋 Récupération Liquidations...")
            cursor.execute("""
                SELECT
                    LiquidationID, EngagementID, NumLiquidation,
                    Date, MontantLiquide, RaisonSociale, Objet1
                FROM Liquidation
                WHERE Date IS NOT NULL
                ORDER BY Date
            """)
            liquidations = cursor.fetchall()
            for liq in liquidations:
                year = liq['Date'].year if liq.get('Date') else 2024
                liq['_exercice'] = year
                liq['_database'] = db_name
            all_data['liquidations'].extend(liquidations)
            print(f"       ✓ {len(liquidations)} liquidations récupérées")

            # Ordonnancements
            print(f"    📊 Récupération Ordonnancements...")
            cursor.execute("""
                SELECT
                    OrdonnancementID, LiquidationID, Ordonnancement,
                    Date, MontantMandate, RaisonSociale, Objet1
                FROM Ordonnancement
                WHERE Date IS NOT NULL
                ORDER BY Date
            """)
            ordonnancements = cursor.fetchall()
            for ord in ordonnancements:
                year = ord['Date'].year if ord.get('Date') else 2024
                ord['_exercice'] = year
                ord['_database'] = db_name
            all_data['ordonnancements'].extend(ordonnancements)
            print(f"       ✓ {len(ordonnancements)} ordonnancements récupérés")

            conn.close()
            print_success(f"{db_name} terminé")

        except Exception as e:
            print_error(f"Erreur {db_name}: {e}")
            return None

    print_success(f"TOTAL SQL Server: {len(all_data['notes'])} notes, {len(all_data['engagements'])} engagements, {len(all_data['liquidations'])} liquidations, {len(all_data['ordonnancements'])} ordonnancements")

    return all_data

def get_existing_ids(table_name):
    """Récupère les IDs déjà présents dans Supabase"""
    print(f"    🔍 Vérification des données existantes dans {table_name}...")

    existing_ids = set()
    offset = 0
    batch_size = 1000

    while True:
        try:
            response = supabase.table(table_name).select('id').range(offset, offset + batch_size - 1).execute()
            if not response.data:
                break

            for row in response.data:
                existing_ids.add(row['id'])

            if len(response.data) < batch_size:
                break

            offset += batch_size

        except Exception as e:
            print_error(f"Erreur lors de la récupération des IDs existants: {e}")
            break

    print(f"       ✓ {len(existing_ids)} enregistrements déjà présents")
    return existing_ids

def migrate_notes_sef(sql_data):
    """Migre les Notes SEF"""

    print_step("ÉTAPE 2/6", "Migration des Notes SEF...")

    # Récupérer les IDs existants
    existing_ids = get_existing_ids('notes_sef')

    # Préparer les données à insérer
    to_insert = []
    skipped = 0

    for note in sql_data:
        note_id = note['NoteDgID']
        year = note['_exercice']

        # Générer UUID déterministe
        uuid = generate_uuid('notes', note_id, year)

        # Skip si déjà existant
        if uuid in existing_ids:
            skipped += 1
            continue

        # Préparer l'enregistrement
        objet_text = note.get('Objet') or note.get('Reference') or f"Note migrée {year}"
        # Limiter l'objet à 500 caractères pour éviter les erreurs
        if objet_text and len(str(objet_text)) > 500:
            objet_text = str(objet_text)[:497] + "..."

        data = {
            'id': uuid,
            'numero': f"MIG-NOTE-{year}-{note_id}",
            'exercice': year,
            'objet': objet_text,
            'montant_estime': 0,
            'statut': 'validee',
            'type_depense': 'fonctionnement',
            'legacy_import': True,
            'created_at': safe_date(note.get('DateCreation')),
        }

        to_insert.append(data)

    print(f"    📊 {len(to_insert)} notes à insérer, {skipped} déjà présentes")

    # Insérer par batch de 100
    batch_size = 100
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(to_insert), batch_size):
        batch = to_insert[i:i + batch_size]

        try:
            supabase.table('notes_sef').insert(batch).execute()
            total_inserted += len(batch)
            print(f"    ✓ Batch {i//batch_size + 1}: {len(batch)} notes insérées (Total: {total_inserted})")
        except Exception as e:
            total_errors += len(batch)
            print_error(f"Erreur batch {i//batch_size + 1}: {e}")

    print_success(f"Notes SEF: {total_inserted} insérées, {total_errors} erreurs")
    return total_inserted, total_errors

def migrate_engagements(sql_data):
    """Migre les Engagements"""

    print_step("ÉTAPE 3/6", "Migration des Engagements...")

    existing_ids = get_existing_ids('budget_engagements')

    to_insert = []
    skipped = 0

    for eng in sql_data:
        eng_id = eng['EngagementAnterieurID']
        year = eng['_exercice']

        uuid = generate_uuid('engagement', eng_id, year)

        if uuid in existing_ids:
            skipped += 1
            continue

        data = {
            'id': uuid,
            'numero': f"MIG-ENG-{year}-{eng_id}",
            'exercice': year,
            'montant': float(eng.get('ValeurEngagement') or 0),
            'objet': f"Engagement migré {year}",
            'statut': 'valide',
            'legacy_import': True,
            'budget_line_id': '8b0d9cef-c790-468b-8e02-0773241c9cb0',
            'date_engagement': safe_date(eng.get('DateCreation')),
        }

        to_insert.append(data)

    print(f"    📊 {len(to_insert)} engagements à insérer, {skipped} déjà présents")

    batch_size = 100
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(to_insert), batch_size):
        batch = to_insert[i:i + batch_size]

        try:
            supabase.table('budget_engagements').insert(batch).execute()
            total_inserted += len(batch)
            print(f"    ✓ Batch {i//batch_size + 1}: {len(batch)} engagements insérés (Total: {total_inserted})")
        except Exception as e:
            total_errors += len(batch)
            print_error(f"Erreur batch {i//batch_size + 1}: {e}")

    print_success(f"Engagements: {total_inserted} insérés, {total_errors} erreurs")
    return total_inserted, total_errors

def migrate_liquidations(sql_data):
    """Migre les Liquidations"""

    print_step("ÉTAPE 4/6", "Migration des Liquidations...")

    existing_ids = get_existing_ids('budget_liquidations')

    to_insert = []
    skipped = 0

    for liq in sql_data:
        liq_id = liq['LiquidationID']
        year = liq['_exercice']

        uuid = generate_uuid('liquidation', liq_id, year)

        if uuid in existing_ids:
            skipped += 1
            continue

        data = {
            'id': uuid,
            'numero': liq.get('NumLiquidation') or f"MIG-LIQ-{year}-{liq_id}",
            'exercice': year,
            'montant': float(liq.get('MontantLiquide') or 0),
            'statut': 'validee',
            'legacy_import': True,
            'engagement_id': None,  # Sera lié plus tard si nécessaire
            'date_liquidation': safe_date(liq.get('Date')),
        }

        to_insert.append(data)

    print(f"    📊 {len(to_insert)} liquidations à insérer, {skipped} déjà présentes")

    batch_size = 100
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(to_insert), batch_size):
        batch = to_insert[i:i + batch_size]

        try:
            supabase.table('budget_liquidations').insert(batch).execute()
            total_inserted += len(batch)
            print(f"    ✓ Batch {i//batch_size + 1}: {len(batch)} liquidations insérées (Total: {total_inserted})")
        except Exception as e:
            total_errors += len(batch)
            print_error(f"Erreur batch {i//batch_size + 1}: {e}")

    print_success(f"Liquidations: {total_inserted} insérées, {total_errors} erreurs")
    return total_inserted, total_errors

def migrate_ordonnancements(sql_data):
    """Migre les Ordonnancements"""

    print_step("ÉTAPE 5/6", "Migration des Ordonnancements...")

    existing_ids = get_existing_ids('ordonnancements')

    to_insert = []
    skipped = 0

    for ord in sql_data:
        ord_id = ord['OrdonnancementID']
        year = ord['_exercice']

        uuid = generate_uuid('ordonnancement', ord_id, year)

        if uuid in existing_ids:
            skipped += 1
            continue

        data = {
            'id': uuid,
            'numero': ord.get('Ordonnancement') or f"MIG-ORD-{year}-{ord_id}",
            'exercice': year,
            'montant': float(ord.get('MontantMandate') or 0),
            'beneficiaire': ord.get('RaisonSociale') or 'Bénéficiaire migré',
            'objet': ord.get('Objet1') or f"Ordonnancement migré {year}",
            'statut': 'valide',
            'legacy_import': True,
            'liquidation_id': None,  # Sera lié plus tard si nécessaire
        }

        to_insert.append(data)

    print(f"    📊 {len(to_insert)} ordonnancements à insérer, {skipped} déjà présents")

    batch_size = 100
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(to_insert), batch_size):
        batch = to_insert[i:i + batch_size]

        try:
            supabase.table('ordonnancements').insert(batch).execute()
            total_inserted += len(batch)
            print(f"    ✓ Batch {i//batch_size + 1}: {len(batch)} ordonnancements insérés (Total: {total_inserted})")
        except Exception as e:
            total_errors += len(batch)
            print_error(f"Erreur batch {i//batch_size + 1}: {e}")

    print_success(f"Ordonnancements: {total_inserted} insérés, {total_errors} erreurs")
    return total_inserted, total_errors

def verify_migration():
    """Vérifie que TOUT a été migré"""

    print_step("ÉTAPE 6/6", "VÉRIFICATION FINALE...")

    # Compter dans SQL Server
    sql_counts = {
        'notes': 0,
        'engagements': 0,
        'liquidations': 0,
        'ordonnancements': 0
    }

    databases = [
        ('eARTI_DB2', '2021-2023'),
        ('eARTIDB_2025', '2024-2025'),
        ('eARTIDB_2026', '2026')
    ]

    for db_name, _ in databases:
        try:
            conn = pymssql.connect(
                server='192.168.0.8',
                port=1433,
                user='ARTI\\admin',
                password='tranSPort2021!',
                database=db_name,
                timeout=30
            )
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM NoteDG WHERE DateCreation IS NOT NULL")
            sql_counts['notes'] += cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM EngagementAnterieur WHERE DateCreation IS NOT NULL")
            sql_counts['engagements'] += cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM Liquidation WHERE Date IS NOT NULL")
            sql_counts['liquidations'] += cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM Ordonnancement WHERE Date IS NOT NULL")
            sql_counts['ordonnancements'] += cursor.fetchone()[0]

            conn.close()
        except Exception as e:
            print_error(f"Erreur comptage {db_name}: {e}")

    # Compter dans Supabase
    spb_counts = {}

    tables = [
        ('notes_sef', 'notes'),
        ('budget_engagements', 'engagements'),
        ('budget_liquidations', 'liquidations'),
        ('ordonnancements', 'ordonnancements')
    ]

    for table, key in tables:
        try:
            response = supabase.table(table).select('id', count='exact').execute()
            spb_counts[key] = response.count
        except Exception as e:
            print_error(f"Erreur comptage {table}: {e}")
            spb_counts[key] = 0

    # Afficher le résultat
    print(f"\n{'='*80}")
    print(f"  RÉSULTAT FINAL - VÉRIFICATION 100%")
    print(f"{'='*80}\n")

    print(f"{'Type':<20} | {'SQL Server':>15} | {'Supabase':>15} | {'Statut':<20}")
    print(f"{'-'*20}-+-{'-'*15}-+-{'-'*15}-+-{'-'*20}")

    all_ok = True

    for key in ['notes', 'engagements', 'liquidations', 'ordonnancements']:
        sql = sql_counts[key]
        spb = spb_counts[key]

        if sql == spb:
            statut = f"{Colors.GREEN}✅ COMPLET{Colors.END}"
        else:
            statut = f"{Colors.RED}❌ MANQUE {sql - spb}{Colors.END}"
            all_ok = False

        print(f"{key.capitalize():<20} | {sql:>15,} | {spb:>15,} | {statut}")

    print(f"{'-'*20}-+-{'-'*15}-+-{'-'*15}-+-{'-'*20}")

    total_sql = sum(sql_counts.values())
    total_spb = sum(spb_counts.values())

    if total_sql == total_spb:
        print(f"\n{Colors.BOLD}{Colors.GREEN}🎉 MIGRATION 100% RÉUSSIE ! {total_spb:,} / {total_sql:,} enregistrements{Colors.END}\n")
    else:
        print(f"\n{Colors.BOLD}{Colors.RED}⚠️  MIGRATION INCOMPLÈTE : {total_spb:,} / {total_sql:,} (manque {total_sql - total_spb:,}){Colors.END}\n")

    return all_ok

def main():
    """Fonction principale"""

    print(f"\n{'='*80}")
    print(f"{Colors.BOLD}  MIGRATION COMPLÈTE SYGFP - SQL SERVER → SUPABASE{Colors.END}")
    print(f"{'='*80}\n")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Objectif: 13,665 enregistrements à migrer")
    print(f"\n{'='*80}\n")

    start_time = time.time()

    # Bases de données SQL Server
    databases = [
        ('eARTI_DB2', '2021-2023'),
        ('eARTIDB_2025', '2024-2025'),
        ('eARTIDB_2026', '2026')
    ]

    # 1. Récupérer toutes les données
    sql_data = get_sql_server_data(databases)
    if sql_data is None:
        print_error("Impossible de récupérer les données SQL Server")
        return

    # 2. Migrer Notes SEF
    notes_inserted, notes_errors = migrate_notes_sef(sql_data['notes'])

    # 3. Migrer Engagements
    eng_inserted, eng_errors = migrate_engagements(sql_data['engagements'])

    # 4. Migrer Liquidations
    liq_inserted, liq_errors = migrate_liquidations(sql_data['liquidations'])

    # 5. Migrer Ordonnancements
    ord_inserted, ord_errors = migrate_ordonnancements(sql_data['ordonnancements'])

    # 6. Vérification finale
    success = verify_migration()

    # Résumé
    elapsed = time.time() - start_time

    print(f"\n{'='*80}")
    print(f"  RÉSUMÉ DE LA MIGRATION")
    print(f"{'='*80}\n")
    print(f"  Notes SEF:       {notes_inserted:>6,} insérées ({notes_errors} erreurs)")
    print(f"  Engagements:     {eng_inserted:>6,} insérés ({eng_errors} erreurs)")
    print(f"  Liquidations:    {liq_inserted:>6,} insérées ({liq_errors} erreurs)")
    print(f"  Ordonnancements: {ord_inserted:>6,} insérés ({ord_errors} erreurs)")
    print(f"\n  Durée totale: {elapsed/60:.1f} minutes")
    print(f"\n{'='*80}\n")

    if success:
        print_success("🎉 MIGRATION 100% RÉUSSIE !")
    else:
        print_error("⚠️  Migration incomplète - Vérifier les erreurs ci-dessus")

if __name__ == '__main__':
    main()
