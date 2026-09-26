import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

/**
 * Kitchlet uses a single light theme:
 * mahogany (tint) for primary actions, coconut brown (accent) for secondary details.
 */
export const Colors = {
  text: '#2B1B14',
  textSecondary: '#7E6557',
  background: '#FBF7F2',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#F3EAE2',
  border: '#EADDD2',
  tint: '#C04000', // mahogany
  tintSoft: '#F9E2D6',
  onTint: '#FFFFFF',
  accent: '#965A3E', // coconut brown
  accentSoft: '#F2E6DE',
  danger: '#A8201A',
  dangerSoft: '#FCE6E3',
  spotify: '#1DB954',
  overlay: 'rgba(43, 27, 20, 0.45)',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Hides the browser focus ring on web text inputs (the field border shows focus instead). */
export const NoOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 96 }) ?? 0;
export const MaxContentWidth = 1100;
