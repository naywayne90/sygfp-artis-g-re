# Guide Sécurité SYGFP

> **RBAC, RLS et Contrôle d'Accès**
> Version: 2.0 | Dernière mise à jour: 2026-02-13

---

## 1. Vue d'ensemble

SYGFP implémente un modèle **RBAC** (Role-Based Access Control) avec :

- **Rôles** assignés aux utilisateurs
- **Permissions** liées aux rôles
- **RLS** (Row Level Security) au niveau PostgreSQL
- **Délégations** temporaires de pouvoir
- **Audit trail** complet

---

## 2. Rôles Disponibles

### 2.1 Rôles système

| Code                     | Libellé                              | Description                          |
| ------------------------ | ------------------------------------ | ------------------------------------ |
| `ADMIN`                  | Administrateur                       | Accès total, gestion système         |
| `DG`                     | Directeur Général                    | Validation finale, signature mandats |
| `DAAF`                   | Directeur Administratif et Financier | Validation liquidations, supervision |
| `CB`                     | Contrôleur Budgétaire                | Imputation, validation engagements   |
| `DIRECTEUR`              | Directeur de Direction               | Validation notes direction           |
| `AGENT`                  | Agent                                | Saisie, consultation                 |
| `TRESORERIE`             | Trésorerie                           | Exécution règlements                 |
| `AGENT_COMPTABLE` / `AC` | Agent Comptable                      | Comptabilité, règlements             |
| `COMMISSION_MARCHES`     | Commission des Marchés               | Validation marchés                   |
| `GESTIONNAIRE`           | Gestionnaire                         | Gestion opérationnelle               |

### 2.2 Hiérarchie implicite

```
ADMIN (tout)
   │
   ├── DG (validation finale)
   │     └── peut déléguer à DAAF
   │
   ├── DAAF (finance)
   │     └── supervise CB
   │
   ├── CB (budget)
   │     └── imputation, engagements
   │
   ├── DIRECTEUR (par direction)
   │     └── notes de sa direction
   │
   └── AGENT (base)
         └── saisie uniquement
```

---

## 3. Matrice de Validation

### 3.1 Qui valide quoi ?

| Étape | Document          | Créateur           | Validateur             | Rôles alternatifs                 |
| ----- | ----------------- | ------------------ | ---------------------- | --------------------------------- |
| 1     | Note SEF          | Agent/Gestionnaire | **DG**                 | DAAF, ADMIN, delegue, interimaire |
| 2     | Note AEF          | Agent              | **DIRECTEUR**          | DG, ADMIN                         |
| 3     | Imputation        | -                  | **CB**                 | ADMIN                             |
| 4     | Expression Besoin | Agent              | **DIRECTEUR**          | DG, ADMIN                         |
| 5     | Marché            | SDPM               | **COMMISSION_MARCHES** | DG, ADMIN                         |
| 6     | Engagement        | CB                 | **CB**                 | ADMIN                             |
| 7     | Liquidation       | Agent              | **DAAF**               | CB, ADMIN                         |
| 8     | Ordonnancement    | DAAF               | **DG** (signature)     | ADMIN                             |
| 9     | Règlement         | DAAF               | **TRESORERIE**         | AC, ADMIN                         |
| -     | Virement crédit   | Agent              | **CB**                 | ADMIN                             |

### 3.2 Représentation visuelle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MATRICE DE VALIDATION SYGFP                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Note SEF ──────────────────────────────────► DG valide                │
│                                                                         │
│  Note AEF ──────────────────────────────────► DIRECTEUR valide         │
│                                                                         │
│  Imputation ────────────────────────────────► CB attribue              │
│                                                                         │
│  Expression Besoin ─────────────────────────► DIRECTEUR valide         │
│                                                                         │
│  Marché ────────────────────────────────────► COMMISSION valide        │
│                                                                         │
│  Engagement ────────────────────────────────► CB valide                │
│                                                                         │
│  Liquidation ───────────────────────────────► DAAF valide              │
│                                                                         │
│  Ordonnancement ────────────────────────────► DG signe                 │
│                                                                         │
│  Règlement ─────────────────────────────────► TRESORERIE exécute       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Implémentation Frontend

