import { Platform } from 'react-native';
import type { AudioPlayer } from 'expo-audio';
import type { SoundAlertTone } from '../storage/preferencesStorage';

type WebAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

// Audio context singleton for Web / PWA
let webAudioCtx: AudioContext | null = null;
let isSoundEnabled = true;
let lastTickTime = 0;
const TICK_THROTTLE_MS = 45;

export function setSoundEnabled(enabled: boolean): void {
  isSoundEnabled = enabled;
}

export function getSoundEnabled(): boolean {
  return isSoundEnabled;
}

// Sound assets for native audio playback
const SOUND_ASSETS: Record<
  | 'tick'
  | 'focusStart'
  | 'focusComplete'
  | 'focusCompleteCrystal'
  | 'focusCompleteAurora'
  | 'focusCompleteTibetan'
  | 'focusCompleteClarity'
  | 'focusCompleteMechanical'
  | 'breakComplete'
  | 'reset',
  number
> = {
  tick: require('../../assets/sounds/tick.wav'),
  focusStart: require('../../assets/sounds/focus_start.wav'),
  focusComplete: require('../../assets/sounds/focus_complete.wav'),
  focusCompleteCrystal: require('../../assets/sounds/focus_complete_crystal.wav'),
  focusCompleteAurora: require('../../assets/sounds/focus_complete_aurora.wav'),
  focusCompleteTibetan: require('../../assets/sounds/focus_complete_tibetan.wav'),
  focusCompleteClarity: require('../../assets/sounds/focus_complete_clarity.wav'),
  focusCompleteMechanical: require('../../assets/sounds/focus_complete_mechanical.wav'),
  breakComplete: require('../../assets/sounds/break_complete.wav'),
  reset: require('../../assets/sounds/reset.wav'),
};

type SoundKey = keyof typeof SOUND_ASSETS;

// Lazy native module loader to avoid crashing in unsupported environments
let expoAudioModule: typeof import('expo-audio') | null = null;

function getExpoAudio(): typeof import('expo-audio') | null {
  if (Platform.OS === 'web') {
    return null;
  }
  if (expoAudioModule) {
    return expoAudioModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expoAudioModule = require('expo-audio') as typeof import('expo-audio');
    return expoAudioModule;
  } catch {
    return null;
  }
}

// Configure native audio session (e.g. silent mode playback & background continuity)
let isAudioModeConfigured = false;

async function ensureAudioMode(audio: typeof import('expo-audio')): Promise<void> {
  if (isAudioModeConfigured) return;
  try {
    await audio.setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: true,
    });
    isAudioModeConfigured = true;
  } catch {
    // Graceful fallback if unsupported
  }
}

// Cached native audio players for low-latency playback
const nativePlayerCache: Partial<Record<SoundKey, AudioPlayer>> = {};

// Dedicated round-robin player pool for rapid mechanical ticks to prevent buffer cut-off crackles
const TICK_POOL_SIZE = 3;
const tickPlayerPool: AudioPlayer[] = [];
let tickPoolIndex = 0;

function getTickPlayer(audio: typeof import('expo-audio')): AudioPlayer | null {
  if (tickPlayerPool.length < TICK_POOL_SIZE) {
    try {
      while (tickPlayerPool.length < TICK_POOL_SIZE) {
        const player = audio.createAudioPlayer(SOUND_ASSETS.tick);
        player.volume = 0.85;
        tickPlayerPool.push(player);
      }
    } catch {
      // Fallback if allocation fails
    }
  }
  if (tickPlayerPool.length === 0) return null;
  const player = tickPlayerPool[tickPoolIndex];
  tickPoolIndex = (tickPoolIndex + 1) % tickPlayerPool.length;
  return player;
}

function getOrCreatePlayer(audio: typeof import('expo-audio'), key: SoundKey): AudioPlayer | null {
  const cached = nativePlayerCache[key];
  if (cached) {
    return cached;
  }
  try {
    const player = audio.createAudioPlayer(SOUND_ASSETS[key]);
    player.volume = 1.0;
    nativePlayerCache[key] = player;
    return player;
  } catch {
    return null;
  }
}

