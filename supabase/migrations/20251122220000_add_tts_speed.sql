-- Add tts_speed column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS tts_speed numeric DEFAULT 1.0;

-- Add constraint to ensure speed is within reasonable range (0.25x to 4x)
ALTER TABLE user_preferences 
ADD CONSTRAINT user_preferences_tts_speed_check 
CHECK (tts_speed >= 0.25 AND tts_speed <= 4.0);
