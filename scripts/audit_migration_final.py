#!/usr/bin/env python3
"""
AUDIT MIGRATION SYGFP - VERSION FINALE
Compare SQL Server vs Supabase PAR ANNÉE avec les BONS noms de tables
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import pymssql
from supabase import create_client
from collections import defaultdict
from datetime import datetime

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 130)
print(" AUDIT MIGRATION SYGFP - RAPPORT FINAL ".center(130, "="))
print("=" * 130)
print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# =============================================================================
# ÉTAPE 1: AUDIT SQL SERVER
# =============================================================================
print("=" * 130)
print(" ÉTAPE 1: AUDIT SQL SERVER (3 BASES) ".center(130, "="))
print("=" * 130)

databases = [
    ('eARTI_DB2', '2021-2023'),
    ('eARTIDB_2025', '2024-2025'),
    ('eARTIDB_2026', '2026')
]

sql_data = {
    'notes': defaultdict(int),
    'engagements': defaultdict(int),
    'liquidations': defaultdict(int),
    'ordonnancements': defaultdict(int),
}

for db_name, periode in databases:
    print(f"\n{'─' * 130}")
    print(f"📦 {db_name} (Période: {periode})")
    print(f"{'─' * 130}")

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

        # Notes DG
        print(f"\n📝 NOTES DG:")
        cursor.execute("""
            SELECT YEAR(DateCreation) as annee, COUNT(*) as total
            FROM NoteDG WHERE DateCreation IS NOT NULL
            GROUP BY YEAR(DateCreation) ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,}")
                sql_data['notes'][annee] += total
        else:
            print("  └─ Aucune")

        # Engagements
        print(f"\n💰 ENGAGEMENTS:")
        cursor.execute("""
            SELECT YEAR(DateCreation) as annee, COUNT(*) as total
            FROM EngagementAnterieur WHERE DateCreation IS NOT NULL
            GROUP BY YEAR(DateCreation) ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,}")
                sql_data['engagements'][annee] += total
        else:
            print("  └─ Aucun")

        # Liquidations
        print(f"\n📋 LIQUIDATIONS:")
        cursor.execute("""
            SELECT YEAR(Date) as annee, COUNT(*) as total
            FROM Liquidation WHERE Date IS NOT NULL
            GROUP BY YEAR(Date) ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,}")
                sql_data['liquidations'][annee] += total
        else:
            print("  └─ Aucune")

        # Ordonnancements
        print(f"\n📊 ORDONNANCEMENTS:")
        cursor.execute("""
            SELECT YEAR(Date) as annee, COUNT(*) as total
            FROM Ordonnancement WHERE Date IS NOT NULL
            GROUP BY YEAR(Date) ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,}")
                sql_data['ordonnancements'][annee] += total
        else:
            print("  └─ Aucun")

        conn.close()

    except Exception as e:
        print(f"❌ Erreur: {e}")

print(f"\n{'=' * 130}")
print(" TOTAUX SQL SERVER ".center(130, "="))
print(f"{'=' * 130}\n")

print(f"📝 Notes DG:        {sum(sql_data['notes'].values()):>6,} (sur {len(sql_data['notes'])} années)")
print(f"💰 Engagements:     {sum(sql_data['engagements'].values()):>6,} (sur {len(sql_data['engagements'])} années)")
print(f"📋 Liquidations:    {sum(sql_data['liquidations'].values()):>6,} (sur {len(sql_data['liquidations'])} années)")
print(f"📊 Ordonnancements: {sum(sql_data['ordonnancements'].values()):>6,} (sur {len(sql_data['ordonnancements'])} années)")

# =============================================================================
# ÉTAPE 2: AUDIT SUPABASE
# =============================================================================
print(f"\n\n{'=' * 130}")
print(" ÉTAPE 2: AUDIT SUPABASE ".center(130, "="))
print(f"{'=' * 130}")

spb_data = {
    'notes': defaultdict(int),
    'engagements': defaultdict(int),
    'liquidations': defaultdict(int),
    'ordonnancements': defaultdict(int),
}

try:
    # Notes SEF
    print(f"\n📝 NOTES SEF (notes_sef):")
    response = supabase.table('notes_sef').select('date_note, exercice').execute()
    notes = response.data
    print(f"  Total: {len(notes):,}")
    for note in notes:
        # Priorité: exercice > date_note
        annee = None
        if note.get('exercice'):
            annee = note['exercice']
        elif note.get('date_note'):
            try:
                annee = int(note['date_note'][:4])
            except:
                pass
        if annee:
            spb_data['notes'][annee] += 1

    for annee in sorted(spb_data['notes'].keys()):
        print(f"  ├─ {annee}: {spb_data['notes'][annee]:>6,}")

    # Engagements
    print(f"\n💰 ENGAGEMENTS (budget_engagements):")
    response = supabase.table('budget_engagements').select('date_engagement, exercice').execute()
    engs = response.data
    print(f"  Total: {len(engs):,}")
    for eng in engs:
        annee = None
        if eng.get('exercice'):
            annee = eng['exercice']
        elif eng.get('date_engagement'):
            try:
                annee = int(eng['date_engagement'][:4])
            except:
                pass
        if annee:
            spb_data['engagements'][annee] += 1

    for annee in sorted(spb_data['engagements'].keys()):
        print(f"  ├─ {annee}: {spb_data['engagements'][annee]:>6,}")

    # Liquidations
    print(f"\n📋 LIQUIDATIONS (budget_liquidations):")
    response = supabase.table('budget_liquidations').select('date_liquidation, exercice').execute()
    liqs = response.data
    print(f"  Total: {len(liqs):,}")
    for liq in liqs:
        annee = None
        if liq.get('exercice'):
            annee = liq['exercice']
        elif liq.get('date_liquidation'):
            try:
                annee = int(liq['date_liquidation'][:4])
            except:
                pass
        if annee:
            spb_data['liquidations'][annee] += 1

    for annee in sorted(spb_data['liquidations'].keys()):
        print(f"  ├─ {annee}: {spb_data['liquidations'][annee]:>6,}")

    # Ordonnancements
    print(f"\n📊 ORDONNANCEMENTS (ordonnancements):")
    response = supabase.table('ordonnancements').select('date_ordonnancement, exercice').execute()
    ords = response.data
    print(f"  Total: {len(ords):,}")
    for ord in ords:
        annee = None
        if ord.get('exercice'):
            annee = ord['exercice']
        elif ord.get('date_ordonnancement'):
            try:
                annee = int(ord['date_ordonnancement'][:4])
            except:
                pass
        if annee:
            spb_data['ordonnancements'][annee] += 1

    for annee in sorted(spb_data['ordonnancements'].keys()):
        print(f"  ├─ {annee}: {spb_data['ordonnancements'][annee]:>6,}")

except Exception as e:
    print(f"❌ Erreur Supabase: {e}")

print(f"\n{'=' * 130}")
print(" TOTAUX SUPABASE ".center(130, "="))
print(f"{'=' * 130}\n")

print(f"📝 Notes SEF:       {sum(spb_data['notes'].values()):>6,} (sur {len(spb_data['notes'])} années)")
print(f"💰 Engagements:     {sum(spb_data['engagements'].values()):>6,} (sur {len(spb_data['engagements'])} années)")
print(f"📋 Liquidations:    {sum(spb_data['liquidations'].values()):>6,} (sur {len(spb_data['liquidations'])} années)")
print(f"📊 Ordonnancements: {sum(spb_data['ordonnancements'].values()):>6,} (sur {len(spb_data['ordonnancements'])} années)")

# =============================================================================
# ÉTAPE 3: COMPARAISON PAR ANNÉE
# =============================================================================
print(f"\n\n{'=' * 130}")
print(" ÉTAPE 3: COMPARAISON DÉTAILLÉE PAR ANNÉE ".center(130, "="))
print(f"{'=' * 130}")

def compare_table(name, sql_dict, spb_dict):
    print(f"\n{'─' * 130}")
    print(f"📊 {name}")
    print(f"{'─' * 130}")

    all_years = sorted(set(list(sql_dict.keys()) + list(spb_dict.keys())))

    print(f"{'Année':<12} | {'SQL Server':>18} | {'Supabase':>18} | {'Différence':>18} | {'Taux':>10} | {'Statut':<20}")
    print(f"{'─' * 12}─┼─{'─' * 18}─┼─{'─' * 18}─┼─{'─' * 18}─┼─{'─' * 10}─┼─{'─' * 20}")

    total_sql = 0
    total_spb = 0

    for annee in all_years:
        sql_count = sql_dict.get(annee, 0)
        spb_count = spb_dict.get(annee, 0)
        diff = spb_count - sql_count

        total_sql += sql_count
        total_spb += spb_count

        if sql_count > 0:
            taux = (spb_count / sql_count * 100)
            taux_str = f"{taux:.1f}%"
        else:
            taux_str = "N/A"

        if diff == 0:
            statut = "✅ COMPLET"
        elif diff > 0:
            statut = f"⚠️  +{diff} en trop"
        else:
            statut = f"❌ MANQUE {abs(diff)}"

        print(f"{annee:<12} | {sql_count:>18,} | {spb_count:>18,} | {diff:>+18,} | {taux_str:>10} | {statut:<20}")

    print(f"{'─' * 12}─┼─{'─' * 18}─┼─{'─' * 18}─┼─{'─' * 18}─┼─{'─' * 10}─┼─{'─' * 20}")

    total_diff = total_spb - total_sql
    if total_sql > 0:
        total_taux = (total_spb / total_sql * 100)
        total_taux_str = f"{total_taux:.1f}%"
    else:
        total_taux_str = "N/A"

    if total_diff == 0:
        total_statut = "✅ COMPLET"
    elif total_diff > 0:
        total_statut = f"⚠️  +{total_diff}"
    else:
        total_statut = f"❌ -{abs(total_diff)}"

    print(f"{'TOTAL':<12} | {total_sql:>18,} | {total_spb:>18,} | {total_diff:>+18,} | {total_taux_str:>10} | {total_statut:<20}")

    return total_sql, total_spb, total_diff

notes_sql, notes_spb, notes_diff = compare_table(
    "NOTES SEF/DG",
    sql_data['notes'],
    spb_data['notes']
)

eng_sql, eng_spb, eng_diff = compare_table(
    "ENGAGEMENTS",
    sql_data['engagements'],
    spb_data['engagements']
)

liq_sql, liq_spb, liq_diff = compare_table(
    "LIQUIDATIONS",
    sql_data['liquidations'],
    spb_data['liquidations']
)

ord_sql, ord_spb, ord_diff = compare_table(
    "ORDONNANCEMENTS",
    sql_data['ordonnancements'],
    spb_data['ordonnancements']
)

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
print(f"\n\n{'=' * 130}")
print(" RÉSUMÉ EXÉCUTIF ".center(130, "="))
print(f"{'=' * 130}\n")

print(f"{'Type':<30} | {'SQL Server':>18} | {'Supabase':>18} | {'Écart':>18} | {'Taux':>10} | {'Diagnostic':<25}")
print(f"{'─' * 30}─┼─{'─' * 18}─┼─{'─' * 18}─┼─{'─' * 18}─┼─{'─' * 10}─┼─{'─' * 25}")

def print_summary(name, sql_count, spb_count, diff):
    if sql_count > 0:
        taux = (spb_count / sql_count * 100)
        taux_str = f"{taux:.1f}%"

        if taux >= 100:
            diagnostic = f"✅ Complet ({'+' + str(diff) if diff > 0 else 'OK'})"
        elif taux >= 90:
            diagnostic = f"⚠️  Presque complet (-{abs(diff)})"
        elif taux >= 50:
            diagnostic = f"❌ Incomplet (-{abs(diff)})"
        else:
            diagnostic = f"❌❌ Très incomplet (-{abs(diff)})"
    else:
        taux_str = "N/A"
        diagnostic = "N/A"

    print(f"{name:<30} | {sql_count:>18,} | {spb_count:>18,} | {diff:>+18,} | {taux_str:>10} | {diagnostic:<25}")

print_summary("Notes SEF/DG", notes_sql, notes_spb, notes_diff)
print_summary("Engagements", eng_sql, eng_spb, eng_diff)
print_summary("Liquidations", liq_sql, liq_spb, liq_diff)
print_summary("Ordonnancements", ord_sql, ord_spb, ord_diff)

print(f"\n{'=' * 130}")

# RECOMMANDATIONS
print(f"\n{'=' * 130}")
print(" RECOMMANDATIONS ".center(130, "="))
print(f"{'=' * 130}\n")

missing = {
    'Notes': notes_sql - notes_spb,
    'Engagements': eng_sql - eng_spb,
    'Liquidations': liq_sql - liq_spb,
    'Ordonnancements': ord_sql - ord_spb
}

for name, count in missing.items():
    if count > 0:
        print(f"❌ {name}: Il manque {count:,} enregistrements dans Supabase")
    elif count < 0:
        print(f"⚠️  {name}: Il y a {abs(count):,} enregistrements EN TROP dans Supabase (doublons?)")
    else:
        print(f"✅ {name}: Migration complète")

print(f"\n{'=' * 130}")
print(" FIN DU RAPPORT ".center(130, "="))
print(f"{'=' * 130}")
