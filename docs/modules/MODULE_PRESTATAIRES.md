# Module Prestataires & Contrats — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Prestataires & Contrats** gere le referentiel des fournisseurs et le suivi des contrats de l'ARTI. Il comprend :

- **Prestataires** : qualification, suivi documentaire, gestion bancaire, import/export
- **Contrats** : creation, suivi du cycle de vie, lien avec marches et engagements

## 2. Routes et acces

| Route                                         | Page                    | Composant                                             |
| --------------------------------------------- | ----------------------- | ----------------------------------------------------- |
| `/contractualisation/prestataires`            | Prestataires            | `pages/contractualisation/Prestataires.tsx`           |
| `/contractualisation/contrats`                | Gestion des Contrats    | `pages/contractualisation/Contrats.tsx`               |
| `/contractualisation/validation-prestataires` | Validation des demandes | `pages/contractualisation/ValidationPrestataires.tsx` |
| `/contractualisation/demande-prestataire`     | Formulaire de demande   | `pages/contractualisation/DemandePrestataire.tsx`     |

## 3. Composants

| Composant                | Fichier                                                | Description                  |
| ------------------------ | ------------------------------------------------------ | ---------------------------- |
| Prestataires             | `pages/contractualisation/Prestataires.tsx`            | Page principale prestataires |
| Contrats                 | `pages/contractualisation/Contrats.tsx`                | Page principale contrats     |
| SupplierIdentityTab      | `components/prestataires/SupplierIdentityTab.tsx`      | Onglet identite fournisseur  |
| SupplierBankTab          | `components/prestataires/SupplierBankTab.tsx`          | Onglet coordonnees bancaires |
| SupplierDocumentsTab     | `components/prestataires/SupplierDocumentsTab.tsx`     | Onglet documents fiscaux     |
| SupplierHistoryTab       | `components/prestataires/SupplierHistoryTab.tsx`       | Onglet historique            |
| PrestatairesImportDialog | `components/prestataires/PrestatairesImportDialog.tsx` | Dialog import Excel          |
| PrestatairesExportButton | `components/prestataires/PrestatairesExportButton.tsx` | Bouton export avec formats   |
| ContratList              | `components/contrats/ContratList.tsx`                  | Liste des contrats avec CRUD |
| ContratDetails           | `components/contrats/ContratDetails.tsx`               | Detail d'un contrat          |

## 4. Boutons et actions

### 4.1 Page Prestataires

| Bouton                              | Visible si                        | Action                                                     | Effet                                    |
| ----------------------------------- | --------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Recherche (champ)                   | Toujours                          | Filtre par nom, code, email, NINEA                         | Filtre la liste en temps reel            |
| Exporter (PrestatairesExportButton) | Toujours                          | Export des prestataires filtres                            | Telecharge CSV/Excel/PDF                 |
| Import Excel                        | Toujours                          | Ouvre `PrestatairesImportDialog`                           | Import en masse depuis Excel             |
| Panier (lien)                       | Toujours                          | Navigue vers `/contractualisation/validation-prestataires` | Affiche le compteur demandes en attente  |
| Nouveau prestataire (lien)          | Toujours                          | Navigue vers `/contractualisation/demande-prestataire`     | Formulaire de creation                   |
| Oeil (icone par ligne)              | Toujours                          | Ouvre le dialog details avec 5 onglets                     | Affiche la fiche complete                |
| Copier code (icone)                 | Toujours                          | Copie le code dans le presse-papiers                       | Toast de confirmation                    |
| Suspendre                           | Dialog details, statut = ACTIF    | `suspendSupplier()`                                        | Ouvre le dialog de suspension avec motif |
| Reactiver                           | Dialog details, statut = SUSPENDU | `activateSupplier()`                                       | Reactive le prestataire                  |
| Confirmer la suspension             | Dialog suspension, motif saisi    | `handleSuspend()`                                          | Suspend le prestataire                   |
| Annuler                             | Dialog suspension                 | Ferme le dialog                                            | Aucun changement                         |

### 4.2 Page Contrats

| Bouton                 | Visible si | Action                      | Effet                                                    |
| ---------------------- | ---------- | --------------------------- | -------------------------------------------------------- |
| Exporter               | Toujours   | `exportCSV()`               | Telecharge un CSV des contrats filtres                   |
| Nouveau contrat        | Toujours   | Ouvre le dialog de creation | Formulaire avec type, prestataire, objet, montant, dates |
| Oeil (icone par ligne) | Toujours   | Ouvre `ContratDetails`      | Detail du contrat                                        |
| Filtres type/statut    | Toujours   | Select de filtrage          | Filtre la liste par type ou statut                       |

## 5. Statuts et transitions

### 5.1 Prestataires

```
NOUVEAU --> EN_QUALIFICATION --> ACTIF
                            \--> REFUSE
ACTIF --> SUSPENDU (via motif)
SUSPENDU --> ACTIF (reactivation)
```

### 5.2 Demandes de prestataires (`prestataire_requests`)

```
ENREGISTRE --> EN_VERIF --> VALIDE
                       \--> REFUSE
```

### 5.3 Contrats

```
brouillon --> en_negociation --> signe --> en_cours --> termine
                            \--> annule
                                 en_cours --> resilie
```

## 6. Donnees Supabase

| Table                         | Colonnes cles                                                                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prestataires`                | id, code, raison_sociale, sigle, forme_juridique, rccm, ninea, nif, adresse, ville, telephone, email, contact_nom, contact_fonction, contact_telephone, contact_email, statut, qualification_status, secteur_principal_id, banque, numero_compte, mode_paiement |
| `prestataire_requests`        | id, raison_sociale, statut, source (PUBLIC_LINK/INTERNE/IMPORT)                                                                                                                                                                                                 |
| `supplier_documents`          | id, supplier_id, type_document, date_expiration, statut                                                                                                                                                                                                         |
| `supplier_bank_accounts`      | id, supplier_id, banque, code_banque, code_guichet, numero_compte, cle_rib, iban, bic_swift, titulaire, est_principal                                                                                                                                           |
| `supplier_required_documents` | id, code, libelle, est_obligatoire, a_date_expiration, rappel_jours_defaut                                                                                                                                                                                      |
| `contrats`                    | id, numero, prestataire_id, type_contrat, objet, montant_initial, montant_actuel, date_signature, date_notification, date_debut, date_fin, delai_execution, statut, marche_id, engagement_id, exercice                                                          |
| `secteurs_activite`           | id, libelle                                                                                                                                                                                                                                                     |

## 7. Hooks

| Hook                          | Fichier                            | Description                                     |
| ----------------------------- | ---------------------------------- | ----------------------------------------------- |
| `usePrestataires`             | `hooks/usePrestataires.ts`         | Liste, stats, suspendSupplier, activateSupplier |
| `usePrestaireRequests`        | `hooks/usePrestataires.ts`         | Stats demandes (enregistre, enVerif)            |
| `useSupplierExpiredDocuments` | `hooks/useSupplierDocuments.ts`    | Compteurs documents expires / a renouveler      |
| `useSupplierDocuments`        | `hooks/useSupplierDocuments.ts`    | CRUD documents d'un prestataire                 |
| `useSupplierBankAccounts`     | `hooks/useSupplierBankAccounts.ts` | CRUD comptes bancaires                          |
| `useSecteursActivite`         | `hooks/useSecteursActivite.ts`     | Referentiel secteurs d'activite                 |
| `useContrats`                 | `hooks/useContrats.ts`             | CRUD contrats, types, statuts                   |
