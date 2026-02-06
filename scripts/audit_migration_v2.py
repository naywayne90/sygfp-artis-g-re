#!/usr/bin/env python3
"""
AUDIT MIGRATION SYGFP - Version 2
Compare les données SQL Server vs Supabase PAR ANNÉE
Utilise les VRAIS noms de tables
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import pymssql
from supabase import create_client
from collections import defaultdict
from datetime import datetime

# Configuration Supabase
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 120)
print(" AUDIT MIGRATION SYGFP - SQL SERVER vs SUPABASE (PAR ANNÉE) ".center(120, "="))
print("=" * 120)
print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

# =============================================================================
# PARTIE 1: AUDIT SQL SERVER
# =============================================================================
print("=" * 120)
print(" PARTIE 1: AUDIT SQL SERVER (3 bases) ".center(120, "="))
print("=" * 120)

databases = [
    ('eARTI_DB2', '2021-2023'),
    ('eARTIDB_2025', '2024-2025'),
    ('eARTIDB_2026', '2026')
]

# Stockage des données par année
sql_data = {
    'liquidations': defaultdict(int),
    'ordonnancements': defaultdict(int),
    'notes_dg': defaultdict(int),
    'engagements': defaultdict(int),
}

for db_name, periode in databases:
    print(f"\n{'─' * 120}")
    print(f"📦 BASE: {db_name} (Période: {periode})")
    print(f"{'─' * 120}")

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

        # 1. Liquidations (table Liquidation)
        print(f"\n📋 LIQUIDATIONS (Liquidation):")
        try:
            cursor.execute("""
                SELECT
                    YEAR(Date) as annee,
                    COUNT(*) as total
                FROM Liquidation
                WHERE Date IS NOT NULL
                GROUP BY YEAR(Date)
                ORDER BY annee
            """)
            rows = cursor.fetchall()
            if rows:
                for annee, total in rows:
                    print(f"  ├─ {annee}: {total:>6,} liquidations")
                    sql_data['liquidations'][annee] += total
                print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
            else:
                print("  └─ Aucune donnée")
        except Exception as e:
            print(f"  └─ Erreur: {e}")

        # 2. Ordonnancements (table Ordonnancement)
        print(f"\n📊 ORDONNANCEMENTS (Ordonnancement):")
        try:
            cursor.execute("""
                SELECT
                    YEAR(Date) as annee,
                    COUNT(*) as total
                FROM Ordonnancement
                WHERE Date IS NOT NULL
                GROUP BY YEAR(Date)
                ORDER BY annee
            """)
            rows = cursor.fetchall()
            if rows:
                for annee, total in rows:
                    print(f"  ├─ {annee}: {total:>6,} ordonnancements")
                    sql_data['ordonnancements'][annee] += total
                print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
            else:
                print("  └─ Aucune donnée")
        except Exception as e:
            print(f"  └─ Erreur: {e}")

        # 3. Notes DG (table NoteDG)
        print(f"\n📝 NOTES DG (NoteDG):")
        try:
            cursor.execute("""
                SELECT
                    YEAR(DateCreation) as annee,
                    COUNT(*) as total
                FROM NoteDG
                WHERE DateCreation IS NOT NULL
                GROUP BY YEAR(DateCreation)
                ORDER BY annee
            """)
            rows = cursor.fetchall()
            if rows:
                for annee, total in rows:
                    print(f"  ├─ {annee}: {total:>6,} notes")
                    sql_data['notes_dg'][annee] += total
                print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
            else:
                print("  └─ Aucune donnée")
        except Exception as e:
            print(f"  └─ Erreur: {e}")

        # 4. Engagements (table EngagementAnterieur)
        print(f"\n💰 ENGAGEMENTS (EngagementAnterieur):")
        try:
            cursor.execute("""
                SELECT
                    YEAR(DateCreation) as annee,
                    COUNT(*) as total
                FROM EngagementAnterieur
                WHERE DateCreation IS NOT NULL
                GROUP BY YEAR(DateCreation)
                ORDER BY annee
            """)
            rows = cursor.fetchall()
            if rows:
                for annee, total in rows:
                    print(f"  ├─ {annee}: {total:>6,} engagements")
                    sql_data['engagements'][annee] += total
                print(f"  └─ TOTAL: {sum(r[1] for r in rows):>6,}")
            else:
                print("  └─ Aucune donnée")
        except Exception as e:
            print(f"  └─ Erreur: {e}")

        conn.close()

    except Exception as e:
        print(f"❌ Erreur connexion: {e}")

# Totaux SQL Server
print(f"\n{'=' * 120}")
print(" TOTAUX SQL SERVER (TOUTES BASES) ".center(120, "="))
print(f"{'=' * 120}")

print("\n📋 LIQUIDATIONS par année:")
for annee in sorted(sql_data['liquidations'].keys()):
    print(f"  ├─ {annee}: {sql_data['liquidations'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sql_data['liquidations'].values()):>6,}")

print("\n📊 ORDONNANCEMENTS par année:")
for annee in sorted(sql_data['ordonnancements'].keys()):
    print(f"  ├─ {annee}: {sql_data['ordonnancements'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sql_data['ordonnancements'].values()):>6,}")

print("\n📝 NOTES DG par année:")
for annee in sorted(sql_data['notes_dg'].keys()):
    print(f"  ├─ {annee}: {sql_data['notes_dg'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sql_data['notes_dg'].values()):>6,}")

print("\n💰 ENGAGEMENTS par année:")
for annee in sorted(sql_data['engagements'].keys()):
    print(f"  ├─ {annee}: {sql_data['engagements'][annee]:>6,}")
print(f"  └─ TOTAL: {sum(sql_data['engagements'].values()):>6,}")

# =============================================================================
# PARTIE 2: AUDIT SUPABASE
# =============================================================================
print(f"\n\n{'=' * 120}")
print(" PARTIE 2: AUDIT SUPABASE ".center(120, "="))
print(f"{'=' * 120}")

spb_data = {
    'liquidations': defaultdict(int),
    'ordonnancements': defaultdict(int),
    'notes_sef': defaultdict(int),
    'engagements': defaultdict(int),
}

try:
    # 1. Liquidations
    print(f"\n📋 LIQUIDATIONS (liquidations):")
    response = supabase.table('liquidations').select('date_liquidation').execute()
    liqs = response.data
    print(f"  Total récupéré: {len(liqs):,}")

    for liq in liqs:
        if liq.get('date_liquidation'):
            try:
                annee = int(liq['date_liquidation'][:4])
                spb_data['liquidations'][annee] += 1
            except:
                pass

    for annee in sorted(spb_data['liquidations'].keys()):
        print(f"  ├─ {annee}: {spb_data['liquidations'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(spb_data['liquidations'].values()):>6,}")

    # 2. Ordonnancements
    print(f"\n📊 ORDONNANCEMENTS (ordonnancements):")
    response = supabase.table('ordonnancements').select('date_ordonnancement').execute()
    ords = response.data
    print(f"  Total récupéré: {len(ords):,}")

    for ord in ords:
        if ord.get('date_ordonnancement'):
            try:
                annee = int(ord['date_ordonnancement'][:4])
                spb_data['ordonnancements'][annee] += 1
            except:
                pass

    for annee in sorted(spb_data['ordonnancements'].keys()):
        print(f"  ├─ {annee}: {spb_data['ordonnancements'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(spb_data['ordonnancements'].values()):>6,}")

    # 3. Notes SEF
    print(f"\n📝 NOTES SEF (notes_sef):")
    response = supabase.table('notes_sef').select('date_note').execute()
    notes = response.data
    print(f"  Total récupéré: {len(notes):,}")

    for note in notes:
        if note.get('date_note'):
            try:
                annee = int(note['date_note'][:4])
                spb_data['notes_sef'][annee] += 1
            except:
                pass

    for annee in sorted(spb_data['notes_sef'].keys()):
        print(f"  ├─ {annee}: {spb_data['notes_sef'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(spb_data['notes_sef'].values()):>6,}")

    # 4. Engagements
    print(f"\n💰 ENGAGEMENTS (engagements):")
    response = supabase.table('engagements').select('date_engagement').execute()
    engs = response.data
    print(f"  Total récupéré: {len(engs):,}")

    for eng in engs:
        if eng.get('date_engagement'):
            try:
                annee = int(eng['date_engagement'][:4])
                spb_data['engagements'][annee] += 1
            except:
                pass

    for annee in sorted(spb_data['engagements'].keys()):
        print(f"  ├─ {annee}: {spb_data['engagements'][annee]:>6,}")
    print(f"  └─ TOTAL: {sum(spb_data['engagements'].values()):>6,}")

except Exception as e:
    print(f"❌ Erreur Supabase: {e}")

# =============================================================================
# PARTIE 3: COMPARAISON
# =============================================================================
print(f"\n\n{'=' * 120}")
print(" PARTIE 3: COMPARAISON SQL SERVER vs SUPABASE ".center(120, "="))
print(f"{'=' * 120}")

def compare_data(name, sql_dict, spb_dict):
    print(f"\n{'─' * 120}")
    print(f"📊 {name}")
    print(f"{'─' * 120}")

    all_years = sorted(set(list(sql_dict.keys()) + list(spb_dict.keys())))

    print(f"{'Année':<10} | {'SQL Server':>15} | {'Supabase':>15} | {'Différence':>15} | {'Statut':<12}")
    print(f"{'─' * 10}─┼─{'─' * 15}─┼─{'─' * 15}─┼─{'─' * 15}─┼─{'─' * 12}")

    total_sql = 0
    total_spb = 0

    for annee in all_years:
        sql_count = sql_dict.get(annee, 0)
        spb_count = spb_dict.get(annee, 0)
        diff = spb_count - sql_count

        total_sql += sql_count
        total_spb += spb_count

        if diff == 0:
            statut = "✅ OK"
        elif diff > 0:
            statut = f"⚠️  +{diff}"
        else:
            statut = f"❌ MANQUE {abs(diff)}"

        print(f"{annee:<10} | {sql_count:>15,} | {spb_count:>15,} | {diff:>+15,} | {statut:<12}")

    print(f"{'─' * 10}─┼─{'─' * 15}─┼─{'─' * 15}─┼─{'─' * 15}─┼─{'─' * 12}")

    total_diff = total_spb - total_sql
    if total_diff == 0:
        total_statut = "✅ COMPLET"
    elif total_diff > 0:
        total_statut = f"⚠️  +{total_diff} EN TROP"
    else:
        total_statut = f"❌ MANQUE {abs(total_diff)}"

    print(f"{'TOTAL':<10} | {total_sql:>15,} | {total_spb:>15,} | {total_diff:>+15,} | {total_statut:<12}")

    return total_sql, total_spb, total_diff

liq_sql, liq_spb, liq_diff = compare_data(
    "LIQUIDATIONS",
    sql_data['liquidations'],
    spb_data['liquidations']
)

ord_sql, ord_spb, ord_diff = compare_data(
    "ORDONNANCEMENTS",
    sql_data['ordonnancements'],
    spb_data['ordonnancements']
)

notes_sql, notes_spb, notes_diff = compare_data(
    "NOTES SEF/DG",
    sql_data['notes_dg'],
    spb_data['notes_sef']
)

eng_sql, eng_spb, eng_diff = compare_data(
    "ENGAGEMENTS",
    sql_data['engagements'],
    spb_data['engagements']
)

# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================
print(f"\n\n{'=' * 120}")
print(" RÉSUMÉ FINAL ".center(120, "="))
print(f"{'=' * 120}\n")

print(f"{'Type':<25} | {'SQL Server':>15} | {'Supabase':>15} | {'Différence':>15} | {'Taux':>10} | {'Statut':<15}")
print(f"{'─' * 25}─┼─{'─' * 15}─┼─{'─' * 15}─┼─{'─' * 15}─┼─{'─' * 10}─┼─{'─' * 15}")

def print_summary(name, sql_count, spb_count, diff):
    if sql_count > 0:
        taux = (spb_count / sql_count * 100)
        taux_str = f"{taux:.1f}%"
    else:
        taux_str = "N/A"

    if diff == 0:
        statut = "✅ OK"
    elif diff > 0:
        statut = f"⚠️ +{diff}"
    else:
        statut = f"❌ -{abs(diff)}"

    print(f"{name:<25} | {sql_count:>15,} | {spb_count:>15,} | {diff:>+15,} | {taux_str:>10} | {statut:<15}")

print_summary("Liquidations", liq_sql, liq_spb, liq_diff)
print_summary("Ordonnancements", ord_sql, ord_spb, ord_diff)
print_summary("Notes SEF/DG", notes_sql, notes_spb, notes_diff)
print_summary("Engagements", eng_sql, eng_spb, eng_diff)

print(f"\n{'=' * 120}")
print(" FIN DE L'AUDIT ".center(120, "="))
print(f"{'=' * 120}")
