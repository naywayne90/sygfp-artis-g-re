#!/usr/bin/env python3
"""
Script de nettoyage professionnel des directions et du personnel ARTI
- Fusion des doublons de directions
- Réaffectation correcte du personnel
- Correction de KOUAKOU-KAN vers CM
"""

from supabase import create_client, Client
from datetime import datetime

# Configuration Supabase
SUPABASE_URL = "https://tjagvgqthlibdpvztvaf.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# =============================================================================
# MAPPING DES DIRECTIONS - On garde une seule ID par sigle
# Format: sigle -> (ID à garder, label officiel)
# =============================================================================
DIRECTIONS_OFFICIELLES = {
    "DG": {
        "id": "92f5f18f-dcaf-4f96-b50d-4a8e5ea9f8bf",
        "label": "Direction Générale",
        "code": "DG"
    },
    "DAAF": {
        "id": "4ad86b02-8fa8-4b6e-abff-d9350fbe7928",
        "label": "Direction des Affaires Administratives et Financières",
        "code": "DAAF"
    },
    "DSI": {
        "id": "6ecac2e4-876d-4197-a27f-cfb03c1cd457",
        "label": "Direction des Systèmes d'Information",
        "code": "DSI"
    },
    "DSESP": {
        "id": "c73880c1-d2ac-4343-9690-9da71f8fbb56",
        "label": "Direction des Statistiques, des Études, de la Stratégie et de la Prospective",
        "code": "DSESP"
    },
    "DRRN": {
        "id": "df2ffeab-863d-4a04-b935-77527b8ae34a",
        "label": "Direction des Recours, de la Réglementation et des Normes",
        "code": "DRRN"
    },
    "DCSTI": {
        "id": "20c20a26-d426-49ab-af83-930384c44a1b",
        "label": "Direction du Contrôle et de Surveillance du Transport Intérieur",
        "code": "DCSTI"
    },
    "DGPECRP": {
        "id": "7af769e8-852f-4a7b-b719-030d75685f4d",
        "label": "Direction de la Gestion Prévisionnelle de l'Emploi, des Compétences et des Relations Publiques",
        "code": "DGPECRP"
    },
    "DCP": {
        "id": "f4a1bf7d-92cb-4a65-ab5b-e086bc4b9112",
        "label": "Direction de la Communication et du Partenariat",
        "code": "DCP"
    },
    "DQ": {
        "id": "975881a5-3740-47ba-b1c0-ba49365cc618",
        "label": "Direction de la Qualité",
        "code": "DQ"
    },
    "DCZ": {
        "id": "d24c51f8-5d22-47d9-8ef0-9e1c67717b4b",
        "label": "Direction Centrale des Zones",
        "code": "DCZ"
    },
    "CM": {
        "id": "174f0e5d-bd70-4704-bded-31e0501fc88f",
        "label": "Chargé de Mission du Directeur Général",
        "code": "CM"
    },
    "CB": {
        "id": "40c2f5ab-6df9-4244-9fc7-8259daa3396e",
        "label": "Contrôleur Budgétaire",
        "code": "CB"
    },
    "AICB": {
        "id": "5e22af07-6b5e-4876-b595-a32c55266fc8",
        "label": "Auditeur Interne / Contrôleur Budgétaire",
        "code": "AICB"
    },
    "PCR": {
        "id": "a4bdf58a-f225-4836-9b6b-798726fb8247",
        "label": "Présidence du Conseil de Régulation",
        "code": "PCR"
    },
    "DP": {
        "id": "44b2c597-b830-4943-b339-99a5587bb035",
        "label": "Direction du Patrimoine",
        "code": "DP"
    },
    "SDMG": {
        "id": "d325dbe2-6f4d-4eca-a4fa-391a1f209b8e",
        "label": "Service des Moyens Généraux",
        "code": "SDMG"
    }
}

# IDs des directions à désactiver (doublons)
DIRECTIONS_A_DESACTIVER = [
    "82ad9d62-6d77-49c8-ae40-42ecda883988",  # DG doublon
    "160c017f-6fa4-4bc4-aca2-8ad14b8defe6",  # DAAF doublon
    "972a439a-bee5-4d52-83c0-a930d4a66063",  # DSI doublon
    "95707c43-9401-43e0-9c7b-82e4c109581b",  # DSESP doublon
    "d092f177-2417-42d1-8e5b-4d73af3186a9",  # DRRN doublon
    "16f0f1ba-ebe7-403f-b1ca-83ef96f3ac21",  # DCSTI doublon
    "61e761d0-944e-4f97-a123-9c75ca3124ec",  # DGPECRP doublon
    "31d74f5b-bc17-49f2-80cf-6a50d179b407",  # AC (pas une vraie direction)
    "9d4c9c39-b1cd-42b9-9a62-cf8d8ab55f7e",  # AS (pas une vraie direction)
]

# Personnel à réaffecter à CM
PERSONNEL_CM = [
    "c322544f-20a4-4854-8d9f-3e4d34f25900",  # KOUAKOU-KAN Jean-Marc Akhenaton
]

