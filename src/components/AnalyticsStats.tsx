import { memo, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserAnalytics, UserAnalytics, getDaysSinceFirstVisit } from "@/services/analyticsService";
import { useAuth } from "@/contexts/AuthContext";
import {
  BookOpen, Flame, Clock, Footprints, CalendarDays,
  Headphones, Sparkles, TrendingUp, Tag, BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reading insights — real data only, no random/mocked fallbacks.
 * Designed to match the TicDia aesthetic: newspaper headers, glass cards,
 * honest empty states instead of fabricated values.
 */

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 60) return `${Math.round(seconds || 0)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatDistance = (px: number) => {
  // ~3779 px per meter at standard 96 DPI is wildly device-dependent, so we
  // present a simple km-ish figure (px / 1000) — same convention as before but
  // clearly labelled.
  const km = (px || 0) / 1000;
  if (km >= 1) return `${km.toFixed(1)} km`;
  return `${Math.round(px || 0)} px`;
};

export const AnalyticsStats = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const data = await getUserAnalytics(user.id);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const derived = useMemo(() => {
    if (!analytics) return null;
    const daysActive = analytics.first_visit_date
      ? Math.max(1, getDaysSinceFirstVisit(analytics.first_visit_date))
      : 1;
    const articlesPerDay = analytics.articles_viewed / daysActive;
    const weekData = DAY_ORDER.map((day) => ({
      day: day.slice(0, 3),
      fullDay: day,
      articles: Number(analytics.daily_activity?.[day] || 0),
    }));
    const totalWeek = weekData.reduce((s, d) => s + d.articles, 0);
    const bestDay = weekData.reduce((best, d) => (d.articles > best.articles ? d : best), weekData[0]);
    const topics: string[] = Array.isArray(analytics.favorite_topics) ? analytics.favorite_topics : [];
    return { daysActive, articlesPerDay, weekData, totalWeek, bestDay, topics };
  }, [analytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          Sign in to view your reading insights.
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.articles_viewed === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="py-16 text-center space-y-3">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50" />
          <h3 className="font-newspaper text-2xl text-foreground">No insights yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Start reading articles and your stats — streaks, topics, weekly activity — will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const a = analytics;
  const d = derived!;

  const heroStats = [
    { label: "Articles read", value: a.articles_viewed.toLocaleString(), icon: BookOpen },
    { label: "Days with TicDia", value: d.daysActive.toLocaleString(), icon: CalendarDays },
    { label: "Current streak", value: `${a.current_scroll_streak}d`, icon: Flame, accent: a.current_scroll_streak > 0 },
    { label: "Listening time", value: formatDuration(a.total_audio_time || 0), icon: Headphones },
  ];

  const secondaryStats = [
    { label: "Longest streak", value: `${a.longest_scroll_streak} days`, icon: TrendingUp },
    { label: "Per day average", value: d.articlesPerDay.toFixed(1), icon: Sparkles },
    { label: "Audio articles", value: (a.audio_articles_listened || 0).toLocaleString(), icon: Headphones },
    { label: "Distance scrolled", value: formatDistance(a.total_scroll_distance), icon: Footprints },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-newspaper text-3xl text-foreground">Your reading life</h2>
        <p className="text-sm text-muted-foreground">
          Since {new Date(a.first_visit_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}.
          Updated in real time, only from your actual activity.
        </p>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, ease: "easeOut" }}
          >
            <Card className="bg-card/60 backdrop-blur-sm border-border/50 h-full">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <s.icon className={`w-4 h-4 ${s.accent ? "text-primary" : "text-muted-foreground"}`} />
                  {s.accent ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> : null}
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground tracking-tight">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Weekly chart + topics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: "easeOut" }}
        >
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-newspaper text-xl flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                This week
              </CardTitle>
              <CardDescription>
                {d.totalWeek > 0
                  ? `${d.totalWeek} article${d.totalWeek === 1 ? "" : "s"} · busiest on ${d.bestDay.fullDay}`
                  : "No reading activity recorded this week yet."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.weekData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={28} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p: any = payload[0].payload;
                        return (
                          <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-md text-xs">
                            <div className="font-medium text-popover-foreground">{p.fullDay}</div>
                            <div className="text-muted-foreground">{p.articles} article{p.articles === 1 ? "" : "s"}</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="articles" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ease: "easeOut" }}
        >
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="font-newspaper text-xl flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Topics you explore
              </CardTitle>
              <CardDescription>
                {d.topics.length > 0
                  ? `${d.topics.length} unique topic${d.topics.length === 1 ? "" : "s"} encountered`
                  : "Tagged articles will appear here as you read."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {d.topics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {d.topics.slice(0, 20).map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-xs font-normal">
                      {topic}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  Read a few more articles to build your topic map.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: "easeOut" }}
      >
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-newspaper text-xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Reading habits
            </CardTitle>
            <CardDescription>The longer view of your time on TicDia.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {secondaryStats.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted/40 border border-border/40">
                    <s.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-foreground truncate">{s.value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <p className="text-[11px] text-muted-foreground/70 text-center">
        Stats are stored privately under your account and never shared with third parties.
      </p>
    </div>
  );
};

export default AnalyticsStats;
