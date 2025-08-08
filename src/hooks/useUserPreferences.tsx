
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loadUserPreferences, getDefaultPreferences, updateUserPreferences, UserPreferences } from "@/services/userPreferencesService";

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (user) {
      await updateUserPreferences(user.id, updates);
      setUserPreferences(prev => ({ ...prev, ...updates }));
    }
  };

  useEffect(() => {
    const loadPrefs = async () => {
      if (user) {
        try {
          const prefs = await loadUserPreferences(user.id);
          setUserPreferences(prefs);
          document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor);
          document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor);
        } catch (error) {
          console.error('Error loading user preferences:', error);
          const savedPrefs = localStorage.getItem('userPreferences');
          if (savedPrefs) {
            const prefs = JSON.parse(savedPrefs);
            if (prefs.progressBarColor && !prefs.highlightColor) {
              prefs.highlightColor = prefs.progressBarColor;
            }
            setUserPreferences({
              fontFamily: prefs.fontFamily || 'Inter',
              backgroundOpacity: prefs.backgroundOpacity || 70,
              highlightColor: prefs.highlightColor || '#FE2C55'
            });
            document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor || '#FE2C55');
            document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor || '#FE2C55');
          }
        }
      } else {
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          if (prefs.progressBarColor && !prefs.highlightColor) {
            prefs.highlightColor = prefs.progressBarColor;
          }
          setUserPreferences({
            fontFamily: prefs.fontFamily || 'Inter',
            backgroundOpacity: prefs.backgroundOpacity || 70,
            highlightColor: prefs.highlightColor || '#FE2C55'
          });
          document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor || '#FE2C55');
          document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor || '#FE2C55');
        }
      }
    };

    loadPrefs();
  }, [user]);

  return { userPreferences, updatePreferences };
};
