-- Create alerts table for persistent alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  entity_table VARCHAR(100),
  entity_id UUID,
  entity_code VARCHAR(100),
  module VARCHAR(50),
  owner_role VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_comment TEXT,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for alerts
CREATE POLICY "Alerts are viewable by authenticated users"
ON public.alerts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage alerts"
ON public.alerts FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('ADMIN', 'DG', 'DAAF')
  )
);

-- Create indexes for alerts
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_alerts_entity ON public.alerts(entity_table, entity_id);

-- Function to log audit with enhanced fields
CREATE OR REPLACE FUNCTION public.log_audit_action(
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_action VARCHAR,
  p_module VARCHAR DEFAULT NULL,
  p_entity_code VARCHAR DEFAULT NULL,
  p_resume TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_justification TEXT DEFAULT NULL,
  p_exercice INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role VARCHAR;
  v_log_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's primary role
  SELECT ur.role::text INTO v_user_role
  FROM user_roles ur
  WHERE ur.user_id = v_user_id
  LIMIT 1;

  INSERT INTO audit_logs (
    entity_type, entity_id, action, module, entity_code, 
    resume, old_values, new_values, justification, exercice,
    user_id, user_role
  ) VALUES (
    p_entity_type, p_entity_id, p_action, p_module, p_entity_code,
    p_resume, p_old_values, p_new_values, p_justification, p_exercice,
    v_user_id, v_user_role
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to resolve an alert
CREATE OR REPLACE FUNCTION public.resolve_alert(
  p_alert_id UUID,
  p_comment TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  UPDATE alerts
  SET 
    status = 'resolved',
    resolved_at = now(),
    resolved_by = v_user_id,
    resolution_comment = p_comment
  WHERE id = p_alert_id AND status != 'resolved';

  -- Log the action
  INSERT INTO audit_logs (entity_type, entity_id, action, module, user_id)
  VALUES ('alert', p_alert_id, 'alert_resolved', 'alerts', v_user_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_audit_action TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_alert TO authenticated;