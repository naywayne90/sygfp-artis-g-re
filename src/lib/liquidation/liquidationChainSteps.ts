/**
 * Logique de construction des etapes de la barre chaine Engagement <> Liquidation <> Ordonnancement
 * Replique le pattern de engagementChainSteps.ts
 */

import type { Liquidation } from '@/hooks/useLiquidations';

export interface LiquidationChainStep {
  key: string;
  label: string;
  iconName: 'Gavel' | 'CreditCard' | 'Receipt' | 'Banknote';
  status: 'completed' | 'current' | 'pending' | 'unavailable';
  url: string | null;
  subtitle: string | null;
}

export function buildLiquidationChainSteps(liquidation: Liquidation): LiquidationChainStep[] {
  const hasPassation = !!liquidation.engagement?.marche?.id;
  const hasEngagement = !!liquidation.engagement_id;
  const isValide = liquidation.statut === 'valide';

  return [
    {
      key: 'passation',
      label: 'Passation',
      iconName: 'Gavel',
      status: hasPassation ? 'completed' : 'unavailable',
      url: hasPassation
        ? `/execution/passation-marche?detail=${liquidation.engagement?.marche?.id}`
        : null,
      subtitle: liquidation.engagement?.marche?.numero || null,
    },
    {
      key: 'engagement',
      label: 'Engagement',
      iconName: 'CreditCard',
      status: hasEngagement ? 'completed' : 'unavailable',
      url: hasEngagement ? `/engagements?detail=${liquidation.engagement_id}` : null,
      subtitle: liquidation.engagement?.numero || null,
    },
    {
      key: 'liquidation',
      label: 'Liquidation',
      iconName: 'Receipt',
      status: 'current',
      url: null,
      subtitle: liquidation.numero,
    },
    {
      key: 'ordonnancement',
      label: 'Ordonnancement',
      iconName: 'Banknote',
      status: isValide ? 'pending' : 'unavailable',
      url: isValide ? `/ordonnancements?sourceLiquidation=${liquidation.id}` : null,
      subtitle: isValide ? 'Creer' : null,
    },
  ];
}
