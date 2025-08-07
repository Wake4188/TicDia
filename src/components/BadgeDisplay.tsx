import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Flame, BookOpen } from "lucide-react";
import { getUserAnalytics } from "@/services/analyticsService";
import { getUserAchievements } from "@/services/challengeService";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const BadgeDisplay = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [analyticsData, achievementsData] = await Promise.all([
          getUserAnalytics(user.id),
          getUserAchievements(user.id)
        ]);
        
        setAnalytics(analyticsData);
        setAchievements(achievementsData);
        
        // Calculate current streak
        if (analyticsData) {
          setCurrentStreak(analyticsData.current_scroll_streak || 0);
        }
      } catch (error) {
        console.error('Failed to fetch badge data:', error);
      }
    };

    fetchData();
  }, [user]);

  if (!user || !analytics) return null;

  const badges = [
    {
      icon: <BookOpen className="h-3 w-3" />,
      label: `${analytics.articles_viewed} Articles`,
      color: "bg-primary",
      show: analytics.articles_viewed > 0
    },
    {
      icon: <Flame className="h-3 w-3" />,
      label: `${currentStreak} Day Streak`,
      color: currentStreak >= 7 ? "bg-orange-500" : "bg-secondary",
      show: currentStreak > 0
    },
    {
      icon: <Target className="h-3 w-3" />,
      label: `${Math.round(analytics.total_scroll_distance / 1000)}km Scrolled`,
      color: "bg-blue-500",
      show: analytics.total_scroll_distance > 1000
    },
    {
      icon: <Trophy className="h-3 w-3" />,
      label: `${achievements.length} Achievements`,
      color: "bg-yellow-500",
      show: achievements.length > 0
    }
  ];

  const visibleBadges = badges.filter(badge => badge.show);

  if (visibleBadges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-4 z-40 flex flex-wrap gap-2 max-w-[200px]"
    >
      {visibleBadges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <Badge
            variant="secondary"
            className={`${badge.color} text-white text-xs flex items-center gap-1 px-2 py-1 shadow-lg backdrop-blur-sm`}
          >
            {badge.icon}
            {badge.label}
          </Badge>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BadgeDisplay;