# DIAGNOSTIC - Calculs Budget ELOP

**Date :** 10 fevrier 2026
**Sujet :** Fiabilite des colonnes Engage, Liquide, Paye, Disponible
**Verdict :** LES CALCULS STOCKES SONT FAUX - L'AFFICHAGE UI EST CORRECT

---

## 1. FLUX DE DONNEES ACTUEL

```
┌─────────────────────────────────────────────────────────────────┐
│                         BASE DE DONNEES                          │
│                                                                  │
│  budget_lines                                                    │
│  ├─ dotation_initiale    = 50,000,000  (CORRECT)                │
│  ├─ total_engage         = 0           (FAUX - devrait > 0)     │
│  ├─ total_liquide        = 0           (FAUX - devrait > 0)     │
│  ├─ total_ordonnance     = 0           (FAUX - devrait > 0)     │
│  ├─ total_paye           = 0           (FAUX - devrait > 0)     │
│  └─ disponible_calcule   = 0           (FAUX - jamais calcule)  │
│                                                                  │
│  budget_engagements  (~3,000 records, montants reels)            │
│  budget_liquidations (~3,700 records, montants reels)            │
│  ordonnancements     (~3,350 records, montants reels)            │
│  reglements          (0 records - TABLE VIDE)                    │
└─────────────────────────────────────────────────────────────────┘
         │
         │  HOOK: useBudgetLines.ts (ligne 98-156)
         │  Requete: supabase.from('budget_lines').select('*,...')
         │  → Lit directement les colonnes stockees (total_engage = 0)
         │  → NE FAIT PAS d'agregation
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Page: StructureBudgetaire.tsx                                   │
│  ├─ KPIs: utilise "totals" du hook = seulement dotation_initiale│
│  └─ Passe les lignes au composant BudgetLineTable               │
└─────────────────────────────────────────────────────────────────┘
         │
         │  COMPOSANT: BudgetLineTable.tsx (ligne 93-204)
         │  *** FAIT SES PROPRES REQUETES EN TEMPS REEL ***
         │  → budget_engagements WHERE statut='valide'
         │  → budget_liquidations WHERE statut='valide'
         │  → ordonnancements WHERE statut IN ('valide','signe')
         │  → reglements WHERE statut='paye'
         │  → credit_transfers WHERE status='execute'
         │  → Calcule engage, liquide, paye, disponible en JS
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  AFFICHAGE TABLEAU                                               │
│  Colonnes: Code | Libelle | Direction | Dotation Init. |         │
│            Dotation Act. | Engage | Liquide | Paye | Disponible │
│                                                                  │
│  Les valeurs AFFICHEES viennent du calcul temps reel             │
│  (PAS des colonnes stockees dans budget_lines)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. PREUVE DU PROBLEME

### Ligne budgetaire "60 - Achats et Charges Externes" (id: e7f1f697)

**Ce que la table `budget_lines` dit :**

```
dotation_initiale  = 50,000,000
total_engage       = 0          ← FAUX
total_liquide      = 0          ← FAUX
total_ordonnance   = 0          ← FAUX
total_paye         = 0
disponible_calcule = 0          ← FAUX
```

**Ce que les tables ELOP contiennent reellement :**

```
budget_engagements (statut='valide', budget_line_id = e7f1f697) :
  - 2,300,000,000 FCFA
  - 250,000,000 FCFA
  - ... (des dizaines d'engagements)
  TOTAL REEL >> 2,550,000,000 FCFA

budget_liquidations (via engagement_id → e7f1f697) :
  - Des montants validés en milliards

ordonnancements (via liquidation_id → engagement_id → e7f1f697) :
  - Des montants validés en milliards
```

**Ecart : 0 stocke vs 2,550,000,000+ reel**

---

## 3. ANALYSE DES TRIGGERS EXISTANTS

### 3.1 Trigger pour `total_engage` : EXISTE mais ne se declenche pas

**Fichier :** `supabase/migrations/20260116211854_...sql` (ligne 112-246)

```sql
-- Trigger: trg_update_engagement_rate
-- Evenement: AFTER UPDATE ON budget_engagements
-- Condition: IF NEW.statut = 'valide' AND OLD.statut IS DISTINCT FROM 'valide'
-- Action: UPDATE budget_lines SET total_engage = SUM(engagements valides)
```

**Pourquoi il ne fonctionne pas :**

- Le trigger est sur **AFTER UPDATE**, pas sur AFTER INSERT
- Les ~3,000 engagements ont ete migres par INSERT direct avec `statut = 'valide'` deja positionne
- Un INSERT ne declenche pas un trigger UPDATE
- Seuls les engagements crees via l'UI (UPDATE brouillon → valide) declencheraient ce trigger

### 3.2 Trigger pour `total_paye` : EXISTE mais table reglements vide

**Fichier :** `supabase/migrations/20260117112749_...sql` (ligne 166-204)

```sql
-- Fonction: update_budget_and_close_dossier_on_reglement
-- Evenement: AFTER INSERT ON reglements
-- Action:
--   1. Remonte la chaine: reglement → ordonnancement → liquidation → engagement → budget_line_id
--   2. UPDATE budget_lines SET total_paye = SUM(reglements non annules)
--   3. Si dossier solde → cloture automatique
```

**Pourquoi il ne fonctionne pas :**

- La table `reglements` est **vide** (0 enregistrements)
- Aucun reglement n'a jamais ete cree

### 3.3 Trigger pour `total_liquide` : N'EXISTE PAS

**Aucune migration ne contient de trigger mettant a jour `budget_lines.total_liquide`.**
Malgre ~3,700 liquidations en base, aucun mecanisme ne propage le total.

### 3.4 Trigger pour `total_ordonnance` : N'EXISTE PAS

**Aucune migration ne contient de trigger mettant a jour `budget_lines.total_ordonnance`.**
Malgre ~3,350 ordonnancements en base, aucun mecanisme ne propage le total.

---

## 4. FORMULES ATTENDUES vs REALITE

### 4.1 Engage

| Aspect              | Attendu                                                                      | Realite                                          |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| **Formule**         | `SUM(budget_engagements.montant WHERE statut='valide' AND budget_line_id=X)` | Correcte dans le trigger                         |
| **Trigger existe**  | Oui                                                                          | Oui (`trg_update_engagement_rate`)               |
| **Se declenche**    | Sur UPDATE de statut vers 'valide'                                           | Oui, mais seulement sur UPDATE                   |
| **Donnees migrees** | Devraient etre comptees                                                      | Non comptees (INSERT, pas UPDATE)                |
| **Affichage UI**    | Correct                                                                      | Correct (calcul temps reel dans BudgetLineTable) |
| **Colonne stockee** | Devrait refleter la realite                                                  | **FAUX (= 0 partout)**                           |

### 4.2 Liquide

| Aspect              | Attendu                                                                             | Realite                                                               |
| ------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Formule**         | `SUM(budget_liquidations.montant WHERE statut='valide')` via engagement→budget_line | -                                                                     |
| **Trigger existe**  | Oui                                                                                 | **NON - aucun trigger**                                               |
| **Affichage UI**    | Correct                                                                             | Correct (calcul temps reel, MAIS utilise `montant` pas `net_a_payer`) |
| **Colonne stockee** | Devrait refleter la realite                                                         | **FAUX (= 0 partout)**                                                |

### 4.3 Ordonnance

| Aspect              | Attendu                                                                                                  | Realite                     |
| ------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Formule**         | `SUM(ordonnancements.montant WHERE statut IN ('valide','signe'))` via liquidation→engagement→budget_line | -                           |
| **Trigger existe**  | Oui                                                                                                      | **NON - aucun trigger**     |
| **Affichage UI**    | Correct                                                                                                  | Correct (calcul temps reel) |
| **Colonne stockee** | Devrait refleter la realite                                                                              | **FAUX (= 0 partout)**      |

### 4.4 Paye

| Aspect              | Attendu                                                                                                                    | Realite                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Formule**         | `SUM(reglements.montant WHERE statut NOT IN ('annule','brouillon'))` via ordonnancement→liquidation→engagement→budget_line | Correcte dans le trigger                               |
| **Trigger existe**  | Oui                                                                                                                        | Oui (`update_budget_and_close_dossier_on_reglement`)   |
| **Se declenche**    | Sur INSERT dans reglements                                                                                                 | Oui                                                    |
| **Donnees**         | Devrait refleter la realite                                                                                                | Table reglements vide = 0 partout (correct par defaut) |
| **Colonne stockee** | 0                                                                                                                          | 0 (correct car aucun reglement)                        |

### 4.5 Disponible

| Aspect                      | Attendu                                                         | Realite                                         |
| --------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| **Formule**                 | `dotation_actuelle - total_engage`                              | -                                               |
| **Calcule automatiquement** | En DB                                                           | **NON - uniquement en JS dans BudgetLineTable** |
| **Affichage UI**            | `dotation_initiale + virements_recus - virements_emis - engage` | Correct                                         |
| **Colonne stockee**         | `disponible_calcule`                                            | **FAUX (= 0 ou = dotation_initiale)**           |

---

## 5. CE QUI MARCHE vs CE QUI NE MARCHE PAS

### Ce qui MARCHE (affichage UI)

Le composant `BudgetLineTable.tsx` (lignes 93-204) fait **5 requetes separees** a chaque affichage :

```typescript
// 1. Engagements valides
supabase
  .from('budget_engagements')
  .select('budget_line_id, montant, statut')
  .eq('statut', 'valide');

// 2. Liquidations validees (via join engagement)
supabase
  .from('budget_liquidations')
  .select('engagement:budget_engagements(budget_line_id), montant')
  .eq('statut', 'valide');

// 3. Ordonnancements (via double join)
supabase
  .from('ordonnancements')
  .select('liquidation:budget_liquidations(engagement:budget_engagements(budget_line_id)), montant')
  .in('statut', ['valide', 'signe']);

// 4. Reglements (via triple join)
supabase
  .from('reglements')
  .select('ordonnancement:ordonnancements(...), montant')
  .eq('statut', 'paye');

// 5. Virements executes
supabase
  .from('credit_transfers')
  .select('from_budget_line_id, to_budget_line_id, amount')
  .eq('status', 'execute');
```

Puis calcule en JavaScript :

```typescript
disponible = dotation_initiale + virements_recus - virements_emis - engage;
```

**Ce mecanisme affiche les bonnes valeurs dans le tableau.**

### Ce qui NE MARCHE PAS

| Composant                                                 | Probleme                                            |
| --------------------------------------------------------- | --------------------------------------------------- |
| `budget_lines.total_engage`                               | Toujours 0 (trigger ne se declenche pas sur INSERT) |
| `budget_lines.total_liquide`                              | Toujours 0 (aucun trigger n'existe)                 |
| `budget_lines.total_ordonnance`                           | Toujours 0 (aucun trigger n'existe)                 |
| `budget_lines.total_paye`                                 | 0 (correct car reglements vide)                     |
| `budget_lines.disponible_calcule`                         | 0 ou = dotation_initiale (jamais recalcule)         |
| KPIs de la page StructureBudgetaire                       | Ne montrent que `dotation_initiale` total           |
| Vues SQL (`v_tableau_financier`, `v_alertes_financieres`) | Lisent les colonnes stockees = 0                    |
| Exports PDF/Excel                                         | Probablement 0 si basees sur les colonnes stockees  |

---

## 6. PROBLEMES SECONDAIRES DETECTES

### 6.1 Liquidations : `montant` vs `net_a_payer`

Les liquidations ont deux champs montant :

```
montant      = montant brut (avant deductions fiscales)
net_a_payer  = montant net apres TVA, AIRSI, retenue source
```

Le composant `BudgetLineTable` utilise **`montant`** pour les liquidations.
Or pour certaines lignes migrees, `montant = 0` mais `net_a_payer > 0`.
En realite, les 5 premieres liquidations montrent `montant = net_a_payer` donc ce n'est pas un probleme generalise.

### 6.2 Performance : 5 requetes par affichage

Le `BudgetLineTable` lance 5 requetes Supabase dans un `useEffect` a chaque changement de `lines`. Avec 277 lignes, les jointures (surtout la triple jointure pour reglements) sont couteuses.

### 6.3 Engagements sur seulement 2 budget_lines

Tous les engagements migres pointent vers seulement 2 budget_line_id :

- `e7f1f697` (code "60" - exercice 2026)
- `8b0d9cef` (code "60-2024" - migration 2024)

Cela signifie que la migration a affecte TOUS les engagements a une seule ligne budgetaire generique au lieu de les ventiler correctement.

---

## 7. CONCLUSION

### Les calculs sont-ils fiables ?

| Couche                      |  Fiable ?   | Detail                                           |
| --------------------------- | :---------: | ------------------------------------------------ |
| **Affichage tableau**       |     OUI     | BudgetLineTable calcule en temps reel            |
| **Colonnes stockees**       |   **NON**   | total_engage/liquide/ordonnance/paye = 0 partout |
| **Vues SQL**                |   **NON**   | Lisent les colonnes stockees (= 0)               |
| **Triggers engagement**     |   PARTIEL   | Fonctionne sur UPDATE, pas sur INSERT migre      |
| **Triggers liquidation**    |   **NON**   | N'existe pas                                     |
| **Triggers ordonnancement** |   **NON**   | N'existe pas                                     |
| **Triggers reglement**      |     OUI     | Existe et fonctionnerait (table vide)            |
| **Exports**                 | **SUSPECT** | Depend de la source (colonnes vs calcul)         |

### Cause racine

1. Les donnees ont ete **migrees par INSERT** avec `statut = 'valide'` → les triggers AFTER UPDATE ne se declenchent pas
2. **2 triggers manquants** : `total_liquide` et `total_ordonnance` n'ont aucun trigger
3. **Pas de batch de recalcul** : aucune RPC ou migration ne recalcule les totaux a partir des donnees ELOP

---

## 8. RECOMMANDATIONS

### P0 - Recalcul immediat (une seule fois)

Creer une migration SQL qui recalcule les 4 colonnes pour toutes les lignes :

```sql
-- Recalcul total_engage
UPDATE budget_lines bl SET total_engage = COALESCE((
  SELECT SUM(e.montant) FROM budget_engagements e
  WHERE e.budget_line_id = bl.id AND e.statut = 'valide'
), 0);

-- Recalcul total_liquide
UPDATE budget_lines bl SET total_liquide = COALESCE((
  SELECT SUM(l.montant) FROM budget_liquidations l
  JOIN budget_engagements e ON l.engagement_id = e.id
  WHERE e.budget_line_id = bl.id AND l.statut = 'valide'
), 0);

-- Recalcul total_ordonnance
UPDATE budget_lines bl SET total_ordonnance = COALESCE((
  SELECT SUM(o.montant) FROM ordonnancements o
  JOIN budget_liquidations l ON o.liquidation_id = l.id
  JOIN budget_engagements e ON l.engagement_id = e.id
  WHERE e.budget_line_id = bl.id AND o.statut IN ('valide', 'signe')
), 0);

-- Recalcul total_paye
UPDATE budget_lines bl SET total_paye = COALESCE((
  SELECT SUM(r.montant) FROM reglements r
  JOIN ordonnancements o ON r.ordonnancement_id = o.id
  JOIN budget_liquidations l ON o.liquidation_id = l.id
  JOIN budget_engagements e ON l.engagement_id = e.id
  WHERE e.budget_line_id = bl.id AND r.statut NOT IN ('annule', 'brouillon')
), 0);

-- Recalcul disponible
UPDATE budget_lines SET disponible_calcule =
  COALESCE(dotation_modifiee, dotation_initiale) - COALESCE(total_engage, 0);
```

### P1 - Creer les triggers manquants

1. **Trigger `total_liquide`** : AFTER INSERT OR UPDATE ON `budget_liquidations`
2. **Trigger `total_ordonnance`** : AFTER INSERT OR UPDATE ON `ordonnancements`
3. **Corriger trigger engagement** : Ajouter AFTER INSERT en plus de AFTER UPDATE

### P2 - Creer une RPC de recalcul

```sql
CREATE FUNCTION recalculate_budget_line_totals(p_budget_line_id UUID)
RETURNS void AS $$ ... $$ LANGUAGE plpgsql;
```

Appelable a la demande pour resynchroniser une ligne specifique.

---

_Rapport genere automatiquement par Claude Code - Diagnostic en lecture seule_
