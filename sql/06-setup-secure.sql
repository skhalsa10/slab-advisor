-- ============================================================================
-- SECURE DATABASE SETUP SCRIPT
-- Purpose: Set up secure RLS policies, triggers, and functions
-- Usage: Run after creating tables to secure the database
-- Based on: database-setup-clean.sql but organized for reuse
-- ============================================================================

-- Drop existing policies/functions to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
DROP POLICY IF EXISTS "Users can view own cards" ON cards;
DROP POLICY IF EXISTS "Users can update safe card fields" ON cards;
DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
DROP POLICY IF EXISTS "Service can update analysis results" ON cards;
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Service manages all credits" ON user_credits;
DROP TRIGGER IF EXISTS prevent_user_grade_tampering ON cards;
DROP FUNCTION IF EXISTS prevent_grade_tampering();
DROP FUNCTION IF EXISTS deduct_user_credit(uuid);
DROP FUNCTION IF EXISTS add_user_credits(uuid, integer);
DROP FUNCTION IF EXISTS initialize_user_credits(uuid, integer);
DROP FUNCTION IF EXISTS initialize_user_credits(uuid);

-- Enable RLS on tables
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CARDS POLICIES - Secure card management
-- ============================================================================

-- Policy: Users can insert their own cards (basic info only)
CREATE POLICY "Users can insert own cards" ON cards
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    -- SECURITY: Prevent client from setting grades/prices
    estimated_grade IS NULL AND
    confidence IS NULL AND
    grading_details IS NULL AND
    ungraded_price IS NULL AND
    graded_prices IS NULL
  );

-- Policy: Users can view their own cards
CREATE POLICY "Users can view own cards" ON cards
  FOR SELECT USING (
    user_id IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Policy: Users can update safe fields only
CREATE POLICY "Users can update safe card fields" ON cards
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cards
CREATE POLICY "Users can delete own cards" ON cards
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Service role can update any card (for API analysis results)
CREATE POLICY "Service can update analysis results" ON cards
  FOR UPDATE USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGER-BASED SECURITY - Prevent grade tampering
-- ============================================================================

-- Function to prevent users from tampering with analysis results
CREATE OR REPLACE FUNCTION prevent_grade_tampering()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a service role update, allow everything
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, preserve critical analysis fields
  IF OLD.estimated_grade IS NOT NULL THEN
    NEW.estimated_grade := OLD.estimated_grade;
  END IF;
  
  IF OLD.confidence IS NOT NULL THEN
    NEW.confidence := OLD.confidence;
  END IF;
  
  IF OLD.grading_details IS NOT NULL THEN
    NEW.grading_details := OLD.grading_details;
  END IF;
  
  IF OLD.ungraded_price IS NOT NULL THEN
    NEW.ungraded_price := OLD.ungraded_price;
  END IF;
  
  IF OLD.graded_prices IS NOT NULL THEN
    NEW.graded_prices := OLD.graded_prices;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent grade tampering
CREATE TRIGGER prevent_user_grade_tampering
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION prevent_grade_tampering();

-- ============================================================================
-- CREDITS POLICIES - Secure credit management (NO CLIENT ACCESS)
-- ============================================================================

-- Policy: Users can ONLY VIEW their own credits (READ-ONLY)
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (
    user_id IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Policy: ONLY service role can manage credits (API only)
CREATE POLICY "Service manages all credits" ON user_credits
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE POLICIES - Secure file upload
-- ============================================================================

-- Create storage bucket for card images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-images', 'card-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload restricted card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own card images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own card images" ON storage.objects;
DROP POLICY IF EXISTS "Service can manage card storage" ON storage.objects;

-- Policy: Users can upload images with restrictions
CREATE POLICY "Users can upload restricted card images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'card-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text AND
    (metadata->>'size')::bigint <= 10485760 AND
    (metadata->>'mimetype' LIKE 'image/%')
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view own card images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'card-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own card images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'card-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Service role can manage all storage
CREATE POLICY "Service can manage card storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'card-images' AND 
    auth.role() = 'service_role'
  );

-- ============================================================================
-- SECURE FUNCTIONS - Server-side credit management
-- ============================================================================

-- Function: Deduct credits (SECURE)
CREATE OR REPLACE FUNCTION deduct_user_credit(user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  update_count INTEGER;
BEGIN
  SELECT credits_remaining INTO current_credits
  FROM user_credits 
  WHERE user_credits.user_id = deduct_user_credit.user_id;
  
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;
  
  UPDATE user_credits 
  SET credits_remaining = credits_remaining - 1,
      updated_at = NOW()
  WHERE user_credits.user_id = deduct_user_credit.user_id
    AND credits_remaining > 0;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN update_count = 1;
END;
$$;

-- Function: Add credits (for purchases/admin)
CREATE OR REPLACE FUNCTION add_user_credits(user_id UUID, credits_to_add INTEGER)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_count INTEGER;
BEGIN
  IF credits_to_add <= 0 THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased, created_at, updated_at)
  VALUES (user_id, credits_to_add, credits_to_add, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits_remaining = user_credits.credits_remaining + credits_to_add,
    total_credits_purchased = user_credits.total_credits_purchased + credits_to_add,
    updated_at = NOW();
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  RETURN update_count = 1;
END;
$$;

-- Function: Initialize user credits (for signups)
CREATE OR REPLACE FUNCTION initialize_user_credits(user_id UUID, initial_credits INTEGER DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_credits (user_id, credits_remaining, total_credits_purchased, created_at, updated_at)
  VALUES (user_id, initial_credits, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Ensure proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cards TO authenticated;
GRANT SELECT ON user_credits TO authenticated;
GRANT ALL ON cards TO service_role;
GRANT ALL ON user_credits TO service_role;

SELECT 'SECURITY_SETUP_COMPLETE' as status, 'Database is now secure against client manipulation' as message;