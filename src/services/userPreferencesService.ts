
import { supabase } from "@/integrations/supabase/client";

export interface UserPreferences {
  fontFamily: string;
  backgroundOpacity: number;
  highlightColor: string;
}

export const loadUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user preferences:', error);
      return getDefaultPreferences();
    }

    if (!data) {
      // Create default preferences for the user
      const defaultPrefs = getDefaultPreferences();
      await saveUserPreferences(userId, defaultPrefs);
      return defaultPrefs;
    }

    return {
      fontFamily: data.font_family,
      backgroundOpacity: data.background_opacity,
      highlightColor: data.highlight_color,
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return getDefaultPreferences();
  }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        font_family: preferences.fontFamily,
        background_opacity: preferences.backgroundOpacity,
        highlight_color: preferences.highlightColor,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving user preferences:', error);
    throw error;
  }
};

export const getDefaultPreferences = (): UserPreferences => ({
  fontFamily: 'Inter',
  backgroundOpacity: 70,
  highlightColor: '#FE2C55',
});
