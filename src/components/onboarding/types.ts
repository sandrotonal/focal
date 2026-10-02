import type { DurationUnit, Language, ThemeMode } from '../../storage/preferencesStorage';

export type FocusPreferences = {
  sessionMinutes: number;
  sessionSeconds: number;
  durationUnit: DurationUnit;
  theme: ThemeMode;
  language: Language;
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
