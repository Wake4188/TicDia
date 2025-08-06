
-- Create user_analytics table to track user engagement
CREATE TABLE public.user_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  first_visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  articles_viewed INTEGER NOT NULL DEFAULT 0,
  total_scroll_distance INTEGER NOT NULL DEFAULT 0, -- in pixels
  longest_scroll_streak INTEGER NOT NULL DEFAULT 0,
  current_scroll_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  favorite_topics JSONB DEFAULT '[]'::jsonb,
  daily_activity JSONB DEFAULT '{}'::jsonb, -- stores day-wise activity
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for user_analytics
CREATE POLICY "Users can view their own analytics" 
  ON public.user_analytics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" 
  ON public.user_analytics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" 
  ON public.user_analytics 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX idx_user_analytics_first_visit ON public.user_analytics(first_visit_date);
