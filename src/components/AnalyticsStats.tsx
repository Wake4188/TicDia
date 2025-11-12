import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getUserAnalytics, UserAnalytics } from "@/services/analyticsService";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, TrendingUp, Award, Target, Flame, Clock, BarChart3, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  threshold: number;
  progress: number;
  unlocked: boolean;
  category: string;
}

export const AnalyticsStats = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      const data = await getUserAnalytics(user.id);
      setAnalytics(data);
      
      if (data) {
        calculateAchievements(data);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAchievements = (data: UserAnalytics) => {
    const achievementList: Achievement[] = [
      {
        id: "reader_beginner",
        title: "First Steps",
        description: "Read your first 10 articles",
        icon: BookOpen,
        threshold: 10,
        progress: data.articles_viewed,
        unlocked: data.articles_viewed >= 10,
        category: "reading"
      },
      {
        id: "reader_intermediate",
        title: "Knowledge Seeker",
        description: "Read 50 articles",
        icon: BookOpen,
        threshold: 50,
        progress: data.articles_viewed,
        unlocked: data.articles_viewed >= 50,
        category: "reading"
      },
      {
        id: "reader_advanced",
        title: "Encyclopedia",
        description: "Read 100 articles",
        icon: Trophy,
        threshold: 100,
        progress: data.articles_viewed,
        unlocked: data.articles_viewed >= 100,
        category: "reading"
      },
      {
        id: "reader_expert",
        title: "Knowledge Master",
        description: "Read 250 articles",
        icon: Award,
        threshold: 250,
        progress: data.articles_viewed,
        unlocked: data.articles_viewed >= 250,
        category: "reading"
      },
      {
        id: "streak_week",
        title: "Week Warrior",
        description: "Maintain a 7-day reading streak",
        icon: Flame,
        threshold: 7,
        progress: data.current_scroll_streak,
        unlocked: data.current_scroll_streak >= 7,
        category: "streak"
      },
      {
        id: "streak_month",
        title: "Monthly Champion",
        description: "Maintain a 30-day reading streak",
        icon: Flame,
        threshold: 30,
        progress: data.longest_scroll_streak,
        unlocked: data.longest_scroll_streak >= 30,
        category: "streak"
      },
      {
        id: "explorer",
        title: "Topic Explorer",
        description: "Read articles from 10 different topics",
        icon: Target,
        threshold: 10,
        progress: data.favorite_topics?.length || 0,
        unlocked: (data.favorite_topics?.length || 0) >= 10,
        category: "exploration"
      },
      {
        id: "audio_listener",
        title: "Audio Enthusiast",
        description: "Listen to 20 articles",
        icon: Clock,
        threshold: 20,
        progress: data.audio_articles_listened || 0,
        unlocked: (data.audio_articles_listened || 0) >= 20,
        category: "audio"
      }
    ];

    setAchievements(achievementList);
  };

  const getTopicStats = () => {
    if (!analytics?.favorite_topics) return [];
    
    return analytics.favorite_topics.slice(0, 10).map((topic: string) => ({
      name: topic,
      count: 1 // This would be actual count in a more advanced implementation
    }));
  };

  const getDailyActivityStats = () => {
    if (!analytics?.daily_activity) return [];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map(day => ({
      day,
      count: analytics.daily_activity[day] || 0
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No analytics data available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Start reading articles to see your stats!</p>
        </CardContent>
      </Card>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const scrollKm = (analytics.total_scroll_distance / 1000).toFixed(1);
  const avgArticlesPerDay = analytics.articles_viewed / Math.max(1, getDaysSinceFirstVisit(analytics.first_visit_date));
  const audioHours = Math.floor((analytics.total_audio_time || 0) / 3600);
  const audioMinutes = Math.floor(((analytics.total_audio_time || 0) % 3600) / 60);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-wikitok-red/20 to-transparent border-wikitok-red/30 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Articles Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.articles_viewed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ~{avgArticlesPerDay.toFixed(1)} per day
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/20 to-transparent border-orange-500/30 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.current_scroll_streak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Best: {analytics.longest_scroll_streak} days
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/20 to-transparent border-blue-500/30 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Topics Explored
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.favorite_topics?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {scrollKm} km scrolled
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/20 to-transparent border-purple-500/30 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Audio Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {audioHours > 0 ? `${audioHours}h` : `${audioMinutes}m`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.audio_articles_listened || 0} articles
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Achievements
              </CardTitle>
              <CardDescription>
                {unlockedCount} of {achievements.length} unlocked
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              const percentage = Math.min((achievement.progress / achievement.threshold) * 100, 100);
              
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border transition-all ${
                    achievement.unlocked
                      ? 'bg-wikitok-red/10 border-wikitok-red/30'
                      : 'bg-gray-800/40 border-gray-700/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      achievement.unlocked ? 'bg-wikitok-red/20' : 'bg-gray-700/50'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        achievement.unlocked ? 'text-wikitok-red' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{achievement.title}</h4>
                        {achievement.unlocked && (
                          <Badge className="bg-wikitok-red/20 text-wikitok-red border-wikitok-red/30 text-xs">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="space-y-1">
                        <Progress value={percentage} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {achievement.progress} / {achievement.threshold}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Topic Distribution */}
      {getTopicStats().length > 0 && (
        <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Your Top Topics
            </CardTitle>
            <CardDescription>Topics you've explored the most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getTopicStats().map((topic, index) => (
                <motion.div
                  key={topic.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="secondary"
                    className="bg-wikitok-red/10 border-wikitok-red/30 hover:bg-wikitok-red/20 transition-colors"
                  >
                    {topic.name}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Activity */}
      <Card className="bg-gray-900/80 backdrop-blur-md border-gray-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Activity
          </CardTitle>
          <CardDescription>Your reading pattern by day of the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getDailyActivityStats().map((day, index) => {
              const maxCount = Math.max(...getDailyActivityStats().map(d => d.count), 1);
              const percentage = (day.count / maxCount) * 100;
              
              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{day.day}</span>
                    <span className="text-muted-foreground">{day.count} articles</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function getDaysSinceFirstVisit(firstVisitDate: string): number {
  const firstVisit = new Date(firstVisitDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - firstVisit.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
