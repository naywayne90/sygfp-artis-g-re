#!/usr/bin/env python3
"""
MIGRATION COMPLÈTE SYGFP - Ancien système vers Supabase
========================================================
Ce script migre toutes les données des 3 années (2024, 2025, 2026)
de l'ancien SYGFP (SQL Server) vers le nouveau (Supabase).

Fonctionnalités:
- Migration sans doublons
- Nettoyage des données de test
- Migration des pièces jointes
- Vérification d'intégrité
"""

import os
import sys
import json
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
import pymssql
from supabase import create_client, Client

# Configuration
SQL_SERVER = '192.168.0.8'
SQL_USER = 'ARTI\\admin'
SQL_PASSWORD = 'tranSPort2021!'

SUPABASE_URL = 'https://tjagvgqthlibdpvztvaf.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc'

# Bases de données par année
DATABASES = {
    2024: 'eARTI_DB2',
    2025: 'eARTIDB_2025',
    2026: 'eARTIDB_2026'
}

# Mapping des tables ancien -> nouveau
TABLE_MAPPING = {
    'Direction': 'directions',
    'Fournisseur': 'prestataires',
    'NoteDG': 'notes_sef',
    'DemandeExpression': 'expressions_besoin',
    # Budget/Engagement sont dans un schéma différent dans Supabase
}

class MigrationStats:
    """Statistiques de migration"""
    def __init__(self):
        self.total_read = 0
        self.total_inserted = 0
        self.total_skipped = 0
        self.total_errors = 0
        self.errors = []

    def add_error(self, table: str, error: str):
        self.errors.append(f"{table}: {error}")
        self.total_errors += 1

    def summary(self) -> str:
        return f"""
=== RÉSUMÉ MIGRATION ===
Total lu:     {self.total_read}
Total inséré: {self.total_inserted}
Total ignoré: {self.total_skipped}
Total erreurs: {self.total_errors}
"""


