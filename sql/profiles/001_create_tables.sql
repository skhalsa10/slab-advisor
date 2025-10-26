-- ============================================================================
-- PROFILES TABLE DEFINITION
-- Purpose: User profiles with unique usernames for social features
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    -- Primary key for this profile
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Foreign key to auth.users (one-to-one relationship)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Public username (unique, lowercase, 3-30 chars)
    username TEXT UNIQUE NOT NULL,

    -- Optional profile fields (for future features)
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,

    -- Profile visibility (for future public profiles)
    is_public BOOLEAN NOT NULL DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_user_profile UNIQUE (user_id),
    CONSTRAINT username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-z0-9][a-z0-9_]*[a-z0-9]$'),
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);

-- Comments
COMMENT ON TABLE profiles IS 'User profiles with public usernames for social features and shareable collections';
COMMENT ON COLUMN profiles.id IS 'Primary key - used by future features like follows table';
COMMENT ON COLUMN profiles.user_id IS 'Foreign key to auth.users - links profile to authenticated user (one-to-one)';
COMMENT ON COLUMN profiles.username IS 'Unique username (3-30 chars, lowercase, alphanumeric + underscore, start/end with alphanumeric)';
COMMENT ON COLUMN profiles.display_name IS 'Optional display name (can contain spaces, special chars) - for future use';
COMMENT ON COLUMN profiles.is_public IS 'Whether profile is visible to other users - for future public profile pages';

-- Create trigger for updated_at (reuse existing function)
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
