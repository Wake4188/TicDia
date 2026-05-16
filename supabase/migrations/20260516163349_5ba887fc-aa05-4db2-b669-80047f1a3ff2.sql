-- 1. Restrict cleanup_old_data to admins
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  DELETE FROM public.article_votes
  WHERE voted_at < NOW() - INTERVAL '2 years';

  DELETE FROM public.user_analytics
  WHERE updated_at < NOW() - INTERVAL '1 year';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_data() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_data() TO service_role;

-- 2. Constrain article_url to safe http(s) URLs
ALTER TABLE public.article_votes
  DROP CONSTRAINT IF EXISTS article_url_safe;
ALTER TABLE public.article_votes
  ADD CONSTRAINT article_url_safe
  CHECK (article_url IS NULL OR article_url ~* '^https?://');

-- 3. Restrict public feed_curation visibility to pinned/promoted only
DROP POLICY IF EXISTS "Everyone can view active curation" ON public.feed_curation;

CREATE POLICY "Users can view promoted or pinned curation"
ON public.feed_curation
FOR SELECT
USING (
  is_active = true
  AND curation_type IN ('pinned', 'promoted')
);
