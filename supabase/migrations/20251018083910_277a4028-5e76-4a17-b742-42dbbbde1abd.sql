-- Add font_size column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS font_size INTEGER DEFAULT 16;

-- Add check constraint to ensure font_size is within reasonable range
ALTER TABLE public.user_preferences 
ADD CONSTRAINT font_size_range CHECK (font_size >= 12 AND font_size <= 24);