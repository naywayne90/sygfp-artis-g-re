/**
 * Tests unitaires — Dashboard DG : Corbeille & données
 *
 * Valide la logique de construction de la corbeille DG,
 * le calcul des pendingDGActions, et la cohérence des données.
 */
import { describe, it, expect } from 'vitest';

// ─── Types reproduits (sans import Supabase) ───
interface CorbeilleDGItem {
  key: string;
  label: string;
  count: number;
  montant: number;
  action: string;
  link: string;
  color: string;
  icon: string;
}

// ─── Fonction de construction de la corbeille (logique extraite du hook) ───
function buildCorbeilleDG(params: {
  notesSEFAValider: number;
  notesSEFMontant: number;
  notesAEFAValider: number;
  notesAEFMontant: number;
  imputationsAValiderDG: number;
  imputationsAValiderDGMontant: number;
  marchesAApprouver: number;
  marchesAApprouverMontant: number;
  engagementsAValiderDG: number;
  engagementsAValiderDGMontant: number;
  ordonnancementsASignerDG: number;
  ordonnancementsASignerDGMontant: number;
}): { corbeille: CorbeilleDGItem[]; pendingDGActions: number; pendingDGMontant: number } {
  const corbeille: CorbeilleDGItem[] = [];

  if (params.notesSEFAValider > 0) {
    corbeille.push({
      key: 'notes_sef',
      label: 'Notes SEF',
      count: params.notesSEFAValider,
      montant: params.notesSEFMontant,
      action: 'Valider',
      link: '/notes-sef?statut=soumis',
      color: 'blue',
      icon: 'FileText',
    });
  }
  if (params.notesAEFAValider > 0) {
    corbeille.push({
      key: 'notes_aef',
      label: 'Notes AEF',
      count: params.notesAEFAValider,
      montant: params.notesAEFMontant,
      action: 'Valider',
      link: '/notes-aef?statut=soumis',
      color: 'indigo',
      icon: 'FileSignature',
    });
  }
  if (params.imputationsAValiderDG > 0) {
    corbeille.push({
      key: 'imputations',
      label: 'Imputations',
      count: params.imputationsAValiderDG,
      montant: params.imputationsAValiderDGMontant,
      action: 'Valider',
      link: '/execution/imputation?statut=vise',
      color: 'cyan',
      icon: 'ClipboardCheck',
    });
  }
  if (params.marchesAApprouver > 0) {
    corbeille.push({
      key: 'marches',
      label: 'Marchés',
      count: params.marchesAApprouver,
      montant: params.marchesAApprouverMontant,
      action: 'Approuver',
      link: '/execution/passation-marche/approbation',
      color: 'emerald',
      icon: 'ShoppingCart',
    });
  }
  if (params.engagementsAValiderDG > 0) {
    corbeille.push({
      key: 'engagements',
      label: 'Engagements',
      count: params.engagementsAValiderDG,
      montant: params.engagementsAValiderDGMontant,
      action: 'Valider',
      link: '/engagements?statut=visa_daaf',
      color: 'green',
      icon: 'CreditCard',
    });
  }
  if (params.ordonnancementsASignerDG > 0) {
    corbeille.push({
      key: 'ordonnancements',
      label: 'Ordonnancements',
      count: params.ordonnancementsASignerDG,
      montant: params.ordonnancementsASignerDGMontant,
      action: 'Signer',
      link: '/ordonnancements?statut=en_signature',
      color: 'purple',
      icon: 'FileCheck',
    });
  }

  const pendingDGActions =
    params.notesSEFAValider +
    params.notesAEFAValider +
    params.imputationsAValiderDG +
    params.marchesAApprouver +
    params.engagementsAValiderDG +
    params.ordonnancementsASignerDG;

  const pendingDGMontant =
    params.notesSEFMontant +
    params.notesAEFMontant +
    params.imputationsAValiderDGMontant +
    params.marchesAApprouverMontant +
    params.engagementsAValiderDGMontant +
    params.ordonnancementsASignerDGMontant;

  return { corbeille, pendingDGActions, pendingDGMontant };
}

// ─── Fonction de filtrage par statut (logique extracte) ───
function filterByStatut<T extends { statut: string }>(data: T[], statuts: string[]): T[] {
  return data.filter((item) => statuts.includes(item.statut));
}

