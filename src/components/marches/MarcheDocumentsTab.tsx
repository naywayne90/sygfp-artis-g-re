import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Trash2, Download, Upload, Loader2 } from "lucide-react";
import { useMarcheDocuments, TYPES_DOCUMENTS_MARCHE } from "@/hooks/useMarcheDocuments";

interface MarcheDocumentsTabProps {
  marcheId: string;
  canEdit?: boolean;
}

export function MarcheDocumentsTab({ marcheId, canEdit = true }: MarcheDocumentsTabProps) {
  const { documents, loadingDocuments, addDocument, deleteDocument, isAdding } = useMarcheDocuments(marcheId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    type_document: "",
    libelle: "",
    description: "",
  });

  const handleAdd = async () => {
    if (!formData.type_document || !formData.libelle) return;

    await addDocument({
      marche_id: marcheId,
      ...formData,
      file_path: null,
      file_name: null,
      file_size: null,
      file_type: null,
      metadata: {},
    });

    setFormData({ type_document: "", libelle: "", description: "" });
    setShowAddDialog(false);
  };

  const getTypeLabel = (type: string) => {
    return TYPES_DOCUMENTS_MARCHE.find(t => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents du marché
            </CardTitle>
            <CardDescription>
              Pièces justificatives, PV, contrats et autres documents
            </CardDescription>
          </div>
          {canEdit && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type de document *</Label>
                    <Select
                      value={formData.type_document}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, type_document: v }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_DOCUMENTS_MARCHE.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Libellé *</Label>
                    <Input
                      value={formData.libelle}
                      onChange={(e) => setFormData(prev => ({ ...prev, libelle: e.target.value }))}
                      className="mt-1.5"
                      placeholder="Ex: PV d'attribution du 15/01/2026"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1.5"
                      rows={2}
                      placeholder="Description optionnelle..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleAdd} 
                      disabled={isAdding || !formData.type_document || !formData.libelle}
                    >
                      {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Ajouter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loadingDocuments ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document</p>
            {canEdit && (
              <p className="text-sm mt-2">Cliquez sur "Ajouter" pour joindre un document</p>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Date</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="secondary">{getTypeLabel(doc.type_document)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.libelle}</p>
                        {doc.description && (
                          <p className="text-xs text-muted-foreground">{doc.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.file_name ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{doc.file_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(doc.file_size)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(doc.uploaded_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
