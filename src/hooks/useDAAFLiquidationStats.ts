import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

export interface DAAFLiquidationStats {
  enAttente: number;
  montantEnAttente: number;
  urgents: number;
  montantUrgents: number;
  certifiesSF: number;
  valideesDG: number;

  parPrestataire: Array<{ fournisseur: string; count: number; montant: number }>;
  parDirection: Array<{ direction: string; sigle: string | null; count: number; montant: number }>;
}

export function useDAAFLiquidationStats() {
  const { exercice } = useExercice();

  return useQuery<DAAFLiquidationStats>({
    queryKey: ['daaf-liquidation-stats', exercice],
    queryFn: async () => {
      // 1. Liquidations avec statut + montant + urgence pour KPIs
      const { data: liqRows, error: liqErr } = await supabase
        .from('budget_liquidations')
        .select('id, statut, montant, reglement_urgent, engagement_id')
        .eq('exercice', exercice);

      if (liqErr) throw liqErr;
      const items = liqRows || [];

      const enAttenteItems = items.filter(
        (i) => i.statut === 'soumis' || i.statut === 'validé_daaf'
      );
      const urgentItems = enAttenteItems.filter((i) => i.reglement_urgent);

      const kpis = {
        enAttente: enAttenteItems.length,
        montantEnAttente: enAttenteItems.reduce((s, i) => s + (i.montant || 0), 0),
        urgents: urgentItems.length,
        montantUrgents: urgentItems.reduce((s, i) => s + (i.montant || 0), 0),
        certifiesSF: items.filter((i) => i.statut === 'certifié_sf').length,
        valideesDG: items.filter((i) => i.statut === 'validé_dg').length,
      };

      // 2. Ventilation par prestataire via engagement.fournisseur
      const engIds = [...new Set(items.map((i) => i.engagement_id).filter(Boolean))];
      let engMap = new Map<string, { fournisseur: string | null }>();

      if (engIds.length > 0) {
        const { data: engs } = await supabase
          .from('budget_engagements')
          .select('id, fournisseur')
          .in('id', engIds);

        if (engs) {
          engMap = new Map(engs.map((e) => [e.id, { fournisseur: e.fournisseur }]));
        }
      }

      const prestataireAgg = new Map<string, { count: number; montant: number }>();
      for (const liq of items) {
        const eng = engMap.get(liq.engagement_id);
        const fournisseur = eng?.fournisseur || 'Non renseigné';
        const cur = prestataireAgg.get(fournisseur) || { count: 0, montant: 0 };
        cur.count += 1;
        cur.montant += liq.montant || 0;
        prestataireAgg.set(fournisseur, cur);
      }

      const parPrestataire = [...prestataireAgg.entries()]
        .map(([fournisseur, v]) => ({ fournisseur, ...v }))
        .sort((a, b) => b.montant - a.montant)
        .slice(0, 10);

      // 3. Ventilation par direction via engagement → budget_line → direction
      const blDirMap = new Map<string, { direction: string; sigle: string | null }>();

      if (engIds.length > 0) {
        const { data: engBl } = await supabase
          .from('budget_engagements')
          .select('id, budget_line:budget_lines(direction:directions(label, sigle))')
          .in('id', engIds);

        if (engBl) {
          for (const e of engBl) {
            const bl = e.budget_line as {
              direction: { label: string; sigle: string | null } | null;
            } | null;
            const dir = bl?.direction;
            if (dir) {
              blDirMap.set(e.id, { direction: dir.label, sigle: dir.sigle });
            }
          }
        }
      }

      const directionAgg = new Map<
        string,
        { sigle: string | null; count: number; montant: number }
      >();
      for (const liq of items) {
        const dirInfo = blDirMap.get(liq.engagement_id);
        const dirLabel = dirInfo?.direction || 'Non rattachée';
        const cur = directionAgg.get(dirLabel) || {
          sigle: dirInfo?.sigle || null,
          count: 0,
          montant: 0,
        };
        cur.count += 1;
        cur.montant += liq.montant || 0;
        directionAgg.set(dirLabel, cur);
      }

      const parDirection = [...directionAgg.entries()]
        .map(([direction, v]) => ({ direction, ...v }))
        .sort((a, b) => b.montant - a.montant);

      return { ...kpis, parPrestataire, parDirection };
    },
    enabled: !!exercice,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
