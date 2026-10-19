import * as fs from 'fs';
import * as path from 'path';

// Generate authentic, organic rain sound with micro-droplet transients
const sampleRate = 44100;
const durationSeconds = 8.0;
const totalSamples = Math.floor(sampleRate * durationSeconds);

const buffer = new Float32Array(totalSamples);

// 1. High-passed white/pink noise bed for the gentle hiss of rain (no low-frequency wind)
let b0 = 0, b1 = 0, b2 = 0;
for (let i = 0; i < totalSamples; i++) {
  const white = Math.random() * 2 - 1;
  // Pink-ish filter with high-pass characteristic
  b0 = 0.95 * b0 + white * 0.05;
  b1 = 0.85 * b1 + white * 0.15;
  b2 = 0.65 * b2 + white * 0.35;
  const filtered = (white - b0) * 0.5 + (b1 - b2) * 0.5;
  buffer[i] = filtered * 0.12;
}

// 2. Add realistic micro-droplet pitter-patter impacts (random raindrops hitting surface)
// Average 180 drops per second
const dropCount = Math.floor(durationSeconds * 220);
for (let d = 0; d < dropCount; d++) {
  const dropStart = Math.floor(Math.random() * (totalSamples - 1000));
  // Random resonance frequency for each drop (1.4kHz to 4.8kHz)
  const dropFreq = 1400 + Math.random() * 3400;
  const dropLength = Math.floor(sampleRate * (0.003 + Math.random() * 0.007)); // 3 to 10 ms
  const dropAmp = 0.06 + Math.random() * 0.18;
  const decayRate = 6.0 / dropLength;

  for (let s = 0; s < dropLength; s++) {
    const idx = dropStart + s;
    if (idx >= totalSamples) break;
    const t = s / sampleRate;
    const env = Math.exp(-decayRate * s) * dropAmp;
    const dropWave = Math.sin(2 * Math.PI * dropFreq * t);
    buffer[idx] += dropWave * env;
  }
}

// 3. Seamless cross-fade loop (last 0.8s blends into first 0.8s)
const crossfadeSamples = Math.floor(sampleRate * 0.8);
for (let i = 0; i < crossfadeSamples; i++) {
  const progress = i / crossfadeSamples;
  const endIdx = totalSamples - crossfadeSamples + i;
  const blended = buffer[i] * progress + buffer[endIdx] * (1 - progress);
  buffer[i] = blended;
  buffer[endIdx] = blended;
}

// 4. Normalize to -16 dBFS RMS (clean, soothing ambient volume)
let sumSquares = 0;
for (let i = 0; i < totalSamples; i++) {
  sumSquares += buffer[i] * buffer[i];
}
const rms = Math.sqrt(sumSquares / totalSamples);
const targetRms = 0.15; // ~ -16.5 dBFS
const gain = targetRms / (rms || 1);

// Write 16-bit PCM WAV
const pcmData = new Int16Array(totalSamples);
for (let i = 0; i < totalSamples; i++) {
  const val = Math.max(-1, Math.min(1, buffer[i] * gain));
  pcmData[i] = val < 0 ? val * 0x8000 : val * 0x7FFF;
}

const headerSize = 44;
const dataSize = pcmData.byteLength;
const outBuffer = Buffer.alloc(headerSize + dataSize);

// RIFF header
outBuffer.write('RIFF', 0);
outBuffer.writeUInt32LE(36 + dataSize, 4);
outBuffer.write('WAVE', 8);
// fmt chunk
outBuffer.write('fmt ', 12);
outBuffer.writeUInt32LE(16, 16);
outBuffer.writeUInt16LE(1, 20); // PCM
outBuffer.writeUInt16LE(1, 22); // mono
outBuffer.writeUInt32LE(sampleRate, 24);
outBuffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
outBuffer.writeUInt16LE(2, 32); // block align
outBuffer.writeUInt16LE(16, 34); // bits per sample
// data chunk
outBuffer.write('data', 36);
outBuffer.writeUInt32LE(dataSize, 40);

const pcmBytes = Buffer.from(pcmData.buffer);
pcmBytes.copy(outBuffer, headerSize);

const targetPath = path.resolve(process.cwd(), 'assets/sounds/ambient_rain.wav');
fs.writeFileSync(targetPath, outBuffer);
console.log(`Generated ${targetPath} successfully! Size: ${outBuffer.length} bytes, RMS: ${targetRms}`);
