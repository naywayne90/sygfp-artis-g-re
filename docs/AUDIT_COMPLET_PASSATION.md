# Audit Complet Module Passation/Marche -- SYGFP

**Date** : 16 fevrier 2026
**Auditeur** : Claude Code
**Organisation** : ARTI -- Autorite de Regulation du Transport Interieur (Cote d'Ivoire)
**Systeme** : SYGFP -- Systeme de Gestion Financiere et de Planification
**Module** : Passation de Marche (Etape 5/9 -- Chaine de depense)
**Statut** : AUDIT INITIAL -- NE PAS DEPLOYER

---

## 1. Score Global

| Critere               | Score      | Details                                                                      |
| --------------------- | ---------- | ---------------------------------------------------------------------------- |
| Build / TypeScript    | 10/15      | Build OK, 0 erreurs TS mais `@ts-nocheck` sur hook principal                 |
| Securite / RBAC       | 0/20       | AUCUN controle de role sur les actions. RLS critique cassee                  |
| Architecture          | 5/15       | Deux modules paralleles incompatibles pour la meme etape                     |
| Integrite des donnees | 5/15       | 16 marches orphelins, toutes tables enfants vides                            |
| Workflow              | 5/10       | Deux workflows differents, jamais utilises en production                     |
| Qualite frontend      | 8/15       | 7091 lignes, 48 `any`, composants dupliques                                  |
| Integration chaine    | 2/10       | Aucun lien EB→Marche en donnees. Engagement pointe `passation_marche` (vide) |
| **TOTAL**             | **35/100** | **Module non fonctionnel en production**                                     |

---

## 2. Constat Principal : DEUX MODULES PARALLELES

Le probleme structurel majeur est la coexistence de **deux implementations independantes** pour la meme etape 5 de la chaine de depense :

| Aspect              | Module `marches/`                                | Module `passation-marche/`                             |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| **Table DB**        | `marches` (42 colonnes, 16 lignes)               | `passation_marche` (30 colonnes, **0 lignes**)         |
| **Hook**            | `useMarches.ts` (512 lignes)                     | `usePassationsMarche.ts` (380 lignes, `@ts-nocheck`)   |
| **Page**            | `src/pages/Marches.tsx` (299 lignes)             | `src/pages/execution/PassationMarche.tsx` (579 lignes) |
| **Route**           | `/marches`                                       | `/execution/passation-marche`                          |
| **Sidebar**         | OUI (step 5, badge)                              | NON (accessible par URL uniquement)                    |
| **Composants**      | 10 fichiers (2433 lignes)                        | 7 fichiers (2547 lignes)                               |
| **Source donnees**  | Notes DG imputees (`notes_dg`)                   | Expressions de besoin validees                         |
| **Offres**          | Table relationnelle `marche_offres`              | JSON (`prestataires_sollicites`)                       |
| **Documents**       | Tables `marche_documents` + `marche_attachments` | JSON (`pieces_jointes`) + checklist                    |
| **Workflow**        | 4 etapes (ASSISTANT_SDPM → SDPM → SDCT → CB)     | Simple (brouillon → soumis → valide/rejete)            |
| **Lien engagement** | Non implemente                                   | `navigate('/engagements?sourcePM=...')`                |
| **Donnees**         | 16 marches (14 legacy + 2 test)                  | **0**                                                  |

### Verdict

Le module `passation-marche/` est plus recent, mieux connecte a la chaine (EB→PM→Engagement), et fonctionnellement plus riche (allotissement, decisions de sortie, checklist par mode, timeline). Le module `marches/` est plus ancien, present dans la sidebar, et contient les 16 marches migres.

**Recommandation** : Fusionner les deux en conservant `passation-marche/` comme base et en migrant les 16 marches existants.

---

## 3. Architecture DB Complete

### 3.1 Tables principales

| #   | Table                   | Colonnes | Lignes  | RLS     | Description                                 |
| --- | ----------------------- | -------- | ------- | ------- | ------------------------------------------- |
| 1   | `marches`               | 42       | **16**  | ENABLED | Table principale marches publics (ancienne) |
| 2   | `passation_marche`      | 30       | **0**   | ENABLED | Passation liee aux EB (nouvelle, vide)      |
| 3   | `marche_offres`         | 14       | **0**   | ENABLED | Offres prestataires (notes tech/fin)        |
| 4   | `marche_lots`           | 12       | **0**   | ENABLED | Allotissement des marches                   |
| 5   | `soumissions`           | 17       | **0**   | ENABLED | Soumissions formelles sur lots              |
| 6   | `marche_validations`    | 11       | **0**   | ENABLED | Etapes workflow validation                  |
| 7   | `marche_documents`      | 12       | **0**   | ENABLED | Documents structures par type               |
| 8   | `marche_historique`     | 9        | **14**  | ENABLED | Historique auto (triggers)                  |
| 9   | `marche_attachments`    | 9        | **0**   | ENABLED | Pieces jointes basiques                     |
| 10  | `marche_sequences`      | 4        | **1**   | --      | Sequence MKT-YYYY-NNNN (dernier=14)         |
| 11  | `contrats`              | 20       | **0**   | ENABLED | Contrats signes                             |
| 12  | `avenants`              | 14       | **0**   | ENABLED | Avenants aux contrats                       |
| 13  | `contrat_attachments`   | 8        | **0**   | ENABLED | PJ contrats                                 |
| 14  | `contrat_sequences`     | 4        | **0**   | --      | Sequence CTR-YYYY-NNNN                      |
| 15  | `prestataires`          | 31       | **431** | ENABLED | Referentiel fournisseurs (migre)            |
| 16  | `prestataire_requests`  | 22       | **0**   | ENABLED | Demandes ajout prestataire                  |
| 17  | `ref_secteurs_activite` | 8        | **15**  | ENABLED | Secteurs d'activite                         |

**Total : 17 tables, 478 enregistrements (dont 431 prestataires)**

### 3.2 Schema des relations (FK)

```
expressions_besoin ──expression_besoin_id──→ marches ──note_id──→ notes_dg
       │                                       │
       │ expression_besoin_id                  │ prestataire_id
       ▼                                       ▼
  passation_marche                        prestataires ←── marche_offres
       │                                       ▲            marche_lots
       │ dossier_id                            │            soumissions
       ▼                                       │            contrats
    dossiers                                   │
                                               │
  budget_engagements ──passation_marche_id──→ passation_marche
  budget_engagements ──marche_id───────────→ marches

  marche_offres ──→ marches (marche_id)
  marche_lots ──→ marches (marche_id)
  marche_validations ──→ marches (marche_id)
  marche_documents ──→ marches (marche_id)
  marche_historique ──→ marches (marche_id)
  soumissions ──→ marche_lots (lot_id)
  contrats ──→ marches (marche_id)
  avenants ──→ contrats (contrat_id)
```

### 3.3 Donnees existantes (16 marches)

| Champ                     | Valeur                                  |
| ------------------------- | --------------------------------------- |
| Par exercice              | 2024: 14 (legacy), 2026: 2 (test)       |
| Par statut                | `en_preparation`: 15, `attribue`: 1     |
| Par validation_status     | `en_attente`: **16/16** (aucun valide)  |
| Par type_marche           | `fourniture`: 16/16 (valeur par defaut) |
| Par mode_passation        | `gre_a_gre`: 16/16 (valeur par defaut)  |
| Montant total             | 319 668 586 FCFA                        |
| Avec expression_besoin_id | **0/16**                                |
| Avec dossier_id           | **0/16**                                |
| Avec prestataire_id       | **1/16**                                |
| Avec created_by           | **2/16** (14 imports sans createur)     |

### 3.4 Vues

| Vue                          | Etat          | Probleme                                                                    |
| ---------------------------- | ------------- | --------------------------------------------------------------------------- |
| `v_marches_stats`            | Fonctionnelle | --                                                                          |
| `prestataires_actifs`        | **CASSEE**    | Filtre `WHERE statut = 'ACTIF'` mais donnees ont `statut = 'actif'` (casse) |
| `notes_imputees_disponibles` | Fonctionnelle | 1 resultat                                                                  |

### 3.5 Triggers et fonctions

| Trigger                                   | Table              | Description                                     |
| ----------------------------------------- | ------------------ | ----------------------------------------------- |
| `trg_generate_marche_numero`              | `marches`          | Auto-numerotation MKT-YYYY-NNNN                 |
| `trg_generate_passation_marche_reference` | `passation_marche` | Auto-reference PM-YYYY-DIR-NNNN                 |
| `trg_log_marche_status`                   | `marches`          | Log changements dans `marche_historique`        |
| `trg_marche_validation_complete`          | `marches`          | Mise a jour dossier + creation etape engagement |
| `trg_marche_created`                      | `marches`          | Log creation dans `marche_historique`           |
| `trg_update_dossier_on_passation_marche`  | `passation_marche` | MAJ `dossiers.etape_courante = 'marche'`        |

| Fonction                         | Description                              |
| -------------------------------- | ---------------------------------------- |
| `check_marche_prerequisites()`   | Verifie EB validee avant creation marche |
| `create_engagement_from_eb()`    | Cree engagement depuis EB validee        |
| `validate_prestataire_request()` | Valide demande prestataire               |
| `import_prestataires()`          | Import en masse depuis Excel/JSON        |

---

## 4. Architecture Frontend Complete

### 4.1 Arbre des composants (23 fichiers / 7 091 lignes)

```
src/
├── pages/
│   ├── Marches.tsx (299 lignes)
│   │   ├── MarcheForm
│   │   ├── MarcheList
│   │   ├── MarcheDetails
│   │   │   ├── MarcheOffresTab
│   │   │   ├── MarcheDocumentsTab
│   │   │   └── MarcheHistoriqueTab
│   │   ├── MarcheValidateDialog
│   │   ├── MarcheRejectDialog
│   │   └── MarcheDeferDialog
│   │
│   └── execution/
│       └── PassationMarche.tsx (579 lignes)
│           ├── PassationMarcheForm (890 lignes - le plus gros)
│           ├── PassationDetails
│           │   ├── PassationChecklist
│           │   └── PassationTimeline
│           ├── PassationValidateDialog
│           ├── PassationRejectDialog
│           └── PassationDeferDialog
│
├── hooks/
│   ├── useMarches.ts (512 lignes) → table `marches`
│   ├── usePassationsMarche.ts (380 lignes, @ts-nocheck) → table `passation_marche`
│   ├── useMarcheOffres.ts (193 lignes) → table `marche_offres`
│   └── useMarcheDocuments.ts (148 lignes) → tables `marche_documents`, `marche_historique`
│
└── components/
    ├── marches/ (10 fichiers, 2433 lignes)
    │   ├── MarcheForm.tsx (504)
    │   ├── MarcheList.tsx (238)
    │   ├── MarcheDetails.tsx (244)
    │   ├── MarcheOffresList.tsx (402) ← code mort ?
    │   ├── MarcheOffresTab.tsx (371) ← duplique MarcheOffresList
    │   ├── MarcheDocumentsTab.tsx (223)
    │   ├── MarcheHistoriqueTab.tsx (161)
    │   ├── MarcheValidateDialog.tsx (98)
    │   ├── MarcheRejectDialog.tsx (87)
    │   └── MarcheDeferDialog.tsx (105)
    │
    └── passation-marche/ (7 fichiers + barrel, 2547 lignes)
        ├── index.ts (barrel export)
        ├── PassationMarcheForm.tsx (890)
        ├── PassationDetails.tsx (547)
        ├── PassationChecklist.tsx (291)
        ├── PassationTimeline.tsx (294)
        ├── PassationValidateDialog.tsx (174)
        ├── PassationRejectDialog.tsx (153)
        └── PassationDeferDialog.tsx (198)
```

### 4.2 Hooks -- Detail des queries Supabase

**useMarches.ts** :

- 5 useQuery IDENTIQUES sur `marches` (all, a_valider, valides, rejetes, differes) avec filtrage client → performance N+1
- SELECT `prestataires` WHERE statut='actif'
- SELECT `notes_dg` WHERE statut='impute' (join direction)
- Mutations : createMarche, validateStep, rejectMarche, deferMarche, resumeMarche

**usePassationsMarche.ts** (`@ts-nocheck`) :

- SELECT `passation_marche` avec 4 joins (EB, dossier, prestataire, createur)
- SELECT `expressions_besoin` WHERE statut='valide' (exclusion des EB deja utilisees)
- Mutations : create, update, submit, validate, reject, defer, delete

**useMarcheOffres.ts** :

- SELECT `marche_offres` join `prestataires`
- Note globale calculee a **60% tech + 40% fin** (different du 70/30 documente)

**useMarcheDocuments.ts** :

- SELECT `marche_documents`, `marche_historique`
- User join force a `null` dans historique

### 4.3 Types TypeScript

| Type              | Fichier                | Qualite                                           |
| ----------------- | ---------------------- | ------------------------------------------------- |
| `Marche`          | useMarches.ts          | 25 champs, types precis                           |
| `MarcheFormData`  | useMarches.ts          | 15 champs, OK                                     |
| `Prestataire`     | useMarches.ts          | 28 champs, OK                                     |
| `MarcheOffre`     | useMarcheOffres.ts     | 17 champs, OK                                     |
| `PassationMarche` | usePassationsMarche.ts | 30+ champs, 4 joins -- **masque par @ts-nocheck** |
| `EBValidee`       | usePassationsMarche.ts | 7 champs -- **masque par @ts-nocheck**            |

---

## 5. Resultats QA

| Check              | Resultat                                                           |
| ------------------ | ------------------------------------------------------------------ |
| `npx tsc --noEmit` | **0 erreurs** (mais `@ts-nocheck` masque `usePassationsMarche.ts`) |
| `npx vite build`   | **OK** en 38s (`PassationMarche-BkECvL0P.js` = 66.75 kB)           |
| ESLint erreurs     | **1** (`@ts-nocheck`)                                              |
| ESLint warnings    | **60** (48 `any`, 5 unused vars, 3 non-null, 2 deps, 2 refresh)    |
| `@ts-nocheck`      | **1 fichier** (`usePassationsMarche.ts`)                           |
| Routes declarees   | `/marches` + `/execution/passation-marche`                         |
| Sidebar            | `/marches` visible (step 5, badge `marchesEnCours`)                |

---

## 6. Problemes P0 (Bloquants)

| #        | Probleme                                          | Impact                                                      | Fichier(s)                                                               |
| -------- | ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| **P0-1** | **Deux modules concurrents** pour l'etape 5       | Confusion utilisateur, donnees eclatees entre 2 tables      | `marches/` vs `passation-marche/`                                        |
| **P0-2** | **AUCUN controle RBAC** sur les validations       | Tout utilisateur peut valider/rejeter n'importe quel marche | `PassationMarche.tsx:550` (`canValidate={true}` hardcode), `Marches.tsx` |
| **P0-3** | **`@ts-nocheck`** sur le hook principal passation | 380 lignes sans aucune verification de type                 | `usePassationsMarche.ts:1`                                               |
| **P0-4** | **Upload de fichiers simule**                     | `setTimeout(1000)` au lieu d'upload reel vers Storage       | `PassationChecklist.tsx:132-133`                                         |
| **P0-5** | **Policy RLS `marches_select` cassee**            | Reference colonne `direction_id` inexistante dans `marches` | Migration `20260118200000`                                               |
| **P0-6** | **Vue `prestataires_actifs` vide**                | Filtre `'ACTIF'` vs donnees `'actif'` (casse)               | Vue SQL                                                                  |

---

## 7. Problemes P1 (Importants)

| #         | Probleme                                          | Detail                                                                               |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **P1-1**  | `MarcheOffresList` et `MarcheOffresTab` dupliques | 402+371 = 773 lignes pour la meme fonctionnalite                                     |
| **P1-2**  | Queries N+1 dans `useMarches`                     | 5 useQuery chargent la meme table `marches`                                          |
| **P1-3**  | Prestataire non charge dans query marches         | `select("*")` sans jointure, `marche.prestataire?.raison_sociale` toujours undefined |
| **P1-4**  | Historique user toujours null                     | `useMarcheDocuments.ts:88` force `user: null`                                        |
| **P1-5**  | Route passation absente du sidebar                | `/execution/passation-marche` non accessible depuis la navigation                    |
| **P1-6**  | Types Supabase non regeneres                      | `passation_marche` dans les types ne correspond plus a la table reelle               |
| **P1-7**  | `as any` massifs dans mutations                   | useMarches.ts utilise `as any` sur tous les inserts/updates                          |
| **P1-8**  | Bouton "Reprendre" non implemente                 | `Marches.tsx:245-247` callback vide                                                  |
| **P1-9**  | Ponderation offres incoherente                    | `useMarcheOffres`: 60/40, TRANSITION doc: 70/30, `PassationMarcheForm`: configurable |
| **P1-10** | 14/16 marches sans `created_by`                   | Policy UPDATE bloquee pour les imports legacy                                        |
| **P1-11** | Aucun marche lie a un dossier ou EB               | `expression_besoin_id = NULL` et `dossier_id = NULL` sur 16/16                       |
| **P1-12** | Double systeme de statut                          | `statut` (en_preparation/attribue) + `validation_status` (en_attente/valide/rejete)  |

---

## 8. Problemes P2 (Mineurs)

| #     | Probleme                                           | Detail                                                             |
| ----- | -------------------------------------------------- | ------------------------------------------------------------------ |
| P2-1  | Double systeme de toast                            | `useToast()` vs `sonner.toast()`                                   |
| P2-2  | `formatMontant` duplique dans 10+ fichiers         | Pas de centralisation                                              |
| P2-3  | Modes de passation incoherents entre les 2 modules | TYPES_PROCEDURE vs MODES_PASSATION (listes differentes)            |
| P2-4  | Documents requis dupliques                         | DOCUMENTS_REQUIS vs DOCUMENTS_PAR_MODE                             |
| P2-5  | Pas de pagination                                  | Toutes les queries chargent tout sans LIMIT                        |
| P2-6  | `selectWinner` change le statut directement        | Contourne le workflow 4 etapes                                     |
| P2-7  | Double table pieces jointes                        | `marche_attachments` + `marche_documents`                          |
| P2-8  | FK `uploaded_by` inconsistante                     | `auth.users(id)` dans documents vs `profiles(id)` dans attachments |
| P2-9  | Sequence desynchronisee                            | dernier_numero=14 mais numeros MKT-2025-000x existent              |
| P2-10 | 5 variables `error` non utilisees (ESLint)         | Destructurees mais jamais affichees                                |

---

## 9. Migrations SQL existantes (10 fichiers cles)

| #   | Fichier                                   | Date  | Contenu                                                                                                                 |
| --- | ----------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | `20260105200231_d780feba...sql`           | 05/01 | CREATE `marche_validations`, `marche_attachments`, `marche_sequences`. Trigger numerotation                             |
| 2   | `20260106070032_62a699e0...sql`           | 06/01 | CREATE `marche_lots`, `soumissions`, `contrats`, `avenants`, `contrat_attachments/sequences`                            |
| 3   | `20260106153944_324de729...sql`           | 06/01 | CREATE `marche_offres`. ALTER `marches` (calendrier, commission). Vue `notes_imputees_disponibles`                      |
| 4   | `20260107140258_da43a67f...sql`           | 07/01 | CREATE `ref_secteurs_activite`. ALTER `prestataires` (secteurs)                                                         |
| 5   | `20260107140901_89f590ae...sql`           | 07/01 | CREATE `prestataire_requests`. Fonctions validate/refuse. Vue `prestataires_actifs`                                     |
| 6   | `20260108123445_ad7fec26...sql`           | 08/01 | Fonction `import_prestataires()`                                                                                        |
| 7   | `20260116185447_6fe35001...sql`           | 16/01 | CREATE `passation_marche`. Triggers reference PM, updated_at, update dossier                                            |
| 8   | `20260116211037_07c26800...sql`           | 16/01 | CREATE `marche_documents`, `marche_historique`. Triggers logging. Vue `v_marches_stats`. `check_marche_prerequisites()` |
| 9   | `20260118200000_rls_rbac_socle.sql`       | 18/01 | RLS policies pour `marches` (is_admin/is_dg/creator/direction)                                                          |
| 10  | `20260216_fix_expression_besoin_bugs.sql` | 16/02 | Fix `check_marche_prerequisites` (comparait 'validee' au lieu de 'valide')                                              |

---

## 10. RLS -- Etat actuel

| Table                | Policy SELECT              | Policy INSERT            | Policy UPDATE            | Policy DELETE         | Evaluation                                 |
| -------------------- | -------------------------- | ------------------------ | ------------------------ | --------------------- | ------------------------------------------ |
| `marches`            | admin/DG/creator/direction | admin/can_create         | admin/creator+brouillon  | --                    | **CASSEE** (ref `direction_id` inexistant) |
| `passation_marche`   | `true`                     | `auth.uid() IS NOT NULL` | `auth.uid() IS NOT NULL` | `creator + brouillon` | Trop permissif                             |
| `marche_offres`      | `true`                     | `true`                   | `true`                   | **AUCUNE**            | Trop permissif                             |
| `marche_lots`        | `true`                     | `true`                   | `true`                   | `true`                | Trop permissif                             |
| `soumissions`        | `true`                     | `true`                   | `true`                   | `true`                | Trop permissif                             |
| `marche_validations` | `true`                     | ADMIN/DAAF/CB/DG         | ADMIN/DAAF/CB/DG         | ADMIN/DAAF/CB/DG      | OK                                         |
| `marche_documents`   | `true`                     | ADMIN/DAAF/CB            | ADMIN/DAAF/CB            | ADMIN/DAAF/CB         | OK                                         |
| `marche_historique`  | `true`                     | `true`                   | --                       | --                    | OK (lecture seule + system insert)         |
| `contrats`           | `true`                     | `true`                   | `true`                   | `true`                | Trop permissif                             |

---

## 11. Recommandations

### Phase 1 : Decision architecturale (prerequis)

1. **Choisir UN seul module** : deprecier `marches/` OU `passation-marche/`
2. Migrer les 16 marches existants vers la table choisie
3. Regenerer les types Supabase (`supabase gen types`)

### Phase 2 : Securite (P0)

4. Supprimer `@ts-nocheck` de `usePassationsMarche.ts`
5. Ajouter RBAC sur toutes les actions de validation/rejet/differe
6. Corriger la policy RLS `marches_select` (supprimer ref `direction_id`)
7. Fixer la vue `prestataires_actifs` (casse `actif` vs `ACTIF`)
8. Implementer le vrai upload de fichiers dans PassationChecklist

### Phase 3 : Qualite (P1)

9. Supprimer le composant duplique `MarcheOffresList`
10. Remplacer les 5 queries N+1 de `useMarches` par 1 query avec filtrage
11. Ajouter les jointures `prestataire` dans la query marches
12. Uniformiser la ponderation des notes (70/30 selon la spec)
13. Ajouter `/execution/passation-marche` dans le sidebar

### Phase 4 : Integration (Sprint suivant)

14. Lier les 16 marches existants a leurs EB/dossiers/prestataires
15. Tester le flux complet : EB validee → Passation → Engagement
16. Ajouter les tests E2E (0 test actuellement)

---

## 12. Metriques finales

| Metrique              | Valeur                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------- |
| **Fichiers frontend** | 23 (+ 1 barrel)                                                                         |
| **Lignes de code**    | 7 091                                                                                   |
| **Tables DB**         | 17                                                                                      |
| **Enregistrements**   | 478 (431 prestataires + 16 marches + 14 historique + 15 secteurs + 1 sequence + 1 note) |
| **Triggers**          | 6                                                                                       |
| **Fonctions**         | 7                                                                                       |
| **Vues**              | 3 (dont 1 cassee)                                                                       |
| **Migrations**        | 10 fichiers cles                                                                        |
| **Tests E2E**         | **0**                                                                                   |
| **Usages de `any`**   | ~48                                                                                     |
| **`@ts-nocheck`**     | 1 fichier (380 lignes)                                                                  |
| **Score qualite**     | **35/100**                                                                              |

---

_Document genere le 16 fevrier 2026 par Claude Code_
_ARTI -- Autorite de Regulation du Transport Interieur -- Cote d'Ivoire_
_SYGFP -- Systeme de Gestion Financiere et de Planification_
