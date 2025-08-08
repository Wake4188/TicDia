
import { supabase } from "@/integrations/supabase/client";
import { validateFontFamily, validateBackgroundOpacity, validateHexColor, sanitizeErrorMessage } from "@/utils/security";

export interface UserPreferences {
  fontFamily: string;
  backgroundOpacity: number;
  highlightColor: string;
  tts_autoplay?: boolean;
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
      // Create default preferences for the user
      const defaultPrefs = getDefaultPreferences();
      await saveUserPreferences(userId, defaultPrefs);
      return defaultPrefs;
    }

    // Validate and sanitize the loaded preferences
    return {
      fontFamily: validateFontFamily(data.font_family),
      backgroundOpacity: validateBackgroundOpacity(data.background_opacity),
      highlightColor: validateHexColor(data.highlight_color),
      tts_autoplay: data.tts_autoplay || false,
    };
  } catch (error) {
    console.error('Error loading user preferences:', sanitizeErrorMessage(error));
    return getDefaultPreferences();
  }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
  try {
    // Validate preferences before saving
    const validatedPreferences = {
      fontFamily: validateFontFamily(preferences.fontFamily),
      backgroundOpacity: validateBackgroundOpacity(preferences.backgroundOpacity),
      highlightColor: validateHexColor(preferences.highlightColor),
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        font_family: validatedPreferences.fontFamily,
        background_opacity: validatedPreferences.backgroundOpacity,
        highlight_color: validatedPreferences.highlightColor,
        tts_autoplay: preferences.tts_autoplay || false,
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
  tts_autoplay: false,
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
