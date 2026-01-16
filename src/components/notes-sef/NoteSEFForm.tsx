import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NoteSEF, useNotesSEF } from "@/hooks/useNotesSEF";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Loader2, 
  Building2, 
  User, 
  CalendarIcon, 
  Upload, 
  X, 
  FileText,
  AlertCircle
} from "lucide-react";

interface NoteSEFFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteSEF | null;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

export function NoteSEFForm({ open, onOpenChange, note }: NoteSEFFormProps) {
  const { exercice } = useExercice();
  const { createNote, updateNote, directions, profiles, beneficiaires, isCreating, isUpdating } = useNotesSEF();
  const { isAdmin, hasAnyRole, userId } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Le demandeur peut être changé par les gestionnaires (ADMIN, DG, DAAF) ou si création par un autre
  const canChangeDemandeur = isAdmin || hasAnyRole(["DG", "DAAF", "CB"]);

  // Type de bénéficiaire: "externe" (prestataire) ou "interne" (profil)
  const [typeBeneficiaire, setTypeBeneficiaire] = useState<"externe" | "interne" | "">("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    objet: "",
    description: "",
    justification: "",
    direction_id: "",
    demandeur_id: "",
    beneficiaire_id: "",
    beneficiaire_interne_id: "",
    urgence: "normale",
    date_souhaitee: null as Date | null,
    commentaire: "",
  });

  // Charger l'utilisateur connecté au montage et pré-remplir direction si possible
  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!note && open) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Récupérer le profil pour obtenir la direction
          const { data: profile } = await supabase
            .from("profiles")
            .select("direction_id")
            .eq("id", user.id)
            .single();
          
          // Pré-remplir le demandeur avec l'utilisateur connecté + direction si disponible
          setFormData(prev => ({
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
        objet: note.objet || "",
        description: note.description || "",
        justification: note.justification || "",
        direction_id: note.direction_id || "",
        demandeur_id: note.demandeur_id || "",
        beneficiaire_id: note.beneficiaire_id || "",
        beneficiaire_interne_id: note.beneficiaire_interne_id || "",
        urgence: note.urgence || "normale",
        date_souhaitee: note.date_souhaitee ? new Date(note.date_souhaitee) : null,
        commentaire: note.commentaire || "",
      });
      // Déterminer le type de bénéficiaire selon les données existantes
      if (note.beneficiaire_id) {
        setTypeBeneficiaire("externe");
      } else if (note.beneficiaire_interne_id) {
        setTypeBeneficiaire("interne");
      } else {
        setTypeBeneficiaire("");
      }
    } else {
      setFormData({
        objet: "",
        description: "",
        justification: "",
        direction_id: "",
        demandeur_id: "",
        beneficiaire_id: "",
        beneficiaire_interne_id: "",
        urgence: "normale",
        date_souhaitee: null,
        commentaire: "",
      });
      setTypeBeneficiaire("");
      setUploadedFiles([]);
      setErrors({});
    }
  }, [note, open]);

  const handleTypeBeneficiaireChange = (value: "externe" | "interne") => {
    setTypeBeneficiaire(value);
    // Réinitialiser les deux champs quand on change de type
    setFormData(prev => ({
      ...prev,
      beneficiaire_id: "",
      beneficiaire_interne_id: "",
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Limiter à 10MB par fichier
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Le fichier ${file.name} dépasse 10MB`);
        continue;
      }
      newFiles.push({ file });
    }
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.objet.trim()) {
      newErrors.objet = "L'objet est obligatoire";
    }
    if (!formData.direction_id) {
      newErrors.direction_id = "La direction est obligatoire";
    }
    if (!formData.demandeur_id) {
      newErrors.demandeur_id = "Le demandeur est obligatoire";
    }
    if (!formData.urgence) {
      newErrors.urgence = "L'urgence est obligatoire";
    }
    if (!formData.justification.trim()) {
      newErrors.justification = "La justification est obligatoire";
    }
    if (!formData.date_souhaitee) {
      newErrors.date_souhaitee = "La date souhaitée est obligatoire";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

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
            console.error("Upload error:", uploadError);
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
            console.error("Insert piece error:", insertError);
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
        toast.warning(`${successCount} pièce(s) ajoutée(s), ${failedCount} échec(s): ${failedFiles.join(', ')}`);
      } else if (failedCount > 0) {
        toast.error(`Échec de l'upload: ${failedFiles.join(', ')}`);
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erreur lors de l'upload des pièces jointes");
      return { success: successCount, failed: uploadedFiles.length - successCount };
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
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
        beneficiaire_id: typeBeneficiaire === "externe" ? formData.beneficiaire_id : null,
        beneficiaire_interne_id: typeBeneficiaire === "interne" ? formData.beneficiaire_interne_id : null,
        urgence: formData.urgence,
        date_souhaitee: formData.date_souhaitee ? format(formData.date_souhaitee, 'yyyy-MM-dd') : null,
        commentaire: formData.commentaire,
      };

      if (note) {
        // Mode édition
        await updateNote({ id: note.id, ...dataToSend });
        // Upload des nouvelles pièces jointes si présentes
        if (uploadedFiles.length > 0) {
          await uploadFiles(note.id);
        }
        toast.success(`Note ${note.reference_pivot || note.numero} mise à jour`);
      } else {
        // Mode création
        const result = await createNote(dataToSend);
        
        if (result) {
          // Upload des pièces jointes après création
          if (uploadedFiles.length > 0) {
            const uploadResult = await uploadFiles(result.id);
            
            // Message final avec la référence pivot générée
            if (uploadResult.failed === 0) {
              toast.success(
                `Brouillon créé : ${result.reference_pivot || result.numero}`,
                { description: uploadResult.success > 0 ? `${uploadResult.success} pièce(s) jointe(s)` : undefined }
              );
            }
          } else {
            // Pas de pièces jointes, le toast est déjà affiché par le hook
          }
        }
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Erreur lors de l'enregistrement de la note");
    }
  };

  const isLoading = isCreating || isUpdating || isUploading;

  // Filtrer les demandeurs par direction si une direction est sélectionnée
  // et créer un affichage enrichi (Nom + fonction)
  const filteredProfiles = formData.direction_id 
    ? profiles.filter(p => p.direction_id === formData.direction_id || !p.direction_id)
    : profiles;

  // Helper pour formater l'affichage d'un profil (Nom + fonction)
  const formatProfileDisplay = (profile: typeof profiles[0]) => {
    const name = profile.full_name || 
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
          <DialogTitle>
            {note ? "Modifier la note SEF" : "Nouvelle Note SEF"}
          </DialogTitle>
          <DialogDescription>
            Exercice {exercice} • Les champs marqués * sont obligatoires
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Affichage de la référence en lecture seule (mode édition uniquement) */}
          {note && (note.reference_pivot || note.numero) && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <Label className="text-xs text-muted-foreground">Référence (lecture seule)</Label>
              <p className="font-mono text-lg font-semibold text-primary mt-1">
                {note.reference_pivot || note.numero}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Objet */}
            <div className="col-span-2">
              <Label htmlFor="objet" className={errors.objet ? "text-destructive" : ""}>
                Objet *
              </Label>
              <Input
                id="objet"
                value={formData.objet}
                onChange={(e) => {
                  setFormData({ ...formData, objet: e.target.value });
                  if (errors.objet) setErrors(prev => ({ ...prev, objet: "" }));
                }}
                placeholder="Objet de la note"
                className={errors.objet ? "border-destructive" : ""}
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
              <Label htmlFor="direction" className={errors.direction_id ? "text-destructive" : ""}>
                Direction *
              </Label>
              <Select
                value={formData.direction_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, direction_id: value });
                  if (errors.direction_id) setErrors(prev => ({ ...prev, direction_id: "" }));
                }}
              >
                <SelectTrigger className={errors.direction_id ? "border-destructive" : ""}>
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
              <Label htmlFor="demandeur" className={errors.demandeur_id ? "text-destructive" : ""}>
                Demandeur * {!canChangeDemandeur && "(auto)"}
              </Label>
              <Select
                value={formData.demandeur_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, demandeur_id: value });
                  if (errors.demandeur_id) setErrors(prev => ({ ...prev, demandeur_id: "" }));
                }}
                disabled={!canChangeDemandeur && !note}
              >
                <SelectTrigger className={cn(
                  errors.demandeur_id ? "border-destructive" : "",
                  !canChangeDemandeur && !note ? "opacity-70" : ""
                )}>
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
              <Label htmlFor="urgence" className={errors.urgence ? "text-destructive" : ""}>
                Urgence *
              </Label>
              <Select
                value={formData.urgence}
                onValueChange={(value) => {
                  setFormData({ ...formData, urgence: value });
                  if (errors.urgence) setErrors(prev => ({ ...prev, urgence: "" }));
                }}
              >
                <SelectTrigger className={errors.urgence ? "border-destructive" : ""}>
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
              <Label className={errors.date_souhaitee ? "text-destructive" : ""}>
                Date souhaitée *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date_souhaitee && "text-muted-foreground",
                      errors.date_souhaitee && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date_souhaitee 
                      ? format(formData.date_souhaitee, "dd MMMM yyyy", { locale: fr })
                      : "Sélectionner une date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date_souhaitee || undefined}
                    onSelect={(date) => {
                      setFormData({ ...formData, date_souhaitee: date || null });
                      if (errors.date_souhaitee) setErrors(prev => ({ ...prev, date_souhaitee: "" }));
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
              <Label htmlFor="justification" className={errors.justification ? "text-destructive" : ""}>
                Justification *
              </Label>
              <Textarea
                id="justification"
                value={formData.justification}
                onChange={(e) => {
                  setFormData({ ...formData, justification: e.target.value });
                  if (errors.justification) setErrors(prev => ({ ...prev, justification: "" }));
                }}
                placeholder="Justification détaillée de la demande"
                rows={3}
                className={errors.justification ? "border-destructive" : ""}
              />
              {errors.justification && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.justification}
                </p>
              )}
            </div>

            {/* Section Bénéficiaire */}
            <div className="col-span-2 space-y-3 p-4 rounded-lg border bg-muted/30">
              <Label className="text-base font-medium">Bénéficiaire (optionnel)</Label>
              
              <RadioGroup
                value={typeBeneficiaire}
                onValueChange={(val) => handleTypeBeneficiaireChange(val as "externe" | "interne")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="externe" id="beneficiaire-externe" />
                  <Label htmlFor="beneficiaire-externe" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Prestataire externe
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="interne" id="beneficiaire-interne" />
                  <Label htmlFor="beneficiaire-interne" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Agent interne
                  </Label>
                </div>
              </RadioGroup>

              {typeBeneficiaire === "externe" && (
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

              {typeBeneficiaire === "interne" && (
                <Select
                  value={formData.beneficiaire_interne_id}
                  onValueChange={(value) => setFormData({ ...formData, beneficiaire_interne_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name || ""} {profile.last_name || ""} {profile.email ? `(${profile.email})` : ""}
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

            {/* Pièces jointes */}
            <div className="col-span-2 space-y-3">
              <Label>Pièces jointes (TDR, devis, etc.)</Label>
              
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Ajouter des fichiers
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  PDF, Word, Excel, Images • Max 10MB par fichier
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[300px]">{item.file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(item.file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {note ? "Modifier" : "Créer en brouillon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
