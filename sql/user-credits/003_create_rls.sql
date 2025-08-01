-- ============================================================================
-- USER CREDITS ROW LEVEL SECURITY (RLS)
-- Purpose: Enforce strict READ-ONLY access for users, prevent all client modifications
-- 
-- SECURITY PRINCIPLE: Users can ONLY view their own credits. 
-- ALL modifications must go through secure server-side functions.
-- ============================================================================

-- Enable RLS on the user_credits table
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can create their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can delete their own credits" ON user_credits;
DROP POLICY IF EXISTS "Users read own credits only" ON user_credits;
DROP POLICY IF EXISTS "Block all client inserts" ON user_credits;
DROP POLICY IF EXISTS "Block all client updates" ON user_credits;
DROP POLICY IF EXISTS "Block all client deletes" ON user_credits;
DROP POLICY IF EXISTS "No client inserts allowed" ON user_credits;

-- ============================================================================
-- POLICY 1: READ ACCESS - Users can ONLY view their own credits
-- ============================================================================
CREATE POLICY "users_read_own_credits" ON user_credits
    FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON POLICY "users_read_own_credits" ON user_credits IS 
'Allows users to view only their own credit balance and history';

-- ============================================================================
-- POLICY 2: BLOCK ALL INSERTS - No client can create credit records
-- ============================================================================
CREATE POLICY "block_all_client_inserts" ON user_credits
    FOR INSERT
    WITH CHECK (false);

COMMENT ON POLICY "block_all_client_inserts" ON user_credits IS 
'Prevents all client-side inserts. Credits are created only by database trigger on user signup';

-- ============================================================================
-- POLICY 3: BLOCK ALL UPDATES - No client can modify credit records
-- ============================================================================
CREATE POLICY "block_all_client_updates" ON user_credits
    FOR UPDATE
    USING (false)
    WITH CHECK (false);

COMMENT ON POLICY "block_all_client_updates" ON user_credits IS 
'Prevents all client-side updates. Credits can only be modified through secure server functions';

-- ============================================================================
-- POLICY 4: BLOCK ALL DELETES - No client can delete credit records
-- ============================================================================
CREATE POLICY "block_all_client_deletes" ON user_credits
    FOR DELETE
    USING (false);

COMMENT ON POLICY "block_all_client_deletes" ON user_credits IS 
'Prevents all client-side deletes. Credit records should never be deleted';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. All credit initialization happens via database trigger on auth.users insert
-- 2. All credit deductions happen via secure function: deduct_user_credit()
-- 3. All credit additions happen via secure function: add_purchased_credits()
-- 4. Monthly reset happens via scheduled function: reset_monthly_free_credits()
-- 5. Client applications can ONLY read credit balances, never modify them

-- Verify RLS is enabled and policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'user_credits'
ORDER BY policyname;