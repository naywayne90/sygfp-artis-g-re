import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useExercice } from '@/contexts/ExerciceContext';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useExerciceWriteGuard } from '@/hooks/useExerciceWriteGuard';

export interface ImputationData {
  noteId: string;
  montant: number;
  // Rattachement programmatique
  os_id: string | null;
  mission_id: string | null;
  action_id: string | null;
  activite_id: string | null;
  sous_activite_id: string | null;
  direction_id: string | null;
  // Nomenclatures
  nbe_id: string | null;
  sysco_id: string | null;
  // Financement
  source_financement: string;
  // Justification si dépassement
  justification_depassement?: string;
  forcer_imputation?: boolean;
}

export interface BudgetAvailability {
  dotation_initiale: number;
  dotation_actuelle: number;
  virements_recus: number;
  virements_emis: number;
  engagements_anterieurs: number;
  montant_reserve: number;
  engagement_actuel: number;
  cumul: number;
  disponible: number;
  disponible_brut: number;
  disponible_net: number; // Après réservations
  is_sufficient: boolean;
  deficit?: number; // Montant du dépassement si insuffisant
  budget_line_id?: string;
  budget_line_code?: string;
  budget_line_label?: string;
}

export interface ImputationAuditEntry {
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, unknown>;
  new_values: Record<string, unknown>;
  justification?: string;
  timestamp: string;
}

