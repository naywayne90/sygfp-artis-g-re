# SYGFP - Règles de Non-Régression

> Document de référence pour toute modification du Dashboard et modules connexes.
> **Dernière mise à jour** : 2026-01-19

---

## 1. RÈGLES ABSOLUES (ZÉRO EXCEPTION)

### 1.1 Routes et Navigation
- **NE JAMAIS renommer** une route existante (`/notes-sef`, `/engagements`, etc.)
- **NE JAMAIS supprimer** une route sans migration des liens et redirections
- **TOUJOURS vérifier** que les liens internes (sidebar, breadcrumbs) sont mis à jour

### 1.2 Types TypeScript
- **NE JAMAIS casser** les interfaces existantes (ajouter des propriétés optionnelles OK, supprimer NON)
- **NE JAMAIS modifier** le typage des props des composants partagés (`@/components/shared/`)
- **TOUJOURS utiliser** les types générés Supabase (`Database` depuis `@/integrations/supabase/types`)

### 1.3 Supabase / RLS
- **NE JAMAIS modifier** une table de production sans migration versionnée
- **NE JAMAIS désactiver** les policies RLS existantes
- **TOUJOURS tester** les requêtes avec différents rôles (Admin, DG, DAF, Agent)

### 1.4 Feature Flags
- Les widgets "tracking non activé" doivent **RESTER** si la fonctionnalité n'est pas implémentée
- Utiliser `EmptyStateWithTracking` pour les fonctionnalités en cours de développement
- **NE JAMAIS** afficher de données fictives/mockées en production

---

## 2. COMMITS ET PR

### 2.1 Convention de Commit
```
[DASHBOARD] Description courte (<50 chars)

- Détail 1
- Détail 2

Closes #XXX
```

### 2.2 Règle PR
- **1 Prompt = 1 PR** (maximum)
- Chaque PR doit passer le build TypeScript (`npm run build`)
- Chaque PR doit être revue avant merge

### 2.3 Branches
```
feature/dashboard-lot-{N}-{description}
```
Exemple : `feature/dashboard-lot-1-kpi-cards-reorg`

---

## 3. COMPOSANTS DASHBOARD - INVENTAIRE

### 3.1 Page Principale
| Fichier | Rôle | Modifiable |
|---------|------|------------|
| `src/pages/Dashboard.tsx` | Page principale avec Tabs | ⚠️ Avec précaution |

### 3.2 Composants par Rôle
| Composant | Fichier | Hook | Tables Supabase |
|-----------|---------|------|-----------------|
| `DashboardDG` | `DashboardDG.tsx` | `useDGDashboard` | dossiers, budget_engagements, budget_lines, directions |
| `DashboardDAF` | `DashboardDAF.tsx` | `useDAFDashboard` | notes_dg, budget_engagements, budget_liquidations |
| `DashboardSDPM` | `DashboardSDPM.tsx` | `useSDPMDashboard` | marches, expressions_besoin, prestataires |
| `DashboardTresorerie` | `DashboardTresorerie.tsx` | `useTresorerieDashboard` | ordonnancements, reglements, comptes_bancaires |

### 3.3 Composants KPI
| Composant | Fichier | Description |
|-----------|---------|-------------|
| `DashboardKPI` | `DashboardKPI.tsx` | Vue KPI avec sections DG/DAF/Contrôleur |
| `KPICards` | `KPICards.tsx` | Cards dossiers + délais + OS/Directions |
| `ChaineDepenseKPIs` | `ChaineDepenseKPIs.tsx` | Pipeline visuel chaîne de dépense |
| `DelaisKPICard` | `DelaisKPICard.tsx` | Délais moyens par étape |
| `ExecutionKPIDashboard` | `ExecutionKPIDashboard.tsx` | Taux d'exécution détaillé |

### 3.4 Composants Partagés
| Composant | Fichier | Description |
|-----------|---------|-------------|
| `AlertsPanelEnhanced` | `AlertsPanelEnhanced.tsx` | Alertes avec catégories |
| `RecentActivitiesPanel` | `RecentActivitiesPanel.tsx` | Activités récentes |
| `PendingTasksPanel` | `PendingTasksPanel.tsx` | Tâches en attente |
| `BudgetAlertsWidget` | `BudgetAlertsWidget.tsx` | Alertes seuils budgétaires |

---

## 4. HOOKS DASHBOARD - INVENTAIRE

### 4.1 Hook Principal
```typescript
// src/hooks/useDashboardStats.ts
useDashboardStats() → DashboardStats
```
**Tables utilisées** : notes_sef, notes_dg, budget_engagements, budget_liquidations, ordonnancements, reglements, budget_lines

