# AUDIT PROJET SYGFP - 29 Janvier 2026

**Agent :** ORDONNATEUR
**Mission :** Audit complet avant modifications
**Statut :** Lecture seule (aucune modification effectuée)

---

## 1. SYNTHÈSE EXÉCUTIVE

| Métrique | Valeur |
|----------|--------|
| **Fichiers TypeScript (.ts/.tsx)** | 616 |
| **Migrations Supabase** | 151 |
| **Composants (catégories)** | 41 dossiers |
| **Hooks personnalisés** | 119 |
| **Pages** | 30 racine + 11 sous-dossiers |
| **Serveurs MCP configurés** | 6 |

---

## 2. STRUCTURE DU PROJET

```
sygfp-artis-g-re/
├── src/
│   ├── components/     # 41 catégories de composants
│   ├── pages/          # 30 pages + 11 sous-dossiers
│   ├── hooks/          # 119 hooks personnalisés
│   ├── lib/            # Utilitaires, RBAC, workflow
│   ├── contexts/       # ExerciceContext, RBACContext
│   ├── services/       # PDF, attachments, storage
│   ├── integrations/   # Client Supabase
│   ├── config/         # Registres et statuts
│   ├── types/          # Types TypeScript
│   └── test/           # Tests unitaires
├── supabase/
│   ├── migrations/     # 151 fichiers SQL
│   └── functions/      # Edge Functions
└── docs/               # Documentation
```

---

## 3. COMPOSANTS PAR CATÉGORIE

| Catégorie | Nombre de fichiers | Description |
|-----------|-------------------|-------------|
| **ui** | 52 | Composants shadcn/ui (Radix) |
| **budget** | 23 | Gestion budgétaire |
| **dashboard** | 17 | Tableaux de bord |
| **dossier** | 14 | Gestion des dossiers |
| **workflow** | 14 | Chaîne de dépense |
| **admin/programmatique** | 12 | Paramétrage programmatique |
| **engagement** | 11 | Engagements budgétaires |
| **liquidation** | 11 | Liquidations |
| **ordonnancement** | 11 | Ordonnancements |
| **notes-sef** | 12 | Notes SEF |
| **marches** | 10 | Passation des marchés |
| **imputation** | 10 | Imputations budgétaires |
| **prestataires** | 10 | Gestion prestataires |
| **planification** | 9 | Planification physique |
| **expression-besoin** | 8 | Expressions de besoin |
| **notes-aef** | 8 | Notes AEF |
| **passation-marche** | 8 | Passation marchés |
| **import-export** | 8 | Import/Export budget |
| **etats** | 6 | États d'exécution |
| **notes-dg-officielles** | 6 | Notes DG officielles |
| **audit** | 6 | Audit trail |
| **attachments** | 5 | Pièces jointes |
| **auth** | 5 | Guards RBAC |
| **exercice** | 5 | Gestion exercices |
| **approvisionnement** | 5 | Approvisionnement |
| **reglement** | 5 | Règlements |
| **layout** | 4 | Layout application |
| **codification** | 4 | Codification |
| **coherence** | 4 | Contrôle cohérence |
| **ged** | 4 | GED documents |
| **search** | 4 | Recherche |
| **tresorerie** | 4 | Trésorerie |
| **export** | 3 | Export données |
| **notification** | 3 | Notifications budgétaires |
| **notifications** | 2 | Notifications utilisateur |
| **contrats** | 2 | Gestion contrats |
| **execution** | 2 | Exécution tâches |
| **recettes** | 2 | Recettes |
| **help** | 1 | Aide contextuelle |
| **shared** | 11 | Composants partagés |

---

## 4. PAGES DE L'APPLICATION

### Pages racine (30)
- AdminDashboardFallback.tsx
- Alertes.tsx
- AlertesBudgetaires.tsx
- ComingSoon.tsx
- Dashboard.tsx (routeur intelligent)
- Engagements.tsx
- EtatsExecution.tsx
- Liquidations.tsx
- Marches.tsx
- MonProfil.tsx
- NoOpenExercise.tsx
- NotFound.tsx
- NoteAEFDetail.tsx
- NoteSEFDetail.tsx
- NotesAEF.tsx
- NotesDirectionGenerale.tsx
- NotesSEF.tsx
- Notifications.tsx
- Ordonnancements.tsx
- Recherche.tsx
- Reglements.tsx
- ScanningEngagement.tsx
- ScanningLiquidation.tsx
- SelectExercice.tsx
- TestNonRegression.tsx
- ValidationNotesAEF.tsx
- ValidationNotesDG.tsx
- ValidationNotesSEF.tsx
- VerificationNoteDG.tsx
- WorkflowTasks.tsx

