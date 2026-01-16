import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useLiquidationDocuments } from "@/hooks/useLiquidationDocuments";
import { 
  FileCheck, 
  FileX, 
  CheckCircle, 
  Circle, 
  Upload, 
  Eye,
  Loader2,
  AlertCircle
} from "lucide-react";

interface LiquidationChecklistProps {
  liquidationId: string;
  readOnly?: boolean;
}

const DOCUMENT_ICONS: Record<string, string> = {
  facture: "📄",
  pv_reception: "📋",
  bon_livraison: "📦",
  attestation_service_fait: "✅",
  bordereau_livraison: "🚚",
  autre: "📎",
};

export function LiquidationChecklist({ liquidationId, readOnly = false }: LiquidationChecklistProps) {
  const {
    documents,
    isLoading,
    checklistStatus,
    markAsProvided,
    verifyDocument,
    isMarking,
    isVerifying,
  } = useLiquidationDocuments(liquidationId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const progressPercent = checklistStatus.totalRequired > 0 
    ? (checklistStatus.providedRequired / checklistStatus.totalRequired) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pièces justificatives
            </CardTitle>
            <CardDescription>
              Documents requis pour la liquidation
            </CardDescription>
          </div>
          {checklistStatus.isComplete ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complet
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              <AlertCircle className="h-3 w-3 mr-1" />
              {checklistStatus.missingLabels.length} manquant(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">
              {checklistStatus.providedRequired}/{checklistStatus.totalRequired} fournis
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Documents list */}
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${doc.is_verified 
                  ? "bg-success/5 border-success/20" 
                  : doc.is_provided 
                    ? "bg-primary/5 border-primary/20" 
                    : "bg-muted/50 border-muted"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{DOCUMENT_ICONS[doc.document_type] || "📎"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{doc.document_label}</span>
                    {doc.is_required && (
                      <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
                    )}
                  </div>
                  {doc.file_name && (
                    <span className="text-xs text-muted-foreground">{doc.file_name}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {doc.is_verified ? (
                  <Badge variant="outline" className="bg-success/10 text-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                ) : doc.is_provided ? (
                  <>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Fourni
                    </Badge>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => verifyDocument({ documentId: doc.id })}
                        disabled={isVerifying}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vérifier
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      <FileX className="h-3 w-3 mr-1" />
                      Non fourni
                    </Badge>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsProvided({ documentId: doc.id })}
                        disabled={isMarking}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Fournir
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Missing documents warning */}
        {!checklistStatus.isComplete && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning">Documents manquants</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {checklistStatus.missingLabels.join(", ")}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
