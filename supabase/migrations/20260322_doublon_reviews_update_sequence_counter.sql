-- Migration: doublon_reviews table + update_sequence_counter RPC
-- Applied: 22/03/2026
-- Purpose: Complete stub implementations for Gestion Doublons + Compteurs References

-- 1. Table doublon_reviews (persistence des verifications de doublons)
CREATE TABLE IF NOT EXISTS public.doublon_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reference', 'objet', 'montant_date', 'prestataire')),
  action TEXT NOT NULL CHECK (action IN ('verified', 'ignored')),
  exercice INTEGER NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  item_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT doublon_reviews_unique UNIQUE (group_id, exercice)
);

CREATE INDEX IF NOT EXISTS idx_doublon_reviews_exercice ON public.doublon_reviews(exercice);
CREATE INDEX IF NOT EXISTS idx_doublon_reviews_group_id ON public.doublon_reviews(group_id);

ALTER TABLE public.doublon_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_can_manage_doublon_reviews" ON public.doublon_reviews
  FOR ALL USING (true) WITH CHECK (true);

-- 2. RPC update_sequence_counter
CREATE OR REPLACE FUNCTION public.update_sequence_counter(
  p_doc_type TEXT,
  p_exercice INTEGER,
  p_new_number INTEGER,
  p_direction_code TEXT DEFAULT NULL,
  p_scope TEXT DEFAULT 'global'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.sequence_counters
  SET last_number = p_new_number,
      updated_at = now()
  WHERE doc_type = p_doc_type
    AND exercice = p_exercice
    AND scope = p_scope
    AND (
      (p_scope = 'global' AND direction_code IS NULL)
      OR (p_scope = 'direction' AND direction_code = p_direction_code)
    );

  IF NOT FOUND THEN
    INSERT INTO public.sequence_counters (id, exercice, doc_type, scope, direction_code, last_number, created_at, updated_at)
    VALUES (gen_random_uuid(), p_exercice, p_doc_type, p_scope,
      CASE WHEN p_scope = 'direction' THEN p_direction_code ELSE NULL END,
      p_new_number, now(), now());
  END IF;

  RETURN TRUE;
END;
$$;
