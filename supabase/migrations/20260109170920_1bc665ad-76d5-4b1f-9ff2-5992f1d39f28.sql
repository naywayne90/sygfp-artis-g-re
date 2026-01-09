-- Corriger la politique RLS pour l'insertion des dossiers
-- La politique actuelle ne permet pas l'insertion car created_by n'est pas encore défini

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Authorized roles can manage dossiers" ON public.dossiers;

-- Recréer des politiques séparées pour INSERT, UPDATE, DELETE
-- Politique pour INSERT : permettre l'insertion à tout utilisateur authentifié
CREATE POLICY "Users can insert dossiers" 
ON public.dossiers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour UPDATE/DELETE : seuls les créateurs et rôles autorisés peuvent modifier
CREATE POLICY "Authorized roles can update delete dossiers" 
ON public.dossiers 
FOR ALL 
USING (
  has_role(auth.uid(), 'ADMIN'::app_role) OR 
  has_role(auth.uid(), 'DAAF'::app_role) OR 
  has_role(auth.uid(), 'CB'::app_role) OR 
  created_by = auth.uid()
);