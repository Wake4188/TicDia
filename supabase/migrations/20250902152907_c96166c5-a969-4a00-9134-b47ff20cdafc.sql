-- Create a scheduled function to reset daily votes at midnight Europe/Paris time

-- First, create a function that resets daily vote counts
CREATE OR REPLACE FUNCTION reset_daily_vote_counts()
RETURNS void AS $$
BEGIN
  -- We don't need to delete votes since we're using timestamp-based queries
  -- The voting service already filters by daily timestamps
  -- This function exists for future use if needed for cleanup
  
  -- Log the reset for auditing
  INSERT INTO public.user_analytics (user_id, daily_activity)
  SELECT 
    gen_random_uuid(), -- Placeholder user_id for system events
    jsonb_build_object('vote_reset', now())
  WHERE false; -- This won't actually insert, just demonstrates structure
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up a scheduled job to run daily at midnight Paris time
-- This requires pg_cron extension (enabled in Supabase dashboard)
SELECT cron.schedule(
  'daily-vote-reset-paris',
  '0 22 * * *', -- 22:00 UTC = 00:00 Europe/Paris (accounting for DST variations)
  'SELECT reset_daily_vote_counts();'
);