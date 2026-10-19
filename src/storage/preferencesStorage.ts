import { Platform } from 'react-native';
import * as WebStorage from './preferencesStorage.web';
import * as NativeStorage from './preferencesStorage.native';

export type {
  ThemeMode,
  Language,
  DurationUnit,
  FocusPreferences,
  SoundAlertTone,
  AmbientSoundType,
  PomodoroStage,
} from './preferencesStorage.web';

export const loadPreferences = Platform.OS === 'web' ? WebStorage.loadPreferences : NativeStorage.loadPreferences;
export const initPreferences = Platform.OS === 'web' ? WebStorage.initPreferences : NativeStorage.initPreferences;
export const savePreferences = Platform.OS === 'web' ? WebStorage.savePreferences : NativeStorage.savePreferences;

