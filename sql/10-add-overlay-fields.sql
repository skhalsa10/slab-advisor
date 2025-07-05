-- ============================================================================
-- ADD OVERLAY IMAGE FIELDS TO CARDS TABLE
-- Purpose: Store URLs for Ximilar grading overlay images
-- Usage: Run in Supabase SQL Editor
-- ============================================================================

-- Add overlay image URL fields to cards table
ALTER TABLE cards 
ADD COLUMN IF NOT EXISTS front_full_overlay_url TEXT,
ADD COLUMN IF NOT EXISTS front_exact_overlay_url TEXT,
ADD COLUMN IF NOT EXISTS back_full_overlay_url TEXT,
ADD COLUMN IF NOT EXISTS back_exact_overlay_url TEXT;

-- Verify the new columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cards' 
AND column_name IN ('front_full_overlay_url', 'front_exact_overlay_url', 'back_full_overlay_url', 'back_exact_overlay_url')
ORDER BY column_name;

-- Show result
SELECT 'OVERLAY_FIELDS_ADDED' as status, 'Added overlay image URL fields to cards table' as message;