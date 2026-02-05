#!/usr/bin/env python3
"""
Upload stable des fichiers SYGFP vers Supabase Storage
Version optimisée avec rate limiting et reprise automatique
"""

import sys
sys.path.insert(0, '/home/angeyannick/.local/lib/python3.12/site-packages')

import os
import re
import unicodedata
from supabase import create_client
import time
import json
from pathlib import Path

# Configuration
SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'
SOURCE_DIR = '/tmp/sygfp_fichiers'
BUCKET_NAME = 'sygfp-attachments'
PROGRESS_FILE = '/tmp/upload_progress.json'

# Rate limiting
DELAY_BETWEEN_UPLOADS = 0.3  # 300ms entre chaque upload
BATCH_SIZE = 20              # Taille des lots
BATCH_DELAY = 2              # Pause entre les lots
MAX_RETRIES = 5              # Nombre max de tentatives

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

def upload_with_retry(supabase, local_path: str, storage_path: str):
    """Upload a single file with retry logic"""
    for attempt in range(MAX_RETRIES):
        try:
            with open(local_path, 'rb') as f:
                content = f.read()

            supabase.storage.from_(BUCKET_NAME).upload(
                storage_path,
                content,
                file_options={'upsert': 'true'}
            )
            return True, None
        except Exception as e:
            error_msg = str(e)
            if 'disconnected' in error_msg.lower() or 'timeout' in error_msg.lower():
                # Wait exponentially longer for disconnection errors
                wait_time = (2 ** attempt) * DELAY_BETWEEN_UPLOADS
                time.sleep(wait_time)
            elif attempt < MAX_RETRIES - 1:
                time.sleep(DELAY_BETWEEN_UPLOADS)
            else:
                return False, error_msg[:100]
    return False, "Max retries exceeded"

def main():
    print("=" * 60)
    print("UPLOAD STABLE SYGFP → SUPABASE STORAGE")
    print("=" * 60)
    print(f"Source: {SOURCE_DIR}")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Délai entre uploads: {DELAY_BETWEEN_UPLOADS}s")
    print(f"Taille des lots: {BATCH_SIZE}")

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
    total_files = total + len(already_uploaded)
    print(f"Fichiers restants à uploader: {total}")
    print(f"Total fichiers: {total_files}")

    if total == 0:
        print("\n✅ Tous les fichiers sont déjà uploadés!")
        return

    # Upload files one by one with rate limiting
    uploaded = 0
    errors = 0
    error_list = progress.get('errors', [])
    start_time = time.time()

    for i, (local_path, storage_path) in enumerate(files_to_upload):
        success, error = upload_with_retry(supabase, local_path, storage_path)

        if success:
            uploaded += 1
            already_uploaded.add(storage_path)
        else:
            errors += 1
            error_list.append({'path': storage_path, 'error': error})
            if errors <= 20:
                print(f"  ❌ {storage_path[:50]}... - {error}")

        # Rate limiting
        time.sleep(DELAY_BETWEEN_UPLOADS)

        # Batch pause
        if (i + 1) % BATCH_SIZE == 0:
            # Update progress
            progress['uploaded'] = list(already_uploaded)
            progress['errors'] = error_list
            save_progress(progress)

            # Progress report
            elapsed = time.time() - start_time
            rate = uploaded / elapsed if elapsed > 0 else 0
            remaining = total - (i + 1)
            eta = remaining / rate / 60 if rate > 0 else 0
            pct = (i + 1) * 100 // total

            print(f"  [{pct:3d}%] {uploaded}/{total} - {rate:.1f} f/s - ETA: {eta:.1f} min - Erreurs: {errors}")
            sys.stdout.flush()

            # Pause between batches
            time.sleep(BATCH_DELAY)

    # Final save
    progress['uploaded'] = list(already_uploaded)
    progress['errors'] = error_list
    save_progress(progress)

    # Final report
    elapsed = time.time() - start_time
    print("\n" + "=" * 60)
    print("RÉSUMÉ FINAL")
    print("=" * 60)
    print(f"  ✅ Uploadés: {uploaded}")
    print(f"  ❌ Erreurs: {errors}")
    print(f"  📁 Total dans bucket: {len(already_uploaded)}")
    print(f"  ⏱️ Temps: {elapsed / 60:.1f} minutes")
    print(f"  📈 Vitesse moyenne: {uploaded / elapsed:.2f} f/s" if elapsed > 0 else "")

    if errors > 0:
        print(f"\n⚠️ Fichiers en erreur sauvegardés dans: {PROGRESS_FILE}")
        print(f"   Relancez le script pour réessayer les fichiers échoués.")

if __name__ == '__main__':
    main()
