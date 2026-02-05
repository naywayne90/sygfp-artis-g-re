#!/usr/bin/env python3
"""
Script de mapping des pièces jointes migrées vers les enregistrements Supabase
Associe les fichiers uploadés aux engagements, liquidations et ordonnancements
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import os
import re
import unicodedata
from pathlib import Path
from supabase import create_client
from datetime import datetime
import hashlib

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

BUCKET_NAME = 'sygfp-attachments'
SOURCE_DIR = '/tmp/sygfp_fichiers'

# Mapping des types de documents
DOC_TYPE_MAPPING = {
    'AutrePieces': 'autre',
    'BonCommande': 'bon_commande',
    'Devis_Proforma': 'devis_proforma',
    'FicheContrat': 'fiche_contrat',
    'FactureNormalise': 'facture',
    'FicheRealite': 'service_fait',
    'RapportEtude': 'rapport',
    'BonCaisse': 'bon_caisse',
    'FicheOrdonnancement': 'fiche_ordonnancement'
}

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for Supabase Storage"""
    normalized = unicodedata.normalize('NFKD', filename)
    ascii_text = normalized.encode('ASCII', 'ignore').decode('ASCII')
    sanitized = re.sub(r'[^\w\-_./]', '_', ascii_text)
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized

def generate_uuid(prefix: str, identifier: str) -> str:
    """Generate deterministic UUID from prefix and identifier"""
    unique_string = f"{prefix}_{identifier}"
    hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
    return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"

def extract_reference_from_filename(filename: str) -> dict:
    """Extract ARTI reference from filename"""
    # Pattern: ARTI followed by 2 digits (type) + 2 digits (year) + 4 digits (sequence)
    patterns = [
        r'ARTI(\d{2})(\d{2})(\d{4})',  # ARTI10240001
        r'ARTI-?(\d{2})-?(\d{2})-?(\d{4})',  # ARTI-10-24-0001
    ]

    for pattern in patterns:
        match = re.search(pattern, filename, re.IGNORECASE)
        if match:
            type_code = match.group(1)
            year = match.group(2)
            sequence = match.group(3)
            full_year = f"20{year}"
            return {
                'type_code': type_code,
                'year': full_year,
                'sequence': sequence,
                'reference': f"ARTI{type_code}{year}{sequence}"
            }
    return None

def get_entity_type(type_code: str) -> str:
    """Determine entity type from ARTI code"""
    # ARTI10 = Engagement
    # ARTI20 = Liquidation
    # ARTI30 = Ordonnancement
    mapping = {
        '10': 'engagement',
        '11': 'engagement',
        '20': 'liquidation',
        '21': 'liquidation',
        '30': 'ordonnancement',
        '31': 'ordonnancement'
    }
    return mapping.get(type_code, 'unknown')

def get_document_category(folder_path: str) -> str:
    """Determine document category from folder structure"""
    path_lower = folder_path.lower()
    if 'engagement' in path_lower:
        return 'engagement'
    elif 'liquidation' in path_lower:
        return 'liquidation'
    elif 'ordonnancement' in path_lower:
        return 'ordonnancement'
    return 'unknown'

def get_document_type(folder_path: str) -> str:
    """Extract document type from folder name"""
    for doc_type, mapped_type in DOC_TYPE_MAPPING.items():
        if doc_type in folder_path:
            return mapped_type
    return 'autre'