**Données calculées** :
- notesSEFAValider, notesAEFAValider, notesAEFImputees
- engagementsEnCours, liquidationsATraiter, ordonnancementsEnSignature
- budgetTotal, budgetEngage, budgetLiquide, budgetPaye, budgetDisponible
- tauxEngagement, tauxLiquidation, tauxPaiement
- hasInconsistency, inconsistencyType, topLignesDepassement

### 4.2 Hooks par Rôle
| Hook | Fichier | Données clés |
|------|---------|--------------|
| `useDGDashboard` | `useDashboardByRole.ts` | budgetGlobal, topDirections, dossiersBloques |
| `useDAFDashboard` | `useDashboardByRole.ts` | notesAImputer, engagementsAValider, resteAEngager |
| `useSDPMDashboard` | `useDashboardByRole.ts` | marchesEnCours, topFournisseurs |
| `useControleurDashboard` | `useDashboardByRole.ts` | lignesCritiques, engagementsAViser, anomalies |
| `useTresorerieDashboard` | `useDashboardByRole.ts` | ordresAPayer, reglementsDuJour, previsionsSort |

### 4.3 Alertes
```typescript
// src/hooks/useDashboardAlerts.ts
useDashboardAlerts() → DashboardAlert[]
```

---

## 5. TABLES SUPABASE UTILISÉES

### 5.1 Chaîne de Dépense
| Table | Colonnes clés | RLS |
|-------|---------------|-----|
| `notes_sef` | statut, exercice, montant_estime, created_at | ✅ |
| `notes_dg` (AEF) | statut, exercice, montant_estime, dossier_ref | ✅ |
| `budget_engagements` | statut, exercice, montant, budget_line_id | ✅ |
| `budget_liquidations` | statut, exercice, montant, engagement_id | ✅ |
| `ordonnancements` | statut, exercice, montant, liquidation_id | ✅ |
| `reglements` | statut, exercice, montant, ordonnancement_id | ✅ |

### 5.2 Budget
| Table | Colonnes clés | RLS |
|-------|---------------|-----|
| `budget_lines` | exercice, dotation_initiale, direction_id, os_id | ✅ |
| `directions` | code, label | ✅ |
| `objectifs_strategiques` | code, libelle | ✅ |

### 5.3 Workflow
| Table | Colonnes clés | RLS |
|-------|---------------|-----|
| `dossiers` | statut_global, exercice, dossier_ref | ✅ |
| `marches` | statut, exercice, mode_passation | ✅ |
| `expressions_besoin` | statut, exercice | ✅ |

---

## 6. CHECK-LIST AVANT PR

### 6.1 Build
```bash
npm run build
# Attendu: "X modules transformés" sans erreurs
```

### 6.2 Lint
```bash
npm run lint
# Toléré: @typescript-eslint/no-explicit-any (warnings existants)
# Non toléré: Erreurs nouvelles
```

### 6.3 Tests Manuels
- [ ] Naviguer vers `/` (Dashboard)
- [ ] Vérifier tous les onglets (Vue générale, KPIs, DG, DAF/SDCT, SDPM, Trésorerie)
- [ ] Vérifier les quickActions fonctionnent
- [ ] Vérifier les stats cards affichent des données (ou 0 si vide)
- [ ] Vérifier les alertes s'affichent (si applicables)
- [ ] Tester avec différents rôles via profil

### 6.4 Responsive
- [ ] Desktop (1920px+)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

## 7. RISQUES IDENTIFIÉS

### 7.1 Performance
- **Hook `useDashboardStats`** : 10+ requêtes Supabase en parallèle
- **Mitigation** : Utiliser React Query caching (staleTime: 5min)

### 7.2 Données Incohérentes
- **Budget non chargé** : Affiche "Budget non chargé" avec lien vers import
- **Dépassement** : Alert destructive avec liste des lignes

### 7.3 RLS et Permissions
- Les hooks filtrent par `exercice` du contexte
- Les dashboards par rôle utilisent `hasAnyRole()` pour contrôle d'accès

---

## 8. PLAN DE CONTINGENCE

### 8.1 Si Régression Détectée
1. **Identifier** le commit fautif via `git bisect`
2. **Revert** immédiatement si en production
3. **Créer** un ticket avec reproduction steps
4. **Corriger** dans une nouvelle branche

### 8.2 Si Performance Dégradée
1. Vérifier les queries Supabase dans DevTools Network
2. Ajouter des index si nécessaires (via migration)
3. Augmenter `staleTime` des hooks si acceptable

---

## 9. CONTACTS

| Rôle | Responsable |
|------|-------------|
| Frontend | Équipe SYGFP |
| Backend/Supabase | Équipe SYGFP |
| Validation métier | DAF ARTI |

---

*Document maintenu par l'équipe SYGFP. Toute modification doit être validée.*
