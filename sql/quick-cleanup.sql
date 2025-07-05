-- ============================================================================
-- QUICK CLEANUP SCRIPT
-- Purpose: Fix the issues found in audit
-- ============================================================================

-- 1. Drop the duplicate RLS policy
DROP POLICY IF EXISTS "Users can only view own credits" ON user_credits;

-- 2. Vacuum tables to remove dead rows
VACUUM FULL ANALYZE cards;
VACUUM FULL ANALYZE user_credits;

-- 3. Verify the cleanup
SELECT 
    'CLEANUP_RESULT' as status,
    'Duplicate policy removed and tables vacuumed' as message;

-- Show updated row counts
SELECT 
    'UPDATED_ROW_COUNTS' as status,
    relname as table_name,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;