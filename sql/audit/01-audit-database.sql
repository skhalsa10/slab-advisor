-- ============================================================================
-- DATABASE AUDIT SCRIPT
-- Purpose: Show complete database structure, policies, functions, triggers
-- Usage: Run in Supabase SQL Editor to get full database overview
-- ============================================================================

-- Show all tables and their structure
SELECT 
    'TABLES' as audit_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity as has_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show all columns for our main tables
SELECT 
    'COLUMNS' as audit_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('collection_cards', 'user_credits')
ORDER BY table_name, ordinal_position;

-- Show all RLS policies
SELECT 
    'RLS_POLICIES' as audit_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show all functions
SELECT 
    'FUNCTIONS' as audit_type,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_catalog.pg_get_function_arguments(p.oid) as arguments,
    pg_catalog.pg_get_function_result(p.oid) as return_type,
    CASE
        WHEN p.prokind = 'a' THEN 'aggregate'
        WHEN p.prokind = 'w' THEN 'window'
        WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
        ELSE 'normal'
    END as function_type
FROM pg_catalog.pg_proc p
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY function_name;

-- Show all triggers
SELECT 
    'TRIGGERS' as audit_type,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Show all indexes
SELECT 
    'INDEXES' as audit_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Show storage buckets
SELECT 
    'STORAGE_BUCKETS' as audit_type,
    id,
    name,
    public
FROM storage.buckets
ORDER BY name;

-- Show storage policies (using pg_policies for storage schema)
SELECT 
    'STORAGE_POLICIES' as audit_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Show table sizes and row counts
SELECT 
    'TABLE_STATS' as audit_type,
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- Show foreign key constraints
SELECT
    'FOREIGN_KEYS' as audit_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Summary message
SELECT 'AUDIT_COMPLETE' as audit_type, 'Database audit completed successfully' as message;