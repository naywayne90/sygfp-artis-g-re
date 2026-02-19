# CONVENTIONS DE CODE — SYGFP

Regles detaillees pour tout le code du projet. Resume dans `CLAUDE.md` section 4.

---

## 1. TypeScript

### Stricte

- **Zero `any`** : utiliser `unknown`, types precis, ou generiques
- **Zero erreur `tsc --noEmit`** : obligation avant chaque commit
- **Types Supabase** : extraire de `Database['public']['Tables']['table_name']`

### Types domaine

- Definis **dans le hook** qui gere le CRUD, pas dans un fichier type separe
- Exportes pour reutilisation : `export type PassationMarche = { ... }`
- Constantes config (lookup maps) dans le hook : `export const STATUTS_PASSATION: Record<string, { label, color }>`

```typescript
// Pattern standard — dans usePassationsMarche.ts
export type PassationMarche = {
  id: string;
  reference: string | null;
  statut: PassationStatut;
  // ...
};
export type PassationStatut =
  | 'brouillon'
  | 'publie'
  | 'evalue'
  | 'attribue'
  | 'approuve'
  | 'certifie'
  | 'signe';
```

### Zod

- Schemas dans `src/lib/validations/` (fichier par module)
- Messages en francais : `.min(1, "L'objet est obligatoire")`
- Type infere : `export type FormData = z.infer<typeof schema>`
- Validation cross-field : `.refine()` avec `path` cible

---

## 2. Imports

Ordre strict (separe par ligne vide entre groupes) :

```typescript
// 1. React
import { useState, useCallback } from 'react';

// 2. Librairies externes
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// 3. Supabase
import { supabase } from '@/integrations/supabase/client';

// 4. Toast
import { toast } from 'sonner';

// 5. Contextes
import { useExercice } from '@/contexts/ExerciceContext';
import { useRBAC } from '@/contexts/RBACContext';

// 6. Hooks custom
import { useAuditLog } from '@/hooks/useAuditLog';

// 7. Composants
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 8. Utils
import { formatCurrency } from '@/lib/utils';

// 9. Types (import type)
import type { Database } from '@/integrations/supabase/types';
```

---

## 3. Composants React

### Structure d'un fichier composant

```typescript
// Imports (voir section 2)

// Types/Interfaces
interface MonComposantProps {
  id: string;
  titre: string;
  onAction?: () => void;
}

// Composant
export function MonComposant({ id, titre, onAction }: MonComposantProps) {
  // hooks en premier
  // state
  // callbacks
  // render
}
```

### Regles

- **Named export** : `export function X()` (pas `export default`)
- **Props interface** : toujours definie explicitement au-dessus du composant
- **Hooks** : appeles en premier dans le composant, jamais conditionnellement
- **Fichier** : PascalCase `.tsx` (ex: `PassationDetails.tsx`)
- **Index** : re-export depuis `index.ts` du dossier module

---

## 4. Hooks personnalises

### Structure d'un hook CRUD

```typescript
export function useMonModule() {
  const queryClient = useQueryClient();
  const { exerciceId } = useExercice();

  // Query principale
  const { data, isLoading, error } = useQuery({
    queryKey: ['mon-module', exerciceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ma_table')
        .select('*, relation:table_liee(*)')
        .eq('exercice', exerciceId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as MonType[];
    },
    enabled: !!exerciceId,
    staleTime: 30_000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (values: CreateInput) => {
      const { data, error } = await supabase.from('ma_table').insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Element cree avec succes');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la creation', {
        description: error.message,
      });
    },
  });

  return { data, isLoading, error, createMutation };
}
```

### Regles hooks

- **Fichier** : `useXxx.ts` (camelCase apres `use`)
- **queryKey** : tableau descriptif `['module', filtreId, page]`
- **staleTime** : 30_000 (30s) par defaut, 60_000 pour les referentiels
- **enabled** : toujours conditionner sur les dependances requises
- **Erreur Supabase** : toujours `if (error) throw error` apres chaque appel
- **Cast** : `as unknown as MonType[]` pour les resultats Supabase avec jointures

---

## 5. Formatage et affichage

### Montants

```typescript
import { formatCurrency } from '@/lib/utils';
formatCurrency(1500000); // "1 500 000 FCFA"
formatCurrency(null); // "0 FCFA"
formatCurrency(1500000, { showSymbol: false }); // "1 500 000"
```

**JAMAIS** de `formatMontant` local — toujours `formatCurrency` de `@/lib/utils`.

### Dates

```typescript
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
format(new Date(dateString), 'dd/MM/yyyy', { locale: fr }); // "19/02/2026"
format(new Date(dateString), 'dd MMMM yyyy', { locale: fr }); // "19 fevrier 2026"
```

### Textes UI

- Tout en **francais** (labels, placeholders, messages erreur, toasts)
- Pas d'emojis dans le code (sauf si explicitement demande)

---

## 6. Backend Supabase (PostgreSQL)

### Nommage tables et colonnes

- **Tables** : `snake_case` pluriel (`notes_sef`, `budget_lines`, `expressions_besoin`)
- **PK** : `id UUID DEFAULT gen_random_uuid()`
- **FK** : `{table_singulier}_id` (`marche_id`, `note_sef_id`, `engagement_id`)
- **Timestamps** : `created_at TIMESTAMPTZ DEFAULT now()` + `updated_at` (trigger auto)
- **Statut** : colonne `statut TEXT` avec valeurs `snake_case` (`brouillon`, `en_validation`, `valide`)
- **Booleens** : prefixe `is_` ou `has_` (`is_active`, `has_attachments`)

### RLS (Row-Level Security)

