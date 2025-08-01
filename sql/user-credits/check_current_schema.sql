-- ============================================================================
-- CHECK CURRENT USER_CREDITS SCHEMA
-- Purpose: Analyze the current user_credits table structure before migration
-- Run this FIRST to understand your current schema
-- ============================================================================

-- Get all column information
SELECT 
    'COLUMNS' as info_type,
    ordinal_position as position,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN character_maximum_length IS NOT NULL THEN 
            data_type || '(' || character_maximum_length || ')'
        WHEN numeric_precision IS NOT NULL THEN 
            data_type || '(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
        ELSE data_type
    END as full_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_credits'
ORDER BY ordinal_position;

-- Get all constraints
SELECT 
    'CONSTRAINTS' as info_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'user_credits' 
    AND n.nspname = 'public';

-- Get all indexes
SELECT 
    'INDEXES' as info_type,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
    AND tablename = 'user_credits';

-- Get RLS status and policies
SELECT 
    'RLS_STATUS' as info_type,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'user_credits';

-- Get all RLS policies
SELECT 
    'RLS_POLICIES' as info_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_condition,
    with_check as check_condition
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'user_credits'
ORDER BY policyname;

-- Check for any triggers
SELECT 
    'TRIGGERS' as info_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public' 
    AND event_object_table = 'user_credits';

-- Sample data check (shows structure and any existing data)
SELECT 
    'SAMPLE_DATA' as info_type,
    COUNT(*) as total_rows,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    AVG(credits_remaining) as avg_credits,
    SUM(total_credits_purchased) as total_purchased_all_users
FROM user_credits;