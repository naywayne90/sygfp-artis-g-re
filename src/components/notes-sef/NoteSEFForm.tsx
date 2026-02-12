/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NoteSEF, useNotesSEF } from '@/hooks/useNotesSEF';
import { useExercice } from '@/contexts/ExerciceContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Loader2,
  Building2,
  User,
  CalendarIcon,
  Upload,
  FileText,
  AlertCircle,
  Save,
  Send,
} from 'lucide-react';
import { FileList, validateFile, type UploadedFile } from './FilePreview';
import { ARTIReferenceBadge } from '@/components/shared/ARTIReferenceBadge';

interface NoteSEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteSEF | null;
  /** Mode: si true, proposer de soumettre directement après création */
  allowSubmitOnCreate?: boolean;
}

export function NoteSEFForm({
  open,
  onOpenChange,
  note,
  allowSubmitOnCreate = true,
}: NoteSEFFormProps) {
  const { exercice } = useExercice();
  const {
    createNote,
    updateNote,
    submitNote,
    directions,
    profiles,
    beneficiaires,
    isCreating,
    isUpdating,
    isSubmitting,
  } = useNotesSEF();
  const { isAdmin, hasAnyRole, userId } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Le demandeur peut être changé par les gestionnaires (ADMIN, DG, DAAF) ou si création par un autre
  const canChangeDemandeur = isAdmin || hasAnyRole(['DG', 'DAAF', 'CB']);

  // Type de bénéficiaire: "externe" (prestataire) ou "interne" (profil)
  const [typeBeneficiaire, setTypeBeneficiaire] = useState<'externe' | 'interne' | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAfterSave, setSubmitAfterSave] = useState(false);

  const [formData, setFormData] = useState({
    objet: '',
    description: '',
    justification: '',
    direction_id: '',
    demandeur_id: '',
    beneficiaire_id: '',
    beneficiaire_interne_id: '',
    urgence: 'normale',
    date_souhaitee: null as Date | null,
    commentaire: '',
    // Nouveaux champs
    montant_estime: 0,
    type_depense: '',
    os_id: '',
    mission_id: '',
    // Champs contenu de la note (Prompt 26)
    expose: '',
    avis: '',
    recommandations: '',
  });

  // Type pour les référentiels
  type RefItem = { id: string; code: string; libelle: string };

  // Fetch objectifs stratégiques et missions
  const [objectifsStrategiques, setObjectifsStrategiques] = useState<RefItem[]>([]);
  const [missionsList, setMissionsList] = useState<RefItem[]>([]);

  useEffect(() => {
    const loadReferentiels = async () => {
      const { data: osData } = await (supabase as any)
        .from('objectifs_strategiques')
        .select('id, code, libelle')
        .eq('est_active', true)
        .order('code');
      const { data: missionsData } = await (supabase as any)
        .from('missions')
        .select('id, code, libelle')
        .eq('est_active', true)
        .order('code');
      if (osData) setObjectifsStrategiques(osData);
      if (missionsData) setMissionsList(missionsData);
    };
    loadReferentiels();
  }, []);

  // Charger l'utilisateur connecté au montage et pré-remplir direction si possible
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!note && open) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          // Récupérer le profil pour obtenir la direction
          const { data: profile } = await supabase
            .from('profiles')
            .select('direction_id')
            .eq('id', user.id)
            .single();

          // Pré-remplir le demandeur avec l'utilisateur connecté + direction si disponible
          setFormData((prev) => ({
            ...prev,
            demandeur_id: user.id,
            direction_id: profile?.direction_id || prev.direction_id,
          }));
        }
      }
    };
    loadCurrentUser();
  }, [open, note]);
  useEffect(() => {
    if (note) {
      setFormData({
        objet: note.objet || '',
        description: note.description || '',
        justification: note.justification || '',
        direction_id: note.direction_id || '',
        demandeur_id: note.demandeur_id || '',
        beneficiaire_id: note.beneficiaire_id || '',
        beneficiaire_interne_id: note.beneficiaire_interne_id || '',
        urgence: note.urgence || 'normale',
        date_souhaitee: note.date_souhaitee ? new Date(note.date_souhaitee) : null,
        commentaire: note.commentaire || '',
        montant_estime: note.montant_estime || 0,
        type_depense: note.type_depense || '',
        os_id: note.os_id || '',
        mission_id: note.mission_id || '',
        expose: note.expose || '',
        avis: note.avis || '',
        recommandations: note.recommandations || '',
      });
      // Déterminer le type de bénéficiaire selon les données existantes
      if (note.beneficiaire_id) {
        setTypeBeneficiaire('externe');
      } else if (note.beneficiaire_interne_id) {
        setTypeBeneficiaire('interne');
      } else {
        setTypeBeneficiaire('');
      }
    } else {
      setFormData({
        objet: '',
        description: '',
        justification: '',
        direction_id: '',
        demandeur_id: '',
        beneficiaire_id: '',
        beneficiaire_interne_id: '',
        urgence: 'normale',
        date_souhaitee: null,
        commentaire: '',
        montant_estime: 0,
        type_depense: '',
        os_id: '',
        mission_id: '',
        expose: '',
        avis: '',
        recommandations: '',
      });
      setTypeBeneficiaire('');
      setUploadedFiles([]);
      setErrors({});
    }
  }, [note, open]);

  const handleTypeBeneficiaireChange = (value: 'externe' | 'interne') => {
    setTypeBeneficiaire(value);
    // Réinitialiser les deux champs quand on change de type
    setFormData((prev) => ({
      ...prev,
      beneficiaire_id: '',
      beneficiaire_interne_id: '',
    }));
  };

  const MAX_PJ = 3; // Exigence MBAYE : maximum 3 pièces jointes

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Vérifier la limite de pièces jointes
    const currentValidCount = uploadedFiles.filter((f) => !f.error).length;
    const remainingSlots = MAX_PJ - currentValidCount;

    if (remainingSlots <= 0) {
      toast.error('Maximum 3 pièces jointes autorisées (TDR, devis, etc.)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      toast.error(
        `Vous ne pouvez ajouter que ${remainingSlots} fichier(s) supplémentaire(s). Maximum 3 pièces jointes.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);
      newFiles.push({
        file,
        error: validation.valid ? undefined : validation.error,
      });
    }
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation temps réel d'un champ
  const validateField = useCallback((field: string, value: any): string | null => {
    switch (field) {
      case 'objet':
        return !value?.trim() ? "L'objet est obligatoire" : null;
      case 'direction_id':
        return !value ? 'La direction est obligatoire' : null;
      case 'demandeur_id':
        return !value ? 'Le demandeur est obligatoire' : null;
      case 'urgence':
        return !value ? "L'urgence est obligatoire" : null;
      case 'justification':
        return !value?.trim() ? 'La justification est obligatoire' : null;
      case 'date_souhaitee':
        return !value ? 'La date souhaitée est obligatoire' : null;
      default:
        return null;
    }
  }, []);

  // Mettre à jour un champ avec validation temps réel
  const _updateField = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Valider si le champ a été touché
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({
          ...prev,
          [field]: error || '',
        }));
      }
    },
    [touched, validateField]
  );

  // Marquer un champ comme touché (on blur)
  const _handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const value = formData[field as keyof typeof formData];
      const error = validateField(field, value);
      if (error) {
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [formData, validateField]
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.objet.trim()) {
      newErrors.objet = "L'objet est obligatoire";
    }
    if (!formData.direction_id) {
      newErrors.direction_id = 'La direction est obligatoire';
    }
    if (!formData.demandeur_id) {
      newErrors.demandeur_id = 'Le demandeur est obligatoire';
    }
    if (!formData.urgence) {
      newErrors.urgence = "L'urgence est obligatoire";
    }
    if (!formData.justification.trim()) {
      newErrors.justification = 'La justification est obligatoire';
    }
    if (!formData.date_souhaitee) {
      newErrors.date_souhaitee = 'La date souhaitée est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFiles = async (noteId: string): Promise<{ success: number; failed: number }> => {
    if (uploadedFiles.length === 0) return { success: 0, failed: 0 };

    setIsUploading(true);
    let successCount = 0;
    let failedCount = 0;
    const failedFiles: string[] = [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      for (const { file } of uploadedFiles) {
        try {
          // Chemin stable: {exercice}/{noteId}/{timestamp}_{filename}
          const timestamp = Date.now();
          const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const filePath = `${exercice}/${noteId}/${timestamp}_${safeFileName}`;

          // Upload to Supabase Storage (bucket notes-sef)
          const { error: uploadError } = await supabase.storage
            .from('notes-sef')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            failedFiles.push(file.name);
            failedCount++;

            // Log l'échec dans l'historique
            await supabase.from('notes_sef_history').insert({
              note_id: noteId,
              action: 'upload_echec',
              commentaire: `Échec upload: ${file.name} - ${uploadError.message}`,
              performed_by: user.id,
            });
            continue;
          }

          // Créer l'entrée dans la table notes_sef_pieces
          const { error: insertError } = await supabase.from('notes_sef_pieces').insert({
            note_id: noteId,
            fichier_url: filePath,
            nom: file.name,
            type_fichier: file.type || 'application/octet-stream',
            taille: file.size,
            uploaded_by: user.id,
          });

          if (insertError) {
            console.error('Insert piece error:', insertError);
            failedFiles.push(file.name);
            failedCount++;
            continue;
          }

          // Log succès dans l'historique
          await supabase.from('notes_sef_history').insert({
            note_id: noteId,
            action: 'ajout_piece',
            commentaire: `Pièce jointe: ${file.name}`,
            performed_by: user.id,
          });

          successCount++;
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          failedFiles.push(file.name);
          failedCount++;
        }
      }

      // Messages de résultat
      if (successCount > 0 && failedCount === 0) {
        toast.success(`${successCount} pièce(s) jointe(s) enregistrée(s)`);
      } else if (successCount > 0 && failedCount > 0) {
        toast.warning(
          `${successCount} pièce(s) ajoutée(s), ${failedCount} échec(s): ${failedFiles.join(', ')}`
        );
      } else if (failedCount > 0) {
        toast.error(`Échec de l'upload: ${failedFiles.join(', ')}`);
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error("Erreur lors de l'upload des pièces jointes");
      return { success: successCount, failed: uploadedFiles.length - successCount };
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    try {
      // Préparer les données en nettoyant le bénéficiaire non utilisé
      const dataToSend = {
        objet: formData.objet,
        description: formData.description,
        justification: formData.justification,
        direction_id: formData.direction_id,
        demandeur_id: formData.demandeur_id,
        beneficiaire_id: typeBeneficiaire === 'externe' ? formData.beneficiaire_id : null,
        beneficiaire_interne_id:
          typeBeneficiaire === 'interne' ? formData.beneficiaire_interne_id : null,
        urgence: formData.urgence,
        date_souhaitee: formData.date_souhaitee
          ? format(formData.date_souhaitee, 'yyyy-MM-dd')
          : null,
        commentaire: formData.commentaire,
        // Nouveaux champs
        montant_estime: formData.montant_estime || null,
        type_depense: formData.type_depense || null,
        os_id: formData.os_id || null,
        mission_id: formData.mission_id || null,
        // Champs contenu de la note (Prompt 26)
        expose: formData.expose || null,
        avis: formData.avis || null,
        recommandations: formData.recommandations || null,
      };

      if (note) {
        // Mode édition
        await updateNote({ id: note.id, ...dataToSend });
        // Upload des nouvelles pièces jointes si présentes
        if (uploadedFiles.length > 0) {
          await uploadFiles(note.id);
        }
        toast.success(
          `Note ${note.dossier_ref || note.reference_pivot || note.numero} mise à jour`
        );
        onOpenChange(false);
      } else {
        // Mode création
        const result = await createNote(dataToSend);

        if (result) {
          // Upload des pièces jointes après création
          if (uploadedFiles.length > 0) {
            await uploadFiles(result.id);
          }

          // Si l'utilisateur veut soumettre directement
          if (submitAfterSave) {
            try {
              await submitNote(result.id);
              toast.success(
                `Note ${result.dossier_ref || result.reference_pivot || result.numero} créée et soumise`,
                { description: 'Les validateurs ont été notifiés' }
              );
            } catch {
              toast.error('Erreur lors de la soumission', {
                description: 'La note a été créée en brouillon',
              });
            }
          } else {
            toast.success(
              `Brouillon créé : ${result.dossier_ref || result.reference_pivot || result.numero}`,
              {
                description:
                  uploadedFiles.length > 0
                    ? `${uploadedFiles.length} pièce(s) jointe(s)`
                    : undefined,
              }
            );
          }

          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error("Erreur lors de l'enregistrement de la note");
    } finally {
      setSubmitAfterSave(false);
    }
  };

  // Soumettre directement (créer + soumettre)
  const handleSaveAndSubmit = () => {
    setSubmitAfterSave(true);
  };

  const isLoading = isCreating || isUpdating || isUploading || isSubmitting;
  const hasErrors = Object.values(errors).some((e) => !!e);
  const validFilesCount = uploadedFiles.filter((f) => !f.error).length;

  // Filtrer les demandeurs par direction si une direction est sélectionnée
  // et créer un affichage enrichi (Nom + fonction)
  const filteredProfiles = formData.direction_id
    ? profiles.filter((p) => p.direction_id === formData.direction_id || !p.direction_id)
    : profiles;

  // Quand la direction change, vérifier si le demandeur actuel est valide
  // et auto-sélectionner un demandeur approprié si nécessaire
  useEffect(() => {
    if (formData.direction_id) {
      // Obtenir les profils de la direction sélectionnée
      const profilesInDirection = profiles.filter(
        (p) => p.direction_id === formData.direction_id || !p.direction_id
      );

      // Vérifier si le demandeur actuel est dans la direction
      const currentDemandeurIsValid =
        formData.demandeur_id && profilesInDirection.some((p) => p.id === formData.demandeur_id);

      // Si le demandeur n'est pas valide pour cette direction
      if (!currentDemandeurIsValid && profilesInDirection.length > 0) {
        // Chercher d'abord l'utilisateur connecté dans cette direction
        const currentUserInDirection = profilesInDirection.find((p) => p.id === userId);

        if (currentUserInDirection) {
          // Auto-sélectionner l'utilisateur connecté s'il est dans la direction
          setFormData((prev) => ({ ...prev, demandeur_id: currentUserInDirection.id }));
        } else if (!canChangeDemandeur) {
          // Pour les non-admins, auto-sélectionner le premier profil disponible
          setFormData((prev) => ({ ...prev, demandeur_id: profilesInDirection[0].id }));
        } else {
          // Pour les admins, vider le champ pour qu'ils puissent sélectionner manuellement
          setFormData((prev) => ({ ...prev, demandeur_id: '' }));
        }
      }
    }
  }, [formData.direction_id, formData.demandeur_id, profiles, canChangeDemandeur, userId]);

  // Helper pour formater l'affichage d'un profil (Nom + fonction)
  const formatProfileDisplay = (profile: (typeof profiles)[0]) => {
    const name =
      profile.full_name ||
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
      profile.email?.split('@')[0] ||
      'Utilisateur';

    if (profile.poste) {
      return `${name} — ${profile.poste}`;
    }
    return name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? 'Modifier la note SEF' : 'Nouvelle Note SEF'}</DialogTitle>
          <DialogDescription>
            Exercice {exercice} • Les champs marqués * sont obligatoires
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Affichage de la référence ARTI en lecture seule (mode édition uniquement) */}
          {note && (note.dossier_ref || note.reference_pivot || note.numero) && (
            <div className="bg-muted/50 rounded-lg p-3 border flex items-center justify-between">
              <div>
                <Label className="text-xs text-muted-foreground">
                  {note.dossier_ref ? 'Référence Dossier (immuable)' : 'Référence (lecture seule)'}
                </Label>
                <div className="mt-1 flex items-center gap-2">
                  {/* Afficher dossier_ref en priorité s'il existe */}
                  {note.dossier_ref ? (
                    <span className="font-mono text-lg font-bold text-primary">
                      {note.dossier_ref}
                    </span>
                  ) : (
                    <ARTIReferenceBadge
                      reference={note.reference_pivot || note.numero}
                      size="lg"
                      showIcon
                    />
                  )}
                </div>
              </div>
              {note.statut && (
                <Badge variant={note.statut === 'brouillon' ? 'secondary' : 'default'}>
                  {note.statut === 'brouillon'
                    ? 'Brouillon'
                    : note.statut === 'soumis'
                      ? 'Soumis'
                      : note.statut === 'valide'
                        ? 'Validé'
                        : note.statut}
                </Badge>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Objet */}
            <div className="col-span-2">
              <Label htmlFor="objet" className={errors.objet ? 'text-destructive' : ''}>
                Objet *
              </Label>
              <Input
                id="objet"
                value={formData.objet}
                onChange={(e) => {
                  setFormData({ ...formData, objet: e.target.value });
                  if (errors.objet) setErrors((prev) => ({ ...prev, objet: '' }));
                }}
                placeholder="Objet de la note"
                className={errors.objet ? 'border-destructive' : ''}
              />
              {errors.objet && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.objet}
                </p>
              )}
            </div>

            {/* Direction */}
            <div>
              <Label htmlFor="direction" className={errors.direction_id ? 'text-destructive' : ''}>
                Direction *
              </Label>
              <Select
                value={formData.direction_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, direction_id: value });
                  if (errors.direction_id) setErrors((prev) => ({ ...prev, direction_id: '' }));
                }}
              >
                <SelectTrigger className={errors.direction_id ? 'border-destructive' : ''}>
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
              {errors.direction_id && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.direction_id}
                </p>
              )}
            </div>

            {/* Demandeur */}
            <div>
              <Label htmlFor="demandeur" className={errors.demandeur_id ? 'text-destructive' : ''}>
                Demandeur * {!canChangeDemandeur && filteredProfiles.length <= 1 && '(auto)'}
              </Label>
              <Select
                value={formData.demandeur_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, demandeur_id: value });
                  if (errors.demandeur_id) setErrors((prev) => ({ ...prev, demandeur_id: '' }));
                }}
                disabled={!canChangeDemandeur && !note && filteredProfiles.length <= 1}
              >
                <SelectTrigger
                  className={cn(
                    errors.demandeur_id ? 'border-destructive' : '',
                    !canChangeDemandeur && !note && filteredProfiles.length <= 1 ? 'opacity-70' : ''
                  )}
                >
                  <SelectValue placeholder="Sélectionner un demandeur" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {formatProfileDisplay(profile)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.demandeur_id && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.demandeur_id}
                </p>
              )}
            </div>

            {/* Urgence */}
            <div>
              <Label htmlFor="urgence" className={errors.urgence ? 'text-destructive' : ''}>
                Urgence *
              </Label>
              <Select
                value={formData.urgence}
                onValueChange={(value) => {
                  setFormData({ ...formData, urgence: value });
                  if (errors.urgence) setErrors((prev) => ({ ...prev, urgence: '' }));
                }}
              >
                <SelectTrigger className={errors.urgence ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              {errors.urgence && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.urgence}
                </p>
              )}
            </div>

            {/* Date souhaitée */}
            <div>
              <Label className={errors.date_souhaitee ? 'text-destructive' : ''}>
                Date souhaitée *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.date_souhaitee && 'text-muted-foreground',
                      errors.date_souhaitee && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_souhaitee
                      ? format(formData.date_souhaitee, 'dd MMMM yyyy', { locale: fr })
                      : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_souhaitee || undefined}
                    onSelect={(date) => {
                      setFormData({ ...formData, date_souhaitee: date || null });
                      if (errors.date_souhaitee)
                        setErrors((prev) => ({ ...prev, date_souhaitee: '' }));
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              {errors.date_souhaitee && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.date_souhaitee}
                </p>
              )}
            </div>

            {/* Justification */}
            <div className="col-span-2">
              <Label
                htmlFor="justification"
                className={errors.justification ? 'text-destructive' : ''}
              >
                Justification *
              </Label>
              <Textarea
                id="justification"
                value={formData.justification}
                onChange={(e) => {
                  setFormData({ ...formData, justification: e.target.value });
                  if (errors.justification) setErrors((prev) => ({ ...prev, justification: '' }));
                }}
                placeholder="Justification détaillée de la demande"
                rows={3}
                className={errors.justification ? 'border-destructive' : ''}
              />
              {errors.justification && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.justification}
                </p>
              )}
            </div>

            {/* Section Budget et Programmation */}
            <div className="col-span-2 space-y-4 p-4 rounded-lg border bg-primary/5">
              <Label className="text-base font-medium">Informations budgétaires</Label>

              <div className="grid grid-cols-2 gap-4">
                {/* Montant estimé */}
                <div>
                  <Label htmlFor="montant_estime">Montant estimé (FCFA)</Label>
                  <Input
                    id="montant_estime"
                    type="number"
                    min={0}
                    value={formData.montant_estime || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, montant_estime: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>

                {/* Type de dépense */}
                <div>
                  <Label htmlFor="type_depense">Type de dépense</Label>
                  <Select
                    value={formData.type_depense}
                    onValueChange={(value) => setFormData({ ...formData, type_depense: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fonctionnement">Fonctionnement</SelectItem>
                      <SelectItem value="investissement">Investissement</SelectItem>
                      <SelectItem value="personnel">Personnel</SelectItem>
                      <SelectItem value="transfert">Transfert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Objectif Stratégique */}
                <div>
                  <Label htmlFor="os_id">Objectif Stratégique</Label>
                  <Select
                    value={formData.os_id}
                    onValueChange={(value) => setFormData({ ...formData, os_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un OS" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectifsStrategiques.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          {os.code} - {os.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mission */}
                <div>
                  <Label htmlFor="mission_id">Mission</Label>
                  <Select
                    value={formData.mission_id}
                    onValueChange={(value) => setFormData({ ...formData, mission_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une mission" />
                    </SelectTrigger>
                    <SelectContent>
                      {missionsList.map((mission) => (
                        <SelectItem key={mission.id} value={mission.id}>
                          {mission.code} - {mission.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section Bénéficiaire */}
            <div className="col-span-2 space-y-3 p-4 rounded-lg border bg-muted/30">
              <Label className="text-base font-medium">Bénéficiaire (optionnel)</Label>

              <RadioGroup
                value={typeBeneficiaire}
                onValueChange={(val) => handleTypeBeneficiaireChange(val as 'externe' | 'interne')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="externe" id="beneficiaire-externe" />
                  <Label
                    htmlFor="beneficiaire-externe"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Prestataire externe
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interne" id="beneficiaire-interne" />
                  <Label
                    htmlFor="beneficiaire-interne"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Agent interne
                  </Label>
                </div>
              </RadioGroup>

              {typeBeneficiaire === 'externe' && (
                <Select
                  value={formData.beneficiaire_id}
                  onValueChange={(value) => setFormData({ ...formData, beneficiaire_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un prestataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiaires.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.raison_sociale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {typeBeneficiaire === 'interne' && (
                <Select
                  value={formData.beneficiaire_interne_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, beneficiaire_interne_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name || ''} {profile.last_name || ''}{' '}
                        {profile.email ? `(${profile.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!typeBeneficiaire && (
                <p className="text-sm text-muted-foreground italic">
                  Sélectionnez le type de bénéficiaire ci-dessus (optionnel)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée de la note"
                rows={3}
              />
            </div>

            {/* Section Contenu de la note (Prompt 26) */}
            <div className="col-span-2 space-y-4 p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <Label className="text-base font-medium">Contenu de la note</Label>
              </div>

              {/* Exposé */}
              <div className="space-y-1.5">
                <Label htmlFor="expose" className="text-sm">
                  Exposé
                </Label>
                <Textarea
                  id="expose"
                  value={formData.expose}
                  onChange={(e) => setFormData({ ...formData, expose: e.target.value })}
                  placeholder="Exposé détaillé de la situation ou du contexte de la demande..."
                  rows={4}
                  className="resize-y min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.expose.length} caractère(s)
                </p>
              </div>

              {/* Avis */}
              <div className="space-y-1.5">
                <Label htmlFor="avis" className="text-sm">
                  Avis
                </Label>
                <Textarea
                  id="avis"
                  value={formData.avis}
                  onChange={(e) => setFormData({ ...formData, avis: e.target.value })}
                  placeholder="Avis technique ou fonctionnel sur la demande..."
                  rows={3}
                  className="resize-y min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.avis.length} caractère(s)
                </p>
              </div>

              {/* Recommandations */}
              <div className="space-y-1.5">
                <Label htmlFor="recommandations" className="text-sm">
                  Recommandations
                </Label>
                <Textarea
                  id="recommandations"
                  value={formData.recommandations}
                  onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                  placeholder="Recommandations pour le traitement de la demande..."
                  rows={3}
                  className="resize-y min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.recommandations.length} caractère(s)
                </p>
              </div>
            </div>

            {/* Pièces jointes - Utilisation du composant FileList amélioré */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pièces jointes (TDR, devis, etc.)</Label>
                {uploadedFiles.length > 0 && (
                  <Badge variant="secondary">
                    {uploadedFiles.filter((f) => !f.error).length} fichier(s)
                  </Badge>
                )}
              </div>

              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                  disabled={isLoading || uploadedFiles.filter((f) => !f.error).length >= MAX_PJ}
                >
                  <Upload className="h-4 w-4" />
                  Ajouter des fichiers
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  PDF, Word, Excel, Images • Max 10 Mo par fichier • Maximum {MAX_PJ} fichiers
                </p>
              </div>

              {/* Liste des fichiers avec preview */}
              <FileList files={uploadedFiles} onRemove={removeFile} disabled={isLoading} />
            </div>

            {/* Commentaire */}
            <div className="col-span-2">
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                placeholder="Commentaires additionnels"
                rows={2}
              />
            </div>
          </div>

          {/* Indicateur d'erreurs */}
          {hasErrors && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Veuillez corriger les erreurs avant de continuer</AlertDescription>
            </Alert>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              {validFilesCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {validFilesCount} pièce(s) jointe(s)
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {/* Annuler */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>

              {/* Enregistrer brouillon */}
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading || hasErrors}
                className="gap-2"
              >
                {isLoading && !submitAfterSave && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {note ? 'Enregistrer' : 'Brouillon'}
              </Button>

              {/* Soumettre directement (création seulement ou brouillon existant) */}
              {(!note || note.statut === 'brouillon') && allowSubmitOnCreate && (
                <Button
                  type="submit"
                  disabled={isLoading || hasErrors}
                  className="gap-2"
                  onClick={handleSaveAndSubmit}
                >
                  {isLoading && submitAfterSave && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" />
                  {note ? 'Soumettre' : 'Créer et soumettre'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
