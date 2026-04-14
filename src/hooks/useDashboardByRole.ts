/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';

// ─── Corbeille DG : chaque type d'action que le DG doit traiter ───
export interface CorbeilleDGItem {
  key: string;
  label: string;
  count: number;
  montant: number;
  action: string;
  link: string;
  color: string;
  icon: string; // nom icône Lucide (résolu côté composant)
}

// Stats pour le DG - Vue complète
export interface DGStats {
  budgetGlobal: number;
  budgetEngage: number;
  budgetLiquide: number;
  budgetOrdonnance: number;
  budgetPaye: number;
  tauxConsommation: number;
  topDirections: Array<{
    id: string;
    code: string;
    label: string;
    dotation: number;
    engage: number;
    tauxExecution: number;
  }>;
  dossiersEnCours: number;
  dossiersBloques: number;
  dossiersValides: number;
  dossiersSoldes: number;
  alertesDepassement: number;
  // ─── Actions DG spécifiques (corbeille) ───
  corbeille: CorbeilleDGItem[];
  pendingDGActions: number;
  pendingDGMontant: number;
  // Compteurs individuels pour rétro-compatibilité
  engagementsASigner: number;
  liquidationsASigner: number;
  ordonnancementsASigner: number;
  imputationsAValiderDG: number;
  marchesAApprouver: number;
  engagementsAValiderDG: number;
  // Pipeline complet (9 étapes)
  pipeline: {
    notesSEF: number;
    notesSEFAValider: number;
    notesAEF: number;
    notesAEFAValider: number;
    imputations: number;
    imputationsEnAttente: number;
    expressionsBesoin: number;
    marches: number;
    engagements: number;
    liquidations: number;
    ordonnancements: number;
    reglements: number;
  };
  // Délais de traitement
  delais: {
    moyenEngagement: number | null;
    moyenLiquidation: number | null;
    moyenOrdonnancement: number | null;
  };
  // Synthèse mensuelle
  synthèseMois: {
    dossiersTraites: number;
    montantValide: number;
    tauxValidation: number;
    // Détail dénominateur : total actions du mois (valide + rejeté + différé + annulé)
    totalActionsMois: number;
  };
  // Prestataires
  prestatairesActifs: number;
  // ─── Indicateurs réglementaires SYGFP (contexte CI / DGBF) ───
  // DGP = Délai Global de Paiement (engagement validé → règlement)
  // Seuils CI : 30j standard, 45j tolérance. Au-delà : intérêts moratoires 4,5%/an.
  dgp: {
    risque30j: number; // engagements valides depuis > 30j sans paiement
    critique45j: number; // engagements valides depuis > 45j sans paiement
    interetsMoratoiresEstimes: number; // estimation FCFA d'intérêts dus (4,5%/an pro rata)
  };
}

// Stats pour DAF/SDCT
export interface DAFStats {
  notesAImputer: number;
  notesTotales: number;
  engagementsAValider: number;
  engagementsEnValidation: number;
  engagementsValides: number;
  liquidationsAValider: number;
  depassementsBudgetaires: number;
  resteAEngager: number;
  resteALiquider: number;
  resteAPayer: number;
  montantEngageMois: number;
  montantLiquideMois: number;
}

// Stats pour SDPM
export interface SDPMStats {
  marchesEnCours: number;
  marchesSoumis: number;
  marchesEnValidation: number;
  marchesValides: number;
  expressionsBesoinAValider: number;
  expressionsBesoinEnCours: number;
  delaiMoyenMarche: number;
  topFournisseurs: Array<{
    id: string;
    nom: string;
    montantTotal: number;
    nombreMarches: number;
  }>;
  marchesMontantTotal: number;
}

// Stats pour Trésorerie
export interface TresorerieStats {
  ordresPayerEnAttente: number;
  ordresPayerMontant: number;
  reglementsDuJour: number;
  reglementsMontantJour: number;
  reglementsSemaine: number;
  reglementsMontantSemaine: number;
  previsionSorties7j: number;
  previsionSorties30j: number;
  soldeDisponible: number;
  reglementsPartiels: number;
}

