-- ============================================================================
-- PROFILES SERVER-SIDE FUNCTIONS
-- Purpose: Secure server-side functions for profile operations
--
-- These functions run with SECURITY DEFINER to bypass RLS and perform
-- authorized operations that clients cannot do directly.
-- ============================================================================

DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text);
DROP FUNCTION IF EXISTS public.check_username_available(text);

-- ============================================================================
-- FUNCTION 1: Create user profile with validation
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_username TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_profile_id UUID;
    v_clean_username TEXT;
BEGIN
    -- Clean and lowercase username
    v_clean_username := LOWER(TRIM(p_username));

    -- Validate username format (alphanumeric + underscore, start/end with alphanumeric)
    IF NOT (v_clean_username ~ '^[a-z0-9][a-z0-9_]*[a-z0-9]$') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Username can only contain letters, numbers, and underscores. Must start and end with a letter or number.',
            'error_code', 'INVALID_FORMAT'
        );
    END IF;

    -- Validate username length
    IF LENGTH(v_clean_username) < 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Username must be at least 3 characters',
            'error_code', 'TOO_SHORT'
        );
    END IF;

    IF LENGTH(v_clean_username) > 30 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Username must be no more than 30 characters',
            'error_code', 'TOO_LONG'
        );
    END IF;

    -- Check for reserved usernames (expanded list)
    IF v_clean_username IN (
        -- System accounts
        'admin', 'root', 'support', 'api', 'www', 'app',
        'mail', 'help', 'ftp', 'blog', 'shop', 'store',
        'administrator', 'mod', 'moderator', 'owner', 'staff',
        'team', 'official', 'verified', 'system', 'bot',
        'null', 'undefined', 'none', 'anonymous', 'guest',
        'test', 'demo', 'example', 'sample',

        -- Application routes
        'about', 'terms', 'privacy', 'contact', 'dashboard',
        'collection', 'browse', 'search', 'login', 'signup',
        'auth', 'account', 'settings', 'profile', 'user',
        'explore', 'discover', 'trending', 'popular',

        -- Application-specific
        'slabadvisor', 'slab', 'advisor', 'cards', 'card',
        'grade', 'grading', 'pricing', 'marketplace', 'market',

        -- Security-related
        'security', 'abuse', 'phishing', 'scam', 'fraud',
        'report', 'verify', 'confirm', 'reset', 'recover',

        -- Future features
        'public', 'private', 'pro', 'premium', 'subscription',
        'billing', 'payment', 'checkout', 'cart', 'shop'
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This username is reserved',
            'error_code', 'RESERVED_USERNAME'
        );
    END IF;

    -- FIXED: Use INSERT ON CONFLICT to handle race conditions atomically
    -- This eliminates the TOCTOU vulnerability between check and insert
    INSERT INTO profiles (user_id, username)
    VALUES (p_user_id, v_clean_username)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_profile_id;

    -- Check if insert succeeded or was skipped due to conflict
    IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unable to create profile',
            'error_code', 'CREATION_FAILED'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'profile_id', v_profile_id,
        'username', v_clean_username
    );

EXCEPTION
    WHEN unique_violation THEN
        -- This handles username uniqueness conflicts
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Username already taken',
            'error_code', 'USERNAME_TAKEN'
        );
    WHEN foreign_key_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unable to create profile',
            'error_code', 'CREATION_FAILED'
        );
    WHEN OTHERS THEN
        -- Log error but don't expose details to client
        RAISE WARNING 'Error creating profile for user %: %', p_user_id, SQLERRM;
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unable to create profile',
            'error_code', 'CREATION_FAILED'
        );
END;
$$;

COMMENT ON FUNCTION create_user_profile(UUID, TEXT) IS
'Creates a profile for a user with the given username. Validates format, length, reserved words, and uniqueness. Uses INSERT ON CONFLICT for race condition protection. SECURITY DEFINER bypasses RLS to allow inserts.';

-- ============================================================================
-- FUNCTION 2: Check username availability
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_clean_username TEXT;
BEGIN
    -- Clean and lowercase username
    v_clean_username := LOWER(TRIM(p_username));

    -- Check if username exists (case-insensitive)
    RETURN NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE username = v_clean_username
    );
END;
$$;

COMMENT ON FUNCTION check_username_available(TEXT) IS
'Returns true if username is available (case-insensitive check). Used for real-time availability checking. Should be called only by authenticated users.';