def main():
    print("=== Mapping des pièces jointes migrées ===")
    print(f"Source: {SOURCE_DIR}")
    print(f"Bucket: {BUCKET_NAME}")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Collect all files and their info
    files_info = []

    for root, dirs, files in os.walk(SOURCE_DIR):
        for filename in files:
            local_path = os.path.join(root, filename)
            relative_path = os.path.relpath(local_path, SOURCE_DIR)
            storage_path = sanitize_filename(relative_path.replace('\\', '/'))

            # Get file size
            try:
                file_size = os.path.getsize(local_path)
            except:
                file_size = 0

            # Determine document category and type
            doc_category = get_document_category(root)
            doc_type = get_document_type(root)

            # Try to extract reference from filename
            ref_info = extract_reference_from_filename(filename)

            files_info.append({
                'local_path': local_path,
                'storage_path': storage_path,
                'filename': filename,
                'file_size': file_size,
                'doc_category': doc_category,
                'doc_type': doc_type,
                'ref_info': ref_info
            })

    print(f"\nTotal fichiers analysés: {len(files_info)}")

    # Group by category
    by_category = {}
    for f in files_info:
        cat = f['doc_category']
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(f)

    print("\nRépartition par catégorie:")
    for cat, items in by_category.items():
        print(f"  {cat}: {len(items)} fichiers")

    # Load existing records from database
    print("\n=== Chargement des enregistrements existants ===")

    # Get engagements
    engagements = supabase.table('budget_engagements').select('id, numero').execute()
    eng_by_numero = {e['numero']: e['id'] for e in engagements.data if e.get('numero')}
    print(f"Engagements chargés: {len(eng_by_numero)}")

    # Get liquidations
    liquidations = supabase.table('budget_liquidations').select('id, numero').execute()
    liq_by_numero = {l['numero']: l['id'] for l in liquidations.data if l.get('numero')}
    print(f"Liquidations chargées: {len(liq_by_numero)}")

    # Get ordonnancements
    ordonnancements = supabase.table('ordonnancements').select('id, numero').execute()
    ord_by_numero = {o['numero']: o['id'] for o in ordonnancements.data if o.get('numero')}
    print(f"Ordonnancements chargés: {len(ord_by_numero)}")

    # Create mapping records
    print("\n=== Création des mappings ===")

    engagement_attachments = []
    liquidation_attachments = []
    ordonnancement_attachments = []

    unmapped_files = []

    for f in files_info:
        ref_info = f['ref_info']
        storage_url = f"sygfp-attachments/{f['storage_path']}"

        # Generate deterministic UUID for the attachment
        attachment_id = generate_uuid('attachment', f['storage_path'])

        base_record = {
            'id': attachment_id,
            'file_name': f['filename'],
            'file_path': storage_url,
            'file_type': f['doc_type'],
            'file_size': f['file_size'],
            'created_at': datetime.now().isoformat(),
            'is_migrated': True
        }

        matched = False

        if ref_info:
            ref = ref_info['reference']
            entity_type = get_entity_type(ref_info['type_code'])

            if entity_type == 'engagement' and ref in eng_by_numero:
                record = base_record.copy()
                record['engagement_id'] = eng_by_numero[ref]
                engagement_attachments.append(record)
                matched = True
            elif entity_type == 'liquidation' and ref in liq_by_numero:
                record = base_record.copy()
                record['liquidation_id'] = liq_by_numero[ref]
                liquidation_attachments.append(record)
                matched = True
            elif entity_type == 'ordonnancement' and ref in ord_by_numero:
                record = base_record.copy()
                record['ordonnancement_id'] = ord_by_numero[ref]
                ordonnancement_attachments.append(record)
                matched = True

            # Try alternative matching with ARTI20 -> ARTI10 conversion
            if not matched and ref_info['type_code'] == '20':
                # Convert to engagement number
                eng_ref = f"ARTI10{ref_info['year'][2:]}{ref_info['sequence']}"
                if eng_ref in eng_by_numero:
                    record = base_record.copy()
                    record['engagement_id'] = eng_by_numero[eng_ref]
                    record['file_type'] = 'liquidation_' + f['doc_type']
                    engagement_attachments.append(record)
                    matched = True

        # Match by folder category if no reference match
        if not matched:
            if f['doc_category'] == 'engagement':
                # Store with generic engagement mapping
                unmapped_files.append({'category': 'engagement', **f})
            elif f['doc_category'] == 'liquidation':
                unmapped_files.append({'category': 'liquidation', **f})
            elif f['doc_category'] == 'ordonnancement':
                unmapped_files.append({'category': 'ordonnancement', **f})
            else:
                unmapped_files.append({'category': 'unknown', **f})

    print(f"\nMappings créés:")
    print(f"  Engagement attachments: {len(engagement_attachments)}")
    print(f"  Liquidation attachments: {len(liquidation_attachments)}")
    print(f"  Ordonnancement attachments: {len(ordonnancement_attachments)}")
    print(f"  Fichiers non mappés: {len(unmapped_files)}")

    # Insert into database
    print("\n=== Insertion dans la base de données ===")

    # Insert engagement attachments
    if engagement_attachments:
        batch_size = 100
        inserted = 0
        for i in range(0, len(engagement_attachments), batch_size):
            batch = engagement_attachments[i:i+batch_size]
            # Prepare records for insertion
            insert_records = [{
                'id': r['id'],
                'engagement_id': r['engagement_id'],
                'file_name': r['file_name'],
                'file_path': r['file_path'],
                'file_type': r['file_type'],
                'file_size': r['file_size']
            } for r in batch]
            try:
                supabase.table('engagement_attachments').upsert(insert_records).execute()
                inserted += len(batch)
            except Exception as e:
                print(f"  Erreur engagement batch {i}: {str(e)[:100]}")
        print(f"  Engagement attachments insérés: {inserted}")

    # Insert liquidation attachments
    if liquidation_attachments:
        batch_size = 100
        inserted = 0
        for i in range(0, len(liquidation_attachments), batch_size):
            batch = liquidation_attachments[i:i+batch_size]
            insert_records = [{
                'id': r['id'],
                'liquidation_id': r['liquidation_id'],
                'file_name': r['file_name'],
                'file_path': r['file_path'],
                'file_type': r['file_type'],
                'file_size': r['file_size']
            } for r in batch]
            try:
                supabase.table('liquidation_attachments').upsert(insert_records).execute()
                inserted += len(batch)
            except Exception as e:
                print(f"  Erreur liquidation batch {i}: {str(e)[:100]}")
        print(f"  Liquidation attachments insérés: {inserted}")

    # Insert ordonnancement attachments
    if ordonnancement_attachments:
        batch_size = 100
        inserted = 0
        for i in range(0, len(ordonnancement_attachments), batch_size):
            batch = ordonnancement_attachments[i:i+batch_size]
            insert_records = [{
                'id': r['id'],
                'ordonnancement_id': r['ordonnancement_id'],
                'file_name': r['file_name'],
                'file_path': r['file_path'],
                'file_type': r['file_type'],
                'file_size': r['file_size']
            } for r in batch]
            try:
                supabase.table('ordonnancement_attachments').upsert(insert_records).execute()
                inserted += len(batch)
            except Exception as e:
                print(f"  Erreur ordonnancement batch {i}: {str(e)[:100]}")
        print(f"  Ordonnancement attachments insérés: {inserted}")

    # Save unmapped files report
    if unmapped_files:
        report_path = '/home/angeyannick/sygfp-artis-g-re/docs/FICHIERS_NON_MAPPES.md'
        with open(report_path, 'w') as f:
            f.write("# Fichiers Non Mappés\n\n")
            f.write(f"**Total:** {len(unmapped_files)} fichiers\n\n")

            by_cat = {}
            for uf in unmapped_files:
                cat = uf['category']
                if cat not in by_cat:
                    by_cat[cat] = []
                by_cat[cat].append(uf)

            for cat, items in by_cat.items():
                f.write(f"## {cat.title()} ({len(items)} fichiers)\n\n")
                for item in items[:20]:  # Show first 20
                    f.write(f"- `{item['storage_path']}`\n")
                if len(items) > 20:
                    f.write(f"- ... et {len(items) - 20} autres\n")
                f.write("\n")

        print(f"\nRapport des fichiers non mappés: {report_path}")

    print("\n=== TERMINÉ ===")

if __name__ == '__main__':
    main()
