-- ============================================================================
-- PERFORMANCE OPTIMIZATION SCRIPT
-- Purpose: Create indexes and optimize queries for better performance
-- Usage: Run after setting up security to improve performance
-- ============================================================================

-- Drop existing indexes to recreate optimized versions
DROP INDEX IF EXISTS idx_cards_user_id;
DROP INDEX IF EXISTS idx_user_credits_user_id;
DROP INDEX IF EXISTS idx_cards_user_id_optimized;
DROP INDEX IF EXISTS idx_user_credits_user_id_optimized;
DROP INDEX IF EXISTS idx_cards_created_at;
DROP INDEX IF EXISTS idx_cards_user_created;
DROP INDEX IF EXISTS idx_user_credits_lookup;

-- ============================================================================
-- CRITICAL INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- Essential for cards table RLS policy performance
CREATE INDEX idx_cards_user_id_optimized ON cards(user_id) 
WHERE user_id IS NOT NULL;

-- Essential for user_credits table RLS policy performance  
CREATE INDEX idx_user_credits_user_id_optimized ON user_credits(user_id) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- For sorting cards by creation date (most recent first)
CREATE INDEX idx_cards_created_at ON cards(created_at DESC);

-- Composite index for user's cards sorted by date
CREATE INDEX idx_cards_user_created ON cards(user_id, created_at DESC);

-- For quick credit lookups
CREATE INDEX idx_user_credits_lookup ON user_credits(user_id, credits_remaining);

-- For finding cards by grade (useful for analytics later)
CREATE INDEX idx_cards_grade ON cards(estimated_grade) 
WHERE estimated_grade IS NOT NULL;

-- For finding cards with images (useful for cleanup)
CREATE INDEX idx_cards_with_images ON cards(user_id, front_image_url, back_image_url) 
WHERE front_image_url IS NOT NULL AND back_image_url IS NOT NULL;

-- ============================================================================
-- QUERY PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE cards;
ANALYZE user_credits;

-- Show index usage after creation
SELECT 
    'INDEX_INFO' as info_type,
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Show table statistics
SELECT 
    'TABLE_STATS' as info_type,
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    seq_scan as sequential_scans,
    seq_tup_read as seq_rows_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_rows_fetched
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Test query performance for common operations
-- (These will show execution plans to verify indexes are being used)

-- Test: User loading their cards (most common query)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, card_title, estimated_grade, created_at 
FROM cards 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 10;

-- Test: User credit lookup (happens on every page load)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT credits_remaining 
FROM user_credits 
WHERE user_id = auth.uid();

-- Test: Card details lookup
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * 
FROM cards 
WHERE id = 'some-uuid' AND user_id = auth.uid();

-- ============================================================================
-- VACUUM AND MAINTENANCE
-- ============================================================================

-- Vacuum tables to ensure optimal performance
VACUUM ANALYZE cards;
VACUUM ANALYZE user_credits;

-- Show final table sizes
SELECT 
    'FINAL_SIZE' as info_type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

SELECT 'PERFORMANCE_OPTIMIZATION_COMPLETE' as status, 
       'Database optimized for performance. Indexes created and statistics updated.' as message;