import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExercice } from "@/contexts/ExerciceContext";

export interface DashboardAlert {
  id: string;
  type: "depassement" | "retard" | "echeance" | "piece_manquante" | "seuil" | "prestataire_doc_expire";
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  createdAt: Date;
}

export function useDashboardAlerts() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ["dashboard-alerts", exercice],
    queryFn: async (): Promise<DashboardAlert[]> => {
      const alerts: DashboardAlert[] = [];
      const now = new Date();

      // 1. Dépassements budgétaires (lignes où engagé > dotation)
      const { data: budgetLines } = await supabase
        .from("budget_lines")
        .select(`
          id, code, label, dotation_initiale,
          budget_engagements(montant)
        `)
        .eq("exercice", exercice);

      budgetLines?.forEach(bl => {
        const totalEngage = bl.budget_engagements?.reduce((sum: number, e: any) => sum + (e.montant || 0), 0) || 0;
        const disponible = bl.dotation_initiale - totalEngage;
        
        if (disponible < 0) {
          alerts.push({
            id: `depassement-${bl.id}`,
            type: "depassement",
            severity: "critical",
            title: `Dépassement budgétaire: ${bl.code}`,
            description: `La ligne ${bl.label} dépasse de ${Math.abs(disponible).toLocaleString()} FCFA`,
            entityType: "budget_line",
            entityId: bl.id,
            link: `/budget?line=${bl.id}`,
            createdAt: now,
          });
        } else if (disponible < bl.dotation_initiale * 0.1 && bl.dotation_initiale > 0) {
          alerts.push({
            id: `seuil-${bl.id}`,
            type: "seuil",
            severity: "warning",
            title: `Seuil critique: ${bl.code}`,
            description: `Moins de 10% de disponibilité sur ${bl.label}`,
            entityType: "budget_line",
            entityId: bl.id,
            link: `/budget?line=${bl.id}`,
            createdAt: now,
          });
        }
      });

      // 2. Dossiers différés arrivés à échéance
      const { data: notesDifferees } = await supabase
        .from("notes_dg")
        .select("id, numero, objet, deadline_correction")
        .eq("exercice", exercice)
        .eq("statut", "differe")
        .not("deadline_correction", "is", null);

      notesDifferees?.forEach(note => {
        const deadline = new Date(note.deadline_correction!);
        if (deadline <= now) {
          alerts.push({
            id: `echeance-note-${note.id}`,
            type: "echeance",
            severity: "critical",
            title: `Échéance dépassée: ${note.numero || 'Note'}`,
            description: `La note "${note.objet}" devait être corrigée avant le ${deadline.toLocaleDateString()}`,
            entityType: "note",
            entityId: note.id,
            link: `/notes-aef?id=${note.id}`,
            createdAt: deadline,
          });
        } else if (deadline <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)) {
          alerts.push({
            id: `echeance-note-${note.id}`,
            type: "echeance",
            severity: "warning",
            title: `Échéance proche: ${note.numero || 'Note'}`,
            description: `Correction attendue avant le ${deadline.toLocaleDateString()}`,
            entityType: "note",
            entityId: note.id,
            link: `/notes-aef?id=${note.id}`,
            createdAt: deadline,
          });
        }
      });

      // 3. Engagements différés arrivés à échéance
      const { data: engagementsDifferes } = await supabase
        .from("budget_engagements")
        .select("id, numero, objet, deadline_correction")
        .eq("exercice", exercice)
        .eq("statut", "differe")
        .not("deadline_correction", "is", null);

      engagementsDifferes?.forEach(eng => {
        const deadline = new Date(eng.deadline_correction!);
        if (deadline <= now) {
          alerts.push({
            id: `echeance-eng-${eng.id}`,
            type: "echeance",
            severity: "critical",
            title: `Échéance dépassée: ${eng.numero}`,
            description: `L'engagement "${eng.objet}" devait être corrigé`,
            entityType: "engagement",
            entityId: eng.id,
            link: `/engagements?id=${eng.id}`,
            createdAt: deadline,
          });
        }
      });

      // 4. Liquidations sans pièces jointes (potentiel)
      const { data: liquidationsSansPieces } = await supabase
        .from("budget_liquidations")
        .select(`
          id, numero,
          liquidation_attachments(id)
        `)
        .eq("exercice", exercice)
        .in("statut", ["soumis", "en_validation"]);

      liquidationsSansPieces?.forEach(liq => {
        if (!liq.liquidation_attachments || liq.liquidation_attachments.length === 0) {
          alerts.push({
            id: `piece-liq-${liq.id}`,
            type: "piece_manquante",
            severity: "warning",
            title: `Pièces manquantes: ${liq.numero}`,
            description: `Aucune pièce justificative jointe à la liquidation`,
            entityType: "liquidation",
            entityId: liq.id,
            link: `/liquidations?id=${liq.id}`,
            createdAt: now,
          });
        }
      });

      // 5. Ordonnancements validés depuis plus de 5 jours sans paiement
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const { data: ordoEnAttentePaiement } = await supabase
        .from("ordonnancements")
        .select("id, numero, validated_at, montant")
        .eq("exercice", exercice)
        .eq("statut", "valide")
        .lt("validated_at", fiveDaysAgo.toISOString());

      ordoEnAttentePaiement?.forEach(ordo => {
        alerts.push({
          id: `retard-ordo-${ordo.id}`,
          type: "retard",
          severity: "warning",
          title: `Paiement en attente: ${ordo.numero}`,
          description: `Ordonnancement validé depuis plus de 5 jours (${(ordo.montant || 0).toLocaleString()} FCFA)`,
          entityType: "ordonnancement",
          entityId: ordo.id,
          link: `/ordonnancements?id=${ordo.id}`,
          createdAt: new Date(ordo.validated_at!),
        });
      });

      // Trier par sévérité puis date
      return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    },
    enabled: !!exercice,
    refetchInterval: 5 * 60 * 1000, // Rafraîchir toutes les 5 minutes
  });
}
