#!/usr/bin/env python3
"""
Script d'import des stagiaires actifs et dirigeants sociaux ARTI
2 stagiaires + 9 dirigeants = 11 personnes
"""

import time
from supabase import create_client, Client
from datetime import datetime

# Configuration Supabase
SUPABASE_URL = "https://tjagvgqthlibdpvztvaf.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc"

# Mot de passe par défaut
DEFAULT_PASSWORD = "Arti2026!"

# Créer le client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# =============================================================================
# STAGIAIRES ACTIFS (2 personnes)
# =============================================================================
STAGIAIRES = [
    {
        "nom": "KOUAME",
        "prenom": "Bérénice",
        "matricule": "ARTI1903K",
        "sexe": "F",
        "poste": "Stagiaire Publicité Marketing",
        "email": "berenice.kouame@arti.ci",
        "direction": "DGPECRP",
        "categorie": "Stagiaire"
    },
    {
        "nom": "KONE",
        "prenom": "Séhénan",
        "matricule": "ARTI0402K",
        "sexe": "F",
        "poste": "Stagiaire Statistique",
        "email": "sehenan.kone@arti.ci",
        "direction": "DSESP",
        "categorie": "Stagiaire"
    }
]

# =============================================================================
# DIRIGEANTS SOCIAUX (9 membres du Conseil de Régulation)
# =============================================================================
DIRIGEANTS = [
    {
        "nom": "N'ZI ASSAMOUA",
        "prenom": "Désiré",
        "matricule": "1020220N",
        "sexe": "M",
        "poste": "Président du Conseil de Régulation",
        "email": "desire.nzi@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Direction Générale"
    },
    {
        "nom": "KACOU",
        "prenom": "Albéric",
        "matricule": "9999999D",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "alberic.kacou@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Présidence de la République"
    },
    {
        "nom": "N'DRI",
        "prenom": "Kouadio",
        "matricule": "8888888N",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "kouadio.ndri@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Primature"
    },
    {
        "nom": "CONE",
        "prenom": "Dioman",
        "matricule": "7777777C",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "dioman.cone@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Ministère des Transports"
    },
    {
        "nom": "DIARRASSOUBA",
        "prenom": "Mory",
        "matricule": "6666666D",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "mory.diarrassouba@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Ministère de la Défense"
    },
    {
        "nom": "OUATTARA",
        "prenom": "Francis Nielbien",
        "matricule": "5555555O",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "francis.ouattara@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Ministère de l'Intérieur et de la Sécurité"
    },
    {
        "nom": "KOUADIO",
        "prenom": "Amany Francis",
        "matricule": "4444444K",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "amany.kouadio@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Ministère de l'Économie et des Finances"
    },
    {
        "nom": "KABA",
        "prenom": "Mory",
        "matricule": "3333333K",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "mory.kaba@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Ministère de la Construction"
    },
    {
        "nom": "AHMED KONET",
        "prenom": "Mohamed Hussen",
        "matricule": "2222222A",
        "sexe": "M",
        "poste": "Membre du Conseil de Régulation",
        "email": "mohamed.ahmedkonet@arti.ci",
        "direction": "DG",
        "categorie": "Dirigeant Social",
        "institution": "Ministère du Budget"
    }
]

def get_direction_ids():
    """Récupère les IDs des directions"""
    result = supabase.table("directions").select("id, code, sigle").eq("est_active", True).execute()
    direction_map = {}
    for d in result.data:
        sigle = d.get("sigle")
        if sigle:
            direction_map[sigle] = d["id"]
        code = d.get("code")
        if code and code not in direction_map:
            direction_map[code] = d["id"]
    return direction_map

def check_existing_user(email: str):
    """Vérifie si un utilisateur existe"""
    result = supabase.table("profiles").select("id, email").eq("email", email).execute()
    return result.data[0] if result.data else None

