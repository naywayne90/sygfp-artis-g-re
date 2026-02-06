#!/usr/bin/env python3
"""
Script d'import du personnel ARTI dans SYGFP v2
Utilise l'API Admin de Supabase Auth pour créer les utilisateurs
51 agents répartis dans 9 directions
"""

import os
import json
import time
from supabase import create_client, Client
from datetime import datetime

# Configuration Supabase
SUPABASE_URL = "https://tjagvgqthlibdpvztvaf.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqYWd2Z3F0aGxpYmRwdnp0dmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUwMzM1NywiZXhwIjoyMDgyMDc5MzU3fQ.6SkXYCIN9E8IDf0D-W4p29Eq4oMPAtttyyajQ9Hk5mc"

# Mot de passe par défaut pour tous les nouveaux utilisateurs
DEFAULT_PASSWORD = "Arti2026!"

# Créer le client Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# =============================================================================
# DIRECTIONS OFFICIELLES DE L'ARTI (9 directions)
# =============================================================================
DIRECTIONS = {
    "DG": {
        "code": "DG",
        "label": "Direction Générale",
        "sigle": "DG",
        "entity_type": "direction_generale"
    },
    "DAAF": {
        "code": "DAAF",
        "label": "Direction des Affaires Administratives et Financières",
        "sigle": "DAAF",
        "entity_type": "direction_support"
    },
    "DCSTI": {
        "code": "DCSTI",
        "label": "Direction du Contrôle et de Surveillance du Transport Intérieur",
        "sigle": "DCSTI",
        "entity_type": "direction_operationnelle"
    },
    "DCZ": {
        "code": "DCZ",
        "label": "Direction Centrale des Zones",
        "sigle": "DCZ",
        "entity_type": "direction_operationnelle"
    },
    "DGPECRP": {
        "code": "DGPECRP",
        "label": "Direction de la Gestion Prévisionnelle de l'Emploi, des Compétences et des Relations Publiques",
        "sigle": "DGPECRP",
        "entity_type": "direction_support"
    },
    "DQ": {
        "code": "DQ",
        "label": "Direction de la Qualité",
        "sigle": "DQ",
        "entity_type": "direction_operationnelle"
    },
    "DRRN": {
        "code": "DRRN",
        "label": "Direction de la Réglementation, des Recours et des Normes",
        "sigle": "DRRN",
        "entity_type": "direction_operationnelle"
    },
    "DSESP": {
        "code": "DSESP",
        "label": "Direction des Statistiques, des Études, de la Stratégie et de la Prospective",
        "sigle": "DSESP",
        "entity_type": "direction_operationnelle"
    },
    "DSI": {
        "code": "DSI",
        "label": "Direction des Systèmes d'Information",
        "sigle": "DSI",
        "entity_type": "direction_support"
    }
}

