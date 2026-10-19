import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_REVIEW_REQUESTED_KEY = 'focal.store_review_requested';
const SESSIONS_MILESTONE = 3;

export async function checkAndPromptStoreReview(completedSessions: number): Promise<boolean> {
  // Store review should only prompt on real native iOS / Android devices at achievement milestone
  if (Platform.OS === 'web' || completedSessions < SESSIONS_MILESTONE) {
    return false;
  }

  try {
    const alreadyRequested = await AsyncStorage.getItem(STORE_REVIEW_REQUESTED_KEY);
    if (alreadyRequested === 'true') {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StoreReview = require('expo-store-review') as typeof import('expo-store-review');
    const isAvailable = await StoreReview.isAvailableAsync();

    if (isAvailable) {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(STORE_REVIEW_REQUESTED_KEY, 'true');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
