import type { ThemeMode } from '../storage/preferencesStorage';

export const COLORS = {
  dark: {
    background: '#111215',
    panel: '#17181C',
    primary: '#F5F5F7',
    secondary: '#B5B6BF',
    muted: '#747681',
    hairline: '#25272D',
    accent: '#0A84FF',
    scrim: 'rgba(0, 0, 0, 0.68)',
  },
  light: {
    background: '#F5F5F7',
    panel: '#FFFFFF',
    primary: '#1D1D1F',
    secondary: '#6E6E73',
    muted: '#8E8E93',
    hairline: '#D2D2D7',
    accent: '#007AFF',
    scrim: 'rgba(0, 0, 0, 0.18)',
  },
} as const;

export type AppColors = (typeof COLORS)[ThemeMode];