export function useDGDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-dg', exercice],
    queryFn: async (): Promise<DGStats> => {
      // Budget global
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(
          `
          id, dotation_initiale, direction_id,
          directions(id, code, label)
        `
        )
        .eq('exercice', exercice);

      const budgetGlobal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;

      // Engagements
      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('id, montant, statut, budget_line_id, created_at, updated_at, dossier_id')
        .eq('exercice', exercice);

      const budgetEngage =
        engagements
          ?.filter((e) => e.statut === 'valide')
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Liquidations
      // Note : la table budget_liquidations n'a PAS de colonne `updated_at`.
      // La date de validation est exposée via `validated_at`.
      const { data: liquidations } = await supabase
        .from('budget_liquidations')
        .select('id, montant, statut, created_at, validated_at')
        .eq('exercice', exercice);

      const budgetLiquide =
        liquidations
          ?.filter((l) => l.statut === 'valide')
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Ordonnancements
      const { data: ordonnancements } = await supabase
        .from('ordonnancements')
        .select('id, montant, statut, created_at, updated_at')
        .eq('exercice', exercice);

      const budgetOrdonnance =
        ordonnancements
          ?.filter((o) => o.statut === 'valide')
          .reduce((sum, o) => sum + (o.montant || 0), 0) || 0;

      // Règlements (dossier_id requis pour le calcul DGP)
      const { data: reglements } = await supabase
        .from('reglements')
        .select('id, montant, statut, dossier_id')
        .eq('exercice', exercice);

      const budgetPaye =
        reglements
          ?.filter((r) => r.statut === 'valide' || r.statut === 'confirme')
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Top directions
      const directionStats = new Map<
        string,
        { code: string; label: string; dotation: number; engage: number }
      >();

      budgetLines?.forEach((bl) => {
        if (bl.direction_id && bl.directions) {
          const dir = bl.directions as any;
          const existing = directionStats.get(bl.direction_id) || {
            code: dir.code,
            label: dir.label,
            dotation: 0,
            engage: 0,
          };
          existing.dotation += bl.dotation_initiale || 0;
          directionStats.set(bl.direction_id, existing);
        }
      });

      engagements
        ?.filter((e) => e.statut === 'valide')
        .forEach((eng) => {
          const bl = budgetLines?.find((b) => b.id === eng.budget_line_id);
          if (bl?.direction_id) {
            const existing = directionStats.get(bl.direction_id);
            if (existing) {
              existing.engage += eng.montant || 0;
            }
          }
        });

      const topDirections = Array.from(directionStats.entries())
        .map(([id, stats]) => ({
          id,
          ...stats,
          tauxExecution: stats.dotation > 0 ? Math.round((stats.engage / stats.dotation) * 100) : 0,
        }))
        .sort((a, b) => b.dotation - a.dotation)
        .slice(0, 5);

      // Dossiers
      const { data: dossiers } = await supabase
        .from('dossiers')
        .select('id, statut_global')
        .eq('exercice', exercice);

      const dossiersEnCours =
        dossiers?.filter((d) => d.statut_global === 'en_cours' || d.statut_global === 'soumis')
          .length || 0;

      const dossiersBloques =
        dossiers?.filter((d) => d.statut_global === 'differe' || d.statut_global === 'rejete')
          .length || 0;

      const dossiersValides = dossiers?.filter((d) => d.statut_global === 'valide').length || 0;
      const dossiersSoldes = dossiers?.filter((d) => d.statut_global === 'solde').length || 0;

      // Alertes dépassement
      let alertesDepassement = 0;
      budgetLines?.forEach((bl) => {
        const engageForLine =
          engagements
            ?.filter((e) => e.budget_line_id === bl.id && e.statut === 'valide')
            .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
        if (engageForLine > bl.dotation_initiale) {
          alertesDepassement++;
        }
      });

      // Engagements à signer (statut soumis ou en_validation pour signature DG)
      const engagementsASigner =
        engagements?.filter((e) => e.statut === 'soumis' || e.statut === 'en_validation').length ||
        0;

      // Liquidations à signer
      const liquidationsASigner =
        liquidations?.filter((l) => l.statut === 'soumis' || l.statut === 'en_validation').length ||
        0;

      // Ordonnancements à signer
      const ordonnancementsASigner =
        ordonnancements?.filter((o) => o.statut === 'soumis' || o.statut === 'en_signature')
          .length || 0;

      // ===== Pipeline complet (9 étapes) =====
      // Paralléliser les requêtes indépendantes pour la performance
      const [
        notesSEFRes,
        notesAEFRes,
        imputationsRes,
        expressionsRes,
        marchesRes,
        prestatairesRes,
        // Synthèse mensuelle
        logsMoisRes,
      ] = await Promise.all([
        supabase.from('notes_sef').select('id, statut, montant_estime').eq('exercice', exercice),
        supabase.from('notes_dg').select('id, statut, montant_estime').eq('exercice', exercice),
        supabase.from('imputations').select('id, statut, montant').eq('exercice', exercice),
        supabase.from('expressions_besoin').select('id').eq('exercice', exercice),
        supabase
          .from('passation_marche')
          .select('id, statut, montant_retenu')
          .eq('exercice', exercice),
        supabase.from('prestataires').select('id').eq('statut', 'actif'),
        // Logs de validation du mois en cours (table logs_actions, actions en MAJUSCULES)
        supabase
          .from('logs_actions')
          .select('id, action')
          .in('action', ['VALIDATE', 'APPROVE', 'SIGN', 'REJECT', 'DEFER', 'CANCEL'])
          .gte(
            'created_at',
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          ),
      ]);

      const notesSEF = notesSEFRes.data || [];
      const notesAEF = notesAEFRes.data || [];
      const imputationsData = imputationsRes.data || [];
      const expressions = expressionsRes.data || [];
      const marchesData = marchesRes.data || [];
      const prestataires = prestatairesRes.data || [];
      const logsMois = logsMoisRes.data || [];

      const notesSEFTotal = notesSEF.length;
      const notesSEFAValider = notesSEF.filter(
        (n) => n.statut === 'soumis' || n.statut === 'en_validation'
      ).length;
      const notesSEFMontant = notesSEF
        .filter((n) => n.statut === 'soumis' || n.statut === 'en_validation')
        .reduce((s, n) => s + (((n as Record<string, unknown>).montant_estime as number) || 0), 0);

      const notesAEFTotal = notesAEF.length;
      const notesAEFAValider = notesAEF.filter(
        (n) => n.statut === 'soumis' || n.statut === 'en_validation'
      ).length;
      const notesAEFMontant = notesAEF
        .filter((n) => n.statut === 'soumis' || n.statut === 'en_validation')
        .reduce((s, n) => s + (((n as Record<string, unknown>).montant_estime as number) || 0), 0);

      // Imputations — DG valide celles visées par le CB (statut = 'vise')
      const imputationsTotal = imputationsData.length;
      const imputationsVise = imputationsData.filter((i) => i.statut === 'vise');
      const imputationsAValiderDG = imputationsVise.length;
      const imputationsAValiderDGMontant = imputationsVise.reduce(
        (s, i) => s + (i.montant || 0),
        0
      );
      const imputationsEnAttente = imputationsData.filter(
        (i) => i.statut === 'soumis' || i.statut === 'vise'
      ).length;

      // Passation Marchés — DG approuve les marchés attribués
      // Note: le montant_retenu (attribué au soumissionnaire choisi) est
      // peuplé dès l'étape "attribue", ce qui est exactement ce qu'on veut ici.
      const marchesAttribue = marchesData.filter((m) => m.statut === 'attribue');
      const marchesAApprouver = marchesAttribue.length;
      const marchesAApprouverMontant = marchesAttribue.reduce(
        (s, m) => s + (((m as Record<string, unknown>).montant_retenu as number) || 0),
        0
      );

      // Engagements — DG valide après visa DAAF (statut = 'visa_daaf')
      const engagementsVisaDAF = engagements?.filter((e) => e.statut === 'visa_daaf') || [];
      const engagementsAValiderDG = engagementsVisaDAF.length;
      const engagementsAValiderDGMontant = engagementsVisaDAF.reduce(
        (s, e) => s + (e.montant || 0),
        0
      );

      // Ordonnancements — DG signe ceux en signature
      const ordoEnSignature = ordonnancements?.filter((o) => o.statut === 'en_signature') || [];
      const ordonnancementsASignerDG = ordoEnSignature.length;
      const ordonnancementsASignerDGMontant = ordoEnSignature.reduce(
        (s, o) => s + (o.montant || 0),
        0
      );

      // Synthèse mensuelle (actions en MAJUSCULES dans logs_actions)
      const dossiersTraitesMois = logsMois.filter(
        (l) => l.action === 'VALIDATE' || l.action === 'APPROVE' || l.action === 'SIGN'
      ).length;
      const totalActionsMois = logsMois.length;
      const tauxValidationMois =
        totalActionsMois > 0 ? Math.round((dossiersTraitesMois / totalActionsMois) * 100) : 0;

      // ===== Délais de traitement =====
      let totalDelaiEng = 0,
        countDelaiEng = 0;
      engagements
        ?.filter((e) => e.statut === 'valide')
        .forEach((e) => {
          if ((e as any).updated_at) {
            const creation = new Date((e as any).created_at);
            const validation = new Date((e as any).updated_at);
            const delai = Math.floor(
              (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (delai >= 0) {
              totalDelaiEng += delai;
              countDelaiEng++;
            }
          }
        });

      let totalDelaiLiq = 0,
        countDelaiLiq = 0;
      liquidations
        ?.filter((l) => l.statut === 'valide')
        .forEach((l) => {
          // budget_liquidations utilise `validated_at` (pas `updated_at`)
          const validatedAt = (l as Record<string, unknown>).validated_at as string | null;
          const createdAt = (l as Record<string, unknown>).created_at as string | null;
          if (validatedAt && createdAt) {
            const creation = new Date(createdAt);
            const validation = new Date(validatedAt);
            const delai = Math.floor(
              (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (delai >= 0) {
              totalDelaiLiq += delai;
              countDelaiLiq++;
            }
          }
        });

      let totalDelaiOrd = 0,
        countDelaiOrd = 0;
      ordonnancements
        ?.filter((o) => o.statut === 'valide')
        .forEach((o) => {
          if ((o as any).updated_at) {
            const creation = new Date((o as any).created_at);
            const validation = new Date((o as any).updated_at);
            const delai = Math.floor(
              (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (delai >= 0) {
              totalDelaiOrd += delai;
              countDelaiOrd++;
            }
          }
        });

      // ===== DGP — Délai Global de Paiement (réglementation CI) =====
      // Pour chaque engagement validé : compter ceux qui n'ont pas de règlement
      // associé (via dossier_id) et dont la date de validation dépasse 30/45j.
      // Intérêts moratoires estimés : 4,5% annuel pro rata sur montant × (jours - 45).
      const engagementsValidesPourDGP = engagements?.filter((e) => e.statut === 'valide') || [];
      const dossiersReglement = new Set(
        (reglements || [])
          .filter((r) => r.statut === 'paye' || r.statut === 'vise' || r.statut === 'enregistre')
          .map((r) => (r as Record<string, unknown>).dossier_id as string | null | undefined)
          .filter((d): d is string => !!d)
      );
      const nowMs = Date.now();
      let dgpRisque30 = 0;
      let dgpCritique45 = 0;
      let interetsMoratoiresEstimes = 0;
      engagementsValidesPourDGP.forEach((e) => {
        const refDate = (e as Record<string, unknown>).updated_at as string | undefined;
        const dossierId = (e as Record<string, unknown>).dossier_id as string | undefined;
        if (!refDate) return;
        if (dossierId && dossiersReglement.has(dossierId)) return; // déjà payé
        const joursEcoules = Math.floor((nowMs - new Date(refDate).getTime()) / 86_400_000);
        if (joursEcoules > 30) dgpRisque30++;
        if (joursEcoules > 45) {
          dgpCritique45++;
          const joursRetard = joursEcoules - 45;
          const montant = (e as Record<string, unknown>).montant as number | undefined;
          if (montant) {
            interetsMoratoiresEstimes += (montant * 0.045 * joursRetard) / 365;
          }
        }
      });

      // ─── Construction de la Corbeille DG ───
      const corbeille: CorbeilleDGItem[] = [];

      if (notesSEFAValider > 0) {
        corbeille.push({
          key: 'notes_sef',
          label: 'Notes SEF',
          count: notesSEFAValider,
          montant: notesSEFMontant,
          action: 'Valider',
          link: '/notes-sef?statut=soumis',
          color: 'blue',
          icon: 'FileText',
        });
      }
      if (notesAEFAValider > 0) {
        corbeille.push({
          key: 'notes_aef',
          label: 'Notes AEF',
          count: notesAEFAValider,
          montant: notesAEFMontant,
          action: 'Valider',
          link: '/notes-aef?statut=soumis',
          color: 'indigo',
          icon: 'FileSignature',
        });
      }
      if (imputationsAValiderDG > 0) {
        corbeille.push({
          key: 'imputations',
          label: 'Imputations',
          count: imputationsAValiderDG,
          montant: imputationsAValiderDGMontant,
          action: 'Valider',
          link: '/execution/imputation?statut=vise',
          color: 'cyan',
          icon: 'ClipboardCheck',
        });
      }
      if (marchesAApprouver > 0) {
        corbeille.push({
          key: 'marches',
          label: 'Marchés',
          count: marchesAApprouver,
          montant: marchesAApprouverMontant,
          action: 'Approuver',
          link: '/execution/passation-marche/approbation',
          color: 'emerald',
          icon: 'ShoppingCart',
        });
      }
      if (engagementsAValiderDG > 0) {
        corbeille.push({
          key: 'engagements',
          label: 'Engagements',
          count: engagementsAValiderDG,
          montant: engagementsAValiderDGMontant,
          action: 'Valider',
          link: '/engagements?statut=visa_daaf',
          color: 'green',
          icon: 'CreditCard',
        });
      }
      if (ordonnancementsASignerDG > 0) {
        corbeille.push({
          key: 'ordonnancements',
          label: 'Ordonnancements',
          count: ordonnancementsASignerDG,
          montant: ordonnancementsASignerDGMontant,
          action: 'Signer',
          link: '/ordonnancements?statut=en_signature',
          color: 'purple',
          icon: 'FileCheck',
        });
      }

      const pendingDGActions =
        notesSEFAValider +
        notesAEFAValider +
        imputationsAValiderDG +
        marchesAApprouver +
        engagementsAValiderDG +
        ordonnancementsASignerDG;

      const pendingDGMontant =
        notesSEFMontant +
        notesAEFMontant +
        imputationsAValiderDGMontant +
        marchesAApprouverMontant +
        engagementsAValiderDGMontant +
        ordonnancementsASignerDGMontant;

      return {
        budgetGlobal,
        budgetEngage,
        budgetLiquide,
        budgetOrdonnance,
        budgetPaye,
        tauxConsommation: budgetGlobal > 0 ? Math.round((budgetEngage / budgetGlobal) * 100) : 0,
        topDirections,
        dossiersEnCours,
        dossiersBloques,
        dossiersValides,
        dossiersSoldes,
        alertesDepassement,
        // Corbeille DG
        corbeille,
        pendingDGActions,
        pendingDGMontant,
        // Compteurs individuels
        engagementsASigner,
        liquidationsASigner,
        ordonnancementsASigner: ordonnancementsASignerDG,
        imputationsAValiderDG,
        marchesAApprouver,
        engagementsAValiderDG,
        pipeline: {
          notesSEF: notesSEFTotal,
          notesSEFAValider,
          notesAEF: notesAEFTotal,
          notesAEFAValider,
          imputations: imputationsTotal,
          imputationsEnAttente,
          expressionsBesoin: expressions.length,
          marches: marchesData.length,
          engagements: engagements?.length || 0,
          liquidations: liquidations?.length || 0,
          ordonnancements: ordonnancements?.length || 0,
          reglements: reglements?.length || 0,
        },
        delais: {
          moyenEngagement: countDelaiEng > 0 ? Math.round(totalDelaiEng / countDelaiEng) : null,
          moyenLiquidation: countDelaiLiq > 0 ? Math.round(totalDelaiLiq / countDelaiLiq) : null,
          moyenOrdonnancement: countDelaiOrd > 0 ? Math.round(totalDelaiOrd / countDelaiOrd) : null,
        },
        synthèseMois: {
          dossiersTraites: dossiersTraitesMois,
          montantValide: engagementsAValiderDGMontant, // Approximation: on utilise le montant du mois
          tauxValidation: tauxValidationMois,
          totalActionsMois,
        },
        prestatairesActifs: prestataires.length,
        dgp: {
          risque30j: dgpRisque30,
          critique45j: dgpCritique45,
          interetsMoratoiresEstimes: Math.round(interetsMoratoiresEstimes),
        },
      };
    },
    enabled: !!exercice,
    staleTime: 30_000,
    refetchInterval: 60_000, // Rafraîchir chaque minute
  });
}

export function useDAFDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-daf', exercice],
    queryFn: async (): Promise<DAFStats> => {
      // Notes
      const { data: notes } = await supabase
        .from('notes_dg')
        .select('id, statut')
        .eq('exercice', exercice);

      const notesAImputer = notes?.filter((n) => n.statut === 'valide' && !n.statut).length || 0;
      const notesTotales = notes?.length || 0;

      // Engagements
      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('id, statut, montant, created_at')
        .eq('exercice', exercice);

      const engagementsAValider = engagements?.filter((e) => e.statut === 'soumis').length || 0;
      const engagementsEnValidation =
        engagements?.filter((e) => e.statut === 'en_validation').length || 0;
      const engagementsValides = engagements?.filter((e) => e.statut === 'valide').length || 0;

      // Engagements du mois
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const montantEngageMois =
        engagements
          ?.filter((e) => e.statut === 'valide' && new Date(e.created_at) >= debutMois)
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;

      // Liquidations
      const { data: liquidations } = await supabase
        .from('budget_liquidations')
        .select('id, statut, montant, created_at')
        .eq('exercice', exercice);

      const liquidationsAValider = liquidations?.filter((l) => l.statut === 'soumis').length || 0;

      const montantLiquideMois =
        liquidations
          ?.filter((l) => l.statut === 'valide' && new Date(l.created_at) >= debutMois)
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Budget et restes
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select('id, dotation_initiale')
        .eq('exercice', exercice);

      const budgetTotal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      const totalEngage =
        engagements
          ?.filter((e) => e.statut === 'valide')
          .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
      const totalLiquide =
        liquidations
          ?.filter((l) => l.statut === 'valide')
          .reduce((sum, l) => sum + (l.montant || 0), 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from('reglements')
        .select('id, montant, statut')
        .eq('exercice', exercice);

      const totalPaye =
        reglements
          ?.filter((r) => r.statut === 'valide' || r.statut === 'confirme')
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Dépassements
      let depassementsBudgetaires = 0;
      budgetLines?.forEach((bl) => {
        const engageForLine =
          engagements
            ?.filter((e) => e.statut === 'valide')
            .reduce((sum, e) => sum + (e.montant || 0), 0) || 0;
        if (engageForLine > bl.dotation_initiale) depassementsBudgetaires++;
      });

      return {
        notesAImputer,
        notesTotales,
        engagementsAValider,
        engagementsEnValidation,
        engagementsValides,
        liquidationsAValider,
        depassementsBudgetaires,
        resteAEngager: budgetTotal - totalEngage,
        resteALiquider: totalEngage - totalLiquide,
        resteAPayer: totalLiquide - totalPaye,
        montantEngageMois,
        montantLiquideMois,
      };
    },
    enabled: !!exercice,
  });
}

export function useSDPMDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-sdpm', exercice],
    queryFn: async (): Promise<SDPMStats> => {
      // Marchés
      const { data: marches } = await supabase.from('marches').select(`
          id, statut, montant, created_at, date_signature,
          prestataires(id, raison_sociale)
        `);

      const marchesEnCours =
        marches?.filter((m) => m.statut === 'en_cours' || m.statut === 'en_execution').length || 0;
      const marchesSoumis = marches?.filter((m) => m.statut === 'soumis').length || 0;
      const marchesEnValidation =
        marches?.filter((m) => m.statut === 'soumis' || m.statut === 'en_validation').length || 0;
      const marchesValides =
        marches?.filter((m) => m.statut === 'valide' || m.statut === 'signe').length || 0;

      const marchesMontantTotal = marches?.reduce((sum, m) => sum + (m.montant || 0), 0) || 0;

      // Délai moyen (signature - création)
      let totalDelai = 0;
      let countDelai = 0;
      marches
        ?.filter((m) => m.date_signature)
        .forEach((m) => {
          const creation = new Date(m.created_at);
          const signature = new Date(m.date_signature!);
          const delaiJours = Math.floor(
            (signature.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (delaiJours > 0) {
            totalDelai += delaiJours;
            countDelai++;
          }
        });
      const delaiMoyenMarche = countDelai > 0 ? Math.round(totalDelai / countDelai) : 0;

      // Top fournisseurs
      const fournisseurStats = new Map<
        string,
        { nom: string; montantTotal: number; nombreMarches: number }
      >();
      marches
        ?.filter((m) => m.prestataires)
        .forEach((m) => {
          const presta = m.prestataires as any;
          if (presta?.id) {
            const existing = fournisseurStats.get(presta.id) || {
              nom: presta.raison_sociale,
              montantTotal: 0,
              nombreMarches: 0,
            };
            existing.montantTotal += m.montant || 0;
            existing.nombreMarches++;
            fournisseurStats.set(presta.id, existing);
          }
        });

      const topFournisseurs = Array.from(fournisseurStats.entries())
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.montantTotal - a.montantTotal)
        .slice(0, 5);

      // Expressions de besoin
      const { data: expressions } = await supabase
        .from('expressions_besoin')
        .select('id, statut')
        .eq('exercice', exercice);

      const expressionsBesoinAValider =
        expressions?.filter((e) => e.statut === 'soumis').length || 0;
      const expressionsBesoinEnCours =
        expressions?.filter((e) => e.statut === 'en_cours' || e.statut === 'soumis').length || 0;

      return {
        marchesEnCours,
        marchesSoumis,
        marchesEnValidation,
        marchesValides,
        expressionsBesoinAValider,
        expressionsBesoinEnCours,
        delaiMoyenMarche,
        topFournisseurs,
        marchesMontantTotal,
      };
    },
    enabled: !!exercice,
  });
}