### Sous-dossiers de pages (11)
| Dossier | Pages |
|---------|-------|
| admin/ | 23 pages (GestionUtilisateurs, GestionRoles, JournalAudit...) |
| planification/ | 12 pages (StructureBudgetaire, Virements, ImportExport...) |
| execution/ | 7 pages (DashboardDGPage, ImputationPage, ExpressionBesoin...) |
| tresorerie/ | 6 pages (GestionTresorerie, MouvementsBanque...) |
| contractualisation/ | 5 pages (Prestataires, Contrats...) |
| programmatique/ | 5 pages (ChargerBudget, ListeBudget...) |
| gestion-taches/ | 4 pages (EtatExecutionTachesPage...) |
| dg/ | 2 pages (NotesAValider, ValiderNoteDG) |
| auth/ | 1 page (LoginPage) |
| approvisionnement/ | 1 page |
| recettes/ | 1 page |

---

## 5. HOOKS PERSONNALISÉS (119)

### Hooks Dashboard & Stats (8)
- useDashboardStats.ts
- useDashboardByRole.ts
- useDashboardAlerts.ts
- useDSIDashboardStats.ts
- useExecutionDashboard.ts
- usePaymentKPIs.ts
- usePendingTasks.ts
- useRecentActivities.ts

### Hooks Chaîne de dépense (15)
- useNotesSEF.ts, useNotesSEFList.ts, useNotesSEFAudit.ts, useNotesSEFExport.ts
- useNotesAEF.ts, useNotesAEFList.ts, useNotesAEFExport.ts
- useNotesDirectionGenerale.ts
- useEngagements.ts, useEngagementDocuments.ts
- useLiquidations.ts, useLiquidationDocuments.ts
- useOrdonnancements.ts, useOrdonnancementSignatures.ts
- useReglements.ts

### Hooks Budget (12)
- useBudgetLines.ts
- useBudgetImport.ts
- useBudgetAlerts.ts
- useBudgetAvailability.ts
- useBudgetLineVersions.ts
- useBudgetMovements.ts
- useBudgetNotifications.ts
- useBudgetTransfers.ts
- useImputation.ts
- useImputations.ts
- useImputationValidation.ts
- useNoteImputations.ts

### Hooks RBAC & Permissions (10)
- usePermissions.ts
- useRBAC.ts
- useRBACEnforcer.ts
- useRBACHelpers.ts
- useRoleBasedAccess.ts
- useRoleValidation.ts
- useDelegations.ts
- useDocumentPermissions.ts
- useNoteAccessControl.ts
- useSeparationOfDuties.ts

### Hooks Workflow (6)
- useWorkflowDossier.ts
- useWorkflowEtapes.ts
- useWorkflowTasks.ts
- useWorkflowTransitions.ts
- useSpendingCase.ts
- useEtapeDelais.ts

### Hooks Référentiels (8)
- useReferentiels.ts
- useReferentielsValidation.ts
- useReferentielImportExport.ts
- useReferentielSync.ts
- useBaseReferentiels.ts
- useDirections.ts
- useFundingSources.ts
- useSecteursActivite.ts

### Autres hooks (60+)
- Approvisionnement, Trésorerie, Marchés, Contrats, Prestataires
- Export, Import, Audit, Notifications, Codification
- etc.

---

## 6. DÉPENDANCES PRINCIPALES

