-- ============================================================================
-- PERMISSIONS VERIFICATION SCRIPT
-- Purpose: Check RLS policies and user permissions are working correctly
-- Usage: Run in Supabase SQL Editor to verify security setup
-- ============================================================================

-- Check RLS status on all tables
SELECT 
    'RLS_STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count policies per table
SELECT 
    'POLICY_COUNT' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Show specific policy details for cards table
SELECT 
    'CARDS_POLICIES' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_condition,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'cards'
ORDER BY policyname;

-- Show specific policy details for user_credits table
SELECT 
    'CREDITS_POLICIES' as check_type,
    policyname,
    cmd as command,
    permissive,
    roles,
    qual as using_condition,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_credits'
ORDER BY policyname;

-- Show storage policies
SELECT 
    'STORAGE_POLICIES' as check_type,
    policyname,
    bucket_id,
    operation,
    check_expression
FROM storage.policies
ORDER BY bucket_id, policyname;

-- Check function permissions
SELECT 
    'FUNCTION_PERMISSIONS' as check_type,
    p.proname as function_name,
    p.prosecdef as security_definer,
    r.rolname as owner
FROM pg_proc p
JOIN pg_roles r ON p.proowner = r.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY function_name;

-- Check table permissions for authenticated role
SELECT 
    'TABLE_PERMISSIONS' as check_type,
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- Test current user context (should show your user ID if logged in)
SELECT 
    'USER_CONTEXT' as check_type,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- Check for missing indexes that could affect RLS performance
SELECT 
    'MISSING_INDEXES' as check_type,
    'user_id columns should have indexes for RLS performance' as note,
    t.table_name,
    CASE 
        WHEN i.indexname IS NULL THEN 'MISSING INDEX'
        ELSE 'INDEX EXISTS'
    END as index_status
FROM information_schema.tables t
LEFT JOIN pg_indexes i ON t.table_name = i.tablename AND i.indexdef LIKE '%user_id%'
WHERE t.table_schema = 'public' 
    AND t.table_name IN ('cards', 'user_credits')
ORDER BY t.table_name;

-- Summary of security setup
SELECT 
    'SECURITY_SUMMARY' as check_type,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as tables_with_rls,
    COUNT(*) as total_tables
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 'VERIFICATION_COMPLETE' as check_type, 'Permission verification completed' as message;