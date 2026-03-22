export type BlurTint = 'dark' | 'light' | 'default';
export type Theme = {
  isDark: boolean;
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  surface: string;
  surfaceElevated: string;
  surfaceStrong: string;
  card: string;
  border: string;
  borderStrong: string;
  primary: string;
  primaryLight: string;
  primaryMuted: string;
  primaryGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  successMuted: string;
  error: string;
  errorMuted: string;
  warning: string;
  warningMuted: string;
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
  blurTint: BlurTint;
  blurIntensity: number;
};

export const darkTheme = {
  isDark: true,

  // Backgrounds
  background: '#080808',
  backgroundGradientStart: '#0a0a0f',
  backgroundGradientEnd: '#080808',

  // Glass surfaces
  surface: 'rgba(255,255,255,0.05)',
  surfaceElevated: 'rgba(255,255,255,0.08)',
  surfaceStrong: 'rgba(255,255,255,0.12)',
  card: 'rgba(255,255,255,0.05)',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  // Accent (electric mint)
  primary: '#00E5A0',
  primaryLight: '#33EDAF',
  primaryMuted: 'rgba(0,229,160,0.12)',
  primaryGlow: 'rgba(0,229,160,0.25)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',

  // Semantic
  success: '#00E5A0',
  successMuted: 'rgba(0,229,160,0.12)',
  error: '#FF453A',
  errorMuted: 'rgba(255,69,58,0.12)',
  warning: '#FFD60A',
  warningMuted: 'rgba(255,214,10,0.12)',

  // Tab bar
  tabBar: 'rgba(8,8,8,0.92)',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  tabActive: '#00E5A0',
  tabInactive: 'rgba(255,255,255,0.3)',

  // Blur
  blurTint: 'dark' as const,
  blurIntensity: 60,
};

export const lightTheme: Theme = {
  isDark: false,

  background: '#F2F2F7',
  backgroundGradientStart: '#F2F2F7',
  backgroundGradientEnd: '#E5E5EA',

  surface: 'rgba(255,255,255,0.75)',
  surfaceElevated: 'rgba(255,255,255,0.9)',
  surfaceStrong: 'rgba(255,255,255,1)',
  card: 'rgba(255,255,255,0.8)',

  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.12)',

  primary: '#00A878',
  primaryLight: '#00C48C',
  primaryMuted: 'rgba(0,168,120,0.1)',
  primaryGlow: 'rgba(0,168,120,0.2)',

  textPrimary: '#000000',
  textSecondary: 'rgba(0,0,0,0.55)',
  textMuted: 'rgba(0,0,0,0.3)',

  success: '#00A878',
  successMuted: 'rgba(0,168,120,0.1)',
  error: '#FF3B30',
  errorMuted: 'rgba(255,59,48,0.1)',
  warning: '#FF9F0A',
  warningMuted: 'rgba(255,159,10,0.1)',

  tabBar: 'rgba(242,242,247,0.92)',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  tabActive: '#00A878',
  tabInactive: 'rgba(0,0,0,0.3)',

  blurTint: 'light' as const,
  blurIntensity: 60,
};