# =============================================================================
# PERSONNEL COMPLET DE L'ARTI (51 agents)
# =============================================================================
PERSONNEL = [
    # DAAF - Direction des Affaires Administratives et Financières (16 agents)
    {"nom": "AKA", "prenom": "Kassi Denis Cédric", "matricule": "1520724A", "sexe": "M", "poste": "Assistant Comptable", "email": "denis.aka@arti.ci", "direction": "DAAF", "categorie": "Agent de maîtrise"},
    {"nom": "BEHI", "prenom": "Yawa Gisèle", "matricule": "2480124B", "sexe": "F", "poste": "Assistante Comptable", "email": "gisele.behi@arti.ci", "direction": "DAAF", "categorie": "Agent de maîtrise"},
    {"nom": "COULIBALY", "prenom": "Moussa", "matricule": "1150820C", "sexe": "M", "poste": "Agent des Moyens Généraux", "email": "moussa.coulibaly@arti.ci", "direction": "DAAF", "categorie": "Agent de maîtrise"},
    {"nom": "DIOMANDE", "prenom": "Adama", "matricule": "1461023D", "sexe": "M", "poste": "Chauffeur", "email": "adama.diomande@arti.ci", "direction": "DAAF", "categorie": "Chauffeur"},
    {"nom": "ENAN", "prenom": "Eblotché Jean-Jacques", "matricule": "1340222E", "sexe": "M", "poste": "Sous-Directeur des Moyens Généraux", "email": "jj.enan@arti.ci", "direction": "DAAF", "categorie": "Cadre débutant"},
    {"nom": "GBAMELE", "prenom": "Kouassi Siméon", "matricule": "1291021G", "sexe": "M", "poste": "Chauffeur", "email": "simeon.gbamele@arti.ci", "direction": "DAAF", "categorie": "Chauffeur"},
    {"nom": "HIEN", "prenom": "Issa", "matricule": "1531024H", "sexe": "M", "poste": "Chef de Service de la Comptabilité, des Finances et de la Gestion de la Dette", "email": "issa.hien@arti.ci", "direction": "DAAF", "categorie": "Cadre moyen"},
    {"nom": "KABLAN", "prenom": "Jean Claude", "matricule": "1180820K", "sexe": "M", "poste": "Chauffeur", "email": "jeanclaude.kablan@arti.ci", "direction": "DAAF", "categorie": "Chauffeur"},
    {"nom": "KOSSIKE", "prenom": "Kango Séraphin", "matricule": "1110720K", "sexe": "M", "poste": "Chauffeur", "email": "seraphin.kossike@arti.ci", "direction": "DAAF", "categorie": "Chauffeur"},
    {"nom": "KOUADIO", "prenom": "Maxime", "matricule": "1600725K", "sexe": "M", "poste": "Assistant Passation de Marché", "email": "maxime.kouadio@arti.ci", "direction": "DAAF", "categorie": "Agent de maîtrise"},
    {"nom": "KOUAKOU", "prenom": "Adjoua Gertrude", "matricule": "2630925K", "sexe": "F", "poste": "Chef de Service Achats et Logistiques", "email": "gertrude.djamara@arti.ci", "direction": "DAAF", "categorie": "Cadre moyen"},
    {"nom": "KOUAKOU", "prenom": "N'guessan Annick Marie-France", "matricule": "2620925K", "sexe": "F", "poste": "Sous-Directeur des Moyens Généraux", "email": "annick.kouakou@arti.ci", "direction": "DAAF", "categorie": "Cadre supérieur"},
    {"nom": "KOUASSI", "prenom": "Kouamé Adrien", "matricule": "1210221K", "sexe": "M", "poste": "Trésorier", "email": "adrien.kouassi@arti.ci", "direction": "DAAF", "categorie": "Agent de maîtrise"},
    {"nom": "KUE", "prenom": "Kamonian Valentin", "matricule": "1120720K", "sexe": "M", "poste": "Coursier", "email": "valentin.kue@arti.ci", "direction": "DAAF", "categorie": "Ouvrier"},
    {"nom": "SAMBARE", "prenom": "Zakaria", "matricule": "1100720S", "sexe": "M", "poste": "Chauffeur", "email": "zakaria.sambare@arti.ci", "direction": "DAAF", "categorie": "Chauffeur"},
    {"nom": "TOURE", "prenom": "Souleymane", "matricule": "1490324T", "sexe": "M", "poste": "Directeur des Affaires Administratives et Financières", "email": "souleymane.toure@arti.ci", "direction": "DAAF", "categorie": "Cadre moyen"},

    # DCSTI - Direction du Contrôle et de Surveillance du Transport Intérieur (2 agents)
    {"nom": "KAMAGATE", "prenom": "Bakagnan", "matricule": "1040620K", "sexe": "M", "poste": "Directeur du Contrôle et de Surveillance du Transport Intérieur", "email": "bakagnan.kamagate@arti.ci", "direction": "DCSTI", "categorie": "Cadre supérieur"},
    {"nom": "KOUADIO", "prenom": "Konan Edmond", "matricule": "1360322K", "sexe": "M", "poste": "Juriste", "email": "edmond.kouadio@arti.ci", "direction": "DCSTI", "categorie": "Agent de maîtrise"},

    # DCZ - Direction Centrale Zone (3 agents)
    {"nom": "BAILLY", "prenom": "Eric Théodore", "matricule": "1390722B", "sexe": "M", "poste": "Chef Administratif et Comptable", "email": "eric.bailly@arti.ci", "direction": "DCZ", "categorie": "Agent de maîtrise"},
    {"nom": "BOKOUA", "prenom": "Ziogba Sébastien", "matricule": "1281021B", "sexe": "M", "poste": "Responsable du Bureau Régional de Yamoussoukro", "email": "sebastien.bokoua@arti.ci", "direction": "DCZ", "categorie": "Cadre moyen"},
    {"nom": "DIABAGATE", "prenom": "Mohammed", "matricule": "1311021D", "sexe": "M", "poste": "Chef de Service Surveillance du Transport Intérieur", "email": "mohammed.diabagate@arti.ci", "direction": "DCZ", "categorie": "Cadre débutant"},

    # DG - Direction Générale (8 agents)
    {"nom": "DEBEY", "prenom": "Alleguy Linda Carole", "matricule": "2090720D", "sexe": "F", "poste": "Assistante Personnelle du Directeur Général", "email": "lynda.debey@arti.ci", "direction": "DG", "categorie": "Agent de maîtrise"},
    {"nom": "DJIRE", "prenom": "Kélétigui Lamine", "matricule": "1400822D", "sexe": "M", "poste": "Chargé d'Études Senior", "email": "lamine.djire@arti.ci", "direction": "DG", "categorie": "Cadre moyen"},
    {"nom": "KOUAKOU-KAN", "prenom": "Jean-Marc Akhenaton", "matricule": "1070720K", "sexe": "M", "poste": "Chargé de Mission du Directeur Général", "email": "jm.kouakoukan@arti.ci", "direction": "DG", "categorie": "Cadre supérieur"},
    {"nom": "M'BAYE", "prenom": "Konan Philippe", "matricule": "1430123M", "sexe": "M", "poste": "Auditeur Interne et Contrôleur Budgétaire", "email": "mbaye.philippe@arti.ci", "direction": "DG", "categorie": "Cadre supérieur"},
    {"nom": "MANOUAN", "prenom": "Thècle Nina", "matricule": "2140820M", "sexe": "F", "poste": "Assistante du PCR", "email": "nina.kone@arti.ci", "direction": "DG", "categorie": "Agent de maîtrise"},
    {"nom": "N'DA", "prenom": "Niamkey Elysee", "matricule": "2160820N", "sexe": "F", "poste": "Chargée d'Études des Moyens Généraux", "email": "elysee.semi@arti.ci", "direction": "DG", "categorie": "Agent de maîtrise"},
    {"nom": "NIMBA", "prenom": "Odahin Ange Yannick", "matricule": "1541024N", "sexe": "M", "poste": "Chargé d'Étude", "email": "ange.nimba@arti.ci", "direction": "DG", "categorie": "Cadre moyen"},
    {"nom": "SOHOUKOUYA", "prenom": "Tchinseonnon Marina", "matricule": "2470124S", "sexe": "F", "poste": "Assistante Principale du Directeur Général", "email": "marina.sohou@arti.ci", "direction": "DG", "categorie": "Agent de maîtrise"},

    # DGPECRP - Direction de la Gestion Prévisionnelle de l'Emploi, des Compétences et des Relations Publiques (10 agents)
    {"nom": "AFFI", "prenom": "Ferdinand", "matricule": "1610825A", "sexe": "M", "poste": "Sous-Directeur du Développement des Ressources Humaines", "email": "ferdinand.affi@arti.ci", "direction": "DGPECRP", "categorie": "Cadre supérieur"},
    {"nom": "AMANGOUA", "prenom": "Constance Josette", "matricule": "2370422A", "sexe": "F", "poste": "Responsable du Pool des Dirigeants Sociaux", "email": "cj.lagaud@arti.ci", "direction": "DGPECRP", "categorie": "Cadre supérieur"},
    {"nom": "ANOH", "prenom": "Ama Lisette Desiree", "matricule": "2270921A", "sexe": "F", "poste": "Chef de Service Communication Digital et Site Web", "email": "lisette.affanou@arti.ci", "direction": "DGPECRP", "categorie": "Agent de maîtrise"},
    {"nom": "BENDEY-DIBY", "prenom": "Karen", "matricule": "2560225T", "sexe": "F", "poste": "Directrice de la Gestion Prévisionnelle de l'Emploi, des Compétences et des Relations Publiques", "email": "karen.bendey-diby@arti.ci", "direction": "DGPECRP", "categorie": "Cadre supérieur"},
    {"nom": "DOSSO", "prenom": "Moussa", "matricule": "1510524D", "sexe": "M", "poste": "Assistant RH", "email": "moussa.dosso@arti.ci", "direction": "DGPECRP", "categorie": "Agent de maîtrise"},
    {"nom": "FOFANA", "prenom": "Seydou Simon", "matricule": "1410922F", "sexe": "M", "poste": "Chef de Service Administration des Ressources Humaines", "email": "simon.fofana@arti.ci", "direction": "DGPECRP", "categorie": "Cadre débutant"},
    {"nom": "GRAH", "prenom": "Franck", "matricule": "1380722G", "sexe": "M", "poste": "Agent d'accueil", "email": "franck.grah@arti.ci", "direction": "DGPECRP", "categorie": "Ouvrier"},
    {"nom": "KOUAME", "prenom": "Yah Noélie Gabrielle", "matricule": "2550225K", "sexe": "F", "poste": "Sous-Directrice des Relations Publiques et de la Communication", "email": "gabrielle.kouame@arti.ci", "direction": "DGPECRP", "categorie": "Cadre supérieur"},
    {"nom": "SEYNOU", "prenom": "Aïcha", "matricule": "2301021S", "sexe": "F", "poste": "Assistante Communication", "email": "aicha.seynou@arti.ci", "direction": "DGPECRP", "categorie": "Agent de maîtrise"},
    {"nom": "YAO", "prenom": "Anyela Marie-Colombe", "matricule": "2170820Y", "sexe": "F", "poste": "Assistante RH", "email": "anyela.yao@arti.ci", "direction": "DGPECRP", "categorie": "Agent de maîtrise"},

    # DQ - Direction de la Qualité (2 agents)
    {"nom": "BONI", "prenom": "Axelle", "matricule": "2570325B", "sexe": "F", "poste": "Chargée d'Étude", "email": "axelle.boni@arti.ci", "direction": "DQ", "categorie": "Cadre moyen"},
    {"nom": "KASSI", "prenom": "Marie-Paule", "matricule": "2451023K", "sexe": "F", "poste": "Directrice des Normes et de la Qualité", "email": "mariepaule.kassi@arti.ci", "direction": "DQ", "categorie": "Cadre moyen"},

    # DRRN - Direction des Recours, de la Réglementation et des Normes (5 agents)
    {"nom": "BIDIA", "prenom": "Annick Hélène", "matricule": "2590325B", "sexe": "F", "poste": "Directrice de la Réglementation, des Recours et des Normes", "email": "annick.zadi@arti.ci", "direction": "DRRN", "categorie": "Cadre supérieur"},
    {"nom": "GNAGNE", "prenom": "Mel Patrick Serges", "matricule": "1350322G", "sexe": "M", "poste": "Chef de Service de la Réglementation", "email": "serge.gnagne@arti.ci", "direction": "DRRN", "categorie": "Cadre"},
    {"nom": "KABA", "prenom": "Nassou Aurélie", "matricule": "2580325K", "sexe": "F", "poste": "Assistante Juriste", "email": "aurelie.kaba@arti.ci", "direction": "DRRN", "categorie": "Agent de maîtrise"},
    {"nom": "KOFFI", "prenom": "Kolou Ange", "matricule": "1590425K", "sexe": "M", "poste": "Assistant Juriste", "email": "ange.koffi@arti.ci", "direction": "DRRN", "categorie": "Agent de maîtrise"},
    {"nom": "VOMOUAN TEKE", "prenom": "Jean Philippe", "matricule": "1440823V", "sexe": "M", "poste": "Sous-Directeur des Affaires Juridiques et des Recours", "email": "jp.vomouan@arti.ci", "direction": "DRRN", "categorie": "Cadre débutant"},

    # DSESP - Direction des Statistiques, des Études, de la Stratégie et de la Prospective (2 agents)
    {"nom": "DIABAGATE", "prenom": "Aboubacar-Sidick", "matricule": "1500324D", "sexe": "M", "poste": "Chef de Service des Statistiques", "email": "aboubacar.diabagate@arti.ci", "direction": "DSESP", "categorie": "Cadre débutant"},
    {"nom": "KOFFI", "prenom": "Jean Léon", "matricule": "1030620K", "sexe": "M", "poste": "Directeur des Statistiques, des Études, de la Stratégie et de la Prospective", "email": "jleon.koffi@arti.ci", "direction": "DSESP", "categorie": "Cadre supérieur"},

    # DSI - Direction des Systèmes d'Information (3 agents)
    {"nom": "ANGOUA", "prenom": "Yobouah Guy Charles", "matricule": "1080720A", "sexe": "M", "poste": "Sous-Directeur des Systèmes d'Information", "email": "guy-charles.angoua@arti.ci", "direction": "DSI", "categorie": "Cadre moyen"},
    {"nom": "BEN MOURAD", "prenom": "Mohamed Aly", "matricule": "1230521B", "sexe": "M", "poste": "Sous-Direction du Contrôle et des Enquêtes", "email": "ben.mourad@arti.ci", "direction": "DSI", "categorie": "Cadre débutant"},
    {"nom": "CISSE", "prenom": "Alassane Al Moustapha", "matricule": "1260921C", "sexe": "M", "poste": "Chef de Service Recherche & Développement", "email": "al.cisse@arti.ci", "direction": "DSI", "categorie": "Cadre moyen"},
]

