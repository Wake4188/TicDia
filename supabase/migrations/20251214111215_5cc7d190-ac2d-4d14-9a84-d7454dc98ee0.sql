-- Add age and adult content settings to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS birth_year integer,
ADD COLUMN IF NOT EXISTS allow_adult_content boolean DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN public.user_preferences.birth_year IS 'User birth year for age verification';
COMMENT ON COLUMN public.user_preferences.allow_adult_content IS 'Whether user is 18+ and has allowed adult content';