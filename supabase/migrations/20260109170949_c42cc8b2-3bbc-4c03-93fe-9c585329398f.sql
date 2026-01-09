-- Corriger la politique RLS pour dossier_etapes pour permettre l'insertion
-- Les utilisateurs authentifiés doivent pouvoir créer des étapes sur leurs dossiers

DROP POLICY IF EXISTS "Authorized roles can manage dossier etapes" ON public.dossier_etapes;

-- Permettre à tous les utilisateurs authentifiés d'insérer des étapes
CREATE POLICY "Users can insert dossier etapes" 
ON public.dossier_etapes 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Permettre aux rôles autorisés ou au créateur du dossier de gérer les étapes
CREATE POLICY "Authorized roles can update delete dossier etapes" 
ON public.dossier_etapes 
FOR ALL 
USING (
  has_role(auth.uid(), 'ADMIN'::app_role) OR 
  has_role(auth.uid(), 'DAAF'::app_role) OR 
  has_role(auth.uid(), 'CB'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.dossiers 
    WHERE dossiers.id = dossier_etapes.dossier_id 
    AND dossiers.created_by = auth.uid()
  )
);