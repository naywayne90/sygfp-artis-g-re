/**
 * Tests — sidebarTodoMapping
 *
 * Couvre le filtrage "À traiter par moi" des compteurs sidebar selon le rôle
 * métier de l'utilisateur courant (cf. VALIDATION_MATRIX + workflows SYGFP/ARTI).
 *
 * Règle clé : chaque dossier n'est compté QUE pour le rôle qui doit effectivement
 * agir maintenant sur ce dossier. Un engagement en `visa_saf` doit remonter au CB,
 * pas au SAF qui a déjà visé.
 */

import { describe, it, expect } from 'vitest';
import type { SidebarBadges } from '@/hooks/useSidebarBadges';
import {
  getTodoCountForItem,
  getTotalTodoForRole,
  EMPTY_ROLE_FLAGS,
  type RoleFlags,
} from '@/lib/config/sidebarTodoMapping';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeBadges = (overrides: Partial<SidebarBadges> = {}): SidebarBadges => ({
  sefAValider: 0,
  sefDifferes: 0,
  aefAValider: 0,
  aefAImputer: 0,
  aefDifferes: 0,
  imputationsATraiter: 0,
  ebAValider: 0,
  marchesEnCours: 0,
  marchesSoumis: 0,
  marchesAttribue: 0,
  engagementsAValider: 0,
  engagementsDifferes: 0,
  engSoumis: 0,
  engVisaSaf: 0,
  engVisaCb: 0,
  engVisaDaaf: 0,
  liquidationsAValider: 0,
  liquidationsDifferes: 0,
  liquidationsUrgentes: 0,
  liqSoumis: 0,
  liqCertifSf: 0,
  ordoAValider: 0,
  ordoEnSignature: 0,
  ordoSoumis: 0,
  ordoEnAttente: 0,
  reglementsATraiter: 0,
  virementsEnAttente: 0,
  virementsApprouves: 0,
  scanningEngagements: 0,
  scanningLiquidations: 0,
  contratsExpirent: 0,
  roadmapSoumissions: 0,
  roadmapPlansBrouillon: 0,
  roadmapTachesEnRetard: 0,
  totalATraiter: 0,
  lastUpdated: new Date(),
  ...overrides,
});

const ROLES: Record<string, RoleFlags> = {
  ADMIN: { ...EMPTY_ROLE_FLAGS, isAdmin: true },
  DG: { ...EMPTY_ROLE_FLAGS, isDG: true },
  CB: { ...EMPTY_ROLE_FLAGS, isCB: true },
  DAAF: { ...EMPTY_ROLE_FLAGS, isDAF: true },
  TRESORERIE: { ...EMPTY_ROLE_FLAGS, isTresorerie: true },
  DIRECTEUR: { ...EMPTY_ROLE_FLAGS, isDirecteur: true },
  SAF: { ...EMPTY_ROLE_FLAGS, hasSAF: true },
  SDCT: { ...EMPTY_ROLE_FLAGS, hasSDCT: true },
  SDPM: { ...EMPTY_ROLE_FLAGS, hasSDPM: true },
  OPERATEUR: { ...EMPTY_ROLE_FLAGS },
};

