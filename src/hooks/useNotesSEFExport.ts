// @ts-nocheck - Tables/columns not in generated types
/**
 * Hook pour l'export Excel/PDF des Notes SEF
 * Gère les filtres, permissions et pagination pour export complet
 * Format fichier: SYGFP_SEF_{exercice}_{statut}_{YYYYMMDD}.xlsx/.pdf
 * Stockage: sygfp/exports/{exercice}/notes_sef_...
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MAX_EXPORT_ROWS = 10000;

interface ExportFilters {
  statut?: string | string[];
  search?: string;
  directionId?: string;
}

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  a_valider: "À valider",
  valide: "Validé",
  rejete: "Rejeté",
  differe: "Différé",
};

const URGENCE_LABELS: Record<string, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
  urgente: "Urgente",
};

// Mapping des onglets vers labels de fichier
const TAB_FILE_LABELS: Record<string, string> = {
  toutes: "toutes",
  brouillons: "brouillons",
  a_valider: "a_valider",
  validees: "validees",
  differees: "differees",
  rejetees: "rejetees",
};

// Colonnes pour l'export
const EXPORT_COLUMNS = [
  { key: "Référence", width: 18 },
  { key: "Exercice", width: 10 },
  { key: "Statut", width: 12 },
  { key: "Objet", width: 40 },
  { key: "Direction", width: 20 },
  { key: "Demandeur", width: 25 },
  { key: "Urgence", width: 10 },
  { key: "Date souhaitée", width: 12 },
  { key: "Justification", width: 40 },
  { key: "Description", width: 40 },
  { key: "Commentaire", width: 30 },
  { key: "Type bénéficiaire", width: 18 },
  { key: "Bénéficiaire", width: 25 },
  { key: "Motif décision", width: 40 },
  { key: "Créée le", width: 16 },
  { key: "Créée par", width: 20 },
  { key: "Soumise le", width: 16 },
  { key: "Décidée le", width: 16 },
  { key: "Décidée par", width: 20 },
  { key: "Nb PJ", width: 6 },
  { key: "Pièces jointes", width: 50 },
];

export function useNotesSEFExport() {
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const { logAction } = useAuditLog();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  const isDG = hasAnyRole(["ADMIN", "DG"]);

  /**
   * Récupère les données des notes SEF selon les filtres
   */
  const fetchNotesData = useCallback(
    async (filters: ExportFilters = {}) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Récupérer la direction de l'utilisateur si pas DG
      let userDirectionId: string | null = null;
      if (!isDG) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("direction_id")
          .eq("id", user.id)
          .single();
        userDirectionId = profile?.direction_id || null;
      }

      // Construire la requête avec les filtres
      let query = supabase
        .from("notes_sef")
        .select(`
          id,
          reference_pivot,
          numero,
          exercice,
          statut,
          objet,
          description,
          justification,
          commentaire,
          urgence,
          date_souhaitee,
          beneficiaire_id,
          beneficiaire_interne_id,
          rejection_reason,
          differe_motif,
          differe_condition,
          differe_date_reprise,
          created_at,
          submitted_at,
          validated_at,
          rejected_at,
          differe_at,
          direction:directions(id, label, sigle),
          demandeur:profiles!demandeur_id(id, first_name, last_name),
          beneficiaire:prestataires!beneficiaire_id(id, raison_sociale),
          beneficiaire_interne:profiles!beneficiaire_interne_id(id, first_name, last_name),
          created_by_profile:profiles!created_by(id, first_name, last_name),
          validated_by_profile:profiles!validated_by(id, first_name, last_name),
          rejected_by_profile:profiles!rejected_by(id, first_name, last_name),
          differe_by_profile:profiles!differe_by(id, first_name, last_name)
        `)
        .eq("exercice", exercice)
        .order("created_at", { ascending: false })
        .limit(MAX_EXPORT_ROWS);

      // Filtre par statut
      if (filters.statut) {
        if (Array.isArray(filters.statut)) {
          query = query.in("statut", filters.statut);
        } else {
          query = query.eq("statut", filters.statut);
        }
      }

      // Filtre par direction (permissions)
      if (!isDG && userDirectionId) {
        query = query.eq("direction_id", userDirectionId);
      } else if (filters.directionId) {
        query = query.eq("direction_id", filters.directionId);
      }

      // Filtre par recherche
      if (filters.search?.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`reference_pivot.ilike.${searchTerm},objet.ilike.${searchTerm}`);
      }

      const { data: notes, error } = await query;
      if (error) throw error;

      return { notes: notes || [], user };
    },
    [exercice, isDG]
  );

  /**
   * Transforme les données des notes pour l'export
   */
  const transformNotesData = useCallback(
    async (notes: any[]) => {
      // Récupérer les pièces jointes
      const noteIds = notes.map((n) => n.id);
      const { data: attachmentCounts } = await supabase
        .from("notes_sef_pieces")
        .select("note_id, nom")
        .in("note_id", noteIds);

      // Grouper les pièces jointes par note
      const attachmentsByNote: Record<string, string[]> = {};
      (attachmentCounts || []).forEach((att: { note_id: string; nom: string }) => {
        if (!attachmentsByNote[att.note_id]) {
          attachmentsByNote[att.note_id] = [];
        }
        attachmentsByNote[att.note_id].push(att.nom);
      });

      // Transformer les données
      return notes.map((note: any): Record<string, string | number> => {
        // Déterminer le type de bénéficiaire
        let beneficiaireType = "Non renseigné";
        let beneficiaireName = "";
        if (note.beneficiaire?.raison_sociale) {
          beneficiaireType = "Prestataire externe";
          beneficiaireName = note.beneficiaire.raison_sociale;
        } else if (note.beneficiaire_interne) {
          beneficiaireType = "Agent interne";
          beneficiaireName = `${note.beneficiaire_interne.first_name || ""} ${note.beneficiaire_interne.last_name || ""}`.trim();
        }

        // Motif de décision (rejet ou report)
        let motifDecision = "";
        if (note.statut === "rejete" && note.rejection_reason) {
          motifDecision = note.rejection_reason;
        } else if (note.statut === "differe") {
          const parts: string[] = [];
          if (note.differe_motif) parts.push(note.differe_motif);
          if (note.differe_condition) parts.push(`Condition: ${note.differe_condition}`);
          if (note.differe_date_reprise) {
            parts.push(`Reprise: ${format(new Date(note.differe_date_reprise), "dd/MM/yyyy")}`);
          }
          motifDecision = parts.join(" | ");
        }

        // Décidé le / par
        let decidedAt = "";
        let decidedBy = "";
        if (note.statut === "valide") {
          decidedAt = note.validated_at ? format(new Date(note.validated_at), "dd/MM/yyyy HH:mm") : "";
          decidedBy = note.validated_by_profile
            ? `${note.validated_by_profile.first_name || ""} ${note.validated_by_profile.last_name || ""}`.trim()
            : "";
        } else if (note.statut === "rejete") {
          decidedAt = note.rejected_at ? format(new Date(note.rejected_at), "dd/MM/yyyy HH:mm") : "";
          decidedBy = note.rejected_by_profile
            ? `${note.rejected_by_profile.first_name || ""} ${note.rejected_by_profile.last_name || ""}`.trim()
            : "";
        } else if (note.statut === "differe") {
          decidedAt = note.differe_at ? format(new Date(note.differe_at), "dd/MM/yyyy HH:mm") : "";
          decidedBy = note.differe_by_profile
            ? `${note.differe_by_profile.first_name || ""} ${note.differe_by_profile.last_name || ""}`.trim()
            : "";
        }

        const pjs = attachmentsByNote[note.id] || [];

        return {
          "Référence": note.reference_pivot || note.numero || "",
          "Exercice": note.exercice || "",
          "Statut": STATUT_LABELS[note.statut] || note.statut || "",
          "Objet": note.objet || "",
          "Direction": note.direction?.label || note.direction?.sigle || "",
          "Demandeur": note.demandeur
            ? `${note.demandeur.first_name || ""} ${note.demandeur.last_name || ""}`.trim()
            : "",
          "Urgence": URGENCE_LABELS[note.urgence] || note.urgence || "",
          "Date souhaitée": note.date_souhaitee
            ? format(new Date(note.date_souhaitee), "dd/MM/yyyy")
            : "",
          "Justification": note.justification || "",
          "Description": note.description || "",
          "Commentaire": note.commentaire || "",
          "Type bénéficiaire": beneficiaireType,
          "Bénéficiaire": beneficiaireName,
          "Motif décision": motifDecision,
          "Créée le": note.created_at
            ? format(new Date(note.created_at), "dd/MM/yyyy HH:mm")
            : "",
          "Créée par": note.created_by_profile
            ? `${note.created_by_profile.first_name || ""} ${note.created_by_profile.last_name || ""}`.trim()
            : "",
          "Soumise le": note.submitted_at
            ? format(new Date(note.submitted_at), "dd/MM/yyyy HH:mm")
            : "",
          "Décidée le": decidedAt,
          "Décidée par": decidedBy,
          "Nb PJ": pjs.length,
          "Pièces jointes": pjs.join("; "),
        };
      });
    },
    []
  );

  /**
   * Stocke le fichier exporté dans Supabase Storage
   */
  const storeExportFile = useCallback(
    async (blob: Blob, fileName: string): Promise<string | null> => {
      try {
        const storagePath = `sygfp/exports/${exercice}/${fileName}`;

        // Upload vers Supabase Storage
        const { data, error } = await supabase.storage
          .from("lovable-uploads")
          .upload(storagePath, blob, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) {
          console.warn("Storage upload failed, continuing with direct download:", error);
          return null;
        }

        // Générer une URL signée (valide 1 heure)
        const { data: signedUrlData } = await supabase.storage
          .from("lovable-uploads")
          .createSignedUrl(storagePath, 3600);

        return signedUrlData?.signedUrl || null;
      } catch (err) {
        console.warn("Storage error:", err);
        return null;
      }
    },
    [exercice]
  );

  /**
   * Exporte les notes SEF en Excel selon les filtres actuels
   */
  const exportNotesSEF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = "toutes") => {
      if (!exercice) {
        toast.error("Exercice non sélectionné");
        return;
      }

      setIsExporting(true);
      setExportProgress("Récupération des données...");

      try {
        // 1. Récupérer les données
        const { notes, user } = await fetchNotesData(filters);

        // Générer le nom de fichier avec format standardisé
        const fileStatutLabel = TAB_FILE_LABELS[tabLabel] || "toutes";
        const dateStr = format(new Date(), "yyyyMMdd_HHmmss");
        const fileName = `SYGFP_SEF_${exercice}_${fileStatutLabel}_${dateStr}.xlsx`;

        // 2. Si aucune note, créer fichier avec en-têtes uniquement
        if (!notes || notes.length === 0) {
          const headers = EXPORT_COLUMNS.map(c => c.key);
          const worksheet = XLSX.utils.aoa_to_sheet([headers]);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Notes SEF");

          const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
          const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          // Téléchargement direct
          downloadBlob(blob, fileName);
          toast.info("Fichier exporté avec en-têtes uniquement (aucune note)");
          return;
        }

        if (notes.length >= MAX_EXPORT_ROWS) {
          toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`);
        }

        // 3. Transformer les données
        setExportProgress("Récupération des pièces jointes...");
        const exportData = await transformNotesData(notes);

        // 4. Créer le fichier Excel
        setExportProgress("Préparation du fichier Excel...");
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet["!cols"] = EXPORT_COLUMNS.map(c => ({ wch: c.width }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Notes SEF");

        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // 5. Stocker le fichier et obtenir l'URL signée
        setExportProgress("Stockage du fichier...");
        const signedUrl = await storeExportFile(blob, fileName);

        // 6. Log audit EXPORT_EXCEL
        await logAction({
          entityType: "notes_sef",
          action: "EXPORT_EXCEL",
          newValues: {
            exercice,
            tab: tabLabel,
            filters: filters,
            count: exportData.length,
            fileName,
            storedUrl: signedUrl || "direct_download",
          },
        });

        // 7. Télécharger le fichier
        if (signedUrl) {
          // Ouvrir l'URL signée dans un nouvel onglet
          window.open(signedUrl, "_blank");
        } else {
          // Fallback: téléchargement direct
          downloadBlob(blob, fileName);
        }

        toast.success(`${exportData.length} note(s) exportée(s) en Excel`);
      } catch (error: any) {
        console.error("Export error:", error);
        toast.error("Erreur lors de l'export: " + error.message);
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, fetchNotesData, transformNotesData, storeExportFile, logAction]
  );

  /**
   * Exporte les notes SEF en PDF selon les filtres actuels
   */
  const exportNotesSEFPDF = useCallback(
    async (filters: ExportFilters = {}, tabLabel: string = "toutes") => {
      if (!exercice) {
        toast.error("Exercice non sélectionné");
        return;
      }

      setIsExporting(true);
      setExportProgress("Récupération des données...");

      try {
        // 1. Récupérer les données
        const { notes } = await fetchNotesData(filters);

        if (!notes || notes.length === 0) {
          toast.info("Aucune note à exporter");
          return;
        }

        if (notes.length >= MAX_EXPORT_ROWS) {
          toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`);
        }

        // 2. Transformer les données
        setExportProgress("Préparation des données...");
        const exportData = await transformNotesData(notes);

        // 3. Générer le HTML pour impression PDF
        setExportProgress("Génération du PDF...");
        const fileStatutLabel = TAB_FILE_LABELS[tabLabel] || "toutes";
        const title = `Notes SEF - ${fileStatutLabel.charAt(0).toUpperCase() + fileStatutLabel.slice(1)} - Exercice ${exercice}`;
        const logoUrl = `${window.location.origin}/favicon.jpg`;

        // Colonnes à afficher dans le PDF (sous-ensemble pour la lisibilité)
        const pdfColumns = [
          { key: "Référence", label: "Référence" },
          { key: "Statut", label: "Statut" },
          { key: "Objet", label: "Objet" },
          { key: "Direction", label: "Direction" },
          { key: "Urgence", label: "Urgence" },
          { key: "Créée le", label: "Créée le" },
          { key: "Soumise le", label: "Soumise le" },
          { key: "Décidée le", label: "Décidée le" },
        ];

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${title}</title>
            <style>
              @page { margin: 1cm; size: A4 landscape; }
              body { font-family: Arial, sans-serif; font-size: 9px; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
              .header-left { display: flex; align-items: center; gap: 15px; }
              .logo { height: 50px; width: auto; }
              .header-info { text-align: right; font-size: 9px; color: #666; }
              h1 { text-align: center; font-size: 14px; margin: 10px 0; color: #1e40af; }
              .meta { text-align: center; font-size: 10px; color: #666; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #333; padding: 4px 6px; text-align: left; font-size: 8px; }
              th { background-color: #1e40af; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .statut-valide { background-color: #dcfce7; color: #166534; }
              .statut-rejete { background-color: #fee2e2; color: #991b1b; }
              .statut-differe { background-color: #ffedd5; color: #c2410c; }
              .statut-soumis { background-color: #dbeafe; color: #1e40af; }
              .urgence-urgente { background-color: #fee2e2; color: #991b1b; font-weight: bold; }
              .urgence-haute { background-color: #fef3c7; color: #92400e; }
              .footer { margin-top: 15px; font-size: 8px; color: #666; display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 10px; }
              .summary { margin-top: 10px; font-size: 9px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-left">
                <img src="${logoUrl}" alt="ARTI" class="logo" onerror="this.style.display='none'" />
                <div>
                  <strong>ARTI - Autorité de Régulation des Télécommunications</strong><br/>
                  <span style="font-size: 8px;">Système de Gestion des Finances Publiques</span>
                </div>
              </div>
              <div class="header-info">
                ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}
              </div>
            </div>
            <h1>${title}</h1>
            <p class="meta">
              Généré le ${format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr })} |
              ${exportData.length} note(s)
            </p>
            <table>
              <thead>
                <tr>
                  ${pdfColumns.map((c) => `<th>${c.label}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${exportData
                  .map((row) => {
                    const statutClass =
                      row["Statut"] === "Validé" ? "statut-valide" :
                      row["Statut"] === "Rejeté" ? "statut-rejete" :
                      row["Statut"] === "Différé" ? "statut-differe" :
                      row["Statut"] === "Soumis" ? "statut-soumis" : "";
                    const urgenceClass =
                      row["Urgence"] === "Urgente" ? "urgence-urgente" :
                      row["Urgence"] === "Haute" ? "urgence-haute" : "";

                    return `
                      <tr>
                        ${pdfColumns.map((col) => {
                          let cellClass = "";
                          if (col.key === "Statut") cellClass = statutClass;
                          if (col.key === "Urgence") cellClass = urgenceClass;
                          const value = row[col.key] || "-";
                          // Tronquer les valeurs longues
                          const displayValue = typeof value === "string" && value.length > 50
                            ? value.substring(0, 47) + "..."
                            : value;
                          return `<td class="${cellClass}">${displayValue}</td>`;
                        }).join("")}
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
            <div class="footer">
              <span>SYGFP - Document généré automatiquement - Ne pas modifier</span>
              <span>Exercice ${exercice}</span>
            </div>
          </body>
          </html>
        `;

        // 4. Log audit EXPORT_PDF
        await logAction({
          entityType: "notes_sef",
          action: "EXPORT_PDF",
          newValues: {
            exercice,
            tab: tabLabel,
            filters: filters,
            count: exportData.length,
          },
        });

        // 5. Ouvrir la fenêtre d'impression
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          // Attendre le chargement avant d'imprimer
          printWindow.onload = () => {
            printWindow.print();
          };
        } else {
          toast.error("Impossible d'ouvrir la fenêtre d'impression. Vérifiez les popups.");
        }

        toast.success(`${exportData.length} note(s) - Impression PDF lancée`);
      } catch (error: any) {
        console.error("Export PDF error:", error);
        toast.error("Erreur lors de l'export PDF: " + error.message);
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, fetchNotesData, transformNotesData, logAction]
  );

  return {
    exportNotesSEF,
    exportNotesSEFPDF,
    isExporting,
    exportProgress,
  };
}

/**
 * Télécharge un blob en tant que fichier
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
