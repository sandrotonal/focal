import { Platform } from 'react-native';

// Audio context singleton for Web / PWA
let webAudioCtx: any = null;
let isSoundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  isSoundEnabled = enabled;
}

export function getSoundEnabled(): boolean {
  return isSoundEnabled;
}

function getWebAudioContext(): any {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx) {
    webAudioCtx = new AudioCtx();
  }
  if (webAudioCtx.state === 'suspended') {
    void webAudioCtx.resume();
  }
  return webAudioCtx;
}

/**
 * Play a tiny mechanical tactile tick
 */
export function playTickSound(): void {
  if (!isSoundEnabled) return;
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.016);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

/**
 * Play focus start tone (Acoustic 528Hz Solfeggio clarity chime)
 */
export function playFocusStartSound(): void {
  if (!isSoundEnabled) return;
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

/**
 * Play focus completion tone (Harmonic resolution bell)
 */
export function playFocusCompleteSound(): void {
  if (!isSoundEnabled) return;
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

/**
 * Play reset sound (gentle downward swoosh)
 */
export function playResetSound(): void {
  if (!isSoundEnabled) return;
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