def determine_role_hierarchique(poste: str, categorie: str) -> str:
    """Détermine le rôle hiérarchique basé sur le poste"""
    poste_lower = poste.lower()

    if "directeur général" in poste_lower or poste_lower == "directeur général":
        return "DG"
    elif "directeur" in poste_lower or "directrice" in poste_lower:
        return "Directeur"
    elif "sous-directeur" in poste_lower or "sous-directrice" in poste_lower:
        return "Sous-Directeur"
    elif "chef de service" in poste_lower or "responsable" in poste_lower:
        return "Chef de Service"
    else:
        return "Agent"

def determine_profil_fonctionnel(poste: str, direction: str) -> str:
    """Détermine le profil fonctionnel basé sur le poste et la direction"""
    poste_lower = poste.lower()

    # Admin pour DSI
    if direction == "DSI" and ("directeur" in poste_lower or "sous-directeur" in poste_lower or "chef" in poste_lower):
        return "Admin"

    # Contrôleur pour les auditeurs et contrôleurs
    if "auditeur" in poste_lower or "contrôleur" in poste_lower:
        return "Controleur"

    # Validateur pour les directeurs et sous-directeurs
    if "directeur" in poste_lower or "directrice" in poste_lower:
        return "Validateur"

    # Opérationnel par défaut
    return "Operationnel"

