# Audit Qualité SYGFP - Baseline

**Date** : 29 janvier 2026
**Agent** : CONTROLEUR
**Version** : Baseline initiale (avant modifications)
**Mise à jour** : Build avec 4GB de mémoire - Erreurs TypeScript révélées

---

## 1. Métriques du Codebase

| Métrique | Valeur |
|----------|--------|
| Fichiers TypeScript (.ts/.tsx) | 616 |
| Hooks personnalisés | 123 |
| Composants React | 328 |
| Pages | 95 |
| Lignes de code total | 63 825 |

---

## 2. Problèmes de Typage TypeScript

### 2.1 Utilisation de `any`

| Type | Occurrences |
|------|-------------|
| `: any` (déclarations) | 252 |
| `as any` (assertions) | 232 |
| **TOTAL** | **484** |

### 2.2 Répartition par catégorie (ESLint)

| Règle ESLint | Occurrences |
|--------------|-------------|
| `@typescript-eslint/no-explicit-any` | 538 |
| `@typescript-eslint/no-unused-vars` | 691 |

### 2.3 Fichiers les plus impactés (any)

| Fichier | Occurrences |
|---------|-------------|
| `src/hooks/useDossiers.ts` | 17 |
| `src/hooks/useContrats.ts` | 16 |
| `src/hooks/useLiquidationDocuments.ts` | 14 |
| `src/hooks/usePassationsMarche.ts` | 13 |
| `src/hooks/useMarches.ts` | 13 |
| `src/components/import-export/BudgetExport.tsx` | 17 |
| `src/hooks/useNotesSEF.ts` | 10 |
| `src/hooks/useExcelParser.ts` | 10 |
| `src/hooks/useOrdonnancementSignatures.ts` | 10 |
| `src/components/engagement/EngagementForm.tsx` | 10 |

---

## 3. Console Statements

| Type | Occurrences |
|------|-------------|
| `console.log` | 13 |
| `console.warn/error/debug/info` | 253 |
| **TOTAL** | **266** |

**Note** : La majorité sont des `console.error` pour le logging d'erreurs (acceptable en production avec un logger configuré).

---

## 4. TODO / FIXME

| # | Fichier | Ligne | Description |
|---|---------|-------|-------------|
| 1 | `src/pages/auth/LoginPage.tsx` | 172 | Implémenter la récupération de mot de passe |
| 2 | `src/pages/execution/DashboardDirectionPage.tsx` | 389 | Implémenter l'export via Edge Function |
| 3 | `src/pages/execution/DashboardDGPage.tsx` | 565 | Implémenter l'export via Edge Function |
| 4 | `src/hooks/useNoteDGPdf.ts` | 149 | Stocker le PDF via Edge Function r2-storage |
| 5 | `src/hooks/useCoherenceCheck.ts` | 501 | Créer une table coherence_reports dans Supabase |

**Total : 5 TODO**

---

## 5. Analyse ESLint

### 5.1 Résumé

| Catégorie | Nombre |
|-----------|--------|
| Erreurs | 13 |
| Warnings | 1 488 |
| **TOTAL** | **1 501** |

### 5.2 Top 5 des règles violées

| Règle | Occurrences | Sévérité |
|-------|-------------|----------|
| `@typescript-eslint/no-unused-vars` | 691 | warning |
| `@typescript-eslint/no-explicit-any` | 538 | warning |
| `react-hooks/exhaustive-deps` | ~50 | warning |
| `react/self-closing-comp` | ~30 | warning |
| `@typescript-eslint/no-non-null-assertion` | ~20 | warning |

---

## 6. Vérifications TypeScript

### 6.1 Compilation (`tsc --noEmit`)

```
⚠️ ATTENTION - Le mode --noEmit peut masquer certaines erreurs
```

### 6.2 Build de production (`npm run build`)

```
❌ ÉCHEC - 576 ERREURS TYPESCRIPT dans 82 fichiers

Commande : NODE_OPTIONS="--max-old-space-size=4096" npm run build
Exit code : 2 (erreurs de compilation)
```

### 6.3 Catégories d'erreurs TypeScript

| Type d'erreur | Nombre | Description |
|---------------|--------|-------------|
| TS2339 | ~150 | Property does not exist on type |
| TS2769 | ~80 | No overload matches this call (Supabase) |
| TS2345 | ~60 | Argument type not assignable |
| TS2322 | ~50 | Type not assignable |
| TS2589 | ~20 | Type instantiation excessively deep |
| TS2353 | ~15 | Object literal unknown properties |
| TS2551 | ~10 | Property does not exist, did you mean... |
| Autres | ~191 | Divers |

