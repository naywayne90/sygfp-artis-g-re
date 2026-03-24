# Module Comptabilite Matiere — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Comptabilite Matiere** est destine au suivi des immobilisations, des stocks et des mouvements de biens materiels de l'ARTI. Il est actuellement en cours de developpement : la page affiche une structure avec 4 KPIs (tous a zero) et un message "Module en cours de developpement".

## 2. Routes et acces

| Route                                      | Page                 | Composant                                          |
| ------------------------------------------ | -------------------- | -------------------------------------------------- |
| `/contractualisation/comptabilite-matiere` | Comptabilite Matiere | `pages/contractualisation/ComptabiliteMatiere.tsx` |

## 3. Composants

| Composant           | Fichier                                            | Description                             |
| ------------------- | -------------------------------------------------- | --------------------------------------- |
| ComptabiliteMatiere | `pages/contractualisation/ComptabiliteMatiere.tsx` | Page placeholder avec KPIs et etat vide |

## 4. Boutons et actions

| Bouton                 | Visible si | Action | Effet                                         |
| ---------------------- | ---------- | ------ | --------------------------------------------- |
| _(aucun bouton actif)_ | -          | -      | Le module est un placeholder sans interaction |

La page affiche uniquement 4 cartes KPI statiques (Immobilisations, Articles en stock, Mouvements, Inventaires) et un message indiquant que le module est en cours de developpement.

## 5. Statuts et transitions

Non implemente. Le module est prevu pour gerer les immobilisations et mouvements de materiels mais n'a pas encore de workflow defini dans le code.

## 6. Donnees Supabase

| Table                   | Colonnes cles                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| _(aucune table dediee)_ | Le module ne consulte actuellement aucune table Supabase. Il utilise `useExercice()` pour l'exercice courant uniquement. |

A terme, ce module pourrait s'appuyer sur les tables du module Approvisionnement (`articles`, `mouvements_stock`, `inventaires`) ou sur des tables dediees aux immobilisations.

## 7. Hooks

| Hook          | Fichier                       | Description                               |
| ------------- | ----------------------------- | ----------------------------------------- |
| `useExercice` | `contexts/ExerciceContext.ts` | Contexte de l'exercice budgetaire courant |

Aucun hook metier dedie n'existe encore pour ce module.
