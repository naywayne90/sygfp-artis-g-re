# Conventions SYGFP

> Regles de nommage, patterns et conventions pour le projet SYGFP.
> Derniere mise a jour : 2026-02-19

---

## 1. Backend — Base de donnees (PostgreSQL / Supabase)

### 1.1 Nommage des tables

| Regle             | Convention                                          | Exemples                                                |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------- |
| Casse             | `snake_case`                                        | `budget_engagements`, `notes_sef`                       |
| Nombre            | Pluriel                                             | `notes_sef`, `budget_lines`, `expressions_besoin`       |
| Tables de liaison | `{table1}_{table2}` ou `{parent}_{enfant}`          | `expression_besoin_lignes`, `ordonnancement_signatures` |
| Attachments       | `{table_singulier}_attachments`                     | `engagement_attachments`, `liquidation_attachments`     |
| Historique        | `{table_singulier}_history` ou `{table}_historique` | `notes_sef_history`, `marche_historique`                |
| Validations       | `{table_singulier}_validations`                     | `engagement_validations`, `liquidation_validations`     |
| Sequences         | `{table_singulier}_sequences`                       | `marche_sequences`, `liquidation_sequences`             |

### 1.2 Nommage des colonnes

| Regle     | Convention                            | Exemples                                                      |
| --------- | ------------------------------------- | ------------------------------------------------------------- |
| Casse     | `snake_case`                          | `budget_line_id`, `created_at`, `montant_estime`              |
| FK        | `{table_singulier}_id`                | `marche_id`, `note_sef_id`, `engagement_id`                   |
| FK profil | `{role}_by` ou `{action}_by`          | `created_by`, `validated_by`, `rejected_by`, `signed_daaf_by` |
| Booleen   | `is_` ou `qualifie_`                  | `is_migrated`, `is_urgent`, `qualifie_technique`              |
| Statut    | `statut` (pas `status`)               | Exception : `credit_transfers.status` (legacy)                |
| Montant   | `montant` ou `montant_{qualificatif}` | `montant`, `montant_estime`, `montant_engage`                 |
| Date      | `date_{qualificatif}`                 | `date_signature`, `date_cloture`, `date_publication`          |
| Exercice  | `exercice INTEGER`                    | Annee budgetaire (2025, 2026)                                 |

### 1.3 Cle primaire

Toutes les tables utilisent UUID :

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### 1.4 Timestamps obligatoires

Chaque table DOIT avoir :

```sql
created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
```

Avec un trigger automatique :

```sql
CREATE TRIGGER update_{table}_updated_at
  BEFORE UPDATE ON {table}
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
-- ou: EXECUTE FUNCTION update_updated_at_column();
```

### 1.5 Soft delete vs Hard delete

**Pattern dominant : Hard delete** (pas de `deleted_at` generalise).

Exceptions avec `deleted_at TIMESTAMPTZ` :

- `notes_sef_attachments` (pieces jointes)
- `notes_dg_attachments`
- `engagement_attachments`

Quand `deleted_at` existe, les policies RLS filtrent `WHERE deleted_at IS NULL`.

### 1.6 Exercice budgetaire

Chaque table metier a une colonne `exercice INTEGER` :

```sql
exercice INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
```

Le hook frontend `useExercice()` fournit l'exercice courant.
Toutes les requetes filtrent par exercice : `.eq('exercice', exercice)`.

---

## 2. Backend — RLS (Row-Level Security)

### 2.1 Regles fondamentales

- RLS est **TOUJOURS active** sur les tables du schema `public` (199/201 tables)
- Chaque table a au minimum une policy `SELECT` pour les utilisateurs authentifies
- Les tables sensibles ont des policies granulaires par role

### 2.2 Helpers RLS

```sql
-- Fonctions helper (SECURITY DEFINER, dans le schema public)
is_admin()            -- Verifie role ADMIN via user_roles
is_dg()               -- Verifie role DG
is_daaf()             -- Verifie role DAAF
is_cb()               -- Verifie role CB (Controleur Budgetaire)
get_user_direction_id() -- Retourne la direction de l'utilisateur courant
has_role(uid, role)   -- Verifie un role specifique via user_roles
```