### 6.4 Fichiers avec erreurs TypeScript (82 fichiers)

**Hooks (26 fichiers)** :
- `useApprovisionnementsTresorerie.ts`, `useBudgetImport.ts`, `useBudgetLineVersions.ts`
- `useBudgetNotifications.ts`, `useCaisses.ts`, `useCoherenceCheck.ts`
- `useCompteBancaires.ts`, `useDashboardByRole.ts`, `useDashboardStats.ts`
- `useDelegations.ts`, `useExportBudgetChain.ts`, `useExportNoteSEFPdf.ts`
- `useFeuilleRouteImport.ts`, `useFundingSources.ts`, `useGenerateDossierRef.ts`
- `useLignesEstimativesAEF.ts`, `useMouvementsTresorerie.ts`, `useNoteDGPdf.ts`
- `useNotesAEFExport.ts`, `useNotesDirectionGenerale.ts`, `useNoteSEFAutosave.ts`
- `useNotesSEFExport.ts`, `useNotesSEF.ts`, `useOrdonnancements.ts`
- `usePassationsMarche.ts`, `useReferentielsValidation.ts`

**Pages (18 fichiers)** :
- `DashboardDirectionPage.tsx`, `TaskExecutionPage.tsx`
- `EtatExecutionTachesPage.tsx`, `MajFeuillesRoutePage.tsx`
- `TachesDiffereesPage.tsx`, `TachesRealiseesPage.tsx`
- `ChargerBudget.tsx`, `ListeBudget.tsx`, `MiseAJourBudget.tsx`
- `ApprovisionnementsBanque.tsx`, `ApprovisionnementsCaisse.tsx`
- `MouvementsBanque.tsx`, `MouvementsCaisse.tsx`
- Et 5 autres...

**Composants (20 fichiers)** :
- `AttachmentSection.tsx`, `AuditLogViewer.tsx`, `PermissionGuard.tsx`
- `RBACRouteGuard.tsx`, `BudgetLineEditDialog.tsx`, `DashboardCB.tsx`
- `DashboardMoyensGen.tsx`, `EngagementFromPMForm.tsx`, `EtatParEtape.tsx`
- Et 11 autres...

**Services (3 fichiers)** :
- `attachmentService.ts`, `noteDGPdfService.ts`, `noteSEFPdfService.ts`

**Contextes (2 fichiers)** :
- `ExerciceContext.tsx`, `RBACContext.tsx`

**Config/Tests (3 fichiers)** :
- `statuses.config.ts`, `rbac-config.ts`, `setup.ts`

### 6.5 Causes principales des erreurs

1. **Types Supabase désynchronisés** (~40% des erreurs)
   - Tables/vues manquantes : `attachments`, `v_task_executions`, `task_executions_view`
   - Le schéma de base de données ne correspond pas aux types générés

2. **Propriétés manquantes dans les contextes** (~25% des erreurs)
   - `ExerciceContext` : manque `selectedExercice`
   - `Profile` : manque `exercises_allowed`

3. **Types de retour Supabase** (~20% des erreurs)
   - `ResultOne` sans propriétés typées
   - Queries avec `.single()` mal typées

4. **Incompatibilités de types** (~15% des erreurs)
   - `TaskFilters` vs propriétés attendues
   - `ValidationResult` vs `ImportValidationResult`

---

## 7. Couverture des Tests

### 7.1 Tests Unitaires (Vitest)

| Métrique | Valeur |
|----------|--------|
| Fichiers de test | 1 |
| Tests | 4 |
| Résultat | ✅ 4/4 passent |

**Configuration** : `vitest.config.ts`
- Environment: jsdom
- Coverage provider: v8
- Seuils de couverture: 50% (statements, branches, functions, lines)

### 7.2 Tests E2E (Playwright)

| Métrique | Valeur |
|----------|--------|
| Fichiers de test | 1 |
| Tests | 2 |
| Navigateur | Chromium |

**Configuration** : `playwright.config.ts`
- Base URL: http://localhost:8080
- Screenshots: on failure
- Video: on first retry

### 7.3 Couverture effective

| Zone | Fichiers | Couverts | % |
|------|----------|----------|---|
| Hooks | 123 | 0 | 0% |
| Composants | 328 | 0 | 0% |
| Pages | 95 | 1 (login) | ~1% |
| Services | ~20 | 0 | 0% |

**Couverture globale estimée : < 1%**

---

