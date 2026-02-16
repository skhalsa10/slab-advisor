-- Function to generate URL-safe slugs from binder names
CREATE OR REPLACE FUNCTION public.generate_binder_slug(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM(p_name), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;

-- Trigger function to prevent modification of default binder's critical fields
CREATE OR REPLACE FUNCTION public.protect_default_binder()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Prevent changing is_default from true to false
    IF OLD.is_default = true AND NEW.is_default = false THEN
        RAISE EXCEPTION 'Cannot unset default binder flag';
    END IF;

    -- Prevent changing the name of the default binder
    IF OLD.is_default = true AND NEW.name != OLD.name THEN
        RAISE EXCEPTION 'Cannot rename the default binder';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_default_binder_trigger
    BEFORE UPDATE ON public.binders
    FOR EACH ROW EXECUTE FUNCTION protect_default_binder();
