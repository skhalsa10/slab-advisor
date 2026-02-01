-- =============================================================================
-- BASELINE SCHEMA SNAPSHOT
-- =============================================================================
-- Generated: 2026-01-31
-- Source: Gamma project (oeqgpubjdeomnfunezot)
--
-- PURPOSE: This file is a REFERENCE ONLY snapshot of the complete database
-- schema as it exists today. It should NOT be re-run against the database
-- since the schema already exists in both gamma and production.
--
-- This file documents the cumulative result of 44 migrations applied between
-- 2025-09-04 and 2026-01-25. Going forward, all schema changes are tracked
-- as individual migration files in this folder.
-- =============================================================================


-- =============================================================================
-- EXTENSIONS
-- =============================================================================
-- These are managed by Supabase and should not be modified directly.
-- Notable enabled extensions:
--   pg_cron (1.6)        - scheduled jobs (portfolio snapshots)
--   pgcrypto (1.3)       - cryptographic functions
--   uuid-ossp (1.1)      - UUID generation
--   pg_graphql (1.5.11)  - GraphQL support (Supabase default)
--   pg_stat_statements    - query statistics


-- =============================================================================
-- TABLES (in dependency order)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- pokemon_series
-- -----------------------------------------------------------------------------
CREATE TABLE public.pokemon_series (
    id text NOT NULL,
    name text NOT NULL,
    logo text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT pokemon_series_pkey PRIMARY KEY (id)
);
ALTER TABLE public.pokemon_series ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- pokemon_sets
-- -----------------------------------------------------------------------------
CREATE TABLE public.pokemon_sets (
    id text NOT NULL,
    series_id text,
    name text NOT NULL,
    logo text,
    symbol text,
    card_count_total integer DEFAULT 0,
    card_count_official integer DEFAULT 0,
    card_count_reverse integer DEFAULT 0,
    card_count_holo integer DEFAULT 0,
    card_count_first_ed integer DEFAULT 0,
    release_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    tcgplayer_group_id integer,
    tcgplayer_url text,
    ptcgio_id text,
    secondary_logo text,
    secondary_symbol text,
    tcgplayer_groups jsonb,
    tcgplayer_set_id text,
    CONSTRAINT pokemon_sets_pkey PRIMARY KEY (id),
    CONSTRAINT pokemon_sets_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.pokemon_series(id)
);
ALTER TABLE public.pokemon_sets ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- pokemon_cards
-- -----------------------------------------------------------------------------
CREATE TABLE public.pokemon_cards (
    id text NOT NULL,
    set_id text,
    local_id text,
    name text NOT NULL,
    image text,
    category text,
    illustrator text,
    rarity text,
    variant_normal boolean DEFAULT false,
    variant_reverse boolean DEFAULT false,
    variant_holo boolean DEFAULT false,
    variant_first_edition boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    tcgplayer_product_id integer,
    tcgplayer_image_url text,
    variant_poke_ball boolean DEFAULT false,
    variant_master_ball boolean DEFAULT false,
    tcgplayer_products jsonb,
    CONSTRAINT pokemon_cards_pkey PRIMARY KEY (id),
    CONSTRAINT pokemon_cards_set_id_fkey FOREIGN KEY (set_id) REFERENCES public.pokemon_sets(id)
);
ALTER TABLE public.pokemon_cards ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- pokemon_card_prices
-- -----------------------------------------------------------------------------
CREATE TABLE public.pokemon_card_prices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pokemon_card_id text NOT NULL,
    tcgplayer_product_id integer,
    current_market_price numeric(10,2),
    current_market_price_condition text,
    psa10 jsonb,
    psa9 jsonb,
    psa8 jsonb,
    change_7d_percent numeric,
    change_30d_percent numeric,
    change_90d_percent numeric,
    change_180d_percent numeric,
    change_365d_percent numeric,
    prices_raw jsonb,
    ebay_price_history jsonb,
    raw_price_history jsonb,
    raw_history_variants_tracked text[],
    raw_history_conditions_tracked text[],
    last_updated timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    grading_cost_basis_entry numeric(10,2),
    grading_fee_entry numeric(10,2),
    grading_fee_psa9 numeric(10,2),
    grading_fee_psa10 numeric(10,2),
    profit_at_psa9 numeric(10,2),
    profit_at_psa10 numeric(10,2),
    roi_psa10 numeric(10,2),
    upcharge_potential boolean DEFAULT false,
    grading_safety_tier text,
    variant_pattern text,
    current_market_price_variant text,
    CONSTRAINT pokemon_card_prices_pkey PRIMARY KEY (id),
    CONSTRAINT pokemon_card_prices_card_variant_unique UNIQUE NULLS NOT DISTINCT (pokemon_card_id, variant_pattern),
    CONSTRAINT pokemon_card_prices_pokemon_card_id_fkey FOREIGN KEY (pokemon_card_id) REFERENCES public.pokemon_cards(id)
);
ALTER TABLE public.pokemon_card_prices ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- pokemon_products
-- -----------------------------------------------------------------------------
CREATE SEQUENCE public.pokemon_products_id_seq AS integer;

