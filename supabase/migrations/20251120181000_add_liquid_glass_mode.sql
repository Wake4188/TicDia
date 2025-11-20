-- Add liquid_glass_mode column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS liquid_glass_mode boolean DEFAULT false;
