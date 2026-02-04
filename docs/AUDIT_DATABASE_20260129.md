# AUDIT BASE DE DONNEES SUPABASE - SYGFP

**Date :** 29/01/2026
**Agent :** TRESOR (Backend Specialist)
**Projet :** SYGFP - Systeme de Gestion Financiere et de Planification

---

## 1. RESUME EXECUTIF

| Metrique | Valeur |
|----------|--------|
| Nombre de migrations | 151 |
| Nombre de tables | 120+ |
| Fonctions RPC | 80+ |
| Triggers actifs | 40+ |
| Policies RLS | 100+ |
| Edge Functions | 4 |

---

## 2. LISTE DES TABLES PRINCIPALES

### 2.1 Tables de la Chaine de Depense (9 etapes)

| Table | Colonnes | Description |
|-------|----------|-------------|
| `notes_sef` | 48 | Notes d'accord de principe SEF |
| `notes_dg` | ~45 | Notes AEF (Direction Generale) |
| `imputations` | ~25 | Imputations budgetaires |
| `expressions_besoin` | ~30 | Expressions de besoin |
| `marches` | ~35 | Marches publics |
| `budget_engagements` | 36 | Engagements budgetaires |
| `budget_liquidations` | 42 | Liquidations |
| `ordonnancements` | 46 | Ordonnancements/Mandats |
| `reglements` | 22 | Reglements/Paiements |
| `dossiers` | 39 | Dossiers de depense |

### 2.2 Tables Referentielles

| Table | Colonnes | Description |
|-------|----------|-------------|
| `profiles` | 16 | Utilisateurs du systeme |
| `directions` | 15 | Structure organisationnelle |
| `exercices_budgetaires` | ~12 | Exercices fiscaux |
| `budget_lines` | ~40 | Lignes budgetaires |
| `objectifs_strategiques` | ~8 | OS du PAP |
| `missions` | ~8 | Missions |
| `actions` | ~10 | Actions |
| `activites` | ~9 | Activites |
| `sous_activites` | ~8 | Sous-activites |
| `nomenclature_nbe` | ~6 | Nomenclature NBE |
| `plan_comptable_sysco` | ~6 | Plan comptable SYSCO |
| `prestataires` | ~20 | Fournisseurs/Prestataires |

### 2.3 Tables de Support

| Table | Description |
|-------|-------------|
| `audit_logs` | Journalisation des actions |
| `notifications` | Notifications utilisateurs |
| `workflow_tasks` | Taches de workflow |
| `workflow_instances` | Instances de workflow |
| `delegations` | Delegations de pouvoir |
| `alerts` | Alertes systeme |
| `export_jobs` | Travaux d'export |

---

## 3. DETAILS DES TABLES PRINCIPALES

### 3.1 Table `notes_sef` (48 colonnes)

```
Colonnes principales:
- id (uuid, PK)
- numero (varchar) - Reference unique
- reference_pivot (varchar) - Reference pivot
- objet (text) - Objet de la note
- description (text)
- expose, avis, recommandations (text)
- exercice (integer)
- direction_id (uuid, FK -> directions)
- demandeur_id (uuid, FK -> profiles)
- beneficiaire_id (uuid, FK -> prestataires)
- beneficiaire_interne_id (uuid, FK -> profiles)
- montant_estime (numeric)
- statut (varchar) - brouillon|soumis|a_valider|valide|rejete|differe
- urgence (varchar) - basse|normale|haute|urgente
- dossier_id (uuid, FK -> dossiers)
- created_at, updated_at, created_by
- submitted_at, submitted_by
- validated_at, validated_by
- rejected_at, rejected_by, rejection_reason
- differe_at, differe_by, differe_motif, differe_condition, differe_date_reprise
```

### 3.2 Table `profiles` (16 colonnes)

```
Colonnes:
- id (uuid, PK) - Lie a auth.users
- email (varchar, unique)
- first_name, last_name, full_name (varchar)
- matricule (varchar)
- telephone (varchar)
- avatar_url (varchar)
- direction_id (uuid, FK -> directions)
- direction_code (varchar)
- profil_fonctionnel (enum) - Admin|Validateur|Operationnel|Controleur|Auditeur
- role_hierarchique (enum) - DG|Directeur|Sous-Directeur|Chef de Service|Agent
- exercice_actif (integer)
- is_active (boolean)
- poste (varchar)
- created_at, updated_at
```

