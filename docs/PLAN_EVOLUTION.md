# SYGFP - Plan d'Évolution

> Roadmap ordonnée des évolutions à venir pour le projet SYGFP.
> 
> **Date de création** : Janvier 2026  
> **Dernière mise à jour** : Janvier 2026

---

## Table des matières

1. [Principes Directeurs](#principes-directeurs)
2. [Phase 1 - Consolidation](#phase-1---consolidation-priorité-haute)
3. [Phase 2 - Règles Métier AEF](#phase-2---règles-métier-aef-priorité-haute)
4. [Phase 3 - Workflow Complet](#phase-3---workflow-complet-priorité-moyenne)
5. [Phase 4 - Fonctionnalités Transverses](#phase-4---fonctionnalités-transverses-priorité-basse)
6. [Suivi des Évolutions](#suivi-des-évolutions)

---

## Principes Directeurs

### Règle d'or : Ne rien casser

Avant toute évolution, vérifier :

1. ✅ L'application compile sans erreur
2. ✅ Les pages SEF/AEF fonctionnent comme avant
3. ✅ Les tests existants passent
4. ✅ Aucune régression sur les fonctionnalités existantes

### Approche incrémentale

- **Petits changements** : préférer plusieurs petits commits à un gros refactoring
- **Tests d'abord** : valider manuellement chaque changement avant de passer au suivant
- **Documentation** : mettre à jour ETAT_ACTUEL.md après chaque évolution majeure

---

## Phase 1 - Consolidation (Priorité Haute)

**Objectif** : Sécuriser l'existant avant d'ajouter des fonctionnalités.

### 1.1 Intégration Validation Zod dans Formulaires

| Tâche | Fichier(s) | Statut |
|-------|------------|--------|
| Appliquer `noteSEFSchema` dans NoteSEFForm | `src/components/notes-sef/NoteSEFForm.tsx` | 🔲 À faire |
| Appliquer `noteAEFSchema` dans NoteAEFForm | `src/components/notes-aef/NoteAEFForm.tsx` | 🔲 À faire |
| Utiliser `FormMessage` pour afficher les erreurs | Formulaires SEF/AEF | 🔲 À faire |

**Fichiers créés :**
- ✅ `src/lib/validations/notesSchemas.ts` - Schémas Zod

### 1.2 Messages d'Erreur FR Centralisés

| Tâche | Fichier(s) | Statut |
|-------|------------|--------|
| Utiliser ERROR_MESSAGES dans hooks SEF | `src/hooks/useNotesSEF.ts` | 🔲 À faire |
| Utiliser ERROR_MESSAGES dans hooks AEF | `src/hooks/useNotesAEF.ts` | 🔲 À faire |
| Utiliser formatSupabaseError pour erreurs DB | Tous les hooks | 🔲 À faire |

**Fichiers créés :**
- ✅ `src/lib/errors/messages.ts` - Messages centralisés

### 1.3 Compléter Tests Manuels

| Tâche | Fichier(s) | Statut |
|-------|------------|--------|
| Exécuter checklist TEST_NOTES_SEF.md | Documentation | 🔲 À faire |
| Exécuter checklist TEST_NOTES_AEF.md | Documentation | 🔲 À faire |
| Exécuter checklist TEST_FLUX_COMPLET.md | Documentation | 🔲 À faire |

**Fichiers créés :**
- ✅ `docs/TEST_NOTES_SEF.md`
- ✅ `docs/TEST_NOTES_AEF.md`
- ✅ `docs/TEST_FLUX_COMPLET.md`

### 1.4 Corrections Mineures

| Tâche | Fichier(s) | Statut |
|-------|------------|--------|
| Fix warning Badge/forwardRef | `src/components/layout/AppSidebar.tsx` | ✅ Fait |
| Vérifier console sans erreurs | Toute l'application | 🔲 À faire |

---

## Phase 2 - Règles Métier AEF (Priorité Haute)

**Objectif** : Implémenter les règles métier spécifiques aux Notes AEF.

### 2.1 AEF Directe DG

| Tâche | Description | Fichier(s) |
|-------|-------------|------------|
| Checkbox "AEF directe" | Visible uniquement pour DG/ADMIN | `NoteAEFForm.tsx` |
| Champ justification_dg | Obligatoire si AEF directe, min 10 car. | `NoteAEFForm.tsx` |
| Masquer sélection SEF | Si AEF directe cochée | `NoteAEFForm.tsx` |
| Validation Zod conditionnelle | Déjà dans `noteAEFSchema` | ✅ Fait |

### 2.2 Liaison SEF → AEF

| Tâche | Description | Fichier(s) |
|-------|-------------|------------|
| Bouton "Créer Note AEF" | Sur SEF validée | `NoteSEFDetails.tsx` |
| Pré-remplissage formulaire | Objet, direction, bénéficiaire | `NoteAEFForm.tsx` |
| Lien retour SEF | Afficher la SEF source dans détail AEF | `NoteAEFDetails.tsx` |

### 2.3 Imputation depuis AEF

| Tâche | Description | Fichier(s) |
|-------|-------------|------------|
| Onglet "À imputer" | Filtrer AEF validées non imputées | `NotesAEF.tsx` |
| Bouton "Imputer" | Ouvre formulaire imputation | `NoteAEFList.tsx` |
| Dialog d'imputation | Sélection ligne budgétaire | `NoteAEFImputeDialog.tsx` |
| Vérification disponibilité | Avant validation imputation | `useImputation.ts` |

---

## Phase 3 - Workflow Complet (Priorité Moyenne)

**Objectif** : Connecter toutes les étapes de la chaîne de dépense.

### 3.1 Expression de Besoin

| Tâche | Description |
|-------|-------------|
| Liaison AEF imputée → Expression | Créer EB depuis AEF imputée |
| Workflow validation EB | Soumission → Validation → Rejet |
| Génération code ARTI | Format étape 5 |

### 3.2 Marchés

| Tâche | Description |
|-------|-------------|
| Liaison EB → Marché | Créer marché depuis EB validée |
| Gestion des lots | Multi-lots par marché |
| Workflow validation marché | Commission → Approbation |
| Offres prestataires | Enregistrement et comparaison |

### 3.3 Engagements Multi-étapes

| Tâche | Description |
|-------|-------------|
| Workflow 4 étapes | SAF → CB → DAF → DG |
| Validation conditionnelle | Selon seuils et types |
| Historique validations | Traçabilité complète |
| Séparation des tâches | Créateur ≠ Validateur |

### 3.4 Liquidations

| Tâche | Description |
|-------|-------------|
| Service fait | Certification par responsable |
| Calcul fiscal | TVA, AIRSI, retenue source |
| Net à payer automatique | Calcul automatisé |
| Liaison factures | Upload pièces justificatives |

### 3.5 Ordonnancements

| Tâche | Description |
|-------|-------------|
| Signatures électroniques | Multi-signataires |
| Ordre de payer | Génération PDF |
| Workflow validation | DAF → DG → Comptable |

### 3.6 Règlements

| Tâche | Description |
|-------|-------------|
| Liaison compte bancaire | Sélection compte payeur |
| Modes de paiement | Virement, chèque, espèces |
| Rapprochement bancaire | Pointage des paiements |

---

## Phase 4 - Fonctionnalités Transverses (Priorité Basse)

**Objectif** : Améliorer l'expérience utilisateur et les capacités de reporting.

### 4.1 Notifications Email

| Tâche | Description |
|-------|-------------|
| Templates email FR | Validation, rejet, rappel |
| Déclencheurs automatiques | Sur changement de statut |
| Préférences utilisateur | Opt-in/opt-out par type |

### 4.2 Exports PDF

| Tâche | Description |
|-------|-------------|
| Mandat de paiement | Format officiel |
| Ordre de virement | Format bancaire |
| Récapitulatif mensuel | États de synthèse |

### 4.3 Reporting Avancé

| Tâche | Description |
|-------|-------------|
| Tableau de bord analytique | KPIs temps réel |
| États d'exécution | Par direction, période |
| Export Excel avancé | Données filtrées |

### 4.4 Performance

| Tâche | Description |
|-------|-------------|
| Pagination server-side généralisée | Toutes les listes |
| Cache queries fréquentes | React Query optimisé |
| Lazy loading composants | Routes admin |

---

## Suivi des Évolutions

### Légende des statuts

| Statut | Signification |
|--------|---------------|
| 🔲 | À faire |
| 🔄 | En cours |
| ✅ | Terminé |
| ⏸️ | En pause |
| ❌ | Annulé |

### Changelog

| Date | Phase | Tâche | Statut |
|------|-------|-------|--------|
| 2026-01 | Setup | Création schémas Zod | ✅ |
| 2026-01 | Setup | Création messages erreur FR | ✅ |
| 2026-01 | Setup | Fix warning Badge | ✅ |
| 2026-01 | Setup | Création checklists test | ✅ |
| 2026-01 | Setup | Création ETAT_ACTUEL.md | ✅ |
| 2026-01 | Setup | Création PLAN_EVOLUTION.md | ✅ |

---

## Critères de Validation par Phase

### Phase 1 - Consolidation
- [ ] Formulaires SEF/AEF utilisent validation Zod
- [ ] Messages d'erreur en français partout
- [ ] Console sans erreurs/warnings
- [ ] Checklists de test exécutées avec succès

### Phase 2 - Règles Métier AEF
- [ ] AEF directe fonctionne pour DG
- [ ] Liaison SEF → AEF avec pré-remplissage
- [ ] Imputation depuis onglet "À imputer"
- [ ] Vérification disponibilité budgétaire

### Phase 3 - Workflow Complet
- [ ] Flux SEF → Règlement complet testable
- [ ] Validation multi-étapes fonctionnelle
- [ ] Séparation des tâches respectée
- [ ] Audit trail complet

### Phase 4 - Fonctionnalités Transverses
- [ ] Emails de notification envoyés
- [ ] Exports PDF générés
- [ ] Dashboard KPIs temps réel
- [ ] Performance < 2s chargement pages
