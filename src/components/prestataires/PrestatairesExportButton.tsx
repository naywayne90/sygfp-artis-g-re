import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Prestataire } from "@/hooks/usePrestataires";

interface PrestatairesExportButtonProps {
  prestataires: Prestataire[];
  filters?: {
    search?: string;
    statut?: string;
  };
}

export function PrestatairesExportButton({ prestataires, filters }: PrestatairesExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Transform data for export
      const exportData = prestataires.map((p) => ({
        Code: p.code,
        "Raison sociale": p.raison_sociale,
        Sigle: p.sigle || "",
        NINEA: p.ninea || "",
        NIF: p.nif || "",
        IFU: p.ifu || "",
        RCCM: p.rccm || "",
        CC: p.cc || "",
        Adresse: p.adresse || "",
        Ville: p.ville || "",
        Téléphone: p.telephone || "",
        Email: p.email || "",
        "Contact Nom": p.contact_nom || "",
        "Contact Téléphone": p.contact_telephone || "",
        "Contact Email": p.contact_email || "",
        "Secteur d'activité": p.secteur_activite || "",
        "Type prestataire": p.type_prestataire || "",
        Statut: p.statut || "",
        "Date qualification": p.date_qualification
          ? new Date(p.date_qualification).toLocaleDateString("fr-FR")
          : "",
        "Créé le": new Date(p.created_at).toLocaleDateString("fr-FR"),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws["!cols"] = [
        { wch: 15 }, // Code
        { wch: 30 }, // Raison sociale
        { wch: 10 }, // Sigle
        { wch: 15 }, // NINEA
        { wch: 12 }, // NIF
        { wch: 12 }, // IFU
        { wch: 20 }, // RCCM
        { wch: 12 }, // CC
        { wch: 30 }, // Adresse
        { wch: 15 }, // Ville
        { wch: 18 }, // Téléphone
        { wch: 25 }, // Email
        { wch: 20 }, // Contact Nom
        { wch: 18 }, // Contact Téléphone
        { wch: 25 }, // Contact Email
        { wch: 20 }, // Secteur
        { wch: 15 }, // Type
        { wch: 12 }, // Statut
        { wch: 15 }, // Date qualification
        { wch: 12 }, // Créé le
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Prestataires");

      // Generate filename with date
      const date = new Date().toISOString().split("T")[0];
      const filename = `prestataires_export_${date}.xlsx`;

      XLSX.writeFile(wb, filename);

      // Audit log
      await supabase.from("audit_logs").insert({
        entity_type: "prestataires",
        action: "export",
        new_values: {
          count: prestataires.length,
          format: "xlsx",
          filters,
        },
      });

      toast.success(`${prestataires.length} prestataires exportés`);
    } catch (error) {
      console.error("Erreur export:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // BOM for UTF-8
      const BOM = "\uFEFF";
      const separator = ";";
      
      // Headers
      const headers = [
        "Code",
        "Raison sociale",
        "Sigle",
        "NINEA",
        "NIF",
        "IFU",
        "RCCM",
        "CC",
        "Adresse",
        "Ville",
        "Téléphone",
        "Email",
        "Contact Nom",
        "Contact Téléphone",
        "Contact Email",
        "Secteur d'activité",
        "Type prestataire",
        "Statut",
        "Date qualification",
        "Créé le",
      ];

      // Rows
      const rows = prestataires.map((p) => [
        p.code,
        p.raison_sociale,
        p.sigle || "",
        p.ninea || "",
        p.nif || "",
        p.ifu || "",
        p.rccm || "",
        p.cc || "",
        p.adresse || "",
        p.ville || "",
        p.telephone || "",
        p.email || "",
        p.contact_nom || "",
        p.contact_telephone || "",
        p.contact_email || "",
        p.secteur_activite || "",
        p.type_prestataire || "",
        p.statut || "",
        p.date_qualification
          ? new Date(p.date_qualification).toLocaleDateString("fr-FR")
          : "",
        new Date(p.created_at).toLocaleDateString("fr-FR"),
      ]);

      // Escape CSV values
      const escapeCSV = (value: string) => {
        if (value.includes(separator) || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = BOM + [
        headers.join(separator),
        ...rows.map((row) => row.map((cell) => escapeCSV(String(cell))).join(separator)),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prestataires_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Audit log
      await supabase.from("audit_logs").insert({
        entity_type: "prestataires",
        action: "export",
        new_values: {
          count: prestataires.length,
          format: "csv",
          filters,
        },
      });

      toast.success(`${prestataires.length} prestataires exportés (CSV)`);
    } catch (error) {
      console.error("Erreur export CSV:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
