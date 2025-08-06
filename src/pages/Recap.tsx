import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAnalytics, UserAnalytics, getDaysSinceFirstVisit } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Share2, Download, Calendar, BookOpen, MousePointer, Target, Award, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Recap = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadAnalytics = async () => {
      try {
        const data = await getUserAnalytics(user.id);
        if (data) {
          setAnalytics(data);
          const daysSince = getDaysSinceFirstVisit(data.first_visit_date);
          setIsEligible(daysSince >= 365 || daysSince >= 1); // For demo, allow after 1 day
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

  const shareRecap = async () => {
    if (!analytics) return;

    const text = `🎉 My TikDia Year in Review!\n\n📚 ${analytics.articles_viewed} articles read\n📏 ${Math.round(analytics.total_scroll_distance / 1000)}km scrolled\n🔥 ${analytics.longest_scroll_streak} day streak\n\nJoin me on TikDia!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (error) {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your recap...</div>
      </div>
    );
  }

  if (!analytics || !isEligible) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Not Yet Available</h2>
          <p className="text-white/60 mb-4">
            Your personalized recap will be available after you've been using TikDia for 365 days.
          </p>
          {analytics && (
            <p className="text-white/40 text-sm">
              Days since joining: {getDaysSinceFirstVisit(analytics.first_visit_date)}
            </p>
          )}
        </Card>
      </div>
    );
  }

  const scrollDistanceKm = Math.round(analytics.total_scroll_distance / 1000);
  const favoriteDay = Object.entries(analytics.daily_activity).reduce((a, b) => 
    analytics.daily_activity[a[0]] > analytics.daily_activity[b[0]] ? a : b
  )[0] || 'Monday';

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1 
          className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Your TikDia
        </motion.h1>
        <motion.h2 
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          Year in Review
        </motion.h2>
        <motion.p 
          className="text-xl md:text-2xl text-white/60 mb-8"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          You've scrolled through knowledge for {getDaysSinceFirstVisit(analytics.first_visit_date)} days straight
        </motion.p>
      </motion.div>

      {/* Stats Sections */}
      <div className="space-y-16 p-4">
        {/* Articles Read */}
        <motion.div 
          className="min-h-screen flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <BookOpen className="w-24 h-24 text-primary mb-8" />
          <motion.div 
            className="text-8xl md:text-9xl font-bold mb-4 text-primary"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
            viewport={{ once: true }}
          >
            {analytics.articles_viewed}
          </motion.div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Articles Read</h3>
          <p className="text-xl text-white/60">That's knowledge worth celebrating!</p>
        </motion.div>

        {/* Scroll Distance */}
        <motion.div 
          className="min-h-screen flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <MousePointer className="w-24 h-24 text-purple-500 mb-8" />
          <motion.div 
            className="text-8xl md:text-9xl font-bold mb-4 text-purple-500"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
            viewport={{ once: true }}
          >
            {scrollDistanceKm}
          </motion.div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Kilometers Scrolled</h3>
          <p className="text-xl text-white/60">Your thumb deserves a medal!</p>
        </motion.div>

        {/* Longest Streak */}
        <motion.div 
          className="min-h-screen flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <Award className="w-24 h-24 text-yellow-500 mb-8" />
          <motion.div 
            className="text-8xl md:text-9xl font-bold mb-4 text-yellow-500"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
            viewport={{ once: true }}
          >
            {analytics.longest_scroll_streak}
          </motion.div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Day Streak</h3>
          <p className="text-xl text-white/60">Consistency is key to learning!</p>
        </motion.div>

        {/* Favorite Day */}
        <motion.div 
          className="min-h-screen flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <TrendingUp className="w-24 h-24 text-green-500 mb-8" />
          <motion.div 
            className="text-6xl md:text-7xl font-bold mb-4 text-green-500"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring" }}
            viewport={{ once: true }}
          >
            {favoriteDay}
          </motion.div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">Your Power Day</h3>
          <p className="text-xl text-white/60">This is when you scroll the most!</p>
        </motion.div>

        {/* Shareable Card */}
        <motion.div 
          className="min-h-screen flex flex-col items-center justify-center p-4"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/30 p-8 max-w-md w-full text-center">
            <div className="text-2xl font-bold mb-4">TikDia</div>
            <div className="text-lg font-semibold mb-6">
              {user?.email?.split('@')[0]}'s Year in Review
            </div>
            <div className="space-y-4 text-sm">
              <div>📚 {analytics.articles_viewed} articles read</div>
              <div>📏 {scrollDistanceKm}km scrolled</div>
              <div>🔥 {analytics.longest_scroll_streak} day streak</div>
              <div>📅 Most active on {favoriteDay}s</div>
            </div>
            <div className="mt-6 text-xs text-white/60">
              {getDaysSinceFirstVisit(analytics.first_visit_date)} days of knowledge
            </div>
          </Card>
          
          <div className="flex gap-4 mt-8">
            <Button onClick={shareRecap} className="bg-primary hover:bg-primary/80">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Recap;