# Module Parametrage — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Parametrage** regroupe l'ensemble des pages d'administration et de configuration du systeme SYGFP. Il est accessible uniquement aux utilisateurs ayant le role `ADMIN` et est organise en **3 sous-categories** dans la sidebar :

- **Referentiels** (6 pages) : Gestion des donnees de reference
- **Utilisateurs** (7 pages) : Gestion des comptes, roles et droits
- **Systeme** (9 pages) : Configuration technique et outils de maintenance

Au total, **22 modules de parametrage** sont disponibles.

### Acces RBAC

L'acces au parametrage est controle par la propriete `isAdmin` du contexte RBAC. La section entiere de la sidebar est masquee pour les non-administrateurs. Le code de verification se trouve dans `SidebarV2.tsx` : `{isAdmin && (...)}`.

---

## 2. Routes et acces

### Referentiels

| Route                               | Page                       | Description                                                                              | Roles autorises |
| ----------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------- | --------------- |
| `/admin/exercices`                  | Exercices Budgetaires      | Creation et gestion des exercices (annees budgetaires), definition de l'exercice courant | ADMIN           |
| `/admin/parametres-exercice`        | Parametres d'Exercice      | Configuration des parametres specifiques a chaque exercice (dates, seuils, options)      | ADMIN           |
| `/admin/parametres-programmatiques` | Parametres Programmatiques | Gestion des objectifs strategiques, programmes et actions                                | ADMIN           |
| `/admin/codification`               | Codification               | Referentiel de codification des documents, structure des codes automatiques              | ADMIN           |
| `/admin/documents-requis`           | Documents Requis           | Configuration des pieces justificatives requises par type d'operation et par etape       | ADMIN           |
| `/admin/secteurs-activite`          | Secteurs d'Activite        | Gestion des secteurs d'activite (nomenclature sectorielle)                               | ADMIN           |

### Utilisateurs

| Route                       | Page                   | Description                                                                                                                 | Roles autorises |
| --------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `/admin/utilisateurs`       | Gestion Utilisateurs   | CRUD des comptes utilisateurs : creation, activation/desactivation, affectation direction, reset mot de passe               | ADMIN           |
| `/admin/roles`              | Profils & Roles        | Attribution des roles applicatifs (DG, DAAF, CB, TRESORERIE, DIRECTEUR, OPERATEUR, etc.) aux utilisateurs                   | ADMIN           |
| `/admin/autorisations`      | Autorisations          | Gestion fine des autorisations par role et par module (lecture, ecriture, validation)                                       | ADMIN           |
| `/admin/seuils-validation`  | Seuils de Validation   | Configuration de la hierarchie de validation : modules, etapes, roles requis, seuils de montant, documents requis par etape | ADMIN           |
| `/admin/delegations`        | Delegations            | Gestion des delegations de pouvoir : un validateur delegue temporairement son pouvoir a un autre utilisateur                | ADMIN           |
| `/admin/interims`           | Interims               | Gestion des remplacements temporaires : designation d'un interimaire pour un poste de validation                            | ADMIN           |
| `/admin/notification-roles` | Notifications par Role | Configuration des regles de notification par role : quels evenements declenchent une notification pour quels roles          | ADMIN           |

### Systeme

| Route                         | Page                 | Description                                                                                                                                                 | Roles autorises |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `/admin/parametres`           | Parametres Systeme   | Parametres generaux : nom institution, logo, monnaie, fuseau horaire, options globales                                                                      | ADMIN           |
| `/admin/comptes-bancaires`    | Comptes Bancaires    | Gestion des comptes bancaires de l'ARTI : banque, numero, type, solde, statut actif/inactif                                                                 | ADMIN           |
| `/admin/banques-fournisseurs` | Comptes Prestataires | Gestion des coordonnees bancaires des prestataires/fournisseurs pour les reglements                                                                         | ADMIN           |
| `/admin/email-templates`      | Templates Email      | Configuration des modeles d'email : code, libelle, objet, corps HTML, variables dynamiques, activation/desactivation                                        | ADMIN           |
| `/admin/rappels`              | Rappels Automatiques | Parametrage des rappels automatiques envoyes pour les operations en attente                                                                                 | ADMIN           |
| `/admin/alertes-dmg`          | Alertes DMG          | Configuration des alertes specifiques a la Direction des Moyens Generaux                                                                                    | ADMIN           |
| `/admin/compteurs-references` | Compteurs References | Gestion des compteurs de numerotation automatique : prefixes, dernier numero, format par type de document                                                   | ADMIN           |
| `/admin/journal-audit`        | Journal d'Audit      | Consultation du journal d'audit : toutes les actions tracees (login, validation, rejet, modification) avec filtres par utilisateur, action, entite, periode | ADMIN           |
| `/admin/doublons`             | Gestion Doublons     | Detection et resolution des doublons : references identiques, prestataires similaires, montants suspects. Comparaison et fusion                             | ADMIN           |

