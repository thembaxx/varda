/**
 * Native Haptic Feedback Utility for Mobile & Touch Devices
 * Uses navigator.vibrate with graceful degradation for unsupported browsers.
 */

export type HapticStyle =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

export function triggerHaptic(style: HapticStyle = 'light'): boolean {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return false;
  }

  try {
    switch (style) {
      case 'light':
      case 'selection':
        return navigator.vibrate(10);
      case 'medium':
        return navigator.vibrate(25);
      case 'heavy':
        return navigator.vibrate(50);
      case 'success':
        return navigator.vibrate([15, 60, 25]);
      case 'warning':
        return navigator.vibrate([30, 40, 30]);
      case 'error':
        return navigator.vibrate([40, 50, 40, 50, 60]);
      default:
        return navigator.vibrate(15);
    }
  } catch {
    return false;
  }
}