// ════════════════════════════════════════════
// TESTS
// ════════════════════════════════════════════

describe('Dashboard DG — Corbeille', () => {
  describe('Construction de la corbeille', () => {
    it('corbeille vide quand rien à traiter', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 0,
        notesSEFMontant: 0,
        notesAEFAValider: 0,
        notesAEFMontant: 0,
        imputationsAValiderDG: 0,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 0,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 0,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 0,
        ordonnancementsASignerDGMontant: 0,
      });
      expect(result.corbeille).toHaveLength(0);
      expect(result.pendingDGActions).toBe(0);
      expect(result.pendingDGMontant).toBe(0);
    });

    it('inclut toutes les 6 catégories quand tout est en attente', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 2,
        notesSEFMontant: 100000,
        notesAEFAValider: 3,
        notesAEFMontant: 200000,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 500000,
        marchesAApprouver: 4,
        marchesAApprouverMontant: 3000000,
        engagementsAValiderDG: 5,
        engagementsAValiderDGMontant: 1500000,
        ordonnancementsASignerDG: 2,
        ordonnancementsASignerDGMontant: 800000,
      });
      expect(result.corbeille).toHaveLength(6);
      expect(result.pendingDGActions).toBe(2 + 3 + 1 + 4 + 5 + 2);
      expect(result.pendingDGMontant).toBe(100000 + 200000 + 500000 + 3000000 + 1500000 + 800000);
    });

    it('exclut les categories a 0', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 0,
        notesSEFMontant: 0,
        notesAEFAValider: 0,
        notesAEFMontant: 0,
        imputationsAValiderDG: 3,
        imputationsAValiderDGMontant: 750000,
        marchesAApprouver: 0,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 0,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 1,
        ordonnancementsASignerDGMontant: 200000,
      });
      expect(result.corbeille).toHaveLength(2);
      expect(result.corbeille.map((c) => c.key)).toEqual(['imputations', 'ordonnancements']);
      expect(result.pendingDGActions).toBe(4);
    });

    it('les liens sont corrects pour chaque catégorie', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 1,
        notesSEFMontant: 0,
        notesAEFAValider: 1,
        notesAEFMontant: 0,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 1,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 1,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 1,
        ordonnancementsASignerDGMontant: 0,
      });

      const links = Object.fromEntries(result.corbeille.map((c) => [c.key, c.link]));
      expect(links.notes_sef).toBe('/notes-sef?statut=soumis');
      expect(links.notes_aef).toBe('/notes-aef?statut=soumis');
      expect(links.imputations).toBe('/execution/imputation?statut=vise');
      expect(links.marches).toBe('/execution/passation-marche/approbation');
      expect(links.engagements).toBe('/engagements?statut=visa_daaf');
      expect(links.ordonnancements).toBe('/ordonnancements?statut=en_signature');
    });

    it('les actions sont correctes (Valider, Approuver, Signer)', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 1,
        notesSEFMontant: 0,
        notesAEFAValider: 1,
        notesAEFMontant: 0,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 1,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 1,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 1,
        ordonnancementsASignerDGMontant: 0,
      });

      const actions = Object.fromEntries(result.corbeille.map((c) => [c.key, c.action]));
      expect(actions.notes_sef).toBe('Valider');
      expect(actions.notes_aef).toBe('Valider');
      expect(actions.imputations).toBe('Valider');
      expect(actions.marches).toBe('Approuver');
      expect(actions.engagements).toBe('Valider');
      expect(actions.ordonnancements).toBe('Signer');
    });
  });

  describe('Filtrage par statut pour le DG', () => {
    const engagements = [
      { id: '1', statut: 'soumis', montant: 100 },
      { id: '2', statut: 'visa_saf', montant: 200 },
      { id: '3', statut: 'visa_cb', montant: 300 },
      { id: '4', statut: 'visa_daaf', montant: 400 },
      { id: '5', statut: 'visa_daaf', montant: 500 },
      { id: '6', statut: 'valide', montant: 600 },
    ];

    it('filtre les engagements visa_daaf pour le DG', () => {
      const result = filterByStatut(engagements, ['visa_daaf']);
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.montant)).toEqual([400, 500]);
    });

    it('ne retourne PAS soumis/visa_saf/visa_cb au DG', () => {
      const result = filterByStatut(engagements, ['visa_daaf']);
      expect(result.every((e) => e.statut === 'visa_daaf')).toBe(true);
    });

    const imputations = [
      { id: '1', statut: 'soumis', montant: 100 },
      { id: '2', statut: 'vise', montant: 200 },
      { id: '3', statut: 'vise', montant: 300 },
      { id: '4', statut: 'valide', montant: 400 },
      { id: '5', statut: 'rejete', montant: 500 },
    ];

    it('filtre les imputations visées (vise) pour le DG', () => {
      const result = filterByStatut(imputations, ['vise']);
      expect(result).toHaveLength(2);
      expect(result.reduce((s, i) => s + i.montant, 0)).toBe(500);
    });

    it('ne retourne PAS soumis au DG (attente visa CB, pas DG)', () => {
      const result = filterByStatut(imputations, ['vise']);
      expect(result.every((i) => i.statut !== 'soumis')).toBe(true);
    });

    const ordonnancements = [
      { id: '1', statut: 'soumis', montant: 100 },
      { id: '2', statut: 'en_attente', montant: 200 },
      { id: '3', statut: 'en_signature', montant: 300 },
      { id: '4', statut: 'en_signature', montant: 400 },
      { id: '5', statut: 'signe', montant: 500 },
    ];

    it('filtre les ordonnancements en_signature pour le DG', () => {
      const result = filterByStatut(ordonnancements, ['en_signature']);
      expect(result).toHaveLength(2);
    });
  });

  describe('Calculs pendingDGActions', () => {
    it('somme correcte avec des valeurs mixtes', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 10,
        notesSEFMontant: 0,
        notesAEFAValider: 5,
        notesAEFMontant: 0,
        imputationsAValiderDG: 3,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 2,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 7,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 4,
        ordonnancementsASignerDGMontant: 0,
      });
      expect(result.pendingDGActions).toBe(31);
    });

    it('montant total correct', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 1,
        notesSEFMontant: 1000000,
        notesAEFAValider: 1,
        notesAEFMontant: 2000000,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 3000000,
        marchesAApprouver: 0,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 1,
        engagementsAValiderDGMontant: 5000000,
        ordonnancementsASignerDG: 0,
        ordonnancementsASignerDGMontant: 0,
      });
      expect(result.pendingDGMontant).toBe(11000000);
    });
  });

  describe('Couleurs et icônes corbeille', () => {
    it('chaque catégorie a une couleur unique', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 1,
        notesSEFMontant: 0,
        notesAEFAValider: 1,
        notesAEFMontant: 0,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 1,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 1,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 1,
        ordonnancementsASignerDGMontant: 0,
      });

      const colors = result.corbeille.map((c) => c.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(6);
    });

    it('chaque catégorie a une icône non vide', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 1,
        notesSEFMontant: 0,
        notesAEFAValider: 1,
        notesAEFMontant: 0,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 1,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 1,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 1,
        ordonnancementsASignerDGMontant: 0,
      });

      result.corbeille.forEach((c) => {
        expect(c.icon).toBeTruthy();
        expect(c.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Ordre de la corbeille', () => {
    it('respecte ordre chaine depense (SEF, AEF, IMP, PM, ENG, ORD)', () => {
      const result = buildCorbeilleDG({
        notesSEFAValider: 1,
        notesSEFMontant: 0,
        notesAEFAValider: 1,
        notesAEFMontant: 0,
        imputationsAValiderDG: 1,
        imputationsAValiderDGMontant: 0,
        marchesAApprouver: 1,
        marchesAApprouverMontant: 0,
        engagementsAValiderDG: 1,
        engagementsAValiderDGMontant: 0,
        ordonnancementsASignerDG: 1,
        ordonnancementsASignerDGMontant: 0,
      });

      const keys = result.corbeille.map((c) => c.key);
      expect(keys).toEqual([
        'notes_sef',
        'notes_aef',
        'imputations',
        'marches',
        'engagements',
        'ordonnancements',
      ]);
    });
  });
});
