# AUDIT TECHNIQUE COMPLET - SYGFP

**Projet** : SYGFP (Systeme de Gestion Financiere et de Planification)
**Organisation** : ARTI Côte d'Ivoire (Autorite de Regulation des Transports Interurbains)
**Date** : 7 fevrier 2026
**Auditeur** : Claude Code (14 series d'analyse approfondie)

---

## TABLE DES MATIERES

1. [Resume executif](#1-resume-executif)
2. [Architecture technique](#2-architecture-technique)
3. [Chaine de depense (9 etapes)](#3-chaine-de-depense)
4. [Systeme budgetaire](#4-systeme-budgetaire)
5. [RBAC et securite](#5-rbac-et-securite)
6. [Workflow Engine](#6-workflow-engine)
7. [Modules metier](#7-modules-metier)
8. [Hierarchie programmatique](#8-hierarchie-programmatique)
9. [Documents et Storage](#9-documents-et-storage)
10. [Notifications](#10-notifications)
11. [Rapports et Exports](#11-rapports-et-exports)
12. [Administration](#12-administration)
13. [Tests](#13-tests)
14. [Gaps identifies](#14-gaps-identifies)
15. [Recommandations](#15-recommandations)

---

## 1. RESUME EXECUTIF

### Metriques cles

| Metrique            | Valeur                                              |
| ------------------- | --------------------------------------------------- |
| Pages               | 104                                                 |
| Composants React    | 383 (46 modules)                                    |
| Hooks personnalises | 143                                                 |
| Migrations SQL      | 151+                                                |
| Edge Functions      | 12                                                  |
| Fonctions RPC       | 186                                                 |
| Vues DB             | 33                                                  |
| Services            | 12                                                  |
| Modules lib/        | 13                                                  |
| Contexts React      | 2                                                   |
| Routes              | 67 (54 fonctionnelles, 10 partielles, 3 squelettes) |
| Feature Flags       | 9 (5 actives, 4 desactivees)                        |
| Paniers Workflow    | 18 (7 roles)                                        |
| Tables DB           | ~50+                                                |
| Buckets Storage     | 2                                                   |

### Etat general

Le SYGFP est une application **mature et fonctionnelle** couvrant l'integralite de la chaine de depense publique en 9 etapes. L'architecture est solide (React 18 + TypeScript + Supabase), avec un systeme RBAC complet, des controles budgetaires automatises et une tracabilite audit exhaustive.

**7 gaps de securite/fonctionnalite** ont ete identifies, dont 1 critique (filtrage par direction dans le workflow).

---

## 2. ARCHITECTURE TECHNIQUE

### Stack technologique

| Couche           | Technologie                                            |
| ---------------- | ------------------------------------------------------ |
| Frontend         | React 18 + TypeScript + Vite (port 8080)               |
| UI               | Tailwind CSS + shadcn/ui (48 composants Radix)         |
| State Management | TanStack React Query                                   |
| Formulaires      | React Hook Form + Zod                                  |
| Backend          | Supabase (PostgreSQL + Auth + RLS + Realtime)          |
| Storage          | Cloudflare R2 (primaire) + Supabase Storage (fallback) |
| PDF              | jsPDF + jsPDF-autoTable + QR codes                     |
| Excel            | xlsx                                                   |
| Tests unitaires  | Vitest                                                 |
| Tests E2E        | Playwright                                             |
| Email            | Resend API                                             |

### Structure du projet

```
src/
  components/    383 composants dans 46 modules
  pages/         104 pages
  hooks/         143 hooks personnalises
  lib/           13 modules (rbac, workflow, pdf, excel, export, validations, config, errors...)
  contexts/      2 contexts (Exercice, RBAC)
  services/      12 services (attachments, PDF, storage factory)
  types/         2 fichiers custom + types Supabase auto-generes (460 Ko)
  integrations/  Client Supabase + types

supabase/
  migrations/    151+ fichiers SQL
  functions/     12 Edge Functions
```

### Optimisation performance

- **Code splitting** : 50+ pages lazy-loaded via React.lazy()
- **Vendor chunks** : 10 chunks manuels (react, radix, recharts, jspdf, xlsx, supabase, date-fns, lucide)
- **Limite chunk** : 500 Ko
- **Memoisation** : 569 instances useMemo/useCallback/React.memo
- **Cache** : React Query avec staleTime configurable par hook

### Variables d'environnement

| Variable                                            | Usage                       |
| --------------------------------------------------- | --------------------------- |
| VITE_SUPABASE_URL                                   | URL Supabase frontend       |
| VITE_SUPABASE_PUBLISHABLE_KEY                       | Cle anon frontend           |
| SUPABASE_SERVICE_ROLE_KEY                           | Bypass RLS (Edge Functions) |
| R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY | Cloudflare R2               |
| RESEND_API_KEY                                      | Service email               |
| VITE_STORAGE_PROVIDER                               | r2 / supabase / local       |

---

## 3. CHAINE DE DEPENSE

### Les 9 etapes

```
1. Note SEF ──→ 2. Note AEF ──→ 3. Imputation ──→ 4. Expression de Besoin
      ↓                                                        ↓
5. Passation de Marche ──→ 6. Engagement ──→ 7. Liquidation
                                                       ↓
                                    8. Ordonnancement ──→ 9. Reglement
```

### Detail par etape

#### Etape 1 : Note SEF

| Aspect      | Detail                                                                      |
| ----------- | --------------------------------------------------------------------------- |
| Table       | `notes_sef` (~25 colonnes)                                                  |
| Reference   | ARTI + ETAPE(0) + MM + YY + NNNN (ex: ARTI0012600001)                       |
| Champs cles | objet, expose, avis, recommandations, urgence (basse/normale/haute/urgente) |
| Workflow    | brouillon → soumis → a_valider_dg → valide/rejete/differe                   |
| Roles       | Agent cree, DAAF transmet, DG valide                                        |
| Page        | NotesSEF.tsx, ValidationNotesSEF.tsx                                        |
| Hooks       | useNotesSEF, useNotesSEFList, useNoteSEFAutosave                            |
| PDF         | noteSEFPdfService.ts (696 lignes, QR code, logo ARTI)                       |
| Trigger     | Auto-generation dossier_ref sur INSERT                                      |

#### Etape 2 : Note AEF (Notes DG)

| Aspect                 | Detail                                                     |
| ---------------------- | ---------------------------------------------------------- |
| Table                  | `notes_dg`                                                 |
| Origine                | FROM_SEF (depuis Note SEF) ou DIRECT (creation directe DG) |
| Champs supplementaires | type_depense, beneficiaire_id, ligne_budgetaire_id         |
| Workflow               | soumis → valide → a_imputer → impute                       |
| Roles                  | DG valide, DAAF impute                                     |
| Page                   | NotesAEF.tsx, ValidationNotesAEF.tsx, dg/NotesAValider.tsx |

#### Etape 3 : Imputation

| Aspect          | Detail                                                         |
| --------------- | -------------------------------------------------------------- |
| Table           | `imputations` (~20 colonnes)                                   |
| Contrainte      | UNIQUE sur note_aef_id (1 AEF = max 1 imputation)              |
| Rattachement    | OS → Mission → Action → Activite → Sous-Activite + NBE + SYSCO |
| Budget override | forcer_imputation + justification_depassement (min 10 chars)   |
| Workflow        | brouillon → a_valider → valide/rejete/differe                  |
| 10 composants   | ImputationForm, BudgetLineSelector, ImputationDetails...       |

#### Etape 4 : Expression de Besoin

| Aspect       | Detail                                                |
| ------------ | ----------------------------------------------------- |
| Table        | `expressions_besoin` (~35 colonnes)                   |
| Reference    | EB-{YEAR}-{SEQ:4}                                     |
| Lien         | imputation_id, marche_id, dossier_id                  |
| Urgence      | normal, urgent                                        |
| Validation   | Chef Service → Sous-Directeur → ...                   |
| 8 composants | ExpressionBesoinForm, FromImputationForm, Timeline... |

#### Etape 5 : Passation de Marche

| Aspect        | Detail                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| Table         | `marches` (~40 colonnes)                                                     |
| Reference     | MKT-{YEAR}-{SEQ:4}                                                           |
| Types         | fournitures, services, travaux, prestations intellectuelles                  |
| Procedures    | appel d'offres (ouvert/restreint), consultation, gre a gre, demande cotation |
| Workflow      | 4 etapes (Assistant SDPM → SDPM → SDCT → CB)                                 |
| Sous-tables   | marche_lots, soumissions (scoring technique/financier), marche_validations   |
| 12 composants | MarcheForm, MarcheDetails, MarcheValidateDialog, MarcheOffresTab...          |

#### Etape 6 : Engagement

| Aspect               | Detail                                                      |
| -------------------- | ----------------------------------------------------------- |
| Table                | `budget_engagements`                                        |
| Controle budgetaire  | check_budget_availability() bloque si insuffisant           |
| Trigger              | Reservation automatique sur budget_lines                    |
| Workflow             | Controleur → Directeur/DAF (conditionnel type_depense) → DG |
| Routing conditionnel | personnel/transfert → DGPECRP au lieu de DAF                |

#### Etape 7 : Liquidation

| Aspect              | Detail                                        |
| ------------------- | --------------------------------------------- |
| Table               | `budget_liquidations`                         |
| Liquidation urgente | DMG/DG peuvent marquer pour paiement immediat |
| Page                | Liquidations.tsx                              |
| Vue DB              | v_liquidations_urgentes                       |

#### Etape 8 : Ordonnancement

| Aspect        | Detail                         |
| ------------- | ------------------------------ |
| Table         | `ordonnancements`              |
| Validation    | 4 etapes (SAF → CB → DAF → DG) |
| Signatures    | 4 etapes (CB → DAF → DG → AC)  |
| Table support | ordonnancement_validations     |

#### Etape 9 : Reglement

| Aspect           | Detail                                                          |
| ---------------- | --------------------------------------------------------------- |
| Table            | `reglements` (~15 colonnes)                                     |
| Modes paiement   | virement, cheque, especes, mobile money                         |
| Paiement partiel | table mouvements_bancaires, statuts non_effectue/partiel/total  |
| Bordereau        | PDF genere avec totaux, zones signature (Comptable, DAAF, DG)   |
| Trigger          | update_budget_and_close_dossier_on_reglement()                  |
| 8 composants     | ReglementForm, BordereauReglement, MouvementsBancairesDialog... |

### Systeme Dossier (tracker central)

| Aspect            | Detail                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Table             | `dossiers`                                                             |
| Format            | ARTI{MM}{YY}{NNNNNN} (ex: ARTI0126000001)                              |
| Generation        | Atomique via pg_advisory_xact_lock                                     |
| Auto-creation     | Trigger sur INSERT notes_sef                                           |
| Suivi             | dossier_etapes (type_etape, statut, montant par etape)                 |
| Propagation       | dossier_ref propage sur toutes les tables de la chaine                 |
| Champs financiers | montant_estime → montant_engage → montant_liquide → montant_ordonnance |
| Gap               | Pas de page DossierDetails unifiee                                     |

---

## 4. SYSTEME BUDGETAIRE

### Tables budgetaires

| Table                        | Colonnes cles                                                        | Role                |
| ---------------------------- | -------------------------------------------------------------------- | ------------------- |
| `exercices_budgetaires`      | annee, statut (ouvert/en_cours/cloture/archive), est_actif           | Annee fiscale       |
| `budget_lines`               | dotation_initiale/modifiee, total_engage/liquide/ordonnance/paye     | Lignes budgetaires  |
| `budget_movements`           | type_mouvement, montant, sens (debit/credit), disponible_avant/apres | Tracabilite         |
| `budget_line_history`        | field_name, old_value, new_value                                     | Audit par champ     |
| `budget_line_versions`       | version_number, snapshot JSONB                                       | Versioning complet  |
| `credit_transfers`           | from/to_budget_line_id, amount, status                               | Virements           |
| `reamenagements_budgetaires` | imputation_source/destination, montant, statut                       | Reamenagements      |
| `budg_alert_rules`           | seuil_pct (75/90/95/100%), destinataires_roles                       | Seuils alerte       |
| `budg_alerts`                | niveau, seuil_atteint, taux_actuel, message                          | Alertes declenchees |

### Formule de disponibilite

```
disponible = dotation_initiale + virements_recus - virements_emis - total_engage - montant_reserve
```

### Controles automatiques

| Controle             | Fonction                                       | Resultat                                       |
| -------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Disponibilite budget | check_budget_availability()                    | Bloque engagement si insuffisant               |
| Verification AEF     | check_aef_budget_on_submit()                   | Trigger BEFORE INSERT                          |
| Alertes seuils       | check_budget_alerts()                          | info/warning/critical/blocking a 75/90/95/100% |
| Mise a jour paye     | update_budget_and_close_dossier_on_reglement() | total_paye + cloture dossier                   |

### Hooks budget (15)

useBudgetAvailability, useBudgetSummary, useBudgetLineDetails, useBudgetLines, useCreditTransfers, useBudgetMovements, useDossierMovements, useBudgetAlerts, useBudgetNotifications, useBudgetImport, useBudgetTransfers, useBudgetLineVersions, useReamenagementBudgetaire, useExerciceFilter, useUserExercices

### ExerciceContext

- Selection automatique du dernier exercice ouvert
- Read-only si statut = cloture/archive (sauf Admin)
- Persistance localStorage (sygfp_exercice)
- Invalidation React Query au changement
- Audit log sur changement d'exercice

---

## 5. RBAC ET SECURITE

### Matrice des roles

**5 profils fonctionnels** : Admin, Validateur, Operationnel, Controleur, Auditeur

**5 niveaux hierarchiques** : DG (5), Directeur (4), Sous-Directeur (3), Chef de Service (2), Agent (1)

### RLS (Row-Level Security)

**10 tables avec RLS actif** :

| Table                 | SELECT                              | INSERT                 | UPDATE                               | DELETE                    |
| --------------------- | ----------------------------------- | ---------------------- | ------------------------------------ | ------------------------- |
| exercices_budgetaires | Tous authentifies                   | Admin                  | Admin                                | Admin                     |
| notes_sef             | Admin/DG/createur/meme direction    | can_create_in_module() | Admin/DG/createur(brouillon)         | Admin/createur(brouillon) |
| notes_dg              | Idem notes_sef                      | Idem                   | Idem                                 | Idem                      |
| budget_engagements    | Admin/DG/CB/createur/direction      | can_create_in_module() | Admin/CB/createur(brouillon)         | -                         |
| budget_liquidations   | Admin/DG/CB/DAAF/createur/direction | can_create_in_module() | Admin/CB/DAAF/createur(brouillon)    | -                         |
| ordonnancements       | Admin/DG/DAAF/createur/direction    | can_create_in_module() | Admin/DAAF/createur(brouillon)       | -                         |
| reglements            | Admin/DG/Tresorerie/createur        | Admin/Tresorerie       | Admin/Tresorerie/createur(brouillon) | -                         |
| imputations           | Admin/DG/CB/createur/direction      | can_create_in_module() | Admin/CB/createur(brouillon)         | -                         |
| budget_lines          | Tous authentifies                   | Admin/DAAF             | Admin/DAAF                           | -                         |
| marches               | Admin/DG/createur/direction         | can_create_in_module() | Admin/createur(brouillon/en_cours)   | -                         |

### Fonctions helper RLS

is_admin(), is_dg(), is_cb(), is_daaf(), is_tresorerie(), can_validate_step(), get_user_direction_id(), can_create_in_module()

### Separation des taches

Fonction `check_separation_of_duties()` : le createur NE PEUT PAS valider son propre document (sauf Admin avec justification).

Actions protegees : validate, reject, execute, pay.

### Authentification

1. Supabase Auth (signInWithPassword)
2. Chargement profil via RBACContext (React Query, staleTime 5min)
3. Route guard via RBACRouteGuard (redirection /auth si non authentifie)
4. Permissions verifiees via canAccess(), canValidate(), canCreate(), canExport()

### Edge Functions (12)

| Fonction                 | Role RBAC                            | Audit             |
| ------------------------ | ------------------------------------ | ----------------- |
| validate-workflow        | Par etape (DG, CB, DAAF, Tresorerie) | Oui               |
| generate-report          | Token                                | Oui (export_jobs) |
| process-reglement        | Tresorerie                           | Implicite         |
| bulk-operations          | profil_fonctionnel                   | Non               |
| generate-bordereau       | Tresorerie                           | Non               |
| budget-alerts            | Token                                | Non               |
| create-user              | Admin                                | Non               |
| generate-dashboard-stats | Token                                | Non               |
| generate-export          | can_export()                         | Oui (export_jobs) |
| send-notification-email  | Service key                          | Non               |
| r2-storage               | Token                                | Non               |
| workflow-validation      | A verifier                           | A verifier        |

---

## 6. WORKFLOW ENGINE

### Architecture

| Fichier                                                | Role                                        |
| ------------------------------------------------------ | ------------------------------------------- |
| src/lib/workflow/workflowEngine.ts                     | Definition des transitions                  |
| src/lib/workflow/transitionService.ts                  | Service de transition                       |
| src/lib/workflow/statuts.ts                            | 13 statuts standardises                     |
| src/lib/workflow/paniers.ts                            | 18 paniers par role                         |
| src/hooks/useWorkflowEngine.ts                         | Hook React principal                        |
| supabase/migrations/20260203100000_workflow_system.sql | Tables wf_workflows, wf_steps, wf_instances |

### 13 Statuts standardises

brouillon, soumis, a_valider, en_validation_dg, valide, rejete, differe, impute, en_signature, signe, paye, cloture, annule

### 18 Paniers par role

| Role      | Paniers                                              | Priorite      |
| --------- | ---------------------------------------------------- | ------------- |
| DG        | Notes SEF/AEF, Engagements, Ordonnancements, Marches | Haute         |
| DAAF      | Liquidations                                         | Haute         |
| CB        | Imputations, Engagements visa, Ordonnancements visa  | Haute         |
| SDPM      | Besoins, Liquidations saisie, Marches                | Normale       |
| SDCT      | Reglements                                           | Haute         |
| DIRECTEUR | Notes AEF, Besoins                                   | Haute         |
| AGENT     | Brouillons SEF, Notes rejetees                       | Normale/Haute |

### Feature Flags Workflow

| Flag                 | Statut    | Impact                                   |
| -------------------- | --------- | ---------------------------------------- |
| WORKFLOW_V2          | Desactive | Nouveau workflow strict avec transitions |
| SMART_STAGE_SKIP     | Desactive | Saut automatique d'etapes                |
| PANIERS_UNIFIES      | Active    | Paniers de taches unifies par role       |
| TIMELINE_INTERACTIVE | Active    | Timeline interactive dans dossiers       |
| TIMELINE_ADVANCED    | Active    | Timeline avancee avec navigation         |

### Routing conditionnel

Table `wf_steps` avec `condition_type` et `condition_value` :

- Engagement step 2 : si type_depense = 'personnel|transfert' → DGPECRP valide au lieu de DAF

---

## 7. MODULES METIER

### Fournisseurs (Prestataires)

| Aspect         | Detail                                                       |
| -------------- | ------------------------------------------------------------ |
| Table          | `prestataires` (~30 colonnes)                                |
| Code           | PREST-{SEQ}                                                  |
| Identification | NIF, NINEA, RCCM, CC, IFU                                    |
| Bancaire       | rib_banque, rib_numero, rib_cle                              |
| Statuts        | ACTIF / SUSPENDU / REFUSE                                    |
| Panier         | prestataire_requests (ENREGISTRE → EN_VERIF → VALIDE/REFUSE) |
| Fiscal         | statut_fiscal, date_qualification, date_expiration_fiscale   |

### Contrats

| Aspect    | Detail                                                                                 |
| --------- | -------------------------------------------------------------------------------------- |
| Table     | `contrats`                                                                             |
| Code      | CTR-{YEAR}-{SEQ:4}                                                                     |
| 7 types   | Marche public, Prestation, Fourniture, Travaux, Convention, Accord-cadre, Bon commande |
| 7 statuts | brouillon → en_negociation → signe → en_cours → termine / resilie / suspendu           |
| Avenants  | 5 types (prolongation, augmentation, diminution, modification, resiliation)            |
| Page      | /contractualisation/contrats                                                           |

### Lots et Soumissions

```
Marche
  ├── Lot 1 (UNIQUE marche_id + numero_lot)
  │   ├── Soumission A (note_tech + note_fin → note_globale → classement)
  │   ├── Soumission B
  │   └── Gagnant → Contrat auto-cree
  └── Lot 2...
```

Scoring : note_technique (0-100) + note_financiere (0-100) → note_globale → classement automatique

### Recettes

| Aspect  | Detail                                                                       |
| ------- | ---------------------------------------------------------------------------- |
| Table   | `recettes` (~18 colonnes)                                                    |
| Code    | RCT-{YEAR}-{SEQ:4}                                                           |
| Statuts | brouillon → validee → encaissee / annulee                                    |
| Impact  | operations_tresorerie (type='entree'), update comptes_bancaires.solde_actuel |

### Tresorerie

| Table                 | Role                                           |
| --------------------- | ---------------------------------------------- |
| comptes_bancaires     | Solde initial/actuel, devise XOF               |
| operations_tresorerie | Entree/sortie/virement, rapprochement bancaire |
| mouvements_bancaires  | Paiements partiels par reglement               |

Comptes : FISCALITE-CST-BDT, SUBVENTION-BDT, BHCI

---

## 8. HIERARCHIE PROGRAMMATIQUE

### 6 niveaux

```
objectifs_strategiques (9 cols)
    → missions (6 cols)
        → actions (9 cols)
            → activites (20 cols)
                → sous_activites (9 cols)
                    → taches (24 cols) ← la plus complete
```

### Table taches (24 colonnes)

Seule table avec gestion de projet complete :

- avancement (0-100%), priorite (basse/normale/haute/critique)
- statut (planifie/en_cours/termine/en_retard/suspendu/annule)
- RACI (responsable_id, accountable_id, consulted_ids, informed_ids)
- Budget (budget_line_id, budget_prevu, livrables)
- Dates (date_debut, date_fin, date_fin_reelle, duree_prevue)
- Support : tache_attachments, tache_progress_history

### Table plans_travail

- Existe avec 20 colonnes (statut, dates, budget_alloue/consomme, responsable_id, validateur_id)
- **VIDE** : aucune donnee, aucun CRUD UI, aucun hook dedie
- PlanTravail.tsx utilise budget_lines au lieu de plans_travail

### Admin CRUD

Tous les 6 niveaux ont des composants CRUD dans `src/components/admin/programmatique/` :
ObjectifsStrategiquesTab, MissionsTab, ActionsTab, ActivitesTab, SousActivitesTab, TachesTab

Accessible via `/admin/parametres-programmatiques`

---

## 9. DOCUMENTS ET STORAGE

### Architecture multi-provider

```
StorageFactory (singleton)
    ├── R2Provider (Cloudflare R2) ← primaire si VITE_STORAGE_PROVIDER=r2
    ├── SupabaseProvider ← fallback
    └── LocalProvider ← dev uniquement
```

### Buckets

| Bucket            | Usage                                         |
| ----------------- | --------------------------------------------- |
| sygfp-attachments | Fichiers migres SQL Server + nouveaux uploads |
| lovable-storage   | Alternative R2 Cloudflare                     |

### Contraintes upload

- **Taille max** : 10 Mo par fichier
- **Types autorises** : PDF, PNG, JPG, GIF, WebP, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, CSV, ZIP, RAR
- **12 types d'entites** : notes_sef, notes_dg, imputations, expressions_besoin, passations_marche, engagements, liquidations, ordonnancements, reglements, marches, contrats, dossiers

### GED (Gestion Electronique de Documents)

3 composants :

- **DossierGED** (427 lignes) : Interface complete (grid/list, drag-drop, preview, download)
- **DocumentChecklist** (216 lignes) : Checklist obligatoire/optionnel avec % completude
- **DocumentPreview** (119 lignes) : Preview modal PDF/images

### Migration fichiers legacy

- 27,117 fichiers / 26 Go depuis SQL Server
- Service `migratedFilesService.ts` pour acces
- 9 types documents : AutrePieces, BonCommande, Devis_Proforma, FicheContrat, FactureNormalise, FicheRealite, RapportEtude, BonCaisse, FicheOrdonnancement

---

## 10. NOTIFICATIONS

### 15+ types

validation, rejet, differe, piece_manquante, alerte, info, echeance, budget_insuffisant, assignation, roadmap_soumission, roadmap_validation, roadmap_rejet, tache_bloquee, tache_retard, dossier_a_valider

### 3 canaux

| Canal       | Mecanisme                                             |
| ----------- | ----------------------------------------------------- |
| In-app      | Table `notifications` + Supabase Realtime             |
| Email       | Edge Function send-notification-email (Resend API)    |
| Triggers DB | Automatiques sur changement statut notes_sef/notes_dg |

### UI

- **NotificationBell** : Badge nombre non lues
- **NotificationCenter** : Tabs, filtres, pagination
- **NotificationDropdown** : Menu rapide
- **NotificationPreferences** : Preferences utilisateur
- **NotificationTemplateEditor** : Templates personnalisables
- **NotificationRecipientConfig** : Configuration destinataires

### Hooks (6)

useNotifications, useNotificationsEnhanced, useNotificationsRealtime, useNotificationsAuto, useNotificationSettings, useBudgetNotifications

### Auto-nettoyage

`cleanup_old_notifications()` : supprime les notifications lues de plus de 30 jours

---

## 11. RAPPORTS ET EXPORTS

### Etats d'execution (8 vues d'agregation)

| Vue                      | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| Suivi Budgetaire         | Execution globale (dotation vs engagement vs paiement) |
| Par Direction            | Ventilation par unite organisationnelle                |
| Par Objectif Strategique | Par OS                                                 |
| Par Mission              | Par mission                                            |
| Par NBE                  | Par nomenclature budgetaire                            |
| Par SYSCO                | Par plan comptable                                     |
| Par Projet/Dossier       | Suivi projet individuel                                |
| Par Etape                | Statistiques par etape workflow                        |

### Formats d'export

| Format         | Methode     | Librairie                     |
| -------------- | ----------- | ----------------------------- |
| PDF            | Client-side | jsPDF + autoTable             |
| Excel (.xlsx)  | Client-side | xlsx                          |
| CSV            | Client-side | Custom                        |
| PDF (rapports) | Server-side | Edge Function generate-report |

### PDF Note SEF (696 lignes)

- Page 1 : Header ARTI + QR code, infos, expose/avis/recommandations, imputation, signature
- Page 2 : Observations DG, validation, QR code verification (45x45mm), note securite
- Anti-falsification : SHA256 + token verification

### Import de donnees

| Import           | Formats   | Validation                                  | Rollback                   |
| ---------------- | --------- | ------------------------------------------- | -------------------------- |
| Budget Lines     | Excel/CSV | Colonnes requises, doublons, references     | Oui (si pas d'engagements) |
| Feuille de Route | Excel/CSV | Auto-detection colonnes, dates multiformats | Oui (par batch_id)         |

---

## 12. ADMINISTRATION

### 27 pages admin

| Categorie           | Pages                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| Utilisateurs        | GestionUtilisateurs (CRUD, roles, directions, exercices)                              |
| Exercices           | GestionExercices (creation, statut, verrouillage, wizard)                             |
| Roles & Permissions | GestionRoles + GestionAutorisations (matrice role x action)                           |
| Delegations         | GestionDelegations + Interims                                                         |
| Systeme             | ParametresSysteme (formats, seuils, comptes bancaires)                                |
| Audit               | JournalAudit (Logs + Statistiques)                                                    |
| Referentiels        | ReferentielCodification, SecteursActivite, DictionnaireVariables, CompteursReferences |
| Donnees             | GestionAnomalies, GestionDoublons, GestionLibellesBudget                              |
| Workflow            | WorkflowAdmin                                                                         |
| Notifications       | NotificationSettings (templates, destinataires, preferences)                          |
| Documentation       | ArchitectureSYGFP, DocumentationModules, MatriceRACI, ChecklistProduction             |
| Import              | ImportBudgetAdmin                                                                     |
| Banque              | CompteBancaires, OriginesFonds                                                        |
| Programmatique      | ParametresProgrammatiques (6 niveaux CRUD)                                            |

### Controles de coherence (5 regles)

| Regle               | Severite | Verifie                                             |
| ------------------- | -------- | --------------------------------------------------- |
| Activite Completude | ERROR    | Activites orphelines (sans sous-activite/direction) |
| Depense Activite    | ERROR    | Notes SEF referencant missions inexistantes         |
| Depassement Budget  | ERROR    | AE/CP depasses                                      |
| Doublons            | WARNING  | Codes activites/lignes budgetaires dupliques        |
| Montants Negatifs   | ERROR    | Dotations negatives                                 |

### Command Palette (Ctrl+K)

Style VS Code/Raycast avec 6 categories :

- Actions rapides, Navigation, Chaine de depense (9 etapes), Budget & Gestion (12 entrees), Administration (6 entrees), Systeme

### Recherche avancee

DossierSearchDialog avec filtres (direction, statut, etape, type, dates, montant, beneficiaire, createur) + vues sauvegardees

---

## 13. TESTS

### Tests unitaires (Vitest)

| Metrique       | Valeur                                       |
| -------------- | -------------------------------------------- |
| Tests          | 37/37 (100% pass)                            |
| Seuil coverage | 50% (statements, branches, functions, lines) |
| Provider       | v8                                           |
| Reporters      | text, json, html, lcov                       |

### Tests E2E (Playwright)

| Metrique            | Valeur        |
| ------------------- | ------------- |
| Fichiers tests      | 34            |
| Lignes de code test | ~11,345       |
| Taux de reussite    | 40% (113/282) |
| Reussis             | 113           |
| Echoues             | 152           |
| Ignores             | 17            |

### Causes d'echec E2E

| Cause            | %   | Detail                                       |
| ---------------- | --- | -------------------------------------------- |
| Auth timeouts    | 60% | Problemes login admin@arti.ci, dg@arti.ci    |
| Serveur instable | 30% | ERR_CONNECTION_REFUSED sous charge parallele |
| Selecteurs CSS   | 10% | Erreurs parsing `text=` dans chaines         |

### Couverture E2E par module

| Module                    | Statut        |
| ------------------------- | ------------- |
| Notes SEF creation        | Fonctionnel   |
| Notifications             | Fonctionnel   |
| Dashboard KPIs            | Partiel       |
| QR Code                   | Fonctionnel   |
| Exports PDF/Excel         | Fonctionnel   |
| Validation DG             | Echoue (auth) |
| DMG liquidations urgentes | Echoue (auth) |

---

## 14. GAPS IDENTIFIES

### Gap 1 : Workflow sans filtrage par direction (CRITIQUE)

**Probleme** : `canUserAct()` dans useWorkflowEngine.ts verifie le role_hierarchique et profilFonctionnel mais PAS la direction_id. Tout DIRECTEUR peut valider tout engagement, meme d'une autre direction.

**Impact** : Securite critique - violation du principe de responsabilite par direction.

**Solution existante non utilisee** : `check_data_permission()` verifie correctement la direction mais n'est JAMAIS appelee par advance_workflow().

**Effort estime** : 4-6h

### Gap 2 : Delegations absentes du workflow engine (HAUTE)

**Probleme** : Seul ValidationNotesSEF.tsx integre les delegations via useCanValidateSEF(). Les pages Engagements.tsx, Liquidations.tsx, Ordonnancements.tsx n'importent pas useDelegations.

**Impact** : Un delegataire du DG ne peut pas valider les engagements/liquidations/ordonnancements via l'interface.

**Effort estime** : 3-4h

### Gap 3 : Interims deconnectes du RBAC (HAUTE)

**Probleme** : La fonction `can_validate_as_interim()` existe en DB mais n'est JAMAIS appelee dans le code frontend ou le workflow engine. Le module Interims (497 lignes) a un CRUD complet mais ne modifie pas les permissions effectives.

**Impact** : Les interimaires ne peuvent pas exercer les pouvoirs du titulaire.

**Effort estime** : 3-4h

### Gap 4 : Notifications ignorent delegations/interims (MOYENNE)

**Probleme** : Les triggers de notification envoient aux utilisateurs par role (ex: tous les DG) sans considerer les delegations/interims actifs. Un delegataire ne recoit pas les notifications de validation.

**Effort estime** : 2-3h

### Gap 5 : "P.I." absent des PDFs (MOYENNE)

**Probleme** : Les PDFs de Notes SEF/AEF affichent le nom du validateur et la signature "Le Directeur General" mais ne mentionnent jamais "par interim" ou "par delegation" meme quand c'est le cas.

**Effort estime** : 1-2h

### Gap 6 : DashboardHR 75% mocke (BASSE)

**Probleme** : DashboardHR.tsx (mappe a DGPECRP) contient un commentaire explicite "Donnees simulees pour le dashboard RH (a remplacer par vraies donnees)". 75% des donnees sont hardcodees (hrStats constant), seuls les KPIs viennent de Supabase.

**Effort estime** : 4-6h

### Gap 7 : Pas de page DossierDetails unifiee (BASSE)

**Probleme** : Le systeme dossier (dossiers + dossier_etapes) tracke parfaitement la progression des 9 etapes en DB, mais il n'existe aucune page frontend affichant cette vue unifiee.

**Effort estime** : 6-8h

### Gaps supplementaires (mineurs)

| Gap                                                                | Impact |
| ------------------------------------------------------------------ | ------ |
| TypeScript types desync (activites -13 cols, plans_travail absent) | BASSE  |
| plans_travail table vide et deconnectee du frontend                | BASSE  |
| user_roles RLS a verifier                                          | BASSE  |
| Pas d'ErrorBoundary global                                         | BASSE  |
| Pas d'optimisation images                                          | BASSE  |
| E2E tests a 40%                                                    | BASSE  |

---

## 15. RECOMMANDATIONS

### Ordre de correction recommande

```
Phase 1 (Critique) :
  Gap 1 → Workflow direction filtering (4-6h)
    Approche : Integrer check_data_permission() dans advance_workflow()
              + ajouter direction_id a wf_instances

Phase 2 (Haute) :
  Gap 2 + Gap 3 → Delegations + Interims dans workflow (6-8h)
    Approche : Modifier canUserAct() pour verifier delegations et interims actifs
              Propager useDelegations dans Engagements/Liquidations/Ordonnancements

Phase 3 (Moyenne) :
  Gap 4 + Gap 5 → Notifications + PDF P.I. (3-5h)
    Approche : Modifier triggers notification pour inclure delegataires/interimaires
              Ajouter mention "P.I." / "Par delegation" dans services PDF

Phase 4 (Basse) :
  Gap 6 → DashboardHR donnees reelles (4-6h)
  Gap 7 → Page DossierDetails unifiee (6-8h)
  TypeScript types sync (1-2h)
```

### Effort total estime : 24-35h

### Approche technique recommandee pour Gap 1

**Option hybride B+A** :

1. Reutiliser `check_data_permission()` existant (Option B)
2. Ajouter `direction_id` a `wf_instances` pour tracking (Option A)
3. Modifier `advance_workflow()` pour appeler check_data_permission() avant transition
4. Modifier `canUserAct()` frontend pour verifier direction_id

### Metriques de validation

Apres corrections :

- [ ] Tout DIRECTEUR ne peut valider QUE les documents de sa direction
- [ ] Un delegataire DG peut valider engagements/liquidations/ordonnancements
- [ ] Un interimaire exerce les pouvoirs du titulaire
- [ ] Les delegataires/interimaires recoivent les notifications
- [ ] Les PDFs mentionnent "P.I." ou "Par delegation" si applicable
- [ ] DashboardHR affiche des donnees reelles
- [ ] Une page DossierDetails montre les 9 etapes

---

## ANNEXES

### A. Vues DB (33)

v_activite_recente, v_alertes_direction, v_alertes_dmg, v_budget_disponibilite, v_budget_line_versions_with_user, v_budget_notifications, v_comptes_bancaires_actifs, v_dashboard_direction, v_dashboard_dmg, v_dashboard_kpis, v_dossier_chaine, v_dossiers_urgents, v_etape_delais, v_etat_caisse, v_etat_execution_imputation, v_expressions_besoin_stats, v_funding_sources_actives, v_hierarchie_referentiels, v_kpi_paiement, v_liquidations_urgentes, v_mouvements_details, v_paiements_a_venir, v_position_tresorerie, v_reamenagements_details, v_reglements_paiements, v_reglement_stats, v_stats_par_direction, v_stats_par_type_depense, v_task_executions, v_top_directions_imputations, v_top_os_imputations, v_user_permissions

### B. Utilisateurs test

| Email             | Password  | Role             |
| ----------------- | --------- | ---------------- |
| dg@arti.ci        | Test2026! | DG/Validateur    |
| daaf@arti.ci      | Test2026! | DAAF/Validateur  |
| agent.dsi@arti.ci | Test2026! | DSI/Operationnel |

### C. Acces serveurs

| Serveur             | Acces                                          |
| ------------------- | ---------------------------------------------- |
| Supabase            | https://tjagvgqthlibdpvztvaf.supabase.co       |
| GitHub              | https://github.com/naywayne90/sygfp-artis-g-re |
| SQL Server (legacy) | 192.168.0.8:1433                               |

### D. Donnees migrees

| Donnee          | SQL Server              | Supabase        |
| --------------- | ----------------------- | --------------- |
| Notes SEF       | 4,823                   | 4,836           |
| Engagements     | ~1,700                  | 2,805           |
| Liquidations    | 2,954                   | 3,633           |
| Ordonnancements | 2,726                   | 3,501           |
| Fournisseurs    | 426                     | 431             |
| Pieces jointes  | 27,117 fichiers / 26 Go | Upload en cours |

---

_Rapport genere le 7 fevrier 2026 par Claude Code apres 14 series d'analyse technique approfondie._