### 3.3 Table `directions` (15 colonnes)

```
Colonnes:
- id (uuid, PK)
- code (varchar, unique)
- label (varchar)
- sigle (varchar)
- entity_type (varchar)
- parent_id (uuid, FK -> directions) - Hierarchie
- responsible_user_id (uuid, FK -> profiles)
- group_email (varchar)
- position (integer) - Ordre d'affichage
- est_active (boolean)
- last_sync_at, last_sync_file
- created_at, updated_at
```

### 3.4 Table `budget_engagements` (36 colonnes)

```
Colonnes:
- id (uuid, PK)
- numero (varchar, unique)
- objet (text)
- montant, montant_ht, tva (numeric)
- fournisseur (varchar)
- date_engagement (date)
- exercice (integer)
- budget_line_id (uuid, FK -> budget_lines)
- dossier_id (uuid, FK -> dossiers)
- expression_besoin_id (uuid, FK -> expressions_besoin)
- marche_id (uuid, FK -> marches)
- note_id (uuid, FK -> notes_dg)
- statut (varchar)
- workflow_status (varchar)
- current_step (integer)
- code_locked (boolean)
- checklist_complete (boolean)
- created_at, updated_at, created_by
```

### 3.5 Table `budget_liquidations` (42 colonnes)

```
Colonnes:
- id (uuid, PK)
- numero (varchar, unique)
- engagement_id (uuid, FK -> budget_engagements)
- dossier_id (uuid, FK -> dossiers)
- montant, montant_ht, net_a_payer (numeric)
- tva_taux, tva_montant (numeric)
- airsi_taux, airsi_montant (numeric)
- retenue_source_taux, retenue_source_montant (numeric)
- reference_facture (varchar)
- regime_fiscal (varchar)
- service_fait (boolean)
- service_fait_date (timestamp)
- service_fait_certifie_par (uuid, FK -> profiles)
- date_liquidation (date)
- exercice (integer)
- statut, workflow_status (varchar)
- observation (text)
- validated_at, validated_by
- rejected_at, rejected_by, rejection_reason
- submitted_at
- created_at, created_by
```

### 3.6 Table `ordonnancements` (46 colonnes)

```
Colonnes:
- id (uuid, PK)
- numero (varchar, unique)
- liquidation_id (uuid, FK -> budget_liquidations)
- dossier_id (uuid, FK -> dossiers)
- montant, montant_paye (numeric)
- beneficiaire (varchar)
- objet (text)
- mode_paiement (varchar)
- banque, rib (varchar)
- reference_tresor (varchar)
- date_prevue_paiement (date)
- exercice (integer)
- statut, workflow_status (varchar)
- requires_dg_signature (boolean)
- signed_daaf_at, signed_daaf_by
- signed_dg_at, signed_dg_by
- transmitted_at, transmitted_by
- validated_at, validated_by
- rejected_at, rejected_by, rejection_reason
- pdf_path (varchar)
- is_locked (boolean)
- observation (text)
- created_at, updated_at, created_by
```

### 3.7 Table `reglements` (22 colonnes)

```
Colonnes:
- id (uuid, PK)
- numero (varchar, unique)
- ordonnancement_id (uuid, FK -> ordonnancements)
- dossier_id (uuid, FK -> dossiers)
- compte_id (uuid, FK -> comptes_bancaires)
- montant (numeric)
- mode_paiement (varchar)
- date_paiement (date)
- reference_paiement (varchar)
- banque_arti, compte_bancaire_arti (varchar)
- exercice (integer)
- statut (varchar)
- observation (text)
- created_at, updated_at, created_by
```

### 3.8 Table `dossiers` (39 colonnes)

```
Colonnes:
- id (uuid, PK)
- numero (varchar, unique)
- reference_pivot (varchar)
- objet (text)
- exercice (integer)
- direction_id (uuid, FK -> directions)
- demandeur_id, responsable_suivi_id (uuid, FK -> profiles)
- beneficiaire_id (uuid, FK -> prestataires)
- note_sef_id (uuid, FK -> notes_dg)
- budget_line_id (uuid, FK -> budget_lines)
- mission_id, action_id, activite_id (uuid, FK)
- code_budgetaire (varchar)
- type_dossier (varchar)
- etape_courante (varchar)
- statut_global, statut_paiement (varchar)
- urgence (varchar)
- priorite (integer)
- montant_estime, montant_engage, montant_liquide, montant_ordonnance, montant_paye (numeric)
- date_ouverture, date_cloture (timestamp)
- motif_blocage, date_blocage, bloque_par
- commentaire_deblocage, date_deblocage, debloque_par
- piece_principale_path (varchar)
- created_at, updated_at, created_by
```

