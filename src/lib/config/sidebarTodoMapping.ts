/**
 * Mapping "À traiter" par rôle pour les badges de la sidebar.
 *
 * Pour chaque item de menu (URL), cette fonction retourne le nombre de dossiers
 * que l'utilisateur courant doit effectivement traiter selon son rôle métier.
 *
 * Logique : un même dossier peut attendre des actions différentes selon son statut
 * (ex. un engagement en `visa_saf` attend le CB, en `visa_cb` attend le DAAF).
 * Au lieu d'afficher le total brut (qui ne reflète pas ce que CE rôle doit faire),
 * on filtre par la paire (itemUrl × rôle) → compteur pertinent.
 *
 * Pattern : fonction pure, sans side-effect, sans dépendance React.
 * → Trivialement testable (voir `__tests__/sidebarTodoMapping.test.ts`).
 *
 * Règles métier (cf. VALIDATION_MATRIX + workflows SYGFP/ARTI) :
 *
 * | Item                 | ADMIN | DG                  | CB          | DAAF              | SAF             | DIRECTEUR        | TRESORERIE   |
 * |----------------------|-------|---------------------|-------------|-------------------|-----------------|------------------|--------------|
 * | Notes SEF            | all   | sefAValider         | -           | -                 | -               | -                | -            |
 * | Notes AEF            | all   | aefAValider         | -           | -                 | -               | aefAValider      | -            |
 * | Imputation           | all   | -                   | -           | aefAImputer       | aefAImputer     | -                | -            |
 * | Expression Besoin    | all   | -                   | -           | ebAValider        | -               | ebAValider       | -            |
 * | Passation Marché     | all   | marchesAttribue     | -           | marchesSoumis     | marchesSoumis   | -                | -            |
 * | Engagement           | all   | -                   | engVisaSaf  | engVisaCb         | engSoumis       | -                | -            |
 * | Liquidation          | all   | liquidationsUrgentes| liqValideDaaf*| liqCertifSf     | liqSoumis       | -                | -            |
 * | Ordonnancement       | all   | ordoAValider+ordoEnSignature | -  | -                 | -               | -                | -            |
 * | Règlement            | all   | -                   | -           | -                 | -               | -                | reglementsATraiter |
 * | Virement             | all   | virementsApprouves  | virementsEnAttente | -          | -               | -                | -            |
 *
 * (*) Les liquidations validées_daaf en attente CB ne sont pas actuellement
 * pré-calculées dans `useSidebarBadges` (le fetch se limite à soumis + certifié_sf).
 * L'extension future ajoutera `liqValideDaaf` pour le badge CB.
 *
 * ADMIN voit tout (totaux bruts, car il supervise tout le système).
 */

import type { SidebarBadges } from '@/hooks/useSidebarBadges';

/**
 * Flags de rôle utilisés pour filtrer les compteurs.
 * Miroir minimal de `RBACContextValue` — permet de tester la fonction
 * sans instancier le contexte complet.
 */
export interface RoleFlags {
  isAdmin: boolean;
  isDG: boolean;
  isCB: boolean;
  isDAF: boolean;
  isTresorerie: boolean;
  isDirecteur: boolean;
  /** Rôle applicatif SAF (Sous-Directeur DAAF) — intervient sur visa_saf engagement et certif liquidation */
  hasSAF: boolean;
  /** Rôle applicatif SDCT / Sous-Dir Contrôle Technique — cert liquidation */
  hasSDCT: boolean;
  /** Rôle applicatif SDPM / Sous-Dir Passation des Marchés */
  hasSDPM: boolean;
}

/**
 * Aucun rôle → aucun badge d'action personnel.
 * Utilisé comme fallback pour user non authentifié.
 */
export const EMPTY_ROLE_FLAGS: RoleFlags = {
  isAdmin: false,
  isDG: false,
  isCB: false,
  isDAF: false,
  isTresorerie: false,
  isDirecteur: false,
  hasSAF: false,
  hasSDCT: false,
  hasSDPM: false,
};

/**
 * Retourne le nombre de dossiers "À traiter par moi" pour un item de sidebar donné.
 *
 * @param itemUrl L'URL canonique du menu (ex. '/engagements', '/notes-sef')
 * @param badges Les compteurs bruts du hook `useSidebarBadges`
 * @param role Les flags RBAC de l'utilisateur
 * @returns Nombre ≥ 0. Si aucun rôle ne correspond à l'URL, retourne 0.
 */
