// Legacy export — screens use useTheme() for live dark/light switching.
// This file stays so any un-migrated imports don't break at startup.
import { darkTheme } from './themes';

export const Colors = {
  background: darkTheme.background,
  surface: darkTheme.surface,
  surfaceElevated: darkTheme.surfaceElevated,
  card: darkTheme.card,
  border: darkTheme.border,
  primary: darkTheme.primary,
  primaryLight: darkTheme.primaryLight,
  primaryMuted: darkTheme.primaryMuted,
  primaryGlow: darkTheme.primaryGlow,
  textPrimary: darkTheme.textPrimary,
  textSecondary: darkTheme.textSecondary,
  textMuted: darkTheme.textMuted,
  success: darkTheme.success,
  successMuted: darkTheme.successMuted,
  error: darkTheme.error,
  errorMuted: darkTheme.errorMuted,
  warning: darkTheme.warning,
  warningMuted: darkTheme.warningMuted,
  tabBar: darkTheme.tabBar,
  tabBarBorder: darkTheme.tabBarBorder,
  tabActive: darkTheme.tabActive,
  tabInactive: darkTheme.tabInactive,
};
