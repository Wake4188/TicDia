-- Fix: Revoke direct SELECT access to announcements table for non-admins
-- Users should access announcements through the public_announcements view which excludes created_by

-- Drop the existing permissive policy that exposes created_by field
DROP POLICY IF EXISTS "Everyone can view active announcements" ON public.announcements;

-- Create a new policy that only allows admins to directly query the announcements table
CREATE POLICY "Only admins can view announcements directly" 
ON public.announcements 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Note: The public_announcements view (already created) will handle public access
-- The view has security_invoker=on and excludes the created_by field