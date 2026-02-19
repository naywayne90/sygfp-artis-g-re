import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, X, Filter, ChevronDown, ChevronUp, Calendar, Star, Save } from 'lucide-react';
import { DossierFilters } from '@/hooks/useDossiers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface DossierSearchProps {
  filters: Partial<DossierFilters>;
  onFiltersChange: (filters: Partial<DossierFilters>) => void;
  directions: { id: string; code: string; label: string; sigle: string | null }[];
  beneficiaires: { id: string; raison_sociale: string | null }[];
  users: { id: string; full_name: string | null; email: string }[];
  exercices: number[];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: Partial<DossierFilters>;
  is_default: boolean;
  created_at: string;
}

const STATUTS = [
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-500' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-500' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-500' },
  { value: 'suspendu', label: 'Suspendu', color: 'bg-yellow-500' },
  { value: 'bloque', label: 'Bloqué', color: 'bg-orange-500' },
];

const ETAPES = [
  { value: 'note_sef', label: 'Note SEF', step: 1 },
  { value: 'note_aef', label: 'Note AEF', step: 2 },
  { value: 'imputation', label: 'Imputation', step: 3 },
  { value: 'expression_besoin', label: 'Expression besoin', step: 4 },
  { value: 'passation_marche', label: 'Passation marché', step: 5 },
  { value: 'engagement', label: 'Engagement', step: 6 },
  { value: 'liquidation', label: 'Liquidation', step: 7 },
  { value: 'ordonnancement', label: 'Ordonnancement', step: 8 },
  { value: 'reglement', label: 'Règlement', step: 9 },
];

const TYPES_DOSSIER = [
  { value: 'AEF', label: 'AEF - Achat/Engagement/Facture' },
  { value: 'SEF', label: 'SEF - Service/Engagement/Facture' },
  { value: 'MARCHE', label: 'Marché public' },
];

