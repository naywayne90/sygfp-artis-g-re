#!/usr/bin/env python3
"""
AUDIT FINAL COMPLET - SYGFP
Vérification des données migrées dans Supabase
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import pymssql
from supabase import create_client
from datetime import datetime

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print(" AUDIT FINAL COMPLET - SYGFP ".center(100, "="))
print("=" * 100)
print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# ============================================
# 1. COMPTAGE PAR EXERCICE - SQL SERVER
# ============================================
print("🔄 ÉTAPE 1/3 : Comptage SQL Server par exercice...")
print("=" * 100)

databases = [
    ('eARTI_DB2', '2021-2023'),
    ('eARTIDB_2025', '2024-2025'),
    ('eARTIDB_2026', '2026')
]

sql_counts = {
    'notes': {},
    'engagements': {},
    'liquidations': {},
    'ordonnancements': {}
}

for db_name, periode in databases:
    try:
        conn = pymssql.connect(
            server='192.168.0.8',
            port=1433,
            user='ARTI\\admin',
            password='tranSPort2021!',
            database=db_name,
            timeout=30
        )
        cursor = conn.cursor(as_dict=True)

        # Notes par exercice
        cursor.execute("SELECT YEAR(DateCreation) as exercice, COUNT(*) as total FROM NoteDG WHERE DateCreation IS NOT NULL GROUP BY YEAR(DateCreation)")
        for row in cursor.fetchall():
            sql_counts['notes'][row['exercice']] = sql_counts['notes'].get(row['exercice'], 0) + row['total']

        # Engagements par exercice
        cursor.execute("SELECT YEAR(DateCreation) as exercice, COUNT(*) as total FROM EngagementAnterieur WHERE DateCreation IS NOT NULL GROUP BY YEAR(DateCreation)")
        for row in cursor.fetchall():
            sql_counts['engagements'][row['exercice']] = sql_counts['engagements'].get(row['exercice'], 0) + row['total']

        # Liquidations par exercice
        cursor.execute("SELECT CAST(Exercice as INT) as exercice, COUNT(*) as total FROM Liquidation WHERE Exercice IS NOT NULL GROUP BY CAST(Exercice as INT)")
        for row in cursor.fetchall():
            sql_counts['liquidations'][row['exercice']] = sql_counts['liquidations'].get(row['exercice'], 0) + row['total']

        # Ordonnancements par exercice
        cursor.execute("SELECT CAST(Exercice as INT) as exercice, COUNT(*) as total FROM Ordonnancement WHERE Exercice IS NOT NULL GROUP BY CAST(Exercice as INT)")
        for row in cursor.fetchall():
            sql_counts['ordonnancements'][row['exercice']] = sql_counts['ordonnancements'].get(row['exercice'], 0) + row['total']

        cursor.close()
        conn.close()
        print(f"  ✓ {db_name} ({periode})")

    except Exception as e:
        print(f"  ❌ Erreur {db_name}: {e}")

print("\n📊 SQL Server - Comptage par exercice:")
exercices = sorted(set(list(sql_counts['notes'].keys()) + list(sql_counts['engagements'].keys()) +
                      list(sql_counts['liquidations'].keys()) + list(sql_counts['ordonnancements'].keys())))

print(f"\n{'Exercice':<12} {'Notes':<12} {'Engagements':<15} {'Liquidations':<15} {'Ordonnancements':<15}")
print("-" * 70)
for ex in exercices:
    print(f"{ex:<12} {sql_counts['notes'].get(ex, 0):<12} {sql_counts['engagements'].get(ex, 0):<15} "
          f"{sql_counts['liquidations'].get(ex, 0):<15} {sql_counts['ordonnancements'].get(ex, 0):<15}")

total_sql = (sum(sql_counts['notes'].values()) + sum(sql_counts['engagements'].values()) +
             sum(sql_counts['liquidations'].values()) + sum(sql_counts['ordonnancements'].values()))
print("-" * 70)
print(f"{'TOTAL':<12} {sum(sql_counts['notes'].values()):<12} {sum(sql_counts['engagements'].values()):<15} "
      f"{sum(sql_counts['liquidations'].values()):<15} {sum(sql_counts['ordonnancements'].values()):<15}")
print(f"\n✅ TOTAL SQL Server: {total_sql:,} enregistrements")

# ============================================
# 2. COMPTAGE PAR EXERCICE - SUPABASE
# ============================================
print("\n" + "=" * 100)
print("🔄 ÉTAPE 2/3 : Comptage Supabase par exercice...")
print("=" * 100)

supabase_counts = {
    'notes': {},
    'engagements': {},
    'liquidations': {},
    'ordonnancements': {}
}

for ex in exercices:
    # Notes
    result = supabase.table('notes_sef').select('*', count='exact').eq('exercice', ex).execute()
    supabase_counts['notes'][ex] = result.count

    # Engagements
    result = supabase.table('budget_engagements').select('*', count='exact').eq('exercice', ex).execute()
    supabase_counts['engagements'][ex] = result.count

    # Liquidations
    result = supabase.table('budget_liquidations').select('*', count='exact').eq('exercice', ex).execute()
    supabase_counts['liquidations'][ex] = result.count

    # Ordonnancements
    result = supabase.table('ordonnancements').select('*', count='exact').eq('exercice', ex).execute()
    supabase_counts['ordonnancements'][ex] = result.count

print(f"\n{'Exercice':<12} {'Notes':<12} {'Engagements':<15} {'Liquidations':<15} {'Ordonnancements':<15}")
print("-" * 70)
for ex in exercices:
    print(f"{ex:<12} {supabase_counts['notes'].get(ex, 0):<12} {supabase_counts['engagements'].get(ex, 0):<15} "
          f"{supabase_counts['liquidations'].get(ex, 0):<15} {supabase_counts['ordonnancements'].get(ex, 0):<15}")

total_supabase = (sum(supabase_counts['notes'].values()) + sum(supabase_counts['engagements'].values()) +
                  sum(supabase_counts['liquidations'].values()) + sum(supabase_counts['ordonnancements'].values()))
print("-" * 70)
print(f"{'TOTAL':<12} {sum(supabase_counts['notes'].values()):<12} {sum(supabase_counts['engagements'].values()):<15} "
      f"{sum(supabase_counts['liquidations'].values()):<15} {sum(supabase_counts['ordonnancements'].values()):<15}")
print(f"\n✅ TOTAL Supabase: {total_supabase:,} enregistrements")

# ============================================
# 3. COMPARAISON ET ÉCARTS
# ============================================
print("\n" + "=" * 100)
print("🔄 ÉTAPE 3/3 : Analyse des écarts...")
print("=" * 100)

print(f"\n{'Exercice':<12} {'Type':<15} {'SQL Server':<12} {'Supabase':<12} {'Écart':<10} {'Taux':<10}")
print("-" * 75)

total_ecarts = 0
for ex in exercices:
    for table_name, label in [('notes', 'Notes'), ('engagements', 'Engagements'),
                               ('liquidations', 'Liquidations'), ('ordonnancements', 'Ordonnancements')]:
        sql_val = sql_counts[table_name].get(ex, 0)
        supa_val = supabase_counts[table_name].get(ex, 0)
        ecart = supa_val - sql_val
        total_ecarts += abs(ecart)
        taux = (supa_val / sql_val * 100) if sql_val > 0 else 0

        status = "✅" if ecart >= 0 else "⚠️"
        print(f"{ex:<12} {label:<15} {sql_val:<12} {supa_val:<12} {ecart:+<10} {taux:.1f}% {status}")

print("-" * 75)
print(f"\n📊 ÉCART TOTAL: {total_ecarts:,} enregistrements")
print(f"📈 SQL Server:  {total_sql:,}")
print(f"📈 Supabase:    {total_supabase:,}")
print(f"📈 Différence:  {total_supabase - total_sql:+,} ({(total_supabase/total_sql*100):.1f}%)")

# ============================================
# RÉSUMÉ FINAL
# ============================================
print("\n" + "=" * 100)
print(" RÉSUMÉ FINAL ".center(100, "="))
print("=" * 100)

print(f"""
✅ DONNÉES SQL SERVER:
   - Notes SEF:        {sum(sql_counts['notes'].values()):,}
   - Engagements:      {sum(sql_counts['engagements'].values()):,}
   - Liquidations:     {sum(sql_counts['liquidations'].values()):,}
   - Ordonnancements:  {sum(sql_counts['ordonnancements'].values()):,}
   TOTAL:              {total_sql:,}

✅ DONNÉES SUPABASE:
   - Notes SEF:        {sum(supabase_counts['notes'].values()):,}
   - Engagements:      {sum(supabase_counts['engagements'].values()):,}
   - Liquidations:     {sum(supabase_counts['liquidations'].values()):,}
   - Ordonnancements:  {sum(supabase_counts['ordonnancements'].values()):,}
   TOTAL:              {total_supabase:,}

📊 ANALYSE:
   - Supabase contient {total_supabase - total_sql:+,} enregistrements de plus que SQL Server
   - Cela inclut les données migrées + données existantes avant migration
   - Taux de couverture: {(total_supabase/total_sql*100):.1f}%
""")

print("🎉 AUDIT TERMINÉ!")
print("=" * 100)
