jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  calculateTargetSeconds,
  formatElapsed,
  getNextPomodoroStage,
  getResetPomodoroState,
} from '../src/hooks/useFocusTimer';

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

  test('safely handles negative numbers, NaN and floats', () => {
    expect(formatElapsed(-10)).toBe('00:00');
    expect(formatElapsed(Number.NaN)).toBe('00:00');
    expect(formatElapsed(65.8)).toBe('01:05');
  });
});

describe('getNextPomodoroStage', () => {
  test('transitions focus to shortBreak for cycles 1, 2, and 3', () => {
    expect(getNextPomodoroStage('focus', 1)).toEqual({
      nextMode: 'shortBreak',
      nextCycle: 1,
    });
    expect(getNextPomodoroStage('focus', 2)).toEqual({
      nextMode: 'shortBreak',
      nextCycle: 2,
    });
    expect(getNextPomodoroStage('focus', 3)).toEqual({
      nextMode: 'shortBreak',
      nextCycle: 3,
    });
  });

  test('transitions focus to longBreak on the 4th cycle', () => {
    expect(getNextPomodoroStage('focus', 4)).toEqual({
      nextMode: 'longBreak',
      nextCycle: 4,
    });
  });

  test('transitions shortBreak to next focus cycle', () => {
    expect(getNextPomodoroStage('shortBreak', 1)).toEqual({
      nextMode: 'focus',
      nextCycle: 2,
    });
    expect(getNextPomodoroStage('shortBreak', 2)).toEqual({
      nextMode: 'focus',
      nextCycle: 3,
    });
    expect(getNextPomodoroStage('shortBreak', 3)).toEqual({
      nextMode: 'focus',
      nextCycle: 4,
    });
  });

  test('transitions longBreak back to focus and resets cycle to 1', () => {
    expect(getNextPomodoroStage('longBreak', 4)).toEqual({
      nextMode: 'focus',
      nextCycle: 1,
    });
  });

  test('clamps out-of-range cycle numbers safely', () => {
    expect(getNextPomodoroStage('focus', 99)).toEqual({
      nextMode: 'longBreak',
      nextCycle: 4,
    });
    expect(getNextPomodoroStage('focus', -5)).toEqual({
      nextMode: 'shortBreak',
      nextCycle: 1,
    });
    expect(getNextPomodoroStage('shortBreak', Number.NaN)).toEqual({
      nextMode: 'focus',
      nextCycle: 2,
    });
  });
});

describe('calculateTargetSeconds', () => {
  test('uses targetDurationSeconds when Pomodoro is disabled', () => {
    expect(calculateTargetSeconds('focus', false, 1800, 25, 5, 15)).toBe(1800);
    expect(calculateTargetSeconds('focus', false, 45, 25, 5, 15)).toBe(45);
  });

  test('calculates correct seconds for each Pomodoro stage when enabled', () => {
    expect(calculateTargetSeconds('focus', true, 600, 25, 5, 15)).toBe(1500);
    expect(calculateTargetSeconds('shortBreak', true, 600, 25, 5, 15)).toBe(300);
    expect(calculateTargetSeconds('longBreak', true, 600, 25, 5, 15)).toBe(900);
  });

  test('safely clamps non-positive or corrupted target seconds', () => {
    expect(calculateTargetSeconds('focus', false, -10, 25, 5, 15)).toBe(1);
    expect(calculateTargetSeconds('focus', false, Number.NaN, 25, 5, 15)).toBe(1500);
  });
});

describe('getResetPomodoroState', () => {
  test('resets timerMode to focus and cycle to 1 when Pomodoro is enabled', () => {
    const result = getResetPomodoroState(true, 3);
    expect(result.nextMode).toBe('focus');
    expect(result.nextCycle).toBe(1);
  });

  test('resets timerMode to focus and preserves current cycle when Pomodoro is disabled', () => {
    const result = getResetPomodoroState(false, 3);
    expect(result.nextMode).toBe('focus');
    expect(result.nextCycle).toBe(3);
  });

  test('safely clamps corrupted cycle values when Pomodoro is disabled', () => {
    expect(getResetPomodoroState(false, Number.NaN)).toEqual({
      nextMode: 'focus',
      nextCycle: 1,
    });
    expect(getResetPomodoroState(false, -2)).toEqual({
      nextMode: 'focus',
      nextCycle: 1,
    });
  });
});
