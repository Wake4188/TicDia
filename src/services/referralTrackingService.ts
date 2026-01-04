// Referral Tracking Service
// Captures and stores referral source from URL parameters

export interface ReferralData {
  ref: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page: string;
  timestamp: string;
  referrer: string;
}

const REFERRAL_STORAGE_KEY = 'ticdia_referral_data';
const REFERRAL_HISTORY_KEY = 'ticdia_referral_history';

export const captureReferralData = (): ReferralData | null => {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  
  // Check if we have any tracking parameters
  const ref = params.get('ref');
  const utm_source = params.get('utm_source');
  const utm_medium = params.get('utm_medium');
  const utm_campaign = params.get('utm_campaign');
  const utm_content = params.get('utm_content');
  const utm_term = params.get('utm_term');

  // Only store if there's actual referral data
  if (!ref && !utm_source && !document.referrer) {
    return null;
  }

  const referralData: ReferralData = {
    ref,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    landing_page: window.location.pathname,
    timestamp: new Date().toISOString(),
    referrer: document.referrer || 'direct',
  };

  // Store current session referral
  sessionStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referralData));

  // Add to history (persisted across sessions)
  addToReferralHistory(referralData);

  return referralData;
};

const addToReferralHistory = (data: ReferralData) => {
  try {
    const history = getReferralHistory();
    history.push(data);
    // Keep last 100 entries
    const trimmedHistory = history.slice(-100);
    localStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to save referral history:', error);
  }
};

export const getCurrentReferral = (): ReferralData | null => {
  try {
    const stored = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getReferralHistory = (): ReferralData[] => {
  try {
    const stored = localStorage.getItem(REFERRAL_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getReferralStats = () => {
  const history = getReferralHistory();
  
  const stats: Record<string, number> = {};
  
  history.forEach((entry) => {
    // Prioritize ref param, then utm_source, then referrer domain
    let source = entry.ref || entry.utm_source;
    
    if (!source && entry.referrer && entry.referrer !== 'direct') {
      try {
        source = new URL(entry.referrer).hostname;
      } catch {
        source = entry.referrer;
      }
    }
    
    source = source || 'direct';
    stats[source] = (stats[source] || 0) + 1;
  });

  return {
    totalVisits: history.length,
    bySource: stats,
    history: history.slice(-20), // Last 20 for display
  };
};

export const clearReferralHistory = () => {
  localStorage.removeItem(REFERRAL_HISTORY_KEY);
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
};
