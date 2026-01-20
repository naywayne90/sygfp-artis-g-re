# SYGFP Dashboard - Plan d'Implémentation en 9 Lots

> **Date** : 2026-01-19
> **Objectif** : Améliorer le Dashboard sans casser l'existant
> **Règle** : 1 Lot = 1 Prompt = 1 PR

---

## ÉTAT ACTUEL (Audit du 2026-01-19)

### Fonctionnalités Existantes ✅
| Élément | Status | Localisation |
|---------|--------|--------------|
| Quick Actions (4 boutons) | ✅ OK | Dashboard.tsx:101-130 |
| Stats Cards (SEF, AEF, Eng, Liq, Ord) | ✅ OK | Dashboard.tsx:354-474 |
| Exécution Budgétaire (taux + montants) | ✅ OK | Dashboard.tsx:478-564 |
| RecentActivitiesPanel | ✅ OK | Composant séparé |
| PendingTasksPanel | ✅ OK | Composant séparé |
| AlertsPanelEnhanced | ✅ OK | Composant séparé |
| KPICards (dossiers, délais, OS, Directions) | ✅ OK | KPICards.tsx |
| BudgetAlertsWidget | ✅ OK | Composant séparé |
| Tabs par rôle (DG, DAF, SDPM, Trésorerie) | ✅ OK | Dashboard.tsx:257-606 |
| DashboardKPI (sections DG/DAF/Contrôleur) | ✅ OK | DashboardKPI.tsx |
| EmptyStateWithTracking widgets | ✅ OK | DashboardKPI.tsx |

### Check-list Écarts vs Captures Attendues

#### Vue Générale
| Attendu | Actuel | Écart |
|---------|--------|-------|
| Quick actions créer Note AEF/SEF | ✅ Présent | - |
| Stats cards avec compteurs | ✅ Présent | - |
| Bloc exécution budgétaire | ✅ Présent | - |
| Graphique évolution mensuelle | ❌ Absent | À ajouter Lot 3 |
| Mini-calendrier échéances | ❌ Absent | À ajouter Lot 5 |

#### Onglet KPIs
| Attendu | Actuel | Écart |
|---------|--------|-------|
| Section DG (alertes, exécution, signatures) | ✅ Présent | - |
| Section DAF (tâches, restes, trésorerie) | ✅ Présent | - |
| Section Contrôleur (lignes critiques, délais) | ✅ Présent | - |
| "Tracking non activé" placeholders | ✅ Présent | - |
| Graphique radar compétences | ❌ Absent | Non prioritaire |

#### Onglet Direction Générale
| Attendu | Actuel | Écart |
|---------|--------|-------|
| Alertes critiques | ✅ Présent | - |
| KPIs principaux (4 cards) | ✅ Présent | - |
| Exécution budgétaire détaillée | ✅ Présent | - |
| Pipeline chaîne de dépense | ✅ Présent | - |
| Top 5 Directions | ✅ Présent | - |
| État des dossiers | ✅ Présent | - |
| Signatures en attente DG | ⚠️ Partiel | À compléter Lot 6 |

#### Onglet DAF/SDCT
| Attendu | Actuel | Écart |
|---------|--------|-------|
| Actions rapides (notes, engagements, liquidations) | ✅ Présent | - |
| KPIs Workflow (engagements, mois, notes) | ✅ Présent | - |
| Restes à traiter | ✅ Présent | - |
| Alertes | ✅ Présent | - |
| Plan de trésorerie intégré | ❌ Absent | À ajouter Lot 7 |

#### Onglet Contrôle Budgétaire
| Attendu | Actuel | Écart |
|---------|--------|-------|
| Lignes critiques/alerte | ✅ Via DashboardKPI | - |
| Engagements à viser | ✅ Via DashboardKPI | - |
| Délais moyens | ✅ Via DashboardKPI | - |
| Détection anomalies | ⚠️ Basique | À améliorer Lot 8 |

---

## PLAN D'IMPLÉMENTATION - 9 LOTS

