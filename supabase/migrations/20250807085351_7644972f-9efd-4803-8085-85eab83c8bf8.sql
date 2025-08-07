-- Add daily challenges and achievements tables
CREATE TABLE public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  challenge_type TEXT NOT NULL, -- 'read_articles', 'explore_topics', 'scroll_distance'
  challenge_target INTEGER NOT NULL,
  challenge_description TEXT NOT NULL,
  category TEXT, -- optional category filter
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_date, challenge_type)
);

CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id),
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL, -- 'first_article', 'streak_7', 'explorer', etc
  achievement_name TEXT NOT NULL,
  achievement_description TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for daily_challenges (everyone can read)
CREATE POLICY "Everyone can view daily challenges" 
  ON public.daily_challenges 
  FOR SELECT 
  USING (true);

-- Policies for user_challenge_progress
CREATE POLICY "Users can view their own challenge progress" 
  ON public.user_challenge_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge progress" 
  ON public.user_challenge_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress" 
  ON public.user_challenge_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
  ON public.user_achievements 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
  ON public.user_achievements 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add audio preferences to user_analytics
ALTER TABLE public.user_analytics 
ADD COLUMN audio_articles_listened INTEGER DEFAULT 0,
ADD COLUMN total_audio_time INTEGER DEFAULT 0; -- in seconds

-- Create indexes
CREATE INDEX idx_daily_challenges_date ON public.daily_challenges(challenge_date);
CREATE INDEX idx_user_challenge_progress_user_id ON public.user_challenge_progress(user_id);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);