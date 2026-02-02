-- Create waitlist signups table for pre-launch email collection
-- Applied to: gamma (2026-02-02), production (pending)

CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Prevent duplicate signups (case-insensitive email matching)
CREATE UNIQUE INDEX idx_waitlist_signups_email ON public.waitlist_signups (LOWER(email));

-- Enable Row Level Security
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert (signup from waitlist page)
-- No read, update, or delete for anon — protects email list from enumeration
CREATE POLICY "Allow anonymous waitlist signup" ON public.waitlist_signups
  FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (for admin queries via Supabase dashboard)
CREATE POLICY "Service role full access" ON public.waitlist_signups
  FOR ALL TO service_role USING (true) WITH CHECK (true);
