import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

// ============================================================================
// TYPES
// ============================================================================

interface MarcheRow {
  id: string;
  numero: string | null;
  objet: string;
  montant: number;
  mode_passation: string;
  type_marche: string | null;
  statut: string | null;
  validation_status: string | null;
  date_signature: string | null;
  date_attribution: string | null;
  prestataire_id: string | null;
  exercice: number | null;
  created_at: string;
  prestataire?: { raison_sociale: string } | null;
}

interface ContratRow {
  id: string;
  numero: string;
  marche_id: string | null;
  prestataire_id: string;
  type_contrat: string;
  objet: string;
  montant_initial: number;
  montant_actuel: number | null;
  date_signature: string | null;
  date_debut: string | null;
  date_fin: string | null;
  statut: string;
  exercice: number;
  created_at: string;
  prestataire?: { raison_sociale: string } | null;
}

interface EngagementRow {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  marche_id: string | null;
  passation_marche_id: string | null;
  type_engagement: string | null;
  statut: string | null;
  fournisseur: string | null;
}

export type StatutRapprochement =
  | 'rapproche'
  | 'marche_sans_contrat'
  | 'contrat_sans_marche'
  | 'ecart';

export interface LigneRapprochement {
  id: string;
  statut: StatutRapprochement;
  // Marché
  marche: MarcheRow | null;
  marcheRef: string;
  marcheObjet: string;
  marcheMontant: number;
  marchePrestataire: string;
  marcheStatut: string | null;
  // Contrat
  contrat: ContratRow | null;
  contratRef: string;
  contratObjet: string;
  contratMontant: number;
  contratPrestataire: string;
  contratStatut: string;
  // Écart
  ecartMontant: number;
  ecartPourcent: number;
  // Engagements liés
  engagements: EngagementRow[];
  totalEngage: number;
}

