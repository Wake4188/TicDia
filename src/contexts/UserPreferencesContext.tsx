import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loadUserPreferences, getDefaultPreferences, updateUserPreferences as updateUserPreferencesService, UserPreferences } from "@/services/userPreferencesService";

interface UserPreferencesContextType {
    userPreferences: UserPreferences;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [userPreferences, setUserPreferences] = useState<UserPreferences>(getDefaultPreferences());

    const persistLocal = (prefs: Partial<UserPreferences>) => {
        const saved = localStorage.getItem('userPreferences');
        const base = saved ? JSON.parse(saved) : {};
        const next = { ...base, ...prefs };
        localStorage.setItem('userPreferences', JSON.stringify(next));
    };

    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        // Optimistically update local state
        setUserPreferences(prev => ({ ...prev, ...updates }));
        persistLocal(updates);

        if (user) {
            try {
                await updateUserPreferencesService(user.id, updates);
            } catch (error) {
                console.error("Failed to sync preferences to server", error);
                // Optionally revert state here if strict consistency is needed
            }
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
                    persistLocal(prefs);
                } catch (error) {
                    console.error('Error loading user preferences:', error);
                    loadFromLocal();
                }
            } else {
                loadFromLocal();
            }
        };

        const loadFromLocal = () => {
            const savedPrefs = localStorage.getItem('userPreferences');
            if (savedPrefs) {
                const prefs = JSON.parse(savedPrefs);
                if (prefs.progressBarColor && !prefs.highlightColor) {
                    prefs.highlightColor = prefs.progressBarColor;
                }
                setUserPreferences({
                    fontFamily: prefs.fontFamily || 'Inter',
                    backgroundOpacity: prefs.backgroundOpacity || 70,
                    highlightColor: prefs.highlightColor || '#FE2C55',
                    fontSize: prefs.fontSize || 16,
                    feedType: prefs.feedType || 'mixed',
                    liquidGlassMode: Boolean(prefs.liquidGlassMode) || false,
                    ttsSpeed: prefs.ttsSpeed || 1.0,
                    smokeEffect: prefs.smokeEffect !== false,
                });
                document.documentElement.style.setProperty('--progress-bar-color', prefs.highlightColor || '#FE2C55');
                document.documentElement.style.setProperty('--highlight-color', prefs.highlightColor || '#FE2C55');
            }
        };

        loadPrefs();
    }, [user]);

    return (
        <UserPreferencesContext.Provider value={{ userPreferences, updatePreferences }}>
            {children}
        </UserPreferencesContext.Provider>
    );
};

export const useUserPreferences = () => {
    const context = useContext(UserPreferencesContext);
    if (context === undefined) {
        throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
    }
    return context;
};
