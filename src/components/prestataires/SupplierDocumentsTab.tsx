import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useSupplierDocuments, useRequiredDocumentTypes, SupplierDocument } from "@/hooks/useSupplierDocuments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SupplierDocumentsTabProps {
  supplierId: string;
}

export function SupplierDocumentsTab({ supplierId }: SupplierDocumentsTabProps) {
  const { documents = [], isLoading, addDocument, deleteDocument } = useSupplierDocuments(supplierId);
  const { types: documentTypes = [] } = useRequiredDocumentTypes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type_document: "",
    numero: "",
    date_delivrance: "",
    date_expiration: "",
    notes: "",
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = () => {
    if (!formData.type_document) return;
    
    setIsAdding(true);
    addDocument({
      type_document: formData.type_document,
      numero: formData.numero || undefined,
      date_delivrance: formData.date_delivrance || undefined,
      date_expiration: formData.date_expiration || undefined,
      notes: formData.notes || undefined,
    });
    
    setFormData({
      type_document: "",
      numero: "",
      date_delivrance: "",
      date_expiration: "",
      notes: "",
    });
    setIsAddDialogOpen(false);
    setIsAdding(false);
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "valide":
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Valide
          </Badge>
        );
      case "a_renouveler":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            <Clock className="h-3 w-3 mr-1" />
            À renouveler
          </Badge>
        );
      case "expire":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expiré
          </Badge>
        );
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  // Check missing required documents
  const existingDocTypes = documents.map(d => d.type_document);
  const missingRequiredDocs = documentTypes
    .filter(dt => dt.est_obligatoire && !existingDocTypes.includes(dt.code));

  if (isLoading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Documents</h4>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau document</DialogTitle>
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
                    {documentTypes.map((type) => (
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
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes optionnelles"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.type_document || isAdding}
              >
                {isAdding ? "Ajout..." : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Missing required documents alert */}
      {missingRequiredDocs.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">Documents obligatoires manquants</p>
              <ul className="text-sm text-orange-700 dark:text-orange-300 mt-1 list-disc list-inside">
                {missingRequiredDocs.map((doc) => (
                  <li key={doc.id}>{doc.libelle}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun document enregistré</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Numéro</TableHead>
              <TableHead>Délivrance</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.type_document}</TableCell>
                <TableCell className="font-mono">{doc.numero || "-"}</TableCell>
                <TableCell>
                  {doc.date_delivrance 
                    ? format(new Date(doc.date_delivrance), "dd/MM/yyyy")
                    : "-"
                  }
                </TableCell>
                <TableCell>
                  {doc.date_expiration 
                    ? format(new Date(doc.date_expiration), "dd/MM/yyyy")
                    : "-"
                  }
                </TableCell>
                <TableCell>{getStatusBadge(doc.statut)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteDocument(doc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
