# Module Alertes Budgetaires — SYGFP

> Derniere mise a jour : 24/03/2026

## 1. Vue d'ensemble

Le module **Alertes Budgetaires** assure la surveillance des seuils de consommation budgetaire. Il detecte automatiquement quand une ligne budgetaire depasse un seuil configure (80%, 90%, 95%, 100%) et genere des alertes a destination des roles concernes (CB, DAAF, DG).

Le module comprend deux volets :

- **Alertes** : Liste des alertes declenchees, avec cycle de vie (non acquittee -> acquittee -> resolue)
- **Configuration** : Regles d'alerte parametrables avec seuils, scopes et canaux de notification

Les alertes sont gerees via une **Edge Function Supabase** (`budget-alerts`) qui effectue les verifications, calcule les taux et genere les alertes.

---

## 2. Routes et acces

| Route                  | Page                | Roles autorises     |
| ---------------------- | ------------------- | ------------------- |
| `/alertes-budgetaires` | Alertes Budgetaires | CB, DAAF, DG, ADMIN |

---

## 3. Composants

| Composant          | Fichier                                      | Description                                                                                                                                                                            |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AlertesBudgetaires | `src/pages/AlertesBudgetaires.tsx`           | Page principale avec 2 onglets (Alertes, Configuration), 4 KPIs de resume, filtres                                                                                                     |
| AlertCard          | `src/pages/AlertesBudgetaires.tsx` (interne) | Carte d'alerte individuelle : niveau avec icone coloree, badges (seuil, vu, resolu), details chiffres (dotation, engage, taux, disponible), lien vers ligne budgetaire, boutons action |
| PageHeader         | `src/components/shared/PageHeader.tsx`       | En-tete avec bouton "Verifier les seuils"                                                                                                                                              |

---

## 4. Boutons et actions

### Actions globales

| Bouton              | Visible si         | Action | Effet                                                                                                                        |
| ------------------- | ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Verifier les seuils | Toujours (en-tete) | Clic   | Appel Edge Function `budget-alerts` action `check`, genere nouvelles alertes si seuils depasses, toast avec nombre d'alertes |

### Onglet Alertes

| Bouton                | Visible si                                           | Action | Effet                                                      |
| --------------------- | ---------------------------------------------------- | ------ | ---------------------------------------------------------- |
| En attente (X)        | Toujours                                             | Clic   | Filtre les alertes non resolues                            |
| Resolues (X)          | Toujours                                             | Clic   | Filtre les alertes resolues                                |
| Toutes (X)            | Toujours                                             | Clic   | Affiche toutes les alertes                                 |
| Recherche             | Toujours                                             | Saisie | Filtre par code ligne budgetaire ou message                |
| Accuser reception     | `acknowledged_at === null`                           | Clic   | Appel Edge Function action `acknowledge`, marque comme vue |
| Resoudre              | `acknowledged_at !== null` ET `resolved_at === null` | Clic   | Appel Edge Function action `resolve`, marque comme resolue |
| Lien ligne budgetaire | `alert.budget_line` existe                           | Clic   | Navigue vers `/planification/budget?search={code}`         |

### Onglet Configuration

| Bouton               | Visible si | Action | Effet                                                              |
| -------------------- | ---------- | ------ | ------------------------------------------------------------------ |
| Switch actif/inactif | Par regle  | Toggle | Appel `updateRule` avec `actif: true/false`, mise a jour immediate |

---

## 5. Statuts et transitions

### Cycle de vie d'une alerte

```
[Declenchement automatique]
        |
        v
   non_acquittee  ------>  acquittee  ------>  resolue
   (ring rouge/orange)    (badge "Vu")       (badge vert "Resolu")
```

| Etat          | Description                       | Indicateur visuel                                                          |
| ------------- | --------------------------------- | -------------------------------------------------------------------------- |
| Non acquittee | Alerte declenchee, pas encore vue | Ring colore autour de la carte (rouge pour blocking, orange pour critical) |
| Acquittee     | L'utilisateur a pris connaissance | Badge "Vu"                                                                 |
| Resolue       | Le probleme a ete traite          | Badge vert "Resolu"                                                        |

### Niveaux d'alerte

