'use client';

import {useState} from 'react';
import {ArrowRight, Users, Check} from '@/components/ui/icons';
import {CONFERENCE_ROOMS} from '@/lib/sa-data';
import Dialog from '@/components/ui/Dialog';
import {useExperience} from '@/components/ExperienceProvider';

export interface VardaOrder {name: string; description: string; amountZar: number}

export default function SpacesPanel({onClose, onCheckout}: {onClose: () => void; onCheckout: (order: VardaOrder) => void}) {
  const [selected, setSelected] = useState(CONFERENCE_ROOMS[0].id);
  const [hours, setHours] = useState(1);
  const {feedback, offline} = useExperience();
  const room = CONFERENCE_ROOMS.find(item => item.id === selected)!;
  const today = new Date().toISOString().slice(0, 10);
  return <Dialog title="A little space for your plans" onClose={onClose} wide><p className="dialog-intro">Room to focus, catch up, or bring an idea to life. Choose a space to review your booking.</p><form className="account-form" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); feedback(); onCheckout({name: `${room.name} · ${hours} ${hours === 1 ? 'hour' : 'hours'}`, description: `${form.get('date')} at ${form.get('time')} · ${room.features}`, amountZar: room.rateZar * hours}); onClose(); }}><div className="room-grid">{CONFERENCE_ROOMS.map(item => <button type="button" key={item.id} disabled={!item.available} aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); feedback(); }}><Users size={23} weight="duotone" /><strong>{item.name}</strong><small>{item.features}</small><span className="mono">{item.available ? `R ${item.rateZar} / hr` : 'Unavailable'}</span>{selected === item.id && <Check size={18} className="room-check" />}</button>)}</div><div className="booking-fields"><label>Date<input name="date" type="date" required min={today} defaultValue={today} /></label><label>Start time<input name="time" type="time" required defaultValue="10:00" /></label><label>Hours<input name="hours" type="number" min={1} max={4} value={hours} onChange={event => setHours(Math.max(1, Math.min(4, Number(event.target.value) || 1)))} /></label></div>{offline && <p className="form-note">You can review your plans offline. Reconnect to complete a booking.</p>}<button className="button button-green" type="submit">Review booking <span className="mono">R {room.rateZar * hours}</span><ArrowRight size={18} /></button><p className="form-note">Your space is confirmed only after a verified booking. This preview doesn’t reserve a room.</p></form></Dialog>;
}
