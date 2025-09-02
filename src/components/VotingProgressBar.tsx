import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";
import { getTopVotedArticles } from "@/services/votingService";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/services/translations";

interface TopArticle {
  id: string;
  title: string;
  url?: string;
  votes: number;
}

const VotingProgressBar = () => {
  const { currentLanguage } = useLanguage();
  const t = (key: string, params?: Record<string, string | number>) => 
    getTranslation(key, currentLanguage.code, params);

  const { data: topArticles = [], isLoading } = useQuery({
    queryKey: ["topVotedArticles"],
    queryFn: () => getTopVotedArticles(5),
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  const maxVotes = topArticles.length > 0 ? topArticles[0].votes : 1;

  if (isLoading || topArticles.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {t('topArticlesToday')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topArticles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-white truncate flex-1 mr-2">
                {index + 1}. {article.title}
              </span>
              <span className="text-gray-400 flex items-center gap-1 flex-shrink-0">
                <TrendingUp className="w-3 h-3" />
                {article.votes}
              </span>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1, delay: index * 0.2 }}
            >
              <Progress
                value={(article.votes / maxVotes) * 100}
                className="h-2"
                indicatorClassName={`transition-all duration-1000 ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' :
                  'bg-blue-500'
                }`}
              />
            </motion.div>
          </motion.div>
        ))}
        
        <div className="text-xs text-gray-500 text-center mt-4 pt-2 border-t border-gray-800">
          {t('dailyRankingResets')} • {t('europeParisTime')}
        </div>
      </CardContent>
    </Card>
  );
};

export default VotingProgressBar;