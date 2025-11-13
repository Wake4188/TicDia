-- Add noa.wilhide@gmail.com as admin when they sign up
-- This migration adds the new admin and creates a trigger to auto-grant admin privileges

-- Insert admin role for noa.wilhide@gmail.com if the user already exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'noa.wilhide@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::public.app_role
    FROM auth.users
    WHERE email = 'noa.wilhide@gmail.com'
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Create or replace function to auto-grant admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-grant admin role to specific email addresses
  IF NEW.email IN ('jessica.wilhide@gmail.com', 'noa.wilhide@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();