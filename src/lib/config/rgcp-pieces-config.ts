/**
 * Configuration RGCP — Pièces justificatives par type de dépense
 *
 * Règlement Général sur la Comptabilité Publique (UEMOA) +
 * Code des Marchés Publics de Côte d'Ivoire (Décret 2009-259)
 *
 * Les pièces requises varient selon :
 *   - type_engagement : 'sur_marche' | 'hors_marche'
 *   - type_marche : 'fourniture' | 'services' | 'travaux' | 'prestations_intellectuelles'
 */

export interface PieceJustificative {
  /** Code unique du document */
  code: string;
  /** Libellé affiché */
  label: string;
  /** Obligatoire pour la liquidation */
  obligatoire: boolean;
  /** Référence réglementaire */
  ref_rgcp?: string;
  /** Description / précision */
  description?: string;
}

export interface TypeDepenseConfig {
  /** Clé d'identification du type */
  key: string;
  /** Libellé du type de dépense */
  label: string;
  /** Icône emoji */
  icon: string;
  /** Couleur CSS du badge */
  couleur: string;
  /** Liste des pièces justificatives */
  pieces: PieceJustificative[];
}

// ── Pièces communes à tous les types ──────────────────────────
const PIECES_COMMUNES: PieceJustificative[] = [
  {
    code: 'facture',
    label: 'Facture',
    obligatoire: true,
    ref_rgcp: 'RGCP art. 35',
    description: 'Facture originale certifiée conforme',
  },
  {
    code: 'attestation_service_fait',
    label: 'Attestation de service fait',
    obligatoire: true,
    ref_rgcp: 'RGCP art. 34',
    description: 'Certifiée par le responsable de la réception',
  },
];

// ── Configuration par type de dépense ─────────────────────────

const MARCHE_FOURNITURES: TypeDepenseConfig = {
  key: 'marche_fourniture',
  label: 'Marché — Fournitures',
  icon: '📦',
  couleur: 'bg-blue-100 text-blue-700 border-blue-200',
  pieces: [
    ...PIECES_COMMUNES,
    {
      code: 'copie_marche',
      label: 'Copie du marché',
      obligatoire: true,
      ref_rgcp: 'CMP art. 78',
      description: 'Copie certifiée conforme du marché signé',
    },
    {
      code: 'bon_commande',
      label: 'Bon de commande',
      obligatoire: true,
      ref_rgcp: 'RGCP art. 35',
    },
    {
      code: 'bon_livraison',
      label: 'Bon de livraison',
      obligatoire: true,
      ref_rgcp: 'RGCP art. 35',
      description: 'Signé par le fournisseur et le réceptionnaire',
    },
    {
      code: 'pv_reception',
      label: 'PV de réception',
      obligatoire: true,
      ref_rgcp: 'CMP art. 139',
      description: 'Procès-verbal de réception (partielle ou définitive)',
    },
    {
      code: 'bordereau_livraison',
      label: 'Bordereau de livraison',
      obligatoire: false,
      description: 'Détail quantitatif des fournitures livrées',
    },
  ],
};

const MARCHE_SERVICES: TypeDepenseConfig = {
  key: 'marche_services',
  label: 'Marché — Services',
  icon: '🔧',
  couleur: 'bg-teal-100 text-teal-700 border-teal-200',
  pieces: [
    ...PIECES_COMMUNES,
    {
      code: 'copie_marche',
      label: 'Copie du marché / Contrat',
      obligatoire: true,
      ref_rgcp: 'CMP art. 78',
    },
    {
      code: 'rapport_execution',
      label: "Rapport d'exécution",
      obligatoire: true,
      ref_rgcp: 'CMP art. 139',
      description: 'Rapport détaillé des prestations réalisées',
    },
    {
      code: 'pv_reception',
      label: 'PV de réception des prestations',
      obligatoire: true,
      ref_rgcp: 'CMP art. 139',
    },
    {
      code: 'ordre_service',
      label: 'Ordre de service',
      obligatoire: false,
      description: 'Ordre de service de démarrage des prestations',
    },
  ],
};

const MARCHE_TRAVAUX: TypeDepenseConfig = {
  key: 'marche_travaux',
  label: 'Marché — Travaux',
  icon: '🏗️',
  couleur: 'bg-orange-100 text-orange-700 border-orange-200',
  pieces: [
    {
      code: 'decompte',
      label: 'Décompte',
      obligatoire: true,
      ref_rgcp: 'CMP art. 140',
      description: 'Décompte partiel ou définitif certifié',
    },
    {
      code: 'attestation_service_fait',
      label: 'Attestation de service fait',
      obligatoire: true,
      ref_rgcp: 'RGCP art. 34',
    },
    {
      code: 'copie_marche',
      label: 'Copie du marché',
      obligatoire: true,
      ref_rgcp: 'CMP art. 78',
    },
    {
      code: 'attachements',
      label: 'Attachements / Situation de travaux',
      obligatoire: true,
      ref_rgcp: 'CMP art. 140',
      description: 'Pièces quantitatives justifiant le décompte',
    },
    {
      code: 'pv_reception',
      label: 'PV de réception',
      obligatoire: true,
      ref_rgcp: 'CMP art. 141',
      description: 'PV de réception provisoire ou définitive',
    },
    {
      code: 'caution_bonne_execution',
      label: 'Caution de bonne exécution',
      obligatoire: false,
      ref_rgcp: 'CMP art. 92',
      description: 'Garantie bancaire pour la bonne exécution',
    },
    {
      code: 'plan_recolement',
      label: 'Plan de récolement',
      obligatoire: false,
      description: "Plans conformes à l'exécution (si applicable)",
    },
  ],
};