### 2.3 Patterns de policies

**Pattern standard (referentiels)** :

```sql
-- Lecture pour tous les authentifies
CREATE POLICY "table_select" ON table FOR SELECT
  TO authenticated USING (true);

-- Ecriture pour admin seulement
CREATE POLICY "table_admin" ON table FOR ALL
  TO authenticated USING (is_admin());
```

**Pattern chaine de depense** :

```sql
-- SELECT : filtre par direction ou roles privilegies
CREATE POLICY "entity_select_direction" ON entity FOR SELECT
  TO authenticated
  USING (
    direction_id = get_user_direction_id()
    OR is_admin() OR is_dg() OR is_daaf() OR is_cb()
  );

-- INSERT : propre direction uniquement
CREATE POLICY "entity_insert_own" ON entity FOR INSERT
  TO authenticated
  WITH CHECK (direction_id = get_user_direction_id() OR is_admin());

-- UPDATE : selon le role et le statut
CREATE POLICY "entity_update_authorized" ON entity FOR UPDATE
  TO authenticated
  USING (/* conditions specifiques au module */);
```

**Pattern v2 Passation (nomme)** :

```sql
CREATE POLICY "pm_select_v2" ON passation_marche FOR SELECT ...
CREATE POLICY "pm_insert_v2" ON passation_marche FOR INSERT ...
CREATE POLICY "pm_update_v2" ON passation_marche FOR UPDATE ...
CREATE POLICY "pm_delete_v2" ON passation_marche FOR DELETE ...
```

---

## 3. Backend — Triggers

### 3.1 Nommage

| Prefixe                     | Usage                             | Exemples                                                             |
| --------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `trg_`                      | Nouveau standard (prefere)        | `trg_generate_marche_numero`, `trg_check_imputation_coherence`       |
| `trigger_`                  | Legacy (ne pas creer de nouveaux) | `trigger_notify_note_status`, `trigger_validate_differe_engagements` |
| `update_{table}_updated_at` | Timestamp auto                    | `update_notes_sef_updated_at`, `update_marches_updated_at`           |

### 3.2 Categories de triggers

| Categorie                  | Timing                     | Exemples                                                                |
| -------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| **Timestamp auto**         | BEFORE UPDATE              | `update_{table}_updated_at`                                             |
| **Generation numero**      | BEFORE INSERT              | `trg_generate_marche_numero`, `generate_engagement_numero_trigger`      |
| **Lock champs**            | BEFORE UPDATE              | `lock_code_engagements`, `trg_lock_passation_fields`                    |
| **Validation/coherence**   | BEFORE INSERT/UPDATE       | `trg_check_imputation_coherence`, `trg_enforce_qualification`           |
| **Workflow/notifications** | AFTER UPDATE               | `trigger_notify_engagement_status`, `trg_passation_status_change`       |
| **Recalcul ELOP**          | AFTER INSERT/UPDATE/DELETE | `trg_recalc_elop_engagements`, `trg_recalc_elop_liquidations`           |
| **Dossier propagation**    | AFTER INSERT/UPDATE        | `trg_update_dossier_on_engagement`, `trg_update_dossier_on_liquidation` |
| **Audit/logging**          | AFTER INSERT/UPDATE        | `trg_log_note_sef_creation`, `trg_log_marche_status_change`             |

### 3.3 Bonnes pratiques triggers

- BEFORE pour validation et modification des donnees
- AFTER pour effets de bord (notifications, audit, recalculs)
- Toujours `FOR EACH ROW`
- La fonction trigger est dans le schema `public` avec `SECURITY DEFINER`
- Un trigger = une responsabilite

---

## 4. Backend — Functions / RPC

### 4.1 Nommage

