# Guide Développeur SYGFP

> **Pour reprendre et étendre le projet**  
> Version: 2.0 | Derniere mise a jour: 2026-02-06

---

## 1. Prérequis

### 1.1 Environnement

- **Node.js** 18+ ou **Bun** runtime
- **Git** pour le versioning
- Éditeur avec support TypeScript (VS Code recommandé)
- Compte Lovable pour le déploiement

### 1.2 Extensions VS Code recommandées

- ESLint
- Tailwind CSS IntelliSense
- Prettier
- TypeScript Importer

---

## 2. Installation

### 2.1 Cloner et installer

```bash
# Cloner depuis GitHub (si connecté)
git clone <repo-url>
cd sygfp

# Installer les dépendances
npm install
# ou
bun install
```

### 2.2 Variables d'environnement

Le fichier `.env` contient les clés Supabase (déjà configuré dans Lovable) :

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 2.3 Lancer en développement

```bash
npm run dev
# ou
bun dev
```

L'application est disponible sur `http://localhost:8080`

### 2.4 Commandes disponibles

```bash
npm run dev           # Développement (port 8080)
npm run build         # Build production
npm run typecheck     # Vérification TypeScript
npm run lint          # ESLint
npm run lint:fix      # Correction automatique ESLint
npm run test          # Tests Vitest
npm run test:ui       # Vitest avec interface graphique
npm run test:coverage # Tests avec couverture
npm run test:e2e      # Tests Playwright
npm run test:e2e:ui   # Playwright avec interface graphique
npm run format        # Formater avec Prettier
npm run verify        # typecheck + lint + test
```

---

## 3. Structure Type d'un Module

### 3.1 Arborescence

```
src/
├── pages/
│   └── MonModule.tsx              # Page principale
│
├── components/mon-module/
│   ├── MonModuleList.tsx          # Liste avec filtres
│   ├── MonModuleForm.tsx          # Formulaire création/édition
│   ├── MonModuleDetails.tsx       # Détail en dialog
│   ├── MonModuleValidateDialog.tsx # Dialog de validation
│   ├── MonModuleRejectDialog.tsx   # Dialog de rejet
│   └── MonModuleDeferDialog.tsx    # Dialog de report
│
├── hooks/
│   ├── useMonModule.ts            # Hook CRUD principal
│   ├── useMonModuleList.ts        # Hook liste paginée (optionnel)
│   └── useMonModuleExport.ts      # Hook export (optionnel)
│
└── lib/mon-module/                # (optionnel)
    ├── types.ts                   # Types spécifiques
    ├── constants.ts               # Constantes
    └── helpers.ts                 # Fonctions utilitaires
```

### 3.2 Exemple de page

```tsx
// src/pages/MonModule.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonModuleList } from '@/components/mon-module/MonModuleList';
import { MonModuleForm } from '@/components/mon-module/MonModuleForm';
import { useMonModule } from '@/hooks/useMonModule';
import { useExercice } from '@/contexts/ExerciceContext';

export default function MonModule() {
  const { exercice } = useExercice();
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mon Module</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="brouillon">Brouillons</TabsTrigger>
          <TabsTrigger value="soumis">Soumis</TabsTrigger>
          <TabsTrigger value="valide">Validés</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <MonModuleList statut={activeTab === 'all' ? undefined : activeTab} />
        </TabsContent>
      </Tabs>

      <MonModuleForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
```

---

## 4. Patterns de Code

### 4.1 Hook CRUD Standard

```typescript
// src/hooks/useMonModule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { toast } from 'sonner';

export interface MonEntity {
  id: string;
  numero: string;
  objet: string;
  statut: string;
  montant: number;
  exercice: number;
  created_at: string;
  created_by: string;
}

export function useMonModule() {
  const queryClient = useQueryClient();
  const { exercice } = useExercice();

  // ========== LECTURE ==========
  const { data, isLoading, error } = useQuery({
    queryKey: ['mon-module', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ma_table')
        .select(
          `
          *,
          profiles!created_by(full_name),
          directions(code, label)
        `
        )
        .eq('exercice', exercice)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MonEntity[];
    },
    enabled: !!exercice,
  });

  // ========== CRÉATION ==========
  const createMutation = useMutation({
    mutationFn: async (values: Partial<MonEntity>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('ma_table')
        .insert({
          ...values,
          exercice,
          created_by: user?.id,
          statut: 'brouillon',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Créé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // ========== MISE À JOUR ==========
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<MonEntity> & { id: string }) => {
      const { error } = await supabase.from('ma_table').update(values).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Mis à jour');
    },
  });

  // ========== SOUMISSION ==========
  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ma_table')
        .update({
          statut: 'soumis',
          submitted_at: new Date().toISOString(),
          submitted_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Soumis pour validation');
    },
  });

  // ========== VALIDATION ==========
  const validateMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ma_table')
        .update({
          statut: 'valide',
          validated_at: new Date().toISOString(),
          validated_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Validé');
    },
  });

  // ========== REJET ==========
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('ma_table')
        .update({
          statut: 'rejete',
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id,
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Rejeté');
    },
  });

  // ========== SUPPRESSION (soft) ==========
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ma_table').update({ is_deleted: true }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mon-module'] });
      toast.success('Supprimé');
    },
  });

  return {
    data,
    isLoading,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    submit: submitMutation.mutate,
    validate: validateMutation.mutate,
    reject: rejectMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isSubmitting: submitMutation.isPending,
    isValidating: validateMutation.isPending,
  };
}
```

