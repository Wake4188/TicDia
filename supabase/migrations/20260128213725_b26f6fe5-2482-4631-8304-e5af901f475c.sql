-- Create a public view for word_of_the_day that excludes sensitive created_by field
CREATE OR REPLACE VIEW public.public_word_of_the_day 
WITH (security_invoker = on) AS
SELECT 
  id, 
  word, 
  word_date, 
  is_admin_selected, 
  created_at, 
  updated_at
FROM public.word_of_the_day;

-- Grant access to the view
GRANT SELECT ON public.public_word_of_the_day TO anon, authenticated;

-- Update the existing policy to restrict direct table access for non-admins
DROP POLICY IF EXISTS "Everyone can view word of the day" ON public.word_of_the_day;

-- Only admins can directly access the table; public uses the view
CREATE POLICY "Admins can view word of the day directly"
ON public.word_of_the_day FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));