---

## 4. POLICIES RLS (Row Level Security)

### 4.1 Policies par Module

#### Module Notes SEF/AEF
- `notes_sef_bucket_select` - Lecture storage
- `notes_sef_bucket_insert` - Ecriture storage
- `notes_sef_bucket_delete` - Suppression storage

#### Module Expressions de Besoin
- `Allow read access to expression besoin attachments`
- `Allow insert access to expression besoin attachments`
- `Allow update access to expression besoin attachments`
- `Allow delete access to expression besoin attachments`
- `Allow read/insert/update access to expression besoin validations`

#### Module Ordonnancements
- `Authenticated users can view ordonnancement_validations`
- `Authenticated users can insert ordonnancement_validations`
- `Authenticated users can update ordonnancement_validations`
- `Authenticated users can view/insert/delete ordonnancement_attachments`
- `Authenticated users can manage ordonnancement_sequences`
- `ordonnancement_signatures_select/insert/update`

#### Module Reglements
- `Allow authenticated to read reglements`
- `Allow authenticated to insert reglements`
- `Allow authenticated to update reglements`
- `Allow authenticated to delete reglements`
- `Allow authenticated to read/insert/delete reglement_attachments`
- `Allow authenticated to read/manage reglement_sequences`

#### Module Marches
- `Everyone can view marche validations`
- `Authorized roles can manage marche validations`
- `Everyone can view marche attachments`
- `Authorized roles can manage marche attachments`
- `Authenticated access lots/soumissions/contrats/avenants`

#### Module Dossiers
- `Users can insert dossiers`
- `Authorized roles can update delete dossiers`
- `Users can insert dossier etapes`
- `Authorized roles can update delete dossier etapes`

#### Module Workflow
- `Authenticated users can view workflow_etapes`
- `Admins can manage workflow_etapes`
- `Users can view/create/update workflow_instances`
- `Users can view their own exercice permissions`
- `Admins can manage user_exercices`

#### Module Administration
- `Lecture publique data_dictionary`
- `Modification admin data_dictionary`
- `Lecture publique ref_codification_rules`
- `Modification admin ref_codification_rules`
- `Lecture/Modification admin system_variables_connexion`
- `Lecture publique module_registry`
- `Modification admin module_registry`

#### Module Referentiels
- `plans_travail_select_all`
- `plans_travail_insert/update_admin`
- `import_logs_select/insert_admin`
- `direction_os_mapping_select_all`

### 4.2 Pattern de Securite RLS

La plupart des policies suivent ces patterns:
1. **Lecture** : Authentification requise (`TO authenticated USING (true)`)
2. **Ecriture** : Verification de role ou propriete
3. **Admin** : `has_profil_fonctionnel('Admin')`
4. **Separation des fonctions** : `check_separation_of_duties()`

---

## 5. FONCTIONS RPC

### 5.1 Fonctions de Verification/Autorisation

| Fonction | Description |
|----------|-------------|
| `has_permission(p_user_id, p_action)` | Verifie permission utilisateur |
| `has_role(p_user_id, p_role)` | Verifie role utilisateur |
| `has_profil_fonctionnel(p_profil)` | Verifie profil fonctionnel |
| `has_role_hierarchique(p_role)` | Verifie niveau hierarchique |
| `can_transition(p_from, p_to, p_module)` | Verifie transition workflow |
| `can_view_note_sef(...)` | Verifie acces note SEF |
| `can_engage_on_budget_line(p_line_id)` | Verifie disponibilite budget |
| `check_budget_availability(p_line_id, p_montant)` | Controle budget |
| `check_separation_of_duties(...)` | Controle separation fonctions |
| `check_exercice_writable(p_exercice)` | Verifie exercice modifiable |
| `user_can_access_exercice(p_user, p_exercice)` | Acces exercice |

