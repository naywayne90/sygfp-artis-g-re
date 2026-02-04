#!/usr/bin/env python3
"""
Import data from old SYGFP to new SYGFP (Supabase)
Uses Supabase REST API
"""

import os
import json
import requests
from datetime import datetime
import uuid

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

        if resp.status_code >= 400:
            print(f"Error {resp.status_code}: {resp.text[:200]}")
            return None
        return resp.json() if resp.text else {}
    except Exception as e:
        print(f"Request error: {e}")
        return None

def parse_csv(filename):
    """Parse CSV file"""
    filepath = os.path.join(MIGRATION_DATA_DIR, filename)
    if not os.path.exists(filepath):
        return []

    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().strip().split('\n')
        if len(lines) < 2:
            return []

        headers = [h.strip() for h in lines[0].split('||')]

        for line in lines[1:]:
            if not line.strip():
                continue
            values = line.split('|')
            while len(values) < len(headers):
                values.append('')
            row = {}
            for i, header in enumerate(headers):
                val = values[i].strip() if i < len(values) else ''
                row[header] = val if val and val != 'NULL' else None
            rows.append(row)

    return rows

def clean_text(text):
    """Clean text for import"""
    if not text:
        return ''
    # Fix encoding issues
    replacements = {
        ',': 'é', '.': 'à', '"': 'ô', 'Š': 'ê', 'ƒ': 'Ô', '‚': 'é',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.strip()[:500]

def get_default_budget_line():
    """Get a default budget line for imports"""
    result = supabase_request("GET", "/budget_lines?limit=1")
    if result and len(result) > 0:
        return result[0]['id']
    return None

def import_engagements():
    """Import engagements from Budget table"""
    print("\n=== Importing Engagements ===")

    rows = parse_csv('Budget.csv')
    if not rows:
        print("No data to import")
        return

    # Get default budget line
    default_budget_line = get_default_budget_line()
    if not default_budget_line:
        print("ERROR: No budget line found. Cannot import engagements.")
        return

    print(f"Using default budget_line_id: {default_budget_line}")

    imported = 0
    errors = 0

    for row in rows[:100]:  # Import first 100 for testing
        if not row.get('NumDepense'):
            continue

        try:
            numero = row.get('NumDepense', f"ENG-{uuid.uuid4().hex[:8]}")
            objet = clean_text(row.get('Objet1', 'Import ancien SYGFP'))
            montant = float(row.get('MontantMarche', 0) or 0)
            fournisseur = clean_text(row.get('RaisonSociale', ''))

            data = {
                "numero": f"MIG-{numero}",
                "objet": objet if objet else "Import depuis ancien SYGFP",
                "montant": montant,
                "fournisseur": fournisseur,
                "statut": "valide",
                "exercice": 2025,
                "budget_line_id": default_budget_line,
                "legacy_import": True,
                "workflow_status": "termine"
            }

            result = supabase_request("POST", "/budget_engagements", data)
            if result:
                imported += 1
                if imported % 10 == 0:
                    print(f"  Imported {imported} engagements...")
            else:
                errors += 1

        except Exception as e:
            print(f"Error importing row: {e}")
            errors += 1

    print(f"\n  -> Imported: {imported}, Errors: {errors}")

def import_fournisseurs_as_reference():
    """Create a fournisseurs reference table"""
    print("\n=== Creating Fournisseurs Reference ===")

    rows = parse_csv('Fournisseur.csv')
    if not rows:
        print("No fournisseurs to import")
        return

    # Save to a JSON file for reference
    fournisseurs = []
    for row in rows:
        fournisseurs.append({
            "ancien_id": row.get('FournisseurID'),
            "raison_sociale": clean_text(row.get('RaisonSociale', '')),
            "sigle": clean_text(row.get('Sigle', '')),
            "adresse": clean_text(row.get('Adresse', '')),
            "banque": clean_text(row.get('Banque', '')),
            "compte": clean_text(row.get('CpteBancaire', ''))
        })

    output_path = os.path.join(MIGRATION_DATA_DIR, 'fournisseurs_reference.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(fournisseurs, f, ensure_ascii=False, indent=2)

    print(f"  -> {len(fournisseurs)} fournisseurs saved to {output_path}")

def verify_import():
    """Verify the import"""
    print("\n=== Verifying Import ===")

    # Count engagements
    result = supabase_request("GET", "/budget_engagements?select=id&legacy_import=eq.true")
    if result:
        print(f"  Engagements migrated: {len(result)}")

    # Count total engagements
    result2 = supabase_request("GET", "/budget_engagements?select=id")
    if result2:
        print(f"  Total engagements: {len(result2)}")

def main():
    print("=" * 60)
    print("IMPORT ANCIEN SYGFP -> SUPABASE")
    print("=" * 60)

    # Test connection
    print("\nTesting Supabase connection...")
    result = supabase_request("GET", "/directions?limit=1")
    if result is None:
        print("ERROR: Cannot connect to Supabase")
        return
    print("Connection OK!")

    import_fournisseurs_as_reference()
    import_engagements()
    verify_import()

    print("\n" + "=" * 60)
    print("IMPORT COMPLETE")
    print("=" * 60)

if __name__ == '__main__':
    main()
