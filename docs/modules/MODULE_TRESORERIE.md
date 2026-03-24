# Module Tresorerie — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Tresorerie** gere les comptes bancaires, les operations de tresorerie, le plan previsionnel et les paiements a venir. Il fournit une vision en temps reel de la position de tresorerie de l'ARTI, avec des KPIs sur les taux de paiement et d'execution globale.

Le module comprend aussi des pages satellites pour les mouvements bancaires et les approvisionnements de comptes.

## 2. Routes et acces

| Route                                   | Page                         | Composant                                       |
| --------------------------------------- | ---------------------------- | ----------------------------------------------- |
| `/tresorerie`                           | Tresorerie (dashboard)       | `pages/tresorerie/GestionTresorerie.tsx`        |
| `/tresorerie/mouvements-banque`         | Mouvements bancaires         | `pages/tresorerie/MouvementsBanque.tsx`         |
| `/tresorerie/approvisionnements-banque` | Approvisionnements bancaires | `pages/tresorerie/ApprovisionnementsBanque.tsx` |
| `/tresorerie/approvisionnements-caisse` | Approvisionnements caisse    | `pages/tresorerie/ApprovisionnementsCaisse.tsx` |
| `/tresorerie/mouvements-caisse`         | Mouvements caisse            | `pages/tresorerie/MouvementsCaisse.tsx`         |

## 3. Composants

| Composant                | Fichier                                             | Description                            |
| ------------------------ | --------------------------------------------------- | -------------------------------------- |
| GestionTresorerie        | `pages/tresorerie/GestionTresorerie.tsx`            | Page principale avec KPIs et 4 onglets |
| CompteBancaireList       | `components/tresorerie/CompteBancaireList.tsx`      | Liste des comptes bancaires            |
| OperationTresorerieList  | `components/tresorerie/OperationTresorerieList.tsx` | Liste des operations                   |
| PlanTresorerie           | `components/tresorerie/PlanTresorerie.tsx`          | Plan de tresorerie previsionnel        |
| PaiementsAVenir          | `components/tresorerie/PaiementsAVenir.tsx`         | Ordonnancements en attente de paiement |
| MouvementsBanque         | `pages/tresorerie/MouvementsBanque.tsx`             | Entrees/sorties bancaires              |
| ApprovisionnementsBanque | `pages/tresorerie/ApprovisionnementsBanque.tsx`     | Approvisionnements comptes bancaires   |
| ApprovisionnementsCaisse | `pages/tresorerie/ApprovisionnementsCaisse.tsx`     | Approvisionnements caisse              |
| MouvementsCaisse         | `pages/tresorerie/MouvementsCaisse.tsx`             | Mouvements de caisse                   |

## 4. Boutons et actions

### 4.1 Page principale Tresorerie

| Bouton                    | Visible si | Action                            | Effet                                            |
| ------------------------- | ---------- | --------------------------------- | ------------------------------------------------ |
| Onglet Paiements a venir  | Toujours   | Affiche `PaiementsAVenir`         | Liste des ordonnancements a payer, avec compteur |
| Onglet Comptes bancaires  | Toujours   | Affiche `CompteBancaireList`      | CRUD comptes bancaires                           |
| Onglet Operations         | Toujours   | Affiche `OperationTresorerieList` | Liste des operations (entrees/sorties)           |
| Onglet Plan de tresorerie | Toujours   | Affiche `PlanTresorerie`          | Previsions 7j / 30j / 90j                        |

Les boutons de CRUD (Nouveau compte, Nouvelle operation, etc.) se trouvent dans chaque sous-composant.

## 5. Statuts et transitions

### 5.1 Operations de tresorerie

Les operations n'ont pas de workflow de validation : elles sont enregistrees directement et mettent a jour le solde du compte.

### 5.2 Rapprochement bancaire

```
non rapprochee --> rapprochee
```

Le champ `rapproche` (boolean) marque une operation comme correspondant au releve bancaire.

## 6. Donnees Supabase

| Table                   | Colonnes cles                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `comptes_bancaires`     | id, code, libelle, banque, numero_compte, iban, bic, type_compte (courant/epargne/caisse/special), devise, solde_initial, solde_actuel, est_actif |
| `operations_tresorerie` | id, compte_id, type_operation (entree/sortie/virement), montant, date_operation, date_valeur, libelle, reference, reglement_id, rapproche         |

## 7. Hooks

| Hook             | Fichier                   | Description                                                                          |
| ---------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| `useTresorerie`  | `hooks/useTresorerie.ts`  | Comptes, operations, stats (soldeTotal, entreeMois, sortieMois, comptesActifs)       |
| `usePaymentKPIs` | `hooks/usePaymentKPIs.ts` | Position tresorerie (nb_ordres_a_payer), KPIs (taux_paiement, taux_execution_global) |
