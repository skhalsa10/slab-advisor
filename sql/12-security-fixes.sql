-- ============================================================================
-- SECURITY FIXES SCRIPT
-- Purpose: Fix security warnings by adding search_path to functions
-- Usage: Run this entire script in Supabase SQL Editor
-- Date: 2025-07-08
-- ============================================================================

-- IMPORTANT: This script will update your functions to include 
-- SET search_path = '' which prevents search path injection attacks

-- ============================================================================
-- FIX 1: handle_new_user - Trigger function for new user credits
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_credits (
    user_id,
    credits_remaining, 
    total_credits_purchased
  )
  VALUES (
    new.id, 
    2, 
    0
  );
  RETURN new;
END;
$function$;

-- ============================================================================
-- FIX 2: prevent_grade_tampering - Prevents users from modifying grades
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_grade_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

-- ============================================================================
-- FIX 3: deduct_user_credit - Safely deducts one credit from user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.deduct_user_credit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_credits INTEGER;
  update_count INTEGER;
BEGIN
  -- Check current credits first
  SELECT credits_remaining INTO current_credits
  FROM public.user_credits 
  WHERE user_credits.user_id = deduct_user_credit.user_id;
  
  -- SECURITY: Ensure user has credits to deduct
  IF current_credits IS NULL OR current_credits <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- SECURITY: Atomic decrement with safety check
  UPDATE public.user_credits 
  SET credits_remaining = credits_remaining - 1,
      updated_at = NOW()
  WHERE user_credits.user_id = deduct_user_credit.user_id
    AND credits_remaining > 0;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  -- Return success only if exactly one row was updated
  RETURN update_count = 1;
END;
$function$;

-- ============================================================================
-- FIX 4: add_user_credits - Adds credits to user account
-- ============================================================================
CREATE OR REPLACE FUNCTION public.add_user_credits(user_id uuid, credits_to_add integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  update_count INTEGER;
BEGIN
  -- SECURITY: Only allow positive credit additions
  IF credits_to_add <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- SECURITY: Insert or update credits record
  INSERT INTO public.user_credits (
    user_id, 
    credits_remaining, 
    total_credits_purchased, 
    created_at, 
    updated_at
  )
  VALUES (
    add_user_credits.user_id, 
    credits_to_add, 
    credits_to_add, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits_remaining = user_credits.credits_remaining + EXCLUDED.credits_remaining,
    total_credits_purchased = user_credits.total_credits_purchased + EXCLUDED.total_credits_purchased,
    updated_at = NOW();
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  RETURN update_count = 1;
END;
$function$;

-- ============================================================================
-- FIX 5: initialize_user_credits - Creates initial credits for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.initialize_user_credits(user_id uuid, initial_credits integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- SECURITY: Only create initial credits if none exist
  INSERT INTO public.user_credits (
    user_id, 
    credits_remaining, 
    total_credits_purchased, 
    created_at, 
    updated_at
  )
  VALUES (
    initialize_user_credits.user_id, 
    initial_credits, 
    0, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$function$;

-- ============================================================================
-- VERIFICATION: Check that all functions now have search_path set
-- ============================================================================
SELECT 
  'VERIFICATION RESULTS:' as status,
  COUNT(*) as functions_fixed,
  STRING_AGG(proname, ', ') as fixed_functions
FROM pg_proc
WHERE proname IN (
  'handle_new_user',
  'prevent_grade_tampering',
  'deduct_user_credit',
  'add_user_credits',
  'initialize_user_credits'
)
AND proconfig @> ARRAY['search_path='];

-- ============================================================================
-- SUMMARY: What this script fixed
-- ============================================================================
SELECT 
  'SECURITY FIXES APPLIED' as status,
  'All 5 functions now have search_path protection' as message,
  'Please check Supabase Dashboard to verify warnings are resolved' as next_step;