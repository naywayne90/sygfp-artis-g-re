# Module Expression de Besoin — SYGFP (Etape 4/9)

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Expression de Besoin (EB)** formalise les besoins operationnels a partir des imputations validees. L'EB passe par un double workflow : **verification par le Controleur Budgetaire (CB)** puis **validation par le DG/DAAF**. Une EB validee peut ensuite etre convertie en Passation de Marche.

**Chaine** : Note SEF > Note AEF > Imputation > **Expression Besoin** > Passation Marche > Engagement > Liquidation > Ordonnancement > Reglement

## Codification ARTI

| Propriété            | Valeur                                                 |
| -------------------- | ------------------------------------------------------ |
| **Code étape**       | 3 (03 en format 14 chars)                              |
| **Sigle**            | EB                                                     |
| **Format référence** | `ARTI03MMYYNNNN` (14 chars)                            |
| **Exemple**          | `ARTI0302260001` = EB n°1, février 2026                |
| **Colonne DB**       | `expressions_besoin.numero`                            |
| **Génération**       | Trigger BEFORE INSERT via `generate_arti_reference(3)` |
| **Compteur**         | `arti_reference_counters` (étape=3, par mois)          |

## 2. Routes et acces

| Route                                                | Page                                        | Roles |
| ---------------------------------------------------- | ------------------------------------------- | ----- |
| `/execution/expression-besoin`                       | Page principale (KPIs, onglets, pagination) | Tous  |
| `/execution/expression-besoin?sourceImputation={id}` | Pre-selection imputation source             | Tous  |
| `/execution/expression-besoin?view={id}`             | Ouverture detail auto                       | Tous  |

## 3. Composants

| Composant                            | Fichier                                                                   | Role                                                         |
| ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `ExpressionBesoin` (page)            | `src/pages/execution/ExpressionBesoin.tsx`                                | Page principale avec KPIs (8 compteurs), onglets, pagination |
| `ExpressionBesoinForm`               | `src/components/expression-besoin/ExpressionBesoinForm.tsx`               | Dialog creation depuis marche                                |
| `ExpressionBesoinFromImputationForm` | `src/components/expression-besoin/ExpressionBesoinFromImputationForm.tsx` | Dialog creation depuis imputation validee                    |
| `ExpressionBesoinList`               | `src/components/expression-besoin/ExpressionBesoinList.tsx`               | Tableau avec actions contextuelles                           |
| `ExpressionBesoinDetails`            | `src/components/expression-besoin/ExpressionBesoinDetails.tsx`            | Dialog detail (lazy-loaded par ID)                           |
| `ExpressionBesoinExportButton`       | `src/components/expression-besoin/ExpressionBesoinExportButton.tsx`       | Bouton export avec filtres                                   |
| `NotesPagination`                    | `src/components/shared/NotesPagination.tsx`                               | Pagination serveur-side                                      |

## 4. Boutons et actions

| Bouton                 | Visible si                         | Action                                                   | Effet                                               |
| ---------------------- | ---------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| Nouvelle EB            | Toujours                           | Ouvre `ExpressionBesoinFromImputationForm`               | Cree EB depuis imputation validee                   |
| Depuis marche          | Toujours                           | Ouvre `ExpressionBesoinForm`                             | Cree EB depuis marche existant                      |
| Exporter               | Toujours                           | `ExpressionBesoinExportButton`                           | Export avec filtres actifs                          |
| Creer EB               | Onglet "A traiter", par imputation | `setSourceImputation(imp)`                               | Pre-remplit le formulaire depuis l'imputation       |
| Voir (oeil)            | Toute imputation/EB                | Navigue ou ouvre detail                                  | Consultation                                        |
| Soumettre              | EB en brouillon                    | `submitExpression(id)`                                   | Passe en `soumis`                                   |
| Verifier               | EB soumise, role CB                | `verifyExpression(id)`                                   | Passe en `verifie` (verification couverture budget) |
| Valider                | EB verifiee, role DG/DAAF          | `validateExpression(id)`                                 | Passe en `valide`                                   |
| Rejeter                | EB soumise/verifiee                | `rejectExpression(id)`                                   | Passe en `rejete`                                   |
| Differer               | EB soumise/verifiee                | `deferExpression(id)`                                    | Passe en `differe`                                  |
| Reprendre              | EB differee                        | `resumeExpression(id)`                                   | Re-soumet                                           |
| Supprimer              | EB en brouillon                    | `deleteExpression(id)`                                   | Suppression definitive                              |
| Creer passation marche | EB validee, menu contextuel        | Navigue vers `/execution/passation-marche?sourceEB={id}` | Chaine vers etape suivante                          |

