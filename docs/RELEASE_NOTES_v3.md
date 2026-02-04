# Release Notes SYGFP v3.0 - 04/02/2026

## Vue d'ensemble

Cette version majeure apporte un système de notifications avancé, un dashboard DMG complet, un système de workflow configurable, et de nombreuses améliorations.

---

## Nouvelles Fonctionnalités

### EX-01 : Système de Notifications Avancé

#### Fonctionnalités principales
- **Notifications en temps réel** via Supabase Realtime
- **Centre de notifications** avec historique et filtres
- **Templates personnalisables** par type d'événement
- **Configuration des destinataires** par rôle/direction
- **Préférences utilisateur** (email, in-app, urgence)
- **Notifications automatiques** sur changement de statut

#### Types de notifications supportés
| Type | Description |
|------|-------------|
| `validation` | Demande de validation |
| `rejet` | Document rejeté |
| `differe` | Document différé |
| `piece_manquante` | Pièce manquante |
| `alerte` | Alerte système |
| `info` | Information |
| `echeance` | Échéance proche |
| `budget_insuffisant` | Alerte budget |
| `dossier_a_valider` | Dossier en attente |

#### Nouvelles tables
- `notifications` - Notifications utilisateurs
- `notification_templates` - Templates de messages
- `notification_recipients` - Configuration destinataires
- `notification_logs` - Historique des envois
- `notification_preferences` - Préférences utilisateurs

#### Nouvelles routes
- `/admin/notifications` - Administration des notifications
- `/notifications` - Centre de notifications utilisateur

---

### EX-02 : Dashboard Direction des Moyens Généraux (DMG)

#### Fonctionnalités
- **Vue dédiée DMG** avec KPIs spécifiques
- **Alertes configurables** par seuil
- **Suivi des achats** et approvisionnements
- **Statistiques temps réel** via vues matérialisées

#### Nouvelles tables/vues
- `dmg_alert_config` - Configuration des alertes DMG
- `v_dashboard_dmg` - Vue agrégée dashboard
- `v_alertes_dmg` - Vue des alertes actives

#### Nouvelle route
- `/dashboard-dmg` - Dashboard Direction Moyens Généraux

---

### EX-03 : Système de Workflow Configurable

#### Fonctionnalités
- **Définition de workflows** personnalisés
- **Étapes configurables** avec validateurs
- **Actions et permissions** par étape
- **Conditions de transition** dynamiques
- **Historique des transitions** complet

#### Nouvelles tables
- `wf_definitions` - Définitions de workflows
- `wf_steps` - Étapes de workflow
- `wf_instances` - Instances en cours
- `wf_step_history` - Historique des transitions
- `wf_roles` - Rôles de validation
- `wf_actions` - Actions possibles
- `wf_services` - Services associés
- `wf_step_actions` - Actions par étape
- `wf_step_permissions` - Permissions par étape
- `wf_conditions` - Conditions de transition

#### Nouvelles fonctions RPC
- `start_workflow()` - Démarrer un workflow
- `advance_workflow()` - Avancer d'une étape
- `get_workflow_status()` - Statut d'un workflow
- `get_pending_workflows()` - Workflows en attente

#### Nouvelle route
- `/admin/workflows` - Administration des workflows

---

### EX-04 : Gestion des Intérims

#### Fonctionnalités
- **Création d'intérims** avec période définie
- **Délégation automatique** des pouvoirs
- **Validation en tant qu'intérimaire**
- **Désactivation automatique** à expiration

#### Nouvelle table
- `interims` - Gestion des intérims

#### Fonctions RPC
- `create_interim()` - Créer un intérim
- `end_interim()` - Terminer un intérim
- `can_validate_as_interim()` - Vérifier droits
- `get_active_interim_for_user()` - Intérim actif

#### Nouvelle route
- `/admin/interims` - Gestion des intérims

---

## Autres Améliorations