### 5.2 Fonctions de Generation de References

| Fonction | Description |
|----------|-------------|
| `generate_note_sef_reference_pivot()` | Reference note SEF |
| `generate_note_aef_reference()` | Reference note AEF |
| `generate_imputation_numero()` | Numero imputation |
| `generate_arti_reference()` | Reference ARTI |
| `generate_reference()` | Reference generique |
| `generate_unique_code()` | Code unique |
| `generate_transfer_code()` | Code transfert |
| `get_next_sequence()` | Sequence suivante |
| `get_next_budget_code_seq()` | Sequence budget |

### 5.3 Fonctions de Workflow

| Fonction | Description |
|----------|-------------|
| `execute_transition(...)` | Execute transition |
| `get_available_transitions(...)` | Transitions disponibles |
| `create_workflow_task(...)` | Cree tache workflow |
| `close_workflow_task(...)` | Ferme tache workflow |
| `cancel_workflow_tasks(...)` | Annule taches |
| `get_dossier_workflow_progress(...)` | Progression dossier |
| `get_dossier_current_step(...)` | Etape courante |

### 5.4 Fonctions Metier

| Fonction | Description |
|----------|-------------|
| `create_engagement_from_eb(...)` | Engagement depuis EB |
| `execute_credit_transfer(...)` | Transfert credits |
| `copy_budget_structure(...)` | Copie structure budget |
| `validate_budget(...)` | Valide budget |
| `check_budget_alerts(p_exercice)` | Alertes budget |
| `check_marche_prerequisites(...)` | Prerequisites marche |
| `bloquer_dossier(...)` | Bloque dossier |
| `debloquer_dossier(...)` | Debloque dossier |
| `recalculer_montants_dossier(...)` | Recalcule montants |

### 5.5 Fonctions de Recherche

| Fonction | Description |
|----------|-------------|
| `search_notes_sef(...)` | Recherche notes SEF |
| `search_notes_aef(...)` | Recherche notes AEF |
| `count_search_notes_sef(...)` | Compte notes SEF |
| `count_search_notes_aef(...)` | Compte notes AEF |

### 5.6 Fonctions d'Audit/Logging

| Fonction | Description |
|----------|-------------|
| `log_audit_action(...)` | Log action audit |
| `log_audit_with_exercice(...)` | Log avec exercice |
| `log_import_event(...)` | Log import |

---

## 6. TRIGGERS ACTIFS

### 6.1 Triggers de Generation de References

| Trigger | Table | Description |
|---------|-------|-------------|
| `tr_generate_note_sef_reference_pivot` | notes_sef | Genere reference pivot |
| `trigger_note_sef_numero` | notes_sef | Genere numero |
| `trigger_auto_generate_sef_reference` | notes_sef | Auto-generation reference |
| `trg_note_dg_reference` | notes_direction_generale | Reference note DG |
| `trg_generate_marche_numero` | marches | Numero marche |
| `trg_generate_contrat_numero` | contrats | Numero contrat |
| `trigger_generate_reglement_numero` | reglements | Numero reglement |
| `trigger_generate_ordonnancement_numero` | ordonnancements | Numero ordonnancement |
| `set_ordonnancement_numero` | ordonnancements | Set numero |
| `trg_generate_imputation_reference` | imputations | Reference imputation |
| `trg_generate_demande_achat_numero` | demandes_achat | Numero demande achat |
| `trg_generate_reception_numero` | receptions | Numero reception |
| `trg_generate_mouvement_numero` | mouvements_stock | Numero mouvement |
| `trg_generate_inventaire_numero` | inventaires | Numero inventaire |
| `trigger_generate_approvisionnement_numero` | approvisionnements | Numero appro |
| `trigger_generate_mouvement_tresorerie_numero` | mouvements_tresorerie | Numero mvt tresorerie |

### 6.2 Triggers de Mise a Jour