## 5. Statuts et transitions

```
   ┌──────────┐  soumettre  ┌──────────┐  verifier  ┌──────────┐  valider  ┌──────────┐
   │ brouillon├────────────>│  soumis  ├──────────>│ verifie  ├─────────>│  valide  │
   └──────────┘             └────┬─────┘           └────┬─────┘          └────┬─────┘
                                 │                      │                     │
                          rejeter│  differer      rejeter│  differer          │ satisfaite
                                 │       │               │       │            v
                           ┌─────v───┐   │         ┌────v────┐  │     ┌───────────┐
                           │ rejete  │   │         │ rejete  │  │     │satisfaite │
                           └─────────┘   │         └─────────┘  │     └───────────┘
                                         v                      v
                                   ┌──────────┐          ┌──────────┐
                                   │ differe  │          │ differe  │
                                   └──────────┘          └──────────┘
```

**Statuts** : `brouillon`, `soumis`, `verifie`, `valide`, `satisfaite`, `rejete`, `differe`

## 6. Workflow de validation

| Etape                 | Role                       | Action                            | Details                                                   |
| --------------------- | -------------------------- | --------------------------------- | --------------------------------------------------------- |
| 1. Creation           | Agent                      | Cree EB depuis imputation validee | Pre-remplit objet, montant, direction depuis l'imputation |
| 2. Soumission         | Createur                   | Soumet l'EB                       | Passe en `soumis`                                         |
| 3. Verification CB    | CB (Controleur Budgetaire) | Verifie couverture budgetaire     | Passe en `verifie`                                        |
| 4. Validation DG/DAAF | DG, DAAF, ADMIN            | Valide l'EB                       | Passe en `valide`, prete pour passation de marche         |
| 5. Satisfaction       | Automatique                | PM creee depuis l'EB              | Passe en `satisfaite`                                     |

**Roles de verification** : `canVerifyEB()` — CB et roles similaires
**Roles de validation** : `canValidateEB()` — DG, DAAF, ADMIN

## 7. Donnees Supabase

| Table                | Colonnes cles                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expressions_besoin` | `id`, `numero`, `objet`, `montant_estime`, `direction_id`, `statut`, `imputation_id`, `dossier_id`, `exercice`, `created_by`, `submitted_at`, `verified_at`, `validated_at` |
| `imputations`        | Source (statut `valide`) — liee via `imputation_id`                                                                                                                         |
| `directions`         | `id`, `label`, `sigle`                                                                                                                                                      |
| `budget_lines`       | Ligne budgetaire via l'imputation                                                                                                                                           |

## 8. Hooks

| Hook                   | Fichier                             | Role                                                                                                                                    |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `useExpressionsBesoin` | `src/hooks/useExpressionsBesoin.ts` | Query paginee serveur + mutations : submit, verify, validate, reject, defer, resume, delete. Compteurs par statut. Imputations validees |
| `usePermissions`       | `src/hooks/usePermissions.ts`       | `canVerifyEB()`, `canValidateEB()`                                                                                                      |

## 9. Tests

- Tests E2E via Playwright
- Certification documentee dans `docs/CERTIFICATION_EXPRESSION_BESOIN.md`
- Verification : `npx vitest run`
