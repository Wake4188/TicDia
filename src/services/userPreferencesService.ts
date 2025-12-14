
import { supabase } from "@/integrations/supabase/client";
import { validateFontFamily, validateBackgroundOpacity, validateHexColor, sanitizeErrorMessage } from "@/utils/security";

export interface UserPreferences {
  fontFamily: string;
  backgroundOpacity: number;
  highlightColor: string;
  fontSize: number;
  feedType: 'random' | 'curated' | 'mixed';
  liquidGlassMode: boolean;
  ttsSpeed: number;
  smokeEffect: boolean;
  textAnimation: boolean;
  birthYear?: number;
  allowAdultContent: boolean;
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
      fontFamily: data.font_family || 'Times New Roman',
      backgroundOpacity: data.background_opacity || 80,
      highlightColor: data.highlight_color || '#ea384c',
      fontSize: data.font_size || 16,
      feedType: (data.feed_type as 'random' | 'curated' | 'mixed') || 'mixed',
      liquidGlassMode: data.liquid_glass_mode !== undefined ? data.liquid_glass_mode : true,
      ttsSpeed: data.tts_speed || 1.0,
      smokeEffect: (data as Record<string, unknown>).smoke_effect !== false,
      textAnimation: (data as Record<string, unknown>).text_animation !== false,
      birthYear: (data as Record<string, unknown>).birth_year as number | undefined,
      allowAdultContent: (data as Record<string, unknown>).allow_adult_content === true,
    };
  } catch (error) {
    console.error('Error loading user preferences:', sanitizeErrorMessage(error));
    return getDefaultPreferences();
  }
};

export const saveUserPreferences = async (userId: string, preferences: UserPreferences): Promise<void> => {
  try {
    // Validate preferences
    const validatedPreferences = {
      fontFamily: validateFontFamily(preferences.fontFamily),
      backgroundOpacity: validateBackgroundOpacity(preferences.backgroundOpacity),
      highlightColor: validateHexColor(preferences.highlightColor)
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        font_family: validatedPreferences.fontFamily,
        background_opacity: validatedPreferences.backgroundOpacity,
        highlight_color: validatedPreferences.highlightColor,
        font_size: preferences.fontSize || 16,
        feed_type: preferences.feedType || 'mixed',
        liquid_glass_mode: preferences.liquidGlassMode || false,
        tts_speed: preferences.ttsSpeed || 1.0,
        allow_adult_content: preferences.allowAdultContent || false,
        // smoke_effect is stored but not in the DB types yet - will be ignored by Supabase if column doesn't exist
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
  fontFamily: 'Times New Roman',
  backgroundOpacity: 70,
  highlightColor: '#FE2C55',
  fontSize: 16,
  feedType: 'mixed',
  liquidGlassMode: true,
  ttsSpeed: 1.0,
  smokeEffect: true,
  textAnimation: true,
  birthYear: undefined,
  allowAdultContent: false,
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
