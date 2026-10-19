'use client';

import {useEffect, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import {AnimatePresence, motion} from 'motion/react';
import {HouseLine, UsersThree, Cube, Wallet, UserCircle, SlidersHorizontal, FlowerTulip, ArrowUpRight, Leaf, ArrowRight} from '@/components/ui/icons';
import VardaCommunityBoard from '@/components/VardaCommunityBoard';
import EventsSection from '@/components/EventsSection';
import CommunityNotes from '@/components/CommunityNotes';
import {useExperience} from '@/components/ExperienceProvider';
import {VARDA_ASSEMBLIES} from '@/lib/sa-data';
import type {VardaOrder} from '@/components/SpacesPanel';
import Reveal from '@/components/ui/Reveal';

const ThreeStudioViewport = dynamic(() => import('@/components/ThreeStudioViewport'), {ssr: false, loading: () => <div className="studio-loading"><Cube size={48} weight="duotone" /><span>Making a little room for your ideas…</span></div>});
const SouthAfricaPaymentHub = dynamic(() => import('@/components/SouthAfricaPaymentHub'), {loading: () => <div className="page-skeleton" aria-label="Loading wallet" aria-busy="true" />});
const SettingsPanel = dynamic(() => import('@/components/SettingsPanel'), {ssr: false});
const AccountPanel = dynamic(() => import('@/components/AccountPanel'), {ssr: false});

type View = 'home' | 'community' | 'studio' | 'wallet';
const navigation = [{id: 'home', label: 'Home', icon: HouseLine}, {id: 'community', label: 'Community', icon: UsersThree}, {id: 'studio', label: '3D studio', icon: Cube}, {id: 'wallet', label: 'Wallet', icon: Wallet}] as const;

export default function VardaHomePage() {
  const [view, setView] = useState<View>('home');
  const [panel, setPanel] = useState<'settings' | 'account' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VardaOrder>({name: VARDA_ASSEMBLIES[0].name, description: VARDA_ASSEMBLIES[0].subtitle, amountZar: VARDA_ASSEMBLIES[0].priceZar});
  const {feedback, preferences, reducedMotion} = useExperience();
  const previousView = useRef<View>('home');
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    function sync() {
      const hash = location.hash.slice(1);
      const next: View = hash === 'community' ? 'community' : ['studio', 'spatial-studio'].includes(hash) ? 'studio' : ['wallet', 'sa-payments'].includes(hash) ? 'wallet' : 'home';
      setView(next);
      if (next !== previousView.current) {
        window.scrollTo({top: 0, behavior: 'instant'});
        requestAnimationFrame(() => main.current?.focus({preventScroll: true}));
      }
      previousView.current = next;
      if (hash === 'events') requestAnimationFrame(() => document.getElementById('events')?.scrollIntoView({behavior: reducedMotion ? 'instant' : 'smooth'}));
    }
    sync(); window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [reducedMotion]);

  function checkout(order: VardaOrder) { setSelectedOrder(order); location.hash = 'wallet'; }
  return <div className="varda-app">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header"><div className="header-inner"><a href="#home" className="wordmark" aria-label="Varda home"><FlowerTulip size={32} weight="fill" /><span>varda<span className="wordmark-dot">.</span></span></a><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(({id, label}) => <a href={`#${id}`} key={id} onClick={() => feedback()} aria-current={view === id ? 'page' : undefined}>{view === id && <motion.span layoutId="desktop-nav-active" className="nav-active" />}<span>{label}</span></a>)}</nav><div className="header-actions"><span className="home-note"><Leaf size={15} />A little more together.</span><button className="icon-button settings-button" aria-label="Open settings" onClick={() => { setPanel('settings'); feedback(); }}><SlidersHorizontal size={22} /></button><button className="profile-button" aria-label="Open your profile" onClick={() => { setPanel('account'); feedback(); }}>{preferences.nickname ? preferences.nickname.slice(0, 2).toUpperCase() : <UserCircle size={28} weight="duotone" />}</button></div></div></header>
    <main ref={main} id="main-content" tabIndex={-1} className={`app-main ${view === 'studio' ? 'studio-main' : ''}`}>
      <AnimatePresence mode="wait" initial={false}><motion.div key={view} initial={reducedMotion ? false : {opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: reducedMotion ? 0 : -8}} transition={{duration: 0.2, type: 'tween'}}>
        {view === 'home' && <VardaCommunityBoard onTriggerCheckout={checkout} onAccount={() => setPanel('account')} />}
        {view === 'community' && <div className="community-home"><Reveal className="page-title"><span className="eyebrow">Your people, right here</span><h1>A little hello.<br /><em>A lot of possibility.</em></h1><p>Find your next good plan, or start a conversation of your own.</p></Reveal><EventsSection expanded /><CommunityNotes onAccount={() => setPanel('account')} /></div>}
        {view === 'studio' && <div className="studio-page"><Reveal className="page-title"><span className="eyebrow">Room to imagine</span><h1>A brighter idea<br /><em>starts with a little play.</em></h1><p>Get hands-on with the things that power a greener home. Orbit, explore, and make it your own.</p></Reveal><ThreeStudioViewport onSelectOrderForPayment={checkout} /><div className="studio-help"><span><Cube size={22} />Drag to orbit. Pinch to zoom. Tap a part to explore.</span><a className="text-button" href="#home">Back to your people<ArrowRight size={17} /></a></div></div>}
        {view === 'wallet' && <SouthAfricaPaymentHub selectedOrder={selectedOrder} />}
      </motion.div></AnimatePresence>
    </main>
    <footer className="app-footer"><a href="#home" className="wordmark"><FlowerTulip size={25} weight="fill" /><span>varda.</span></a><p>Good spaces. Good people. A little more life.</p><button className="text-button" onClick={() => { setPanel('settings'); feedback(); }}>Make yourself at home<ArrowUpRight size={16} /></button><span className="footer-location mono">Made for living, together.</span></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(({id, label, icon: Icon}) => <a key={id} href={`#${id}`} aria-current={view === id ? 'page' : undefined} onClick={() => feedback()}><Icon size={23} weight={view === id ? 'fill' : 'regular'} /><span>{label}</span></a>)}<button onClick={() => { setPanel('account'); feedback(); }} aria-label="Open your profile"><UserCircle size={23} /><span>You</span></button></nav>
    {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} />}{panel === 'account' && <AccountPanel onClose={() => setPanel(null)} />}
  </div>;
}
