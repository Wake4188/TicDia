-- Fix RLS function security issue by setting search_path immutable for functions

-- Update the reset function to have a fixed search_path
CREATE OR REPLACE FUNCTION reset_daily_vote_counts()
RETURNS void AS $$
BEGIN
  -- We don't need to delete votes since we're using timestamp-based queries
  -- The voting service already filters by daily timestamps
  -- This function exists for future use if needed for cleanup
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;