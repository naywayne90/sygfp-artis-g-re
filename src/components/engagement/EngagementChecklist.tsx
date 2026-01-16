import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  FileCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Shield,
  FileText
} from "lucide-react";
import { useEngagementDocuments, TYPES_DOCUMENTS_ENGAGEMENT } from "@/hooks/useEngagementDocuments";

interface EngagementChecklistProps {
  engagementId: string;
  canEdit?: boolean;
  showProgress?: boolean;
}

export function EngagementChecklist({ 
  engagementId, 
  canEdit = true,
  showProgress = true 
}: EngagementChecklistProps) {
  const { 
    documents, 
    isLoading, 
    checklistStatus, 
    markProvided, 
    addDocument,
    verifyDocument,
    isMarking,
    isAdding 
  } = useEngagementDocuments(engagementId);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDoc, setNewDoc] = useState({ type_document: "", libelle: "" });

  const handleMarkProvided = async (docId: string, provided: boolean) => {
    await markProvided({ documentId: docId, provided });
  };

  const handleAddDocument = async () => {
    if (!newDoc.type_document || !newDoc.libelle) return;
    await addDocument(newDoc);
    setNewDoc({ type_document: "", libelle: "" });
    setShowAddDialog(false);
  };

  const getTypeLabel = (type: string) => {
    return TYPES_DOCUMENTS_ENGAGEMENT.find(t => t.value === type)?.label || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Check-list des pièces
            </CardTitle>
            <CardDescription>
              Pièces obligatoires à fournir pour la validation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {checklistStatus.isComplete ? (
              <Badge className="bg-green-100 text-green-700 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Complet
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {checklistStatus.provided}/{checklistStatus.total}
              </Badge>
            )}
            {canEdit && (
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
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
                      <Label>Type de document</Label>
                      <Select
                        value={newDoc.type_document}
                        onValueChange={(v) => setNewDoc(prev => ({ ...prev, type_document: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPES_DOCUMENTS_ENGAGEMENT.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Libellé</Label>
                      <Input
                        value={newDoc.libelle}
                        onChange={(e) => setNewDoc(prev => ({ ...prev, libelle: e.target.value }))}
                        className="mt-1.5"
                        placeholder="Description du document"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddDocument} disabled={isAdding}>
                        {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{checklistStatus.percentage}%</span>
            </div>
            <Progress 
              value={checklistStatus.percentage} 
              className={checklistStatus.isComplete ? "bg-green-100" : ""}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun document requis</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  doc.est_fourni 
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900" 
                    : doc.est_obligatoire 
                      ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
                      : "bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={doc.est_fourni}
                  onCheckedChange={(checked) => 
                    canEdit && handleMarkProvided(doc.id, checked === true)
                  }
                  disabled={!canEdit || isMarking}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${doc.est_fourni ? "line-through text-muted-foreground" : ""}`}>
                      {doc.libelle}
                    </span>
                    {doc.est_obligatoire && (
                      <Badge variant="outline" className="text-xs">
                        Obligatoire
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(doc.type_document)}
                    </Badge>
                  </div>
                  {doc.uploaded_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fourni le {format(new Date(doc.uploaded_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </p>
                  )}
                  {doc.verified_at && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                      <Shield className="h-3 w-3" />
                      Vérifié le {format(new Date(doc.verified_at), "dd/MM/yyyy", { locale: fr })}
                    </div>
                  )}
                </div>
                {doc.est_fourni && !doc.verified_at && canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => verifyDocument(doc.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
