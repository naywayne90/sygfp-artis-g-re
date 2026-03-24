# Module Recettes — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Recettes** permet de declarer, valider et encaisser les recettes budgetaires de l'ARTI. Il comprend deux sous-vues : la liste des declarations et un etat recapitulatif par periode.

Les recettes encaissees alimentent la tresorerie via un lien avec les comptes bancaires.

## 2. Routes et acces

| Route       | Page                    | Composant                               |
| ----------- | ----------------------- | --------------------------------------- |
| `/recettes` | Declaration de Recettes | `pages/recettes/DeclarationRecette.tsx` |

## 3. Composants

| Composant          | Fichier                                 | Description                                       |
| ------------------ | --------------------------------------- | ------------------------------------------------- |
| DeclarationRecette | `pages/recettes/DeclarationRecette.tsx` | Page principale avec KPIs et onglets              |
| RecetteList        | `components/recettes/RecetteList.tsx`   | Liste des declarations avec CRUD, filtres, export |
| EtatRecettes       | `components/recettes/EtatRecettes.tsx`  | Etats recapitulatifs par periode                  |

## 4. Boutons et actions

### 4.1 Page Declaration de Recettes

| Bouton                   | Visible si | Action                 | Effet                              |
| ------------------------ | ---------- | ---------------------- | ---------------------------------- |
| Onglet Declarations      | Toujours   | Affiche `RecetteList`  | Liste des declarations de recettes |
| Onglet Etats par periode | Toujours   | Affiche `EtatRecettes` | Recapitulatif par periode          |

### 4.2 Composant RecetteList

| Bouton                     | Visible si                                     | Action                         | Effet                                                                               |
| -------------------------- | ---------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| Exporter                   | Toujours                                       | `exportCSV()`                  | Telecharge un CSV des recettes filtrees                                             |
| Nouvelle recette           | Toujours                                       | Ouvre le dialog de creation    | Formulaire : date, montant, origine, categorie, description, reference justificatif |
| Enregistrer                | Dialog creation, origine et montant renseignes | `handleSubmit()`               | Cree la recette (statut brouillon)                                                  |
| Annuler                    | Dialog creation                                | Ferme le dialog                | Aucun changement                                                                    |
| Oeil (icone par ligne)     | Toujours                                       | Ouvre le dialog de details     | Affiche les informations de la recette                                              |
| Valider (icone Check)      | Statut = brouillon                             | `validerRecette.mutate(id)`    | Passe la recette au statut "validee"                                                |
| Encaisser (icone Banknote) | Statut = validee                               | Ouvre le dialog d'encaissement | Permet de selectionner le compte bancaire                                           |
| Filtre origine             | Toujours                                       | Select de filtrage             | Filtre par origine                                                                  |
| Filtre statut              | Toujours                                       | Select de filtrage             | Filtre par statut (brouillon/validee/encaissee)                                     |

## 5. Statuts et transitions

```
brouillon --> validee --> encaissee
                     \--> annulee
```

- **brouillon** : declaration enregistree, modifiable
- **validee** : declaration confirmee, prete a encaisser
- **encaissee** : montant encaisse sur un compte bancaire (cree une operation de tresorerie)
- **annulee** : declaration annulee

## 6. Donnees Supabase

| Table      | Colonnes cles                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `recettes` | id, numero, date_recette, origine, categorie, description, montant, statut (brouillon/validee/encaissee/annulee), reference_justificatif, date_encaissement, compte_id, exercice |

Les origines et categories sont definies dans le hook :

- **Origines** : definies dans `ORIGINES_RECETTES` (constante du hook)
- **Categories** : definies dans `CATEGORIES_RECETTES` (constante du hook)

## 7. Hooks

| Hook            | Fichier                  | Description                                                                                                                       |
| --------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `useRecettes`   | `hooks/useRecettes.ts`   | CRUD recettes, validerRecette, encaisserRecette, stats (totalRecettes, totalEncaisse, tauxRecouvrement, nbRecettes, nbEncaissees) |
| `useTresorerie` | `hooks/useTresorerie.ts` | Comptes bancaires (pour le dialog d'encaissement)                                                                                 |
