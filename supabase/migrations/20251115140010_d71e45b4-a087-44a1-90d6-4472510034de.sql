-- Fix security issue: Add admin policies for daily_challenges table
-- This allows admins to manage daily challenges through the application

CREATE POLICY "Admins can insert challenges"
ON daily_challenges FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update challenges"
ON daily_challenges FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete challenges"
ON daily_challenges FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Fix security issue: Restrict article_votes SELECT policy to protect user privacy
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all votes" ON article_votes;

-- Add restricted policy: users can only view their own votes
CREATE POLICY "Users can view their own votes"
ON article_votes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Create a security definer function to get aggregate vote counts
-- This allows the application to show vote totals without exposing individual voting records
CREATE OR REPLACE FUNCTION public.get_article_vote_count(p_article_id text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM article_votes
  WHERE article_id = p_article_id
    AND vote_type = 'upvote';
$$;

-- Create a security definer function to get top voted articles
-- This protects individual vote data while allowing aggregate queries
CREATE OR REPLACE FUNCTION public.get_top_voted_articles(p_limit integer DEFAULT 3, p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  article_id text,
  article_title text,
  article_url text,
  vote_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    article_id,
    article_title,
    article_url,
    COUNT(*) as vote_count
  FROM article_votes
  WHERE vote_type = 'upvote'
    AND DATE(voted_at) = p_date
  GROUP BY article_id, article_title, article_url
  ORDER BY vote_count DESC
  LIMIT p_limit;
$$;