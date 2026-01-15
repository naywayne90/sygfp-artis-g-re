# Guide Base de Données SYGFP

> **Schéma PostgreSQL complet**  
> Version: 1.0 | Dernière mise à jour: 2026-01-15

---

## 1. Vue d'ensemble

La base de données SYGFP utilise **PostgreSQL** via Supabase. Elle contient environ **150 tables** organisées par domaine fonctionnel.

### 1.1 Principes généraux

- **UUIDs** pour toutes les clés primaires (`gen_random_uuid()`)
- **Timestamps automatiques** : `created_at`, `updated_at`
- **Soft delete** : `is_deleted` boolean (pas de DELETE physique)
- **Multi-exercice** : colonne `exercice` (integer = année)
- **RLS activé** sur toutes les tables sensibles
- **Audit trail** automatique via triggers

---

## 2. Organisation par Domaine

### 2.1 Référentiels Programmatiques

Hiérarchie : **OS → Mission → Action → Activité → Sous-activité → Tâche**

```
┌────────────────────────────────────────────────────────────────────────┐
│                    HIÉRARCHIE PROGRAMMATIQUE                           │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│ objectifs_strategiques  │ ◄── Objectifs Stratégiques (OS)
│ • code, libelle         │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│       missions          │ ◄── Missions
│ • code, libelle, os_id  │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│       actions           │ ◄── Actions
│ • code, libelle,        │
│   mission_id, os_id     │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│       activites         │ ◄── Activités
│ • code, libelle,        │
│   action_id             │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│     sous_activites      │ ◄── Sous-Activités
│ • code, libelle,        │
│   activite_id           │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│        taches           │ ◄── Tâches
│ • code, libelle,        │
│   sous_activite_id      │
└─────────────────────────┘
```

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `objectifs_strategiques` | Objectifs stratégiques | `code`, `libelle`, `est_active` |
| `missions` | Missions par OS | `code`, `libelle`, `os_id` |
| `actions` | Actions par Mission | `code`, `libelle`, `mission_id`, `os_id` |
| `activites` | Activités par Action | `code`, `libelle`, `action_id` |
| `sous_activites` | Sous-activités | `code`, `libelle`, `activite_id` |
| `taches` | Tâches opérationnelles | `code`, `libelle`, `sous_activite_id` |

### 2.2 Référentiels Comptables

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `nomenclature_nbe` | Nature Budgétaire Économique | `code`, `libelle`, `type_nbe` |
| `plan_comptable_sysco` | Plan comptable SYSCOHADA | `code`, `libelle`, `type_compte` |
| `ref_nve` | Nature de la dépense (NVE) | `code`, `libelle` |

### 2.3 Organisation

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `directions` | Directions/Services | `code`, `label`, `type_direction` |
| `secteurs_activite` | Secteurs d'activité | `code`, `libelle` |

### 2.4 Budget

```
┌────────────────────────────────────────────────────────────────────────┐
│                       STRUCTURE BUDGÉTAIRE                             │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│    budget_versions      │ ◄── Versions du budget (v1, v2...)
│ • exercice, version     │
│ • total_dotation        │
└───────────┬─────────────┘
            │ 1:N
            ▼
┌─────────────────────────┐
│     budget_lines        │ ◄── Lignes budgétaires
│ • code, label           │
│ • dotation_initiale     │
│ • dotation_modifiee     │
│ • total_engage          │──────────────────────┐
│ • disponible_calcule    │                      │
└─────────────────────────┘                      │
         │                                       │
         │ parent_id (hiérarchie)                │ Calculé depuis
         ▼                                       ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   budget_lines (child)  │         │   budget_engagements    │
└─────────────────────────┘         │   budget_liquidations   │
                                    │   ordonnancements       │
                                    │   reglements            │
                                    └─────────────────────────┘
```

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `exercices_budgetaires` | Exercices (années) | `annee`, `statut`, `est_actif` |
| `budget_versions` | Versions budget | `exercice`, `version`, `status` |
| `budget_lines` | Lignes budgétaires | `code`, `label`, `dotation_initiale`, `disponible_calcule` |
| `budget_history` | Historique mouvements | `budget_line_id`, `event_type`, `delta` |
| `credit_transfers` | Virements de crédits | `from_budget_line_id`, `to_budget_line_id`, `amount` |
| `budget_imports` | Historique imports | `exercice`, `file_name`, `status` |

