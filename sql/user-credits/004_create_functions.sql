-- ============================================================================
-- USER CREDITS SERVER-SIDE FUNCTIONS
-- Purpose: Secure server-side functions for all credit operations
-- 
-- These functions run with SECURITY DEFINER to bypass RLS and perform
-- authorized operations that clients cannot do directly.
-- ============================================================================

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS public.deduct_user_credit(uuid);
DROP FUNCTION IF EXISTS public.add_user_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.initialize_user_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.initialize_user_credits(uuid);
DROP FUNCTION IF EXISTS public.get_user_credit_details(uuid);
DROP FUNCTION IF EXISTS public.reset_monthly_free_credits();
DROP FUNCTION IF EXISTS public.add_purchased_credits(uuid, integer, text);

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.initialize_user_credits_on_signup();

-- ============================================================================
-- FUNCTION 1: Initialize credits for new users (called by trigger)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.initialize_user_credits_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create initial credit record for new user
    INSERT INTO user_credits (
        user_id, 
        free_credits, 
        purchased_credits,
        free_credits_reset_at
    ) VALUES (
        NEW.id, 
        2,  -- New users get 2 free credits
        0,  -- No purchased credits initially
        NOW() + INTERVAL '1 month'  -- Reset in 1 month
    )
    ON CONFLICT (user_id) DO NOTHING;  -- Ignore if already exists
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create user credits for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

COMMENT ON FUNCTION initialize_user_credits_on_signup() IS 
'Automatically creates credit record when new user signs up. Called by trigger on auth.users.';

-- Create trigger for automatic credit initialization
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.initialize_user_credits_on_signup();

-- ============================================================================
-- FUNCTION 2: Deduct credits (uses free credits first, then purchased)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.deduct_user_credit(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB;
    v_free_credits INTEGER;
    v_purchased_credits INTEGER;
    v_updated BOOLEAN := false;
BEGIN
    -- Lock the row for update to prevent race conditions
    SELECT free_credits, purchased_credits 
    INTO v_free_credits, v_purchased_credits
    FROM user_credits 
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if user exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User credits not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Check if user has any credits
    IF (v_free_credits + v_purchased_credits) <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits',
            'error_code', 'INSUFFICIENT_CREDITS',
            'free_credits', v_free_credits,
            'purchased_credits', v_purchased_credits
        );
    END IF;
    
    -- Deduct from free credits first
    IF v_free_credits > 0 THEN
        UPDATE user_credits 
        SET 
            free_credits = free_credits - 1,
            total_free_credits_used = total_free_credits_used + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        v_free_credits := v_free_credits - 1;
        v_updated := true;
    ELSE
        -- Deduct from purchased credits
        UPDATE user_credits 
        SET 
            purchased_credits = purchased_credits - 1,
            total_purchased_credits_used = total_purchased_credits_used + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        v_purchased_credits := v_purchased_credits - 1;
        v_updated := true;
    END IF;
    
    -- Return success with updated balances
    RETURN jsonb_build_object(
        'success', true,
        'free_credits', v_free_credits,
        'purchased_credits', v_purchased_credits,
        'total_credits', v_free_credits + v_purchased_credits,
        'deducted_from', CASE WHEN v_free_credits >= 0 THEN 'free' ELSE 'purchased' END
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Database error occurred',
            'error_code', 'DATABASE_ERROR',
            'details', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION deduct_user_credit(UUID) IS 
'Safely deducts one credit from user balance. Uses free credits first, then purchased credits.';

-- ============================================================================
-- FUNCTION 3: Reset monthly free credits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reset_monthly_free_credits()
RETURNS TABLE(user_id UUID, credits_reset INTEGER)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Reset free credits for all eligible users
    RETURN QUERY
    UPDATE user_credits
    SET 
        free_credits = 2,
        free_credits_reset_at = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE 
        free_credits_reset_at <= NOW()
        AND free_credits < 2
    RETURNING 
        user_credits.user_id,
        2 as credits_reset;
END;
$$;

COMMENT ON FUNCTION reset_monthly_free_credits() IS 
'Resets free credits to 2 for all users whose reset date has passed. Returns list of reset users.';

-- ============================================================================
-- FUNCTION 4: Add purchased credits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_purchased_credits(
    p_user_id UUID, 
    p_credits INTEGER,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    -- Validate inputs
    IF p_credits <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Credit amount must be positive',
            'error_code', 'INVALID_AMOUNT'
        );
    END IF;
    
    -- Add credits and get new balance
    UPDATE user_credits
    SET 
        purchased_credits = purchased_credits + p_credits,
        total_credits_purchased = total_credits_purchased + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING purchased_credits INTO v_new_balance;
    
    -- Check if user was found
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User credits not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Log the transaction if ID provided
    IF p_transaction_id IS NOT NULL THEN
        -- You could log this to a separate transactions table
        RAISE NOTICE 'Credits purchase: user=%, credits=%, transaction=%', 
                     p_user_id, p_credits, p_transaction_id;
    END IF;
    
    -- Return success with new balance
    RETURN jsonb_build_object(
        'success', true,
        'credits_added', p_credits,
        'new_purchased_balance', v_new_balance,
        'transaction_id', p_transaction_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Database error occurred',
            'error_code', 'DATABASE_ERROR',
            'details', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION add_purchased_credits(UUID, INTEGER, TEXT) IS 
'Adds purchased credits to user account. Called after successful payment processing.';

-- ============================================================================
-- FUNCTION 5: Get user credit details (read-only helper)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_credit_details(p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_credits RECORD;
BEGIN
    SELECT 
        free_credits,
        purchased_credits,
        free_credits + purchased_credits as total_credits,
        total_free_credits_used,
        total_purchased_credits_used,
        total_credits_purchased,
        free_credits_reset_at,
        CASE 
            WHEN free_credits_reset_at > NOW() 
            THEN EXTRACT(EPOCH FROM (free_credits_reset_at - NOW()))::INTEGER
            ELSE 0 
        END as seconds_until_reset
    INTO v_credits
    FROM user_credits
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        -- User has no credits record (shouldn't happen with trigger)
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No credit record found',
            'free_credits', 0,
            'purchased_credits', 0,
            'total_credits', 0
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'free_credits', v_credits.free_credits,
        'purchased_credits', v_credits.purchased_credits,
        'total_credits', v_credits.total_credits,
        'usage', jsonb_build_object(
            'free_used', v_credits.total_free_credits_used,
            'purchased_used', v_credits.total_purchased_credits_used,
            'lifetime_purchased', v_credits.total_credits_purchased
        ),
        'next_free_reset', v_credits.free_credits_reset_at,
        'seconds_until_reset', v_credits.seconds_until_reset
    );
END;
$$;

COMMENT ON FUNCTION get_user_credit_details(UUID) IS 
'Returns detailed credit information for a user including usage stats and reset timer.';

-- ============================================================================
-- SCHEDULED JOB: Reset free credits daily
-- Note: This needs to be set up in your Supabase dashboard or via pg_cron
-- ============================================================================
-- Example pg_cron job (run in Supabase SQL editor if pg_cron is enabled):
/*
SELECT cron.schedule(
    'reset-monthly-credits',  -- Job name
    '0 0 * * *',             -- Run daily at midnight
    $$SELECT public.reset_monthly_free_credits();$$
);
*/