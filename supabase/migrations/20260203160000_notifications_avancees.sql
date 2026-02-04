-- =====================================================
-- Migration : Système de Notifications Avancées
-- Date : 2026-02-03
-- Auteur : Agent TRESOR - SYGFP
-- Objectif : Templates personnalisables et notifications automatiques
-- pour DMG et Directeur Opérationnel (ordonnancement, règlement)
-- =====================================================

-- =====================================================
-- TABLE : notification_templates
-- Templates de notifications avec variables dynamiques
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  titre_template TEXT NOT NULL,
  corps_template TEXT NOT NULL,
  type_evenement TEXT NOT NULL CHECK (type_evenement IN (
    'ordonnancement',
    'reglement',
    'reglement_partiel',
    'note_soumise',
    'note_validee',
    'note_rejetee',
    'engagement_cree',
    'liquidation_validee'
  )),
  variables_disponibles JSONB DEFAULT '[]'::jsonb,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par code et type
CREATE INDEX IF NOT EXISTS idx_notification_templates_code ON notification_templates(code);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type_evenement) WHERE est_actif = true;

-- =====================================================
-- TABLE : notification_recipients
-- Destinataires par type d'événement
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_evenement TEXT NOT NULL,
  role_hierarchique TEXT, -- DG, Directeur, DMG, etc.
  direction_id UUID REFERENCES directions(id),
  user_id UUID REFERENCES profiles(id),
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT recipient_target CHECK (
    role_hierarchique IS NOT NULL OR direction_id IS NOT NULL OR user_id IS NOT NULL
  )
);

-- Index pour recherche par type d'événement
CREATE INDEX IF NOT EXISTS idx_notification_recipients_type ON notification_recipients(type_evenement) WHERE est_actif = true;
CREATE INDEX IF NOT EXISTS idx_notification_recipients_role ON notification_recipients(role_hierarchique) WHERE est_actif = true;

-- =====================================================
-- TABLE : notification_logs
-- Historique des notifications envoyées
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES notification_templates(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  notification_id UUID REFERENCES notifications(id),
  entity_type TEXT,
  entity_id UUID,
  variables_utilisees JSONB DEFAULT '{}'::jsonb,
  titre_rendu TEXT,
  corps_rendu TEXT,
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'sent', 'read', 'failed')),
  canal TEXT DEFAULT 'in_app' CHECK (canal IN ('in_app', 'email', 'both')),
  erreur TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- Index pour recherche et analytics
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_entity ON notification_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_statut ON notification_logs(statut) WHERE statut = 'pending';

-- =====================================================
-- TABLE : notification_preferences
-- Préférences utilisateur pour les notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type_evenement TEXT NOT NULL,
  canal TEXT DEFAULT 'in_app' CHECK (canal IN ('in_app', 'email', 'both', 'disabled')),
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type_evenement)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- =====================================================
-- FONCTION : get_notification_recipients
-- Retourne les utilisateurs à notifier pour un type d'événement
-- =====================================================
CREATE OR REPLACE FUNCTION get_notification_recipients(p_type_evenement TEXT)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  canal TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as user_id,
    COALESCE(p.full_name, p.first_name || ' ' || p.last_name) as full_name,
    p.email,
    COALESCE(np.canal, 'in_app') as canal
  FROM notification_recipients nr
  JOIN profiles p ON (
    p.role_hierarchique = nr.role_hierarchique
    OR p.direction_id = nr.direction_id
    OR p.id = nr.user_id
  )
  LEFT JOIN notification_preferences np ON np.user_id = p.id AND np.type_evenement = p_type_evenement
  WHERE nr.type_evenement = p_type_evenement
  AND nr.est_actif = true
  AND p.is_active = true
  AND COALESCE(np.canal, 'in_app') != 'disabled';
END;
$func$;

