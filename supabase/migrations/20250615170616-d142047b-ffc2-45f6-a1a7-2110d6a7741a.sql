
-- Create table for storing user preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  font_family TEXT NOT NULL DEFAULT 'Inter',
  background_opacity INTEGER NOT NULL DEFAULT 70,
  highlight_color TEXT NOT NULL DEFAULT '#FE2C55',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for today's articles (this was missing from the database)
CREATE TABLE public.today_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_admin_added BOOLEAN NOT NULL DEFAULT true
);

-- Add Row Level Security (RLS) to user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own preferences
CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own preferences
CREATE POLICY "Users can create their own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own preferences
CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add RLS to today_articles (public read, admin write)
ALTER TABLE public.today_articles ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to view today's articles
CREATE POLICY "Everyone can view today articles" 
  ON public.today_articles 
  FOR SELECT 
  TO public
  USING (true);

-- Create policy that allows admin to insert articles
CREATE POLICY "Admin can create today articles" 
  ON public.today_articles 
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'email' = 'jessica.wilhide@gmail.com');

-- Create policy that allows admin to update articles
CREATE POLICY "Admin can update today articles" 
  ON public.today_articles 
  FOR UPDATE 
  USING (auth.jwt() ->> 'email' = 'jessica.wilhide@gmail.com');

-- Create policy that allows admin to delete articles
CREATE POLICY "Admin can delete today articles" 
  ON public.today_articles 
  FOR DELETE 
  USING (auth.jwt() ->> 'email' = 'jessica.wilhide@gmail.com');

-- Create unique constraint on user_id for user_preferences
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);
