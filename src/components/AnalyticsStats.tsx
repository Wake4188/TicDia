import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getUserAnalytics, UserAnalytics } from "@/services/analyticsService";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, TrendingUp, Award, Target, Flame, Clock, Trophy, Star, Zap, BarChart3, PieChart } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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

const chartConfig = {
  articles: {
    label: "Articles Read",
    color: "hsl(var(--primary))",
  },
  streak: {
    label: "Streak",
    color: "hsl(var(--orange-500))",
  },
} satisfies ChartConfig;

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
    // Return mock data if no real data exists for visualization
    if (!analytics?.favorite_topics || analytics.favorite_topics.length === 0) {
      return [
        { name: "Science", value: 8, fill: "hsl(var(--chart-1))" },
        { name: "History", value: 6, fill: "hsl(var(--chart-2))" },
        { name: "Technology", value: 5, fill: "hsl(var(--chart-3))" },
        { name: "Art", value: 4, fill: "hsl(var(--chart-4))" },
        { name: "Nature", value: 3, fill: "hsl(var(--chart-5))" },
      ];
    }
    return analytics.favorite_topics.slice(0, 5).map((topic: string, index: number) => ({
      name: topic,
      value: 10 - index,
      fill: `hsl(var(--chart-${(index % 5) + 1}))`
    }));
  };

  const getDailyActivityStats = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Return mock data if no real activity data exists
    if (!analytics?.daily_activity || Object.keys(analytics.daily_activity).length === 0) {
      return days.map((day, i) => ({
        day: day.substring(0, 3),
        articles: Math.floor(Math.random() * 5) + 1
      }));
    }
    return days.map(day => ({
      day: day.substring(0, 3),
      articles: analytics.daily_activity[day] || 0
    }));
  };

  const calculateLevel = (articlesRead: number) => {
    const level = Math.floor(Math.sqrt(articlesRead)) + 1;
    const currentLevelBaseXP = Math.pow(level - 1, 2);
    const nextLevelBaseXP = Math.pow(level, 2);
    const levelProgress = articlesRead - currentLevelBaseXP;
    const levelTotalXP = nextLevelBaseXP - currentLevelBaseXP;
    const progressPercentage = Math.min((levelProgress / levelTotalXP) * 100, 100);

    return {
      level,
      progressPercentage,
      nextLevelXP: nextLevelBaseXP - articlesRead,
      currentXP: articlesRead
    };
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
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
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
  const avgArticlesPerDay = analytics.articles_viewed / Math.max(1, 30); // Simplified for now
  const audioHours = Math.floor((analytics.total_audio_time || 0) / 3600);
  const audioMinutes = Math.floor(((analytics.total_audio_time || 0) % 3600) / 60);
  const levelStats = calculateLevel(analytics.articles_viewed);
  const dailyData = getDailyActivityStats();
  const topicData = getTopicStats();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Level Progress Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Star className="w-64 h-64 text-primary rotate-12" />
          </div>
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-background flex items-center justify-center border-4 border-primary shadow-lg shadow-primary/20">
                    <span className="text-3xl sm:text-4xl font-bold text-primary">{levelStats.level}</span>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                    LEVEL
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-foreground">Knowledge Seeker</h3>
                  <p className="text-muted-foreground">Keep reading to unlock new titles!</p>
                </div>
              </div>

              <div className="w-full sm:w-1/2 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-primary">{levelStats.currentXP} XP</span>
                  <span className="text-muted-foreground">{levelStats.nextLevelXP} XP to next level</span>
                </div>
                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelStats.progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Articles Read", value: analytics.articles_viewed, icon: BookOpen, color: "text-blue-500", sub: "Total lifetime" },
          { title: "Current Streak", value: analytics.current_scroll_streak, icon: Flame, color: "text-orange-500", sub: `Best: ${analytics.longest_scroll_streak}` },
          { title: "Topics Explored", value: analytics.favorite_topics?.length || 0, icon: Target, color: "text-green-500", sub: `${scrollKm}km scrolled` },
          { title: "Audio Time", value: audioHours > 0 ? `${audioHours}h` : `${audioMinutes}m`, icon: Clock, color: "text-purple-500", sub: `${analytics.audio_articles_listened || 0} listened` }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-background ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {index === 1 && (
                    <Badge variant="outline" className="border-orange-500/20 text-orange-500 bg-orange-500/10">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-bold text-foreground">{stat.value}</h4>
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-[10px] text-muted-foreground/60">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Weekly Activity
              </CardTitle>
              <CardDescription>Articles read over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer config={chartConfig}>
                  <BarChart data={dailyData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/20" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-xs text-muted-foreground"
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="articles"
                      fill="var(--color-articles)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Topic Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Top Topics
              </CardTitle>
              <CardDescription>Your favorite reading categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                {topicData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border p-2 rounded-lg shadow-lg">
                                <p className="font-medium text-popover-foreground">{payload[0].name}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No topic data yet</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {topicData.map((topic, index) => (
                  <div key={topic.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: topic.fill }} />
                    {topic.name}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
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
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                const percentage = Math.min((achievement.progress / achievement.threshold) * 100, 100);

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className={`p-4 rounded-xl border transition-all duration-300 ${achievement.unlocked
                        ? 'bg-primary/5 border-primary/20 shadow-sm'
                        : 'bg-muted/30 border-border/50 grayscale opacity-70'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${achievement.unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate text-foreground">{achievement.title}</h4>
                          {achievement.unlocked && (
                            <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 h-8">
                          {achievement.description}
                        </p>
                        <div className="space-y-1.5">
                          <Progress
                            value={percentage}
                            className="h-1.5"
                          // Using custom CSS variable for progress color if needed, but default is fine
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                            <span>{achievement.progress}</span>
                            <span>{achievement.threshold}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