---

## 3. Composants

### Referentiels

| Composant                 | Fichier                                         | Description                                              |
| ------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| GestionExercices          | `src/pages/admin/GestionExercices.tsx`          | CRUD exercices budgetaires avec activation/desactivation |
| ParametresExercice        | `src/pages/admin/ParametresExercice.tsx`        | Formulaire de parametres par exercice                    |
| ParametresProgrammatiques | `src/pages/admin/ParametresProgrammatiques.tsx` | Gestion OS, programmes, actions                          |
| ReferentielCodification   | `src/pages/admin/ReferentielCodification.tsx`   | Configuration des codes automatiques                     |
| DocumentsRequis           | `src/pages/admin/DocumentsRequis.tsx`           | Pieces requises par type et etape                        |
| SecteursActivite          | `src/pages/admin/SecteursActivite.tsx`          | CRUD secteurs d'activite                                 |

### Utilisateurs

| Composant            | Fichier                                    | Description                                                                                    |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| GestionUtilisateurs  | `src/pages/admin/GestionUtilisateurs.tsx`  | Liste, creation, edition, activation des utilisateurs                                          |
| GestionRoles         | `src/pages/admin/GestionRoles.tsx`         | Attribution des roles aux utilisateurs                                                         |
| GestionAutorisations | `src/pages/admin/GestionAutorisations.tsx` | Matrice autorisations role/module                                                              |
| SeuilsValidation     | `src/pages/admin/SeuilsValidation.tsx`     | Table `validation_hierarchy` : modules, etapes, roles, seuils montant, documents, toggle actif |
| GestionDelegations   | `src/pages/admin/GestionDelegations.tsx`   | Creation/gestion delegations temporaires                                                       |
| Interims             | `src/pages/admin/Interims.tsx`             | Gestion des remplacements interimaires                                                         |
| NotificationParRole  | `src/pages/admin/NotificationParRole.tsx`  | Regles de notification par evenement et role                                                   |

### Systeme

| Composant           | Fichier                                   | Description                                                                                                       |
| ------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ParametresSysteme   | `src/pages/admin/ParametresSysteme.tsx`   | Parametres generaux du systeme                                                                                    |
| CompteBancaires     | `src/pages/admin/CompteBancaires.tsx`     | CRUD comptes bancaires ARTI                                                                                       |
| BanquesFournisseurs | `src/pages/admin/BanquesFournisseurs.tsx` | CRUD comptes bancaires prestataires                                                                               |
| EmailTemplates      | `src/pages/admin/EmailTemplates.tsx`      | Table des templates : code, libelle, sujet, corps HTML, variables, preview, toggle actif, edition inline          |
| RappelsAutomatiques | `src/pages/admin/RappelsAutomatiques.tsx` | Configuration rappels automatiques                                                                                |
| AlertesDMG          | `src/pages/admin/AlertesDMG.tsx`          | Alertes Direction Moyens Generaux                                                                                 |
| CompteursReferences | `src/pages/admin/CompteursReferences.tsx` | Compteurs de sequences par type de document                                                                       |
| JournalAudit        | `src/pages/admin/JournalAudit.tsx`        | Consultation logs actions avec filtres                                                                            |
| GestionDoublons     | `src/pages/admin/GestionDoublons.tsx`     | Detection doublons : 4 types (reference, prestataire, montant, description), cards avec actions fusionner/ignorer |

---

## 4. Boutons et actions

### Page Seuils de Validation (`SeuilsValidation`)

| Bouton            | Visible si       | Action | Effet                                                                                 |
| ----------------- | ---------------- | ------ | ------------------------------------------------------------------------------------- |
| Modifier (crayon) | Par etape        | Clic   | Ouvre Dialog d'edition : role, ordre, montant min/max, documents requis, toggle actif |
| Toggle actif      | Par etape        | Clic   | Active/desactive l'etape de validation                                                |
| Enregistrer       | Dialog d'edition | Clic   | Met a jour dans `validation_hierarchy`                                                |