| Prefixe                 | Usage                                  | Exemples                                                      |
| ----------------------- | -------------------------------------- | ------------------------------------------------------------- |
| `fn_`                   | Logique metier                         | `fn_transition_marche()`, `fn_enforce_eb_workflow()`          |
| `get_`                  | Lecture/requete                        | `get_dashboard_data()`, `get_user_direction()`                |
| `generate_`             | Generation reference/numero            | `generate_marche_numero()`, `generate_engagement_numero()`    |
| `check_`                | Validation/verification                | `check_budget_availability()`, `check_marche_prerequisites()` |
| `create_`               | Creation entite                        | `create_notification()`, `create_workflow_task()`             |
| `validate_`             | Validation workflow                    | `validate_imputation()`, `validate_reamenagement()`           |
| `is_` / `has_` / `can_` | Predicat booleen                       | `is_admin()`, `has_role()`, `can_transition()`                |
| `log_`                  | Audit/tracabilite                      | `log_action()`, `log_audit_action()`                          |
| `search_`               | Recherche paginee                      | `search_notes_sef_v2()`, `search_notes_aef()`                 |
| `wf_admin_`             | Admin workflow engine                  | `wf_admin_upsert_step()`, `wf_admin_upsert_workflow()`        |
| `trg_`                  | Trigger function (appelee par trigger) | `trg_create_task_for_engagement()`                            |
| `render_`               | Template rendering                     | `render_notification_template()`                              |
| `send_`                 | Envoi notification                     | `send_bulk_notifications()`                                   |

### 4.2 Parametres

Convention pour les parametres de fonctions :

```sql
-- Prefixe p_ pour les parametres
CREATE FUNCTION fn_transition_marche(
  p_marche_id UUID,
  p_nouveau_statut TEXT,
  p_user_id UUID,
  p_motif TEXT DEFAULT NULL
) ...
```

### 4.3 SECURITY DEFINER

~310/359 fonctions sont `SECURITY DEFINER` :

- S'execute avec les privileges du createur (postgres)
- Necessaire pour bypass RLS dans les operations backend
- TOUJOURS mettre `SECURITY DEFINER` sur les fonctions qui modifient des donnees

```sql
CREATE OR REPLACE FUNCTION public.fn_example(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ ... $$;
```

---

## 5. Backend — Schema Chaine ELOP (FK)

### 5.1 Schema relationnel complet

```
notes_sef (4845 lignes)
  |
  | notes_dg.note_sef_id -> notes_sef.id
  v
notes_dg / AEF (9 lignes)
  |
  | imputations.note_aef_id -> notes_dg.id
  v
imputations (1 ligne)
  |
  | expressions_besoin.imputation_id -> imputations.id
  | expressions_besoin.note_id -> notes_dg.id
  v
expressions_besoin (3146 lignes)
  |
  |---> passation_marche.expression_besoin_id -> expressions_besoin.id
  |     passation_marche (7 lignes)
  |
  |---> marches.expression_besoin_id -> expressions_besoin.id
  |     marches (16 lignes)
  v
budget_engagements (5663 lignes)
  budget_engagements.passation_marche_id -> passation_marche.id
  budget_engagements.marche_id -> marches.id
  budget_engagements.expression_besoin_id -> expressions_besoin.id
  budget_engagements.note_id -> notes_dg.id
  budget_engagements.budget_line_id -> budget_lines.id
  |
  | budget_liquidations.engagement_id -> budget_engagements.id
  v
budget_liquidations (4355 lignes)
  |
  | ordonnancements.liquidation_id -> budget_liquidations.id
  v
ordonnancements (3363 lignes)
  |
  | reglements.ordonnancement_id -> ordonnancements.id
  v
reglements (0 lignes)
```

### 5.2 Tables satellites par etape

| Etape             | Table principale      | Tables satellites                                                                                                                                       |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. SEF            | `notes_sef`           | `notes_sef_attachments`, `notes_sef_history`, `notes_sef_pieces`, `notes_sef_imputations`, `affectations_notes`                                         |
| 2. AEF            | `notes_dg`            | `notes_dg_attachments`, `notes_aef_history`, `note_attachments`                                                                                         |
| 3. Imputation     | `imputations`         | `imputation_lignes`                                                                                                                                     |
| 4. Expr. Besoin   | `expressions_besoin`  | `expression_besoin_lignes`, `expression_besoin_attachments`, `expression_besoin_validations`                                                            |
| 5a. Passation     | `passation_marche`    | `lots_marche`, `soumissionnaires_lot`                                                                                                                   |
| 5b. Marches       | `marches`             | `marche_lots`, `marche_offres`, `marche_documents`, `marche_attachments`, `marche_historique`, `marche_validations`, `soumissions`, `evaluations_offre` |
| 6. Engagement     | `budget_engagements`  | `engagement_attachments`, `engagement_documents`, `engagement_validations`                                                                              |
| 7. Liquidation    | `budget_liquidations` | `liquidation_attachments`, `liquidation_validations`                                                                                                    |
| 8. Ordonnancement | `ordonnancements`     | `ordonnancement_attachments`, `ordonnancement_pieces`, `ordonnancement_signatures`, `ordonnancement_validations`                                        |
| 9. Reglement      | `reglements`          | `reglement_attachments`, `mouvements_bancaires`                                                                                                         |

### 5.3 Tables transversales

| Table               | Role                                         |
| ------------------- | -------------------------------------------- |
| `dossiers`          | Dossier de depense (agrege toute la chaine)  |
| `dossier_etapes`    | Etapes du dossier                            |
| `budget_lines`      | Lignes budgetaires (disponibilite)           |
| `budget_movements`  | Mouvements budget (reserve, engage, liquide) |
| `notifications`     | Notifications utilisateur                    |
| `logs_actions`      | Journal d'actions                            |
| `audit_logs`        | Piste d'audit                                |
| `workflow_tasks`    | Taches workflow en cours                     |
| `credit_transfers`  | Virements de credits                         |
| `documents_generes` | Documents PDF generes avec QR                |

### 5.4 Deux tables Passation

Le module Passation a deux tables :

| Table              | Role                                                         | Chaine                                   |
| ------------------ | ------------------------------------------------------------ | ---------------------------------------- |
| `passation_marche` | Etape 5 de la chaine de depense, liee au dossier             | `budget_engagements.passation_marche_id` |
| `marches`          | Workflow complet avec state machine (`fn_transition_marche`) | `budget_engagements.marche_id`           |

Les deux sont utilisables pour creer un engagement.

---

## 6. Backend — Edge Functions

### 6.1 Conventions

- Dossier : `/supabase/functions/{nom-fonction}/index.ts`
- Runtime : Deno (TypeScript)
- Auth : `Authorization: Bearer {anon_key}` ou `service_role_key`
- CORS : `Access-Control-Allow-Origin: *`
- Erreurs : JSON `{ error: string, details?: string }`

### 6.2 Liste et usage

| Fonction                   | Methode  | Auth         | Description                    |
| -------------------------- | -------- | ------------ | ------------------------------ |
| `send-notification-email`  | POST     | service_role | Envoi email via Resend API     |
| `create-user`              | POST     | service_role | Creation utilisateur avec role |
| `generate-export`          | POST     | anon         | Export CSV/Excel/PDF           |
| `generate-report`          | POST     | anon         | Rapport financier              |
| `generate-bordereau`       | POST     | anon         | Bordereau PDF                  |
| `generate-dashboard-stats` | GET      | anon         | Stats dashboard                |
| `r2-storage`               | POST/GET | anon         | URLs presignees Cloudflare R2  |
| `process-reglement`        | POST     | service_role | Traitement reglement           |
| `budget-alerts`            | POST     | service_role | Detection alertes budget       |
| `bulk-operations`          | POST     | service_role | Operations en masse            |
| `validate-workflow`        | POST     | service_role | Validation workflow            |
| `workflow-validation`      | POST     | service_role | Validation avancee             |

---

## 7. Backend — Variables d'environnement

### 7.1 Frontend (.env)

```bash
# Obligatoire
VITE_SUPABASE_PROJECT_ID=       # ID projet Supabase
VITE_SUPABASE_URL=              # https://{project_id}.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=  # Cle anon (publique, JWT)
```

> Ces variables sont exposees au client. JAMAIS de secret ici.

### 7.2 Edge Functions (secrets Supabase)

```bash
# Supabase
SUPABASE_SERVICE_ROLE_KEY=      # Bypass RLS, acces complet

# Cloudflare R2
R2_ENDPOINT=                    # https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=               # Access key R2
R2_SECRET_ACCESS_KEY=           # Secret key R2
R2_BUCKET=                      # Nom du bucket

# Email
RESEND_API_KEY=                 # Cle API Resend
```

