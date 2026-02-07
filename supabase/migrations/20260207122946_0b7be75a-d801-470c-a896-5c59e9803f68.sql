-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Users can view all votes" ON public.article_votes;
