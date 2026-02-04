/**
 * InterimForm - Formulaire de création/modification d'intérim
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, UserCheck, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useUsersForInterim, type Profile, type CreateInterimParams } from '@/hooks/useInterim';

// ============================================================================
// TYPES & VALIDATION
// ============================================================================

const interimFormSchema = z.object({
  titulaire_id: z.string().min(1, 'Veuillez sélectionner le titulaire'),
  interimaire_id: z.string().min(1, "Veuillez sélectionner l'intérimaire"),
  date_debut: z.date({
    required_error: 'La date de début est requise',
  }),
  date_fin: z.date({
    required_error: 'La date de fin est requise',
  }),
  motif: z.string().min(5, 'Le motif doit contenir au moins 5 caractères').max(500, 'Le motif ne doit pas dépasser 500 caractères'),
}).refine(
  (data) => data.date_fin >= data.date_debut,
  {
    message: 'La date de fin doit être postérieure ou égale à la date de début',
    path: ['date_fin'],
  }
).refine(
  (data) => data.titulaire_id !== data.interimaire_id,
  {
    message: "Le titulaire et l'intérimaire doivent être différents",
    path: ['interimaire_id'],
  }
);

type InterimFormValues = z.infer<typeof interimFormSchema>;

export interface InterimFormProps {
  /** Valeurs initiales pour modification */
  initialValues?: Partial<InterimFormValues>;
  /** Callback lors de la soumission */
  onSubmit: (data: CreateInterimParams) => Promise<void>;
  /** Callback lors de l'annulation */
  onCancel?: () => void;
  /** En cours de chargement */
  isLoading?: boolean;
  /** Mode édition */
  isEditing?: boolean;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export function InterimForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: InterimFormProps) {
  const { data: users = [], isLoading: isLoadingUsers } = useUsersForInterim();
  const [selectedTitulaire, setSelectedTitulaire] = useState<Profile | null>(null);
  const [selectedInterimaire, setSelectedInterimaire] = useState<Profile | null>(null);

  const form = useForm<InterimFormValues>({
    resolver: zodResolver(interimFormSchema),
    defaultValues: {
      titulaire_id: initialValues?.titulaire_id || '',
      interimaire_id: initialValues?.interimaire_id || '',
      date_debut: initialValues?.date_debut || new Date(),
      date_fin: initialValues?.date_fin || addDays(new Date(), 7),
      motif: initialValues?.motif || '',
    },
  });

  const watchTitulaireId = form.watch('titulaire_id');
  const watchInterimaireId = form.watch('interimaire_id');

  // Mettre à jour les profils sélectionnés
  useEffect(() => {
    if (watchTitulaireId) {
      setSelectedTitulaire(users.find((u) => u.id === watchTitulaireId) || null);
    }
  }, [watchTitulaireId, users]);

  useEffect(() => {
    if (watchInterimaireId) {
      setSelectedInterimaire(users.find((u) => u.id === watchInterimaireId) || null);
    }
  }, [watchInterimaireId, users]);

  const handleFormSubmit = async (values: InterimFormValues) => {
    await onSubmit({
      titulaire_id: values.titulaire_id,
      interimaire_id: values.interimaire_id,
      date_debut: format(values.date_debut, 'yyyy-MM-dd'),
      date_fin: format(values.date_fin, 'yyyy-MM-dd'),
      motif: values.motif,
    });
  };

  const getUserLabel = (user: Profile) => {
    const name = user.full_name || `${user.first_name} ${user.last_name}`;
    const role = user.role_hierarchique ? ` (${user.role_hierarchique})` : '';
    return `${name}${role}`;
  };

  const filteredUsersForInterimaire = users.filter(
    (u) => u.id !== watchTitulaireId
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Sélection du titulaire */}
        <FormField
          control={form.control}
          name="titulaire_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titulaire (personne remplacée)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le titulaire..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingUsers ? (
                    <div className="p-2 text-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserLabel(user)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                La personne qui sera absente et dont les droits seront délégués
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Info titulaire */}
        {selectedTitulaire && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium">
              {selectedTitulaire.full_name || `${selectedTitulaire.first_name} ${selectedTitulaire.last_name}`}
            </p>
            <p className="text-muted-foreground">{selectedTitulaire.email}</p>
            {selectedTitulaire.poste && (
              <p className="text-muted-foreground">{selectedTitulaire.poste}</p>
            )}
            {selectedTitulaire.role_hierarchique && (
              <p className="text-xs text-primary mt-1">
                Niveau: {selectedTitulaire.role_hierarchique}
              </p>
            )}
          </div>
        )}

        {/* Sélection de l'intérimaire */}
        <FormField
          control={form.control}
          name="interimaire_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intérimaire (personne remplaçante)</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!watchTitulaireId || isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'intérimaire..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredUsersForInterimaire.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {getUserLabel(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                La personne qui effectuera les validations pendant l'absence
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Info intérimaire */}
        {selectedInterimaire && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-400">
                Intérimaire désigné
              </span>
            </div>
            <p className="font-medium">
              {selectedInterimaire.full_name || `${selectedInterimaire.first_name} ${selectedInterimaire.last_name}`}
            </p>
            <p className="text-muted-foreground">{selectedInterimaire.email}</p>
            {selectedInterimaire.role_hierarchique && (
              <p className="text-xs text-green-600 mt-1">
                Niveau: {selectedInterimaire.role_hierarchique}
              </p>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date début */}
          <FormField
            control={form.control}
            name="date_debut"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date fin */}
          <FormField
            control={form.control}
            name="date_fin"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < form.getValues('date_debut')}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Motif */}
        <FormField
          control={form.control}
          name="motif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motif de l'intérim</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Congés annuels, Mission à l'étranger, Formation..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Indiquez la raison de cet intérim (5-500 caractères)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Avertissement */}
        {selectedTitulaire && selectedInterimaire && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{selectedInterimaire.full_name || selectedInterimaire.first_name}</strong> pourra
              effectuer des validations et signatures au nom de{' '}
              <strong>{selectedTitulaire.full_name || selectedTitulaire.first_name}</strong> pendant
              la période spécifiée. Toutes les actions seront tracées dans le journal d'audit
              avec la mention "P.O." (Par Ordre).
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Mettre à jour" : "Créer l'intérim"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default InterimForm;
