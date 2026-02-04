# Guide Supabase - SYGFP

## Configuration

### Projet Supabase
- **Project ID**: `tjagvgqthlibdpvztvaf`
- **Region**: Central Europe (Paris)

### Client Supabase
```typescript
// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## Tables Principales

### Structure Budgétaire
| Table | Description |
|-------|-------------|
| `exercices_budgetaires` | Exercices (2024, 2025, 2026...) |
| `missions` | Missions stratégiques |
| `objectifs_strategiques` | Objectifs par mission |
| `actions` | Actions par objectif |
| `activites` | Activités par action |
| `budget_lines` | Lignes budgétaires |

### Chaîne de Dépense
| Table | Description |
|-------|-------------|
| `notes_sef` | Notes de Service Expression Financière |
| `notes_aef` | Notes d'Autorisation d'Engagement Financier |
| `imputations` | Imputations budgétaires |
| `expressions_besoin` | Expressions de besoin |
| `passations_marche` | Passations de marché |
| `budget_engagements` | Engagements financiers |
| `budget_liquidations` | Liquidations |
| `ordonnancements` | Ordonnancements |
| `reglements` | Règlements |
| `dossiers` | Dossiers de dépense (référence pivot) |

### Utilisateurs et Permissions
| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs |
| `user_roles` | Rôles assignés |
| `directions` | Directions/Services |
| `delegations` | Délégations de signature |

## Requêtes Courantes

### Lister les Notes SEF d'un exercice

```typescript
const { data, error } = await supabase
  .from("notes_sef")
  .select(`
    *,
    direction:directions(id, label, sigle),
    demandeur:profiles!notes_sef_demandeur_id_fkey(id, first_name, last_name),
    beneficiaire:prestataires(id, raison_sociale)
  `)
  .eq("exercice", 2026)
  .order("created_at", { ascending: false });
```

### Créer une Note avec Dossier

```typescript
// 1. Générer la référence du dossier
const { data: refData } = await supabase.rpc("get_next_dossier_ref", {
  p_exercice: 2026,
  p_direction_code: "DSI",
});

// 2. Créer le dossier
const { data: dossier } = await supabase
  .from("dossiers")
  .insert({
    numero: refData.dossier_ref,
    exercice: 2026,
    direction_id: directionId,
    current_step: 1,
    statut_global: "en_cours",
  })
  .select()
  .single();

// 3. Créer la note SEF
const { data: note } = await supabase
  .from("notes_sef")
  .insert({
    dossier_id: dossier.id,
    numero: refData.note_ref,
    exercice: 2026,
    objet: "...",
    // ...
  })
  .select()
  .single();
```

### Récupérer les Statistiques Dashboard

```typescript
// Stats par statut
const { data: stats } = await supabase
  .from("notes_sef")
  .select("statut")
  .eq("exercice", 2026);

const counts = {
  brouillon: stats.filter(n => n.statut === "brouillon").length,
  soumis: stats.filter(n => n.statut === "soumis").length,
  valide: stats.filter(n => n.statut === "valide").length,
  // ...
};
```

## Fonctions RPC

### Fonctions Disponibles
| Fonction | Description |
|----------|-------------|
| `get_next_dossier_ref` | Génère la prochaine référence dossier |
| `can_engage_on_budget_line` | Vérifie la disponibilité budgétaire |
| `validate_note_sef` | Valide une note SEF |
| `calculate_budget_disponible` | Calcule le disponible |

### Exemple d'appel RPC

```typescript
const { data, error } = await supabase.rpc("can_engage_on_budget_line", {
  p_budget_line_id: "uuid...",
  p_montant: 1000000,
});

if (data.allowed) {
  // Procéder à l'engagement
} else {
  toast.error(data.reason);
}
```

## Row-Level Security (RLS)

### Politiques Types

```sql
-- Lecture par direction
CREATE POLICY "notes_sef_select_by_direction"
ON notes_sef FOR SELECT
USING (
  direction_id IN (
    SELECT direction_id FROM profiles WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN', 'DG')
  )
);

-- Écriture par créateur ou admin
CREATE POLICY "notes_sef_update_owner"
ON notes_sef FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN'
  )
);
```

## Migrations

### Convention de Nommage
```
YYYYMMDDHHMMSS_description.sql
```

### Structure Type
```sql
-- supabase/migrations/20260129162400_unified_reference_format.sql

-- 1. Créer/modifier les tables
ALTER TABLE notes_sef
ADD COLUMN IF NOT EXISTS reference_pivot TEXT;

-- 2. Créer les indexes
CREATE INDEX IF NOT EXISTS idx_notes_sef_reference
ON notes_sef(reference_pivot);

-- 3. Créer les politiques RLS
CREATE POLICY "..." ON notes_sef ...;

-- 4. Créer les triggers
CREATE TRIGGER ... ON notes_sef ...;
```

### Appliquer une Migration

```bash
# Via CLI Supabase
npx supabase db push

# Ou manuellement via dashboard
# Settings > Database > SQL Editor
```

## Régénération des Types

```bash
# 1. Se connecter
npx supabase login

# 2. Générer les types
npx supabase gen types typescript \
  --project-id tjagvgqthlibdpvztvaf \
  > src/integrations/supabase/types.ts
```

## Edge Functions

### Fonctions Disponibles
| Fonction | Description |
|----------|-------------|
| `r2-storage` | Upload vers Cloudflare R2 |
| `send-notification-email` | Envoi d'emails |
| `generate-export` | Génération exports |
| `create-user` | Création utilisateur |

### Appel d'une Edge Function

```typescript
const { data, error } = await supabase.functions.invoke("send-notification-email", {
  body: {
    to: "user@example.com",
    subject: "Notification",
    html: "<p>Message</p>",
  },
});
```

## Bonnes Pratiques

### 1. Toujours filtrer par exercice
```typescript
.eq("exercice", currentExercice)
```

### 2. Utiliser les relations
```typescript
.select(`
  *,
  direction:directions(id, label),
  ...
`)
```

### 3. Gérer les erreurs
```typescript
const { data, error } = await supabase.from("...").select();
if (error) {
  console.error("Erreur:", error);
  throw error;
}
```

### 4. Audit des actions
```typescript
await supabase.from("audit_logs").insert({
  user_id: userId,
  action: "create",
  entity_type: "note_sef",
  entity_id: noteId,
  new_values: { ... },
});
```
