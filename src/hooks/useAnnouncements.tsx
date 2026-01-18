import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveAnnouncements, Announcement } from '@/services/adminService';

// Public announcements don't include created_by for security
type PublicAnnouncement = Omit<Announcement, 'created_by'>;

export const useAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissed_announcements');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveAnnouncements(!!user);
      setAnnouncements(data.filter(a => !dismissedIds.has(a.id)));
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dismissedIds]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('dismissed_announcements', JSON.stringify([...next]));
      return next;
    });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  const banners = announcements.filter(a => a.announcement_type === 'banner');
  const modals = announcements.filter(a => a.announcement_type === 'modal');
  const toasts = announcements.filter(a => a.announcement_type === 'toast');

  return { 
    announcements, 
    banners, 
    modals, 
    toasts, 
    loading, 
    dismissAnnouncement,
    refetch: fetchAnnouncements 
  };
};
