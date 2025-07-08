-- ============================================================================
-- SECURITY INVESTIGATION SCRIPT
-- Purpose: Audit database functions and security settings
-- Usage: Run each section in Supabase SQL Editor to gather information
-- ============================================================================

-- SECTION 1: List all functions in the database
-- This will show us all functions including the mysterious handle_new_user
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  -- Check if function has search_path set
  CASE 
    WHEN p.proconfig IS NULL OR NOT ('search_path' = ANY(regexp_split_to_array(array_to_string(p.proconfig, ','), '=')))
    THEN 'NO SEARCH PATH SET (VULNERABLE)'
    ELSE 'Has search_path configuration'
  END as search_path_status,
  p.proowner::regrole as owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'extensions', 'graphql', 'graphql_public', 'net', 'pgbouncer', 'pgsodium', 'pgsodium_masks', 'realtime', 'storage', 'supabase_functions', 'vault')
ORDER BY n.nspname, p.proname;

-- SECTION 2: Get detailed definition of our security-related functions
-- This shows the actual code so we can see what needs updating
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN (
  'handle_new_user',
  'prevent_grade_tampering',
  'deduct_user_credit',
  'add_user_credits',
  'initialize_user_credits'
);

-- SECTION 3: Check for auth triggers (might contain handle_new_user)
SELECT 
  schemaname,
  tablename,
  tgname as trigger_name,
  tgfoid::regprocedure as trigger_function,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_tables tables ON c.relname = tables.tablename
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename, tgname;

-- SECTION 4: Check current auth.users triggers specifically
-- This is where handle_new_user might be hiding
SELECT 
  tgname as trigger_name,
  tgfoid::regprocedure as trigger_function,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- SECTION 5: Check Row Level Security status on your tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = tables.schemaname AND tablename = tables.tablename) as policy_count
FROM pg_tables tables
WHERE schemaname = 'public'
  AND tablename IN ('cards', 'user_credits')
ORDER BY tablename;

-- SECTION 6: Summary of security warnings that need fixing
SELECT 
  'Run each section above and share the results.' as instructions,
  'Pay special attention to functions with NO SEARCH PATH SET status.' as note1,
  'Look for handle_new_user in the trigger results.' as note2;