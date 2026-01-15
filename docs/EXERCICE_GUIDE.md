# Guide Exercice Budgétaire SYGFP

> **Gestion du cycle de vie des exercices**  
> Version: 1.0 | Dernière mise à jour: 2026-01-15

---

## 1. Concept d'Exercice Budgétaire

### 1.1 Définition

L'**exercice budgétaire** correspond à l'année fiscale pendant laquelle le budget est exécuté. Dans SYGFP, chaque exercice est une entité indépendante avec :

- Son propre budget voté
- Ses propres opérations (engagements, liquidations, etc.)
- Son propre cycle de vie

### 1.2 Principe de cloisonnement

Toutes les données sont **filtrées par exercice** :
- Les listes n'affichent que l'exercice actif
- Les rapports portent sur un exercice spécifique
- Les séquences de numérotation redémarrent chaque année

---

## 2. États d'un Exercice

### 2.1 Cycle de vie

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CYCLE DE VIE D'UN EXERCICE                          │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   brouillon  │ ◄─── Création (préparation budget)
    └──────┬───────┘
           │ Ouverture
           ▼
    ┌──────────────┐
    │    ouvert    │ ◄─── Budget voté, prêt à exécuter
    └──────┬───────┘
           │ Début exécution
           ▼
    ┌──────────────┐
    │   en_cours   │ ◄─── Exécution normale (état principal)
    └──────┬───────┘
           │ Clôture
           ▼
    ┌──────────────┐
    │    cloture   │ ◄─── Fin d'année, plus de nouvelles opérations
    └──────┬───────┘
           │ Archivage
           ▼
    ┌──────────────┐
    │   archive    │ ◄─── Lecture seule, données historiques
    └──────────────┘
```

### 2.2 Description des états

| État | Description | Opérations possibles |
|------|-------------|---------------------|
| `brouillon` | Préparation du budget | Import, saisie lignes budget |
| `ouvert` | Budget voté et prêt | Création notes, démarrage workflow |
| `en_cours` | Exécution active | Toutes les opérations |
| `cloture` | Clôturé provisoirement | Consultation, régularisations |
| `archive` | Archivé définitivement | Lecture seule |

### 2.3 Permissions par état

| État | Créer | Modifier | Valider | Supprimer | Consulter |
|------|-------|----------|---------|-----------|-----------|
| brouillon | ✅ | ✅ | ❌ | ✅ | ✅ |
| ouvert | ✅ | ✅ | ✅ | ✅ | ✅ |
| en_cours | ✅ | ✅ | ✅ | ✅ | ✅ |
| cloture | ❌ | ⚠️* | ⚠️* | ❌ | ✅ |
| archive | ❌ | ❌ | ❌ | ❌ | ✅ |

*⚠️ Régularisations uniquement avec autorisation spéciale*

---

## 3. Table `exercices_budgetaires`

### 3.1 Structure

```sql
CREATE TABLE exercices_budgetaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annee INTEGER NOT NULL UNIQUE,        -- 2024, 2025, 2026...
  code_exercice TEXT,                   -- "EXE-2026"
  libelle TEXT,                         -- "Exercice Budgétaire 2026"
  statut TEXT DEFAULT 'brouillon',      -- États possibles
  est_actif BOOLEAN DEFAULT false,      -- Exercice par défaut ?
  date_ouverture DATE,                  -- Date d'ouverture officielle
  date_cloture DATE,                    -- Date de clôture
  total_dotation NUMERIC DEFAULT 0,     -- Budget total voté
  total_engage NUMERIC DEFAULT 0,       -- Total engagé
  total_liquide NUMERIC DEFAULT 0,      -- Total liquidé
  total_paye NUMERIC DEFAULT 0,         -- Total payé
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);
```

### 3.2 Contraintes

```sql
-- Un seul exercice actif à la fois
CREATE UNIQUE INDEX idx_exercice_actif 
ON exercices_budgetaires (est_actif) 
WHERE est_actif = true;

-- Statuts valides
ALTER TABLE exercices_budgetaires
ADD CONSTRAINT check_statut
CHECK (statut IN ('brouillon', 'ouvert', 'en_cours', 'cloture', 'archive'));
```

---

## 4. Contexte React `ExerciceContext`

### 4.1 Structure du contexte

```typescript
// src/contexts/ExerciceContext.tsx

