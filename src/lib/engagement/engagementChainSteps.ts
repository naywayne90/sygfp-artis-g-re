/**
 * Logique de construction des étapes de la barre chaîne Passation ↔ Engagement ↔ Liquidation
 * Extrait du composant EngagementChainNav pour éviter l'erreur react-refresh/only-export-components.
 */

import type { Engagement } from '@/hooks/useEngagements';

export interface ChainStep {
  key: string;
  label: string;
  iconName: 'Gavel' | 'CreditCard' | 'Receipt';
  status: 'completed' | 'current' | 'pending' | 'unavailable';
  url: string | null;
  subtitle: string | null;
}

export function buildChainSteps(engagement: Engagement): ChainStep[] {
  const hasPM = !!engagement.passation_marche_id;
  const isValide = engagement.statut === 'valide';

  return [
    {
      key: 'passation',
      label: 'Passation',
      iconName: 'Gavel',
      status: hasPM ? 'completed' : 'unavailable',
      url: hasPM ? `/execution/passation-marche?detail=${engagement.passation_marche_id}` : null,
      subtitle: engagement.marche?.numero || null,
    },
    {
      key: 'engagement',
      label: 'Engagement',
      iconName: 'CreditCard',
      status: 'current',
      url: null,
      subtitle: engagement.numero,
    },
    {
      key: 'liquidation',
      label: 'Liquidation',
      iconName: 'Receipt',
      status: isValide ? 'pending' : 'unavailable',
      url: isValide ? `/liquidations?sourceEngagement=${engagement.id}` : null,
      subtitle: isValide ? 'Créer' : null,
    },
  ];
}
