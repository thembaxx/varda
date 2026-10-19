'use client';

import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {AnimatePresence, MotionConfig, motion, useReducedMotion} from 'motion/react';
import {CheckCircle, WifiSlash, X} from '@/components/ui/icons';
import {defaultPreferences, PREFERENCES_KEY, readPreferences, type Preferences} from '@/lib/preferences';
import {usePWAInstall} from '@/hooks/usePWAInstall';

interface Experience {
  preferences: Preferences;
  update: (patch: Partial<Preferences>) => void;
  offline: boolean;
  reducedMotion: boolean;
  feedback: (kind?: 'tap' | 'success') => void;
  notify: (message: string) => void;
  pwa: ReturnType<typeof usePWAInstall>;
}

const Context = createContext<Experience | null>(null);
export function useExperience() {
  const context = useContext(Context);
  if (!context) throw new Error('ExperienceProvider is missing');
  return context;
}

export default function ExperienceProvider({children}: {children: React.ReactNode}) {
  const pwa = usePWAInstall();
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState('');
  const systemReducedMotion = useReducedMotion();
  const audio = useRef<AudioContext | null>(null);
  const ambience = useRef<OscillatorNode[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = !preferences.motion || !!systemReducedMotion;
  const offline = preferences.offline || !online;

  useEffect(() => {
    try { setPreferences(readPreferences(localStorage.getItem(PREFERENCES_KEY))); } catch { /* Use defaults. */ }
    setReady(true);
    const syncNetwork = () => setOnline(navigator.onLine);
    const syncStorage = (event: StorageEvent) => {
      if (event.key === PREFERENCES_KEY) setPreferences(readPreferences(event.newValue));
    };
    syncNetwork();
    window.addEventListener('online', syncNetwork);
    window.addEventListener('offline', syncNetwork);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener('online', syncNetwork);
      window.removeEventListener('offline', syncNetwork);
      window.removeEventListener('storage', syncStorage);
      if (timer.current) clearTimeout(timer.current);
      void audio.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Session only. */ }
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.dataset.accent = preferences.accent;
      document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full';
      document.querySelectorAll('meta[name="theme-color"]').forEach(meta => meta.setAttribute('content', dark ? '#102e28' : '#f7f7ef'));
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preferences, ready, reducedMotion]);

  useEffect(() => {
    if (!ready || !('serviceWorker' in navigator)) return;
    let mounted = true;
    const send = () => navigator.serviceWorker.controller?.postMessage({type: 'SET_OFFLINE', offline: preferences.offline});
    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'});
        await navigator.serviceWorker.ready;
        if (mounted) send();
      } catch { /* Offline first visit still renders the page. */ }
    };
    void register();
    send();
    navigator.serviceWorker.addEventListener('controllerchange', send);
    return () => { mounted = false; navigator.serviceWorker.removeEventListener('controllerchange', send); };
  }, [preferences.offline, ready]);

  const getAudio = useCallback(() => {
    if (!audio.current || audio.current.state === 'closed') audio.current = new AudioContext();
    void audio.current.resume().catch(() => {});
    return audio.current;
  }, []);

  const feedback = useCallback((kind: 'tap' | 'success' = 'tap') => {
    if (preferences.haptics && 'vibrate' in navigator) navigator.vibrate(kind === 'success' ? [12, 30, 12] : 8);
    if (!preferences.sound) return;
    try {
      const ctx = getAudio();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.setValueAtTime(kind === 'success' ? 660 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.start(); oscillator.stop(ctx.currentTime + 0.1);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Audio support is optional. */ }
  }, [preferences.haptics, preferences.sound, getAudio]);

  useEffect(() => {
    const stop = () => { ambience.current.forEach(node => { try { node.stop(); node.disconnect(); } catch {} }); ambience.current = []; };
    const play = () => {
      stop();
      if (!preferences.ambience || document.hidden) return;
      try {
        const ctx = getAudio();
        ambience.current = [130.81, 196].map(frequency => {
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.frequency.value = frequency; gain.gain.value = 0.009;
          oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start();
          oscillator.onended = () => gain.disconnect();
          return oscillator;
        });
      } catch { /* Browser may require another gesture after restoring a tab. */ }
    };
    play(); document.addEventListener('visibilitychange', play);
    return () => { stop(); document.removeEventListener('visibilitychange', play); };
  }, [preferences.ambience, getAudio]);

  const update = useCallback((patch: Partial<Preferences>) => setPreferences(current => ({...current, ...patch})), []);
  const notify = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(message); timer.current = setTimeout(() => setToast(''), 4500);
  }, []);

  return <Context.Provider value={{preferences, update, offline, reducedMotion, feedback, notify, pwa}}>
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'} transition={{type: 'spring', stiffness: 340, damping: 30}}>
      {offline && <div className="offline-bar"><WifiSlash size={16} />{preferences.offline ? 'Offline mode' : 'You’re offline'}<span>Your saved plans are still here.</span><button onClick={() => { update({offline: false}); if (!online) notify('Your device is still offline. Reconnect to use online features.'); }}>Reconnect</button></div>}
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true"><AnimatePresence>{toast && <motion.div key={toast} initial={{opacity: 0, y: 16}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 8}} className="toast"><CheckCircle size={22} weight="fill" /><span>{toast}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={17} /></button></motion.div>}</AnimatePresence></div>
    </MotionConfig>
  </Context.Provider>;
}
