'use client';

import {useEffect, useState, useSyncExternalStore} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'; platform: string}>;
}

const emptySubscribe = () => () => {};

function subscribeStandalone(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);

  return () => {
    mql.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as {standalone?: boolean}).standalone === true
  );
}

function getIOSSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

let isClientMounted = false;
const mountListeners = new Set<() => void>();

function subscribeMount(callback: () => void): () => void {
  mountListeners.add(callback);
  if (typeof window !== 'undefined' && !isClientMounted) {
    const timer = setTimeout(() => {
      isClientMounted = true;
      mountListeners.forEach((l) => l());
    }, 0);
    return () => {
      clearTimeout(timer);
      mountListeners.delete(callback);
    };
  }
  return () => {
    mountListeners.delete(callback);
  };
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const mounted = useSyncExternalStore(
    subscribeMount,
    () => isClientMounted,
    () => false
  );

  // Synchronize standalone & device detection with external store snapshots safely after mount
  const isInstalled = useSyncExternalStore(
    subscribeStandalone,
    () => (mounted ? getStandaloneSnapshot() : false),
    () => false // Server snapshot
  );

  const isIOS = useSyncExternalStore(
    emptySubscribe,
    () => (mounted ? getIOSSnapshot() : false),
    () => false // Server snapshot
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const {outcome} = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    mounted,
    install,
  };
}

function subscribeOnline(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    () => true // Server snapshot (always true during SSR)
  );
}