### LOT 1 : Réorganisation KPICards et Responsive
**Objectif** : Améliorer la lisibilité des KPIs sur tous les écrans

**Fichiers à modifier** :
- `src/components/dashboard/KPICards.tsx` - Refactor layout grid
- `src/pages/Dashboard.tsx` - Ajuster l'ordre des composants

**Tâches** :
1. Réorganiser les KPIs en groupes logiques (Dossiers | Budget | Délais)
2. Améliorer le responsive (2 colonnes mobile, 4 colonnes desktop)
3. Ajouter des tooltips d'explication sur chaque KPI
4. Uniformiser les couleurs avec le design system

**Données existantes utilisées** : Toutes (aucune nouvelle requête)

**Risques** : Faible - Uniquement CSS/Layout

---

### LOT 2 : Amélioration Stats Cards Vue Générale
**Objectif** : Enrichir les stats cards avec tendances et drill-down

**Fichiers à modifier** :
- `src/pages/Dashboard.tsx` - Section stats cards (lignes 354-474)
- `src/hooks/useDashboardStats.ts` - Ajouter calculs tendances

**Tâches** :
1. Ajouter indicateur tendance (↑↓) comparé au mois précédent
2. Ajouter hover avec détail (ex: "3 validées cette semaine")
3. Rendre cliquables pour navigation vers module correspondant

**Données manquantes à calculer** :
```typescript
// Dans useDashboardStats.ts
tendanceSEF: {
  variation: number; // % vs mois précédent
  direction: 'up' | 'down' | 'stable';
}
```

**Nouvelles requêtes Supabase** :
```sql
-- Comparaison mois précédent
SELECT COUNT(*) FROM notes_sef
WHERE exercice = :exercice
AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
AND created_at < date_trunc('month', CURRENT_DATE)
```

**Risques** : Moyen - Nouvelles requêtes SQL, impact performance

---

### LOT 3 : Graphique Évolution Mensuelle
**Objectif** : Ajouter un graphique d'évolution de l'exécution budgétaire

**Fichiers à créer** :
- `src/components/dashboard/ExecutionChart.tsx` - Nouveau composant

**Fichiers à modifier** :
- `src/pages/Dashboard.tsx` - Intégrer le graphique
- `src/hooks/useDashboardStats.ts` - Ajouter données mensuelles

**Tâches** :
1. Créer composant avec Recharts (déjà installé)
2. Graphique ligne: Engagé vs Liquidé vs Payé par mois
3. Tooltip avec détail au survol
4. Toggle pour afficher/masquer les séries

**Données manquantes à calculer** :
```typescript
executionMensuelle: Array<{
  mois: string; // "Jan", "Fév", etc.
  engage: number;
  liquide: number;
  paye: number;
}>
```

**Nouvelles requêtes Supabase** :
```sql
SELECT
  date_trunc('month', date_engagement) as mois,
  SUM(montant) as total
FROM budget_engagements
WHERE exercice = :exercice AND statut = 'valide'
GROUP BY mois
ORDER BY mois
```

**Risques** : Moyen - Dépendance Recharts, performance avec 12 mois de données

---

### LOT 4 : Amélioration Alertes et Notifications
**Objectif** : Système d'alertes plus intelligent avec priorisation

**Fichiers à modifier** :
- `src/components/dashboard/AlertsPanelEnhanced.tsx` - Refactor
- `src/hooks/useDashboardAlerts.ts` - Améliorer logique

**Tâches** :
1. Catégoriser les alertes (Budget | Workflow | Délais | Système)
2. Ajouter filtres par catégorie
3. Permettre de marquer comme "vu" / "ignoré"
4. Ajouter notification sonore optionnelle pour critiques

**Données manquantes** :
```typescript
alert: {
  category: 'budget' | 'workflow' | 'delais' | 'system';
  readAt: Date | null;
  dismissedAt: Date | null;
}
```