-- =====================================================
-- FONCTION : render_notification_template
-- Remplace les variables dans un template
-- =====================================================
CREATE OR REPLACE FUNCTION render_notification_template(
  p_template_code TEXT,
  p_variables JSONB
)
RETURNS TABLE(
  titre TEXT,
  corps TEXT,
  template_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
DECLARE
  v_template RECORD;
  v_titre TEXT;
  v_corps TEXT;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Récupérer le template
  SELECT id, titre_template, corps_template INTO v_template
  FROM notification_templates
  WHERE code = p_template_code AND est_actif = true;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template non trouvé: %', p_template_code;
  END IF;

  v_titre := v_template.titre_template;
  v_corps := v_template.corps_template;

  -- Remplacer chaque variable
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_titre := REPLACE(v_titre, '{{' || v_key || '}}', COALESCE(v_value, ''));
    v_corps := REPLACE(v_corps, '{{' || v_key || '}}', COALESCE(v_value, ''));
  END LOOP;

  RETURN QUERY SELECT v_titre, v_corps, v_template.id;
END;
$func$;

-- =====================================================
-- FONCTION : send_bulk_notifications
-- Envoie des notifications à tous les destinataires configurés
-- =====================================================
CREATE OR REPLACE FUNCTION send_bulk_notifications(
  p_type_evenement TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_variables JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  v_template RECORD;
  v_recipient RECORD;
  v_notification_id UUID;
  v_count INTEGER := 0;
BEGIN
  -- Récupérer le template correspondant
  SELECT * INTO v_template
  FROM render_notification_template(
    (SELECT code FROM notification_templates WHERE type_evenement = p_type_evenement AND est_actif = true LIMIT 1),
    p_variables
  );

  IF v_template IS NULL THEN
    RAISE NOTICE 'Aucun template actif pour le type: %', p_type_evenement;
    RETURN 0;
  END IF;

  -- Envoyer à chaque destinataire
  FOR v_recipient IN SELECT * FROM get_notification_recipients(p_type_evenement)
  LOOP
    -- Créer la notification in-app
    INSERT INTO notifications (
      user_id, type, title, message, entity_type, entity_id, category
    ) VALUES (
      v_recipient.user_id,
      p_type_evenement,
      v_template.titre,
      v_template.corps,
      p_entity_type,
      p_entity_id,
      'workflow'
    )
    RETURNING id INTO v_notification_id;

    -- Logger la notification
    INSERT INTO notification_logs (
      template_id, recipient_id, notification_id, entity_type, entity_id,
      variables_utilisees, titre_rendu, corps_rendu, statut, canal, sent_at
    ) VALUES (
      v_template.template_id,
      v_recipient.user_id,
      v_notification_id,
      p_entity_type,
      p_entity_id,
      p_variables,
      v_template.titre,
      v_template.corps,
      'sent',
      v_recipient.canal,
      NOW()
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$func$;

-- =====================================================
-- FONCTION : get_notification_summary
-- Résumé des informations pour une notification de règlement
-- =====================================================
CREATE OR REPLACE FUNCTION get_notification_summary(p_entity_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $func$
DECLARE
  v_result JSONB;
BEGIN
  -- Essayer d'abord dans reglements
  SELECT jsonb_build_object(
    'reference', r.numero,
    'montant', r.montant,
    'montant_formate', TO_CHAR(r.montant, 'FM999 999 999 FCFA'),
    'date', TO_CHAR(r.date_reglement, 'DD/MM/YYYY'),
    'mode_paiement', r.mode_paiement,
    'entity_type', 'reglement'
  ) INTO v_result
  FROM reglements r
  WHERE r.id = p_entity_id;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Essayer dans ordonnancements
  SELECT jsonb_build_object(
    'reference', o.numero,
    'montant', o.montant,
    'montant_formate', TO_CHAR(o.montant, 'FM999 999 999 FCFA'),
    'date', TO_CHAR(o.date_ordonnancement, 'DD/MM/YYYY'),
    'fournisseur', COALESCE(f.raison_sociale, f.nom),
    'entity_type', 'ordonnancement'
  ) INTO v_result
  FROM ordonnancements o
  LEFT JOIN fournisseurs f ON f.id = o.fournisseur_id
  WHERE o.id = p_entity_id;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  -- Essayer dans liquidations
  SELECT jsonb_build_object(
    'reference', l.numero,
    'montant', l.montant_liquide,
    'montant_formate', TO_CHAR(l.montant_liquide, 'FM999 999 999 FCFA'),
    'date', TO_CHAR(l.date_liquidation, 'DD/MM/YYYY'),
    'fournisseur', COALESCE(f.raison_sociale, f.nom),
    'entity_type', 'liquidation'
  ) INTO v_result
  FROM liquidations l
  LEFT JOIN fournisseurs f ON f.id = l.fournisseur_id
  WHERE l.id = p_entity_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$func$;

-- =====================================================
-- TRIGGER : Mise à jour automatique de updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_notification_tables_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$;

DROP TRIGGER IF EXISTS trigger_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER trigger_notification_templates_updated_at
BEFORE UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION update_notification_tables_updated_at();

DROP TRIGGER IF EXISTS trigger_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trigger_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_notification_tables_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Templates : lecture pour tous, modification pour admins
CREATE POLICY "notification_templates_select_all" ON notification_templates
  FOR SELECT USING (true);

CREATE POLICY "notification_templates_admin" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role_hierarchique = 'DG' OR profil_fonctionnel = 'Admin')
    )
  );

-- Recipients : lecture pour tous, modification pour admins
CREATE POLICY "notification_recipients_select_all" ON notification_recipients
  FOR SELECT USING (true);

CREATE POLICY "notification_recipients_admin" ON notification_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role_hierarchique = 'DG' OR profil_fonctionnel = 'Admin')
    )
  );

