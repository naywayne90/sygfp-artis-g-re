import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, ExternalLink, Loader2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Engagement } from '@/hooks/useEngagements';
import { generateBonEngagementPDF } from '@/lib/pdf/generateBonEngagementPDF';
import { EngagementPrintDialog } from './EngagementPrintDialog';
import { EngagementChecklist } from './EngagementChecklist';
import { DossierGED } from '@/components/ged';
import { toast } from 'sonner';

interface EngagementDetailsDocumentsProps {
  engagement: Engagement;
  onCloseDialog: () => void;
}

export function EngagementDetailsDocuments({
  engagement,
  onCloseDialog,
}: EngagementDetailsDocumentsProps) {
  const navigate = useNavigate();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const isSurMarche = engagement.type_engagement === 'sur_marche';

  return (
    <>
      <div className="space-y-4">
        {/* Bon d'engagement PDF */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Bon d'engagement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isGeneratingPDF}
              onClick={async () => {
                setIsGeneratingPDF(true);
                try {
                  await generateBonEngagementPDF(engagement);
                  toast.success('PDF généré avec succès');
                } catch (error) {
                  toast.error('Erreur lors de la génération du PDF', {
                    description: error instanceof Error ? error.message : 'Erreur inconnue',
                  });
                } finally {
                  setIsGeneratingPDF(false);
                }
              }}
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger le bon d'engagement (PDF)
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowPrintDialog(true)}
            >
              <Printer className="h-4 w-4" />
              Aperçu / Imprimer
            </Button>
          </CardContent>
        </Card>

        {/* Pièces jointes */}
        <DossierGED
          entityType="engagement"
          entityId={engagement.id}
          dossierId={engagement.dossier_id || undefined}
          reference={engagement.numero}
          exercice={engagement.exercice || undefined}
          etape="engagement"
          showChecklist={true}
          readOnly={engagement.statut === 'valide'}
        />

        {/* Checklist des pièces */}
        <EngagementChecklist
          engagementId={engagement.id}
          canEdit={engagement.statut !== 'valide'}
        />

        {/* Lien vers contrat/marché si sur_marche */}
        {isSurMarche && engagement.passation_marche_id && (
          <>
            <Separator />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                onCloseDialog();
                navigate(`/execution/passation-marche?detail=${engagement.passation_marche_id}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Voir le contrat / marché source
            </Button>
          </>
        )}
      </div>

      {/* Dialog impression */}
      <EngagementPrintDialog
        engagement={engagement}
        open={showPrintDialog}
        onOpenChange={setShowPrintDialog}
      />
    </>
  );
}