### 4.2 Composant Formulaire

```tsx
// src/components/mon-module/MonModuleForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMonModule } from '@/hooks/useMonModule';

const formSchema = z.object({
  objet: z.string().min(5, "L'objet doit contenir au moins 5 caractères"),
  montant: z.number().min(0, 'Le montant doit être positif'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MonModuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: MonEntity;
}

export function MonModuleForm({ open, onOpenChange, editItem }: MonModuleFormProps) {
  const { create, update, isCreating, isUpdating } = useMonModule();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editItem || {
      objet: '',
      montant: 0,
      description: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (editItem) {
      update(
        { id: editItem.id, ...values },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      create(values, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Modifier' : 'Nouveau'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="objet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Objet de la demande" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="montant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {editItem ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.3 Composant Liste

```tsx
// src/components/mon-module/MonModuleList.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMonModule } from '@/hooks/useMonModule';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonModuleListProps {
  statut?: string;
}

export function MonModuleList({ statut }: MonModuleListProps) {
  const { data, isLoading } = useMonModule();

  const filteredData = statut ? data?.filter((item) => item.statut === statut) : data;

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!filteredData?.length) {
    return <div className="text-center py-8 text-muted-foreground">Aucun élément</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Objet</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredData.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono">{item.numero}</TableCell>
            <TableCell className="max-w-xs truncate">{item.objet}</TableCell>
            <TableCell>{item.montant?.toLocaleString()} FCFA</TableCell>
            <TableCell>
              <Badge variant={getVariant(item.statut)}>{item.statut}</Badge>
            </TableCell>
            <TableCell>
              {formatDistance(new Date(item.created_at), new Date(), {
                addSuffix: true,
                locale: fr,
              })}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                Voir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getVariant(statut: string) {
  switch (statut) {
    case 'valide':
      return 'default';
    case 'rejete':
      return 'destructive';
    case 'soumis':
      return 'secondary';
    default:
      return 'outline';
  }
}
```

### 4.4 Dialog de Validation

```tsx
// src/components/mon-module/MonModuleValidateDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useMonModule } from '@/hooks/useMonModule';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  item: MonEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MonModuleValidateDialog({ item, open, onOpenChange }: Props) {
  const { validate, isValidating } = useMonModule();
  const { canValidateMonModule } = usePermissions();

  if (!canValidateMonModule()) {
    return null;
  }

  const handleValidate = () => {
    validate(item.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la validation</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir valider "{item.objet}" ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleValidate} disabled={isValidating}>
            Valider
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## 5. Ajouter une Nouvelle Page

### 5.1 Créer la page

```tsx
// src/pages/MaNouvellePage.tsx
export default function MaNouvellePage() {
  return (
    <div className="container mx-auto py-6">
      <h1>Ma Nouvelle Page</h1>
    </div>
  );
}
```

### 5.2 Ajouter la route

```tsx
// src/App.tsx
import MaNouvellePage from './pages/MaNouvellePage';

// Dans les routes
<Route path="/ma-nouvelle-page" element={<MaNouvellePage />} />;
```

### 5.3 Ajouter au menu

```tsx
// src/components/layout/AppSidebar.tsx

// Dans le tableau approprié
{ title: "Ma Nouvelle Page", url: "/ma-nouvelle-page", icon: FileText },
```

---

## 6. Ajouter une Migration

### 6.1 Utiliser l'outil Lovable

Dans le chat Lovable, demander une migration :

```
Crée une migration pour ajouter la table xxx avec les colonnes yyy
```

### 6.2 Vérifier les types

Après migration, les types sont automatiquement régénérés dans `src/integrations/supabase/types.ts`.

---

## 7. Tests

### 7.1 Tests manuels

1. Créer un élément en brouillon
2. Le soumettre
3. Se connecter avec un autre rôle
4. Valider ou rejeter
5. Vérifier l'audit trail

### 7.2 Vérifications

- [ ] RLS fonctionne (tester avec différents rôles)
- [ ] Les validations Zod bloquent les données invalides
- [ ] Les messages d'erreur sont clairs
- [ ] L'exercice est bien filtré
- [ ] L'audit log est créé

---

## 8. Déploiement

### 8.1 Preview

Chaque modification dans Lovable génère un preview automatique.

### 8.2 Production

1. Cliquer sur "Publish" dans l'interface Lovable
2. Vérifier le site publié
3. Tester les fonctionnalités critiques

---

## 9. Debugging

### 9.1 Console browser

```javascript
// Vérifier les données
console.log(data);

// Vérifier les erreurs Supabase
const { data, error } = await supabase.from('table').select('*');
if (error) console.error(error);
```

### 9.2 Logs Supabase

Consulter les logs dans le dashboard Supabase :

- Database → Logs
- Auth → Logs
- Edge Functions → Logs

### 9.3 RLS issues

```sql
-- Tester une policy
SELECT * FROM notes_sef
WHERE has_role(auth.uid(), 'DG');
```

---

## 10. Checklist PR

Avant chaque modification majeure :

- [ ] Code compile sans erreur TypeScript
- [ ] Pas de `console.log` oubliés
- [ ] Les nouveaux composants suivent les conventions
- [ ] Les hooks utilisent les patterns établis
- [ ] Les messages utilisateur sont en français
- [ ] Les migrations incluent RLS
- [ ] La documentation est mise à jour

---

_Documentation generee le 2026-01-15, mise a jour le 2026-02-06_
