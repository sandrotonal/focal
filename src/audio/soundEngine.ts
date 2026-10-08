import { Platform } from 'react-native';
import type { AudioPlayer } from 'expo-audio';

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
const SOUND_ASSETS: Record<'tick' | 'focusStart' | 'focusComplete' | 'reset', number> = {
  tick: require('../../assets/sounds/tick.wav'),
  focusStart: require('../../assets/sounds/focus_start.wav'),
  focusComplete: require('../../assets/sounds/focus_complete.wav'),
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

// Configure native audio session (e.g. silent mode playback)
let isAudioModeConfigured = false;

async function ensureAudioMode(audio: typeof import('expo-audio')): Promise<void> {
  if (isAudioModeConfigured) return;
  try {
    await audio.setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
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
        player.volume = 0.5;
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
    player.volume = 0.7;
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
  const keys: SoundKey[] = ['focusStart', 'focusComplete', 'reset'];
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
        if (player.currentTime > 0.04) {
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
      void player.seekTo(0).catch(() => {});
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

function playWebFocusComplete(): void {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Fundamental: 432 Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 2.5);

    // Harmonic overtone: 864 Hz
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(864, now);
    gain2.gain.setValueAtTime(0.08, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 1.9);

    // Subtle 5th: 648 Hz
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(648, now);
    gain3.gain.setValueAtTime(0.05, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 1.3);
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
 * Play focus completion tone (Harmonic resolution bell)
 */
export function playFocusCompleteSound(): void {
  if (!isSoundEnabled) return;
  if (Platform.OS === 'web') {
    playWebFocusComplete();
    return;
  }
  void playNativeSound('focusComplete');
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