| Trigger | Table | Description |
|---------|-------|-------------|
| `set_exercices_budgetaires_updated_at` | exercices_budgetaires | MAJ timestamp |
| `set_user_roles_updated_at` | user_roles | MAJ timestamp |
| `update_workflow_instances_updated_at` | workflow_instances | MAJ timestamp |
| `update_data_dictionary_updated_at` | data_dictionary | MAJ timestamp |
| `update_ref_codification_rules_updated_at` | ref_codification_rules | MAJ timestamp |
| `update_module_registry_updated_at` | module_registry | MAJ timestamp |
| `update_delegations_updated_at` | delegations | MAJ timestamp |
| `update_import_jobs_updated_at` | import_jobs | MAJ timestamp |
| `set_plans_travail_updated_at` | plans_travail | MAJ timestamp |
| `trigger_update_roadmap_submission_timestamp` | roadmap_submissions | MAJ timestamp |
| `trg_note_dg_updated` | notes_direction_generale | MAJ timestamp |
| `trg_note_dg_imputation_updated` | note_dg_imputations | MAJ timestamp |

### 6.3 Triggers de Validation/Protection

| Trigger | Table | Description |
|---------|-------|-------------|
| `trigger_prevent_final_modification` | notes_sef | Empeche modif finale |
| `trigger_prevent_final_note_modification` | notes_dg | Empeche modif finale |
| `trg_prevent_dossier_deletion` | dossiers | Empeche suppression |
| `check_exercice_deletion` | exercices_budgetaires | Controle suppression |
| `trg_validate_note_aef_origin` | notes_dg | Valide origine AEF |
| `check_activite_plan_coherence` | activites | Coherence plan |
| `check_action_coherence` | actions | Coherence action |

### 6.4 Triggers Metier

| Trigger | Table | Description |
|---------|-------|-------------|
| `trg_update_dossier_on_etape` | dossier_etapes | MAJ dossier sur etape |
| `trg_notes_sef_set_dossier_ref` | notes_sef | Set ref dossier |
| `trg_propagate_reference_pivot` | dossiers | Propage reference pivot |
| `trigger_log_export_audit` | export_jobs | Log export audit |
| `trg_log_marche_status` | marches | Log statut marche |
| `trg_marche_validation_complete` | marches | Validation complete marche |
| `trg_marche_created` | marches | Creation marche |
| `trg_update_article_stock` | mouvements_stock | MAJ stock article |
| `trigger_update_solde_mouvement` | mouvements_tresorerie | MAJ solde mvt |
| `trigger_update_solde_approvisionnement` | approvisionnements | MAJ solde appro |
| `trg_create_tresorerie_operation` | reglements | Cree operation tresorerie |
| `trg_update_budget_on_reglement` | reglements | MAJ budget sur reglement |
| `trg_track_reglement_timing` | reglements | Track timing reglement |

### 6.5 Triggers Calcul Automatique

| Trigger | Table | Description |
|---------|-------|-------------|
| `trigger_lignes_estimatives_aef_updated_at` | lignes_estimatives_aef | MAJ timestamp |
| `trigger_calculate_ligne_montant` | lignes_estimatives_aef | Calcul montant ligne |
| `trigger_recalculate_aef_total` | lignes_estimatives_aef | Recalcul total AEF |

### 6.6 Triggers Roadmap/Soumissions

| Trigger | Table | Description |
|---------|-------|-------------|
| `trigger_log_roadmap_submission_change` | roadmap_submissions | Log changement |
| `trigger_activate_activities_on_validation` | roadmap_submissions | Active activites |
| `trigger_notify_rejection` | roadmap_submissions | Notifie rejet |

---

## 7. EDGE FUNCTIONS

### 7.1 `send-notification-email`
**Chemin:** `/supabase/functions/send-notification-email/index.ts`

**Description:** Envoi d'emails de notification via Resend API

**Parametres:**
- `user_id` (string) - ID utilisateur destinataire
- `type` (string) - Type de notification (validation, rejet, differe, etc.)
- `title` (string) - Titre de la notification
- `message` (string) - Message de la notification
- `entity_type` (string, optionnel) - Type d'entite
- `entity_id` (string, optionnel) - ID entite
- `entity_numero` (string, optionnel) - Numero entite

**Fonctionnalites:**
- Verification preferences utilisateur
- Template HTML responsive
- Gestion des erreurs Resend
- Mise a jour statut notification

---

### 7.2 `create-user`
**Chemin:** `/supabase/functions/create-user/index.ts`

**Description:** Creation d'utilisateurs par les administrateurs

