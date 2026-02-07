#!/usr/bin/env python3
"""
Fix character encoding corruption in Supabase migrated data.

During migration from SQL Server to Supabase, uppercase 'S' was corrupted to 'e-grave' (è)
in ALL-CAPS text contexts. This script detects and fixes those corruptions while preserving
legitimate French accented characters.

Rules:
1. è adjacent to an uppercase letter → S
2. è adjacent to another è → S
3. è at the start of a word (beginning of string or after whitespace/punctuation) → S
4. è at end of a word containing uppercase letters → S
5. à adjacent to uppercase letters (in ALL-CAPS context) → S (conservative)
"""

import json
import re
import sys
import requests
from typing import Optional

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────

MCP_CONFIG_PATH = "/home/angeyannick/sygfp-artis-g-re/.mcp.json"
SUPABASE_URL = "https://tjagvgqthlibdpvztvaf.supabase.co"

def load_api_key() -> str:
    """Read the service role key from .mcp.json."""
    with open(MCP_CONFIG_PATH, "r") as f:
        config = json.load(f)
    args = config["mcpServers"]["supabase"]["args"]
    # Find the value after "--apiKey"
    for i, arg in enumerate(args):
        if arg == "--apiKey" and i + 1 < len(args):
            return args[i + 1]
    raise ValueError("Could not find --apiKey in .mcp.json supabase config")


API_KEY = load_api_key()

HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

HEADERS_GET = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


# ──────────────────────────────────────────────────────────────────────────────
# Corruption detection and fixing
# ──────────────────────────────────────────────────────────────────────────────

def is_uppercase_context(text: str, pos: int) -> bool:
    """
    Check if the character at `pos` in `text` is in an uppercase context.

    An uppercase context means the surrounding word is predominantly uppercase,
    or the character is adjacent to uppercase letters on both sides, or part of
    an ALL-CAPS token.
    """
    # Find word boundaries around pos
    # Word = contiguous sequence of letters (including accented), digits, apostrophes
    start = pos
    while start > 0 and (text[start - 1].isalpha() or text[start - 1] in "'-"):
        start -= 1
    end = pos
    while end < len(text) - 1 and (text[end + 1].isalpha() or text[end + 1] in "'-"):
        end += 1

    word = text[start:end + 1]

    # Count uppercase vs lowercase letters in the word (excluding the è/à itself)
    upper = 0
    lower = 0
    for i, ch in enumerate(word):
        if start + i == pos:
            continue  # skip the character we're evaluating
        if ch.isupper():
            upper += 1
        elif ch.islower():
            lower += 1

    # If the word is predominantly uppercase (more uppercase than lowercase), it's CAPS context
    if upper > 0 and upper >= lower:
        return True

    return False


