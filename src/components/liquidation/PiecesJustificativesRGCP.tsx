/**
 * PiecesJustificativesRGCP — Checklist dynamique RGCP
 *
 * Affiche les pièces justificatives requises selon le type de dépense
 * (RGCP + Code des Marchés Publics de Côte d'Ivoire) et compare
 * avec les documents effectivement fournis dans la liquidation.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Circle,
  FileCheck,
  AlertCircle,
  Info,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import {
  resolveTypeDepense,
  type PieceJustificative,
  type TypeDepenseConfig,
} from '@/lib/config/rgcp-pieces-config';
import { useLiquidationDocuments } from '@/hooks/useLiquidationDocuments';

interface PiecesJustificativesRGCPProps {
  liquidationId: string;
  typeEngagement: string | null | undefined;
  typeMarche: string | null | undefined;
}

export function PiecesJustificativesRGCP({
  liquidationId,
  typeEngagement,
  typeMarche,
}: PiecesJustificativesRGCPProps) {
  const config = useMemo(
    () => resolveTypeDepense(typeEngagement, typeMarche),
    [typeEngagement, typeMarche]
  );

  const { documents } = useLiquidationDocuments(liquidationId);

  // Croiser pièces requises RGCP avec documents fournis
  const checklist = useMemo(() => {
    const providedCodes = new Set(
      documents.filter((d) => d.is_provided).map((d) => d.document_type)
    );
    const verifiedCodes = new Set(
      documents.filter((d) => d.is_verified).map((d) => d.document_type)
    );

    return config.pieces.map((piece) => ({
      ...piece,
      fourni: providedCodes.has(piece.code),
      verifie: verifiedCodes.has(piece.code),
    }));
  }, [config.pieces, documents]);

  const stats = useMemo(() => {
    const obligatoires = checklist.filter((p) => p.obligatoire);
    const fournis = obligatoires.filter((p) => p.fourni);
    const verifies = obligatoires.filter((p) => p.verifie);
    return {
      totalObligatoires: obligatoires.length,
      fournisObligatoires: fournis.length,
      verifiesObligatoires: verifies.length,
      totalPieces: checklist.length,
      totalFournis: checklist.filter((p) => p.fourni).length,
      isComplet: obligatoires.every((p) => p.fourni),
      isVerifie: obligatoires.every((p) => p.verifie),
      pourcent:
        obligatoires.length > 0 ? Math.round((fournis.length / obligatoires.length) * 100) : 100,
    };
  }, [checklist]);

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-slate-600" />
            Pièces justificatives — RGCP
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={config.couleur}>
              {config.icon} {config.label}
            </Badge>
            {stats.isComplet ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Conforme
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                {stats.totalObligatoires - stats.fournisObligatoires} manquant(s)
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de progression */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conformité RGCP</span>
            <span className="font-medium">
              {stats.fournisObligatoires}/{stats.totalObligatoires} obligatoires
            </span>
          </div>
          <Progress
            value={stats.pourcent}
            className={`h-2 ${stats.isComplet ? '[&>div]:bg-green-500' : '[&>div]:bg-amber-500'}`}
          />
        </div>

        {/* Liste des pièces */}
        <div className="space-y-1">
          {checklist.map((piece) => (
            <PieceItem key={piece.code} piece={piece} />
          ))}
        </div>

        {/* Note réglementaire */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Réf. : Règlement Général sur la Comptabilité Publique (UEMOA) &amp; Code des Marchés
            Publics de Côte d'Ivoire (Décret 2009-259). Les pièces obligatoires doivent être
            fournies avant soumission de la liquidation.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Sous-composant : ligne d'une pièce ────────────────────────

function PieceItem({
  piece,
}: {
  piece: PieceJustificative & { fourni: boolean; verifie: boolean };
}) {
  const icon = piece.verifie ? (
    <ShieldCheck className="h-4 w-4 text-green-600" />
  ) : piece.fourni ? (
    <CheckCircle2 className="h-4 w-4 text-blue-500" />
  ) : (
    <Circle
      className={`h-4 w-4 ${piece.obligatoire ? 'text-amber-400' : 'text-muted-foreground/40'}`}
    />
  );

  const statusLabel = piece.verifie
    ? 'Vérifié'
    : piece.fourni
      ? 'Fourni'
      : piece.obligatoire
        ? 'Manquant'
        : 'Non fourni';

  const statusColor = piece.verifie
    ? 'bg-green-50 text-green-700 border-green-200'
    : piece.fourni
      ? 'bg-blue-50 text-blue-600 border-blue-200'
      : piece.obligatoire
        ? 'bg-amber-50 text-amber-600 border-amber-200'
        : 'bg-muted text-muted-foreground border-muted';

  return (
    <div
      className={`
        flex items-center justify-between py-2 px-3 rounded-md text-sm
        ${piece.verifie ? 'bg-green-50/50' : piece.fourni ? 'bg-blue-50/30' : ''}
      `}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon}
        <span
          className={
            piece.fourni ? '' : piece.obligatoire ? 'font-medium' : 'text-muted-foreground'
          }
        >
          {piece.label}
        </span>
        {piece.obligatoire && <span className="text-red-400 text-xs">*</span>}
        {piece.ref_rgcp && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground/60 cursor-help">
                  {piece.ref_rgcp}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">{piece.ref_rgcp}</p>
                {piece.description && <p className="text-xs mt-1">{piece.description}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${statusColor}`}>
        {statusLabel}
      </Badge>
    </div>
  );
}
