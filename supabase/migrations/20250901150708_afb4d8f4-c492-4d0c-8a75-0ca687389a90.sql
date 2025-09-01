-- Fix security warnings by updating functions with proper search_path
CREATE OR REPLACE FUNCTION public.check_saved_articles_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.saved_articles WHERE user_id = NEW.user_id) >= 10000 THEN
    RAISE EXCEPTION 'Maximum saved articles limit (10,000) exceeded for user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_daily_vote_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.article_votes 
      WHERE user_id = NEW.user_id 
      AND DATE(voted_at) = CURRENT_DATE) >= 1000 THEN
    RAISE EXCEPTION 'Maximum daily votes limit (1,000) exceeded for user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete vote data older than 2 years
  DELETE FROM public.article_votes 
  WHERE voted_at < NOW() - INTERVAL '2 years';
  
  -- Cleanup analytics data older than 1 year but keep summary records
  DELETE FROM public.user_analytics 
  WHERE updated_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;