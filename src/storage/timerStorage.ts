// TypeScript's platform-neutral fallback. Metro prefers .native.ts or .web.ts
// at runtime so native builds keep MMKV out of the web bundle.
export { loadTimerState, saveTimerState } from './timerStorage.web';
export type { TimerState } from './timerStorage.web';
