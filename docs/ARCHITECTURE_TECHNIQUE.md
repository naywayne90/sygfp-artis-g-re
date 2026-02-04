# Architecture Technique SYGFP

## Vue d'ensemble

SYGFP (Système de Gestion Financière et de Planification) est une application web moderne pour ARTI Gabon, construite avec une stack React/TypeScript et Supabase.

## Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Frontend | React | 18.3.1 |
| Language | TypeScript | 5.6.2 |
| Build | Vite | 5.4.19 |
| UI | Tailwind CSS + shadcn/ui | |
| State | TanStack Query | 5.60.5 |
| Forms | React Hook Form + Zod | |
| Backend | Supabase (PostgreSQL) | |
| Tests Unit | Vitest | |
| Tests E2E | Playwright | |

## Structure du Projet

```
src/
├── components/          # Composants React (42+ modules)
│   ├── ui/              # Composants shadcn/ui
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── shared/          # Composants partagés (PageLoader, etc.)
│   ├── dashboard/       # Dashboards par rôle
│   ├── notes-sef/       # Module Notes SEF
│   ├── notes-aef/       # Module Notes AEF
│   └── ...
├── pages/               # Pages de l'application (50+ pages)
│   ├── admin/           # Administration
│   ├── planification/   # Planification budgétaire
│   ├── execution/       # Exécution budgétaire
│   ├── tresorerie/      # Gestion trésorerie
│   └── ...
├── hooks/               # Hooks personnalisés (130+ hooks)
│   ├── useNotesSEF.ts   # CRUD Notes SEF
│   ├── useNotesAEF.ts   # CRUD Notes AEF
│   ├── usePermissions.ts # Gestion permissions
│   └── ...
├── contexts/            # Contextes React
│   ├── ExerciceContext.tsx  # Exercice budgétaire courant
│   └── RBACContext.tsx      # Contrôle d'accès
├── lib/                 # Utilitaires
│   ├── export/          # Services d'export
│   ├── workflow/        # Moteur workflow
│   └── utils.ts         # Fonctions utilitaires
├── integrations/        # Intégrations externes
│   └── supabase/        # Client Supabase + types générés
└── types/               # Types TypeScript globaux
```

## Chaîne de Dépense (9 étapes)

```
1. Note SEF → 2. Note AEF → 3. Imputation → 4. Expression Besoin
     ↓              ↓            ↓              ↓
5. Passation Marché → 6. Engagement → 7. Liquidation
                            ↓              ↓
                    8. Ordonnancement → 9. Règlement
```

Chaque étape:
- A son propre hook (`useNotesEF.ts`, `useEngagements.ts`, etc.)
- A sa propre page (`/notes-sef`, `/engagements`, etc.)
- Génère un dossier avec référence unique (`DOSS-2026-000XXX`)

## Patterns de Développement

### 1. Hooks avec TanStack Query

```typescript
// Exemple: useNotesSEF.ts
export function useNotesSEF(filters?: NotesSEFFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notes-sef", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_sef")
        .select("*, direction:directions(*)")
        .eq("exercice", exercice);
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async (data: CreateNoteSEFDTO) => {
      // ... création
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-sef"] });
      toast.success("Note créée");
    },
  });

  return { notes: data, isLoading, createNote };
}
```

### 2. Composants avec shadcn/ui

```tsx
// Utiliser les composants shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function MonComposant() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Titre</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Action</Button>
        <Badge variant="success">Validé</Badge>
      </CardContent>
    </Card>
  );
}
```

### 3. Gestion des Permissions (RBAC)

```tsx
// Utiliser usePermissions ou PermissionGuard
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGuard } from "@/components/shared/PermissionGuard";

function MonComposant() {
  const { canCreate, canValidate, isAdmin } = usePermissions();

  return (
    <div>
      {canCreate && <Button>Créer</Button>}

      <PermissionGuard requires="can_validate">
        <Button>Valider</Button>
      </PermissionGuard>
    </div>
  );
}
```

## Sécurité

### Profils Fonctionnels (5)
- **Admin**: Accès complet, gestion système
- **Validateur**: Validation des notes et dossiers
- **Opérationnel**: Création et soumission
- **Contrôleur**: Vérification et audit
- **Auditeur**: Lecture seule, rapports

### Niveaux Hiérarchiques (5)
- DG (Direction Générale)
- Directeur
- Sous-Directeur
- Chef de Service
- Agent

### Row-Level Security (RLS)
Toutes les tables sensibles ont des politiques RLS:
- Filtrage par direction
- Filtrage par exercice
- Audit trail automatique

## Performance

### Code-Splitting
- Pages chargées en lazy loading
- Vendors séparés en chunks
- Bundle principal < 500 KB

### Optimisations
- React.memo pour composants coûteux
- useMemo/useCallback pour éviter re-renders
- Pagination des listes (50 items/page)
- Debounce sur les recherches

## Commandes

```bash
npm run dev           # Développement (port 8080)
npm run build         # Build production
npm run typecheck     # Vérification TypeScript
npm run lint          # ESLint
npm run test          # Tests Vitest
npm run test:e2e      # Tests Playwright
npm run verify        # typecheck + lint + test
```

## Conventions

### Nommage
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `PascalCase`

### Commits
```
type(scope): description

Types: feat, fix, refactor, test, docs, chore
```

### Imports
```typescript
// 1. React/libs externes
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Composants UI
import { Button } from "@/components/ui/button";

// 3. Hooks internes
import { useNotesSEF } from "@/hooks/useNotesSEF";

// 4. Types
import type { NoteSEF } from "@/types";
```