### 4.1 Hook `usePermissions`

```typescript
// src/hooks/usePermissions.ts

export function usePermissions() {
  // Récupère rôles et permissions de l'utilisateur courant

  return {
    // Vérifications de base
    hasRole(roleCode: string): boolean,
    hasAnyRole(roleCodes: string[]): boolean,
    hasPermission(actionCode: string): boolean,
    isAdmin: boolean,

    // Validations métier spécifiques
    canValidateNoteSEF(): boolean,     // DG, ADMIN
    canValidateNoteAEF(): boolean,     // DIRECTEUR, DG, ADMIN
    canImpute(): boolean,              // CB, ADMIN
    canValidateEngagement(): boolean,  // CB, ADMIN
    canValidateLiquidation(): boolean, // DAAF, CB, ADMIN
    canSignOrdonnancement(): boolean,  // DG, ADMIN
    canExecuteReglement(): boolean,    // TRESORERIE, AC, ADMIN
    canValidateMarche(): boolean,      // COMMISSION, DG, ADMIN
    canApproveVirement(): boolean,     // CB, ADMIN

    // Message d'erreur pour rôle insuffisant
    getRequiredRoleMessage(action: string): string,
  };
}
```

### 4.2 Utilisation dans les composants

```tsx
// Exemple : Bouton de validation
function ValidateButton({ noteId }) {
  const { canValidateNoteSEF, getRequiredRoleMessage } = usePermissions();

  if (!canValidateNoteSEF()) {
    return (
      <Tooltip content={`Réservé au ${getRequiredRoleMessage('validate_note_sef')}`}>
        <Button disabled>Valider</Button>
      </Tooltip>
    );
  }

  return <Button onClick={() => validate(noteId)}>Valider</Button>;
}
```

### 4.3 Composant `PermissionGuard`

```tsx
// src/components/auth/PermissionGuard.tsx

interface PermissionGuardProps {
  permission?: string;
  role?: string;
  roles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ permission, role, roles, fallback = null, children }) {
  const { hasPermission, hasRole, hasAnyRole } = usePermissions();

  let hasAccess = false;

  if (permission) hasAccess = hasPermission(permission);
  else if (role) hasAccess = hasRole(role);
  else if (roles) hasAccess = hasAnyRole(roles);

  return hasAccess ? children : fallback;
}

// Usage
<PermissionGuard role="DG" fallback={<AccessDenied />}>
  <ValidationPanel />
</PermissionGuard>;
```

---

## 5. Implémentation Backend (RLS)

### 5.1 Fonction `has_role`

```sql
-- Vérifie si un utilisateur a un rôle
CREATE FUNCTION has_role(p_user_id uuid, p_role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role = p_role
      AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 5.2 Patterns RLS

#### Pattern 1 : Admin voit tout, autres restreints

```sql
CREATE POLICY "notes_sef_select_policy" ON notes_sef
FOR SELECT USING (
  -- Admin voit tout
  has_role(auth.uid(), 'ADMIN')
  -- DG voit tout
  OR has_role(auth.uid(), 'DG')
  -- DAAF voit soumis et validés
  OR (has_role(auth.uid(), 'DAAF') AND statut IN ('soumis', 'valide'))
  -- Créateur voit ses propres notes
  OR created_by = auth.uid()
  -- Direction voit ses notes validées
  OR (
    direction_id = (SELECT direction_id FROM profiles WHERE id = auth.uid())
    AND statut = 'valide'
  )
);
```

#### Pattern 2 : Création contrôlée

```sql
CREATE POLICY "notes_sef_insert_policy" ON notes_sef
FOR INSERT WITH CHECK (
  -- Utilisateur authentifié
  auth.uid() IS NOT NULL
  -- Exercice actif
  AND EXISTS (
    SELECT 1 FROM exercices_budgetaires
    WHERE annee = exercice
      AND statut IN ('ouvert', 'en_cours')
  )
);
```

#### Pattern 3 : Modification limitée par statut

```sql
CREATE POLICY "notes_sef_update_policy" ON notes_sef
FOR UPDATE USING (
  -- Admin peut tout modifier
  has_role(auth.uid(), 'ADMIN')
  -- Créateur peut modifier en brouillon
  OR (created_by = auth.uid() AND statut = 'brouillon')
  -- Validateurs peuvent changer le statut
  OR (
    has_role(auth.uid(), 'DG')
    AND statut = 'soumis'
  )
);
```

### 5.3 Protection des données finales

```sql
-- Trigger pour bloquer modification notes finales
CREATE FUNCTION prevent_final_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.statut IN ('valide', 'rejete') THEN
    IF NOT has_role(auth.uid(), 'ADMIN') THEN
      RAISE EXCEPTION 'Document final non modifiable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_final_modification
  BEFORE UPDATE ON notes_sef
  FOR EACH ROW
  EXECUTE FUNCTION prevent_final_modification();