def get_direction_ids():
    """Récupère les IDs des directions principales (celles avec code = sigle)"""
    result = supabase.table("directions").select("id, code, sigle, label").eq("est_active", True).execute()

    direction_map = {}
    for d in result.data:
        sigle = d.get("sigle")
        if sigle and sigle not in direction_map:
            direction_map[sigle] = d["id"]
        code = d.get("code")
        if code and code in DIRECTIONS and code not in direction_map:
            direction_map[code] = d["id"]

    return direction_map

def check_existing_user_by_email(email: str):
    """Vérifie si un utilisateur existe déjà par email"""
    result = supabase.table("profiles").select("id, email").eq("email", email).execute()
    return result.data[0] if result.data else None

def create_auth_user(email: str, password: str, full_name: str):
    """Crée un utilisateur dans Supabase Auth"""
    try:
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-confirmer l'email
            "user_metadata": {
                "full_name": full_name
            }
        })
        return response.user
    except Exception as e:
        error_msg = str(e)
        if "already been registered" in error_msg or "already exists" in error_msg.lower():
            # L'utilisateur existe déjà, récupérer son ID
            users = supabase.auth.admin.list_users()
            for user in users:
                if user.email == email:
                    return user
        raise e

def update_profile(user_id: str, profile_data: dict):
    """Met à jour le profil d'un utilisateur"""
    try:
        supabase.table("profiles").update(profile_data).eq("id", user_id).execute()
        return True
    except Exception as e:
        print(f"    Erreur update profile: {e}")
        return False