### Frontend
| Package | Version | Usage |
|---------|---------|-------|
| react | ^18.3.1 | Framework UI |
| react-router-dom | ^6.30.1 | Routing |
| @tanstack/react-query | ^5.83.0 | State management |
| react-hook-form | ^7.61.1 | Formulaires |
| zod | ^3.25.76 | Validation |
| tailwindcss | ^3.4.17 | CSS |
| @radix-ui/* | ^1.x-2.x | Composants UI |

### Backend
| Package | Version | Usage |
|---------|---------|-------|
| @supabase/supabase-js | ^2.89.0 | Client Supabase |

### Utilitaires
| Package | Version | Usage |
|---------|---------|-------|
| date-fns | ^3.6.0 | Dates |
| jspdf | ^4.0.0 | Génération PDF |
| xlsx | ^0.18.5 | Import/Export Excel |
| recharts | ^2.15.4 | Graphiques |
| lucide-react | ^0.462.0 | Icônes |

### DevDependencies
| Package | Version | Usage |
|---------|---------|-------|
| typescript | ^5.8.3 | TypeScript |
| vite | ^5.4.19 | Build tool |
| vitest | ^4.0.18 | Tests unitaires |
| @playwright/test | ^1.58.0 | Tests E2E |
| eslint | ^9.32.0 | Linting |
| prettier | ^3.8.1 | Formatting |
| husky | ^9.1.7 | Git hooks |

---

## 7. MIGRATIONS SUPABASE

**Nombre total :** 151 migrations

### Dernières migrations (20260119)
| Fichier | Description |
|---------|-------------|
| 20260119150000_caisses_approvisionnements.sql | Caisses et approvisionnements |
| 20260119140000_add_notedg_qr_pdf_fields.sql | Champs QR/PDF pour Notes DG |
| 20260119120000_create_validation_dg.sql | Validation DG |
| 20260119120000_create_notes_direction_generale.sql | Notes DG |
| 20260119110000_notification_triggers.sql | Triggers notifications |
| 20260119110000_create_note_imputations.sql | Imputations notes |
| 20260119100000_seed_demo_data.sql | Données de démo |
| 20260119000000_rbac_enforcement.sql | Enforcement RBAC |
| 20260118900000_budget_notifications.sql | Notifications budget |
| 20260118800000_funding_sources.sql | Sources de financement |

### Tables principales
- `budget_lines` - Lignes budgétaires
- `budget_engagements` - Engagements
- `budget_liquidations` - Liquidations
- `ordonnancements` - Ordonnancements
- `reglements` - Règlements
- `notes_sef` - Notes SEF
- `notes_dg` - Notes AEF (mal nommée)
- `directions` - Directions
- `profiles` - Profils utilisateurs
- `user_roles` - Rôles utilisateurs
- `dossiers` - Dossiers de dépense
- `marches` - Marchés publics

---

## 8. CONFIGURATION MCP

**Fichier :** `.mcp.json`

| Serveur | Type | Description |
|---------|------|-------------|
| context7 | npx | Documentation IA |
| github | http | API GitHub (token expiré) |
| supabase | npx | PostgREST API |
| filesystem | npx | Accès fichiers |
| playwright | npx | Automatisation navigateur |
| sequential-thinking | npx | Raisonnement séquentiel |

**Note :** Le token GitHub dans `.mcp.json` est obsolète (ghp_kFi...). Le nouveau token fonctionnel est dans `~/.git-credentials`.

---

## 9. CONFIGURATION VITE

**Fichier :** `vite.config.ts`

```typescript
server: {
  host: "::",
  port: 8080,
}
plugins: [react(), componentTagger()]
alias: { "@": "./src" }
```

---

## 10. SCRIPTS DISPONIBLES

| Script | Commande | Description |
|--------|----------|-------------|
| dev | `vite --open` | Serveur dev (port 8080) |
| build | `tsc -b && vite build` | Build production |
| test | `vitest` | Tests unitaires |
| test:e2e | `playwright test` | Tests E2E |
| lint | `eslint src` | Linting |
| typecheck | `tsc --noEmit` | Vérification types |
| verify | `typecheck && lint && test` | Vérification complète |

---

## 11. BUGS CRITIQUES IDENTIFIÉS

| # | Fichier | Bug | Impact |
|---|---------|-----|--------|
| 1 | useDashboardByRole.ts | SDPM: pas de filtre exercice | Stats tous exercices mélangées |
| 2 | useDashboardByRole.ts | DAF: notesAImputer toujours 0 | KPI cassé |
| 3 | useDashboardAlerts.ts | Colonne deadline_correction inexistante | Requête échoue |

---

## 12. RECOMMANDATIONS

### Priorité P0 (Bloquant)
1. Corriger le problème "Direction non assignée" pour l'utilisateur actuel

### Priorité P1 (Critique)
2. Corriger les 3 bugs critiques des dashboards
3. Mettre à jour le token GitHub dans `.mcp.json`

### Priorité P2 (Important)
4. Ajouter DashboardSDPM au routeur Dashboard.tsx
5. Renommer la table `notes_dg` en `notes_aef` pour clarté
6. Ajouter des tests unitaires sur les calculs KPI

### Priorité P3 (Qualité)
7. Documenter l'architecture des dashboards
8. Ajouter des types stricts pour les statuts (enum)

---

## 13. CONCLUSION

Le projet SYGFP est un système de gestion financière mature avec :
- **616 fichiers TypeScript** bien structurés
- **151 migrations** Supabase
- **119 hooks** personnalisés
- Architecture **modulaire** par domaine métier
- Système **RBAC** complet avec délégations
- **6 dashboards** spécialisés par rôle

Les principales préoccupations sont :
1. Quelques bugs critiques dans les hooks de dashboard
2. Un problème d'assignation de direction pour l'utilisateur courant
3. Un token GitHub expiré dans la configuration MCP

**Audit terminé le 29/01/2026 à 12:55 UTC**

---

*Généré par ORDONNATEUR - Agent Principal SYGFP*
