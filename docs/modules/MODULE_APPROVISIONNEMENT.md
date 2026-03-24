# Module Approvisionnement — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Approvisionnement** gere les stocks de fournitures et consommables de l'ARTI. Il couvre le cycle complet : catalogue d'articles, demandes d'achat, receptions, mouvements de stock et inventaires. Cinq onglets organisent la page principale.

## 2. Routes et acces

| Route                | Page              | Composant                                       |
| -------------------- | ----------------- | ----------------------------------------------- |
| `/approvisionnement` | Approvisionnement | `pages/approvisionnement/Approvisionnement.tsx` |

## 3. Composants

| Composant         | Fichier                                             | Description                          |
| ----------------- | --------------------------------------------------- | ------------------------------------ |
| Approvisionnement | `pages/approvisionnement/Approvisionnement.tsx`     | Page principale avec KPIs et onglets |
| ArticleList       | `components/approvisionnement/ArticleList.tsx`      | Catalogue des articles               |
| DemandeAchatList  | `components/approvisionnement/DemandeAchatList.tsx` | Liste des demandes d'achat           |
| ReceptionList     | `components/approvisionnement/ReceptionList.tsx`    | Liste des receptions                 |
| MouvementList     | `components/approvisionnement/MouvementList.tsx`    | Liste des mouvements de stock        |
| InventaireList    | `components/approvisionnement/InventaireList.tsx`   | Liste des inventaires                |

## 4. Boutons et actions

| Bouton             | Visible si | Action                     | Effet                                     |
| ------------------ | ---------- | -------------------------- | ----------------------------------------- |
| Onglet Articles    | Toujours   | Affiche `ArticleList`      | Catalogue des articles avec CRUD          |
| Onglet Demandes    | Toujours   | Affiche `DemandeAchatList` | Demandes d'achat (creation, validation)   |
| Onglet Receptions  | Toujours   | Affiche `ReceptionList`    | Receptions de marchandises                |
| Onglet Mouvements  | Toujours   | Affiche `MouvementList`    | Entrees, sorties, transferts, ajustements |
| Onglet Inventaires | Toujours   | Affiche `InventaireList`   | Inventaires physiques                     |

Les boutons de CRUD (Nouvel article, Nouvelle demande, etc.) se trouvent dans chaque sous-composant (ArticleList, DemandeAchatList, etc.).

## 5. Statuts et transitions

### 5.1 Demandes d'achat

```
brouillon --> soumis --> validee --> en_commande --> livree
                    \--> refusee
```

### 5.2 Receptions

```
en_attente --> validee
```

La validation d'une reception cree automatiquement les mouvements d'entree en stock.

### 5.3 Inventaires

```
brouillon --> valide --> cloture
```

## 6. Donnees Supabase

| Table                  | Colonnes cles                                                                                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles`             | id, code, libelle, description, unite, categorie, seuil_mini, stock_actuel, prix_unitaire_moyen, emplacement, est_actif                                               |
| `demandes_achat`       | id, numero, objet, justification, urgence (normale/urgent/tres_urgent), statut, montant_estime, direction_id                                                          |
| `demande_achat_lignes` | id, demande_id, article_id, designation, quantite, unite, prix_unitaire_estime                                                                                        |
| `receptions`           | id, numero, demande_id, fournisseur, numero_bl, numero_facture, statut                                                                                                |
| `reception_lignes`     | id, reception_id, article_id, quantite_commandee, quantite_recue, quantite_acceptee, ecart, motif_ecart, prix_unitaire                                                |
| `mouvements_stock`     | id, numero, type_mouvement (entree/sortie/transfert/ajustement), article_id, quantite, stock_avant, stock_apres, motif, reference_document, destination, beneficiaire |
| `inventaires`          | id, numero, date_inventaire, libelle, observations, statut, cloture_at                                                                                                |
| `inventaire_lignes`    | id, inventaire_id, article_id, stock_theorique, stock_physique, ecart, justification, ajustement_effectue                                                             |

## 7. Hooks

| Hook                   | Fichier                         | Description                                                                                   |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `useApprovisionnement` | `hooks/useApprovisionnement.ts` | Hook principal : articles, demandes, receptions, mouvements, inventaires, stats, CRUD complet |
