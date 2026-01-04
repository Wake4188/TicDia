import { useState, useEffect, useCallback } from 'react';
import { getFeatureFlags, FeatureFlag, isFeatureEnabled } from '@/services/adminService';

export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFeatureFlags();
      setFlags(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const checkFlag = useCallback(async (flagKey: string): Promise<boolean> => {
    return isFeatureEnabled(flagKey);
  }, []);

  return { flags, loading, error, refetch: fetchFlags, checkFlag };
};
