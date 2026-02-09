import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { generateFeuilleRouteTemplate } from '@/lib/templates/feuilleRouteTemplate';
import { toast } from 'sonner';

interface DownloadTemplateButtonProps {
  directionCode: string;
  directionLabel: string;
}

export function DownloadTemplateButton({
  directionCode,
  directionLabel,
}: DownloadTemplateButtonProps) {
  const { exercice } = useExercice();
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!exercice) {
      toast.error('Veuillez selectionner un exercice budgetaire.');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch actions from Supabase
      const { data: actions, error } = await supabase
        .from('actions')
        .select('code, libelle')
        .order('code');

      if (error) {
        throw error;
      }

      const actionRefs = (actions ?? []).map((a) => ({
        code: a.code,
        libelle: a.libelle,
      }));

      const blob = generateFeuilleRouteTemplate(
        directionCode,
        directionLabel,
        exercice,
        actionRefs
      );

      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Feuille_Route_${directionCode}_${exercice}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Template telecharge avec succes.');
    } catch (err) {
      console.error('Erreur generation template:', err);
      toast.error('Erreur lors de la generation du template.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleDownload} disabled={isLoading || !exercice}>
      <Download className="mr-2 h-4 w-4" />
      {isLoading ? 'Generation...' : 'Telecharger le template'}
    </Button>
  );
}
