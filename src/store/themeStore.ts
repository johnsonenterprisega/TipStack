import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppThemeId, APP_THEMES, AppThemeConfig } from '../theme/themes';
import { COLORS } from '../theme';

const STORAGE_KEY = '@tipstack_app_theme_id';

interface ThemeState {
  themeId: AppThemeId;
  theme: AppThemeConfig;
  setTheme: (id: AppThemeId) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: 'emerald',
  theme: APP_THEMES.emerald,

  setTheme: async (id: AppThemeId) => {
    const selected = APP_THEMES[id] || APP_THEMES.emerald;
    
    // Dynamically patch the global COLORS object so all existing components adapt
    Object.assign(COLORS, selected.colors);

    set({ themeId: id, theme: selected });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      console.warn('Failed to save app theme preference', e);
    }
  },

  loadSavedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved && APP_THEMES[saved as AppThemeId]) {
        const selected = APP_THEMES[saved as AppThemeId];
        Object.assign(COLORS, selected.colors);
        set({ themeId: saved as AppThemeId, theme: selected });
      }
    } catch (e) {
      console.warn('Failed to load saved theme', e);
    }
  },
}));

export function useAppTheme() {
  const { theme, themeId, setTheme } = useThemeStore();
  return {
    theme,
    themeId,
    setTheme,
    colors: theme.colors,
  };
}
