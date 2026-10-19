import { Platform } from 'react-native';
import {
  isHealthKitAvailable,
  requestHealthKitPermissions,
  recordMindfulMinutes,
} from '../src/services/healthKitService';

describe('healthKitService', () => {
  it('returns false for isHealthKitAvailable on non-iOS platforms', async () => {
    const originalOS = Platform.OS;
    try {
      Platform.OS = 'android';
      const available = await isHealthKitAvailable();
      expect(available).toBe(false);
    } finally {
      Platform.OS = originalOS;
    }
  });

  it('safely rejects permissions on non-iOS platforms', async () => {
    const originalOS = Platform.OS;
    try {
      Platform.OS = 'web';
      const granted = await requestHealthKitPermissions();
      expect(granted).toBe(false);
    } finally {
      Platform.OS = originalOS;
    }
  });

  it('returns failure when minutes <= 0', async () => {
    const result = await recordMindfulMinutes({
      startDate: new Date(),
      endDate: new Date(),
      minutes: 0,
    });

    expect(result.success).toBe(false);
  });

  it('returns safe error when HealthKit is called on non-iOS platforms', async () => {
    const originalOS = Platform.OS;
    try {
      Platform.OS = 'android';
      const result = await recordMindfulMinutes({
        startDate: new Date(Date.now() - 1500000),
        endDate: new Date(),
        minutes: 25,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('only available on iOS');
    } finally {
      Platform.OS = originalOS;
    }
  });
});
