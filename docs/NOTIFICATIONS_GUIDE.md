# Guide du Système de Notifications - SYGFP

## Vue d'ensemble

Le système de notifications SYGFP permet d'alerter les utilisateurs en temps réel sur les événements importants : validations en attente, rejets, alertes budget, etc.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Utilisateur                     │
├─────────────────┬───────────────────┬───────────────────────┤
│ NotificationBell│ NotificationCenter│ NotificationSettings  │
│   (TopBar)      │   (/notifications)│  (/admin/notifications)│
└────────┬────────┴─────────┬─────────┴───────────┬───────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Hooks React                               │
├─────────────────┬───────────────────┬───────────────────────┤
│ useNotifications│useNotificationsRT │useNotificationSettings│
└────────┬────────┴─────────┬─────────┴───────────┬───────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
├─────────────────┬───────────────────┬───────────────────────┤
│   notifications │notification_temps │ notification_prefs    │
│   (table)       │(templates table)  │ (preferences table)   │
└────────┬────────┴─────────┬─────────┴───────────┬───────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Triggers PostgreSQL                       │
│  notify_on_notes_sef_status_change()                        │
│  notify_on_notes_aef_status_change()                        │
│  trigger_notify_ordonnancement_signe()                      │
│  trigger_notify_reglement_effectue()                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Tables de Base de Données

### 1. notifications
Table principale des notifications utilisateurs.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,          -- 'note_sef', 'note_aef', 'engagement', etc.
  entity_id UUID,            -- ID de l'entité concernée
  est_lu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
```

### 2. notification_templates
Templates de messages par type d'événement.

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_evenement TEXT NOT NULL UNIQUE,
  titre_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  canal TEXT DEFAULT 'in_app',  -- 'in_app', 'email', 'both'
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Variables disponibles dans les templates:**
- `{{entity_numero}}` - Numéro du document
- `{{entity_type}}` - Type de document
- `{{user_name}}` - Nom de l'utilisateur
- `{{direction_name}}` - Nom de la direction
- `{{montant}}` - Montant (si applicable)
- `{{date}}` - Date formatée

### 3. notification_recipients
Configuration des destinataires par type d'événement.

```sql
CREATE TABLE notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_evenement TEXT NOT NULL,
  role_destinataire TEXT,        -- 'DG', 'DAAF', etc.
  direction_id UUID,             -- Direction spécifique
  profil_fonctionnel TEXT,       -- 'Validateur', 'Operationnel', etc.
  est_actif BOOLEAN DEFAULT true
);
```

### 4. notification_preferences
Préférences utilisateur pour les notifications.

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type_notification TEXT NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  urgence_seuil TEXT DEFAULT 'normal'
);
```

### 5. notification_logs
Historique des envois pour audit.

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id),
  canal TEXT NOT NULL,           -- 'in_app', 'email'
  statut TEXT NOT NULL,          -- 'sent', 'failed', 'pending'
  erreur TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Types de Notifications

### Types supportés

| Type | Label | Description |
|------|-------|-------------|
| `validation` | Demande de validation | Document en attente de validation |
| `rejet` | Rejet | Document rejeté |
| `differe` | Différé | Document mis en attente |
| `piece_manquante` | Pièce manquante | Document incomplet |
| `alerte` | Alerte | Alerte système |
| `info` | Information | Information générale |
| `echeance` | Échéance | Date limite proche |
| `budget_insuffisant` | Budget insuffisant | Dépassement budget |
| `assignation` | Assignation | Tâche assignée |
| `dossier_a_valider` | Dossier à valider | Nouveau dossier |
| `roadmap_soumission` | Feuille de route soumise | Soumission roadmap |
| `roadmap_validation` | Feuille de route validée | Validation roadmap |
| `roadmap_rejet` | Feuille de route rejetée | Rejet roadmap |
| `tache_bloquee` | Tâche bloquée | Tâche en blocage |
| `tache_retard` | Tâche en retard | Retard détecté |

### Ajouter un nouveau type

1. Ajouter dans `TYPES_NOTIFICATION` (src/hooks/useNotifications.ts):
```typescript
export const TYPES_NOTIFICATION = [
  // ... types existants
  { value: "nouveau_type", label: "Mon nouveau type" },
];
```

2. Créer un template dans la base:
```sql
INSERT INTO notification_templates (type_evenement, titre_template, message_template)
VALUES ('nouveau_type', 'Titre: {{entity_numero}}', 'Message détaillé...');
```

3. Configurer les destinataires:
```sql
INSERT INTO notification_recipients (type_evenement, role_destinataire)
VALUES ('nouveau_type', 'DAAF');
```

---

## Hooks React

### useNotifications