def import_personnel():
    """Importe tout le personnel"""
    print("\n👥 Import du personnel ARTI...")
    print(f"   Total à importer: {len(PERSONNEL)} agents")
    print(f"   Mot de passe par défaut: {DEFAULT_PASSWORD}")

    # Récupérer les IDs des directions
    direction_ids = get_direction_ids()
    print(f"\n📁 Directions disponibles: {list(direction_ids.keys())}")

    stats = {"created": 0, "updated": 0, "errors": 0}

    for i, agent in enumerate(PERSONNEL, 1):
        email = agent["email"]
        direction = agent["direction"]
        full_name = f"{agent['nom']} {agent['prenom']}"

        # Vérifier que la direction existe
        if direction not in direction_ids:
            print(f"  ❌ Direction {direction} non trouvée pour {full_name}")
            stats["errors"] += 1
            continue

        direction_id = direction_ids[direction]
        role_hierarchique = determine_role_hierarchique(agent["poste"], agent["categorie"])
        profil_fonctionnel = determine_profil_fonctionnel(agent["poste"], agent["direction"])

        # Vérifier si l'utilisateur existe déjà dans profiles
        existing = check_existing_user_by_email(email)

        if existing:
            # Mettre à jour le profil existant
            profile_data = {
                "first_name": agent["prenom"],
                "last_name": agent["nom"],
                "full_name": full_name,
                "matricule": agent["matricule"],
                "poste": agent["poste"],
                "direction_id": direction_id,
                "direction_code": direction,
                "role_hierarchique": role_hierarchique,
                "profil_fonctionnel": profil_fonctionnel,
                "is_active": True,
                "updated_at": datetime.now().isoformat()
            }
            if update_profile(existing["id"], profile_data):
                print(f"  🔄 [{i:02d}/51] Mis à jour: {full_name} ({direction}) - {role_hierarchique}")
                stats["updated"] += 1
            else:
                stats["errors"] += 1
        else:
            # Créer un nouvel utilisateur via Auth
            try:
                user = create_auth_user(email, DEFAULT_PASSWORD, full_name)

                if user:
                    # Attendre un peu pour que le trigger crée le profil
                    time.sleep(0.5)

                    # Mettre à jour le profil avec les infos complètes
                    profile_data = {
                        "first_name": agent["prenom"],
                        "last_name": agent["nom"],
                        "full_name": full_name,
                        "matricule": agent["matricule"],
                        "poste": agent["poste"],
                        "direction_id": direction_id,
                        "direction_code": direction,
                        "role_hierarchique": role_hierarchique,
                        "profil_fonctionnel": profil_fonctionnel,
                        "is_active": True,
                        "updated_at": datetime.now().isoformat()
                    }

                    if update_profile(user.id, profile_data):
                        print(f"  ✅ [{i:02d}/51] Créé: {full_name} ({direction}) - {role_hierarchique}")
                        stats["created"] += 1
                    else:
                        print(f"  ⚠️ [{i:02d}/51] Auth OK, profil echec: {full_name}")
                        stats["errors"] += 1

            except Exception as e:
                error_msg = str(e)
                if "already been registered" in error_msg:
                    # Essayer de récupérer et mettre à jour
                    try:
                        users_response = supabase.auth.admin.list_users()
                        for user in users_response:
                            if user.email == email:
                                profile_data = {
                                    "first_name": agent["prenom"],
                                    "last_name": agent["nom"],
                                    "full_name": full_name,
                                    "matricule": agent["matricule"],
                                    "poste": agent["poste"],
                                    "direction_id": direction_id,
                                    "direction_code": direction,
                                    "role_hierarchique": role_hierarchique,
                                    "profil_fonctionnel": profil_fonctionnel,
                                    "is_active": True,
                                    "updated_at": datetime.now().isoformat()
                                }
                                if update_profile(user.id, profile_data):
                                    print(f"  🔄 [{i:02d}/51] Existant, mis à jour: {full_name}")
                                    stats["updated"] += 1
                                break
                    except Exception as e2:
                        print(f"  ❌ [{i:02d}/51] Erreur récup {full_name}: {e2}")
                        stats["errors"] += 1
                else:
                    print(f"  ❌ [{i:02d}/51] Erreur pour {full_name}: {error_msg[:80]}")
                    stats["errors"] += 1

    return stats

