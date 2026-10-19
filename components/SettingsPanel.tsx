'use client';

import {Desktop, Moon, Sun, Vibrate, SpeakerHigh, Waves, WifiSlash, PersonSimpleWalk, Palette, ArrowCounterClockwise} from '@/components/ui/icons';
import Dialog from '@/components/ui/Dialog';
import {useExperience} from '@/components/ExperienceProvider';
import {defaultPreferences} from '@/lib/preferences';
import PWAInstallButton from '@/components/PWAInstallButton';

function Switch({label, description, checked, onChange, icon}: {label: string; description: string; checked: boolean; onChange: () => void; icon: React.ReactNode}) {
  return <div className="setting-row"><span className="setting-icon">{icon}</span><div><span className="setting-title">{label}</span><p>{description}</p></div><button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={onChange} className="switch"><span /></button></div>;
}

export default function SettingsPanel({onClose}: {onClose: () => void}) {
  const {preferences, update, feedback, notify} = useExperience();
  return <Dialog title="Make it yours" onClose={onClose}>
    <p className="dialog-intro">A little more you. These preferences stay on this device.</p>
    <section className="settings-section"><h3>Appearance</h3><div className="theme-options">
      {([{id: 'light', label: 'Light', icon: Sun}, {id: 'dark', label: 'Dark', icon: Moon}, {id: 'system', label: 'System', icon: Desktop}] as const).map(({id, label, icon: Icon}) => <button key={id} type="button" aria-pressed={preferences.theme === id} onClick={() => { feedback(); update({theme: id}); }}><Icon size={23} weight="duotone" />{label}</button>)}
    </div><div className="setting-row"><span className="setting-icon"><Palette size={21} /></span><div><span className="setting-title">Your accent</span><p>A colour that feels like home.</p></div><div className="accent-options">{(['sunflower', 'sage', 'coral'] as const).map(accent => <button key={accent} type="button" className={`swatch ${accent}`} aria-label={`${accent} accent`} aria-pressed={preferences.accent === accent} onClick={() => { feedback(); update({accent}); }} />)}</div></div></section>
    <section className="settings-section"><h3>Feel & sound</h3>
      <Switch label="Motion & animation" description="Gentle springs and scroll reveals. Device accessibility settings always apply." checked={preferences.motion} onChange={() => { feedback(); update({motion: !preferences.motion}); }} icon={<PersonSimpleWalk size={22} />} />
      <Switch label="Haptic feedback" description="A soft tap on supported devices." checked={preferences.haptics} onChange={() => { update({haptics: !preferences.haptics}); feedback(); }} icon={<Vibrate size={22} />} />
      <Switch label="Interface sounds" description="Quiet notes for your everyday actions." checked={preferences.sound} onChange={() => { feedback(); update({sound: !preferences.sound}); }} icon={<SpeakerHigh size={22} />} />
      <Switch label="Background ambience" description="A low, calming harmony. Pauses when you leave the app." checked={preferences.ambience} onChange={() => update({ambience: !preferences.ambience})} icon={<Waves size={22} />} />
    </section>
    <section className="settings-section"><h3>At home, anywhere</h3><Switch label="Offline mode" description="Browse saved plans. Accounts and payments need a connection." checked={preferences.offline} onChange={() => { feedback(); update({offline: !preferences.offline}); notify(preferences.offline ? 'Back online. Welcome back.' : 'Offline mode is on. Your saved plans are here.'); }} icon={<WifiSlash size={22} />} /><PWAInstallButton /></section>
    <button type="button" className="text-button muted" onClick={() => { update(defaultPreferences); notify('Preferences restored. A fresh start.'); }}><ArrowCounterClockwise size={16} />Restore defaults</button>
  </Dialog>;
}