CREATE TABLE public.pokemon_products (
    id integer NOT NULL DEFAULT nextval('pokemon_products_id_seq'::regclass),
    tcgplayer_product_id integer NOT NULL,
    name text NOT NULL,
    tcgplayer_image_url text,
    tcgplayer_group_id integer NOT NULL,
    pokemon_set_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT pokemon_products_pkey PRIMARY KEY (id),
    CONSTRAINT pokemon_products_tcgplayer_product_id_key UNIQUE (tcgplayer_product_id),
    CONSTRAINT pokemon_products_pokemon_set_id_fkey FOREIGN KEY (pokemon_set_id) REFERENCES public.pokemon_sets(id)
);
ALTER SEQUENCE public.pokemon_products_id_seq OWNED BY public.pokemon_products.id;
ALTER TABLE public.pokemon_products ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- pokemon_product_prices
-- -----------------------------------------------------------------------------
CREATE TABLE public.pokemon_product_prices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pokemon_product_id integer NOT NULL,
    tcgplayer_product_id integer NOT NULL,
    current_market_price numeric,
    change_7d_percent numeric,
    change_30d_percent numeric,
    change_90d_percent numeric,
    change_180d_percent numeric,
    change_365d_percent numeric,
    price_history jsonb,
    last_updated timestamptz,
    created_at timestamptz DEFAULT now(),
    last_scraped_at timestamptz,
    CONSTRAINT pokemon_product_prices_pkey PRIMARY KEY (id),
    CONSTRAINT pokemon_product_prices_pokemon_product_id_key UNIQUE (pokemon_product_id),
    CONSTRAINT pokemon_product_prices_pokemon_product_id_fkey FOREIGN KEY (pokemon_product_id) REFERENCES public.pokemon_products(id)
);
ALTER TABLE public.pokemon_product_prices ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- pokemon_product_price_history
-- -----------------------------------------------------------------------------
CREATE TABLE public.pokemon_product_price_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pokemon_product_id integer,
    tcgplayer_product_id integer NOT NULL,
    market_price numeric(10,2),
    low_price numeric(10,2),
    mid_price numeric(10,2),
    high_price numeric(10,2),
    price_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT pokemon_product_price_history_pkey PRIMARY KEY (id),
    CONSTRAINT unique_product_date UNIQUE (tcgplayer_product_id, price_date),
    CONSTRAINT pokemon_product_price_history_pokemon_product_id_fkey FOREIGN KEY (pokemon_product_id) REFERENCES public.pokemon_products(id)
);
ALTER TABLE public.pokemon_product_price_history ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    username text NOT NULL,
    display_name text,
    bio text,
    avatar_url text,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    show_grading_tips boolean NOT NULL DEFAULT true,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_username_key UNIQUE (username),
    CONSTRAINT unique_user_profile UNIQUE (user_id),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- user_credits
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_credits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    total_credits_purchased integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    free_credits integer NOT NULL DEFAULT 2,
    purchased_credits integer NOT NULL DEFAULT 0,
    total_free_credits_used integer NOT NULL DEFAULT 0,
    total_purchased_credits_used integer NOT NULL DEFAULT 0,
    free_credits_reset_at timestamptz NOT NULL DEFAULT (now() + '1 mon'::interval),
    credits_remaining integer,
    CONSTRAINT user_credits_pkey PRIMARY KEY (id),
    CONSTRAINT user_credits_user_id_key UNIQUE (user_id),
    CONSTRAINT user_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- collection_cards
-- -----------------------------------------------------------------------------
CREATE TABLE public.collection_cards (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    card_type text DEFAULT 'pokemon'::text,
    pokemon_card_id text,
    variant text NOT NULL,
    quantity integer DEFAULT 1,
    condition text,
    acquisition_date date,
    acquisition_price numeric(10,2),
    notes text,
    front_image_url text,
    back_image_url text,
    manual_card_name text,
    manual_set_name text,
    manual_series text,
    manual_rarity text,
    manual_card_number text,
    manual_year integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    variant_pattern text,
    CONSTRAINT collection_cards_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_card_variant_pattern UNIQUE (user_id, pokemon_card_id, variant, variant_pattern),
    CONSTRAINT collection_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT collection_cards_pokemon_card_id_fkey FOREIGN KEY (pokemon_card_id) REFERENCES public.pokemon_cards(id)
);
ALTER TABLE public.collection_cards ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- collection_card_gradings
-- -----------------------------------------------------------------------------
CREATE TABLE public.collection_card_gradings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    collection_card_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    raw_response jsonb NOT NULL,
    grade_corners numeric(3,1),
    grade_edges numeric(3,1),
    grade_surface numeric(3,1),
    grade_centering numeric(3,1),
    grade_final numeric(3,1),
    condition text,
    front_grade_final numeric(3,1),
    front_centering_lr text,
    front_centering_tb text,
    back_grade_final numeric(3,1),
    back_centering_lr text,
    back_centering_tb text,
    front_annotated_full_url text,
    front_annotated_exact_url text,
    back_annotated_full_url text,
    back_annotated_exact_url text,
    CONSTRAINT collection_card_gradings_pkey PRIMARY KEY (id),
    CONSTRAINT collection_card_gradings_collection_card_id_fkey FOREIGN KEY (collection_card_id) REFERENCES public.collection_cards(id),
    CONSTRAINT collection_card_gradings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.collection_card_gradings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- collection_products