// Stats pour Contrôleur Budgétaire (CB)
export interface ControleurStats {
  lignesCritiques: number; // >90% consommées
  lignesAlertes: number; // >80% consommées
  lignesSaines: number; // <80%
  totalLignes: number;
  engagementsAViser: number;
  engagementsEnCours: number;
  delaiMoyenEngagement: number | null; // en jours
  delaiMoyenLiquidation: number | null;
  anomaliesDetectees: number;
  montantEngage: number;
  montantDisponible: number;
  tauxConsommationGlobal: number;
  lignesCritiquesDetails: Array<{
    id: string;
    code: string;
    label: string;
    dotation: number;
    engage: number;
    tauxConsommation: number;
  }>;
  anomaliesDetails: Array<{
    type: string;
    description: string;
    entityId?: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  trackingEnabled: {
    delais: boolean;
    anomalies: boolean;
    alertes: boolean;
  };
}

function formatAmountInternal(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

export function useControleurDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-controleur', exercice],
    queryFn: async (): Promise<ControleurStats> => {
      // Budget lines avec leur consommation
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(
          `
          id, code, label, dotation_initiale,
          total_engage, total_liquide
        `
        )
        .eq('exercice', exercice)
        .eq('is_active', true);

      const totalLignes = budgetLines?.length || 0;
      let lignesCritiques = 0;
      let lignesAlertes = 0;
      let lignesSaines = 0;
      const lignesCritiquesDetails: ControleurStats['lignesCritiquesDetails'] = [];

      budgetLines?.forEach((bl) => {
        const dotation = bl.dotation_initiale || 0;
        const engage = bl.total_engage || 0;
        const tauxConsommation = dotation > 0 ? (engage / dotation) * 100 : 0;

        if (tauxConsommation >= 90) {
          lignesCritiques++;
          lignesCritiquesDetails.push({
            id: bl.id,
            code: bl.code,
            label: bl.label,
            dotation,
            engage,
            tauxConsommation: Math.round(tauxConsommation),
          });
        } else if (tauxConsommation >= 80) {
          lignesAlertes++;
        } else {
          lignesSaines++;
        }
      });

      // Trier les lignes critiques par taux décroissant
      lignesCritiquesDetails.sort((a, b) => b.tauxConsommation - a.tauxConsommation);

      // Engagements à viser
      const { data: engagements } = await supabase
        .from('budget_engagements')
        .select('id, statut, montant, created_at, updated_at')
        .eq('exercice', exercice);

      const engagementsAViser =
        engagements?.filter((e) => e.statut === 'soumis' || e.statut === 'en_validation').length ||
        0;

      const engagementsEnCours =
        engagements?.filter((e) => e.statut === 'en_cours' || e.statut === 'soumis').length || 0;

      const engagementsValides = engagements?.filter((e) => e.statut === 'valide') || [];
      const montantEngage = engagementsValides.reduce((sum, e) => sum + (e.montant || 0), 0);

      // Calcul délai moyen engagement (création -> mise à jour)
      let totalDelaiEng = 0;
      let countDelaiEng = 0;
      engagementsValides.forEach((e) => {
        if (e.updated_at) {
          const creation = new Date(e.created_at);
          const validation = new Date(e.updated_at);
          const delaiJours = Math.floor(
            (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (delaiJours >= 0) {
            totalDelaiEng += delaiJours;
            countDelaiEng++;
          }
        }
      });
      const delaiMoyenEngagement =
        countDelaiEng > 0 ? Math.round(totalDelaiEng / countDelaiEng) : null;

      // Liquidations pour délai moyen
      const { data: liquidations } = await supabase
        .from('budget_liquidations')
        .select('id, statut, created_at, validated_at, updated_at')
        .eq('exercice', exercice)
        .eq('statut', 'valide');

      let totalDelaiLiq = 0;
      let countDelaiLiq = 0;
      liquidations?.forEach((l) => {
        // Utiliser validated_at si disponible, sinon updated_at
        const item = l as any;
        const validationDate = item.validated_at || item.updated_at;
        if (validationDate) {
          const creation = new Date(item.created_at);
          const validation = new Date(validationDate);
          const delaiJours = Math.floor(
            (validation.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (delaiJours >= 0) {
            totalDelaiLiq += delaiJours;
            countDelaiLiq++;
          }
        }
      });
      const delaiMoyenLiquidation =
        countDelaiLiq > 0 ? Math.round(totalDelaiLiq / countDelaiLiq) : null;

      // Budget global
      const budgetTotal =
        budgetLines?.reduce((sum, bl) => sum + (bl.dotation_initiale || 0), 0) || 0;
      const montantDisponible = budgetTotal - montantEngage;
      const tauxConsommationGlobal =
        budgetTotal > 0 ? Math.round((montantEngage / budgetTotal) * 100) : 0;

      // Anomalies détectées (règles simplifiées)
      const anomaliesDetails: ControleurStats['anomaliesDetails'] = [];

      // Anomalie: Lignes avec engagement > dotation
      budgetLines?.forEach((bl) => {
        const dotation = bl.dotation_initiale || 0;
        const engage = bl.total_engage || 0;
        if (engage > dotation) {
          anomaliesDetails.push({
            type: 'DEPASSEMENT',
            description: `Ligne ${bl.code}: engagement (${formatAmountInternal(engage)}) dépasse la dotation (${formatAmountInternal(dotation)})`,
            entityId: bl.id,
            severity: 'critical',
          });
        }
      });

      // Anomalie: Engagements en attente depuis plus de 15 jours
      const il15Jours = new Date();
      il15Jours.setDate(il15Jours.getDate() - 15);
      engagements
        ?.filter(
          (e) =>
            (e.statut === 'soumis' || e.statut === 'en_validation') &&
            new Date(e.created_at) < il15Jours
        )
        .forEach(() => {
          anomaliesDetails.push({
            type: 'RETARD_VALIDATION',
            description: `Engagement en attente de validation depuis plus de 15 jours`,
            severity: 'warning',
          });
        });

      // Check tracking enabled (based on data availability)
      const trackingEnabled = {
        delais: countDelaiEng > 0 || countDelaiLiq > 0,
        anomalies: true, // Always check for anomalies
        alertes: lignesCritiques > 0 || lignesAlertes > 0,
      };

      return {
        lignesCritiques,
        lignesAlertes,
        lignesSaines,
        totalLignes,
        engagementsAViser,
        engagementsEnCours,
        delaiMoyenEngagement,
        delaiMoyenLiquidation,
        anomaliesDetectees: anomaliesDetails.length,
        montantEngage,
        montantDisponible,
        tauxConsommationGlobal,
        lignesCritiquesDetails: lignesCritiquesDetails.slice(0, 10), // Top 10
        anomaliesDetails,
        trackingEnabled,
      };
    },
    enabled: !!exercice,
  });
}

export function useTresorerieDashboard() {
  const { exercice } = useExercice();

  return useQuery({
    queryKey: ['dashboard-tresorerie', exercice],
    queryFn: async (): Promise<TresorerieStats> => {
      const now = new Date();
      const debutJour = new Date(now);
      debutJour.setHours(0, 0, 0, 0);

      const debutSemaine = new Date(now);
      debutSemaine.setDate(now.getDate() - 7);

      // Ordonnancements validés en attente de paiement
      const { data: ordosValides } = await supabase
        .from('ordonnancements')
        .select('id, montant, montant_paye')
        .eq('exercice', exercice)
        .eq('statut', 'valide');

      const ordresPayerEnAttente =
        ordosValides?.filter((o) => (o.montant_paye || 0) < (o.montant || 0)).length || 0;

      const ordresPayerMontant =
        ordosValides?.reduce((sum, o) => {
          const reste = (o.montant || 0) - (o.montant_paye || 0);
          return sum + (reste > 0 ? reste : 0);
        }, 0) || 0;

      // Règlements
      const { data: reglements } = await supabase
        .from('reglements')
        .select('id, montant, date_paiement, statut')
        .eq('exercice', exercice);

      const reglementsDuJour =
        reglements?.filter((r) => new Date(r.date_paiement) >= debutJour).length || 0;

      const reglementsMontantJour =
        reglements
          ?.filter((r) => new Date(r.date_paiement) >= debutJour)
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      const reglementsSemaine =
        reglements?.filter((r) => new Date(r.date_paiement) >= debutSemaine).length || 0;

      const reglementsMontantSemaine =
        reglements
          ?.filter((r) => new Date(r.date_paiement) >= debutSemaine)
          .reduce((sum, r) => sum + (r.montant || 0), 0) || 0;

      // Règlements partiels
      const reglementsPartiels =
        ordosValides?.filter(
          (o) => (o.montant_paye || 0) > 0 && (o.montant_paye || 0) < (o.montant || 0)
        ).length || 0;

      // Prévisions de sortie (ordonnancements validés avec date prévue)
      const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data: ordosAvecDate } = await supabase
        .from('ordonnancements')
        .select('id, montant, montant_paye, date_prevue_paiement')
        .eq('exercice', exercice)
        .eq('statut', 'valide')
        .not('date_prevue_paiement', 'is', null);

      const previsionSorties7j =
        ordosAvecDate
          ?.filter(
            (o) =>
              new Date(o.date_prevue_paiement!) <= dans7j &&
              (o.montant_paye || 0) < (o.montant || 0)
          )
          .reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0) || 0;

      const previsionSorties30j =
        ordosAvecDate
          ?.filter(
            (o) =>
              new Date(o.date_prevue_paiement!) <= dans30j &&
              (o.montant_paye || 0) < (o.montant || 0)
          )
          .reduce((sum, o) => sum + ((o.montant || 0) - (o.montant_paye || 0)), 0) || 0;

      // Solde disponible (simplifié - à remplacer par vraie logique trésorerie)
      const soldeDisponible = ordresPayerMontant * 0.8; // Placeholder

      return {
        ordresPayerEnAttente,
        ordresPayerMontant,
        reglementsDuJour,
        reglementsMontantJour,
        reglementsSemaine,
        reglementsMontantSemaine,
        previsionSorties7j,
        previsionSorties30j,
        soldeDisponible,
        reglementsPartiels,
      };
    },
    enabled: !!exercice,
  });
}