export function useImputation() {
  const { exercice } = useExercice();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();
  const { isReadOnly, checkCanWrite, getDisabledMessage } = useExerciceWriteGuard();

  // Fetch notes validées à imputer
  const { data: notesAImputer = [], isLoading: loadingNotes } = useQuery({
    queryKey: ['notes-a-imputer', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_dg')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          created_by_profile:profiles!notes_dg_created_by_fkey(id, first_name, last_name)
        `
        )
        .eq('statut', 'a_imputer')
        .is('imputed_at', null)
        .eq('exercice', exercice || new Date().getFullYear())
        .order('validated_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Fetch notes imputées
  const { data: notesImputees = [], isLoading: loadingImputees } = useQuery({
    queryKey: ['notes-imputees', exercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_dg')
        .select(
          `
          *,
          direction:directions(id, label, sigle),
          budget_line:budget_lines(id, code, label, dotation_initiale),
          imputed_by_profile:profiles!notes_dg_imputed_by_fkey(id, first_name, last_name)
        `
        )
        .eq('statut', 'impute')
        .eq('exercice', exercice || new Date().getFullYear())
        .order('imputed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!exercice,
  });

  // Référentiels
  const { data: objectifsStrategiques = [] } = useQuery({
    queryKey: ['objectifs-strategiques-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('objectifs_strategiques')
        .select('id, code, libelle')
        .eq('est_actif', true)
        .order('code');
      if (error) throw error;
      return data;
    },
  });

  const { data: missions = [] } = useQuery({
    queryKey: ['missions-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, code, libelle')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data;
    },
  });

  const { data: directions = [] } = useQuery({
    queryKey: ['directions-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('directions')
        .select('id, code, label, sigle')
        .eq('est_active', true)
        .order('label');
      if (error) throw error;
      return data;
    },
  });

  // Fetch actions filtrées par mission et OS
  const fetchActions = async (missionId?: string, osId?: string) => {
    let query = supabase
      .from('actions')
      .select('id, code, libelle, mission_id, os_id')
      .eq('est_active', true)
      .order('code');

    if (missionId) query = query.eq('mission_id', missionId);
    if (osId) query = query.eq('os_id', osId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Fetch activités filtrées par action
  const fetchActivites = async (actionId?: string) => {
    let query = supabase
      .from('activites')
      .select('id, code, libelle, action_id')
      .eq('est_active', true)
      .order('code');

    if (actionId) query = query.eq('action_id', actionId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Fetch sous-activités filtrées par activité
  const fetchSousActivites = async (activiteId?: string) => {
    let query = supabase
      .from('sous_activites')
      .select('id, code, libelle, activite_id')
      .eq('est_active', true)
      .order('code');

    if (activiteId) query = query.eq('activite_id', activiteId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  // Fetch NBE
  const { data: nomenclaturesNBE = [] } = useQuery({
    queryKey: ['nomenclature-nbe-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomenclature_nbe')
        .select('id, code, libelle, niveau')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data;
    },
  });

  // Fetch SYSCO
  const { data: planComptableSYSCO = [] } = useQuery({
    queryKey: ['plan-comptable-sysco-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_comptable_sysco')
        .select('id, code, libelle, type')
        .eq('est_active', true)
        .order('code');
      if (error) throw error;
      return data as { id: string; code: string; libelle: string; type: string | null }[];
    },
  });

  // Calculer le disponible budgétaire avec réservations
  const calculateAvailability = async (params: {
    direction_id?: string | null;
    os_id?: string | null;
    mission_id?: string | null;
    action_id?: string | null;
    activite_id?: string | null;
    sous_activite_id?: string | null;
    nbe_id?: string | null;
    sysco_id?: string | null;
    montant_actuel: number;
  }): Promise<BudgetAvailability> => {
    // Trouver la ligne budgétaire correspondante
    let query = supabase
      .from('budget_lines')
      .select(
        'id, code, label, dotation_initiale, dotation_modifiee, total_engage, montant_reserve'
      )
      .eq('exercice', exercice || new Date().getFullYear())
      .eq('is_active', true);

    // Appliquer les filtres de rattachement
    if (params.direction_id) query = query.eq('direction_id', params.direction_id);
    if (params.os_id) query = query.eq('os_id', params.os_id);
    if (params.mission_id) query = query.eq('mission_id', params.mission_id);
    if (params.action_id) query = query.eq('action_id', params.action_id);
    if (params.activite_id) query = query.eq('activite_id', params.activite_id);
    if (params.sous_activite_id) query = query.eq('sous_activite_id', params.sous_activite_id);
    if (params.nbe_id) query = query.eq('nbe_id', params.nbe_id);
    if (params.sysco_id) query = query.eq('sysco_id', params.sysco_id);

    const { data: lines, error } = await query;
    if (error) throw error;

    if (!lines || lines.length === 0) {
      return {
        dotation_initiale: 0,
        dotation_actuelle: 0,
        virements_recus: 0,
        virements_emis: 0,
        engagements_anterieurs: 0,
        montant_reserve: 0,
        engagement_actuel: params.montant_actuel,
        cumul: params.montant_actuel,
        disponible: -params.montant_actuel,
        disponible_brut: -params.montant_actuel,
        disponible_net: -params.montant_actuel,
        is_sufficient: false,
        deficit: params.montant_actuel,
      };
    }

    // Prendre la première ligne correspondante (ou sommer si plusieurs)
    const lineIds = lines.map((l) => l.id);
    const primaryLine = lines[0];

    // Calculer les virements pour dotation actuelle
    const { data: virementsRecusData } = await supabase
      .from('credit_transfers')
      .select('amount')
      .in('to_budget_line_id', lineIds)
      .eq('status', 'execute');

    const { data: virementsEmisData } = await supabase
      .from('credit_transfers')
      .select('amount')
      .in('from_budget_line_id', lineIds)
      .eq('status', 'execute');

    const totalRecus = virementsRecusData?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;
    const totalEmis = virementsEmisData?.reduce((sum, v) => sum + (v.amount || 0), 0) || 0;

    // Sommer les dotations de toutes les lignes correspondantes
    const dotation_initiale = lines.reduce((sum, l) => sum + (l.dotation_initiale || 0), 0);
    const dotation_actuelle = dotation_initiale + totalRecus - totalEmis;
    const engagements_anterieurs = lines.reduce((sum, l) => sum + (l.total_engage || 0), 0);
    const montant_reserve = lines.reduce((sum, l) => sum + (l.montant_reserve || 0), 0);
    const engagement_actuel = params.montant_actuel;
    const cumul = engagements_anterieurs + engagement_actuel;
    const disponible = dotation_actuelle - engagements_anterieurs;
    const disponible_brut = disponible;
    const disponible_net = disponible - montant_reserve - engagement_actuel;
    const is_sufficient = disponible_net >= 0;
    const deficit = is_sufficient ? 0 : Math.abs(disponible_net);

    return {
      dotation_initiale,
      dotation_actuelle,
      virements_recus: totalRecus,
      virements_emis: totalEmis,
      engagements_anterieurs,
      montant_reserve,
      engagement_actuel,
      cumul,
      disponible,
      disponible_brut,
      disponible_net,
      is_sufficient,
      deficit,
      budget_line_id: primaryLine.id,
      budget_line_code: primaryLine.code,
      budget_line_label: primaryLine.label,
    };
  };

  // Créer ou trouver la ligne budgétaire appropriée
  const findOrCreateBudgetLine = async (data: ImputationData): Promise<string> => {
    // Chercher une ligne existante
    let query = supabase
      .from('budget_lines')
      .select('id')
      .eq('exercice', exercice || new Date().getFullYear())
      .eq('is_active', true);

    if (data.direction_id) query = query.eq('direction_id', data.direction_id);
    if (data.os_id) query = query.eq('os_id', data.os_id);
    if (data.mission_id) query = query.eq('mission_id', data.mission_id);
    if (data.action_id) query = query.eq('action_id', data.action_id);
    if (data.activite_id) query = query.eq('activite_id', data.activite_id);
    if (data.sous_activite_id) query = query.eq('sous_activite_id', data.sous_activite_id);
    if (data.nbe_id) query = query.eq('nbe_id', data.nbe_id);
    if (data.sysco_id) query = query.eq('sysco_id', data.sysco_id);

    const { data: existingLines } = await query.limit(1);

    if (existingLines && existingLines.length > 0) {
      return existingLines[0].id;
    }

    // Créer une nouvelle ligne si nécessaire
    const { data: newLine, error } = await supabase
      .from('budget_lines')
      .insert({
        code: `AUTO-${Date.now()}`,
        label: 'Ligne créée automatiquement',
        level: 'ligne',
        exercice: exercice || new Date().getFullYear(),
        dotation_initiale: 0,
        direction_id: data.direction_id,
        os_id: data.os_id,
        mission_id: data.mission_id,
        action_id: data.action_id,
        activite_id: data.activite_id,
        sous_activite_id: data.sous_activite_id,
        nbe_id: data.nbe_id,
        sysco_id: data.sysco_id,
        source_financement: data.source_financement,
        statut: 'valide',
      })
      .select()
      .single();

    if (error) throw error;
    return newLine.id;
  };

  // Vérifier si une AEF est déjà imputée
  const checkAlreadyImputed = async (noteAefId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('imputations')
      .select('id')
      .eq('note_aef_id', noteAefId)
      .eq('statut', 'active')
      .maybeSingle();

    if (error) {
      console.error('Erreur vérification imputation:', error);
      return false;
    }
    return !!data;
  };

  // Mutation pour imputer une note
  const imputeMutation = useMutation({
    mutationFn: async (data: ImputationData) => {
      // Vérifier que l'exercice est ouvert
      if (isReadOnly) {
        throw new Error("L'exercice est clôturé. Aucune imputation n'est possible.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier que l'AEF n'est pas déjà imputée
      const alreadyImputed = await checkAlreadyImputed(data.noteId);
      if (alreadyImputed) {
        throw new Error(
          'Cette note AEF a déjà été imputée. Une seule imputation par note est autorisée.'
        );
      }

      // Vérifier la disponibilité budgétaire
      const availability = await calculateAvailability({
        direction_id: data.direction_id,
        os_id: data.os_id,
        mission_id: data.mission_id,
        action_id: data.action_id,
        activite_id: data.activite_id,
        sous_activite_id: data.sous_activite_id,
        nbe_id: data.nbe_id,
        sysco_id: data.sysco_id,
        montant_actuel: data.montant,
      });

      if (!availability.is_sufficient && !data.forcer_imputation) {
        throw new Error(
          `BLOCAGE: Disponible net insuffisant (${availability.disponible_net.toLocaleString('fr-FR')} FCFA). ` +
            `Montant demandé: ${data.montant.toLocaleString('fr-FR')} FCFA. ` +
            `Déficit: ${availability.deficit?.toLocaleString('fr-FR')} FCFA. ` +
            `Pour continuer, activez "Forcer l'imputation" et fournissez une justification obligatoire.`
        );
      }

      // Vérifier que la justification est fournie si forçage
      if (
        !availability.is_sufficient &&
        data.forcer_imputation &&
        (!data.justification_depassement || data.justification_depassement.trim().length < 10)
      ) {
        throw new Error(
          `Une justification détaillée (minimum 10 caractères) est obligatoire pour forcer une imputation ` +
            `avec dépassement budgétaire de ${availability.deficit?.toLocaleString('fr-FR')} FCFA.`
        );
      }

      // Trouver ou créer la ligne budgétaire
      const budgetLineId = await findOrCreateBudgetLine(data);

      // Récupérer la note pour créer le dossier
      const { data: note, error: noteError } = await supabase
        .from('notes_dg')
        .select('*, direction:directions(id, label, sigle)')
        .eq('id', data.noteId)
        .single();

      if (noteError) throw noteError;

      // Créer le dossier avec statut IMPUTE/READY_FOR_PASSATION
      // numero is auto-generated by DB trigger — provide empty placeholder for TS
      const dossierInsert = {
        numero: '',
        objet: note.objet,
        direction_id: data.direction_id || note.direction_id,
        montant_estime: data.montant,
        exercice: exercice || new Date().getFullYear(),
        created_by: user.id,
        etape_courante: 'imputation',
        statut_global: 'impute',
      };

      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .insert(dossierInsert)
        .select()
        .single();

      if (dossierError) throw dossierError;

      // Créer le mouvement de réservation budgétaire (bloquant)
      await supabase.from('budget_movements').insert({
        budget_line_id: budgetLineId,
        type_mouvement: 'reservation',
        montant: data.montant,
        sens: 'debit',
        disponible_avant: availability.disponible,
        disponible_apres: availability.disponible_net,
        reserve_avant: availability.montant_reserve,
        reserve_apres: availability.montant_reserve + data.montant,
        entity_type: 'imputation',
        entity_id: data.noteId,
        dossier_id: dossier.id,
        exercice: exercice || new Date().getFullYear(),
        motif: 'Réservation budgétaire - Imputation AEF',
        created_by: user.id,
        statut: 'valide',
      });

      // Mettre à jour montant_reserve sur la ligne budgétaire
      await supabase
        .from('budget_lines')
        .update({
          montant_reserve: (availability.montant_reserve || 0) + data.montant,
        })
        .eq('id', budgetLineId);

      // Créer l'étape d'imputation dans le dossier
      await supabase.from('dossier_etapes').insert({
        dossier_id: dossier.id as string,
        type_etape: 'imputation',
        entity_id: data.noteId,
        statut: 'valide',
        montant: data.montant,
        commentaire: data.justification_depassement || null,
        created_by: user.id,
      });

      // Créer l'enregistrement dans la table imputations
      const imputationCode = buildImputationCode(data);
      const { data: imputation, error: imputationError } = await supabase
        .from('imputations')
        .insert({
          note_aef_id: data.noteId,
          budget_line_id: budgetLineId,
          dossier_id: dossier.id,
          objet: note.objet,
          montant: data.montant,
          direction_id: data.direction_id || note.direction_id,
          os_id: data.os_id,
          mission_id: data.mission_id,
          action_id: data.action_id,
          activite_id: data.activite_id,
          sous_activite_id: data.sous_activite_id,
          nbe_id: data.nbe_id,
          sysco_id: data.sysco_id,
          source_financement: data.source_financement,
          code_imputation: imputationCode,
          justification_depassement: data.justification_depassement || null,
          forcer_imputation: data.forcer_imputation || false,
          exercice: exercice || new Date().getFullYear(),
          created_by: user.id,
        })
        .select()
        .single();

      if (imputationError) throw imputationError;

      // Mettre à jour la note avec l'imputation
      const { data: updatedNote, error: updateError } = await supabase
        .from('notes_dg')
        .update({
          statut: 'impute',
          budget_line_id: budgetLineId,
          imputed_by: user.id,
          imputed_at: new Date().toISOString(),
        })
        .eq('id', data.noteId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Logger l'action avec détails complets pour l'audit
      await logAction({
        entityType: 'imputation',
        entityId: imputation.id,
        action: data.forcer_imputation ? 'impute_forced' : 'create',
        module: 'imputation',
        entityCode: imputationCode,
        resume: `Imputation ${imputationCode} - ${data.montant.toLocaleString('fr-FR')} FCFA`,
        newValues: {
          note_aef_id: data.noteId,
          note_numero: note.numero,
          budget_line_id: budgetLineId,
          budget_line_code: availability.budget_line_code,
          dossier_id: dossier.id,
          dossier_numero: dossier.numero,
          montant: data.montant,
          imputation_code: imputationCode,
          forcer: data.forcer_imputation || false,
          // Détails budgétaires au moment de l'imputation
          budget_snapshot: {
            dotation_initiale: availability.dotation_initiale,
            dotation_actuelle: availability.dotation_actuelle,
            virements_recus: availability.virements_recus,
            virements_emis: availability.virements_emis,
            cumul_engage: availability.engagements_anterieurs,
            montant_reserve_avant: availability.montant_reserve,
            montant_reserve_apres: availability.montant_reserve + data.montant,
            disponible_avant: availability.disponible,
            disponible_apres: availability.disponible_net,
            is_sufficient: availability.is_sufficient,
            deficit: availability.deficit,
          },
          // Rattachement programmatique
          rattachement: {
            os_id: data.os_id,
            mission_id: data.mission_id,
            action_id: data.action_id,
            activite_id: data.activite_id,
            sous_activite_id: data.sous_activite_id,
            direction_id: data.direction_id,
          },
          // Nomenclatures
          nomenclatures: {
            nbe_id: data.nbe_id,
            sysco_id: data.sysco_id,
            source_financement: data.source_financement,
          },
        },
        justification: data.forcer_imputation ? data.justification_depassement : undefined,
      });

      // Logger également l'action sur le budget si dépassement forcé
      if (data.forcer_imputation) {
        await logAction({
          entityType: 'budget_line',
          entityId: budgetLineId,
          action: 'override_request',
          module: 'imputation',
          entityCode: availability.budget_line_code,
          resume: `Dépassement forcé de ${availability.deficit?.toLocaleString('fr-FR')} FCFA`,
          oldValues: {
            disponible_net: availability.disponible,
            montant_reserve: availability.montant_reserve,
          },
          newValues: {
            disponible_net: availability.disponible_net,
            montant_reserve: availability.montant_reserve + data.montant,
            deficit: availability.deficit,
            imputation_id: imputation.id,
          },
          justification: data.justification_depassement,
        });
      }

      return { note: updatedNote, dossier, imputation, budgetLineId, availability };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notes-a-imputer'] });
      queryClient.invalidateQueries({ queryKey: ['notes-imputees'] });
      queryClient.invalidateQueries({ queryKey: ['budget-lines'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      toast({
        title: 'Imputation réussie',
        description: `Dossier ${result.dossier.numero} créé. Disponible: ${result.availability.disponible.toLocaleString('fr-FR')} FCFA`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'imputation",
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Construire le code d'imputation complet
  // Format: [OS]-[Action]-[Activité]-[Sous-Activité]-[NBE]-[SYSCO]
  const buildImputationCode = (
    data: ImputationData,
    contextData?: {
      actionCode?: string;
      activiteCode?: string;
      sousActiviteCode?: string;
    }
  ): string => {
    const parts: string[] = [];

    // OS (Objectif Stratégique)
    if (data.os_id) {
      const os = objectifsStrategiques.find((o) => o.id === data.os_id);
      if (os) parts.push(os.code);
    }

    // Action (si fourni dans context ou récupéré dynamiquement)
    if (contextData?.actionCode) {
      parts.push(contextData.actionCode);
    }

    // Activité (si fourni dans context ou récupéré dynamiquement)
    if (contextData?.activiteCode) {
      parts.push(contextData.activiteCode);
    }

    // Sous-Activité (si fourni dans context)
    if (contextData?.sousActiviteCode) {
      parts.push(contextData.sousActiviteCode);
    }

    // NBE
    if (data.nbe_id) {
      const nbe = nomenclaturesNBE.find((n) => n.id === data.nbe_id);
      if (nbe) parts.push(nbe.code);
    }

    // SYSCO
    if (data.sysco_id && planComptableSYSCO.length > 0) {
      const sysco = planComptableSYSCO.find((s) => s.id === data.sysco_id);
      if (sysco) parts.push(sysco.code);
    }

    return parts.join('-') || 'N/A';
  };

  // Construire la chaîne d'imputation lisible pour affichage
  // Format: "# [OS: libellé] > [Action: libellé] > [Activité: libellé] > [Sous-Activité: libellé] | NBE: code | SYSCO: code"
  const buildImputationChainReadable = (
    data: ImputationData,
    contextData?: {
      actionCode?: string;
      actionLibelle?: string;
      activiteCode?: string;
      activiteLibelle?: string;
      sousActiviteCode?: string;
      sousActiviteLibelle?: string;
    }
  ): {
    code: string;
    readable: string;
    segments: {
      type: string;
      code: string;
      libelle: string;
    }[];
  } => {
    const segments: { type: string; code: string; libelle: string }[] = [];

    // OS
    if (data.os_id) {
      const os = objectifsStrategiques.find((o) => o.id === data.os_id);
      if (os) {
        segments.push({ type: 'OS', code: os.code, libelle: os.libelle });
      }
    }

    // Action
    if (contextData?.actionCode && contextData?.actionLibelle) {
      segments.push({
        type: 'Action',
        code: contextData.actionCode,
        libelle: contextData.actionLibelle,
      });
    }

    // Activité
    if (contextData?.activiteCode && contextData?.activiteLibelle) {
      segments.push({
        type: 'Activité',
        code: contextData.activiteCode,
        libelle: contextData.activiteLibelle,
      });
    }

    // Sous-Activité
    if (contextData?.sousActiviteCode && contextData?.sousActiviteLibelle) {
      segments.push({
        type: 'Sous-Activité',
        code: contextData.sousActiviteCode,
        libelle: contextData.sousActiviteLibelle,
      });
    }

    // NBE
    if (data.nbe_id) {
      const nbe = nomenclaturesNBE.find((n) => n.id === data.nbe_id);
      if (nbe) {
        segments.push({ type: 'NBE', code: nbe.code, libelle: nbe.libelle });
      }
    }

    // SYSCO
    if (data.sysco_id && planComptableSYSCO.length > 0) {
      const sysco = planComptableSYSCO.find((s) => s.id === data.sysco_id);
      if (sysco) {
        segments.push({ type: 'SYSCO', code: sysco.code, libelle: sysco.libelle });
      }
    }

    // Construire le code compact
    const code = segments.map((s) => s.code).join('-') || 'N/A';

    // Construire la chaîne lisible
    const programmaticParts = segments
      .filter((s) => ['OS', 'Action', 'Activité', 'Sous-Activité'].includes(s.type))
      .map((s) => `[${s.type}: ${s.code}]`)
      .join(' > ');

    const nomenclatureParts = segments
      .filter((s) => ['NBE', 'SYSCO'].includes(s.type))
      .map((s) => `${s.type}: ${s.code}`)
      .join(' | ');

    const readable = programmaticParts
      ? nomenclatureParts
        ? `# ${programmaticParts} | ${nomenclatureParts}`
        : `# ${programmaticParts}`
      : nomenclatureParts
        ? `# ${nomenclatureParts}`
        : 'N/A';

    return { code, readable, segments };
  };

  return {
    notesAImputer,
    notesImputees,
    loadingNotes,
    loadingImputees,
    // Référentiels
    objectifsStrategiques,
    missions,
    directions,
    nomenclaturesNBE,
    planComptableSYSCO,
    // Fonctions de récupération dynamique
    fetchActions,
    fetchActivites,
    fetchSousActivites,
    // Calculs
    calculateAvailability,
    buildImputationCode,
    buildImputationChainReadable,
    // Vérification
    checkAlreadyImputed,
    // Protection exercice
    isReadOnly,
    checkCanWrite,
    getDisabledMessage,
    // Actions
    imputeNote: imputeMutation.mutateAsync,
    isImputing: imputeMutation.isPending,
  };
}
