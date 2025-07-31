-- ============================================================================
-- DATA CLEANUP SCRIPT
-- Purpose: Remove all data while preserving database structure
-- Usage: Run in Supabase SQL Editor to clean slate the database
-- WARNING: This will delete ALL data! Make sure you want to do this.
-- ============================================================================

-- Disable triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Show what will be deleted (run this first to see impact)
SELECT 'BEFORE_CLEANUP' as status, 'collection_cards' as table_name, COUNT(*) as rows_to_delete FROM collection_cards
UNION ALL
SELECT 'BEFORE_CLEANUP', 'user_credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'BEFORE_CLEANUP', 'storage.objects (card-images)', COUNT(*) FROM storage.objects WHERE bucket_id = 'card-images';

-- Delete all storage objects from card-images bucket
-- Note: This removes the files but you may need to do this from Supabase dashboard
DELETE FROM storage.objects WHERE bucket_id = 'card-images';

-- Delete all cards (this should cascade properly due to foreign keys)
DELETE FROM collection_cards;

-- Delete all user credits
DELETE FROM user_credits;

-- Reset sequences to start from 1 again (if using serial columns)
-- Note: Our tables use UUIDs so this might not be necessary, but included for completeness
SELECT setval(pg_get_serial_sequence('collection_cards', 'id'), 1, false) WHERE pg_get_serial_sequence('collection_cards', 'id') IS NOT NULL;
SELECT setval(pg_get_serial_sequence('user_credits', 'id'), 1, false) WHERE pg_get_serial_sequence('user_credits', 'id') IS NOT NULL;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Vacuum tables to reclaim space
VACUUM ANALYZE collection_cards;
VACUUM ANALYZE user_credits;

-- Verify cleanup completed
SELECT 'AFTER_CLEANUP' as status, 'collection_cards' as table_name, COUNT(*) as remaining_rows FROM collection_cards
UNION ALL
SELECT 'AFTER_CLEANUP', 'user_credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'AFTER_CLEANUP', 'storage.objects (card-images)', COUNT(*) FROM storage.objects WHERE bucket_id = 'card-images';

-- Show table sizes after cleanup
SELECT 
    'CLEANUP_SUMMARY' as status,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_after_cleanup
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 'CLEANUP_COMPLETE' as status, 'All data has been removed. Database structure preserved.' as message;