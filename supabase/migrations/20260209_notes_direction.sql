-- Table notes_direction
CREATE TABLE IF NOT EXISTS notes_direction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id UUID NOT NULL REFERENCES directions(id) ON DELETE CASCADE,
  exercice_id UUID REFERENCES exercices_budgetaires(id),
  titre TEXT NOT NULL,
  contenu TEXT, -- HTML rich text
  contenu_brut TEXT, -- plain text for search
  type_note TEXT NOT NULL DEFAULT 'interne' CHECK (type_note IN ('interne', 'compte_rendu', 'rapport', 'memo', 'autre')),
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publie', 'archive')),
  tags TEXT[],
  fichier_original_url TEXT,
  fichier_original_nom TEXT,
  priorite TEXT NOT NULL DEFAULT 'normale' CHECK (priorite IN ('normale', 'haute', 'urgente')),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notes_direction_direction ON notes_direction(direction_id);
CREATE INDEX idx_notes_direction_exercice ON notes_direction(exercice_id);
CREATE INDEX idx_notes_direction_statut ON notes_direction(statut);
CREATE INDEX idx_notes_direction_type ON notes_direction(type_note);
CREATE INDEX idx_notes_direction_created ON notes_direction(created_at DESC);
CREATE INDEX idx_notes_direction_search ON notes_direction USING gin(to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(contenu_brut, '')));

-- RLS
ALTER TABLE notes_direction ENABLE ROW LEVEL SECURITY;

-- Read: own direction members OR admin/DG
CREATE POLICY "notes_direction_select" ON notes_direction FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      p.direction_id = notes_direction.direction_id
      OR p.profil_fonctionnel = 'Admin'::profil_fonctionnel
      OR p.role_hierarchique = 'DG'::role_hierarchique
    )
  )
);

-- Insert: own direction members or admin
CREATE POLICY "notes_direction_insert" ON notes_direction FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      p.direction_id = notes_direction.direction_id
      OR p.profil_fonctionnel = 'Admin'::profil_fonctionnel
    )
  )
);

-- Update: creator or admin
CREATE POLICY "notes_direction_update" ON notes_direction FOR UPDATE USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.profil_fonctionnel = 'Admin'::profil_fonctionnel
  )
);

-- Delete: admin only
CREATE POLICY "notes_direction_delete" ON notes_direction FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.profil_fonctionnel = 'Admin'::profil_fonctionnel
  )
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_notes_direction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notes_direction_updated_at
  BEFORE UPDATE ON notes_direction
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_direction_updated_at();
