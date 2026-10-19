'use client';

import React from 'react';
import {useOnlineStatus} from '@/hooks/usePWAInstall';
import {WifiOff} from 'lucide-react';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline connectivity status"
      className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-between sm:justify-start gap-2.5 rounded-2xl bg-[#8E1B24] border border-[#EF4444]/40 px-4 py-2.5 text-xs font-medium text-white shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-[#FCA5A5] shrink-0" />
        <div>
          <span className="font-bold">Offline Resilience Active</span>
          <span className="hidden sm:inline text-[#FCA5A5] ml-1.5">
            · Local cache active. Payments & bookings queue locally.
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
        Mesh ON
      </span>
    </aside>
  );
}
