// ─── Color Palette ────────────────────────────────────────────────────────────
export const COLORS = {
  // Brand
  primary: '#00C9A7',       // Teal — energy, money
  primaryDark: '#009E84',
  primaryLight: '#33D4B7',
  accent: '#FFD166',        // Gold — tips, achievement
  accentDark: '#E6B84F',

  // Backgrounds
  background: '#0D0F14',    // Deep dark
  surface: '#161920',       // Card background
  surfaceElevated: '#1E2230', // Elevated card
  border: '#272C3A',

  // Text
  textPrimary: '#F0F2F8',
  textSecondary: '#8B91A7',
  textMuted: '#545B73',

  // Semantic
  success: '#00C9A7',
  warning: '#FFD166',
  error: '#FF6B6B',
  info: '#74B9FF',

  // Tier colors
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',

  // Gradients (start, end)
  gradientPrimary: ['#00C9A7', '#007BFF'] as const,
  gradientGold: ['#FFD166', '#FF9F43'] as const,
  gradientDark: ['#1E2230', '#0D0F14'] as const,
  gradientCard: ['#1E2230', '#161920'] as const,
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: {
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};
