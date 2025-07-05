-- ============================================================================
-- QUICK CLEANUP SCRIPT - SEPARATED VERSION
-- Purpose: Fix the issues found in audit
-- Usage: Run each section separately in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Drop the duplicate RLS policy (run this first)
DROP POLICY IF EXISTS "Users can only view own credits" ON user_credits;

-- STEP 2: Run these VACUUM commands one at a time in separate executions
-- (Copy and paste each line individually)
-- VACUUM FULL ANALYZE cards;
-- VACUUM FULL ANALYZE user_credits;

-- STEP 3: After running the VACUUMs above, run this to verify
SELECT 
    'CLEANUP_RESULT' as status,
    'Run VACUUM commands separately, then check results below' as message;

SELECT 
    'UPDATED_ROW_COUNTS' as status,
    relname as table_name,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;