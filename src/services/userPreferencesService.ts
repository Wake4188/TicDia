
import { supabase } from "@/integrations/supabase/client";
import { validateFontFamily, validateBackgroundOpacity, validateHexColor, sanitizeErrorMessage } from "@/utils/security";

export interface UserPreferences {
  fontFamily: string;
  backgroundOpacity: number;
  highlightColor: string;
  fontSize: number;
  feedType: 'random' | 'curated' | 'mixed';
  liquidGlassMode: boolean;
}

export const loadUserPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error loading user preferences:', sanitizeErrorMessage(error));
      return getDefaultPreferences();
    }

    if (!data) {
      return getDefaultPreferences();
    }

    return {
      fontFamily: data.font_family || 'Inter',
      backgroundOpacity: data.background_opacity || 80,
      highlightColor: data.highlight_color || '#ea384c',
      fontSize: data.font_size || 16,
      feedType: data.feed_type || 'mixed',
      liquidGlassMode: data.liquid_glass_mode || false
    };
  } catch (error) {
    console.error('Error loading user preferences:', sanitizeErrorMessage(error));
    return getDefaultPreferences();
  }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        font_family: validatedPreferences.fontFamily,
        background_opacity: validatedPreferences.backgroundOpacity,
        highlight_color: validatedPreferences.highlightColor,
        font_size: preferences.fontSize || 16,
        tts_autoplay: preferences.tts_autoplay || false,
        feed_type: preferences.feedType || 'mixed',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving user preferences:', sanitizeErrorMessage(error));
      throw new Error('Failed to save preferences');
    }
  } catch (error) {
    console.error('Error saving user preferences:', sanitizeErrorMessage(error));
    throw new Error('Failed to save preferences');
  }
};

export const getDefaultPreferences = (): UserPreferences => ({
  fontFamily: 'Inter',
  backgroundOpacity: 70,
  highlightColor: '#FE2C55',
  fontSize: 16,
  tts_autoplay: false,
  feedType: 'mixed',
});

export const updateUserPreferences = async (userId: string, updates: Partial<UserPreferences>): Promise<void> => {
  try {
    const currentPrefs = await loadUserPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...updates };
    await saveUserPreferences(userId, updatedPrefs);
  } catch (error) {
    console.error('Error updating user preferences:', sanitizeErrorMessage(error));
    throw new Error('Failed to update preferences');
  }
};
