# Architecture Technique SYGFP

## Vue d'ensemble

SYGFP (Système de Gestion Financière et de Planification) est une application web moderne pour ARTI Gabon, construite avec une stack React/TypeScript et Supabase. La migration depuis SQL Server est 100% accomplie (fevrier 2026).

## Stack Technique

| Composant  | Technologie              | Version |
| ---------- | ------------------------ | ------- |
| Frontend   | React                    | 18.3.1  |
| Language   | TypeScript               | 5.6.2   |
| Build      | Vite                     | 5.4.19  |
| UI         | Tailwind CSS + shadcn/ui |         |
| State      | TanStack Query           | 5.60.5  |
| Forms      | React Hook Form + Zod    |         |
| Backend    | Supabase (PostgreSQL)    |         |
| Tests Unit | Vitest                   |         |
| Tests E2E  | Playwright               |         |

## Metriques du Projet

| Metrique            | Valeur                                   |
| ------------------- | ---------------------------------------- |
| Pages               | 104 fichiers (12 sections)               |
| Composants          | 402 fichiers (46 modules)                |
| Hooks personnalises | 142                                      |
| Lib/Utilitaires     | 40                                       |
| Services            | 12                                       |
| Contextes           | 2 (Exercice, RBAC)                       |
| Migrations Supabase | 173                                      |
| Edge Functions      | 4                                        |
| Tests unitaires     | 22 fichiers                              |
| Tests E2E           | 22 fichiers                              |
| Donnees migrees     | 14 806 enregistrements + 27 117 fichiers |

## Structure du Projet

```
src/
├── components/          # 402 fichiers, 46 modules
│   ├── ui/              # Composants shadcn/ui (base)
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── shared/          # Composants partages (PageLoader, etc.)
│   ├── dashboard/       # Dashboards par role
│   ├── notes-sef/       # Module Notes SEF
│   ├── notes-aef/       # Module Notes AEF
│   ├── engagement/      # Module Engagements
│   ├── liquidation/     # Module Liquidations
│   ├── ordonnancement/  # Module Ordonnancements
│   ├── reglement/       # Module Reglements
│   ├── prestataires/    # Module Prestataires
│   ├── tresorerie/      # Module Tresorerie
│   └── ...              # Autres modules (budget, marches, etc.)
├── pages/               # 104 fichiers, 12 sections
│   ├── admin/           # Administration
│   ├── planification/   # Planification budgetaire
│   ├── execution/       # Execution budgetaire
│   ├── tresorerie/      # Tresorerie et reglements
│   ├── recettes/        # Recettes
│   └── ...
├── hooks/               # 142 hooks personnalises
│   ├── useNotesSEF.ts   # CRUD Notes SEF
│   ├── useNotesAEF.ts   # CRUD Notes AEF
│   ├── useReglements.ts # CRUD Reglements
│   ├── usePermissions.ts # Gestion permissions
│   └── ...
├── contexts/            # Contextes React
│   ├── ExerciceContext.tsx  # Exercice budgetaire courant
│   └── RBACContext.tsx      # Controle d'acces
├── lib/                 # 40 fichiers utilitaires
│   ├── export/          # Services d'export
│   ├── workflow/        # Moteur workflow
│   └── utils.ts         # Fonctions utilitaires
├── services/            # 12 services (PDF, attachments, storage)
├── integrations/        # Client Supabase + types generes
│   └── supabase/
└── types/               # Types TypeScript globaux
```

## Migration SQL Server vers Supabase

La migration a ete realisee le 5 fevrier 2026. Toutes les donnees metier sont en production.

| Donnee          | SQL Server | Supabase                | Statut |
| --------------- | ---------- | ----------------------- | ------ |
| Notes SEF       | 4,823      | 4,836                   | Migre  |
| Engagements     | ~1,700     | 2,805                   | Migre  |
| Liquidations    | 2,954      | 3,633                   | Migre  |
| Ordonnancements | 2,726      | 3,501                   | Migre  |
| Fournisseurs    | 426        | 431                     | Migre  |
| Pieces jointes  | 9 375 ref. | 27 117 fichiers (26 Go) | Migre  |

> Supabase contient plus de donnees car de nouvelles entrees ont ete creees depuis la mise en production.

## Chaîne de Dépense (9 étapes)

```
1. Note SEF → 2. Note AEF → 3. Imputation → 4. Expression Besoin
     ↓              ↓            ↓              ↓
5. Passation Marché → 6. Engagement → 7. Liquidation
                            ↓              ↓
                    8. Ordonnancement → 9. Règlement
```

Chaque etape :