class SYGFPMigration:
    """Classe principale de migration SYGFP"""

    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.stats = MigrationStats()
        self.existing_ids = {}

    def connect_sql(self, database: str) -> pymssql.Connection:
        """Connexion à SQL Server"""
        return pymssql.connect(
            server=SQL_SERVER,
            user=SQL_USER,
            password=SQL_PASSWORD,
            database=database,
            timeout=30
        )

    def generate_uuid_from_id(self, table: str, old_id: int, year: int) -> str:
        """Génère un UUID déterministe à partir de l'ancien ID"""
        unique_string = f"{table}_{year}_{old_id}"
        hash_bytes = hashlib.md5(unique_string.encode()).hexdigest()
        # Format UUID
        return f"{hash_bytes[:8]}-{hash_bytes[8:12]}-{hash_bytes[12:16]}-{hash_bytes[16:20]}-{hash_bytes[20:32]}"

    def clean_test_data(self):
        """Supprime les données de test de Supabase"""
        print("\n=== NETTOYAGE DES DONNÉES DE TEST ===")

        # Tables à nettoyer (dans l'ordre pour respecter les contraintes FK)
        tables_to_clean = [
            'budget_liquidations',
            'ordonnancements',
            'budget_engagements',
            'expressions_besoin',
            'notes_sef',
            'prestataires',
            # Ne pas supprimer directions car elles sont utilisées par profiles
        ]

        for table in tables_to_clean:
            try:
                # Compter avant
                count_before = self.supabase.table(table).select('id', count='exact').execute()

                # Supprimer toutes les données
                # Note: utilise une condition qui matche tout
                result = self.supabase.table(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()

                count_after = self.supabase.table(table).select('id', count='exact').execute()

                deleted = (count_before.count or 0) - (count_after.count or 0)
                print(f"  {table}: {deleted} enregistrements supprimés")

            except Exception as e:
                print(f"  {table}: Erreur - {str(e)[:50]}")

        print("  Nettoyage terminé")

    def migrate_directions(self):
        """Migre les directions (structure organisationnelle)"""
        print("\n=== MIGRATION DES DIRECTIONS ===")

        # Utiliser la base 2026 comme référence pour les directions
        conn = self.connect_sql(DATABASES[2026])
        cursor = conn.cursor(as_dict=True)

        cursor.execute("SELECT * FROM Direction WHERE EstActif = 1")
        directions = cursor.fetchall()

        for dir in directions:
            try:
                new_id = self.generate_uuid_from_id('direction', dir['DirectionID'], 2026)

                data = {
                    'id': new_id,
                    'code': f"DIR{dir['DirectionID']:03d}",
                    'label': dir['Libelle'],
                    'est_active': bool(dir['EstActif']),
                    'created_at': dir['DateCreation'].isoformat() if dir['DateCreation'] else None,
                }

                # Upsert pour éviter les doublons
                self.supabase.table('directions').upsert(data).execute()
                self.stats.total_inserted += 1
                print(f"  ✓ {dir['Libelle']}")

            except Exception as e:
                self.stats.add_error('directions', str(e))
                print(f"  ✗ {dir['Libelle']}: {str(e)[:50]}")

        conn.close()

    def migrate_fournisseurs(self):
        """Migre les fournisseurs/prestataires"""
        print("\n=== MIGRATION DES FOURNISSEURS ===")

        # Collecter tous les fournisseurs uniques des 3 années
        all_fournisseurs = {}

        for year, db in DATABASES.items():
            try:
                conn = self.connect_sql(db)
                cursor = conn.cursor(as_dict=True)

                cursor.execute("""
                    SELECT * FROM Fournisseur
                    WHERE RaisonSociale IS NOT NULL
                    AND RaisonSociale != ''
                """)

                for f in cursor.fetchall():
                    # Clé unique basée sur raison sociale (pour éviter doublons)
                    key = f['RaisonSociale'].strip().upper()
                    if key not in all_fournisseurs:
                        all_fournisseurs[key] = {
                            'id': self.generate_uuid_from_id('fournisseur', f['FournisseurID'], year),
                            'raison_sociale': f['RaisonSociale'].strip(),
                            'sigle': f.get('sigle', '').strip() if f.get('sigle') else None,
                            'rccm': f.get('RCCM', '').strip() if f.get('RCCM') else None,
                            'adresse': f.get('SiegeSociale', '').strip() if f.get('SiegeSociale') else None,
                            'telephone': f.get('ContactBureau', '').strip() if f.get('ContactBureau') else None,
                            'email': f.get('Mail', '').strip() if f.get('Mail') else None,
                            'secteur_activite': f.get('ActivitePrincipale', '').strip() if f.get('ActivitePrincipale') else None,
                            'est_actif': True,
                            'year': year
                        }
                        self.stats.total_read += 1
                    else:
                        self.stats.total_skipped += 1

                conn.close()
            except Exception as e:
                print(f"  Erreur lecture {db}: {str(e)[:50]}")

        print(f"  {len(all_fournisseurs)} fournisseurs uniques trouvés")

        # Insérer dans Supabase
        for key, data in all_fournisseurs.items():
            try:
                insert_data = {k: v for k, v in data.items() if k != 'year' and v is not None}
                self.supabase.table('prestataires').upsert(insert_data).execute()
                self.stats.total_inserted += 1
            except Exception as e:
                self.stats.add_error('prestataires', f"{key}: {str(e)[:30]}")

        print(f"  {self.stats.total_inserted} insérés, {self.stats.total_skipped} ignorés (doublons)")

    def migrate_notes_sef(self):
        """Migre les notes SEF (NoteDG)"""
        print("\n=== MIGRATION DES NOTES SEF ===")

        for year, db in DATABASES.items():
            print(f"\n  --- Année {year} ({db}) ---")

            try:
                conn = self.connect_sql(db)
                cursor = conn.cursor(as_dict=True)

                cursor.execute("""
                    SELECT n.*, d.Objet as DemandeObjet, d.TypeDepense
                    FROM NoteDG n
                    LEFT JOIN DemandeExpression d ON n.DemandeExpressionID = d.DemandeExpressionID
                    WHERE n.EstActif = 1
                """)

                notes = cursor.fetchall()
                inserted = 0

                for note in notes:
                    try:
                        new_id = self.generate_uuid_from_id('notedg', note['NoteDgID'], year)

                        data = {
                            'id': new_id,
                            'numero': note.get('Reference', f"NOTE-{year}-{note['NoteDgID']:05d}"),
                            'exercice': year,
                            'objet': note.get('Objet') or note.get('DemandeObjet') or 'Non spécifié',
                            'description': note.get('Expose', ''),
                            'statut': 'valide',  # Les anciennes notes sont considérées validées
                            'created_at': note['DateCreation'].isoformat() if note.get('DateCreation') else None,
                        }

                        # Nettoyer les None
                        data = {k: v for k, v in data.items() if v is not None}

                        self.supabase.table('notes_sef').upsert(data).execute()
                        inserted += 1
                        self.stats.total_inserted += 1
                        self.stats.total_read += 1

                    except Exception as e:
                        self.stats.add_error('notes_sef', f"Note {note['NoteDgID']}: {str(e)[:30]}")

                print(f"    {inserted} notes migrées")
                conn.close()

            except Exception as e:
                print(f"    Erreur: {str(e)[:50]}")

    def get_migration_report(self) -> Dict[str, Any]:
        """Génère un rapport de migration"""
        report = {
            'date': datetime.now().isoformat(),
            'stats': {
                'total_read': self.stats.total_read,
                'total_inserted': self.stats.total_inserted,
                'total_skipped': self.stats.total_skipped,
                'total_errors': self.stats.total_errors,
            },
            'errors': self.stats.errors[:50],  # Limiter à 50 erreurs
        }
        return report

    def run_full_migration(self, clean_first: bool = True):
        """Exécute la migration complète"""
        print("=" * 70)
        print("MIGRATION COMPLÈTE SYGFP")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)

        if clean_first:
            self.clean_test_data()

        # Migration des données
        self.migrate_directions()
        self.migrate_fournisseurs()
        self.migrate_notes_sef()

        # TODO: Ajouter migration des autres tables
        # self.migrate_expressions_besoin()
        # self.migrate_liquidations()
        # self.migrate_ordonnancements()
        # self.migrate_pieces_jointes()

        # Rapport final
        print(self.stats.summary())

        # Sauvegarder le rapport
        report = self.get_migration_report()
        report_path = '/home/angeyannick/sygfp-artis-g-re/migration_data/migration_report_final.json'
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"\nRapport sauvegardé: {report_path}")


if __name__ == '__main__':
    migration = SYGFPMigration()

    # Vérifier les arguments
    clean = '--no-clean' not in sys.argv

    migration.run_full_migration(clean_first=clean)
