# Architecture SYGFP

> **Système de Gestion Financière Publique - Guide Architecture**  
> Version: 1.0 | Dernière mise à jour: 2026-01-15

---

## 1. Vue d'ensemble

SYGFP est une application web de gestion financière publique pour l'**ARTI** (Autorité de Régulation du Transport Intérieur). Elle implémente la **chaîne de la dépense publique** en 9 étapes, de l'expression du besoin jusqu'au paiement effectif.

### 1.1 Objectifs métier

- Traçabilité complète de chaque dépense
- Contrôle budgétaire en temps réel
- Séparation stricte des tâches (RBAC)
- Audit trail immutable
- Reporting et alertes automatisées

### 1.2 Périmètre fonctionnel

| Domaine                | Description                       |
| ---------------------- | --------------------------------- |
| **Chaîne de dépense**  | 9 étapes du workflow de dépense   |
| **Planification**      | Budget, activités, virements      |
| **Contractualisation** | Prestataires, contrats, marchés   |
| **Trésorerie**         | Comptes bancaires, opérations     |
| **Approvisionnement**  | Stocks, articles, mouvements      |
| **Recettes**           | Déclaration et suivi des recettes |
| **Administration**     | Utilisateurs, rôles, paramètres   |

---

## 2. Stack Technologique

### 2.1 Frontend

| Technologie         | Version | Usage                |
| ------------------- | ------- | -------------------- |
| **React**           | 18.3.x  | Framework UI         |
| **Vite**            | 5.x     | Build tool           |
| **TypeScript**      | 5.x     | Typage statique      |
| **Tailwind CSS**    | 3.x     | Styles utilitaires   |
| **shadcn/ui**       | latest  | Composants UI        |
| **TanStack Query**  | 5.x     | Gestion état serveur |
| **React Router**    | 6.x     | Routing              |
| **React Hook Form** | 7.x     | Formulaires          |
| **Zod**             | 3.x     | Validation schéma    |
| **Recharts**        | 2.x     | Graphiques           |
| **Lucide React**    | 0.462.x | Icônes               |

### 2.2 Backend (Supabase / Lovable Cloud)

| Service                | Usage                              |
| ---------------------- | ---------------------------------- |
| **PostgreSQL**         | Base de données principale         |
| **Auth**               | Authentification (email/password)  |
| **Storage**            | Stockage fichiers (pièces jointes) |
| **Edge Functions**     | Logique métier serveur (Deno)      |
| **Realtime**           | Notifications temps réel           |
| **Row Level Security** | Sécurité données par rôle          |

### 2.3 Outils développement

| Outil        | Usage                  |
| ------------ | ---------------------- |
| **ESLint**   | Linting code           |
| **Prettier** | Formatage (via ESLint) |
| **Sonner**   | Notifications toast    |

---

## 3. Structure des Dossiers