def fix_corrupted_s(text: Optional[str]) -> Optional[str]:
    """
    Replace corrupted è with S in contexts where it clearly represents
    an uppercase S, while preserving legitimate French è characters.

    Strategy: process character by character. For each è found, decide if it's
    corrupted based on context:
    1. è adjacent to another è → always corrupted (SS)
    2. è at start of a word (no letter before it) → always corrupted (French words don't start with è)
    3. è followed by uppercase letter AND preceded by uppercase letter → corrupted
    4. è in a word that is predominantly uppercase → corrupted
    5. è preceded by uppercase and followed by lowercase, but word is Title/mixed → NOT corrupted (e.g., Règlement)
    6. à in ALL-CAPS context → corrupted S
    """
    if text is None:
        return None

    result = list(text)
    length = len(result)

    # Build a set of positions to replace
    replace_positions = set()

    for i in range(length):
        ch = text[i]

        if ch == "è":
            prev_char = text[i - 1] if i > 0 else None
            next_char = text[i + 1] if i < length - 1 else None

            # Rule 1: èè → SS (adjacent è)
            if prev_char == "è" or next_char == "è":
                replace_positions.add(i)
                continue

            # Rule 2: è at start of word (no letter or digit before it)
            # French words virtually never start with è
            # But digits count as word context (e.g., "5ème" is legitimate)
            prev_is_word_char = prev_char is not None and (prev_char.isalpha() or prev_char.isdigit() or prev_char in "'")
            if not prev_is_word_char:
                replace_positions.add(i)
                continue

            # Rule 2b: If preceded by a digit, check if this looks like a French ordinal (Nème)
            # e.g., "5ème", "1ère" - these are legitimate
            if prev_char is not None and prev_char.isdigit():
                # è after a digit followed by lowercase is likely "ème" (ordinal)
                if next_char is not None and next_char.islower():
                    continue  # Skip - this is legitimate French

            # Rule 3: è followed by uppercase → corrupted (e.g., èA, èO)
            if next_char is not None and next_char.isupper():
                replace_positions.add(i)
                continue

            # Rule 4: è in a predominantly uppercase word
            # But exclude Title-case words like "Règlement" where only first letter is upper
            if is_uppercase_context(text, i):
                replace_positions.add(i)
                continue

        elif ch == "à":
            prev_char = text[i - 1] if i > 0 else None
            next_char = text[i + 1] if i < length - 1 else None

            # Only fix à when clearly in ALL-CAPS context
            # Rule: à between two uppercase letters
            if (prev_char is not None and prev_char.isupper() and
                    next_char is not None and next_char.isupper()):
                replace_positions.add(i)
                continue

            # Rule: à at end of word/string, preceded by uppercase, and word is CAPS
            next_is_letter = next_char is not None and next_char.isalpha()
            if not next_is_letter and prev_char is not None and prev_char.isupper():
                if is_uppercase_context(text, i):
                    replace_positions.add(i)
                    continue

    # Apply replacements
    for pos in replace_positions:
        result[pos] = "S"

    return "".join(result)


# ──────────────────────────────────────────────────────────────────────────────
# Supabase REST API helpers
# ──────────────────────────────────────────────────────────────────────────────

def fetch_all_records(table: str, filter_param: str, select_fields: str) -> list:
    """Fetch records from Supabase, handling pagination."""
    all_records = []
    offset = 0
    page_size = 1000

    while True:
        url = (
            f"{SUPABASE_URL}/rest/v1/{table}"
            f"?{filter_param}"
            f"&select={select_fields}"
            f"&offset={offset}&limit={page_size}"
        )
        resp = requests.get(url, headers=HEADERS_GET)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        all_records.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    return all_records


def update_record(table: str, record_id: str, updates: dict) -> bool:
    """Update a single record via PATCH."""
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{record_id}"
    resp = requests.patch(url, headers=HEADERS, json=updates)
    if resp.status_code in (200, 204):
        return True
    else:
        print(f"  ERROR updating {table}/{record_id}: {resp.status_code} {resp.text}")
        return False


# ──────────────────────────────────────────────────────────────────────────────
# Main processing
# ──────────────────────────────────────────────────────────────────────────────

def process_table(table: str, filter_param: str, text_fields: list[str]) -> dict:
    """
    Process a table: fetch records with è, fix corruption, update.
    Returns stats dict.
    """
    stats = {"scanned": 0, "fixed": 0, "fields_fixed": 0, "errors": 0, "examples": []}

    # Build OR filter to find records containing è in any of the text fields
    select = "id,numero," + ",".join(text_fields)

    print(f"\n{'='*70}")
    print(f"Processing table: {table}")
    print(f"  Filter: {filter_param}")
    print(f"  Fields: {text_fields}")
    print(f"{'='*70}")

    records = fetch_all_records(table, filter_param, select)
    stats["scanned"] = len(records)
    print(f"  Fetched {len(records)} records to scan")

    for record in records:
        updates = {}
        changes_desc = []

        for field in text_fields:
            original_value = record.get(field)
            if original_value is None:
                continue

            # Only process if the field contains è or à
            if "è" not in original_value and "à" not in original_value:
                continue

            fixed_value = fix_corrupted_s(original_value)
            if fixed_value != original_value:
                updates[field] = fixed_value
                changes_desc.append(f"    {field}: '{original_value}' -> '{fixed_value}'")
                stats["fields_fixed"] += 1

        if updates:
            success = update_record(table, record["id"], updates)
            if success:
                stats["fixed"] += 1
                numero = record.get("numero", "???")
                if len(stats["examples"]) < 10:
                    stats["examples"].append((numero, changes_desc))
                if stats["fixed"] <= 5 or stats["fixed"] % 100 == 0:
                    print(f"  Fixed [{stats['fixed']}] {numero}:")
                    for desc in changes_desc:
                        print(desc)
            else:
                stats["errors"] += 1

    return stats


