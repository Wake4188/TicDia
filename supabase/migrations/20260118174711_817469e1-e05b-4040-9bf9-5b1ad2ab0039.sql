-- Create a secure view for public announcements that excludes admin user IDs
CREATE OR REPLACE VIEW public.public_announcements
WITH (security_invoker=on) AS
SELECT 
  id, 
  title, 
  content, 
  announcement_type, 
  target_audience, 
  is_active, 
  priority, 
  starts_at, 
  ends_at, 
  created_at, 
  updated_at
FROM public.announcements
WHERE is_active = true 
  AND (starts_at IS NULL OR starts_at <= now()) 
  AND (ends_at IS NULL OR ends_at > now());

-- Grant SELECT access to the view for authenticated and anon users
GRANT SELECT ON public.public_announcements TO authenticated;
GRANT SELECT ON public.public_announcements TO anon;