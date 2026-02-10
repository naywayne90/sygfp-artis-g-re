import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  Loader2,
  ClipboardCheck,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types de documents selon le mode de passation
export const DOCUMENTS_PAR_MODE = {
  gre_a_gre: [
    { code: "proforma", label: "Proforma / Devis", required: true, description: "Devis détaillé du prestataire" },
    { code: "justification_gre", label: "Note de justification", required: true, description: "Justification du choix gré à gré" },
  ],
  consultation: [
    { code: "lettre_consultation", label: "Lettre de consultation", required: true, description: "Invitation à soumissionner" },
    { code: "proforma", label: "Proformas reçus (min. 3)", required: true, description: "Au minimum 3 offres" },
    { code: "tableau_comparatif", label: "Tableau comparatif des offres", required: true, description: "Analyse comparative" },
    { code: "pv_ouverture", label: "PV d'ouverture des plis", required: true, description: "Procès-verbal d'ouverture" },
  ],
  appel_offres_ouvert: [
    { code: "dao", label: "Dossier d'Appel d'Offres (DAO)", required: true, description: "Cahier des charges complet" },
    { code: "avis_appel_offres", label: "Avis d'appel d'offres", required: true, description: "Publication officielle" },
    { code: "pv_ouverture", label: "PV d'ouverture des plis", required: true, description: "Procès-verbal d'ouverture" },
    { code: "pv_evaluation", label: "PV d'évaluation", required: true, description: "Rapport d'évaluation technique et financière" },
    { code: "rapport_analyse", label: "Rapport d'analyse", required: true, description: "Rapport détaillé d'analyse" },
    { code: "decision_attribution", label: "Décision d'attribution", required: true, description: "Notification officielle" },
  ],
  appel_offres_restreint: [
    { code: "lettre_invitation", label: "Lettres d'invitation", required: true, description: "Invitations aux soumissionnaires présélectionnés" },
    { code: "dao", label: "Dossier d'Appel d'Offres (DAO)", required: true, description: "Cahier des charges" },
    { code: "pv_ouverture", label: "PV d'ouverture des plis", required: true, description: "Procès-verbal d'ouverture" },
    { code: "pv_evaluation", label: "PV d'évaluation", required: true, description: "Rapport d'évaluation" },
    { code: "decision_attribution", label: "Décision d'attribution", required: true, description: "Notification officielle" },
  ],
  entente_directe: [
    { code: "note_justification", label: "Note de justification", required: true, description: "Justification de l'entente directe" },
    { code: "autorisation_dcmp", label: "Autorisation DCMP", required: true, description: "Autorisation de la Direction des marchés publics" },
    { code: "proforma", label: "Proforma", required: true, description: "Offre du prestataire" },
  ],
};

// Documents communs à tous les modes
export const DOCUMENTS_COMMUNS = [
  { code: "fiche_engagement", label: "Fiche d'engagement budgétaire", required: false, description: "Si engagement déjà créé" },
  { code: "attestation_fiscale", label: "Attestation fiscale prestataire", required: false, description: "Document fiscal du prestataire" },
  { code: "autres", label: "Autres documents", required: false, description: "Documents complémentaires" },
];

interface DocumentItem {
  code: string;
  label: string;
  required: boolean;
  description?: string;
  uploaded?: boolean;
  fileName?: string;
  filePath?: string;
  uploadedAt?: string;
}

interface PassationChecklistProps {
  passationId: string;
  modePassation: string;
  piecesJointes: any[];
  onUpdate?: (pieces: any[]) => void;
  readOnly?: boolean;
  onValidationChange?: (isComplete: boolean, missingDocs: string[]) => void;
}

