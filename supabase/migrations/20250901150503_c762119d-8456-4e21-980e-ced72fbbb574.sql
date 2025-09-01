-- Performance optimization for RLS policies and storage limits
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_articles_user_id ON public.saved_articles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_votes_user_id ON public.article_votes(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_challenge_progress_user_id ON public.user_challenge_progress(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- Create function to limit saved articles per user (10,000 limit)
CREATE OR REPLACE FUNCTION public.check_saved_articles_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.saved_articles WHERE user_id = NEW.user_id) >= 10000 THEN
    RAISE EXCEPTION 'Maximum saved articles limit (10,000) exceeded for user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to limit daily votes per user (1,000 limit)  
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for limits
DROP TRIGGER IF EXISTS trigger_saved_articles_limit ON public.saved_articles;
CREATE TRIGGER trigger_saved_articles_limit
  BEFORE INSERT ON public.saved_articles
  FOR EACH ROW EXECUTE FUNCTION public.check_saved_articles_limit();

DROP TRIGGER IF EXISTS trigger_daily_vote_limit ON public.article_votes;
CREATE TRIGGER trigger_daily_vote_limit
  BEFORE INSERT ON public.article_votes
  FOR EACH ROW EXECUTE FUNCTION public.check_daily_vote_limit();

-- Recreate optimized RLS policies for saved_articles
DROP POLICY IF EXISTS "Users can view their own saved articles" ON public.saved_articles;
DROP POLICY IF EXISTS "Users can save articles" ON public.saved_articles;
DROP POLICY IF EXISTS "Users can unsave articles" ON public.saved_articles;

CREATE POLICY "Users can view their own saved articles" ON public.saved_articles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can save articles" ON public.saved_articles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave articles" ON public.saved_articles
  FOR DELETE USING (user_id = auth.uid());

-- Recreate optimized RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Recreate optimized RLS policies for article_votes
DROP POLICY IF EXISTS "Users can view all votes" ON public.article_votes;
DROP POLICY IF EXISTS "Users can vote on articles" ON public.article_votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON public.article_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON public.article_votes;

CREATE POLICY "Users can view all votes" ON public.article_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on articles" ON public.article_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own votes" ON public.article_votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON public.article_votes
  FOR DELETE USING (user_id = auth.uid());

-- Add constraints for data validation and security (using DO block to handle existing constraints)
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.saved_articles ADD CONSTRAINT check_article_title_length CHECK (LENGTH(article_title) <= 500);
    EXCEPTION WHEN duplicate_object THEN 
        -- Constraint already exists, skip
    END;

    BEGIN
        ALTER TABLE public.saved_articles ADD CONSTRAINT check_article_url_format CHECK (article_url IS NULL OR article_url ~* '^https?://');
    EXCEPTION WHEN duplicate_object THEN 
        -- Constraint already exists, skip
    END;

    BEGIN
        ALTER TABLE public.user_preferences ADD CONSTRAINT check_background_opacity_range CHECK (background_opacity BETWEEN 0 AND 100);
    EXCEPTION WHEN duplicate_object THEN 
        -- Constraint already exists, skip
    END;

    BEGIN
        ALTER TABLE public.user_preferences ADD CONSTRAINT check_highlight_color_format CHECK (highlight_color ~* '^#[0-9a-f]{6}$');
    EXCEPTION WHEN duplicate_object THEN 
        -- Constraint already exists, skip
    END;
END $$;

-- Create function for cleanup old analytics and vote data (optional maintenance)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;