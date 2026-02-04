# Guide Code-Splitting - SYGFP

## Vue d'ensemble

Le code-splitting permet de diviser le bundle JavaScript en plusieurs fichiers chargés à la demande, réduisant le temps de chargement initial.

**Résultats obtenus:**
- Bundle initial: ~5 MB → ~425 KB (réduction de 90%)
- Vendors séparés en chunks dédiés
- Pages chargées uniquement quand visitées

## Configuration Vite

### vite.config.ts

```typescript
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // Composants UI Radix
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            // ... autres composants Radix
          ],

          // State management
          "vendor-query": ["@tanstack/react-query"],

          // Formulaires
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],

          // Graphiques
          "vendor-charts": ["recharts"],

          // Export PDF
          "vendor-pdf": ["jspdf", "jspdf-autotable"],

          // Export Excel
          "vendor-excel": ["xlsx"],

          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],

          // Date utilities
          "vendor-date": ["date-fns"],

          // Icons
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
```

## Lazy Loading des Pages

### Pattern de Base

```tsx
// src/App.tsx
import { lazy, Suspense } from "react";
import { PageLoader } from "@/components/shared/PageLoader";

// Import statique (chemin critique)
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/auth/LoginPage";

// Import lazy (chargé à la demande)
const NotesSEF = lazy(() => import("./pages/NotesSEF"));
const Engagements = lazy(() => import("./pages/Engagements"));

function App() {
  return (
    <Routes>
      {/* Pages critiques - import statique */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/auth" element={<LoginPage />} />

      {/* Pages secondaires - lazy loading avec Suspense */}
      <Route element={<LayoutWrapper />}>
        <Route path="/notes-sef" element={<NotesSEF />} />
        <Route path="/engagements" element={<Engagements />} />
      </Route>
    </Routes>
  );
}
```

### LayoutWrapper avec Suspense

```tsx
function LayoutWrapper() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
}
```

## Composant PageLoader

### src/components/shared/PageLoader.tsx

```tsx
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface PageLoaderProps {
  message?: string;
  variant?: "spinner" | "skeleton";
}

export function PageLoader({
  message = "Chargement...",
  variant = "skeleton"
}: PageLoaderProps) {
  if (variant === "spinner") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  // Skeleton - simule la structure d'une page
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full mb-3" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Bonnes Pratiques

### 1. Pages à garder en import statique

- `Dashboard` - Page d'accueil, toujours visitée
- `LoginPage` - Authentification
- `SelectExercice` - Sélection exercice
- `NotFound` - Page 404

### 2. Pages à mettre en lazy

- Toutes les pages de fonctionnalités
- Pages admin
- Pages rarement visitées

### 3. Éviter les doubles imports

Si une page est importée statiquement ET dynamiquement, Vite affiche un warning:

```
[plugin:vite:reporter] DashboardDirectionPage is dynamically imported
by App.tsx but also statically imported by Dashboard.tsx
```

**Solution:** Utiliser lazy import partout:

```tsx
// Dans Dashboard.tsx
const DashboardDirectionPage = lazy(
  () => import("@/pages/execution/DashboardDirectionPage")
);

return (
  <Suspense fallback={<DashboardSkeleton />}>
    <DashboardDirectionPage />
  </Suspense>
);
```

### 4. Préchargement (optionnel)

Pour les pages fréquemment visitées après la page actuelle:

```tsx
// Précharger au hover
<Link
  to="/notes-sef"
  onMouseEnter={() => {
    import("./pages/NotesSEF");
  }}
>
  Notes SEF
</Link>
```

## Vérification

### Analyser les chunks générés

```bash
# Build et voir les tailles
npm run build

# Output exemple:
# dist/assets/index-XXX.js        425.55 kB
# dist/assets/vendor-react-XXX.js  23.07 kB
# dist/assets/vendor-ui-XXX.js    300.98 kB
# dist/assets/NotesSEF-XXX.js      56.71 kB
```

### Vérifier le lazy loading

1. Ouvrir DevTools > Network
2. Naviguer vers une page lazy
3. Vérifier qu'un nouveau chunk est chargé

## Chunks Générés

| Chunk | Contenu | Taille |
|-------|---------|--------|
| `index.js` | Code applicatif principal | ~425 KB |
| `vendor-react.js` | React, React Router | ~23 KB |
| `vendor-ui.js` | Composants Radix UI | ~301 KB |
| `vendor-query.js` | TanStack Query | ~39 KB |
| `vendor-forms.js` | React Hook Form, Zod | ~80 KB |
| `vendor-charts.js` | Recharts | ~421 KB |
| `vendor-pdf.js` | jsPDF | ~420 KB |
| `vendor-excel.js` | XLSX | ~424 KB |
| `vendor-supabase.js` | Client Supabase | ~172 KB |
| `[Page].js` | Chaque page lazy | Variable |

## Métriques de Performance

### Avant Code-Splitting
- Bundle unique: ~5 MB
- Temps de chargement initial: ~8s (3G)

### Après Code-Splitting
- Bundle initial: ~800 KB (vendors critiques)
- Temps de chargement initial: ~2s (3G)
- Pages additionnelles: ~50-100 KB chacune