interface ExerciceInfo {
  id: string;
  annee: number;
  code_exercice: string | null;
  libelle: string | null;
  statut: string;
  est_actif: boolean;
  date_ouverture: string | null;
  date_cloture: string | null;
}

interface ExerciceContextType {
  exercice: number | null;           // Année sélectionnée (2026)
  exerciceId: string | null;         // UUID de l'exercice
  exerciceInfo: ExerciceInfo | null; // Infos complètes
  setExercice: (year: number | null, showToast?: boolean) => void;
  clearExercice: () => void;
  isLoading: boolean;
  isReadOnly: boolean;               // true si clôturé/archivé
  canWrite: boolean;                 // Inverse de isReadOnly
  refreshExercice: () => Promise<void>;
}
```

### 4.2 Utilisation dans les composants

```tsx
import { useExercice } from "@/contexts/ExerciceContext";

function MonComposant() {
  const { 
    exercice,       // 2026
    exerciceInfo,   // Infos complètes
    isReadOnly,     // true si lecture seule
    canWrite,       // true si écriture autorisée
  } = useExercice();
  
  // Afficher l'exercice
  console.log(`Exercice actif: ${exercice}`);
  
  // Vérifier si on peut écrire
  if (!canWrite) {
    return <Alert>Exercice en lecture seule</Alert>;
  }
  
  return <MonFormulaire />;
}
```

### 4.3 Persistance

L'exercice sélectionné est stocké dans `localStorage` :

```typescript
// Clé de stockage
const STORAGE_KEY = "sygfp_exercice";

// Lecture au démarrage
const stored = localStorage.getItem(STORAGE_KEY);
const exercice = stored ? parseInt(stored, 10) : null;

// Sauvegarde au changement
localStorage.setItem(STORAGE_KEY, exercice.toString());
```

---

## 5. Guard d'Écriture

### 5.1 Hook `useExerciceWriteGuard`

```typescript
// src/hooks/useExerciceWriteGuard.ts

export function useExerciceWriteGuard() {
  const { canWrite, exerciceInfo } = useExercice();
  
  const checkWrite = (action: string): boolean => {
    if (!canWrite) {
      toast.error(
        `Action impossible: L'exercice ${exerciceInfo?.annee} est ${exerciceInfo?.statut}`
      );
      return false;
    }
    return true;
  };
  
  return { canWrite, checkWrite };
}
```

### 5.2 Utilisation

```tsx
function CreateButton() {
  const { canWrite, checkWrite } = useExerciceWriteGuard();
  
  const handleCreate = () => {
    if (!checkWrite("création")) return;
    // Procéder à la création
  };
  
  return (
    <Button 
      onClick={handleCreate}
      disabled={!canWrite}
    >
      Créer
    </Button>
  );
}
```

### 5.3 Composant `ExerciceWriteGuard`

```tsx
// src/components/exercice/ExerciceWriteGuard.tsx

interface ExerciceWriteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ExerciceWriteGuard({ children, fallback }: ExerciceWriteGuardProps) {
  const { canWrite } = useExercice();
  
  if (!canWrite) {
    return fallback || null;
  }
  
  return <>{children}</>;
}

// Usage
<ExerciceWriteGuard fallback={<ReadOnlyMessage />}>
  <EditForm />
</ExerciceWriteGuard>
```

---

## 6. Bannière Lecture Seule

### 6.1 Composant

```tsx
// src/components/exercice/ExerciceReadOnlyBanner.tsx

export function ExerciceReadOnlyBanner() {
  const { isReadOnly, exerciceInfo } = useExercice();
  
  if (!isReadOnly) return null;
  
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Exercice en lecture seule</AlertTitle>
      <AlertDescription>
        L'exercice {exerciceInfo?.annee} est {exerciceInfo?.statut}. 
        Les modifications ne sont pas autorisées.
      </AlertDescription>
    </Alert>
  );
}
```

### 6.2 Intégration dans les pages

```tsx
function MaPage() {
  return (
    <div>
      <ExerciceReadOnlyBanner />
      <MonContenu />
    </div>
  );
}
```

---

## 7. Filtrage par Exercice

### 7.1 Hook `useExerciceFilter`

```typescript
// src/hooks/useExerciceFilter.ts