| Niveau     | Label       | Couleur fond | Couleur texte | Icone         | Description                        |
| ---------- | ----------- | ------------ | ------------- | ------------- | ---------------------------------- |
| `info`     | Information | Bleu clair   | Bleu fonce    | Bell          | Seuil informatif atteint           |
| `warning`  | Attention   | Jaune clair  | Jaune fonce   | AlertTriangle | Seuil d'alerte atteint             |
| `critical` | Critique    | Orange clair | Orange fonce  | AlertTriangle | Seuil critique depasse             |
| `blocking` | Bloquant    | Rouge clair  | Rouge fonce   | XCircle       | Budget epuise, operations bloquees |

---

## 6. Workflow de validation

| Etape           | Role                    | Action                                                      | Condition                                       |
| --------------- | ----------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| 1. Verification | Systeme (Edge Function) | Execute `check` : compare consommation vs seuils configures | Bouton "Verifier les seuils" ou appel programme |
| 2. Generation   | Systeme                 | Cree des alertes dans `budg_alerts` si seuil depasse        | Nouvelle consommation detectee                  |
| 3. Notification | Systeme                 | Notifie les roles destinataires via canal configure         | Alerte generee                                  |
| 4. Acquittement | CB / DAAF / DG          | Clique "Accuser reception"                                  | Alerte non acquittee                            |
| 5. Resolution   | CB / DAAF / DG          | Clique "Resoudre" (optionnel : commentaire)                 | Alerte acquittee                                |

---

## 7. Donnees Supabase

| Table              | Colonnes cles                                                                                                                                                                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `budg_alerts`      | `id`, `rule_id`, `exercice`, `ligne_budgetaire_id`, `niveau` (info/warning/critical/blocking), `seuil_atteint`, `taux_actuel`, `montant_dotation`, `montant_engage`, `montant_disponible`, `message`, `context` (JSONB), `created_at`, `acknowledged_at`, `acknowledged_by`, `resolved_at`, `resolved_by`, `resolution_comment` |
| `budg_alert_rules` | `id`, `exercice`, `scope` (GLOBAL/PAR_LIGNE), `seuil_pct`, `actif`, `destinataires_roles` (text[]), `destinataires_users` (text[]), `canal`, `description`, `created_at`                                                                                                                                                        |
| `budget_lines`     | `id`, `code`, `label` — jointure pour afficher le code/libelle de la ligne budgetaire                                                                                                                                                                                                                                           |

### Edge Function

| Fonction        | Action        | Parametres             | Retour                                    |
| --------------- | ------------- | ---------------------- | ----------------------------------------- |
| `budget-alerts` | `list`        | `exercice`             | `{ alerts: BudgetAlert[] }`               |
| `budget-alerts` | `check`       | `exercice`             | `{ success, new_alerts, critical_count }` |
| `budget-alerts` | `acknowledge` | `alert_id`             | `{ success }`                             |
| `budget-alerts` | `resolve`     | `alert_id`, `comment?` | `{ success }`                             |

---

## 8. Hooks

| Hook            | Fichier                        | Exports                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| useBudgetAlerts | `src/hooks/useBudgetAlerts.ts` | `useBudgetAlerts()` — retourne `alerts` (BudgetAlert[]), `isLoadingAlerts`, `unacknowledgedCount`, `rules` (AlertRule[]), `isLoadingRules`, `checkAlerts` (mutation), `acknowledgeAlert` (mutation), `resolveAlert` (mutation), `updateRule` (mutation), `NIVEAU_COLORS`, `NIVEAU_LABELS` |

### Types exportes

| Type          | Description                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BudgetAlert` | `id`, `rule_id`, `exercice`, `ligne_budgetaire_id`, `niveau` (info/warning/critical/blocking), `seuil_atteint`, `taux_actuel`, `montant_dotation`, `montant_engage`, `montant_disponible`, `message`, `context`, `created_at`, `acknowledged_at`, `acknowledged_by`, `resolved_at`, `resolved_by`, `resolution_comment`, `budget_line?` ({id, code, label}) |
| `AlertRule`   | `id`, `exercice`, `scope` (GLOBAL/PAR_LIGNE), `seuil_pct`, `actif`, `destinataires_roles` (string[]), `destinataires_users` (string[]), `canal`, `description`, `created_at`                                                                                                                                                                                |

### Constantes exportees

| Constante       | Contenu                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| `NIVEAU_COLORS` | Mapping niveau -> {bg, text, border} (4 niveaux)                                |
| `NIVEAU_LABELS` | Mapping niveau -> libelle francais : Information, Attention, Critique, Bloquant |