```
sygfp/
├── docs/                          # 📚 Documentation technique
│   ├── modules/                   # Guides par module
│   └── seeds/                     # Scripts SQL de données test
│
├── public/                        # 📁 Assets statiques
│   ├── favicon.ico
│   └── robots.txt
│
├── src/                           # 💻 Code source
│   ├── assets/                    # Images, logos
│   │
│   ├── components/                # 🧩 Composants React
│   │   ├── ui/                    # Composants shadcn/ui
│   │   ├── layout/                # Layout (AppLayout, AppSidebar)
│   │   ├── auth/                  # Garde permissions
│   │   ├── budget/                # Composants budget
│   │   ├── engagement/            # Composants engagements
│   │   ├── liquidation/           # Composants liquidations
│   │   ├── ordonnancement/        # Composants ordonnancements
│   │   ├── reglement/             # Composants règlements
│   │   ├── notes-sef/             # Composants Notes SEF
│   │   ├── notes-aef/             # Composants Notes AEF
│   │   ├── expression-besoin/     # Composants expression besoin
│   │   ├── marches/               # Composants marchés
│   │   ├── prestataires/          # Composants prestataires
│   │   ├── contrats/              # Composants contrats
│   │   ├── tresorerie/            # Composants trésorerie
│   │   ├── approvisionnement/     # Composants approvisionnement
│   │   ├── recettes/              # Composants recettes
│   │   ├── dossier/               # Composants dossier workflow
│   │   ├── workflow/              # Visualisation chaîne dépense
│   │   ├── dashboard/             # Widgets tableau de bord
│   │   ├── etats/                 # États d'exécution
│   │   ├── export/                # Export PDF/Excel
│   │   ├── exercice/              # Gestion exercice
│   │   ├── admin/                 # Composants administration
│   │   ├── audit/                 # Journal d'audit
│   │   ├── notifications/         # Notifications
│   │   └── help/                  # Aide contextuelle
│   │
│   ├── contexts/                  # 🔄 React Contexts
│   │   └── ExerciceContext.tsx    # Contexte exercice budgétaire
│   │
│   ├── hooks/                     # 🪝 Custom Hooks
│   │   ├── useNotesSEF.ts         # CRUD Notes SEF
│   │   ├── useNotesAEF.ts         # CRUD Notes AEF
│   │   ├── useEngagements.ts      # CRUD Engagements
│   │   ├── useLiquidations.ts     # CRUD Liquidations
│   │   ├── useOrdonnancements.ts  # CRUD Ordonnancements
│   │   ├── useReglements.ts       # CRUD Règlements
│   │   ├── useMarches.ts          # CRUD Marchés
│   │   ├── useBudgetLines.ts      # CRUD Lignes budget
│   │   ├── usePrestataires.ts     # CRUD Prestataires
│   │   ├── usePermissions.ts      # Vérification permissions
│   │   ├── useDossiers.ts         # Gestion dossiers
│   │   ├── useExerciceFilter.ts   # Filtre par exercice
│   │   └── ...                    # ~50 autres hooks
│   │
│   ├── integrations/              # 🔗 Intégrations externes
│   │   └── supabase/
│   │       ├── client.ts          # Client Supabase
│   │       └── types.ts           # Types générés (READ-ONLY)
│   │
│   ├── lib/                       # 📦 Utilitaires
│   │   ├── utils.ts               # Fonctions utilitaires (cn, etc.)
│   │   └── notes-sef/             # Services Notes SEF
│   │
│   ├── pages/                     # 📄 Pages (routes)
│   │   ├── admin/                 # Pages administration
│   │   ├── planification/         # Pages planification
│   │   ├── execution/             # Pages exécution
│   │   ├── contractualisation/    # Pages contractualisation
│   │   ├── tresorerie/            # Pages trésorerie
│   │   ├── recettes/              # Pages recettes
│   │   ├── approvisionnement/     # Pages approvisionnement
│   │   ├── Dashboard.tsx          # Tableau de bord
│   │   ├── NotesSEF.tsx           # Liste Notes SEF
│   │   ├── NotesAEF.tsx           # Liste Notes AEF
│   │   ├── Engagements.tsx        # Liste Engagements
│   │   ├── Liquidations.tsx       # Liste Liquidations
│   │   ├── Ordonnancements.tsx    # Liste Ordonnancements
│   │   ├── Reglements.tsx         # Liste Règlements
│   │   └── ...
│   │
│   ├── App.tsx                    # 🚀 Routes principales
│   ├── App.css                    # Styles globaux
│   ├── index.css                  # Tailwind + Design tokens
│   └── main.tsx                   # Point d'entrée
│
├── supabase/                      # ☁️ Configuration Supabase
│   ├── config.toml                # Configuration locale
│   ├── functions/                 # Edge Functions
│   │   ├── create-user/           # Création utilisateur
│   │   ├── generate-export/       # Export documents
│   │   └── send-notification-email/
│   └── migrations/                # Migrations SQL (READ-ONLY)
│
├── .env                           # Variables environnement
├── index.html                     # HTML principal
├── package.json                   # Dépendances (READ-ONLY)
├── tailwind.config.ts             # Configuration Tailwind
├── tsconfig.json                  # Configuration TypeScript
└── vite.config.ts                 # Configuration Vite
```

---

## 4. Chaîne de la Dépense

### 4.1 Les 9 Étapes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CHAÎNE DE LA DÉPENSE SYGFP                          │
└─────────────────────────────────────────────────────────────────────────────┘

 ①         ②          ③           ④            ⑤           ⑥          ⑦          ⑧         ⑨
