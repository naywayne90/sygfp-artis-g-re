-- Activer RLS sur les tables de séquences
ALTER TABLE public.operation_tresorerie_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recette_sequences ENABLE ROW LEVEL SECURITY;

-- Policies pour les séquences (lecture seule pour les utilisateurs)
CREATE POLICY "Authenticated users can view operation_tresorerie_sequences" 
ON public.operation_tresorerie_sequences FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view recette_sequences" 
ON public.recette_sequences FOR SELECT TO authenticated USING (true);

-- RLS sur notification_preferences si pas déjà fait
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can insert own preferences'
  ) THEN
    CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
END $$;