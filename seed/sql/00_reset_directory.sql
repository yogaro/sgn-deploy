-- Removes the sample people and the legacy sample units from Directory; the three admin logins stay (without a unit).
-- Run on db_directory. The PTSGN-* units and positions stay: the demo grows them.
BEGIN;
CREATE TEMP TABLE keep_users AS
  SELECT id FROM users WHERE email IN ('admin@sgn.com', 'admindirectory@sgn.com', 'yoga@sgn.com');

DELETE FROM audit_log WHERE actor_user_id NOT IN (SELECT id FROM keep_users) AND actor_user_id IS NOT NULL
  AND actor_user_id IN (SELECT id FROM users WHERE id NOT IN (SELECT id FROM keep_users));
DELETE FROM user_assignments WHERE user_id IN (SELECT id FROM keep_users);
DELETE FROM users WHERE id NOT IN (SELECT id FROM keep_users);

DELETE FROM organization_units WHERE unit_code IN ('DIR01', 'DIR02', 'DIV-TI', 'SUBDIV-TI-STRA', 'SUBDIV-TI-OPS', 'ASB-TI-TKEL');
COMMIT;
