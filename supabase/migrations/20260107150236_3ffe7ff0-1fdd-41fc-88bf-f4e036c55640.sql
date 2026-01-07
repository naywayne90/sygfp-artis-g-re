-- =====================================================
-- Table budg_alert_rules : Règles d'alertes budgétaires paramétrables
-- =====================================================
CREATE TABLE IF NOT EXISTS public.budg_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercice INTEGER NULL,
  scope VARCHAR(20) NOT NULL DEFAULT 'GLOBAL' CHECK (scope IN ('GLOBAL', 'PAR_LIGNE')),
  seuil_pct INTEGER NOT NULL CHECK (seuil_pct >= 0 AND seuil_pct <= 100),
  actif BOOLEAN NOT NULL DEFAULT true,
  destinataires_roles TEXT[] DEFAULT '{}',
  destinataires_users UUID[] DEFAULT '{}',
  canal VARCHAR(50) DEFAULT 'IN_APP',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_budg_alert_rules_exercice ON public.budg_alert_rules(exercice);
CREATE INDEX IF NOT EXISTS idx_budg_alert_rules_seuil ON public.budg_alert_rules(seuil_pct);
CREATE INDEX IF NOT EXISTS idx_budg_alert_rules_actif ON public.budg_alert_rules(actif);

-- RLS
ALTER TABLE public.budg_alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alert rules visible par auth" ON public.budg_alert_rules;
CREATE POLICY "Alert rules visible par auth"
  ON public.budg_alert_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Alert rules modifiables par admin" ON public.budg_alert_rules;
CREATE POLICY "Alert rules modifiables par admin"
  ON public.budg_alert_rules FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.profil_fonctionnel::text = 'ADMIN'
    )
  );

-- Insérer les règles par défaut
INSERT INTO public.budg_alert_rules (seuil_pct, scope, description, destinataires_roles, canal) VALUES
(75, 'GLOBAL', 'Alerte à 75% d''engagement du budget', ARRAY['DAF', 'SDCT', 'CB']::text[], 'IN_APP'),
(90, 'GLOBAL', 'Alerte à 90% d''engagement du budget', ARRAY['DAF', 'SDCT', 'CB', 'DG']::text[], 'IN_APP'),
(95, 'GLOBAL', 'Alerte critique à 95% d''engagement', ARRAY['DAF', 'DG', 'ADMIN']::text[], 'IN_APP'),
(100, 'GLOBAL', 'Budget épuisé - Blocage automatique', ARRAY['DAF', 'DG', 'ADMIN']::text[], 'IN_APP')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Table budg_alerts : Alertes budgétaires déclenchées
-- =====================================================
CREATE TABLE IF NOT EXISTS public.budg_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.budg_alert_rules(id) ON DELETE SET NULL,
  exercice INTEGER NOT NULL,
  ligne_budgetaire_id UUID REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  niveau VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (niveau IN ('info', 'warning', 'critical', 'blocking')),
  seuil_atteint INTEGER NOT NULL,
  taux_actuel NUMERIC(5,2),
  montant_dotation NUMERIC(20,2),
  montant_engage NUMERIC(20,2),
  montant_disponible NUMERIC(20,2),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_comment TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_budg_alerts_exercice ON public.budg_alerts(exercice);
CREATE INDEX IF NOT EXISTS idx_budg_alerts_ligne ON public.budg_alerts(ligne_budgetaire_id);
CREATE INDEX IF NOT EXISTS idx_budg_alerts_niveau ON public.budg_alerts(niveau);
CREATE INDEX IF NOT EXISTS idx_budg_alerts_created ON public.budg_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budg_alerts_not_ack ON public.budg_alerts(acknowledged_at) WHERE acknowledged_at IS NULL;

-- RLS
ALTER TABLE public.budg_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alerts visibles par auth" ON public.budg_alerts;
CREATE POLICY "Alerts visibles par auth"
  ON public.budg_alerts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Alerts insert" ON public.budg_alerts;
