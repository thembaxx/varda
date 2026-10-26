/**
 * Native Web Share API helper with clipboard fallback and haptic feedback.
 */
import { triggerHaptic } from "./haptics";

export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
}

export async function shareContent(options: ShareOptions): Promise<"shared" | "copied" | "failed"> {
  triggerHaptic("light");

  const shareUrl = options.url || (typeof window !== "undefined" ? window.location.href : "");

  // 1. Try Native Web Share API (Mobile Safari, Chrome on Android, etc.)
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: shareUrl,
      });
      triggerHaptic("success");
      return "shared";
    } catch (err: unknown) {
      // User aborted share sheet or cancelled
      if ((err as Error)?.name === "AbortError") {
        return "failed";
      }
    }
  }

  // 2. Fallback to Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      const copyPayload = `${options.title}\n${options.text}\n${shareUrl}`;
      await navigator.clipboard.writeText(copyPayload);
      triggerHaptic("success");
      return "copied";
    } catch {
      // Clipboard write failed
    }
  }

  return "failed";
}
