# Sécurité RLS Notes SEF - Modèle SYGFP

> **Version**: 2.0 | **Date**: 2026-02-13

---

## 1. Vue d'ensemble

Les Notes SEF (table `notes_dg`) sont protégées par des politiques RLS (Row Level Security) conformes au modèle SYGFP.

### Structure des profils

La table `profiles` contient :

| Colonne              | Type | Description                                           |
| -------------------- | ---- | ----------------------------------------------------- |
| `role_hierarchique`  | enum | Agent, Chef de Service, Sous-Directeur, Directeur, DG |
| `profil_fonctionnel` | enum | Admin, Validateur, Operationnel, Controleur, Auditeur |
| `direction_id`       | uuid | Direction d'appartenance                              |
| `direction_code`     | text | Code court de la direction                            |

### Rôles applicatifs (user_roles)

| Rôle        | Description                            |
| ----------- | -------------------------------------- |
| `DG`        | Directeur Général - Validation finale  |
| `DAAF`      | Directeur Administratif et Financier   |
| `DAF`       | Direction Administrative et Financière |
| `CB`        | Contrôleur Budgétaire - Imputation     |
| `OPERATEUR` | Opérateur/Gestionnaire                 |
| `AUDITOR`   | Auditeur interne                       |
| `ADMIN`     | Administrateur système                 |

---

## 2. Règles d'accès Notes SEF

### 2.1 Création (INSERT)

| Qui peut créer ?             | Condition                          |
| ---------------------------- | ---------------------------------- |
| Tout utilisateur authentifié | Profil actif (`is_active = true`)  |
|                              | `created_by` = utilisateur courant |

### 2.2 Lecture (SELECT)

| Profil/Rôle                        | Accès                                         |
| ---------------------------------- | --------------------------------------------- |
| **Admin** (profil)                 | Toutes les notes                              |
| **DG** (app_role)                  | Toutes les notes                              |
| **DAAF / DAF**                     | Toutes les notes                              |
| **Créateur**                       | Ses propres notes (tous statuts)              |
| **OPERATEUR**                      | Notes soumises, validées, imputées, différées |
| **Même direction**                 | Notes validées ou imputées uniquement         |
| **Auditeur / Controleur** (profil) | Notes validées ou imputées                    |
| **AUDITOR** (app_role)             | Notes validées ou imputées                    |

### 2.3 Modification (UPDATE)

| Qui ?        | Quand ?                                            |
| ------------ | -------------------------------------------------- |
| **Admin**    | Toujours                                           |
| **DG**       | Toujours (accès total)                             |
| **DAAF**     | Statut = soumis ou a_valider (workflow validation) |
| **Créateur** | Ses propres notes (tous statuts brouillon)         |
| **Créateur** | Statut = différé (pour re-soumettre)               |

