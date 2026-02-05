#!/usr/bin/env python3
"""
Upload optimisé de TOUS les fichiers SYGFP vers Supabase Storage
Avec gestion des erreurs et reprise automatique
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import os
import re
import unicodedata
from supabase import create_client
import time
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'
SOURCE_DIR = '/tmp/sygfp_fichiers'
BUCKET_NAME = 'sygfp-attachments'
PROGRESS_FILE = '/tmp/upload_progress.json'

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for Supabase Storage"""
    normalized = unicodedata.normalize('NFKD', filename)
    ascii_text = normalized.encode('ASCII', 'ignore').decode('ASCII')
    sanitized = re.sub(r'[^\w\-_./]', '_', ascii_text)
    sanitized = re.sub(r'_+', '_', sanitized)
    return sanitized

def load_progress():
    """Load upload progress from file"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {'uploaded': [], 'errors': []}

def save_progress(progress):
    """Save upload progress to file"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f)

def upload_single_file(supabase, local_path: str, storage_path: str):
    """Upload a single file with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with open(local_path, 'rb') as f:
                content = f.read()

            supabase.storage.from_(BUCKET_NAME).upload(
                storage_path,
                content,
                file_options={'upsert': 'true'}
            )
            return True, storage_path, None
        except Exception as e:
            if attempt == max_retries - 1:
                return False, storage_path, str(e)[:100]
            time.sleep(1)
    return False, storage_path, "Max retries exceeded"

def main():
    print("=" * 60)
    print("UPLOAD COMPLET SYGFP → SUPABASE STORAGE")
    print("=" * 60)
    print(f"Source: {SOURCE_DIR}")
    print(f"Bucket: {BUCKET_NAME}")

    # Initialize Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load previous progress
    progress = load_progress()
    already_uploaded = set(progress.get('uploaded', []))
    print(f"\nFichiers déjà uploadés: {len(already_uploaded)}")

    # Collect all files
    files_to_upload = []
    for root, dirs, files in os.walk(SOURCE_DIR):
        for filename in files:
            local_path = os.path.join(root, filename)
            relative_path = os.path.relpath(local_path, SOURCE_DIR)
            storage_path = sanitize_filename(relative_path.replace('\\', '/'))

            if storage_path not in already_uploaded:
                files_to_upload.append((local_path, storage_path))

    total = len(files_to_upload)
    print(f"Fichiers à uploader: {total}")

    if total == 0:
        print("\nTous les fichiers sont déjà uploadés!")
        return

    # Upload in batches
    batch_size = 50
    uploaded = 0
    errors = 0
    error_list = progress.get('errors', [])
    start_time = time.time()

    for i in range(0, total, batch_size):
        batch = files_to_upload[i:i + batch_size]

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {
                executor.submit(upload_single_file, supabase, local, storage): (local, storage)
                for local, storage in batch
            }

            for future in as_completed(futures):
                success, path, error = future.result()
                if success:
                    uploaded += 1
                    already_uploaded.add(path)
                else:
                    errors += 1
                    error_list.append({'path': path, 'error': error})
                    if errors <= 10:
                        print(f"  Erreur: {path[:60]}... - {error}")

        # Update progress
        progress['uploaded'] = list(already_uploaded)
        progress['errors'] = error_list
        save_progress(progress)

        # Progress report every batch
        elapsed = time.time() - start_time
        rate = uploaded / elapsed if elapsed > 0 else 0
        remaining = total - (i + batch_size)
        eta = remaining / rate / 60 if rate > 0 else 0

        pct = min(100, (i + batch_size) * 100 // total)
        print(f"  [{pct:3d}%] {uploaded}/{total} - {rate:.1f} f/s - ETA: {eta:.1f} min - Erreurs: {errors}")
        sys.stdout.flush()

    # Final report
    print("\n" + "=" * 60)
    print("RÉSUMÉ FINAL")
    print("=" * 60)
    print(f"  Total fichiers: {total + len(progress.get('uploaded', []))}")
    print(f"  Uploadés: {uploaded} (cette session)")
    print(f"  Déjà uploadés: {len(progress.get('uploaded', [])) - uploaded}")
    print(f"  Erreurs: {errors}")
    print(f"  Temps: {(time.time() - start_time) / 60:.1f} minutes")

    if errors > 0:
        print(f"\nVoir les erreurs dans: {PROGRESS_FILE}")

if __name__ == '__main__':
    main()
