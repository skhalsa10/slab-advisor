-- ============================================================================
-- USER CREDITS TABLE DEFINITION
-- Purpose: Complete schema for user credits with separate free/purchased tracking
-- Note: This assumes you're creating from scratch. If table exists, use migration script.
-- ============================================================================

-- Drop existing table if doing a full recreate (be careful with this in production!)
-- DROP TABLE IF EXISTS user_credits CASCADE;

-- Create the user_credits table with enhanced schema
CREATE TABLE IF NOT EXISTS user_credits (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User reference (cascades on user deletion)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Credit balances
    free_credits INTEGER NOT NULL DEFAULT 2,
    purchased_credits INTEGER NOT NULL DEFAULT 0,
    
    -- Usage tracking for analytics
    total_free_credits_used INTEGER NOT NULL DEFAULT 0,
    total_purchased_credits_used INTEGER NOT NULL DEFAULT 0,
    total_credits_purchased INTEGER NOT NULL DEFAULT 0,
    
    -- Monthly reset tracking
    free_credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Computed column for total available credits (backward compatibility)
    credits_remaining INTEGER GENERATED ALWAYS AS (free_credits + purchased_credits) STORED,
    
    -- Constraints
    CONSTRAINT free_credits_non_negative CHECK (free_credits >= 0),
    CONSTRAINT purchased_credits_non_negative CHECK (purchased_credits >= 0),
    CONSTRAINT total_free_used_non_negative CHECK (total_free_credits_used >= 0),
    CONSTRAINT total_purchased_used_non_negative CHECK (total_purchased_credits_used >= 0),
    CONSTRAINT total_purchased_non_negative CHECK (total_credits_purchased >= 0),
    CONSTRAINT unique_user_credits UNIQUE (user_id)
);

-- Add helpful comments to columns
COMMENT ON TABLE user_credits IS 'Tracks user credit balances with separate free and purchased credits';
COMMENT ON COLUMN user_credits.free_credits IS 'Current balance of free monthly credits (resets monthly)';
COMMENT ON COLUMN user_credits.purchased_credits IS 'Current balance of purchased credits (never expires)';
COMMENT ON COLUMN user_credits.total_free_credits_used IS 'Lifetime count of free credits consumed';
COMMENT ON COLUMN user_credits.total_purchased_credits_used IS 'Lifetime count of purchased credits consumed';
COMMENT ON COLUMN user_credits.total_credits_purchased IS 'Lifetime count of credits purchased by user';
COMMENT ON COLUMN user_credits.free_credits_reset_at IS 'Next date/time when free credits will reset to 2';
COMMENT ON COLUMN user_credits.credits_remaining IS 'Total credits available (free + purchased) - computed column';

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();