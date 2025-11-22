import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserAnalytics, getDaysSinceFirstVisit } from '@/services/analyticsService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Gift, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AnalyticsCheck = () => {
  const { user } = useAuth();
  const [showRecapBanner, setShowRecapBanner] = useState(false);
  const [daysSinceJoining, setDaysSinceJoining] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkRecapEligibility = async () => {
      // Recap paused for now
      setShowRecapBanner(false);
    };

    checkRecapEligibility();
  }, [user]);

  if (!showRecapBanner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
    >
      <Card className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 p-4 text-center max-w-sm">
        <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="text-white font-bold mb-1">Your TicDia Recap is Ready! 🎉</h3>
        <p className="text-white/60 text-sm mb-3">
          {daysSinceJoining} days of knowledge await you
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/recap')}
            className="bg-primary hover:bg-primary/80 flex-1"
          >
            View Recap
          </Button>
          <Button
            onClick={() => setShowRecapBanner(false)}
            variant="outline"
            size="sm"
            className="border-white/20 text-white/60"
          >
            Later
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};