import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureReferralData } from '@/services/referralTrackingService';

export const useReferralTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Only capture on initial page load with query params
    if (location.search) {
      captureReferralData();
    }
  }, []); // Only run once on mount

  // Also capture referrer even without query params on first visit
  useEffect(() => {
    if (document.referrer && !sessionStorage.getItem('ticdia_referral_captured')) {
      captureReferralData();
      sessionStorage.setItem('ticdia_referral_captured', 'true');
    }
  }, []);
};
