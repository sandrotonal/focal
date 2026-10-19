import {
  setSoundEnabled,
  getSoundEnabled,
  playTickSound,
  playFocusStartSound,
  playFocusCompleteSound,
  playBreakCompleteSound,
  previewToneSound,
  playResetSound,
  startAmbientSound,
  stopAmbientSound,
  previewAmbientSound,
  preloadNativeSounds,
  preloadToneSound,
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
      playFocusCompleteSound('crystal');
      playFocusCompleteSound('aurora');
      playFocusCompleteSound('clarity');
      playFocusCompleteSound('tibetan');
      playFocusCompleteSound('mechanical');
      playBreakCompleteSound();
      previewToneSound('crystal');
      playResetSound();
    }).not.toThrow();
  });

  test('should execute all sound functions without throwing when sound is enabled', () => {
    setSoundEnabled(true);

    expect(() => {
      playTickSound();
      playFocusStartSound();
      playFocusCompleteSound('crystal');
      playFocusCompleteSound('aurora');
      playFocusCompleteSound('clarity');
      playFocusCompleteSound('tibetan');
      playFocusCompleteSound('mechanical');
      playBreakCompleteSound();
      previewToneSound('aurora');
      playResetSound();
    }).not.toThrow();
  });

  test('should handle preloading functions without throwing', () => {
    expect(() => {
      preloadNativeSounds('crystal');
      preloadNativeSounds('aurora');
      preloadToneSound('tibetan');
      preloadToneSound('mechanical');
    }).not.toThrow();
  });

  test('should handle ambient sounds without throwing', () => {
    expect(() => {
      startAmbientSound('brown');
      previewAmbientSound('rain');
      startAmbientSound('storm');
      previewAmbientSound('ocean');
      startAmbientSound('none');
      stopAmbientSound();
    }).not.toThrow();
  });


  test('should clean up audio engine without throwing', () => {
    expect(() => {
      cleanupAudioEngine();
    }).not.toThrow();
  });
});
