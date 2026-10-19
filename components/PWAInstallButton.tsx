'use client';

import React, {useState} from 'react';
import {usePWAInstall} from '@/hooks/usePWAInstall';
import {Download, Smartphone, X, Share2, PlusSquare} from 'lucide-react';

export default function PWAInstallButton() {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, suppress the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] text-[#F4F3EC] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
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
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] text-[#F4F3EC] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#E6C465]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-[#0E2F28] border border-white/15 p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                  Varda runs full-screen with offline-cached 3D models and local payment ledger.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#E6C465] text-[#0B241E] text-xs font-bold hover:bg-[#f0cf73] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Ambient install affordance for desktop/browser
  return (
    <button
      type="button"
      onClick={() => {
        // Trigger guided instructions if browser hasn't fired beforeinstallprompt yet
        if (typeof window !== 'undefined') {
          alert('To install Varda:\n• Chrome/Edge: Tap the Install icon in the address bar.\n• Safari/iOS: Tap Share > Add to Home Screen.');
        }
      }}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#144239] hover:bg-[#1B574B] text-[#F4F3EC] text-xs font-semibold transition-colors shadow-sm whitespace-nowrap shrink-0"
    >
      <Download className="w-3.5 h-3.5 text-[#E6C465]" />
      <span>Install App</span>
    </button>
  );
}