**Migration Supabase** :
```sql
ALTER TABLE alerts ADD COLUMN category VARCHAR(20);
ALTER TABLE alerts ADD COLUMN read_at TIMESTAMP;
ALTER TABLE alerts ADD COLUMN dismissed_at TIMESTAMP;
```

**Risques** : Moyen - Migration DB, logique complexe

---

### LOT 5 : Mini-Calendrier Échéances
**Objectif** : Afficher les échéances importantes dans un calendrier compact

**Fichiers à créer** :
- `src/components/dashboard/EcheancesCalendar.tsx` - Nouveau composant

**Fichiers à modifier** :
- `src/pages/Dashboard.tsx` - Intégrer le calendrier
- Créer hook `src/hooks/useEcheances.ts`

**Tâches** :
1. Calendrier mini (vue mois) avec points colorés
2. Liste des 5 prochaines échéances
3. Clic sur jour = détail des échéances
4. Types : Fin marché, Date limite paiement, Échéance contrat

**Données manquantes à calculer** :
```typescript
echeances: Array<{
  date: Date;
  type: 'marche' | 'paiement' | 'contrat';
  title: string;
  link: string;
}>
```

**Nouvelles requêtes Supabase** :
```sql
-- Fin marchés
SELECT date_fin, objet FROM marches WHERE date_fin >= CURRENT_DATE
-- Échéances paiement (délai fournisseur)
SELECT created_at + INTERVAL '30 days' as echeance FROM budget_liquidations WHERE statut = 'valide'
```

**Risques** : Élevé - Logique métier complexe, UX calendrier

---

### LOT 6 : Signatures en Attente DG
**Objectif** : Vue consolidée des documents nécessitant signature DG

**Fichiers à créer** :
- `src/components/dashboard/SignaturesEnAttente.tsx` - Nouveau composant

**Fichiers à modifier** :
- `src/components/dashboard/DashboardDG.tsx` - Intégrer le composant
- `src/hooks/useDashboardByRole.ts` - Ajouter données signatures

**Tâches** :
1. Liste des ordonnancements en attente signature
2. Liste des marchés à approuver
3. Actions rapides (Signer / Refuser / Voir détail)
4. Compteur badge dans l'onglet DG

**Données manquantes** :
```typescript
signaturesEnAttente: {
  ordonnancements: Array<{id, reference, montant, demandeur}>;
  marches: Array<{id, reference, montant, objet}>;
  total: number;
}
```

**Requêtes existantes à étendre** :
```sql
SELECT * FROM ordonnancements
WHERE statut = 'en_signature' AND exercice = :exercice
```

**Risques** : Moyen - Logique métier signature, permissions

---

### LOT 7 : Plan de Trésorerie DAF
**Objectif** : Intégrer une vue simplifiée du plan de trésorerie

**Fichiers à créer** :
- `src/components/dashboard/TresorerieMiniWidget.tsx` - Nouveau composant

**Fichiers à modifier** :
- `src/components/dashboard/DashboardDAF.tsx` - Intégrer le widget
- `src/hooks/useDashboardByRole.ts` - Ajouter données trésorerie

**Tâches** :
1. Solde actuel vs Prévisionnel fin de mois
2. Graphique mini (barres) des prévisions 3 mois
3. Alertes si solde prévisionnel < seuil
4. Lien vers module Trésorerie complet

**Données manquantes** :
```typescript
tresorerieSynthese: {
  soldeActuel: number;
  previsionnelFinMois: number;
  alerteSolde: boolean;
  previsions3Mois: Array<{mois: string, entrees: number, sorties: number}>
}
```

**Tables existantes utilisées** : `comptes_bancaires`, `operations_tresorerie`

**Risques** : Élevé - Calculs financiers complexes

---

### LOT 8 : Détection Anomalies Avancée
**Objectif** : Améliorer la détection d'anomalies pour le contrôle budgétaire

**Fichiers à modifier** :
- `src/components/dashboard/DashboardKPI.tsx` - Section Contrôleur
- `src/hooks/useDashboardByRole.ts` - Hook useControleurDashboard