-- -----------------------------------------------------------------------------
CREATE TABLE public.collection_products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    pokemon_product_id integer NOT NULL,
    quantity integer DEFAULT 1,
    condition text DEFAULT 'sealed'::text,
    purchase_price numeric(10,2),
    purchased_at date DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT collection_products_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_product UNIQUE (user_id, pokemon_product_id),
    CONSTRAINT collection_products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT collection_products_pokemon_product_id_fkey FOREIGN KEY (pokemon_product_id) REFERENCES public.pokemon_products(id)
);
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- portfolio_snapshots
-- -----------------------------------------------------------------------------
CREATE TABLE public.portfolio_snapshots (
    id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL,
    recorded_at date NOT NULL DEFAULT CURRENT_DATE,
    total_card_value numeric(12,2) NOT NULL DEFAULT 0,
    card_count integer NOT NULL DEFAULT 0,
    total_product_value numeric(12,2) NOT NULL DEFAULT 0,
    product_count integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT portfolio_snapshots_pkey PRIMARY KEY (id),
    CONSTRAINT unique_user_date UNIQUE (user_id, recorded_at),
    CONSTRAINT portfolio_snapshots_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE VIEW public.pokemon_product_latest_prices AS
SELECT DISTINCT ON (pokemon_product_id)
    id,
    pokemon_product_id,
    tcgplayer_product_id,
    market_price,
    low_price,
    mid_price,
    high_price,
    price_date,
    created_at
FROM pokemon_product_price_history
WHERE pokemon_product_id IS NOT NULL
ORDER BY pokemon_product_id, price_date DESC;


-- =============================================================================
-- INDEXES
-- =============================================================================

-- collection_card_gradings
CREATE INDEX idx_collection_card_gradings_collection_card_id ON public.collection_card_gradings USING btree (collection_card_id);
CREATE INDEX idx_collection_card_gradings_created_at ON public.collection_card_gradings USING btree (created_at DESC);
CREATE INDEX idx_collection_card_gradings_grade_final ON public.collection_card_gradings USING btree (grade_final);
CREATE INDEX idx_collection_card_gradings_user_id ON public.collection_card_gradings USING btree (user_id);

-- collection_cards
CREATE INDEX idx_collection_cards_card_type ON public.collection_cards USING btree (card_type);
CREATE INDEX idx_collection_cards_condition ON public.collection_cards USING btree (condition) WHERE (condition IS NOT NULL);
CREATE INDEX idx_collection_cards_manual_card_name ON public.collection_cards USING btree (lower(manual_card_name)) WHERE (manual_card_name IS NOT NULL);
CREATE INDEX idx_collection_cards_pokemon_card_id ON public.collection_cards USING btree (pokemon_card_id) WHERE (pokemon_card_id IS NOT NULL);
CREATE INDEX idx_collection_cards_user_id ON public.collection_cards USING btree (user_id);
CREATE INDEX idx_collection_cards_user_pokemon_variant ON public.collection_cards USING btree (user_id, pokemon_card_id, variant) WHERE (pokemon_card_id IS NOT NULL);
CREATE INDEX idx_collection_cards_variant ON public.collection_cards USING btree (variant);
CREATE INDEX idx_collection_cards_variant_pattern ON public.collection_cards USING btree (variant_pattern) WHERE (variant_pattern IS NOT NULL);

-- collection_products
CREATE INDEX idx_collection_products_pokemon_product_id ON public.collection_products USING btree (pokemon_product_id);
CREATE INDEX idx_collection_products_user_id ON public.collection_products USING btree (user_id);

-- pokemon_card_prices
CREATE INDEX idx_pokemon_card_prices_market ON public.pokemon_card_prices USING btree (current_market_price DESC NULLS LAST);
CREATE INDEX idx_pokemon_card_prices_profit_psa10 ON public.pokemon_card_prices USING btree (profit_at_psa10 DESC NULLS LAST);
CREATE INDEX idx_pokemon_card_prices_roi ON public.pokemon_card_prices USING btree (roi_psa10 DESC NULLS LAST);
CREATE INDEX idx_pokemon_card_prices_safety_tier ON public.pokemon_card_prices USING btree (grading_safety_tier);
CREATE INDEX idx_pokemon_card_prices_tcgplayer ON public.pokemon_card_prices USING btree (tcgplayer_product_id);
CREATE INDEX idx_pokemon_card_prices_updated ON public.pokemon_card_prices USING btree (last_updated);
CREATE INDEX idx_pokemon_card_prices_variant_pattern ON public.pokemon_card_prices USING btree (pokemon_card_id, variant_pattern);
CREATE INDEX pokemon_card_prices_pokemon_card_id_idx ON public.pokemon_card_prices USING btree (pokemon_card_id);

-- pokemon_cards
CREATE INDEX idx_pokemon_cards_category ON public.pokemon_cards USING btree (category);
CREATE INDEX idx_pokemon_cards_category_rarity ON public.pokemon_cards USING btree (category, rarity);
CREATE INDEX idx_pokemon_cards_local_id ON public.pokemon_cards USING btree (local_id);
CREATE INDEX idx_pokemon_cards_name ON public.pokemon_cards USING btree (name);
CREATE INDEX idx_pokemon_cards_name_search ON public.pokemon_cards USING gin (to_tsvector('english'::regconfig, name));
CREATE INDEX idx_pokemon_cards_rarity ON public.pokemon_cards USING btree (rarity);
CREATE INDEX idx_pokemon_cards_set_id ON public.pokemon_cards USING btree (set_id);
CREATE INDEX idx_pokemon_cards_set_local ON public.pokemon_cards USING btree (set_id, local_id);
CREATE INDEX idx_pokemon_cards_tcgplayer_product_id ON public.pokemon_cards USING btree (tcgplayer_product_id) WHERE (tcgplayer_product_id IS NOT NULL);
CREATE INDEX idx_pokemon_cards_tcgplayer_products ON public.pokemon_cards USING gin (tcgplayer_products);
CREATE INDEX idx_pokemon_cards_variant_master_ball ON public.pokemon_cards USING btree (variant_master_ball) WHERE (variant_master_ball = true);
CREATE INDEX idx_pokemon_cards_variant_poke_ball ON public.pokemon_cards USING btree (variant_poke_ball) WHERE (variant_poke_ball = true);
CREATE INDEX idx_pokemon_cards_variants ON public.pokemon_cards USING btree (variant_normal, variant_reverse, variant_holo, variant_first_edition);

-- pokemon_product_price_history
CREATE INDEX idx_product_price_history_price_date ON public.pokemon_product_price_history USING btree (price_date);
CREATE INDEX idx_product_price_history_product_date ON public.pokemon_product_price_history USING btree (pokemon_product_id, price_date);
CREATE INDEX idx_product_price_history_tcgplayer_id ON public.pokemon_product_price_history USING btree (tcgplayer_product_id);

-- pokemon_product_prices
CREATE INDEX idx_pokemon_product_prices_product_id ON public.pokemon_product_prices USING btree (pokemon_product_id);
CREATE INDEX idx_pokemon_product_prices_tcgplayer_id ON public.pokemon_product_prices USING btree (tcgplayer_product_id);

-- pokemon_products
CREATE INDEX idx_pokemon_products_name ON public.pokemon_products USING gin (to_tsvector('english'::regconfig, name));
CREATE INDEX idx_pokemon_products_pokemon_set_id ON public.pokemon_products USING btree (pokemon_set_id);
CREATE INDEX idx_pokemon_products_tcgplayer_group_id ON public.pokemon_products USING btree (tcgplayer_group_id);

-- pokemon_series
CREATE INDEX idx_pokemon_series_name ON public.pokemon_series USING btree (name);
CREATE INDEX idx_pokemon_series_name_search ON public.pokemon_series USING gin (to_tsvector('english'::regconfig, name));

-- pokemon_sets
CREATE INDEX idx_pokemon_sets_card_count ON public.pokemon_sets USING btree (card_count_total DESC);
CREATE INDEX idx_pokemon_sets_name ON public.pokemon_sets USING btree (name);
CREATE INDEX idx_pokemon_sets_name_search ON public.pokemon_sets USING gin (to_tsvector('english'::regconfig, name));
CREATE INDEX idx_pokemon_sets_release_date ON public.pokemon_sets USING btree (release_date DESC);
CREATE INDEX idx_pokemon_sets_series_id ON public.pokemon_sets USING btree (series_id);
CREATE INDEX idx_pokemon_sets_tcgplayer_group_id ON public.pokemon_sets USING btree (tcgplayer_group_id) WHERE (tcgplayer_group_id IS NOT NULL);
CREATE INDEX idx_pokemon_sets_tcgplayer_groups ON public.pokemon_sets USING gin (tcgplayer_groups) WHERE (tcgplayer_groups IS NOT NULL);
CREATE INDEX idx_pokemon_sets_tcgplayer_set_id ON public.pokemon_sets USING btree (tcgplayer_set_id) WHERE (tcgplayer_set_id IS NOT NULL);

-- portfolio_snapshots
CREATE INDEX idx_portfolio_snapshots_user_date ON public.portfolio_snapshots USING btree (user_id, recorded_at DESC);
CREATE INDEX portfolio_snapshots_recorded_at_idx ON public.portfolio_snapshots USING btree (recorded_at);

-- profiles
CREATE INDEX idx_profiles_is_public ON public.profiles USING btree (is_public) WHERE (is_public = true);
CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);
CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);

