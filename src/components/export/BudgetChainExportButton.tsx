/**
 * Composant de bouton d'export Excel pour la chaîne d'exécution budgétaire
 *
 * Propose deux options:
 * - Exporter tout: Exporte toutes les données de l'exercice
 * - Exporter filtré: Exporte uniquement les données filtrées (statut, dates)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileSpreadsheet, Filter, Loader2 } from 'lucide-react';
import { useExportBudgetChain, ExportStep, ExportFilters } from '@/hooks/useExportBudgetChain';
import { useDirections } from '@/hooks/useDirections';

interface BudgetChainExportButtonProps {
  step: ExportStep;
  /** Filtres par défaut (ex: statut courant de l'onglet actif) */
  defaultFilters?: ExportFilters;
  /** Options de statut disponibles pour ce type */
  statutOptions?: { value: string; label: string }[];
  /** Afficher le bouton de façon compacte (icône seulement) */
  compact?: boolean;
  /** Variante du bouton */
  variant?: 'default' | 'outline' | 'ghost';
  /** Taille du bouton */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const STEP_LABELS: Record<ExportStep, string> = {
  expression: 'Expressions de Besoin',
  engagement: 'Engagements',
  liquidation: 'Liquidations',
  ordonnancement: 'Ordonnancements',
  reglement: 'Règlements',
};

const DEFAULT_STATUT_OPTIONS: Record<ExportStep, { value: string; label: string }[]> = {
  expression: [
    { value: '', label: 'Tous les statuts' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'soumis', label: 'Soumis' },
    { value: 'valide', label: 'Validé' },
    { value: 'rejete', label: 'Rejeté' },
    { value: 'differe', label: 'Différé' },
    { value: 'satisfaite', label: 'Satisfaite' },
  ],
  engagement: [
    { value: '', label: 'Tous les statuts' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'soumis', label: 'Soumis' },
    { value: 'valide', label: 'Validé' },
    { value: 'rejete', label: 'Rejeté' },
    { value: 'differe', label: 'Différé' },
  ],
  liquidation: [
    { value: '', label: 'Tous les statuts' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'soumis', label: 'Soumis' },
    { value: 'valide', label: 'Validé' },
    { value: 'rejete', label: 'Rejeté' },
    { value: 'differe', label: 'Différé' },
  ],
  ordonnancement: [
    { value: '', label: 'Tous les statuts' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'soumis', label: 'Soumis' },
    { value: 'valide', label: 'Validé' },
    { value: 'rejete', label: 'Rejeté' },
    { value: 'differe', label: 'Différé' },
  ],
  reglement: [
    { value: '', label: 'Tous les statuts' },
    { value: 'valide', label: 'Validé' },
    { value: 'rejete', label: 'Rejeté' },
  ],
};

export function BudgetChainExportButton({
  step,
  defaultFilters = {},
  statutOptions,
  compact = false,
  variant = 'outline',
  size = 'sm',
}: BudgetChainExportButtonProps) {
  const { isExporting, exportStep } = useExportBudgetChain();
  const { data: directions = [] } = useDirections();
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>(defaultFilters);

  const effectiveStatutOptions = statutOptions || DEFAULT_STATUT_OPTIONS[step];

  const handleExportAll = async () => {
    await exportStep(step, {}, true);
  };

  const handleExportFiltered = async () => {
    // Ouvrir le dialogue pour configurer les filtres
    setShowFilterDialog(true);
  };

  const handleConfirmFilteredExport = async () => {
    setShowFilterDialog(false);
    await exportStep(step, filters, false);
  };

  const handleFilterChange = (key: keyof ExportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {!compact && 'Exporter Excel'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleExportAll}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exporter tout
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportFiltered}>
            <Filter className="h-4 w-4 mr-2" />
            Exporter avec filtres...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogue de configuration des filtres */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export avec filtres</DialogTitle>
            <DialogDescription>
              Configurez les critères de filtrage pour l'export des {STEP_LABELS[step]}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Filtre par statut */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statut" className="text-right">
                Statut
              </Label>
              <div className="col-span-3">
                <Select
                  value={filters.statut || ''}
                  onValueChange={(value) => handleFilterChange('statut', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveStatutOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtre direction */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="direction" className="text-right">
                Direction
              </Label>
              <div className="col-span-3">
                <Select
                  value={filters.directionId || ''}
                  onValueChange={(value) => handleFilterChange('directionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les directions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les directions</SelectItem>
                    {directions.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id}>
                        {dir.sigle || dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtre date début */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateDebut" className="text-right">
                Du
              </Label>
              <div className="col-span-3">
                <Input
                  id="dateDebut"
                  type="date"
                  value={filters.dateDebut || ''}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                />
              </div>
            </div>

            {/* Filtre date fin */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateFin" className="text-right">
                Au
              </Label>
              <div className="col-span-3">
                <Input
                  id="dateFin"
                  type="date"
                  value={filters.dateFin || ''}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleConfirmFilteredExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BudgetChainExportButton;