// ---------------------------------------------------------------------------
// Null / empty badges
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — inputs vides', () => {
  it('retourne 0 si badges est null', () => {
    expect(getTodoCountForItem('/notes-sef', null, ROLES.DG)).toBe(0);
  });

  it('retourne 0 si badges est undefined', () => {
    expect(getTodoCountForItem('/notes-sef', undefined, ROLES.DG)).toBe(0);
  });

  it('retourne 0 pour une URL non reconnue', () => {
    const badges = makeBadges({ sefAValider: 10 });
    expect(getTodoCountForItem('/unknown', badges, ROLES.ADMIN)).toBe(0);
  });

  it("retourne 0 pour OPERATEUR sans rôle d'action sur aucun item", () => {
    const badges = makeBadges({
      sefAValider: 5,
      aefAValider: 3,
      engSoumis: 2,
      reglementsATraiter: 1,
    });
    expect(getTodoCountForItem('/notes-sef', badges, ROLES.OPERATEUR)).toBe(0);
    expect(getTodoCountForItem('/notes-aef', badges, ROLES.OPERATEUR)).toBe(0);
    expect(getTodoCountForItem('/engagements', badges, ROLES.OPERATEUR)).toBe(0);
    expect(getTodoCountForItem('/reglements', badges, ROLES.OPERATEUR)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ADMIN : supervise tout → totaux bruts
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — ADMIN supervise tout', () => {
  const badges = makeBadges({
    sefAValider: 5,
    aefAValider: 3,
    imputationsATraiter: 8,
    ebAValider: 4,
    marchesEnCours: 12,
    engagementsAValider: 7,
    liquidationsAValider: 6,
    ordoAValider: 2,
    ordoEnSignature: 1,
    reglementsATraiter: 9,
    virementsEnAttente: 2,
    virementsApprouves: 3,
  });

  it('voit le total de notes SEF', () => {
    expect(getTodoCountForItem('/notes-sef', badges, ROLES.ADMIN)).toBe(5);
  });

  it('voit le total de notes AEF', () => {
    expect(getTodoCountForItem('/notes-aef', badges, ROLES.ADMIN)).toBe(3);
  });

  it('voit les imputations à traiter', () => {
    expect(getTodoCountForItem('/execution/imputation', badges, ROLES.ADMIN)).toBe(8);
  });

  it('voit les EB à valider', () => {
    expect(getTodoCountForItem('/execution/expression-besoin', badges, ROLES.ADMIN)).toBe(4);
  });

  it('voit tous les marchés en cours', () => {
    expect(getTodoCountForItem('/execution/passation-marche', badges, ROLES.ADMIN)).toBe(12);
  });

  it('voit tous les engagements à valider', () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.ADMIN)).toBe(7);
  });

  it('voit toutes les liquidations à valider', () => {
    expect(getTodoCountForItem('/liquidations', badges, ROLES.ADMIN)).toBe(6);
  });

  it('voit tous les ordonnancements (à valider + signature)', () => {
    expect(getTodoCountForItem('/ordonnancements', badges, ROLES.ADMIN)).toBe(3);
  });

  it('voit tous les règlements en attente', () => {
    expect(getTodoCountForItem('/reglements', badges, ROLES.ADMIN)).toBe(9);
  });

  it('voit tous les virements (en attente CB + approuvés DG)', () => {
    expect(getTodoCountForItem('/planification/virements', badges, ROLES.ADMIN)).toBe(2 + 3);
  });
});