```

---

## 6. Séparation des Tâches

### 6.1 Principe

Un utilisateur **ne peut pas valider** ce qu'il a **créé**.

### 6.2 Implémentation

```typescript
// src/hooks/useSeparationOfDuties.ts

export function useSeparationOfDuties() {
  const { userId } = usePermissions();

  const canValidate = (item: { created_by: string }) => {
    // Admin peut toujours valider
    if (isAdmin) return true;

    // Créateur ne peut pas valider son propre document
    return item.created_by !== userId;
  };

  return { canValidate };
}
```

### 6.3 Vérification backend

```sql
-- Dans le trigger de validation
IF NEW.statut = 'valide' AND OLD.created_by = auth.uid() THEN
  IF NOT has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Vous ne pouvez pas valider votre propre document';
  END IF;
END IF;
```

---

## 7. Système de Délégations

### 7.1 Table `delegations`

```sql
CREATE TABLE delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id UUID NOT NULL REFERENCES profiles(id),
  permissions TEXT[] NOT NULL,
  motif TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);
```

### 7.2 Récupération des permissions avec délégations

```sql
CREATE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS TABLE(action_code text, via_delegation boolean) AS $$
  -- Permissions directes
  SELECT rp.action_code, false AS via_delegation
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_code = ur.role
  WHERE ur.user_id = p_user_id AND ur.is_active = true

  UNION

  -- Permissions via délégation
  SELECT unnest(d.permissions), true
  FROM delegations d
  WHERE d.to_user_id = p_user_id
    AND d.is_active = true
    AND now() BETWEEN d.date_debut AND COALESCE(d.date_fin, now() + interval '100 years')
$$ LANGUAGE sql SECURITY DEFINER;
```

### 7.3 Affichage dans l'UI

```tsx
function PermissionBadge({ permission }) {
  const { isViaDelegation } = usePermissions();

  return (
    <Badge variant={isViaDelegation(permission) ? 'outline' : 'default'}>
      {permission}
      {isViaDelegation(permission) && <span> (délégué)</span>}
    </Badge>
  );
}
```

---

## 8. Audit Trail

### 8.1 Table `audit_logs`

| Colonne       | Type        | Description                                       |
| ------------- | ----------- | ------------------------------------------------- |
| `id`          | uuid        | Identifiant                                       |
| `entity_type` | text        | Type d'entité (table)                             |
| `entity_id`   | uuid        | ID de l'entité                                    |
| `action`      | text        | Action (INSERT, UPDATE, DELETE, VALIDATE, REJECT) |
| `old_values`  | jsonb       | Valeurs avant modification                        |
| `new_values`  | jsonb       | Valeurs après modification                        |
| `user_id`     | uuid        | Utilisateur ayant effectué l'action               |
| `ip_address`  | text        | Adresse IP                                        |
| `exercice`    | integer     | Exercice concerné                                 |
| `created_at`  | timestamptz | Date/heure                                        |

### 8.2 Trigger d'audit automatique

```sql
CREATE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    entity_type, entity_id, action,
    old_values, new_values, user_id, exercice
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid(),
    COALESCE(NEW.exercice, OLD.exercice)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.3 Consultation de l'audit

