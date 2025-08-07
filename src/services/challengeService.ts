import { supabase } from "@/integrations/supabase/client";

export interface DailyChallenge {
  id: string;
  challenge_date: string;
  challenge_type: string;
  challenge_target: number;
  challenge_description: string;
  category?: string;
}

export interface UserChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string;
  earned_at: string;
  metadata?: any;
}

// Get today's challenges
export const getTodaysChallenges = async (): Promise<DailyChallenge[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', today);

  if (error) throw error;
  return data || [];
};

// Get user's challenge progress for today
export const getUserChallengeProgress = async (userId: string): Promise<UserChallengeProgress[]> => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('user_challenge_progress')
    .select(`
      *,
      daily_challenges!inner (
        challenge_date,
        challenge_type,
        challenge_target,
        challenge_description
      )
    `)
    .eq('user_id', userId)
    .eq('daily_challenges.challenge_date', today);

  if (error) throw error;
  return data || [];
};

// Update challenge progress
export const updateChallengeProgress = async (
  userId: string,
  challengeId: string,
  progress: number
): Promise<void> => {
  const { data: existingProgress } = await supabase
    .from('user_challenge_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .single();

  const { data: challenge } = await supabase
    .from('daily_challenges')
    .select('challenge_target')
    .eq('id', challengeId)
    .single();

  const isCompleted = progress >= (challenge?.challenge_target || 0);
  const completedAt = isCompleted ? new Date().toISOString() : null;

  if (existingProgress) {
    await supabase
      .from('user_challenge_progress')
      .update({
        progress: Math.max(existingProgress.progress, progress),
        completed: isCompleted,
        completed_at: completedAt
      })
      .eq('id', existingProgress.id);
  } else {
    await supabase
      .from('user_challenge_progress')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        progress,
        completed: isCompleted,
        completed_at: completedAt
      });
  }

  // Award achievement if challenge completed
  if (isCompleted && !existingProgress?.completed) {
    await awardAchievement(userId, 'challenge_completed', 'Challenge Master', 'Completed a daily challenge!');
  }
};

// Get user achievements
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Award achievement
export const awardAchievement = async (
  userId: string,
  achievementType: string,
  achievementName: string,
  achievementDescription: string,
  metadata?: any
): Promise<void> => {
  // Check if user already has this achievement
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_type', achievementType)
    .single();

  if (existing) return; // Already awarded

  await supabase
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_type: achievementType,
      achievement_name: achievementName,
      achievement_description: achievementDescription,
      metadata
    });
};

// Create daily challenges (admin function)
export const createDailyChallenge = async (
  challengeType: string,
  target: number,
  description: string,
  category?: string
): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  
  await supabase
    .from('daily_challenges')
    .insert({
      challenge_date: today,
      challenge_type: challengeType,
      challenge_target: target,
      challenge_description: description,
      category
    });
};