export interface RapprochementKpis {
  totalMarches: number;
  totalContrats: number;
  rapproches: number;
  marchesSansContrat: number;
  contratsSansMarche: number;
  ecarts: number;
  montantTotalMarches: number;
  montantTotalContrats: number;
  ecartGlobal: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useRapprochementMarcheContrat() {
  const { exercice } = useExercice();

  const query = useQuery({
    queryKey: ['rapprochement-marche-contrat', exercice],
    queryFn: async (): Promise<{ lignes: LigneRapprochement[]; kpis: RapprochementKpis }> => {
      if (!exercice) return { lignes: [], kpis: emptyKpis() };

      // Fetch marchés, contrats, engagements en parallèle
      const [marchesRes, contratsRes, engagementsRes] = await Promise.all([
        supabase
          .from('marches')
          .select(
            'id, numero, objet, montant, mode_passation, type_marche, statut, validation_status, date_signature, date_attribution, prestataire_id, exercice, created_at, prestataire:prestataires(raison_sociale)'
          )
          .eq('exercice', exercice)
          .order('created_at', { ascending: false }),
        supabase
          .from('contrats' as any)
          .select(
            'id, numero, marche_id, prestataire_id, type_contrat, objet, montant_initial, montant_actuel, date_signature, date_debut, date_fin, statut, exercice, created_at, prestataire:prestataires(raison_sociale)'
          )
          .eq('exercice', exercice)
          .order('created_at', { ascending: false }),
        supabase
          .from('budget_engagements')
          .select(
            'id, numero, objet, montant, marche_id, passation_marche_id, type_engagement, statut, fournisseur'
          )
          .eq('exercice', exercice)
          .not('marche_id', 'is', null),
      ]);

      if (marchesRes.error) throw marchesRes.error;
      if (contratsRes.error) throw contratsRes.error;
      if (engagementsRes.error) throw engagementsRes.error;

      const marches = (marchesRes.data || []) as unknown as MarcheRow[];
      const contrats = (contratsRes.data || []) as unknown as ContratRow[];
      const engagements = (engagementsRes.data || []) as unknown as EngagementRow[];

      // Index contrats par marche_id
      const contratsByMarcheId = new Map<string, ContratRow[]>();
      const contratsWithMarche = new Set<string>();

      for (const c of contrats) {
        if (c.marche_id) {
          const existing = contratsByMarcheId.get(c.marche_id) || [];
          existing.push(c);
          contratsByMarcheId.set(c.marche_id, existing);
          contratsWithMarche.add(c.id);
        }
      }

      // Index engagements par marche_id
      const engagementsByMarcheId = new Map<string, EngagementRow[]>();
      for (const e of engagements) {
        if (e.marche_id) {
          const existing = engagementsByMarcheId.get(e.marche_id) || [];
          existing.push(e);
          engagementsByMarcheId.set(e.marche_id, existing);
        }
      }

      const lignes: LigneRapprochement[] = [];
      let rapproches = 0;
      let marchesSansContrat = 0;
      let ecarts = 0;

      // 1) Marchés → chercher le contrat associé
      for (const m of marches) {
        const linkedContrats = contratsByMarcheId.get(m.id) || [];
        const linkedEngagements = engagementsByMarcheId.get(m.id) || [];
        const totalEngage = linkedEngagements.reduce((s, e) => s + (e.montant || 0), 0);

        if (linkedContrats.length > 0) {
          // Rapproché — prendre le contrat principal (le plus récent)
          const c = linkedContrats[0];
          const montantContrat = c.montant_actuel ?? c.montant_initial;
          const ecartMontant = montantContrat - m.montant;
          const ecartPourcent =
            m.montant > 0 ? Math.round((ecartMontant / m.montant) * 1000) / 10 : 0;
          const hasEcart = Math.abs(ecartPourcent) > 5; // seuil 5%

          if (hasEcart) ecarts++;
          else rapproches++;

          lignes.push({
            id: `m-${m.id}`,
            statut: hasEcart ? 'ecart' : 'rapproche',
            marche: m,
            marcheRef: m.numero || '-',
            marcheObjet: m.objet,
            marcheMontant: m.montant,
            marchePrestataire: m.prestataire?.raison_sociale || '-',
            marcheStatut: m.validation_status || m.statut,
            contrat: c,
            contratRef: c.numero,
            contratObjet: c.objet,
            contratMontant: montantContrat,
            contratPrestataire: c.prestataire?.raison_sociale || '-',
            contratStatut: c.statut,
            ecartMontant,
            ecartPourcent,
            engagements: linkedEngagements,
            totalEngage,
          });
        } else {
          // Marché sans contrat
          marchesSansContrat++;
          lignes.push({
            id: `m-${m.id}`,
            statut: 'marche_sans_contrat',
            marche: m,
            marcheRef: m.numero || '-',
            marcheObjet: m.objet,
            marcheMontant: m.montant,
            marchePrestataire: m.prestataire?.raison_sociale || '-',
            marcheStatut: m.validation_status || m.statut,
            contrat: null,
            contratRef: '-',
            contratObjet: '-',
            contratMontant: 0,
            contratPrestataire: '-',
            contratStatut: '-',
            ecartMontant: -m.montant,
            ecartPourcent: -100,
            engagements: linkedEngagements,
            totalEngage,
          });
        }
      }

      // 2) Contrats sans marché
      const contratsSansMarche: ContratRow[] = contrats.filter(
        (c) => !contratsWithMarche.has(c.id)
      );

      for (const c of contratsSansMarche) {
        const montantContrat = c.montant_actuel ?? c.montant_initial;
        lignes.push({
          id: `c-${c.id}`,
          statut: 'contrat_sans_marche',
          marche: null,
          marcheRef: '-',
          marcheObjet: '-',
          marcheMontant: 0,
          marchePrestataire: '-',
          marcheStatut: null,
          contrat: c,
          contratRef: c.numero,
          contratObjet: c.objet,
          contratMontant: montantContrat,
          contratPrestataire: c.prestataire?.raison_sociale || '-',
          contratStatut: c.statut,
          ecartMontant: montantContrat,
          ecartPourcent: 100,
          engagements: [],
          totalEngage: 0,
        });
      }

      const montantTotalMarches = marches.reduce((s, m) => s + (m.montant || 0), 0);
      const montantTotalContrats = contrats.reduce(
        (s, c) => s + (c.montant_actuel ?? c.montant_initial ?? 0),
        0
      );

      return {
        lignes,
        kpis: {
          totalMarches: marches.length,
          totalContrats: contrats.length,
          rapproches,
          marchesSansContrat,
          contratsSansMarche: contratsSansMarche.length,
          ecarts,
          montantTotalMarches,
          montantTotalContrats,
          ecartGlobal: montantTotalContrats - montantTotalMarches,
        },
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
  });

  return {
    lignes: query.data?.lignes ?? [],
    kpis: query.data?.kpis ?? emptyKpis(),
    isLoading: query.isLoading,
    error: query.error,
  };
}

function emptyKpis(): RapprochementKpis {
  return {
    totalMarches: 0,
    totalContrats: 0,
    rapproches: 0,
    marchesSansContrat: 0,
    contratsSansMarche: 0,
    ecarts: 0,
    montantTotalMarches: 0,
    montantTotalContrats: 0,
    ecartGlobal: 0,
  };
}