### 2.5 Chaîne de la Dépense

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TABLES CHAÎNE DE DÉPENSE                            │
└────────────────────────────────────────────────────────────────────────┘

notes_sef ──► notes_dg ──► expressions_besoin ──► marches
                                    │                  │
                                    ▼                  ▼
                            budget_engagements ◄──────┘
                                    │
                                    ▼
                            budget_liquidations
                                    │
                                    ▼
                            ordonnancements
                                    │
                                    ▼
                            reglements
```

| Table | Étape | Description | Colonnes clés |
|-------|-------|-------------|---------------|
| `notes_sef` | 1 | Notes Sans Effet Financier | `reference_pivot`, `statut`, `objet` |
| `notes_dg` | 2 | Notes Avec Effet Financier | `numero`, `statut`, `montant_estime` |
| `notes_imputees_disponibles` | 3 | Vue notes imputées | `note_id`, `budget_line_id` |
| `expressions_besoin` | 4 | Expressions de besoin | `numero`, `montant_estime`, `statut` |
| `marches` | 5 | Marchés publics | `numero`, `montant`, `type_marche` |
| `budget_engagements` | 6 | Engagements | `numero`, `montant`, `budget_line_id` |
| `budget_liquidations` | 7 | Liquidations | `numero`, `montant`, `engagement_id` |
| `ordonnancements` | 8 | Ordonnancements | `numero`, `montant`, `liquidation_id` |
| `reglements` | 9 | Règlements | `numero`, `montant`, `ordonnancement_id` |
| `dossiers` | - | Conteneur workflow | `numero`, `statut_global`, `note_origine_id` |

### 2.6 Contractualisation

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `prestataires` | Fournisseurs | `raison_sociale`, `ncc`, `statut_qualification` |
| `prestataire_bank_accounts` | Comptes bancaires | `prestataire_id`, `iban`, `is_default` |
| `supplier_documents` | Documents prestataires | `prestataire_id`, `type_document`, `date_expiration` |
| `contrats` | Contrats | `numero`, `montant_initial`, `prestataire_id` |
| `avenants` | Avenants contrats | `contrat_id`, `montant_modification` |
| `marche_lots` | Lots de marché | `marche_id`, `numero_lot`, `montant` |
| `marche_offres` | Offres reçues | `marche_id`, `prestataire_id`, `montant_offre` |

### 2.7 Trésorerie

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `comptes_bancaires` | Comptes bancaires ARTI | `code`, `libelle`, `solde_actuel` |
| `operations_tresorerie` | Opérations | `compte_id`, `montant`, `type_operation` |
| `plan_tresorerie` | Prévisions | `mois`, `recettes_prevues`, `depenses_prevues` |

### 2.8 Approvisionnement

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `articles` | Articles en stock | `code`, `libelle`, `stock_actuel` |
| `demandes_achat` | Demandes d'achat | `numero`, `statut`, `montant_estime` |
| `receptions` | Réceptions | `numero`, `demande_achat_id` |
| `mouvements_stock` | Mouvements | `article_id`, `type_mouvement`, `quantite` |
| `inventaires` | Inventaires | `date_inventaire`, `statut` |

### 2.9 Recettes

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `recettes` | Déclarations recettes | `numero`, `montant`, `type_recette` |
| `lignes_recette` | Détail recette | `recette_id`, `nature`, `montant` |

### 2.10 Système / Utilisateurs

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `profiles` | Profils utilisateurs | `full_name`, `email`, `direction_id` |
| `user_roles` | Rôles par utilisateur | `user_id`, `role`, `is_active` |
| `custom_roles` | Définition des rôles | `code`, `label`, `description` |
| `role_permissions` | Permissions par rôle | `role_code`, `action_code` |
| `delegations` | Délégations de pouvoir | `from_user_id`, `to_user_id`, `permissions` |
| `audit_logs` | Journal d'audit | `entity_type`, `action`, `old_values`, `new_values` |
| `notifications` | Notifications | `user_id`, `title`, `is_read` |
| `alerts` | Alertes système | `type`, `severity`, `status` |
| `budg_alerts` | Alertes budgétaires | `ligne_budgetaire_id`, `seuil_atteint` |

### 2.11 Codification et Séquences

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `reference_counters` | Compteurs de référence | `etape`, `mm`, `yy`, `sequence` |
| `codif_variables` | Variables codification | `key`, `format_type`, `source_table` |
| `budget_code_sequences` | Séquences budget | `exercice`, `direction_id`, `dernier_numero` |

### 2.12 Documentation

| Table | Description | Colonnes clés |
|-------|-------------|---------------|
| `module_documentation` | Doc modules | `module_key`, `objectif`, `tables_utilisees` |
| `data_dictionary` | Dictionnaire données | `table_name`, `field_name`, `label_fr` |
| `production_checklist` | Checklist prod | `module`, `item`, `status` |

---

## 3. Colonnes Standards

### 3.1 Colonnes communes à toutes les tables

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | `uuid` | Clé primaire, `gen_random_uuid()` |
| `created_at` | `timestamptz` | Date création, `now()` |
| `updated_at` | `timestamptz` | Date modification, `now()` |
| `created_by` | `uuid` | FK vers `profiles` (créateur) |

### 3.2 Colonnes workflow

| Colonne | Type | Description |
|---------|------|-------------|
| `statut` | `text` | État workflow (brouillon, soumis, valide, rejete) |
| `exercice` | `integer` | Année budgétaire |
| `numero` | `text` | Numéro technique |
| `reference_pivot` | `text` | Code pivot unique |
| `code_locked` | `boolean` | Code verrouillé après validation |

### 3.3 Colonnes validation

| Colonne | Type | Description |
|---------|------|-------------|
| `submitted_at` | `timestamptz` | Date soumission |
| `submitted_by` | `uuid` | FK soumetteur |
| `validated_at` | `timestamptz` | Date validation |
| `validated_by` | `uuid` | FK validateur |
| `rejected_at` | `timestamptz` | Date rejet |
| `rejected_by` | `uuid` | FK rejeteur |
| `rejection_reason` | `text` | Motif de rejet |

### 3.4 Colonnes soft delete

| Colonne | Type | Description |
|---------|------|-------------|
| `is_deleted` | `boolean` | Marqueur suppression logique |
| `deleted_at` | `timestamptz` | Date suppression |
| `deleted_by` | `uuid` | FK suppresseur |

---

## 4. Fonctions SQL Importantes

### 4.1 Vérification des rôles

```sql
-- Vérifie si un utilisateur a un rôle spécifique
CREATE FUNCTION has_role(p_user_id uuid, p_role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role = p_role
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 4.2 Permissions utilisateur

```sql
-- Récupère toutes les permissions d'un utilisateur (avec délégations)
CREATE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE(action_code text, via_delegation boolean) AS $$
  -- Permissions directes via rôles
  SELECT rp.action_code, false
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_code = ur.role
  WHERE ur.user_id = p_user_id AND ur.is_active = true
  
  UNION
  
  -- Permissions via délégations actives
  SELECT unnest(d.permissions), true
  FROM delegations d
  WHERE d.to_user_id = p_user_id
    AND d.is_active = true
    AND now() BETWEEN d.date_debut AND COALESCE(d.date_fin, now())
$$ LANGUAGE sql SECURITY DEFINER;
```

### 4.3 Génération de référence

```sql
-- Génère une référence pivot unique (ex: ARTI001260001)
CREATE FUNCTION generate_sef_reference(p_date date DEFAULT now()::date)
RETURNS text AS $$
DECLARE
  v_etape text := '0';
  v_mm text;
  v_yy text;
  v_seq integer;
  v_ref text;
BEGIN
  v_mm := LPAD(EXTRACT(MONTH FROM p_date)::text, 2, '0');
  v_yy := LPAD((EXTRACT(YEAR FROM p_date) % 100)::text, 2, '0');
  
  INSERT INTO reference_counters (etape, mm, yy, sequence)
  VALUES (v_etape, v_mm, v_yy, 1)
  ON CONFLICT (etape, mm, yy)
  DO UPDATE SET sequence = reference_counters.sequence + 1
  RETURNING sequence INTO v_seq;
  
  v_ref := 'ARTI' || v_etape || v_mm || v_yy || LPAD(v_seq::text, 4, '0');
  RETURN v_ref;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Triggers Importants

### 5.1 Mise à jour automatique `updated_at`

```sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliqué sur toutes les tables principales
CREATE TRIGGER update_notes_sef_updated_at
  BEFORE UPDATE ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Validation transitions workflow

```sql
CREATE FUNCTION validate_notes_sef_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
BEGIN
  -- Vérifier si admin
  v_is_admin := has_role(v_user_id, 'ADMIN');
  
  -- Bloquer modification notes finales (sauf admin)
  IF OLD.statut IN ('valide', 'rejete') AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Note finale non modifiable';
  END IF;
  
  -- Valider transitions autorisées
  IF OLD.statut = 'brouillon' AND NEW.statut NOT IN ('brouillon', 'soumis') THEN
    RAISE EXCEPTION 'Transition invalide depuis brouillon';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Audit automatique

```sql
CREATE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    user_id,
    exercice
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    COALESCE(NEW.exercice, OLD.exercice)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Row Level Security (RLS)

### 6.1 Patterns communs

#### Lecture ouverte, écriture restreinte

```sql
-- SELECT: tous authentifiés
CREATE POLICY "select_all" ON table_name
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE: admin uniquement
CREATE POLICY "manage_admin" ON table_name
  FOR ALL USING (has_role(auth.uid(), 'ADMIN'));
```

#### Accès par direction

```sql
CREATE POLICY "access_by_direction" ON notes_sef
  FOR SELECT USING (
    has_role(auth.uid(), 'ADMIN')
    OR direction_id = (SELECT direction_id FROM profiles WHERE id = auth.uid())
    OR created_by = auth.uid()
  );
```

#### Accès par rôle validateur

```sql
CREATE POLICY "validators_see_pending" ON notes_sef
  FOR SELECT USING (
    has_role(auth.uid(), 'ADMIN')
    OR has_role(auth.uid(), 'DG')
    OR (statut = 'soumis' AND has_role(auth.uid(), 'DAAF'))
  );
```

### 6.2 Tables sans RLS

Les référentiels en lecture seule n'ont généralement pas de RLS restrictif :

- `objectifs_strategiques`
- `missions`
- `actions`
- `nomenclature_nbe`
- `plan_comptable_sysco`

---

## 7. Comment Modifier la Base

### 7.1 Ajouter une table

1. **Créer la migration SQL** :

```sql
-- Migration : create_ma_nouvelle_table.sql

CREATE TABLE public.ma_nouvelle_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Colonnes métier
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  montant NUMERIC DEFAULT 0,
  exercice INTEGER NOT NULL,
  statut TEXT DEFAULT 'brouillon',
  
  -- Colonnes standard
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  is_deleted BOOLEAN DEFAULT false
);

-- Index
CREATE INDEX idx_ma_table_exercice ON ma_nouvelle_table(exercice);
CREATE INDEX idx_ma_table_statut ON ma_nouvelle_table(statut);

-- RLS
ALTER TABLE ma_nouvelle_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_policy" ON ma_nouvelle_table
  FOR SELECT USING (true);

CREATE POLICY "manage_policy" ON ma_nouvelle_table
  FOR ALL USING (
    has_role(auth.uid(), 'ADMIN')
    OR created_by = auth.uid()
  );

-- Trigger updated_at
CREATE TRIGGER update_ma_table_updated_at
  BEFORE UPDATE ON ma_nouvelle_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

2. **Exécuter via l'outil migration** dans Lovable

3. **Vérifier** que les types sont générés dans `types.ts`

### 7.2 Modifier une table existante

```sql
-- Ajouter une colonne
ALTER TABLE notes_sef 
ADD COLUMN priorite TEXT DEFAULT 'normale';

-- Ajouter un index
CREATE INDEX idx_notes_sef_priorite ON notes_sef(priorite);

-- Modifier une colonne
ALTER TABLE notes_sef 
ALTER COLUMN priorite SET NOT NULL;
```

### 7.3 Checklist sécurité

Avant chaque modification :

- [ ] RLS activé sur la table ?
- [ ] Policies SELECT définies ?
- [ ] Policies INSERT/UPDATE/DELETE définies ?
- [ ] Trigger `updated_at` ajouté ?
- [ ] Index sur colonnes de filtre ?
- [ ] FK avec `ON DELETE` approprié ?
- [ ] Audit trail si table critique ?

---

## 8. Vues Importantes

| Vue | Description |
|-----|-------------|
| `notes_imputees_disponibles` | Notes AEF imputées et disponibles pour engagement |
| `prestataires_actifs` | Prestataires qualifiés et actifs |
| `v_dossier_chaine` | Vue complète chaîne de dépense par dossier |
| `projects_with_financial` | Projets avec données financières agrégées |

---

## 9. Schéma ER Simplifié

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          RELATIONS PRINCIPALES                                │
└──────────────────────────────────────────────────────────────────────────────┘

profiles ◄────────────────────────────────────────────────────────────────┐
    │                                                                      │
    │ created_by, validated_by, etc.                                       │
    ▼                                                                      │
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐              │
│notes_sef│────►│notes_dg │────►│expressions│───►│ marches │              │
└────┬────┘     └────┬────┘     │_besoin   │    └────┬────┘              │
     │               │          └─────┬────┘         │                    │
     │               │                │              │                    │
     │               ▼                ▼              ▼                    │
     │          ┌────────────────────────────────────────┐                │
     │          │         budget_engagements             │                │
     │          └─────────────────┬──────────────────────┘                │
     │                            │                                       │
     │                            ▼                                       │
     │          ┌────────────────────────────────────────┐                │
     │          │         budget_liquidations            │                │
     │          └─────────────────┬──────────────────────┘                │
     │                            │                                       │
     │                            ▼                                       │
     │          ┌────────────────────────────────────────┐                │
     │          │         ordonnancements                │                │
     │          └─────────────────┬──────────────────────┘                │
     │                            │                                       │
     │                            ▼                                       │
     │          ┌────────────────────────────────────────┐                │
     │          │           reglements                   │────────────────┘
     │          └────────────────────────────────────────┘
     │
     │ dossier_id
     ▼
┌─────────┐
│ dossiers│ ◄── Conteneur reliant toutes les pièces
└─────────┘

                    ┌─────────────┐
budget_lines ◄──────│ Toutes les  │
    │               │ pièces de   │
    │               │ la chaîne   │
    │               └─────────────┘
    │
    │ budget_line_id
    ▼
┌─────────────────┐
│ budget_history  │ ◄── Trace tous les mouvements
└─────────────────┘
```

---

*Documentation générée le 2026-01-15*
