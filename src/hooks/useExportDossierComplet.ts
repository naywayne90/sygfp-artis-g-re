import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DossierCompletData {
  dossier: any;
  engagement: any;
  liquidation: any;
  ordonnancement: any;
  reglements: any[];
  timeline: any[];
  documents: any[];
}

export function useExportDossierComplet() {
  const [isExporting, setIsExporting] = useState(false);

  const formatMontant = (montant: number) =>
    new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
  };

  // Récupérer toutes les données du dossier
  const fetchDossierComplet = useCallback(async (dossierId: string): Promise<DossierCompletData | null> => {
    // Dossier principal
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select(`
        *,
        direction:directions(code, sigle, label),
        service:services(code, label),
        created_by_profile:profiles!dossiers_created_by_fkey(full_name)
      `)
      .eq("id", dossierId)
      .single();

    if (dossierError) {
      console.error("Error fetching dossier:", dossierError);
      return null;
    }

    // Engagement
    const { data: engagements } = await supabase
      .from("budget_engagements")
      .select(`
        *,
        budget_line:budget_lines(code, label, dotation_initiale),
        created_by_profile:profiles!budget_engagements_created_by_fkey(full_name)
      `)
      .eq("dossier_id", dossierId)
      .order("created_at", { ascending: false })
      .limit(1);

    const engagement = engagements?.[0] || null;

    // Liquidation
    let liquidation = null;
    if (engagement) {
      const { data: liquidations } = await supabase
        .from("budget_liquidations")
        .select(`
          *,
          created_by_profile:profiles!budget_liquidations_created_by_fkey(full_name),
          validated_by_profile:profiles!budget_liquidations_validated_by_fkey(full_name)
        `)
        .eq("engagement_id", engagement.id)
        .order("created_at", { ascending: false })
        .limit(1);
      liquidation = liquidations?.[0] || null;
    }

    // Ordonnancement
    let ordonnancement = null;
    if (liquidation) {
      const { data: ordonnancements } = await supabase
        .from("ordonnancements")
        .select(`
          *,
          created_by_profile:profiles!ordonnancements_created_by_fkey(full_name)
        `)
        .eq("liquidation_id", liquidation.id)
        .order("created_at", { ascending: false })
        .limit(1);
      ordonnancement = ordonnancements?.[0] || null;
    }

    // Règlements
    let reglements: any[] = [];
    if (ordonnancement) {
      const { data } = await supabase
        .from("reglements")
        .select(`
          *,
          created_by_profile:profiles!reglements_created_by_fkey(full_name)
        `)
        .eq("ordonnancement_id", ordonnancement.id)
        .order("date_paiement", { ascending: true });
      reglements = data || [];
    }

    // Timeline / Historique
    const { data: timeline } = await supabase
      .from("dossier_etapes")
      .select(`
        *,
        processed_by_profile:profiles!dossier_etapes_processed_by_fkey(full_name)
      `)
      .eq("dossier_id", dossierId)
      .order("date_etape", { ascending: true });

    // Documents - utiliser archived_documents qui existe
    const { data: documents } = await supabase
      .from("archived_documents")
      .select("*")
      .eq("entity_id", dossierId);

    return {
      dossier,
      engagement,
      liquidation,
      ordonnancement,
      reglements,
      timeline: timeline || [],
      documents: documents || [],
    };
  }, []);

  // Générer le récapitulatif HTML pour impression PDF
  const generateRecapitulatifHTML = useCallback((data: DossierCompletData): string => {
    const { dossier, engagement, liquidation, ordonnancement, reglements, timeline } = data;

    const totalPaye = reglements.reduce((sum, r) => sum + (r.montant || 0), 0);
    const montantOrdonnance = ordonnancement?.montant || 0;
    const restant = montantOrdonnance - totalPaye;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Dossier ${dossier.numero} - Récapitulatif</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1a365d; padding-bottom: 15px; }
    .header h1 { color: #1a365d; font-size: 18px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 11px; }
    .section { margin-bottom: 20px; break-inside: avoid; }
    .section-title { background: #1a365d; color: white; padding: 8px 12px; font-weight: bold; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { padding: 8px; background: #f8fafc; border-left: 3px solid #3182ce; }
    .info-item .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .info-item .value { font-weight: bold; color: #1a365d; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .table th { background: #e2e8f0; font-weight: bold; }
    .table tr:nth-child(even) { background: #f8fafc; }
    .amount { font-weight: bold; color: #2f855a; }
    .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
    .status-success { background: #c6f6d5; color: #276749; }
    .status-warning { background: #fefcbf; color: #975a16; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print { body { padding: 10px; } .section { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>RÉCAPITULATIF DOSSIER DE DÉPENSE</h1>
    <p>ARTI - Agence de Régulation des Télécommunications / TIC</p>
    <p>Document généré le ${formatDate(new Date().toISOString())}</p>
  </div>

  <div class="section">
    <div class="section-title">INFORMATIONS GÉNÉRALES</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">N° Dossier</div>
        <div class="value">${dossier.numero || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Exercice</div>
        <div class="value">${dossier.exercice}</div>
      </div>
      <div class="info-item">
        <div class="label">Direction</div>
        <div class="value">${dossier.direction?.sigle || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Statut</div>
        <div class="value"><span class="status ${restant <= 0 ? "status-success" : "status-warning"}">${restant <= 0 ? "SOLDÉ" : "EN COURS"}</span></div>
      </div>
      <div class="info-item" style="grid-column: 1 / -1;">
        <div class="label">Objet</div>
        <div class="value">${dossier.objet || "-"}</div>
      </div>
    </div>
  </div>

  ${engagement ? `
  <div class="section">
    <div class="section-title">ENGAGEMENT</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">N° Engagement</div>
        <div class="value">${engagement.numero}</div>
      </div>
      <div class="info-item">
        <div class="label">Date</div>
        <div class="value">${formatDate(engagement.date_engagement)}</div>
      </div>
      <div class="info-item">
        <div class="label">Montant engagé</div>
        <div class="value amount">${formatMontant(engagement.montant)}</div>
      </div>
      <div class="info-item">
        <div class="label">Fournisseur</div>
        <div class="value">${engagement.fournisseur || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Ligne budgétaire</div>
        <div class="value">${engagement.budget_line?.code || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Statut</div>
        <div class="value">${engagement.statut}</div>
      </div>
    </div>
  </div>
  ` : ""}

  ${liquidation ? `
  <div class="section">
    <div class="section-title">LIQUIDATION</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">N° Liquidation</div>
        <div class="value">${liquidation.numero}</div>
      </div>
      <div class="info-item">
        <div class="label">Date</div>
        <div class="value">${formatDate(liquidation.date_liquidation)}</div>
      </div>
      <div class="info-item">
        <div class="label">Montant liquidé</div>
        <div class="value amount">${formatMontant(liquidation.montant)}</div>
      </div>
      <div class="info-item">
        <div class="label">Service fait</div>
        <div class="value">${liquidation.service_fait ? "✓ Certifié" : "En attente"}</div>
      </div>
      <div class="info-item">
        <div class="label">Référence facture</div>
        <div class="value">${liquidation.reference_facture || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Statut</div>
        <div class="value">${liquidation.statut}</div>
      </div>
    </div>
  </div>
  ` : ""}

  ${ordonnancement ? `
  <div class="section">
    <div class="section-title">ORDONNANCEMENT</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">N° Ordonnancement</div>
        <div class="value">${ordonnancement.numero}</div>
      </div>
      <div class="info-item">
        <div class="label">Date création</div>
        <div class="value">${formatDate(ordonnancement.created_at)}</div>
      </div>
      <div class="info-item">
        <div class="label">Montant ordonnancé</div>
        <div class="value amount">${formatMontant(ordonnancement.montant)}</div>
      </div>
      <div class="info-item">
        <div class="label">Bénéficiaire</div>
        <div class="value">${ordonnancement.beneficiaire || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Mode paiement</div>
        <div class="value">${ordonnancement.mode_paiement || "-"}</div>
      </div>
      <div class="info-item">
        <div class="label">Statut</div>
        <div class="value">${ordonnancement.statut}</div>
      </div>
    </div>
  </div>
  ` : ""}

  ${reglements.length > 0 ? `
  <div class="section">
    <div class="section-title">RÈGLEMENTS (${reglements.length})</div>
    <table class="table">
      <thead>
        <tr>
          <th>N° Règlement</th>
          <th>Date paiement</th>
          <th>Mode</th>
          <th>Référence</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        ${reglements.map(r => `
        <tr>
          <td>${r.numero}</td>
          <td>${formatDate(r.date_paiement)}</td>
          <td>${r.mode_paiement}</td>
          <td>${r.reference_paiement || "-"}</td>
          <td class="amount">${formatMontant(r.montant)}</td>
        </tr>
        `).join("")}
        <tr style="font-weight: bold; background: #e2e8f0;">
          <td colspan="4">TOTAL PAYÉ</td>
          <td class="amount">${formatMontant(totalPaye)}</td>
        </tr>
        <tr>
          <td colspan="4">Restant à payer</td>
          <td>${formatMontant(restant)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  ` : ""}

  ${timeline.length > 0 ? `
  <div class="section">
    <div class="section-title">HISTORIQUE DU DOSSIER</div>
    <table class="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Étape</th>
          <th>Action</th>
          <th>Par</th>
          <th>Commentaire</th>
        </tr>
      </thead>
      <tbody>
        ${timeline.map(t => `
        <tr>
          <td>${formatDate(t.date_etape)}</td>
          <td>${t.etape_code || "-"}</td>
          <td>${t.action || "-"}</td>
          <td>${t.processed_by_profile?.full_name || "-"}</td>
          <td>${t.commentaire || "-"}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <div class="footer">
    <p>Document officiel généré par SYGFP - Système de Gestion Financière et Programmatique</p>
    <p>Ce document est un récapitulatif de la chaîne de dépense pour le dossier ${dossier.numero}</p>
  </div>
</body>
</html>
    `;
  }, [formatMontant, formatDate]);

  // Générer Excel récapitulatif
  const generateExcel = useCallback((data: DossierCompletData): Blob => {
    const { dossier, engagement, liquidation, ordonnancement, reglements, timeline } = data;

    const workbook = XLSX.utils.book_new();

    // Feuille Récapitulatif
    const recapData = [
      ["RÉCAPITULATIF DOSSIER DE DÉPENSE"],
      [""],
      ["N° Dossier", dossier.numero],
      ["Exercice", dossier.exercice],
      ["Direction", dossier.direction?.sigle || "-"],
      ["Objet", dossier.objet],
      ["Montant", dossier.montant],
      ["Statut", dossier.statut_global],
      [""],
      ["ENGAGEMENT"],
      ["N° Engagement", engagement?.numero || "-"],
      ["Date", engagement?.date_engagement || "-"],
      ["Montant engagé", engagement?.montant || 0],
      ["Fournisseur", engagement?.fournisseur || "-"],
      [""],
      ["LIQUIDATION"],
      ["N° Liquidation", liquidation?.numero || "-"],
      ["Date", liquidation?.date_liquidation || "-"],
      ["Montant liquidé", liquidation?.montant || 0],
      ["Service fait", liquidation?.service_fait ? "Oui" : "Non"],
      [""],
      ["ORDONNANCEMENT"],
      ["N° Ordonnancement", ordonnancement?.numero || "-"],
      ["Montant ordonnancé", ordonnancement?.montant || 0],
      ["Bénéficiaire", ordonnancement?.beneficiaire || "-"],
      [""],
      ["RÈGLEMENTS"],
      ["Total payé", reglements.reduce((sum, r) => sum + (r.montant || 0), 0)],
      ["Nombre de règlements", reglements.length],
    ];
    const recapSheet = XLSX.utils.aoa_to_sheet(recapData);
    XLSX.utils.book_append_sheet(workbook, recapSheet, "Récapitulatif");

    // Feuille Règlements
    if (reglements.length > 0) {
      const reglementsData = reglements.map((r) => ({
        "N° Règlement": r.numero,
        "Date paiement": r.date_paiement,
        "Mode": r.mode_paiement,
        "Référence": r.reference_paiement || "",
        "Banque": r.banque_arti || "",
        "Montant": r.montant,
        "Observation": r.observation || "",
      }));
      const regSheet = XLSX.utils.json_to_sheet(reglementsData);
      XLSX.utils.book_append_sheet(workbook, regSheet, "Règlements");
    }

    // Feuille Historique
    if (timeline.length > 0) {
      const timelineData = timeline.map((t) => ({
        "Date": t.date_etape,
        "Étape": t.etape_code || "",
        "Action": t.action || "",
        "Par": t.processed_by_profile?.full_name || "",
        "Commentaire": t.commentaire || "",
      }));
      const timeSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timeSheet, "Historique");
    }

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }, []);

  // Export principal du dossier complet
  const exportDossierComplet = useCallback(async (dossierId: string, format: "pdf" | "excel" | "zip" = "pdf") => {
    setIsExporting(true);
    try {
      const data = await fetchDossierComplet(dossierId);
      if (!data) {
        throw new Error("Impossible de récupérer les données du dossier");
      }

      const timestamp = Date.now();
      const baseFilename = `dossier_${data.dossier.numero || dossierId.slice(0, 8)}_${timestamp}`;

      if (format === "pdf") {
        const html = generateRecapitulatifHTML(data);
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      } else if (format === "excel") {
        const blob = generateExcel(data);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseFilename}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success(`Export ${format.toUpperCase()} généré avec succès`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.message || "Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  }, [fetchDossierComplet, generateRecapitulatifHTML, generateExcel]);

  return {
    isExporting,
    exportDossierComplet,
    fetchDossierComplet,
  };
}
