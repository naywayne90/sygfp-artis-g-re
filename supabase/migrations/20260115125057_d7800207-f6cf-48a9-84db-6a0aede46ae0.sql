-- =====================================================
-- PROMPT 10/10 : Finalisation Notes SEF
-- Performance indexes + RLS hardening
-- =====================================================

-- 1. Index sur updated_at (manquant pour tri performant)
CREATE INDEX IF NOT EXISTS idx_notes_sef_updated_at 
ON public.notes_sef(updated_at DESC);

-- 2. Index composite pour filtre exercice+direction (accès direction)
CREATE INDEX IF NOT EXISTS idx_notes_sef_exercice_direction 
ON public.notes_sef(exercice, direction_id);

-- 3. Index sur demandeur_id pour recherche par demandeur
CREATE INDEX IF NOT EXISTS idx_notes_sef_demandeur 
ON public.notes_sef(demandeur_id);

-- 4. Index sur submitted_at pour filtrer les notes soumises
CREATE INDEX IF NOT EXISTS idx_notes_sef_submitted_at 
ON public.notes_sef(submitted_at) 
WHERE submitted_at IS NOT NULL;

-- 5. Index sur decided_at pour tri par date de décision
CREATE INDEX IF NOT EXISTS idx_notes_sef_decided_at 
ON public.notes_sef(decided_at) 
WHERE decided_at IS NOT NULL;

-- 6. Index composite optimisé pour liste paginée
CREATE INDEX IF NOT EXISTS idx_notes_sef_list_query 
ON public.notes_sef(exercice, statut, updated_at DESC);

-- 7. Index sur notes_sef_history pour fetchHistory rapide
CREATE INDEX IF NOT EXISTS idx_notes_sef_history_note 
ON public.notes_sef_history(note_id, performed_at DESC);

-- 8. Index sur notes_sef_attachments (si beaucoup de PJ)
CREATE INDEX IF NOT EXISTS idx_notes_sef_attachments_note 
ON public.notes_sef_attachments(note_id);

-- 9. Index sur notes_sef_pieces (table alternative PJ)
CREATE INDEX IF NOT EXISTS idx_notes_sef_pieces_note 
ON public.notes_sef_pieces(note_id);

-- =====================================================
-- Sécurité : Vérifier que le bucket storage est privé
-- (les downloads utilisent des signed URLs côté app)
-- =====================================================

-- Note: Le bucket "notes-sef-pieces" doit être configuré comme privé
-- dans le dashboard Supabase > Storage > Bucket settings

-- =====================================================
-- Commentaires sur les tables pour documentation
-- =====================================================

COMMENT ON TABLE public.notes_sef IS 
'Notes Sans Effet Financier (SEF) - Expression de besoin sans impact budgétaire immédiat.
Workflow: brouillon → soumis → a_valider → valide|rejete|differe.
À la validation, un dossier est automatiquement créé.';

COMMENT ON COLUMN public.notes_sef.reference_pivot IS 
'Code pivot unique ARTI/ANNÉE/DIR/SÉQUENCE généré automatiquement';

COMMENT ON COLUMN public.notes_sef.statut IS 
'États possibles: brouillon, soumis, a_valider, valide, rejete, differe';

COMMENT ON TABLE public.notes_sef_history IS 
'Journal des événements pour traçabilité complète des Notes SEF.
Immutable: INSERT only, pas de UPDATE/DELETE possible.';

COMMENT ON TABLE public.notes_sef_attachments IS 
'Pièces jointes liées aux Notes SEF.
Les fichiers sont stockés dans le bucket privé "notes-sef-pieces".';

-- =====================================================
-- Trigger de sécurité : empêcher modification après validation finale
-- =====================================================

CREATE OR REPLACE FUNCTION public.prevent_final_note_sef_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Empêcher la modification des notes validées/rejetées sauf par ADMIN
  IF OLD.statut IN ('valide', 'rejete') THEN
    IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
      RAISE EXCEPTION 'Les notes validées ou rejetées ne peuvent plus être modifiées';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_prevent_final_modification ON public.notes_sef;
CREATE TRIGGER trigger_prevent_final_modification
BEFORE UPDATE ON public.notes_sef
FOR EACH ROW
EXECUTE FUNCTION public.prevent_final_note_sef_modification();