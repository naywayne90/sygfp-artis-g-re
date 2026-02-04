#!/usr/bin/env python3
"""
Complete migration from old SYGFP to new SYGFP (Supabase)
Imports: Engagements, Liquidations, Ordonnancements, Fournisseurs
Uses Supabase REST API with SERVICE_ROLE key to bypass RLS
"""

import os
import json
import requests
from datetime import datetime
import uuid
import re

# Supabase configuration
SUPABASE_URL = "https://tjagvgqthlibdpvztvaf.supabase.co"
# Service role key - bypasses RLS policies
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc"

MIGRATION_DATA_DIR = '/home/angeyannick/sygfp-artis-g-re/migration_data'

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Mapping for engagement IDs (old -> new)
engagement_mapping = {}
# Mapping for liquidation IDs (old -> new)
liquidation_mapping = {}

def supabase_request(method, path, data=None):
    """Make a request to Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1{path}"
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=data)
        elif method == "PATCH":
            resp = requests.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers)

        if resp.status_code >= 400:
            print(f"Error {resp.status_code}: {resp.text[:300]}")
            return None
        return resp.json() if resp.text else {}
    except Exception as e:
        print(f"Request error: {e}")
        return None

def parse_csv(filename):
    """Parse CSV file with || header delimiter and | data delimiter"""
    filepath = os.path.join(MIGRATION_DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Warning: {filename} not found")
        return []

    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().strip().split('\n')
        if len(lines) < 2:
            return []

        # Headers use ||
        header_list = [h.strip() for h in lines[0].split('||')]

        for line in lines[1:]:
            if not line.strip():
                continue
            # Data rows use single |
            values = line.split('|')
            while len(values) < len(header_list):
                values.append('')
            row = {}
            for i, header in enumerate(header_list):
                val = values[i].strip() if i < len(values) else ''
                row[header] = val if val and val != 'NULL' else None
            rows.append(row)

    return rows

def clean_text(text):
    """Clean text for import - fix encoding issues"""
    if not text:
        return ''
    # Fix common encoding issues from SQL Server export
    replacements = {
        ',': 'é',
        '.': 'à',
        '"': 'ô',
        'Š': 'ê',
        'ƒ': 'Ô',
        '‚': 'é',
        'S': 'è',  # Common replacement
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()[:500]

def parse_date(date_str):
    """Parse date string to ISO format"""
    if not date_str or date_str == 'NULL':
        return None
    try:
        # Remove milliseconds if present
        date_str = date_str.split('.')[0]
        dt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        return dt.strftime('%Y-%m-%d')
    except:
        try:
            dt = datetime.strptime(date_str, '%Y-%m-%d')
            return dt.strftime('%Y-%m-%d')
        except:
            return None

def parse_float(val):
    """Parse float value safely"""
    if not val or val == 'NULL':
        return 0
    try:
        return float(val)
    except:
        return 0

def get_default_budget_line():
    """Get a default budget line for imports"""
    result = supabase_request("GET", "/budget_lines?limit=1&is_active=eq.true")
    if result and len(result) > 0:
        return result[0]['id']
    return None

def get_exercice_id(annee):
    """Get exercice ID for a given year"""
    result = supabase_request("GET", f"/exercices?annee=eq.{annee}&limit=1")
    if result and len(result) > 0:
        return result[0]['id']
    return None

def import_engagements():
    """Import engagements from Budget.csv"""
    print("\n" + "="*60)
    print("IMPORTING ENGAGEMENTS (Budget.csv)")
    print("="*60)

    rows = parse_csv('Budget.csv')
    if not rows:
        print("No data to import")
        return

    print(f"Found {len(rows)} records to import")

    # Get default budget line
    default_budget_line = get_default_budget_line()
    if not default_budget_line:
        print("ERROR: No budget line found. Cannot import engagements.")
        return

    print(f"Using default budget_line_id: {default_budget_line}")

    imported = 0
    errors = 0
    skipped = 0

    for row in rows:
        old_id = row.get('BudgetID')
        if not old_id:
            skipped += 1
            continue

        try:
            numero = row.get('NumDepense', f"MIG-ENG-{old_id}")
            objet = clean_text(row.get('Objet1', '')) or f"Import ancien SYGFP - {old_id}"
            montant = parse_float(row.get('MontantMarche'))
            fournisseur = clean_text(row.get('RaisonSociale', ''))
            date_eng = parse_date(row.get('Date'))

            # Determine status based on Etat
            etat = row.get('Etat')
            if etat == '1':
                statut = 'valide'
                workflow_status = 'termine'
            else:
                statut = 'brouillon'
                workflow_status = 'brouillon'

            # Extract exercice year
            exercice_str = row.get('Exercice', '2025')
            try:
                exercice = int(float(exercice_str)) if exercice_str else 2025
            except:
                exercice = 2025

            data = {
                "numero": f"MIG-{numero}" if not numero.startswith('MIG-') else numero,
                "objet": objet,
                "montant": montant,
                "fournisseur": fournisseur,
                "statut": statut,
                "exercice": exercice,
                "budget_line_id": default_budget_line,
                "legacy_import": True,
                "workflow_status": workflow_status,
                "date_engagement": date_eng,
                "current_step": 9 if workflow_status == 'termine' else 1
            }

            result = supabase_request("POST", "/budget_engagements", data)
            if result and len(result) > 0:
                # Store mapping old ID -> new ID
                engagement_mapping[old_id] = result[0]['id']
                imported += 1
                if imported % 50 == 0:
                    print(f"  Progress: {imported} engagements imported...")
            else:
                errors += 1

        except Exception as e:
            print(f"Error importing engagement {old_id}: {e}")
            errors += 1

    print(f"\nEngagements Summary:")
    print(f"  - Imported: {imported}")
    print(f"  - Errors: {errors}")
    print(f"  - Skipped: {skipped}")

    # Save mapping to file
    mapping_file = os.path.join(MIGRATION_DATA_DIR, 'engagement_mapping.json')
    with open(mapping_file, 'w') as f:
        json.dump(engagement_mapping, f)
    print(f"  - Mapping saved to {mapping_file}")

    return imported

def import_liquidations():
    """Import liquidations from Liquidation.csv"""
    print("\n" + "="*60)
    print("IMPORTING LIQUIDATIONS (Liquidation.csv)")
    print("="*60)

    rows = parse_csv('Liquidation.csv')
    if not rows:
        print("No data to import")
        return

    print(f"Found {len(rows)} records to import")

    # Load engagement mapping if not in memory
    global engagement_mapping
    if not engagement_mapping:
        mapping_file = os.path.join(MIGRATION_DATA_DIR, 'engagement_mapping.json')
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                engagement_mapping = json.load(f)

    imported = 0
    errors = 0
    skipped = 0
    no_engagement = 0

    for row in rows:
        old_id = row.get('LiquidationID')
        if not old_id:
            skipped += 1
            continue

        try:
            # Get linked engagement
            old_engagement_id = row.get('EngagementID')
            new_engagement_id = engagement_mapping.get(old_engagement_id) if old_engagement_id else None

            if not new_engagement_id:
                no_engagement += 1
                # Create without engagement link for now
                pass

            numero = row.get('NumLiquidation', f"MIG-LIQ-{old_id}")
            montant = parse_float(row.get('MontantLiquide') or row.get('MontantMarche'))
            date_liq = parse_date(row.get('Date') or row.get('DateCreation'))
            objet = clean_text(row.get('Objet1', ''))

            # Determine status
            etat = row.get('Etat')
            if etat == '1':
                statut = 'valide'
                workflow_status = 'termine'
            else:
                statut = 'brouillon'
                workflow_status = 'brouillon'

            # Extract exercice year
            exercice_str = row.get('Exercice', '2025')
            try:
                exercice = int(float(exercice_str)) if exercice_str else 2025
            except:
                exercice = 2025

            data = {
                "numero": f"MIG-{numero}" if not numero.startswith('MIG-') else numero,
                "montant": montant,
                "date_liquidation": date_liq,
                "statut": statut,
                "legacy_import": True,
                "workflow_status": workflow_status,
                "exercice": exercice,
                "service_fait": True,
                "current_step": 9 if workflow_status == 'termine' else 0
            }

            if new_engagement_id:
                data["engagement_id"] = new_engagement_id

            result = supabase_request("POST", "/budget_liquidations", data)
            if result and len(result) > 0:
                liquidation_mapping[old_id] = result[0]['id']
                imported += 1
                if imported % 50 == 0:
                    print(f"  Progress: {imported} liquidations imported...")
            else:
                errors += 1

        except Exception as e:
            print(f"Error importing liquidation {old_id}: {e}")
            errors += 1

    print(f"\nLiquidations Summary:")
    print(f"  - Imported: {imported}")
    print(f"  - Errors: {errors}")
    print(f"  - Skipped: {skipped}")
    print(f"  - No engagement link: {no_engagement}")

    # Save mapping to file
    mapping_file = os.path.join(MIGRATION_DATA_DIR, 'liquidation_mapping.json')
    with open(mapping_file, 'w') as f:
        json.dump(liquidation_mapping, f)
    print(f"  - Mapping saved to {mapping_file}")

    return imported

def import_ordonnancements():
    """Import ordonnancements from Ordonnancement.csv"""
    print("\n" + "="*60)
    print("IMPORTING ORDONNANCEMENTS (Ordonnancement.csv)")
    print("="*60)

    rows = parse_csv('Ordonnancement.csv')
    if not rows:
        print("No data to import")
        return

    print(f"Found {len(rows)} records to import")

    # Load liquidation mapping if not in memory
    global liquidation_mapping
    if not liquidation_mapping:
        mapping_file = os.path.join(MIGRATION_DATA_DIR, 'liquidation_mapping.json')
        if os.path.exists(mapping_file):
            with open(mapping_file, 'r') as f:
                liquidation_mapping = json.load(f)

    imported = 0
    errors = 0
    skipped = 0
    no_liquidation = 0

    for row in rows:
        old_id = row.get('OrdonnancementID')
        if not old_id:
            skipped += 1
            continue

        try:
            # Get linked liquidation
            old_liquidation_id = row.get('LiquidationID')
            new_liquidation_id = liquidation_mapping.get(old_liquidation_id) if old_liquidation_id else None

            if not new_liquidation_id:
                no_liquidation += 1
                continue  # Skip ordonnancements without liquidation link

            numero = row.get('Ordonnancement', f"MIG-ORD-{old_id}")
            montant = parse_float(row.get('MontantMandate') or row.get('MontantMarche'))
            beneficiaire = clean_text(row.get('RaisonSociale', ''))
            objet = clean_text(row.get('Objet1', ''))
            banque = clean_text(row.get('Banque', ''))
            compte = clean_text(row.get('CpteBancaire', ''))
            mode_paiement = row.get('ModePaiement', 'virement')

            # Determine status
            etat = row.get('Etat')
            if etat == '1':
                statut = 'valide'
                workflow_status = 'termine'
            else:
                statut = 'brouillon'
                workflow_status = 'brouillon'

            # Extract exercice year
            exercice_str = row.get('Exercice', '2025')
            try:
                exercice = int(float(exercice_str)) if exercice_str else 2025
            except:
                exercice = 2025

            # Map mode_paiement
            mode_map = {
                'Virement': 'virement',
                'Chèque': 'cheque',
                'Espèces': 'especes',
                'NULL': 'virement'
            }
            mode_paiement_clean = mode_map.get(mode_paiement, 'virement')

            data = {
                "numero": f"MIG-{numero}" if not numero.startswith('MIG-') else numero,
                "liquidation_id": new_liquidation_id,
                "montant": montant,
                "beneficiaire": beneficiaire or "Non spécifié",
                "objet": objet or f"Ordonnancement migré - {old_id}",
                "mode_paiement": mode_paiement_clean,
                "banque": banque,
                "rib": compte,
                "statut": statut,
                "legacy_import": True,
                "workflow_status": workflow_status,
                "exercice": exercice,
                "current_step": 9 if workflow_status == 'termine' else 0
            }

            result = supabase_request("POST", "/ordonnancements", data)
            if result and len(result) > 0:
                imported += 1
                if imported % 50 == 0:
                    print(f"  Progress: {imported} ordonnancements imported...")
            else:
                errors += 1

        except Exception as e:
            print(f"Error importing ordonnancement {old_id}: {e}")
            errors += 1

    print(f"\nOrdonnancements Summary:")
    print(f"  - Imported: {imported}")
    print(f"  - Errors: {errors}")
    print(f"  - Skipped: {skipped}")
    print(f"  - No liquidation link: {no_liquidation}")

    return imported

def import_fournisseurs_reference():
    """Create a fournisseurs reference JSON file"""
    print("\n" + "="*60)
    print("CREATING FOURNISSEURS REFERENCE")
    print("="*60)

    rows = parse_csv('Fournisseur.csv')
    if not rows:
        print("No fournisseurs to import")
        return

    fournisseurs = []
    for row in rows:
        fournisseurs.append({
            "ancien_id": row.get('FournisseurID'),
            "compte": row.get('CompteFournisseur'),
            "sigle": clean_text(row.get('sigle', '')),
            "raison_sociale": clean_text(row.get('RaisonSociale', '')),
            "cc": row.get('CC'),
            "rccm": row.get('RCCM'),
            "regime_imposition": row.get('RegimeImposition'),
            "siege_social": clean_text(row.get('SiegeSociale', '')),
            "responsable": clean_text(row.get('Responsable', '')),
            "contact": row.get('ContactResponsable'),
            "email": row.get('Mail'),
            "activite_principale": clean_text(row.get('ActivitePrincipale', '')),
            "actif": row.get('EstActif') == '1'
        })

    output_path = os.path.join(MIGRATION_DATA_DIR, 'fournisseurs_complete.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(fournisseurs, f, ensure_ascii=False, indent=2)

    print(f"  -> {len(fournisseurs)} fournisseurs saved to {output_path}")
    return len(fournisseurs)

def verify_import():
    """Verify the import"""
    print("\n" + "="*60)
    print("VERIFYING IMPORT")
    print("="*60)

    # Count engagements
    result = supabase_request("GET", "/budget_engagements?select=id&legacy_import=eq.true")
    eng_count = len(result) if result else 0
    print(f"  Engagements migrated: {eng_count}")

    # Count liquidations
    result2 = supabase_request("GET", "/budget_liquidations?select=id&legacy_import=eq.true")
    liq_count = len(result2) if result2 else 0
    print(f"  Liquidations migrated: {liq_count}")

    # Count ordonnancements
    result3 = supabase_request("GET", "/ordonnancements?select=id&legacy_import=eq.true")
    ord_count = len(result3) if result3 else 0
    print(f"  Ordonnancements migrated: {ord_count}")

    # Total
    print(f"\n  TOTAL RECORDS MIGRATED: {eng_count + liq_count + ord_count}")

    return {
        "engagements": eng_count,
        "liquidations": liq_count,
        "ordonnancements": ord_count
    }

def main():
    print("="*60)
    print("MIGRATION COMPLETE: ANCIEN SYGFP -> NOUVEAU SYGFP")
    print("="*60)
    print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Source: {MIGRATION_DATA_DIR}")
    print(f"Destination: {SUPABASE_URL}")

    # Test connection
    print("\nTesting Supabase connection...")
    result = supabase_request("GET", "/directions?limit=1")
    if result is None:
        print("ERROR: Cannot connect to Supabase")
        return
    print("Connection OK!")

    # Import all data
    import_fournisseurs_reference()
    import_engagements()
    import_liquidations()
    import_ordonnancements()

    # Verify
    stats = verify_import()

    print("\n" + "="*60)
    print("MIGRATION COMPLETE")
    print("="*60)

    # Save final report
    report = {
        "date": datetime.now().isoformat(),
        "stats": stats,
        "source": MIGRATION_DATA_DIR,
        "destination": SUPABASE_URL
    }
    report_file = os.path.join(MIGRATION_DATA_DIR, 'migration_report.json')
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\nReport saved to: {report_file}")

if __name__ == '__main__':
    main()
