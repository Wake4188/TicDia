-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop old policies on today_articles
DROP POLICY IF EXISTS "Admin can create today articles" ON public.today_articles;
DROP POLICY IF EXISTS "Admin can update today articles" ON public.today_articles;
DROP POLICY IF EXISTS "Admin can delete today articles" ON public.today_articles;

-- Create new policies using has_role function
CREATE POLICY "Admins can create today articles"
ON public.today_articles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update today articles"
ON public.today_articles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete today articles"
ON public.today_articles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Insert admin role for the existing admin user (you can modify this email or add more admins later)
-- This will only work if the user with this email already exists in auth.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'jessica.wilhide@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::public.app_role
    FROM auth.users
    WHERE email = 'jessica.wilhide@gmail.com'
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;