-- Update the signup trigger to also create user_settings record
-- Column defaults (show_grading_tips=true, subscription_tier='free') are applied automatically

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

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to initialize user data for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Backfill any users who have credits but no settings (edge case)
INSERT INTO user_settings (user_id)
SELECT uc.user_id
FROM user_credits uc
LEFT JOIN user_settings us ON uc.user_id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