- A son propre hook (`useNotesSEF.ts`, `useEngagements.ts`, `useReglements.ts`, etc.)
- A sa propre page (`/notes-sef`, `/engagements`, `/reglements`, etc.)
- Genere un dossier avec reference unique (`DOSS-2026-000XXX`)
- Le Reglement (etape 9) clot le cycle de depense et marque le dossier comme "solde"

## Patterns de Développement

### 1. Hooks avec TanStack Query

```typescript
// Exemple: useNotesSEF.ts
export function useNotesSEF(filters?: NotesSEFFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notes-sef', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_sef')
        .select('*, direction:directions(*)')
        .eq('exercice', exercice);
      if (error) throw error;
      return data;
    },
  });

  const createNote = useMutation({
    mutationFn: async (data: CreateNoteSEFDTO) => {
      // ... création
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-sef'] });
      toast.success('Note créée');
    },
  });

  return { notes: data, isLoading, createNote };
}
```

### 2. Composants avec shadcn/ui

```tsx
// Utiliser les composants shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

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

## Edge Functions Supabase (4)

4 Edge Functions Deno deployees dans `supabase/functions/` :

| Fonction                  | Fichier                            | Description                                                                                         | Methode |
| ------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- | ------- |
| `send-notification-email` | `send-notification-email/index.ts` | Envoi d'emails de notification via Resend API. Respecte les preferences utilisateur.                | POST    |
| `create-user`             | `create-user/index.ts`             | Creation d'utilisateur avec role et profil. Reserve aux admins. Bypass RLS via service role key.    | POST    |
| `generate-export`         | `generate-export/index.ts`         | Export de donnees financieres en CSV, Excel (CSV enrichi) ou PDF (HTML avec QR code et signatures). | POST    |
| `r2-storage`              | `r2-storage/index.ts`              | Gestion fichiers via Cloudflare R2 : upload/download URLs presignees, suppression, listing.         | POST    |

### Architecture des Edge Functions

```
Frontend (React)
    │
    ├── supabase.functions.invoke("send-notification-email")
    │       └──→ Resend API (emails transactionnels)
    │
    ├── supabase.functions.invoke("create-user")
    │       └──→ Supabase Auth Admin API
    │
    ├── supabase.functions.invoke("generate-export")
    │       └──→ QR Server API (QR codes sur fiches PDF)
    │
    └── supabase.functions.invoke("r2-storage")
            └──→ Cloudflare R2 (stockage S3-compatible)
```

### Secrets configures (Supabase Dashboard)

| Secret                      | Utilise par                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | `create-user`, `send-notification-email`, `generate-export` |
| `SUPABASE_ANON_KEY`         | `create-user`                                               |
| `RESEND_API_KEY`            | `send-notification-email`                                   |
| `R2_ENDPOINT`               | `r2-storage`                                                |
| `R2_ACCESS_KEY_ID`          | `r2-storage`                                                |
| `R2_SECRET_ACCESS_KEY`      | `r2-storage`                                                |
| `R2_BUCKET`                 | `r2-storage`                                                |

> Documentation detaillee des endpoints, body et reponses : [API_EDGE_FUNCTIONS.md](API_EDGE_FUNCTIONS.md)

---

## Services Externes

| Service              | Usage                                                                           | Fonction/Module concerne                |
| -------------------- | ------------------------------------------------------------------------------- | --------------------------------------- |
| **Resend**           | Envoi d'emails transactionnels (notifications workflow, validations, rejets)    | Edge Function `send-notification-email` |
| **Cloudflare R2**    | Stockage objet S3-compatible pour fichiers volumineux (26 Go de pieces jointes) | Edge Function `r2-storage`              |
| **QR Server API**    | Generation de QR codes sur les fiches PDF (engagements, liquidations, mandats)  | Edge Function `generate-export`         |
| **Supabase Storage** | Stockage pieces jointes (buckets `documents`, `sygfp-attachments`)              | Frontend direct via `supabase.storage`  |
| **Supabase Auth**    | Authentification email/password, gestion sessions, creation utilisateurs        | Frontend + Edge Function `create-user`  |

## Commandes

```bash
npm run dev           # Développement (port 8080)
npm run build         # Build production
npm run typecheck     # Vérification TypeScript
npm run lint          # ESLint
npm run lint:fix      # Correction automatique ESLint
npm run test          # Tests Vitest
npm run test:ui       # Vitest avec interface graphique
npm run test:coverage # Tests avec couverture
npm run test:e2e      # Tests Playwright
npm run test:e2e:ui   # Playwright avec interface graphique
npm run format        # Formater avec Prettier
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
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Composants UI
import { Button } from '@/components/ui/button';

// 3. Hooks internes
import { useNotesSEF } from '@/hooks/useNotesSEF';

// 4. Types
import type { NoteSEF } from '@/types';
```
