/**
 * Formulaire de rejet pour les validations SYGFP
 * Champ : Motif du rejet (obligatoire, min 10 caractères)
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RejetFormData } from '@/types/validation';

interface RejetFormProps {
  onSubmit: (data: RejetFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  entityLabel?: string;
}

export function RejetForm({
  onSubmit,
  onCancel,
  isLoading = false,
  entityLabel = 'cette demande',
}: RejetFormProps) {
  const [motif, setMotif] = useState('');
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
    });
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alerte d'avertissement */}
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-red-800">
          <p className="font-medium">Attention : action irréversible</p>
          <p>Le rejet de {entityLabel} sera définitif et sera enregistré dans le journal d'audit.</p>
        </div>
      </div>

      {/* Motif du rejet */}
      <div className="space-y-2">
        <Label htmlFor="motif" className="flex items-center gap-1">
          Motif du rejet <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="motif"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          onBlur={() => handleBlur('motif')}
          placeholder="Expliquez précisément les raisons du rejet..."
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

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Annuler
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={isLoading || !motif.trim() || motif.trim().length < 10}
        >
          {isLoading ? (
            <>
              <XCircle className="mr-2 h-4 w-4 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <XCircle className="mr-2 h-4 w-4" />
              Confirmer le rejet
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
