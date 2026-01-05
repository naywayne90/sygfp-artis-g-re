export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          code: string
          created_at: string | null
          est_active: boolean | null
          id: string
          libelle: string
          mission_id: string
          os_id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle: string
          mission_id: string
          os_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle?: string
          mission_id?: string
          os_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "objectifs_strategiques"
            referencedColumns: ["id"]
          },
        ]
      }
      activites: {
        Row: {
          action_id: string
          code: string
          created_at: string | null
          est_active: boolean | null
          id: string
          libelle: string
          updated_at: string | null
        }
        Insert: {
          action_id: string
          code: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle: string
          updated_at?: string | null
        }
        Update: {
          action_id?: string
          code?: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activites_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_documents: {
        Row: {
          category: string
          created_at: string
          date_document: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          fournisseur: string | null
          id: string
          montant: number | null
          tags: string[] | null
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          date_document?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          fournisseur?: string | null
          id?: string
          montant?: number | null
          tags?: string[] | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          date_document?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          fournisseur?: string | null
          id?: string
          montant?: number | null
          tags?: string[] | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archived_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          exercice: number | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          exercice?: number | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          exercice?: number | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_activities: {
        Row: {
          budget_line_id: string
          code: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          label: string
          planned_amount: number
          responsible_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget_line_id: string
          code: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          label: string
          planned_amount?: number
          responsible_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget_line_id?: string
          code?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          label?: string
          planned_amount?: number
          responsible_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_activities_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_activities_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_engagements: {
        Row: {
          budget_line_id: string
          created_at: string
          created_by: string | null
          current_step: number | null
          date_differe: string | null
          date_engagement: string
          deadline_correction: string | null
          differe_by: string | null
          exercice: number | null
          expression_besoin_id: string | null
          fournisseur: string | null
          id: string
          legacy_import: boolean | null
          marche_id: string | null
          montant: number
          montant_ht: number | null
          motif_differe: string | null
          note_id: string | null
          numero: string
          objet: string
          project_id: string | null
          required_documents: string[] | null
          statut: string | null
          tva: number | null
          updated_at: string
          workflow_status: string | null
        }
        Insert: {
          budget_line_id: string
          created_at?: string
          created_by?: string | null
          current_step?: number | null
          date_differe?: string | null
          date_engagement?: string
          deadline_correction?: string | null
          differe_by?: string | null
          exercice?: number | null
          expression_besoin_id?: string | null
          fournisseur?: string | null
          id?: string
          legacy_import?: boolean | null
          marche_id?: string | null
          montant: number
          montant_ht?: number | null
          motif_differe?: string | null
          note_id?: string | null
          numero: string
          objet: string
          project_id?: string | null
          required_documents?: string[] | null
          statut?: string | null
          tva?: number | null
          updated_at?: string
          workflow_status?: string | null
        }
        Update: {
          budget_line_id?: string
          created_at?: string
          created_by?: string | null
          current_step?: number | null
          date_differe?: string | null
          date_engagement?: string
          deadline_correction?: string | null
          differe_by?: string | null
          exercice?: number | null
          expression_besoin_id?: string | null
          fournisseur?: string | null
          id?: string
          legacy_import?: boolean | null
          marche_id?: string | null
          montant?: number
          montant_ht?: number | null
          motif_differe?: string | null
          note_id?: string | null
          numero?: string
          objet?: string
          project_id?: string | null
          required_documents?: string[] | null
          statut?: string | null
          tva?: number | null
          updated_at?: string
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_engagements_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engagements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engagements_expression_besoin_id_fkey"
            columns: ["expression_besoin_id"]
            isOneToOne: false
            referencedRelation: "expressions_besoin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engagements_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engagements_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_dg"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engagements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_engagements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_financial"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_kpis: {
        Row: {
          activity_id: string
          created_at: string
          current_value: number | null
          id: string
          name: string
          target_value: number
          unit: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          current_value?: number | null
          id?: string
          name: string
          target_value: number
          unit: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          current_value?: number | null
          id?: string
          name?: string
          target_value?: number
          unit?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_kpis_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "budget_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_line_history: {
        Row: {
          budget_line_id: string
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          budget_line_id: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          budget_line_id?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_line_history_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_line_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          action_id: string | null
          activite_id: string | null
          code: string
          commentaire: string | null
          created_at: string
          direction_id: string | null
          dotation_initiale: number
          exercice: number
          id: string
          is_active: boolean | null
          label: string
          legacy_import: boolean | null
          level: string
          mission_id: string | null
          nbe_id: string | null
          os_id: string | null
          parent_id: string | null
          rejection_reason: string | null
          source_financement: string | null
          sous_activite_id: string | null
          statut: string | null
          submitted_at: string | null
          submitted_by: string | null
          sysco_id: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          action_id?: string | null
          activite_id?: string | null
          code: string
          commentaire?: string | null
          created_at?: string
          direction_id?: string | null
          dotation_initiale?: number
          exercice?: number
          id?: string
          is_active?: boolean | null
          label: string
          legacy_import?: boolean | null
          level: string
          mission_id?: string | null
          nbe_id?: string | null
          os_id?: string | null
          parent_id?: string | null
          rejection_reason?: string | null
          source_financement?: string | null
          sous_activite_id?: string | null
          statut?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          sysco_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          action_id?: string | null
          activite_id?: string | null
          code?: string
          commentaire?: string | null
          created_at?: string
          direction_id?: string | null
          dotation_initiale?: number
          exercice?: number
          id?: string
          is_active?: boolean | null
          label?: string
          legacy_import?: boolean | null
          level?: string
          mission_id?: string | null
          nbe_id?: string | null
          os_id?: string | null
          parent_id?: string | null
          rejection_reason?: string | null
          source_financement?: string | null
          sous_activite_id?: string | null
          statut?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          sysco_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_activite_id_fkey"
            columns: ["activite_id"]
            isOneToOne: false
            referencedRelation: "activites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_nbe_id_fkey"
            columns: ["nbe_id"]
            isOneToOne: false
            referencedRelation: "nomenclature_nbe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "objectifs_strategiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_sous_activite_id_fkey"
            columns: ["sous_activite_id"]
            isOneToOne: false
            referencedRelation: "sous_activites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_sysco_id_fkey"
            columns: ["sysco_id"]
            isOneToOne: false
            referencedRelation: "plan_comptable_sysco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_liquidations: {
        Row: {
          airsi_montant: number | null
          airsi_taux: number | null
          created_at: string
          created_by: string | null
          date_differe: string | null
          date_liquidation: string
          deadline_correction: string | null
          differe_by: string | null
          engagement_id: string
          exercice: number | null
          id: string
          legacy_import: boolean | null
          montant: number
          montant_ht: number | null
          motif_differe: string | null
          net_a_payer: number | null
          numero: string
          regime_fiscal: string | null
          retenue_source_montant: number | null
          retenue_source_taux: number | null
          service_fait: boolean | null
          service_fait_certifie_par: string | null
          service_fait_date: string | null
          statut: string | null
          tva_montant: number | null
          tva_taux: number | null
        }
        Insert: {
          airsi_montant?: number | null
          airsi_taux?: number | null
          created_at?: string
          created_by?: string | null
          date_differe?: string | null
          date_liquidation?: string
          deadline_correction?: string | null
          differe_by?: string | null
          engagement_id: string
          exercice?: number | null
          id?: string
          legacy_import?: boolean | null
          montant: number
          montant_ht?: number | null
          motif_differe?: string | null
          net_a_payer?: number | null
          numero: string
          regime_fiscal?: string | null
          retenue_source_montant?: number | null
          retenue_source_taux?: number | null
          service_fait?: boolean | null
          service_fait_certifie_par?: string | null
          service_fait_date?: string | null
          statut?: string | null
          tva_montant?: number | null
          tva_taux?: number | null
        }
        Update: {
          airsi_montant?: number | null
          airsi_taux?: number | null
          created_at?: string
          created_by?: string | null
          date_differe?: string | null
          date_liquidation?: string
          deadline_correction?: string | null
          differe_by?: string | null
          engagement_id?: string
          exercice?: number | null
          id?: string
          legacy_import?: boolean | null
          montant?: number
          montant_ht?: number | null
          motif_differe?: string | null
          net_a_payer?: number | null
          numero?: string
          regime_fiscal?: string | null
          retenue_source_montant?: number | null
          retenue_source_taux?: number | null
          service_fait?: boolean | null
          service_fait_certifie_par?: string | null
          service_fait_date?: string | null
          statut?: string | null
          tva_montant?: number | null
          tva_taux?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_liquidations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_liquidations_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "budget_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_liquidations_service_fait_certifie_par_fkey"
            columns: ["service_fait_certifie_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transfers: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          exercice: number | null
          from_budget_line_id: string
          id: string
          motif: string
          rejection_reason: string | null
          requested_at: string
          requested_by: string | null
          status: string | null
          to_budget_line_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          exercice?: number | null
          from_budget_line_id: string
          id?: string
          motif: string
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string | null
          to_budget_line_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          exercice?: number | null
          from_budget_line_id?: string
          id?: string
          motif?: string
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string | null
          to_budget_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transfers_from_budget_line_id_fkey"
            columns: ["from_budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transfers_to_budget_line_id_fkey"
            columns: ["to_budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      delegations: {
        Row: {
          created_at: string
          created_by: string | null
          date_debut: string
          date_fin: string
          delegataire_id: string
          delegateur_id: string
          est_active: boolean | null
          id: string
          motif: string | null
          perimetre: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_debut: string
          date_fin: string
          delegataire_id: string
          delegateur_id: string
          est_active?: boolean | null
          id?: string
          motif?: string | null
          perimetre?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_debut?: string
          date_fin?: string
          delegataire_id?: string
          delegateur_id?: string
          est_active?: boolean | null
          id?: string
          motif?: string | null
          perimetre?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegataire_id_fkey"
            columns: ["delegataire_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delegations_delegateur_id_fkey"
            columns: ["delegateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directions: {
        Row: {
          code: string
          created_at: string
          entity_type: string | null
          est_active: boolean | null
          group_email: string | null
          id: string
          label: string
          parent_id: string | null
          position: number | null
          responsible_user_id: string | null
          sigle: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          entity_type?: string | null
          est_active?: boolean | null
          group_email?: string | null
          id?: string
          label: string
          parent_id?: string | null
          position?: number | null
          responsible_user_id?: string | null
          sigle?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          entity_type?: string | null
          est_active?: boolean | null
          group_email?: string | null
          id?: string
          label?: string
          parent_id?: string | null
          position?: number | null
          responsible_user_id?: string | null
          sigle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directions_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflow_rules: {
        Row: {
          created_at: string | null
          document_type_id: string
          id: string
          is_required: boolean | null
          module_code: string
          must_be_validated: boolean | null
          step_order: number | null
          updated_at: string | null
          validation_roles: string[] | null
          workflow_step_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type_id: string
          id?: string
          is_required?: boolean | null
          module_code: string
          must_be_validated?: boolean | null
          step_order?: number | null
          updated_at?: string | null
          validation_roles?: string[] | null
          workflow_step_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type_id?: string
          id?: string
          is_required?: boolean | null
          module_code?: string
          must_be_validated?: boolean | null
          step_order?: number | null
          updated_at?: string | null
          validation_roles?: string[] | null
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_workflow_rules_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "required_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_workflow_rules_workflow_step_id_fkey"
            columns: ["workflow_step_id"]
            isOneToOne: false
            referencedRelation: "validation_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_documents: {
        Row: {
          categorie: string | null
          created_at: string
          dossier_id: string
          etape_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          type_document: string
          uploaded_by: string | null
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          dossier_id: string
          etape_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          type_document: string
          uploaded_by?: string | null
        }
        Update: {
          categorie?: string | null
          created_at?: string
          dossier_id?: string
          etape_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          type_document?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossier_documents_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_documents_etape_id_fkey"
            columns: ["etape_id"]
            isOneToOne: false
            referencedRelation: "dossier_etapes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_etapes: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string | null
          dossier_id: string
          entity_id: string | null
          id: string
          montant: number | null
          statut: string | null
          type_etape: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          dossier_id: string
          entity_id?: string | null
          id?: string
          montant?: number | null
          statut?: string | null
          type_etape: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          dossier_id?: string
          entity_id?: string | null
          id?: string
          montant?: number | null
          statut?: string | null
          type_etape?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_etapes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_etapes_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_sequences: {
        Row: {
          annee: number
          dernier_numero: number
          id: string
          mois: number
          updated_at: string
        }
        Insert: {
          annee: number
          dernier_numero?: number
          id?: string
          mois: number
          updated_at?: string
        }
        Update: {
          annee?: number
          dernier_numero?: number
          id?: string
          mois?: number
          updated_at?: string
        }
        Relationships: []
      }
      dossiers: {
        Row: {
          created_at: string
          created_by: string | null
          demandeur_id: string | null
          direction_id: string | null
          etape_courante: string | null
          exercice: number
          id: string
          montant_engage: number | null
          montant_estime: number | null
          montant_liquide: number | null
          montant_ordonnance: number | null
          numero: string
          objet: string
          statut_global: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          demandeur_id?: string | null
          direction_id?: string | null
          etape_courante?: string | null
          exercice?: number
          id?: string
          montant_engage?: number | null
          montant_estime?: number | null
          montant_liquide?: number | null
          montant_ordonnance?: number | null
          numero: string
          objet: string
          statut_global?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          demandeur_id?: string | null
          direction_id?: string | null
          etape_courante?: string | null
          exercice?: number
          id?: string
          montant_engage?: number | null
          montant_estime?: number | null
          montant_liquide?: number | null
          montant_ordonnance?: number | null
          numero?: string
          objet?: string
          statut_global?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossiers_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_html: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      engagement_attachments: {
        Row: {
          created_at: string
          document_type: string
          engagement_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_required: boolean | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          engagement_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_required?: boolean | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          engagement_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_required?: boolean | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_attachments_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "budget_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_validations: {
        Row: {
          comments: string | null
          created_at: string
          engagement_id: string
          id: string
          ip_address: string | null
          role: string
          status: string | null
          step_order: number
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          engagement_id: string
          id?: string
          ip_address?: string | null
          role: string
          status?: string | null
          step_order: number
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          engagement_id?: string
          id?: string
          ip_address?: string | null
          role?: string
          status?: string | null
          step_order?: number
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_validations_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "budget_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_validations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercices_budgetaires: {
        Row: {
          annee: number
          created_at: string
          date_cloture: string | null
          date_ouverture: string | null
          est_actif: boolean
          id: string
          statut: string
          updated_at: string
        }
        Insert: {
          annee: number
          created_at?: string
          date_cloture?: string | null
          date_ouverture?: string | null
          est_actif?: boolean
          id?: string
          statut?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          created_at?: string
          date_cloture?: string | null
          date_ouverture?: string | null
          est_actif?: boolean
          id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: []
      }
      expressions_besoin: {
        Row: {
          created_at: string
          created_by: string | null
          date_differe: string | null
          deadline_correction: string | null
          description: string | null
          differe_by: string | null
          direction_id: string | null
          id: string
          justification: string | null
          montant_estime: number | null
          motif_differe: string | null
          numero: string | null
          objet: string
          quantite: number | null
          rejection_reason: string | null
          statut: string | null
          submitted_at: string | null
          unite: string | null
          updated_at: string
          urgence: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_differe?: string | null
          deadline_correction?: string | null
          description?: string | null
          differe_by?: string | null
          direction_id?: string | null
          id?: string
          justification?: string | null
          montant_estime?: number | null
          motif_differe?: string | null
          numero?: string | null
          objet: string
          quantite?: number | null
          rejection_reason?: string | null
          statut?: string | null
          submitted_at?: string | null
          unite?: string | null
          updated_at?: string
          urgence?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_differe?: string | null
          deadline_correction?: string | null
          description?: string | null
          differe_by?: string | null
          direction_id?: string | null
          id?: string
          justification?: string | null
          montant_estime?: number | null
          motif_differe?: string | null
          numero?: string | null
          objet?: string
          quantite?: number | null
          rejection_reason?: string | null
          statut?: string | null
          submitted_at?: string | null
          unite?: string | null
          updated_at?: string
          urgence?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expressions_besoin_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expressions_besoin_differe_by_fkey"
            columns: ["differe_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expressions_besoin_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expressions_besoin_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_history: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_details: Json | null
          error_rows: number
          file_name: string
          id: string
          import_type: string
          imported_data: Json | null
          rollback_data: Json | null
          rolled_back_at: string | null
          status: string
          success_rows: number
          total_rows: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          error_rows?: number
          file_name: string
          id?: string
          import_type: string
          imported_data?: Json | null
          rollback_data?: Json | null
          rolled_back_at?: string | null
          status?: string
          success_rows?: number
          total_rows?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_details?: Json | null
          error_rows?: number
          file_name?: string
          id?: string
          import_type?: string
          imported_data?: Json | null
          rollback_data?: Json | null
          rolled_back_at?: string | null
          status?: string
          success_rows?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidation_attachments: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          liquidation_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          liquidation_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          liquidation_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liquidation_attachments_liquidation_id_fkey"
            columns: ["liquidation_id"]
            isOneToOne: false
            referencedRelation: "budget_liquidations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liquidation_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_attachments: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_required: boolean | null
          marche_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_required?: boolean | null
          marche_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_required?: boolean | null
          marche_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marche_attachments_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marche_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marche_sequences: {
        Row: {
          annee: number
          dernier_numero: number
          id: string
          updated_at: string
        }
        Insert: {
          annee: number
          dernier_numero?: number
          id?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          dernier_numero?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      marche_validations: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          ip_address: string | null
          marche_id: string
          role: string
          status: string | null
          step_order: number
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          marche_id: string
          role: string
          status?: string | null
          step_order: number
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          marche_id?: string
          role?: string
          status?: string | null
          step_order?: number
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marche_validations_marche_id_fkey"
            columns: ["marche_id"]
            isOneToOne: false
            referencedRelation: "marches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marche_validations_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marches: {
        Row: {
          autorisation_path: string | null
          created_at: string
          created_by: string | null
          date_attribution: string | null
          date_lancement: string | null
          date_signature: string | null
          expression_besoin_id: string | null
          id: string
          justification_derogation: string | null
          legacy_import: boolean | null
          mode_force: boolean | null
          mode_passation: string
          montant: number
          note_id: string | null
          numero: string | null
          objet: string
          prestataire_id: string | null
          statut: string | null
          updated_at: string
        }
        Insert: {
          autorisation_path?: string | null
          created_at?: string
          created_by?: string | null
          date_attribution?: string | null
          date_lancement?: string | null
          date_signature?: string | null
          expression_besoin_id?: string | null
          id?: string
          justification_derogation?: string | null
          legacy_import?: boolean | null
          mode_force?: boolean | null
          mode_passation: string
          montant: number
          note_id?: string | null
          numero?: string | null
          objet: string
          prestataire_id?: string | null
          statut?: string | null
          updated_at?: string
        }
        Update: {
          autorisation_path?: string | null
          created_at?: string
          created_by?: string | null
          date_attribution?: string | null
          date_lancement?: string | null
          date_signature?: string | null
          expression_besoin_id?: string | null
          id?: string
          justification_derogation?: string | null
          legacy_import?: boolean | null
          mode_force?: boolean | null
          mode_passation?: string
          montant?: number
          note_id?: string | null
          numero?: string | null
          objet?: string
          prestataire_id?: string | null
          statut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marches_expression_besoin_id_fkey"
            columns: ["expression_besoin_id"]
            isOneToOne: false
            referencedRelation: "expressions_besoin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marches_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_dg"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marches_prestataire_id_fkey"
            columns: ["prestataire_id"]
            isOneToOne: false
            referencedRelation: "prestataires"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_staging: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          id: number
          imported_at: string | null
          imported_entity_id: string | null
          mapped_data: Json | null
          raw_data: Json
          row_number: number | null
          source_file: string
          status: Database["public"]["Enums"]["migration_staging_status"]
          target_table: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: number
          imported_at?: string | null
          imported_entity_id?: string | null
          mapped_data?: Json | null
          raw_data?: Json
          row_number?: number | null
          source_file: string
          status?: Database["public"]["Enums"]["migration_staging_status"]
          target_table?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: number
          imported_at?: string | null
          imported_entity_id?: string | null
          mapped_data?: Json | null
          raw_data?: Json
          row_number?: number | null
          source_file?: string
          status?: Database["public"]["Enums"]["migration_staging_status"]
          target_table?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          code: string
          created_at: string | null
          est_active: boolean | null
          id: string
          libelle: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nomenclature_nbe: {
        Row: {
          code: string
          created_at: string | null
          est_active: boolean | null
          id: string
          libelle: string
          niveau: string | null
          parent_code: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle: string
          niveau?: string | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle?: string
          niveau?: string | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      note_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          note_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          note_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          note_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_dg"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_dg: {
        Row: {
          budget_line_id: string | null
          contenu: string | null
          created_at: string
          created_by: string | null
          date_differe: string | null
          deadline_correction: string | null
          differe_by: string | null
          direction_id: string | null
          exercice: number | null
          id: string
          imputed_at: string | null
          imputed_by: string | null
          legacy_import: boolean | null
          montant_estime: number | null
          motif_differe: string | null
          numero: string | null
          objet: string
          priorite: string | null
          rejection_reason: string | null
          statut: string | null
          submitted_at: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          budget_line_id?: string | null
          contenu?: string | null
          created_at?: string
          created_by?: string | null
          date_differe?: string | null
          deadline_correction?: string | null
          differe_by?: string | null
          direction_id?: string | null
          exercice?: number | null
          id?: string
          imputed_at?: string | null
          imputed_by?: string | null
          legacy_import?: boolean | null
          montant_estime?: number | null
          motif_differe?: string | null
          numero?: string | null
          objet: string
          priorite?: string | null
          rejection_reason?: string | null
          statut?: string | null
          submitted_at?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          budget_line_id?: string | null
          contenu?: string | null
          created_at?: string
          created_by?: string | null
          date_differe?: string | null
          deadline_correction?: string | null
          differe_by?: string | null
          direction_id?: string | null
          exercice?: number | null
          id?: string
          imputed_at?: string | null
          imputed_by?: string | null
          legacy_import?: boolean | null
          montant_estime?: number | null
          motif_differe?: string | null
          numero?: string | null
          objet?: string
          priorite?: string | null
          rejection_reason?: string | null
          statut?: string | null
          submitted_at?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_dg_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_dg_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_dg_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_dg_imputed_by_fkey"
            columns: ["imputed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_dg_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_sef: {
        Row: {
          commentaire: string | null
          created_at: string
          created_by: string | null
          demandeur_id: string | null
          description: string | null
          differe_at: string | null
          differe_by: string | null
          differe_condition: string | null
          differe_date_reprise: string | null
          differe_motif: string | null
          direction_id: string | null
          exercice: number
          id: string
          numero: string | null
          objet: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          statut: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
          urgence: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          demandeur_id?: string | null
          description?: string | null
          differe_at?: string | null
          differe_by?: string | null
          differe_condition?: string | null
          differe_date_reprise?: string | null
          differe_motif?: string | null
          direction_id?: string | null
          exercice?: number
          id?: string
          numero?: string | null
          objet: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          statut?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          urgence?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          demandeur_id?: string | null
          description?: string | null
          differe_at?: string | null
          differe_by?: string | null
          differe_condition?: string | null
          differe_date_reprise?: string | null
          differe_motif?: string | null
          direction_id?: string | null
          exercice?: number
          id?: string
          numero?: string | null
          objet?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          statut?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
          urgence?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_sef_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_differe_by_fkey"
            columns: ["differe_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_sef_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          note_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          note_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          note_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_sef_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_sef"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_sef_history: {
        Row: {
          action: string
          commentaire: string | null
          id: string
          ip_address: string | null
          new_statut: string | null
          note_id: string
          old_statut: string | null
          performed_at: string
          performed_by: string | null
        }
        Insert: {
          action: string
          commentaire?: string | null
          id?: string
          ip_address?: string | null
          new_statut?: string | null
          note_id: string
          old_statut?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          commentaire?: string | null
          id?: string
          ip_address?: string | null
          new_statut?: string | null
          note_id?: string
          old_statut?: string | null
          performed_at?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_sef_history_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_sef"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sef_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_sef_sequences: {
        Row: {
          annee: number
          dernier_numero: number
          id: string
          updated_at: string
        }
        Insert: {
          annee: number
          dernier_numero?: number
          id?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          dernier_numero?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_daily_summary: boolean | null
          email_enabled: boolean | null
          email_summary_time: string | null
          id: string
          in_app_enabled: boolean | null
          notify_budget_alert: boolean | null
          notify_deadline: boolean | null
          notify_new_validation: boolean | null
          notify_rejection: boolean | null
          notify_workflow_update: boolean | null
          phone_number: string | null
          sms_enabled: boolean | null
          sms_urgent_only: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_daily_summary?: boolean | null
          email_enabled?: boolean | null
          email_summary_time?: string | null
          id?: string
          in_app_enabled?: boolean | null
          notify_budget_alert?: boolean | null
          notify_deadline?: boolean | null
          notify_new_validation?: boolean | null
          notify_rejection?: boolean | null
          notify_workflow_update?: boolean | null
          phone_number?: string | null
          sms_enabled?: boolean | null
          sms_urgent_only?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_daily_summary?: boolean | null
          email_enabled?: boolean | null
          email_summary_time?: string | null
          id?: string
          in_app_enabled?: boolean | null
          notify_budget_alert?: boolean | null
          notify_deadline?: boolean | null
          notify_new_validation?: boolean | null
          notify_rejection?: boolean | null
          notify_workflow_update?: boolean | null
          phone_number?: string | null
          sms_enabled?: boolean | null
          sms_urgent_only?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_role_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          notification_type: string
          role_code: string
          sms_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_type: string
          role_code: string
          sms_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          notification_type?: string
          role_code?: string
          sms_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          is_urgent: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      objectifs_strategiques: {
        Row: {
          annee_debut: number
          annee_fin: number
          code: string
          created_at: string | null
          description: string | null
          est_actif: boolean | null
          id: string
          libelle: string
          updated_at: string | null
        }
        Insert: {
          annee_debut: number
          annee_fin: number
          code: string
          created_at?: string | null
          description?: string | null
          est_actif?: boolean | null
          id?: string
          libelle: string
          updated_at?: string | null
        }
        Update: {
          annee_debut?: number
          annee_fin?: number
          code?: string
          created_at?: string | null
          description?: string | null
          est_actif?: boolean | null
          id?: string
          libelle?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ordonnancements: {
        Row: {
          banque: string | null
          beneficiaire: string
          created_at: string
          created_by: string | null
          exercice: number | null
          id: string
          legacy_import: boolean | null
          liquidation_id: string
          mode_paiement: string | null
          montant: number
          motif_differe: string | null
          numero: string | null
          objet: string
          pdf_path: string | null
          reference_tresor: string | null
          rejection_reason: string | null
          requires_dg_signature: boolean | null
          rib: string | null
          signed_daaf_at: string | null
          signed_daaf_by: string | null
          signed_dg_at: string | null
          signed_dg_by: string | null
          statut: string | null
          transmitted_at: string | null
          transmitted_by: string | null
          updated_at: string
        }
        Insert: {
          banque?: string | null
          beneficiaire: string
          created_at?: string
          created_by?: string | null
          exercice?: number | null
          id?: string
          legacy_import?: boolean | null
          liquidation_id: string
          mode_paiement?: string | null
          montant: number
          motif_differe?: string | null
          numero?: string | null
          objet: string
          pdf_path?: string | null
          reference_tresor?: string | null
          rejection_reason?: string | null
          requires_dg_signature?: boolean | null
          rib?: string | null
          signed_daaf_at?: string | null
          signed_daaf_by?: string | null
          signed_dg_at?: string | null
          signed_dg_by?: string | null
          statut?: string | null
          transmitted_at?: string | null
          transmitted_by?: string | null
          updated_at?: string
        }
        Update: {
          banque?: string | null
          beneficiaire?: string
          created_at?: string
          created_by?: string | null
          exercice?: number | null
          id?: string
          legacy_import?: boolean | null
          liquidation_id?: string
          mode_paiement?: string | null
          montant?: number
          motif_differe?: string | null
          numero?: string | null
          objet?: string
          pdf_path?: string | null
          reference_tresor?: string | null
          rejection_reason?: string | null
          requires_dg_signature?: boolean | null
          rib?: string | null
          signed_daaf_at?: string | null
          signed_daaf_by?: string | null
          signed_dg_at?: string | null
          signed_dg_by?: string | null
          statut?: string | null
          transmitted_at?: string | null
          transmitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordonnancements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnancements_liquidation_id_fkey"
            columns: ["liquidation_id"]
            isOneToOne: false
            referencedRelation: "budget_liquidations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnancements_signed_daaf_by_fkey"
            columns: ["signed_daaf_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnancements_signed_dg_by_fkey"
            columns: ["signed_dg_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordonnancements_transmitted_by_fkey"
            columns: ["transmitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_actions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          label: string
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
        }
        Relationships: []
      }
      plan_comptable_sysco: {
        Row: {
          classe: string | null
          code: string
          created_at: string | null
          est_active: boolean | null
          id: string
          libelle: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          classe?: string | null
          code: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          classe?: string | null
          code?: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          direction_id: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean | null
          is_entity_chief: boolean | null
          label: string
          role_code: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          direction_id?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          is_entity_chief?: boolean | null
          label: string
          role_code?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          direction_id?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          is_entity_chief?: boolean | null
          label?: string
          role_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      prestataires: {
        Row: {
          adresse: string | null
          code: string
          created_at: string
          date_expiration_fiscale: string | null
          documents_fiscaux: Json | null
          email: string | null
          id: string
          ninea: string | null
          raison_sociale: string
          secteur_activite: string | null
          statut: string | null
          statut_fiscal: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          code: string
          created_at?: string
          date_expiration_fiscale?: string | null
          documents_fiscaux?: Json | null
          email?: string | null
          id?: string
          ninea?: string | null
          raison_sociale: string
          secteur_activite?: string | null
          statut?: string | null
          statut_fiscal?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          code?: string
          created_at?: string
          date_expiration_fiscale?: string | null
          documents_fiscaux?: Json | null
          email?: string | null
          id?: string
          ninea?: string | null
          raison_sociale?: string
          secteur_activite?: string | null
          statut?: string | null
          statut_fiscal?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          direction_id: string | null
          email: string
          exercice_actif: number | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          matricule: string | null
          poste: string | null
          profil_fonctionnel:
            | Database["public"]["Enums"]["profil_fonctionnel"]
            | null
          role_hierarchique:
            | Database["public"]["Enums"]["role_hierarchique"]
            | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          direction_id?: string | null
          email: string
          exercice_actif?: number | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          matricule?: string | null
          poste?: string | null
          profil_fonctionnel?:
            | Database["public"]["Enums"]["profil_fonctionnel"]
            | null
          role_hierarchique?:
            | Database["public"]["Enums"]["role_hierarchique"]
            | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          direction_id?: string | null
          email?: string
          exercice_actif?: number | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          matricule?: string | null
          poste?: string | null
          profil_fonctionnel?:
            | Database["public"]["Enums"]["profil_fonctionnel"]
            | null
          role_hierarchique?:
            | Database["public"]["Enums"]["role_hierarchique"]
            | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_progress_updates: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          new_percent: number
          photo_path: string | null
          previous_percent: number
          project_id: string
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          new_percent: number
          photo_path?: string | null
          previous_percent: number
          project_id: string
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          new_percent?: number
          photo_path?: string | null
          previous_percent?: number
          project_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_progress_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects_with_financial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_progress_updates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_total: number
          created_at: string
          description: string | null
          direction_id: string | null
          end_date: string | null
          exercice: number
          financial_percent: number | null
          id: string
          name: string
          owner_id: string | null
          physical_percent: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_total?: number
          created_at?: string
          description?: string | null
          direction_id?: string | null
          end_date?: string | null
          exercice?: number
          financial_percent?: number | null
          id?: string
          name: string
          owner_id?: string | null
          physical_percent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_total?: number
          created_at?: string
          description?: string | null
          direction_id?: string | null
          end_date?: string | null
          exercice?: number
          financial_percent?: number | null
          id?: string
          name?: string
          owner_id?: string | null
          physical_percent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_history: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          rule_id: string | null
          sent_at: string
          sent_to: Json
          status: string | null
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          rule_id?: string | null
          sent_at?: string
          sent_to: Json
          status?: string | null
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          rule_id?: string | null
          sent_at?: string
          sent_to?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "reminder_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          delay_hours: number
          description: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          name: string
          recipients: Json
          trigger_role: string | null
          trigger_status: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          delay_hours?: number
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          name: string
          recipients?: Json
          trigger_role?: string | null
          trigger_status: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          delay_hours?: number
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          recipients?: Json
          trigger_role?: string | null
          trigger_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      required_document_types: {
        Row: {
          allowed_file_types: string[] | null
          allowed_uploaders: string[] | null
          category: string | null
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          label: string
          max_file_size_mb: number | null
          module_code: string
          updated_at: string
        }
        Insert: {
          allowed_file_types?: string[] | null
          allowed_uploaders?: string[] | null
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          label: string
          max_file_size_mb?: number | null
          module_code: string
          updated_at?: string
        }
        Update: {
          allowed_file_types?: string[] | null
          allowed_uploaders?: string[] | null
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          label?: string
          max_file_size_mb?: number | null
          module_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          action_code: string
          created_at: string
          granted_by: string | null
          id: string
          is_granted: boolean | null
          role_code: string
          updated_at: string
        }
        Insert: {
          action_code: string
          created_at?: string
          granted_by?: string | null
          id?: string
          is_granted?: boolean | null
          role_code: string
          updated_at?: string
        }
        Update: {
          action_code?: string
          created_at?: string
          granted_by?: string | null
          id?: string
          is_granted?: boolean | null
          role_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      sous_activites: {
        Row: {
          activite_id: string
          code: string
          created_at: string | null
          est_active: boolean | null
          id: string
          libelle: string
          updated_at: string | null
        }
        Insert: {
          activite_id: string
          code: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle: string
          updated_at?: string | null
        }
        Update: {
          activite_id?: string
          code?: string
          created_at?: string | null
          est_active?: boolean | null
          id?: string
          libelle?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sous_activites_activite_id_fkey"
            columns: ["activite_id"]
            isOneToOne: false
            referencedRelation: "activites"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tache_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          tache_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          tache_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          tache_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tache_attachments_tache_id_fkey"
            columns: ["tache_id"]
            isOneToOne: false
            referencedRelation: "taches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tache_progress_history: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          new_avancement: number
          previous_avancement: number
          tache_id: string
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          new_avancement: number
          previous_avancement: number
          tache_id: string
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          new_avancement?: number
          previous_avancement?: number
          tache_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tache_progress_history_tache_id_fkey"
            columns: ["tache_id"]
            isOneToOne: false
            referencedRelation: "taches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_progress_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      taches: {
        Row: {
          avancement: number | null
          budget_line_id: string | null
          budget_prevu: number | null
          code: string
          created_at: string | null
          date_debut: string | null
          date_fin: string | null
          date_fin_reelle: string | null
          description: string | null
          duree_prevue: number | null
          est_active: boolean | null
          exercice: number | null
          id: string
          libelle: string
          livrables: string[] | null
          priorite: string | null
          raci_accountable: string | null
          raci_consulted: string[] | null
          raci_informed: string[] | null
          raci_responsable: string | null
          responsable_id: string | null
          sous_activite_id: string
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          avancement?: number | null
          budget_line_id?: string | null
          budget_prevu?: number | null
          code: string
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          date_fin_reelle?: string | null
          description?: string | null
          duree_prevue?: number | null
          est_active?: boolean | null
          exercice?: number | null
          id?: string
          libelle: string
          livrables?: string[] | null
          priorite?: string | null
          raci_accountable?: string | null
          raci_consulted?: string[] | null
          raci_informed?: string[] | null
          raci_responsable?: string | null
          responsable_id?: string | null
          sous_activite_id: string
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          avancement?: number | null
          budget_line_id?: string | null
          budget_prevu?: number | null
          code?: string
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          date_fin_reelle?: string | null
          description?: string | null
          duree_prevue?: number | null
          est_active?: boolean | null
          exercice?: number | null
          id?: string
          libelle?: string
          livrables?: string[] | null
          priorite?: string | null
          raci_accountable?: string | null
          raci_consulted?: string[] | null
          raci_informed?: string[] | null
          raci_responsable?: string | null
          responsable_id?: string | null
          sous_activite_id?: string
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taches_budget_line_id_fkey"
            columns: ["budget_line_id"]
            isOneToOne: false
            referencedRelation: "budget_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_raci_accountable_fkey"
            columns: ["raci_accountable"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_raci_responsable_fkey"
            columns: ["raci_responsable"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_sous_activite_id_fkey"
            columns: ["sous_activite_id"]
            isOneToOne: false
            referencedRelation: "sous_activites"
            referencedColumns: ["id"]
          },
        ]
      }
      treasury_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          label: string
          solde_actuel: number
          solde_initial: number
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          label: string
          solde_actuel?: number
          solde_initial?: number
          type?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          label?: string
          solde_actuel?: number
          solde_initial?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      treasury_movements: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          date_operation: string
          id: string
          libelle: string
          mode_paiement: string | null
          montant: number
          ordonnancement_id: string | null
          reference: string | null
          solde_apres: number
          solde_avant: number
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          date_operation?: string
          id?: string
          libelle: string
          mode_paiement?: string | null
          montant: number
          ordonnancement_id?: string | null
          reference?: string | null
          solde_apres: number
          solde_avant: number
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          date_operation?: string
          id?: string
          libelle?: string
          mode_paiement?: string | null
          montant?: number
          ordonnancement_id?: string | null
          reference?: string | null
          solde_apres?: number
          solde_avant?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treasury_movements_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "treasury_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treasury_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treasury_movements_ordonnancement_id_fkey"
            columns: ["ordonnancement_id"]
            isOneToOne: false
            referencedRelation: "ordonnancements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_positions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          position_id: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          position_id: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          position_id?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_hierarchy: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_optional: boolean | null
          label: string | null
          max_amount: number | null
          min_amount: number | null
          module_id: string
          relative_type: string | null
          required_documents: string[] | null
          required_fields: Json | null
          role: string
          step_order: number
          updated_at: string
          validator_id: string | null
          validator_type: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_optional?: boolean | null
          label?: string | null
          max_amount?: number | null
          min_amount?: number | null
          module_id: string
          relative_type?: string | null
          required_documents?: string[] | null
          required_fields?: Json | null
          role: string
          step_order: number
          updated_at?: string
          validator_id?: string | null
          validator_type?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_optional?: boolean | null
          label?: string | null
          max_amount?: number | null
          min_amount?: number | null
          module_id?: string
          relative_type?: string | null
          required_documents?: string[] | null
          required_fields?: Json | null
          role?: string
          step_order?: number
          updated_at?: string
          validator_id?: string | null
          validator_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_hierarchy_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "workflow_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_modules: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      documents_index: {
        Row: {
          annee: number | null
          created_at: string | null
          entity_id: string | null
          entity_numero: string | null
          entity_objet: string | null
          entity_type: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          fournisseur: string | null
          id: string | null
          montant: number | null
          type_document: string | null
        }
        Relationships: []
      }
      projects_with_financial: {
        Row: {
          budget_total: number | null
          created_at: string | null
          description: string | null
          direction_id: string | null
          direction_label: string | null
          end_date: string | null
          exercice: number | null
          financial_percent: number | null
          id: string | null
          name: string | null
          owner_id: string | null
          owner_name: string | null
          physical_percent: number | null
          start_date: string | null
          status: string | null
          total_paid: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_direction_id_fkey"
            columns: ["direction_id"]
            isOneToOne: false
            referencedRelation: "directions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_active_delegation: {
        Args: { p_delegataire_id: string; p_perimetre?: string }
        Returns: {
          delegateur_id: string
          delegateur_name: string
        }[]
      }
      has_permission: {
        Args: { _action_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_expression_besoin_validated: {
        Args: { eb_id: string }
        Returns: boolean
      }
      log_audit_with_exercice: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_exercice?: number
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: string
      }
      user_has_any_role: {
        Args: { p_roles: string[]; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "ADMIN"
        | "DG"
        | "DAAF"
        | "DGPEC"
        | "SDMG"
        | "CB"
        | "OPERATEUR"
        | "TRESORIER"
        | "INVITE"
      migration_staging_status: "PENDING" | "READY" | "IMPORTED" | "ERROR"
      profil_fonctionnel:
        | "Admin"
        | "Validateur"
        | "Operationnel"
        | "Controleur"
        | "Auditeur"
      role_hierarchique:
        | "Agent"
        | "Chef de Service"
        | "Sous-Directeur"
        | "Directeur"
        | "DG"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "ADMIN",
        "DG",
        "DAAF",
        "DGPEC",
        "SDMG",
        "CB",
        "OPERATEUR",
        "TRESORIER",
        "INVITE",
      ],
      migration_staging_status: ["PENDING", "READY", "IMPORTED", "ERROR"],
      profil_fonctionnel: [
        "Admin",
        "Validateur",
        "Operationnel",
        "Controleur",
        "Auditeur",
      ],
      role_hierarchique: [
        "Agent",
        "Chef de Service",
        "Sous-Directeur",
        "Directeur",
        "DG",
      ],
    },
  },
} as const
