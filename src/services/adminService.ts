import { supabase } from "@/integrations/supabase/client";

// =============================================
// FEATURE FLAGS
// =============================================
export interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const getFeatureFlags = async (): Promise<FeatureFlag[]> => {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('flag_name');
  
  if (error) throw error;
  return data || [];
};

export const updateFeatureFlag = async (id: string, isEnabled: boolean, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('feature_flags')
    .update({ is_enabled: isEnabled, updated_by: userId, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'feature_flag_toggle', `Toggled feature flag to ${isEnabled}`, 'feature_flag', id);
};

// =============================================
// ANNOUNCEMENTS
// =============================================
export interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: 'banner' | 'modal' | 'toast';
  target_audience: 'all' | 'authenticated' | 'anonymous';
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const getAnnouncements = async (adminView = false): Promise<Announcement[]> => {
  let query = supabase.from('announcements').select('*').order('priority', { ascending: false });
  
  if (!adminView) {
    query = query.eq('is_active', true);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Announcement[];
};

export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('announcements')
    .insert({ ...announcement, created_by: userId });
  
  if (error) throw error;
  await logAdminActivity(userId, 'announcement_create', `Created announcement: ${announcement.title}`, 'announcement', undefined);
};

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'announcement_update', `Updated announcement`, 'announcement', id);
};

export const deleteAnnouncement = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'announcement_delete', `Deleted announcement`, 'announcement', id);
};

// =============================================
// CONTENT MODERATION
// =============================================
export interface ContentModeration {
  id: string;
  content_type: string;
  content_id: string;
  content_title: string | null;
  moderation_status: 'pending' | 'reviewed' | 'low_quality' | 'restricted' | 'shadow_hidden';
  is_hidden: boolean;
  admin_notes: string | null;
  moderated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const getModerationItems = async (): Promise<ContentModeration[]> => {
  const { data, error } = await supabase
    .from('content_moderation')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as ContentModeration[];
};

export const createModerationItem = async (item: Omit<ContentModeration, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_moderation')
    .insert({ ...item, moderated_by: userId });
  
  if (error) throw error;
  await logAdminActivity(userId, 'moderation_create', `Added moderation for: ${item.content_title || item.content_id}`, 'moderation', item.content_id);
};

export const updateModerationItem = async (id: string, updates: Partial<ContentModeration>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_moderation')
    .update({ ...updates, moderated_by: userId, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'moderation_update', `Updated moderation status`, 'moderation', id);
};

export const deleteModerationItem = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_moderation')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'moderation_delete', `Removed moderation entry`, 'moderation', id);
};

// =============================================
// FEED CURATION
// =============================================
export interface FeedCuration {
  id: string;
  article_id: string;
  article_title: string;
  article_url: string | null;
  curation_type: 'pinned' | 'promoted' | 'demoted' | 'hidden';
  priority: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  curated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const getFeedCuration = async (): Promise<FeedCuration[]> => {
  const { data, error } = await supabase
    .from('feed_curation')
    .select('*')
    .order('priority', { ascending: false });
  
  if (error) throw error;
  return (data || []) as FeedCuration[];
};

export const createFeedCuration = async (item: Omit<FeedCuration, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('feed_curation')
    .insert({ ...item, curated_by: userId });
  
  if (error) throw error;
  await logAdminActivity(userId, 'curation_create', `Added curation: ${item.article_title}`, 'curation', item.article_id);
};

export const updateFeedCuration = async (id: string, updates: Partial<FeedCuration>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('feed_curation')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'curation_update', `Updated curation`, 'curation', id);
};

export const deleteFeedCuration = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('feed_curation')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'curation_delete', `Removed curation`, 'curation', id);
};

// =============================================
// CONTENT RULES (Blacklist/Whitelist)
// =============================================
export interface ContentRule {
  id: string;
  rule_type: 'blacklist' | 'whitelist';
  target_type: 'topic' | 'category' | 'keyword' | 'source';
  target_value: string;
  reason: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const getContentRules = async (): Promise<ContentRule[]> => {
  const { data, error } = await supabase
    .from('content_rules')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as ContentRule[];
};

export const createContentRule = async (rule: Omit<ContentRule, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_rules')
    .insert({ ...rule, created_by: userId });
  
  if (error) throw error;
  await logAdminActivity(userId, 'rule_create', `Created ${rule.rule_type} rule for ${rule.target_type}: ${rule.target_value}`, 'rule', undefined);
};

export const updateContentRule = async (id: string, updates: Partial<ContentRule>, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_rules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'rule_update', `Updated content rule`, 'rule', id);
};

export const deleteContentRule = async (id: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('content_rules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  await logAdminActivity(userId, 'rule_delete', `Deleted content rule`, 'rule', id);
};

// =============================================
// APP METRICS
// =============================================
export interface AppMetric {
  id: string;
  metric_date: string;
  metric_type: string;
  metric_value: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const getAppMetrics = async (days = 7): Promise<AppMetric[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const { data, error } = await supabase
    .from('app_metrics')
    .select('*')
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: false });
  
  if (error) throw error;
  return (data || []) as AppMetric[];
};

// =============================================
// ADMIN ACTIVITY LOG
// =============================================
export interface AdminActivity {
  id: string;
  admin_id: string;
  action_type: string;
  action_description: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const logAdminActivity = async (
  adminId: string,
  actionType: string,
  actionDescription: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action_type: actionType,
      action_description: actionDescription,
      target_type: targetType || null,
      target_id: targetId || null,
      metadata: metadata || {}
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
};

export const getAdminActivityLog = async (limit = 50): Promise<AdminActivity[]> => {
  const { data, error } = await supabase
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return (data || []) as AdminActivity[];
};

// =============================================
// ACTIVE ANNOUNCEMENTS FOR USERS
// =============================================
export const getActiveAnnouncements = async (isAuthenticated: boolean): Promise<Announcement[]> => {
  const now = new Date().toISOString();
  
  let query = supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order('priority', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Filter by audience
  return ((data || []) as Announcement[]).filter(a => {
    if (a.target_audience === 'all') return true;
    if (a.target_audience === 'authenticated' && isAuthenticated) return true;
    if (a.target_audience === 'anonymous' && !isAuthenticated) return true;
    return false;
  });
};

// =============================================
// CHECK FEATURE FLAG (for app usage)
// =============================================
let featureFlagsCache: Map<string, boolean> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

export const isFeatureEnabled = async (flagKey: string): Promise<boolean> => {
  const now = Date.now();
  
  // Refresh cache if expired
  if (!featureFlagsCache || now - cacheTimestamp > CACHE_TTL) {
    const flags = await getFeatureFlags();
    featureFlagsCache = new Map(flags.map(f => [f.flag_key, f.is_enabled]));
    cacheTimestamp = now;
  }
  
  return featureFlagsCache.get(flagKey) ?? true;
};

export const clearFeatureFlagsCache = (): void => {
  featureFlagsCache = null;
  cacheTimestamp = 0;
};