-- Logs : lecture de ses propres logs uniquement
CREATE POLICY "notification_logs_select_own" ON notification_logs
  FOR SELECT USING (recipient_id = auth.uid());

-- Préférences : gestion de ses propres préférences
CREATE POLICY "notification_preferences_own" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- DONNÉES INITIALES : Templates de M. MBAYE
-- =====================================================

-- Template : Ordre de payer (Ordonnancement)
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES (
  'ORDO_PAYER',
  'Ordre de payer la dépense n° {{reference}}',
  'Un ordre de payer a été émis pour la dépense n° {{reference}} d''un montant de {{montant}} FCFA en faveur de {{fournisseur}}. Date d''ordonnancement : {{date}}.',
  'ordonnancement',
  '["reference", "montant", "fournisseur", "date", "direction", "objet"]'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  titre_template = EXCLUDED.titre_template,
  corps_template = EXCLUDED.corps_template,
  variables_disponibles = EXCLUDED.variables_disponibles;

-- Template : Règlement effectué
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES (
  'REGLEMENT_EFFECTUE',
  'Règlement effectué - Dépense n° {{reference}}',
  'Le règlement de la dépense n° {{reference}} a été effectué. Montant : {{montant}} FCFA. Mode de paiement : {{mode_paiement}}. Date : {{date}}.',
  'reglement',
  '["reference", "montant", "mode_paiement", "date", "fournisseur", "banque"]'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  titre_template = EXCLUDED.titre_template,
  corps_template = EXCLUDED.corps_template,
  variables_disponibles = EXCLUDED.variables_disponibles;

-- Template : Règlement partiel
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES (
  'REGLEMENT_PARTIEL',
  'Règlement partiel - Dépense n° {{reference}}',
  'Un règlement partiel a été effectué sur la dépense n° {{reference}}. Montant réglé : {{montant_regle}} FCFA sur {{montant_total}} FCFA. Reste à payer : {{reste_a_payer}} FCFA.',
  'reglement_partiel',
  '["reference", "montant_regle", "montant_total", "reste_a_payer", "date", "fournisseur"]'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  titre_template = EXCLUDED.titre_template,
  corps_template = EXCLUDED.corps_template,
  variables_disponibles = EXCLUDED.variables_disponibles;

-- Template : Note soumise
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES (
  'NOTE_SOUMISE',
  'Nouvelle note à valider - {{reference}}',
  'La note {{reference}} a été soumise pour validation. Objet : {{objet}}. Direction : {{direction}}. Montant estimé : {{montant}} FCFA.',
  'note_soumise',
  '["reference", "objet", "direction", "montant", "createur", "date"]'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  titre_template = EXCLUDED.titre_template,
  corps_template = EXCLUDED.corps_template,
  variables_disponibles = EXCLUDED.variables_disponibles;

-- Template : Note validée
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES (
  'NOTE_VALIDEE',
  'Note validée - {{reference}}',
  'Votre note {{reference}} a été validée par {{validateur}}. Elle passe à l''étape suivante du workflow.',
  'note_validee',
  '["reference", "validateur", "date", "commentaire"]'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  titre_template = EXCLUDED.titre_template,
  corps_template = EXCLUDED.corps_template,
  variables_disponibles = EXCLUDED.variables_disponibles;

-- Template : Note rejetée
INSERT INTO notification_templates (code, titre_template, corps_template, type_evenement, variables_disponibles)
VALUES (
  'NOTE_REJETEE',
  'Note rejetée - {{reference}}',
  'Votre note {{reference}} a été rejetée. Motif : {{motif}}. Veuillez effectuer les corrections nécessaires.',
  'note_rejetee',
  '["reference", "motif", "validateur", "date"]'::jsonb
) ON CONFLICT (code) DO UPDATE SET
  titre_template = EXCLUDED.titre_template,
  corps_template = EXCLUDED.corps_template,
  variables_disponibles = EXCLUDED.variables_disponibles;

-- =====================================================
-- DONNÉES INITIALES : Destinataires par défaut
-- =====================================================

-- DMG reçoit les notifications d'ordonnancement et règlement
INSERT INTO notification_recipients (type_evenement, role_hierarchique)
VALUES
  ('ordonnancement', 'DMG'),
  ('reglement', 'DMG'),
  ('reglement_partiel', 'DMG')
ON CONFLICT DO NOTHING;

-- DG reçoit les notes soumises
INSERT INTO notification_recipients (type_evenement, role_hierarchique)
VALUES
  ('note_soumise', 'DG')
ON CONFLICT DO NOTHING;

-- Directeurs reçoivent les notifications de leur direction
INSERT INTO notification_recipients (type_evenement, role_hierarchique)
VALUES
  ('ordonnancement', 'Directeur'),
  ('note_validee', 'Directeur'),
  ('note_rejetee', 'Directeur')
ON CONFLICT DO NOTHING;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT SELECT ON notification_templates TO authenticated;
GRANT SELECT ON notification_recipients TO authenticated;
GRANT SELECT, INSERT ON notification_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;

GRANT EXECUTE ON FUNCTION get_notification_recipients TO authenticated;
GRANT EXECUTE ON FUNCTION render_notification_template TO authenticated;
GRANT EXECUTE ON FUNCTION send_bulk_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_summary TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE notification_templates IS 'Templates de notifications avec variables dynamiques ({{variable}})';
COMMENT ON TABLE notification_recipients IS 'Configuration des destinataires par type d''événement';
COMMENT ON TABLE notification_logs IS 'Historique et traçabilité des notifications envoyées';
COMMENT ON TABLE notification_preferences IS 'Préférences utilisateur pour les canaux de notification';

COMMENT ON FUNCTION get_notification_recipients IS 'Retourne les utilisateurs à notifier pour un type d''événement';
COMMENT ON FUNCTION render_notification_template IS 'Remplace les variables {{var}} dans un template';
COMMENT ON FUNCTION send_bulk_notifications IS 'Envoie une notification à tous les destinataires configurés';
COMMENT ON FUNCTION get_notification_summary IS 'Génère le résumé des informations pour une entité (règlement, ordonnancement)';