> Ces secrets sont configures via `supabase secrets set KEY=VALUE`.

### 7.3 Scripts migration (local uniquement)

```bash
# SQL Server source
SQL_SERVER_HOST=                # IP du serveur SQL Server
SQL_SERVER_USER=                # Utilisateur
SQL_SERVER_PASSWORD=            # Mot de passe
SQL_SERVER_DB=                  # Nom de la base

# SMB (fichiers)
SMB_HOST=                       # IP partage SMB
SMB_USER=                       # Utilisateur SMB
SMB_PASSWORD=                   # Mot de passe SMB
```

---

## 8. Backend — Migrations

### 8.1 Nommage des fichiers

```
supabase/migrations/{timestamp}_{description}.sql
```

| Format           | Exemples                                                  |
| ---------------- | --------------------------------------------------------- |
| Auto-genere      | `20260105183634_b859c095-992a-4104-a3a6-5bd307d1a193.sql` |
| Nomme (recent)   | `20260218_prompt9_transitions_contraintes.sql`            |
| Nomme semantique | `20260129162945_pieces_jointes.sql`                       |

### 8.2 Structure d'une migration

```sql
-- ============================================================
-- Description courte
-- Date: YYYY-MM-DD
-- ============================================================

-- STEP 1: ...
-- STEP 2: ...

-- Tests de verification (commentaires)
-- SELECT COUNT(*) FROM ...
```

### 8.3 Deploiement

Les migrations sont deployees via le **SQL Editor Supabase** (Playwright MCP).
PostgREST MCP ne supporte que le DML (SELECT/INSERT/UPDATE/DELETE sur tables exposees).

Pour le DDL (CREATE TABLE, ALTER, fonctions, triggers) :

1. Ecrire le fichier `.sql` dans `/supabase/migrations/`
2. Copier le contenu dans le SQL Editor via `window.monaco.editor.getModels()[0].setValue(sql)`
3. Cliquer Run
4. Verifier le resultat

---

## 9. Backend — Notifications

### 9.1 Systeme de templates

```sql
-- Table notification_templates
-- code : MARCHE_PUBLIE, NOTE_SEF_VALIDEE, ENGAGEMENT_SOUMIS, etc.
-- titre_template : 'Marche publie: {{numero}}'
-- corps_template : 'Le marche "{{objet}}" (ref. {{numero}}) a ete publie...'
-- variables_disponibles : '["numero", "objet", "montant", ...]'::jsonb

-- Rendering via render_notification_template(code, {variables})
-- Syntaxe variables : {{variable}} (double accolades)
```

### 9.2 Destinataires

```sql
-- Table notification_recipients
-- type_evenement : 'marche_publie', 'note_sef_validee', etc.
-- role_hierarchique : 'DG', 'DAAF', 'CB'
-- direction_id : NULL (tous) ou UUID specifique
-- user_id : NULL (par role) ou UUID specifique

-- Envoi via send_bulk_notifications(type, entity_type, entity_id, variables)
```

### 9.3 CHECK constraint sur type_evenement

Les types d'evenements sont contraints par un CHECK sur `notification_templates` et `notification_recipients`.
Ajouter un nouveau type necessite un `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT`.

---

## 10. Frontend — Nommage

### 10.1 Fichiers

| Type            | Convention                   | Exemples                                                              |
| --------------- | ---------------------------- | --------------------------------------------------------------------- |
| Composants TSX  | **PascalCase**               | `PassationDetails.tsx`, `EvaluationCOJO.tsx`, `NoteSEFForm.tsx`       |
| Hooks           | **use** + camelCase `.ts`    | `useNotesSEF.ts`, `usePassationsMarche.ts`, `useBudgetLines.ts`       |
| Services        | **camelCase** + `Service.ts` | `noteSEFPdfService.ts`, `attachmentService.ts`, `pvCojoPdfService.ts` |
| Lib / utils     | **camelCase** `.ts`          | `workflowEngine.ts`, `pdfHeader.ts`, `imputation-utils.ts`            |
| Types           | **camelCase** `.ts`          | `spending-case.ts`, `validation.ts`                                   |
| Pages           | **PascalCase** `.tsx`        | `NotesSEF.tsx`, `PassationMarche.tsx`, `Engagements.tsx`              |
| Tests E2E       | **kebab-case** `.spec.ts`    | `prompt8-marche-details.spec.ts`                                      |
| Tests unitaires | **camelCase** `.test.ts`     | `workflowEngine.test.ts`, `permissions.test.ts`                       |

