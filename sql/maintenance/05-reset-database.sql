-- ============================================================================
-- COMPLETE DATABASE RESET SCRIPT
-- Purpose: Drop everything and start completely fresh
-- Usage: Run in Supabase SQL Editor for complete reset
-- WARNING: This destroys ALL structure and data! Only use for complete reset.
-- ============================================================================

-- WARNING MESSAGE
SELECT '⚠️  WARNING: This will completely destroy the database!' as warning;
SELECT 'This script drops ALL tables, functions, triggers, and policies.' as warning;
SELECT 'Only run this if you want to start completely from scratch.' as warning;
SELECT 'You will need to run the setup scripts again after this.' as warning;

-- Uncomment the lines below ONLY if you really want to reset everything:

/*

-- Drop all triggers first
DROP TRIGGER IF EXISTS prevent_user_grade_tampering ON cards;

-- Drop all policies
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can update safe card fields" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
DROP POLICY IF EXISTS "Service can update analysis results" ON cards;
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Service manages all credits" ON user_credits;

-- Drop storage policies
DROP POLICY IF EXISTS "Users can upload restricted card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own card images" ON storage.objects;
DROP POLICY IF EXISTS "Service can manage card storage" ON storage.objects;

-- Drop all functions
DROP FUNCTION IF EXISTS prevent_grade_tampering();
DROP FUNCTION IF EXISTS deduct_user_credit(uuid);
DROP FUNCTION IF EXISTS add_user_credits(uuid, integer);
DROP FUNCTION IF EXISTS initialize_user_credits(uuid, integer);
DROP FUNCTION IF EXISTS initialize_user_credits(uuid);

-- Drop all tables (this will also drop their data)
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'card-images';

-- Drop all indexes (they'll be dropped with tables anyway, but being explicit)
DROP INDEX IF EXISTS idx_cards_user_id;
DROP INDEX IF EXISTS idx_user_credits_user_id;
DROP INDEX IF EXISTS idx_cards_user_id_optimized;
DROP INDEX IF EXISTS idx_user_credits_user_id_optimized;
DROP INDEX IF EXISTS idx_cards_created_at;
DROP INDEX IF EXISTS idx_cards_user_created;
DROP INDEX IF EXISTS idx_user_credits_lookup;

SELECT 'RESET_COMPLETE' as status, 'Database has been completely reset. You need to run setup scripts now.' as message;

*/

-- If you uncommented and ran the above, you'll need to run these setup scripts in order:
-- 1. First create your tables (you'll need to create a table creation script)
-- 2. Then run: sql/06-setup-secure.sql
-- 3. Then run: sql/07-performance-optimize.sql

SELECT 'RESET_READY' as status, 'Uncomment the code above to perform complete reset' as message;