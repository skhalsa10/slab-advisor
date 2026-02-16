-- Create binder_cards junction table linking binders to collection cards
-- Only used for custom binders (NOT for the default "All Cards" binder)
-- A card can appear in multiple binders but only once per binder

CREATE TABLE public.binder_cards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    binder_id uuid NOT NULL,
    collection_card_id uuid NOT NULL,
    added_at timestamptz DEFAULT now(),
    CONSTRAINT binder_cards_pkey PRIMARY KEY (id),
    CONSTRAINT binder_cards_binder_id_fkey FOREIGN KEY (binder_id)
        REFERENCES public.binders(id) ON DELETE CASCADE,
    CONSTRAINT binder_cards_collection_card_id_fkey FOREIGN KEY (collection_card_id)
        REFERENCES public.collection_cards(id) ON DELETE CASCADE,
    CONSTRAINT binder_cards_unique_membership UNIQUE (binder_id, collection_card_id)
);

-- Enable RLS
ALTER TABLE public.binder_cards ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_binder_cards_binder_id ON public.binder_cards (binder_id);
CREATE INDEX idx_binder_cards_collection_card_id ON public.binder_cards (collection_card_id);

-- RLS Policies

-- SELECT: Owner sees own; others see for public-profile users
CREATE POLICY "Users can view own binder cards" ON public.binder_cards
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.binders
            WHERE binders.id = binder_cards.binder_id
            AND binders.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Public profiles binder cards are visible" ON public.binder_cards
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.binders
            JOIN public.profiles ON profiles.user_id = binders.user_id
            WHERE binders.id = binder_cards.binder_id
            AND profiles.is_public = true
        )
    );

-- INSERT: User must own the binder (non-default) AND the collection card
CREATE POLICY "Users can add cards to own binders" ON public.binder_cards
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.binders
            WHERE binders.id = binder_cards.binder_id
            AND binders.user_id = (SELECT auth.uid())
            AND binders.is_default = false
        )
        AND
        EXISTS (
            SELECT 1 FROM public.collection_cards
            WHERE collection_cards.id = binder_cards.collection_card_id
            AND collection_cards.user_id = (SELECT auth.uid())
        )
    );

-- DELETE: User can remove from own non-default binders
CREATE POLICY "Users can remove cards from own binders" ON public.binder_cards
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.binders
            WHERE binders.id = binder_cards.binder_id
            AND binders.user_id = (SELECT auth.uid())
            AND binders.is_default = false
        )
    );

-- Service role has full access
CREATE POLICY "Service role manages all binder cards" ON public.binder_cards
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);
