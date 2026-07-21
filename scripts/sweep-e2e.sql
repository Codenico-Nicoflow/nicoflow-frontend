-- Stale-data sweep for the dedicated staging E2E account (NIC-1339 AC4).
-- Runs FIRST in the nightly job to self-heal after a crashed run that never
-- reached its `finally` teardown. Deletes every e2e-* artifact AND leaked
-- e2e+* unverified accounts, while sparing the permanent __E2E_*__ sentinels.
--
-- Run against the staging DB:  psql "$STAGING_DATABASE_URL" -f scripts/sweep-e2e.sql
--
-- Safety: name-scoped to the e2e- namespace + the single test account, so it can
-- never touch real user data. Sentinels are underscore-prefixed (__E2E_...) and
-- do NOT match 'e2e-%', so they survive by construction.

BEGIN;

-- Resolve the test account once.
WITH acct AS (
  SELECT id FROM users WHERE email = 'e2e@nicoflow.test'
)

-- 1. Tasks born from journeys OR from bucket-process (title forced to e2e-*).
DELETE FROM tasks
 WHERE user_id IN (SELECT id FROM acct)
   AND title LIKE 'e2e-%';

-- 2. Unprocessed bucket items left in the inbox.
DELETE FROM bucket
 WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e@nicoflow.test')
   AND content LIKE 'e2e-%';

-- 3. Projects — but never the sentinel default project.
DELETE FROM projects
 WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e@nicoflow.test')
   AND name LIKE 'e2e-%'
   AND name <> '__E2E_DEFAULT_PROJECT__';

-- 4. Areas — but never the sentinel default area.
DELETE FROM areas
 WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e@nicoflow.test')
   AND name LIKE 'e2e-%'
   AND name <> '__E2E_DEFAULT_AREA__';

-- 5. Leaked unverified accounts from the register-@core journey
--    (register creates e2e+<run>@nicoflow.test; it never verifies, so it
--     accumulates). Delete only unverified ones — never the seeded account,
--     which is email_verified = true.
DELETE FROM users
 WHERE email LIKE 'e2e+%@nicoflow.test'
   AND email_verified = false;

COMMIT;
