-- ============================================================================
-- USER MANAGEMENT SCRIPT
-- Purpose: Helper functions for managing users and their data
-- Usage: Run specific sections as needed for user management
-- ============================================================================

-- ============================================================================
-- VIEW USER INFORMATION
-- ============================================================================

-- Show all users and their credit status
SELECT 
    'USER_OVERVIEW' as info_type,
    uc.user_id,
    uc.credits_remaining,
    uc.total_credits_purchased,
    COUNT(c.id) as total_cards,
    COUNT(CASE WHEN c.estimated_grade IS NOT NULL THEN 1 END) as analyzed_cards,
    uc.created_at as user_since
FROM user_credits uc
LEFT JOIN cards c ON uc.user_id = c.user_id
GROUP BY uc.user_id, uc.credits_remaining, uc.total_credits_purchased, uc.created_at
ORDER BY uc.created_at DESC;

-- Show detailed card information by user
SELECT 
    'USER_CARDS' as info_type,
    c.user_id,
    c.id as card_id,
    c.card_title,
    c.estimated_grade,
    c.confidence,
    c.created_at,
    CASE 
        WHEN c.estimated_grade IS NOT NULL THEN 'Analyzed'
        ELSE 'Pending'
    END as status
FROM cards c
ORDER BY c.user_id, c.created_at DESC;

-- ============================================================================
-- ADD CREDITS TO USER
-- ============================================================================

-- Example: Add 10 credits to a specific user
-- Replace 'USER_ID_HERE' with actual user ID
/*
SELECT add_user_credits('USER_ID_HERE'::uuid, 10) as credits_added;
*/

-- ============================================================================
-- RESET USER DATA
-- ============================================================================

-- Function to completely remove a user and all their data
-- WARNING: This permanently deletes all user data!
CREATE OR REPLACE FUNCTION remove_user_completely(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cards_deleted INTEGER;
    credits_deleted INTEGER;
BEGIN
    -- Delete all user's cards
    DELETE FROM cards WHERE user_id = target_user_id;
    GET DIAGNOSTICS cards_deleted = ROW_COUNT;
    
    -- Delete user's credit record
    DELETE FROM user_credits WHERE user_id = target_user_id;
    GET DIAGNOSTICS credits_deleted = ROW_COUNT;
    
    -- Log the deletion
    RAISE NOTICE 'User % removed: % cards deleted, % credit records deleted', 
                 target_user_id, cards_deleted, credits_deleted;
    
    RETURN TRUE;
END;
$$;

-- Example: Remove a specific user (uncomment and replace USER_ID)
/*
SELECT remove_user_completely('USER_ID_HERE'::uuid) as user_removed;
*/

-- ============================================================================
-- RESET SPECIFIC USER'S CREDITS
-- ============================================================================

-- Function to reset a user's credits to default (2 free credits)
CREATE OR REPLACE FUNCTION reset_user_credits(target_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_credits 
    SET credits_remaining = 2,
        total_credits_purchased = 0,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- If user doesn't exist, create them with default credits
    IF NOT FOUND THEN
        INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased, created_at, updated_at)
        VALUES (target_user_id, 2, 0, NOW(), NOW());
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Example: Reset credits for a user (uncomment and replace USER_ID)
/*
SELECT reset_user_credits('USER_ID_HERE'::uuid) as credits_reset;
*/

-- ============================================================================
-- BULK USER OPERATIONS
-- ============================================================================

-- Remove all test users (users with fake UUIDs)
CREATE OR REPLACE FUNCTION remove_test_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    users_removed INTEGER;
BEGIN
    -- Remove test users (those with repeated digits in UUID)
    DELETE FROM cards WHERE user_id::text LIKE '%1111%' OR user_id::text LIKE '%2222%' OR user_id::text LIKE '%3333%';
    DELETE FROM user_credits WHERE user_id::text LIKE '%1111%' OR user_id::text LIKE '%2222%' OR user_id::text LIKE '%3333%';
    
    GET DIAGNOSTICS users_removed = ROW_COUNT;
    RETURN users_removed;
END;
$$;

-- Example: Remove all test users
/*
SELECT remove_test_users() as test_users_removed;
*/

-- ============================================================================
-- USER STATISTICS
-- ============================================================================

-- Show comprehensive user statistics
SELECT 
    'USER_STATS' as stat_type,
    COUNT(DISTINCT uc.user_id) as total_users,
    SUM(uc.credits_remaining) as total_credits_remaining,
    SUM(uc.total_credits_purchased) as total_credits_purchased,
    COUNT(c.id) as total_cards,
    COUNT(CASE WHEN c.estimated_grade IS NOT NULL THEN 1 END) as total_analyzed_cards,
    ROUND(AVG(c.estimated_grade), 2) as average_grade
FROM user_credits uc
LEFT JOIN cards c ON uc.user_id = c.user_id;

-- Show user activity by day
SELECT 
    'DAILY_ACTIVITY' as stat_type,
    DATE(c.created_at) as activity_date,
    COUNT(DISTINCT c.user_id) as active_users,
    COUNT(c.id) as cards_uploaded,
    COUNT(CASE WHEN c.estimated_grade IS NOT NULL THEN 1 END) as cards_analyzed
FROM cards c
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(c.created_at)
ORDER BY activity_date DESC;

-- ============================================================================
-- CLEANUP ORPHANED DATA
-- ============================================================================

-- Find and optionally clean up orphaned data
SELECT 
    'ORPHANED_DATA_CHECK' as check_type,
    'cards_without_user_credits' as issue,
    COUNT(*) as count
FROM cards c
LEFT JOIN user_credits uc ON c.user_id = uc.user_id
WHERE uc.user_id IS NULL

UNION ALL

SELECT 
    'ORPHANED_DATA_CHECK',
    'user_credits_without_auth_users',
    COUNT(*)
FROM user_credits uc
WHERE uc.user_id NOT IN (
    -- Note: In real Supabase, you'd check against auth.users
    -- This is a placeholder check
    SELECT DISTINCT user_id FROM cards
);

-- Function to clean up orphaned cards (cards without user_credits)
CREATE OR REPLACE FUNCTION cleanup_orphaned_cards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cards_removed INTEGER;
BEGIN
    DELETE FROM cards 
    WHERE user_id NOT IN (SELECT user_id FROM user_credits);
    
    GET DIAGNOSTICS cards_removed = ROW_COUNT;
    RETURN cards_removed;
END;
$$;

-- Example: Clean up orphaned cards
/*
SELECT cleanup_orphaned_cards() as orphaned_cards_removed;
*/

SELECT 'USER_MANAGEMENT_READY' as status, 'User management functions are available' as message;