jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { checkAndPromptStoreReview } from '../src/services/storeReview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

describe('checkAndPromptStoreReview', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('bypasses prompt when completed sessions is below milestone', async () => {
    const prompted = await checkAndPromptStoreReview(1);
    expect(prompted).toBe(false);
  });

  it('does not prompt on web platform', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'web';
    const prompted = await checkAndPromptStoreReview(5);
    expect(prompted).toBe(false);
    Platform.OS = originalOS;
  });

  it('does not re-prompt if already requested', async () => {
    await AsyncStorage.setItem('focal.store_review_requested', 'true');
    const prompted = await checkAndPromptStoreReview(10);
    expect(prompted).toBe(false);
  });
});
