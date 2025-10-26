-- ============================================================================
-- PROFILES ROW LEVEL SECURITY (RLS)
-- Purpose: Defense-in-depth security for profiles table
--
-- SECURITY PRINCIPLE:
-- - Users can READ their own profile
-- - Users can READ public profiles (future feature)
-- - Users can UPDATE their own profile
-- - ALL inserts go through secure database functions (SECURITY DEFINER)
-- - NO deletes allowed (profiles are permanent)
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "anyone_read_public_profiles" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "block_direct_inserts" ON profiles;
DROP POLICY IF EXISTS "block_direct_deletes" ON profiles;

-- ============================================================================
-- POLICY 1: Users can read their own profile
-- ============================================================================
CREATE POLICY "users_read_own_profile" ON profiles
    FOR SELECT
    USING (auth.uid() = user_id);

COMMENT ON POLICY "users_read_own_profile" ON profiles IS
'Allows users to view their own profile data';

-- ============================================================================
-- POLICY 2: Anyone can read public profiles (for future features)
-- ============================================================================
CREATE POLICY "anyone_read_public_profiles" ON profiles
    FOR SELECT
    USING (is_public = true);

COMMENT ON POLICY "anyone_read_public_profiles" ON profiles IS
'Allows anyone to view public profiles (for future /u/[username] pages)';

-- ============================================================================
-- POLICY 3: Users can update their own profile
-- ============================================================================
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "users_update_own_profile" ON profiles IS
'Allows users to update their own profile (username, bio, avatar, etc.)';

-- ============================================================================
-- POLICY 4: Block all direct inserts (use database functions only)
-- ============================================================================
CREATE POLICY "block_direct_inserts" ON profiles
    FOR INSERT
    WITH CHECK (false);

COMMENT ON POLICY "block_direct_inserts" ON profiles IS
'Prevents all direct client inserts. Profiles must be created via create_user_profile() function which validates username rules.';

-- ============================================================================
-- POLICY 5: Block all deletes (profiles are permanent)
-- ============================================================================
CREATE POLICY "block_direct_deletes" ON profiles
    FOR DELETE
    USING (false);

COMMENT ON POLICY "block_direct_deletes" ON profiles IS
'Prevents all profile deletions. Profiles should never be deleted, only marked inactive if needed.';

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
    AND tablename = 'profiles'
ORDER BY policyname;
