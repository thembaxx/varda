'use client';

import {useState, useSyncExternalStore} from 'react';
import {Moon, SlidersHorizontal, Sun} from '@/components/ui/icons';
import {useExperience} from '@/components/ExperienceProvider';
import SettingsPanel from '@/components/SettingsPanel';

function subscribeToSystemTheme(notify: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
}

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function ThemeControls() {
  const {preferences, update, feedback} = useExperience();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, getSystemDark, () => false);
  const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark);

  return <>
    <div className="varda-theme-controls">
      <button
        type="button"
        className="varda-theme-button"
        aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={dark ? 'Use light theme' : 'Use dark theme'}
        onClick={() => { feedback(); update({theme: dark ? 'light' : 'dark'}); }}
      >
        {dark ? <Sun size={20} weight="duotone" /> : <Moon size={20} weight="duotone" />}
      </button>
      <button
        type="button"
        className="varda-theme-button"
        aria-label="Open settings"
        title="Appearance and preferences"
        onClick={() => { feedback(); setSettingsOpen(true); }}
      ><SlidersHorizontal size={20} weight="duotone" /></button>
    </div>
    {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
  </>;
}
