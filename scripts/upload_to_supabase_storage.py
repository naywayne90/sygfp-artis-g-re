#!/usr/bin/env python3
"""
Upload des pièces jointes SYGFP vers Supabase Storage
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import os
import re
import unicodedata
import mimetypes
from pathlib import Path
from supabase import create_client
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

BUCKET_NAME = 'sygfp-attachments'
SOURCE_DIR = '/tmp/sygfp_fichiers'

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for Supabase Storage"""
    # Normalize unicode characters (convert é to e, etc.)
    normalized = unicodedata.normalize('NFKD', filename)
    ascii_text = normalized.encode('ASCII', 'ignore').decode('ASCII')
    # Replace spaces and special chars with underscores
    sanitized = re.sub(r'[^\w\-_./]', '_', ascii_text)
    # Remove multiple underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized

def get_mime_type(file_path: str) -> str:
    """Determine MIME type from file extension"""
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or 'application/octet-stream'

def upload_file(supabase, local_path: str, storage_path: str):
    """Upload a single file to Supabase Storage"""
    try:
        with open(local_path, 'rb') as f:
            content = f.read()

        mime_type = get_mime_type(local_path)

        # Use upsert to overwrite existing files
        result = supabase.storage.from_(BUCKET_NAME).upload(
            storage_path,
            content,
            file_options={"content-type": mime_type, "upsert": "true"}
        )
        return True, storage_path
    except Exception as e:
        return False, f"{storage_path}: {str(e)[:100]}"

def main():
    print("=== Upload vers Supabase Storage ===")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Source: {SOURCE_DIR}")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Create bucket if not exists
    try:
        supabase.storage.create_bucket(BUCKET_NAME, options={'public': False})
        print(f"Bucket '{BUCKET_NAME}' créé")
    except Exception as e:
        if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
            print(f"Bucket '{BUCKET_NAME}' existe déjà")
        else:
            print(f"Note bucket: {str(e)[:100]}")

    # Collect all files to upload
    files_to_upload = []
    for root, dirs, files in os.walk(SOURCE_DIR):
        for filename in files:
            local_path = os.path.join(root, filename)
            # Create storage path: remove SOURCE_DIR prefix and normalize
            relative_path = os.path.relpath(local_path, SOURCE_DIR)
            storage_path = relative_path.replace('\\', '/')
            # Sanitize the storage path
            storage_path = sanitize_filename(storage_path)
            files_to_upload.append((local_path, storage_path))

    total = len(files_to_upload)
    print(f"\nFichiers à uploader: {total}")

    uploaded = 0
    errors = 0
    start_time = time.time()

    # Upload in batches with threading
    batch_size = 10
    for i in range(0, total, batch_size):
        batch = files_to_upload[i:i+batch_size]

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(upload_file, supabase, local, storage): (local, storage)
                for local, storage in batch
            }

            for future in as_completed(futures):
                success, msg = future.result()
                if success:
                    uploaded += 1
                else:
                    errors += 1
                    if errors <= 10:
                        print(f"  Erreur: {msg}")

        # Progress update every 100 files
        if (i + batch_size) % 100 == 0 or i + batch_size >= total:
            elapsed = time.time() - start_time
            rate = uploaded / elapsed if elapsed > 0 else 0
            eta = (total - uploaded) / rate / 60 if rate > 0 else 0
            print(f"  Progression: {uploaded}/{total} ({uploaded*100//total}%) - {rate:.1f} f/s - ETA: {eta:.1f} min")

    print(f"\n=== RÉSUMÉ ===")
    print(f"  Uploadés: {uploaded}")
    print(f"  Erreurs: {errors}")
    print(f"  Temps: {(time.time() - start_time)/60:.1f} minutes")

if __name__ == '__main__':
    main()