CREATE POLICY "Alerts insert"
  ON public.budg_alerts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Alerts update" ON public.budg_alerts;
CREATE POLICY "Alerts update"
  ON public.budg_alerts FOR UPDATE TO authenticated USING (true);

-- =====================================================
-- Fonctions pour les alertes budgétaires
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_budget_alerts(p_exercice INTEGER)
RETURNS TABLE (
  alerte_id UUID,
  ligne_code TEXT,
  seuil INTEGER,
  taux NUMERIC,
  niveau TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_line RECORD;
  v_taux NUMERIC;
  v_niveau TEXT;
  v_message TEXT;
  v_existing UUID;
  v_new_alert_id UUID;
BEGIN
  FOR v_rule IN 
    SELECT * FROM budg_alert_rules 
    WHERE actif = true 
    AND (exercice IS NULL OR exercice = p_exercice)
    ORDER BY seuil_pct ASC
  LOOP
    FOR v_line IN 
      SELECT 
        bl.id,
        bl.code,
        bl.label,
        bl.dotation_initiale,
        COALESCE(bl.total_engage, 0) as total_engage,
        COALESCE(bl.dotation_initiale, 0) - COALESCE(bl.total_engage, 0) as disponible
      FROM budget_lines bl
      WHERE bl.exercice = p_exercice
      AND bl.dotation_initiale > 0
    LOOP
      v_taux := (v_line.total_engage / v_line.dotation_initiale) * 100;
      
      IF v_taux >= v_rule.seuil_pct THEN
        SELECT id INTO v_existing
        FROM budg_alerts
        WHERE exercice = p_exercice
        AND ligne_budgetaire_id = v_line.id
        AND seuil_atteint = v_rule.seuil_pct
        AND resolved_at IS NULL;
        
        IF v_existing IS NULL THEN
          CASE 
            WHEN v_rule.seuil_pct >= 100 THEN v_niveau := 'blocking';
            WHEN v_rule.seuil_pct >= 95 THEN v_niveau := 'critical';
            WHEN v_rule.seuil_pct >= 90 THEN v_niveau := 'warning';
            ELSE v_niveau := 'info';
          END CASE;
          
          v_message := format(
            'Ligne %s : %s%% du budget engagé (%s / %s). Disponible: %s',
            v_line.code,
            round(v_taux, 1),
            to_char(v_line.total_engage, 'FM999G999G999G999') || ' FCFA',
            to_char(v_line.dotation_initiale, 'FM999G999G999G999') || ' FCFA',
            to_char(v_line.disponible, 'FM999G999G999G999') || ' FCFA'
          );
          
          INSERT INTO budg_alerts (
            rule_id, exercice, ligne_budgetaire_id, niveau, seuil_atteint,
            taux_actuel, montant_dotation, montant_engage, montant_disponible, message, context
          ) VALUES (
            v_rule.id, p_exercice, v_line.id, v_niveau, v_rule.seuil_pct,
            v_taux, v_line.dotation_initiale, v_line.total_engage, v_line.disponible, v_message,
            jsonb_build_object('ligne_code', v_line.code, 'ligne_label', v_line.label, 'seuil_pct', v_rule.seuil_pct)
          )
          RETURNING id INTO v_new_alert_id;
          
          alerte_id := v_new_alert_id;
          ligne_code := v_line.code;
          seuil := v_rule.seuil_pct;
          taux := v_taux;
          niveau := v_niveau;
          RETURN NEXT;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.acknowledge_budget_alert(p_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE budg_alerts
  SET acknowledged_at = now(), acknowledged_by = auth.uid()
  WHERE id = p_alert_id AND acknowledged_at IS NULL;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_budget_alert(p_alert_id UUID, p_comment TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE budg_alerts
  SET resolved_at = now(), resolved_by = auth.uid(), resolution_comment = p_comment
  WHERE id = p_alert_id AND resolved_at IS NULL;
  RETURN FOUND;
END;
$$;