export function getTodoCountForItem(
  itemUrl: string,
  badges: SidebarBadges | null | undefined,
  role: RoleFlags
): number {
  if (!badges) return 0;

  // ADMIN voit les totaux bruts (supervision globale)
  if (role.isAdmin) {
    return getAdminTodoCount(itemUrl, badges);
  }

  // Union des contributions de chaque rôle actif sur cet item
  let count = 0;

  switch (itemUrl) {
    case '/notes-sef':
      // Seul le DG valide les notes SEF (cf. VALIDATION_MATRIX.NOTE_SEF)
      if (role.isDG) count += badges.sefAValider;
      break;

    case '/notes-aef':
      // Directeur de département valide sa direction, DG peut valider aussi
      if (role.isDirecteur || role.isDG) count += badges.aefAValider;
      break;

    case '/execution/imputation':
      // Chaîne DAAF : DAAF lui-même OU Sous-Dir SAF (cf. canCreate('imputation'))
      if (role.isDAF || role.hasSAF) count += badges.imputationsATraiter;
      break;

    case '/execution/expression-besoin':
      // Directions opérationnelles + DAAF supervisent les EB à traiter
      if (role.isDAF || role.isDirecteur) count += badges.ebAValider;
      break;

    case '/execution/passation-marche':
      // DG approuve les marchés attribués, DAAF/SDPM examinent les soumis
      if (role.isDG) count += badges.marchesAttribue;
      if (role.isDAF || role.hasSDPM) count += badges.marchesSoumis;
      break;

    case '/engagements':
      // Workflow 4 étapes : SAF → CB → DAAF → (validation finale)
      if (role.hasSAF) count += badges.engSoumis;
      if (role.isCB) count += badges.engVisaSaf;
      if (role.isDAF) count += badges.engVisaCb;
      // engVisaDaaf : après visa DAAF → validation finale (géré côté serveur)
      break;

    case '/liquidations':
      // Workflow : soumis → certifié_sf → validé_daaf → (CB) → validé_dg
      if (role.hasSAF || role.hasSDCT) count += badges.liqSoumis;
      if (role.isDAF) count += badges.liqCertifSf;
      // DG : les liquidations urgentes méritent son attention
      if (role.isDG) count += badges.liquidationsUrgentes;
      break;

    case '/ordonnancements':
      // Le DG signe les ordonnancements (cf. VALIDATION_MATRIX.ORDONNANCEMENT)
      if (role.isDG) count += badges.ordoAValider + badges.ordoEnSignature;
      break;

    case '/reglements':
      // Trésorerie exécute les règlements
      if (role.isTresorerie) count += badges.reglementsATraiter;
      break;

    case '/planification/virements':
      // Workflow 2 niveaux : CB approuve (niveau 1), DG exécute (niveau 2)
      if (role.isCB) count += badges.virementsEnAttente;
      if (role.isDG) count += badges.virementsApprouves;
      break;

    default:
      // Item non géré → 0 (pas de badge "à traiter")
      return 0;
  }

  return count;
}

/**
 * Totaux bruts pour ADMIN — supervision globale, pas de filtrage par rôle.
 */
function getAdminTodoCount(itemUrl: string, badges: SidebarBadges): number {
  switch (itemUrl) {
    case '/notes-sef':
      return badges.sefAValider;
    case '/notes-aef':
      return badges.aefAValider;
    case '/execution/imputation':
      return badges.imputationsATraiter;
    case '/execution/expression-besoin':
      return badges.ebAValider;
    case '/execution/passation-marche':
      return badges.marchesEnCours;
    case '/engagements':
      return badges.engagementsAValider;
    case '/liquidations':
      return badges.liquidationsAValider;
    case '/ordonnancements':
      return badges.ordoAValider + badges.ordoEnSignature;
    case '/reglements':
      return badges.reglementsATraiter;
    case '/planification/virements':
      return badges.virementsEnAttente + badges.virementsApprouves;
    default:
      return 0;
  }
}

/**
 * Somme totale "À traiter" pour l'utilisateur courant.
 * Utilisé pour l'indicateur d'en-tête (chaîne de dépense).
 */
export function getTotalTodoForRole(
  badges: SidebarBadges | null | undefined,
  role: RoleFlags,
  itemUrls: string[]
): number {
  if (!badges) return 0;
  return itemUrls.reduce((sum, url) => sum + getTodoCountForItem(url, badges, role), 0);
}
