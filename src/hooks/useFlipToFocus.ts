import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface UseFlipToFocusOptions {
  enabled: boolean;
  isRunning: boolean;
  onTriggerStart: () => void;
  debounceMs?: number;
}

export interface UseFlipToFocusResult {
  isFaceDown: boolean;
  isAvailable: boolean;
}

/**
 * Determines whether the 3-axis accelerometer vector matches a flat face-down placement on a desk.
 * X and Y represent horizontal tilt; Z represents gravitational pull perpendicular to screen.
 */
export function isDeviceFaceDown(x: number, y: number, z: number): boolean {
  return Math.abs(x) < 0.38 && Math.abs(y) < 0.38 && z > 0.72;
}

/**
 * Custom hook detecting physical face-down placement of the device on a flat surface.
 * When enabled and timer is idle, holding phone face-down for debounceMs triggers a start callback with haptic feedback.
 */
export function useFlipToFocus({
  enabled,
  isRunning,
  onTriggerStart,
  debounceMs = 1200,
}: UseFlipToFocusOptions): UseFlipToFocusResult {
  const [internalFaceDown, setInternalFaceDown] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const faceDownStartRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);
  const isRunningRef = useRef(isRunning);
  const onTriggerStartRef = useRef(onTriggerStart);

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning) {
      hasTriggeredRef.current = false;
      faceDownStartRef.current = null;
    }
  }, [isRunning]);

  useEffect(() => {
    onTriggerStartRef.current = onTriggerStart;
  }, [onTriggerStart]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      faceDownStartRef.current = null;
      hasTriggeredRef.current = false;
      return;
    }

    let isMounted = true;
    let subscription: { remove: () => void } | null = null;

    async function initAccelerometer() {
      try {
        const { Accelerometer } = await import('expo-sensors');

        const available = await Accelerometer.isAvailableAsync();
        if (!isMounted) return;
        setIsAvailable(available);

        if (!available) return;

        Accelerometer.setUpdateInterval(300);

        subscription = Accelerometer.addListener(({ x, y, z }) => {
          if (!isMounted) return;

          const isFlatFaceDown = isDeviceFaceDown(x, y, z);
          setInternalFaceDown(isFlatFaceDown);

          if (isFlatFaceDown) {
            if (!isRunningRef.current && !hasTriggeredRef.current) {
              const now = Date.now();
              if (faceDownStartRef.current === null) {
                faceDownStartRef.current = now;
              } else if (now - faceDownStartRef.current >= debounceMs) {
                hasTriggeredRef.current = true;
                faceDownStartRef.current = null;

                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                onTriggerStartRef.current();
              }
            }
          } else {
            faceDownStartRef.current = null;
            if (!isRunningRef.current) {
              hasTriggeredRef.current = false;
            }
          }
        });
      } catch {
        if (isMounted) {
          setIsAvailable(false);
        }
      }
    }

    void initAccelerometer();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [debounceMs, enabled]);

  const isFaceDown = enabled && !isRunning && internalFaceDown;

  return { isFaceDown, isAvailable };
}
