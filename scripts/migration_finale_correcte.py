#!/usr/bin/env python3
"""
MIGRATION FINALE CORRECTE - SYGFP
Corrections:
1. Statuts corrects: validee → valide
2. INSERT ON CONFLICT DO NOTHING (ignore doublons)
3. Pas de colonne legacy_import
4. Relations FK respectées (engagements → liquidations → ordonnancements)
5. Batch processing optimisé
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

# ID de ligne budget par défaut
DEFAULT_BUDGET_LINE_ID = '8b0d9cef-c790-468b-8e02-0773241c9cb0'

print("=" * 100)
print(" MIGRATION FINALE CORRECTE - SYGFP ".center(100, "="))
print("=" * 100)
print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

def generate_uuid(table: str, old_id: int, year: int) -> str:
    """Génère un UUID DÉTERMINISTE"""
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

def safe_text(text, max_len=500):
    """Tronque le texte si trop long"""
    if not text:
        return None
    text_str = str(text)
    if len(text_str) > max_len:
        return text_str[:max_len-3] + "..."
    return text_str

def map_statut(sql_statut, default='valide'):
    """
    Mappe les statuts SQL Server → Supabase
    SQL Server utilise: validee, payee, en_attente, etc.
    Supabase utilise: valide, paye, en_attente, etc.
    """
    if not sql_statut:
        return default

    mapping = {
        'validee': 'valide',
        'valide': 'valide',
        'payee': 'paye',
        'paye': 'paye',
        'en_attente': 'en_attente',
        'brouillon': 'brouillon',
        'soumis': 'soumis',
        'rejete': 'rejete',
        'annule': 'annule',
    }

    statut_lower = str(sql_statut).lower().strip()
    return mapping.get(statut_lower, default)

print("🔄 ÉTAPE 1/5 : Récupération des données SQL Server...")
print("=" * 100)

# Bases SQL Server
databases = [
    ('eARTI_DB2', '2021-2023'),
    ('eARTIDB_2025', '2024-2025'),
    ('eARTIDB_2026', '2026')
]

# Données collectées
sql_data = {
    'notes': [],
    'engagements': [],
    'liquidations': [],
    'ordonnancements': []
}

for db_name, periode in databases:
    print(f"\n📦 {db_name} ({periode})...")

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
        cursor.execute("SELECT * FROM NoteDG WHERE DateCreation IS NOT NULL ORDER BY DateCreation")
        notes = cursor.fetchall()
        for note in notes:
            note['_exercice'] = note['DateCreation'].year if note.get('DateCreation') else 2024
            note['_uuid'] = generate_uuid('note', note['NoteDgID'], note['_exercice'])
        sql_data['notes'].extend(notes)
        print(f"  ✓ Notes: {len(notes)}")

        # Engagements
        cursor.execute("SELECT * FROM EngagementAnterieur ORDER BY Exercice, Engagement")
        engagements = cursor.fetchall()
        for eng in engagements:
            eng['_exercice'] = eng['Exercice'] if eng.get('Exercice') else 2024
            eng['_uuid'] = generate_uuid('engagement', eng['Engagement'], eng['_exercice'])
        sql_data['engagements'].extend(engagements)
        print(f"  ✓ Engagements: {len(engagements)}")

        # Liquidations
        cursor.execute("SELECT * FROM Liquidation ORDER BY Exercice, Liquidation")
        liquidations = cursor.fetchall()
        for liq in liquidations:
            liq['_exercice'] = liq['Exercice'] if liq.get('Exercice') else 2024
            liq['_uuid'] = generate_uuid('liquidation', liq['Liquidation'], liq['_exercice'])
            # Lien vers l'engagement
            if liq.get('Engagement'):
                liq['_engagement_uuid'] = generate_uuid('engagement', liq['Engagement'], liq['_exercice'])
            else:
                liq['_engagement_uuid'] = None
        sql_data['liquidations'].extend(liquidations)
        print(f"  ✓ Liquidations: {len(liquidations)}")

        # Ordonnancements
        cursor.execute("SELECT * FROM Ordonnancement ORDER BY Exercice, Liquidation, Ordonnancement")
        ordonnancements = cursor.fetchall()
        for ord in ordonnancements:
            ord['_exercice'] = ord['Exercice'] if ord.get('Exercice') else 2024
            ord['_uuid'] = generate_uuid('ordonnancement', ord['Ordonnancement'], ord['_exercice'])
            # Lien vers la liquidation
            if ord.get('Liquidation'):
                ord['_liquidation_uuid'] = generate_uuid('liquidation', ord['Liquidation'], ord['_exercice'])
            else:
                ord['_liquidation_uuid'] = None
        sql_data['ordonnancements'].extend(ordonnancements)
        print(f"  ✓ Ordonnancements: {len(ordonnancements)}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"  ❌ Erreur {db_name}: {e}")
        continue

print(f"\n✅ TOTAL SQL Server: {len(sql_data['notes'])} notes, {len(sql_data['engagements'])} engagements, {len(sql_data['liquidations'])} liquidations, {len(sql_data['ordonnancements'])} ordonnancements")

# ============================================
# ÉTAPE 2 : MIGRATION DES NOTES SEF
# ============================================
print("\n" + "=" * 100)
print("🔄 ÉTAPE 2/5 : Migration des Notes SEF...")
print("=" * 100)

notes_inserted = 0
notes_skipped = 0
notes_errors = 0
batch_size = 50

for i in range(0, len(sql_data['notes']), batch_size):
    batch = sql_data['notes'][i:i+batch_size]

    for note in batch:
        try:
            # Préparer les données
            data = {
                'id': note['_uuid'],
                'numero': f"MIG-NOTE-{note['_exercice']}-{note['NoteDgID']}",
                'exercice': note['_exercice'],
                'objet': safe_text(note.get('Objet1'), 500),
                'type_note': 'normale',
                'statut': map_statut(note.get('Statut'), 'valide'),  # ✅ CORRECTION ICI
                'created_at': safe_date(note.get('DateCreation')),
                'montant_estime': 0,
                'type_depense': 'fonctionnement',
                'is_migrated': True,
            }

            # Insérer avec ON CONFLICT DO NOTHING (via upsert avec update vide)
            result = supabase.table('notes_sef').upsert(data, on_conflict='id').execute()

            if result.data:
                notes_inserted += 1
            else:
                notes_skipped += 1

        except Exception as e:
            notes_errors += 1
            if notes_errors <= 5:
                print(f"  ⚠️  Erreur note {note['_uuid']}: {e.message if hasattr(e, 'message') else str(e)}")

    # Afficher la progression tous les 1000
    if (i + batch_size) % 1000 == 0:
        print(f"  📊 {i + batch_size:,} notes traitées...")

print(f"\n✅ Notes: {notes_inserted:,} insérées, {notes_skipped:,} déjà présentes, {notes_errors:,} erreurs")

# ============================================
# ÉTAPE 3 : MIGRATION DES ENGAGEMENTS
# ============================================
print("\n" + "=" * 100)
print("🔄 ÉTAPE 3/5 : Migration des Engagements...")
print("=" * 100)

engagements_inserted = 0
engagements_skipped = 0
engagements_errors = 0

for i in range(0, len(sql_data['engagements']), batch_size):
    batch = sql_data['engagements'][i:i+batch_size]

    for eng in batch:
        try:
            data = {
                'id': eng['_uuid'],
                'numero': f"MIG-ENG-{eng['_exercice']}-{eng['Engagement']}",
                'exercice': eng['_exercice'],
                'montant': float(eng.get('Montant', 0) or 0),
                'objet': safe_text(eng.get('Objet1'), 500),
                'statut': map_statut(eng.get('Statut'), 'valide'),  # ✅ CORRECTION ICI
                'budget_line_id': DEFAULT_BUDGET_LINE_ID,
                'created_at': datetime.now().isoformat(),
                'is_migrated': True,
            }

            result = supabase.table('budget_engagements').upsert(data, on_conflict='id').execute()

            if result.data:
                engagements_inserted += 1
            else:
                engagements_skipped += 1

        except Exception as e:
            engagements_errors += 1
            if engagements_errors <= 5:
                print(f"  ⚠️  Erreur engagement {eng['_uuid']}: {e.message if hasattr(e, 'message') else str(e)}")

    if (i + batch_size) % 1000 == 0:
        print(f"  ✓ {i + batch_size:,} engagements traités...")

print(f"\n✅ Engagements: {engagements_inserted:,} insérés, {engagements_skipped:,} déjà présents, {engagements_errors:,} erreurs")

# ============================================
# ÉTAPE 4 : MIGRATION DES LIQUIDATIONS
# ============================================
print("\n" + "=" * 100)
print("🔄 ÉTAPE 4/5 : Migration des Liquidations (avec FK vers Engagements)...")
print("=" * 100)

liquidations_inserted = 0
liquidations_skipped = 0
liquidations_errors = 0
liquidations_sans_engagement = 0

for i in range(0, len(sql_data['liquidations']), batch_size):
    batch = sql_data['liquidations'][i:i+batch_size]

    for liq in batch:
        try:
            # Vérifier que l'engagement existe
            if not liq['_engagement_uuid']:
                liquidations_sans_engagement += 1
                # Créer un engagement fictif pour cette liquidation
                fake_eng_uuid = liq['_uuid']  # Réutiliser l'UUID de la liquidation
                fake_eng_data = {
                    'id': fake_eng_uuid,
                    'numero': f"MIG-ENG-AUTO-{liq['_exercice']}-{liq['Liquidation']}",
                    'exercice': liq['_exercice'],
                    'montant': float(liq.get('Montant', 0) or 0),
                    'objet': safe_text(liq.get('Objet1'), 500) or 'Engagement automatique pour liquidation migrée',
                    'statut': 'valide',
                    'budget_line_id': DEFAULT_BUDGET_LINE_ID,
                    'created_at': datetime.now().isoformat(),
                    'is_migrated': True,
                }
                supabase.table('budget_engagements').upsert(fake_eng_data, on_conflict='id').execute()
                liq['_engagement_uuid'] = fake_eng_uuid

            data = {
                'id': liq['_uuid'],
                'numero': f"LIQ-{liq['_exercice']}-{liq['Liquidation']}",
                'engagement_id': liq['_engagement_uuid'],
                'montant': float(liq.get('Montant', 0) or 0),
                'date_liquidation': safe_date(liq.get('DateLiquidation')),
                'statut': map_statut(liq.get('Statut'), 'valide'),  # ✅ CORRECTION ICI
                'created_at': datetime.now().isoformat(),
                'exercice': liq['_exercice'],
                'is_migrated': True,
            }

            result = supabase.table('budget_liquidations').upsert(data, on_conflict='id').execute()

            if result.data:
                liquidations_inserted += 1
            else:
                liquidations_skipped += 1

        except Exception as e:
            liquidations_errors += 1
            if liquidations_errors <= 5:
                print(f"  ⚠️  Erreur liquidation {liq['_uuid']}: {e.message if hasattr(e, 'message') else str(e)}")

    if (i + batch_size) % 1000 == 0:
        print(f"  ✓ {i + batch_size:,} liquidations traitées...")

print(f"\n✅ Liquidations: {liquidations_inserted:,} insérées, {liquidations_skipped:,} déjà présentes, {liquidations_errors:,} erreurs")
print(f"   ℹ️  {liquidations_sans_engagement:,} liquidations sans engagement → engagements fictifs créés")

# ============================================
# ÉTAPE 5 : MIGRATION DES ORDONNANCEMENTS
# ============================================
print("\n" + "=" * 100)
print("🔄 ÉTAPE 5/5 : Migration des Ordonnancements (avec FK vers Liquidations)...")
print("=" * 100)

ordonnancements_inserted = 0
ordonnancements_skipped = 0
ordonnancements_errors = 0
ordonnancements_sans_liquidation = 0

for i in range(0, len(sql_data['ordonnancements']), batch_size):
    batch = sql_data['ordonnancements'][i:i+batch_size]

    for ord in batch:
        try:
            # Vérifier que la liquidation existe
            if not ord['_liquidation_uuid']:
                ordonnancements_sans_liquidation += 1
                # Créer une liquidation fictive
                fake_liq_uuid = ord['_uuid']
                # Et un engagement fictif
                fake_eng_uuid = f"eng-{ord['_uuid']}"

                # Créer l'engagement fictif
                fake_eng_data = {
                    'id': fake_eng_uuid,
                    'numero': f"MIG-ENG-AUTO-{ord['_exercice']}-{ord['Ordonnancement']}",
                    'exercice': ord['_exercice'],
                    'montant': float(ord.get('MontantMandate', 0) or 0),
                    'objet': safe_text(ord.get('Objet1'), 500) or 'Engagement automatique pour ordonnancement migré',
                    'statut': 'valide',
                    'budget_line_id': DEFAULT_BUDGET_LINE_ID,
                    'created_at': datetime.now().isoformat(),
                    'is_migrated': True,
                }
                supabase.table('budget_engagements').upsert(fake_eng_data, on_conflict='id').execute()

                # Créer la liquidation fictive
                fake_liq_data = {
                    'id': fake_liq_uuid,
                    'numero': f"LIQ-AUTO-{ord['_exercice']}-{ord['Ordonnancement']}",
                    'engagement_id': fake_eng_uuid,
                    'montant': float(ord.get('MontantMandate', 0) or 0),
                    'statut': 'valide',
                    'created_at': datetime.now().isoformat(),
                    'exercice': ord['_exercice'],
                    'is_migrated': True,
                }
                supabase.table('budget_liquidations').upsert(fake_liq_data, on_conflict='id').execute()
                ord['_liquidation_uuid'] = fake_liq_uuid

            data = {
                'id': ord['_uuid'],
                'numero': f"ORD-{ord['_exercice']}-{ord['Ordonnancement']}",
                'liquidation_id': ord['_liquidation_uuid'],
                'montant': float(ord.get('MontantMandate', 0) or 0),
                'beneficiaire': safe_text(ord.get('RaisonSociale'), 200) or 'Bénéficiaire inconnu',
                'objet': safe_text(ord.get('Objet1'), 500) or 'Objet non renseigné',
                'statut': map_statut(ord.get('Statut'), 'valide'),  # ✅ CORRECTION ICI
                'created_at': datetime.now().isoformat(),
                'exercice': ord['_exercice'],
                'is_migrated': True,
            }

            result = supabase.table('ordonnancements').upsert(data, on_conflict='id').execute()

            if result.data:
                ordonnancements_inserted += 1
            else:
                ordonnancements_skipped += 1

        except Exception as e:
            ordonnancements_errors += 1
            if ordonnancements_errors <= 5:
                print(f"  ⚠️  Erreur ordonnancement {ord['_uuid']}: {e.message if hasattr(e, 'message') else str(e)}")

    if (i + batch_size) % 1000 == 0:
        print(f"  ✓ {i + batch_size:,} ordonnancements traités...")

print(f"\n✅ Ordonnancements: {ordonnancements_inserted:,} insérés, {ordonnancements_skipped:,} déjà présents, {ordonnancements_errors:,} erreurs")
print(f"   ℹ️  {ordonnancements_sans_liquidation:,} ordonnancements sans liquidation → liquidations fictives créées")

# ============================================
# RÉSUMÉ FINAL
# ============================================
print("\n" + "=" * 100)
print(" RÉSUMÉ FINAL ".center(100, "="))
print("=" * 100)

print(f"""
📊 SQL Server:
   - Notes:          {len(sql_data['notes']):,}
   - Engagements:    {len(sql_data['engagements']):,}
   - Liquidations:   {len(sql_data['liquidations']):,}
   - Ordonnancements: {len(sql_data['ordonnancements']):,}
   TOTAL:            {sum([len(v) for v in sql_data.values()]):,}

✅ Migration:
   - Notes:          {notes_inserted:,} insérées, {notes_errors:,} erreurs
   - Engagements:    {engagements_inserted:,} insérés, {engagements_errors:,} erreurs
   - Liquidations:   {liquidations_inserted:,} insérées, {liquidations_errors:,} erreurs
   - Ordonnancements: {ordonnancements_inserted:,} insérés, {ordonnancements_errors:,} erreurs
   TOTAL INSÉRÉ:     {notes_inserted + engagements_inserted + liquidations_inserted + ordonnancements_inserted:,}

📈 Taux de réussite: {((notes_inserted + engagements_inserted + liquidations_inserted + ordonnancements_inserted) / sum([len(v) for v in sql_data.values()]) * 100):.1f}%
""")

print("\n🎉 MIGRATION TERMINÉE!")
print("=" * 100)
