import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateChallengeProgress, getTodaysChallenges } from '@/services/challengeService';
import { getUserAnalytics } from '@/services/analyticsService';

export const useChallengeTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkChallenges = async () => {
      try {
        const [challenges, analytics] = await Promise.all([
          getTodaysChallenges(),
          getUserAnalytics(user.id)
        ]);

        if (!analytics) return;

        for (const challenge of challenges) {
          let progress = 0;

          switch (challenge.challenge_type) {
            case 'read_articles':
              progress = analytics.articles_viewed;
              break;
            case 'scroll_distance':
              progress = Math.floor(analytics.total_scroll_distance / 1000); // Convert to km
              break;
            case 'explore_topics':
              progress = analytics.favorite_topics ? Object.keys(analytics.favorite_topics).length : 0;
              break;
            default:
              continue;
          }

          await updateChallengeProgress(user.id, challenge.id, progress);
        }
      } catch (error) {
        console.error('Failed to check challenges:', error);
      }
    };

    checkChallenges();
  }, [user]);

  return {};
};