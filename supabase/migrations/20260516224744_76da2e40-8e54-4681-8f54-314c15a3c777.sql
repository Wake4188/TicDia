
CREATE OR REPLACE FUNCTION public.get_hidden_content_ids()
RETURNS TABLE(content_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT content_id FROM public.content_moderation WHERE is_hidden = true;
$$;

CREATE OR REPLACE FUNCTION public.get_active_content_rules()
RETURNS TABLE(rule_type text, target_type text, target_value text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT rule_type, target_type, target_value FROM public.content_rules WHERE is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_hidden_or_demoted_curation()
RETURNS TABLE(article_id text, article_title text, curation_type text, priority integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT article_id, article_title, curation_type, priority
  FROM public.feed_curation
  WHERE is_active = true AND curation_type IN ('hidden', 'demoted');
$$;

GRANT EXECUTE ON FUNCTION public.get_hidden_content_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_content_rules() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_hidden_or_demoted_curation() TO anon, authenticated;
