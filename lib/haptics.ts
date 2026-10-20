/**
 * Native Haptic Feedback Utility for Mobile & Touch Devices
 * Uses navigator.vibrate with graceful degradation for unsupported browsers,
 * respecting the user's persisted haptic intensity preference ('none' | 'light' | 'heavy').
 */

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

export type HapticIntensity = 'none' | 'light' | 'heavy';

export const HAPTIC_STORAGE_KEY = 'varda_haptic_intensity_v1';

let cachedIntensity: HapticIntensity | null = null;

export function getHapticIntensity(): HapticIntensity {
  if (typeof window === 'undefined') return 'light';
  if (cachedIntensity) return cachedIntensity;
  try {
    const saved = localStorage.getItem(HAPTIC_STORAGE_KEY) as HapticIntensity | null;
    if (saved && ['none', 'light', 'heavy'].includes(saved)) {
      cachedIntensity = saved;
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'light';
}

export function setHapticIntensity(intensity: HapticIntensity): void {
  cachedIntensity = intensity;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HAPTIC_STORAGE_KEY, intensity);
    window.dispatchEvent(
      new CustomEvent<HapticIntensity>('varda-haptic-change', {detail: intensity})
    );
  } catch {
    // Ignore storage write errors
  }
}

export function triggerHaptic(style: HapticStyle = 'light'): boolean {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  const intensity = getHapticIntensity();
  if (intensity === 'none') {
    return false;
  }

  const isHeavy = intensity === 'heavy';

  try {
    switch (style) {
      case 'light':
      case 'selection':
        return navigator.vibrate(isHeavy ? 28 : 10);
      case 'medium':
        return navigator.vibrate(isHeavy ? 50 : 20);
      case 'heavy':
        return navigator.vibrate(isHeavy ? 85 : 35);
      case 'success':
        return navigator.vibrate(isHeavy ? [35, 50, 55] : [12, 50, 20]);
      case 'warning':
        return navigator.vibrate(isHeavy ? [50, 40, 50] : [24, 40, 24]);
      case 'error':
        return navigator.vibrate(isHeavy ? [65, 45, 65, 45, 90] : [35, 50, 35, 50, 50]);
      default:
        return navigator.vibrate(isHeavy ? 32 : 12);
    }
  } catch {
    return false;
  }
}
