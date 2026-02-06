#!/usr/bin/env python3
"""
Script d'audit complet de la migration SYGFP
Compare les données SQL Server vs Supabase par année
"""

import pymssql
import os
from supabase import create_client, Client
from datetime import datetime
from collections import defaultdict

# Connexion Supabase
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL', 'https://tjagvgqthlibdpvztvaf.supabase.co')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MTYwNzEsImV4cCI6MjA1MTQ5MjA3MX0.YGW2v3r-wIxcH_6TxyJlU1fqQiB1KPZJi3A8wLuN7xM')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 100)
print(" AUDIT MIGRATION SYGFP - COMPARAISON SQL SERVER vs SUPABASE ".center(100, "="))
print("=" * 100)
print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 100)

# =============================================================================
# PARTIE 1: SQL SERVER
# =============================================================================
print("\n" + "=" * 100)
print(" PARTIE 1: AUDIT SQL SERVER ".center(100, "="))
print("=" * 100)

databases = [
    ('eARTI_DB2', '2021-2023'),
    ('eARTIDB_2025', '2024-2025'),
    ('eARTIDB_2026', '2026')
]

sqlserver_data = {
    'notes_sef': defaultdict(int),
    'engagements': defaultdict(int),
    'liquidations': defaultdict(int),
    'ordonnancements': defaultdict(int)
}