# Mapping des anciennes directions vers les nouvelles
MIGRATION_MAP = {
    # DG doublons
    "82ad9d62-6d77-49c8-ae40-42ecda883988": "92f5f18f-dcaf-4f96-b50d-4a8e5ea9f8bf",
    # DAAF doublons
    "160c017f-6fa4-4bc4-aca2-8ad14b8defe6": "4ad86b02-8fa8-4b6e-abff-d9350fbe7928",
    # DSI doublons
    "972a439a-bee5-4d52-83c0-a930d4a66063": "6ecac2e4-876d-4197-a27f-cfb03c1cd457",
    # DSESP doublons
    "95707c43-9401-43e0-9c7b-82e4c109581b": "c73880c1-d2ac-4343-9690-9da71f8fbb56",
    # DRRN doublons
    "d092f177-2417-42d1-8e5b-4d73af3186a9": "df2ffeab-863d-4a04-b935-77527b8ae34a",
    # DCSTI doublons
    "16f0f1ba-ebe7-403f-b1ca-83ef96f3ac21": "20c20a26-d426-49ab-af83-930384c44a1b",
    # DGPECRP doublons
    "61e761d0-944e-4f97-a123-9c75ca3124ec": "7af769e8-852f-4a7b-b719-030d75685f4d",
}


def step1_migrate_personnel():
    """Étape 1: Migrer le personnel des directions en doublon vers les directions officielles"""
    print("\n" + "="*60)
    print("ÉTAPE 1: Migration du personnel vers directions officielles")
    print("="*60)

    migrated = 0
    for old_id, new_id in MIGRATION_MAP.items():
        # Trouver le personnel dans l'ancienne direction
        result = supabase.table("profiles").select("id, full_name").eq("direction_id", old_id).execute()

        if result.data:
            for profile in result.data:
                # Trouver le sigle de la nouvelle direction
                new_sigle = None
                for sigle, info in DIRECTIONS_OFFICIELLES.items():
                    if info["id"] == new_id:
                        new_sigle = sigle
                        break

                # Migrer
                supabase.table("profiles").update({
                    "direction_id": new_id,
                    "direction_code": new_sigle,
                    "updated_at": datetime.now().isoformat()
                }).eq("id", profile["id"]).execute()

                print(f"  ✅ {profile['full_name']} -> {new_sigle}")
                migrated += 1

    print(f"\n  Total migré: {migrated} profils")
    return migrated


def step2_assign_cm():
    """Étape 2: Assigner KOUAKOU-KAN à la direction CM"""
    print("\n" + "="*60)
    print("ÉTAPE 2: Affectation Chargé de Mission du DG")
    print("="*60)

    cm_info = DIRECTIONS_OFFICIELLES["CM"]

    for profile_id in PERSONNEL_CM:
        result = supabase.table("profiles").select("full_name").eq("id", profile_id).execute()
        if result.data:
            name = result.data[0]["full_name"]

            supabase.table("profiles").update({
                "direction_id": cm_info["id"],
                "direction_code": "CM",
                "updated_at": datetime.now().isoformat()
            }).eq("id", profile_id).execute()

            print(f"  ✅ {name} -> CM (Chargé de Mission du DG)")


def step3_update_directions():
    """Étape 3: Mettre à jour les libellés et sigles des directions officielles"""
    print("\n" + "="*60)
    print("ÉTAPE 3: Mise à jour des directions officielles")
    print("="*60)

    for sigle, info in DIRECTIONS_OFFICIELLES.items():
        supabase.table("directions").update({
            "sigle": sigle,
            "label": info["label"],
            "code": info["code"],
            "est_active": True,
            "updated_at": datetime.now().isoformat()
        }).eq("id", info["id"]).execute()

        print(f"  ✅ {sigle}: {info['label'][:50]}...")


def step4_deactivate_duplicates():
    """Étape 4: Désactiver les directions en doublon"""
    print("\n" + "="*60)
    print("ÉTAPE 4: Désactivation des directions en doublon")
    print("="*60)

    for dir_id in DIRECTIONS_A_DESACTIVER:
        # Vérifier qu'il n'y a plus de personnel
        result = supabase.table("profiles").select("id").eq("direction_id", dir_id).execute()

        if result.data:
            print(f"  ⚠️ Direction {dir_id} a encore {len(result.data)} profils - non désactivée")
        else:
            supabase.table("directions").update({
                "est_active": False,
                "updated_at": datetime.now().isoformat()
            }).eq("id", dir_id).execute()
            print(f"  ✅ Direction {dir_id} désactivée")


def step5_verify():
    """Étape 5: Vérification finale"""
    print("\n" + "="*60)
    print("ÉTAPE 5: Vérification finale")
    print("="*60)

    # Compter le personnel par direction
    result = supabase.table("profiles").select("direction_code").eq("is_active", True).execute()

    from collections import Counter
    counts = Counter(p.get("direction_code") or "SANS_DIRECTION" for p in result.data)

    print("\n  📊 Répartition du personnel par direction:")
    for code, count in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"     {code}: {count} personne(s)")

    # Vérifier CM
    cm_result = supabase.table("profiles").select("full_name, poste").eq("direction_code", "CM").execute()
    print(f"\n  👔 Direction CM:")
    for p in cm_result.data:
        print(f"     - {p['full_name']} ({p.get('poste', 'N/A')})")

    # Directions actives
    dirs = supabase.table("directions").select("sigle, label").eq("est_active", True).order("sigle").execute()
    print(f"\n  📁 Directions actives: {len(dirs.data)}")
    for d in dirs.data:
        print(f"     - {d['sigle'] or d['label'][:20]}")


def main():
    print("="*60)
    print("🔧 NETTOYAGE PROFESSIONNEL DES DIRECTIONS ARTI")
    print("="*60)

    # Exécuter les étapes
    step1_migrate_personnel()
    step2_assign_cm()
    step3_update_directions()
    step4_deactivate_duplicates()
    step5_verify()

    print("\n" + "="*60)
    print("✅ NETTOYAGE TERMINÉ")
    print("="*60)


if __name__ == "__main__":
    main()