### 10.2 Composants et hooks

```
Composant : PascalCase, descriptif, prefixe module si ambigu
  NoteSEFForm        (pas NoteForm)
  PassationDetails   (pas Details)
  WorkflowActionBar  (pas ActionBar)
  ComparatifEvaluation

Hook : use + NomModule + Action
  useNotesSEF            CRUD principal
  useNotesSEFExport      Export
  useNotesSEFList        Liste paginee
  useNoteSEFDetail       Detail par ID
  useNoteSEFAutosave     Fonctionnalite specifique
```

### 10.3 Repertoires

```
src/components/{module}/     Composants groupes par module metier (50 modules)
src/hooks/                   Hooks a plat (pas de sous-dossiers sauf dashboard/)
src/services/                Services a plat + storage/
src/lib/{sous-module}/       Utilitaires groupes par domaine
src/pages/{section}/         Pages groupees par section URL
```

---

## 11. Frontend — Imports (ordre obligatoire)

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react';

// 2. Routing
import { useNavigate, useSearchParams } from 'react-router-dom';

// 3. shadcn/ui (depuis @/components/ui/)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 4. TanStack Query (si hook)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 5. Supabase client (si hook/service)
import { supabase } from '@/integrations/supabase/client';

// 6. Contextes
import { useExercice } from '@/contexts/ExerciceContext';
import { useRBAC } from '@/contexts/RBACContext';

// 7. Hooks custom
import { useNotesSEF } from '@/hooks/useNotesSEF';
import { usePermissions } from '@/hooks/usePermissions';

// 8. Composants internes
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

// 9. Librairies tierces
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// 10. Utilitaires
import { cn, formatCurrency } from '@/lib/utils';

// 11. Icones (lucide-react) — toujours en dernier
import { Plus, FileText, Download, Loader2 } from 'lucide-react';

// 12. Types (import type)
import type { Database } from '@/integrations/supabase/types';
```

---

## 12. Frontend — Etat et donnees

### 12.1 TanStack Query — Donnees serveur

```typescript
// Query — lecture
const { data, isLoading, error } = useQuery({
  queryKey: ['notes-sef', exercice, filters],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('notes_sef')
      .select('*, direction:directions(id, label, sigle)')
      .eq('exercice', exercice)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  enabled: !!exercice,
  staleTime: 30_000, // Standard projet : 30s
});

// Mutation — ecriture
const createMutation = useMutation({
  mutationFn: async (payload: CreatePayload) => {
    const { data, error } = await supabase.from('notes_sef').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['notes-sef'] });
    toast.success('Note creee');
  },
  onError: (error: Error) => {
    toast.error(error.message);
  },
});
```

### 12.2 useState — Etat local UI

```typescript
const [formOpen, setFormOpen] = useState(false);
const [activeTab, setActiveTab] = useState('soumis');
const [selectedId, setSelectedId] = useState<string | null>(null);
```

### 12.3 Contextes (2 seulement)

| Contexte        | Hook            | Donnees                                        |
| --------------- | --------------- | ---------------------------------------------- |
| ExerciceContext | `useExercice()` | `exercice` actif (2025, 2026)                  |
| RBACContext     | `useRBAC()`     | `roles`, `permissions`, `isAdmin`, `hasRole()` |

---

## 13. Frontend — Formulaires

### 13.1 Pattern principal : State-based

```typescript
const [formData, setFormData] = useState({ objet: '', montant: 0 });
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = (): boolean => {
  const e: Record<string, string> = {};
  if (!formData.objet.trim()) e.objet = 'Objet obligatoire';
  if (formData.montant <= 0) e.montant = 'Montant invalide';
  setErrors(e);
  return Object.keys(e).length === 0;
};
```

### 13.2 Pattern secondaire : React Hook Form + Zod

Pour formulaires complexes (interims, reglements, notifications) :

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ motif: z.string().min(1, 'Requis') });
const form = useForm({ resolver: zodResolver(schema) });
```

