# SYGFP - Notes de Développement et Mapping

> Document de référence pour le développement SYGFP.
> Dernière mise à jour : 2026-01-18

---

## 1. RÈGLES ZÉRO CASSE

### Principes fondamentaux

1. **NE JAMAIS supprimer** de tables, colonnes, routes ou composants existants
2. **NE JAMAIS renommer** sans migration de données complète
3. **Réutiliser l'existant** avant de créer du nouveau
4. **Additions uniquement** : nouvelles colonnes nullable, nouvelles tables, nouveaux endpoints
5. **Corrections minimales** : modifier uniquement ce qui est strictement nécessaire

### Avant toute modification

- [ ] Vérifier si la table/colonne/route existe déjà
- [ ] Documenter la décision ici
- [ ] Créer une migration réversible si modification de schéma

---

## 2. MAPPING DES TABLES

### Tables principales vs noms dans les prompts

| Nom dans les prompts | Nom réel en BDD | Notes |
|---------------------|-----------------|-------|
| `exercises` | `exercices_budgetaires` | Table existante, NE PAS créer `exercises` |
| `profiles.role_level` | `profiles.role_hierarchique` + `profil_fonctionnel` | 2 colonnes au lieu d'une |
| `fournisseurs` | `prestataires` | Table existante |
| `notes_aef` | `notes_dg` | Notes DG = AEF (Autorisation Engagement Fonds) |
| `budget_lines` | `budget_lines` | ✅ Nom identique |
| `attachments` | Plusieurs tables par entité | `notes_sef_attachments`, `engagement_attachments`, etc. |
| `audit_events` | `audit_logs` | Nom légèrement différent |

### Structure des rôles

**Table `profiles` - Colonnes de rôle :**

```sql
role_hierarchique TEXT -- Agent, Chef de Service, Sous-Directeur, Directeur, DG
profil_fonctionnel TEXT -- Admin, CB, DAAF, DG, Tresorerie, Directeur, Operateur, Auditeur
```

