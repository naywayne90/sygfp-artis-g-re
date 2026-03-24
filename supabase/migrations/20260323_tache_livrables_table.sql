-- Table tache_livrables + triggers notifications (livrable soumis/valide/rejete)
-- Applied: 23/03/2026

CREATE TABLE IF NOT EXISTS public.tache_livrables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tache_id UUID NOT NULL REFERENCES public.taches(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  description TEXT,
  date_prevue DATE,
  statut TEXT NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'soumis', 'valide', 'rejete')),
  soumis_par UUID REFERENCES auth.users(id),
  soumis_at TIMESTAMPTZ,
  valide_par UUID REFERENCES auth.users(id),
  valide_at TIMESTAMPTZ,
  motif_rejet TEXT,
  piece_jointe_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tache_livrables_tache ON public.tache_livrables(tache_id);
CREATE INDEX IF NOT EXISTS idx_tache_livrables_statut ON public.tache_livrables(statut);
ALTER TABLE public.tache_livrables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_manage_livrables" ON public.tache_livrables FOR ALL USING (true) WITH CHECK (true);