---

## 14. Frontend — Composants UI et Responsive

### 14.1 Regle : shadcn/ui uniquement

Tous les composants UI depuis `@/components/ui/`. Pas de CSS custom, pas de styled-components.

Composants cles : Button, Card, Dialog, Sheet, Tabs, Table, Badge, Select, Input, Skeleton, DropdownMenu, Tooltip, Popover, Calendar, Alert, ScrollArea.

### 14.2 Responsive — Tailwind breakpoints (mobile-first)

```
Base    : mobile (styles par defaut)
sm:     : 640px+  (tablette portrait)
md:     : 768px+  (tablette paysage)
lg:     : 1024px+ (desktop)
xl:     : 1280px+ (grand ecran)
```

Patterns courants :

```tsx
className = 'grid gap-4 md:grid-cols-3 lg:grid-cols-6'; // KPIs
className = 'hidden sm:flex items-center gap-2'; // Masquer mobile
className = 'p-4 lg:p-6'; // Padding adaptatif
```

---

## 15. Frontend — Routing et lazy loading

### 15.1 Structure des routes

```
/                    Dashboard (non lazy)
/auth/*              Authentification (non lazy)
/admin/*             Administration (29 routes, lazy)
/planification/*     Budget (17 routes, lazy)
/execution/*         Execution (lazy)
/notes-sef/*         Notes SEF (lazy)
/engagements         Engagements (lazy)
...
```

### 15.2 Lazy loading

```typescript
const NotesSEF = lazy(() => import('./pages/NotesSEF'));

<Suspense fallback={<LoadingSpinner />}>
  <Route path="/notes-sef" element={<NotesSEF />} />
</Suspense>
```

Non lazy (critical path) : Dashboard, LoginPage, SelectExercice.

---

## 16. Frontend — Patterns reutilisables

### P1. Page liste (KPIs + Onglets + Table + Pagination)

```
+-------------------------------------------------+
| PageHeader [titre]              [Exporter] [+]  |
+-------------------------------------------------+
| KPI 1 | KPI 2 | KPI 3 | KPI 4 | KPI 5 | KPI 6 | <- Card grid md:grid-cols-6
+-------------------------------------------------+
| [Tous] [Soumis] [Valide] [Differe] [Rejete]    | <- Tabs (par statut)
+-------------------------------------------------+
| Recherche: [____]  Direction: [v]  Date: [v]    | <- NotesFiltersBar
+-------------------------------------------------+
| Ref. | Objet | Montant | Statut | Date | ...    | <- Table
+-------------------------------------------------+
| < Prev  Page 1/10  Next >                       | <- NotesPagination
+-------------------------------------------------+
```

Composants partages : `PageHeader`, `NotesFiltersBar`, `NotesPagination`, `EmptyState`, `StatutBadge`.

Hook pattern : `useModuleList()` retourne `{ data, counts, isLoading, page, setPage, pageSize, totalPages }`.

Modules utilisant ce pattern : NotesSEF, NotesAEF, NotesDG, ExpressionBesoin, PassationMarche, Engagements, Liquidations, Ordonnancements, Reglements.

### P2. Formulaire de creation (Dialog/Sheet)

```
+--------------------------------------------------+
| Dialog "Nouvelle Note SEF"               [x]     |
+--------------------------------------------------+
| Objet *          [_______________________________]|
| Direction *      [v Selectionner v]               |
| Montant estime   [______________] FCFA            |
| Source            [v]                              |
| Ligne budget     [v] (filtre disponibilite)       |
| PJ (max 3)       [+ Ajouter]                     |
|                        [Annuler]  [Enregistrer]   |
+--------------------------------------------------+
```

### P3. Panneau detail avec onglets (Sheet/Dialog)