> **Migration 2026-02-13** : `20260213_rls_daaf_update_soumis.sql` — Policy `notes_sef_update_authorized` utilise `user_roles` avec `app_role` enum (pas les fonctions `is_admin()`/`is_dg()`/`is_daaf()` qui n'existent pas).

### 2.4 Suppression (DELETE)

| Qui ?        | Quand ?                       |
| ------------ | ----------------------------- |
| **Admin**    | Toujours                      |
| **Créateur** | Statut = brouillon uniquement |

---

## 3. Fonctions de sécurité

### `can_view_note_sef(user_id, created_by, direction_id, statut)`

Détermine si un utilisateur peut voir une note selon les règles ci-dessus.

### `can_export_notes_sef(user_id)`

Vérifie si l'utilisateur peut exporter les notes :

- Admin, DG, DAAF, DAF, CB, OPERATEUR

### `get_user_direction_id(user_id)`

Retourne la direction de l'utilisateur (SECURITY DEFINER).

---

## 4. Protection des documents finaux

Un **trigger** `prevent_final_note_modification` bloque toute modification sur les notes en statut final (`valide`, `rejete`, `impute`) sauf :

- Admins (tout)
- DAAF/CB (changement valide → impute uniquement)

---

## 5. Policies RLS actives

```sql
-- SELECT
notes_sef_select_policy: can_view_note_sef(auth.uid(), created_by, direction_id, statut)

-- INSERT
notes_sef_insert_policy: auth.uid() IS NOT NULL
                         AND created_by = auth.uid()
                         AND profil actif

-- UPDATE (policy: notes_sef_update_authorized)
-- Utilise user_roles + app_role enum (schéma réel)
notes_sef_update_authorized:
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid()                              -- Créateur
    OR EXISTS(user_roles WHERE role IN ('ADMIN','DG'))   -- Admin/DG tout
    OR (statut IN ('soumis','a_valider')                 -- DAAF soumis/a_valider
        AND EXISTS(user_roles WHERE role = 'DAAF'))
  )

-- DELETE
notes_sef_delete_policy: Admin OU (créateur + brouillon)
```

> **Important** : Les fonctions helper `is_admin()`, `is_dg()`, `is_daaf()` référencées dans certains fichiers de migration **n'existent pas** dans la base. Les policies réelles utilisent des requêtes directes sur `user_roles` avec cast `::app_role`.

---

## 6. Séparation des tâches

Un créateur **ne peut pas valider** sa propre note (sauf Admin).

Cette règle est appliquée via :

1. L'UI (`useSeparationOfDuties` hook)
2. Le backend (vérification dans la fonction de validation)

---

## 7. Matrice visuelle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACCÈS NOTES SEF PAR PROFIL                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Admin ────────────────── CRUD complet                                  │
│                                                                         │
│  DG ───────────────────── Lecture tout + Validation soumis/différé      │
│                                                                         │
│  DAAF/DAF ─────────────── Lecture tout + Imputation validées            │
│                                                                         │
│  CB ───────────────────── Imputation validées                           │
│                                                                         │
│  Créateur ─────────────── CRUD ses notes (brouillon/différé)            │
│                                                                         │
│  Même direction ────────── Lecture validées/imputées                    │
│                                                                         │
│  Auditeur/Controleur ───── Lecture validées/imputées                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Test de non-fuite

Pour vérifier qu'il n'y a pas de fuite de données entre directions :

```sql
-- Connecté en tant qu'utilisateur de direction DSI
-- Ne devrait voir que ses notes ou les notes validées
SELECT id, reference, statut, direction_id
FROM notes_dg
WHERE direction_id != (SELECT direction_id FROM profiles WHERE id = auth.uid());
-- Résultat attendu : uniquement statut IN ('valide', 'impute')
```

---

## 9. Validation avec délégation et intérim

Depuis le 12 février 2026, la validation des Notes SEF supporte les délégations et intérims :

- **`check_validation_permission()`** vérifie rôle direct + délégation active + intérim actif
- Colonnes `validation_mode` (direct/delegation/interim) et `validated_on_behalf_of` tracent le mode
- **`get_users_who_can_act_as_role(role, scope)`** retourne tous les user_ids capables d'agir (direct + délégation + intérim)
- Les notifications sont envoyées aux titulaires ET aux délégués/intérimaires

---

## 10. Changelog

| Date       | Version | Changements                                                                                                                  |
| ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-13 | 2.0     | DAAF peut UPDATE notes soumis/a_valider, correction policy `notes_sef_update_authorized` avec `user_roles` + `app_role` enum |
| 2026-02-13 | 1.3     | Notifications avec délégations (Gap 4), limite 3 PJ par note, flag is_migrated                                               |
| 2026-02-12 | 1.2     | Validation avec délégation/intérim (Gaps 2+3), colonnes validation_mode/validated_on_behalf_of                               |
| 2026-02-11 | 1.1     | Correction format référence ARTI00MMYYNNNN, index performance                                                                |
| 2026-01-15 | 1.0     | Création initiale avec modèle SYGFP complet                                                                                  |