### Documents et QR Codes
- Table `documents_generes` pour traçabilité
- Table `verifications_qrcode` pour audit
- Système de rate limiting (`rate_limit_qrcode`)
- Vues d'audit et statistiques

### Dashboard Views
- `v_dashboard_kpis` - KPIs agrégés
- `v_dossiers_urgents` - Dossiers prioritaires
- `v_stats_par_direction` - Stats par direction
- `v_stats_par_type_depense` - Stats par type
- `v_activite_recente` - Activité récente

### Liquidations Urgentes
- Vue `v_liquidations_urgentes`
- Fonction `mark_liquidation_urgent()`
- Compteurs et statistiques

### Modification Libellés
- Table `historique_libelles` pour audit
- Fonction `update_libelle_budget()`
- Historique avec rollback possible

---

## Nouvelles Routes (Résumé)

| Route | Description | Module |
|-------|-------------|--------|
| `/admin/notifications` | Administration notifications | Admin |
| `/admin/workflows` | Administration workflows | Admin |
| `/admin/interims` | Gestion des intérims | Admin |
| `/admin/libelles-budget` | Modification libellés | Admin |
| `/dashboard-dmg` | Dashboard DMG | Exécution |
| `/notifications` | Centre notifications | Utilisateur |

---

## Nouvelles Tables (Résumé)

### Notifications (5 tables)
```sql
notifications
notification_templates
notification_recipients
notification_logs
notification_preferences
```

### Workflow (10 tables)
```sql
wf_definitions
wf_steps
wf_instances
wf_step_history
wf_roles
wf_actions
wf_services
wf_step_actions
wf_step_permissions
wf_conditions
```

### Autres (5 tables)
```sql
interims
dmg_alert_config
documents_generes
verifications_qrcode
historique_libelles
```

---

## Breaking Changes

Aucun breaking change dans cette version. Toutes les nouvelles fonctionnalités sont additives.

---

## Instructions de Migration

### 1. Appliquer les migrations
```bash
# Via Supabase CLI
npx supabase db push

# Ou manuellement via SQL Editor
# Appliquer les migrations 20260203*.sql dans l'ordre
```

### 2. Régénérer les types TypeScript
```bash
npx supabase gen types typescript \
  --project-id tjagvgqthlibdpvztvaf \
  > src/integrations/supabase/types.ts
```

### 3. Configurer les notifications
1. Aller dans `/admin/notifications`
2. Activer les templates souhaités
3. Configurer les destinataires par rôle
4. Tester l'envoi de notifications

### 4. Configurer les workflows (optionnel)
1. Aller dans `/admin/workflows`
2. Créer/modifier les définitions de workflow
3. Configurer les étapes et validateurs

---

## Dépendances

Aucune nouvelle dépendance npm ajoutée.

---

## Vérifications Effectuées

| Vérification | Statut |
|--------------|--------|
| `npm run build` | ✅ Succès |
| `npx tsc --noEmit` | ✅ 0 erreurs |
| Bundle size | ✅ ~427 KB (index) |
| Code-splitting | ✅ 85+ pages lazy |

---

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Nouvelles tables | 20+ |
| Nouvelles vues | 10+ |
| Nouvelles fonctions RPC | 30+ |
| Nouvelles routes | 6 |
| Migrations appliquées | 15 (février 2026) |

---

## Documentation Associée

- [NOTIFICATIONS_GUIDE.md](NOTIFICATIONS_GUIDE.md) - Guide système de notifications
- [ARCHITECTURE_TECHNIQUE.md](ARCHITECTURE_TECHNIQUE.md) - Architecture projet
- [GUIDE_SUPABASE.md](GUIDE_SUPABASE.md) - Guide base de données
- [CREDENTIALS_GUIDE.md](CREDENTIALS_GUIDE.md) - Guide des accès

---

**Date de Release:** 04/02/2026
**Version:** 3.0.0
**Statut:** Production Ready
