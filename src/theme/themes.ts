export type AppThemeId = 'emerald' | 'midnight' | 'cyber' | 'cash';

export interface AppThemeConfig {
  id: AppThemeId;
  name: string;
  emoji: string;
  tagline: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent: string;
    accentDark: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    gradientPrimary: readonly [string, string];
    gradientGold: readonly [string, string];
    gradientDark: readonly [string, string];
    gradientCard: readonly [string, string];
  };
}

export const APP_THEMES: Record<AppThemeId, AppThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Gold',
    emoji: '🌟',
    tagline: 'Classic Luxe • Money & Energy',
    colors: {
      primary: '#00C9A7',
      primaryDark: '#009E84',
      primaryLight: '#33D4B7',
      accent: '#FFD166',
      accentDark: '#E6B84F',
      background: '#0D0F14',
      surface: '#161920',
      surfaceElevated: '#1E2230',
      border: '#272C3A',
      textPrimary: '#F0F2F8',
      textSecondary: '#8B91A7',
      textMuted: '#545B73',
      success: '#00C9A7',
      warning: '#FFD166',
      error: '#FF6B6B',
      info: '#74B9FF',
      gradientPrimary: ['#00C9A7', '#007BFF'],
      gradientGold: ['#FFD166', '#FF9F43'],
      gradientDark: ['#1E2230', '#0D0F14'],
      gradientCard: ['#1E2230', '#161920'],
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Stealth',
    emoji: '🖤',
    tagline: 'Dark Obsidian • Electric Cyan',
    colors: {
      primary: '#00E5FF',
      primaryDark: '#00B0FF',
      primaryLight: '#80D8FF',
      accent: '#7C4DFF',
      accentDark: '#651FFF',
      background: '#07090E',
      surface: '#10141D',
      surfaceElevated: '#181E2B',
      border: '#222B3D',
      textPrimary: '#F5F7FA',
      textSecondary: '#90A0B7',
      textMuted: '#5A687D',
      success: '#00E5FF',
      warning: '#FFD166',
      error: '#FF5252',
      info: '#40C4FF',
      gradientPrimary: ['#00E5FF', '#7C4DFF'],
      gradientGold: ['#00E5FF', '#0091EA'],
      gradientDark: ['#181E2B', '#07090E'],
      gradientCard: ['#181E2B', '#10141D'],
    },
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    emoji: '🚀',
    tagline: 'Synthwave • Electric Pink & Violet',
    colors: {
      primary: '#FF007F',
      primaryDark: '#D80064',
      primaryLight: '#FF409F',
      accent: '#00F5D4',
      accentDark: '#00BFA5',
      background: '#0F051D',
      surface: '#1B0B33',
      surfaceElevated: '#28114B',
      border: '#3D1B70',
      textPrimary: '#FFFFFF',
      textSecondary: '#B9A0DC',
      textMuted: '#725696',
      success: '#00F5D4',
      warning: '#FFD166',
      error: '#FF3366',
      info: '#9B51E0',
      gradientPrimary: ['#FF007F', '#9B51E0'],
      gradientGold: ['#00F5D4', '#00BFA5'],
      gradientDark: ['#28114B', '#0F051D'],
      gradientCard: ['#28114B', '#1B0B33'],
    },
  },
  cash: {
    id: 'cash',
    name: 'Cash Stack',
    emoji: '💰',
    tagline: 'Money Green • Big Stacks',
    colors: {
      primary: '#00E676',
      primaryDark: '#00C853',
      primaryLight: '#69F0AE',
      accent: '#FFD600',
      accentDark: '#FFAB00',
      background: '#04120C',
      surface: '#0B2217',
      surfaceElevated: '#123323',
      border: '#1E4733',
      textPrimary: '#F0FFF4',
      textSecondary: '#85BFA1',
      textMuted: '#4C7A62',
      success: '#00E676',
      warning: '#FFD600',
      error: '#FF5252',
      info: '#00E5FF',
      gradientPrimary: ['#00E676', '#00B0FF'],
      gradientGold: ['#FFD600', '#FF9100'],
      gradientDark: ['#123323', '#04120C'],
      gradientCard: ['#123323', '#0B2217'],
    },
  },
};
