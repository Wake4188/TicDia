-- Add smoke_effect column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS smoke_effect boolean DEFAULT true;
