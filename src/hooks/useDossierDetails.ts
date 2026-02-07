import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DossierDetail {
  id: string;
  numero: string;
  reference_pivot: string | null;
  exercice: number;
  direction_id: string | null;
  objet: string;
  demandeur_id: string | null;
  beneficiaire_id: string | null;
  type_dossier: string | null;
  montant_estime: number | null;
  montant_engage: number | null;
  montant_liquide: number | null;
  montant_ordonnance: number | null;
  montant_paye: number | null;
  statut_global: string | null;
  statut_paiement: string | null;
  etape_courante: string | null;
  date_ouverture: string | null;
  date_cloture: string | null;
  date_blocage: string | null;
  motif_blocage: string | null;
  urgence: string | null;
  priorite: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  direction: { code: string; label: string; sigle: string | null } | null;
  demandeur: { full_name: string | null; email: string } | null;
  beneficiaire: { raison_sociale: string | null } | null;
  creator: { full_name: string | null } | null;
}

export interface DossierEtapeDetail {
  id: string;
  dossier_id: string;
  type_etape: string;
  entity_id: string | null;
  statut: string | null;
  montant: number | null;
  commentaire: string | null;
  created_by: string | null;
  created_at: string;
  creator: { full_name: string | null } | null;
}

const ETAPE_ORDER: Record<string, number> = {
  note_sef: 1,
  note: 1,
  note_aef: 2,
  imputation: 3,
  expression_besoin: 4,
  passation_marche: 5,
  engagement: 6,
  liquidation: 7,
  ordonnancement: 8,
  reglement: 9,
};

export const ETAPE_LABELS: Record<string, string> = {
  note_sef: 'Note SEF',
  note: 'Note SEF',
  note_aef: 'Note AEF',
  imputation: 'Imputation',
  expression_besoin: 'Expression de Besoin',
  passation_marche: 'Passation Marche',
  engagement: 'Engagement',
  liquidation: 'Liquidation',
  ordonnancement: 'Ordonnancement',
  reglement: 'Reglement',
};

export function getEtapeOrder(typeEtape: string): number {
  return ETAPE_ORDER[typeEtape] ?? 99;
}

async function fetchDossierById(id: string): Promise<DossierDetail | null> {
  const { data, error } = await supabase
    .from('dossiers')
    .select(
      `
      *,
      direction:directions(code, label, sigle),
      demandeur:profiles!dossiers_demandeur_id_fkey(full_name, email),
      beneficiaire:prestataires!dossiers_beneficiaire_id_fkey(raison_sociale),
      creator:profiles!dossiers_created_by_fkey(full_name)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

async function fetchDossierEtapes(dossierId: string): Promise<DossierEtapeDetail[]> {
  const { data, error } = await supabase
    .from('dossier_etapes')
    .select(
      `
      *,
      creator:profiles!dossier_etapes_created_by_fkey(full_name)
    `
    )
    .eq('dossier_id', dossierId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useDossierDetails(dossierId: string | undefined) {
  const dossierQuery = useQuery({
    queryKey: ['dossier', dossierId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    queryFn: () => fetchDossierById(dossierId!),
    enabled: !!dossierId,
  });

  const etapesQuery = useQuery({
    queryKey: ['dossier-etapes', dossierId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    queryFn: () => fetchDossierEtapes(dossierId!),
    enabled: !!dossierId,
  });

  return {
    dossier: dossierQuery.data ?? null,
    etapes: etapesQuery.data ?? [],
    isLoading: dossierQuery.isLoading || etapesQuery.isLoading,
    error: dossierQuery.error || etapesQuery.error,
  };
}
