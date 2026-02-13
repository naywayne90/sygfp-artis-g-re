import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CreditCard,
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Building,
  Target,
  FileText,
  Banknote,
  XCircle,
  Shield,
  History,
  Database,
} from 'lucide-react';
import { useImputation, BudgetAvailability, ImputationData } from '@/hooks/useImputation';
import { useNavigate } from 'react-router-dom';
import { useExercice } from '@/contexts/ExerciceContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImputationSummaryCard } from './ImputationSummaryCard';
import { FundingSourceSelect } from '@/components/shared/FundingSourceSelect';

interface Note {
  id: string;
  numero: string | null;
  objet: string;
  montant_estime: number | null;
  direction?: { id: string; label: string; sigle: string | null } | null;
  created_by_profile?: { first_name: string | null; last_name: string | null } | null;
}

interface ImputationFormProps {
  note?: Note;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface BudgetLineOption {
  id: string;
  code: string;
  label: string;
  dotation_initiale: number;
  dotation_modifiee: number | null;
  total_engage: number;
  montant_reserve: number;
  os_id: string | null;
  direction_id: string | null;
}

const formatMontant = (montant: number) => new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';

const formatMontantInput = (value: number): string => {
  if (!value) return '';
  return new Intl.NumberFormat('fr-FR').format(value);
};

export function ImputationForm({ note, onSuccess, onCancel }: ImputationFormProps) {
  const navigate = useNavigate();
  const { exercice } = useExercice();
  const {
    notesAImputer,
    loadingNotes,
    objectifsStrategiques,
    missions,
    directions,
    nomenclaturesNBE,
    planComptableSYSCO,
    fetchActions,
    fetchActivites,
    fetchSousActivites,
    calculateAvailability,
    buildImputationCode,
    imputeNote,
    isImputing,
    isReadOnly,
    getDisabledMessage,
  } = useImputation();

  // Note AEF sélectionnée
  const [selectedNoteId, setSelectedNoteId] = useState<string>(note?.id || '');

  // État du formulaire
  const [formData, setFormData] = useState<Partial<ImputationData>>({
    noteId: note?.id || '',
    montant: note?.montant_estime || 0,
    os_id: null,
    mission_id: null,
    action_id: null,
    activite_id: null,
    sous_activite_id: null,
    direction_id: note?.direction?.id || null,
    nbe_id: null,
    sysco_id: null,
    source_financement: 'budget_etat',
    justification_depassement: '',
    forcer_imputation: false,
  });

  // Montant affiché formaté FCFA
  const [montantDisplay, setMontantDisplay] = useState(
    note?.montant_estime ? formatMontantInput(note.montant_estime) : ''
  );

  // Ligne budgétaire sélectionnée
  const [selectedBudgetLineId, setSelectedBudgetLineId] = useState<string>('');

  // Listes dépendantes
  const [actions, setActions] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [activites, setActivites] = useState<{ id: string; code: string; libelle: string }[]>([]);
  const [sousActivites, setSousActivites] = useState<
    { id: string; code: string; libelle: string }[]
  >([]);

  // Recherche
  const [nbeSearch, setNbeSearch] = useState('');
  const [syscoSearch, setSyscoSearch] = useState('');

  // Disponibilité budgétaire
  const [availability, setAvailability] = useState<BudgetAvailability | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch lignes budgétaires filtrées par exercice + direction
  const { data: budgetLines = [] } = useQuery({
    queryKey: ['budget-lines-form', exercice, formData.direction_id],
    queryFn: async () => {
      let query = supabase
        .from('budget_lines')
        .select(
          'id, code, label, dotation_initiale, dotation_modifiee, total_engage, montant_reserve, os_id, direction_id'
        )
        .eq('exercice', exercice || new Date().getFullYear())
        .eq('is_active', true)
        .order('code');

      if (formData.direction_id) {
        query = query.eq('direction_id', formData.direction_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as BudgetLineOption[];
    },
    enabled: !!exercice,
  });

  // Calculer le disponible pour chaque ligne budgétaire
  const getBudgetLineDisponible = (line: BudgetLineOption): number => {
    const dotation = line.dotation_modifiee ?? line.dotation_initiale;
    return dotation - (line.total_engage || 0) - (line.montant_reserve || 0);
  };

  // Trouver la note sélectionnée parmi notesAImputer
  const selectedNoteData = notesAImputer.find((n) => n.id === selectedNoteId) || null;

  // Quand la note AEF change, pré-remplir les champs
  const handleNoteSelect = useCallback(
    (noteId: string) => {
      setSelectedNoteId(noteId);
      const selected = notesAImputer.find((n) => n.id === noteId);
      if (!selected) return;

      const directionId = selected.direction_id || selected.direction?.id || null;
      const montant = selected.montant_estime || 0;

      setFormData((prev) => ({
        ...prev,
        noteId: selected.id,
        montant,
        direction_id: directionId,
        os_id: null,
        mission_id: null,
        action_id: null,
        activite_id: null,
        sous_activite_id: null,
        nbe_id: null,
        sysco_id: null,
      }));
      setMontantDisplay(montant > 0 ? formatMontantInput(montant) : '');
      setSelectedBudgetLineId('');
      setAvailability(null);

      // Si la note a une budget_line, pré-remplir OS depuis cette ligne
      if (selected.budget_line_id && selected.budget_line) {
        const bl = selected.budget_line as {
          id: string;
          os_id: string | null;
          direction_id: string | null;
        };
        if (bl.os_id) {
          setFormData((prev) => ({ ...prev, os_id: bl.os_id }));
        }
        setSelectedBudgetLineId(bl.id);
      }
    },
    [notesAImputer]
  );

  // Initialiser avec la note prop
  useEffect(() => {
    if (note?.id && notesAImputer.length > 0 && !selectedNoteId) {
      handleNoteSelect(note.id);
    }
  }, [note?.id, notesAImputer.length, selectedNoteId, handleNoteSelect]);

  // Quand une ligne budgétaire est sélectionnée, pré-remplir OS
  const handleBudgetLineSelect = (lineId: string) => {
    setSelectedBudgetLineId(lineId);
    const line = budgetLines.find((l) => l.id === lineId);
    if (line?.os_id) {
      setFormData((prev) => ({ ...prev, os_id: line.os_id }));
    }
  };

  // Charger les actions quand mission ou OS change
  useEffect(() => {
    if (formData.mission_id || formData.os_id) {
      fetchActions(formData.mission_id || undefined, formData.os_id || undefined).then(setActions);
    } else {
      setActions([]);
    }
    setFormData((prev) => ({
      ...prev,
      action_id: null,
      activite_id: null,
      sous_activite_id: null,
    }));
    setActivites([]);
    setSousActivites([]);
  }, [formData.mission_id, formData.os_id, fetchActions]);

  // Charger les activités quand action change
  useEffect(() => {
    if (formData.action_id) {
      fetchActivites(formData.action_id).then(setActivites);
    } else {
      setActivites([]);
    }
    setFormData((prev) => ({ ...prev, activite_id: null, sous_activite_id: null }));
    setSousActivites([]);
  }, [formData.action_id, fetchActivites]);

  // Charger les sous-activités quand activité change
  useEffect(() => {
    if (formData.activite_id) {
      fetchSousActivites(formData.activite_id).then(setSousActivites);
    } else {
      setSousActivites([]);
    }
    setFormData((prev) => ({ ...prev, sous_activite_id: null }));
  }, [formData.activite_id, fetchSousActivites]);

  // Calculer la disponibilité
  const handleCalculateAvailability = useCallback(async () => {
    if (!formData.montant) return;

    setIsCalculating(true);
    try {
      const result = await calculateAvailability({
        direction_id: formData.direction_id,
        os_id: formData.os_id,
        mission_id: formData.mission_id,
        action_id: formData.action_id,
        activite_id: formData.activite_id,
        sous_activite_id: formData.sous_activite_id,
        nbe_id: formData.nbe_id,
        sysco_id: formData.sysco_id,
        montant_actuel: formData.montant,
      });
      setAvailability(result);
    } catch {
      // L'erreur est gérée par le hook
    } finally {
      setIsCalculating(false);
    }
  }, [formData, calculateAvailability]);

  // Recalculer quand le montant ou les sélections changent
  useEffect(() => {
    if (formData.montant && formData.montant > 0) {
      const timer = setTimeout(handleCalculateAvailability, 500);
      return () => clearTimeout(timer);
    }
  }, [
    formData.montant,
    formData.direction_id,
    formData.os_id,
    formData.nbe_id,
    formData.sysco_id,
    handleCalculateAvailability,
  ]);

  // Gérer le champ montant formaté FCFA
  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\s/g, '').replace(/[^0-9]/g, '');
    const numValue = parseInt(raw, 10) || 0;
    setFormData((prev) => ({ ...prev, montant: numValue }));
    setMontantDisplay(numValue > 0 ? formatMontantInput(numValue) : '');
  };

  // Vérifier si la ligne budgétaire sélectionnée a un budget suffisant
  const selectedBudgetLine = budgetLines.find((l) => l.id === selectedBudgetLineId);
  const budgetLineDisponible = selectedBudgetLine
    ? getBudgetLineDisponible(selectedBudgetLine)
    : null;
  const isBudgetInsufficient =
    budgetLineDisponible !== null &&
    formData.montant !== undefined &&
    formData.montant > 0 &&
    formData.montant > budgetLineDisponible &&
    !formData.forcer_imputation;

  // Soumettre l'imputation
  const handleSubmit = async () => {
    if (!formData.montant || !formData.noteId) return;

    try {
      const result = await imputeNote(formData as ImputationData);
      onSuccess?.();
      navigate(`/marches?dossier=${result.dossier.id}`);
    } catch {
      // L'erreur est gérée par le hook
    }
  };

  // Code d'imputation construit
  const imputationCode = buildImputationCode(formData as ImputationData);

  // Filtrer NBE
  const filteredNBE = nomenclaturesNBE.filter(
    (n) =>
      n.code.toLowerCase().includes(nbeSearch.toLowerCase()) ||
      n.libelle.toLowerCase().includes(nbeSearch.toLowerCase())
  );

  // Filtrer SYSCO
  const filteredSYSCO = planComptableSYSCO.filter(
    (s) =>
      s.code?.toLowerCase().includes(syscoSearch.toLowerCase()) ||
      s.libelle?.toLowerCase().includes(syscoSearch.toLowerCase())
  );

  // Vérifier si la note est migrée
  const isMigrated = selectedNoteData?.is_migrated === true;

  return (
    <div className="space-y-6">
      {/* 1. Sélecteur Note AEF d'origine */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Note AEF d&apos;origine *
          </CardTitle>
          <CardDescription>Sélectionnez la note AEF validée à imputer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedNoteId} onValueChange={handleNoteSelect} disabled={loadingNotes}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingNotes ? 'Chargement des notes...' : 'Sélectionner une note AEF...'
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {notesAImputer.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {n.numero || n.reference_pivot || 'Sans numéro'}
                    </span>
                    <span className="text-muted-foreground">—</span>
                    <span className="truncate max-w-[250px]">{n.objet}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="font-medium">{formatMontant(n.montant_estime || 0)}</span>
                    {n.is_migrated && (
                      <Badge variant="outline" className="text-xs ml-1">
                        <Database className="h-3 w-3 mr-1" />
                        Migré
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              {notesAImputer.length === 0 && !loadingNotes && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune note AEF à imputer
                </div>
              )}
            </SelectContent>
          </Select>

          {/* Détails de la note sélectionnée */}
          {selectedNoteData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-3 bg-muted/50 rounded-lg">
              <div>
                <span className="text-muted-foreground">Demandeur :</span>
                <p className="font-medium">
                  {selectedNoteData.created_by_profile?.first_name || (isMigrated ? 'Migré' : '-')}{' '}
                  {selectedNoteData.created_by_profile?.last_name || ''}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Direction :</span>
                <p className="font-medium">
                  {selectedNoteData.direction?.sigle ||
                    selectedNoteData.direction?.label ||
                    (isMigrated ? 'Migré' : '-')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Montant estimé :</span>
                <p className="font-medium">{formatMontant(selectedNoteData.montant_estime || 0)}</p>
              </div>
              <div className="flex items-center gap-2">
                {isMigrated && (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Données migrées
                  </Badge>
                )}
                {imputationCode !== 'N/A' && (
                  <Badge variant="outline" className="font-mono text-xs">
                    Code: {imputationCode}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Le reste du formulaire n'est visible que si une note est sélectionnée */}
      {selectedNoteData && (
        <>
          {/* 2. Ligne budgétaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Ligne budgétaire *
              </CardTitle>
              <CardDescription>
                Filtrée par exercice {exercice} et direction{' '}
                {selectedNoteData.direction?.sigle || ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedBudgetLineId} onValueChange={handleBudgetLineSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une ligne budgétaire..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {budgetLines.map((line) => {
                    const disponible = getBudgetLineDisponible(line);
                    const montant = formData.montant || 0;
                    const isInsufficient = montant > 0 && montant > disponible;
                    return (
                      <SelectItem key={line.id} value={line.id}>
                        <div className="flex items-center gap-3 w-full">
                          <span className="font-mono text-xs">{line.code}</span>
                          <span className="truncate max-w-[180px] text-muted-foreground">
                            {line.label}
                          </span>
                          <span
                            className={`font-medium text-xs ml-auto ${
                              isInsufficient
                                ? 'text-destructive'
                                : disponible < montant * 1.5
                                  ? 'text-orange-600'
                                  : 'text-green-600'
                            }`}
                          >
                            Dispo: {formatMontant(disponible)}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  {budgetLines.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Aucune ligne budgétaire pour cette direction
                    </div>
                  )}
                </SelectContent>
              </Select>

              {/* Détails de la ligne sélectionnée */}
              {selectedBudgetLine && (
                <div className="grid grid-cols-3 gap-4 text-sm p-3 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground">Dotation :</span>
                    <p className="font-medium font-mono">
                      {formatMontant(
                        selectedBudgetLine.dotation_modifiee ?? selectedBudgetLine.dotation_initiale
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engagé actuel :</span>
                    <p className="font-medium font-mono text-orange-600">
                      {formatMontant(selectedBudgetLine.total_engage || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Disponible :</span>
                    <p
                      className={`font-bold font-mono ${
                        budgetLineDisponible !== null && budgetLineDisponible < 0
                          ? 'text-destructive'
                          : budgetLineDisponible !== null &&
                              formData.montant &&
                              formData.montant > budgetLineDisponible
                            ? 'text-destructive'
                            : 'text-green-600'
                      }`}
                    >
                      {formatMontant(budgetLineDisponible ?? 0)}
                    </p>
                  </div>
                </div>
              )}

              {/* BLOCAGE si montant > disponible */}
              {isBudgetInsufficient && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Budget insuffisant — Imputation bloquée</AlertTitle>
                  <AlertDescription>
                    Le montant demandé ({formatMontant(formData.montant || 0)}) dépasse le
                    disponible de la ligne ({formatMontant(budgetLineDisponible ?? 0)}). Déficit :{' '}
                    <strong>
                      {formatMontant((formData.montant || 0) - (budgetLineDisponible ?? 0))}
                    </strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Rattachement programmatique */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5" />
                  Rattachement programmatique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Objectif Stratégique */}
                  <div>
                    <Label>Objectif Stratégique</Label>
                    <Select
                      value={formData.os_id || ''}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, os_id: v || null }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner OS" />
                      </SelectTrigger>
                      <SelectContent>
                        {objectifsStrategiques.map((os) => (
                          <SelectItem key={os.id} value={os.id}>
                            <span className="font-mono text-xs">{os.code}</span> - {os.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mission */}
                  <div>
                    <Label>Mission</Label>
                    <Select
                      value={formData.mission_id || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, mission_id: v || null }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner mission" />
                      </SelectTrigger>
                      <SelectContent>
                        {missions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="font-mono text-xs">{m.code}</span> - {m.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action */}
                  <div>
                    <Label>Action</Label>
                    <Select
                      value={formData.action_id || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, action_id: v || null }))
                      }
                      disabled={actions.length === 0}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue
                          placeholder={
                            actions.length ? 'Sélectionner action' : "Choisir mission/OS d'abord"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {actions.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-mono text-xs">{a.code}</span> - {a.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Direction */}
                  <div>
                    <Label>Direction</Label>
                    <Select
                      value={formData.direction_id || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, direction_id: v || null }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {directions.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.sigle ? `${d.sigle} - ` : ''}
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Activité */}
                  <div>
                    <Label>Activité</Label>
                    <Select
                      value={formData.activite_id || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, activite_id: v || null }))
                      }
                      disabled={activites.length === 0}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue
                          placeholder={
                            activites.length ? 'Sélectionner activité' : "Choisir action d'abord"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {activites.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-mono text-xs">{a.code}</span> - {a.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sous-activité */}
                  <div>
                    <Label>Sous-activité</Label>
                    <Select
                      value={formData.sous_activite_id || ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, sous_activite_id: v || null }))
                      }
                      disabled={sousActivites.length === 0}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue
                          placeholder={
                            sousActivites.length
                              ? 'Sélectionner sous-activité'
                              : "Choisir activité d'abord"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sousActivites.map((sa) => (
                          <SelectItem key={sa.id} value={sa.id}>
                            <span className="font-mono text-xs">{sa.code}</span> - {sa.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nomenclatures */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Nomenclatures comptables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* NBE */}
                <div>
                  <Label>Nomenclature Budgétaire de l&apos;État (NBE)</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={nbeSearch}
                      onChange={(e) => setNbeSearch(e.target.value)}
                      placeholder="Rechercher NBE..."
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={formData.nbe_id || ''}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, nbe_id: v || null }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner NBE" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredNBE.slice(0, 50).map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{n.code}</span>
                            <span className="text-sm truncate max-w-[300px]">{n.libelle}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SYSCO */}
                <div>
                  <Label>Plan Comptable SYSCOHADA (SYSCO)</Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={syscoSearch}
                      onChange={(e) => setSyscoSearch(e.target.value)}
                      placeholder="Rechercher compte SYSCO..."
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={formData.sysco_id || ''}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, sysco_id: v || null }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner compte SYSCO" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredSYSCO.slice(0, 50).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs">{s.code}</span>
                            <span className="text-sm truncate max-w-[300px]">{s.libelle}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Source de financement */}
                <div>
                  <Label>Source de financement</Label>
                  <FundingSourceSelect
                    value={formData.source_financement}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, source_financement: v }))
                    }
                    useLegacyValue={true}
                    className="mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. Montant et disponibilité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Montant et disponibilité budgétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="montant">Montant à engager (FCFA) *</Label>
                  <div className="relative mt-1.5">
                    <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="montant"
                      type="text"
                      inputMode="numeric"
                      value={montantDisplay}
                      onChange={handleMontantChange}
                      placeholder="0"
                      className="pl-9 font-mono text-right"
                    />
                  </div>
                  {selectedNoteData?.montant_estime &&
                    formData.montant !== selectedNoteData.montant_estime && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Montant estimé initial : {formatMontant(selectedNoteData.montant_estime)}
                      </p>
                    )}
                  {!formData.montant && (
                    <p className="text-xs text-destructive mt-1">Le montant est obligatoire</p>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  {isCalculating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calcul en cours...
                    </div>
                  )}
                </div>
              </div>

              {/* Récapitulatif budgétaire */}
              {availability && (
                <ImputationSummaryCard
                  montantTotal={formData.montant || 0}
                  montantImpute={formData.montant || 0}
                  disponibleAvant={availability.disponible}
                  disponibleApres={availability.disponible_net}
                  dotationActuelle={availability.dotation_actuelle}
                  dotationInitiale={availability.dotation_initiale}
                  virementsRecus={availability.virements_recus}
                  virementsEmis={availability.virements_emis}
                  cumulEngage={availability.engagements_anterieurs}
                  montantReserve={availability.montant_reserve}
                  isValid={availability.is_sufficient || !!formData.forcer_imputation}
                  isForced={formData.forcer_imputation}
                  validationErrors={[]}
                  budgetLineCode={availability.budget_line_code}
                  budgetLineLabel={availability.budget_line_label}
                  showDetailedCalculation={true}
                />
              )}

              {/* Section de forçage */}
              {availability && !availability.is_sufficient && (
                <Alert variant="destructive" className="border-2 border-destructive">
                  <Shield className="h-5 w-5" />
                  <AlertTitle className="text-lg">Contrôle budgétaire — Action requise</AlertTitle>
                  <AlertDescription className="space-y-4 mt-2">
                    <div className="bg-destructive/10 p-3 rounded-lg">
                      <p className="font-medium">
                        Le montant demandé ({formatMontant(formData.montant || 0)}) dépasse le
                        disponible net.
                      </p>
                      <p className="text-sm mt-1">
                        Déficit :{' '}
                        <strong className="text-destructive">
                          {formatMontant(availability.deficit || 0)}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 border border-destructive/30 rounded-lg bg-background">
                      <Checkbox
                        id="forcer"
                        checked={formData.forcer_imputation}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({
                            ...prev,
                            forcer_imputation: !!checked,
                          }))
                        }
                        className="mt-0.5"
                      />
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="forcer" className="text-sm font-medium cursor-pointer">
                          Forcer l&apos;imputation malgré le dépassement budgétaire
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Cette action sera tracée dans l&apos;historique d&apos;audit et nécessite
                          une justification.
                        </p>
                      </div>
                    </div>

                    {formData.forcer_imputation && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="justification"
                          className="font-medium flex items-center gap-2"
                        >
                          <History className="h-4 w-4" />
                          Justification obligatoire *
                        </Label>
                        <Textarea
                          id="justification"
                          value={formData.justification_depassement}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              justification_depassement: e.target.value,
                            }))
                          }
                          placeholder="Expliquez pourquoi vous souhaitez forcer cette imputation malgré le dépassement budgétaire... (minimum 10 caractères)"
                          className="min-h-[100px]"
                        />
                        {formData.justification_depassement &&
                          formData.justification_depassement.length < 10 && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              La justification doit contenir au moins 10 caractères (
                              {formData.justification_depassement.length}/10)
                            </p>
                          )}
                        {formData.justification_depassement &&
                          formData.justification_depassement.length >= 10 && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Justification valide ({formData.justification_depassement.length}{' '}
                              caractères)
                            </p>
                          )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {availability?.is_sufficient && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">Budget disponible suffisant</AlertTitle>
                  <AlertDescription className="text-green-600">
                    L&apos;imputation peut être effectuée. Le montant de{' '}
                    {formatMontant(formData.montant || 0)} sera réservé sur la ligne budgétaire{' '}
                    {availability.budget_line_code}.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Alerte exercice clos */}
          {isReadOnly && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Exercice clôturé</AlertTitle>
              <AlertDescription>
                {getDisabledMessage()} — Aucune imputation n&apos;est possible sur cet exercice.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isImputing ||
                isReadOnly ||
                !formData.montant ||
                !formData.noteId ||
                isBudgetInsufficient ||
                (availability && !availability.is_sufficient && !formData.forcer_imputation) ||
                (availability &&
                  !availability.is_sufficient &&
                  formData.forcer_imputation &&
                  (!formData.justification_depassement ||
                    formData.justification_depassement.length < 10))
              }
              title={
                isReadOnly
                  ? getDisabledMessage()
                  : !formData.montant
                    ? 'Le montant est obligatoire'
                    : isBudgetInsufficient
                      ? 'Budget insuffisant sur la ligne sélectionnée'
                      : availability && !availability.is_sufficient && !formData.forcer_imputation
                        ? "Activez 'Forcer l'imputation' et fournissez une justification"
                        : undefined
              }
              className={
                availability &&
                !availability.is_sufficient &&
                formData.forcer_imputation &&
                formData.justification_depassement &&
                formData.justification_depassement.length >= 10
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : ''
              }
            >
              {isImputing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : availability && !availability.is_sufficient && formData.forcer_imputation ? (
                <Shield className="mr-2 h-4 w-4" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {availability && !availability.is_sufficient && formData.forcer_imputation
                ? "Forcer l'imputation et créer le dossier"
                : 'Imputer et créer le dossier'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