export function useExerciceFilter() {
  const { exercice } = useExercice();
  
  // Ajoute le filtre exercice à une requête Supabase
  const withExercice = (query: PostgrestQueryBuilder) => {
    if (exercice) {
      return query.eq("exercice", exercice);
    }
    return query;
  };
  
  return { exercice, withExercice };
}
```

### 7.2 Utilisation dans les hooks

```typescript
function useNotes() {
  const { exercice } = useExercice();
  
  return useQuery({
    queryKey: ["notes", exercice], // exercice dans la clé !
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_sef")
        .select("*")
        .eq("exercice", exercice)  // Filtrage obligatoire
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!exercice, // Ne pas exécuter sans exercice
  });
}
```

---

## 8. Changement d'Exercice

### 8.1 Sélecteur d'exercice

```tsx
// Dans le header ou sidebar
function ExerciceSelector() {
  const { exercice, setExercice } = useExercice();
  const { data: exercices } = useExercices();
  
  return (
    <Select value={exercice?.toString()} onValueChange={(v) => setExercice(parseInt(v))}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un exercice" />
      </SelectTrigger>
      <SelectContent>
        {exercices?.map((ex) => (
          <SelectItem key={ex.id} value={ex.annee.toString()}>
            {ex.annee} - {ex.statut}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 8.2 Invalidation du cache

Quand l'exercice change, toutes les requêtes sont invalidées :

```typescript
const setExercice = async (year: number | null) => {
  setExerciceState(year);
  
  // Invalider toutes les requêtes pour forcer le rechargement
  await queryClient.invalidateQueries();
  
  toast.success(`Exercice changé : ${year}`);
};
```

### 8.3 Audit du changement

Les changements d'exercice sont audités :

```typescript
// Dans setExercice
await supabase.from("audit_logs").insert({
  entity_type: "exercice",
  action: "change_exercice",
  old_values: { exercice: previousExercice },
  new_values: { exercice: year },
  user_id: user.id,
});
```

---

## 9. Cycle Annuel

### 9.1 Calendrier type

| Période | Actions |
|---------|---------|
| **Sept-Oct N-1** | Préparation budget N (brouillon) |
| **Nov-Déc N-1** | Vote du budget, passage à "ouvert" |
| **1er Janvier N** | Passage à "en_cours" |
| **Janvier - Novembre N** | Exécution normale |
| **Décembre N** | Clôture provisoire |
| **Janv-Fév N+1** | Régularisations, clôture définitive |
| **Mars N+1** | Archivage |

### 9.2 Actions de transition

```sql
-- Ouvrir un exercice (après vote)
UPDATE exercices_budgetaires
SET statut = 'ouvert',
    date_ouverture = now()
WHERE annee = 2026;

-- Passer en exécution
UPDATE exercices_budgetaires
SET statut = 'en_cours'
WHERE annee = 2026;

-- Clôturer
UPDATE exercices_budgetaires
SET statut = 'cloture',
    date_cloture = now()
WHERE annee = 2026;

-- Désactiver l'ancien, activer le nouveau
UPDATE exercices_budgetaires SET est_actif = false WHERE annee = 2025;
UPDATE exercices_budgetaires SET est_actif = true WHERE annee = 2026;
```

---

## 10. Multi-Exercice et Reports

### 10.1 Consultation multi-exercice

Certains rapports peuvent consulter plusieurs exercices :

```typescript
function useRapportMultiExercice(annees: number[]) {
  return useQuery({
    queryKey: ["rapport-multi", annees],
    queryFn: async () => {
      const { data } = await supabase
        .from("budget_lines")
        .select("*")
        .in("exercice", annees); // Plusieurs années
      return data;
    },
  });
}
```

### 10.2 Reports de crédits

Les crédits non consommés peuvent être reportés :

```typescript
interface ReportCredit {
  ligne_origine_id: string;    // Ligne exercice N-1
  ligne_destination_id: string; // Ligne exercice N
  montant_reporte: number;
  motif: string;
}
```

---

## 11. Bonnes Pratiques

### 11.1 DO ✅

- Toujours filtrer par `exercice` dans les requêtes
- Inclure `exercice` dans les clés de query
- Vérifier `canWrite` avant toute modification
- Afficher clairement l'exercice actif à l'utilisateur
- Auditer les changements d'exercice

### 11.2 DON'T ❌

- Ne jamais permettre la création sans exercice
- Ne pas mélanger les données de plusieurs exercices
- Ne pas supprimer physiquement un exercice
- Ne pas modifier directement le statut sans passer par les transitions
- Ne pas ignorer les restrictions des exercices clôturés

---

*Documentation générée le 2026-01-15*
