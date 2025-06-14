
-- Create a table for saved articles
CREATE TABLE public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_url TEXT,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Add Row Level Security (RLS) to ensure users can only see their own saved articles
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own saved articles
CREATE POLICY "Users can view their own saved articles" 
  ON public.saved_articles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own saved articles
CREATE POLICY "Users can save articles" 
  ON public.saved_articles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own saved articles
CREATE POLICY "Users can unsave articles" 
  ON public.saved_articles 
  FOR DELETE 
  USING (auth.uid() = user_id);