Hook principal pour gérer les notifications côté client.

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,      // Liste des notifications
    unreadCount,        // Nombre de non lues
    markAsRead,         // Marquer comme lue
    markAllAsRead,      // Marquer toutes comme lues
    deleteNotification, // Supprimer
    isLoading
  } = useNotifications();

  return (
    <div>
      <span>Vous avez {unreadCount.data} notifications non lues</span>
      {notifications.data?.map(notif => (
        <div key={notif.id} onClick={() => markAsRead.mutate(notif.id)}>
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

### useNotificationsRealtime

Hook pour les notifications en temps réel via Supabase Realtime.

```typescript
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';

function MyComponent() {
  const { newNotifications } = useNotificationsRealtime();

  useEffect(() => {
    if (newNotifications.length > 0) {
      toast.info(`Nouvelle notification: ${newNotifications[0].titre}`);
    }
  }, [newNotifications]);
}
```

### useNotificationSettings

Hook pour l'administration des paramètres de notifications.

```typescript
import { useNotificationTemplates, useNotificationRecipients } from '@/hooks/useNotificationSettings';

function AdminNotifications() {
  const { templates, updateTemplate } = useNotificationTemplates();
  const { recipients, addRecipient, removeRecipient } = useNotificationRecipients();

  // Gestion des templates et destinataires
}
```

---

## Composants UI

### NotificationBell
Icône cloche avec badge dans la TopBar.

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Affiche la cloche avec le nombre de non lues
<NotificationBell />
```

### NotificationCenter
Centre complet des notifications (page /notifications).

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// Page complète avec filtres, historique, actions en masse
<NotificationCenter />
```

### NotificationDropdown
Menu déroulant avec les dernières notifications.

```tsx
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

// Menu rapide pour voir les dernières notifications
<NotificationDropdown />
```

---

## Fonctions RPC PostgreSQL

### create_notification
Créer une notification manuellement.

```sql
SELECT create_notification(
  p_user_id := 'uuid-user',
  p_type := 'validation',
  p_titre := 'Note SEF à valider',
  p_message := 'La note SEF-2026-00123 attend votre validation',
  p_entity_type := 'note_sef',
  p_entity_id := 'uuid-note'
);
```

### mark_notification_read
Marquer une notification comme lue.

```sql
SELECT mark_notification_read('uuid-notification');
```

### mark_all_notifications_read
Marquer toutes les notifications de l'utilisateur comme lues.

```sql
SELECT mark_all_notifications_read();
```

### get_unread_notifications_count
Obtenir le nombre de notifications non lues.

```sql
SELECT get_unread_notifications_count();
```

### cleanup_old_notifications
Nettoyer les anciennes notifications (à planifier en cron).

```sql
SELECT cleanup_old_notifications();
-- Supprime les notifications > 90 jours
```

---

## Triggers Automatiques

### Sur changement de statut Notes SEF
```sql
CREATE TRIGGER trigger_notes_sef_notification
AFTER UPDATE OF statut ON notes_sef
FOR EACH ROW
EXECUTE FUNCTION notify_on_notes_sef_status_change();
```

### Sur changement de statut Notes AEF
```sql
CREATE TRIGGER trigger_notes_aef_notification
AFTER UPDATE OF statut ON notes_aef
FOR EACH ROW
EXECUTE FUNCTION notify_on_notes_aef_status_change();
```

### Sur signature ordonnancement
```sql
CREATE TRIGGER trigger_ordonnancement_signe
AFTER UPDATE ON ordonnancements
FOR EACH ROW
WHEN (NEW.statut = 'signe' AND OLD.statut != 'signe')
EXECUTE FUNCTION trigger_notify_ordonnancement_signe();
```

---

## Configuration Administration

### Accès
Route: `/admin/notifications`

### Onglets disponibles

1. **Templates**
   - Liste des templates par type
   - Activation/désactivation
   - Modification du contenu
   - Prévisualisation

2. **Destinataires**
   - Configuration par type d'événement
   - Ajout de rôles/directions
   - Test d'envoi

3. **Historique**
   - Logs des envois
   - Filtres par statut/type
   - Export des données

---

## Bonnes Pratiques

### 1. Éviter le spam
```typescript
// Regrouper les notifications similaires
const DEBOUNCE_MS = 5000;
// Ne pas envoyer plus d'une notification du même type toutes les 5 secondes
```

### 2. Prioriser les notifications urgentes
```typescript
// Marquer comme urgent
await supabase.from('notifications').insert({
  // ...
  metadata: { urgence: 'haute' }
});
```

### 3. Nettoyer régulièrement
```sql
-- Cron job quotidien
SELECT cleanup_old_notifications();
```

### 4. Utiliser les templates
```typescript
// Préférer les templates aux messages hardcodés
const template = await getTemplate('validation');
const message = renderTemplate(template, { entity_numero: 'SEF-2026-00123' });
```

---

## Dépannage

### Notifications non reçues
1. Vérifier que l'utilisateur a des préférences activées
2. Vérifier que le template existe et est actif
3. Vérifier les logs dans `notification_logs`
4. Vérifier la connexion Realtime dans DevTools

### Erreurs d'envoi email
1. Vérifier la clé RESEND_API_KEY dans les Edge Functions
2. Consulter les logs de la fonction `send-notification-email`
3. Vérifier que l'email utilisateur est valide

### Performance
1. Indexer les colonnes fréquemment filtrées
2. Limiter le nombre de notifications affichées (pagination)
3. Utiliser `EXPLAIN ANALYZE` pour optimiser les requêtes

---

## API Edge Function

### send-notification-email

Endpoint: `POST /functions/v1/send-notification-email`

```typescript
const { data, error } = await supabase.functions.invoke('send-notification-email', {
  body: {
    user_id: 'uuid',
    type: 'validation',
    title: 'Titre',
    message: 'Message',
    entity_type: 'note_sef',
    entity_id: 'uuid'
  }
});
```

---

**Dernière mise à jour:** 04/02/2026
