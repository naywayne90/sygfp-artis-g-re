-- =====================================================
-- INDEXES DE PERFORMANCE POUR RECHERCHE DOSSIER
-- =====================================================

-- Index sur la référence (recherche par numéro)
CREATE INDEX IF NOT EXISTS idx_dossiers_numero ON dossiers(numero);

-- Index sur le statut global (filtre par statut)
CREATE INDEX IF NOT EXISTS idx_dossiers_statut_global ON dossiers(statut_global);

-- Index sur la direction (filtre par direction)
CREATE INDEX IF NOT EXISTS idx_dossiers_direction_id ON dossiers(direction_id);

-- Index sur created_at (tri chronologique)
CREATE INDEX IF NOT EXISTS idx_dossiers_created_at ON dossiers(created_at DESC);

-- Index sur updated_at (tri par dernière modification)
CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at ON dossiers(updated_at DESC);

-- Index sur exercice (filtre par année)
CREATE INDEX IF NOT EXISTS idx_dossiers_exercice ON dossiers(exercice);

-- Index composite pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_dossiers_exercice_statut ON dossiers(exercice, statut_global);
CREATE INDEX IF NOT EXISTS idx_dossiers_exercice_direction ON dossiers(exercice, direction_id);
CREATE INDEX IF NOT EXISTS idx_dossiers_exercice_etape ON dossiers(exercice, etape_courante);

-- Index sur type_dossier
CREATE INDEX IF NOT EXISTS idx_dossiers_type_dossier ON dossiers(type_dossier);

-- Index sur beneficiaire_id
CREATE INDEX IF NOT EXISTS idx_dossiers_beneficiaire_id ON dossiers(beneficiaire_id);

-- Index sur demandeur_id (mes dossiers)
CREATE INDEX IF NOT EXISTS idx_dossiers_demandeur_id ON dossiers(demandeur_id);

-- Index sur created_by
CREATE INDEX IF NOT EXISTS idx_dossiers_created_by ON dossiers(created_by);

-- Index composite pour pagination optimisée
CREATE INDEX IF NOT EXISTS idx_dossiers_updated_at_id ON dossiers(updated_at DESC, id);

-- Commentaires explicatifs
COMMENT ON INDEX idx_dossiers_numero IS 'Index pour recherche rapide par numéro de dossier';
COMMENT ON INDEX idx_dossiers_statut_global IS 'Index pour filtrage par statut';
COMMENT ON INDEX idx_dossiers_direction_id IS 'Index pour filtrage par direction';
COMMENT ON INDEX idx_dossiers_exercice IS 'Index pour filtrage par exercice budgétaire';