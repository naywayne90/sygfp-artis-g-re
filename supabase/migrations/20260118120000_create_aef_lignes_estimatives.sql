-- =====================================================
-- Migration: Création table lignes_estimatives_aef
-- Date: 2026-01-18
-- Description: Lignes estimatives pour les Notes AEF
-- Chaque AEF peut avoir plusieurs lignes (catégorie, description, montant)
-- =====================================================

-- Table des lignes estimatives AEF
CREATE TABLE IF NOT EXISTS public.lignes_estimatives_aef (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lien vers la note AEF (table notes_dg)
  note_aef_id uuid NOT NULL REFERENCES public.notes_dg(id) ON DELETE CASCADE,

  -- Catégorie de la ligne
  categorie text NOT NULL CHECK (categorie IN (
    'fournitures',
    'equipement',
    'services',
    'travaux',
    'honoraires',
    'transport',
    'hebergement',
    'restauration',
    'communication',
    'formation',
    'autre'
  )),

  -- Description de la ligne
  description text NOT NULL,

  -- Quantité et prix unitaire pour calcul automatique
  quantite integer DEFAULT 1,
  prix_unitaire numeric(15, 2) DEFAULT 0,

  -- Montant total (quantité * prix_unitaire)
  montant numeric(15, 2) NOT NULL DEFAULT 0,

  -- Ordre d'affichage
  ordre integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_lignes_estimatives_aef_note ON public.lignes_estimatives_aef(note_aef_id);

-- RLS
ALTER TABLE public.lignes_estimatives_aef ENABLE ROW LEVEL SECURITY;

-- Policy: Lecture pour tous les authentifiés
CREATE POLICY "Lignes estimatives viewable by authenticated users"
  ON public.lignes_estimatives_aef FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Insertion pour authentifiés (propriétaire de la note ou admin)
CREATE POLICY "Lignes estimatives insertable by note owner"
  ON public.lignes_estimatives_aef FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes_dg n
      WHERE n.id = note_aef_id
      AND (
        n.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('ADMIN', 'DAAF', 'CB')
          AND ur.is_active = true
        )
      )
    )
  );

-- Policy: Mise à jour pour propriétaire ou admin (seulement brouillon)
CREATE POLICY "Lignes estimatives updatable by note owner"
  ON public.lignes_estimatives_aef FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes_dg n
      WHERE n.id = note_aef_id
      AND n.statut = 'brouillon'
      AND (
        n.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('ADMIN', 'DAAF')
          AND ur.is_active = true
        )
      )
    )
  );

-- Policy: Suppression pour propriétaire ou admin (seulement brouillon)
CREATE POLICY "Lignes estimatives deletable by note owner"
  ON public.lignes_estimatives_aef FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notes_dg n
      WHERE n.id = note_aef_id
      AND n.statut = 'brouillon'
      AND (
        n.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_roles ur
          WHERE ur.user_id = auth.uid()
          AND ur.role IN ('ADMIN', 'DAAF')
          AND ur.is_active = true
        )
      )
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_lignes_estimatives_aef_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lignes_estimatives_aef_updated_at
  BEFORE UPDATE ON public.lignes_estimatives_aef
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lignes_estimatives_aef_updated_at();

-- Trigger pour calculer le montant automatiquement
CREATE OR REPLACE FUNCTION public.calculate_ligne_montant()
RETURNS TRIGGER AS $$
BEGIN
  NEW.montant = COALESCE(NEW.quantite, 1) * COALESCE(NEW.prix_unitaire, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_ligne_montant
  BEFORE INSERT OR UPDATE ON public.lignes_estimatives_aef
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ligne_montant();

-- Fonction pour recalculer le montant total de la note AEF
CREATE OR REPLACE FUNCTION public.recalculate_aef_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le montant_estime de la note AEF
  UPDATE notes_dg
  SET montant_estime = (
    SELECT COALESCE(SUM(montant), 0)
    FROM lignes_estimatives_aef
    WHERE note_aef_id = COALESCE(NEW.note_aef_id, OLD.note_aef_id)
  )
  WHERE id = COALESCE(NEW.note_aef_id, OLD.note_aef_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_aef_total
  AFTER INSERT OR UPDATE OR DELETE ON public.lignes_estimatives_aef
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_aef_total();

-- Commentaires
COMMENT ON TABLE public.lignes_estimatives_aef IS 'Lignes estimatives détaillées pour les Notes AEF (catégorie, description, montant)';
COMMENT ON COLUMN public.lignes_estimatives_aef.categorie IS 'Catégorie de dépense (fournitures, équipement, services, etc.)';
COMMENT ON COLUMN public.lignes_estimatives_aef.quantite IS 'Quantité pour calcul automatique du montant';
COMMENT ON COLUMN public.lignes_estimatives_aef.prix_unitaire IS 'Prix unitaire HT pour calcul automatique';
COMMENT ON COLUMN public.lignes_estimatives_aef.montant IS 'Montant total de la ligne (quantité × prix unitaire)';
