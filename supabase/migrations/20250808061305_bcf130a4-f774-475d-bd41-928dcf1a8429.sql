-- Create table for article votes
CREATE TABLE public.article_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_url TEXT,
  vote_type TEXT NOT NULL DEFAULT 'upvote' CHECK (vote_type IN ('upvote', 'downvote')),
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.article_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for article votes
CREATE POLICY "Users can vote on articles" 
ON public.article_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.article_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all votes" 
ON public.article_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own votes" 
ON public.article_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add user preferences for TTS autoplay
ALTER TABLE public.user_preferences 
ADD COLUMN tts_autoplay BOOLEAN NOT NULL DEFAULT false;