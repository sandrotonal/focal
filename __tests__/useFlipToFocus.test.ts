import { isDeviceFaceDown } from '../src/hooks/useFlipToFocus';

describe('isDeviceFaceDown', () => {
  it('returns true when phone is resting flat face down', () => {
    // Perfectly flat face down on table: x=0, y=0, z=0.98 (~1g)
    expect(isDeviceFaceDown(0, 0, 0.98)).toBe(true);
    // Slight tilt within acceptable threshold
    expect(isDeviceFaceDown(0.15, -0.2, 0.85)).toBe(true);
  });

  it('returns false when phone is face up', () => {
    // Flat face up on table: z is negative (-0.98g)
    expect(isDeviceFaceDown(0, 0, -0.98)).toBe(false);
  });

  it('returns false when phone is upright or tilted steeply', () => {
    // Held upright in hand: y ≈ 0.98, z ≈ 0
    expect(isDeviceFaceDown(0, 0.98, 0.1)).toBe(false);
    // Landscape tilt: x ≈ 0.85, z ≈ 0.3
    expect(isDeviceFaceDown(0.85, 0.1, 0.3)).toBe(false);
  });

  it('returns false when tilt exceeds stable threshold', () => {
    // Tilted too much on X axis (>0.38)
    expect(isDeviceFaceDown(0.45, 0.05, 0.8)).toBe(false);
    // Tilted too much on Y axis (>0.38)
    expect(isDeviceFaceDown(0.05, 0.45, 0.8)).toBe(false);
    // Z is below 0.72 threshold
    expect(isDeviceFaceDown(0.1, 0.1, 0.65)).toBe(false);
  });
});
