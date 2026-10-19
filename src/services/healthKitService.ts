import { Platform } from 'react-native';

export interface MindfulSessionPayload {
  startDate: Date;
  endDate: Date;
  minutes: number;
}

export interface HealthKitSyncResult {
  success: boolean;
  error?: string;
}

/**
 * Checks whether Apple HealthKit is supported on the current device and platform.
 * Returns false on Android, Web, and non-supported iOS environments.
 */
export async function isHealthKitAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    // Dynamic import to avoid crash when react-native-health / native HealthKit bridge is absent
    const healthModule = (await import('react-native')).NativeModules?.AppleHealthKit;
    return Boolean(healthModule);
  } catch {
    return false;
  }
}

/**
 * Requests Apple Health permission to write Mindful Minutes (HKCategoryTypeIdentifierMindfulSession).
 * App Store Compliance: Only invoked on explicit user tap in Settings, never pre-emptively on launch.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    const isAvailable = await isHealthKitAvailable();
    if (!isAvailable) {
      return false;
    }

    const healthModule = (await import('react-native')).NativeModules?.AppleHealthKit;
    if (!healthModule?.initHealthKit) {
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      healthModule.initHealthKit(
        {
          permissions: {
            write: ['MindfulSession'],
          },
        },
        (error: Error | null) => {
          if (error) {
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  } catch {
    return false;
  }
}

/**
 * Records a completed focus session into Apple Health as Mindful Minutes.
 */
export async function recordMindfulMinutes(
  payload: MindfulSessionPayload
): Promise<HealthKitSyncResult> {
  if (Platform.OS !== 'ios') {
    return { success: false, error: 'HealthKit is only available on iOS' };
  }

  if (payload.minutes <= 0) {
    return { success: false, error: 'Duration must be greater than zero' };
  }

  try {
    const isAvailable = await isHealthKitAvailable();
    if (!isAvailable) {
      return { success: false, error: 'HealthKit is not available on this device' };
    }

    const healthModule = (await import('react-native')).NativeModules?.AppleHealthKit;
    if (!healthModule?.saveMindfulSession) {
      return { success: false, error: 'HealthKit saveMindfulSession is unavailable' };
    }

    return await new Promise<HealthKitSyncResult>((resolve) => {
      healthModule.saveMindfulSession(
        {
          startDate: payload.startDate.toISOString(),
          endDate: payload.endDate.toISOString(),
        },
        (error: Error | null) => {
          if (error) {
            resolve({ success: false, error: error.message });
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown HealthKit error';
    return { success: false, error: message };
  }
}
