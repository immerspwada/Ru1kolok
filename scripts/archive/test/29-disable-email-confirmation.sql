-- Disable Email Confirmation for Development
-- This allows users to sign up without email verification
-- Re-enable this in production by setting enable_confirmations = true

-- Note: This is executed via Supabase Dashboard or API
-- You cannot modify auth.config via SQL directly

-- Instead, we'll document the manual steps needed:

/*
MANUAL STEPS TO DISABLE EMAIL CONFIRMATION:

1. Go to Supabase Dashboard: https://ettpbpznktyttpnyqhkr.supabase.co
2. Navigate to: Authentication → Settings → Email Auth
3. Find "Confirm email" toggle
4. Turn it OFF for development
5. Click "Save"

This will allow users to sign up and login immediately without email verification.

For production, turn it back ON to require email verification.
*/

-- Alternative: Auto-confirm users after signup (if you want to keep the flow)
-- This function can be used to auto-confirm users in development

CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm user in development
  -- Remove this in production
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm users
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.auto_confirm_user();

-- Note: The trigger above is commented out because modifying auth.users
-- directly may not work depending on Supabase version.
-- Use the Dashboard method instead.
