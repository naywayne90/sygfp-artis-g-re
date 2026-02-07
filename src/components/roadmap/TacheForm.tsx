import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tache, TacheInput, TacheStatut, TachePriorite } from '@/types/roadmap';

const tacheSchema = z.object({
  code: z.string().min(1, 'Code requis'),
  libelle: z.string().min(1, 'Libelle requis'),
  description: z.string().nullable().optional(),
  sous_activite_id: z.string().min(1, 'Sous-activite requise'),
  date_debut: z.string().nullable().optional(),
  date_fin: z.string().nullable().optional(),
  duree_prevue: z.coerce.number().nullable().optional(),
  raci_responsable: z.string().nullable().optional(),
  raci_accountable: z.string().nullable().optional(),
  raci_consulted_text: z.string().optional(),
  raci_informed_text: z.string().optional(),
  responsable_id: z.string().nullable().optional(),
  statut: z
    .enum(['planifie', 'en_cours', 'termine', 'en_retard', 'suspendu', 'annule'])
    .default('planifie'),
  priorite: z.enum(['basse', 'normale', 'haute', 'critique']).default('normale'),
  avancement: z.coerce.number().min(0).max(100).default(0),
  budget_line_id: z.string().nullable().optional(),
  budget_prevu: z.coerce.number().min(0).default(0),
  livrables_text: z.string().optional(),
});

type TacheFormValues = z.infer<typeof tacheSchema>;

interface TacheFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TacheInput) => Promise<void>;
  defaultValues?: Partial<Tache>;
  sousActiviteId?: string;
  exercice: number;
  isLoading?: boolean;
}

const STATUT_OPTIONS: { value: TacheStatut; label: string }[] = [
  { value: 'planifie', label: 'Planifie' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Termine' },
  { value: 'en_retard', label: 'En retard' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'annule', label: 'Annule' },
];

const PRIORITE_OPTIONS: { value: TachePriorite; label: string }[] = [
  { value: 'basse', label: 'Basse' },
  { value: 'normale', label: 'Normale' },
  { value: 'haute', label: 'Haute' },
  { value: 'critique', label: 'Critique' },
];

export function TacheForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  sousActiviteId,
  exercice,
  isLoading,
}: TacheFormProps) {
  const [avancement, setAvancement] = useState(defaultValues?.avancement ?? 0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TacheFormValues>({
    resolver: zodResolver(tacheSchema),
    defaultValues: {
      code: defaultValues?.code ?? '',
      libelle: defaultValues?.libelle ?? '',
      description: defaultValues?.description ?? '',
      sous_activite_id: defaultValues?.sous_activite_id ?? sousActiviteId ?? '',
      date_debut: defaultValues?.date_debut ?? '',
      date_fin: defaultValues?.date_fin ?? '',
      duree_prevue: defaultValues?.duree_prevue ?? undefined,
      raci_responsable: defaultValues?.raci_responsable ?? '',
      raci_accountable: defaultValues?.raci_accountable ?? '',
      raci_consulted_text: defaultValues?.raci_consulted?.join(', ') ?? '',
      raci_informed_text: defaultValues?.raci_informed?.join(', ') ?? '',
      responsable_id: defaultValues?.responsable_id ?? '',
      statut: defaultValues?.statut ?? 'planifie',
      priorite: defaultValues?.priorite ?? 'normale',
      avancement: defaultValues?.avancement ?? 0,
      budget_prevu: defaultValues?.budget_prevu ?? 0,
      livrables_text: defaultValues?.livrables?.join(', ') ?? '',
    },
  });

  const statutValue = watch('statut');
  const prioriteValue = watch('priorite');

  const handleFormSubmit = async (values: TacheFormValues) => {
    const raci_consulted = values.raci_consulted_text
      ? values.raci_consulted_text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    const raci_informed = values.raci_informed_text
      ? values.raci_informed_text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;
    const livrables = values.livrables_text
      ? values.livrables_text
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    await onSubmit({
      code: values.code,
      libelle: values.libelle,
      description: values.description || null,
      sous_activite_id: values.sous_activite_id,
      date_debut: values.date_debut || null,
      date_fin: values.date_fin || null,
      duree_prevue: values.duree_prevue ?? null,
      raci_responsable: values.raci_responsable || null,
      raci_accountable: values.raci_accountable || null,
      raci_consulted,
      raci_informed,
      responsable_id: values.responsable_id || null,
      statut: values.statut,
      priorite: values.priorite,
      avancement: avancement,
      budget_line_id: values.budget_line_id || null,
      budget_prevu: values.budget_prevu,
      livrables,
      exercice,
    });

    reset();
    setAvancement(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues?.id ? 'Modifier la tache' : 'Nouvelle tache'}</DialogTitle>
          <DialogDescription>Remplissez les informations de la tache.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Code & Libelle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" {...register('code')} placeholder="T-001" />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle">Libelle *</Label>
              <Input id="libelle" {...register('libelle')} placeholder="Nom de la tache" />
              {errors.libelle && (
                <p className="text-sm text-destructive">{errors.libelle.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={2} />
          </div>

          {/* Sous-activite (hidden if provided) */}
          {!sousActiviteId && (
            <div className="space-y-2">
              <Label htmlFor="sous_activite_id">ID Sous-activite *</Label>
              <Input id="sous_activite_id" {...register('sous_activite_id')} />
              {errors.sous_activite_id && (
                <p className="text-sm text-destructive">{errors.sous_activite_id.message}</p>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_debut">Date debut</Label>
              <Input id="date_debut" type="date" {...register('date_debut')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_fin">Date fin</Label>
              <Input id="date_fin" type="date" {...register('date_fin')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duree_prevue">Duree prevue (j)</Label>
              <Input id="duree_prevue" type="number" {...register('duree_prevue')} />
            </div>
          </div>

          {/* Statut & Priorite */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={statutValue}
                onValueChange={(val) => setValue('statut', val as TacheStatut)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorite</Label>
              <Select
                value={prioriteValue}
                onValueChange={(val) => setValue('priorite', val as TachePriorite)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Avancement */}
          <div className="space-y-2">
            <Label>Avancement: {avancement}%</Label>
            <Slider
              value={[avancement]}
              onValueChange={(val) => setAvancement(val[0])}
              max={100}
              step={5}
            />
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget_prevu">Budget prevu (FCFA)</Label>
            <Input id="budget_prevu" type="number" {...register('budget_prevu')} />
          </div>

          {/* RACI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="raci_responsable">RACI - Responsable</Label>
              <Input
                id="raci_responsable"
                {...register('raci_responsable')}
                placeholder="Nom du responsable"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raci_accountable">RACI - Accountable</Label>
              <Input id="raci_accountable" {...register('raci_accountable')} placeholder="Nom" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="raci_consulted_text">RACI - Consultes (virgule)</Label>
              <Input
                id="raci_consulted_text"
                {...register('raci_consulted_text')}
                placeholder="Nom1, Nom2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raci_informed_text">RACI - Informes (virgule)</Label>
              <Input
                id="raci_informed_text"
                {...register('raci_informed_text')}
                placeholder="Nom1, Nom2"
              />
            </div>
          </div>

          {/* Livrables */}
          <div className="space-y-2">
            <Label htmlFor="livrables_text">Livrables (separes par virgule)</Label>
            <Input
              id="livrables_text"
              {...register('livrables_text')}
              placeholder="Rapport final, Presentation"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : defaultValues?.id ? 'Modifier' : 'Creer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
