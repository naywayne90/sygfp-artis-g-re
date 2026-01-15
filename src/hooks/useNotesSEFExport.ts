/**
 * Hook pour l'export Excel des Notes SEF
 * Gère les filtres, permissions et pagination pour export complet
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";
import { usePermissions } from "@/hooks/usePermissions";
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

interface NoteSEFExportRow {
  reference: string;
  statut: string;
  objet: string;
  direction: string;
  demandeur: string;
  urgence: string;
  date_souhaitee: string;
  justification: string;
  description: string;
  commentaire: string;
  beneficiaire_type: string;
  beneficiaire: string;
  motif_decision: string;
  created_at: string;
  created_by: string;
  submitted_at: string;
  decided_at: string;
  decided_by: string;
  nb_pieces_jointes: number;
  pieces_jointes: string;
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

export function useNotesSEFExport() {
  const { exercice } = useExercice();
  const { hasAnyRole } = usePermissions();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);

  const isDG = hasAnyRole(["ADMIN", "DG"]);

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
        // 1. Récupérer l'utilisateur et ses permissions
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

        // 2. Construire la requête avec les filtres
        let query = supabase
          .from("notes_sef")
          .select(`
            id,
            reference_pivot,
            numero,
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

        setExportProgress("Chargement des notes...");
        const { data: notes, error } = await query;

        if (error) throw error;
        if (!notes || notes.length === 0) {
          toast.info("Aucune note à exporter");
          return;
        }

        if (notes.length >= MAX_EXPORT_ROWS) {
          toast.warning(`Export limité à ${MAX_EXPORT_ROWS} lignes. Affinez vos filtres.`);
        }

        // 3. Récupérer le nombre de pièces jointes par note
        setExportProgress("Récupération des pièces jointes...");
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

        // 4. Transformer les données pour l'export
        setExportProgress("Préparation du fichier Excel...");
        const exportData = notes.map((note: any): Record<string, string | number> => {
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

        // 5. Créer le fichier Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Largeurs de colonnes
        worksheet["!cols"] = [
          { wch: 18 },  // Référence
          { wch: 12 },  // Statut
          { wch: 40 },  // Objet
          { wch: 20 },  // Direction
          { wch: 25 },  // Demandeur
          { wch: 10 },  // Urgence
          { wch: 12 },  // Date souhaitée
          { wch: 40 },  // Justification
          { wch: 40 },  // Description
          { wch: 30 },  // Commentaire
          { wch: 18 },  // Type bénéficiaire
          { wch: 25 },  // Bénéficiaire
          { wch: 40 },  // Motif décision
          { wch: 16 },  // Créée le
          { wch: 20 },  // Créée par
          { wch: 16 },  // Soumise le
          { wch: 16 },  // Décidée le
          { wch: 20 },  // Décidée par
          { wch: 6 },   // Nb PJ
          { wch: 50 },  // Pièces jointes
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Notes SEF");

        // 6. Télécharger le fichier
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = format(new Date(), "yyyyMMdd_HHmm");
        link.href = url;
        link.download = `notes_sef_${exercice}_${tabLabel}_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`${exportData.length} note(s) exportée(s)`);
      } catch (error: any) {
        console.error("Export error:", error);
        toast.error("Erreur lors de l'export: " + error.message);
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [exercice, isDG]
  );

  return {
    exportNotesSEF,
    isExporting,
    exportProgress,
  };
}
