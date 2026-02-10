import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ReferentielData {
  objectifs_strategiques: Array<{ code: string; libelle: string }>;
  directions: Array<{ code: string; label: string; sigle: string }>;
  actions: Array<{ code: string; libelle: string; os_code?: string }>;
  activites: Array<{ code: string; libelle: string; action_code?: string }>;
  nomenclature_nbe: Array<{ code: string; libelle: string }>;
}

export function BudgetTemplateDownload() {
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchReferentiels = async (): Promise<ReferentielData> => {
    const [osResult, dirResult, actionsResult, activitesResult, nbeResult] = await Promise.all([
      supabase.from("objectifs_strategiques").select("code, libelle").eq("est_actif", true).order("code"),
      supabase.from("directions").select("code, label, sigle").eq("est_active", true).order("code"),
      supabase.from("actions").select("code, libelle, os_id, objectifs_strategiques(code)").eq("est_active", true).order("code"),
      supabase.from("activites").select("code, libelle, action_id, actions(code)").eq("est_active", true).order("code"),
      supabase.from("nomenclature_nbe").select("code, libelle").eq("est_active", true).order("code"),
    ]);

    return {
      objectifs_strategiques: osResult.data || [],
      directions: dirResult.data || [],
      actions: (actionsResult.data || []).map((a: any) => ({
        code: a.code,
        libelle: a.libelle,
        os_code: a.objectifs_strategiques?.code || "",
      })),
      activites: (activitesResult.data || []).map((a: any) => ({
        code: a.code,
        libelle: a.libelle,
        action_code: a.actions?.code || "",
      })),
      nomenclature_nbe: nbeResult.data || [],
    };
  };

  const generateTemplate = async () => {
    setIsGenerating(true);
    try {
      const data = await fetchReferentiels();
      const wb = XLSX.utils.book_new();

      // 1. Onglet Mode d'emploi
      const instructions = [
        ["TEMPLATE IMPORT BUDGET ARTI"],
        [""],
        ["Instructions de remplissage :"],
        ["1. Remplissez l'onglet 'Lignes_Budget' avec vos données"],
        ["2. Utilisez les codes des onglets de référence (OS, Directions, NBE, etc.)"],
        ["3. Le code d'imputation est généré automatiquement si laissé vide"],
        ["4. Les montants doivent être en FCFA sans séparateurs de milliers"],
        [""],
        ["Format du code d'imputation (18 chiffres) :"],
        ["  - Positions 1-2 : Code OS (ex: 11)"],
        ["  - Positions 3-4 : Code Action (ex: 01)"],
        ["  - Positions 5-7 : Code Activité (ex: 101)"],
        ["  - Positions 8-9 : Code Sous-Activité (ex: 02)"],
        ["  - Positions 10-11 : Code Direction (ex: 02)"],
        ["  - Position 12 : Nature dépense (1=Personnel, 2=B&S, 3=Transferts, 4=Invest)"],
        ["  - Positions 13-18 : Code NBE (ex: 671700)"],
        [""],
        ["Niveaux hiérarchiques :"],
        ["  - chapitre : Niveau agrégé (OS)"],
        ["  - article : Niveau intermédiaire (Action)"],
        ["  - paragraphe : Niveau détail (ligne budgétaire)"],
      ];
      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
      wsInstructions["!cols"] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsInstructions, "Mode_Emploi");

      // 2. Onglet OS
      const osData = [
        ["Code_OS", "Libellé"],
        ...data.objectifs_strategiques.map((os) => [os.code, os.libelle]),
      ];
      const wsOS = XLSX.utils.aoa_to_sheet(osData);
      wsOS["!cols"] = [{ wch: 10 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsOS, "OS");

      // 3. Onglet Directions
      const dirData = [
        ["Code_Direction", "Sigle", "Libellé"],
        ...data.directions.map((d) => [d.code, d.sigle, d.label]),
      ];
      const wsDir = XLSX.utils.aoa_to_sheet(dirData);
      wsDir["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsDir, "Directions");

      // 4. Onglet Actions
      const actionsData = [
        ["Code_Action", "Code_OS", "Libellé"],
        ...data.actions.map((a) => [a.code, a.os_code, a.libelle]),
      ];
      const wsActions = XLSX.utils.aoa_to_sheet(actionsData);
      wsActions["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 70 }];
      XLSX.utils.book_append_sheet(wb, wsActions, "Actions");

      // 5. Onglet Activités
      const activitesData = [
        ["Code_Activite", "Code_Action", "Libellé"],
        ...data.activites.map((a) => [a.code, a.action_code, a.libelle]),
      ];
      const wsActivites = XLSX.utils.aoa_to_sheet(activitesData);
      wsActivites["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsActivites, "Activites");

      // 6. Onglet NBE
      const nbeData = [
        ["Code_NBE", "Libellé"],
        ...data.nomenclature_nbe.map((n) => [n.code, n.libelle]),
      ];
      const wsNBE = XLSX.utils.aoa_to_sheet(nbeData);
      wsNBE["!cols"] = [{ wch: 12 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, wsNBE, "NBE");

      // 7. Onglet principal : Lignes Budget (template vide avec exemples)
      const budgetData = [
        [
          "Imputation",
          "Libellé",
          "Code_OS",
          "Code_Action",
          "Code_Activite",
          "Code_Sous_Activite",
          "Code_Direction",
          "Nature_Depense",
          "Code_NBE",
          "Montant",
          "Source_Financement",
          "Commentaire",
        ],
        // Exemples
        [
          "110110102022671700",
          "Intérêts emprunts - Prêt BHCI",
          "11",
          "01",
          "101",
          "02",
          "02",
          "2",
          "671700",
          106666667,
          "Budget État",
          "Remboursement prêt BHCI",
        ],
        [
          "110110102022604100",
          "Fournitures de bureau DAAF",
          "11",
          "01",
          "102",
          "02",
          "02",
          "2",
          "604100",
          50000000,
          "Budget État",
          "",
        ],
        [
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ],
      ];
      const wsBudget = XLSX.utils.aoa_to_sheet(budgetData);
      wsBudget["!cols"] = [
        { wch: 20 }, // Imputation
        { wch: 40 }, // Libellé
        { wch: 10 }, // Code_OS
        { wch: 12 }, // Code_Action
        { wch: 14 }, // Code_Activite
        { wch: 18 }, // Code_Sous_Activite
        { wch: 15 }, // Code_Direction
        { wch: 15 }, // Nature_Depense
        { wch: 12 }, // Code_NBE
        { wch: 15 }, // Montant
        { wch: 18 }, // Source_Financement
        { wch: 30 }, // Commentaire
      ];
      XLSX.utils.book_append_sheet(wb, wsBudget, "Lignes_Budget");

      // Générer le fichier
      const today = new Date().toISOString().split("T")[0];
      const fileName = `Template_Import_Budget_ARTI_${today}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Template téléchargé", {
        description: `Le fichier ${fileName} a été généré avec succès.`,
      });
    } catch (error) {
      console.error("Erreur génération template:", error);
      toast.error("Erreur lors de la génération du template");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={generateTemplate}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4" />
          Télécharger le template Excel
        </>
      )}
    </Button>
  );
}
