-- Corriger la vue SECURITY DEFINER en la recréant avec security_invoker
DROP VIEW IF EXISTS public.notes_imputees_disponibles;

CREATE VIEW public.notes_imputees_disponibles 
WITH (security_invoker = true)
AS
SELECT 
    n.id,
    n.numero,
    n.objet,
    n.montant_estime,
    n.budget_line_id,
    n.direction_id,
    n.exercice,
    n.imputed_at,
    d.label as direction_label,
    d.sigle as direction_sigle,
    bl.code as ligne_code,
    bl.label as ligne_label
FROM public.notes_dg n
LEFT JOIN public.directions d ON n.direction_id = d.id
LEFT JOIN public.budget_lines bl ON n.budget_line_id = bl.id
WHERE n.statut = 'impute'
AND NOT EXISTS (
    SELECT 1 FROM public.expressions_besoin eb 
    WHERE eb.note_id = n.id 
    AND eb.statut NOT IN ('annule', 'rejeté')
);