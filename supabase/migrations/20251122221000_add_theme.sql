-- Add theme column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS theme varchar(10) DEFAULT 'dark';

-- Add constraint to ensure theme is either 'dark' or 'light'
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_theme_check 
CHECK (theme IN ('dark', 'light'));