def create_user(person: dict, direction_id: str, role_hierarchique: str, profil_fonctionnel: str):
    """Crée un utilisateur via Supabase Auth Admin"""
    email = person["email"]
    full_name = f"{person['nom']} {person['prenom']}"

    # Vérifier si existe déjà
    existing = check_existing_user(email)
    if existing:
        # Mettre à jour
        profile_data = {
            "first_name": person["prenom"],
            "last_name": person["nom"],
            "full_name": full_name,
            "matricule": person["matricule"],
            "poste": person["poste"],
            "direction_id": direction_id,
            "direction_code": person["direction"],
            "role_hierarchique": role_hierarchique,
            "profil_fonctionnel": profil_fonctionnel,
            "is_active": True,
            "updated_at": datetime.now().isoformat()
        }
        supabase.table("profiles").update(profile_data).eq("id", existing["id"]).execute()
        return "updated", full_name

    # Créer nouveau
    try:
        user = supabase.auth.admin.create_user({
            "email": email,
            "password": DEFAULT_PASSWORD,
            "email_confirm": True,
            "user_metadata": {"full_name": full_name}
        })

        if user.user:
            time.sleep(0.5)
            profile_data = {
                "first_name": person["prenom"],
                "last_name": person["nom"],
                "full_name": full_name,
                "matricule": person["matricule"],
                "poste": person["poste"],
                "direction_id": direction_id,
                "direction_code": person["direction"],
                "role_hierarchique": role_hierarchique,
                "profil_fonctionnel": profil_fonctionnel,
                "is_active": True,
                "updated_at": datetime.now().isoformat()
            }
            supabase.table("profiles").update(profile_data).eq("id", user.user.id).execute()
            return "created", full_name
    except Exception as e:
        if "already been registered" in str(e):
            return "exists", full_name
        raise e

    return "error", full_name

def main():
    print("=" * 60)
    print("🚀 IMPORT STAGIAIRES ACTIFS + DIRIGEANTS SOCIAUX")
    print("=" * 60)

    direction_ids = get_direction_ids()
    print(f"\n📁 Directions: {list(direction_ids.keys())}")

    stats = {"created": 0, "updated": 0, "errors": 0}

    # Import des stagiaires
    print("\n👨‍🎓 STAGIAIRES ACTIFS (2)")
    print("-" * 40)
    for i, stagiaire in enumerate(STAGIAIRES, 1):
        direction = stagiaire["direction"]
        if direction not in direction_ids:
            print(f"  ❌ Direction {direction} non trouvée")
            stats["errors"] += 1
            continue

        status, name = create_user(
            stagiaire,
            direction_ids[direction],
            "Agent",  # Rôle hiérarchique
            "Operationnel"  # Profil fonctionnel
        )

        if status == "created":
            print(f"  ✅ [{i}/2] Créé: {name} ({direction})")
            stats["created"] += 1
        elif status == "updated":
            print(f"  🔄 [{i}/2] Mis à jour: {name} ({direction})")
            stats["updated"] += 1
        else:
            print(f"  ⚠️ [{i}/2] Existe déjà: {name}")
            stats["updated"] += 1

    # Import des dirigeants sociaux
    print("\n👔 DIRIGEANTS SOCIAUX (9)")
    print("-" * 40)
    for i, dirigeant in enumerate(DIRIGEANTS, 1):
        direction = dirigeant["direction"]
        if direction not in direction_ids:
            print(f"  ❌ Direction {direction} non trouvée")
            stats["errors"] += 1
            continue

        # Le PCR est DG, les autres sont Directeurs
        role = "DG" if "Président" in dirigeant["poste"] else "Directeur"

        status, name = create_user(
            dirigeant,
            direction_ids[direction],
            role,  # Rôle hiérarchique
            "Validateur"  # Profil fonctionnel
        )

        if status == "created":
            print(f"  ✅ [{i}/9] Créé: {name} - {dirigeant.get('institution', '')}")
            stats["created"] += 1
        elif status == "updated":
            print(f"  🔄 [{i}/9] Mis à jour: {name}")
            stats["updated"] += 1
        else:
            print(f"  ⚠️ [{i}/9] Existe déjà: {name}")
            stats["updated"] += 1

    print("\n" + "=" * 60)
    print("📈 RÉSULTAT FINAL")
    print("=" * 60)
    print(f"  ✅ Créés: {stats['created']}")
    print(f"  🔄 Mis à jour: {stats['updated']}")
    print(f"  ❌ Erreurs: {stats['errors']}")
    print("=" * 60)
    print(f"\n💡 Mot de passe: {DEFAULT_PASSWORD}")

if __name__ == "__main__":
    main()