**Parametres:**
- `email` (string) - Email utilisateur
- `password` (string) - Mot de passe
- `first_name` (string) - Prenom
- `last_name` (string) - Nom
- `matricule` (string, optionnel)
- `telephone` (string, optionnel)
- `direction_id` (string, optionnel)
- `role_hierarchique` (string, optionnel)
- `profil_fonctionnel` (string, optionnel)

**Securite:**
- Verification authentification
- Verification role Admin
- Validation mot de passe (min 6 caracteres)
- Auto-confirmation email

---

### 7.3 `r2-storage`
**Chemin:** `/supabase/functions/r2-storage/index.ts`

**Description:** Gestion stockage Cloudflare R2 (S3-compatible)

**Actions:**
- `getUploadUrl` - URL presignee pour upload
- `getDownloadUrl` - URL presignee pour download
- `deleteObject` - Suppression objet
- `listObjects` - Liste objets

**Configuration:**
- Bucket: `lovable-storage`
- Prefix: `sygfp`
- Expiration par defaut: 3600s

---

### 7.4 `generate-export`
**Chemin:** `/supabase/functions/generate-export/index.ts`

**Description:** Generation exports (CSV, Excel, PDF)

**Types d'export:**
- `csv` - Export CSV lignes budgetaires
- `excel` - Export CSV avec referentiels
- `pdf` - Generation PDF (engagement, liquidation, ordonnancement, note_sef)

**Fonctionnalites:**
- Filtres (direction, OS, statut, recherche)
- Inclusion referentiels optionnelle
- Templates PDF personnalises par type
- QR Code integration
- Enregistrement export_jobs

---

## 8. VUES MATERIALISEES

| Vue | Description |
|-----|-------------|
| `v_budget_disponibilite` | Disponibilite budget par ligne |
| `v_budget_disponibilite_complet` | Disponibilite complete |
| `v_dossier_chaine` | Chaine de depense par dossier |
| `v_engagement_stats` | Statistiques engagements |
| `v_reglement_stats` | Statistiques reglements |
| `v_paiements_a_venir` | Paiements a venir |
| `v_etat_caisse` | Etat de caisse |
| `v_position_tresorerie` | Position tresorerie |
| `v_kpi_paiement` | KPIs paiement |
| `v_marches_stats` | Statistiques marches |
| `v_expressions_besoin_stats` | Statistiques EB |
| `v_etape_delais` | Delais par etape |
| `v_top_directions_imputations` | Top directions imputations |
| `v_top_os_imputations` | Top OS imputations |
| `profiles_display` | Affichage profils |
| `prestataires_actifs` | Prestataires actifs |
| `notes_imputees_disponibles` | Notes imputees disponibles |
| `pending_tasks_by_role` | Taches en attente par role |

---

## 9. ENUMS POSTGRESQL

```sql
-- Profils fonctionnels
CREATE TYPE profil_fonctionnel AS ENUM (
  'Admin',
  'Validateur',
  'Operationnel',
  'Controleur',
  'Auditeur'
);

-- Roles hierarchiques
CREATE TYPE role_hierarchique AS ENUM (
  'DG',
  'Directeur',
  'Sous-Directeur',
  'Chef de Service',
  'Agent'
);
```

---

## 10. POINTS D'ATTENTION

### 10.1 Securite
- ✅ RLS active sur toutes les tables sensibles
- ✅ Separation des fonctions implementee
- ✅ Audit trail sur modifications
- ⚠️ Certaines policies utilisent `USING (true)` (a revoir pour granularite)

### 10.2 Performance
- ✅ Index sur colonnes FK
- ✅ Vues materialisees pour requetes complexes
- ⚠️ 151 migrations - considerer consolidation

### 10.3 Integrite
- ✅ Triggers de validation en place
- ✅ Contraintes FK definies
- ✅ Generation automatique des references

### 10.4 Maintenance
- ⚠️ Documenter les fonctions RPC
- ⚠️ Tests automatises pour triggers
- ⚠️ Monitoring des Edge Functions

---

## 11. RECOMMANDATIONS

1. **Consolider les migrations** - Creer une migration de reference
2. **Documenter les RPC** - Ajouter commentaires SQL
3. **Tester les policies** - Suite de tests RLS
4. **Monitorer les performances** - Dashboard Supabase
5. **Backup regulier** - Verifier politique de sauvegarde

---

*Rapport genere par TRESOR - Agent Backend SYGFP*
*Date: 29/01/2026*
