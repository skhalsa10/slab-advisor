-- ============================================================================
-- COMBINED DATA INSPECTION SCRIPT
-- Purpose: Show all data in one result set
-- Usage: Run this entire script in Supabase SQL Editor
-- ============================================================================

-- Combine all inspection queries
(
    -- Row counts
    SELECT 'ROW_COUNTS' as inspection_type, 'cards' as detail1, COUNT(*)::text as detail2, '' as detail3 FROM cards
    UNION ALL
    SELECT 'ROW_COUNTS', 'user_credits', COUNT(*)::text, '' FROM user_credits
    UNION ALL
    SELECT 'ROW_COUNTS', 'storage.objects', COUNT(*)::text, '' FROM storage.objects WHERE bucket_id = 'card-images'
)
UNION ALL
(
    -- Table sizes
    SELECT 
        'TABLE_SIZES' as inspection_type,
        tablename as detail1,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as detail2,
        'Rows: ' || (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = tablename)::text as detail3
    FROM pg_tables 
    WHERE schemaname = 'public'
)
UNION ALL
(
    -- Check for any orphaned data
    SELECT 
        'ORPHANED_CHECK' as inspection_type,
        'cards_without_credits' as detail1,
        COUNT(*)::text as detail2,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING: Orphaned cards found' ELSE 'OK' END as detail3
    FROM cards c
    LEFT JOIN user_credits uc ON c.user_id = uc.user_id
    WHERE uc.user_id IS NULL
)
UNION ALL
(
    -- Summary of what exists
    SELECT 
        'DATA_SUMMARY' as inspection_type,
        'Total cards' as detail1,
        COUNT(*)::text as detail2,
        CASE 
            WHEN COUNT(*) = 0 THEN 'No data'
            ELSE 'Has data'
        END as detail3
    FROM cards
)
UNION ALL
(
    SELECT 
        'DATA_SUMMARY' as inspection_type,
        'Cards with grades' as detail1,
        COUNT(*)::text as detail2,
        ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM cards), 0), 1)::text || '%' as detail3
    FROM cards WHERE estimated_grade IS NOT NULL
)
UNION ALL
(
    SELECT 
        'DATA_SUMMARY' as inspection_type,
        'Total users with credits' as detail1,
        COUNT(*)::text as detail2,
        'Avg credits: ' || COALESCE(ROUND(AVG(credits_remaining), 1)::text, '0') as detail3
    FROM user_credits
)
ORDER BY inspection_type, detail1;