### Page Templates Email (`EmailTemplates`)

| Bouton            | Visible si       | Action | Effet                                                                          |
| ----------------- | ---------------- | ------ | ------------------------------------------------------------------------------ |
| Modifier (crayon) | Par template     | Clic   | Ouvre Dialog d'edition : libelle, objet, corps HTML, description, toggle actif |
| Preview (oeil)    | Par template     | Clic   | Ouvre Dialog de previsualisation du template HTML                              |
| Toggle actif      | Par template     | Clic   | Active/desactive le template                                                   |
| Enregistrer       | Dialog d'edition | Clic   | Met a jour dans `email_templates`                                              |

### Page Gestion Doublons (`GestionDoublons`)

| Bouton          | Visible si         | Action              | Effet                                             |
| --------------- | ------------------ | ------------------- | ------------------------------------------------- |
| Actualiser      | Toujours           | Clic                | Relance la detection des doublons                 |
| Filtre par type | Toujours           | Selection           | Filtre : references, prestataires, montants, tous |
| Recherche       | Toujours           | Saisie              | Filtre par reference ou code                      |
| Fusionner       | Par groupe doublon | Clic + confirmation | Fusionne les enregistrements                      |
| Ignorer         | Par groupe doublon | Clic                | Marque le doublon comme ignore (faux positif)     |

### Actions communes a toutes les pages admin

| Bouton                | Visible si       | Action              | Effet                                          |
| --------------------- | ---------------- | ------------------- | ---------------------------------------------- |
| Nouveau / Ajouter     | Pages CRUD       | Clic                | Ouvre formulaire de creation (Dialog ou Sheet) |
| Modifier (crayon)     | Par ligne        | Clic                | Ouvre formulaire pre-rempli                    |
| Supprimer (corbeille) | Par ligne        | Clic + confirmation | Desactive l'enregistrement (soft delete)       |
| Toggle actif          | Quand applicable | Clic                | Active/desactive via Switch                    |

---

## 5. Statuts et transitions

Les pages de parametrage n'ont generalement pas de workflow complexe. Les entites sont soit **actives** soit **inactives** (soft delete).

### Entites avec statut actif/inactif

| Entite              | Table                   | Colonne      |
| ------------------- | ----------------------- | ------------ |
| Exercice budgetaire | `exercices_budgetaires` | `is_active`  |
| Etape de validation | `validation_hierarchy`  | `is_active`  |
| Template email      | `email_templates`       | `is_active`  |
| Regle d'alerte      | `budg_alert_rules`      | `actif`      |
| Utilisateur         | `profiles`              | `is_active`  |
| Role utilisateur    | `user_roles`            | `is_active`  |
| Direction           | `directions`            | `est_active` |
| Secteur d'activite  | `secteurs_activite`     | `est_actif`  |

### Exercice budgetaire : cycle de vie

```
cree --> ouvert (courant) --> cloture
```

Un seul exercice peut etre marque comme **courant** a la fois.

---

## 6. Workflow de validation

Les pages de parametrage n'ont pas de workflow de validation propre. Les modifications sont appliquees immediatement par l'administrateur.

### Matrice RBAC (depuis `rbac-config.ts`)

| Entite              | Qui valide | Roles validateurs                      | Description                                |
| ------------------- | ---------- | -------------------------------------- | ------------------------------------------ |
| Note SEF            | DG         | DG, ADMIN                              | Validation par le Directeur General        |
| Note AEF            | Directeur  | DIRECTEUR, DG, ADMIN                   | Validation par le Directeur de departement |
| Imputation          | CB         | CB, ADMIN                              | Imputation par le Controleur Budgetaire    |
| Engagement          | CB         | CB, ADMIN                              | Validation des engagements par le CB       |
| Liquidation         | DAAF       | DAAF, CB, ADMIN                        | Validation par le DAAF                     |
| Ordonnancement      | DG         | DG, ADMIN                              | Signature par le DG                        |
| Reglement           | Tresorerie | TRESORERIE, AGENT_COMPTABLE, AC, ADMIN | Execution par la Tresorerie                |
| Marche              | DG         | DG, COMMISSION_MARCHES, ADMIN          | Validation par commission ou DG            |
| Virement budgetaire | CB         | CB, ADMIN                              | Approbation par le CB                      |