export function DossierSearch({
  filters,
  onFiltersChange,
  directions,
  beneficiaires,
  users,
  exercices,
}: DossierSearchProps) {
  const _queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(filters.search || '');
  const [openBeneficiairePopover, setOpenBeneficiairePopover] = useState(false);

  // Fetch OS (Objectifs Stratégiques)
  const { data: objectifsStrategiquesData } = useQuery({
    queryKey: ['objectifs-strategiques-search'],
    queryFn: async (): Promise<Array<{ id: string; code: string; libelle: string }>> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = supabase.from('objectifs_strategiques').select('id, code, libelle') as any;
      const { data } = await query.eq('est_actif', true);
      return (data || []).sort((a: { code?: string }, b: { code?: string }) =>
        (a.code || '').localeCompare(b.code || '')
      );
    },
  });
  const objectifsStrategiques = objectifsStrategiquesData || [];

  // Fetch Missions
  const { data: missionsData } = useQuery({
    queryKey: ['missions-search'],
    queryFn: async (): Promise<Array<{ id: string; code: string; libelle: string }>> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query = supabase.from('missions').select('id, code, libelle') as any;
      const { data } = await query.eq('est_active', true);
      return (data || []).sort((a: { code?: string }, b: { code?: string }) =>
        (a.code || '').localeCompare(b.code || '')
      );
    },
  });
  const missions = missionsData || [];

  // Fetch saved filters (from localStorage for now, could be DB)
  const savedFilters = useMemo(() => {
    const stored = localStorage.getItem('sygfp_saved_filters');
    if (stored) {
      try {
        return JSON.parse(stored) as SavedFilter[];
      } catch {
        return [];
      }
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSaveDialog]); // Re-read when dialog closes

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDebounce !== filters.search) {
        onFiltersChange({ ...filters, search: searchDebounce });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDebounce]);

  // Sync search from filters
  useEffect(() => {
    setSearchDebounce(filters.search || '');
  }, [filters.search]);

  const handleReset = () => {
    onFiltersChange({
      search: '',
      direction_id: '',
      exercice: null,
      statut: '',
      etape: '',
      type_dossier: '',
      date_debut: '',
      date_fin: '',
      montant_min: null,
      montant_max: null,
      beneficiaire_id: '',
      created_by: '',
      en_retard: false,
      mes_dossiers: false,
    });
    setSearchDebounce('');
  };

  const hasFilters =
    filters.search ||
    filters.direction_id ||
    filters.statut ||
    filters.etape ||
    filters.type_dossier ||
    filters.date_debut ||
    filters.date_fin ||
    filters.montant_min !== null ||
    filters.montant_max !== null ||
    filters.beneficiaire_id ||
    filters.created_by ||
    filters.en_retard ||
    filters.mes_dossiers;

  const countActiveFilters = () => {
    let count = 0;
    if (filters.direction_id) count++;
    if (filters.statut) count++;
    if (filters.etape) count++;
    if (filters.type_dossier) count++;
    if (filters.date_debut || filters.date_fin) count++;
    if (filters.montant_min !== null || filters.montant_max !== null) count++;
    if (filters.beneficiaire_id) count++;
    if (filters.created_by) count++;
    if (filters.en_retard) count++;
    if (filters.mes_dossiers) count++;
    return count;
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Veuillez saisir un nom pour ce filtre');
      return;
    }

    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: filterName.trim(),
      filters: { ...filters },
      is_default: false,
      created_at: new Date().toISOString(),
    };

    const existing = [...savedFilters];
    existing.push(newFilter);
    localStorage.setItem('sygfp_saved_filters', JSON.stringify(existing));

    toast.success('Filtre sauvegardé', {
      description: `Le filtre "${filterName}" a été enregistré.`,
    });
    setFilterName('');
    setShowSaveDialog(false);
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters);
    toast.success(`Filtre "${savedFilter.name}" appliqué`);
  };

  const handleDeleteFilter = (filterId: string) => {
    const updated = savedFilters.filter((f) => f.id !== filterId);
    localStorage.setItem('sygfp_saved_filters', JSON.stringify(updated));
    toast.success('Filtre supprimé');
  };

  const _handleSetDefaultFilter = (filterId: string) => {
    const updated = savedFilters.map((f) => ({
      ...f,
      is_default: f.id === filterId,
    }));
    localStorage.setItem('sygfp_saved_filters', JSON.stringify(updated));
    toast.success('Filtre défini par défaut');
  };

  // Get selected beneficiaire name
  const selectedBeneficiaire = beneficiaires.find((b) => b.id === filters.beneficiaire_id);

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale - Style moteur de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, objet, bénéficiaire, code budget, n° engagement..."
            value={searchDebounce}
            onChange={(e) => setSearchDebounce(e.target.value)}
            className="pl-12 h-12 text-base rounded-full border-2 focus:border-primary shadow-sm"
          />
          {searchDebounce && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              onClick={() => {
                setSearchDebounce('');
                onFiltersChange({ ...filters, search: '' });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 px-4"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
          {countActiveFilters() > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 min-w-[20px]">
              {countActiveFilters()}
            </Badge>
          )}
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={handleReset} className="h-12">
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Filtres sauvegardés - Chips */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3" /> Favoris :
          </span>
          {savedFilters.map((sf) => (
            <TooltipProvider key={sf.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={sf.is_default ? 'default' : 'secondary'}
                    className="cursor-pointer hover:bg-primary/80 transition-colors flex items-center gap-1"
                    onClick={() => handleLoadFilter(sf)}
                  >
                    {sf.is_default && <Star className="h-3 w-3" />}
                    {sf.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFilter(sf.id);
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cliquez pour appliquer ce filtre</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}

      {/* Filtres de base */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg border animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filtres de recherche</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={!hasFilters}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Type dossier */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type dossier</Label>
              <Select
                value={filters.type_dossier || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, type_dossier: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {TYPES_DOSSIER.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direction */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Direction</Label>
              <Select
                value={filters.direction_id || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, direction_id: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {directions.map((dir) => (
                    <SelectItem key={dir.id} value={dir.id}>
                      {dir.sigle || dir.code} - {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statut */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Statut</Label>
              <Select
                value={filters.statut || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, statut: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.color}`} />
                        {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Étape */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Étape courante</Label>
              <Select
                value={filters.etape || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, etape: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {ETAPES.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 w-5 p-0 justify-center text-xs">
                          {e.step}
                        </Badge>
                        {e.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exercice */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Exercice</Label>
              <Select
                value={filters.exercice?.toString() || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    exercice: value === 'all' ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Courant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Courant</SelectItem>
                  {exercices.map((ex) => (
                    <SelectItem key={ex} value={ex.toString()}>
                      {ex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres avancés */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm font-medium">Filtres avancés</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Ligne 1: Dates et montants */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Plage de dates */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Date début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.date_debut
                          ? format(new Date(filters.date_debut), 'dd/MM/yyyy', { locale: fr })
                          : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.date_debut ? new Date(filters.date_debut) : undefined}
                        onSelect={(date) =>
                          onFiltersChange({
                            ...filters,
                            date_debut: date ? format(date, 'yyyy-MM-dd') : '',
                          })
                        }
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Date fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.date_fin
                          ? format(new Date(filters.date_fin), 'dd/MM/yyyy', { locale: fr })
                          : 'Sélectionner'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filters.date_fin ? new Date(filters.date_fin) : undefined}
                        onSelect={(date) =>
                          onFiltersChange({
                            ...filters,
                            date_fin: date ? format(date, 'yyyy-MM-dd') : '',
                          })
                        }
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fourchette de montant */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Montant min (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.montant_min ?? ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        montant_min: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Montant max (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.montant_max ?? ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        montant_max: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              {/* Ligne 2: Bénéficiaire, Créateur, OS, Mission */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Bénéficiaire / Prestataire avec recherche */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Prestataire / Bénéficiaire</Label>
                  <Popover open={openBeneficiairePopover} onOpenChange={setOpenBeneficiairePopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                      >
                        <span className="truncate">
                          {selectedBeneficiaire?.raison_sociale || 'Tous'}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un prestataire..." />
                        <CommandList>
                          <CommandEmpty>Aucun prestataire trouvé</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => {
                                onFiltersChange({ ...filters, beneficiaire_id: '' });
                                setOpenBeneficiairePopover(false);
                              }}
                            >
                              Tous les prestataires
                            </CommandItem>
                            {beneficiaires.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={b.raison_sociale || ''}
                                onSelect={() => {
                                  onFiltersChange({ ...filters, beneficiaire_id: b.id });
                                  setOpenBeneficiairePopover(false);
                                }}
                              >
                                {b.raison_sociale || 'Sans nom'}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Créateur */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Créé par</Label>
                  <Select
                    value={filters.created_by || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({ ...filters, created_by: value === 'all' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* OS */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Objectif stratégique</Label>
                  <Select
                    value={((filters as Record<string, unknown>).os_id as string) || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        os_id: value === 'all' ? '' : value,
                      } as Partial<DossierFilters>)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {objectifsStrategiques.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          {os.code} - {os.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mission */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Mission</Label>
                  <Select
                    value={((filters as Record<string, unknown>).mission_id as string) || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        mission_id: value === 'all' ? '' : value,
                      } as Partial<DossierFilters>)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {missions.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.code} - {m.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ligne 3: Checkboxes */}
              <div className="flex flex-wrap gap-6 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mes_dossiers"
                    checked={filters.mes_dossiers || false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, mes_dossiers: !!checked })
                    }
                  />
                  <Label htmlFor="mes_dossiers" className="text-sm cursor-pointer font-medium">
                    Mes dossiers uniquement
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="en_retard"
                    checked={filters.en_retard || false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({ ...filters, en_retard: !!checked })
                    }
                  />
                  <Label htmlFor="en_retard" className="text-sm cursor-pointer text-destructive">
                    Dossiers en retard
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Dialog pour sauvegarder le filtre */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder ce filtre</DialogTitle>
            <DialogDescription>
              Donnez un nom à ce filtre pour le retrouver rapidement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du filtre</Label>
              <Input
                placeholder="Ex: Mes dossiers en cours, Engagements DAF..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Filtres sélectionnés :</p>
              <div className="flex flex-wrap gap-1">
                {filters.type_dossier && <Badge variant="outline">{filters.type_dossier}</Badge>}
                {filters.direction_id && <Badge variant="outline">Direction</Badge>}
                {filters.statut && <Badge variant="outline">{filters.statut}</Badge>}
                {filters.etape && <Badge variant="outline">{filters.etape}</Badge>}
                {filters.beneficiaire_id && <Badge variant="outline">Prestataire</Badge>}
                {filters.date_debut && <Badge variant="outline">Depuis {filters.date_debut}</Badge>}
                {filters.date_fin && <Badge variant="outline">Jusqu'au {filters.date_fin}</Badge>}
                {filters.montant_min && <Badge variant="outline">≥ {filters.montant_min}</Badge>}
                {filters.montant_max && <Badge variant="outline">≤ {filters.montant_max}</Badge>}
                {filters.mes_dossiers && <Badge variant="outline">Mes dossiers</Badge>}
                {filters.en_retard && <Badge variant="destructive">En retard</Badge>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveFilter}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