// Preload native players eagerly in background
export function preloadNativeSounds(): void {
  const audio = getExpoAudio();
  if (!audio) return;
  void ensureAudioMode(audio);
  getTickPlayer(audio);
  const keys: SoundKey[] = [
    'focusStart',
    'focusComplete',
    'focusCompleteCrystal',
    'focusCompleteAurora',
    'focusCompleteTibetan',
    'focusCompleteClarity',
    'focusCompleteMechanical',
    'breakComplete',
    'reset',
  ];
  for (const key of keys) {
    getOrCreatePlayer(audio, key);
  }
}

// Initial eager preload on mobile devices (bypassed in test environment)
if (Platform.OS !== 'web' && process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    preloadNativeSounds();
  }, 100);
}

function playNativeSound(key: SoundKey): void {
  const audio = getExpoAudio();
  if (!audio) return;

  try {
    void ensureAudioMode(audio);

    if (key === 'tick') {
      const player = getTickPlayer(audio);
      if (!player) return;
      try {
        if (player.currentTime > 0.03) {
          void player.seekTo(0).then(() => {
            player.play();
          }).catch(() => {
            player.play();
          });
          return;
        }
      } catch {
        // Safe seek
      }
      player.play();
      return;
    }

    const player = getOrCreatePlayer(audio, key);
    if (!player) return;

    try {
      if (player.currentTime > 0) {
        void player.seekTo(0).then(() => {
          player.play();
        }).catch(() => {
          player.play();
        });
        return;
      }
    } catch {
      // Seek may not be supported immediately
    }
    player.play();
  } catch {
    // Graceful fallback for native audio
  }
}

export function cleanupAudioEngine(): void {
  lastTickTime = 0;
  for (const p of tickPlayerPool) {
    try {
      p.remove();
    } catch {
      // Graceful cleanup
    }
  }
  tickPlayerPool.length = 0;
  tickPoolIndex = 0;

  for (const key of Object.keys(nativePlayerCache) as SoundKey[]) {
    try {
      nativePlayerCache[key]?.remove();
    } catch {
      // Graceful cleanup
    }
    delete nativePlayerCache[key];
  }
}

/* ---------------- Web Audio Synthesis ---------------- */

function getWebAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  const win = window as unknown as WebAudioWindow;
  const AudioCtx = win.AudioContext || win.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx) {
    webAudioCtx = new AudioCtx();
  }
  if (webAudioCtx.state === 'suspended') {
    void webAudioCtx.resume();
  }
  return webAudioCtx;
}

function playWebTick(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, ctx.currentTime);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.0065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.007);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

function playWebFocusStart(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now);
    osc.frequency.exponentialRampToValueAtTime(532, now + 0.6);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.95);
  } catch {
    // safe fallback
  }
}

function playWebCrystal(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending crystal-glass chime triad per Sound Design Brief: C#6, E6, G#6
    const notes = [
      { freq: 1108.73, subFreq: 554.37, shimmerFreq: 2217.46, time: now, gain: 0.22, duration: 1.45 },
      { freq: 1318.51, subFreq: 659.26, shimmerFreq: 2637.02, time: now + 0.15, gain: 0.24, duration: 1.35 },
      { freq: 1661.22, subFreq: 830.61, shimmerFreq: 3322.44, time: now + 0.32, gain: 0.26, duration: 1.18 },
    ];

    notes.forEach(({ freq, subFreq, shimmerFreq, time, gain: maxGain, duration }) => {
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const oscShimmer = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(subFreq, time);

      oscShimmer.type = 'sine';
      oscShimmer.frequency.setValueAtTime(shimmerFreq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(maxGain, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      oscSub.connect(gain);
      oscShimmer.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      oscSub.start(time);
      oscShimmer.start(time);

      osc.stop(time + duration);
      oscSub.stop(time + duration * 0.7);
      oscShimmer.stop(time + duration * 0.45);
    });
  } catch {
    // safe fallback
  }
}

function playWebAurora(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // D Major celestial harmony: D5 -> A5 -> F#6
    const notes = [
      { freq: 587.33, time: now, gain: 0.20, duration: 1.65 },
      { freq: 880.00, time: now + 0.18, gain: 0.22, duration: 1.48 },
      { freq: 1479.98, time: now + 0.38, gain: 0.25, duration: 1.30 },
    ];

    notes.forEach(({ freq, time, gain: maxGain, duration }) => {
      const osc = ctx.createOscillator();
      const oscSub = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(freq * 0.5, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(maxGain, time + 0.028);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      oscSub.start(time);

      osc.stop(time + duration);
      oscSub.stop(time + duration * 0.8);
    });
  } catch {
    // safe fallback
  }
}

function playWebClarity(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Friendly Apple-style rosewood marimba triad: E5, G#5, B5
    const notes = [
      { freq: 659.25, time: now, gain: 0.16 },
      { freq: 830.61, time: now + 0.08, gain: 0.15 },
      { freq: 987.77, time: now + 0.16, gain: 0.14 },
    ];

    notes.forEach(({ freq, time, gain: maxGain }) => {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 3.92, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(maxGain, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      overtone.start(time);
      osc.stop(time + 1.25);
      overtone.stop(time + 0.4);
    });
  } catch {
    // safe fallback
  }
}

function playWebTibetan(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Peaceful Zen meditation bell: 528Hz + 264Hz warm undertone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(264, now);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1056, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 2.6);
    osc2.stop(now + 2.6);
    osc3.stop(now + 1.8);
  } catch {
    // safe fallback
  }
}

