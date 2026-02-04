#!/usr/bin/env python3
"""
Script de migration des données de l'ancien SYGFP vers le nouveau
Source: SQL Server (eARTIDB_2025)
Destination: Supabase (PostgreSQL)
"""

import os
import csv
import json
from datetime import datetime
from typing import Dict, List, Any
import uuid

# Configuration
MIGRATION_DATA_DIR = '/home/angeyannick/sygfp-artis-g-re/migration_data'
OUTPUT_DIR = '/home/angeyannick/sygfp-artis-g-re/migration_data/sql_output'

# Create output directory
os.makedirs(OUTPUT_DIR, exist_ok=True)

def parse_csv(filename: str) -> List[Dict[str, Any]]:
    """Parse CSV file with || or | delimiter"""
    filepath = os.path.join(MIGRATION_DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Warning: {filename} not found")
        return []

    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.strip().split('\n')
        if len(lines) < 2:
            return []

        # First line is headers - uses ||
        headers = [h.strip() for h in lines[0].split('||')]

        for line in lines[1:]:
            if not line.strip():
                continue
            # Data rows use single |
            values = line.split('|')
            # Pad values if needed
            while len(values) < len(headers):
                values.append('')
            row = {}
            for i, header in enumerate(headers):
                val = values[i].strip() if i < len(values) else ''
                row[header] = val if val and val != 'NULL' else None
            rows.append(row)

    return rows

def clean_text(text: str) -> str:
    """Clean text for SQL insertion"""
    if not text:
        return ''
    # Replace problematic characters
    text = text.replace("'", "''")
    text = text.replace('\r', ' ')
    text = text.replace('\n', ' ')
    # Fix encoding issues
    replacements = {
        ',': 'é',
        '.': 'à',
        '"': 'ô',
        'Š': 'ê',
        'ƒ': 'Ô',
        '‚': 'é',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()

def generate_uuid() -> str:
    """Generate UUID"""
    return str(uuid.uuid4())

def parse_date(date_str: str) -> str:
    """Parse date string to ISO format"""
    if not date_str or date_str == 'NULL':
        return 'NULL'
    try:
        # Try common formats
        for fmt in ['%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
            try:
                dt = datetime.strptime(date_str.split('.')[0], fmt.split('.')[0])
                return f"'{dt.isoformat()}'"
            except:
                continue
        return 'NULL'
    except:
        return 'NULL'

def migrate_directions():
    """Migrate Direction -> directions"""
    print("\n=== Migrating Directions ===")
    rows = parse_csv('Direction.csv')

    sql_lines = [
        "-- Migration des directions",
        "-- Source: Direction (ancien SYGFP)",
        "-- Destination: directions (nouveau SYGFP)",
        ""
    ]

    for row in rows:
        if not row.get('Libelle'):
            continue

        code = f"DIR{int(row['DirectionID']):03d}" if row.get('DirectionID') else f"DIR{generate_uuid()[:8]}"
        nom = clean_text(row['Libelle'])

        sql = f"""
INSERT INTO directions (code, nom, description, actif, created_at)
VALUES ('{code}', '{nom}', NULL, true, NOW())
ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom;
"""
        sql_lines.append(sql)

    with open(os.path.join(OUTPUT_DIR, '01_directions.sql'), 'w') as f:
        f.write('\n'.join(sql_lines))

    print(f"  -> {len(rows)} directions exported")

def migrate_fournisseurs():
    """Migrate Fournisseur -> Table de référence pour les engagements"""
    print("\n=== Migrating Fournisseurs ===")
    rows = parse_csv('Fournisseur.csv')

    sql_lines = [
        "-- Migration des fournisseurs",
        "-- Note: Dans le nouveau SYGFP, les fournisseurs sont stockés comme texte dans les engagements",
        "-- Ce fichier crée une table de référence temporaire",
        "",
        "CREATE TABLE IF NOT EXISTS migration_fournisseurs (",
        "  id SERIAL PRIMARY KEY,",
        "  ancien_id INTEGER,",
        "  raison_sociale TEXT,",
        "  sigle TEXT,",
        "  adresse TEXT,",
        "  compte_bancaire TEXT,",
        "  banque TEXT",
        ");",
        ""
    ]

    for row in rows:
        if not row.get('RaisonSociale'):
            continue

        ancien_id = row.get('FournisseurID', 'NULL')
        raison_sociale = clean_text(row.get('RaisonSociale', ''))
        sigle = clean_text(row.get('Sigle', ''))
        adresse = clean_text(row.get('Adresse', ''))
        compte = clean_text(row.get('CpteBancaire', ''))
        banque = clean_text(row.get('Banque', ''))

        sql = f"""
INSERT INTO migration_fournisseurs (ancien_id, raison_sociale, sigle, adresse, compte_bancaire, banque)
VALUES ({ancien_id}, '{raison_sociale}', '{sigle}', '{adresse}', '{compte}', '{banque}');
"""
        sql_lines.append(sql)

    with open(os.path.join(OUTPUT_DIR, '02_fournisseurs.sql'), 'w') as f:
        f.write('\n'.join(sql_lines))

    print(f"  -> {len(rows)} fournisseurs exported")

def migrate_budget_hierarchy():
    """Migrate Mission, Action, Activite -> objectifs_strategiques, missions, actions, activites"""
    print("\n=== Migrating Budget Hierarchy ===")

    missions = parse_csv('Mission.csv')
    actions = parse_csv('Action.csv')
    activites = parse_csv('Activite.csv')

    sql_lines = [
        "-- Migration de la hiérarchie budgétaire",
        "-- Mission -> missions",
        "-- Action -> actions",
        "-- Activite -> activites",
        "",
        "-- Table de mapping pour les anciens IDs",
        "CREATE TABLE IF NOT EXISTS migration_mapping (",
        "  table_source TEXT,",
        "  ancien_id TEXT,",
        "  nouveau_id UUID",
        ");",
        ""
    ]

    # Missions
    sql_lines.append("-- === MISSIONS ===")
    for row in missions:
        if not row.get('Libelle'):
            continue

        new_id = generate_uuid()
        libelle = clean_text(row['Libelle'])[:200]
        description = clean_text(row.get('Description', ''))[:500]

        sql = f"""
INSERT INTO missions (id, code, libelle, description, actif, exercice_id)
SELECT '{new_id}', 'MIS{row.get('MissionID', '000')}', '{libelle}', '{description}', true,
       (SELECT id FROM exercices WHERE annee = 2025 LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM missions WHERE code = 'MIS{row.get('MissionID', '000')}');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Mission', '{row.get('MissionID')}', '{new_id}');
"""
        sql_lines.append(sql)

    # Actions
    sql_lines.append("\n-- === ACTIONS ===")
    for row in actions:
        if not row.get('Libelle'):
            continue

        new_id = generate_uuid()
        libelle = clean_text(row['Libelle'])[:200]

        sql = f"""
INSERT INTO actions (id, code, libelle, actif)
SELECT '{new_id}', 'ACT{row.get('ActionID', '000')}', '{libelle}', true
WHERE NOT EXISTS (SELECT 1 FROM actions WHERE code = 'ACT{row.get('ActionID', '000')}');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Action', '{row.get('ActionID')}', '{new_id}');
"""
        sql_lines.append(sql)

    # Activites
    sql_lines.append("\n-- === ACTIVITES ===")
    for row in activites:
        if not row.get('Libelle'):
            continue

        new_id = generate_uuid()
        libelle = clean_text(row['Libelle'])[:200]
        code = row.get('Code', f"ACTIV{row.get('ActiviteID', '000')}")

        sql = f"""
INSERT INTO activites (id, code, libelle, actif)
SELECT '{new_id}', '{code}', '{libelle}', true
WHERE NOT EXISTS (SELECT 1 FROM activites WHERE code = '{code}');

INSERT INTO migration_mapping (table_source, ancien_id, nouveau_id) VALUES ('Activite', '{row.get('ActiviteID')}', '{new_id}');
"""
        sql_lines.append(sql)

    with open(os.path.join(OUTPUT_DIR, '03_budget_hierarchy.sql'), 'w') as f:
        f.write('\n'.join(sql_lines))

    print(f"  -> {len(missions)} missions, {len(actions)} actions, {len(activites)} activites exported")

def migrate_engagements():
    """Migrate Budget -> budget_engagements"""
    print("\n=== Migrating Engagements (Budget) ===")
    rows = parse_csv('Budget.csv')

    sql_lines = [
        "-- Migration des engagements budgétaires",
        "-- Source: Budget (ancien SYGFP)",
        "-- Destination: budget_engagements (nouveau SYGFP)",
        "",
    ]

    count = 0
    for row in rows:
        if not row.get('BudgetID'):
            continue

        new_id = generate_uuid()
        reference = row.get('NumDepense', f"ENG-{row['BudgetID']}")
        objet = clean_text(row.get('Objet1', ''))[:500]
        montant = row.get('MontantMarche', '0') or '0'
        fournisseur = clean_text(row.get('RaisonSociale', ''))
        date_engagement = parse_date(row.get('Date', ''))
        statut = 'valide' if row.get('Etat') == '1' else 'brouillon'

        # Only insert if we have minimum required data
        if not objet and not fournisseur:
            continue

        sql = f"""
INSERT INTO budget_engagements (id, reference, objet, montant_engage, fournisseur, statut, created_at)
VALUES ('{new_id}', '{reference}', '{objet}', {montant}, '{fournisseur}', '{statut}', {date_engagement if date_engagement != 'NULL' else 'NOW()'})
ON CONFLICT (reference) DO NOTHING;
"""
        sql_lines.append(sql)
        count += 1

    with open(os.path.join(OUTPUT_DIR, '04_engagements.sql'), 'w') as f:
        f.write('\n'.join(sql_lines))

    print(f"  -> {count} engagements exported")

def migrate_liquidations():
    """Migrate Liquidation -> budget_liquidations"""
    print("\n=== Migrating Liquidations ===")
    rows = parse_csv('Liquidation.csv')

    sql_lines = [
        "-- Migration des liquidations",
        "-- Source: Liquidation (ancien SYGFP)",
        "-- Destination: budget_liquidations (nouveau SYGFP)",
        "",
    ]

    count = 0
    for row in rows:
        if not row.get('LiquidationID'):
            continue

        new_id = generate_uuid()
        reference = row.get('NumLiquidation', f"LIQ-{row['LiquidationID']}")
        montant = row.get('Montant', '0') or '0'
        date_liquidation = parse_date(row.get('Date', ''))
        statut = 'valide' if row.get('Etat') == '1' else 'brouillon'

        sql = f"""
INSERT INTO budget_liquidations (id, reference, montant_liquide, statut, created_at)
VALUES ('{new_id}', '{reference}', {montant}, '{statut}', {date_liquidation if date_liquidation != 'NULL' else 'NOW()'})
ON CONFLICT (reference) DO NOTHING;
"""
        sql_lines.append(sql)
        count += 1

    with open(os.path.join(OUTPUT_DIR, '05_liquidations.sql'), 'w') as f:
        f.write('\n'.join(sql_lines))

    print(f"  -> {count} liquidations exported")

def migrate_ordonnancements():
    """Migrate Ordonnancement -> budget_ordonnancements"""
    print("\n=== Migrating Ordonnancements ===")
    rows = parse_csv('Ordonnancement.csv')

    sql_lines = [
        "-- Migration des ordonnancements",
        "-- Source: Ordonnancement (ancien SYGFP)",
        "-- Destination: budget_ordonnancements (nouveau SYGFP)",
        "",
    ]

    count = 0
    for row in rows:
        if not row.get('OrdonnancementID'):
            continue

        new_id = generate_uuid()
        reference = row.get('NumOrdonnancement', f"ORD-{row['OrdonnancementID']}")
        montant = row.get('Montant', '0') or '0'
        date_ordonnancement = parse_date(row.get('Date', ''))
        statut = 'valide' if row.get('Etat') == '1' else 'brouillon'

        sql = f"""
INSERT INTO budget_ordonnancements (id, reference, montant_ordonnance, statut, created_at)
VALUES ('{new_id}', '{reference}', {montant}, '{statut}', {date_ordonnancement if date_ordonnancement != 'NULL' else 'NOW()'})
ON CONFLICT (reference) DO NOTHING;
"""
        sql_lines.append(sql)
        count += 1

    with open(os.path.join(OUTPUT_DIR, '06_ordonnancements.sql'), 'w') as f:
        f.write('\n'.join(sql_lines))

    print(f"  -> {count} ordonnancements exported")

def generate_summary():
    """Generate migration summary"""
    print("\n=== Generating Summary ===")

    summary = """
# Résumé de la Migration SYGFP

## Source: SQL Server (eARTIDB_2025)
## Destination: Supabase (PostgreSQL)

## Fichiers générés:
1. 01_directions.sql - Directions/Services
2. 02_fournisseurs.sql - Fournisseurs (table temporaire)
3. 03_budget_hierarchy.sql - Missions, Actions, Activités
4. 04_engagements.sql - Engagements budgétaires
5. 05_liquidations.sql - Liquidations
6. 06_ordonnancements.sql - Ordonnancements

## Instructions d'exécution:
1. Connectez-vous à Supabase SQL Editor
2. Exécutez les fichiers dans l'ordre (01 à 06)
3. Vérifiez les données importées
4. Supprimez les tables temporaires (migration_*)

## Notes:
- Les anciens IDs sont conservés dans migration_mapping pour référence
- Certaines données peuvent nécessiter un nettoyage manuel
- Les relations entre tables doivent être vérifiées
"""

    with open(os.path.join(OUTPUT_DIR, 'README.md'), 'w') as f:
        f.write(summary)

    print("  -> Summary generated")

def main():
    print("=" * 60)
    print("MIGRATION ANCIEN SYGFP -> NOUVEAU SYGFP")
    print("=" * 60)

    migrate_directions()
    migrate_fournisseurs()
    migrate_budget_hierarchy()
    migrate_engagements()
    migrate_liquidations()
    migrate_ordonnancements()
    generate_summary()

    print("\n" + "=" * 60)
    print(f"Migration scripts generated in: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == '__main__':
    main()