// ---------------------------------------------------------------------------
// DG : Notes SEF, Notes AEF (secondaire), marchés attribués, ordonnancements, liq urgentes
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — DG', () => {
  const badges = makeBadges({
    sefAValider: 4,
    aefAValider: 2,
    imputationsATraiter: 8,
    ebAValider: 3,
    marchesSoumis: 5,
    marchesAttribue: 3,
    engSoumis: 2,
    engVisaSaf: 1,
    engVisaCb: 4,
    liqSoumis: 3,
    liqCertifSf: 2,
    liquidationsUrgentes: 7,
    ordoAValider: 6,
    ordoEnSignature: 2,
    reglementsATraiter: 10,
    virementsEnAttente: 5,
    virementsApprouves: 4,
  });

  it('valide les notes SEF (son rôle principal)', () => {
    expect(getTodoCountForItem('/notes-sef', badges, ROLES.DG)).toBe(4);
  });

  it('peut aussi valider les notes AEF', () => {
    expect(getTodoCountForItem('/notes-aef', badges, ROLES.DG)).toBe(2);
  });

  it("ne voit pas l'imputation (chaîne DAAF)", () => {
    expect(getTodoCountForItem('/execution/imputation', badges, ROLES.DG)).toBe(0);
  });

  it('ne voit pas les EB (DAAF/Directeur)', () => {
    expect(getTodoCountForItem('/execution/expression-besoin', badges, ROLES.DG)).toBe(0);
  });

  it('approuve uniquement les marchés attribués (pas les soumis)', () => {
    expect(getTodoCountForItem('/execution/passation-marche', badges, ROLES.DG)).toBe(3);
  });

  it("n'intervient pas sur les engagements", () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.DG)).toBe(0);
  });

  it('voit les liquidations urgentes (réglement urgent)', () => {
    expect(getTodoCountForItem('/liquidations', badges, ROLES.DG)).toBe(7);
  });

  it('signe les ordonnancements (à valider + en signature)', () => {
    expect(getTodoCountForItem('/ordonnancements', badges, ROLES.DG)).toBe(8);
  });

  it("n'intervient pas sur les règlements", () => {
    expect(getTodoCountForItem('/reglements', badges, ROLES.DG)).toBe(0);
  });

  it('exécute les virements approuvés par le CB (niveau 2)', () => {
    // Workflow 2 niveaux : DG ne voit que les `approuve`, pas les `en_attente`
    expect(getTodoCountForItem('/planification/virements', badges, ROLES.DG)).toBe(4);
  });

  it('ne voit pas les virements en attente CB (niveau 1)', () => {
    const onlyEnAttente = makeBadges({ virementsEnAttente: 7 });
    expect(getTodoCountForItem('/planification/virements', onlyEnAttente, ROLES.DG)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CB : engagements visa_saf, liquidations, virements
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — CB', () => {
  const badges = makeBadges({
    sefAValider: 5,
    engSoumis: 2,
    engVisaSaf: 3,
    engVisaCb: 1,
    engVisaDaaf: 4,
    liqSoumis: 2,
    liqCertifSf: 1,
    virementsEnAttente: 6,
    virementsApprouves: 9,
    reglementsATraiter: 10,
  });

  it('ne voit pas les notes SEF (DG)', () => {
    expect(getTodoCountForItem('/notes-sef', badges, ROLES.CB)).toBe(0);
  });

  it('voit les engagements en visa_saf (après SAF → CB suivant)', () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.CB)).toBe(3);
  });

  it("ne voit pas engSoumis (c'est pour SAF)", () => {
    const badgesOnlySoumis = makeBadges({ engSoumis: 10 });
    expect(getTodoCountForItem('/engagements', badgesOnlySoumis, ROLES.CB)).toBe(0);
  });

  it('approuve les virements en attente (niveau 1 — CB)', () => {
    // CB ne voit que les 6 `en_attente`, pas les 9 `approuve` (qui sont pour le DG)
    expect(getTodoCountForItem('/planification/virements', badges, ROLES.CB)).toBe(6);
  });

  it('ne voit pas les règlements (Trésorerie)', () => {
    expect(getTodoCountForItem('/reglements', badges, ROLES.CB)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DAAF : imputation, EB, marchés soumis, engagements visa_cb, liquidations certifié_sf
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — DAAF', () => {
  const badges = makeBadges({
    imputationsATraiter: 8,
    ebAValider: 4,
    marchesSoumis: 5,
    marchesAttribue: 3,
    engSoumis: 2,
    engVisaSaf: 3,
    engVisaCb: 6,
    liqSoumis: 4,
    liqCertifSf: 7,
  });

  it('voit les imputations à faire (chaîne DAAF)', () => {
    expect(getTodoCountForItem('/execution/imputation', badges, ROLES.DAAF)).toBe(8);
  });

  it('voit les expressions de besoin', () => {
    expect(getTodoCountForItem('/execution/expression-besoin', badges, ROLES.DAAF)).toBe(4);
  });

  it('examine les marchés soumis (pas les attribués = DG)', () => {
    expect(getTodoCountForItem('/execution/passation-marche', badges, ROLES.DAAF)).toBe(5);
  });

  it('voit les engagements en visa_cb (après CB → DAAF)', () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.DAAF)).toBe(6);
  });

  it('voit les liquidations certifiées SF (après SAF → DAAF)', () => {
    expect(getTodoCountForItem('/liquidations', badges, ROLES.DAAF)).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// SAF : engagements soumis, liquidations soumis, imputation
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — SAF (Sous-Dir DAAF)', () => {
  const badges = makeBadges({
    imputationsATraiter: 5,
    engSoumis: 6,
    engVisaSaf: 2,
    liqSoumis: 4,
    liqCertifSf: 1,
  });

  it('voit les imputations (chaîne DAAF)', () => {
    expect(getTodoCountForItem('/execution/imputation', badges, ROLES.SAF)).toBe(5);
  });

  it('voit les engagements soumis (première étape du visa)', () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.SAF)).toBe(6);
  });

  it('ne voit pas visa_saf déjà visé', () => {
    expect(getTodoCountForItem('/engagements', makeBadges({ engVisaSaf: 10 }), ROLES.SAF)).toBe(0);
  });

  it('certifie les liquidations soumises', () => {
    expect(getTodoCountForItem('/liquidations', badges, ROLES.SAF)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// SDCT : liquidations soumis (même étape que SAF pour certif)
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — SDCT', () => {
  const badges = makeBadges({ liqSoumis: 3, engSoumis: 5 });

  it('certifie les liquidations soumises', () => {
    expect(getTodoCountForItem('/liquidations', badges, ROLES.SDCT)).toBe(3);
  });

  it("ne voit pas les engagements (c'est SAF)", () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.SDCT)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// DIRECTEUR : notes AEF de sa direction + EB
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — DIRECTEUR', () => {
  const badges = makeBadges({
    aefAValider: 4,
    ebAValider: 3,
    sefAValider: 10,
    engSoumis: 5,
  });

  it('valide les notes AEF de sa direction', () => {
    expect(getTodoCountForItem('/notes-aef', badges, ROLES.DIRECTEUR)).toBe(4);
  });

  it('voit les expressions de besoin', () => {
    expect(getTodoCountForItem('/execution/expression-besoin', badges, ROLES.DIRECTEUR)).toBe(3);
  });

  it('ne voit pas les notes SEF (DG)', () => {
    expect(getTodoCountForItem('/notes-sef', badges, ROLES.DIRECTEUR)).toBe(0);
  });

  it('ne voit pas les engagements', () => {
    expect(getTodoCountForItem('/engagements', badges, ROLES.DIRECTEUR)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TRESORERIE : règlements uniquement
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — TRESORERIE', () => {
  const badges = makeBadges({
    reglementsATraiter: 12,
    ordoEnSignature: 5,
    sefAValider: 3,
  });

  it('exécute les règlements en attente', () => {
    expect(getTodoCountForItem('/reglements', badges, ROLES.TRESORERIE)).toBe(12);
  });

  it('ne voit aucun autre item en action', () => {
    expect(getTodoCountForItem('/notes-sef', badges, ROLES.TRESORERIE)).toBe(0);
    expect(getTodoCountForItem('/ordonnancements', badges, ROLES.TRESORERIE)).toBe(0);
    expect(getTodoCountForItem('/engagements', badges, ROLES.TRESORERIE)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SDPM : examine les marchés soumis (comme DAAF)
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — SDPM', () => {
  const badges = makeBadges({ marchesSoumis: 7, marchesAttribue: 2 });

  it('examine les marchés soumis', () => {
    expect(getTodoCountForItem('/execution/passation-marche', badges, ROLES.SDPM)).toBe(7);
  });

  it("n'approuve pas les attribués (DG)", () => {
    const onlyAttribue = makeBadges({ marchesAttribue: 5 });
    expect(getTodoCountForItem('/execution/passation-marche', onlyAttribue, ROLES.SDPM)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Multi-rôles : union des contributions
// ---------------------------------------------------------------------------

describe('getTodoCountForItem — cumul multi-rôles', () => {
  const badges = makeBadges({
    engSoumis: 2,
    engVisaSaf: 3,
    engVisaCb: 4,
    liqSoumis: 5,
    liqCertifSf: 6,
  });

  it('un utilisateur SAF+CB additionne engSoumis et engVisaSaf', () => {
    const safAndCb: RoleFlags = { ...EMPTY_ROLE_FLAGS, hasSAF: true, isCB: true };
    expect(getTodoCountForItem('/engagements', badges, safAndCb)).toBe(2 + 3);
  });

  it('un DAAF qui a aussi SAF voit engSoumis + engVisaCb + liqSoumis + liqCertifSf', () => {
    const daafAndSaf: RoleFlags = { ...EMPTY_ROLE_FLAGS, isDAF: true, hasSAF: true };
    expect(getTodoCountForItem('/engagements', badges, daafAndSaf)).toBe(2 + 4);
    expect(getTodoCountForItem('/liquidations', badges, daafAndSaf)).toBe(5 + 6);
  });

  it('ADMIN ignore le cumul et retourne le total brut', () => {
    const adminWithOtherRoles: RoleFlags = {
      ...EMPTY_ROLE_FLAGS,
      isAdmin: true,
      isDG: true,
      isCB: true,
    };
    const b = makeBadges({ engagementsAValider: 999, engSoumis: 2 });
    expect(getTodoCountForItem('/engagements', b, adminWithOtherRoles)).toBe(999);
  });
});

// ---------------------------------------------------------------------------
// getTotalTodoForRole
// ---------------------------------------------------------------------------

describe('getTotalTodoForRole', () => {
  it("somme les compteurs sur une liste d'items", () => {
    const badges = makeBadges({ sefAValider: 3, ordoAValider: 2, ordoEnSignature: 1 });
    const total = getTotalTodoForRole(badges, ROLES.DG, [
      '/notes-sef',
      '/ordonnancements',
      '/reglements',
    ]);
    expect(total).toBe(3 + 3 + 0); // notes SEF (3) + ordos (2+1) + règlements (0 pour DG)
  });

  it('retourne 0 si badges null', () => {
    expect(getTotalTodoForRole(null, ROLES.DG, ['/notes-sef'])).toBe(0);
  });

  it('retourne 0 si aucune URL fournie', () => {
    const badges = makeBadges({ sefAValider: 10 });
    expect(getTotalTodoForRole(badges, ROLES.DG, [])).toBe(0);
  });

  it('ignore silencieusement les URLs non reconnues', () => {
    const badges = makeBadges({ sefAValider: 5 });
    const total = getTotalTodoForRole(badges, ROLES.DG, ['/notes-sef', '/bogus', '/other']);
    expect(total).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Invariants globaux : aucun rôle ne "perd" un dossier
// ---------------------------------------------------------------------------

describe('Invariants globaux', () => {
  it('somme des contributions roles ≥ 1 dossier si un status a un compteur', () => {
    // Chaque statut doit avoir au moins un rôle qui l'affiche
    const cases: Array<{ badges: Partial<SidebarBadges>; url: string }> = [
      { badges: { sefAValider: 1 }, url: '/notes-sef' },
      { badges: { aefAValider: 1 }, url: '/notes-aef' },
      { badges: { imputationsATraiter: 1 }, url: '/execution/imputation' },
      { badges: { ebAValider: 1 }, url: '/execution/expression-besoin' },
      { badges: { marchesSoumis: 1 }, url: '/execution/passation-marche' },
      { badges: { marchesAttribue: 1 }, url: '/execution/passation-marche' },
      { badges: { engSoumis: 1 }, url: '/engagements' },
      { badges: { engVisaSaf: 1 }, url: '/engagements' },
      { badges: { engVisaCb: 1 }, url: '/engagements' },
      { badges: { liqSoumis: 1 }, url: '/liquidations' },
      { badges: { liqCertifSf: 1 }, url: '/liquidations' },
      { badges: { ordoAValider: 1 }, url: '/ordonnancements' },
      { badges: { reglementsATraiter: 1 }, url: '/reglements' },
      { badges: { virementsEnAttente: 1 }, url: '/planification/virements' },
      { badges: { virementsApprouves: 1 }, url: '/planification/virements' },
    ];

    for (const { badges, url } of cases) {
      const b = makeBadges(badges);
      const reached = Object.values(ROLES).some((role) => getTodoCountForItem(url, b, role) >= 1);
      expect(reached, `aucun rôle ne voit ${JSON.stringify(badges)} sur ${url}`).toBe(true);
    }
  });

  it("ADMIN voit ≥ autant que n'importe quel autre rôle sur chaque URL avec compteurs bruts", () => {
    // Propriété de supervision : l'ADMIN ne peut pas voir moins que les autres
    const b = makeBadges({
      sefAValider: 5,
      aefAValider: 4,
      marchesEnCours: 10,
      engagementsAValider: 8,
      liquidationsAValider: 6,
      ordoAValider: 3,
      ordoEnSignature: 2,
      reglementsATraiter: 9,
      virementsEnAttente: 4,
      virementsApprouves: 2,
    });
    const urls = [
      '/notes-sef',
      '/notes-aef',
      '/engagements',
      '/liquidations',
      '/ordonnancements',
      '/reglements',
      '/planification/virements',
    ];
    for (const url of urls) {
      const adminCount = getTodoCountForItem(url, b, ROLES.ADMIN);
      for (const [name, role] of Object.entries(ROLES)) {
        if (name === 'ADMIN') continue;
        const other = getTodoCountForItem(url, b, role);
        expect(adminCount, `${name} > ADMIN sur ${url}`).toBeGreaterThanOrEqual(other);
      }
    }
  });
});
