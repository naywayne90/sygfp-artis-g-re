/**
 * CoherenceCheckButton - Bouton de lancement de vérification de cohérence
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useCoherenceCheck, CoherenceReport } from "@/hooks/useCoherenceCheck";
import { CoherenceReportCard } from "./CoherenceReportCard";
import { toast } from "sonner";

interface CoherenceCheckButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function CoherenceCheckButton({
  variant = "outline",
  size = "default",
  showLabel = true,
}: CoherenceCheckButtonProps) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<CoherenceReport | null>(null);
  const { generateReportAsync, isGenerating } = useCoherenceCheck();

  const handleCheck = async () => {
    try {
      const newReport = await generateReportAsync("manual");
      setReport(newReport);
      setOpen(true);

      if (newReport.errorsCount > 0) {
        toast.error(`${newReport.errorsCount} erreur(s) de cohérence détectée(s)`);
      } else if (newReport.warningsCount > 0) {
        toast.warning(`${newReport.warningsCount} avertissement(s) détecté(s)`);
      } else {
        toast.success("Aucune anomalie détectée");
      }
    } catch (error) {
      toast.error("Erreur lors de la vérification");
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    const newReport = await generateReportAsync("manual");
    setReport(newReport);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleCheck}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        {showLabel && <span className="ml-2">Vérifier la cohérence</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Vérification de Cohérence</DialogTitle>
            <DialogDescription>
              Analyse des données pour détecter les incohérences
            </DialogDescription>
          </DialogHeader>
          {report && (
            <CoherenceReportCard
              report={report}
              onRefresh={handleRefresh}
              isRefreshing={isGenerating}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