### Roles hierarchiques

| Role            | Niveau | Permissions cles                                     |
| --------------- | ------ | ---------------------------------------------------- |
| Agent           | 1      | Creer, soumettre, lire ses propres dossiers          |
| Chef de Service | 2      | + Lire service, valider niveau 1                     |
| Sous-Directeur  | 3      | + Lire direction, valider niveau 2                   |
| Directeur       | 4      | + Valider niveau 3, valider notes AEF                |
| DG              | 5      | Lire tout, validation finale, signer ordonnancements |

### Profils fonctionnels

| Profil     | Label                        | Capacites principales                                               |
| ---------- | ---------------------------- | ------------------------------------------------------------------- |
| ADMIN      | Administrateur               | Gestion users, roles, referentiels, budget, audit, bypass complet   |
| CB         | Controleur Budgetaire        | Imputation, validation engagements, approbation virements           |
| DAAF       | Directeur Admin. & Financier | Creation engagements/liquidations, validation liquidations          |
| DG         | Directeur General            | Validation notes SEF, signature ordonnancements, validation marches |
| TRESORERIE | Tresorerie / Agent Comptable | Execution reglements, gestion tresorerie                            |
| DIRECTEUR  | Directeur departement        | Validation notes AEF de sa direction                                |
| OPERATEUR  | Operateur                    | Saisie operationnelle                                               |
| AUDITEUR   | Auditeur                     | Lecture seule transversale, export                                  |

---

## 7. Donnees Supabase

| Table                    | Colonnes cles                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `exercices_budgetaires`  | `id`, `annee`, `libelle`, `is_active`, `date_debut`, `date_fin`                                                          |
| `profiles`               | `id`, `first_name`, `last_name`, `full_name`, `email`, `direction_id`, `is_active`, `direction_code`                     |
| `user_roles`             | `id`, `user_id`, `role`, `is_active`, `created_at`                                                                       |
| `validation_hierarchy`   | `id`, `module_id`, `step_order`, `label`, `role`, `min_amount`, `max_amount`, `required_documents` (text[]), `is_active` |
| `workflow_modules`       | `id`, `code`, `label`, `is_active`                                                                                       |
| `email_templates`        | `id`, `code`, `label`, `subject`, `body_html`, `variables` (text[]), `description`, `is_active`                          |
| `directions`             | `id`, `code`, `label`, `sigle`, `est_active`, `responsable_id`                                                           |
| `objectifs_strategiques` | `id`, `code`, `libelle`, `est_actif`                                                                                     |
| `secteurs_activite`      | `id`, `code`, `libelle`, `est_actif`                                                                                     |
| `comptes_bancaires`      | `id`, `banque`, `numero_compte`, `type_compte`, `solde`, `is_active`                                                     |
| `banques_fournisseurs`   | `id`, `prestataire_id`, `banque`, `numero_compte`, `rib`                                                                 |
| `compteurs_references`   | `id`, `type_document`, `prefixe`, `dernier_numero`, `format`                                                             |
| `delegations`            | `id`, `delegant_id`, `delegataire_id`, `module`, `date_debut`, `date_fin`, `is_active`                                   |
| `interims`               | `id`, `titulaire_id`, `interimaire_id`, `role`, `date_debut`, `date_fin`, `is_active`                                    |
| `logs_actions`           | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `created_at`                                  |
| `budg_alert_rules`       | `id`, `exercice`, `scope`, `seuil_pct`, `actif`, `destinataires_roles`, `canal`, `description`                           |

---

## 8. Hooks

| Hook                   | Fichier                               | Exports                                                                                                                       |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| useValidationHierarchy | `src/hooks/useValidationHierarchy.ts` | `useValidationHierarchy()` — CRUD `validation_hierarchy` : `data` (ValidationStep[]), `isLoading`, `toggleActive`, `update`   |
| useEmailTemplates      | `src/hooks/useEmailTemplates.ts`      | `useEmailTemplates()` — CRUD `email_templates` : `data` (EmailTemplate[]), `isLoading`, `toggleActive`, `update`              |
| useDoublonsDetection   | `src/hooks/useDoublonsDetection.ts`   | `useDoublonsDetection()` — Detection doublons multi-criteres : `groups` (DoublonGroup[]), `isLoading`, `fusionner`, `ignorer` |
| useRBAC                | `src/contexts/RBACContext.ts`         | `useRBAC()` — `isAdmin`, `canAccess(url)`, `hasAnyRole(roles[])`                                                              |
| useSidebarBadges       | `src/hooks/useSidebarBadges.ts`       | `useSidebarBadges()` — Compteurs temps reel pour la sidebar (refetch 30s)                                                     |

