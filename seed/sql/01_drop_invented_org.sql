-- Drops the first-draft regions/mills/people so the real cluster structure can be seeded. Run on db_directory.
BEGIN;
CREATE TEMP TABLE keep_users AS
  SELECT id FROM users WHERE email IN ('admin@sgn.com', 'admindirectory@sgn.com', 'yoga@sgn.com');
DELETE FROM audit_log WHERE actor_user_id IN (SELECT id FROM users WHERE id NOT IN (SELECT id FROM keep_users));
DELETE FROM user_assignments WHERE user_id NOT IN (SELECT id FROM keep_users);
DELETE FROM users WHERE id NOT IN (SELECT id FROM keep_users);
UPDATE positions SET parent_position_id = NULL
  WHERE position_code ~ '^PTSGN-POS-(REG[0-9]|(?!STAF)[A-Z]{4})-';
DELETE FROM positions WHERE position_code ~ '^PTSGN-POS-(REG[0-9]|(?!STAF)[A-Z]{4})-';
DELETE FROM organization_units WHERE unit_code ~ '^PTSGN-([A-Z]{4}-(AKU|OLH|QA|TAN|TEK)|PG-[A-Z]{4}|REG[0-9])$';
COMMIT;
