-- Add theme column to user_settings
-- Allows users to choose between LIGHT and DARK themes
-- Default is LIGHT; CHECK constraint keeps future themes extensible

ALTER TABLE public.user_settings
  ADD COLUMN theme TEXT NOT NULL DEFAULT 'LIGHT'
  CHECK (theme IN ('LIGHT', 'DARK'));