const MARCHE_PRESTATIONS_INTELLECTUELLES: TypeDepenseConfig = {
  key: 'marche_prestations_intellectuelles',
  label: 'Marché — Prestations intellectuelles',
  icon: '📊',
  couleur: 'bg-purple-100 text-purple-700 border-purple-200',
  pieces: [
    {
      code: 'note_honoraires',
      label: "Facture / Note d'honoraires",
      obligatoire: true,
      ref_rgcp: 'RGCP art. 35',
    },
    {
      code: 'attestation_service_fait',
      label: 'Attestation de service fait',
      obligatoire: true,
      ref_rgcp: 'RGCP art. 34',
    },
    {
      code: 'copie_contrat',
      label: 'Copie du contrat / marché',
      obligatoire: true,
      ref_rgcp: 'CMP art. 78',
    },
    {
      code: 'rapport_etude',
      label: "Rapport d'étude / Livrables",
      obligatoire: true,
      ref_rgcp: 'CMP art. 139',
      description: 'Rapport final ou livrables intermédiaires validés',
    },
    {
      code: 'pv_validation_livrables',
      label: 'PV de validation des livrables',
      obligatoire: true,
      ref_rgcp: 'CMP art. 139',
      description: 'Procès-verbal du comité de validation',
    },
    {
      code: 'termes_reference',
      label: 'Termes de référence',
      obligatoire: false,
      description: 'TDR de la mission (pour vérification du périmètre)',
    },
  ],
};

const HORS_MARCHE: TypeDepenseConfig = {
  key: 'hors_marche',
  label: 'Hors marché — Bon de commande',
  icon: '📋',
  couleur: 'bg-gray-100 text-gray-700 border-gray-200',
  pieces: [
    {
      code: 'facture',
      label: 'Facture',
      obligatoire: true,
      ref_rgcp: 'RGCP art. 35',
    },
    {
      code: 'bon_commande',
      label: 'Bon de commande',
      obligatoire: true,
      ref_rgcp: 'RGCP art. 35',
      description: "Bon de commande signé par l'ordonnateur",
    },
    {
      code: 'bon_livraison',
      label: 'Bon de livraison',
      obligatoire: true,
      description: 'Signé par le fournisseur et le réceptionnaire',
    },
    {
      code: 'pv_reception',
      label: 'PV de réception',
      obligatoire: false,
      ref_rgcp: 'CMP art. 139',
      description: 'Obligatoire si montant > seuil de passation',
    },
    {
      code: 'attestation_service_fait',
      label: 'Attestation de service fait',
      obligatoire: false,
      description: 'Recommandée pour tout montant significatif',
    },
  ],
};

// ── Registre des types ────────────────────────────────────────

const TYPE_DEPENSE_REGISTRY: Record<string, TypeDepenseConfig> = {
  marche_fourniture: MARCHE_FOURNITURES,
  marche_services: MARCHE_SERVICES,
  marche_travaux: MARCHE_TRAVAUX,
  marche_prestations_intellectuelles: MARCHE_PRESTATIONS_INTELLECTUELLES,
  hors_marche: HORS_MARCHE,
};

/**
 * Résout la configuration RGCP des pièces justificatives
 * à partir du type d'engagement et du type de marché.
 */
export function resolveTypeDepense(
  typeEngagement: string | null | undefined,
  typeMarche: string | null | undefined
): TypeDepenseConfig {
  if (!typeEngagement || typeEngagement === 'hors_marche') {
    return HORS_MARCHE;
  }

  // Sur marché → résolution par type_marche
  if (typeMarche) {
    const key = `marche_${typeMarche}`;
    if (TYPE_DEPENSE_REGISTRY[key]) {
      return TYPE_DEPENSE_REGISTRY[key];
    }
  }

  // Fallback : fournitures (type le plus courant)
  return MARCHE_FOURNITURES;
}

/**
 * Retourne la liste des pièces requises (obligatoires) pour un type donné.
 */
export function getPiecesObligatoires(
  typeEngagement: string | null | undefined,
  typeMarche: string | null | undefined
): PieceJustificative[] {
  return resolveTypeDepense(typeEngagement, typeMarche).pieces.filter((p) => p.obligatoire);
}

/**
 * Retourne toutes les configurations disponibles (pour affichage admin / aide).
 */
export function getAllTypesDepense(): TypeDepenseConfig[] {
  return Object.values(TYPE_DEPENSE_REGISTRY);
}
