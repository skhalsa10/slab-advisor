-- Update the signup trigger to also create the default "All Cards" binder

CREATE OR REPLACE FUNCTION public.initialize_user_credits_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Create user credits
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

    -- Create user settings (column defaults apply)
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create default "All Cards" binder
    INSERT INTO binders (user_id, name, slug, is_default, sort_order)
    VALUES (NEW.id, 'All Cards', 'all-cards', true, 0)
    ON CONFLICT (user_id, slug) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to initialize user data for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Backfill: Create default binder for existing users who don't have one
INSERT INTO binders (user_id, name, slug, is_default, sort_order)
SELECT uc.user_id, 'All Cards', 'all-cards', true, 0
FROM user_credits uc
LEFT JOIN binders b ON uc.user_id = b.user_id AND b.is_default = true
WHERE b.id IS NULL
ON CONFLICT (user_id, slug) DO NOTHING;