- **Toujours active** sur chaque table
- **Pattern** : `has_role(auth.uid(), 'ROLE'::app_role)` via table `user_roles`
- **ATTENTION** : les fonctions `is_admin()`, `is_dg()`, `is_daaf()` N'EXISTENT PAS en base. Utiliser uniquement `has_role(auth.uid(), 'ADMIN'::app_role)` etc.
- **Helpers SQL existants** : `has_role()`, `get_user_direction_id()`
- **Nommage policies** : `tablename_action_description` (ex: `passation_marche_select_by_direction`)
- **SECURITY DEFINER** : pour les fonctions RPC qui bypassent RLS

### Fonctions SQL

- **Prefixes** : `fn_` (metier), `get_` (lecture), `generate_` (reference), `check_` (validation)
- **Generation references** : `get_next_sequence(p_doc_type, p_exercice, p_scope)` → atomique, thread-safe
- **Triggers** : prefixe `trg_` (nouveau) ou `trigger_` (legacy)

### Migrations

- **Fichier** : `supabase/migrations/YYYYMMDD_description.sql`
- **Idempotentes** : `CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN ... END $$`
- **Application** : via Playwright MCP > Supabase SQL Editor (pas PostgREST)

---

## 7. Tests

### Vitest (tests unitaires)

- **Fichiers** : `src/test/*.test.ts` ou `src/lib/*/__tests__/*.test.ts`
- **Pattern** : `describe` > `it` avec messages en francais
- **Factory** : fonctions `makeXxx()` pour creer des objets test
- **Pas de mock Supabase** : tester uniquement les fonctions pures (calculs, validations, formatage)

```typescript
import { describe, it, expect } from 'vitest';

describe('maFonction', () => {
  it('retourne le bon resultat pour une entree valide', () => {
    expect(maFonction(input)).toBe(expected);
  });
});
```

### Playwright (tests E2E)

- **Fichiers** : `e2e/*.spec.ts`
- **URL base** : `http://localhost:8080`
- **Auth** : login programmatique avec comptes test
- **Assertions** : `expect(page.getByRole(...)).toBeVisible()`

### Seuils

- **Couverture** : 50% minimum (statements, branches, functions, lines)
- **Non-regression** : nombre de tests ne peut que croitre
- **Module certifie** : re-executer ses tests specifiques apres toute modification

---

## 8. Structure des fichiers

```
src/
  components/
    mon-module/            # kebab-case pour les dossiers
      MonComposant.tsx     # PascalCase pour les fichiers
      index.ts             # re-exports
  hooks/
    useMonModule.ts        # camelCase avec prefixe use
  pages/
    execution/
      MaPage.tsx           # PascalCase
  lib/
    mon-utilitaire/
      index.ts
  services/
    monService.ts          # camelCase
  test/
    mon-module.test.ts     # kebab-case
```

---

## 9. Git

### Commits

```bash
git commit -m "type(scope): description courte"
```

| Type       | Usage                                   |
| ---------- | --------------------------------------- |
| `feat`     | Nouvelle fonctionnalite                 |
| `fix`      | Correction de bug                       |
| `refactor` | Refactoring sans changement fonctionnel |
| `test`     | Ajout/modification de tests             |
| `docs`     | Documentation                           |
| `chore`    | Maintenance, dependances                |

### Scopes courants

`passation`, `engagement`, `liquidation`, `ordonnancement`, `reglement`, `budget`, `notes-sef`, `notes-aef`, `rbac`, `workflow`, `admin`

### Regles

- **Pas de commit** si `tsc --noEmit` ou `vitest run` echoue
- **Pas de fichiers sensibles** : `.env`, credentials, tokens
- **Branche** : `main` (pas de feature branches actuellement)

---

## 10. Chaine de depense — FK (verifie le 19/02/2026)

```
notes_sef
  └── note_sef_id ──> notes_dg (AEF)          ✅ peuple
      └── note_aef_id ──> imputations          ✅ peuple
          └── imputation_id ──> expressions_besoin   ⚠️ colonne existe, non peuple
              └── expression_besoin_id ──> passation_marche   ✅ peuple
                  └── passation_marche_id ──> budget_engagements   ⚠️ colonne existe, non peuple (gap engagement)
                      └── engagement_id ──> budget_liquidations   ✅ peuple
                          └── liquidation_id ──> ordonnancements   ✅ peuple
                              └── ordonnancement_id ──> reglements   ✅ colonne existe (table vide)
```

**IMPORTANT** : la colonne FK dans `imputations` s'appelle `note_aef_id` (PAS `note_dg_id`).
Les 2 FK non peuplees (`imputation_id` dans expressions_besoin, `passation_marche_id` dans budget_engagements) sont des gaps identifies pour le module Engagement.

Chaque etape reference la precedente par FK. Le dossier (`dossiers`) suit la progression globale via `etape_courante`.

---

## 11. Patterns recurrents

### Toast notifications

```typescript
// Succes
toast.success('Passation creee avec succes');

// Erreur avec detail
toast.error('Erreur lors de la creation', {
  description: error.message,
});
```

### Verification budget

```typescript
const { data } = await supabase.rpc('check_budget_availability', {
  p_budget_line_id: lineId,
  p_montant: montant,
});
// data: { disponible: number, is_sufficient: boolean }
```

### Workflow validation

```typescript
// 4 etapes standard : SAF → CB → DAF → DG
// Table : engagement_validations (step_order, role, status, validated_by)
// Machine a etats : src/lib/workflow/workflowEngine.ts
```

### Pagination serveur

```typescript
const { data, count } = await supabase
  .from('ma_table')
  .select('*', { count: 'exact' })
  .range(from, to)
  .order('created_at', { ascending: false });
```

---

_Document cree le 19/02/2026 — SYGFP v2.0_
