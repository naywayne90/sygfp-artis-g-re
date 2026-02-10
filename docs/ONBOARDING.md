# Guide d'Onboarding Developpeur - SYGFP

> **Pour les nouveaux developpeurs rejoignant le projet**
> Version: 1.0 | Derniere mise a jour: 2026-02-06

---

## 1. Presentation du projet

SYGFP (Systeme de Gestion Financiere et de Planification) est une application web pour ARTI Côte d'Ivoire. Elle couvre la chaine complete de la depense publique en 9 etapes, de la Note SEF au Reglement.

### Stack technique

| Couche           | Technologies                                 |
| ---------------- | -------------------------------------------- |
| Frontend         | React 18 + TypeScript + Vite                 |
| UI               | Tailwind CSS + shadcn/ui (Radix)             |
| State management | TanStack Query (React Query)                 |
| Formulaires      | React Hook Form + Zod                        |
| Backend          | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Tests unitaires  | Vitest                                       |
| Tests E2E        | Playwright                                   |

---

## 2. Prerequis

### 2.1 Outils requis

| Outil   | Version minimale | Verification     |
| ------- | ---------------- | ---------------- |
| Node.js | 18+              | `node --version` |
| npm     | 9+               | `npm --version`  |
| Git     | 2.30+            | `git --version`  |

### 2.2 Editeur recommande

VS Code avec les extensions suivantes :

- ESLint
- Tailwind CSS IntelliSense
- Prettier
- TypeScript Importer

---

## 3. Installation

### 3.1 Cloner le depot

```bash
git clone https://github.com/naywayne90/sygfp-artis-g-re.git
cd sygfp-artis-g-re
```

### 3.2 Installer les dependances

```bash
npm install
```

### 3.3 Configurer l'environnement

Copier le fichier d'exemple et remplir les valeurs :

```bash
cp .env.example .env
```

Les variables obligatoires :

| Variable                        | Description                |
| ------------------------------- | -------------------------- |
| `VITE_SUPABASE_URL`             | URL de l'instance Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Cle publique (anon key)    |

Voir [CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md) pour les valeurs exactes.

### 3.4 Lancer le serveur de developpement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:8080`.

### 3.5 Se connecter

Utiliser un des comptes de test :

| Email             | Mot de passe | Role               |
| ----------------- | ------------ | ------------------ |
| dg@arti.ci        | Test2026!    | DG / Validateur    |
| daaf@arti.ci      | Test2026!    | DAAF / Validateur  |
| agent.dsi@arti.ci | Test2026!    | DSI / Operationnel |

---

## 4. Commandes essentielles

| Commande            | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Serveur de developpement (port 8080)         |
| `npm run build`     | Build de production                          |
| `npm run typecheck` | Verification des types TypeScript            |
| `npm run lint`      | Verification ESLint                          |
| `npm run lint:fix`  | Correction automatique ESLint                |
| `npm run test`      | Tests unitaires (Vitest)                     |
| `npm run test:ui`   | Tests avec interface graphique               |
| `npm run test:e2e`  | Tests E2E (Playwright)                       |
| `npm run format`    | Formater le code (Prettier)                  |
| `npm run verify`    | Verification complete (types + lint + tests) |

---

## 5. Architecture du projet

### 5.1 Structure des dossiers

```
sygfp-artis-g-re/
├── src/
│   ├── components/        # 402 fichiers, 46 modules
│   │   ├── ui/            # Composants shadcn/ui (base)
│   │   ├── layout/        # AppLayout, Sidebar, Header
│   │   ├── shared/        # Composants partages
│   │   ├── notes-sef/     # Module Notes SEF
│   │   ├── engagement/    # Module Engagements
│   │   ├── liquidation/   # Module Liquidations
│   │   ├── ordonnancement/# Module Ordonnancements
│   │   ├── reglement/     # Module Reglements
│   │   └── ...            # Autres modules metier
│   ├── pages/             # 104 fichiers, 12 sections
│   │   ├── admin/         # Administration
│   │   ├── planification/ # Budget, virements
│   │   ├── execution/     # Engagements, liquidations, ordonnancements
│   │   ├── tresorerie/    # Reglements, comptes bancaires
│   │   └── ...
│   ├── hooks/             # 142 hooks personnalises
│   ├── contexts/          # ExerciceContext, RBACContext
│   ├── lib/               # Utilitaires, workflow, export
│   ├── services/          # PDF, attachments, storage
│   ├── types/             # Types TypeScript globaux
│   └── integrations/      # Client Supabase + types generes
├── supabase/
│   ├── migrations/        # 173 fichiers SQL
│   └── functions/         # 4 Edge Functions
├── e2e/                   # Tests E2E Playwright
├── docs/                  # Documentation technique
└── public/                # Assets statiques
```