### Configuration RBAC (`src/lib/config/rbac-config.ts`)

| Export                 | Description                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `ROLES_HIERARCHIQUES`  | 5 niveaux hierarchiques (Agent -> Chef Service -> Sous-Dir -> Directeur -> DG)          |
| `PROFILS_FONCTIONNELS` | 8 profils applicatifs (ADMIN, CB, DAAF, DG, TRESORERIE, DIRECTEUR, OPERATEUR, AUDITEUR) |
| `VALIDATION_MATRIX`    | 9 entites avec roles validateurs, role requis et description                            |
| `VISIBILITY_RULES`     | Regles de visibilite par role (own/service/direction/all)                               |
| `AUDITED_ACTIONS`      | 20 actions tracees dans le journal d'audit                                              |
| `canRoleValidate()`    | Fonction helper : verifie si un role peut valider un type d'entite                      |

### Liste exhaustive des 22 pages de parametrage

| #   | Sous-categorie | Page                       | Route                               | Fichier                         |
| --- | -------------- | -------------------------- | ----------------------------------- | ------------------------------- |
| 1   | Referentiels   | Exercices                  | `/admin/exercices`                  | `GestionExercices.tsx`          |
| 2   | Referentiels   | Parametres d'Exercice      | `/admin/parametres-exercice`        | `ParametresExercice.tsx`        |
| 3   | Referentiels   | Parametres Programmatiques | `/admin/parametres-programmatiques` | `ParametresProgrammatiques.tsx` |
| 4   | Referentiels   | Codification               | `/admin/codification`               | `ReferentielCodification.tsx`   |
| 5   | Referentiels   | Documents Requis           | `/admin/documents-requis`           | `DocumentsRequis.tsx`           |
| 6   | Referentiels   | Secteurs d'Activite        | `/admin/secteurs-activite`          | `SecteursActivite.tsx`          |
| 7   | Utilisateurs   | Utilisateurs               | `/admin/utilisateurs`               | `GestionUtilisateurs.tsx`       |
| 8   | Utilisateurs   | Profils & Roles            | `/admin/roles`                      | `GestionRoles.tsx`              |
| 9   | Utilisateurs   | Autorisations              | `/admin/autorisations`              | `GestionAutorisations.tsx`      |
| 10  | Utilisateurs   | Seuils de Validation       | `/admin/seuils-validation`          | `SeuilsValidation.tsx`          |
| 11  | Utilisateurs   | Delegations                | `/admin/delegations`                | `GestionDelegations.tsx`        |
| 12  | Utilisateurs   | Interims                   | `/admin/interims`                   | `Interims.tsx`                  |
| 13  | Utilisateurs   | Notifications par Role     | `/admin/notification-roles`         | `NotificationParRole.tsx`       |
| 14  | Systeme        | Parametres Systeme         | `/admin/parametres`                 | `ParametresSysteme.tsx`         |
| 15  | Systeme        | Comptes Bancaires          | `/admin/comptes-bancaires`          | `CompteBancaires.tsx`           |
| 16  | Systeme        | Comptes Prestataires       | `/admin/banques-fournisseurs`       | `BanquesFournisseurs.tsx`       |
| 17  | Systeme        | Templates Email            | `/admin/email-templates`            | `EmailTemplates.tsx`            |
| 18  | Systeme        | Rappels Automatiques       | `/admin/rappels`                    | `RappelsAutomatiques.tsx`       |
| 19  | Systeme        | Alertes DMG                | `/admin/alertes-dmg`                | `AlertesDMG.tsx`                |
| 20  | Systeme        | Compteurs References       | `/admin/compteurs-references`       | `CompteursReferences.tsx`       |
| 21  | Systeme        | Journal d'Audit            | `/admin/journal-audit`              | `JournalAudit.tsx`              |
| 22  | Systeme        | Gestion Doublons           | `/admin/doublons`                   | `GestionDoublons.tsx`           |
