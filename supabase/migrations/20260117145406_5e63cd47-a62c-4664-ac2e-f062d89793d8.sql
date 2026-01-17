-- Ajouter le champ reference_pivot aux dossiers
-- Cette référence est héritée de la Note SEF et ne change jamais

ALTER TABLE public.dossiers
ADD COLUMN IF NOT EXISTS reference_pivot TEXT;

-- Créer un index pour la recherche rapide
CREATE INDEX IF NOT EXISTS idx_dossiers_reference_pivot 
ON public.dossiers(reference_pivot) 
WHERE reference_pivot IS NOT NULL;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN public.dossiers.reference_pivot IS 
  'Référence ARTI pivot (format: ARTI0MMYYNNNN). Héritée de la Note SEF au moment de la création du dossier. Immuable.';

-- Backfill: récupérer les références des notes SEF liées
UPDATE public.dossiers d
SET reference_pivot = ns.reference_pivot
FROM public.notes_sef ns
WHERE d.note_sef_id = ns.id
  AND d.reference_pivot IS NULL
  AND ns.reference_pivot IS NOT NULL;

-- Créer une fonction pour propager automatiquement la référence
CREATE OR REPLACE FUNCTION public.propagate_reference_pivot_to_dossier()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le dossier n'a pas de reference_pivot et qu'on a une note_sef_id
  IF NEW.reference_pivot IS NULL AND NEW.note_sef_id IS NOT NULL THEN
    SELECT reference_pivot INTO NEW.reference_pivot
    FROM public.notes_sef
    WHERE id = NEW.note_sef_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour propager automatiquement
DROP TRIGGER IF EXISTS trg_propagate_reference_pivot ON public.dossiers;
CREATE TRIGGER trg_propagate_reference_pivot
  BEFORE INSERT OR UPDATE ON public.dossiers
  FOR EACH ROW
  EXECUTE FUNCTION public.propagate_reference_pivot_to_dossier();