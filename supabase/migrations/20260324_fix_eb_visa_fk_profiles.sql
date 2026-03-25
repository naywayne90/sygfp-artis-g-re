-- Fix FK constraints on expressions_besoin visa/verified/rejected columns
-- They were pointing to auth.users instead of profiles, which broke PostgREST joins
-- causing 400 errors on the EB detail query.

ALTER TABLE expressions_besoin
  DROP CONSTRAINT IF EXISTS expressions_besoin_visa_cb_user_id_fkey;
ALTER TABLE expressions_besoin
  DROP CONSTRAINT IF EXISTS expressions_besoin_visa_daaf_user_id_fkey;
ALTER TABLE expressions_besoin
  DROP CONSTRAINT IF EXISTS expressions_besoin_visa_dg_user_id_fkey;
ALTER TABLE expressions_besoin
  DROP CONSTRAINT IF EXISTS expressions_besoin_verified_by_fkey;
ALTER TABLE expressions_besoin
  DROP CONSTRAINT IF EXISTS expressions_besoin_rejected_by_fkey;

ALTER TABLE expressions_besoin
  ADD CONSTRAINT expressions_besoin_visa_cb_user_id_fkey
  FOREIGN KEY (visa_cb_user_id) REFERENCES profiles(id);
ALTER TABLE expressions_besoin
  ADD CONSTRAINT expressions_besoin_visa_daaf_user_id_fkey
  FOREIGN KEY (visa_daaf_user_id) REFERENCES profiles(id);
ALTER TABLE expressions_besoin
  ADD CONSTRAINT expressions_besoin_visa_dg_user_id_fkey
  FOREIGN KEY (visa_dg_user_id) REFERENCES profiles(id);
ALTER TABLE expressions_besoin
  ADD CONSTRAINT expressions_besoin_verified_by_fkey
  FOREIGN KEY (verified_by) REFERENCES profiles(id);
ALTER TABLE expressions_besoin
  ADD CONSTRAINT expressions_besoin_rejected_by_fkey
  FOREIGN KEY (rejected_by) REFERENCES profiles(id);
