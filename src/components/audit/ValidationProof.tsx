/**
 * ValidationProof - Composant pour afficher la preuve de validation
 *
 * Affiche:
 * - QR code de vérification
 * - Hash d'intégrité
 * - Détails du validateur
 * - Timeline des validations
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  QrCode,
  Shield,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Copy,
  Download,
  FileCheck,
  Fingerprint,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ValidationSignature, WorkflowStep } from "@/hooks/useAuditTrail";

// ============================================
// TYPES
// ============================================

interface ValidationProofProps {
  signatures: ValidationSignature[];
  dossierRef: string;
  title?: string;
  compact?: boolean;
  className?: string;
}

interface SingleProofProps {
  signature: ValidationSignature;
  showQR?: boolean;
}

// ============================================
// STEP LABELS
// ============================================

const STEP_LABELS: Record<WorkflowStep, string> = {
  creation: "Création",
  note_sef: "Note SEF",
  note_aef: "Note AEF",
  imputation: "Imputation",
  expression_besoin: "Expression de Besoin",
  passation_marche: "Passation Marché",
  engagement: "Engagement",
  liquidation: "Liquidation",
  ordonnancement: "Ordonnancement",
  reglement: "Règlement",
  cloture: "Clôture",
};

const STEP_ORDER: WorkflowStep[] = [
  "creation",
  "note_sef",
  "note_aef",
  "imputation",
  "expression_besoin",
  "passation_marche",
  "engagement",
  "liquidation",
  "ordonnancement",
  "reglement",
  "cloture",
];

// ============================================
// SINGLE PROOF COMPONENT
// ============================================

function SingleValidationProof({ signature, showQR = true }: SingleProofProps) {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(signature.hash);
    setCopied(true);
    toast.success("Hash copié dans le presse-papier");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${signature.hash.slice(0, 8)}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `validation_${signature.dossierRef}_${signature.step}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-4">
      {/* QR Code */}
      {showQR && (
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG
            id={`qr-${signature.hash.slice(0, 8)}`}
            value={signature.qrPayload}
            size={180}
            level="H"
            includeMargin
          />
        </div>
      )}

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Étape</span>
          <Badge variant="outline" className="font-medium">
            {STEP_LABELS[signature.step] || signature.step}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Validateur</span>
          <div className="text-right">
            <p className="font-medium">{signature.userName}</p>
            <p className="text-xs text-muted-foreground">{signature.userRole}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Date & Heure</span>
          <span className="font-medium">
            {format(new Date(signature.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
          </span>
        </div>

        <Separator />

        {/* Hash */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Hash d'intégrité (SHA-256)</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
              {signature.hash}
            </code>
            <Button variant="ghost" size="icon" onClick={copyHash}>
              <Copy className={cn("h-4 w-4", copied && "text-green-500")} />
            </Button>
          </div>
        </div>

        {/* Actions */}
        {showQR && (
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={downloadQR}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger QR
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ValidationProof({
  signatures,
  dossierRef,
  title = "Preuves de validation",
  compact = false,
  className,
}: ValidationProofProps) {
  const [selectedSignature, setSelectedSignature] = useState<ValidationSignature | null>(null);

  // Sort signatures by step order
  const sortedSignatures = [...signatures].sort((a, b) => {
    const orderA = STEP_ORDER.indexOf(a.step);
    const orderB = STEP_ORDER.indexOf(b.step);
    return orderA - orderB;
  });

  if (signatures.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Aucune signature de validation enregistrée</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
          {sortedSignatures.map((sig, _index) => (
            <Tooltip key={sig.hash}>
              <TooltipTrigger asChild>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => setSelectedSignature(sig)}
                    >
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-xs">{STEP_LABELS[sig.step]?.slice(0, 3) || sig.step.slice(0, 3)}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Preuve de validation - {STEP_LABELS[sig.step] || sig.step}
                      </DialogTitle>
                    </DialogHeader>
                    <SingleValidationProof signature={sig} />
                  </DialogContent>
                </Dialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>{STEP_LABELS[sig.step] || sig.step}</p>
                <p className="text-xs text-muted-foreground">{sig.userName}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Dossier {dossierRef} - {signatures.length} validation(s) signée(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="relative">
            {sortedSignatures.map((sig, index) => (
              <div key={sig.hash} className="flex items-start gap-4 relative pb-8 last:pb-0">
                {/* Timeline line */}
                {index < sortedSignatures.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-green-200 -ml-px" />
                )}

                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 z-10">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <span className="font-medium">{STEP_LABELS[sig.step] || sig.step}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        Signé
                      </Badge>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-1 h-3 w-3" />
                          Voir preuve
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-primary" />
                            Preuve de validation
                          </DialogTitle>
                        </DialogHeader>
                        <SingleValidationProof signature={sig} />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{sig.userName} ({sig.userRole})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(sig.timestamp), "dd MMMM yyyy à HH:mm:ss", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-3 w-3" />
                      <code className="text-xs font-mono">{sig.hash.slice(0, 24)}...</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============================================
// DOSSIER FULL HISTORY COMPONENT
// ============================================

interface DossierHistoryTimelineProps {
  dossierRef: string;
  history: Array<{
    action: string;
    entityType: string;
    userName: string;
    userRole: string;
    timestamp: string;
    step?: string;
    signatureData?: ValidationSignature;
    reason?: string;
    justification?: string;
  }>;
  className?: string;
}

export function DossierHistoryTimeline({
  dossierRef,
  history,
  className,
}: DossierHistoryTimelineProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-blue-500";
      case "VALIDATE":
      case "SIGN":
        return "bg-green-500";
      case "REJECT":
        return "bg-red-500";
      case "DEFER":
        return "bg-yellow-500";
      case "SUBMIT":
        return "bg-indigo-500";
      case "UPDATE":
        return "bg-gray-500";
      case "RENVOI":
        return "bg-orange-500";
      default:
        return "bg-gray-400";
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE: "Création",
      UPDATE: "Modification",
      DELETE: "Suppression",
      SUBMIT: "Soumission",
      VALIDATE: "Validation",
      REJECT: "Rejet",
      DEFER: "Report",
      SIGN: "Signature",
      EXPORT: "Export",
      CLOSE: "Clôture",
      RENVOI: "Renvoi",
      UPLOAD: "Upload",
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "VALIDATE":
      case "SIGN":
        return <CheckCircle2 className="h-4 w-4" />;
      case "CREATE":
        return <FileCheck className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Aucun historique disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historique complet du dossier
        </CardTitle>
        <CardDescription>
          {dossierRef} - {history.length} événement(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative">
            {history.map((event, index) => (
              <div key={index} className="flex items-start gap-4 relative pb-6 last:pb-0">
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-full bg-muted -ml-px" />
                )}

                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 z-10",
                  getActionColor(event.action)
                )}>
                  {getActionIcon(event.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{getActionLabel(event.action)}</Badge>
                    {event.step && (
                      <span className="text-sm text-muted-foreground">
                        - {STEP_LABELS[event.step as WorkflowStep] || event.step}
                      </span>
                    )}
                    {event.signatureData && (
                      <Badge variant="secondary" className="text-xs">
                        <QrCode className="mr-1 h-3 w-3" />
                        Signé
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{event.userName} ({event.userRole})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                      </span>
                    </div>
                    {(event.reason || event.justification) && (
                      <p className="mt-2 p-2 bg-muted rounded text-sm">
                        {event.reason || event.justification}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ValidationProof;
