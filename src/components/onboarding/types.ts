import type { ThemeMode } from '../../storage/preferencesStorage';

export type FocusPreferences = {
  sessionMinutes: number;
  theme: ThemeMode;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  onboardingCompleted: boolean;
  completedSessions: number;
  totalFocusMinutes: number;
};

export type AppColors = {
  background: string;
  panel: string;
  primary: string;
  secondary: string;
  muted: string;
  hairline: string;
  accent: string;
  scrim: string;
};

export type RhythmOption = {
  minutes: number;
  label: string;
  tag: string;
  subtitle: string;
};
