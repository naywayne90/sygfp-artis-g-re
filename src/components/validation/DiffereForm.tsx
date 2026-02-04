/**
 * Formulaire de différé pour les validations SYGFP
 * Champs : Motif (obligatoire), Condition de reprise (optionnel), Date de reprise (optionnel)
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DiffereFormData } from '@/types/validation';

interface DiffereFormProps {
  onSubmit: (data: DiffereFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DiffereForm({ onSubmit, onCancel, isLoading = false }: DiffereFormProps) {
  const [motif, setMotif] = useState('');
  const [conditionReprise, setConditionReprise] = useState('');
  const [dateReprisePrevue, setDateReprisePrevue] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!motif.trim()) {
      newErrors.motif = 'Le motif est obligatoire';
    } else if (motif.trim().length < 10) {
      newErrors.motif = 'Le motif doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ motif: true });

    if (!validateForm()) return;

    onSubmit({
      motif: motif.trim(),
      conditionReprise: conditionReprise.trim() || undefined,
      dateReprisePrevue: dateReprisePrevue || null,
    });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alerte d'information */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Le différé suspend temporairement le traitement. Indiquez les conditions de reprise.
        </p>
      </div>

      {/* Motif du différé */}
      <div className="space-y-2">
        <Label htmlFor="motif" className="flex items-center gap-1">
          Motif du différé <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="motif"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          onBlur={() => handleBlur('motif')}
          placeholder="Expliquez pourquoi cette demande est différée..."
          rows={4}
          className={cn(
            touched.motif && errors.motif && 'border-red-500 focus-visible:ring-red-500'
          )}
          disabled={isLoading}
        />
        {touched.motif && errors.motif && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.motif}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {motif.length}/10 caractères minimum
        </p>
      </div>

      {/* Condition de reprise */}
      <div className="space-y-2">
        <Label htmlFor="conditionReprise">Condition de reprise (optionnel)</Label>
        <Input
          id="conditionReprise"
          value={conditionReprise}
          onChange={(e) => setConditionReprise(e.target.value)}
          placeholder="Ex: Réception du document manquant..."
          disabled={isLoading}
        />
      </div>

      {/* Date de reprise prévue */}
      <div className="space-y-2">
        <Label htmlFor="dateReprise">Date de reprise prévue (optionnel)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="dateReprise"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateReprisePrevue && 'text-muted-foreground'
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateReprisePrevue ? (
                format(dateReprisePrevue, 'dd MMMM yyyy', { locale: fr })
              ) : (
                'Sélectionner une date'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateReprisePrevue}
              onSelect={setDateReprisePrevue}
              locale={fr}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-white"
          disabled={isLoading || !motif.trim() || motif.trim().length < 10}
        >
          {isLoading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Confirmer le différé
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