```
+---------------------------------------------------+
| Detail "Note SEF ARTI00022602001"           [x]   |
+---------------------------------------------------+
| [Infos] [Documents] [Historique] [AEF liee]       |
+---------------------------------------------------+
| Contenu onglet actif                               |
+---------------------------------------------------+
| [Rejeter]  [Differer]  [Valider]                  |
+---------------------------------------------------+
```

Variante Passation : 7 onglets (Infos, Lots, Soumissionnaires, Evaluation, Comparatif, Documents, Chaine).

### P4. Espace validation / approbation

Page dediee pour validateurs (DG, DAAF) :

- KPIs (en attente, montant total, urgents)
- Tabs (en attente / historique)
- Table avec boutons [Approuver] [Rejeter] par ligne
- Dialog motif obligatoire pour rejet/differ
- RBAC : acces restreint par role

### P5. Barre chaine de depense (Chain Nav)

Navigation horizontale entre etapes liees :

```
[v EB REF-001] --> [* Passation PM-001] --> [o Engagement]
   completed          current                  pending
```

Composant : `PassationChainNav` (3 steps, 4 statuts : completed/current/pending/unavailable).

### P6. Export (Excel / PDF / CSV)

```
[v Exporter]
  |-- Excel complet (multi-feuilles)
  |-- PDF rapport (en-tete ARTI)
  |-- CSV
```

Hook : `useModuleExport()` retourne `{ exportExcel, exportPDF, exportCSV, isExporting }`.

Libraries : `xlsx` (Excel), `jspdf` + `jspdf-autotable` (PDF), `@/lib/export/export-service` (CSV).

PDF : `generatePDFHeader()` + `generatePDFFooter()` depuis `@/lib/pdf/`.

### P7. Workflow action bar

Timeline visuelle + boutons conditionnels par role et statut :

```
[Brouillon] -> [Publie] -> [Cloture] -> [Evalue] -> [Attribue] -> [Approuve] -> [Signe]
```

Boutons visibles selon `statut` + `role` (DAAF, DG) + prerequis.

### P8. Sidebar badges temps reel

Hook `useSidebarBadges` : 10 compteurs paralleles, `refetchInterval: 30_000`, `staleTime: 15_000`.

---

## 17. Frontend — Formatage des donnees

### 17.1 Montants FCFA

```typescript
import { formatCurrency } from '@/lib/utils';
formatCurrency(1500000); // "1 500 000 FCFA"
```

### 17.2 Dates

```typescript
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
format(new Date(date), 'dd MMM yyyy', { locale: fr }); // "19 fev. 2026"
format(new Date(date), 'dd/MM/yyyy'); // "19/02/2026"
```

### 17.3 References

Pattern ARTI : `ARTI{00}{MM}{YY}{NNNN}` — genere par trigger DB.

---

## 18. Frontend — TypeScript

- `strict: true` dans tsconfig.json
- **Pas de `any`** — utiliser `unknown`, types precis, generiques
- **Interfaces** pour les types de donnees (pas `type` sauf unions)
- **Types generes** Supabase : `src/integrations/supabase/types.ts` (18 220 lignes)
- **Named exports** (pas de default exports sauf pages)

```typescript
// Correct
export interface NoteSEF { id: string; objet: string; montant: number | null; }
export function useNotesSEF() { ... }

// Incorrect
export default function useNotesSEF() { ... }
const data: any = response;
```

---

## 19. Frontend — Anti-patterns a eviter

| Anti-pattern                    | Correction                                       |
| ------------------------------- | ------------------------------------------------ |
| `any`                           | `unknown` ou type precis                         |
| CSS custom / inline styles      | Tailwind classes                                 |
| Fetch API directe               | `supabase.from()`                                |
| Redux / Zustand                 | TanStack Query (serveur) + useState (local)      |
| Styled-components               | Tailwind + shadcn/ui                             |
| Default exports (hooks)         | Named exports                                    |
| Console.log en production       | `toast()` pour feedback utilisateur              |
| Appels Supabase dans composants | Encapsuler dans hooks `use*`                     |
| Requetes N+1                    | `.select('*, relation:table(*)')` avec jointures |
| Formulaires non valides         | Validation avant mutation                        |
