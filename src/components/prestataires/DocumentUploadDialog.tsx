import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRequiredDocumentTypes } from "@/hooks/useSupplierDocuments";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierCode: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  supplierId,
  supplierCode,
}: DocumentUploadDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { types: documentTypes = [] } = useRequiredDocumentTypes();
  
  const [formData, setFormData] = useState({
    type_document: "",
    numero: "",
    date_delivrance: "",
    date_expiration: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setFormData({
      type_document: "",
      numero: "",
      date_delivrance: "",
      date_expiration: "",
      notes: "",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      let filePath: string | null = null;
      let fileName: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const uniqueName = `${supplierCode}/${formData.type_document}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("prestataires_docs")
          .upload(uniqueName, selectedFile);

        if (uploadError) throw uploadError;
        
        filePath = uniqueName;
        fileName = selectedFile.name;
      }

      // Insert document record
      const { error } = await supabase.from("supplier_documents").insert({
        supplier_id: supplierId,
        type_document: formData.type_document,
        numero: formData.numero || null,
        date_delivrance: formData.date_delivrance || null,
        date_expiration: formData.date_expiration || null,
        fichier_path: filePath,
        fichier_nom: fileName,
        notes: formData.notes || null,
      });

      if (error) throw error;

      // Audit log
      await supabase.from("audit_logs").insert({
        entity_type: "supplier_documents",
        entity_id: supplierId,
        action: "document_added",
        new_values: {
          type_document: formData.type_document,
          has_file: !!selectedFile,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-documents", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["supplier-expired-documents"] });
      toast.success("Document ajouté avec succès");
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 10 Mo");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.type_document) {
      toast.error("Veuillez sélectionner un type de document");
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ajouter un document
          </DialogTitle>
          <DialogDescription>
            Prestataire: {supplierCode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Type de document *</Label>
            <Select
              value={formData.type_document}
              onValueChange={(value) => setFormData({ ...formData, type_document: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.filter(t => t.est_actif).map((type) => (
                  <SelectItem key={type.id} value={type.code}>
                    {type.libelle}
                    {type.est_obligatoire && " *"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Numéro du document</Label>
            <Input
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              placeholder="Numéro de référence"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de délivrance</Label>
              <Input
                type="date"
                value={formData.date_delivrance}
                onChange={(e) => setFormData({ ...formData, date_delivrance: e.target.value })}
              />
            </div>
            <div>
              <Label>Date d'expiration</Label>
              <Input
                type="date"
                value={formData.date_expiration}
                onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Fichier (PDF, image...)</Label>
            <div className="mt-1.5">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} Ko)
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes ou commentaires..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.type_document || uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
