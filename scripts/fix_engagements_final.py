#!/usr/bin/env python3
"""
Fix remaining engagement issues:
1. montant = 0 for migrated records -> re-read from SQL Server
2. workflow_status = "en_cours" -> set to "termine" for validated migrated records
"""

import pymssql
import requests
import json
import os
import uuid
import hashlib

# Config
SQL_SERVER = "192.168.0.8"
SQL_USER = "ARTI\\admin"
SQL_PASS = "tranSPort2021!"
DATABASES = {"2024": "eARTI_DB2", "2025": "eARTIDB_2025", "2026": "eARTIDB_2026"}

SUPABASE_URL = "https://tjagvgqthlibdpvztvaf.supabase.co"
mcp_path = os.path.join(os.path.dirname(__file__), '..', '.mcp.json')
with open(mcp_path) as f:
    mcp = json.load(f)
supa_args = mcp["mcpServers"]["supabase"]["args"]
SUPABASE_KEY = supa_args[supa_args.index("--apiKey") + 1]

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

def make_uuid(name):
    """Generate deterministic UUID v5 from name string"""
    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    return str(uuid.uuid5(namespace, name))

# ═══════════════════════════════════════════════════════════
# STEP 1: Fix montant = 0 by re-reading from SQL Server
# ═══════════════════════════════════════════════════════════
print("=" * 60)
print("  ÉTAPE 1: Correction des montants engagements")
print("=" * 60)

# Read all Budget records from SQL Server with amounts
sql_data = {}
for year, db in DATABASES.items():
    try:
        conn = pymssql.connect(SQL_SERVER, SQL_USER, SQL_PASS, db)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT BudgetID, NumDepense, MontantMarche, Exercice, RaisonSociale
            FROM Budget
            WHERE MontantMarche IS NOT NULL AND MontantMarche > 0
        """)
        rows = cursor.fetchall()
        for row in rows:
            budget_id = row[0]
            num_depense = row[1]
            montant = float(row[2]) if row[2] else 0
            exercice = int(float(row[3])) if row[3] else int(year)
            fournisseur = row[4] or ""

            # Generate the deterministic UUID used during migration
            det_uuid = make_uuid(f"engagement_{year}_{budget_id}")
            sql_data[det_uuid] = {
                "montant": montant,
                "num_depense": num_depense,
                "fournisseur": fournisseur,
            }
        conn.close()
        print(f"  {db}: {len(rows)} records with montant > 0")
    except Exception as e:
        print(f"  {db}: ERROR - {e}")

print(f"  Total SQL Server records with amounts: {len(sql_data)}")

# Get all engagements with montant = 0 from Supabase
print("\n  Fetching engagements with montant = 0 from Supabase...")
offset = 0
zero_montant = []
while True:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/budget_engagements?select=id,numero,montant&montant=eq.0&numero=like.MIG-*&limit=500&offset={offset}",
        headers={**HEADERS, "Prefer": "return=representation"},
    )
    batch = r.json() if r.status_code in [200, 206] else []
    if not batch:
        break
    zero_montant.extend(batch)
    offset += 500
    if len(batch) < 500:
        break

print(f"  Found {len(zero_montant)} engagements with montant = 0")

# Match and update
fixed_montant = 0
not_found = 0
for eng in zero_montant:
    eng_id = eng["id"]
    if eng_id in sql_data:
        montant = sql_data[eng_id]["montant"]
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/budget_engagements?id=eq.{eng_id}",
            headers=HEADERS,
            json={"montant": montant},
        )
        if r.status_code in [200, 204]:
            fixed_montant += 1
        else:
            print(f"    Error updating {eng['numero']}: {r.status_code} {r.text[:100]}")
    else:
        not_found += 1

print(f"\n  Montants corrigés: {fixed_montant}")
print(f"  Non trouvés dans SQL Server: {not_found}")

# ═══════════════════════════════════════════════════════════
# STEP 2: Fix workflow_status = "en_cours" -> "termine"
# ═══════════════════════════════════════════════════════════
print(f"\n{'=' * 60}")
print("  ÉTAPE 2: Correction workflow_status engagements")
print("=" * 60)

# Update all MIG- engagements with statut=valide to workflow_status=termine
# Do in batches since there may be thousands
offset = 0
fixed_workflow = 0
while True:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/budget_engagements?select=id&numero=like.MIG-*&statut=eq.valide&workflow_status=eq.en_cours&limit=500&offset=0",
        headers={**HEADERS, "Prefer": "return=representation"},
    )
    batch = r.json() if r.status_code in [200, 206] else []
    if not batch:
        break

    for eng in batch:
        r2 = requests.patch(
            f"{SUPABASE_URL}/rest/v1/budget_engagements?id=eq.{eng['id']}",
            headers=HEADERS,
            json={"workflow_status": "termine"},
        )
        if r2.status_code in [200, 204]:
            fixed_workflow += 1

    print(f"  Batch: {len(batch)} records updated (total: {fixed_workflow})")

    if len(batch) < 500:
        break

print(f"\n  Workflow status corrigés: {fixed_workflow}")

# ═══════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════
print(f"\n{'=' * 60}")
print("  VÉRIFICATION FINALE")
print("=" * 60)

# Check remaining montant = 0
r = requests.get(
    f"{SUPABASE_URL}/rest/v1/budget_engagements?select=count&montant=eq.0&numero=like.MIG-*",
    headers={**HEADERS, "Prefer": "return=representation"},
)
remaining_zero = r.json()[0]["count"] if r.status_code in [200, 206] else "?"
print(f"  Engagements MIG- avec montant=0 restants: {remaining_zero}")

# Check remaining en_cours
r = requests.get(
    f"{SUPABASE_URL}/rest/v1/budget_engagements?select=count&workflow_status=eq.en_cours&numero=like.MIG-*",
    headers={**HEADERS, "Prefer": "return=representation"},
)
remaining_encours = r.json()[0]["count"] if r.status_code in [200, 206] else "?"
print(f"  Engagements MIG- avec workflow=en_cours restants: {remaining_encours}")

print(f"\n  Terminé!")
