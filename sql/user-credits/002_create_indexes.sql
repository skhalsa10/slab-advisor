-- ============================================================================
-- USER CREDITS INDEXES
-- Purpose: Optimize query performance for common access patterns
-- ============================================================================

-- Primary lookup pattern: find credits by user_id
-- This is the most common query pattern
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id 
    ON user_credits(user_id);

-- For the monthly reset job: find users who need free credits reset
-- Partial index only includes users who haven't maxed out free credits
CREATE INDEX IF NOT EXISTS idx_user_credits_reset_needed 
    ON user_credits(free_credits_reset_at) 
    WHERE free_credits < 2;

-- For analytics: users who have made purchases
-- Partial index for users with any purchase history
CREATE INDEX IF NOT EXISTS idx_user_credits_purchasers 
    ON user_credits(total_credits_purchased) 
    WHERE total_credits_purchased > 0;

-- For monitoring: users with low credits
-- Helps identify users who might need to purchase credits soon
CREATE INDEX IF NOT EXISTS idx_user_credits_low_balance 
    ON user_credits(credits_remaining) 
    WHERE credits_remaining <= 5;

-- For usage analytics: heavy users
-- Track users who have used many credits
CREATE INDEX IF NOT EXISTS idx_user_credits_heavy_users 
    ON user_credits(total_free_credits_used, total_purchased_credits_used) 
    WHERE (total_free_credits_used + total_purchased_credits_used) > 10;

-- Compound index for credit deduction queries
-- Optimizes the common pattern of checking both free and purchased credits
CREATE INDEX IF NOT EXISTS idx_user_credits_balances 
    ON user_credits(user_id, free_credits, purchased_credits);

-- Add index statistics comments
COMMENT ON INDEX idx_user_credits_user_id IS 'Primary lookup by user_id';
COMMENT ON INDEX idx_user_credits_reset_needed IS 'Users needing monthly free credit reset';
COMMENT ON INDEX idx_user_credits_purchasers IS 'Users who have purchased credits';
COMMENT ON INDEX idx_user_credits_low_balance IS 'Users with 5 or fewer credits remaining';
COMMENT ON INDEX idx_user_credits_heavy_users IS 'Users who have consumed more than 10 total credits';
COMMENT ON INDEX idx_user_credits_balances IS 'Optimizes credit balance checks during deduction';