function playWebMechanical(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Crystal Harp: A5 (880Hz) -> E6 (1318.5Hz) airy glissando
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.14, now + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.45);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0.0001, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.13, now + 0.128);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 1.65);
  } catch {
    // safe fallback
  }
}

function playWebBreakComplete(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Friendly 2-note marimba chime: C5 (523Hz) -> E5 (659Hz)
    const notes = [
      { freq: 523.25, time: now, gain: 0.15 },
      { freq: 659.25, time: now + 0.12, gain: 0.16 },
    ];

    notes.forEach(({ freq, time, gain: maxGain }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(maxGain, time + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 1.05);
    });
  } catch {
    // safe fallback
  }
}

function playWebReset(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch {
    // safe fallback
  }
}

/* ---------------- Public Playback API ---------------- */

/**
 * Play a tiny mechanical tactile tick
 */
export function playTickSound(): void {
  if (!isSoundEnabled) return;
  const now = Date.now();
  if (now - lastTickTime < TICK_THROTTLE_MS) {
    return;
  }
  lastTickTime = now;
  if (Platform.OS === 'web') {
    playWebTick();
    return;
  }
  void playNativeSound('tick');
}

/**
 * Play focus start tone (Acoustic 528Hz Solfeggio clarity chime)
 */
export function playFocusStartSound(): void {
  if (!isSoundEnabled) return;
  if (Platform.OS === 'web') {
    playWebFocusStart();
    return;
  }
  void playNativeSound('focusStart');
}

/**
 * Play focus completion tone with customizable tone palette
 */
export function playFocusCompleteSound(tone: SoundAlertTone = 'crystal'): void {
  if (!isSoundEnabled) return;
  if (Platform.OS === 'web') {
    switch (tone) {
      case 'aurora':
        playWebAurora();
        break;
      case 'tibetan':
        playWebTibetan();
        break;
      case 'clarity':
        playWebClarity();
        break;
      case 'mechanical':
        playWebMechanical();
        break;
      case 'crystal':
      default:
        playWebCrystal();
        break;
    }
    return;
  }

  let key: SoundKey = 'focusCompleteCrystal';
  if (tone === 'aurora') key = 'focusCompleteAurora';
  else if (tone === 'tibetan') key = 'focusCompleteTibetan';
  else if (tone === 'clarity') key = 'focusCompleteClarity';
  else if (tone === 'mechanical') key = 'focusCompleteMechanical';
  else key = 'focusCompleteCrystal';

  void playNativeSound(key);
}

/**
 * Play break completion tone (Gentle two-tone ascending chime)
 */
export function playBreakCompleteSound(): void {
  if (!isSoundEnabled) return;
  if (Platform.OS === 'web') {
    playWebBreakComplete();
    return;
  }
  void playNativeSound('breakComplete');
}

/**
 * Play a preview of the selected alert tone for immediate feedback
 */
export function previewToneSound(tone: SoundAlertTone): void {
  playFocusCompleteSound(tone);
}

/**
 * Play reset sound (gentle downward swoosh)
 */
export function playResetSound(): void {
  if (!isSoundEnabled) return;
  if (Platform.OS === 'web') {
    playWebReset();
    return;
  }
  void playNativeSound('reset');
}