-- user_credits
CREATE INDEX idx_user_credits_balances ON public.user_credits USING btree (user_id, free_credits, purchased_credits);
CREATE INDEX idx_user_credits_heavy_users ON public.user_credits USING btree (total_free_credits_used, total_purchased_credits_used) WHERE ((total_free_credits_used + total_purchased_credits_used) > 10);
CREATE INDEX idx_user_credits_low_balance ON public.user_credits USING btree (credits_remaining) WHERE (credits_remaining <= 5);
CREATE INDEX idx_user_credits_purchasers ON public.user_credits USING btree (total_credits_purchased) WHERE (total_credits_purchased > 0);
CREATE INDEX idx_user_credits_reset_needed ON public.user_credits USING btree (free_credits_reset_at) WHERE (free_credits < 2);
CREATE INDEX idx_user_credits_user_id ON public.user_credits USING btree (user_id);
CREATE INDEX idx_user_credits_user_id_optimized ON public.user_credits USING btree (user_id) WHERE (user_id IS NOT NULL);


-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- update_updated_at_column: Generic trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- update_pokemon_products_updated_at: Trigger function for pokemon_products
CREATE OR REPLACE FUNCTION public.update_pokemon_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- handle_new_user: Legacy trigger function (replaced by initialize_user_credits_on_signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- initialize_user_credits_on_signup: Creates credit record when new user signs up
CREATE OR REPLACE FUNCTION public.initialize_user_credits_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO user_credits (
        user_id,
        free_credits,
        purchased_credits,
        free_credits_reset_at
    ) VALUES (
        NEW.id,
        2,
        0,
        NOW() + INTERVAL '1 month'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user credits for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- create_user_profile: Atomically creates a user profile with validation
CREATE OR REPLACE FUNCTION public.create_user_profile(p_user_id uuid, p_username text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_profile_id UUID;
    v_clean_username TEXT;
BEGIN
    v_clean_username := LOWER(TRIM(p_username));

    IF NOT (v_clean_username ~ '^[a-z0-9][a-z0-9_]*[a-z0-9]$') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Username can only contain letters, numbers, and underscores. Must start and end with a letter or number.',
            'error_code', 'INVALID_FORMAT'
        );
    END IF;

    IF LENGTH(v_clean_username) < 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username must be at least 3 characters', 'error_code', 'TOO_SHORT');
    END IF;

    IF LENGTH(v_clean_username) > 30 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username must be no more than 30 characters', 'error_code', 'TOO_LONG');
    END IF;

    IF v_clean_username IN (
        'admin', 'root', 'support', 'api', 'www', 'app',
        'mail', 'help', 'ftp', 'blog', 'shop', 'store',
        'administrator', 'mod', 'moderator', 'owner', 'staff',
        'team', 'official', 'verified', 'system', 'bot',
        'null', 'undefined', 'none', 'anonymous', 'guest',
        'test', 'demo', 'example', 'sample',
        'about', 'terms', 'privacy', 'contact', 'dashboard',
        'collection', 'browse', 'search', 'login', 'signup',
        'auth', 'account', 'settings', 'profile', 'user',
        'explore', 'discover', 'trending', 'popular',
        'slabadvisor', 'slab', 'advisor', 'cards', 'card',
        'grade', 'grading', 'pricing', 'marketplace', 'market',
        'security', 'abuse', 'phishing', 'scam', 'fraud',
        'report', 'verify', 'confirm', 'reset', 'recover',
        'public', 'private', 'pro', 'premium', 'subscription',
        'billing', 'payment', 'checkout', 'cart', 'shop'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'This username is reserved', 'error_code', 'RESERVED_USERNAME');
    END IF;

    INSERT INTO profiles (user_id, username)
    VALUES (p_user_id, v_clean_username)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_profile_id;

    IF v_profile_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unable to create profile', 'error_code', 'CREATION_FAILED');
    END IF;

    RETURN jsonb_build_object('success', true, 'profile_id', v_profile_id, 'username', v_clean_username);

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Username already taken', 'error_code', 'USERNAME_TAKEN');
    WHEN foreign_key_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unable to create profile', 'error_code', 'CREATION_FAILED');
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating profile for user %: %', p_user_id, SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', 'Unable to create profile', 'error_code', 'CREATION_FAILED');
END;
$$;

-- check_username_available: Checks if a username is available
CREATE OR REPLACE FUNCTION public.check_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_clean_username TEXT;
BEGIN
    v_clean_username := LOWER(TRIM(p_username));
    RETURN NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE username = v_clean_username
    );
