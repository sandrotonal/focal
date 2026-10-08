jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { formatElapsed } from '../src/hooks/useFocusTimer';

describe('formatElapsed', () => {
  test('formats zero seconds correctly', () => {
    expect(formatElapsed(0)).toBe('00:00');
  });

  test('formats seconds under one minute', () => {
    expect(formatElapsed(5)).toBe('00:05');
    expect(formatElapsed(59)).toBe('00:59');
  });

  test('formats exact minutes', () => {
    expect(formatElapsed(60)).toBe('01:00');
    expect(formatElapsed(1500)).toBe('25:00'); // 25 minutes
    expect(formatElapsed(2700)).toBe('45:00'); // 45 minutes
  });

  test('formats minutes and seconds combined', () => {
    expect(formatElapsed(95)).toBe('01:35');
    expect(formatElapsed(3599)).toBe('59:59');
  });

  test('formats hours, minutes, and seconds when exceeding one hour', () => {
    expect(formatElapsed(3600)).toBe('01:00:00');
    expect(formatElapsed(3665)).toBe('01:01:05');
    expect(formatElapsed(7325)).toBe('02:02:05');
  });
});
