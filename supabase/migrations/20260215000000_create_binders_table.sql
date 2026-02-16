-- Create binders table for organizing collection cards into groups
-- Each user gets one default "All Cards" binder (virtual - no junction entries needed)
-- Users can create unlimited custom binders

CREATE TABLE public.binders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    is_default boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT binders_pkey PRIMARY KEY (id),
    CONSTRAINT binders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT binders_user_slug_unique UNIQUE (user_id, slug)
);

-- Partial unique index: each user can have at most ONE default binder
-- Allows unlimited non-default binders
CREATE UNIQUE INDEX idx_binders_one_default_per_user
    ON public.binders (user_id) WHERE (is_default = true);

-- Enable RLS
ALTER TABLE public.binders ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_binders_user_id ON public.binders (user_id);
CREATE INDEX idx_binders_user_sort ON public.binders (user_id, sort_order);

-- Updated_at trigger (reuses existing function)
CREATE TRIGGER update_binders_updated_at
    BEFORE UPDATE ON public.binders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- SELECT: Owner always sees own binders
CREATE POLICY "Users can view own binders" ON public.binders
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- SELECT: Others can see binders of public-profile users
CREATE POLICY "Public profiles binders are visible" ON public.binders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = binders.user_id
            AND profiles.is_public = true
        )
    );

-- INSERT: Users can only create non-default binders for themselves
CREATE POLICY "Users can create own binders" ON public.binders
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id AND is_default = false);

-- UPDATE: Users can update own binders (trigger will prevent modifying default's name/flag)
CREATE POLICY "Users can update own binders" ON public.binders
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE: Users can only delete own non-default binders
CREATE POLICY "Users can delete own non-default binders" ON public.binders
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id AND is_default = false);

-- Service role has full access (for signup trigger and backfill)
CREATE POLICY "Service role manages all binders" ON public.binders
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