┌───┐    ┌───┐      ┌───┐       ┌───┐        ┌───┐       ┌───┐      ┌───┐      ┌───┐     ┌───┐
│SEF│ ─► │AEF│ ─►   │IMP│  ─►   │EXB│  ─►    │MAR│  ─►   │ENG│  ─►  │LIQ│  ─►  │ORD│ ─►  │REG│
└───┘    └───┘      └───┘       └───┘        └───┘       └───┘      └───┘      └───┘     └───┘
 Note     Note      Impu-      Expres-      Passation   Engage-    Liqui-     Ordon-    Règle-
 Sans     Avec      tation     sion         Marché      ment       dation     nancement ment
 Effet    Effet     Budget     Besoin       (optionnel)
 Finan.   Finan.
```

### 4.2 Tableau détaillé

| #   | Étape             | Table principale             | Validateur     | Route                          |
| --- | ----------------- | ---------------------------- | -------------- | ------------------------------ |
| 1   | Note SEF          | `notes_sef`                  | DG             | `/notes-sef`                   |
| 2   | Note AEF          | `notes_dg`                   | Directeur/DG   | `/notes-aef`                   |
| 3   | Imputation        | `notes_imputees_disponibles` | CB             | `/execution/imputation`        |
| 4   | Expression Besoin | `expressions_besoin`         | Directeur      | `/execution/expression-besoin` |
| 5   | Marché            | `marches`                    | Commission/DG  | `/marches`                     |
| 6   | Engagement        | `budget_engagements`         | CB             | `/engagements`                 |
| 7   | Liquidation       | `budget_liquidations`        | DAAF           | `/liquidations`                |
| 8   | Ordonnancement    | `ordonnancements`            | DG (signature) | `/ordonnancements`             |
| 9   | Règlement         | `reglements`                 | Trésorerie     | `/reglements`                  |

### 4.3 Flux de données

```
                                    ┌──────────────────┐
                                    │   DOSSIER        │
                                    │   (conteneur)    │
                                    └────────┬─────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        │                                    │                                    │
        ▼                                    ▼                                    ▼
┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
│   Note SEF    │                   │   Engagement  │                   │   Règlement   │
│   (origine)   │                   │   (central)   │                   │   (clôture)   │
└───────────────┘                   └───────────────┘                   └───────────────┘
        │                                    │                                    │
        │ FK                                 │ FK                                 │ FK
        ▼                                    ▼                                    ▼
┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
│ budget_line   │◄──────────────────│   Lignes      │──────────────────►│  Trésorerie   │
│ (imputation)  │                   │   budgétaires │                   │  (compte)     │
└───────────────┘                   └───────────────┘                   └───────────────┘
```

---

## 5. Conventions de Nommage

### 5.1 Fichiers

| Type            | Convention           | Exemple                                  |
| --------------- | -------------------- | ---------------------------------------- |
| **Pages**       | PascalCase           | `NotesSEF.tsx`, `Dashboard.tsx`          |
| **Composants**  | PascalCase           | `NoteSEFForm.tsx`, `BudgetLineTable.tsx` |
| **Hooks**       | camelCase avec `use` | `useNotesSEF.ts`, `usePermissions.ts`    |
| **Utilitaires** | camelCase            | `utils.ts`, `helpers.ts`                 |
| **Types**       | camelCase ou index   | `types.ts`                               |
| **Contextes**   | PascalCase           | `ExerciceContext.tsx`                    |

### 5.2 Base de données

| Type          | Convention                 | Exemple                         |
| ------------- | -------------------------- | ------------------------------- |
| **Tables**    | snake_case pluriel         | `notes_sef`, `budget_lines`     |
| **Colonnes**  | snake_case                 | `created_at`, `budget_line_id`  |
| **FK**        | `{table_singulier}_id`     | `direction_id`, `engagement_id` |
| **Fonctions** | snake_case + verbe         | `generate_sef_reference()`      |
| **Triggers**  | `trigger_{action}_{table}` | `trigger_validate_notes_sef`    |
| **Policies**  | Description courte         | `notes_sef_select_policy`       |
| **Index**     | `idx_{table}_{colonnes}`   | `idx_notes_sef_exercice_statut` |

### 5.3 Code TypeScript

| Type           | Convention                 | Exemple                                |
| -------------- | -------------------------- | -------------------------------------- |
| **Interfaces** | PascalCase + I (optionnel) | `NoteSEF`, `BudgetLine`                |
| **Types**      | PascalCase                 | `UserRole`, `WorkflowStatus`           |
| **Constantes** | UPPER_SNAKE_CASE           | `DEFAULT_PAGE_SIZE`, `STATUT_VALIDE`   |
| **Fonctions**  | camelCase                  | `validateNoteSEF()`, `formatMontant()` |
| **Composants** | PascalCase                 | `NoteSEFList`, `BudgetFilters`         |

---

## 6. Règles Métier Transversales

### 6.1 Exercice budgétaire

- Toutes les opérations sont filtrées par `exercice` (année)
- L'exercice actif est stocké dans `localStorage` et `ExerciceContext`
- Un exercice `clôturé` est en lecture seule

### 6.2 Séparation des tâches

- Un utilisateur ne peut pas valider ce qu'il a créé
- Chaque étape a un validateur désigné (voir matrice RACI)
- Les délégations sont traçées dans `delegations`

### 6.3 Audit trail

- Toute modification est journalisée dans `audit_logs`
- Les tables critiques ont leur propre historique (`notes_sef_history`)
- L'IP client est capturée quand possible

### 6.4 Soft delete

- Les suppressions utilisent `is_deleted = true`
- Les données ne sont jamais physiquement supprimées
- Les listes filtrent par défaut `WHERE is_deleted = false`

### 6.5 Génération de codes

- Format pivot : `ARTI{etape}{MM}{YY}{NNNN}`
- Séquences atomiques par type et période
- Codes verrouillés après validation

---

## 7. Patterns de Code

### 7.1 Pattern Hook CRUD

```typescript
// hooks/use{Entity}.ts
export function use{Entity}() {
  const { exercice } = useExercice();

  // Lecture
  const { data, isLoading } = useQuery({
    queryKey: ["{entity}", exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("{table}")
        .select("*")
        .eq("exercice", exercice);
      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Mutations
  const createMutation = useMutation({ ... });
  const updateMutation = useMutation({ ... });
  const deleteMutation = useMutation({ ... });

  return { data, isLoading, create, update, delete };
}
```

### 7.2 Pattern Composant Liste

```typescript
// components/{module}/{Entity}List.tsx
export function {Entity}List() {
  const { data, isLoading } = use{Entity}List();
  const [filters, setFilters] = useState<Filters>({});

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <{Entity}Filters value={filters} onChange={setFilters} />
      <Table>
        <TableHeader>...</TableHeader>
        <TableBody>
          {data?.map(item => (
            <{Entity}Row key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
      <Pagination />
    </div>
  );
}
```

### 7.3 Pattern Dialog Validation

```typescript
// components/{module}/{Entity}ValidateDialog.tsx
export function {Entity}ValidateDialog({ item, open, onOpenChange }) {
  const { validate } = use{Entity}();
  const { canValidate{Entity} } = usePermissions();

  const handleValidate = async () => {
    await validate(item.id);
    onOpenChange(false);
    toast.success("{Entity} validé(e)");
  };

  if (!canValidate{Entity}()) {
    return <Alert>Vous n'avez pas les droits</Alert>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>Confirmer la validation</DialogHeader>
        <DialogFooter>
          <Button onClick={handleValidate}>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 8. Environnement et Configuration

### 8.1 Variables d'environnement

```env
# .env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 8.2 Configuration Tailwind

Les tokens de design sont dans `src/index.css` et `tailwind.config.ts` :

- Couleurs HSL via `--primary`, `--secondary`, etc.
- Mode sombre supporté via `dark:`
- Animations via `tailwindcss-animate`

---

## 9. Déploiement

### 9.1 Build

```bash
npm run build
```

### 9.2 Preview

L'application est déployée automatiquement sur Lovable Cloud à chaque changement.

### 9.3 Production

Utiliser le bouton "Publish" dans l'interface Lovable pour publier.

---

## 10. Ressources

| Document                     | Description            |
| ---------------------------- | ---------------------- |
| `docs/DATABASE_GUIDE.md`     | Schéma base de données |
| `docs/SECURITY_GUIDE.md`     | RBAC et RLS            |
| `docs/CODIFICATION_GUIDE.md` | Règles de codification |
| `docs/DEVELOPER_GUIDE.md`    | Guide développeur      |
| `docs/PROJECT_STATUS.md`     | État du projet         |

---

_Documentation générée le 2026-01-15_
