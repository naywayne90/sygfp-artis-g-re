/**
 * P0.3 — Visa numérique du Trésorier sur un règlement
 *
 * Conformité RGCP/OHADA : avant de constater le décaissement effectif, le
 * Trésorier (comptable public) doit apposer un visa nominatif et horodaté
 * sur le règlement. Le visa embarque un hash SHA-256 du payload canonique
 * (id, montant, beneficiaire, date_paiement, mode_paiement, reference) qui
 * sert de preuve d'intégrité non-répudiable pendant l'audit.
 *
 * Côté DB : RPC `viser_reglement(p_reglement_id, p_payload_hash, p_ip)` —
 * SECURITY DEFINER, vérifie le rôle TRESORERIE/ADMIN avant d'écrire.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ReglementWithRelations } from './useReglements';

/**
 * Calcule le hash SHA-256 hex d'un payload canonique de règlement.
 * Le payload doit être STRICTEMENT le même au moment du visa et au moment
 * de la vérification d'intégrité (donc tri des clés alphabétiques).
 */
export async function computeReglementVisaHash(
  reglement: Pick<
    ReglementWithRelations,
    | 'id'
    | 'numero'
    | 'ordonnancement_id'
    | 'date_paiement'
    | 'mode_paiement'
    | 'reference_paiement'
    | 'montant'
  >
): Promise<string> {
  const canonical = JSON.stringify(
    {
      date_paiement: reglement.date_paiement,
      id: reglement.id,
      mode_paiement: reglement.mode_paiement,
      montant: reglement.montant,
      numero: reglement.numero,
      ordonnancement_id: reglement.ordonnancement_id,
      reference_paiement: reglement.reference_paiement ?? '',
    },
    Object.keys({
      date_paiement: 0,
      id: 0,
      mode_paiement: 0,
      montant: 0,
      numero: 0,
      ordonnancement_id: 0,
      reference_paiement: 0,
    }).sort()
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface ViserPayload {
  reglement: ReglementWithRelations;
}

export function useReglementVisa() {
  const queryClient = useQueryClient();

  const viserReglement = useMutation<ReglementWithRelations, Error, ViserPayload>({
    mutationFn: async ({ reglement }) => {
      if (reglement.vise_at) {
        throw new Error('Ce règlement est déjà visé');
      }

      const hash = await computeReglementVisaHash(reglement);

      const { data, error } = await supabase.rpc('viser_reglement', {
        p_reglement_id: reglement.id,
        p_payload_hash: hash,
        p_ip: null,
      });

      if (error) throw new Error(error.message);
      if (!data) throw new Error("La RPC viser_reglement n'a rien retourné");

      return data as unknown as ReglementWithRelations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reglements'] });
      toast.success('Visa numérique apposé avec succès', {
        description: 'Le règlement est désormais visé par le Trésorier',
      });
    },
    onError: (error) => {
      toast.error('Erreur lors du visa numérique', {
        description: error.message,
      });
    },
  });

  return { viserReglement };
}
