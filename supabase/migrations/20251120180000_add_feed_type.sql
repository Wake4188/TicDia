-- Add feed_type column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS feed_type text DEFAULT 'mixed';

-- Add check constraint to ensure valid values
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_feed_type_check 
CHECK (feed_type IN ('random', 'curated', 'mixed'));
