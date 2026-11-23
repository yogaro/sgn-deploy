-- Removes every account and employee except the admin logins, and the copied org tree, so the next sync rebuilds them from Directory.
-- Run on db_iam after 00_reset_directory.sql.
BEGIN;
CREATE TEMP TABLE keep_users AS
  SELECT id, employee_id FROM iam.users WHERE email IN ('dev-admin@sgn.example', 'admin.lms@sgn.example', 'admin@sgn.com', 'admindirectory@sgn.com', 'yoga@sgn.com');

DELETE FROM iam.user_roles WHERE user_id NOT IN (SELECT id FROM keep_users);
UPDATE iam.user_roles SET granted_by = NULL WHERE granted_by NOT IN (SELECT id FROM keep_users);
DELETE FROM iam.refresh_tokens WHERE user_id NOT IN (SELECT id FROM keep_users);
DELETE FROM iam.users WHERE id NOT IN (SELECT id FROM keep_users);
DELETE FROM iam.employees WHERE id NOT IN (SELECT employee_id FROM keep_users WHERE employee_id IS NOT NULL);
UPDATE iam.employees SET unit_id = NULL, position_id = NULL;
DELETE FROM iam.positions;
DELETE FROM iam.org_units;
DELETE FROM iam.sync_runs;
COMMIT;
