/**
 * NoteAEFForm - Formulaire amélioré pour création/édition de Notes AEF
 * - Note SEF d'origine optionnelle (filtrée : SEF validées sans AEF)
 * - Ligne budgétaire avec disponible et warning
 * - Pré-remplissage complet depuis SEF + pièces jointes + audit
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoteAEF, BudgetAvailabilityCheck, useNotesAEF } from '@/hooks/useNotesAEF';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { ARTIReferenceBadge } from '@/components/shared/ARTIReferenceBadge';
import {
  FileList,
  validateFile,
  FILE_CONFIG,
  UploadedFile,
} from '@/components/notes-sef/FilePreview';
import {
  Loader2,
  Link2,
  FileText,
  AlertTriangle,
  Zap,
  Hash,
  ArrowRight,
  CheckCircle,
  Upload,
  Save,
  Info,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteAEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteAEF | null;
  initialNoteSEFId?: string | null;
}

const formatNumber = (value: string) => {
  const number = value.replace(/\D/g, '');
  return number ? parseInt(number, 10).toLocaleString('fr-FR') : '';
};

const parseNumber = (value: string) => {
  return parseInt(value.replace(/\s/g, '').replace(/,/g, ''), 10) || 0;
};

const TYPES_DEPENSE = [
  { value: 'fonctionnement', label: 'Fonctionnement' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'transfert', label: 'Transfert' },
];

const PRIORITES = [
  { value: 'basse', label: 'Basse', color: 'text-muted-foreground' },
  { value: 'normale', label: 'Normale', color: 'text-foreground' },
  { value: 'haute', label: 'Haute', color: 'text-warning' },
  { value: 'urgente', label: 'Urgente', color: 'text-destructive' },
];

interface NoteSEFDetail {
  id: string;
  numero: string | null;
  reference_pivot: string | null;
  objet: string;
  description: string | null;
  justification: string | null;
  direction_id: string | null;
  demandeur_id: string | null;
  beneficiaire_id: string | null;
  beneficiaire_interne_id: string | null;
  urgence: string | null;
  type_depense: string | null;
  montant_estime: number | null;
  os_id: string | null;
  mission_id: string | null;
  validated_at: string | null;
  direction?: { id: string; label: string; sigle: string | null };
  demandeur?: { id: string; first_name: string | null; last_name: string | null };
  beneficiaire?: { id: string; raison_sociale: string };
}

export function NoteAEFForm({ open, onOpenChange, note, initialNoteSEFId }: NoteAEFFormProps) {
  const {
    createNote,
    createDirectDG,
    updateNote,
    directions,
    notesSEFDisponibles,
    notesSEFValidees,
    beneficiaires,
    budgetLines,
    checkBudgetAvailability,
    isCreating,
    isCreatingDirectDG,
    isUpdating,
  } = useNotesAEF();
  const { hasAnyRole, isAdmin } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Le DG peut créer des AEF directes (sans Note SEF)
  const canCreateDirectAEF = isAdmin || hasAnyRole(['DG']);

  // État du formulaire
  const [formData, setFormData] = useState({
    objet: '',
    contenu: '',
    direction_id: '',
    priorite: 'normale',
    montant_estime: '',
    note_sef_id: '',
    is_direct_aef: false,
    type_depense: 'fonctionnement',
    justification: '',
    beneficiaire_id: '',
    os_id: '',
    ligne_budgetaire_id: '',
  });

  // Note SEF détaillée (avec toutes les infos pour pré-remplissage)
  const [selectedNoteSEFDetail, setSelectedNoteSEFDetail] = useState<NoteSEFDetail | null>(null);
  const [loadingSEFDetail, setLoadingSEFDetail] = useState(false);

  // Pièces jointes
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  // Budget line availability
  const [budgetAvailability, setBudgetAvailability] = useState<BudgetAvailabilityCheck | null>(
    null
  );
  const [loadingBudgetCheck, setLoadingBudgetCheck] = useState(false);

  // Validation temps réel
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Liste SEF pour le select : en édition, inclure aussi la SEF déjà liée
  const sefListForSelect =
    note?.note_sef_id && !notesSEFDisponibles.some((s) => s.id === note.note_sef_id)
      ? [...notesSEFDisponibles, ...notesSEFValidees.filter((s) => s.id === note.note_sef_id)]
      : notesSEFDisponibles;

  // Budget lines filtrées par direction sélectionnée
  const filteredBudgetLines = formData.direction_id
    ? budgetLines.filter((bl) => !bl.direction_id || bl.direction_id === formData.direction_id)
    : budgetLines;

  // Vérifier le disponible quand la ligne budgétaire change
  const checkBudget = useCallback(
    async (lineId: string, montant: number) => {
      if (!lineId) {
        setBudgetAvailability(null);
        return;
      }
      setLoadingBudgetCheck(true);
      try {
        const result = await checkBudgetAvailability(lineId, montant);
        setBudgetAvailability(result);
      } catch {
        setBudgetAvailability(null);
      } finally {
        setLoadingBudgetCheck(false);
      }
    },
    [checkBudgetAvailability]
  );

  useEffect(() => {
    if (formData.ligne_budgetaire_id) {
      const montant = parseNumber(formData.montant_estime);
      checkBudget(formData.ligne_budgetaire_id, montant);
    } else {
      setBudgetAvailability(null);
    }
  }, [formData.ligne_budgetaire_id, formData.montant_estime, checkBudget]);

  // Charger les détails de la Note SEF sélectionnée
  useEffect(() => {
    async function loadSEFDetail(sefId: string) {
      setLoadingSEFDetail(true);
      try {
        const { data, error } = await supabase
          .from('notes_sef')
          .select(
            `
            id, numero, reference_pivot, objet, description, justification,
            direction_id, demandeur_id, beneficiaire_id, beneficiaire_interne_id,
            urgence, type_depense, montant_estime, os_id, mission_id, validated_at,
            direction:directions(id, label, sigle),
            demandeur:profiles!demandeur_id(id, first_name, last_name),
            beneficiaire:prestataires!beneficiaire_id(id, raison_sociale)
          `
          )
          .eq('id', sefId)
          .single();

        if (!error && data) {
          setSelectedNoteSEFDetail(data as unknown as NoteSEFDetail);
        }
      } catch (err) {
        console.error('Erreur chargement Note SEF:', err);
      } finally {
        setLoadingSEFDetail(false);
      }
    }

    if (formData.note_sef_id && !formData.is_direct_aef) {
      loadSEFDetail(formData.note_sef_id);
    } else {
      setSelectedNoteSEFDetail(null);
    }
  }, [formData.note_sef_id, formData.is_direct_aef]);

  // Pré-remplir depuis Note SEF détaillée
  useEffect(() => {
    if (selectedNoteSEFDetail && !note && !formData.is_direct_aef) {
      setFormData((prev) => ({
        ...prev,
        objet: prev.objet || selectedNoteSEFDetail.objet,
        contenu: prev.contenu || selectedNoteSEFDetail.description || '',
        justification: prev.justification || selectedNoteSEFDetail.justification || '',
        direction_id: prev.direction_id || selectedNoteSEFDetail.direction_id || '',
        priorite: prev.priorite || selectedNoteSEFDetail.urgence || 'normale',
        type_depense: prev.type_depense || selectedNoteSEFDetail.type_depense || 'fonctionnement',
        montant_estime:
          prev.montant_estime ||
          (selectedNoteSEFDetail.montant_estime
            ? formatNumber(selectedNoteSEFDetail.montant_estime.toString())
            : ''),
        beneficiaire_id: prev.beneficiaire_id || selectedNoteSEFDetail.beneficiaire_id || '',
        os_id: prev.os_id || selectedNoteSEFDetail.os_id || '',
      }));
    }
  }, [selectedNoteSEFDetail, note, formData.is_direct_aef]);

  // Init form on open
  useEffect(() => {
    if (note) {
      // Mode édition
      setFormData({
        objet: note.objet || '',
        contenu: note.contenu || '',
        direction_id: note.direction_id || '',
        priorite: note.priorite || 'normale',
        montant_estime: note.montant_estime ? formatNumber(note.montant_estime.toString()) : '',
        note_sef_id: note.note_sef_id || '',
        is_direct_aef: note.is_direct_aef || false,
        type_depense: note.type_depense || 'fonctionnement',
        justification: note.justification || '',
        beneficiaire_id: note.beneficiaire_id || '',
        os_id: note.os_id || '',
        ligne_budgetaire_id: note.ligne_budgetaire_id || note.budget_line_id || '',
      });
      setTouched({});
      setUploadedFiles([]);
      setBudgetAvailability(null);
    } else if (initialNoteSEFId) {
      // Création depuis SEF pré-sélectionnée
      setFormData((prev) => ({
        ...prev,
        note_sef_id: initialNoteSEFId,
        is_direct_aef: false,
      }));
      setTouched({});
      setUploadedFiles([]);
      setBudgetAvailability(null);
    } else if (open) {
      // Nouvelle création vierge
      setFormData({
        objet: '',
        contenu: '',
        direction_id: '',
        priorite: 'normale',
        montant_estime: '',
        note_sef_id: '',
        is_direct_aef: false,
        type_depense: 'fonctionnement',
        justification: '',
        beneficiaire_id: '',
        os_id: '',
        ligne_budgetaire_id: '',
      });
      setTouched({});
      setUploadedFiles([]);
      setBudgetAvailability(null);
    }
  }, [note, open, initialNoteSEFId]);

  const handleDirectAEFChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_direct_aef: checked,
      note_sef_id: checked ? '' : prev.note_sef_id,
    }));
    setSelectedNoteSEFDetail(null);
  };

  // Gestion des pièces jointes
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map((file) => {
      const validation = validateFile(file);
      return {
        file,
        error: validation.valid ? undefined : validation.error,
        progress: 0,
        uploaded: false,
      };
    });
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation
  const validateField = (field: string, value: string | boolean): string | null => {
    switch (field) {
      case 'objet':
        return !value || (typeof value === 'string' && !value.trim())
          ? "L'objet est obligatoire"
          : null;
      case 'justification':
        if (formData.is_direct_aef && (!value || (typeof value === 'string' && !value.trim()))) {
          return 'La justification est obligatoire pour une AEF directe';
        }
        return null;
      default:
        return null;
    }
  };

  const getFieldError = (field: string): string | null => {
    if (!touched[field]) return null;
    return validateField(field, formData[field as keyof typeof formData]);
  };

  const updateField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Reset budget line when direction changes
  const handleDirectionChange = (value: string) => {
    updateField('direction_id', value);
    // Reset la ligne budgétaire si elle n'appartient plus à la direction
    if (formData.ligne_budgetaire_id) {
      const currentLine = budgetLines.find((bl) => bl.id === formData.ligne_budgetaire_id);
      if (currentLine?.direction_id && currentLine.direction_id !== value) {
        setFormData((prev) => ({ ...prev, ligne_budgetaire_id: '' }));
        setBudgetAvailability(null);
      }
    }
  };

  // Upload des fichiers vers Supabase Storage
  const uploadFiles = async (noteId: string): Promise<boolean> => {
    const validFiles = uploadedFiles.filter((f) => !f.error);
    if (validFiles.length === 0) return true;

    setIsUploadingFiles(true);
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const uploadFile = validFiles[i];
        const fileName = `${noteId}/${Date.now()}_${uploadFile.file.name}`;

        setUploadedFiles((prev) =>
          prev.map((f) => (f === uploadFile ? { ...f, progress: 50 } : f))
        );

        const { error } = await supabase.storage
          .from('note-attachments')
          .upload(fileName, uploadFile.file);

        if (error) {
          console.error('Upload error:', error);
          setUploadedFiles((prev) =>
            prev.map((f) => (f === uploadFile ? { ...f, error: 'Échec upload', progress: 0 } : f))
          );
        } else {
          await supabase.from('note_attachments').insert({
            note_id: noteId,
            note_type: 'AEF',
            file_name: uploadFile.file.name,
            file_path: fileName,
            file_size: uploadFile.file.size,
            file_type: uploadFile.file.type,
          });

          setUploadedFiles((prev) =>
            prev.map((f) => (f === uploadFile ? { ...f, progress: 100, uploaded: true } : f))
          );
        }
      }
      return true;
    } catch (err) {
      console.error('Upload error:', err);
      return false;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      objet: true,
      justification: true,
    });

    // AEF directe requiert une justification
    if (formData.is_direct_aef && !formData.justification?.trim()) {
      return;
    }

    if (!formData.objet?.trim()) {
      return;
    }

    try {
      let createdNote: { id: string } | null = null;

      if (note) {
        // Mode édition
        const payload = {
          objet: formData.objet,
          contenu: formData.contenu || null,
          direction_id: formData.direction_id || null,
          priorite: formData.priorite,
          montant_estime: parseNumber(formData.montant_estime),
          note_sef_id: formData.is_direct_aef ? null : formData.note_sef_id || null,
          is_direct_aef: formData.is_direct_aef,
          type_depense: formData.type_depense,
          justification: formData.justification || null,
          beneficiaire_id: formData.beneficiaire_id || null,
          os_id: formData.os_id || null,
          ligne_budgetaire_id: formData.ligne_budgetaire_id || null,
          budget_line_id: formData.ligne_budgetaire_id || null,
        };
        createdNote = await updateNote({ id: note.id, ...payload });
      } else if (formData.is_direct_aef) {
        // Mode AEF directe DG: crée SEF shadow automatiquement
        const result = await createDirectDG({
          objet: formData.objet,
          contenu: formData.contenu || null,
          direction_id: formData.direction_id || null,
          priorite: formData.priorite,
          montant_estime: parseNumber(formData.montant_estime),
          type_depense: formData.type_depense,
          justification: formData.justification,
          ligne_budgetaire_id: formData.ligne_budgetaire_id || null,
        });
        createdNote = result?.aef;
      } else {
        // Mode normal: lié à une SEF existante ou non
        const payload = {
          objet: formData.objet,
          contenu: formData.contenu || null,
          direction_id: formData.direction_id || null,
          priorite: formData.priorite,
          montant_estime: parseNumber(formData.montant_estime),
          note_sef_id: formData.note_sef_id || null,
          is_direct_aef: false,
          type_depense: formData.type_depense,
          justification: formData.justification || null,
          beneficiaire_id: formData.beneficiaire_id || null,
          os_id: formData.os_id || null,
          ligne_budgetaire_id: formData.ligne_budgetaire_id || null,
          budget_line_id: formData.ligne_budgetaire_id || null,
        };
        createdNote = await createNote(payload);
      }

      // Upload des pièces jointes
      if (createdNote?.id && uploadedFiles.length > 0) {
        await uploadFiles(createdNote.id);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const isLoading = isCreating || isCreatingDirectDG || isUpdating || isUploadingFiles;
  const needsJustification = formData.is_direct_aef && !formData.justification?.trim();
  const needsObjet = !formData.objet?.trim();
  const canSubmit = !needsJustification && !needsObjet && !isLoading;

  // Montant vs disponible : warning orange
  const montantEstime = parseNumber(formData.montant_estime);
  const budgetInsuffisant =
    budgetAvailability && !budgetAvailability.isAvailable && montantEstime > 0;

  const selectedNoteSEF = notesSEFValidees.find((n) => n.id === formData.note_sef_id);
  const displayReference =
    selectedNoteSEFDetail?.reference_pivot ||
    selectedNoteSEF?.reference_pivot ||
    selectedNoteSEF?.numero;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            {note ? 'Modifier la Note AEF' : 'Nouvelle Note AEF'}
            {displayReference && (
              <ARTIReferenceBadge reference={displayReference} size="sm" short />
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-5 pb-4">
            {/* Option AEF directe pour DG */}
            {canCreateDirectAEF && !note && (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="is_direct_aef"
                      checked={formData.is_direct_aef}
                      onCheckedChange={handleDirectAEFChange}
                    />
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-warning" />
                      <Label htmlFor="is_direct_aef" className="font-medium cursor-pointer">
                        AEF directe (sans Note SEF préalable)
                      </Label>
                    </div>
                  </div>
                  {formData.is_direct_aef && (
                    <p className="text-xs text-muted-foreground mt-2 ml-7">
                      En tant que DG, vous pouvez créer une Note AEF directement.
                      <strong className="text-primary">
                        {' '}
                        Une Note SEF sera générée automatiquement
                      </strong>{' '}
                      avec la même référence ARTI.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sélection de la Note SEF (optionnel, masqué si AEF directe) */}
            {!formData.is_direct_aef && (
              <Card
                className={cn(
                  'border-2 transition-colors',
                  selectedNoteSEFDetail ? 'border-primary/30 bg-primary/5' : 'border-muted'
                )}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    Note SEF d'origine
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Optionnel
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez une Note SEF validée pour pré-remplir les champs (uniquement les
                    SEF sans AEF existante)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={formData.note_sef_id}
                    onValueChange={(value) =>
                      updateField('note_sef_id', value === '__none__' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune (saisie libre)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucune (saisie libre)</SelectItem>
                      {sefListForSelect.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
                          <p className="font-medium">Aucune Note SEF disponible</p>
                          <p className="text-xs">Toutes les SEF validées ont déjà une AEF liée</p>
                        </div>
                      ) : (
                        sefListForSelect.map((noteSEF) => (
                          <SelectItem key={noteSEF.id} value={noteSEF.id}>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-success" />
                              <span className="font-mono text-xs">
                                {noteSEF.reference_pivot || noteSEF.numero}
                              </span>
                              <span className="truncate max-w-[250px]">{noteSEF.objet}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {loadingSEFDetail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des détails...
                    </div>
                  )}

                  {selectedNoteSEFDetail && (
                    <div className="p-4 bg-background rounded-lg border space-y-3">
                      {/* Référence héritée - FIGÉE */}
                      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-md border border-primary/20">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Référence AEF :</span>
                        <Badge variant="secondary" className="font-mono font-bold text-primary">
                          {selectedNoteSEFDetail.reference_pivot ||
                            selectedNoteSEFDetail.numero ||
                            '—'}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Héritée automatiquement de la Note SEF
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Objet :</span>
                          <p className="font-medium truncate" title={selectedNoteSEFDetail.objet}>
                            {selectedNoteSEFDetail.objet}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Direction :</span>
                          <p className="font-medium">
                            {selectedNoteSEFDetail.direction
                              ? selectedNoteSEFDetail.direction.sigle ||
                                selectedNoteSEFDetail.direction.label
                              : 'Non spécifiée'}
                          </p>
                        </div>
                        {selectedNoteSEFDetail.demandeur && (
                          <div>
                            <span className="text-muted-foreground">Demandeur :</span>
                            <p className="font-medium">
                              {selectedNoteSEFDetail.demandeur.first_name}{' '}
                              {selectedNoteSEFDetail.demandeur.last_name}
                            </p>
                          </div>
                        )}
                        {selectedNoteSEFDetail.beneficiaire && (
                          <div>
                            <span className="text-muted-foreground">Bénéficiaire :</span>
                            <p className="font-medium truncate">
                              {selectedNoteSEFDetail.beneficiaire.raison_sociale}
                            </p>
                          </div>
                        )}
                        {selectedNoteSEFDetail.montant_estime != null &&
                          selectedNoteSEFDetail.montant_estime > 0 && (
                            <div>
                              <span className="text-muted-foreground">Montant estimé SEF :</span>
                              <p className="font-medium">
                                {selectedNoteSEFDetail.montant_estime.toLocaleString('fr-FR')} FCFA
                              </p>
                            </div>
                          )}
                      </div>

                      <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                          Les champs ci-dessous ont été pré-remplis depuis la Note SEF. Vous pouvez
                          les modifier si nécessaire.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Justification obligatoire pour AEF directe */}
            {formData.is_direct_aef && (
              <div>
                <Label htmlFor="justification" className="flex items-center gap-1">
                  Justification de l'AEF directe
                  <Badge variant="outline" className="ml-2">
                    Obligatoire
                  </Badge>
                </Label>
                <Textarea
                  id="justification"
                  value={formData.justification}
                  onChange={(e) => updateField('justification', e.target.value)}
                  onBlur={() => handleBlur('justification')}
                  placeholder="Expliquez pourquoi cette dépense ne nécessite pas de Note SEF préalable..."
                  rows={3}
                  className={getFieldError('justification') ? 'border-destructive' : ''}
                />
                {getFieldError('justification') && (
                  <p className="text-xs text-destructive mt-1">{getFieldError('justification')}</p>
                )}
              </div>
            )}

            <Separator />

            {/* Champs principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <Label htmlFor="objet" className="flex items-center gap-1">
                  Objet de la dépense
                  <Badge variant="outline" className="ml-2">
                    Obligatoire
                  </Badge>
                </Label>
                <Input
                  id="objet"
                  value={formData.objet}
                  onChange={(e) => updateField('objet', e.target.value)}
                  onBlur={() => handleBlur('objet')}
                  placeholder="Objet de la demande de dépense"
                  className={getFieldError('objet') ? 'border-destructive' : ''}
                />
                {getFieldError('objet') && (
                  <p className="text-xs text-destructive mt-1">{getFieldError('objet')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="direction">Direction</Label>
                <Select value={formData.direction_id} onValueChange={handleDirectionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une direction" />
                  </SelectTrigger>
                  <SelectContent>
                    {directions.map((dir) => (
                      <SelectItem key={dir.id} value={dir.id}>
                        {dir.sigle || dir.code} - {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priorite">Urgence</Label>
                <Select
                  value={formData.priorite}
                  onValueChange={(value) => updateField('priorite', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type_depense">Type de dépense</Label>
                <Select
                  value={formData.type_depense}
                  onValueChange={(value) => updateField('type_depense', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_DEPENSE.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="montant">Montant estimé (FCFA)</Label>
                <Input
                  id="montant"
                  value={formData.montant_estime}
                  onChange={(e) => updateField('montant_estime', formatNumber(e.target.value))}
                  placeholder="0"
                  className="text-right font-mono"
                />
              </div>

              {/* Ligne budgétaire - filtrée par exercice + direction */}
              <div className="col-span-full">
                <Label htmlFor="ligne_budgetaire" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Ligne budgétaire
                </Label>
                <Select
                  value={formData.ligne_budgetaire_id}
                  onValueChange={(value) =>
                    updateField('ligne_budgetaire_id', value === '__none__' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ligne budgétaire (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune</SelectItem>
                    {filteredBudgetLines.map((bl) => (
                      <SelectItem key={bl.id} value={bl.id}>
                        <span className="font-mono text-xs">{bl.code}</span>
                        <span className="ml-2 truncate">{bl.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Affichage du disponible */}
                {formData.ligne_budgetaire_id && (
                  <div className="mt-2">
                    {loadingBudgetCheck ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Vérification du disponible...
                      </div>
                    ) : budgetAvailability ? (
                      <div
                        className={cn(
                          'flex items-center gap-2 text-xs p-2 rounded-md',
                          budgetInsuffisant
                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200'
                            : 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200'
                        )}
                      >
                        {budgetInsuffisant ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                          Dotation : {budgetAvailability.dotation.toLocaleString('fr-FR')} FCFA |
                          Engagé : {budgetAvailability.engaged.toLocaleString('fr-FR')} FCFA |{' '}
                          <strong>
                            Disponible : {budgetAvailability.disponible.toLocaleString('fr-FR')}{' '}
                            FCFA
                          </strong>
                        </span>
                      </div>
                    ) : null}

                    {budgetInsuffisant && (
                      <Alert className="mt-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-xs text-orange-700 dark:text-orange-400">
                          Le montant estimé ({montantEstime.toLocaleString('fr-FR')} FCFA) dépasse
                          le disponible. Vous pouvez enregistrer en brouillon, mais la soumission
                          sera bloquée.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {beneficiaires.length > 0 && (
                <div className="col-span-full">
                  <Label htmlFor="beneficiaire">Bénéficiaire / Prestataire</Label>
                  <Select
                    value={formData.beneficiaire_id}
                    onValueChange={(value) =>
                      updateField('beneficiaire_id', value === '__none__' ? '' : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un bénéficiaire (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucun</SelectItem>
                      {beneficiaires.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.raison_sociale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="col-span-full">
                <Label htmlFor="contenu">Description détaillée / Justificatifs</Label>
                <Textarea
                  id="contenu"
                  value={formData.contenu}
                  onChange={(e) => updateField('contenu', e.target.value)}
                  placeholder="Description détaillée de la demande, ventilation des coûts, justificatifs..."
                  rows={4}
                />
              </div>

              {!formData.is_direct_aef && (
                <div className="col-span-full">
                  <Label htmlFor="justification_aef">Justification complémentaire</Label>
                  <Textarea
                    id="justification_aef"
                    value={formData.justification}
                    onChange={(e) => updateField('justification', e.target.value)}
                    placeholder="Justification de la dépense (pré-rempli depuis la SEF)"
                    rows={2}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Pièces jointes */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Pièces jointes
                <span className="text-xs text-muted-foreground ml-2">
                  ({FILE_CONFIG.allowedExtensions.join(', ')}, max {FILE_CONFIG.maxSizeLabel})
                </span>
              </Label>

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={FILE_CONFIG.allowedExtensions.join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter des fichiers
                </Button>
              </div>

              <FileList files={uploadedFiles} onRemove={handleRemoveFile} disabled={isLoading} />
            </div>
          </form>
        </ScrollArea>

        <Separator />

        <DialogFooter className="shrink-0 pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {note ? (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Créer la Note AEF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
