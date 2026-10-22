'use client';

import React, {useState, useEffect} from 'react';
import {motion} from 'motion/react';
import ThreeStudioViewport from '@/components/ThreeStudioViewport';
import VardaCommunityBoard from '@/components/VardaCommunityBoard';
import SouthAfricaPaymentHub from '@/components/SouthAfricaPaymentHub';
import RecentOrdersList from '@/components/RecentOrdersList';
import PWAInstallButton from '@/components/PWAInstallButton';
import MobileNavBar from '@/components/MobileNavBar';
import {VARDA_ASSEMBLIES} from '@/lib/sa-data';
import {
  triggerHaptic,
  getHapticIntensity,
  setHapticIntensity,
  type HapticIntensity,
} from '@/lib/haptics';
import {shareContent} from '@/lib/native-share';
import {
  Box,
  WifiOff,
  Share2,
  Check,
  ArrowDownRight,
  Layers,
  Zap,
  ShieldCheck,
  Activity,
  Vibrate,
} from 'lucide-react';

export type StudioMotionPreference = 'system' | 'full' | 'subtle' | 'reduced';

const MOTION_STORAGE_KEY = 'varda_studio_motion_pref_v1';

export default function VardaHomePage() {
  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(false);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Motion Preferences State (respecting system-level prefers-reduced-motion)
  const [motionPref, setMotionPref] = useState<StudioMotionPreference>('system');
  const [osPrefersReduced, setOsPrefersReduced] = useState<boolean>(false);

  // Haptic Feedback Intensity State ('none' | 'light' | 'heavy') persisted in localStorage
  const [hapticPref, setHapticPref] = useState<HapticIntensity>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let active = true;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = localStorage.getItem(MOTION_STORAGE_KEY) as StudioMotionPreference | null;
        if (saved && ['system', 'full', 'subtle', 'reduced'].includes(saved)) {
          setMotionPref(saved);
        }
      } catch {
        // Ignore storage access errors.
      }
      setHapticPref(getHapticIntensity());
      setOsPrefersReduced(mediaQuery.matches);
    });

    const handleChange = (e: MediaQueryListEvent) => {
      setOsPrefersReduced(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      active = false;
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleSelectMotionPref = (nextPref: StudioMotionPreference) => {
    triggerHaptic('selection');
    setMotionPref(nextPref);
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, nextPref);
    } catch {
      // Ignore storage write errors
    }
  };

  const handleSelectHapticPref = (nextIntensity: HapticIntensity) => {
    setHapticIntensity(nextIntensity);
    setHapticPref(nextIntensity);
    if (nextIntensity !== 'none') {
      triggerHaptic(nextIntensity === 'heavy' ? 'heavy' : 'light');
    }
  };

  // Compute effective 3D studio animation intensity (0.0 to 1.0)
  const effectiveMotionIntensity: number =
    motionPref === 'reduced'
      ? 0
      : motionPref === 'subtle'
      ? 0.45
      : motionPref === 'full'
      ? 1
      : osPrefersReduced
      ? 0
      : 1;

  const [selectedOrder, setSelectedOrder] = useState<{
    name: string;
    description: string;
    amountZar: number;
  }>({
    name: VARDA_ASSEMBLIES[0].name,
    description: VARDA_ASSEMBLIES[0].subtitle,
    amountZar: VARDA_ASSEMBLIES[0].priceZar,
  });

  const handleSelectOrderAndScroll = (item: {
    name: string;
    description: string;
    amountZar: number;
  }) => {
    triggerHaptic('medium');
    setSelectedOrder(item);
    const el = document.getElementById('sa-payments');
    if (el) {
      el.scrollIntoView({behavior: 'smooth'});
    }
  };

  const handleTopShare = async () => {
    triggerHaptic('light');
    const res = await shareContent({
      title: 'Varda — 3D Spatial & Eco-Living Platform',
      text: 'Inspect 3D solar-hydro hardware with custom GLSL shaders, community living board, and South African payment settlements.',
    });
    if (res === 'copied') {
      setShareToast('Link Copied to Clipboard!');
      setTimeout(() => setShareToast(null), 2200);
    } else if (res === 'shared') {
      setShareToast('Shared via System Share!');
      setTimeout(() => setShareToast(null), 2200);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#F4F3EC] text-[#11362E] font-sans transition-colors duration-200 pb-24 md:pb-12">
      {/* ====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT WITH NATIVE PWA INSTALL & SAFE AREA
         ==================================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-8 lg:px-12 py-3 sm:py-4 bg-[#F4F3EC]/95 backdrop-blur-md border-b border-[#144239]/12 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          className="font-serif text-2xl font-bold tracking-tight text-[#144239] whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          Varda
        </a>

        {/* Zone 2: Concise single-line text navigation links with font-mono indices */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#11362E]/80">
          <a
            href="#studio"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span className="font-mono tabular-nums text-[11px] text-[#144239]/55">01</span>
            <span>3D Studio</span>
          </a>
          <a
            href="#community-board"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span className="font-mono tabular-nums text-[11px] text-[#144239]/55">02</span>
            <span>Varda Board</span>
          </a>
          <a
            href="#sa-payments"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span className="font-mono tabular-nums text-[11px] text-[#144239]/55">03</span>
            <span>SA Payments</span>
          </a>
          <a
            href="#architecture-specs"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span className="font-mono tabular-nums text-[11px] text-[#144239]/55">04</span>
            <span>Specifications</span>
          </a>
        </nav>

        {/* Zone 3: Native Share + In-app PWA install affordance + Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTopShare}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#144239]/20 hover:bg-[#144239]/5 text-[#144239] text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            title="Share Varda"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <PWAInstallButton />

          <a
            href="#sa-payments"
            onClick={() => triggerHaptic('selection')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[#F4F3EC] bg-[#144239] rounded-xl hover:bg-[#1B574B] active:scale-95 transition-all whitespace-nowrap shrink-0 shadow-sm"
          >
            <span className="hidden sm:inline">PayFast & Ozow </span>Checkout
          </a>
        </div>
      </header>

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#144239] text-[#E6C465] text-xs font-semibold px-4 py-2 rounded-xl shadow-2xl border border-[#E6C465]/40 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-3.5 h-3.5" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* ====================================================================
          MAIN CONTENT CONTAINER (1440px Baseline)
         ==================================================================== */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-12 space-y-12 sm:space-y-20">
        {/* HERO SECTION + LOW-BANDWIDTH WORKSPACE BAR */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-end">
            <motion.div
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.25}}
              className="lg:col-span-8 space-y-3 sm:space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#144239]/75">
                <span className="font-mono tabular-nums font-bold px-2 py-0.5 rounded-md bg-[#144239]/10 text-[#144239]">
                  01 · SPATIAL LAB
                </span>
                <span>Woodstock, Cape Town & Maboneng, JHB</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums font-semibold text-[#144239]">
                  ZAR (R) Native
                </span>
              </div>

              <h1
                className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#11362E] tracking-tight leading-[1.12] sm:leading-[1.08]"
                style={{textWrap: 'balance'}}
              >
                Interactive <span className="font-mono tabular-nums">3D</span> micro-grid anatomy, WebGL shaders & community living.
              </h1>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.25, delay: 0.05}}
              className="lg:col-span-4 space-y-4"
            >
              <p className="text-xs sm:text-base text-[#11362E]/80 leading-relaxed">
                Inspect multi-part solar and hydro hardware with custom GLSL fire,
                water, and plasma shaders, test real-time <span className="font-mono tabular-nums">3D</span> collision physics, and
                settle via PayFast, Ozow Instant EFT, PayShap, or offline USSD.
              </p>

              {/* Workspace Quick Toggles for South African Low-Bandwidth & Offline Mode */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setLowBandwidthMode((b) => !b);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    lowBandwidthMode
                      ? 'bg-[#144239] text-[#E6C465] shadow-sm'
                      : 'bg-[#E5E4D8] text-[#144239] hover:bg-[#DAD8C8]'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">
                    {lowBandwidthMode
                      ? '2G/3G Wireframe: ON (38 KB)'
                      : 'Enable 2G/3G (38 KB)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('warning');
                    setIsOfflineSimulated((o) => !o);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isOfflineSimulated
                      ? 'bg-[#8E1B24] text-white shadow-sm'
                      : 'bg-[#E5E4D8] text-[#144239] hover:bg-[#DAD8C8]'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>
                    {isOfflineSimulated
                      ? 'Offline USSD Queue: ON'
                      : 'Simulate Load-Shedding'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* 3D INTERACTIVE WEBGL STUDIO & REAL-TIME COLLISION SCENE EDITOR */}
          <ThreeStudioViewport
            lowBandwidthMode={lowBandwidthMode}
            motionIntensity={effectiveMotionIntensity}
            onSelectOrderForPayment={handleSelectOrderAndScroll}
          />

          {/* 4-Column Quantitative Proof & Telemetry Strip below Hero Split */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {[
              {
                index: '01',
                label: 'Custom GLSL Shaders',
                value: '60 FPS · 3 Pipelines',
                context: 'Procedural Fire, Water & Plasma vertex/fragment shaders',
              },
              {
                index: '02',
                label: 'Low-Bandwidth Footprint',
                value: '38 KB · 0.4s Load',
                context: 'Zero external .glb 404s · Optimized for 2G/3G networks',
              },
              {
                index: '03',
                label: 'Collision & Kinematics',
                value: '135 N/m · 7–8 Parts',
                context: 'Real-time bounding-sphere repulsion & spring anatomy',
              },
              {
                index: '04',
                label: 'SA Payment Settlement',
                value: 'MD5 + SHA-512 ZAR',
                context: 'PayFast, Ozow Instant EFT, PayShap & USSD offline vault',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/85 border border-[#144239]/12 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#144239]/70">
                  <span>{stat.label}</span>
                  <span className="font-mono tabular-nums font-bold text-[#144239]/45">
                    {stat.index}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-[#144239] font-mono tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#144239]/75 leading-snug">
                  {stat.context}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* NOLI-INSPIRED VARDA COMMUNITY BOARD & ECO-GOALS */}
        <VardaCommunityBoard onTriggerCheckout={handleSelectOrderAndScroll} />

        {/* SOUTH AFRICAN PAYMENT GATEWAY (PAYFAST / OZOW / PAYSHAP / OFFLINE VAULT) */}
        <div className="space-y-6">
          <SouthAfricaPaymentHub
            selectedOrder={selectedOrder}
            isOfflineSimulated={isOfflineSimulated}
            onToggleOfflineSimulation={() => setIsOfflineSimulated((o) => !o)}
            lowBandwidthMode={lowBandwidthMode}
            onToggleLowBandwidth={() => setLowBandwidthMode((b) => !b)}
          />

          {/* LOCALSTORAGE-BACKED RECENT ORDERS & TRANSACTION ATTEMPTS LIST */}
          <RecentOrdersList onSelectOrder={handleSelectOrderAndScroll} />
        </div>

        {/* ARCHITECTURAL & TECHNICAL SPECIFICATIONS SECTION */}
        <section
          id="architecture-specs"
          className="rounded-3xl bg-[#E8E6DA] border border-[#144239]/12 p-5 sm:p-10 space-y-6 sm:space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono tabular-nums font-semibold text-[#144239]/70 uppercase tracking-wider">
                04 · Spatial & Cryptographic Architecture
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#11362E] mt-1">
                Built for South African Grid & Network Realities
              </h2>
            </div>
            <a
              href="#studio"
              className="text-xs font-semibold text-[#144239] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Return to 3D Isometric Studio
              <ArrowDownRight className="w-3.5 h-3.5 rotate-180" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#F4F3EC] border border-[#144239]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <Layers className="w-5 h-5 text-[#144239]" />
                <span className="font-mono tabular-nums text-xs font-bold text-[#144239]/50">
                  01 / 03
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#144239]">
                Multi-Part 3D Anatomy & Spring Kinematics
              </h3>
              <p className="text-xs text-[#11362E]/80 leading-relaxed">
                Every Varda hardware assembly is constructed procedurally in Three.js
                with <span className="font-mono tabular-nums font-semibold">7–8</span> individually selectable sub-components. Second-order Hooke’s
                law spring equations (<span className="font-mono tabular-nums">135 N/m</span>) smoothly interpolate exploded views and tactile
                part isolation without layout thrashing.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#F4F3EC] border border-[#144239]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <Zap className="w-5 h-5 text-[#144239]" />
                <span className="font-mono tabular-nums text-xs font-bold text-[#144239]/50">
                  02 / 03
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#144239]">
                GLSL Fire, Water & Plasma Shaders
              </h3>
              <p className="text-xs text-[#11362E]/80 leading-relaxed">
                Custom WebGL vertex and fragment shaders simulate solar-thermal heat
                convection (Fire), rainwater vortex waves with Fresnel caustics
                (Water), and high-frequency toroidal inverter fields (Plasma), with
                instant fallback to <span className="font-mono tabular-nums font-semibold">38 KB</span> Isometric Wireframes.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-[#F4F3EC] border border-[#144239]/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <ShieldCheck className="w-5 h-5 text-[#144239]" />
                <span className="font-mono tabular-nums text-xs font-bold text-[#144239]/50">
                  03 / 03
                </span>
              </div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#144239]">
                PayFast MD5 & Ozow SHA-512 Verification
              </h3>
              <p className="text-xs text-[#11362E]/80 leading-relaxed">
                Server-side Next.js API routes generate URL-encoded PayFast <span className="font-mono tabular-nums">MD5</span>
                signatures and Ozow <span className="font-mono tabular-nums">SHA-512</span> hashes in ZAR, paired with a persistent
                LocalStorage offline transaction queue and USSD fallback strings for
                Stage-<span className="font-mono tabular-nums">8</span> load-shedding resilience.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          ARCHITECTURAL FOOTER WITH 3D MOTION & HAPTIC FEEDBACK SETTINGS
         ==================================================================== */}
      <footer className="border-t border-[#144239]/15 bg-[#EAE8DC] px-4 sm:px-8 lg:px-12 py-8">
        <div className="max-w-[1380px] mx-auto space-y-6">
          {/* Settings Grid: 3D Motion Intensity + Haptic Feedback Intensity */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Card 1: Motion Preferences Control Bar for 3D Studio */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F3EC] border border-[#144239]/12 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#144239] text-[#E6C465]">
                    <Activity className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#144239]">
                    3D Studio Motion & Kinematics Intensity
                  </span>
                  <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-md bg-[#144239]/10 text-[#144239] font-semibold">
                    Active: {Math.round(effectiveMotionIntensity * 100)}% ({effectiveMotionIntensity.toFixed(2)}x)
                  </span>
                  <span className="font-mono tabular-nums text-[10px] px-2 py-0.5 rounded-md border border-[#144239]/15 text-[#144239]/75">
                    OS: {osPrefersReduced ? 'REDUCE' : 'STANDARD'}
                  </span>
                </div>
                <p className="text-xs text-[#11362E]/75">
                  Adjusts WebGL GLSL shader velocity, continuous part rotation, and Hooke’s law spring bounce while respecting system accessibility settings.
                </p>
              </div>

              {/* Segmented Motion Intensity Selector */}
              <div
                role="group"
                aria-label="3D Studio Animation Intensity"
                className="flex flex-wrap items-center gap-1 bg-[#E5E3D5] p-1 rounded-xl border border-[#144239]/12 self-start"
              >
                {(
                  [
                    {
                      id: 'system',
                      label: 'System Sync',
                      badge: osPrefersReduced ? '0%' : '100%',
                    },
                    {id: 'full', label: 'Full Motion', badge: '100%'},
                    {id: 'subtle', label: 'Subtle', badge: '45%'},
                    {id: 'reduced', label: 'Reduced', badge: '0%'},
                  ] as const
                ).map((opt) => {
                  const isSelected = motionPref === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectMotionPref(opt.id)}
                      aria-pressed={isSelected}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#144239] text-[#F4F3EC] font-semibold shadow-xs'
                          : 'text-[#144239]/75 hover:text-[#144239]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-[#E6C465] text-[#0B241E] font-bold'
                            : 'bg-[#144239]/10 text-[#144239]'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Tactile Haptic Feedback Intensity Settings (None, Light, Heavy) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F3EC] border border-[#144239]/12 flex flex-col justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#144239] text-[#E6C465]">
                    <Vibrate className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#144239]">
                    Tactile Haptic Feedback Intensity
                  </span>
                  <span className="font-mono tabular-nums text-[11px] px-2 py-0.5 rounded-md bg-[#144239]/10 text-[#144239] font-semibold uppercase">
                    Mode: {hapticPref}
                  </span>
                  <span className="font-mono tabular-nums text-[10px] px-2 py-0.5 rounded-md border border-[#144239]/15 text-[#144239]/75">
                    localStorage: varda_haptic_intensity_v1
                  </span>
                </div>
                <p className="text-xs text-[#11362E]/75">
                  Configures hardware vibration pulse duration across 3D component selection, collision alerts, and payment settlements.
                </p>
              </div>

              {/* Segmented Haptic Intensity Selector (None, Light, Heavy) */}
              <div
                role="group"
                aria-label="Haptic Feedback Intensity"
                className="flex flex-wrap items-center gap-1 bg-[#E5E3D5] p-1 rounded-xl border border-[#144239]/12 self-start"
              >
                {(
                  [
                    {id: 'none', label: 'None', pulse: '0ms'},
                    {id: 'light', label: 'Light', pulse: '10ms'},
                    {id: 'heavy', label: 'Heavy', pulse: '85ms'},
                  ] as const
                ).map((opt) => {
                  const isSelected = hapticPref === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectHapticPref(opt.id)}
                      aria-pressed={isSelected}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#144239] text-[#F4F3EC] font-semibold shadow-xs'
                          : 'text-[#144239]/75 hover:text-[#144239]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-[#E6C465] text-[#0B241E] font-bold'
                            : 'bg-[#144239]/10 text-[#144239]'
                        }`}
                      >
                        {opt.pulse}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Row: Brand & Navigation Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#11362E]/75 pt-1">
            <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
              <span className="font-serif font-bold text-sm text-[#144239]">Varda</span>
              <span>·</span>
              <span>
                3D Spatial Product Studio & Co-Living Platform (Woodstock · Maboneng)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-5 font-medium">
              <a href="#studio" className="hover:text-[#144239] flex items-center gap-1">
                <span className="font-mono tabular-nums text-[10px] opacity-60">01</span>
                <span>3D WebGL Studio</span>
              </a>
              <a href="#community-board" className="hover:text-[#144239] flex items-center gap-1">
                <span className="font-mono tabular-nums text-[10px] opacity-60">02</span>
                <span>Varda Board</span>
              </a>
              <a href="#sa-payments" className="hover:text-[#144239] flex items-center gap-1">
                <span className="font-mono tabular-nums text-[10px] opacity-60">03</span>
                <span>PayFast & Ozow Vault</span>
              </a>
              <a href="#recent-orders" className="hover:text-[#144239] flex items-center gap-1">
                <span className="font-mono tabular-nums text-[10px] opacity-60">03B</span>
                <span>Recent Orders</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* NATIVE MOBILE 5-TAB THUMB DOCK */}
      <MobileNavBar />
    </div>
  );
}