### 5.2 Chaine de la depense (9 etapes)

```
1. Note SEF        Besoin initial identifie par la direction
      |
2. Note AEF        Avis d'engagement financier
      |
3. Imputation      Affectation budgetaire
      |
4. Expression      Expression du besoin detaillee
   de Besoin
      |
5. Passation       Processus de selection fournisseur
   de Marche
      |
6. Engagement      Engagement juridique et financier
      |
7. Liquidation     Verification du service fait
      |
8. Ordonnancement  Ordre de payer
      |
9. Reglement       Paiement effectif
```

Chaque etape dispose de :

- Un hook (`useNotesSEF.ts`, `useEngagements.ts`, etc.)
- Une page (`/notes-sef`, `/engagements`, etc.)
- Des composants dedies (formulaire, liste, details)

---

## 6. Conventions de code

### 6.1 Nommage

| Element          | Convention      | Exemple                |
| ---------------- | --------------- | ---------------------- |
| Composants       | PascalCase.tsx  | `ReglementForm.tsx`    |
| Hooks            | useCamelCase.ts | `useReglements.ts`     |
| Utilitaires      | camelCase.ts    | `formatAmount.ts`      |
| Types/Interfaces | PascalCase      | `Reglement`, `NoteSEF` |

### 6.2 Ordre des imports

```typescript
// 1. React et librairies externes
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Composants UI (shadcn)
import { Button } from '@/components/ui/button';

// 3. Hooks internes
import { useReglements } from '@/hooks/useReglements';

// 4. Types
import type { Reglement } from '@/types';
```

### 6.3 Regles TypeScript

- Pas de `any` : utiliser `unknown` ou des types precis
- Typage strict active
- Validation des formulaires avec Zod

### 6.4 Conventions UI

- Messages utilisateur en francais
- Montants affiches en FCFA avec separateur de milliers
- Dates au format francais (JJ/MM/AAAA)
- Composants shadcn/ui pour toute l'interface

---

## 7. Workflow Git

### 7.1 Branches

Le travail se fait sur la branche `main`.

### 7.2 Format des commits

```
type(scope): description courte

Types: feat, fix, refactor, test, docs, chore
```

Exemples :

- `feat(reglements): ajouter le formulaire de creation`
- `fix(notes-sef): corriger le calcul du montant total`
- `docs(onboarding): creer le guide d'onboarding`

### 7.3 Avant chaque commit

```bash
npm run verify    # types + lint + tests
```

---

## 8. Securite (RBAC)

### 8.1 Profils fonctionnels

| Profil       | Droits                           |
| ------------ | -------------------------------- |
| Admin        | Acces complet, gestion systeme   |
| Validateur   | Validation des notes et dossiers |
| Operationnel | Creation et soumission           |
| Controleur   | Verification et audit            |
| Auditeur     | Lecture seule, rapports          |

### 8.2 Niveaux hierarchiques

DG > Directeur > Sous-Directeur > Chef de Service > Agent

### 8.3 Row-Level Security (RLS)

Toutes les tables sensibles ont des politiques RLS actives, filtrant par direction et exercice.

---

## 9. Documentation complementaire

| Document                                               | Description                          |
| ------------------------------------------------------ | ------------------------------------ |
| [PROJECT_STATUS.md](PROJECT_STATUS.md)                 | Etat d'avancement du projet          |
| [ARCHITECTURE_TECHNIQUE.md](ARCHITECTURE_TECHNIQUE.md) | Architecture detaillee               |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)               | Patterns de code et exemples         |
| [GUIDE_SUPABASE.md](GUIDE_SUPABASE.md)                 | Base de donnees et requetes          |
| [CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md)           | Cles, tokens, acces                  |
| [SECURITY_GUIDE.md](SECURITY_GUIDE.md)                 | Securite et RLS                      |
| [GUIDE_CODE_SPLITTING.md](GUIDE_CODE_SPLITTING.md)     | Optimisation des bundles             |
| [docs/modules/](modules/)                              | Documentation par module (13 fiches) |

---

_Derniere mise a jour: 2026-02-06_
