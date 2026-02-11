-- Create user_settings table for private user data
-- This separates sensitive settings from the public profiles table

-- Step 1: Create user_settings table
CREATE TABLE public.user_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    show_grading_tips boolean NOT NULL DEFAULT true,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
    stripe_customer_id TEXT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT user_settings_pkey PRIMARY KEY (id),
    CONSTRAINT user_settings_user_id_key UNIQUE (user_id),
    CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 2: Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: RLS policies - only owner can access
CREATE POLICY "users_read_own_settings" ON public.user_settings
FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "users_update_own_settings" ON public.user_settings
FOR UPDATE USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "block_direct_inserts" ON public.user_settings
FOR INSERT WITH CHECK (false);

CREATE POLICY "block_direct_deletes" ON public.user_settings
FOR DELETE USING (false);

-- Step 4: Migrate existing data from profiles
INSERT INTO public.user_settings (user_id, show_grading_tips)
SELECT user_id, show_grading_tips FROM public.profiles;

-- Step 5: Add updated_at trigger
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create indexes
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX idx_user_settings_stripe_customer_id ON public.user_settings(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;