END;
$$;

-- deduct_user_credit: Deducts one credit (free first, then purchased)
CREATE OR REPLACE FUNCTION public.deduct_user_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSONB;
    v_free_credits INTEGER;
    v_purchased_credits INTEGER;
    v_updated BOOLEAN := false;
BEGIN
    SELECT free_credits, purchased_credits
    INTO v_free_credits, v_purchased_credits
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User credits not found', 'error_code', 'USER_NOT_FOUND');
    END IF;

    IF (v_free_credits + v_purchased_credits) <= 0 THEN
        RETURN jsonb_build_object(
            'success', false, 'error', 'Insufficient credits', 'error_code', 'INSUFFICIENT_CREDITS',
            'free_credits', v_free_credits, 'purchased_credits', v_purchased_credits
        );
    END IF;

    IF v_free_credits > 0 THEN
        UPDATE user_credits
        SET free_credits = free_credits - 1, total_free_credits_used = total_free_credits_used + 1, updated_at = NOW()
        WHERE user_id = p_user_id;
        v_free_credits := v_free_credits - 1;
    ELSE
        UPDATE user_credits
        SET purchased_credits = purchased_credits - 1, total_purchased_credits_used = total_purchased_credits_used + 1, updated_at = NOW()
        WHERE user_id = p_user_id;
        v_purchased_credits := v_purchased_credits - 1;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'free_credits', v_free_credits, 'purchased_credits', v_purchased_credits,
        'total_credits', v_free_credits + v_purchased_credits,
        'deducted_from', CASE WHEN v_free_credits >= 0 THEN 'free' ELSE 'purchased' END
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Database error occurred', 'error_code', 'DATABASE_ERROR', 'details', SQLERRM);
END;
$$;

