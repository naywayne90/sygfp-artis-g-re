export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      actions: {
        Row: {
          code: string;
          created_at: string | null;
          date_modification: string | null;
          est_active: boolean | null;
          id: string;
          last_sync_at: string | null;
          last_sync_file: string | null;
          libelle: string;
          libelle_modifie: string | null;
          mission_id: string;
          os_id: string;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          date_modification?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle: string;
          libelle_modifie?: string | null;
          mission_id: string;
          os_id: string;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          date_modification?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle?: string;
          libelle_modifie?: string | null;
          mission_id?: string;
          os_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'actions_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'actions_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'actions_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
        ];
      };
      activites: {
        Row: {
          action_id: string;
          code: string;
          created_at: string | null;
          date_modification: string | null;
          est_active: boolean | null;
          id: string;
          last_sync_at: string | null;
          last_sync_file: string | null;
          libelle: string;
          libelle_modifie: string | null;
          updated_at: string | null;
        };
        Insert: {
          action_id: string;
          code: string;
          created_at?: string | null;
          date_modification?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle: string;
          libelle_modifie?: string | null;
          updated_at?: string | null;
        };
        Update: {
          action_id?: string;
          code?: string;
          created_at?: string | null;
          date_modification?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle?: string;
          libelle_modifie?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activites_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
        ];
      };
      affectations_notes: {
        Row: {
          affecte_par: string | null;
          commentaire: string | null;
          created_at: string | null;
          date_affectation: string | null;
          id: string;
          lu: boolean | null;
          lu_at: string | null;
          lu_par: string | null;
          note_sef_id: string;
          raison_affectation: string | null;
          service_destinataire_code: string | null;
          service_destinataire_id: string | null;
          service_destinataire_label: string | null;
          type_affectation: string | null;
          updated_at: string | null;
        };
        Insert: {
          affecte_par?: string | null;
          commentaire?: string | null;
          created_at?: string | null;
          date_affectation?: string | null;
          id?: string;
          lu?: boolean | null;
          lu_at?: string | null;
          lu_par?: string | null;
          note_sef_id: string;
          raison_affectation?: string | null;
          service_destinataire_code?: string | null;
          service_destinataire_id?: string | null;
          service_destinataire_label?: string | null;
          type_affectation?: string | null;
          updated_at?: string | null;
        };
        Update: {
          affecte_par?: string | null;
          commentaire?: string | null;
          created_at?: string | null;
          date_affectation?: string | null;
          id?: string;
          lu?: boolean | null;
          lu_at?: string | null;
          lu_par?: string | null;
          note_sef_id?: string;
          raison_affectation?: string | null;
          service_destinataire_code?: string | null;
          service_destinataire_id?: string | null;
          service_destinataire_label?: string | null;
          type_affectation?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affectations_notes_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          auto_generated: boolean | null;
          created_at: string;
          description: string | null;
          entity_code: string | null;
          entity_id: string | null;
          entity_table: string | null;
          id: string;
          metadata: Json | null;
          module: string | null;
          owner_role: string | null;
          resolution_comment: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          status: string;
          title: string;
          type: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          auto_generated?: boolean | null;
          created_at?: string;
          description?: string | null;
          entity_code?: string | null;
          entity_id?: string | null;
          entity_table?: string | null;
          id?: string;
          metadata?: Json | null;
          module?: string | null;
          owner_role?: string | null;
          resolution_comment?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          status?: string;
          title: string;
          type: string;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          auto_generated?: boolean | null;
          created_at?: string;
          description?: string | null;
          entity_code?: string | null;
          entity_id?: string | null;
          entity_table?: string | null;
          id?: string;
          metadata?: Json | null;
          module?: string | null;
          owner_role?: string | null;
          resolution_comment?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          status?: string;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alerts_acknowledged_by_fkey';
            columns: ['acknowledged_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alerts_acknowledged_by_fkey';
            columns: ['acknowledged_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alerts_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alerts_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      archived_documents: {
        Row: {
          category: string;
          created_at: string;
          date_document: string | null;
          description: string | null;
          entity_id: string | null;
          entity_type: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          fournisseur: string | null;
          id: string;
          montant: number | null;
          tags: string[] | null;
          uploaded_by: string | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          date_document?: string | null;
          description?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          fournisseur?: string | null;
          id?: string;
          montant?: number | null;
          tags?: string[] | null;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          date_document?: string | null;
          description?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          fournisseur?: string | null;
          id?: string;
          montant?: number | null;
          tags?: string[] | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'archived_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'archived_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      arti_reference_counters: {
        Row: {
          annee: number;
          dernier_numero: number;
          etape: number;
          id: string;
          mois: number;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number;
          etape: number;
          id?: string;
          mois: number;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number;
          etape?: number;
          id?: string;
          mois?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          categorie: string | null;
          code: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          emplacement: string | null;
          est_actif: boolean | null;
          id: string;
          libelle: string;
          prix_unitaire_moyen: number | null;
          seuil_mini: number | null;
          stock_actuel: number | null;
          unite: string;
          updated_at: string | null;
        };
        Insert: {
          categorie?: string | null;
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          emplacement?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle: string;
          prix_unitaire_moyen?: number | null;
          seuil_mini?: number | null;
          stock_actuel?: number | null;
          unite?: string;
          updated_at?: string | null;
        };
        Update: {
          categorie?: string | null;
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          emplacement?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle?: string;
          prix_unitaire_moyen?: number | null;
          seuil_mini?: number | null;
          stock_actuel?: number | null;
          unite?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'articles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'articles_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          exercice: number | null;
          id: string;
          ip_address: string | null;
          new_values: Json | null;
          old_values: Json | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          exercice?: number | null;
          id?: string;
          ip_address?: string | null;
          new_values?: Json | null;
          old_values?: Json | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          exercice?: number | null;
          id?: string;
          ip_address?: string | null;
          new_values?: Json | null;
          old_values?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      avenants: {
        Row: {
          contrat_id: string;
          created_at: string | null;
          created_by: string | null;
          date_signature: string | null;
          id: string;
          montant_modification: number | null;
          nouveau_delai: number | null;
          nouveau_montant: number | null;
          nouvelle_date_fin: string | null;
          numero_avenant: number;
          objet: string;
          statut: string | null;
          type_avenant: string;
          updated_at: string | null;
        };
        Insert: {
          contrat_id: string;
          created_at?: string | null;
          created_by?: string | null;
          date_signature?: string | null;
          id?: string;
          montant_modification?: number | null;
          nouveau_delai?: number | null;
          nouveau_montant?: number | null;
          nouvelle_date_fin?: string | null;
          numero_avenant: number;
          objet: string;
          statut?: string | null;
          type_avenant: string;
          updated_at?: string | null;
        };
        Update: {
          contrat_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          date_signature?: string | null;
          id?: string;
          montant_modification?: number | null;
          nouveau_delai?: number | null;
          nouveau_montant?: number | null;
          nouvelle_date_fin?: string | null;
          numero_avenant?: number;
          objet?: string;
          statut?: string | null;
          type_avenant?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'avenants_contrat_id_fkey';
            columns: ['contrat_id'];
            isOneToOne: false;
            referencedRelation: 'contrats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'avenants_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'avenants_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      budg_alert_rules: {
        Row: {
          actif: boolean;
          canal: string | null;
          created_at: string | null;
          description: string | null;
          destinataires_roles: string[] | null;
          destinataires_users: string[] | null;
          exercice: number | null;
          id: string;
          scope: string;
          seuil_pct: number;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean;
          canal?: string | null;
          created_at?: string | null;
          description?: string | null;
          destinataires_roles?: string[] | null;
          destinataires_users?: string[] | null;
          exercice?: number | null;
          id?: string;
          scope?: string;
          seuil_pct: number;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean;
          canal?: string | null;
          created_at?: string | null;
          description?: string | null;
          destinataires_roles?: string[] | null;
          destinataires_users?: string[] | null;
          exercice?: number | null;
          id?: string;
          scope?: string;
          seuil_pct?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      budg_alerts: {
        Row: {
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          context: Json | null;
          created_at: string | null;
          exercice: number;
          id: string;
          ligne_budgetaire_id: string | null;
          message: string;
          montant_disponible: number | null;
          montant_dotation: number | null;
          montant_engage: number | null;
          niveau: string;
          resolution_comment: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          rule_id: string | null;
          seuil_atteint: number;
          taux_actuel: number | null;
        };
        Insert: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          context?: Json | null;
          created_at?: string | null;
          exercice: number;
          id?: string;
          ligne_budgetaire_id?: string | null;
          message: string;
          montant_disponible?: number | null;
          montant_dotation?: number | null;
          montant_engage?: number | null;
          niveau?: string;
          resolution_comment?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          rule_id?: string | null;
          seuil_atteint: number;
          taux_actuel?: number | null;
        };
        Update: {
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          context?: Json | null;
          created_at?: string | null;
          exercice?: number;
          id?: string;
          ligne_budgetaire_id?: string | null;
          message?: string;
          montant_disponible?: number | null;
          montant_dotation?: number | null;
          montant_engage?: number | null;
          niveau?: string;
          resolution_comment?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          rule_id?: string | null;
          seuil_atteint?: number;
          taux_actuel?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budg_alerts_acknowledged_by_fkey';
            columns: ['acknowledged_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_acknowledged_by_fkey';
            columns: ['acknowledged_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budg_alerts_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budg_alerts_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budg_alerts_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_resolved_by_fkey';
            columns: ['resolved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budg_alerts_rule_id_fkey';
            columns: ['rule_id'];
            isOneToOne: false;
            referencedRelation: 'budg_alert_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_activities: {
        Row: {
          budget_line_id: string;
          code: string;
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          label: string;
          planned_amount: number;
          responsible_id: string | null;
          start_date: string | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          budget_line_id: string;
          code: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          label: string;
          planned_amount?: number;
          responsible_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          budget_line_id?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          label?: string;
          planned_amount?: number;
          responsible_id?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_activities_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_activities_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_activities_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_activities_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_activities_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_activities_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_activities_responsible_id_fkey';
            columns: ['responsible_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_activities_responsible_id_fkey';
            columns: ['responsible_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_code_sequences: {
        Row: {
          dernier_numero: number | null;
          direction_id: string | null;
          exercice: number;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          dernier_numero?: number | null;
          direction_id?: string | null;
          exercice: number;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          dernier_numero?: number | null;
          direction_id?: string | null;
          exercice?: number;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_code_sequences_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_code_sequences_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_code_sequences_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_code_sequences_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      budget_engagements: {
        Row: {
          budget_line_id: string;
          checklist_complete: boolean | null;
          checklist_verified_at: string | null;
          checklist_verified_by: string | null;
          code_locked: boolean | null;
          created_at: string;
          created_by: string | null;
          current_step: number | null;
          date_differe: string | null;
          date_engagement: string;
          date_entree_etape: string | null;
          deadline_correction: string | null;
          delai_validation_jours: number | null;
          differe_by: string | null;
          dossier_id: string | null;
          exercice: number | null;
          expression_besoin_id: string | null;
          fournisseur: string | null;
          id: string;
          legacy_import: boolean | null;
          marche_id: string | null;
          montant: number;
          montant_ht: number | null;
          motif_differe: string | null;
          note_id: string | null;
          numero: string;
          objet: string;
          passation_marche_id: string | null;
          project_id: string | null;
          required_documents: string[] | null;
          statut: string | null;
          tva: number | null;
          updated_at: string;
          workflow_status: string | null;
        };
        Insert: {
          budget_line_id: string;
          checklist_complete?: boolean | null;
          checklist_verified_at?: string | null;
          checklist_verified_by?: string | null;
          code_locked?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number | null;
          date_differe?: string | null;
          date_engagement?: string;
          date_entree_etape?: string | null;
          deadline_correction?: string | null;
          delai_validation_jours?: number | null;
          differe_by?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          expression_besoin_id?: string | null;
          fournisseur?: string | null;
          id?: string;
          legacy_import?: boolean | null;
          marche_id?: string | null;
          montant: number;
          montant_ht?: number | null;
          motif_differe?: string | null;
          note_id?: string | null;
          numero: string;
          objet: string;
          passation_marche_id?: string | null;
          project_id?: string | null;
          required_documents?: string[] | null;
          statut?: string | null;
          tva?: number | null;
          updated_at?: string;
          workflow_status?: string | null;
        };
        Update: {
          budget_line_id?: string;
          checklist_complete?: boolean | null;
          checklist_verified_at?: string | null;
          checklist_verified_by?: string | null;
          code_locked?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number | null;
          date_differe?: string | null;
          date_engagement?: string;
          date_entree_etape?: string | null;
          deadline_correction?: string | null;
          delai_validation_jours?: number | null;
          differe_by?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          expression_besoin_id?: string | null;
          fournisseur?: string | null;
          id?: string;
          legacy_import?: boolean | null;
          marche_id?: string | null;
          montant?: number;
          montant_ht?: number | null;
          motif_differe?: string | null;
          note_id?: string | null;
          numero?: string;
          objet?: string;
          passation_marche_id?: string | null;
          project_id?: string | null;
          required_documents?: string[] | null;
          statut?: string | null;
          tva?: number | null;
          updated_at?: string;
          workflow_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_engagements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_engagements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_engagements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_engagements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'budget_engagements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'budget_engagements_expression_besoin_id_fkey';
            columns: ['expression_besoin_id'];
            isOneToOne: false;
            referencedRelation: 'expressions_besoin';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_passation_marche_id_fkey';
            columns: ['passation_marche_id'];
            isOneToOne: false;
            referencedRelation: 'passation_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_engagements_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects_with_financial';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_history: {
        Row: {
          budget_line_id: string;
          commentaire: string | null;
          created_at: string;
          created_by: string | null;
          delta: number;
          disponible_apres: number | null;
          disponible_avant: number | null;
          dotation_apres: number | null;
          dotation_avant: number | null;
          event_type: string;
          id: string;
          ref_code: string | null;
          ref_id: string | null;
        };
        Insert: {
          budget_line_id: string;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          delta?: number;
          disponible_apres?: number | null;
          disponible_avant?: number | null;
          dotation_apres?: number | null;
          dotation_avant?: number | null;
          event_type: string;
          id?: string;
          ref_code?: string | null;
          ref_id?: string | null;
        };
        Update: {
          budget_line_id?: string;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          delta?: number;
          disponible_apres?: number | null;
          disponible_avant?: number | null;
          dotation_apres?: number | null;
          dotation_avant?: number | null;
          event_type?: string;
          id?: string;
          ref_code?: string | null;
          ref_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_history_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_history_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_imports: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          error_rows: number | null;
          errors: Json | null;
          exercice: number;
          file_name: string;
          file_size: number | null;
          id: string;
          imported_by: string | null;
          status: string | null;
          success_rows: number | null;
          total_rows: number | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          error_rows?: number | null;
          errors?: Json | null;
          exercice: number;
          file_name: string;
          file_size?: number | null;
          id?: string;
          imported_by?: string | null;
          status?: string | null;
          success_rows?: number | null;
          total_rows?: number | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          error_rows?: number | null;
          errors?: Json | null;
          exercice?: number;
          file_name?: string;
          file_size?: number | null;
          id?: string;
          imported_by?: string | null;
          status?: string | null;
          success_rows?: number | null;
          total_rows?: number | null;
        };
        Relationships: [];
      };
      budget_kpis: {
        Row: {
          activity_id: string;
          created_at: string;
          current_value: number | null;
          id: string;
          name: string;
          target_value: number;
          unit: string;
          updated_at: string;
          weight: number | null;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          current_value?: number | null;
          id?: string;
          name: string;
          target_value: number;
          unit: string;
          updated_at?: string;
          weight?: number | null;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          current_value?: number | null;
          id?: string;
          name?: string;
          target_value?: number;
          unit?: string;
          updated_at?: string;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_kpis_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'budget_activities';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_line_history: {
        Row: {
          budget_line_id: string;
          change_reason: string | null;
          changed_at: string;
          changed_by: string | null;
          field_name: string;
          id: string;
          new_value: string | null;
          old_value: string | null;
        };
        Insert: {
          budget_line_id: string;
          change_reason?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          field_name: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
        };
        Update: {
          budget_line_id?: string;
          change_reason?: string | null;
          changed_at?: string;
          changed_by?: string | null;
          field_name?: string;
          id?: string;
          new_value?: string | null;
          old_value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_line_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_line_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_line_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_line_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_line_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_line_history_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_line_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_line_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_lines: {
        Row: {
          action_id: string | null;
          activite_id: string | null;
          budget_import_id: string | null;
          budget_version_id: string | null;
          code: string;
          code_budgetaire: string | null;
          code_budgetaire_v2: string | null;
          code_version: string | null;
          commentaire: string | null;
          created_at: string;
          date_cloture: string | null;
          date_modification: string | null;
          date_ouverture: string | null;
          direction_id: string | null;
          disponible_calcule: number | null;
          dotation_initiale: number;
          dotation_modifiee: number | null;
          exercice: number;
          id: string;
          import_run_id: string | null;
          is_active: boolean | null;
          label: string;
          legacy_import: boolean | null;
          level: string;
          libelle_modifie: string | null;
          locked_at: string | null;
          locked_by: string | null;
          mission_id: string | null;
          montant_reserve: number | null;
          nbe_id: string | null;
          numero_ligne: string | null;
          nve_id: string | null;
          os_id: string | null;
          parent_id: string | null;
          rejection_reason: string | null;
          seq_code: number | null;
          source_financement: string | null;
          sous_activite_id: string | null;
          statut: string | null;
          statut_execution: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          sysco_id: string | null;
          tache_id: string | null;
          total_engage: number | null;
          total_liquide: number | null;
          total_ordonnance: number | null;
          total_paye: number | null;
          type_ligne: string | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          version: number | null;
        };
        Insert: {
          action_id?: string | null;
          activite_id?: string | null;
          budget_import_id?: string | null;
          budget_version_id?: string | null;
          code: string;
          code_budgetaire?: string | null;
          code_budgetaire_v2?: string | null;
          code_version?: string | null;
          commentaire?: string | null;
          created_at?: string;
          date_cloture?: string | null;
          date_modification?: string | null;
          date_ouverture?: string | null;
          direction_id?: string | null;
          disponible_calcule?: number | null;
          dotation_initiale?: number;
          dotation_modifiee?: number | null;
          exercice?: number;
          id?: string;
          import_run_id?: string | null;
          is_active?: boolean | null;
          label: string;
          legacy_import?: boolean | null;
          level: string;
          libelle_modifie?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          mission_id?: string | null;
          montant_reserve?: number | null;
          nbe_id?: string | null;
          numero_ligne?: string | null;
          nve_id?: string | null;
          os_id?: string | null;
          parent_id?: string | null;
          rejection_reason?: string | null;
          seq_code?: number | null;
          source_financement?: string | null;
          sous_activite_id?: string | null;
          statut?: string | null;
          statut_execution?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          sysco_id?: string | null;
          tache_id?: string | null;
          total_engage?: number | null;
          total_liquide?: number | null;
          total_ordonnance?: number | null;
          total_paye?: number | null;
          type_ligne?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          version?: number | null;
        };
        Update: {
          action_id?: string | null;
          activite_id?: string | null;
          budget_import_id?: string | null;
          budget_version_id?: string | null;
          code?: string;
          code_budgetaire?: string | null;
          code_budgetaire_v2?: string | null;
          code_version?: string | null;
          commentaire?: string | null;
          created_at?: string;
          date_cloture?: string | null;
          date_modification?: string | null;
          date_ouverture?: string | null;
          direction_id?: string | null;
          disponible_calcule?: number | null;
          dotation_initiale?: number;
          dotation_modifiee?: number | null;
          exercice?: number;
          id?: string;
          import_run_id?: string | null;
          is_active?: boolean | null;
          label?: string;
          legacy_import?: boolean | null;
          level?: string;
          libelle_modifie?: string | null;
          locked_at?: string | null;
          locked_by?: string | null;
          mission_id?: string | null;
          montant_reserve?: number | null;
          nbe_id?: string | null;
          numero_ligne?: string | null;
          nve_id?: string | null;
          os_id?: string | null;
          parent_id?: string | null;
          rejection_reason?: string | null;
          seq_code?: number | null;
          source_financement?: string | null;
          sous_activite_id?: string | null;
          statut?: string | null;
          statut_execution?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          sysco_id?: string | null;
          tache_id?: string | null;
          total_engage?: number | null;
          total_liquide?: number | null;
          total_ordonnance?: number | null;
          total_paye?: number | null;
          type_ligne?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_lines_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_activite_id_fkey';
            columns: ['activite_id'];
            isOneToOne: false;
            referencedRelation: 'activites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_budget_import_id_fkey';
            columns: ['budget_import_id'];
            isOneToOne: false;
            referencedRelation: 'budget_imports';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_budget_version_id_fkey';
            columns: ['budget_version_id'];
            isOneToOne: false;
            referencedRelation: 'budget_versions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_import_run_id_fkey';
            columns: ['import_run_id'];
            isOneToOne: false;
            referencedRelation: 'import_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_nbe_id_fkey';
            columns: ['nbe_id'];
            isOneToOne: false;
            referencedRelation: 'nomenclature_nbe';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_nve_id_fkey';
            columns: ['nve_id'];
            isOneToOne: false;
            referencedRelation: 'ref_nve';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
          {
            foreignKeyName: 'budget_lines_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_lines_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_lines_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_lines_sous_activite_id_fkey';
            columns: ['sous_activite_id'];
            isOneToOne: false;
            referencedRelation: 'sous_activites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_sysco_id_fkey';
            columns: ['sysco_id'];
            isOneToOne: false;
            referencedRelation: 'plan_comptable_sysco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_liquidations: {
        Row: {
          airsi_montant: number | null;
          airsi_taux: number | null;
          code_locked: boolean | null;
          created_at: string;
          created_by: string | null;
          current_step: number | null;
          date_differe: string | null;
          date_entree_etape: string | null;
          date_liquidation: string;
          deadline_correction: string | null;
          delai_validation_jours: number | null;
          differe_by: string | null;
          dossier_id: string | null;
          engagement_id: string;
          exercice: number | null;
          id: string;
          legacy_import: boolean | null;
          montant: number;
          montant_ht: number | null;
          motif_differe: string | null;
          net_a_payer: number | null;
          numero: string;
          observation: string | null;
          reference_facture: string | null;
          regime_fiscal: string | null;
          reglement_urgent: boolean | null;
          reglement_urgent_date: string | null;
          reglement_urgent_motif: string | null;
          reglement_urgent_par: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          retenue_source_montant: number | null;
          retenue_source_taux: number | null;
          service_fait: boolean | null;
          service_fait_certifie_par: string | null;
          service_fait_date: string | null;
          statut: string | null;
          submitted_at: string | null;
          tva_montant: number | null;
          tva_taux: number | null;
          validated_at: string | null;
          validated_by: string | null;
          workflow_status: string | null;
        };
        Insert: {
          airsi_montant?: number | null;
          airsi_taux?: number | null;
          code_locked?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number | null;
          date_differe?: string | null;
          date_entree_etape?: string | null;
          date_liquidation?: string;
          deadline_correction?: string | null;
          delai_validation_jours?: number | null;
          differe_by?: string | null;
          dossier_id?: string | null;
          engagement_id: string;
          exercice?: number | null;
          id?: string;
          legacy_import?: boolean | null;
          montant: number;
          montant_ht?: number | null;
          motif_differe?: string | null;
          net_a_payer?: number | null;
          numero: string;
          observation?: string | null;
          reference_facture?: string | null;
          regime_fiscal?: string | null;
          reglement_urgent?: boolean | null;
          reglement_urgent_date?: string | null;
          reglement_urgent_motif?: string | null;
          reglement_urgent_par?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          retenue_source_montant?: number | null;
          retenue_source_taux?: number | null;
          service_fait?: boolean | null;
          service_fait_certifie_par?: string | null;
          service_fait_date?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          tva_montant?: number | null;
          tva_taux?: number | null;
          validated_at?: string | null;
          validated_by?: string | null;
          workflow_status?: string | null;
        };
        Update: {
          airsi_montant?: number | null;
          airsi_taux?: number | null;
          code_locked?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number | null;
          date_differe?: string | null;
          date_entree_etape?: string | null;
          date_liquidation?: string;
          deadline_correction?: string | null;
          delai_validation_jours?: number | null;
          differe_by?: string | null;
          dossier_id?: string | null;
          engagement_id?: string;
          exercice?: number | null;
          id?: string;
          legacy_import?: boolean | null;
          montant?: number;
          montant_ht?: number | null;
          motif_differe?: string | null;
          net_a_payer?: number | null;
          numero?: string;
          observation?: string | null;
          reference_facture?: string | null;
          regime_fiscal?: string | null;
          reglement_urgent?: boolean | null;
          reglement_urgent_date?: string | null;
          reglement_urgent_motif?: string | null;
          reglement_urgent_par?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          retenue_source_montant?: number | null;
          retenue_source_taux?: number | null;
          service_fait?: boolean | null;
          service_fait_certifie_par?: string | null;
          service_fait_date?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          tva_montant?: number | null;
          tva_taux?: number | null;
          validated_at?: string | null;
          validated_by?: string | null;
          workflow_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_liquidations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'budget_liquidations_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'budget_liquidations_engagement_id_fkey';
            columns: ['engagement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_engagements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_service_fait_certifie_par_fkey';
            columns: ['service_fait_certifie_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_service_fait_certifie_par_fkey';
            columns: ['service_fait_certifie_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_liquidations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      budget_movements: {
        Row: {
          budget_line_id: string;
          commentaire: string | null;
          created_at: string;
          created_by: string | null;
          disponible_apres: number | null;
          disponible_avant: number | null;
          dossier_id: string | null;
          entity_code: string | null;
          entity_id: string | null;
          entity_type: string | null;
          exercice: number;
          id: string;
          montant: number;
          motif: string | null;
          reserve_apres: number | null;
          reserve_avant: number | null;
          sens: string;
          statut: string;
          type_mouvement: string;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          budget_line_id: string;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          disponible_apres?: number | null;
          disponible_avant?: number | null;
          dossier_id?: string | null;
          entity_code?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          exercice?: number;
          id?: string;
          montant: number;
          motif?: string | null;
          reserve_apres?: number | null;
          reserve_avant?: number | null;
          sens: string;
          statut?: string;
          type_mouvement: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          budget_line_id?: string;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          disponible_apres?: number | null;
          disponible_avant?: number | null;
          dossier_id?: string | null;
          entity_code?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          exercice?: number;
          id?: string;
          montant?: number;
          motif?: string | null;
          reserve_apres?: number | null;
          reserve_avant?: number | null;
          sens?: string;
          statut?: string;
          type_mouvement?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_movements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_movements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_movements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_movements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_movements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_movements_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'budget_movements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_movements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'budget_movements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
        ];
      };
      budget_versions: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          exercice: number;
          id: string;
          label: string;
          status: string | null;
          total_depenses: number | null;
          total_dotation: number | null;
          total_recettes: number | null;
          validated_at: string | null;
          validated_by: string | null;
          version: number;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          exercice: number;
          id?: string;
          label: string;
          status?: string | null;
          total_depenses?: number | null;
          total_dotation?: number | null;
          total_recettes?: number | null;
          validated_at?: string | null;
          validated_by?: string | null;
          version?: number;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          exercice?: number;
          id?: string;
          label?: string;
          status?: string | null;
          total_depenses?: number | null;
          total_dotation?: number | null;
          total_recettes?: number | null;
          validated_at?: string | null;
          validated_by?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      codif_variables: {
        Row: {
          created_at: string | null;
          default_value: string | null;
          description: string | null;
          est_active: boolean | null;
          format_type: string;
          id: string;
          is_system: boolean | null;
          key: string;
          label: string;
          pad_char: string | null;
          pad_length: number | null;
          pad_side: string | null;
          source_field: string | null;
          source_table: string | null;
          transform: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          default_value?: string | null;
          description?: string | null;
          est_active?: boolean | null;
          format_type?: string;
          id?: string;
          is_system?: boolean | null;
          key: string;
          label: string;
          pad_char?: string | null;
          pad_length?: number | null;
          pad_side?: string | null;
          source_field?: string | null;
          source_table?: string | null;
          transform?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          default_value?: string | null;
          description?: string | null;
          est_active?: boolean | null;
          format_type?: string;
          id?: string;
          is_system?: boolean | null;
          key?: string;
          label?: string;
          pad_char?: string | null;
          pad_length?: number | null;
          pad_side?: string | null;
          source_field?: string | null;
          source_table?: string | null;
          transform?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      coherence_reports: {
        Row: {
          anomalies: Json;
          anomalies_count: number;
          created_at: string;
          errors_count: number;
          exercice_id: string;
          generated_at: string;
          generated_by: string | null;
          id: string;
          infos_count: number;
          source: string;
          source_details: string | null;
          status: string;
          total_checks: number;
          updated_at: string;
          warnings_count: number;
        };
        Insert: {
          anomalies?: Json;
          anomalies_count?: number;
          created_at?: string;
          errors_count?: number;
          exercice_id: string;
          generated_at?: string;
          generated_by?: string | null;
          id?: string;
          infos_count?: number;
          source: string;
          source_details?: string | null;
          status?: string;
          total_checks?: number;
          updated_at?: string;
          warnings_count?: number;
        };
        Update: {
          anomalies?: Json;
          anomalies_count?: number;
          created_at?: string;
          errors_count?: number;
          exercice_id?: string;
          generated_at?: string;
          generated_by?: string | null;
          id?: string;
          infos_count?: number;
          source?: string;
          source_details?: string | null;
          status?: string;
          total_checks?: number;
          updated_at?: string;
          warnings_count?: number;
        };
        Relationships: [];
      };
      comptes_bancaires: {
        Row: {
          banque: string | null;
          bic: string | null;
          code: string;
          created_at: string | null;
          created_by: string | null;
          devise: string | null;
          est_actif: boolean | null;
          iban: string | null;
          id: string;
          libelle: string;
          numero_compte: string | null;
          solde_actuel: number | null;
          solde_initial: number | null;
          type_compte: string | null;
          updated_at: string | null;
        };
        Insert: {
          banque?: string | null;
          bic?: string | null;
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          devise?: string | null;
          est_actif?: boolean | null;
          iban?: string | null;
          id?: string;
          libelle: string;
          numero_compte?: string | null;
          solde_actuel?: number | null;
          solde_initial?: number | null;
          type_compte?: string | null;
          updated_at?: string | null;
        };
        Update: {
          banque?: string | null;
          bic?: string | null;
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          devise?: string | null;
          est_actif?: boolean | null;
          iban?: string | null;
          id?: string;
          libelle?: string;
          numero_compte?: string | null;
          solde_actuel?: number | null;
          solde_initial?: number | null;
          type_compte?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'comptes_bancaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comptes_bancaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      config_affectations: {
        Row: {
          created_at: string | null;
          description: string | null;
          direction_id: string;
          est_active: boolean | null;
          id: string;
          priorite: number | null;
          type_depense: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          direction_id: string;
          est_active?: boolean | null;
          id?: string;
          priorite?: number | null;
          type_depense: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          direction_id?: string;
          est_active?: boolean | null;
          id?: string;
          priorite?: number | null;
          type_depense?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'config_affectations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'config_affectations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'config_affectations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'config_affectations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      config_affectations_type_demande: {
        Row: {
          created_at: string | null;
          description: string | null;
          direction_code: string | null;
          direction_id: string | null;
          id: string;
          is_active: boolean | null;
          priorite: number | null;
          type_demande: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          direction_code?: string | null;
          direction_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          priorite?: number | null;
          type_demande: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          direction_code?: string | null;
          direction_id?: string | null;
          id?: string;
          is_active?: boolean | null;
          priorite?: number | null;
          type_demande?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'config_affectations_type_demande_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'config_affectations_type_demande_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'config_affectations_type_demande_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'config_affectations_type_demande_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      contrat_attachments: {
        Row: {
          contrat_id: string;
          created_at: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          uploaded_by: string | null;
        };
        Insert: {
          contrat_id: string;
          created_at?: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          uploaded_by?: string | null;
        };
        Update: {
          contrat_id?: string;
          created_at?: string | null;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contrat_attachments_contrat_id_fkey';
            columns: ['contrat_id'];
            isOneToOne: false;
            referencedRelation: 'contrats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrat_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrat_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      contrat_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      contrats: {
        Row: {
          code_locked: boolean | null;
          created_at: string | null;
          created_by: string | null;
          date_debut: string | null;
          date_fin: string | null;
          date_notification: string | null;
          date_signature: string | null;
          delai_execution: number | null;
          dossier_id: string | null;
          engagement_id: string | null;
          exercice: number | null;
          id: string;
          lot_id: string | null;
          marche_id: string | null;
          montant_actuel: number | null;
          montant_initial: number;
          numero: string;
          objet: string;
          prestataire_id: string;
          statut: string | null;
          type_contrat: string;
          updated_at: string | null;
        };
        Insert: {
          code_locked?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          date_notification?: string | null;
          date_signature?: string | null;
          delai_execution?: number | null;
          dossier_id?: string | null;
          engagement_id?: string | null;
          exercice?: number | null;
          id?: string;
          lot_id?: string | null;
          marche_id?: string | null;
          montant_actuel?: number | null;
          montant_initial: number;
          numero: string;
          objet: string;
          prestataire_id: string;
          statut?: string | null;
          type_contrat: string;
          updated_at?: string | null;
        };
        Update: {
          code_locked?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          date_notification?: string | null;
          date_signature?: string | null;
          delai_execution?: number | null;
          dossier_id?: string | null;
          engagement_id?: string | null;
          exercice?: number | null;
          id?: string;
          lot_id?: string | null;
          marche_id?: string | null;
          montant_actuel?: number | null;
          montant_initial?: number;
          numero?: string;
          objet?: string;
          prestataire_id?: string;
          statut?: string | null;
          type_contrat?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contrats_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'contrats_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'contrats_engagement_id_fkey';
            columns: ['engagement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_engagements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'marche_lots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contrats_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
        ];
      };
      credit_transfers: {
        Row: {
          amount: number;
          approved_at: string | null;
          approved_by: string | null;
          cancel_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          code: string | null;
          code_locked: boolean | null;
          executed_at: string | null;
          executed_by: string | null;
          exercice: number | null;
          from_budget_line_id: string | null;
          from_disponible_apres: number | null;
          from_disponible_avant: number | null;
          from_dotation_apres: number | null;
          from_dotation_avant: number | null;
          id: string;
          justification_renforcee: string | null;
          motif: string;
          rejection_reason: string | null;
          requested_at: string;
          requested_by: string | null;
          status: string | null;
          to_budget_line_id: string;
          to_disponible_apres: number | null;
          to_disponible_avant: number | null;
          to_dotation_apres: number | null;
          to_dotation_avant: number | null;
          type_transfer: string | null;
        };
        Insert: {
          amount: number;
          approved_at?: string | null;
          approved_by?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          code?: string | null;
          code_locked?: boolean | null;
          executed_at?: string | null;
          executed_by?: string | null;
          exercice?: number | null;
          from_budget_line_id?: string | null;
          from_disponible_apres?: number | null;
          from_disponible_avant?: number | null;
          from_dotation_apres?: number | null;
          from_dotation_avant?: number | null;
          id?: string;
          justification_renforcee?: string | null;
          motif: string;
          rejection_reason?: string | null;
          requested_at?: string;
          requested_by?: string | null;
          status?: string | null;
          to_budget_line_id: string;
          to_disponible_apres?: number | null;
          to_disponible_avant?: number | null;
          to_dotation_apres?: number | null;
          to_dotation_avant?: number | null;
          type_transfer?: string | null;
        };
        Update: {
          amount?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          code?: string | null;
          code_locked?: boolean | null;
          executed_at?: string | null;
          executed_by?: string | null;
          exercice?: number | null;
          from_budget_line_id?: string | null;
          from_disponible_apres?: number | null;
          from_disponible_avant?: number | null;
          from_dotation_apres?: number | null;
          from_dotation_avant?: number | null;
          id?: string;
          justification_renforcee?: string | null;
          motif?: string;
          rejection_reason?: string | null;
          requested_at?: string;
          requested_by?: string | null;
          status?: string | null;
          to_budget_line_id?: string;
          to_disponible_apres?: number | null;
          to_disponible_avant?: number | null;
          to_dotation_apres?: number | null;
          to_dotation_avant?: number | null;
          type_transfer?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'credit_transfers_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_executed_by_fkey';
            columns: ['executed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_executed_by_fkey';
            columns: ['executed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_from_budget_line_id_fkey';
            columns: ['from_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_from_budget_line_id_fkey';
            columns: ['from_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'credit_transfers_from_budget_line_id_fkey';
            columns: ['from_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_from_budget_line_id_fkey';
            columns: ['from_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_from_budget_line_id_fkey';
            columns: ['from_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'credit_transfers_from_budget_line_id_fkey';
            columns: ['from_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'credit_transfers_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_to_budget_line_id_fkey';
            columns: ['to_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_to_budget_line_id_fkey';
            columns: ['to_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'credit_transfers_to_budget_line_id_fkey';
            columns: ['to_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_to_budget_line_id_fkey';
            columns: ['to_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transfers_to_budget_line_id_fkey';
            columns: ['to_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'credit_transfers_to_budget_line_id_fkey';
            columns: ['to_budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
        ];
      };
      custom_roles: {
        Row: {
          code: string;
          color: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_system: boolean | null;
          label: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          label: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          color?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          label?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      data_dictionary: {
        Row: {
          actif: boolean | null;
          created_at: string | null;
          description: string | null;
          exemple: string | null;
          field_name: string;
          id: string;
          label_fr: string;
          module: string;
          obligatoire: boolean | null;
          regles_validation: string | null;
          source: string | null;
          table_name: string;
          type_donnee: string;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          actif?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          exemple?: string | null;
          field_name: string;
          id?: string;
          label_fr: string;
          module: string;
          obligatoire?: boolean | null;
          regles_validation?: string | null;
          source?: string | null;
          table_name: string;
          type_donnee?: string;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          actif?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          exemple?: string | null;
          field_name?: string;
          id?: string;
          label_fr?: string;
          module?: string;
          obligatoire?: boolean | null;
          regles_validation?: string | null;
          source?: string | null;
          table_name?: string;
          type_donnee?: string;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [];
      };
      delegations: {
        Row: {
          created_at: string;
          created_by: string | null;
          date_debut: string;
          date_fin: string;
          delegataire_id: string;
          delegateur_id: string;
          est_active: boolean | null;
          id: string;
          motif: string | null;
          perimetre: string[];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          date_debut: string;
          date_fin: string;
          delegataire_id: string;
          delegateur_id: string;
          est_active?: boolean | null;
          id?: string;
          motif?: string | null;
          perimetre?: string[];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          date_debut?: string;
          date_fin?: string;
          delegataire_id?: string;
          delegateur_id?: string;
          est_active?: boolean | null;
          id?: string;
          motif?: string | null;
          perimetre?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'delegations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'delegations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'delegations_delegataire_id_fkey';
            columns: ['delegataire_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'delegations_delegataire_id_fkey';
            columns: ['delegataire_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'delegations_delegateur_id_fkey';
            columns: ['delegateur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'delegations_delegateur_id_fkey';
            columns: ['delegateur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      demande_achat_lignes: {
        Row: {
          article_id: string | null;
          created_at: string | null;
          demande_id: string;
          designation: string;
          id: string;
          prix_unitaire_estime: number | null;
          quantite: number;
          unite: string | null;
        };
        Insert: {
          article_id?: string | null;
          created_at?: string | null;
          demande_id: string;
          designation: string;
          id?: string;
          prix_unitaire_estime?: number | null;
          quantite?: number;
          unite?: string | null;
        };
        Update: {
          article_id?: string | null;
          created_at?: string | null;
          demande_id?: string;
          designation?: string;
          id?: string;
          prix_unitaire_estime?: number | null;
          quantite?: number;
          unite?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'demande_achat_lignes_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demande_achat_lignes_demande_id_fkey';
            columns: ['demande_id'];
            isOneToOne: false;
            referencedRelation: 'demandes_achat';
            referencedColumns: ['id'];
          },
        ];
      };
      demande_achat_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      demandes_achat: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          date_demande: string;
          direction_id: string | null;
          dossier_id: string | null;
          engagement_id: string | null;
          exercice: number | null;
          id: string;
          justification: string | null;
          montant_estime: number | null;
          numero: string;
          objet: string;
          statut: string | null;
          updated_at: string | null;
          urgence: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          date_demande?: string;
          direction_id?: string | null;
          dossier_id?: string | null;
          engagement_id?: string | null;
          exercice?: number | null;
          id?: string;
          justification?: string | null;
          montant_estime?: number | null;
          numero: string;
          objet: string;
          statut?: string | null;
          updated_at?: string | null;
          urgence?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          date_demande?: string;
          direction_id?: string | null;
          dossier_id?: string | null;
          engagement_id?: string | null;
          exercice?: number | null;
          id?: string;
          justification?: string | null;
          montant_estime?: number | null;
          numero?: string;
          objet?: string;
          statut?: string | null;
          updated_at?: string | null;
          urgence?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'demandes_achat_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demandes_achat_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demandes_achat_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demandes_achat_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'demandes_achat_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'demandes_achat_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'demandes_achat_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demandes_achat_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'demandes_achat_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'demandes_achat_engagement_id_fkey';
            columns: ['engagement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_engagements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demandes_achat_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'demandes_achat_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      directions: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          email_contact: string | null;
          entity_type: string | null;
          est_active: boolean | null;
          group_email: string | null;
          id: string;
          label: string;
          last_sync_at: string | null;
          last_sync_file: string | null;
          ordre_affichage: number | null;
          parent_id: string | null;
          position: number | null;
          responsable_id: string | null;
          responsible_user_id: string | null;
          sigle: string | null;
          telephone: string | null;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          email_contact?: string | null;
          entity_type?: string | null;
          est_active?: boolean | null;
          group_email?: string | null;
          id?: string;
          label: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          ordre_affichage?: number | null;
          parent_id?: string | null;
          position?: number | null;
          responsable_id?: string | null;
          responsible_user_id?: string | null;
          sigle?: string | null;
          telephone?: string | null;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          email_contact?: string | null;
          entity_type?: string | null;
          est_active?: boolean | null;
          group_email?: string | null;
          id?: string;
          label?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          ordre_affichage?: number | null;
          parent_id?: string | null;
          position?: number | null;
          responsable_id?: string | null;
          responsible_user_id?: string | null;
          sigle?: string | null;
          telephone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'directions_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'directions_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'directions_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'directions_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'directions_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'directions_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'directions_responsible_user_id_fkey';
            columns: ['responsible_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'directions_responsible_user_id_fkey';
            columns: ['responsible_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      dmg_alert_config: {
        Row: {
          alert_type: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          seuil_critical: number;
          seuil_warning: number;
          updated_at: string | null;
        };
        Insert: {
          alert_type: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          seuil_critical: number;
          seuil_warning: number;
          updated_at?: string | null;
        };
        Update: {
          alert_type?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          seuil_critical?: number;
          seuil_warning?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      document_workflow_rules: {
        Row: {
          created_at: string | null;
          document_type_id: string;
          id: string;
          is_required: boolean | null;
          module_code: string;
          must_be_validated: boolean | null;
          step_order: number | null;
          updated_at: string | null;
          validation_roles: string[] | null;
          workflow_step_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          document_type_id: string;
          id?: string;
          is_required?: boolean | null;
          module_code: string;
          must_be_validated?: boolean | null;
          step_order?: number | null;
          updated_at?: string | null;
          validation_roles?: string[] | null;
          workflow_step_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          document_type_id?: string;
          id?: string;
          is_required?: boolean | null;
          module_code?: string;
          must_be_validated?: boolean | null;
          step_order?: number | null;
          updated_at?: string | null;
          validation_roles?: string[] | null;
          workflow_step_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'document_workflow_rules_document_type_id_fkey';
            columns: ['document_type_id'];
            isOneToOne: false;
            referencedRelation: 'required_document_types';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'document_workflow_rules_workflow_step_id_fkey';
            columns: ['workflow_step_id'];
            isOneToOne: false;
            referencedRelation: 'validation_hierarchy';
            referencedColumns: ['id'];
          },
        ];
      };
      documents_generes: {
        Row: {
          annule_at: string | null;
          annule_par: string | null;
          chemin_stockage: string | null;
          date_expiration: string | null;
          direction_id: string | null;
          entity_id: string;
          entity_type: string;
          est_annule: boolean | null;
          exercice: number | null;
          genere_at: string;
          genere_par: string;
          id: string;
          metadata: Json | null;
          motif_annulation: string | null;
          nom_fichier: string;
          qr_code_data: string | null;
          qr_code_hash: string;
          reference: string;
          taille_octets: number | null;
          type_document: string;
        };
        Insert: {
          annule_at?: string | null;
          annule_par?: string | null;
          chemin_stockage?: string | null;
          date_expiration?: string | null;
          direction_id?: string | null;
          entity_id: string;
          entity_type: string;
          est_annule?: boolean | null;
          exercice?: number | null;
          genere_at?: string;
          genere_par: string;
          id?: string;
          metadata?: Json | null;
          motif_annulation?: string | null;
          nom_fichier: string;
          qr_code_data?: string | null;
          qr_code_hash: string;
          reference: string;
          taille_octets?: number | null;
          type_document: string;
        };
        Update: {
          annule_at?: string | null;
          annule_par?: string | null;
          chemin_stockage?: string | null;
          date_expiration?: string | null;
          direction_id?: string | null;
          entity_id?: string;
          entity_type?: string;
          est_annule?: boolean | null;
          exercice?: number | null;
          genere_at?: string;
          genere_par?: string;
          id?: string;
          metadata?: Json | null;
          motif_annulation?: string | null;
          nom_fichier?: string;
          qr_code_data?: string | null;
          qr_code_hash?: string;
          reference?: string;
          taille_octets?: number | null;
          type_document?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_generes_annule_par_fkey';
            columns: ['annule_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_generes_annule_par_fkey';
            columns: ['annule_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_generes_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_generes_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'documents_generes_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'documents_generes_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'documents_generes_genere_par_fkey';
            columns: ['genere_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_generes_genere_par_fkey';
            columns: ['genere_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      dossier_documents: {
        Row: {
          categorie: string | null;
          created_at: string;
          dossier_id: string;
          etape_id: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          type_document: string;
          uploaded_by: string | null;
        };
        Insert: {
          categorie?: string | null;
          created_at?: string;
          dossier_id: string;
          etape_id?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          type_document: string;
          uploaded_by?: string | null;
        };
        Update: {
          categorie?: string | null;
          created_at?: string;
          dossier_id?: string;
          etape_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          type_document?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dossier_documents_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossier_documents_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'dossier_documents_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'dossier_documents_etape_id_fkey';
            columns: ['etape_id'];
            isOneToOne: false;
            referencedRelation: 'dossier_etapes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossier_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossier_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      dossier_etapes: {
        Row: {
          commentaire: string | null;
          created_at: string;
          created_by: string | null;
          dossier_id: string;
          entity_id: string | null;
          id: string;
          montant: number | null;
          statut: string | null;
          type_etape: string;
        };
        Insert: {
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          dossier_id: string;
          entity_id?: string | null;
          id?: string;
          montant?: number | null;
          statut?: string | null;
          type_etape: string;
        };
        Update: {
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          dossier_id?: string;
          entity_id?: string | null;
          id?: string;
          montant?: number | null;
          statut?: string | null;
          type_etape?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dossier_etapes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossier_etapes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossier_etapes_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossier_etapes_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'dossier_etapes_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
        ];
      };
      dossier_sequences: {
        Row: {
          annee: number;
          dernier_numero: number;
          id: string;
          mois: number;
          updated_at: string;
        };
        Insert: {
          annee: number;
          dernier_numero?: number;
          id?: string;
          mois: number;
          updated_at?: string;
        };
        Update: {
          annee?: number;
          dernier_numero?: number;
          id?: string;
          mois?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      dossiers: {
        Row: {
          action_id: string | null;
          activite_id: string | null;
          beneficiaire_id: string | null;
          bloque_par: string | null;
          budget_line_id: string | null;
          code_budgetaire: string | null;
          commentaire_deblocage: string | null;
          created_at: string;
          created_by: string | null;
          date_blocage: string | null;
          date_cloture: string | null;
          date_deblocage: string | null;
          date_ouverture: string | null;
          debloque_par: string | null;
          demandeur_id: string | null;
          direction_id: string | null;
          etape_courante: string | null;
          exercice: number;
          id: string;
          mission_id: string | null;
          montant_engage: number | null;
          montant_estime: number | null;
          montant_liquide: number | null;
          montant_ordonnance: number | null;
          montant_paye: number | null;
          motif_blocage: string | null;
          note_sef_id: string | null;
          numero: string;
          objet: string;
          piece_principale_path: string | null;
          priorite: number | null;
          reference_pivot: string | null;
          responsable_suivi_id: string | null;
          statut_global: string | null;
          statut_paiement: string | null;
          type_dossier: string | null;
          updated_at: string;
          urgence: string | null;
        };
        Insert: {
          action_id?: string | null;
          activite_id?: string | null;
          beneficiaire_id?: string | null;
          bloque_par?: string | null;
          budget_line_id?: string | null;
          code_budgetaire?: string | null;
          commentaire_deblocage?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_blocage?: string | null;
          date_cloture?: string | null;
          date_deblocage?: string | null;
          date_ouverture?: string | null;
          debloque_par?: string | null;
          demandeur_id?: string | null;
          direction_id?: string | null;
          etape_courante?: string | null;
          exercice?: number;
          id?: string;
          mission_id?: string | null;
          montant_engage?: number | null;
          montant_estime?: number | null;
          montant_liquide?: number | null;
          montant_ordonnance?: number | null;
          montant_paye?: number | null;
          motif_blocage?: string | null;
          note_sef_id?: string | null;
          numero: string;
          objet: string;
          piece_principale_path?: string | null;
          priorite?: number | null;
          reference_pivot?: string | null;
          responsable_suivi_id?: string | null;
          statut_global?: string | null;
          statut_paiement?: string | null;
          type_dossier?: string | null;
          updated_at?: string;
          urgence?: string | null;
        };
        Update: {
          action_id?: string | null;
          activite_id?: string | null;
          beneficiaire_id?: string | null;
          bloque_par?: string | null;
          budget_line_id?: string | null;
          code_budgetaire?: string | null;
          commentaire_deblocage?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_blocage?: string | null;
          date_cloture?: string | null;
          date_deblocage?: string | null;
          date_ouverture?: string | null;
          debloque_par?: string | null;
          demandeur_id?: string | null;
          direction_id?: string | null;
          etape_courante?: string | null;
          exercice?: number;
          id?: string;
          mission_id?: string | null;
          montant_engage?: number | null;
          montant_estime?: number | null;
          montant_liquide?: number | null;
          montant_ordonnance?: number | null;
          montant_paye?: number | null;
          motif_blocage?: string | null;
          note_sef_id?: string | null;
          numero?: string;
          objet?: string;
          piece_principale_path?: string | null;
          priorite?: number | null;
          reference_pivot?: string | null;
          responsable_suivi_id?: string | null;
          statut_global?: string | null;
          statut_paiement?: string | null;
          type_dossier?: string | null;
          updated_at?: string;
          urgence?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dossiers_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_activite_id_fkey';
            columns: ['activite_id'];
            isOneToOne: false;
            referencedRelation: 'activites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_bloque_par_fkey';
            columns: ['bloque_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_bloque_par_fkey';
            columns: ['bloque_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'dossiers_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'dossiers_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'dossiers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_debloque_par_fkey';
            columns: ['debloque_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_debloque_par_fkey';
            columns: ['debloque_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_demandeur_id_fkey';
            columns: ['demandeur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_demandeur_id_fkey';
            columns: ['demandeur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'dossiers_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'dossiers_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'dossiers_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_responsable_suivi_id_fkey';
            columns: ['responsable_suivi_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dossiers_responsable_suivi_id_fkey';
            columns: ['responsable_suivi_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      email_templates: {
        Row: {
          body_html: string;
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          label: string;
          subject: string;
          updated_at: string | null;
          variables: string[] | null;
        };
        Insert: {
          body_html: string;
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          label: string;
          subject: string;
          updated_at?: string | null;
          variables?: string[] | null;
        };
        Update: {
          body_html?: string;
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string;
          subject?: string;
          updated_at?: string | null;
          variables?: string[] | null;
        };
        Relationships: [];
      };
      engagement_attachments: {
        Row: {
          created_at: string;
          document_type: string;
          engagement_id: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          is_required: boolean | null;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          engagement_id: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          is_required?: boolean | null;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          engagement_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          is_required?: boolean | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'engagement_attachments_engagement_id_fkey';
            columns: ['engagement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_engagements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'engagement_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'engagement_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      engagement_documents: {
        Row: {
          created_at: string | null;
          description: string | null;
          engagement_id: string;
          est_fourni: boolean | null;
          est_obligatoire: boolean | null;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          file_type: string | null;
          id: string;
          libelle: string;
          type_document: string;
          uploaded_at: string | null;
          uploaded_by: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          engagement_id: string;
          est_fourni?: boolean | null;
          est_obligatoire?: boolean | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          libelle: string;
          type_document: string;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          engagement_id?: string;
          est_fourni?: boolean | null;
          est_obligatoire?: boolean | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          libelle?: string;
          type_document?: string;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'engagement_documents_engagement_id_fkey';
            columns: ['engagement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_engagements';
            referencedColumns: ['id'];
          },
        ];
      };
      engagement_validations: {
        Row: {
          comments: string | null;
          created_at: string;
          engagement_id: string;
          id: string;
          ip_address: string | null;
          role: string;
          status: string | null;
          step_order: number;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string;
          engagement_id: string;
          id?: string;
          ip_address?: string | null;
          role: string;
          status?: string | null;
          step_order: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string;
          engagement_id?: string;
          id?: string;
          ip_address?: string | null;
          role?: string;
          status?: string | null;
          step_order?: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'engagement_validations_engagement_id_fkey';
            columns: ['engagement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_engagements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'engagement_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'engagement_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      exercices_budgetaires: {
        Row: {
          annee: number;
          budget_lignes_count: number | null;
          budget_total: number | null;
          budget_valide: boolean | null;
          budget_valide_at: string | null;
          budget_valide_by: string | null;
          code_exercice: string | null;
          created_at: string;
          date_cloture: string | null;
          date_ouverture: string | null;
          est_actif: boolean;
          id: string;
          libelle: string | null;
          statut: string;
          updated_at: string;
        };
        Insert: {
          annee: number;
          budget_lignes_count?: number | null;
          budget_total?: number | null;
          budget_valide?: boolean | null;
          budget_valide_at?: string | null;
          budget_valide_by?: string | null;
          code_exercice?: string | null;
          created_at?: string;
          date_cloture?: string | null;
          date_ouverture?: string | null;
          est_actif?: boolean;
          id?: string;
          libelle?: string | null;
          statut?: string;
          updated_at?: string;
        };
        Update: {
          annee?: number;
          budget_lignes_count?: number | null;
          budget_total?: number | null;
          budget_valide?: boolean | null;
          budget_valide_at?: string | null;
          budget_valide_by?: string | null;
          code_exercice?: string | null;
          created_at?: string;
          date_cloture?: string | null;
          date_ouverture?: string | null;
          est_actif?: boolean;
          id?: string;
          libelle?: string | null;
          statut?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      export_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          entity_id: string | null;
          entity_type: string;
          error_message: string | null;
          expires_at: string | null;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          filters: Json | null;
          id: string;
          status: string;
          type: string;
          user_id: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type: string;
          error_message?: string | null;
          expires_at?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          filters?: Json | null;
          id?: string;
          status?: string;
          type: string;
          user_id?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          error_message?: string | null;
          expires_at?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          filters?: Json | null;
          id?: string;
          status?: string;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      expression_besoin_attachments: {
        Row: {
          created_at: string;
          document_type: string;
          expression_besoin_id: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          expression_besoin_id: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          expression_besoin_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expression_besoin_attachments_expression_besoin_id_fkey';
            columns: ['expression_besoin_id'];
            isOneToOne: false;
            referencedRelation: 'expressions_besoin';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expression_besoin_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expression_besoin_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      expression_besoin_sequences: {
        Row: {
          annee: number;
          dernier_numero: number;
          id: string;
          updated_at: string;
        };
        Insert: {
          annee: number;
          dernier_numero?: number;
          id?: string;
          updated_at?: string;
        };
        Update: {
          annee?: number;
          dernier_numero?: number;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expression_besoin_validations: {
        Row: {
          comments: string | null;
          created_at: string;
          expression_besoin_id: string;
          id: string;
          ip_address: string | null;
          role: string;
          status: string | null;
          step_order: number;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string;
          expression_besoin_id: string;
          id?: string;
          ip_address?: string | null;
          role: string;
          status?: string | null;
          step_order: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string;
          expression_besoin_id?: string;
          id?: string;
          ip_address?: string | null;
          role?: string;
          status?: string | null;
          step_order?: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expression_besoin_validations_expression_besoin_id_fkey';
            columns: ['expression_besoin_id'];
            isOneToOne: false;
            referencedRelation: 'expressions_besoin';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expression_besoin_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expression_besoin_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      expressions_besoin: {
        Row: {
          calendrier_debut: string | null;
          calendrier_fin: string | null;
          code_locked: boolean | null;
          contact_livraison: string | null;
          created_at: string;
          created_by: string | null;
          criteres_evaluation: string | null;
          current_validation_step: number | null;
          date_differe: string | null;
          deadline_correction: string | null;
          delai_livraison: string | null;
          description: string | null;
          differe_by: string | null;
          direction_id: string | null;
          dossier_id: string | null;
          exercice: number | null;
          id: string;
          imputation_id: string | null;
          intitule_lot: string | null;
          justification: string | null;
          lieu_livraison: string | null;
          ligne_budgetaire_id: string | null;
          liste_articles: Json | null;
          marche_id: string | null;
          montant_estime: number | null;
          motif_differe: string | null;
          note_id: string | null;
          numero: string | null;
          numero_lot: number | null;
          objet: string;
          quantite: number | null;
          rejection_reason: string | null;
          specifications: string | null;
          statut: string | null;
          submitted_at: string | null;
          type_procedure: string | null;
          unite: string | null;
          updated_at: string;
          urgence: string | null;
          validated_at: string | null;
          validated_by: string | null;
          validation_status: string | null;
        };
        Insert: {
          calendrier_debut?: string | null;
          calendrier_fin?: string | null;
          code_locked?: boolean | null;
          contact_livraison?: string | null;
          created_at?: string;
          created_by?: string | null;
          criteres_evaluation?: string | null;
          current_validation_step?: number | null;
          date_differe?: string | null;
          deadline_correction?: string | null;
          delai_livraison?: string | null;
          description?: string | null;
          differe_by?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          imputation_id?: string | null;
          intitule_lot?: string | null;
          justification?: string | null;
          lieu_livraison?: string | null;
          ligne_budgetaire_id?: string | null;
          liste_articles?: Json | null;
          marche_id?: string | null;
          montant_estime?: number | null;
          motif_differe?: string | null;
          note_id?: string | null;
          numero?: string | null;
          numero_lot?: number | null;
          objet: string;
          quantite?: number | null;
          rejection_reason?: string | null;
          specifications?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          type_procedure?: string | null;
          unite?: string | null;
          updated_at?: string;
          urgence?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_status?: string | null;
        };
        Update: {
          calendrier_debut?: string | null;
          calendrier_fin?: string | null;
          code_locked?: boolean | null;
          contact_livraison?: string | null;
          created_at?: string;
          created_by?: string | null;
          criteres_evaluation?: string | null;
          current_validation_step?: number | null;
          date_differe?: string | null;
          deadline_correction?: string | null;
          delai_livraison?: string | null;
          description?: string | null;
          differe_by?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          imputation_id?: string | null;
          intitule_lot?: string | null;
          justification?: string | null;
          lieu_livraison?: string | null;
          ligne_budgetaire_id?: string | null;
          liste_articles?: Json | null;
          marche_id?: string | null;
          montant_estime?: number | null;
          motif_differe?: string | null;
          note_id?: string | null;
          numero?: string | null;
          numero_lot?: number | null;
          objet?: string;
          quantite?: number | null;
          rejection_reason?: string | null;
          specifications?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          type_procedure?: string | null;
          unite?: string | null;
          updated_at?: string;
          urgence?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'expressions_besoin_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_differe_by_fkey';
            columns: ['differe_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_differe_by_fkey';
            columns: ['differe_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_imputation_id_fkey';
            columns: ['imputation_id'];
            isOneToOne: false;
            referencedRelation: 'imputations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'expressions_besoin_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'expressions_besoin_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      historique_libelles: {
        Row: {
          ancien_libelle: string | null;
          ancienne_valeur: string | null;
          budget_line_id: string | null;
          champ_modifie: string | null;
          created_at: string | null;
          entity_id: string;
          id: string;
          modifie_at: string | null;
          modifie_par: string | null;
          motif: string | null;
          nouveau_libelle: string;
          nouvelle_valeur: string | null;
          table_source: string;
        };
        Insert: {
          ancien_libelle?: string | null;
          ancienne_valeur?: string | null;
          budget_line_id?: string | null;
          champ_modifie?: string | null;
          created_at?: string | null;
          entity_id: string;
          id?: string;
          modifie_at?: string | null;
          modifie_par?: string | null;
          motif?: string | null;
          nouveau_libelle: string;
          nouvelle_valeur?: string | null;
          table_source: string;
        };
        Update: {
          ancien_libelle?: string | null;
          ancienne_valeur?: string | null;
          budget_line_id?: string | null;
          champ_modifie?: string | null;
          created_at?: string | null;
          entity_id?: string;
          id?: string;
          modifie_at?: string | null;
          modifie_par?: string | null;
          motif?: string | null;
          nouveau_libelle?: string;
          nouvelle_valeur?: string | null;
          table_source?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'historique_libelles_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'historique_libelles_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'historique_libelles_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'historique_libelles_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'historique_libelles_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'historique_libelles_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
        ];
      };
      import_budget_staging: {
        Row: {
          budget_line_id: string | null;
          computed_action_id: string | null;
          computed_activite_id: string | null;
          computed_direction_id: string | null;
          computed_imputation: string | null;
          computed_libelle: string | null;
          computed_montant: number | null;
          computed_nature_depense_code: string | null;
          computed_nbe_code: string | null;
          computed_nbe_id: string | null;
          computed_os_id: string | null;
          computed_source_financement: string | null;
          computed_sous_activite_id: string | null;
          created_at: string;
          id: string;
          raw_action: string | null;
          raw_activite: string | null;
          raw_data: Json | null;
          raw_direction: string | null;
          raw_imputation: string | null;
          raw_libelle: string | null;
          raw_montant: string | null;
          raw_nature_depense: string | null;
          raw_nbe: string | null;
          raw_os: string | null;
          raw_source_financement: string | null;
          raw_sous_activite: string | null;
          row_number: number;
          run_id: string;
          validation_details: Json | null;
          validation_errors: string | null;
          validation_status: string;
          validation_warnings: string | null;
        };
        Insert: {
          budget_line_id?: string | null;
          computed_action_id?: string | null;
          computed_activite_id?: string | null;
          computed_direction_id?: string | null;
          computed_imputation?: string | null;
          computed_libelle?: string | null;
          computed_montant?: number | null;
          computed_nature_depense_code?: string | null;
          computed_nbe_code?: string | null;
          computed_nbe_id?: string | null;
          computed_os_id?: string | null;
          computed_source_financement?: string | null;
          computed_sous_activite_id?: string | null;
          created_at?: string;
          id?: string;
          raw_action?: string | null;
          raw_activite?: string | null;
          raw_data?: Json | null;
          raw_direction?: string | null;
          raw_imputation?: string | null;
          raw_libelle?: string | null;
          raw_montant?: string | null;
          raw_nature_depense?: string | null;
          raw_nbe?: string | null;
          raw_os?: string | null;
          raw_source_financement?: string | null;
          raw_sous_activite?: string | null;
          row_number: number;
          run_id: string;
          validation_details?: Json | null;
          validation_errors?: string | null;
          validation_status?: string;
          validation_warnings?: string | null;
        };
        Update: {
          budget_line_id?: string | null;
          computed_action_id?: string | null;
          computed_activite_id?: string | null;
          computed_direction_id?: string | null;
          computed_imputation?: string | null;
          computed_libelle?: string | null;
          computed_montant?: number | null;
          computed_nature_depense_code?: string | null;
          computed_nbe_code?: string | null;
          computed_nbe_id?: string | null;
          computed_os_id?: string | null;
          computed_source_financement?: string | null;
          computed_sous_activite_id?: string | null;
          created_at?: string;
          id?: string;
          raw_action?: string | null;
          raw_activite?: string | null;
          raw_data?: Json | null;
          raw_direction?: string | null;
          raw_imputation?: string | null;
          raw_libelle?: string | null;
          raw_montant?: string | null;
          raw_nature_depense?: string | null;
          raw_nbe?: string | null;
          raw_os?: string | null;
          raw_source_financement?: string | null;
          raw_sous_activite?: string | null;
          row_number?: number;
          run_id?: string;
          validation_details?: Json | null;
          validation_errors?: string | null;
          validation_status?: string;
          validation_warnings?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'import_budget_staging_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_budget_staging_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'import_budget_staging_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_budget_staging_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_budget_staging_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'import_budget_staging_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'import_budget_staging_run_id_fkey';
            columns: ['run_id'];
            isOneToOne: false;
            referencedRelation: 'import_runs';
            referencedColumns: ['id'];
          },
        ];
      };
      import_history: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          error_details: Json | null;
          error_rows: number;
          file_name: string;
          id: string;
          import_type: string;
          imported_data: Json | null;
          rollback_data: Json | null;
          rolled_back_at: string | null;
          status: string;
          success_rows: number;
          total_rows: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_details?: Json | null;
          error_rows?: number;
          file_name: string;
          id?: string;
          import_type: string;
          imported_data?: Json | null;
          rollback_data?: Json | null;
          rolled_back_at?: string | null;
          status?: string;
          success_rows?: number;
          total_rows?: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          error_details?: Json | null;
          error_rows?: number;
          file_name?: string;
          id?: string;
          import_type?: string;
          imported_data?: Json | null;
          rollback_data?: Json | null;
          rolled_back_at?: string | null;
          status?: string;
          success_rows?: number;
          total_rows?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'import_history_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_history_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      import_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          errors_count: number | null;
          exercice_id: number | null;
          filename: string;
          id: string;
          module: string;
          notes: string | null;
          stats: Json | null;
          status: string;
          storage_path: string | null;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          errors_count?: number | null;
          exercice_id?: number | null;
          filename: string;
          id?: string;
          module?: string;
          notes?: string | null;
          stats?: Json | null;
          status?: string;
          storage_path?: string | null;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          errors_count?: number | null;
          exercice_id?: number | null;
          filename?: string;
          id?: string;
          module?: string;
          notes?: string | null;
          stats?: Json | null;
          status?: string;
          storage_path?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'import_jobs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_jobs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      import_logs: {
        Row: {
          details: Json | null;
          id: string;
          level: string;
          message: string;
          row_number: number | null;
          run_id: string;
          step: string | null;
          timestamp: string;
          user_id: string | null;
        };
        Insert: {
          details?: Json | null;
          id?: string;
          level?: string;
          message: string;
          row_number?: number | null;
          run_id: string;
          step?: string | null;
          timestamp?: string;
          user_id?: string | null;
        };
        Update: {
          details?: Json | null;
          id?: string;
          level?: string;
          message?: string;
          row_number?: number | null;
          run_id?: string;
          step?: string | null;
          timestamp?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'import_logs_run_id_fkey';
            columns: ['run_id'];
            isOneToOne: false;
            referencedRelation: 'import_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      import_rows: {
        Row: {
          created_at: string;
          error_messages: string[] | null;
          id: string;
          job_id: string;
          normalized: Json | null;
          raw: Json;
          row_index: number;
          sheet_name: string | null;
          status: string;
          target_action: string | null;
          target_id: string | null;
        };
        Insert: {
          created_at?: string;
          error_messages?: string[] | null;
          id?: string;
          job_id: string;
          normalized?: Json | null;
          raw: Json;
          row_index: number;
          sheet_name?: string | null;
          status?: string;
          target_action?: string | null;
          target_id?: string | null;
        };
        Update: {
          created_at?: string;
          error_messages?: string[] | null;
          id?: string;
          job_id?: string;
          normalized?: Json | null;
          raw?: Json;
          row_index?: number;
          sheet_name?: string | null;
          status?: string;
          target_action?: string | null;
          target_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'import_rows_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'import_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      import_runs: {
        Row: {
          column_mapping: Json | null;
          created_at: string;
          created_by: string | null;
          error_rows: number | null;
          error_summary: Json | null;
          exercice: number | null;
          exercice_id: string | null;
          filename: string;
          id: string;
          imported_at: string | null;
          imported_by: string | null;
          notes: string | null;
          ok_rows: number | null;
          sheet_name: string | null;
          status: string;
          total_rows: number | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          warning_rows: number | null;
        };
        Insert: {
          column_mapping?: Json | null;
          created_at?: string;
          created_by?: string | null;
          error_rows?: number | null;
          error_summary?: Json | null;
          exercice?: number | null;
          exercice_id?: string | null;
          filename: string;
          id?: string;
          imported_at?: string | null;
          imported_by?: string | null;
          notes?: string | null;
          ok_rows?: number | null;
          sheet_name?: string | null;
          status?: string;
          total_rows?: number | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          warning_rows?: number | null;
        };
        Update: {
          column_mapping?: Json | null;
          created_at?: string;
          created_by?: string | null;
          error_rows?: number | null;
          error_summary?: Json | null;
          exercice?: number | null;
          exercice_id?: string | null;
          filename?: string;
          id?: string;
          imported_at?: string | null;
          imported_by?: string | null;
          notes?: string | null;
          ok_rows?: number | null;
          sheet_name?: string | null;
          status?: string;
          total_rows?: number | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          warning_rows?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'import_runs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_runs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_runs_exercice_id_fkey';
            columns: ['exercice_id'];
            isOneToOne: false;
            referencedRelation: 'exercices_budgetaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_runs_imported_by_fkey';
            columns: ['imported_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_runs_imported_by_fkey';
            columns: ['imported_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_runs_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'import_runs_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      imputation_lignes: {
        Row: {
          budget_line_id: string;
          created_at: string;
          created_by: string | null;
          disponible_apres: number | null;
          disponible_avant: number | null;
          id: string;
          imputation_id: string;
          montant: number;
          movement_id: string | null;
          pourcentage: number | null;
          statut: string;
        };
        Insert: {
          budget_line_id: string;
          created_at?: string;
          created_by?: string | null;
          disponible_apres?: number | null;
          disponible_avant?: number | null;
          id?: string;
          imputation_id: string;
          montant: number;
          movement_id?: string | null;
          pourcentage?: number | null;
          statut?: string;
        };
        Update: {
          budget_line_id?: string;
          created_at?: string;
          created_by?: string | null;
          disponible_apres?: number | null;
          disponible_avant?: number | null;
          id?: string;
          imputation_id?: string;
          montant?: number;
          movement_id?: string | null;
          pourcentage?: number | null;
          statut?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'imputation_lignes_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputation_lignes_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'imputation_lignes_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputation_lignes_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputation_lignes_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'imputation_lignes_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'imputation_lignes_imputation_id_fkey';
            columns: ['imputation_id'];
            isOneToOne: false;
            referencedRelation: 'imputations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputation_lignes_movement_id_fkey';
            columns: ['movement_id'];
            isOneToOne: false;
            referencedRelation: 'budget_movements';
            referencedColumns: ['id'];
          },
        ];
      };
      imputations: {
        Row: {
          action_id: string | null;
          activite_id: string | null;
          budget_line_id: string | null;
          code_imputation: string | null;
          commentaire: string | null;
          created_at: string;
          created_by: string | null;
          date_differe: string | null;
          differed_at: string | null;
          differed_by: string | null;
          direction_id: string | null;
          disponible_au_moment: number | null;
          dossier_id: string | null;
          exercice: number;
          forcer_imputation: boolean | null;
          id: string;
          is_multi_ligne: boolean | null;
          justification_depassement: string | null;
          mission_id: string | null;
          montant: number;
          motif_differe: string | null;
          motif_rejet: string | null;
          nbe_id: string | null;
          note_aef_id: string;
          objet: string;
          os_id: string | null;
          pieces_jointes: string[] | null;
          reference: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          source_financement: string | null;
          sous_activite_id: string | null;
          statut: string;
          submitted_at: string | null;
          submitted_by: string | null;
          sysco_id: string | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          action_id?: string | null;
          activite_id?: string | null;
          budget_line_id?: string | null;
          code_imputation?: string | null;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_differe?: string | null;
          differed_at?: string | null;
          differed_by?: string | null;
          direction_id?: string | null;
          disponible_au_moment?: number | null;
          dossier_id?: string | null;
          exercice: number;
          forcer_imputation?: boolean | null;
          id?: string;
          is_multi_ligne?: boolean | null;
          justification_depassement?: string | null;
          mission_id?: string | null;
          montant: number;
          motif_differe?: string | null;
          motif_rejet?: string | null;
          nbe_id?: string | null;
          note_aef_id: string;
          objet: string;
          os_id?: string | null;
          pieces_jointes?: string[] | null;
          reference?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          source_financement?: string | null;
          sous_activite_id?: string | null;
          statut?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          sysco_id?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          action_id?: string | null;
          activite_id?: string | null;
          budget_line_id?: string | null;
          code_imputation?: string | null;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_differe?: string | null;
          differed_at?: string | null;
          differed_by?: string | null;
          direction_id?: string | null;
          disponible_au_moment?: number | null;
          dossier_id?: string | null;
          exercice?: number;
          forcer_imputation?: boolean | null;
          id?: string;
          is_multi_ligne?: boolean | null;
          justification_depassement?: string | null;
          mission_id?: string | null;
          montant?: number;
          motif_differe?: string | null;
          motif_rejet?: string | null;
          nbe_id?: string | null;
          note_aef_id?: string;
          objet?: string;
          os_id?: string | null;
          pieces_jointes?: string[] | null;
          reference?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          source_financement?: string | null;
          sous_activite_id?: string | null;
          statut?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          sysco_id?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'imputations_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_activite_id_fkey';
            columns: ['activite_id'];
            isOneToOne: false;
            referencedRelation: 'activites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'imputations_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'imputations_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'imputations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_differed_by_fkey';
            columns: ['differed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_differed_by_fkey';
            columns: ['differed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'imputations_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'imputations_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'imputations_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_nbe_id_fkey';
            columns: ['nbe_id'];
            isOneToOne: false;
            referencedRelation: 'nomenclature_nbe';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_note_aef_id_fkey';
            columns: ['note_aef_id'];
            isOneToOne: true;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_note_aef_id_fkey';
            columns: ['note_aef_id'];
            isOneToOne: true;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
          {
            foreignKeyName: 'imputations_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_sous_activite_id_fkey';
            columns: ['sous_activite_id'];
            isOneToOne: false;
            referencedRelation: 'sous_activites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_sysco_id_fkey';
            columns: ['sysco_id'];
            isOneToOne: false;
            referencedRelation: 'plan_comptable_sysco';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'imputations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      interims: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          date_debut: string;
          date_fin: string;
          est_actif: boolean | null;
          id: string;
          interimaire_id: string;
          motif: string;
          titulaire_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          date_debut: string;
          date_fin: string;
          est_actif?: boolean | null;
          id?: string;
          interimaire_id: string;
          motif: string;
          titulaire_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string;
          date_fin?: string;
          est_actif?: boolean | null;
          id?: string;
          interimaire_id?: string;
          motif?: string;
          titulaire_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'interims_interimaire_id_fkey';
            columns: ['interimaire_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interims_interimaire_id_fkey';
            columns: ['interimaire_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interims_titulaire_id_fkey';
            columns: ['titulaire_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'interims_titulaire_id_fkey';
            columns: ['titulaire_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      inventaire_lignes: {
        Row: {
          ajustement_effectue: boolean | null;
          article_id: string;
          created_at: string | null;
          ecart: number | null;
          id: string;
          inventaire_id: string;
          justification: string | null;
          stock_physique: number | null;
          stock_theorique: number;
          updated_at: string | null;
        };
        Insert: {
          ajustement_effectue?: boolean | null;
          article_id: string;
          created_at?: string | null;
          ecart?: number | null;
          id?: string;
          inventaire_id: string;
          justification?: string | null;
          stock_physique?: number | null;
          stock_theorique: number;
          updated_at?: string | null;
        };
        Update: {
          ajustement_effectue?: boolean | null;
          article_id?: string;
          created_at?: string | null;
          ecart?: number | null;
          id?: string;
          inventaire_id?: string;
          justification?: string | null;
          stock_physique?: number | null;
          stock_theorique?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inventaire_lignes_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventaire_lignes_inventaire_id_fkey';
            columns: ['inventaire_id'];
            isOneToOne: false;
            referencedRelation: 'inventaires';
            referencedColumns: ['id'];
          },
        ];
      };
      inventaire_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      inventaires: {
        Row: {
          cloture_at: string | null;
          cloture_by: string | null;
          created_at: string | null;
          created_by: string | null;
          date_inventaire: string;
          exercice: number | null;
          id: string;
          libelle: string;
          numero: string;
          observations: string | null;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          cloture_at?: string | null;
          cloture_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_inventaire?: string;
          exercice?: number | null;
          id?: string;
          libelle: string;
          numero: string;
          observations?: string | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cloture_at?: string | null;
          cloture_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_inventaire?: string;
          exercice?: number | null;
          id?: string;
          libelle?: string;
          numero?: string;
          observations?: string | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'inventaires_cloture_by_fkey';
            columns: ['cloture_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventaires_cloture_by_fkey';
            columns: ['cloture_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      lambda_link_types: {
        Row: {
          actif: boolean | null;
          cible_table: string;
          code: string;
          created_at: string | null;
          default_mapping: Json | null;
          description: string | null;
          id: string;
          libelle: string;
          ordre: number | null;
          source_table: string;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          cible_table: string;
          code: string;
          created_at?: string | null;
          default_mapping?: Json | null;
          description?: string | null;
          id?: string;
          libelle: string;
          ordre?: number | null;
          source_table: string;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          cible_table?: string;
          code?: string;
          created_at?: string | null;
          default_mapping?: Json | null;
          description?: string | null;
          id?: string;
          libelle?: string;
          ordre?: number | null;
          source_table?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      lambda_links: {
        Row: {
          cible_id: string | null;
          cible_table: string;
          commentaire: string | null;
          created_at: string | null;
          created_by: string | null;
          erreur_detail: string | null;
          exercice: number | null;
          id: string;
          last_sync_at: string | null;
          mapping_json: Json;
          source_id: string;
          source_table: string;
          statut_sync: string;
          sync_count: number | null;
          type_lien: string;
          updated_at: string | null;
        };
        Insert: {
          cible_id?: string | null;
          cible_table: string;
          commentaire?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          erreur_detail?: string | null;
          exercice?: number | null;
          id?: string;
          last_sync_at?: string | null;
          mapping_json?: Json;
          source_id: string;
          source_table: string;
          statut_sync?: string;
          sync_count?: number | null;
          type_lien?: string;
          updated_at?: string | null;
        };
        Update: {
          cible_id?: string | null;
          cible_table?: string;
          commentaire?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          erreur_detail?: string | null;
          exercice?: number | null;
          id?: string;
          last_sync_at?: string | null;
          mapping_json?: Json;
          source_id?: string;
          source_table?: string;
          statut_sync?: string;
          sync_count?: number | null;
          type_lien?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lambda_links_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lambda_links_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      lignes_budgetaires_referentiel: {
        Row: {
          actif: boolean | null;
          article: string | null;
          chapitre: string | null;
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          libelle: string;
          nbe_id: string | null;
          ordre_affichage: number | null;
          paragraphe: string | null;
          sysco_id: string | null;
          type_ligne: string | null;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          article?: string | null;
          chapitre?: string | null;
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          libelle: string;
          nbe_id?: string | null;
          ordre_affichage?: number | null;
          paragraphe?: string | null;
          sysco_id?: string | null;
          type_ligne?: string | null;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          article?: string | null;
          chapitre?: string | null;
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          libelle?: string;
          nbe_id?: string | null;
          ordre_affichage?: number | null;
          paragraphe?: string | null;
          sysco_id?: string | null;
          type_ligne?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lignes_budgetaires_referentiel_nbe_id_fkey';
            columns: ['nbe_id'];
            isOneToOne: false;
            referencedRelation: 'nomenclature_nbe';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lignes_budgetaires_referentiel_sysco_id_fkey';
            columns: ['sysco_id'];
            isOneToOne: false;
            referencedRelation: 'plan_comptable_sysco';
            referencedColumns: ['id'];
          },
        ];
      };
      liquidation_attachments: {
        Row: {
          created_at: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          liquidation_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          liquidation_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          liquidation_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'liquidation_attachments_liquidation_id_fkey';
            columns: ['liquidation_id'];
            isOneToOne: false;
            referencedRelation: 'budget_liquidations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidation_attachments_liquidation_id_fkey';
            columns: ['liquidation_id'];
            isOneToOne: false;
            referencedRelation: 'v_liquidations_urgentes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidation_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidation_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      liquidation_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      liquidation_validations: {
        Row: {
          comments: string | null;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          liquidation_id: string;
          role: string;
          status: string | null;
          step_order: number;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          liquidation_id: string;
          role: string;
          status?: string | null;
          step_order: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          liquidation_id?: string;
          role?: string;
          status?: string | null;
          step_order?: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'liquidation_validations_liquidation_id_fkey';
            columns: ['liquidation_id'];
            isOneToOne: false;
            referencedRelation: 'budget_liquidations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidation_validations_liquidation_id_fkey';
            columns: ['liquidation_id'];
            isOneToOne: false;
            referencedRelation: 'v_liquidations_urgentes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidation_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'liquidation_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      logs_actions: {
        Row: {
          action: Database['public']['Enums']['log_action_type'];
          created_at: string | null;
          entity_id: string | null;
          entity_reference: string | null;
          entity_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          new_status: string | null;
          old_status: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
        };
        Insert: {
          action: Database['public']['Enums']['log_action_type'];
          created_at?: string | null;
          entity_id?: string | null;
          entity_reference?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_status?: string | null;
          old_status?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Update: {
          action?: Database['public']['Enums']['log_action_type'];
          created_at?: string | null;
          entity_id?: string | null;
          entity_reference?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_status?: string | null;
          old_status?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
      marche_attachments: {
        Row: {
          created_at: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          is_required: boolean | null;
          marche_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          is_required?: boolean | null;
          marche_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          is_required?: boolean | null;
          marche_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marche_attachments_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      marche_documents: {
        Row: {
          created_at: string | null;
          description: string | null;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          file_type: string | null;
          id: string;
          libelle: string;
          marche_id: string;
          metadata: Json | null;
          type_document: string;
          updated_at: string | null;
          uploaded_at: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          libelle: string;
          marche_id: string;
          metadata?: Json | null;
          type_document: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          libelle?: string;
          marche_id?: string;
          metadata?: Json | null;
          type_document?: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marche_documents_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
        ];
      };
      marche_historique: {
        Row: {
          ancien_statut: string | null;
          commentaire: string | null;
          created_at: string | null;
          description: string;
          id: string;
          marche_id: string;
          metadata: Json | null;
          nouveau_statut: string | null;
          type_action: string;
          user_id: string | null;
        };
        Insert: {
          ancien_statut?: string | null;
          commentaire?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          marche_id: string;
          metadata?: Json | null;
          nouveau_statut?: string | null;
          type_action: string;
          user_id?: string | null;
        };
        Update: {
          ancien_statut?: string | null;
          commentaire?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          marche_id?: string;
          metadata?: Json | null;
          nouveau_statut?: string | null;
          type_action?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marche_historique_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
        ];
      };
      marche_lots: {
        Row: {
          attributaire_id: string | null;
          created_at: string | null;
          date_attribution: string | null;
          description: string | null;
          id: string;
          intitule: string;
          marche_id: string;
          montant_attribue: number | null;
          montant_estime: number | null;
          numero_lot: number;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          attributaire_id?: string | null;
          created_at?: string | null;
          date_attribution?: string | null;
          description?: string | null;
          id?: string;
          intitule: string;
          marche_id: string;
          montant_attribue?: number | null;
          montant_estime?: number | null;
          numero_lot: number;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          attributaire_id?: string | null;
          created_at?: string | null;
          date_attribution?: string | null;
          description?: string | null;
          id?: string;
          intitule?: string;
          marche_id?: string;
          montant_attribue?: number | null;
          montant_estime?: number | null;
          numero_lot?: number;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marche_lots_attributaire_id_fkey';
            columns: ['attributaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_lots_attributaire_id_fkey';
            columns: ['attributaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_lots_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
        ];
      };
      marche_offres: {
        Row: {
          created_at: string;
          delai_execution: number | null;
          document_path: string | null;
          est_retenu: boolean | null;
          id: string;
          marche_id: string;
          montant_offre: number;
          motif_selection: string | null;
          nom_fournisseur: string | null;
          note_financiere: number | null;
          note_globale: number | null;
          note_technique: number | null;
          observations: string | null;
          prestataire_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          delai_execution?: number | null;
          document_path?: string | null;
          est_retenu?: boolean | null;
          id?: string;
          marche_id: string;
          montant_offre: number;
          motif_selection?: string | null;
          nom_fournisseur?: string | null;
          note_financiere?: number | null;
          note_globale?: number | null;
          note_technique?: number | null;
          observations?: string | null;
          prestataire_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          delai_execution?: number | null;
          document_path?: string | null;
          est_retenu?: boolean | null;
          id?: string;
          marche_id?: string;
          montant_offre?: number;
          motif_selection?: string | null;
          nom_fournisseur?: string | null;
          note_financiere?: number | null;
          note_globale?: number | null;
          note_technique?: number | null;
          observations?: string | null;
          prestataire_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'marche_offres_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_offres_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_offres_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
        ];
      };
      marche_sequences: {
        Row: {
          annee: number;
          dernier_numero: number;
          id: string;
          updated_at: string;
        };
        Insert: {
          annee: number;
          dernier_numero?: number;
          id?: string;
          updated_at?: string;
        };
        Update: {
          annee?: number;
          dernier_numero?: number;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marche_validations: {
        Row: {
          comments: string | null;
          created_at: string;
          id: string;
          ip_address: string | null;
          marche_id: string;
          role: string;
          status: string | null;
          step_order: number;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          marche_id: string;
          role: string;
          status?: string | null;
          step_order: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          marche_id?: string;
          role?: string;
          status?: string | null;
          step_order?: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marche_validations_marche_id_fkey';
            columns: ['marche_id'];
            isOneToOne: false;
            referencedRelation: 'marches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marche_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      marches: {
        Row: {
          annee: number | null;
          autorisation_path: string | null;
          calendrier_attribution: string | null;
          calendrier_lancement: string | null;
          calendrier_notification: string | null;
          calendrier_ouverture: string | null;
          code_locked: boolean | null;
          commission_membres: string[] | null;
          created_at: string;
          created_by: string | null;
          current_validation_step: number | null;
          date_attribution: string | null;
          date_lancement: string | null;
          date_signature: string | null;
          differe_at: string | null;
          differe_by: string | null;
          differe_date_reprise: string | null;
          differe_motif: string | null;
          dossier_id: string | null;
          duree_execution: number | null;
          exercice: number | null;
          expression_besoin_id: string | null;
          id: string;
          intitule_lot: string | null;
          justification_derogation: string | null;
          legacy_import: boolean | null;
          mode_force: boolean | null;
          mode_passation: string;
          montant: number;
          nombre_lots: number | null;
          note_id: string | null;
          numero: string | null;
          numero_lot: number | null;
          objet: string;
          observations: string | null;
          prestataire_id: string | null;
          pv_attribution_path: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          statut: string | null;
          type_marche: string | null;
          type_procedure: string | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          validation_status: string | null;
        };
        Insert: {
          annee?: number | null;
          autorisation_path?: string | null;
          calendrier_attribution?: string | null;
          calendrier_lancement?: string | null;
          calendrier_notification?: string | null;
          calendrier_ouverture?: string | null;
          code_locked?: boolean | null;
          commission_membres?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          current_validation_step?: number | null;
          date_attribution?: string | null;
          date_lancement?: string | null;
          date_signature?: string | null;
          differe_at?: string | null;
          differe_by?: string | null;
          differe_date_reprise?: string | null;
          differe_motif?: string | null;
          dossier_id?: string | null;
          duree_execution?: number | null;
          exercice?: number | null;
          expression_besoin_id?: string | null;
          id?: string;
          intitule_lot?: string | null;
          justification_derogation?: string | null;
          legacy_import?: boolean | null;
          mode_force?: boolean | null;
          mode_passation: string;
          montant: number;
          nombre_lots?: number | null;
          note_id?: string | null;
          numero?: string | null;
          numero_lot?: number | null;
          objet: string;
          observations?: string | null;
          prestataire_id?: string | null;
          pv_attribution_path?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          statut?: string | null;
          type_marche?: string | null;
          type_procedure?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_status?: string | null;
        };
        Update: {
          annee?: number | null;
          autorisation_path?: string | null;
          calendrier_attribution?: string | null;
          calendrier_lancement?: string | null;
          calendrier_notification?: string | null;
          calendrier_ouverture?: string | null;
          code_locked?: boolean | null;
          commission_membres?: string[] | null;
          created_at?: string;
          created_by?: string | null;
          current_validation_step?: number | null;
          date_attribution?: string | null;
          date_lancement?: string | null;
          date_signature?: string | null;
          differe_at?: string | null;
          differe_by?: string | null;
          differe_date_reprise?: string | null;
          differe_motif?: string | null;
          dossier_id?: string | null;
          duree_execution?: number | null;
          exercice?: number | null;
          expression_besoin_id?: string | null;
          id?: string;
          intitule_lot?: string | null;
          justification_derogation?: string | null;
          legacy_import?: boolean | null;
          mode_force?: boolean | null;
          mode_passation?: string;
          montant?: number;
          nombre_lots?: number | null;
          note_id?: string | null;
          numero?: string | null;
          numero_lot?: number | null;
          objet?: string;
          observations?: string | null;
          prestataire_id?: string | null;
          pv_attribution_path?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          statut?: string | null;
          type_marche?: string | null;
          type_procedure?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          validation_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'marches_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'marches_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'marches_expression_besoin_id_fkey';
            columns: ['expression_besoin_id'];
            isOneToOne: false;
            referencedRelation: 'expressions_besoin';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'marches_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
        ];
      };
      migration_staging: {
        Row: {
          created_at: string;
          created_by: string | null;
          error_message: string | null;
          id: number;
          imported_at: string | null;
          imported_entity_id: string | null;
          mapped_data: Json | null;
          raw_data: Json;
          row_number: number | null;
          source_file: string;
          status: Database['public']['Enums']['migration_staging_status'];
          target_table: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          id?: number;
          imported_at?: string | null;
          imported_entity_id?: string | null;
          mapped_data?: Json | null;
          raw_data?: Json;
          row_number?: number | null;
          source_file: string;
          status?: Database['public']['Enums']['migration_staging_status'];
          target_table?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          id?: number;
          imported_at?: string | null;
          imported_entity_id?: string | null;
          mapped_data?: Json | null;
          raw_data?: Json;
          row_number?: number | null;
          source_file?: string;
          status?: Database['public']['Enums']['migration_staging_status'];
          target_table?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          code: string;
          created_at: string | null;
          date_modification: string | null;
          est_active: boolean | null;
          id: string;
          libelle: string;
          libelle_modifie: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          date_modification?: string | null;
          est_active?: boolean | null;
          id?: string;
          libelle: string;
          libelle_modifie?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          date_modification?: string | null;
          est_active?: boolean | null;
          id?: string;
          libelle?: string;
          libelle_modifie?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      module_documentation: {
        Row: {
          cas_limites: string | null;
          champs_cles: Json | null;
          controles: Json | null;
          created_at: string | null;
          dependances: Json | null;
          id: string;
          module_key: string;
          module_label: string | null;
          objectif: string | null;
          perimetre: string | null;
          regles_metier: string | null;
          statuts_workflow: Json | null;
          tables_utilisees: Json | null;
          updated_at: string | null;
          updated_by: string | null;
          version: string | null;
        };
        Insert: {
          cas_limites?: string | null;
          champs_cles?: Json | null;
          controles?: Json | null;
          created_at?: string | null;
          dependances?: Json | null;
          id?: string;
          module_key: string;
          module_label?: string | null;
          objectif?: string | null;
          perimetre?: string | null;
          regles_metier?: string | null;
          statuts_workflow?: Json | null;
          tables_utilisees?: Json | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: string | null;
        };
        Update: {
          cas_limites?: string | null;
          champs_cles?: Json | null;
          controles?: Json | null;
          created_at?: string | null;
          dependances?: Json | null;
          id?: string;
          module_key?: string;
          module_label?: string | null;
          objectif?: string | null;
          perimetre?: string | null;
          regles_metier?: string | null;
          statuts_workflow?: Json | null;
          tables_utilisees?: Json | null;
          updated_at?: string | null;
          updated_by?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'module_documentation_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'module_documentation_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      module_registry: {
        Row: {
          actif: boolean | null;
          created_at: string | null;
          dependances: Json | null;
          description: string | null;
          id: string;
          module_key: string;
          module_name: string;
          owner_role: string | null;
          tables_concernees: Json | null;
          updated_at: string | null;
          variables_entree: Json | null;
          variables_sortie: Json | null;
        };
        Insert: {
          actif?: boolean | null;
          created_at?: string | null;
          dependances?: Json | null;
          description?: string | null;
          id?: string;
          module_key: string;
          module_name: string;
          owner_role?: string | null;
          tables_concernees?: Json | null;
          updated_at?: string | null;
          variables_entree?: Json | null;
          variables_sortie?: Json | null;
        };
        Update: {
          actif?: boolean | null;
          created_at?: string | null;
          dependances?: Json | null;
          description?: string | null;
          id?: string;
          module_key?: string;
          module_name?: string;
          owner_role?: string | null;
          tables_concernees?: Json | null;
          updated_at?: string | null;
          variables_entree?: Json | null;
          variables_sortie?: Json | null;
        };
        Relationships: [];
      };
      mouvement_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      mouvements_bancaires: {
        Row: {
          compte_bancaire_code: string;
          compte_bancaire_id: string | null;
          created_at: string | null;
          created_by: string | null;
          date_reglement: string;
          id: string;
          montant: number;
          objet: string | null;
          piece_justificative_url: string | null;
          reference: string;
          reglement_id: string;
          updated_at: string | null;
        };
        Insert: {
          compte_bancaire_code: string;
          compte_bancaire_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_reglement?: string;
          id?: string;
          montant: number;
          objet?: string | null;
          piece_justificative_url?: string | null;
          reference: string;
          reglement_id: string;
          updated_at?: string | null;
        };
        Update: {
          compte_bancaire_code?: string;
          compte_bancaire_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_reglement?: string;
          id?: string;
          montant?: number;
          objet?: string | null;
          piece_justificative_url?: string | null;
          reference?: string;
          reglement_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'mouvements_bancaires_compte_bancaire_id_fkey';
            columns: ['compte_bancaire_id'];
            isOneToOne: false;
            referencedRelation: 'comptes_bancaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_bancaires_compte_bancaire_id_fkey';
            columns: ['compte_bancaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_etat_caisse';
            referencedColumns: ['compte_id'];
          },
          {
            foreignKeyName: 'mouvements_bancaires_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'reglements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_bancaires_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglements_paiements';
            referencedColumns: ['id'];
          },
        ];
      };
      mouvements_stock: {
        Row: {
          article_id: string;
          beneficiaire: string | null;
          created_at: string | null;
          created_by: string | null;
          date_mouvement: string | null;
          demande_id: string | null;
          destination: string | null;
          exercice: number | null;
          id: string;
          motif: string;
          numero: string;
          quantite: number;
          reception_id: string | null;
          reference_document: string | null;
          stock_apres: number;
          stock_avant: number;
          type_mouvement: string;
        };
        Insert: {
          article_id: string;
          beneficiaire?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_mouvement?: string | null;
          demande_id?: string | null;
          destination?: string | null;
          exercice?: number | null;
          id?: string;
          motif: string;
          numero: string;
          quantite: number;
          reception_id?: string | null;
          reference_document?: string | null;
          stock_apres: number;
          stock_avant: number;
          type_mouvement: string;
        };
        Update: {
          article_id?: string;
          beneficiaire?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_mouvement?: string | null;
          demande_id?: string | null;
          destination?: string | null;
          exercice?: number | null;
          id?: string;
          motif?: string;
          numero?: string;
          quantite?: number;
          reception_id?: string | null;
          reference_document?: string | null;
          stock_apres?: number;
          stock_avant?: number;
          type_mouvement?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mouvements_stock_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_stock_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_stock_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_stock_demande_id_fkey';
            columns: ['demande_id'];
            isOneToOne: false;
            referencedRelation: 'demandes_achat';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_stock_reception_id_fkey';
            columns: ['reception_id'];
            isOneToOne: false;
            referencedRelation: 'receptions';
            referencedColumns: ['id'];
          },
        ];
      };
      natures_depense: {
        Row: {
          code: string;
          created_at: string;
          est_active: boolean | null;
          id: string;
          libelle: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          est_active?: boolean | null;
          id?: string;
          libelle: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          est_active?: boolean | null;
          id?: string;
          libelle?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      nomenclature_nbe: {
        Row: {
          code: string;
          created_at: string | null;
          est_active: boolean | null;
          id: string;
          last_sync_at: string | null;
          last_sync_file: string | null;
          libelle: string;
          niveau: string | null;
          parent_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle: string;
          niveau?: string | null;
          parent_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle?: string;
          niveau?: string | null;
          parent_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      note_attachments: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          note_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          note_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          note_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'note_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'note_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'note_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'note_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_aef_history: {
        Row: {
          action: string;
          commentaire: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          new_statut: string | null;
          note_id: string;
          old_statut: string | null;
          performed_at: string;
          performed_by: string | null;
        };
        Insert: {
          action: string;
          commentaire?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_statut?: string | null;
          note_id: string;
          old_statut?: string | null;
          performed_at?: string;
          performed_by?: string | null;
        };
        Update: {
          action?: string;
          commentaire?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_statut?: string | null;
          note_id?: string;
          old_statut?: string | null;
          performed_at?: string;
          performed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_aef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_aef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_aef_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_aef_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_dg: {
        Row: {
          action_id: string | null;
          activite_id: string | null;
          beneficiaire_id: string | null;
          budget_bloque: boolean | null;
          budget_bloque_raison: string | null;
          budget_disponible_soumission: number | null;
          budget_line_id: string | null;
          contenu: string | null;
          created_at: string;
          created_by: string | null;
          date_differe: string | null;
          deadline_correction: string | null;
          depassement_budget: boolean | null;
          differe_by: string | null;
          direction_id: string | null;
          dossier_id: string | null;
          exercice: number | null;
          id: string;
          imputed_at: string | null;
          imputed_by: string | null;
          initiales_redacteur: string | null;
          is_direct_aef: boolean | null;
          justification: string | null;
          justification_depassement: string | null;
          legacy_import: boolean | null;
          ligne_budgetaire_id: string | null;
          montant_autorise: number | null;
          montant_depassement: number | null;
          montant_estime: number | null;
          motif_differe: string | null;
          note_sef_id: string | null;
          numero: string | null;
          objet: string;
          origin: string | null;
          os_id: string | null;
          priorite: string | null;
          projet_id: string | null;
          redacteur_id: string | null;
          reference_pivot: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          statut: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          type_depense: string | null;
          type_depense_id: string | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          action_id?: string | null;
          activite_id?: string | null;
          beneficiaire_id?: string | null;
          budget_bloque?: boolean | null;
          budget_bloque_raison?: string | null;
          budget_disponible_soumission?: number | null;
          budget_line_id?: string | null;
          contenu?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_differe?: string | null;
          deadline_correction?: string | null;
          depassement_budget?: boolean | null;
          differe_by?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          imputed_at?: string | null;
          imputed_by?: string | null;
          initiales_redacteur?: string | null;
          is_direct_aef?: boolean | null;
          justification?: string | null;
          justification_depassement?: string | null;
          legacy_import?: boolean | null;
          ligne_budgetaire_id?: string | null;
          montant_autorise?: number | null;
          montant_depassement?: number | null;
          montant_estime?: number | null;
          motif_differe?: string | null;
          note_sef_id?: string | null;
          numero?: string | null;
          objet: string;
          origin?: string | null;
          os_id?: string | null;
          priorite?: string | null;
          projet_id?: string | null;
          redacteur_id?: string | null;
          reference_pivot?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          type_depense?: string | null;
          type_depense_id?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          action_id?: string | null;
          activite_id?: string | null;
          beneficiaire_id?: string | null;
          budget_bloque?: boolean | null;
          budget_bloque_raison?: string | null;
          budget_disponible_soumission?: number | null;
          budget_line_id?: string | null;
          contenu?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_differe?: string | null;
          deadline_correction?: string | null;
          depassement_budget?: boolean | null;
          differe_by?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          imputed_at?: string | null;
          imputed_by?: string | null;
          initiales_redacteur?: string | null;
          is_direct_aef?: boolean | null;
          justification?: string | null;
          justification_depassement?: string | null;
          legacy_import?: boolean | null;
          ligne_budgetaire_id?: string | null;
          montant_autorise?: number | null;
          montant_depassement?: number | null;
          montant_estime?: number | null;
          motif_differe?: string | null;
          note_sef_id?: string | null;
          numero?: string | null;
          objet?: string;
          origin?: string | null;
          os_id?: string | null;
          priorite?: string | null;
          projet_id?: string | null;
          redacteur_id?: string | null;
          reference_pivot?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          type_depense?: string | null;
          type_depense_id?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_dg_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_activite_id_fkey';
            columns: ['activite_id'];
            isOneToOne: false;
            referencedRelation: 'activites';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'notes_dg_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'notes_dg_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'notes_dg_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_dg_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'notes_dg_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'notes_dg_imputed_by_fkey';
            columns: ['imputed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_imputed_by_fkey';
            columns: ['imputed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'notes_dg_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'notes_dg_ligne_budgetaire_id_fkey';
            columns: ['ligne_budgetaire_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'notes_dg_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
          {
            foreignKeyName: 'notes_dg_projet_id_fkey';
            columns: ['projet_id'];
            isOneToOne: false;
            referencedRelation: 'projets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_projet_id_fkey';
            columns: ['projet_id'];
            isOneToOne: false;
            referencedRelation: 'projets_avec_disponible';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_redacteur_id_fkey';
            columns: ['redacteur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_redacteur_id_fkey';
            columns: ['redacteur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_type_depense_id_fkey';
            columns: ['type_depense_id'];
            isOneToOne: false;
            referencedRelation: 'types_depenses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_dg_attachments: {
        Row: {
          created_at: string;
          fichier_url: string;
          id: string;
          nom: string;
          note_id: string;
          taille: number | null;
          type_fichier: string | null;
          uploaded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          fichier_url: string;
          id?: string;
          nom: string;
          note_id: string;
          taille?: number | null;
          type_fichier?: string | null;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          fichier_url?: string;
          id?: string;
          nom?: string;
          note_id?: string;
          taille?: number | null;
          type_fichier?: string | null;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_dg_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_dg';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_imputees_disponibles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_direction: {
        Row: {
          contenu: string | null;
          contenu_brut: string | null;
          created_at: string;
          created_by: string | null;
          direction_id: string;
          exercice_id: string | null;
          fichier_original_nom: string | null;
          fichier_original_url: string | null;
          id: string;
          priorite: string;
          statut: string;
          tags: string[] | null;
          titre: string;
          type_note: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          contenu?: string | null;
          contenu_brut?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction_id: string;
          exercice_id?: string | null;
          fichier_original_nom?: string | null;
          fichier_original_url?: string | null;
          id?: string;
          priorite?: string;
          statut?: string;
          tags?: string[] | null;
          titre: string;
          type_note?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          contenu?: string | null;
          contenu_brut?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction_id?: string;
          exercice_id?: string | null;
          fichier_original_nom?: string | null;
          fichier_original_url?: string | null;
          id?: string;
          priorite?: string;
          statut?: string;
          tags?: string[] | null;
          titre?: string;
          type_note?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_direction_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_direction_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_direction_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_direction_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_direction_exercice_id_fkey';
            columns: ['exercice_id'];
            isOneToOne: false;
            referencedRelation: 'exercices_budgetaires';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef: {
        Row: {
          beneficiaire_id: string | null;
          beneficiaire_interne_id: string | null;
          beneficiaire_nom: string | null;
          beneficiaire_type: string | null;
          commentaire: string | null;
          created_at: string;
          created_by: string | null;
          date_souhaitee: string | null;
          decided_at: string | null;
          decided_by: string | null;
          decision_reason: string | null;
          demandeur_display: string | null;
          demandeur_id: string | null;
          description: string | null;
          dg_validation_required: boolean | null;
          differe_at: string | null;
          differe_by: string | null;
          differe_condition: string | null;
          differe_date_reprise: string | null;
          differe_motif: string | null;
          direction_id: string | null;
          dossier_id: string | null;
          exercice: number;
          id: string;
          initiales_redacteur: string | null;
          is_deleted: boolean | null;
          justification: string | null;
          mission_id: string | null;
          montant_estime: number | null;
          note_aef_id: string | null;
          numero: string | null;
          objet: string;
          observations_dg: string | null;
          os_id: string | null;
          projet_id: string | null;
          redacteur_id: string | null;
          reference_pivot: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          statut: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          type_demande_id: string | null;
          type_depense: string | null;
          updated_at: string;
          urgence: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          beneficiaire_id?: string | null;
          beneficiaire_interne_id?: string | null;
          beneficiaire_nom?: string | null;
          beneficiaire_type?: string | null;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_souhaitee?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_reason?: string | null;
          demandeur_display?: string | null;
          demandeur_id?: string | null;
          description?: string | null;
          dg_validation_required?: boolean | null;
          differe_at?: string | null;
          differe_by?: string | null;
          differe_condition?: string | null;
          differe_date_reprise?: string | null;
          differe_motif?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          exercice?: number;
          id?: string;
          initiales_redacteur?: string | null;
          is_deleted?: boolean | null;
          justification?: string | null;
          mission_id?: string | null;
          montant_estime?: number | null;
          note_aef_id?: string | null;
          numero?: string | null;
          objet: string;
          observations_dg?: string | null;
          os_id?: string | null;
          projet_id?: string | null;
          redacteur_id?: string | null;
          reference_pivot?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          type_demande_id?: string | null;
          type_depense?: string | null;
          updated_at?: string;
          urgence?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          beneficiaire_id?: string | null;
          beneficiaire_interne_id?: string | null;
          beneficiaire_nom?: string | null;
          beneficiaire_type?: string | null;
          commentaire?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_souhaitee?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_reason?: string | null;
          demandeur_display?: string | null;
          demandeur_id?: string | null;
          description?: string | null;
          dg_validation_required?: boolean | null;
          differe_at?: string | null;
          differe_by?: string | null;
          differe_condition?: string | null;
          differe_date_reprise?: string | null;
          differe_motif?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          exercice?: number;
          id?: string;
          initiales_redacteur?: string | null;
          is_deleted?: boolean | null;
          justification?: string | null;
          mission_id?: string | null;
          montant_estime?: number | null;
          note_aef_id?: string | null;
          numero?: string | null;
          objet?: string;
          observations_dg?: string | null;
          os_id?: string | null;
          projet_id?: string | null;
          redacteur_id?: string | null;
          reference_pivot?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          type_demande_id?: string | null;
          type_depense?: string | null;
          updated_at?: string;
          urgence?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_sef_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_beneficiaire_interne_id_fkey';
            columns: ['beneficiaire_interne_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_beneficiaire_interne_id_fkey';
            columns: ['beneficiaire_interne_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_decided_by_fkey';
            columns: ['decided_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_decided_by_fkey';
            columns: ['decided_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_demandeur_id_fkey';
            columns: ['demandeur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_demandeur_id_fkey';
            columns: ['demandeur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_differe_by_fkey';
            columns: ['differe_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_differe_by_fkey';
            columns: ['differe_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_sef_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_sef_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_sef_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'notes_sef_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'notes_sef_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
          {
            foreignKeyName: 'notes_sef_projet_id_fkey';
            columns: ['projet_id'];
            isOneToOne: false;
            referencedRelation: 'projets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_projet_id_fkey';
            columns: ['projet_id'];
            isOneToOne: false;
            referencedRelation: 'projets_avec_disponible';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_redacteur_id_fkey';
            columns: ['redacteur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_redacteur_id_fkey';
            columns: ['redacteur_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_type_demande_id_fkey';
            columns: ['type_demande_id'];
            isOneToOne: false;
            referencedRelation: 'types_demande';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef_attachments: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          note_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          note_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          note_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_sef_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_attachments_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef_history: {
        Row: {
          action: string;
          commentaire: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          new_statut: string | null;
          note_id: string;
          old_statut: string | null;
          performed_at: string;
          performed_by: string | null;
        };
        Insert: {
          action: string;
          commentaire?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_statut?: string | null;
          note_id: string;
          old_statut?: string | null;
          performed_at?: string;
          performed_by?: string | null;
        };
        Update: {
          action?: string;
          commentaire?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_statut?: string | null;
          note_id?: string;
          old_statut?: string | null;
          performed_at?: string;
          performed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_sef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef_imputations: {
        Row: {
          commentaire: string | null;
          created_at: string | null;
          direction_id: string;
          est_principale: boolean | null;
          id: string;
          note_sef_id: string;
          statut: string | null;
          traite_le: string | null;
          traite_par: string | null;
          updated_at: string | null;
        };
        Insert: {
          commentaire?: string | null;
          created_at?: string | null;
          direction_id: string;
          est_principale?: boolean | null;
          id?: string;
          note_sef_id: string;
          statut?: string | null;
          traite_le?: string | null;
          traite_par?: string | null;
          updated_at?: string | null;
        };
        Update: {
          commentaire?: string | null;
          created_at?: string | null;
          direction_id?: string;
          est_principale?: boolean | null;
          id?: string;
          note_sef_id?: string;
          statut?: string | null;
          traite_le?: string | null;
          traite_par?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_sef_imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_traite_par_fkey';
            columns: ['traite_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_imputations_traite_par_fkey';
            columns: ['traite_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef_pieces: {
        Row: {
          fichier_url: string;
          file_hash: string | null;
          id: string;
          nom: string;
          note_id: string;
          taille: number | null;
          type_fichier: string | null;
          uploaded_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          fichier_url: string;
          file_hash?: string | null;
          id?: string;
          nom: string;
          note_id: string;
          taille?: number | null;
          type_fichier?: string | null;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          fichier_url?: string;
          file_hash?: string | null;
          id?: string;
          nom?: string;
          note_id?: string;
          taille?: number | null;
          type_fichier?: string | null;
          uploaded_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_sef_pieces_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_pieces_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_pieces_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_pieces_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_pieces_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef_sequences: {
        Row: {
          annee: number;
          dernier_numero: number;
          id: string;
          updated_at: string;
        };
        Insert: {
          annee: number;
          dernier_numero?: number;
          id?: string;
          updated_at?: string;
        };
        Update: {
          annee?: number;
          dernier_numero?: number;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          canal: string | null;
          corps_rendu: string | null;
          created_at: string | null;
          entity_id: string | null;
          entity_type: string | null;
          erreur: string | null;
          id: string;
          notification_id: string | null;
          read_at: string | null;
          recipient_id: string;
          sent_at: string | null;
          statut: string | null;
          template_id: string | null;
          titre_rendu: string | null;
          variables_utilisees: Json | null;
        };
        Insert: {
          canal?: string | null;
          corps_rendu?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          erreur?: string | null;
          id?: string;
          notification_id?: string | null;
          read_at?: string | null;
          recipient_id: string;
          sent_at?: string | null;
          statut?: string | null;
          template_id?: string | null;
          titre_rendu?: string | null;
          variables_utilisees?: Json | null;
        };
        Update: {
          canal?: string | null;
          corps_rendu?: string | null;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          erreur?: string | null;
          id?: string;
          notification_id?: string | null;
          read_at?: string | null;
          recipient_id?: string;
          sent_at?: string | null;
          statut?: string | null;
          template_id?: string | null;
          titre_rendu?: string | null;
          variables_utilisees?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_logs_notification_id_fkey';
            columns: ['notification_id'];
            isOneToOne: false;
            referencedRelation: 'notifications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'notification_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          created_at: string;
          email_daily_summary: boolean | null;
          email_enabled: boolean | null;
          email_summary_time: string | null;
          id: string;
          in_app_enabled: boolean | null;
          notify_budget_alert: boolean | null;
          notify_deadline: boolean | null;
          notify_new_validation: boolean | null;
          notify_rejection: boolean | null;
          notify_workflow_update: boolean | null;
          phone_number: string | null;
          sms_enabled: boolean | null;
          sms_urgent_only: boolean | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email_daily_summary?: boolean | null;
          email_enabled?: boolean | null;
          email_summary_time?: string | null;
          id?: string;
          in_app_enabled?: boolean | null;
          notify_budget_alert?: boolean | null;
          notify_deadline?: boolean | null;
          notify_new_validation?: boolean | null;
          notify_rejection?: boolean | null;
          notify_workflow_update?: boolean | null;
          phone_number?: string | null;
          sms_enabled?: boolean | null;
          sms_urgent_only?: boolean | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email_daily_summary?: boolean | null;
          email_enabled?: boolean | null;
          email_summary_time?: string | null;
          id?: string;
          in_app_enabled?: boolean | null;
          notify_budget_alert?: boolean | null;
          notify_deadline?: boolean | null;
          notify_new_validation?: boolean | null;
          notify_rejection?: boolean | null;
          notify_workflow_update?: boolean | null;
          phone_number?: string | null;
          sms_enabled?: boolean | null;
          sms_urgent_only?: boolean | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_recipients: {
        Row: {
          created_at: string | null;
          direction_id: string | null;
          est_actif: boolean | null;
          id: string;
          role_hierarchique: string | null;
          type_evenement: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          direction_id?: string | null;
          est_actif?: boolean | null;
          id?: string;
          role_hierarchique?: string | null;
          type_evenement: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          direction_id?: string | null;
          est_actif?: boolean | null;
          id?: string;
          role_hierarchique?: string | null;
          type_evenement?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_recipients_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_recipients_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notification_recipients_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notification_recipients_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notification_recipients_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_recipients_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_role_settings: {
        Row: {
          created_at: string | null;
          email_enabled: boolean | null;
          id: string;
          in_app_enabled: boolean | null;
          notification_type: string;
          role_code: string;
          sms_enabled: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          in_app_enabled?: boolean | null;
          notification_type: string;
          role_code: string;
          sms_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          in_app_enabled?: boolean | null;
          notification_type?: string;
          role_code?: string;
          sms_enabled?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notification_templates: {
        Row: {
          code: string;
          corps_template: string;
          created_at: string | null;
          est_actif: boolean | null;
          id: string;
          titre_template: string;
          type_evenement: string;
          updated_at: string | null;
          variables_disponibles: Json | null;
        };
        Insert: {
          code: string;
          corps_template: string;
          created_at?: string | null;
          est_actif?: boolean | null;
          id?: string;
          titre_template: string;
          type_evenement: string;
          updated_at?: string | null;
          variables_disponibles?: Json | null;
        };
        Update: {
          code?: string;
          corps_template?: string;
          created_at?: string | null;
          est_actif?: boolean | null;
          id?: string;
          titre_template?: string;
          type_evenement?: string;
          updated_at?: string | null;
          variables_disponibles?: Json | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          category: string;
          created_at: string;
          date_email: string | null;
          email_envoye: boolean | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          is_read: boolean | null;
          is_urgent: boolean | null;
          message: string;
          read_at: string | null;
          title: string;
          type: string;
          urgence: string | null;
          user_id: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          date_email?: string | null;
          email_envoye?: boolean | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          is_read?: boolean | null;
          is_urgent?: boolean | null;
          message: string;
          read_at?: string | null;
          title: string;
          type?: string;
          urgence?: string | null;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          date_email?: string | null;
          email_envoye?: boolean | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          is_read?: boolean | null;
          is_urgent?: boolean | null;
          message?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          urgence?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      objectifs_strategiques: {
        Row: {
          annee_debut: number;
          annee_fin: number;
          code: string;
          created_at: string | null;
          date_modification: string | null;
          description: string | null;
          est_actif: boolean | null;
          id: string;
          last_sync_at: string | null;
          last_sync_file: string | null;
          libelle: string;
          libelle_modifie: string | null;
          updated_at: string | null;
        };
        Insert: {
          annee_debut: number;
          annee_fin: number;
          code: string;
          created_at?: string | null;
          date_modification?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle: string;
          libelle_modifie?: string | null;
          updated_at?: string | null;
        };
        Update: {
          annee_debut?: number;
          annee_fin?: number;
          code?: string;
          created_at?: string | null;
          date_modification?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle?: string;
          libelle_modifie?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      operation_tresorerie_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      operations_tresorerie: {
        Row: {
          compte_destination_id: string | null;
          compte_id: string;
          created_at: string | null;
          created_by: string | null;
          date_operation: string;
          date_rapprochement: string | null;
          date_valeur: string | null;
          exercice: number | null;
          id: string;
          libelle: string;
          montant: number;
          numero: string | null;
          rapproche: boolean | null;
          recette_id: string | null;
          reference_externe: string | null;
          reglement_id: string | null;
          solde_apres: number | null;
          solde_avant: number | null;
          type_operation: string;
        };
        Insert: {
          compte_destination_id?: string | null;
          compte_id: string;
          created_at?: string | null;
          created_by?: string | null;
          date_operation?: string;
          date_rapprochement?: string | null;
          date_valeur?: string | null;
          exercice?: number | null;
          id?: string;
          libelle: string;
          montant: number;
          numero?: string | null;
          rapproche?: boolean | null;
          recette_id?: string | null;
          reference_externe?: string | null;
          reglement_id?: string | null;
          solde_apres?: number | null;
          solde_avant?: number | null;
          type_operation: string;
        };
        Update: {
          compte_destination_id?: string | null;
          compte_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          date_operation?: string;
          date_rapprochement?: string | null;
          date_valeur?: string | null;
          exercice?: number | null;
          id?: string;
          libelle?: string;
          montant?: number;
          numero?: string | null;
          rapproche?: boolean | null;
          recette_id?: string | null;
          reference_externe?: string | null;
          reglement_id?: string | null;
          solde_apres?: number | null;
          solde_avant?: number | null;
          type_operation?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'operations_tresorerie_compte_destination_id_fkey';
            columns: ['compte_destination_id'];
            isOneToOne: false;
            referencedRelation: 'comptes_bancaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_compte_destination_id_fkey';
            columns: ['compte_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_etat_caisse';
            referencedColumns: ['compte_id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_compte_id_fkey';
            columns: ['compte_id'];
            isOneToOne: false;
            referencedRelation: 'comptes_bancaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_compte_id_fkey';
            columns: ['compte_id'];
            isOneToOne: false;
            referencedRelation: 'v_etat_caisse';
            referencedColumns: ['compte_id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'reglements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'operations_tresorerie_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglements_paiements';
            referencedColumns: ['id'];
          },
        ];
      };
      ordonnancement_attachments: {
        Row: {
          created_at: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          ordonnancement_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          ordonnancement_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          ordonnancement_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ordonnancement_attachments_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_attachments_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
          {
            foreignKeyName: 'ordonnancement_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      ordonnancement_pieces: {
        Row: {
          created_at: string | null;
          file_name: string | null;
          file_path: string | null;
          id: string;
          included_in_parapheur: boolean | null;
          ordonnancement_id: string;
          piece_label: string;
          piece_type: string;
          source_entity_id: string | null;
          source_entity_type: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          id?: string;
          included_in_parapheur?: boolean | null;
          ordonnancement_id: string;
          piece_label: string;
          piece_type: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_name?: string | null;
          file_path?: string | null;
          id?: string;
          included_in_parapheur?: boolean | null;
          ordonnancement_id?: string;
          piece_label?: string;
          piece_type?: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ordonnancement_pieces_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_pieces_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
        ];
      };
      ordonnancement_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ordonnancement_signatures: {
        Row: {
          comments: string | null;
          created_at: string | null;
          id: string;
          ordonnancement_id: string;
          required: boolean | null;
          role: string;
          signature_ip: string | null;
          signed_at: string | null;
          signed_by: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string | null;
          id?: string;
          ordonnancement_id: string;
          required?: boolean | null;
          role: string;
          signature_ip?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string | null;
          id?: string;
          ordonnancement_id?: string;
          required?: boolean | null;
          role?: string;
          signature_ip?: string | null;
          signed_at?: string | null;
          signed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ordonnancement_signatures_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_signatures_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
          {
            foreignKeyName: 'ordonnancement_signatures_signed_by_fkey';
            columns: ['signed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_signatures_signed_by_fkey';
            columns: ['signed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      ordonnancement_validations: {
        Row: {
          comments: string | null;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          ordonnancement_id: string;
          role: string;
          status: string | null;
          step_order: number;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          comments?: string | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          ordonnancement_id: string;
          role: string;
          status?: string | null;
          step_order: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          comments?: string | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          ordonnancement_id?: string;
          role?: string;
          status?: string | null;
          step_order?: number;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ordonnancement_validations_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_validations_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
          {
            foreignKeyName: 'ordonnancement_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancement_validations_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      ordonnancements: {
        Row: {
          banque: string | null;
          beneficiaire: string;
          code_locked: boolean | null;
          created_at: string;
          created_by: string | null;
          current_step: number | null;
          date_differe: string | null;
          date_entree_etape: string | null;
          date_prevue_paiement: string | null;
          deadline_correction: string | null;
          delai_validation_jours: number | null;
          differe_by: string | null;
          dossier_id: string | null;
          exercice: number | null;
          id: string;
          is_locked: boolean | null;
          legacy_import: boolean | null;
          liquidation_id: string;
          mode_paiement: string | null;
          montant: number;
          montant_paye: number | null;
          motif_differe: string | null;
          numero: string | null;
          objet: string;
          observation: string | null;
          pdf_path: string | null;
          reference_tresor: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          requires_dg_signature: boolean | null;
          rib: string | null;
          signed_daaf_at: string | null;
          signed_daaf_by: string | null;
          signed_dg_at: string | null;
          signed_dg_by: string | null;
          statut: string | null;
          submitted_at: string | null;
          transmitted_at: string | null;
          transmitted_by: string | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          workflow_status: string | null;
        };
        Insert: {
          banque?: string | null;
          beneficiaire: string;
          code_locked?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number | null;
          date_differe?: string | null;
          date_entree_etape?: string | null;
          date_prevue_paiement?: string | null;
          deadline_correction?: string | null;
          delai_validation_jours?: number | null;
          differe_by?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          is_locked?: boolean | null;
          legacy_import?: boolean | null;
          liquidation_id: string;
          mode_paiement?: string | null;
          montant: number;
          montant_paye?: number | null;
          motif_differe?: string | null;
          numero?: string | null;
          objet: string;
          observation?: string | null;
          pdf_path?: string | null;
          reference_tresor?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          requires_dg_signature?: boolean | null;
          rib?: string | null;
          signed_daaf_at?: string | null;
          signed_daaf_by?: string | null;
          signed_dg_at?: string | null;
          signed_dg_by?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          transmitted_at?: string | null;
          transmitted_by?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          workflow_status?: string | null;
        };
        Update: {
          banque?: string | null;
          beneficiaire?: string;
          code_locked?: boolean | null;
          created_at?: string;
          created_by?: string | null;
          current_step?: number | null;
          date_differe?: string | null;
          date_entree_etape?: string | null;
          date_prevue_paiement?: string | null;
          deadline_correction?: string | null;
          delai_validation_jours?: number | null;
          differe_by?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          is_locked?: boolean | null;
          legacy_import?: boolean | null;
          liquidation_id?: string;
          mode_paiement?: string | null;
          montant?: number;
          montant_paye?: number | null;
          motif_differe?: string | null;
          numero?: string | null;
          objet?: string;
          observation?: string | null;
          pdf_path?: string | null;
          reference_tresor?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          requires_dg_signature?: boolean | null;
          rib?: string | null;
          signed_daaf_at?: string | null;
          signed_daaf_by?: string | null;
          signed_dg_at?: string | null;
          signed_dg_by?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          transmitted_at?: string | null;
          transmitted_by?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          workflow_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ordonnancements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_differe_by_fkey';
            columns: ['differe_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_differe_by_fkey';
            columns: ['differe_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'ordonnancements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'ordonnancements_liquidation_id_fkey';
            columns: ['liquidation_id'];
            isOneToOne: false;
            referencedRelation: 'budget_liquidations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_liquidation_id_fkey';
            columns: ['liquidation_id'];
            isOneToOne: false;
            referencedRelation: 'v_liquidations_urgentes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_signed_daaf_by_fkey';
            columns: ['signed_daaf_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_signed_daaf_by_fkey';
            columns: ['signed_daaf_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_signed_dg_by_fkey';
            columns: ['signed_dg_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_signed_dg_by_fkey';
            columns: ['signed_dg_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_transmitted_by_fkey';
            columns: ['transmitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_transmitted_by_fkey';
            columns: ['transmitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ordonnancements_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      lots_marche: {
        Row: {
          id: string;
          passation_marche_id: string;
          numero: number;
          designation: string;
          description: string | null;
          montant_estime: number | null;
          montant_retenu: number | null;
          prestataire_retenu_id: string | null;
          statut: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          passation_marche_id: string;
          numero?: number;
          designation?: string;
          description?: string | null;
          montant_estime?: number | null;
          montant_retenu?: number | null;
          prestataire_retenu_id?: string | null;
          statut?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          passation_marche_id?: string;
          numero?: number;
          designation?: string;
          description?: string | null;
          montant_estime?: number | null;
          montant_retenu?: number | null;
          prestataire_retenu_id?: string | null;
          statut?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lots_marche_passation_marche_id_fkey';
            columns: ['passation_marche_id'];
            isOneToOne: false;
            referencedRelation: 'passation_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lots_marche_prestataire_retenu_id_fkey';
            columns: ['prestataire_retenu_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
        ];
      };
      soumissionnaires_lot: {
        Row: {
          id: string;
          passation_marche_id: string;
          lot_marche_id: string | null;
          prestataire_id: string | null;
          is_manual_entry: boolean;
          raison_sociale: string;
          contact_nom: string | null;
          email: string | null;
          telephone: string | null;
          rccm: string | null;
          offre_technique_url: string | null;
          offre_financiere: number | null;
          date_depot: string | null;
          note_technique: number | null;
          note_financiere: number | null;
          statut: string;
          motif_elimination: string | null;
          observations: string | null;
          qualifie_technique: boolean;
          note_finale: number | null;
          rang_classement: number | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          passation_marche_id: string;
          lot_marche_id?: string | null;
          prestataire_id?: string | null;
          is_manual_entry?: boolean;
          raison_sociale: string;
          contact_nom?: string | null;
          email?: string | null;
          telephone?: string | null;
          rccm?: string | null;
          offre_technique_url?: string | null;
          offre_financiere?: number | null;
          date_depot?: string | null;
          note_technique?: number | null;
          note_financiere?: number | null;
          statut?: string;
          motif_elimination?: string | null;
          observations?: string | null;
          qualifie_technique?: boolean;
          note_finale?: number | null;
          rang_classement?: number | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          passation_marche_id?: string;
          lot_marche_id?: string | null;
          prestataire_id?: string | null;
          is_manual_entry?: boolean;
          raison_sociale?: string;
          contact_nom?: string | null;
          email?: string | null;
          telephone?: string | null;
          rccm?: string | null;
          offre_technique_url?: string | null;
          offre_financiere?: number | null;
          date_depot?: string | null;
          note_technique?: number | null;
          note_financiere?: number | null;
          statut?: string;
          motif_elimination?: string | null;
          observations?: string | null;
          qualifie_technique?: boolean;
          note_finale?: number | null;
          rang_classement?: number | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'soumissionnaires_lot_passation_marche_id_fkey';
            columns: ['passation_marche_id'];
            isOneToOne: false;
            referencedRelation: 'passation_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissionnaires_lot_lot_marche_id_fkey';
            columns: ['lot_marche_id'];
            isOneToOne: false;
            referencedRelation: 'lots_marche';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissionnaires_lot_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissionnaires_lot_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      passation_marche: {
        Row: {
          allotissement: boolean | null;
          analyse_offres: Json | null;
          created_at: string | null;
          created_by: string | null;
          criteres_evaluation: Json | null;
          date_reprise: string | null;
          decision: string | null;
          differed_at: string | null;
          differed_by: string | null;
          dossier_id: string | null;
          exercice: number | null;
          expression_besoin_id: string | null;
          id: string;
          ligne_budgetaire_id: string | null;
          mode_passation: string;
          montant_retenu: number | null;
          motif_differe: string | null;
          motif_selection: string | null;
          pieces_jointes: Json | null;
          prestataire_retenu_id: string | null;
          prestataires_sollicites: Json | null;
          pv_evaluation: string | null;
          pv_ouverture: string | null;
          rapport_analyse: string | null;
          reference: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          seuil_montant: string | null;
          statut: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          type_procedure: string | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          allotissement?: boolean | null;
          analyse_offres?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          criteres_evaluation?: Json | null;
          date_reprise?: string | null;
          decision?: string | null;
          differed_at?: string | null;
          differed_by?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          expression_besoin_id?: string | null;
          id?: string;
          ligne_budgetaire_id?: string | null;
          mode_passation?: string;
          montant_retenu?: number | null;
          motif_differe?: string | null;
          motif_selection?: string | null;
          pieces_jointes?: Json | null;
          prestataire_retenu_id?: string | null;
          prestataires_sollicites?: Json | null;
          pv_evaluation?: string | null;
          pv_ouverture?: string | null;
          rapport_analyse?: string | null;
          reference?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          seuil_montant?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          type_procedure?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          allotissement?: boolean | null;
          analyse_offres?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          criteres_evaluation?: Json | null;
          date_reprise?: string | null;
          decision?: string | null;
          differed_at?: string | null;
          differed_by?: string | null;
          dossier_id?: string | null;
          exercice?: number | null;
          expression_besoin_id?: string | null;
          id?: string;
          ligne_budgetaire_id?: string | null;
          mode_passation?: string;
          montant_retenu?: number | null;
          motif_differe?: string | null;
          motif_selection?: string | null;
          pieces_jointes?: Json | null;
          prestataire_retenu_id?: string | null;
          prestataires_sollicites?: Json | null;
          pv_evaluation?: string | null;
          pv_ouverture?: string | null;
          rapport_analyse?: string | null;
          reference?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          seuil_montant?: string | null;
          statut?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          type_procedure?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'passation_marche_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_differed_by_fkey';
            columns: ['differed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_differed_by_fkey';
            columns: ['differed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'passation_marche_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'passation_marche_expression_besoin_id_fkey';
            columns: ['expression_besoin_id'];
            isOneToOne: false;
            referencedRelation: 'expressions_besoin';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_prestataire_retenu_id_fkey';
            columns: ['prestataire_retenu_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_prestataire_retenu_id_fkey';
            columns: ['prestataire_retenu_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_rejected_by_fkey';
            columns: ['rejected_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'passation_marche_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      permission_actions: {
        Row: {
          category: string;
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          label: string;
        };
        Insert: {
          category?: string;
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          label: string;
        };
        Update: {
          category?: string;
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string;
        };
        Relationships: [];
      };
      personnel_arti: {
        Row: {
          categorie: string | null;
          civilite: string | null;
          college: string | null;
          created_at: string | null;
          date_embauche: string | null;
          date_naissance: string | null;
          direction_code: string | null;
          direction_nom: string | null;
          domaine_formation: string | null;
          email: string | null;
          etat: string | null;
          famille: string | null;
          id: string;
          is_active: boolean | null;
          manager: string | null;
          matricule: string;
          matricule_cnps: string | null;
          niveau_etude: string | null;
          nom_complet: string;
          poste_occupe: string | null;
          profile_id: string | null;
          segment: string | null;
          sexe: string | null;
          type_contrat: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          categorie?: string | null;
          civilite?: string | null;
          college?: string | null;
          created_at?: string | null;
          date_embauche?: string | null;
          date_naissance?: string | null;
          direction_code?: string | null;
          direction_nom?: string | null;
          domaine_formation?: string | null;
          email?: string | null;
          etat?: string | null;
          famille?: string | null;
          id?: string;
          is_active?: boolean | null;
          manager?: string | null;
          matricule: string;
          matricule_cnps?: string | null;
          niveau_etude?: string | null;
          nom_complet: string;
          poste_occupe?: string | null;
          profile_id?: string | null;
          segment?: string | null;
          sexe?: string | null;
          type_contrat?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          categorie?: string | null;
          civilite?: string | null;
          college?: string | null;
          created_at?: string | null;
          date_embauche?: string | null;
          date_naissance?: string | null;
          direction_code?: string | null;
          direction_nom?: string | null;
          domaine_formation?: string | null;
          email?: string | null;
          etat?: string | null;
          famille?: string | null;
          id?: string;
          is_active?: boolean | null;
          manager?: string | null;
          matricule?: string;
          matricule_cnps?: string | null;
          niveau_etude?: string | null;
          nom_complet?: string;
          poste_occupe?: string | null;
          profile_id?: string | null;
          segment?: string | null;
          sexe?: string | null;
          type_contrat?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'personnel_arti_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personnel_arti_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_comptable_sysco: {
        Row: {
          classe: string | null;
          code: string;
          created_at: string | null;
          est_active: boolean | null;
          id: string;
          libelle: string;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          classe?: string | null;
          code: string;
          created_at?: string | null;
          est_active?: boolean | null;
          id?: string;
          libelle: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          classe?: string | null;
          code?: string;
          created_at?: string | null;
          est_active?: boolean | null;
          id?: string;
          libelle?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      positions: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          direction_id: string | null;
          hierarchy_level: number | null;
          id: string;
          is_active: boolean | null;
          is_entity_chief: boolean | null;
          label: string;
          role_code: string | null;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          direction_id?: string | null;
          hierarchy_level?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_entity_chief?: boolean | null;
          label: string;
          role_code?: string | null;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          direction_id?: string | null;
          hierarchy_level?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_entity_chief?: boolean | null;
          label?: string;
          role_code?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'positions_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'positions_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'positions_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'positions_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      prestataire_requests: {
        Row: {
          adresse: string | null;
          cc: string | null;
          code_admission: string | null;
          code_comptable: string | null;
          commentaire_controle: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          ninea: string | null;
          prestataire_id: string | null;
          raison_sociale: string;
          rccm: string | null;
          rib_banque: string | null;
          rib_cle: string | null;
          rib_numero: string | null;
          secteur_principal_id: string | null;
          secteur_secondaire_id: string | null;
          source: string | null;
          statut: string;
          submitted_at: string | null;
          submitted_by: string | null;
          submitted_email: string | null;
          telephone: string | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          adresse?: string | null;
          cc?: string | null;
          code_admission?: string | null;
          code_comptable?: string | null;
          commentaire_controle?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          ninea?: string | null;
          prestataire_id?: string | null;
          raison_sociale: string;
          rccm?: string | null;
          rib_banque?: string | null;
          rib_cle?: string | null;
          rib_numero?: string | null;
          secteur_principal_id?: string | null;
          secteur_secondaire_id?: string | null;
          source?: string | null;
          statut?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          submitted_email?: string | null;
          telephone?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          adresse?: string | null;
          cc?: string | null;
          code_admission?: string | null;
          code_comptable?: string | null;
          commentaire_controle?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          ninea?: string | null;
          prestataire_id?: string | null;
          raison_sociale?: string;
          rccm?: string | null;
          rib_banque?: string | null;
          rib_cle?: string | null;
          rib_numero?: string | null;
          secteur_principal_id?: string | null;
          secteur_secondaire_id?: string | null;
          source?: string | null;
          statut?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          submitted_email?: string | null;
          telephone?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prestataire_requests_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_secteur_principal_id_fkey';
            columns: ['secteur_principal_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_secteur_secondaire_id_fkey';
            columns: ['secteur_secondaire_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataire_requests_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      prestataires: {
        Row: {
          adresse: string | null;
          cc: string | null;
          code: string;
          code_admission: string | null;
          code_comptable: string | null;
          contact_email: string | null;
          contact_fonction: string | null;
          contact_nom: string | null;
          contact_telephone: string | null;
          created_at: string;
          created_by: string | null;
          date_expiration_fiscale: string | null;
          date_qualification: string | null;
          documents_fiscaux: Json | null;
          email: string | null;
          id: string;
          ifu: string | null;
          motif_suspension: string | null;
          nif: string | null;
          ninea: string | null;
          raison_sociale: string;
          rccm: string | null;
          rib_banque: string | null;
          rib_cle: string | null;
          rib_numero: string | null;
          secteur_activite: string | null;
          secteur_principal_id: string | null;
          secteur_secondaire_id: string | null;
          sigle: string | null;
          statut: string | null;
          statut_fiscal: string | null;
          suspended_at: string | null;
          suspended_by: string | null;
          telephone: string | null;
          type_prestataire: string | null;
          updated_at: string;
          validated_at: string | null;
          validated_by: string | null;
          ville: string | null;
        };
        Insert: {
          adresse?: string | null;
          cc?: string | null;
          code: string;
          code_admission?: string | null;
          code_comptable?: string | null;
          contact_email?: string | null;
          contact_fonction?: string | null;
          contact_nom?: string | null;
          contact_telephone?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_expiration_fiscale?: string | null;
          date_qualification?: string | null;
          documents_fiscaux?: Json | null;
          email?: string | null;
          id?: string;
          ifu?: string | null;
          motif_suspension?: string | null;
          nif?: string | null;
          ninea?: string | null;
          raison_sociale: string;
          rccm?: string | null;
          rib_banque?: string | null;
          rib_cle?: string | null;
          rib_numero?: string | null;
          secteur_activite?: string | null;
          secteur_principal_id?: string | null;
          secteur_secondaire_id?: string | null;
          sigle?: string | null;
          statut?: string | null;
          statut_fiscal?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
          telephone?: string | null;
          type_prestataire?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          ville?: string | null;
        };
        Update: {
          adresse?: string | null;
          cc?: string | null;
          code?: string;
          code_admission?: string | null;
          code_comptable?: string | null;
          contact_email?: string | null;
          contact_fonction?: string | null;
          contact_nom?: string | null;
          contact_telephone?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_expiration_fiscale?: string | null;
          date_qualification?: string | null;
          documents_fiscaux?: Json | null;
          email?: string | null;
          id?: string;
          ifu?: string | null;
          motif_suspension?: string | null;
          nif?: string | null;
          ninea?: string | null;
          raison_sociale?: string;
          rccm?: string | null;
          rib_banque?: string | null;
          rib_cle?: string | null;
          rib_numero?: string | null;
          secteur_activite?: string | null;
          secteur_principal_id?: string | null;
          secteur_secondaire_id?: string | null;
          sigle?: string | null;
          statut?: string | null;
          statut_fiscal?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
          telephone?: string | null;
          type_prestataire?: string | null;
          updated_at?: string;
          validated_at?: string | null;
          validated_by?: string | null;
          ville?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prestataires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_secteur_principal_id_fkey';
            columns: ['secteur_principal_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_secteur_secondaire_id_fkey';
            columns: ['secteur_secondaire_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_suspended_by_fkey';
            columns: ['suspended_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_suspended_by_fkey';
            columns: ['suspended_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      production_checklist: {
        Row: {
          check_category: string | null;
          check_key: string;
          check_label: string;
          checked_at: string | null;
          checked_by: string | null;
          created_at: string | null;
          exercice: number;
          id: string;
          is_checked: boolean | null;
          notes: string | null;
          ordre: number | null;
          updated_at: string | null;
        };
        Insert: {
          check_category?: string | null;
          check_key: string;
          check_label: string;
          checked_at?: string | null;
          checked_by?: string | null;
          created_at?: string | null;
          exercice: number;
          id?: string;
          is_checked?: boolean | null;
          notes?: string | null;
          ordre?: number | null;
          updated_at?: string | null;
        };
        Update: {
          check_category?: string | null;
          check_key?: string;
          check_label?: string;
          checked_at?: string | null;
          checked_by?: string | null;
          created_at?: string | null;
          exercice?: number;
          id?: string;
          is_checked?: boolean | null;
          notes?: string | null;
          ordre?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'production_checklist_checked_by_fkey';
            columns: ['checked_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'production_checklist_checked_by_fkey';
            columns: ['checked_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          direction_code: string | null;
          direction_id: string | null;
          email: string;
          exercice_actif: number | null;
          exercises_allowed: string[] | null;
          first_name: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean | null;
          last_name: string | null;
          matricule: string | null;
          poste: string | null;
          profil_fonctionnel: Database['public']['Enums']['profil_fonctionnel'] | null;
          role_hierarchique: Database['public']['Enums']['role_hierarchique'] | null;
          supervisor_id: string | null;
          telephone: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          direction_code?: string | null;
          direction_id?: string | null;
          email: string;
          exercice_actif?: number | null;
          exercises_allowed?: string[] | null;
          first_name?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean | null;
          last_name?: string | null;
          matricule?: string | null;
          poste?: string | null;
          profil_fonctionnel?: Database['public']['Enums']['profil_fonctionnel'] | null;
          role_hierarchique?: Database['public']['Enums']['role_hierarchique'] | null;
          supervisor_id?: string | null;
          telephone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          direction_code?: string | null;
          direction_id?: string | null;
          email?: string;
          exercice_actif?: number | null;
          exercises_allowed?: string[] | null;
          first_name?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_name?: string | null;
          matricule?: string | null;
          poste?: string | null;
          profil_fonctionnel?: Database['public']['Enums']['profil_fonctionnel'] | null;
          role_hierarchique?: Database['public']['Enums']['role_hierarchique'] | null;
          supervisor_id?: string | null;
          telephone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'profiles_supervisor_id_fkey';
            columns: ['supervisor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_supervisor_id_fkey';
            columns: ['supervisor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      project_progress_updates: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          new_percent: number;
          photo_path: string | null;
          previous_percent: number;
          project_id: string;
          updated_by: string | null;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          new_percent: number;
          photo_path?: string | null;
          previous_percent: number;
          project_id: string;
          updated_by?: string | null;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          new_percent?: number;
          photo_path?: string | null;
          previous_percent?: number;
          project_id?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_progress_updates_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_progress_updates_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects_with_financial';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_progress_updates_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_progress_updates_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          budget_total: number;
          created_at: string;
          description: string | null;
          direction_id: string | null;
          end_date: string | null;
          exercice: number;
          financial_percent: number | null;
          id: string;
          name: string;
          owner_id: string | null;
          physical_percent: number;
          start_date: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          budget_total?: number;
          created_at?: string;
          description?: string | null;
          direction_id?: string | null;
          end_date?: string | null;
          exercice?: number;
          financial_percent?: number | null;
          id?: string;
          name: string;
          owner_id?: string | null;
          physical_percent?: number;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          budget_total?: number;
          created_at?: string;
          description?: string | null;
          direction_id?: string | null;
          end_date?: string | null;
          exercice?: number;
          financial_percent?: number | null;
          id?: string;
          name?: string;
          owner_id?: string | null;
          physical_percent?: number;
          start_date?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projects_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      projets: {
        Row: {
          actif: boolean | null;
          budget_alloue: number | null;
          budget_consomme: number | null;
          code: string;
          created_at: string | null;
          created_by: string | null;
          date_debut: string | null;
          date_fin: string | null;
          description: string | null;
          direction_id: string | null;
          exercice: number;
          id: string;
          libelle: string;
          priorite: string | null;
          responsable_id: string | null;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          budget_alloue?: number | null;
          budget_consomme?: number | null;
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          description?: string | null;
          direction_id?: string | null;
          exercice?: number;
          id?: string;
          libelle: string;
          priorite?: string | null;
          responsable_id?: string | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          budget_alloue?: number | null;
          budget_consomme?: number | null;
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          description?: string | null;
          direction_id?: string | null;
          exercice?: number;
          id?: string;
          libelle?: string;
          priorite?: string | null;
          responsable_id?: string | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projets_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projets_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      raci_matrix: {
        Row: {
          actif: boolean | null;
          created_at: string | null;
          description: string | null;
          id: string;
          module_key: string | null;
          ordre: number | null;
          processus: string;
          processus_code: string;
          role_accountable: string | null;
          role_responsible: string | null;
          roles_consulted: Json | null;
          roles_informed: Json | null;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module_key?: string | null;
          ordre?: number | null;
          processus: string;
          processus_code: string;
          role_accountable?: string | null;
          role_responsible?: string | null;
          roles_consulted?: Json | null;
          roles_informed?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module_key?: string | null;
          ordre?: number | null;
          processus?: string;
          processus_code?: string;
          role_accountable?: string | null;
          role_responsible?: string | null;
          roles_consulted?: Json | null;
          roles_informed?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      rate_limit_qrcode: {
        Row: {
          id: string;
          ip_address: unknown;
          last_request: string;
          request_count: number;
          window_start: string;
        };
        Insert: {
          id?: string;
          ip_address: unknown;
          last_request?: string;
          request_count?: number;
          window_start?: string;
        };
        Update: {
          id?: string;
          ip_address?: unknown;
          last_request?: string;
          request_count?: number;
          window_start?: string;
        };
        Relationships: [];
      };
      reamenagements_budgetaires: {
        Row: {
          budget_destination_apres: number;
          budget_destination_avant: number;
          budget_line_destination_id: string;
          budget_line_source_id: string;
          budget_source_apres: number;
          budget_source_avant: number;
          created_at: string;
          created_by: string | null;
          date_validation: string | null;
          exercice: number;
          id: string;
          imputation_destination: string;
          imputation_source: string;
          libelle_destination: string | null;
          libelle_source: string | null;
          montant: number;
          motif: string;
          motif_rejet: string | null;
          mouvement_destination_id: string | null;
          mouvement_source_id: string | null;
          nature_nbe_destination: string | null;
          nature_nbe_source: string | null;
          reference_note: string | null;
          statut: string;
          updated_at: string;
          valide_par: string | null;
        };
        Insert: {
          budget_destination_apres?: number;
          budget_destination_avant?: number;
          budget_line_destination_id: string;
          budget_line_source_id: string;
          budget_source_apres?: number;
          budget_source_avant?: number;
          created_at?: string;
          created_by?: string | null;
          date_validation?: string | null;
          exercice: number;
          id?: string;
          imputation_destination: string;
          imputation_source: string;
          libelle_destination?: string | null;
          libelle_source?: string | null;
          montant: number;
          motif: string;
          motif_rejet?: string | null;
          mouvement_destination_id?: string | null;
          mouvement_source_id?: string | null;
          nature_nbe_destination?: string | null;
          nature_nbe_source?: string | null;
          reference_note?: string | null;
          statut?: string;
          updated_at?: string;
          valide_par?: string | null;
        };
        Update: {
          budget_destination_apres?: number;
          budget_destination_avant?: number;
          budget_line_destination_id?: string;
          budget_line_source_id?: string;
          budget_source_apres?: number;
          budget_source_avant?: number;
          created_at?: string;
          created_by?: string | null;
          date_validation?: string | null;
          exercice?: number;
          id?: string;
          imputation_destination?: string;
          imputation_source?: string;
          libelle_destination?: string | null;
          libelle_source?: string | null;
          montant?: number;
          motif?: string;
          motif_rejet?: string | null;
          mouvement_destination_id?: string | null;
          mouvement_source_id?: string | null;
          nature_nbe_destination?: string | null;
          nature_nbe_source?: string | null;
          reference_note?: string | null;
          statut?: string;
          updated_at?: string;
          valide_par?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_mouvement_destination_id_fkey';
            columns: ['mouvement_destination_id'];
            isOneToOne: false;
            referencedRelation: 'budget_movements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_mouvement_source_id_fkey';
            columns: ['mouvement_source_id'];
            isOneToOne: false;
            referencedRelation: 'budget_movements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_valide_par_fkey';
            columns: ['valide_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_valide_par_fkey';
            columns: ['valide_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      reception_attachments: {
        Row: {
          created_at: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          reception_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          reception_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          reception_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reception_attachments_reception_id_fkey';
            columns: ['reception_id'];
            isOneToOne: false;
            referencedRelation: 'receptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reception_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reception_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      reception_lignes: {
        Row: {
          article_id: string;
          created_at: string | null;
          ecart: number | null;
          id: string;
          motif_ecart: string | null;
          prix_unitaire: number | null;
          quantite_acceptee: number | null;
          quantite_commandee: number | null;
          quantite_recue: number;
          reception_id: string;
        };
        Insert: {
          article_id: string;
          created_at?: string | null;
          ecart?: number | null;
          id?: string;
          motif_ecart?: string | null;
          prix_unitaire?: number | null;
          quantite_acceptee?: number | null;
          quantite_commandee?: number | null;
          quantite_recue: number;
          reception_id: string;
        };
        Update: {
          article_id?: string;
          created_at?: string | null;
          ecart?: number | null;
          id?: string;
          motif_ecart?: string | null;
          prix_unitaire?: number | null;
          quantite_acceptee?: number | null;
          quantite_commandee?: number | null;
          quantite_recue?: number;
          reception_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reception_lignes_article_id_fkey';
            columns: ['article_id'];
            isOneToOne: false;
            referencedRelation: 'articles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reception_lignes_reception_id_fkey';
            columns: ['reception_id'];
            isOneToOne: false;
            referencedRelation: 'receptions';
            referencedColumns: ['id'];
          },
        ];
      };
      reception_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      receptions: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          date_reception: string;
          demande_id: string | null;
          exercice: number | null;
          fournisseur: string | null;
          id: string;
          numero: string;
          numero_bl: string | null;
          numero_facture: string | null;
          observations: string | null;
          statut: string | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          date_reception?: string;
          demande_id?: string | null;
          exercice?: number | null;
          fournisseur?: string | null;
          id?: string;
          numero: string;
          numero_bl?: string | null;
          numero_facture?: string | null;
          observations?: string | null;
          statut?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          date_reception?: string;
          demande_id?: string | null;
          exercice?: number | null;
          fournisseur?: string | null;
          id?: string;
          numero?: string;
          numero_bl?: string | null;
          numero_facture?: string | null;
          observations?: string | null;
          statut?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'receptions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receptions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receptions_demande_id_fkey';
            columns: ['demande_id'];
            isOneToOne: false;
            referencedRelation: 'demandes_achat';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receptions_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receptions_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      recette_attachments: {
        Row: {
          created_at: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          recette_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          recette_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          recette_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recette_attachments_recette_id_fkey';
            columns: ['recette_id'];
            isOneToOne: false;
            referencedRelation: 'recettes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recette_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recette_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      recette_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      recettes: {
        Row: {
          categorie: string | null;
          compte_id: string | null;
          created_at: string | null;
          created_by: string | null;
          date_encaissement: string | null;
          date_recette: string;
          description: string | null;
          encaisse_par: string | null;
          exercice: number | null;
          id: string;
          montant: number;
          numero: string | null;
          origine: string;
          reference_justificatif: string | null;
          statut: string | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          categorie?: string | null;
          compte_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_encaissement?: string | null;
          date_recette?: string;
          description?: string | null;
          encaisse_par?: string | null;
          exercice?: number | null;
          id?: string;
          montant: number;
          numero?: string | null;
          origine: string;
          reference_justificatif?: string | null;
          statut?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          categorie?: string | null;
          compte_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_encaissement?: string | null;
          date_recette?: string;
          description?: string | null;
          encaisse_par?: string | null;
          exercice?: number | null;
          id?: string;
          montant?: number;
          numero?: string | null;
          origine?: string;
          reference_justificatif?: string | null;
          statut?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recettes_compte_id_fkey';
            columns: ['compte_id'];
            isOneToOne: false;
            referencedRelation: 'comptes_bancaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recettes_compte_id_fkey';
            columns: ['compte_id'];
            isOneToOne: false;
            referencedRelation: 'v_etat_caisse';
            referencedColumns: ['compte_id'];
          },
          {
            foreignKeyName: 'recettes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recettes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recettes_encaisse_par_fkey';
            columns: ['encaisse_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recettes_encaisse_par_fkey';
            columns: ['encaisse_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recettes_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recettes_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      ref_actions: {
        Row: {
          code: string;
          description: string | null;
          est_actif: boolean | null;
          id: string;
          libelle: string;
        };
        Insert: {
          code: string;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle: string;
        };
        Update: {
          code?: string;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle?: string;
        };
        Relationships: [];
      };
      ref_codification_rules: {
        Row: {
          actif: boolean | null;
          champs_contexte: Json | null;
          code_type: string;
          created_at: string | null;
          description: string | null;
          example_input: Json | null;
          example_output: string | null;
          exemple: string | null;
          format: string;
          format_numero: string | null;
          id: string;
          longueur_seq: number | null;
          module: string | null;
          notes: string | null;
          objet: string | null;
          ordre_composants: Json | null;
          pattern: Json | null;
          prefixe: string | null;
          reset_seq: string | null;
          separateur: string | null;
          updated_at: string | null;
          version: number | null;
        };
        Insert: {
          actif?: boolean | null;
          champs_contexte?: Json | null;
          code_type: string;
          created_at?: string | null;
          description?: string | null;
          example_input?: Json | null;
          example_output?: string | null;
          exemple?: string | null;
          format: string;
          format_numero?: string | null;
          id?: string;
          longueur_seq?: number | null;
          module?: string | null;
          notes?: string | null;
          objet?: string | null;
          ordre_composants?: Json | null;
          pattern?: Json | null;
          prefixe?: string | null;
          reset_seq?: string | null;
          separateur?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          actif?: boolean | null;
          champs_contexte?: Json | null;
          code_type?: string;
          created_at?: string | null;
          description?: string | null;
          example_input?: Json | null;
          example_output?: string | null;
          exemple?: string | null;
          format?: string;
          format_numero?: string | null;
          id?: string;
          longueur_seq?: number | null;
          module?: string | null;
          notes?: string | null;
          objet?: string | null;
          ordre_composants?: Json | null;
          pattern?: Json | null;
          prefixe?: string | null;
          reset_seq?: string | null;
          separateur?: string | null;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [];
      };
      ref_modules: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          est_actif: boolean | null;
          id: string;
          libelle: string;
          ordre_affichage: number | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle: string;
          ordre_affichage?: number | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle?: string;
          ordre_affichage?: number | null;
        };
        Relationships: [];
      };
      ref_nve: {
        Row: {
          actif: boolean | null;
          code_nve: string;
          created_at: string;
          id: string;
          libelle: string;
          updated_at: string;
        };
        Insert: {
          actif?: boolean | null;
          code_nve: string;
          created_at?: string;
          id?: string;
          libelle: string;
          updated_at?: string;
        };
        Update: {
          actif?: boolean | null;
          code_nve?: string;
          created_at?: string;
          id?: string;
          libelle?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ref_secteurs_activite: {
        Row: {
          actif: boolean | null;
          code: string;
          created_at: string | null;
          id: string;
          libelle: string;
          niveau: string;
          parent_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          code: string;
          created_at?: string | null;
          id?: string;
          libelle: string;
          niveau: string;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          code?: string;
          created_at?: string | null;
          id?: string;
          libelle?: string;
          niveau?: string;
          parent_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ref_secteurs_activite_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
        ];
      };
      ref_sequences: {
        Row: {
          created_at: string | null;
          id: string;
          last_value: number;
          objet: string;
          scope_key: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_value?: number;
          objet: string;
          scope_key: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_value?: number;
          objet?: string;
          scope_key?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ref_variables: {
        Row: {
          actif: boolean | null;
          code_variable: string;
          created_at: string | null;
          description: string | null;
          exemple: string | null;
          id: string;
          libelle: string;
          module_cible: string | null;
          module_source: string | null;
          obligatoire: boolean | null;
          source_of_truth: string | null;
          tables_concernees: Json | null;
          type_variable: string;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          code_variable: string;
          created_at?: string | null;
          description?: string | null;
          exemple?: string | null;
          id?: string;
          libelle: string;
          module_cible?: string | null;
          module_source?: string | null;
          obligatoire?: boolean | null;
          source_of_truth?: string | null;
          tables_concernees?: Json | null;
          type_variable?: string;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          code_variable?: string;
          created_at?: string | null;
          description?: string | null;
          exemple?: string | null;
          id?: string;
          libelle?: string;
          module_cible?: string | null;
          module_source?: string | null;
          obligatoire?: boolean | null;
          source_of_truth?: string | null;
          tables_concernees?: Json | null;
          type_variable?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      reference_counters: {
        Row: {
          etape: string;
          id: string;
          last_value: number;
          mm: string;
          updated_at: string;
          yy: string;
        };
        Insert: {
          etape: string;
          id?: string;
          last_value?: number;
          mm: string;
          updated_at?: string;
          yy: string;
        };
        Update: {
          etape?: string;
          id?: string;
          last_value?: number;
          mm?: string;
          updated_at?: string;
          yy?: string;
        };
        Relationships: [];
      };
      reference_sequences: {
        Row: {
          created_at: string | null;
          current_value: number;
          id: string;
          month_mm: number;
          step_code: string;
          updated_at: string | null;
          year_yy: number;
        };
        Insert: {
          created_at?: string | null;
          current_value?: number;
          id?: string;
          month_mm: number;
          step_code: string;
          updated_at?: string | null;
          year_yy: number;
        };
        Update: {
          created_at?: string | null;
          current_value?: number;
          id?: string;
          month_mm?: number;
          step_code?: string;
          updated_at?: string | null;
          year_yy?: number;
        };
        Relationships: [];
      };
      reglement_attachments: {
        Row: {
          created_at: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          reglement_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          document_type: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          reglement_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          document_type?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          reglement_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reglement_attachments_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'reglements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglement_attachments_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglements_paiements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglement_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglement_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      reglement_sequences: {
        Row: {
          annee: number;
          dernier_numero: number | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          annee: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          annee?: number;
          dernier_numero?: number | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      reglements: {
        Row: {
          banque_arti: string | null;
          code_locked: boolean | null;
          compte_bancaire_arti: string | null;
          compte_id: string | null;
          created_at: string | null;
          created_by: string | null;
          date_entree_etape: string | null;
          date_paiement: string;
          delai_validation_jours: number | null;
          dossier_id: string | null;
          exercice: number | null;
          id: string;
          mode_paiement: string;
          montant: number;
          numero: string;
          observation: string | null;
          ordonnancement_id: string;
          reference_paiement: string | null;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          banque_arti?: string | null;
          code_locked?: boolean | null;
          compte_bancaire_arti?: string | null;
          compte_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_entree_etape?: string | null;
          date_paiement?: string;
          delai_validation_jours?: number | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          mode_paiement: string;
          montant: number;
          numero: string;
          observation?: string | null;
          ordonnancement_id: string;
          reference_paiement?: string | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          banque_arti?: string | null;
          code_locked?: boolean | null;
          compte_bancaire_arti?: string | null;
          compte_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_entree_etape?: string | null;
          date_paiement?: string;
          delai_validation_jours?: number | null;
          dossier_id?: string | null;
          exercice?: number | null;
          id?: string;
          mode_paiement?: string;
          montant?: number;
          numero?: string;
          observation?: string | null;
          ordonnancement_id?: string;
          reference_paiement?: string | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reglements_compte_id_fkey';
            columns: ['compte_id'];
            isOneToOne: false;
            referencedRelation: 'comptes_bancaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglements_compte_id_fkey';
            columns: ['compte_id'];
            isOneToOne: false;
            referencedRelation: 'v_etat_caisse';
            referencedColumns: ['compte_id'];
          },
          {
            foreignKeyName: 'reglements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'reglements_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'reglements_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglements_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
        ];
      };
      regles_imputation: {
        Row: {
          created_at: string | null;
          direction_id: string;
          est_actif: boolean | null;
          est_obligatoire: boolean | null;
          id: string;
          motif: string | null;
          priorite: number | null;
          type_demande_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          direction_id: string;
          est_actif?: boolean | null;
          est_obligatoire?: boolean | null;
          id?: string;
          motif?: string | null;
          priorite?: number | null;
          type_demande_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          direction_id?: string;
          est_actif?: boolean | null;
          est_obligatoire?: boolean | null;
          id?: string;
          motif?: string | null;
          priorite?: number | null;
          type_demande_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'regles_imputation_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'regles_imputation_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'regles_imputation_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'regles_imputation_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'regles_imputation_type_demande_id_fkey';
            columns: ['type_demande_id'];
            isOneToOne: false;
            referencedRelation: 'types_demande';
            referencedColumns: ['id'];
          },
        ];
      };
      reminder_history: {
        Row: {
          entity_id: string;
          entity_type: string;
          id: string;
          rule_id: string | null;
          sent_at: string;
          sent_to: Json;
          status: string | null;
        };
        Insert: {
          entity_id: string;
          entity_type: string;
          id?: string;
          rule_id?: string | null;
          sent_at?: string;
          sent_to: Json;
          status?: string | null;
        };
        Update: {
          entity_id?: string;
          entity_type?: string;
          id?: string;
          rule_id?: string | null;
          sent_at?: string;
          sent_to?: Json;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reminder_history_rule_id_fkey';
            columns: ['rule_id'];
            isOneToOne: false;
            referencedRelation: 'reminder_rules';
            referencedColumns: ['id'];
          },
        ];
      };
      reminder_rules: {
        Row: {
          action_type: string;
          created_at: string;
          created_by: string | null;
          delay_hours: number;
          description: string | null;
          entity_type: string;
          id: string;
          is_active: boolean | null;
          name: string;
          recipients: Json;
          trigger_role: string | null;
          trigger_status: string;
          updated_at: string;
        };
        Insert: {
          action_type?: string;
          created_at?: string;
          created_by?: string | null;
          delay_hours?: number;
          description?: string | null;
          entity_type: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          recipients?: Json;
          trigger_role?: string | null;
          trigger_status: string;
          updated_at?: string;
        };
        Update: {
          action_type?: string;
          created_at?: string;
          created_by?: string | null;
          delay_hours?: number;
          description?: string | null;
          entity_type?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          recipients?: Json;
          trigger_role?: string | null;
          trigger_status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      required_document_types: {
        Row: {
          allowed_file_types: string[] | null;
          allowed_uploaders: string[] | null;
          category: string | null;
          code: string;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          is_mandatory: boolean | null;
          label: string;
          max_file_size_mb: number | null;
          module_code: string;
          updated_at: string;
        };
        Insert: {
          allowed_file_types?: string[] | null;
          allowed_uploaders?: string[] | null;
          category?: string | null;
          code: string;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          label: string;
          max_file_size_mb?: number | null;
          module_code: string;
          updated_at?: string;
        };
        Update: {
          allowed_file_types?: string[] | null;
          allowed_uploaders?: string[] | null;
          category?: string | null;
          code?: string;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_mandatory?: boolean | null;
          label?: string;
          max_file_size_mb?: number | null;
          module_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          action_code: string;
          conditions_json: Json | null;
          created_at: string;
          description: string | null;
          granted_by: string | null;
          id: string;
          is_granted: boolean | null;
          module: string | null;
          role_code: string;
          updated_at: string;
        };
        Insert: {
          action_code: string;
          conditions_json?: Json | null;
          created_at?: string;
          description?: string | null;
          granted_by?: string | null;
          id?: string;
          is_granted?: boolean | null;
          module?: string | null;
          role_code: string;
          updated_at?: string;
        };
        Update: {
          action_code?: string;
          conditions_json?: Json | null;
          created_at?: string;
          description?: string | null;
          granted_by?: string | null;
          id?: string;
          is_granted?: boolean | null;
          module?: string | null;
          role_code?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sequence_counters: {
        Row: {
          created_at: string | null;
          direction_code: string | null;
          doc_type: string;
          exercice: number;
          id: string;
          last_number: number;
          prefix_override: string | null;
          scope: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          direction_code?: string | null;
          doc_type: string;
          exercice: number;
          id?: string;
          last_number?: number;
          prefix_override?: string | null;
          scope?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          direction_code?: string | null;
          doc_type?: string;
          exercice?: number;
          id?: string;
          last_number?: number;
          prefix_override?: string | null;
          scope?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      soumissions: {
        Row: {
          classement: number | null;
          created_at: string | null;
          created_by: string | null;
          date_soumission: string;
          delai_execution: number | null;
          id: string;
          lot_id: string;
          montant_offre: number;
          motif_rejet: string | null;
          note_financiere: number | null;
          note_globale: number | null;
          note_technique: number | null;
          observations: string | null;
          prestataire_id: string;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          classement?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          date_soumission?: string;
          delai_execution?: number | null;
          id?: string;
          lot_id: string;
          montant_offre: number;
          motif_rejet?: string | null;
          note_financiere?: number | null;
          note_globale?: number | null;
          note_technique?: number | null;
          observations?: string | null;
          prestataire_id: string;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          classement?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          date_soumission?: string;
          delai_execution?: number | null;
          id?: string;
          lot_id?: string;
          montant_offre?: number;
          motif_rejet?: string | null;
          note_financiere?: number | null;
          note_globale?: number | null;
          note_technique?: number | null;
          observations?: string | null;
          prestataire_id?: string;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'soumissions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissions_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'marche_lots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissions_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'soumissions_prestataire_id_fkey';
            columns: ['prestataire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
        ];
      };
      sous_activites: {
        Row: {
          activite_id: string;
          code: string;
          created_at: string | null;
          est_active: boolean | null;
          id: string;
          last_sync_at: string | null;
          last_sync_file: string | null;
          libelle: string;
          updated_at: string | null;
        };
        Insert: {
          activite_id: string;
          code: string;
          created_at?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle: string;
          updated_at?: string | null;
        };
        Update: {
          activite_id?: string;
          code?: string;
          created_at?: string | null;
          est_active?: boolean | null;
          id?: string;
          last_sync_at?: string | null;
          last_sync_file?: string | null;
          libelle?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sous_activites_activite_id_fkey';
            columns: ['activite_id'];
            isOneToOne: false;
            referencedRelation: 'activites';
            referencedColumns: ['id'];
          },
        ];
      };
      supplier_bank_accounts: {
        Row: {
          banque: string;
          bic_swift: string | null;
          cle_rib: string | null;
          code_banque: string | null;
          code_guichet: string | null;
          created_at: string;
          est_actif: boolean | null;
          est_principal: boolean | null;
          iban: string | null;
          id: string;
          numero_compte: string;
          supplier_id: string;
          titulaire: string | null;
          updated_at: string;
        };
        Insert: {
          banque: string;
          bic_swift?: string | null;
          cle_rib?: string | null;
          code_banque?: string | null;
          code_guichet?: string | null;
          created_at?: string;
          est_actif?: boolean | null;
          est_principal?: boolean | null;
          iban?: string | null;
          id?: string;
          numero_compte: string;
          supplier_id: string;
          titulaire?: string | null;
          updated_at?: string;
        };
        Update: {
          banque?: string;
          bic_swift?: string | null;
          cle_rib?: string | null;
          code_banque?: string | null;
          code_guichet?: string | null;
          created_at?: string;
          est_actif?: boolean | null;
          est_principal?: boolean | null;
          iban?: string | null;
          id?: string;
          numero_compte?: string;
          supplier_id?: string;
          titulaire?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'supplier_bank_accounts_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_bank_accounts_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
        ];
      };
      supplier_documents: {
        Row: {
          created_at: string;
          date_delivrance: string | null;
          date_expiration: string | null;
          fichier_nom: string | null;
          fichier_path: string | null;
          id: string;
          notes: string | null;
          numero: string | null;
          rappel_jours: number | null;
          statut: string | null;
          supplier_id: string;
          type_document: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          date_delivrance?: string | null;
          date_expiration?: string | null;
          fichier_nom?: string | null;
          fichier_path?: string | null;
          id?: string;
          notes?: string | null;
          numero?: string | null;
          rappel_jours?: number | null;
          statut?: string | null;
          supplier_id: string;
          type_document: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          date_delivrance?: string | null;
          date_expiration?: string | null;
          fichier_nom?: string | null;
          fichier_path?: string | null;
          id?: string;
          notes?: string | null;
          numero?: string | null;
          rappel_jours?: number | null;
          statut?: string | null;
          supplier_id?: string;
          type_document?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'supplier_documents_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_documents_supplier_id_fkey';
            columns: ['supplier_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'supplier_documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      supplier_required_documents: {
        Row: {
          a_date_expiration: boolean | null;
          code: string;
          created_at: string;
          description: string | null;
          est_actif: boolean | null;
          est_obligatoire: boolean | null;
          id: string;
          libelle: string;
          ordre_affichage: number | null;
          rappel_jours_defaut: number | null;
        };
        Insert: {
          a_date_expiration?: boolean | null;
          code: string;
          created_at?: string;
          description?: string | null;
          est_actif?: boolean | null;
          est_obligatoire?: boolean | null;
          id?: string;
          libelle: string;
          ordre_affichage?: number | null;
          rappel_jours_defaut?: number | null;
        };
        Update: {
          a_date_expiration?: boolean | null;
          code?: string;
          created_at?: string;
          description?: string | null;
          est_actif?: boolean | null;
          est_obligatoire?: boolean | null;
          id?: string;
          libelle?: string;
          ordre_affichage?: number | null;
          rappel_jours_defaut?: number | null;
        };
        Relationships: [];
      };
      system_config: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          key: string;
          label: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key: string;
          label: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          key?: string;
          label?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      system_variables_connexion: {
        Row: {
          actif: boolean | null;
          description: string | null;
          environnement: string | null;
          id: string;
          key: string;
          updated_at: string | null;
          value_masked: string | null;
        };
        Insert: {
          actif?: boolean | null;
          description?: string | null;
          environnement?: string | null;
          id?: string;
          key: string;
          updated_at?: string | null;
          value_masked?: string | null;
        };
        Update: {
          actif?: boolean | null;
          description?: string | null;
          environnement?: string | null;
          id?: string;
          key?: string;
          updated_at?: string | null;
          value_masked?: string | null;
        };
        Relationships: [];
      };
      tache_attachments: {
        Row: {
          created_at: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          file_type: string | null;
          id: string;
          tache_id: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          tache_id: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          file_type?: string | null;
          id?: string;
          tache_id?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tache_attachments_tache_id_fkey';
            columns: ['tache_id'];
            isOneToOne: false;
            referencedRelation: 'taches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tache_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tache_attachments_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      tache_progress_history: {
        Row: {
          comment: string | null;
          created_at: string | null;
          id: string;
          new_avancement: number;
          previous_avancement: number;
          tache_id: string;
          updated_by: string | null;
        };
        Insert: {
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          new_avancement: number;
          previous_avancement: number;
          tache_id: string;
          updated_by?: string | null;
        };
        Update: {
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          new_avancement?: number;
          previous_avancement?: number;
          tache_id?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'tache_progress_history_tache_id_fkey';
            columns: ['tache_id'];
            isOneToOne: false;
            referencedRelation: 'taches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tache_progress_history_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tache_progress_history_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      taches: {
        Row: {
          avancement: number | null;
          budget_line_id: string | null;
          budget_prevu: number | null;
          code: string;
          created_at: string | null;
          date_debut: string | null;
          date_fin: string | null;
          date_fin_reelle: string | null;
          description: string | null;
          duree_prevue: number | null;
          est_active: boolean | null;
          exercice: number | null;
          id: string;
          libelle: string;
          livrables: string[] | null;
          priorite: string | null;
          raci_accountable: string | null;
          raci_consulted: string[] | null;
          raci_informed: string[] | null;
          raci_responsable: string | null;
          responsable_id: string | null;
          sous_activite_id: string;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          avancement?: number | null;
          budget_line_id?: string | null;
          budget_prevu?: number | null;
          code: string;
          created_at?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          date_fin_reelle?: string | null;
          description?: string | null;
          duree_prevue?: number | null;
          est_active?: boolean | null;
          exercice?: number | null;
          id?: string;
          libelle: string;
          livrables?: string[] | null;
          priorite?: string | null;
          raci_accountable?: string | null;
          raci_consulted?: string[] | null;
          raci_informed?: string[] | null;
          raci_responsable?: string | null;
          responsable_id?: string | null;
          sous_activite_id: string;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avancement?: number | null;
          budget_line_id?: string | null;
          budget_prevu?: number | null;
          code?: string;
          created_at?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          date_fin_reelle?: string | null;
          description?: string | null;
          duree_prevue?: number | null;
          est_active?: boolean | null;
          exercice?: number | null;
          id?: string;
          libelle?: string;
          livrables?: string[] | null;
          priorite?: string | null;
          raci_accountable?: string | null;
          raci_consulted?: string[] | null;
          raci_informed?: string[] | null;
          raci_responsable?: string | null;
          responsable_id?: string | null;
          sous_activite_id?: string;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'taches_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'taches_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'taches_budget_line_id_fkey';
            columns: ['budget_line_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'taches_raci_accountable_fkey';
            columns: ['raci_accountable'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_raci_accountable_fkey';
            columns: ['raci_accountable'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_raci_responsable_fkey';
            columns: ['raci_responsable'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_raci_responsable_fkey';
            columns: ['raci_responsable'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'taches_sous_activite_id_fkey';
            columns: ['sous_activite_id'];
            isOneToOne: false;
            referencedRelation: 'sous_activites';
            referencedColumns: ['id'];
          },
        ];
      };
      transfer_sequences: {
        Row: {
          dernier_numero: number;
          exercice: number;
          id: string;
          type_transfer: string;
          updated_at: string;
        };
        Insert: {
          dernier_numero?: number;
          exercice: number;
          id?: string;
          type_transfer: string;
          updated_at?: string;
        };
        Update: {
          dernier_numero?: number;
          exercice?: number;
          id?: string;
          type_transfer?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      treasury_accounts: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          is_active: boolean | null;
          label: string;
          solde_actuel: number;
          solde_initial: number;
          type: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          label: string;
          solde_actuel?: number;
          solde_initial?: number;
          type?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean | null;
          label?: string;
          solde_actuel?: number;
          solde_initial?: number;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      treasury_movements: {
        Row: {
          account_id: string;
          created_at: string;
          created_by: string | null;
          date_operation: string;
          id: string;
          libelle: string;
          mode_paiement: string | null;
          montant: number;
          ordonnancement_id: string | null;
          reference: string | null;
          solde_apres: number;
          solde_avant: number;
          type: string;
        };
        Insert: {
          account_id: string;
          created_at?: string;
          created_by?: string | null;
          date_operation?: string;
          id?: string;
          libelle: string;
          mode_paiement?: string | null;
          montant: number;
          ordonnancement_id?: string | null;
          reference?: string | null;
          solde_apres: number;
          solde_avant: number;
          type: string;
        };
        Update: {
          account_id?: string;
          created_at?: string;
          created_by?: string | null;
          date_operation?: string;
          id?: string;
          libelle?: string;
          mode_paiement?: string | null;
          montant?: number;
          ordonnancement_id?: string | null;
          reference?: string | null;
          solde_apres?: number;
          solde_avant?: number;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'treasury_movements_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'treasury_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'treasury_movements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'treasury_movements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'treasury_movements_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'treasury_movements_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
        ];
      };
      types_demande: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          est_actif: boolean | null;
          id: string;
          libelle: string;
          mots_cles: string[] | null;
          ordre: number | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle: string;
          mots_cles?: string[] | null;
          ordre?: number | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          libelle?: string;
          mots_cles?: string[] | null;
          ordre?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      types_depenses: {
        Row: {
          actif: boolean | null;
          categorie: string | null;
          code: string;
          compte_comptable: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          libelle: string;
          nbe_code: string | null;
          necessite_justificatif: boolean | null;
          ordre_affichage: number | null;
          plafond_montant: number | null;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          categorie?: string | null;
          code: string;
          compte_comptable?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          libelle: string;
          nbe_code?: string | null;
          necessite_justificatif?: boolean | null;
          ordre_affichage?: number | null;
          plafond_montant?: number | null;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          categorie?: string | null;
          code?: string;
          compte_comptable?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          libelle?: string;
          nbe_code?: string | null;
          necessite_justificatif?: boolean | null;
          ordre_affichage?: number | null;
          plafond_montant?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_exercices: {
        Row: {
          can_read: boolean | null;
          can_write: boolean | null;
          created_at: string | null;
          exercice_id: string;
          granted_by: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          can_read?: boolean | null;
          can_write?: boolean | null;
          created_at?: string | null;
          exercice_id: string;
          granted_by?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          can_read?: boolean | null;
          can_write?: boolean | null;
          created_at?: string | null;
          exercice_id?: string;
          granted_by?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_exercices_exercice_id_fkey';
            columns: ['exercice_id'];
            isOneToOne: false;
            referencedRelation: 'exercices_budgetaires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_exercices_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_exercices_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_exercices_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_exercices_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      user_positions: {
        Row: {
          created_at: string;
          end_date: string | null;
          id: string;
          is_current: boolean | null;
          notes: string | null;
          position_id: string;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          is_current?: boolean | null;
          notes?: string | null;
          position_id: string;
          start_date?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          is_current?: boolean | null;
          notes?: string | null;
          position_id?: string;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_positions_position_id_fkey';
            columns: ['position_id'];
            isOneToOne: false;
            referencedRelation: 'positions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          granted_at: string | null;
          granted_by: string | null;
          id: string;
          is_active: boolean | null;
          is_primary: boolean | null;
          revoked_at: string | null;
          role: Database['public']['Enums']['app_role'];
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_primary?: boolean | null;
          revoked_at?: string | null;
          role: Database['public']['Enums']['app_role'];
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_primary?: boolean | null;
          revoked_at?: string | null;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_roles_granted_by_fkey';
            columns: ['granted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      validation_hierarchy: {
        Row: {
          conditions: Json | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_optional: boolean | null;
          label: string | null;
          max_amount: number | null;
          min_amount: number | null;
          module_id: string;
          relative_type: string | null;
          required_documents: string[] | null;
          required_fields: Json | null;
          role: string;
          step_order: number;
          updated_at: string;
          validator_id: string | null;
          validator_type: string | null;
        };
        Insert: {
          conditions?: Json | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_optional?: boolean | null;
          label?: string | null;
          max_amount?: number | null;
          min_amount?: number | null;
          module_id: string;
          relative_type?: string | null;
          required_documents?: string[] | null;
          required_fields?: Json | null;
          role: string;
          step_order: number;
          updated_at?: string;
          validator_id?: string | null;
          validator_type?: string | null;
        };
        Update: {
          conditions?: Json | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_optional?: boolean | null;
          label?: string | null;
          max_amount?: number | null;
          min_amount?: number | null;
          module_id?: string;
          relative_type?: string | null;
          required_documents?: string[] | null;
          required_fields?: Json | null;
          role?: string;
          step_order?: number;
          updated_at?: string;
          validator_id?: string | null;
          validator_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'validation_hierarchy_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'workflow_modules';
            referencedColumns: ['id'];
          },
        ];
      };
      verifications_qrcode: {
        Row: {
          document_id: string | null;
          id: string;
          ip_address: unknown;
          message: string | null;
          origin_url: string | null;
          qr_hash: string;
          resultat: string;
          user_agent: string | null;
          verified_at: string;
        };
        Insert: {
          document_id?: string | null;
          id?: string;
          ip_address?: unknown;
          message?: string | null;
          origin_url?: string | null;
          qr_hash: string;
          resultat: string;
          user_agent?: string | null;
          verified_at?: string;
        };
        Update: {
          document_id?: string | null;
          id?: string;
          ip_address?: unknown;
          message?: string | null;
          origin_url?: string | null;
          qr_hash?: string;
          resultat?: string;
          user_agent?: string | null;
          verified_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'verifications_qrcode_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents_generes';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_actions: {
        Row: {
          code: string;
          color: string | null;
          created_at: string | null;
          description: string | null;
          est_actif: boolean | null;
          icon: string | null;
          id: string;
          is_terminal: boolean | null;
          label: string;
          require_date_reprise: boolean | null;
          require_motif: boolean | null;
        };
        Insert: {
          code: string;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          icon?: string | null;
          id?: string;
          is_terminal?: boolean | null;
          label: string;
          require_date_reprise?: boolean | null;
          require_motif?: boolean | null;
        };
        Update: {
          code?: string;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          icon?: string | null;
          id?: string;
          is_terminal?: boolean | null;
          label?: string;
          require_date_reprise?: boolean | null;
          require_motif?: boolean | null;
        };
        Relationships: [];
      };
      wf_conditions: {
        Row: {
          est_actif: boolean | null;
          field_name: string;
          field_value: string | null;
          id: string;
          logic_group: number | null;
          logic_operator: string | null;
          operator: string;
          step_id: string;
        };
        Insert: {
          est_actif?: boolean | null;
          field_name: string;
          field_value?: string | null;
          id?: string;
          logic_group?: number | null;
          logic_operator?: string | null;
          operator: string;
          step_id: string;
        };
        Update: {
          est_actif?: boolean | null;
          field_name?: string;
          field_value?: string | null;
          id?: string;
          logic_group?: number | null;
          logic_operator?: string | null;
          operator?: string;
          step_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_conditions_step_id_fkey';
            columns: ['step_id'];
            isOneToOne: false;
            referencedRelation: 'wf_steps';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_definitions: {
        Row: {
          created_at: string | null;
          description: string | null;
          entity_type: string;
          est_actif: boolean | null;
          id: string;
          nom: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          entity_type: string;
          est_actif?: boolean | null;
          id?: string;
          nom: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          entity_type?: string;
          est_actif?: boolean | null;
          id?: string;
          nom?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      wf_instances: {
        Row: {
          completed_at: string | null;
          current_step_order: number | null;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json | null;
          started_at: string | null;
          started_by: string | null;
          status: string | null;
          workflow_id: string;
        };
        Insert: {
          completed_at?: string | null;
          current_step_order?: number | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          started_at?: string | null;
          started_by?: string | null;
          status?: string | null;
          workflow_id: string;
        };
        Update: {
          completed_at?: string | null;
          current_step_order?: number | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          started_at?: string | null;
          started_by?: string | null;
          status?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_instances_started_by_fkey';
            columns: ['started_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wf_instances_started_by_fkey';
            columns: ['started_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wf_instances_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'wf_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_roles: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          est_actif: boolean | null;
          id: string;
          label: string;
          niveau_hierarchique: number | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          label: string;
          niveau_hierarchique?: number | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          label?: string;
          niveau_hierarchique?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      wf_services: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          est_actif: boolean | null;
          id: string;
          label: string;
          parent_id: string | null;
          responsable_role_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          label: string;
          parent_id?: string | null;
          responsable_role_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          est_actif?: boolean | null;
          id?: string;
          label?: string;
          parent_id?: string | null;
          responsable_role_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_services_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'wf_services';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_step_actions: {
        Row: {
          action_id: string;
          est_actif: boolean | null;
          id: string;
          ordre: number | null;
          step_id: string;
        };
        Insert: {
          action_id: string;
          est_actif?: boolean | null;
          id?: string;
          ordre?: number | null;
          step_id: string;
        };
        Update: {
          action_id?: string;
          est_actif?: boolean | null;
          id?: string;
          ordre?: number | null;
          step_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_step_actions_action_id_fkey';
            columns: ['action_id'];
            isOneToOne: false;
            referencedRelation: 'wf_actions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wf_step_actions_step_id_fkey';
            columns: ['step_id'];
            isOneToOne: false;
            referencedRelation: 'wf_steps';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_step_history: {
        Row: {
          action: string;
          condition_reprise: string | null;
          created_at: string | null;
          date_reprise: string | null;
          id: string;
          instance_id: string;
          metadata: Json | null;
          motif: string | null;
          step_label: string | null;
          step_order: number;
          user_id: string | null;
          user_name: string | null;
          user_role: string | null;
        };
        Insert: {
          action: string;
          condition_reprise?: string | null;
          created_at?: string | null;
          date_reprise?: string | null;
          id?: string;
          instance_id: string;
          metadata?: Json | null;
          motif?: string | null;
          step_label?: string | null;
          step_order: number;
          user_id?: string | null;
          user_name?: string | null;
          user_role?: string | null;
        };
        Update: {
          action?: string;
          condition_reprise?: string | null;
          created_at?: string | null;
          date_reprise?: string | null;
          id?: string;
          instance_id?: string;
          metadata?: Json | null;
          motif?: string | null;
          step_label?: string | null;
          step_order?: number;
          user_id?: string | null;
          user_name?: string | null;
          user_role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_step_history_instance_id_fkey';
            columns: ['instance_id'];
            isOneToOne: false;
            referencedRelation: 'wf_instances';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wf_step_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wf_step_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_step_permissions: {
        Row: {
          can_act: boolean | null;
          can_delegate: boolean | null;
          can_view: boolean | null;
          est_actif: boolean | null;
          id: string;
          is_primary: boolean | null;
          role_code: string;
          service_code: string | null;
          step_id: string;
        };
        Insert: {
          can_act?: boolean | null;
          can_delegate?: boolean | null;
          can_view?: boolean | null;
          est_actif?: boolean | null;
          id?: string;
          is_primary?: boolean | null;
          role_code: string;
          service_code?: string | null;
          step_id: string;
        };
        Update: {
          can_act?: boolean | null;
          can_delegate?: boolean | null;
          can_view?: boolean | null;
          est_actif?: boolean | null;
          id?: string;
          is_primary?: boolean | null;
          role_code?: string;
          service_code?: string | null;
          step_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_step_permissions_step_id_fkey';
            columns: ['step_id'];
            isOneToOne: false;
            referencedRelation: 'wf_steps';
            referencedColumns: ['id'];
          },
        ];
      };
      wf_steps: {
        Row: {
          condition_type: string | null;
          condition_value: string | null;
          created_at: string | null;
          delai_max_heures: number | null;
          description: string | null;
          direction_required: string | null;
          est_optionnel: boolean | null;
          id: string;
          label: string;
          role_alternatif: string | null;
          role_required: string;
          step_order: number;
          workflow_id: string;
        };
        Insert: {
          condition_type?: string | null;
          condition_value?: string | null;
          created_at?: string | null;
          delai_max_heures?: number | null;
          description?: string | null;
          direction_required?: string | null;
          est_optionnel?: boolean | null;
          id?: string;
          label: string;
          role_alternatif?: string | null;
          role_required: string;
          step_order: number;
          workflow_id: string;
        };
        Update: {
          condition_type?: string | null;
          condition_value?: string | null;
          created_at?: string | null;
          delai_max_heures?: number | null;
          description?: string | null;
          direction_required?: string | null;
          est_optionnel?: boolean | null;
          id?: string;
          label?: string;
          role_alternatif?: string | null;
          role_required?: string;
          step_order?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wf_steps_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'wf_definitions';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_etapes: {
        Row: {
          code: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          libelle: string;
          ordre: number;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          libelle: string;
          ordre: number;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          libelle?: string;
          ordre?: number;
        };
        Relationships: [];
      };
      workflow_instances: {
        Row: {
          assigned_to: string | null;
          commentaire: string | null;
          created_at: string | null;
          created_by: string | null;
          date_debut: string | null;
          date_fin: string | null;
          dossier_id: string;
          entity_id: string | null;
          etape_code: string;
          id: string;
          pieces_jointes: string[] | null;
          statut: string | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          commentaire?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          dossier_id: string;
          entity_id?: string | null;
          etape_code: string;
          id?: string;
          pieces_jointes?: string[] | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          commentaire?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          dossier_id?: string;
          entity_id?: string | null;
          etape_code?: string;
          id?: string;
          pieces_jointes?: string[] | null;
          statut?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_instances_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_instances_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_instances_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_instances_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_instances_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_instances_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'workflow_instances_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'workflow_instances_etape_code_fkey';
            columns: ['etape_code'];
            isOneToOne: false;
            referencedRelation: 'workflow_etapes';
            referencedColumns: ['code'];
          },
        ];
      };
      workflow_modules: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          label: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          label: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflow_statuses: {
        Row: {
          bg_color: string | null;
          code: string;
          color: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_pending: boolean | null;
          is_terminal: boolean | null;
          label: string;
          ordre: number | null;
        };
        Insert: {
          bg_color?: string | null;
          code: string;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_pending?: boolean | null;
          is_terminal?: boolean | null;
          label: string;
          ordre?: number | null;
        };
        Update: {
          bg_color?: string | null;
          code?: string;
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_pending?: boolean | null;
          is_terminal?: boolean | null;
          label?: string;
          ordre?: number | null;
        };
        Relationships: [];
      };
      workflow_tasks: {
        Row: {
          action_taken: string | null;
          assignee_role: string;
          assignee_user_id: string | null;
          completed_at: string | null;
          completed_by: string | null;
          completion_comment: string | null;
          created_at: string;
          created_by: string | null;
          direction_id: string | null;
          dossier_id: string | null;
          due_date: string | null;
          entity_code: string;
          entity_id: string;
          entity_title: string | null;
          entity_type: string;
          exercice: number;
          id: string;
          metadata: Json | null;
          montant: number | null;
          priority: string;
          sla_hours: number | null;
          status: string;
          task_type: string;
          updated_at: string;
        };
        Insert: {
          action_taken?: string | null;
          assignee_role: string;
          assignee_user_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          completion_comment?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          due_date?: string | null;
          entity_code: string;
          entity_id: string;
          entity_title?: string | null;
          entity_type: string;
          exercice?: number;
          id?: string;
          metadata?: Json | null;
          montant?: number | null;
          priority?: string;
          sla_hours?: number | null;
          status?: string;
          task_type: string;
          updated_at?: string;
        };
        Update: {
          action_taken?: string | null;
          assignee_role?: string;
          assignee_user_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          completion_comment?: string | null;
          created_at?: string;
          created_by?: string | null;
          direction_id?: string | null;
          dossier_id?: string | null;
          due_date?: string | null;
          entity_code?: string;
          entity_id?: string;
          entity_title?: string | null;
          entity_type?: string;
          exercice?: number;
          id?: string;
          metadata?: Json | null;
          montant?: number | null;
          priority?: string;
          sla_hours?: number | null;
          status?: string;
          task_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_tasks_assignee_user_id_fkey';
            columns: ['assignee_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_assignee_user_id_fkey';
            columns: ['assignee_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_completed_by_fkey';
            columns: ['completed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_completed_by_fkey';
            columns: ['completed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'workflow_tasks_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'workflow_tasks_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'workflow_tasks_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'dossiers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_tasks_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossier_chaine';
            referencedColumns: ['dossier_id'];
          },
          {
            foreignKeyName: 'workflow_tasks_dossier_id_fkey';
            columns: ['dossier_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['dossier_id'];
          },
        ];
      };
      workflow_transition_history: {
        Row: {
          action_code: string;
          entity_code: string | null;
          entity_id: string;
          exercice: number | null;
          from_status: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          module: string;
          motif: string | null;
          performed_at: string;
          performed_by: string | null;
          to_status: string;
        };
        Insert: {
          action_code: string;
          entity_code?: string | null;
          entity_id: string;
          exercice?: number | null;
          from_status: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          module: string;
          motif?: string | null;
          performed_at?: string;
          performed_by?: string | null;
          to_status: string;
        };
        Update: {
          action_code?: string;
          entity_code?: string | null;
          entity_id?: string;
          exercice?: number | null;
          from_status?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          module?: string;
          motif?: string | null;
          performed_at?: string;
          performed_by?: string | null;
          to_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_transition_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_transition_history_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      workflow_transitions: {
        Row: {
          action_code: string;
          action_label: string;
          created_at: string | null;
          from_status: string;
          id: string;
          is_active: boolean | null;
          module: string;
          required_roles: string[];
          requires_budget_check: boolean | null;
          requires_montant: boolean | null;
          requires_motif: boolean | null;
          to_status: string;
        };
        Insert: {
          action_code: string;
          action_label: string;
          created_at?: string | null;
          from_status: string;
          id?: string;
          is_active?: boolean | null;
          module: string;
          required_roles?: string[];
          requires_budget_check?: boolean | null;
          requires_montant?: boolean | null;
          requires_motif?: boolean | null;
          to_status: string;
        };
        Update: {
          action_code?: string;
          action_label?: string;
          created_at?: string | null;
          from_status?: string;
          id?: string;
          is_active?: boolean | null;
          module?: string;
          required_roles?: string[];
          requires_budget_check?: boolean | null;
          requires_montant?: boolean | null;
          requires_motif?: boolean | null;
          to_status?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      documents_index: {
        Row: {
          annee: number | null;
          created_at: string | null;
          entity_id: string | null;
          entity_numero: string | null;
          entity_objet: string | null;
          entity_type: string | null;
          file_name: string | null;
          file_path: string | null;
          file_size: number | null;
          file_type: string | null;
          fournisseur: string | null;
          id: string | null;
          montant: number | null;
          type_document: string | null;
        };
        Relationships: [];
      };
      notes_imputees_disponibles: {
        Row: {
          beneficiaire_id: string | null;
          contenu: string | null;
          created_at: string | null;
          created_by: string | null;
          direction_id: string | null;
          direction_label: string | null;
          direction_sigle: string | null;
          exercice: number | null;
          id: string | null;
          montant_estime: number | null;
          note_sef_id: string | null;
          numero: string | null;
          objet: string | null;
          origin: string | null;
          priorite: string | null;
          reference_pivot: string | null;
          statut: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_dg_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_beneficiaire_id_fkey';
            columns: ['beneficiaire_id'];
            isOneToOne: false;
            referencedRelation: 'prestataires_actifs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_dg_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'notes_dg_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_dg_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      notes_sef_audit_log: {
        Row: {
          action: string | null;
          actor_id: string | null;
          created_at: string | null;
          from_status: string | null;
          id: string | null;
          ip_address: string | null;
          message: string | null;
          note_id: string | null;
          to_status: string | null;
        };
        Insert: {
          action?: string | null;
          actor_id?: string | null;
          created_at?: string | null;
          from_status?: string | null;
          id?: string | null;
          ip_address?: string | null;
          message?: string | null;
          note_id?: string | null;
          to_status?: string | null;
        };
        Update: {
          action?: string | null;
          actor_id?: string | null;
          created_at?: string | null;
          from_status?: string | null;
          id?: string | null;
          ip_address?: string | null;
          message?: string | null;
          note_id?: string | null;
          to_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_sef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_note_id_fkey';
            columns: ['note_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_performed_by_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_sef_history_performed_by_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      pending_tasks_by_role: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          entity_code: string | null;
          entity_id: string | null;
          entity_type: string | null;
          exercice: number | null;
          status: string | null;
          target_role: string | null;
          title: string | null;
        };
        Relationships: [];
      };
      prestataires_actifs: {
        Row: {
          adresse: string | null;
          cc: string | null;
          code: string | null;
          code_admission: string | null;
          code_comptable: string | null;
          created_at: string | null;
          created_by: string | null;
          date_expiration_fiscale: string | null;
          documents_fiscaux: Json | null;
          email: string | null;
          id: string | null;
          ninea: string | null;
          raison_sociale: string | null;
          rccm: string | null;
          rib_banque: string | null;
          rib_cle: string | null;
          rib_numero: string | null;
          secteur_activite: string | null;
          secteur_principal_id: string | null;
          secteur_secondaire_id: string | null;
          statut: string | null;
          statut_fiscal: string | null;
          telephone: string | null;
          updated_at: string | null;
          validated_at: string | null;
          validated_by: string | null;
        };
        Insert: {
          adresse?: string | null;
          cc?: string | null;
          code?: string | null;
          code_admission?: string | null;
          code_comptable?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_expiration_fiscale?: string | null;
          documents_fiscaux?: Json | null;
          email?: string | null;
          id?: string | null;
          ninea?: string | null;
          raison_sociale?: string | null;
          rccm?: string | null;
          rib_banque?: string | null;
          rib_cle?: string | null;
          rib_numero?: string | null;
          secteur_activite?: string | null;
          secteur_principal_id?: string | null;
          secteur_secondaire_id?: string | null;
          statut?: string | null;
          statut_fiscal?: string | null;
          telephone?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Update: {
          adresse?: string | null;
          cc?: string | null;
          code?: string | null;
          code_admission?: string | null;
          code_comptable?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_expiration_fiscale?: string | null;
          documents_fiscaux?: Json | null;
          email?: string | null;
          id?: string | null;
          ninea?: string | null;
          raison_sociale?: string | null;
          rccm?: string | null;
          rib_banque?: string | null;
          rib_cle?: string | null;
          rib_numero?: string | null;
          secteur_activite?: string | null;
          secteur_principal_id?: string | null;
          secteur_secondaire_id?: string | null;
          statut?: string | null;
          statut_fiscal?: string | null;
          telephone?: string | null;
          updated_at?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prestataires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_secteur_principal_id_fkey';
            columns: ['secteur_principal_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_secteur_secondaire_id_fkey';
            columns: ['secteur_secondaire_id'];
            isOneToOne: false;
            referencedRelation: 'ref_secteurs_activite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prestataires_validated_by_fkey';
            columns: ['validated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles_display: {
        Row: {
          direction_code: string | null;
          direction_id: string | null;
          first_name: string | null;
          full_name: string | null;
          id: string | null;
          is_active: boolean | null;
          last_name: string | null;
          poste: string | null;
        };
        Insert: {
          direction_code?: string | null;
          direction_id?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_name?: string | null;
          poste?: string | null;
        };
        Update: {
          direction_code?: string | null;
          direction_id?: string | null;
          first_name?: string | null;
          full_name?: string | null;
          id?: string | null;
          is_active?: boolean | null;
          last_name?: string | null;
          poste?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'profiles_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      projects_with_financial: {
        Row: {
          budget_total: number | null;
          created_at: string | null;
          description: string | null;
          direction_id: string | null;
          direction_label: string | null;
          end_date: string | null;
          exercice: number | null;
          financial_percent: number | null;
          id: string | null;
          name: string | null;
          owner_id: string | null;
          owner_name: string | null;
          physical_percent: number | null;
          start_date: string | null;
          status: string | null;
          total_paid: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projects_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projects_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      projets_avec_disponible: {
        Row: {
          actif: boolean | null;
          budget_alloue: number | null;
          budget_consomme: number | null;
          budget_disponible: number | null;
          code: string | null;
          created_at: string | null;
          created_by: string | null;
          date_debut: string | null;
          date_fin: string | null;
          description: string | null;
          direction_id: string | null;
          exercice: number | null;
          id: string | null;
          libelle: string | null;
          priorite: string | null;
          responsable_id: string | null;
          statut: string | null;
          taux_consommation: number | null;
          updated_at: string | null;
        };
        Insert: {
          actif?: boolean | null;
          budget_alloue?: number | null;
          budget_consomme?: number | null;
          budget_disponible?: never;
          code?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          description?: string | null;
          direction_id?: string | null;
          exercice?: number | null;
          id?: string | null;
          libelle?: string | null;
          priorite?: string | null;
          responsable_id?: string | null;
          statut?: string | null;
          taux_consommation?: never;
          updated_at?: string | null;
        };
        Update: {
          actif?: boolean | null;
          budget_alloue?: number | null;
          budget_consomme?: number | null;
          budget_disponible?: never;
          code?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          date_debut?: string | null;
          date_fin?: string | null;
          description?: string | null;
          direction_id?: string | null;
          exercice?: number | null;
          id?: string | null;
          libelle?: string | null;
          priorite?: string | null;
          responsable_id?: string | null;
          statut?: string | null;
          taux_consommation?: never;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projets_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projets_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'projets_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projets_responsable_id_fkey';
            columns: ['responsable_id'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      v_activite_recente: {
        Row: {
          dernier_acteur: string | null;
          derniere_action: string | null;
          direction: string | null;
          id: string | null;
          montant_estime: number | null;
          objet: string | null;
          reference: string | null;
          statut: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
      v_affectations_notes: {
        Row: {
          affecte_par: string | null;
          commentaire: string | null;
          date_affectation: string | null;
          demandeur_nom: string | null;
          id: string | null;
          lu: boolean | null;
          lu_at: string | null;
          lu_par: string | null;
          note_direction_label: string | null;
          note_direction_sigle: string | null;
          note_objet: string | null;
          note_reference: string | null;
          note_sef_id: string | null;
          note_statut: string | null;
          note_type_demande: string | null;
          note_urgence: string | null;
          note_validated_at: string | null;
          raison_affectation: string | null;
          service_destinataire_code: string | null;
          service_destinataire_id: string | null;
          service_destinataire_label: string | null;
          type_affectation: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'affectations_notes_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'notes_sef';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_activite_recente';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_note_sef_id_fkey';
            columns: ['note_sef_id'];
            isOneToOne: false;
            referencedRelation: 'v_dossiers_urgents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'affectations_notes_service_destinataire_id_fkey';
            columns: ['service_destinataire_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
        ];
      };
      v_alertes_dmg: {
        Row: {
          alert_type: string | null;
          date_debut: string | null;
          entity_id: string | null;
          fournisseur: string | null;
          heures_attente: number | null;
          message: string | null;
          montant: number | null;
          reference: string | null;
          severite: string | null;
        };
        Relationships: [];
      };
      v_alertes_financieres: {
        Row: {
          budget_line_id: string | null;
          code_budgetaire: string | null;
          direction_code: string | null;
          direction_label: string | null;
          dotation_effective: number | null;
          dotation_initiale: number | null;
          exercice: number | null;
          libelle: string | null;
          taux_consommation: number | null;
          total_engage: number | null;
          total_liquide: number | null;
          total_ordonnance: number | null;
          total_paye: number | null;
          type_alerte: string | null;
        };
        Relationships: [];
      };
      v_budget_disponibilite: {
        Row: {
          code: string | null;
          direction_code: string | null;
          direction_id: string | null;
          direction_label: string | null;
          disponible_net: number | null;
          dotation_actuelle: number | null;
          dotation_initiale: number | null;
          dotation_modifiee: number | null;
          exercice: number | null;
          id: string | null;
          label: string | null;
          mission_id: string | null;
          montant_reserve: number | null;
          os_code: string | null;
          os_id: string | null;
          os_libelle: string | null;
          total_engage: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
        ];
      };
      v_budget_disponibilite_complet: {
        Row: {
          code: string | null;
          direction_code: string | null;
          direction_id: string | null;
          direction_label: string | null;
          disponible_brut: number | null;
          disponible_net: number | null;
          dotation_actuelle: number | null;
          dotation_initiale: number | null;
          dotation_modifiee: number | null;
          exercice: number | null;
          id: string | null;
          is_active: boolean | null;
          label: string | null;
          mission_id: string | null;
          montant_reserve: number | null;
          nbe_id: string | null;
          os_code: string | null;
          os_id: string | null;
          os_libelle: string | null;
          statut: string | null;
          sysco_id: string | null;
          total_engage: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'directions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_stats_par_direction';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_tableau_financier';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_direction_id_fkey';
            columns: ['direction_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_directions_imputations';
            referencedColumns: ['direction_id'];
          },
          {
            foreignKeyName: 'budget_lines_mission_id_fkey';
            columns: ['mission_id'];
            isOneToOne: false;
            referencedRelation: 'missions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_nbe_id_fkey';
            columns: ['nbe_id'];
            isOneToOne: false;
            referencedRelation: 'nomenclature_nbe';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'objectifs_strategiques';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'budget_lines_os_id_fkey';
            columns: ['os_id'];
            isOneToOne: false;
            referencedRelation: 'v_top_os_imputations';
            referencedColumns: ['os_id'];
          },
          {
            foreignKeyName: 'budget_lines_sysco_id_fkey';
            columns: ['sysco_id'];
            isOneToOne: false;
            referencedRelation: 'plan_comptable_sysco';
            referencedColumns: ['id'];
          },
        ];
      };
      v_dashboard_dmg: {
        Row: {
          engagements_a_liquider_count: number | null;
          engagements_a_liquider_montant: number | null;
          liquidations_attente_count: number | null;
          liquidations_attente_montant: number | null;
          liquidations_urgentes_count: number | null;
          liquidations_urgentes_montant: number | null;
          top_fournisseurs: Json | null;
        };
        Relationships: [];
      };
      v_dashboard_kpis: {
        Row: {
          montant_valide_mois: number | null;
          notes_a_valider: number | null;
          notes_differees: number | null;
          notes_validees_mois: number | null;
          total_notes_annee: number | null;
        };
        Relationships: [];
      };
      v_dossier_chaine: {
        Row: {
          derniere_activite: string | null;
          direction_label: string | null;
          direction_sigle: string | null;
          dossier_id: string | null;
          dossier_numero: string | null;
          exercice: number | null;
          montant_engage: number | null;
          montant_estime: number | null;
          montant_liquide: number | null;
          montant_ordonnance: number | null;
          montant_paye: number | null;
          nb_engagements: number | null;
          nb_liquidations: number | null;
          nb_notes: number | null;
          nb_ordonnancements: number | null;
          nb_reglements: number | null;
          objet: string | null;
          statut_global: string | null;
        };
        Relationships: [];
      };
      v_dossiers_urgents: {
        Row: {
          created_at: string | null;
          createur: string | null;
          direction_label: string | null;
          direction_sigle: string | null;
          heures_attente: number | null;
          id: string | null;
          montant_estime: number | null;
          objet: string | null;
          reference: string | null;
          statut: string | null;
          submitted_at: string | null;
          type_depense: string | null;
        };
        Relationships: [];
      };
      v_engagement_stats: {
        Row: {
          budget_line_id: string | null;
          code: string | null;
          direction_sigle: string | null;
          disponible: number | null;
          dotation_actuelle: number | null;
          dotation_initiale: number | null;
          engage_valide: number | null;
          exercice: number | null;
          label: string | null;
          os_code: string | null;
          taux_engagement: number | null;
          total_engage: number | null;
        };
        Relationships: [];
      };
      v_etape_delais: {
        Row: {
          count_valides: number | null;
          delai_max: number | null;
          delai_min: number | null;
          delai_moyen_validation: number | null;
          exercice: number | null;
          module: string | null;
        };
        Relationships: [];
      };
      v_etat_caisse: {
        Row: {
          banque: string | null;
          code: string | null;
          compte_id: string | null;
          derniere_operation_date: string | null;
          devise: string | null;
          entrees_mois: number | null;
          est_actif: boolean | null;
          libelle: string | null;
          solde_actuel: number | null;
          solde_initial: number | null;
          sorties_mois: number | null;
          type_compte: string | null;
          variation: number | null;
        };
        Insert: {
          banque?: string | null;
          code?: string | null;
          compte_id?: string | null;
          derniere_operation_date?: never;
          devise?: string | null;
          entrees_mois?: never;
          est_actif?: boolean | null;
          libelle?: string | null;
          solde_actuel?: number | null;
          solde_initial?: number | null;
          sorties_mois?: never;
          type_compte?: string | null;
          variation?: never;
        };
        Update: {
          banque?: string | null;
          code?: string | null;
          compte_id?: string | null;
          derniere_operation_date?: never;
          devise?: string | null;
          entrees_mois?: never;
          est_actif?: boolean | null;
          libelle?: string | null;
          solde_actuel?: number | null;
          solde_initial?: number | null;
          sorties_mois?: never;
          type_compte?: string | null;
          variation?: never;
        };
        Relationships: [];
      };
      v_expressions_besoin_stats: {
        Row: {
          brouillon: number | null;
          differe: number | null;
          exercice: number | null;
          montant_valide_total: number | null;
          rejete: number | null;
          soumis: number | null;
          total: number | null;
          valide: number | null;
        };
        Relationships: [];
      };
      v_kpi_paiement: {
        Row: {
          dotation_totale: number | null;
          exercice: number | null;
          nb_lignes_budget: number | null;
          taux_engagement: number | null;
          taux_execution_global: number | null;
          taux_liquidation: number | null;
          taux_ordonnancement: number | null;
          taux_paiement: number | null;
          total_engage: number | null;
          total_liquide: number | null;
          total_ordonnance: number | null;
          total_paye: number | null;
        };
        Relationships: [];
      };
      v_liquidations_urgentes: {
        Row: {
          date_liquidation: string | null;
          date_marquage: string | null;
          engagement_numero: string | null;
          fournisseur: string | null;
          id: string | null;
          jours_depuis_marquage: number | null;
          marque_par_nom: string | null;
          montant: number | null;
          montant_formate: string | null;
          motif_urgence: string | null;
          objet: string | null;
          reference: string | null;
          reglement_urgent_par: string | null;
          statut: string | null;
        };
        Relationships: [];
      };
      v_logs_actions: {
        Row: {
          action: string | null;
          action_label: string | null;
          created_at: string | null;
          entity_id: string | null;
          entity_reference: string | null;
          entity_type: string | null;
          entity_type_label: string | null;
          id: string | null;
          ip_address: string | null;
          metadata: Json | null;
          new_status: string | null;
          old_status: string | null;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
        };
        Insert: {
          action?: never;
          action_label?: never;
          created_at?: string | null;
          entity_id?: string | null;
          entity_reference?: string | null;
          entity_type?: string | null;
          entity_type_label?: never;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          new_status?: string | null;
          old_status?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Update: {
          action?: never;
          action_label?: never;
          created_at?: string | null;
          entity_id?: string | null;
          entity_reference?: string | null;
          entity_type?: string | null;
          entity_type_label?: never;
          id?: string | null;
          ip_address?: string | null;
          metadata?: Json | null;
          new_status?: string | null;
          old_status?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
      v_marches_stats: {
        Row: {
          en_attente: number | null;
          exercice: number | null;
          montant_total: number | null;
          montant_valide: number | null;
          rejetes: number | null;
          total: number | null;
          type_marche: string | null;
          type_procedure: string | null;
          valides: number | null;
        };
        Relationships: [];
      };
      v_mouvements_details: {
        Row: {
          banque: string | null;
          compte_bancaire_code: string | null;
          compte_bancaire_libelle: string | null;
          created_at: string | null;
          created_by: string | null;
          created_by_name: string | null;
          date_reglement: string | null;
          id: string | null;
          montant: number | null;
          montant_total_reglement: number | null;
          numero_reglement: string | null;
          objet: string | null;
          piece_justificative_url: string | null;
          reference: string | null;
          reglement_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'mouvements_bancaires_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'reglements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mouvements_bancaires_reglement_id_fkey';
            columns: ['reglement_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglements_paiements';
            referencedColumns: ['id'];
          },
        ];
      };
      v_paiements_a_venir: {
        Row: {
          banque_beneficiaire: string | null;
          beneficiaire: string | null;
          code_ligne_budgetaire: string | null;
          date_ordonnancement: string | null;
          dossier_id: string | null;
          exercice: number | null;
          fournisseur: string | null;
          libelle_ligne_budgetaire: string | null;
          mode_paiement: string | null;
          montant_paye: number | null;
          montant_total: number | null;
          numero_dossier: string | null;
          numero_engagement: string | null;
          numero_liquidation: string | null;
          numero_ordonnancement: string | null;
          objet: string | null;
          ordonnancement_id: string | null;
          priorite: number | null;
          reste_a_payer: number | null;
          rib_beneficiaire: string | null;
        };
        Relationships: [];
      };
      v_position_tresorerie: {
        Row: {
          exercice: number | null;
          montant_a_payer: number | null;
          nb_ordres_a_payer: number | null;
          nb_partiels: number | null;
          solde_disponible: number | null;
        };
        Relationships: [];
      };
      v_reamenagements_budgetaires: {
        Row: {
          budget_destination_apres: number | null;
          budget_destination_avant: number | null;
          budget_line_destination_id: string | null;
          budget_line_source_id: string | null;
          budget_source_apres: number | null;
          budget_source_avant: number | null;
          created_at: string | null;
          created_by: string | null;
          created_by_nom: string | null;
          date_validation: string | null;
          exercice: number | null;
          id: string | null;
          imputation_destination: string | null;
          imputation_source: string | null;
          libelle_destination: string | null;
          libelle_destination_complet: string | null;
          libelle_source: string | null;
          libelle_source_complet: string | null;
          montant: number | null;
          motif: string | null;
          motif_rejet: string | null;
          mouvement_destination_id: string | null;
          mouvement_source_id: string | null;
          nature_nbe_destination: string | null;
          nature_nbe_source: string | null;
          reference_note: string | null;
          statut: string | null;
          updated_at: string | null;
          valide_par: string | null;
          valide_par_nom: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_destination_id_fkey';
            columns: ['budget_line_destination_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'budget_lines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_alertes_financieres';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_budget_disponibilite_complet';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_engagement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_budget_line_source_id_fkey';
            columns: ['budget_line_source_id'];
            isOneToOne: false;
            referencedRelation: 'v_reglement_stats';
            referencedColumns: ['budget_line_id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_mouvement_destination_id_fkey';
            columns: ['mouvement_destination_id'];
            isOneToOne: false;
            referencedRelation: 'budget_movements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_mouvement_source_id_fkey';
            columns: ['mouvement_source_id'];
            isOneToOne: false;
            referencedRelation: 'budget_movements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_valide_par_fkey';
            columns: ['valide_par'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reamenagements_budgetaires_valide_par_fkey';
            columns: ['valide_par'];
            isOneToOne: false;
            referencedRelation: 'profiles_display';
            referencedColumns: ['id'];
          },
        ];
      };
      v_reglement_stats: {
        Row: {
          budget_line_id: string | null;
          code: string | null;
          dotation_courante: number | null;
          dotation_initiale: number | null;
          exercice: number | null;
          label: string | null;
          taux_execution: number | null;
          taux_paiement: number | null;
          total_engage: number | null;
          total_liquide: number | null;
          total_ordonnance: number | null;
          total_paye: number | null;
        };
        Insert: {
          budget_line_id?: string | null;
          code?: string | null;
          dotation_courante?: never;
          dotation_initiale?: number | null;
          exercice?: number | null;
          label?: string | null;
          taux_execution?: never;
          taux_paiement?: never;
          total_engage?: never;
          total_liquide?: never;
          total_ordonnance?: never;
          total_paye?: never;
        };
        Update: {
          budget_line_id?: string | null;
          code?: string | null;
          dotation_courante?: never;
          dotation_initiale?: number | null;
          exercice?: number | null;
          label?: string | null;
          taux_execution?: never;
          taux_paiement?: never;
          total_engage?: never;
          total_liquide?: never;
          total_ordonnance?: never;
          total_paye?: never;
        };
        Relationships: [];
      };
      v_reglements_paiements: {
        Row: {
          created_at: string | null;
          date_dernier_paiement: string | null;
          date_reglement: string | null;
          exercice_id: number | null;
          id: string | null;
          montant_ht: number | null;
          montant_paye: number | null;
          montant_ttc: number | null;
          nombre_mouvements: number | null;
          numero_reglement: string | null;
          ordonnancement_id: string | null;
          reste_a_payer: number | null;
          statut: string | null;
          statut_paiement: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reglements_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'ordonnancements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reglements_ordonnancement_id_fkey';
            columns: ['ordonnancement_id'];
            isOneToOne: false;
            referencedRelation: 'v_paiements_a_venir';
            referencedColumns: ['ordonnancement_id'];
          },
        ];
      };
      v_stats_par_direction: {
        Row: {
          differees: number | null;
          direction: string | null;
          direction_id: string | null;
          direction_label: string | null;
          en_attente: number | null;
          montant_valide: number | null;
          rejetees: number | null;
          total_notes: number | null;
          validees: number | null;
        };
        Relationships: [];
      };
      v_stats_par_type_depense: {
        Row: {
          montant_valide: number | null;
          total: number | null;
          type_depense: string | null;
          validees: number | null;
        };
        Relationships: [];
      };
      v_tableau_financier: {
        Row: {
          budget_initial: number | null;
          budget_modifie: number | null;
          direction_code: string | null;
          direction_id: string | null;
          direction_label: string | null;
          exercice: number | null;
          taux_engagement: number | null;
          taux_liquidation: number | null;
          taux_ordonnancement: number | null;
          total_engagements: number | null;
          total_liquidations: number | null;
          total_ordonnancements: number | null;
          total_reglements: number | null;
        };
        Relationships: [];
      };
      v_top_directions_imputations: {
        Row: {
          direction_code: string | null;
          direction_id: string | null;
          direction_label: string | null;
          direction_sigle: string | null;
          exercice: number | null;
          montant_force: number | null;
          montant_total: number | null;
          nb_imputations: number | null;
        };
        Relationships: [];
      };
      v_top_os_imputations: {
        Row: {
          exercice: number | null;
          montant_force: number | null;
          montant_total: number | null;
          nb_imputations: number | null;
          os_code: string | null;
          os_id: string | null;
          os_libelle: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      acknowledge_budget_alert: {
        Args: { p_alert_id: string };
        Returns: boolean;
      };
      add_mouvement_bancaire: {
        Args: {
          p_compte_bancaire_code: string;
          p_date_reglement?: string;
          p_montant: number;
          p_objet?: string;
          p_reference: string;
          p_reglement_id: string;
        };
        Returns: string;
      };
      advance_workflow: {
        Args: {
          p_action: string;
          p_condition_reprise?: string;
          p_date_reprise?: string;
          p_entity_id: string;
          p_entity_type: string;
          p_motif?: string;
        };
        Returns: Json;
      };
      backfill_arti_references: {
        Args: never;
        Returns: {
          records_updated: number;
          table_name: string;
        }[];
      };
      bloquer_dossier: {
        Args: { p_dossier_id: string; p_motif: string; p_user_id: string };
        Returns: undefined;
      };
      can_delete_dictionary_element: {
        Args: { p_element_id: string; p_table_name: string };
        Returns: Json;
      };
      can_engage_on_budget_line: {
        Args: { p_budget_line_id: string };
        Returns: boolean;
      };
      can_export_notes_sef: { Args: { p_user_id: string }; Returns: boolean };
      can_manage_dictionaries: { Args: never; Returns: boolean };
      can_qualify_supplier: { Args: { p_supplier_id: string }; Returns: Json };
      can_transition: {
        Args: {
          p_from_status: string;
          p_module: string;
          p_to_status: string;
          p_user_id?: string;
        };
        Returns: {
          action_code: string;
          action_label: string;
          allowed: boolean;
          reason: string;
          requires_budget_check: boolean;
          requires_motif: boolean;
        }[];
      };
      can_validate_as_interim: {
        Args: { p_titulaire_id: string; p_user_id: string };
        Returns: boolean;
      };
      can_view_note_sef: {
        Args: {
          p_note_created_by: string;
          p_note_direction_id: string;
          p_note_statut: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      cancel_generated_document: {
        Args: { p_document_id: string; p_motif: string };
        Returns: boolean;
      };
      cancel_workflow_tasks: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: undefined;
      };
      check_budget_alerts: {
        Args: { p_exercice: number };
        Returns: {
          alerte_id: string;
          ligne_code: string;
          niveau: string;
          seuil: number;
          taux: number;
        }[];
      };
      check_budget_availability: {
        Args: { p_budget_line_id: string; p_montant: number };
        Returns: {
          disponible: number;
          dotation: number;
          engaged: number;
          is_available: boolean;
          message: string;
        }[];
      };
      check_exercice_writable: {
        Args: { p_exercice: number };
        Returns: boolean;
      };
      check_marche_prerequisites: {
        Args: { p_expression_besoin_id: string };
        Returns: Json;
      };
      check_permission_with_conditions: {
        Args: {
          p_action_code: string;
          p_direction_id?: string;
          p_entity_id?: string;
          p_exercice?: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      check_separation_of_duties: {
        Args: {
          p_action: string;
          p_entity_id: string;
          p_entity_type: string;
          p_user_id?: string;
        };
        Returns: Json;
      };
      cleanup_old_notifications: { Args: never; Returns: number };
      close_workflow_task: {
        Args: {
          p_action: string;
          p_comment?: string;
          p_entity_id: string;
          p_entity_type: string;
          p_user_id?: string;
        };
        Returns: undefined;
      };
      copy_budget_structure: {
        Args: {
          p_copy_dotations?: boolean;
          p_source_exercice: number;
          p_target_exercice: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      count_notes_aef_by_statut: {
        Args: {
          p_exercice: number;
        };
        Returns: Json;
      };
      count_search_notes_aef: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
          p_direction_id?: string;
          p_exercice: number;
          p_search?: string;
          p_statut?: string[];
          p_urgence?: string;
        };
        Returns: number;
      };
      count_search_notes_sef: {
        Args: { p_exercice: number; p_search?: string; p_statut?: string[] };
        Returns: number;
      };
      count_search_notes_sef_v2: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
          p_direction_id?: string;
          p_exercice: number;
          p_search?: string;
          p_statut?: string[];
          p_urgence?: string;
        };
        Returns: number;
      };
      create_engagement_from_eb: {
        Args: {
          p_budget_line_id: string;
          p_expression_besoin_id: string;
          p_montant: number;
          p_user_id: string;
        };
        Returns: string;
      };
      create_import_run: {
        Args: {
          p_column_mapping?: Json;
          p_exercice: number;
          p_filename: string;
          p_sheet_name?: string;
        };
        Returns: string;
      };
      create_interim: {
        Args: {
          p_date_debut: string;
          p_date_fin: string;
          p_interimaire_id: string;
          p_motif: string;
          p_titulaire_id: string;
        };
        Returns: string;
      };
      create_lambda_link: {
        Args: {
          p_cible_id?: string;
          p_cible_table: string;
          p_exercice?: number;
          p_mapping?: Json;
          p_source_id: string;
          p_source_table: string;
          p_type_lien?: string;
        };
        Returns: string;
      };
      create_note_sef_notification: {
        Args: {
          p_entity_id: string;
          p_is_urgent?: boolean;
          p_message: string;
          p_reference: string;
          p_title: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: string;
      };
      create_notification: {
        Args: {
          p_entity_id?: string;
          p_entity_type?: string;
          p_message: string;
          p_metadata?: Json;
          p_titre: string;
          p_type: string;
          p_user_id: string;
        };
        Returns: string;
      };
      create_workflow_task: {
        Args: {
          p_assignee_role: string;
          p_created_by?: string;
          p_direction_id: string;
          p_dossier_id: string;
          p_entity_code: string;
          p_entity_id: string;
          p_entity_title: string;
          p_entity_type: string;
          p_exercice?: number;
          p_montant?: number;
          p_priority?: string;
          p_sla_hours?: number;
          p_task_type: string;
        };
        Returns: string;
      };
      deactivate_expired_interims: { Args: never; Returns: number };
      debloquer_dossier: {
        Args: { p_commentaire: string; p_dossier_id: string; p_user_id: string };
        Returns: undefined;
      };
      end_interim: { Args: { p_interim_id: string }; Returns: boolean };
      execute_credit_transfer: {
        Args: { p_transfer_id: string; p_user_id?: string };
        Returns: Json;
      };
      execute_transition: {
        Args: {
          p_entity_code: string;
          p_entity_id: string;
          p_from_status: string;
          p_metadata?: Json;
          p_module: string;
          p_motif?: string;
          p_to_status: string;
        };
        Returns: {
          action_code: string;
          message: string;
          success: boolean;
        }[];
      };
      finalize_import_run: { Args: { p_run_id: string }; Returns: Json };
      fn_count_direction_usage: {
        Args: { p_direction_id: string };
        Returns: number;
      };
      fn_count_ligne_budgetaire_usage: {
        Args: { p_ligne_id: string };
        Returns: number;
      };
      fn_count_projet_usage: { Args: { p_projet_id: string }; Returns: number };
      fn_count_type_depense_usage: {
        Args: { p_type_depense_id: string };
        Returns: number;
      };
      fn_detecter_type_demande: {
        Args: { p_description?: string; p_objet: string };
        Returns: string;
      };
      fn_extract_initiales: { Args: { p_nom_complet: string }; Returns: string };
      fn_get_imputations_suggerees: {
        Args: { p_type_demande_id: string };
        Returns: {
          direction_code: string;
          direction_id: string;
          direction_label: string;
          direction_sigle: string;
          est_obligatoire: boolean;
          motif: string;
          priorite: number;
        }[];
      };
      fn_get_user_initiales: { Args: { p_user_id: string }; Returns: string };
      fn_marquer_affectation_lue: {
        Args: { p_affectation_id: string; p_user_id?: string };
        Returns: boolean;
      };
      fn_marquer_affectation_traitee: {
        Args: {
          p_affectation_id: string;
          p_commentaire?: string;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      fn_verifier_budget_disponible: {
        Args: { p_ligne_budgetaire_id: string; p_montant: number };
        Returns: {
          budget_disponible: number;
          depassement: boolean;
          message: string;
          montant_depassement: number;
        }[];
      };
      generate_aef_reference_with_initiales: {
        Args: { p_date_ref?: string; p_user_id: string };
        Returns: string;
      };
      generate_arti_reference: {
        Args: { p_date?: string; p_etape: number };
        Returns: string;
      };
      generate_budget_code_v2: {
        Args: {
          p_action_code: string;
          p_activite_code: string;
          p_direction_code: string;
          p_direction_id: string;
          p_exercice: number;
          p_mission_code: string;
          p_nve_code: string;
        };
        Returns: string;
      };
      generate_code_from_pattern: {
        Args: { p_exercice?: number; p_rule_id: string; p_values: Json };
        Returns: {
          code: string;
          is_valid: boolean;
          warnings: string[];
        }[];
      };
      generate_imputation_numero: {
        Args: { p_exercice: number };
        Returns: string;
      };
      generate_note_aef_numero: {
        Args: { p_exercice: number };
        Returns: string;
      };
      generate_note_aef_reference: {
        Args: { p_exercice: number };
        Returns: string;
      };
      generate_note_sef_numero: {
        Args: { p_exercice: number };
        Returns: string;
      };
      generate_note_sef_reference_pivot: {
        Args: { p_exercice?: number };
        Returns: string;
      };
      generate_prestataire_code: { Args: never; Returns: string };
      generate_reference: {
        Args: { p_date_ref?: string; p_etape: string };
        Returns: string;
      };
      generate_reference_with_initiales: {
        Args: { p_date_ref?: string; p_etape: string; p_initiales?: string };
        Returns: string;
      };
      generate_sef_reference: { Args: { p_date_ref?: string }; Returns: string };
      generate_sef_reference_with_initiales: {
        Args: { p_date_ref?: string; p_user_id: string };
        Returns: string;
      };
      generate_transfer_code: {
        Args: { p_exercice: number; p_type?: string };
        Returns: string;
      };
      generate_unique_code: {
        Args: {
          p_annee?: number;
          p_exercice?: number;
          p_mois?: number;
          p_objet: string;
        };
        Returns: string;
      };
      get_active_interim_for_titulaire: {
        Args: { p_titulaire_id: string };
        Returns: {
          date_debut: string;
          date_fin: string;
          interim_id: string;
          interimaire_id: string;
          interimaire_nom: string;
        }[];
      };
      get_active_interim_for_user: {
        Args: { p_user_id: string };
        Returns: {
          date_fin: string;
          interim_id: string;
          titulaire_id: string;
          titulaire_nom: string;
        }[];
      };
      get_available_transitions: {
        Args: { p_current_status: string; p_module: string; p_user_id?: string };
        Returns: {
          action_code: string;
          action_label: string;
          requires_budget_check: boolean;
          requires_motif: boolean;
          to_status: string;
        }[];
      };
      get_dashboard_data: { Args: { p_exercice?: number }; Returns: Json };
      get_delai_moyen_traitement: {
        Args: { p_exercice?: number };
        Returns: Json;
      };
      get_depense_summary: {
        Args: { p_ordonnancement_id: string };
        Returns: Json;
      };
      get_direction_director_id: {
        Args: { p_direction_id: string };
        Returns: string;
      };
      get_dmg_dashboard_data: { Args: never; Returns: Json };
      get_dossier_current_step: {
        Args: { p_dossier_id: string };
        Returns: {
          etape_code: string;
          etape_libelle: string;
          etape_ordre: number;
          statut: string;
        }[];
      };
      get_dossier_workflow_progress: {
        Args: { p_dossier_id: string };
        Returns: {
          assigned_to_name: string;
          date_debut: string;
          date_fin: string;
          etape_code: string;
          etape_libelle: string;
          etape_ordre: number;
          statut: string;
        }[];
      };
      get_entity_transition_history: {
        Args: { p_entity_id: string; p_module: string };
        Returns: {
          action_code: string;
          from_status: string;
          id: string;
          metadata: Json;
          motif: string;
          performed_at: string;
          performed_by: string;
          performer_name: string;
          to_status: string;
        }[];
      };
      get_evolution_mensuelle: { Args: { p_exercice?: number }; Returns: Json };
      get_exercice_budget_summary: {
        Args: { p_exercice: number };
        Returns: Json;
      };
      get_historique_libelle: {
        Args: { p_id: string; p_table: string };
        Returns: {
          ancien_libelle: string;
          id: string;
          modifie_at: string;
          modifie_par: string;
          modifie_par_nom: string;
          motif: string;
          nouveau_libelle: string;
        }[];
      };
      get_libelle_effectif: {
        Args: { p_id: string; p_table: string };
        Returns: string;
      };
      get_libelle_history: {
        Args: { p_budget_line_id: string };
        Returns: {
          ancienne_valeur: string;
          champ_modifie: string;
          created_at: string;
          id: string;
          modifie_par_nom: string;
          motif: string;
          nouvelle_valeur: string;
        }[];
      };
      get_next_budget_code_seq: {
        Args: { p_direction_id: string; p_exercice: number };
        Returns: number;
      };
      get_next_sequence: {
        Args: {
          p_direction_code?: string;
          p_doc_type: string;
          p_exercice: number;
          p_scope?: string;
        };
        Returns: {
          full_code: string;
          number_padded: string;
          number_raw: number;
          prefix: string;
          year: number;
        }[];
      };
      get_notification_recipients: {
        Args: { p_type_evenement: string };
        Returns: {
          canal: string;
          email: string;
          full_name: string;
          user_id: string;
        }[];
      };
      get_notification_summary: { Args: { p_entity_id: string }; Returns: Json };
      get_pending_workflows: {
        Args: { p_user_id?: string };
        Returns: {
          current_step: number;
          current_step_label: string;
          days_pending: number;
          entity_id: string;
          entity_type: string;
          role_required: string;
          started_at: string;
          total_steps: number;
          workflow_name: string;
        }[];
      };
      get_raci_informed_roles: {
        Args: { p_processus_code: string };
        Returns: Json;
      };
      get_reglement_summary: { Args: { p_reglement_id: string }; Returns: Json };
      get_reste_a_payer: { Args: { p_reglement_id: string }; Returns: number };
      get_stats_paiements: {
        Args: { p_exercice?: number };
        Returns: {
          nb_complets: number;
          nb_non_effectues: number;
          nb_partiels: number;
          total_montant: number;
          total_paye: number;
          total_reglements: number;
          total_reste: number;
        }[];
      };
      get_stats_utilisateurs: { Args: { p_exercice?: number }; Returns: Json };
      get_statut_paiement: { Args: { p_reglement_id: string }; Returns: string };
      get_tableau_financier: {
        Args: { p_direction_id?: string; p_exercice_id?: string };
        Returns: {
          budget_initial: number;
          budget_modifie: number;
          direction_code: string;
          direction_id: string;
          direction_label: string;
          nb_dossiers_bloques: number;
          nb_dossiers_en_cours: number;
          taux_engagement: number;
          taux_liquidation: number;
          taux_ordonnancement: number;
          total_engagements: number;
          total_liquidations: number;
          total_ordonnancements: number;
          total_reglements: number;
        }[];
      };
      get_unread_notification_count: { Args: never; Returns: number };
      get_unread_notifications_count: { Args: never; Returns: number };
      get_urgent_liquidations_count: { Args: never; Returns: number };
      get_urgent_liquidations_stats: { Args: never; Returns: Json };
      get_user_direction: { Args: { _user_id: string }; Returns: string };
      get_user_direction_id: { Args: { p_user_id: string }; Returns: string };
      get_user_exercice_actif: { Args: { _user_id: string }; Returns: number };
      get_user_permissions: {
        Args: { p_user_id: string };
        Returns: {
          action_code: string;
          via_delegation: boolean;
        }[];
      };
      get_user_roles: {
        Args: { _user_id: string };
        Returns: Database['public']['Enums']['app_role'][];
      };
      get_workflow_config: { Args: { p_entity_type?: string }; Returns: Json };
      get_workflow_status: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: Json;
      };
      has_active_delegation: {
        Args: { p_delegataire_id: string; p_perimetre?: string };
        Returns: {
          delegateur_id: string;
          delegateur_name: string;
        }[];
      };
      has_permission: {
        Args: { _action_code: string; _user_id: string };
        Returns: boolean;
      };
      has_profil_fonctionnel: {
        Args: {
          _profil: Database['public']['Enums']['profil_fonctionnel'];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_role_hierarchique: {
        Args: {
          _role: Database['public']['Enums']['role_hierarchique'];
          _user_id: string;
        };
        Returns: boolean;
      };
      import_prestataires: {
        Args: { p_rows: Json; p_user_id: string };
        Returns: Json;
      };
      init_production_checklist: {
        Args: { p_exercice: number };
        Returns: undefined;
      };
      is_expression_besoin_validated: {
        Args: { eb_id: string };
        Returns: boolean;
      };
      is_notes_sef_admin: { Args: { _user_id: string }; Returns: boolean };
      is_notes_sef_validator: { Args: { _user_id: string }; Returns: boolean };
      is_prefix_reserved: {
        Args: { p_code: string };
        Returns: {
          is_reserved: boolean;
          reserved_for: string;
        }[];
      };
      log_action: {
        Args: {
          p_action: Database['public']['Enums']['log_action_type'];
          p_entity_id?: string;
          p_entity_reference?: string;
          p_entity_type: string;
          p_metadata?: Json;
          p_new_status?: string;
          p_old_status?: string;
        };
        Returns: string;
      };
      log_audit_action: {
        Args: {
          p_action: string;
          p_entity_code?: string;
          p_entity_id: string;
          p_entity_type: string;
          p_exercice?: number;
          p_justification?: string;
          p_module?: string;
          p_new_values?: Json;
          p_old_values?: Json;
          p_resume?: string;
        };
        Returns: string;
      };
      log_audit_with_exercice: {
        Args: {
          p_action: string;
          p_entity_id: string;
          p_entity_type: string;
          p_exercice?: number;
          p_new_values?: Json;
          p_old_values?: Json;
        };
        Returns: string;
      };
      log_import_event: {
        Args: {
          p_details?: Json;
          p_level: string;
          p_message: string;
          p_row_number?: number;
          p_run_id: string;
          p_step?: string;
        };
        Returns: string;
      };
      mark_all_notifications_read: { Args: never; Returns: number };
      mark_liquidation_urgent: {
        Args: { p_liquidation_id: string; p_motif: string };
        Returns: boolean;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: boolean;
      };
      marquer_affectation_lue: {
        Args: { p_affectation_id: string };
        Returns: boolean;
      };
      next_reference: {
        Args: { p_input_date?: string; p_step_code: string };
        Returns: string;
      };
      notify_imputed_directions: {
        Args: { p_note_id: string; p_note_numero: string; p_note_objet: string };
        Returns: undefined;
      };
      notify_ordonnancement_manually: {
        Args: { p_ordonnancement_id: string };
        Returns: number;
      };
      notify_reglement_manually: {
        Args: { p_reglement_id: string };
        Returns: number;
      };
      parse_arti_reference: {
        Args: { p_reference: string };
        Returns: {
          annee: number;
          etape: number;
          is_valid: boolean;
          mois: number;
          numero: number;
        }[];
      };
      parse_sequence_code: {
        Args: { p_code: string };
        Returns: {
          number_raw: number;
          prefix: string;
          year: number;
        }[];
      };
      recalculer_montants_dossier: {
        Args: { p_dossier_id: string };
        Returns: undefined;
      };
      refuse_prestataire_request: {
        Args: {
          p_commentaire: string;
          p_request_id: string;
          p_validator_id: string;
        };
        Returns: boolean;
      };
      regenerate_budget_codes_v2: {
        Args: { p_line_ids: string[] };
        Returns: {
          line_id: string;
          new_code: string;
          old_code: string;
        }[];
      };
      register_generated_document: {
        Args: {
          p_chemin_stockage?: string;
          p_date_expiration?: string;
          p_direction_id?: string;
          p_entity_id: string;
          p_entity_type: string;
          p_exercice?: number;
          p_metadata?: Json;
          p_nom_fichier: string;
          p_reference: string;
          p_taille_octets?: number;
          p_type_document: string;
        };
        Returns: {
          id: string;
          qr_code_data: string;
          qr_code_hash: string;
        }[];
      };
      reject_reamenagement: {
        Args: { p_motif: string; p_reamenagement_id: string };
        Returns: boolean;
      };
      render_notification_template: {
        Args: { p_template_code: string; p_variables: Json };
        Returns: {
          corps: string;
          template_id: string;
          titre: string;
        }[];
      };
      resolve_alert: {
        Args: { p_alert_id: string; p_comment?: string };
        Returns: undefined;
      };
      resolve_budget_alert: {
        Args: { p_alert_id: string; p_comment?: string };
        Returns: boolean;
      };
      resume_workflow: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: Json;
      };
      revert_libelle: { Args: { p_id: string; p_table: string }; Returns: Json };
      search_notes_aef: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
          p_direction_id?: string;
          p_exercice: number;
          p_limit?: number;
          p_offset?: number;
          p_search?: string;
          p_sort_by?: string;
          p_sort_order?: string;
          p_statut?: string[];
          p_urgence?: string;
        };
        Returns: {
          id: string;
        }[];
      };
      search_notes_sef: {
        Args: {
          p_exercice: number;
          p_limit?: number;
          p_offset?: number;
          p_search?: string;
          p_sort_by?: string;
          p_sort_order?: string;
          p_statut?: string[];
        };
        Returns: {
          beneficiaire_id: string;
          beneficiaire_interne_id: string;
          commentaire: string;
          created_at: string;
          created_by: string;
          date_souhaitee: string;
          demandeur_id: string;
          description: string;
          differe_at: string;
          differe_by: string;
          differe_condition: string;
          differe_date_reprise: string;
          differe_motif: string;
          direction_id: string;
          dossier_id: string;
          exercice: number;
          id: string;
          justification: string;
          numero: string;
          objet: string;
          reference_pivot: string;
          rejected_at: string;
          rejected_by: string;
          rejection_reason: string;
          statut: string;
          submitted_at: string;
          submitted_by: string;
          updated_at: string;
          urgence: string;
          validated_at: string;
          validated_by: string;
        }[];
      };
      search_notes_sef_v2: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
          p_direction_id?: string;
          p_exercice: number;
          p_limit?: number;
          p_offset?: number;
          p_search?: string;
          p_sort_by?: string;
          p_sort_order?: string;
          p_statut?: string[];
          p_urgence?: string;
        };
        Returns: {
          id: string;
        }[];
      };
      send_bulk_notifications: {
        Args: {
          p_entity_id: string;
          p_entity_type: string;
          p_type_evenement: string;
          p_variables: Json;
        };
        Returns: number;
      };
      setup_wf_steps: { Args: never; Returns: undefined };
      start_workflow: {
        Args: { p_entity_id: string; p_entity_type: string };
        Returns: string;
      };
      sync_arti_counter_from_import: {
        Args: {
          p_annee: number;
          p_etape: number;
          p_max_numero: number;
          p_mois: number;
        };
        Returns: boolean;
      };
      sync_lambda_link: { Args: { p_link_id: string }; Returns: boolean };
      sync_referentiels_from_import: {
        Args: {
          p_activites?: Json;
          p_directions?: Json;
          p_filename: string;
          p_nbe?: Json;
          p_objectifs_strategiques?: Json;
          p_sous_activites?: Json;
        };
        Returns: Json;
      };
      sync_sequence_counter: {
        Args: {
          p_direction_code?: string;
          p_doc_type: string;
          p_exercice: number;
          p_imported_number: number;
          p_scope?: string;
        };
        Returns: boolean;
      };
      test_codification_pattern: {
        Args: { p_exercice?: number; p_pattern: Json; p_values: Json };
        Returns: {
          code: string;
          is_valid: boolean;
          segments: Json;
        }[];
      };
      test_codification_rule: {
        Args: { p_annee?: number; p_exercice?: number; p_rule_id: string };
        Returns: string;
      };
      unmark_liquidation_urgent: {
        Args: { p_liquidation_id: string };
        Returns: boolean;
      };
      update_budget_libelle: {
        Args: {
          p_budget_line_id: string;
          p_field_name: string;
          p_motif?: string;
          p_new_value: string;
        };
        Returns: undefined;
      };
      update_import_run_stats: {
        Args: { p_run_id: string };
        Returns: undefined;
      };
      update_libelle_budget: {
        Args: {
          p_id: string;
          p_motif?: string;
          p_nouveau_libelle: string;
          p_table: string;
        };
        Returns: Json;
      };
      update_supplier_document_statuses: { Args: never; Returns: number };
      user_can_access_exercice: {
        Args: { p_exercice: number };
        Returns: boolean;
      };
      user_has_any_role: {
        Args: { p_roles: string[]; p_user_id: string };
        Returns: boolean;
      };
      user_has_permission: {
        Args: { p_action_code: string; p_user_id: string };
        Returns: boolean;
      };
      user_has_role: {
        Args: { p_role_code: string; p_user_id: string };
        Returns: boolean;
      };
      validate_budget: {
        Args: { p_exercice: number; p_user_id: string };
        Returns: Json;
      };
      validate_import_run: { Args: { p_run_id: string }; Returns: Json };
      validate_prestataire_request: {
        Args: { p_request_id: string; p_validator_id: string };
        Returns: string;
      };
      validate_reamenagement: {
        Args: { p_reamenagement_id: string };
        Returns: boolean;
      };
      validate_urgent_reglement: {
        Args: { p_liquidation_id: string; p_motif: string };
        Returns: undefined;
      };
      verify_document_qr: {
        Args: {
          p_hash: string;
          p_ip_address?: string;
          p_origin_url?: string;
          p_user_agent?: string;
        };
        Returns: Json;
      };
      wf_admin_delete_step: { Args: { p_step_id: string }; Returns: boolean };
      wf_admin_reorder_steps: {
        Args: { p_step_ids: string[]; p_workflow_id: string };
        Returns: boolean;
      };
      wf_admin_set_step_actions: {
        Args: { p_action_codes: string[]; p_step_id: string };
        Returns: boolean;
      };
      wf_admin_set_step_permission: {
        Args: {
          p_can_act?: boolean;
          p_can_delegate?: boolean;
          p_can_view?: boolean;
          p_is_primary?: boolean;
          p_role_code: string;
          p_service_code?: string;
          p_step_id: string;
        };
        Returns: string;
      };
      wf_admin_upsert_action: {
        Args: {
          p_code?: string;
          p_color?: string;
          p_description?: string;
          p_est_actif?: boolean;
          p_icon?: string;
          p_id?: string;
          p_is_terminal?: boolean;
          p_label?: string;
          p_require_date_reprise?: boolean;
          p_require_motif?: boolean;
        };
        Returns: string;
      };
      wf_admin_upsert_role: {
        Args: {
          p_code?: string;
          p_description?: string;
          p_est_actif?: boolean;
          p_id?: string;
          p_label?: string;
          p_niveau_hierarchique?: number;
        };
        Returns: string;
      };
      wf_admin_upsert_service: {
        Args: {
          p_code?: string;
          p_description?: string;
          p_est_actif?: boolean;
          p_id?: string;
          p_label?: string;
          p_parent_id?: string;
          p_responsable_role_code?: string;
        };
        Returns: string;
      };
      wf_admin_upsert_step: {
        Args: {
          p_delai_max_heures?: number;
          p_description?: string;
          p_direction_required?: string;
          p_est_optionnel?: boolean;
          p_id?: string;
          p_label?: string;
          p_role_alternatif?: string;
          p_role_required?: string;
          p_step_order?: number;
          p_workflow_id?: string;
        };
        Returns: string;
      };
      wf_admin_upsert_workflow: {
        Args: {
          p_description?: string;
          p_entity_type?: string;
          p_est_actif?: boolean;
          p_id?: string;
          p_nom?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role:
        | 'ADMIN'
        | 'DG'
        | 'DAAF'
        | 'DGPEC'
        | 'SDMG'
        | 'CB'
        | 'OPERATEUR'
        | 'TRESORIER'
        | 'INVITE'
        | 'BUDGET_PLANNER'
        | 'BUDGET_VALIDATOR'
        | 'EXPENSE_REQUESTER'
        | 'EXPENSE_VALIDATOR'
        | 'AUDITOR'
        | 'DAF'
        | 'SDCT'
        | 'SAF'
        | 'SDPM'
        | 'TRESORERIE'
        | 'COMPTABILITE';
      log_action_type:
        | 'CREATE'
        | 'SUBMIT'
        | 'VALIDATE'
        | 'DEFER'
        | 'REJECT'
        | 'VIEW'
        | 'DOWNLOAD'
        | 'UPDATE'
        | 'DELETE'
        | 'LOGIN'
        | 'LOGOUT'
        | 'APPROVE'
        | 'CANCEL';
      migration_staging_status: 'PENDING' | 'READY' | 'IMPORTED' | 'ERROR';
      profil_fonctionnel: 'Admin' | 'Validateur' | 'Operationnel' | 'Controleur' | 'Auditeur';
      role_hierarchique: 'Agent' | 'Chef de Service' | 'Sous-Directeur' | 'Directeur' | 'DG';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        'ADMIN',
        'DG',
        'DAAF',
        'DGPEC',
        'SDMG',
        'CB',
        'OPERATEUR',
        'TRESORIER',
        'INVITE',
        'BUDGET_PLANNER',
        'BUDGET_VALIDATOR',
        'EXPENSE_REQUESTER',
        'EXPENSE_VALIDATOR',
        'AUDITOR',
        'DAF',
        'SDCT',
        'SAF',
        'SDPM',
        'TRESORERIE',
        'COMPTABILITE',
      ],
      log_action_type: [
        'CREATE',
        'SUBMIT',
        'VALIDATE',
        'DEFER',
        'REJECT',
        'VIEW',
        'DOWNLOAD',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'APPROVE',
        'CANCEL',
      ],
      migration_staging_status: ['PENDING', 'READY', 'IMPORTED', 'ERROR'],
      profil_fonctionnel: ['Admin', 'Validateur', 'Operationnel', 'Controleur', 'Auditeur'],
      role_hierarchique: ['Agent', 'Chef de Service', 'Sous-Directeur', 'Directeur', 'DG'],
    },
  },
} as const;