for db, periode in databases:
    print(f"\n{'─' * 100}")
    print(f"📦 BASE: {db} (Période: {periode})")
    print(f"{'─' * 100}")

    try:
        conn = pymssql.connect(
            server='192.168.0.8',
            port=1433,
            user='ARTI\\admin',
            password='tranSPort2021!',
            database=db,
            timeout=30
        )
        cursor = conn.cursor()

        # Notes SEF
        print(f"\n📝 NOTES SEF (ARTI10):")
        cursor.execute("""
            SELECT YEAR(dateNote) as annee, COUNT(*) as total
            FROM ARTI10
            WHERE dateNote IS NOT NULL
            GROUP BY YEAR(dateNote)
            ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,} notes")
                sqlserver_data['notes_sef'][annee] += total
            print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
        else:
            print("  └─ Aucune donnée")

        # Engagements
        print(f"\n💰 ENGAGEMENTS (ARTI20):")
        cursor.execute("""
            SELECT YEAR(dateEngagement) as annee, COUNT(*) as total
            FROM ARTI20
            WHERE dateEngagement IS NOT NULL
            GROUP BY YEAR(dateEngagement)
            ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,} engagements")
                sqlserver_data['engagements'][annee] += total
            print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
        else:
            print("  └─ Aucune donnée")

        # Liquidations
        print(f"\n📋 LIQUIDATIONS (ARTI30):")
        cursor.execute("""
            SELECT YEAR(dateLiquidation) as annee, COUNT(*) as total
            FROM ARTI30
            WHERE dateLiquidation IS NOT NULL
            GROUP BY YEAR(dateLiquidation)
            ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,} liquidations")
                sqlserver_data['liquidations'][annee] += total
            print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
        else:
            print("  └─ Aucune donnée")

        # Ordonnancements
        print(f"\n📊 ORDONNANCEMENTS (ARTI40):")
        cursor.execute("""
            SELECT YEAR(dateOrdonnancement) as annee, COUNT(*) as total
            FROM ARTI40
            WHERE dateOrdonnancement IS NOT NULL
            GROUP BY YEAR(dateOrdonnancement)
            ORDER BY annee
        """)
        rows = cursor.fetchall()
        if rows:
            for annee, total in rows:
                print(f"  ├─ {annee}: {total:>6,} ordonnancements")
                sqlserver_data['ordonnancements'][annee] += total
            print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
        else:
            print("  └─ Aucune donnée")

        conn.close()

    except Exception as e:
        print(f"❌ Erreur: {e}")

# Totaux SQL Server
print(f"\n{'=' * 100}")
print(" TOTAUX SQL SERVER (TOUTES BASES) ".center(100, "="))
print(f"{'=' * 100}")

print("\n📝 NOTES SEF par année:")
for annee in sorted(sqlserver_data['notes_sef'].keys()):
    print(f"  ├─ {annee}: {sqlserver_data['notes_sef'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sqlserver_data['notes_sef'].values()):>6,}")

print("\n💰 ENGAGEMENTS par année:")
for annee in sorted(sqlserver_data['engagements'].keys()):
    print(f"  ├─ {annee}: {sqlserver_data['engagements'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sqlserver_data['engagements'].values()):>6,}")

print("\n📋 LIQUIDATIONS par année:")
for annee in sorted(sqlserver_data['liquidations'].keys()):
    print(f"  ├─ {annee}: {sqlserver_data['liquidations'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sqlserver_data['liquidations'].values()):>6,}")

print("\n📊 ORDONNANCEMENTS par année:")
for annee in sorted(sqlserver_data['ordonnancements'].keys()):
    print(f"  ├─ {annee}: {sqlserver_data['ordonnancements'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sqlserver_data['ordonnancements'].values()):>6,}")

# =============================================================================
# PARTIE 2: SUPABASE
# =============================================================================
print("\n\n" + "=" * 100)
print(" PARTIE 2: AUDIT SUPABASE ".center(100, "="))
print("=" * 100)

supabase_data = {
    'notes_sef': defaultdict(int),
    'engagements': defaultdict(int),
    'liquidations': defaultdict(int),
    'ordonnancements': defaultdict(int)
}

try:
    # Notes SEF
    print(f"\n📝 NOTES SEF (notes_sef):")
    response = supabase.table('notes_sef').select('date_note').execute()
    notes = response.data
    print(f"  Total récupéré: {len(notes):,}")

    for note in notes:
        if note.get('date_note'):
            try:
                annee = int(note['date_note'][:4])
                supabase_data['notes_sef'][annee] += 1
            except:
                pass

    for annee in sorted(supabase_data['notes_sef'].keys()):
        print(f"  ├─ {annee}: {supabase_data['notes_sef'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(supabase_data['notes_sef'].values()):>6,}")

    # Engagements
    print(f"\n💰 ENGAGEMENTS (engagements):")
    response = supabase.table('engagements').select('date_engagement').execute()
    engagements = response.data
    print(f"  Total récupéré: {len(engagements):,}")

    for eng in engagements:
        if eng.get('date_engagement'):
            try:
                annee = int(eng['date_engagement'][:4])
                supabase_data['engagements'][annee] += 1
            except:
                pass

    for annee in sorted(supabase_data['engagements'].keys()):
        print(f"  ├─ {annee}: {supabase_data['engagements'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(supabase_data['engagements'].values()):>6,}")

    # Liquidations
    print(f"\n📋 LIQUIDATIONS (liquidations):")
    response = supabase.table('liquidations').select('date_liquidation').execute()
    liquidations = response.data
    print(f"  Total récupéré: {len(liquidations):,}")

    for liq in liquidations:
        if liq.get('date_liquidation'):
            try:
                annee = int(liq['date_liquidation'][:4])
                supabase_data['liquidations'][annee] += 1
            except:
                pass

    for annee in sorted(supabase_data['liquidations'].keys()):
        print(f"  ├─ {annee}: {supabase_data['liquidations'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(supabase_data['liquidations'].values()):>6,}")

    # Ordonnancements
    print(f"\n📊 ORDONNANCEMENTS (ordonnancements):")
    response = supabase.table('ordonnancements').select('date_ordonnancement').execute()
    ordonnancements = response.data
    print(f"  Total récupéré: {len(ordonnancements):,}")

    for ord in ordonnancements:
        if ord.get('date_ordonnancement'):
            try:
                annee = int(ord['date_ordonnancement'][:4])
                supabase_data['ordonnancements'][annee] += 1
            except:
                pass

    for annee in sorted(supabase_data['ordonnancements'].keys()):
        print(f"  ├─ {annee}: {supabase_data['ordonnancements'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(supabase_data['ordonnancements'].values()):>6,}")

except Exception as e:
    print(f"❌ Erreur Supabase: {e}")

# =============================================================================
# PARTIE 3: COMPARAISON
# =============================================================================
print("\n\n" + "=" * 100)
print(" PARTIE 3: COMPARAISON SQL SERVER vs SUPABASE ".center(100, "="))
print("=" * 100)

def compare_data(name, sql_data, spb_data):
    print(f"\n{'─' * 100}")
    print(f"📊 {name}")
    print(f"{'─' * 100}")

    all_years = sorted(set(list(sql_data.keys()) + list(spb_data.keys())))

    print(f"{'Année':<8} | {'SQL Server':>12} | {'Supabase':>12} | {'Différence':>12} | {'Statut':<10}")
    print(f"{'─' * 8}─┼─{'─' * 12}─┼─{'─' * 12}─┼─{'─' * 12}─┼─{'─' * 10}")

    total_sql = 0
    total_spb = 0

    for annee in all_years:
        sql_count = sql_data.get(annee, 0)
        spb_count = spb_data.get(annee, 0)
        diff = spb_count - sql_count

        total_sql += sql_count
        total_spb += spb_count

        if diff == 0:
            statut = "✅ OK"
        elif diff > 0:
            statut = f"⚠️  +{diff}"
        else:
            statut = f"❌ {diff}"

        print(f"{annee:<8} | {sql_count:>12,} | {spb_count:>12,} | {diff:>+12,} | {statut:<10}")

    print(f"{'─' * 8}─┼─{'─' * 12}─┼─{'─' * 12}─┼─{'─' * 12}─┼─{'─' * 10}")

    total_diff = total_spb - total_sql
    if total_diff == 0:
        total_statut = "✅ OK"
    elif total_diff > 0:
        total_statut = f"⚠️  +{total_diff}"
    else:
        total_statut = f"❌ {total_diff}"

    print(f"{'TOTAL':<8} | {total_sql:>12,} | {total_spb:>12,} | {total_diff:>+12,} | {total_statut:<10}")

    return total_sql, total_spb, total_diff

notes_sql, notes_spb, notes_diff = compare_data(
    "NOTES SEF",
    sqlserver_data['notes_sef'],
    supabase_data['notes_sef']
)

eng_sql, eng_spb, eng_diff = compare_data(
    "ENGAGEMENTS",
    sqlserver_data['engagements'],
    supabase_data['engagements']
)

liq_sql, liq_spb, liq_diff = compare_data(
    "LIQUIDATIONS",
    sqlserver_data['liquidations'],
    supabase_data['liquidations']
)

ord_sql, ord_spb, ord_diff = compare_data(
    "ORDONNANCEMENTS",
    sqlserver_data['ordonnancements'],
    supabase_data['ordonnancements']
)

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
print("\n\n" + "=" * 100)
print(" RÉSUMÉ FINAL ".center(100, "="))
print("=" * 100)

print(f"\n{'Type':<20} | {'SQL Server':>12} | {'Supabase':>12} | {'Différence':>12} | {'Taux':>8}")
print(f"{'─' * 20}─┼─{'─' * 12}─┼─{'─' * 12}─┼─{'─' * 12}─┼─{'─' * 8}")

def print_summary(name, sql_count, spb_count, diff):
    if sql_count > 0:
        taux = (spb_count / sql_count * 100)
        taux_str = f"{taux:.1f}%"
    else:
        taux_str = "N/A"

    print(f"{name:<20} | {sql_count:>12,} | {spb_count:>12,} | {diff:>+12,} | {taux_str:>8}")

print_summary("Notes SEF", notes_sql, notes_spb, notes_diff)
print_summary("Engagements", eng_sql, eng_spb, eng_diff)
print_summary("Liquidations", liq_sql, liq_spb, liq_diff)
print_summary("Ordonnancements", ord_sql, ord_spb, ord_diff)

print("\n" + "=" * 100)
print(" FIN DE L'AUDIT ".center(100, "="))
print("=" * 100)