**NE PAS utiliser** `role_level` (n'existe pas)

---

## 3. RÉFÉRENCE PIVOT ARTI

### Format officiel

```
ARTI{MM}{YY}{XXXXXX}
```

| Composant | Description | Exemple |
|-----------|-------------|---------|
| `ARTI` | Préfixe fixe | ARTI |
| `MM` | Mois (01-12) | 01 |
| `YY` | Année (2 chiffres) | 26 |
| `XXXXXX` | Séquence (6 chiffres) | 000001 |

**Exemple complet** : `ARTI012600001`

### Table de compteurs

```sql
-- Table existante : arti_reference_counters
SELECT * FROM arti_reference_counters;
```

### Utilisation dans la chaîne

La référence ARTI est **immuable** et suit le dossier :

```
Note SEF (création référence)
    ↓
Note AEF/DG (hérite référence)
    ↓
Imputation (hérite référence)
    ↓
Engagement (hérite référence)
    ↓
Liquidation (hérite référence)
    ↓
Ordonnancement (hérite référence)
    ↓
Règlement (hérite référence)
```

---

## 4. DIRECTIONS EXISTANTES

Les directions sont déjà créées (24 entrées). **NE PAS recréer**.

| Code | Sigle | Libellé |
|------|-------|---------|
| 01 | DG | Direction Générale de l'ARTI |
| 02 | DAAF | Direction des Affaires Administratives et Financières |
| 03 | SDMG | Service des Moyens Généraux |
| 04 | DSESP | Direction des Statistiques, des Études, de la Stratégie et de la Prospective |
| 05 | DGPECRP | Direction de la Gestion Prévisionnelle de l'Emploi |
| 06 | DCSTI | Direction du Contrôle et de la Surveillance du Transport Intérieur |
| 07 | DRRN | Direction des Recours, de la Réglementation et des Normes |
| 08 | DCP | Direction de la Communication et du Partenariat |
| 09 | DSI | Direction des Systèmes d'Information |
| 10 | CB | Contrôleur Budgétaire |
| 11 | AC | Agent Comptable |
| 12 | CM | Chargé de Mission du DG |
| 13 | DP | Direction du Patrimoine |
| 14 | DCZ | Direction Centrale des Zones |
| 15 | DQ | Direction de la Qualité |
| 16 | AS | Autres Services |

---

## 5. WORKFLOW ET STATUTS

### Statuts officiels (table `workflow_statuses`)

```
brouillon, soumis, en_attente, en_cours, a_valider, a_valider_dg,
valide, rejete, differe, retourne, a_imputer, impute, attribue,
infructueux, en_signature, vise, a_signer, signe,
en_attente_reglement, regle_partiel, regle_total, paye,
refuse, clos, annule
```

### Transitions (table `workflow_transitions`)

Les transitions sont définies par module avec :
- `from_status` → `to_status`
- `action_code` (ex: "soumettre", "valider", "rejeter")
- `required_roles` (rôles autorisés)
- `requires_motif` (booléen)
- `requires_budget_check` (booléen)

---

## 6. EDGE FUNCTIONS

| Fonction | Endpoint | Rôle |
|----------|----------|------|
| `create-user` | `/functions/v1/create-user` | Création utilisateur (Admin) |
| `r2-storage` | `/functions/v1/r2-storage` | Stockage Cloudflare R2 |
| `send-notification-email` | `/functions/v1/send-notification-email` | Emails via Resend |
| `generate-export` | `/functions/v1/generate-export` | Export Excel/CSV/PDF |

---

## 7. STORAGE (Cloudflare R2)

### Configuration

- **Bucket** : `lovable-storage`
- **Prefix** : `sygfp/`

### Structure des chemins

```
sygfp/{entityType}/{exercice}/{entityId}/{timestamp}_{filename}
```

**Exemple** :
```
sygfp/notes-sef/2026/abc123-uuid/1705574400_facture.pdf
```

---

## 8. DÉCISIONS ARCHITECTURALES

### 2026-01-18 : Audit initial

**Contexte** : Le prompt 3/25 fournit un SQL incompatible avec la structure existante.

**Décision** :
- NE PAS exécuter le SQL du prompt 3/25
- Adapter les futures migrations à la structure RÉELLE
- Documenter les différences de nomenclature

**Justification** :
- `exercises` n'existe pas → utiliser `exercices_budgetaires`
- `profiles.role_level` n'existe pas → utiliser `role_hierarchique` + `profil_fonctionnel`
- Les directions existent déjà (24 entrées)

---

## 9. ROUTES PRINCIPALES

### Par module

| Module | Routes | Composants |
|--------|--------|------------|
| Auth | `/auth`, `/select-exercice` | LoginPage, SelectExercice |
| Notes SEF | `/notes-sef`, `/notes-sef/:id`, `/notes-sef/validation` | NotesSEF, NoteSEFDetail |
| Notes AEF | `/notes-aef`, `/notes-aef/:id`, `/notes-aef/validation` | NotesAEF, NoteAEFDetail |
| Exécution | `/execution/*` | ImputationPage, PassationMarche |
| Engagements | `/engagements`, `/liquidations`, `/ordonnancements`, `/reglements` | Engagements, Liquidations, etc. |
| Admin | `/admin/*` (20+ routes) | GestionUtilisateurs, GestionExercices, etc. |

---

## 10. HOOKS CRITIQUES

| Hook | Rôle | Fichier |
|------|------|---------|
| `usePermissions` | Permissions et rôles | `src/hooks/usePermissions.ts` |
| `useExerciceFilter` | Contexte exercice | `src/hooks/useExerciceFilter.ts` |
| `useWorkflowTransitions` | Transitions workflow | `src/hooks/useWorkflowTransitions.ts` |
| `useBudgetAvailability` | Disponibilité budget | `src/hooks/useBudgetAvailability.ts` |
| `useR2Storage` | Stockage R2 | `src/hooks/useR2Storage.ts` |

---

## 11. CHECKLIST AVANT COMMIT

- [ ] Aucune table/colonne supprimée
- [ ] Aucun renommage sans migration
- [ ] Nouveaux éléments documentés ici
- [ ] Tests de non-régression passés
- [ ] Build TypeScript OK