-- refund_user_credit: Refunds one credit back to free credits
CREATE OR REPLACE FUNCTION public.refund_user_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_free_credits INTEGER;
    v_purchased_credits INTEGER;
BEGIN
    SELECT free_credits, purchased_credits
    INTO v_free_credits, v_purchased_credits
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User credits not found', 'error_code', 'USER_NOT_FOUND');
    END IF;

    UPDATE user_credits
    SET free_credits = free_credits + 1, total_free_credits_used = GREATEST(total_free_credits_used - 1, 0), updated_at = NOW()
    WHERE user_id = p_user_id;

    v_free_credits := v_free_credits + 1;

    RETURN jsonb_build_object(
        'success', true,
        'free_credits', v_free_credits, 'purchased_credits', v_purchased_credits,
        'total_credits', v_free_credits + v_purchased_credits
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Database error occurred', 'error_code', 'DATABASE_ERROR', 'details', SQLERRM);
END;
$$;

-- add_purchased_credits: Adds purchased credits to a user's balance
CREATE OR REPLACE FUNCTION public.add_purchased_credits(p_user_id uuid, p_credits integer, p_transaction_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    IF p_credits <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Credit amount must be positive', 'error_code', 'INVALID_AMOUNT');
    END IF;

    UPDATE user_credits
    SET purchased_credits = purchased_credits + p_credits, total_credits_purchased = total_credits_purchased + p_credits, updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING purchased_credits INTO v_new_balance;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User credits not found', 'error_code', 'USER_NOT_FOUND');
    END IF;

    IF p_transaction_id IS NOT NULL THEN
        RAISE NOTICE 'Credits purchase: user=%, credits=%, transaction=%', p_user_id, p_credits, p_transaction_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true, 'credits_added', p_credits,
        'new_purchased_balance', v_new_balance, 'transaction_id', p_transaction_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'Database error occurred', 'error_code', 'DATABASE_ERROR', 'details', SQLERRM);
END;
$$;

-- get_user_credit_details: Returns detailed credit information for a user
CREATE OR REPLACE FUNCTION public.get_user_credit_details(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_credits RECORD;
BEGIN
    SELECT
        free_credits, purchased_credits,
        free_credits + purchased_credits as total_credits,
        total_free_credits_used, total_purchased_credits_used,
        total_credits_purchased, free_credits_reset_at,
        CASE WHEN free_credits_reset_at > NOW()
            THEN EXTRACT(EPOCH FROM (free_credits_reset_at - NOW()))::INTEGER
            ELSE 0
        END as seconds_until_reset
    INTO v_credits
    FROM user_credits
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No credit record found', 'free_credits', 0, 'purchased_credits', 0, 'total_credits', 0);
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'free_credits', v_credits.free_credits,
        'purchased_credits', v_credits.purchased_credits,
        'total_credits', v_credits.total_credits,
        'usage', jsonb_build_object(
            'free_used', v_credits.total_free_credits_used,
            'purchased_used', v_credits.total_purchased_credits_used,
            'lifetime_purchased', v_credits.total_credits_purchased
        ),
        'next_free_reset', v_credits.free_credits_reset_at,
        'seconds_until_reset', v_credits.seconds_until_reset
    );
END;
$$;

-- get_user_total_cards: Returns total card count for a user
CREATE OR REPLACE FUNCTION public.get_user_total_cards(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(SUM(COALESCE(quantity, 1)), 0)::integer
  FROM collection_cards
  WHERE user_id = p_user_id;
$$;

-- reset_monthly_free_credits: Resets free credits for eligible users
CREATE OR REPLACE FUNCTION public.reset_monthly_free_credits()
RETURNS TABLE(user_id uuid, credits_reset integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    UPDATE user_credits
    SET
        free_credits = 2,
        free_credits_reset_at = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE
        free_credits_reset_at <= NOW()
        AND free_credits < 2
    RETURNING
        user_credits.user_id,
        2 as credits_reset;
END;
$$;

-- get_set_tcgplayer_groups: Returns TCGPlayer group info for a set
CREATE OR REPLACE FUNCTION public.get_set_tcgplayer_groups(set_id text)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(tcgplayer_groups,
    CASE
      WHEN tcgplayer_group_id IS NOT NULL THEN
        jsonb_build_array(jsonb_build_object('groupId', tcgplayer_group_id))
      ELSE
        NULL
    END)
  INTO result
  FROM pokemon_sets
  WHERE id = set_id;

  RETURN result;
END;
$$;

-- snapshot_all_portfolios: Daily portfolio value snapshot for all users
CREATE OR REPLACE FUNCTION public.snapshot_all_portfolios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO portfolio_snapshots (user_id, recorded_at, total_card_value, card_count, total_product_value, product_count)

  WITH card_totals AS (
    SELECT
      cc.user_id,
      COALESCE(SUM(
        COALESCE(cc.quantity, 1) * COALESCE(
          (pcp.prices_raw->'variants'->
            CASE cc.variant
              WHEN 'holo' THEN 'Holofoil'
              WHEN 'reverse_holo' THEN 'Reverse Holofoil'
              WHEN 'first_edition' THEN '1st Edition Holofoil'
              WHEN 'illustration_rare' THEN 'Holofoil'
              WHEN 'alt_art' THEN 'Holofoil'
              WHEN 'full_art' THEN 'Holofoil'
              WHEN 'secret_rare' THEN 'Holofoil'
              ELSE 'Normal'
            END->
            CASE cc.condition
              WHEN 'mint' THEN 'Near Mint'
              WHEN 'near_mint' THEN 'Near Mint'
              WHEN 'lightly_played' THEN 'Lightly Played'
              WHEN 'moderately_played' THEN 'Moderately Played'
              WHEN 'heavily_played' THEN 'Heavily Played'
              WHEN 'damaged' THEN 'Damaged'
              ELSE COALESCE(pcp.current_market_price_condition, 'Near Mint')
            END->>'price')::NUMERIC,
          pcp.current_market_price,
          (pcp.prices_raw->>'market')::NUMERIC,
          0
        )
      ), 0) AS total_card_value,
      COALESCE(SUM(COALESCE(cc.quantity, 1)), 0)::INTEGER AS card_count
    FROM collection_cards cc
    LEFT JOIN pokemon_card_prices pcp ON
      pcp.pokemon_card_id = cc.pokemon_card_id
      AND ((cc.variant_pattern IS NULL AND pcp.variant_pattern IS NULL)
           OR cc.variant_pattern = pcp.variant_pattern)
    GROUP BY cc.user_id
  ),

  product_totals AS (
    SELECT
      cp.user_id,
      COALESCE(SUM(COALESCE(cp.quantity, 1) * COALESCE(pplp.market_price, 0)), 0) AS total_product_value,
      COALESCE(SUM(COALESCE(cp.quantity, 1)), 0)::INTEGER AS product_count
    FROM collection_products cp
    LEFT JOIN pokemon_product_latest_prices pplp
      ON pplp.pokemon_product_id = cp.pokemon_product_id
    GROUP BY cp.user_id
  ),

  all_users AS (
    SELECT user_id FROM card_totals
    UNION
    SELECT user_id FROM product_totals
  ),

  combined AS (
    SELECT
      au.user_id,
      COALESCE(ct.total_card_value, 0) AS total_card_value,
      COALESCE(ct.card_count, 0) AS card_count,
      COALESCE(pt.total_product_value, 0) AS total_product_value,
      COALESCE(pt.product_count, 0) AS product_count
    FROM all_users au
    LEFT JOIN card_totals ct ON au.user_id = ct.user_id
    LEFT JOIN product_totals pt ON au.user_id = pt.user_id
  )

  SELECT user_id, CURRENT_DATE, total_card_value, card_count, total_product_value, product_count
  FROM combined

  ON CONFLICT (user_id, recorded_at)
  DO UPDATE SET
    total_card_value = EXCLUDED.total_card_value,
    card_count = EXCLUDED.card_count,
    total_product_value = EXCLUDED.total_product_value,
    product_count = EXCLUDED.product_count;
END;
$$;

-- prevent_grade_tampering: Prevents users from modifying grading results
CREATE OR REPLACE FUNCTION public.prevent_grade_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF OLD.estimated_grade IS NOT NULL THEN NEW.estimated_grade := OLD.estimated_grade; END IF;
  IF OLD.confidence IS NOT NULL THEN NEW.confidence := OLD.confidence; END IF;
  IF OLD.grading_details IS NOT NULL THEN NEW.grading_details := OLD.grading_details; END IF;
  IF OLD.ungraded_price IS NOT NULL THEN NEW.ungraded_price := OLD.ungraded_price; END IF;
  IF OLD.graded_prices IS NOT NULL THEN NEW.graded_prices := OLD.graded_prices; END IF;

  RETURN NEW;
END;
$$;


-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamps
CREATE TRIGGER update_collection_cards_updated_at
    BEFORE UPDATE ON public.collection_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pokemon_products_updated_at_trigger
    BEFORE UPDATE ON public.pokemon_products
    FOR EACH ROW EXECUTE FUNCTION update_pokemon_products_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON public.user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth trigger: Initialize credits when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.initialize_user_credits_on_signup();


-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- collection_card_gradings
CREATE POLICY "Users can view own gradings" ON public.collection_card_gradings FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own gradings" ON public.collection_card_gradings FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own gradings" ON public.collection_card_gradings FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own gradings" ON public.collection_card_gradings FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- collection_cards
CREATE POLICY "Users can view their own collection cards" ON public.collection_cards FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own collection cards" ON public.collection_cards FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own collection cards" ON public.collection_cards FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own collection cards" ON public.collection_cards FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- collection_products
CREATE POLICY "Users can view their own collection products" ON public.collection_products FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert their own collection products" ON public.collection_products FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update their own collection products" ON public.collection_products FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete their own collection products" ON public.collection_products FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- pokemon_card_prices
CREATE POLICY "Anyone can read pokemon_card_prices" ON public.pokemon_card_prices FOR SELECT USING (true);
CREATE POLICY "Admin only write pokemon_card_prices" ON public.pokemon_card_prices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pokemon_cards
CREATE POLICY "Anyone can read pokemon_cards" ON public.pokemon_cards FOR SELECT USING (true);
CREATE POLICY "Admin insert pokemon_cards" ON public.pokemon_cards FOR INSERT WITH CHECK (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Admin update pokemon_cards" ON public.pokemon_cards FOR UPDATE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Admin delete pokemon_cards" ON public.pokemon_cards FOR DELETE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- pokemon_product_price_history
CREATE POLICY "Allow read access to pokemon_product_price_history" ON public.pokemon_product_price_history FOR SELECT USING (true);
CREATE POLICY "Service role can manage pokemon_product_price_history" ON public.pokemon_product_price_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pokemon_product_prices
CREATE POLICY "Anyone can read pokemon_product_prices" ON public.pokemon_product_prices FOR SELECT USING (true);
CREATE POLICY "Admin only write pokemon_product_prices" ON public.pokemon_product_prices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pokemon_products
CREATE POLICY "Pokemon products are viewable by everyone" ON public.pokemon_products FOR SELECT USING (true);

-- pokemon_series
CREATE POLICY "Anyone can read pokemon_series" ON public.pokemon_series FOR SELECT USING (true);
CREATE POLICY "Admin insert pokemon_series" ON public.pokemon_series FOR INSERT WITH CHECK (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Admin update pokemon_series" ON public.pokemon_series FOR UPDATE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Admin delete pokemon_series" ON public.pokemon_series FOR DELETE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Service role insert pokemon_series" ON public.pokemon_series FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update pokemon_series" ON public.pokemon_series FOR UPDATE TO service_role USING (true);
CREATE POLICY "Service role delete pokemon_series" ON public.pokemon_series FOR DELETE TO service_role USING (true);

-- pokemon_sets
CREATE POLICY "Anyone can read pokemon_sets" ON public.pokemon_sets FOR SELECT USING (true);
CREATE POLICY "Admin insert pokemon_sets" ON public.pokemon_sets FOR INSERT WITH CHECK (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Admin update pokemon_sets" ON public.pokemon_sets FOR UPDATE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');
CREATE POLICY "Admin delete pokemon_sets" ON public.pokemon_sets FOR DELETE USING (((SELECT auth.jwt()) ->> 'role') = 'admin');

-- portfolio_snapshots
CREATE POLICY "Users can view own snapshots" ON public.portfolio_snapshots FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- profiles
CREATE POLICY "read_profiles" ON public.profiles FOR SELECT USING ((is_public = true) OR ((SELECT auth.uid()) = user_id));
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "block_direct_inserts" ON public.profiles FOR INSERT WITH CHECK (false);
CREATE POLICY "block_direct_deletes" ON public.profiles FOR DELETE USING (false);

-- user_credits
CREATE POLICY "users_read_own_credits" ON public.user_credits FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Service manages all credits" ON public.user_credits FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =============================================================================
-- STORAGE
-- =============================================================================

-- Bucket: collection-card-images
-- Private bucket for user-uploaded card photos
-- Max file size: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('collection-card-images', 'collection-card-images', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies (files organized as: {user_id}/filename)
CREATE POLICY "Users can view own collection card images" ON storage.objects FOR SELECT USING (bucket_id = 'collection-card-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own collection card images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'collection-card-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own collection card images" ON storage.objects FOR UPDATE USING (bucket_id = 'collection-card-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own collection card images" ON storage.objects FOR DELETE USING (bucket_id = 'collection-card-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
