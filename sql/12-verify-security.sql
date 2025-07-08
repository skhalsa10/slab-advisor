-- ============================================================================
-- VERIFY SECURITY FIXES
-- Purpose: Check if the security fixes were applied correctly
-- ============================================================================

-- Check current status of our functions
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN 'No config'
    WHEN p.proconfig @> ARRAY['search_path=""'] THEN 'FIXED - Has empty search_path'
    WHEN p.proconfig::text LIKE '%search_path%' THEN 'Has search_path: ' || p.proconfig::text
    ELSE 'NO SEARCH PATH SET'
  END as search_path_status,
  p.proconfig as raw_config
FROM pg_proc p
WHERE p.proname IN (
  'handle_new_user',
  'prevent_grade_tampering', 
  'deduct_user_credit',
  'add_user_credits',
  'initialize_user_credits'
)
ORDER BY p.proname;

-- Double check by looking at the actual function definitions
SELECT 
  proname,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%SET search_path%' THEN 'Has SET search_path in definition'
    ELSE 'NO SET search_path in definition'
  END as has_search_path_set
FROM pg_proc
WHERE proname IN (
  'handle_new_user',
  'prevent_grade_tampering',
  'deduct_user_credit', 
  'add_user_credits',
  'initialize_user_credits'
);