## 8. Score de Qualité Initial

### 8.1 Calcul du Score

| Critère | Poids | Score | Pondéré |
|---------|-------|-------|---------|
| TypeScript strict (0 any = 100) | 20% | 22/100 | 4.4 |
| ESLint clean (0 warnings = 100) | 15% | 0/100 | 0 |
| Couverture tests (objectif 50%) | 20% | 2/100 | 0.4 |
| TODO résolus | 5% | 0/100 | 0 |
| Build production (0 erreurs = 100) | 40% | 0/100 | 0 |

### 8.2 Score Global

```
╔═══════════════════════════════════════════════════════╗
║  SCORE QUALITÉ INITIAL : 4.8/100                      ║
║                                                        ║
║  🔴 CRITIQUE - BUILD CASSÉ (576 erreurs TypeScript)  ║
╚═══════════════════════════════════════════════════════╝
```

**Classification** : 🔴 CRITIQUE - Le projet ne compile pas

### 8.3 Problèmes Bloquants

| # | Problème | Impact | Priorité |
|---|----------|--------|----------|
| 1 | 576 erreurs TypeScript | Build impossible | P0 |
| 2 | Types Supabase désynchronisés | Queries cassées | P0 |
| 3 | Contextes incomplets | Runtime errors | P0 |
| 4 | 484 "any" non typés | Bugs silencieux | P1 |

---

## 9. Recommandations Prioritaires

### Priorité 0 - BLOQUANT (Immédiat - avant tout déploiement)

- [ ] **RÉGÉNÉRER LES TYPES SUPABASE** : `npx supabase gen types typescript`
- [ ] Ajouter les tables/vues manquantes au schéma DB (`attachments`, `task_executions_view`)
- [ ] Corriger `ExerciceContext` - ajouter `selectedExercice`
- [ ] Corriger le type `Profile` - ajouter `exercises_allowed`
- [ ] Fixer `src/test/setup.ts` - déclarer `global`

### Priorité 1 - Critique (Semaine 1)

- [ ] Corriger les 82 fichiers avec erreurs TypeScript
- [ ] Synchroniser les types avec le schéma Supabase actuel
- [ ] Typer correctement les retours de queries Supabase

### Priorité 2 - Haute (Semaine 2-3)

- [ ] Réduire les `any` de 484 à < 100
- [ ] Ajouter tests E2E pour la chaîne de dépense complète
- [ ] Résoudre les 13 erreurs ESLint

### Priorité 3 - Moyenne (Mois 1)

- [ ] Ajouter tests unitaires pour les hooks RBAC
- [ ] Atteindre 50% de couverture de tests
- [ ] Supprimer les variables non utilisées (691 warnings)

### Priorité 4 - Amélioration continue

- [ ] Score qualité > 70/100
- [ ] 0 warnings ESLint
- [ ] Documentation du code

---

## 10. Configuration Actuelle

### 10.1 Playwright (`playwright.config.ts`)

```typescript
{
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: ['html', 'json', 'list'],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [{ name: 'chromium' }]
}
```

### 10.2 Vitest (`vitest.config.ts`)

```typescript
{
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  include: ['src/**/*.{test,spec}.{ts,tsx}'],
  coverage: {
    provider: 'v8',
    thresholds: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    }
  }
}
```

---

## 11. Commandes de Vérification

```bash
# Build avec mémoire suffisante
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# TypeCheck seul
npm run typecheck

# ESLint
npm run lint

# Tests unitaires
npm run test

# Compter les "any"
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l

# Compter les console.log
grep -r "console.log" src/ --include="*.ts" --include="*.tsx" | wc -l

# Régénérer les types Supabase
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

---

## 12. Prochaines Étapes

1. **Stabiliser le build** : Corriger les 576 erreurs TypeScript
2. **Synchroniser Supabase** : Régénérer les types depuis le schéma actuel
3. **Corriger les contextes** : `ExerciceContext`, `RBACContext`
4. **Typer** : Réduire les `any` dans les hooks critiques
5. **Tester** : Ajouter tests E2E pour le workflow principal
6. **Monitorer** : Intégrer ces métriques dans la CI/CD

---

## Annexe : Logs complets du build

Le fichier de logs complet est disponible dans :
`/tmp/claude-1000/-home-angeyannick-sygfp-artis-g-re/tasks/b74fa32.output`

---

*Rapport généré par CONTROLEUR - Agent Qualité SYGFP*
*Baseline à comparer lors des futurs audits*
*Date de génération : 29/01/2026 16:50 UTC*
