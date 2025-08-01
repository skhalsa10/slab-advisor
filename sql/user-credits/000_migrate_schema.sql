-- ============================================================================
-- USER CREDITS SCHEMA MIGRATION
-- Purpose: Update existing user_credits table to support separate free/purchased tracking
-- Safe to run multiple times (idempotent)
-- ============================================================================

BEGIN;

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add free_credits column (default 2 for new users)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_credits' 
                   AND column_name = 'free_credits') THEN
        ALTER TABLE user_credits ADD COLUMN free_credits INTEGER NOT NULL DEFAULT 2;
    END IF;
    
    -- Add purchased_credits column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_credits' 
                   AND column_name = 'purchased_credits') THEN
        ALTER TABLE user_credits ADD COLUMN purchased_credits INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add usage tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_credits' 
                   AND column_name = 'total_free_credits_used') THEN
        ALTER TABLE user_credits ADD COLUMN total_free_credits_used INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_credits' 
                   AND column_name = 'total_purchased_credits_used') THEN
        ALTER TABLE user_credits ADD COLUMN total_purchased_credits_used INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add monthly reset tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_credits' 
                   AND column_name = 'free_credits_reset_at') THEN
        ALTER TABLE user_credits ADD COLUMN free_credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month');
    END IF;
END $$;

-- Migrate existing data
-- Strategy: 
-- - First 2 credits are considered free credits
-- - Any credits above 2 are considered purchased
-- - Set next reset date to 1 month from account creation
UPDATE user_credits 
SET 
    free_credits = LEAST(COALESCE(credits_remaining, 0), 2),
    purchased_credits = GREATEST(COALESCE(credits_remaining, 0) - 2, 0),
    free_credits_reset_at = COALESCE(created_at, NOW()) + INTERVAL '1 month'
WHERE free_credits IS NULL OR purchased_credits IS NULL;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'free_credits_non_negative') THEN
        ALTER TABLE user_credits 
        ADD CONSTRAINT free_credits_non_negative CHECK (free_credits >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'purchased_credits_non_negative') THEN
        ALTER TABLE user_credits 
        ADD CONSTRAINT purchased_credits_non_negative CHECK (purchased_credits >= 0);
    END IF;
END $$;

-- Add computed column for backward compatibility (optional)
-- This maintains credits_remaining as the sum of free + purchased
DO $$
BEGIN
    -- First drop the column if it exists (it might have constraints)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'user_credits' 
               AND column_name = 'credits_remaining') THEN
        -- Update it to be a generated column
        ALTER TABLE user_credits DROP COLUMN credits_remaining;
        ALTER TABLE user_credits 
        ADD COLUMN credits_remaining INTEGER GENERATED ALWAYS AS (free_credits + purchased_credits) STORED;
    END IF;
END $$;

-- Create or replace the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification query - run this to check the migration
/*
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_credits'
ORDER BY ordinal_position;
*/