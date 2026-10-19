'use client';

import React, {useState} from 'react';
import {motion} from 'motion/react';
import ThreeStudioViewport from '@/components/ThreeStudioViewport';
import VardaCommunityBoard from '@/components/VardaCommunityBoard';
import SouthAfricaPaymentHub from '@/components/SouthAfricaPaymentHub';
import {VARDA_ASSEMBLIES} from '@/lib/sa-data';
import {
  Box,
  Compass,
  CreditCard,
  WifiOff,
  Zap,
  ArrowDownRight,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export default function VardaHomePage() {
  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(false);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);

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
    setSelectedOrder(item);
    const el = document.getElementById('sa-payments');
    if (el) {
      el.scrollIntoView({behavior: 'smooth'});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3EC] text-[#11362E]">
      {/* ====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT
         ==================================================================== */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 bg-[#F4F3EC]/95 border-b border-[#144239]/12">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          className="font-serif text-2xl font-bold tracking-tight text-[#144239] whitespace-nowrap shrink-0"
        >
          Varda
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#11362E]/80">
          <a
            href="#spatial-studio"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            3D Studio
          </a>
          <a
            href="#community-board"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Varda Board
          </a>
          <a
            href="#sa-payments"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            SA Payments
          </a>
          <a
            href="#architecture-specs"
            className="hover:text-[#144239] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Specifications
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#sa-payments"
            className="px-4 py-2 text-xs font-semibold text-[#F4F3EC] bg-[#144239] rounded-xl hover:bg-[#1B574B] transition-colors whitespace-nowrap shrink-0"
          >
            PayFast & Ozow Checkout
          </a>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT CONTAINER (1440px Baseline)
         ==================================================================== */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 space-y-16 sm:space-y-24">
        {/* HERO SECTION + LOW-BANDWIDTH WORKSPACE BAR */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <motion.div
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.25}}
              className="lg:col-span-8 space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#144239]/75">
                <span>South Africa Spatial Infrastructure & Co-Living</span>
                <span aria-hidden="true">·</span>
                <span>Woodstock, Cape Town & Maboneng, Johannesburg</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">ZAR (R) Native</span>
              </div>

              <h1
                className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#11362E] tracking-tight leading-[1.08]"
                style={{textWrap: 'balance'}}
              >
                Interactive 3D micro-grid anatomy, WebGL shaders & community living.
              </h1>
            </motion.div>

            <motion.div
              initial={{opacity: 0, y: 12}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.25, delay: 0.05}}
              className="lg:col-span-4 space-y-4"
            >
              <p className="text-sm sm:text-base text-[#11362E]/80 leading-relaxed">
                Inspect multi-part solar and hydro hardware with custom GLSL fire,
                water, and plasma shaders, test real-time 3D collision physics, and
                settle via PayFast, Ozow Instant EFT, PayShap, or offline USSD.
              </p>

              {/* Workspace Quick Toggles for South African Low-Bandwidth & Offline Mode */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLowBandwidthMode((b) => !b)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    lowBandwidthMode
                      ? 'bg-[#144239] text-[#E6C465]'
                      : 'bg-[#E5E4D8] text-[#144239] hover:bg-[#DAD8C8]'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  {lowBandwidthMode
                    ? 'Low-Bandwidth Wireframe: ON (38 KB)'
                    : 'Enable 2G/3G Wireframe Mode'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOfflineSimulated((o) => !o)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isOfflineSimulated
                      ? 'bg-[#8E1B24] text-white'
                      : 'bg-[#E5E4D8] text-[#144239] hover:bg-[#DAD8C8]'
                  }`}
                >
                  <WifiOff className="w-3.5 h-3.5" />
                  {isOfflineSimulated
                    ? 'Stage-6 Offline Queue: ON'
                    : 'Simulate Load-Shedding Offline'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* 3D INTERACTIVE WEBGL STUDIO & REAL-TIME COLLISION SCENE EDITOR */}
          <ThreeStudioViewport
            lowBandwidthMode={lowBandwidthMode}
            onSelectOrderForPayment={handleSelectOrderAndScroll}
          />

          {/* 4-Column Quantitative Proof & Telemetry Strip below Hero Split */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              {
                label: 'Custom GLSL Shaders',
                value: 'Fire · Water · Plasma',
                context: '60 FPS Procedural Vertex & Fragment Pipeline',
              },
              {
                label: 'Low-Bandwidth Footprint',
                value: '38 KB Isometric Mesh',
                context: 'Zero external .glb 404s · Loads in 0.4s on 3G',
              },
              {
                label: 'Collision & Kinematics',
                value: '135 N/m Spring Physics',
                context: 'Real-time bounding-sphere repulsion & drag-and-drop',
              },
              {
                label: 'SA Payment Settlement',
                value: 'PayFast · Ozow · PayShap',
                context: 'Server-side MD5 & SHA-512 cryptographic signing',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-white/80 border border-[#144239]/10 space-y-1"
              >
                <p className="text-xs text-[#144239]/70">{stat.label}</p>
                <p className="font-serif text-lg font-bold text-[#144239] font-mono tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[11px] text-[#144239]/75">{stat.context}</p>
              </div>
            ))}
          </div>
        </section>

        {/* NOLI-INSPIRED VARDA COMMUNITY BOARD & ECO-GOALS */}
        <VardaCommunityBoard onTriggerCheckout={handleSelectOrderAndScroll} />

        {/* SOUTH AFRICAN PAYMENT GATEWAY (PAYFAST / OZOW / PAYSHAP / OFFLINE VAULT) */}
        <SouthAfricaPaymentHub
          selectedOrder={selectedOrder}
          isOfflineSimulated={isOfflineSimulated}
          onToggleOfflineSimulation={() => setIsOfflineSimulated((o) => !o)}
          lowBandwidthMode={lowBandwidthMode}
          onToggleLowBandwidth={() => setLowBandwidthMode((b) => !b)}
        />

        {/* ARCHITECTURAL & TECHNICAL SPECIFICATIONS SECTION */}
        <section
          id="architecture-specs"
          className="rounded-3xl bg-[#E8E6DA] border border-[#144239]/12 p-6 sm:p-10 space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#144239]/70">
                04. Spatial & Cryptographic Architecture
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#11362E] mt-1">
                Built for South African Grid & Network Realities
              </h2>
            </div>
            <a
              href="#spatial-studio"
              className="text-xs font-semibold text-[#144239] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              Return to 3D Isometric Studio
              <ArrowDownRight className="w-3.5 h-3.5 rotate-180" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F4F3EC] border border-[#144239]/10 space-y-2.5">
              <Layers className="w-5 h-5 text-[#144239]" />
              <h3 className="font-serif text-lg font-bold text-[#144239]">
                01. Multi-Part 3D Anatomy & Spring Kinematics
              </h3>
              <p className="text-xs text-[#11362E]/80 leading-relaxed">
                Every Varda hardware assembly is constructed procedurally in Three.js
                with 7–8 individually selectable sub-components. Second-order Hooke’s
                law spring equations smoothly interpolate exploded views and tactile
                part isolation without layout thrashing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F4F3EC] border border-[#144239]/10 space-y-2.5">
              <Zap className="w-5 h-5 text-[#144239]" />
              <h3 className="font-serif text-lg font-bold text-[#144239]">
                02. GLSL Fire, Water & Plasma Shaders
              </h3>
              <p className="text-xs text-[#11362E]/80 leading-relaxed">
                Custom WebGL vertex and fragment shaders simulate solar-thermal heat
                convection (Fire), rainwater vortex waves with Fresnel caustics
                (Water), and high-frequency toroidal inverter fields (Plasma), with
                instant fallback to 38 KB Isometric Wireframes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F4F3EC] border border-[#144239]/10 space-y-2.5">
              <ShieldCheck className="w-5 h-5 text-[#144239]" />
              <h3 className="font-serif text-lg font-bold text-[#144239]">
                03. PayFast MD5 & Ozow SHA-512 Verification
              </h3>
              <p className="text-xs text-[#11362E]/80 leading-relaxed">
                Server-side Next.js API routes generate URL-encoded PayFast MD5
                signatures and Ozow SHA-512 hashes in ZAR, paired with a persistent
                LocalStorage offline transaction queue and USSD fallback strings for
                Stage-8 load-shedding resilience.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET ARCHITECTURAL FOOTER */}
      <footer className="border-t border-[#144239]/12 bg-[#EAE8DC] px-6 lg:px-12 py-6">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#11362E]/75">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#144239]">Varda</span>
            <span>·</span>
            <span>
              3D Spatial Product Studio & Co-Living Platform (Woodstock · Maboneng)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#spatial-studio" className="hover:text-[#144239]">
              3D WebGL Studio
            </a>
            <a href="#community-board" className="hover:text-[#144239]">
              Varda Board
            </a>
            <a href="#sa-payments" className="hover:text-[#144239]">
              PayFast & Ozow Vault
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
