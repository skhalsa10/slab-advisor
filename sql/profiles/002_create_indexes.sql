-- ============================================================================
-- PROFILES TABLE INDEXES
-- Purpose: Optimize queries for profile lookups
-- ============================================================================

-- Index on user_id for fast lookup of "get my profile"
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Index on username for fast lookup of "find user by username"
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Index on is_public for future feature: "list all public profiles"
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public) WHERE is_public = true;

COMMENT ON INDEX idx_profiles_user_id IS 'Fast lookup for authenticated user profile queries';
COMMENT ON INDEX idx_profiles_username IS 'Fast lookup for username-based queries (public profiles, mentions)';
COMMENT ON INDEX idx_profiles_is_public IS 'Partial index for public profile listings (future feature)';
