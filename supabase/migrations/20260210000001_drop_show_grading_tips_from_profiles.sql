-- Drop show_grading_tips column from profiles table
-- This column has been moved to user_settings table

ALTER TABLE public.profiles DROP COLUMN show_grading_tips;
