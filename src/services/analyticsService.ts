import { supabase } from "@/integrations/supabase/client";

export interface UserAnalytics {
  id?: string;
  user_id: string;
  first_visit_date: string;
  articles_viewed: number;
  total_scroll_distance: number;
  longest_scroll_streak: number;
  current_scroll_streak: number;
  last_activity_date: string;
  favorite_topics: any;
  daily_activity: any;
  audio_articles_listened: number;
  total_audio_time: number;
  created_at?: string;
  updated_at?: string;
}

export const createUserAnalytics = async (userId: string): Promise<UserAnalytics> => {
  const { data, error } = await supabase
    .from('user_analytics')
    .insert({
      user_id: userId,
      first_visit_date: new Date().toISOString().split('T')[0],
      articles_viewed: 0,
      total_scroll_distance: 0,
      longest_scroll_streak: 0,
      current_scroll_streak: 0,
      last_activity_date: new Date().toISOString().split('T')[0],
      favorite_topics: [],
      daily_activity: {}
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserAnalytics = async (userId: string): Promise<UserAnalytics | null> => {
  const { data, error } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

export const updateUserAnalytics = async (userId: string, updates: Partial<UserAnalytics>): Promise<UserAnalytics> => {
  // First, verify the record exists
  const existing = await getUserAnalytics(userId);
  if (!existing) {
    throw new Error('User analytics record not found');
  }

  const { data, error } = await supabase
    .from('user_analytics')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Failed to update user analytics');
  }
  return data[0];
};

export const incrementArticleView = async (userId: string, articleTags: string[] = []) => {
  const analytics = await getUserAnalytics(userId);
  if (!analytics) return;

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Update daily activity
  const dailyActivity = { ...analytics.daily_activity };
  dailyActivity[dayOfWeek] = (dailyActivity[dayOfWeek] || 0) + 1;

  // Update favorite topics
  const favoriteTopics = [...analytics.favorite_topics];
  articleTags.forEach(tag => {
    if (!favoriteTopics.includes(tag)) {
      favoriteTopics.push(tag);
    }
  });

  // Update streak
  let currentStreak = analytics.current_scroll_streak;
  if (analytics.last_activity_date === today) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  await updateUserAnalytics(userId, {
    articles_viewed: analytics.articles_viewed + 1,
    last_activity_date: today,
    current_scroll_streak: currentStreak,
    longest_scroll_streak: Math.max(analytics.longest_scroll_streak, currentStreak),
    favorite_topics: favoriteTopics.slice(0, 20), // Keep top 20 topics
    daily_activity: dailyActivity
  });
};

export const updateScrollDistance = async (userId: string, scrollPixels: number) => {
  const analytics = await getUserAnalytics(userId);
  if (!analytics) return;

  await updateUserAnalytics(userId, {
    total_scroll_distance: analytics.total_scroll_distance + scrollPixels
  });
};

export const getDaysSinceFirstVisit = (firstVisitDate: string): number => {
  const firstVisit = new Date(firstVisitDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - firstVisit.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};