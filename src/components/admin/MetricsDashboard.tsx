import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Eye, MousePointerClick, AlertTriangle, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAppMetrics, AppMetric, getAdminActivityLog, AdminActivity } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';

export const MetricsDashboard = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AppMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
  const [liveStats, setLiveStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalVotes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch metrics and activity in parallel
        const [metricsData, activityData] = await Promise.all([
          getAppMetrics(7),
          getAdminActivityLog(10),
        ]);
        
        setMetrics(metricsData);
        setRecentActivity(activityData);

        // Fetch live counts from database
        const [usersResult, articlesResult, votesResult] = await Promise.all([
          supabase.from('user_analytics').select('id', { count: 'exact', head: true }),
          supabase.from('today_articles').select('id', { count: 'exact', head: true }),
          supabase.from('article_votes').select('id', { count: 'exact', head: true }),
        ]);

        setLiveStats({
          totalUsers: usersResult.count || 0,
          totalArticles: articlesResult.count || 0,
          totalVotes: votesResult.count || 0,
        });

      } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMetricValue = (type: string): number => {
    const metric = metrics.find(m => m.metric_type === type);
    return metric?.metric_value || 0;
  };

  const isPlaceholder = (type: string): boolean => {
    const metric = metrics.find(m => m.metric_type === type);
    return metric?.metadata?.is_placeholder === true;
  };

  const statCards = [
    { 
      title: 'Tracked Users', 
      value: liveStats.totalUsers, 
      icon: Users, 
      color: 'text-blue-400',
      description: 'Users with analytics data',
      live: true,
    },
    { 
      title: 'Today Articles', 
      value: liveStats.totalArticles, 
      icon: Eye, 
      color: 'text-green-400',
      description: 'Curated articles',
      live: true,
    },
    { 
      title: 'Total Votes', 
      value: liveStats.totalVotes, 
      icon: TrendingUp, 
      color: 'text-purple-400',
      description: 'All-time article votes',
      live: true,
    },
    { 
      title: 'Daily Active', 
      value: getMetricValue('daily_active_users'), 
      icon: MousePointerClick, 
      color: 'text-amber-400',
      description: 'Active users today',
      placeholder: isPlaceholder('daily_active_users'),
    },
    { 
      title: 'Page Views', 
      value: getMetricValue('page_views'), 
      icon: Eye, 
      color: 'text-cyan-400',
      description: 'Views today',
      placeholder: isPlaceholder('page_views'),
    },
    { 
      title: 'Errors', 
      value: getMetricValue('errors'), 
      icon: AlertTriangle, 
      color: 'text-red-400',
      description: 'Error count today',
      placeholder: isPlaceholder('errors'),
    },
  ];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">App Health & Metrics</CardTitle>
          </div>
          <CardDescription>
            High-level app metrics using anonymized, aggregated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statCards.map((stat, i) => (
                <div key={i} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    {stat.live && (
                      <Badge variant="outline" className="text-xs text-green-400 border-green-400/50">
                        LIVE
                      </Badge>
                    )}
                    {stat.placeholder && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        PLACEHOLDER
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{stat.title}</div>
                  <div className="text-xs text-muted-foreground/70 mt-1">{stat.description}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Admin Activity</CardTitle>
          <CardDescription>
            Audit log of admin actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recent activity</div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(activity => (
                <div key={activity.id} className="p-2 rounded border bg-muted/30 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{activity.action_type.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(activity.created_at)}</span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">{activity.action_description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
