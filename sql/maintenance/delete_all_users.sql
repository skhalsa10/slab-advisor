-- ============================================================================
-- DELETE ALL USERS - USE WITH CAUTION!
-- Purpose: Clean up test users during development
--
-- WARNING: This will DELETE ALL USERS and their data
-- Only run this in development/testing environments!
-- ============================================================================

-- Step 1: View what will be deleted (RUN THIS FIRST)
SELECT
    u.id,
    u.email,
    u.created_at,
    uc.credits_remaining,
    COUNT(DISTINCT cc.id) as cards_count,
    p.username
FROM auth.users u
LEFT JOIN user_credits uc ON u.id = uc.user_id
LEFT JOIN collection_cards cc ON u.id = cc.user_id
LEFT JOIN profiles p ON u.id = p.user_id
GROUP BY u.id, u.email, u.created_at, uc.credits_remaining, p.username
ORDER BY u.created_at DESC;

-- Step 2: Delete all users (DANGEROUS - ONLY RUN IF YOU'RE SURE!)
-- Uncomment the line below to actually delete:
-- DELETE FROM auth.users;

-- Note: CASCADE deletes will automatically remove:
-- - user_credits (user_id foreign key with ON DELETE CASCADE)
-- - collection_cards (user_id foreign key with ON DELETE CASCADE)
-- - profiles (user_id foreign key with ON DELETE CASCADE)
