'use client';

import React, {useState} from 'react';
import {usePWAInstall} from '@/hooks/usePWAInstall';
import {triggerHaptic} from '@/lib/haptics';
import {
  Download,
  Smartphone,
  X,
  Share2,
  PlusSquare,
  Monitor,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function PWAInstallButton() {
  const {isInstallable, isInstalled, isIOS, install, mounted} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // During SSR and initial client hydration pass, render deterministic fallback matching SSR
  if (!mounted) {
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] text-[#F4F3EC] text-xs font-semibold whitespace-nowrap shrink-0 shadow-sm opacity-90 cursor-pointer"
        title="Install Varda PWA"
      >
        <Download className="w-3.5 h-3.5 text-[#E6C465]" />
        <span>Install App</span>
      </button>
    );
  }

  // If already running inside standalone PWA mode, suppress install button
  if (isInstalled) {
    return (
      <div
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#144239]/15 border border-[#144239]/20 text-[#144239] text-[11px] font-semibold whitespace-nowrap"
        title="Varda is installed in standalone mode with full offline access"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-[#144239]" />
        <span>Varda Native PWA</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow with native beforeinstallprompt available
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={async () => {
          triggerHaptic('medium');
          const installed = await install();
          if (installed) {
            triggerHaptic('success');
          }
        }}
        className="px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] active:scale-95 text-[#F4F3EC] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
        title="Install Varda PWA on this device"
      >
        <Download className="w-3.5 h-3.5 text-[#E6C465]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowIOSGuide(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] active:scale-95 text-[#F4F3EC] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#E6C465]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-[#0E2F28] border border-white/15 p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#E6C465]" />
                  <h3 className="font-serif text-lg font-bold">Install Varda on iOS</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-[#C4C6AF] hover:text-white"
                  aria-label="Close installation guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#C4C6AF] leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <Share2 className="w-5 h-5 text-[#4FFFB0] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Step 1: Tap Share</strong>
                    Tap the <strong>Share</strong> icon in the bottom Safari toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                  <PlusSquare className="w-5 h-5 text-[#E6C465] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">
                      Step 2: Add to Home Screen
                    </strong>
                    Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.
                  </div>
                </div>

                <p className="text-[11px] text-[#C4C6AF]/80 italic">
                  Varda runs full-screen with offline-cached 3D models, custom GLSL shaders, and local South African payment ledger.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setShowIOSGuide(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#E6C465] text-[#0B241E] text-xs font-bold hover:bg-[#f0cf73] transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Ambient install affordance for desktop/browser with clean in-app modal (NO window.alert)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setShowDesktopGuide(true);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] active:scale-95 text-[#F4F3EC] text-xs font-semibold transition-all shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
        title="Learn how to install Varda"
      >
        <Download className="w-3.5 h-3.5 text-[#E6C465]" />
        <span>Install App</span>
      </button>

      {showDesktopGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowDesktopGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#0E2F28] border border-white/15 p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#E6C465]" />
                <h3 className="font-serif text-lg font-bold">Install Varda Native App</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="p-1 rounded-full text-[#C4C6AF] hover:text-white"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#C4C6AF] leading-relaxed">
              Install Varda to your desktop or device launcher for zero-latency 3D rendering and offline access during load-shedding.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#4FFFB0]" /> Google Chrome & Microsoft Edge
                </span>
                <p className="text-[#C4C6AF]">
                  Click the <strong>Install</strong> icon in the address bar (top right) or open menu <span className="font-mono text-white">⋮</span> &rarr; <em>Install Varda</em>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#E6C465]" /> Android & iOS Mobile
                </span>
                <p className="text-[#C4C6AF]">
                  Tap browser menu &rarr; <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowDesktopGuide(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#E6C465] text-[#0B241E] text-xs font-bold hover:bg-[#f0cf73] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