def main():
    print("=" * 70)
    print("SYGFP - Fix Character Encoding Corruption (è → S)")
    print("=" * 70)

    # Test the fix function with known examples
    print("\n--- Self-test ---")
    test_cases = [
        ("PERèONNEL DE L'ARTI", "PERSONNEL DE L'ARTI"),
        ("TRANèMIèèION DE DOCUMENTè", "TRANSMISSION DE DOCUMENTS"),
        ("NIèèAN PATROL", "NISSAN PATROL"),
        ("GROUPE FèA", "GROUPE FSA"),
        ("AèèURE PLUè", "ASSURE PLUS"),
        ("èituation impôt retenu", "Situation impôt retenu"),
        ("èuivi et évaluation", "Suivi et évaluation"),
        ("èystème de management", "Système de management"),
        ("Règlement de la facture", "Règlement de la facture"),  # Should NOT change
        ("première session", "première session"),  # Should NOT change
        ("KADIA ENTREPRIèEè", "KADIA ENTREPRISES"),
        ("GAOUèèOU RAMAèèAGE DEè ORDUREè", "GAOUSSOU RAMASSAGE DES ORDURES"),
        ("ETè JEHOVAH-JIREH èARL", "ETS JEHOVAH-JIREH SARL"),
        ("èOCIAUX", "SOCIAUX"),
        ("FONè D'ENTRETIEN ROUTIER", "FONS D'ENTRETIEN ROUTIER"),  # FONS or FONDS? -> Just fix è
        ("GLOBAL BUILDING & èERVICEè", "GLOBAL BUILDING & SERVICES"),
        ("BOURèE DE FRET", "BOURSE DE FRET"),
        ("Achat de batterie de véhicule èUZUKI VITARA", "Achat de batterie de véhicule SUZUKI VITARA"),
        ("èoutien financier", "Soutien financier"),
        ("DEPOT DE COURRIER DE REMERCIEMENTè", "DEPOT DE COURRIER DE REMERCIEMENTS"),
        ("au siège de l'ARTIà", "au siège de l'ARTIS"),  # Trailing à after CAPS
        # Additional edge cases from real data
        ("EèPACE YEMAD", "ESPACE YEMAD"),
        ("H2O PIèCINE", "H2O PISCINE"),
        ("èIGAèECURITE", "SIGASECURITE"),
        ("CURèOR-CLAUD MAX-NEON AI", "CURSOR-CLAUD MAX-NEON AI"),
        ("TLCI èARLU", "TLCI SARLU"),
        ("BATIèè CONèTRUCTION", "BATISS CONSTRUCTION"),
        ("ENGINE èYèTEM MOTORè", "ENGINE SYSTEM MOTORS"),
        ("AGROèPHYèèARL", "AGROSPHYSSARL"),
        ("FRAIè DE TRANèPORT", "FRAIS DE TRANSPORT"),
        ("DIRIGEANTè èOCIAUX", "DIRIGEANTS SOCIAUX"),
        ("MAèTER TECHNOLOGIE INFORMATIQUE", "MASTER TECHNOLOGIE INFORMATIQUE"),
        ("ACQUIèITION DE MULTIPRIèEè", "ACQUISITION DE MULTIPRISES"),
        # Legitimate French that must NOT change
        ("Demande de règlement de la facture", "Demande de règlement de la facture"),
        ("huitièmes de finales", "huitièmes de finales"),
        ("troisème match", "troisème match"),
        ("première session 2024", "première session 2024"),
        ("Dératisation et désinsectisation", "Dératisation et désinsectisation"),
        ("5ème anniversaire de l'ARTI", "5ème anniversaire de l'ARTI"),  # Ordinal - must NOT change
        ("1ère session", "1ère session"),  # Ordinal
        ("3ème étage", "3ème étage"),
    ]

    all_pass = True
    for input_text, expected in test_cases:
        result = fix_corrupted_s(input_text)
        status = "PASS" if result == expected else "FAIL"
        if status == "FAIL":
            all_pass = False
            print(f"  {status}: '{input_text}'")
            print(f"         Expected: '{expected}'")
            print(f"         Got:      '{result}'")
        else:
            print(f"  {status}: '{input_text}' -> '{result}'")

    if not all_pass:
        print("\n  FATAL: Some self-tests failed. Fix the logic before proceeding.")
        sys.exit(1)

    print("\n  All self-tests passed!")

    # ── Process budget_engagements ──
    # Migrated records have numero starting with MIG-
    eng_stats = process_table(
        table="budget_engagements",
        filter_param="numero=like.MIG-*",
        text_fields=["objet", "fournisseur"],
    )

    # ── Process ordonnancements ──
    # Migrated records have legacy_import=true
    ord_stats = process_table(
        table="ordonnancements",
        filter_param="legacy_import=eq.true",
        text_fields=["objet", "beneficiaire"],
    )

    # ── Process budget_liquidations ──
    # Check if there are any migrated liquidations (legacy_import or MIG- prefix)
    # From earlier investigation, budget_liquidations has no MIG- records and no objet field
    # But let's check for legacy_import records with other text fields
    print(f"\n{'='*70}")
    print("Checking budget_liquidations for corrupted data...")
    print(f"{'='*70}")

    # First check what text fields exist
    url = f"{SUPABASE_URL}/rest/v1/budget_liquidations?limit=1&select=*"
    resp = requests.get(url, headers=HEADERS_GET)
    if resp.status_code == 200 and resp.json():
        sample = resp.json()[0]
        text_columns = [k for k, v in sample.items() if isinstance(v, str) and k not in ("id", "numero", "statut", "workflow_status")]
        print(f"  Text columns found: {text_columns}")

        # Check for legacy_import records
        url2 = f"{SUPABASE_URL}/rest/v1/budget_liquidations?legacy_import=eq.true&limit=1&select=id"
        resp2 = requests.get(url2, headers=HEADERS_GET)
        if resp2.status_code == 200 and resp2.json():
            # Check relevant text fields for è
            liq_text_fields = [f for f in text_columns if f in ("observation", "motif_differe", "reference_facture", "rejection_reason")]
            if liq_text_fields:
                liq_stats = process_table(
                    table="budget_liquidations",
                    filter_param="legacy_import=eq.true",
                    text_fields=liq_text_fields,
                )
            else:
                print("  No relevant text fields with potential corruption in budget_liquidations")
                liq_stats = {"scanned": 0, "fixed": 0, "fields_fixed": 0, "errors": 0, "examples": []}
        else:
            print("  No legacy_import records found in budget_liquidations")
            liq_stats = {"scanned": 0, "fixed": 0, "fields_fixed": 0, "errors": 0, "examples": []}
    else:
        print("  Could not read budget_liquidations schema")
        liq_stats = {"scanned": 0, "fixed": 0, "fields_fixed": 0, "errors": 0, "examples": []}

    # ── Summary ──
    print(f"\n{'='*70}")
    print("SUMMARY")
    print(f"{'='*70}")

    total_fixed = 0
    total_fields = 0
    total_errors = 0

    for name, stats in [
        ("budget_engagements", eng_stats),
        ("ordonnancements", ord_stats),
        ("budget_liquidations", liq_stats),
    ]:
        print(f"\n  {name}:")
        print(f"    Scanned:      {stats['scanned']} records")
        print(f"    Fixed:        {stats['fixed']} records")
        print(f"    Fields fixed: {stats['fields_fixed']}")
        print(f"    Errors:       {stats['errors']}")
        total_fixed += stats["fixed"]
        total_fields += stats["fields_fixed"]
        total_errors += stats["errors"]

        if stats["examples"]:
            print(f"    Examples (first {len(stats['examples'])}):")
            for numero, descs in stats["examples"]:
                print(f"      {numero}:")
                for d in descs:
                    print(f"      {d}")

    print(f"\n  TOTAL: {total_fixed} records fixed, {total_fields} fields updated, {total_errors} errors")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