**Tâches** :
1. Détecter engagements sans liquidation > 60 jours
2. Détecter liquidations sans ordonnancement > 30 jours
3. Détecter écarts montant engagement vs facture > 10%
4. Score de risque par dossier

**Données manquantes** :
```typescript
anomalies: {
  engagementsSansLiquidation: Array<{id, jours, montant}>;
  liquidationsSansOrdonnancement: Array<{id, jours, montant}>;
  ecartsFactures: Array<{id, ecartPct, engagement, facture}>;
}
```

**Nouvelles requêtes** :
```sql
-- Engagements sans liquidation > 60j
SELECT e.*, CURRENT_DATE - e.date_engagement as jours
FROM budget_engagements e
LEFT JOIN budget_liquidations l ON l.engagement_id = e.id
WHERE l.id IS NULL AND e.statut = 'valide'
AND CURRENT_DATE - e.date_engagement > 60
```

**Risques** : Moyen - Logique métier, faux positifs possibles

---

### LOT 9 : Polish Final et Documentation
**Objectif** : Finaliser, tester et documenter

**Fichiers à modifier** :
- Tous les composants dashboard - Revue code
- `docs/DASHBOARD-USER-GUIDE.md` - Créer documentation utilisateur
- `src/pages/TestNonRegression.tsx` - Ajouter tests dashboard

**Tâches** :
1. Revue de code complète
2. Tests responsive sur tous les composants
3. Documentation utilisateur avec captures
4. Tests non-régression automatisés
5. Mesure performance (Lighthouse)
6. Correction bugs mineurs

**Livrables** :
- Score Lighthouse > 80
- Documentation utilisateur complète
- Tests non-régression passants

**Risques** : Faible - Consolidation uniquement

---

## RÉCAPITULATIF FICHIERS À MODIFIER

### Frontend (src/)
| Fichier | Lots |
|---------|------|
| `pages/Dashboard.tsx` | 1, 2, 3, 5 |
| `components/dashboard/KPICards.tsx` | 1 |
| `components/dashboard/AlertsPanelEnhanced.tsx` | 4 |
| `components/dashboard/DashboardDG.tsx` | 6 |
| `components/dashboard/DashboardDAF.tsx` | 7 |
| `components/dashboard/DashboardKPI.tsx` | 8 |
| `hooks/useDashboardStats.ts` | 2, 3 |
| `hooks/useDashboardAlerts.ts` | 4 |
| `hooks/useDashboardByRole.ts` | 6, 7, 8 |

### Nouveaux Fichiers
| Fichier | Lot |
|---------|-----|
| `components/dashboard/ExecutionChart.tsx` | 3 |
| `components/dashboard/EcheancesCalendar.tsx` | 5 |
| `components/dashboard/SignaturesEnAttente.tsx` | 6 |
| `components/dashboard/TresorerieMiniWidget.tsx` | 7 |
| `hooks/useEcheances.ts` | 5 |
| `docs/DASHBOARD-USER-GUIDE.md` | 9 |

### Migrations Supabase
| Migration | Lot |
|-----------|-----|
| `alter_alerts_add_columns.sql` | 4 |

---

## DÉPENDANCES ENTRE LOTS

```
Lot 1 → Lot 2 (layout avant contenu)
Lot 2 → Lot 3 (stats avant graphique)
Lot 4 → indépendant
Lot 5 → indépendant
Lot 6 → indépendant
Lot 7 → indépendant
Lot 8 → indépendant
Lot 9 → Tous (après les 8 autres)
```

**Ordre recommandé** : 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

---

## MÉTRIQUES DE SUCCÈS

| Métrique | Cible |
|----------|-------|
| Build TypeScript | 0 erreurs |
| Lint | 0 nouvelles erreurs |
| Lighthouse Performance | > 80 |
| Lighthouse Accessibility | > 90 |
| Temps chargement Dashboard | < 2s |
| Tests non-régression | 100% passants |

---

*Plan validé le 2026-01-19 - Prêt pour implémentation*
