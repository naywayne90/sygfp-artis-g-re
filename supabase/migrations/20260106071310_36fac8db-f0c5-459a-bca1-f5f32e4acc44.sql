-- Corriger RLS pour toutes les tables de séquences restantes
DO $$
DECLARE
  seq_table TEXT;
  seq_tables TEXT[] := ARRAY['expression_besoin_sequences', 'liquidation_sequences', 'ordonnancement_sequences', 
    'reglement_sequences', 'demande_achat_sequences', 'reception_sequences', 'mouvement_sequences', 
    'inventaire_sequences', 'marche_sequences', 'contrat_sequences', 'dossier_sequences', 'notes_sef_sequences'];
BEGIN
  FOREACH seq_table IN ARRAY seq_tables
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', seq_table);
    BEGIN
      EXECUTE format('CREATE POLICY "Authenticated users can view %s" ON public.%I FOR SELECT TO authenticated USING (true)', seq_table, seq_table);
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Policy already exists
    END;
  END LOOP;
END $$;