-- =============================================
-- ADMIN PANEL DATABASE SCHEMA
-- =============================================

-- 1. Feature Flags (Emergency Kill Switch)
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key text NOT NULL UNIQUE,
  flag_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view feature flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Admins can manage feature flags" ON public.feature_flags FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Announcements Table
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'banner', -- 'banner', 'modal', 'toast'
  target_audience text NOT NULL DEFAULT 'all', -- 'all', 'authenticated', 'anonymous'
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Content Moderation Table
CREATE TABLE public.content_moderation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL, -- 'article', 'topic', 'source'
  content_id text NOT NULL,
  content_title text,
  moderation_status text NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'low_quality', 'restricted', 'shadow_hidden'
  is_hidden boolean NOT NULL DEFAULT false,
  admin_notes text,
  moderated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);

ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all moderation" ON public.content_moderation FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage moderation" ON public.content_moderation FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Feed Curation (Pinned/Promoted Articles)
CREATE TABLE public.feed_curation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id text NOT NULL,
  article_title text NOT NULL,
  article_url text,
  curation_type text NOT NULL DEFAULT 'pinned', -- 'pinned', 'promoted', 'demoted', 'hidden'
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  curated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_curation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active curation" ON public.feed_curation FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage curation" ON public.feed_curation FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Content Blacklist/Whitelist
CREATE TABLE public.content_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type text NOT NULL, -- 'blacklist', 'whitelist'
  target_type text NOT NULL, -- 'topic', 'category', 'keyword', 'source'
  target_value text NOT NULL,
  reason text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(rule_type, target_type, target_value)
);

ALTER TABLE public.content_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content rules" ON public.content_rules FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage content rules" ON public.content_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Admin Activity Log
CREATE TABLE public.admin_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL,
  action_description text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log" ON public.admin_activity_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. App Metrics (for dashboard - aggregated/anonymous)
CREATE TABLE public.app_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  metric_type text NOT NULL, -- 'daily_active_users', 'weekly_active_users', 'page_views', 'feed_swipes', 'errors'
  metric_value integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(metric_date, metric_type)
);

ALTER TABLE public.app_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics" ON public.app_metrics FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage metrics" ON public.app_metrics FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled) VALUES
  ('feed_enabled', 'Main Feed', 'Enable/disable the main content feed', true),
  ('animations_enabled', 'Animations', 'Enable/disable all animations', true),
  ('swipe_actions_enabled', 'Swipe Actions', 'Enable/disable swipe gestures', true),
  ('api_calls_enabled', 'API Calls', 'Enable/disable external API calls', true),
  ('tts_enabled', 'Text-to-Speech', 'Enable/disable text-to-speech feature', true),
  ('voting_enabled', 'Voting', 'Enable/disable article voting', true),
  ('search_enabled', 'Search', 'Enable/disable search functionality', true),
  ('auth_enabled', 'Authentication', 'Enable/disable user authentication', true);

-- Insert sample metrics (placeholder data)
INSERT INTO public.app_metrics (metric_date, metric_type, metric_value, metadata) VALUES
  (CURRENT_DATE, 'daily_active_users', 0, '{"is_placeholder": true}'::jsonb),
  (CURRENT_DATE, 'page_views', 0, '{"is_placeholder": true}'::jsonb),
  (CURRENT_DATE, 'feed_swipes', 0, '{"is_placeholder": true}'::jsonb),
  (CURRENT_DATE, 'errors', 0, '{"is_placeholder": true}'::jsonb);