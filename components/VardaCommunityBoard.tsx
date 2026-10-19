'use client';

import Image from 'next/image';

import {useState} from 'react';
import {motion, useScroll, useTransform} from 'motion/react';
import {ArrowRight, ArrowUpRight, CalendarBlank, HouseLine, UsersThree, BookOpenText, FlowerTulip, MapPin, SunHorizon, Plus} from '@/components/ui/icons';
import {useExperience} from '@/components/ExperienceProvider';
import EventsSection from '@/components/EventsSection';
import CommunityNotes from '@/components/CommunityNotes';
import GoalsPanel from '@/components/GoalsPanel';
import SpacesPanel, {type VardaOrder} from '@/components/SpacesPanel';
import Dialog from '@/components/ui/Dialog';
import Reveal from '@/components/ui/Reveal';

export default function VardaCommunityBoard({onTriggerCheckout, onAccount}: {onTriggerCheckout: (order: VardaOrder) => void; onAccount: () => void}) {
  const {preferences, feedback, reducedMotion} = useExperience();
  const [panel, setPanel] = useState<'spaces' | 'home' | 'guide' | null>(null);
  const {scrollY} = useScroll();
  const photoY = useTransform(scrollY, [0, 600], [0, 55]);
  return <div className="community-home">
    <Reveal className="welcome-row"><div><div className="eyebrow"><span className="status-dot" />Your place. Your people.</div><h1>Hey, {preferences.nickname || 'neighbour'}<span className="welcome-dot">.</span></h1><p>Make yourself at home. There’s good company here.</p></div><span className="location-label"><MapPin size={16} />Woodstock, Cape Town</span></Reveal>
    <Reveal><section className="welcome-hero"><div className="hero-copy"><span className="hero-kicker"><SunHorizon size={20} />A good day starts together</span><h2>Life’s a little better<br />with <em>your people.</em></h2><p>A shared table. A new hello. A place to belong.<br className="hidden sm:block" /> Your everyday, with a little more together.</p><a href="#events" className="button button-accent" onClick={() => feedback()}>See what’s happening<ArrowRight size={19} /></a><div className="hero-signoff"><FlowerTulip size={18} weight="duotone" /><span>Good things grow here.</span></div></div><div className="hero-photo"><motion.img style={{y: reducedMotion ? 0 : photoY}} src="/images/community-room.webp" alt="A sunlit shared living room with green plants, yellow chairs, and a view of Table Mountain" width={1440} height={960} fetchPriority="high" /><div className="photo-note"><span className="photo-note-icon"><HouseLine size={23} /></span><span>Room for a little more.<small>Welcome to your shared living room.</small></span><ArrowUpRight size={20} /></div></div></section></Reveal>
    <Reveal className="quick-actions"><button onClick={() => { setPanel('home'); feedback(); }}><span className="quick-icon coral"><HouseLine size={26} weight="duotone" /></span><span>My home<small>Your own little corner</small></span><ArrowUpRight size={18} /></button><button onClick={() => { setPanel('spaces'); feedback(); }}><span className="quick-icon yellow"><CalendarBlank size={26} weight="duotone" /></span><span>Shared spaces<small>Make room for your plans</small></span><ArrowUpRight size={18} /></button><a href="#community" onClick={() => feedback()}><span className="quick-icon sage"><UsersThree size={26} weight="duotone" /></span><span>Your people<small>A hello goes a long way</small></span><ArrowUpRight size={18} /></a><button onClick={() => { setPanel('guide'); feedback(); }}><span className="quick-icon mist"><BookOpenText size={26} weight="duotone" /></span><span>The little things<small>Your handy home guide</small></span><ArrowUpRight size={18} /></button></Reveal>
    <EventsSection />
    <GoalsPanel />
    <CommunityNotes onAccount={onAccount} />
    <Reveal><section className="community-invite"><FlowerTulip size={54} weight="duotone" /><div><span className="eyebrow">The best part of this place?</span><h2>The people you haven’t met yet.</h2></div><a className="button button-green" href="#community" onClick={() => feedback()}>Say a little hello<ArrowUpRight size={18} /></a></section></Reveal>
    {panel === 'spaces' && <SpacesPanel onClose={() => setPanel(null)} onCheckout={onTriggerCheckout} />}
    {panel === 'home' && <Dialog title="Your home, at a glance" onClose={() => setPanel(null)}><Image unoptimized src="/images/community-room.webp" className="dialog-photo" width={1440} height={960} alt="Varda’s shared living room" /><p className="dialog-intro">A cosy corner in Woodstock, with a whole community just outside your door.</p><div className="home-links"><button onClick={() => setPanel('spaces')}><CalendarBlank size={23} /><span>Book a shared space</span><ArrowRight size={18} /></button><button onClick={() => setPanel('guide')}><BookOpenText size={23} /><span>Find the home essentials</span><ArrowRight size={18} /></button><button onClick={() => { setPanel(null); onAccount(); }}><UsersThree size={23} /><span>Your profile & account</span><ArrowRight size={18} /></button></div></Dialog>}
    {panel === 'guide' && <Dialog title="The little home guide" onClose={() => setPanel(null)}><p className="dialog-intro">A few things that help a shared home feel good for everyone.</p><div className="home-guide">{[{title: 'Shared spaces', text: 'Leave a little better than you found it. Book meeting rooms before settling in, and give your neighbours room to do their thing.'}, {title: 'A quieter kind of evening', text: 'Keep the volume gentle in common areas after 22:00. Headphones are always a good neighbour.'}, {title: 'A greener everyday', text: 'Bring a reusable cup, separate your recycling, and give the rooftop plants a little love when you can.'}, {title: 'Need a hand?', text: 'Your building host is your first stop for access, maintenance, and anything that needs a real human. Use the contact details provided with your stay.'}].map(item => <details key={item.title}><summary>{item.title}<Plus size={17} /></summary><p>{item.text}</p></details>)}</div></Dialog>}
  </div>;
}