export function PassationChecklist({
  passationId,
  modePassation,
  piecesJointes = [],
  onUpdate,
  readOnly = false,
  onValidationChange,
}: PassationChecklistProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Construire la liste des documents selon le mode
  useEffect(() => {
    const modeKey = modePassation as keyof typeof DOCUMENTS_PAR_MODE;
    const modeDocs = DOCUMENTS_PAR_MODE[modeKey] || DOCUMENTS_PAR_MODE.gre_a_gre;
    
    const allDocs = [...modeDocs, ...DOCUMENTS_COMMUNS].map((doc) => {
      const uploaded = piecesJointes.find((p: any) => p.code === doc.code);
      return {
        ...doc,
        uploaded: !!uploaded,
        fileName: uploaded?.fileName,
        filePath: uploaded?.filePath,
        uploadedAt: uploaded?.uploadedAt,
      };
    });
    
    setDocuments(allDocs);
  }, [modePassation, piecesJointes]);

  // Calculer le statut de complétion
  const requiredDocs = documents.filter((d) => d.required);
  const uploadedRequired = requiredDocs.filter((d) => d.uploaded);
  const completionPercent = requiredDocs.length > 0 
    ? Math.round((uploadedRequired.length / requiredDocs.length) * 100)
    : 100;
  const isComplete = uploadedRequired.length === requiredDocs.length;
  const missingDocs = requiredDocs.filter((d) => !d.uploaded).map((d) => d.label);

  // Notifier le parent du changement de validation
  useEffect(() => {
    onValidationChange?.(isComplete, missingDocs);
  }, [isComplete, missingDocs.length]);

  const handleFileChange = async (code: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(code);

    // Simuler l'upload (dans la vraie implémentation, utiliser Supabase Storage)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const updatedPieces = [
      ...piecesJointes.filter((p: any) => p.code !== code),
      {
        code,
        fileName: file.name,
        filePath: `passations/${passationId}/${code}/${file.name}`,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      },
    ];

    setIsUploading(null);
    onUpdate?.(updatedPieces);
  };

  const handleRemove = (code: string) => {
    const updatedPieces = piecesJointes.filter((p: any) => p.code !== code);
    onUpdate?.(updatedPieces);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Pièces justificatives</CardTitle>
          </div>
          <Badge 
            variant={isComplete ? "default" : "secondary"}
            className={cn(
              isComplete && "bg-green-100 text-green-700 hover:bg-green-100"
            )}
          >
            {completionPercent}% complet
          </Badge>
        </div>
        <CardDescription>
          Documents requis pour le mode "{modePassation.replace(/_/g, " ")}"
        </CardDescription>
        <Progress value={completionPercent} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerte si incomplet */}
        {!isComplete && !readOnly && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Documents manquants</AlertTitle>
            <AlertDescription>
              La soumission est bloquée. Documents requis manquants :
              <ul className="list-disc list-inside mt-1">
                {missingDocs.map((doc) => (
                  <li key={doc} className="text-sm">{doc}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {isComplete && (
          <Alert className="bg-green-50 border-green-200">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Checklist complète</AlertTitle>
            <AlertDescription className="text-green-600">
              Tous les documents obligatoires sont présents. La passation peut être soumise.
            </AlertDescription>
          </Alert>
        )}

        {/* Liste des documents */}
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.code}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                doc.uploaded 
                  ? "bg-green-50 border-green-200" 
                  : doc.required 
                    ? "bg-orange-50 border-orange-200" 
                    : "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  doc.uploaded ? "bg-green-100" : doc.required ? "bg-orange-100" : "bg-muted"
                )}>
                  {doc.uploaded ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : doc.required ? (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{doc.label}</span>
                    {doc.required && (
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                        Obligatoire
                      </Badge>
                    )}
                  </div>
                  {doc.uploaded && doc.fileName ? (
                    <p className="text-xs text-green-600">{doc.fileName}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{doc.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!readOnly && (
                  <>
                    {isUploading === doc.code ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : doc.uploaded ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(doc.code)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Label htmlFor={`file-${doc.code}`} className="cursor-pointer">
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90">
                          <Upload className="h-3 w-3" />
                          <span>Upload</span>
                        </div>
                        <Input
                          id={`file-${doc.code}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(doc.code, e)}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                      </Label>
                    )}
                  </>
                )}
                {readOnly && !doc.uploaded && doc.required && (
                  <Badge variant="destructive" className="text-xs">Manquant</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