def print_summary():
    """Affiche un résumé par direction"""
    print("\n📊 Résumé par direction:")

    result = supabase.table("profiles").select("direction_id, directions!profiles_direction_id_fkey(sigle)").eq("is_active", True).execute()

    from collections import Counter
    directions_count = Counter()
    for p in result.data:
        if p.get("directions"):
            sigle = p["directions"].get("sigle", "Non assigné")
            directions_count[sigle] += 1
        else:
            directions_count["Non assigné"] += 1

    for direction, count in sorted(directions_count.items()):
        print(f"  {direction}: {count} agent(s)")

    print(f"\n  Total: {sum(directions_count.values())} agents actifs")

def main():
    print("=" * 60)
    print("🚀 IMPORT DU PERSONNEL ARTI DANS SYGFP v2")
    print("=" * 60)

    # Importer le personnel
    stats = import_personnel()

    # Afficher le résumé
    print_summary()

    print("\n" + "=" * 60)
    print("📈 RÉSULTAT FINAL")
    print("=" * 60)
    print(f"  ✅ Créés: {stats['created']}")
    print(f"  🔄 Mis à jour: {stats['updated']}")
    print(f"  ❌ Erreurs: {stats['errors']}")
    print("=" * 60)
    print(f"\n💡 Mot de passe pour tous les nouveaux utilisateurs: {DEFAULT_PASSWORD}")

if __name__ == "__main__":
    main()
