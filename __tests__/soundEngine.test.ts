import {
  setSoundEnabled,
  getSoundEnabled,
  playTickSound,
  playFocusStartSound,
  playFocusCompleteSound,
  playBreakCompleteSound,
  previewToneSound,
  playResetSound,
  cleanupAudioEngine,
} from '../src/audio/soundEngine';

describe('Sound Engine', () => {
  beforeEach(() => {
    setSoundEnabled(true);
  });

  afterEach(() => {
    cleanupAudioEngine();
  });

  test('should toggle sound enabled state', () => {
    expect(getSoundEnabled()).toBe(true);

    setSoundEnabled(false);
    expect(getSoundEnabled()).toBe(false);

    setSoundEnabled(true);
    expect(getSoundEnabled()).toBe(true);
  });

  test('should safely no-op when sound is disabled', () => {
    setSoundEnabled(false);

    expect(() => {
      playTickSound();
      playFocusStartSound();
      playFocusCompleteSound('clarity');
      playFocusCompleteSound('tibetan');
      playFocusCompleteSound('mechanical');
      playBreakCompleteSound();
      previewToneSound('tibetan');
      playResetSound();
    }).not.toThrow();
  });

  test('should execute all sound functions without throwing when sound is enabled', () => {
    setSoundEnabled(true);

    expect(() => {
      playTickSound();
      playFocusStartSound();
      playFocusCompleteSound('clarity');
      playFocusCompleteSound('tibetan');
      playFocusCompleteSound('mechanical');
      playBreakCompleteSound();
      previewToneSound('mechanical');
      playResetSound();
    }).not.toThrow();
  });

  test('should clean up audio engine without throwing', () => {
    expect(() => {
      cleanupAudioEngine();
    }).not.toThrow();
  });
});