```typescript
// Hook pour consulter l'historique
function useAuditLog(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['audit', entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, profiles!user_id(full_name)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      return data;
    },
  });
}
```

---

## 9. Ajouter une Permission

### 9.1 Checklist

1. **Définir la permission** dans `role_permissions`
2. **Ajouter la vérification** dans `usePermissions`
3. **Créer/modifier la policy RLS** si nécessaire
4. **Ajouter le guard UI** dans les composants
5. **Documenter** dans ce guide

### 9.2 Exemple complet

```sql
-- 1. Ajouter la permission
INSERT INTO role_permissions (role_code, action_code)
VALUES ('CB', 'budget_reallocation_approve');
```

```typescript
// 2. Dans usePermissions.ts
const canApproveReallocation = (): boolean => {
  return isAdmin || hasRole('CB') || hasPermission('budget_reallocation_approve');
};
```

```sql
-- 3. Policy RLS
CREATE POLICY "approve_reallocation" ON reallocations
FOR UPDATE USING (
  has_role(auth.uid(), 'ADMIN')
  OR has_role(auth.uid(), 'CB')
);
```

```tsx
// 4. Guard UI
<PermissionGuard permission="budget_reallocation_approve">
  <ApproveButton />
</PermissionGuard>
```

---

## 10. Bonnes Pratiques

### 10.1 DO ✅

- Toujours vérifier les permissions côté serveur (RLS)
- Utiliser `SECURITY DEFINER` pour les fonctions sensibles
- Logger toutes les actions de validation
- Implémenter la séparation des tâches
- Limiter les délégations dans le temps

### 10.2 DON'T ❌

- Ne jamais faire confiance uniquement au frontend
- Ne jamais stocker de secrets dans le code
- Ne pas donner `ADMIN` par défaut
- Ne pas désactiver RLS "pour tester"
- Ne pas permettre l'auto-validation

---

## 11. Documentation détaillée par module

| Module    | Documentation RLS                           |
| --------- | ------------------------------------------- |
| Notes SEF | [docs/RLS_NOTES_SEF.md](./RLS_NOTES_SEF.md) |

---

## 12. Content-Security-Policy (CSP)

Depuis le 13 fevrier 2026, l'application dispose d'un header CSP dans `index.html` :

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.supabase.co;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
"
/>
```

| Directive     | Valeur         | Raison                                |
| ------------- | -------------- | ------------------------------------- |
| `frame-src`   | `'none'`       | Empeche l'embedding dans des iframes  |
| `object-src`  | `'none'`       | Bloque les plugins Flash/Java         |
| `connect-src` | Supabase + WSS | API REST et Realtime                  |
| `img-src`     | `data: blob:`  | QR codes generes en base64, apercu PJ |

## 13. Delegations et Interims dans le workflow (Gaps 2+3+4)

Depuis le 12-13 fevrier 2026, le systeme supporte les delegations et interims :

### Backend

- `check_validation_permission()` verifie : role direct → delegation active → interim actif
- `get_users_who_can_act_as_role(role, scope)` retourne tous les user_ids capables d'agir
- Colonnes `validation_mode` et `validated_on_behalf_of` tracent le mode

### Notifications

- `notify_role()` utilise `get_users_who_can_act_as_role()` pour inclure delegues/interimaires
- Le message de notification inclut le nom du validateur et son mode (direct/delegation/interim)

### RLS DAAF

- Policy `notes_sef_update_authorized` permet a la DAAF de modifier les notes `soumis` et `a_valider`
- Utilise `user_roles` avec cast `::app_role` (pas de fonctions helper)

---

_Documentation mise a jour le 2026-02-13_
