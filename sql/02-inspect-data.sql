-- ============================================================================
-- DATA INSPECTION SCRIPT
-- Purpose: Show what data exists in all tables
-- Usage: Run in Supabase SQL Editor to see current data
-- ============================================================================

-- Count rows in all main tables
SELECT 'ROW_COUNTS' as inspection_type, 'cards' as table_name, COUNT(*) as row_count FROM cards
UNION ALL
SELECT 'ROW_COUNTS', 'user_credits', COUNT(*) FROM user_credits
UNION ALL
SELECT 'ROW_COUNTS', 'storage.objects', COUNT(*) FROM storage.objects WHERE bucket_id = 'card-images'
ORDER BY table_name;

-- Show recent cards (if any exist)
SELECT 
    'RECENT_CARDS' as inspection_type,
    id,
    user_id,
    card_title,
    estimated_grade,
    confidence,
    front_image_url IS NOT NULL as has_front_image,
    back_image_url IS NOT NULL as has_back_image,
    created_at
FROM cards 
ORDER BY created_at DESC 
LIMIT 10;

-- Show user credits (if any exist)
SELECT 
    'USER_CREDITS' as inspection_type,
    id,
    user_id,
    credits_remaining,
    total_credits_purchased,
    created_at,
    updated_at
FROM user_credits 
ORDER BY created_at DESC 
LIMIT 10;

-- Show storage objects (if any exist)
SELECT 
    'STORAGE_FILES' as inspection_type,
    name,
    bucket_id,
    (metadata->>'size')::bigint as size_bytes,
    (metadata->>'mimetype') as file_type,
    created_at
FROM storage.objects 
WHERE bucket_id = 'card-images'
ORDER BY created_at DESC 
LIMIT 10;

-- Show table disk usage
SELECT 
    'DISK_USAGE' as inspection_type,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for orphaned data
SELECT 
    'ORPHANED_DATA' as inspection_type,
    'cards_without_user_credits' as issue_type,
    COUNT(*) as count
FROM cards c
LEFT JOIN user_credits uc ON c.user_id = uc.user_id
WHERE uc.user_id IS NULL

UNION ALL

SELECT 
    'ORPHANED_DATA',
    'user_credits_without_cards',
    COUNT(*)
FROM user_credits uc
LEFT JOIN cards c ON uc.user_id = c.user_id
WHERE c.user_id IS NULL;

-- Check for data anomalies
SELECT 
    'DATA_ANOMALIES' as inspection_type,
    'cards_with_negative_grades' as anomaly_type,
    COUNT(*) as count
FROM cards 
WHERE estimated_grade < 0

UNION ALL

SELECT 
    'DATA_ANOMALIES',
    'credits_with_negative_balance',
    COUNT(*)
FROM user_credits 
WHERE credits_remaining < 0

UNION ALL

SELECT 
    'DATA_ANOMALIES',
    'cards_missing_images',
    COUNT(*)
FROM cards 
WHERE front_image_url IS NULL OR back_image_url IS NULL;

-- Summary
SELECT 'INSPECTION_COMPLETE' as inspection_type, 'Data inspection completed' as message;