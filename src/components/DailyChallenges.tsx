import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Target, Trophy } from "lucide-react";
import { getTodaysChallenges, getUserChallengeProgress } from "@/services/challengeService";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface ChallengeWithProgress {
  id: string;
  challenge_type: string;
  challenge_target: number;
  challenge_description: string;
  progress: number;
  completed: boolean;
}

const DailyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChallenges = async () => {
      try {
        const [allChallenges, userProgress] = await Promise.all([
          getTodaysChallenges(),
          getUserChallengeProgress(user.id)
        ]);

        const challengesWithProgress = allChallenges.map(challenge => {
          const progress = userProgress.find(p => p.challenge_id === challenge.id);
          return {
            ...challenge,
            progress: progress?.progress || 0,
            completed: progress?.completed || false
          };
        });

        setChallenges(challengesWithProgress);
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [user]);

  if (!user || loading) return null;
  if (challenges.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 z-40 w-80 max-h-96 overflow-y-auto"
    >
      <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-lg border transition-colors ${
                challenge.completed
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-muted/50 border-border/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{challenge.challenge_description}</p>
                {challenge.completed && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Done
                  </Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{challenge.progress} / {challenge.challenge_target}</span>
                  <span>{Math.round((challenge.progress / challenge.challenge_target) * 100)}%</span>
                </div>
                <Progress 
                  value={(challenge.progress / challenge.challenge_target) * 100}
                  className="h-2"
                />
              </div>
            </motion.div>
          ))}
          
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" />
              Complete challenges to earn achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyChallenges;