'use client';

import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
  Layers,
  Calendar,
  CreditCard,
  Zap,
  Share2,
  Check,
} from 'lucide-react';
import {triggerHaptic} from '@/lib/haptics';
import {shareContent} from '@/lib/native-share';
import {useOfflineLedger} from '@/lib/offline-ledger-store';

export default function MobileNavBar() {
  const [activeSection, setActiveSection] = useState<'studio' | 'board' | 'share' | 'specs' | 'payments'>('studio');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [ledger] = useOfflineLedger([]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const boardEl = document.getElementById('community-board');
      const payEl = document.getElementById('sa-payments');
      const specsEl = document.getElementById('architecture-specs');

      if (specsEl && scrollY >= specsEl.offsetTop - 320) {
        setActiveSection('specs');
      } else if (payEl && scrollY >= payEl.offsetTop - 320) {
        setActiveSection('payments');
      } else if (boardEl && scrollY >= boardEl.offsetTop - 320) {
        setActiveSection('board');
      } else {
        setActiveSection('studio');
      }
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string, section: typeof activeSection) => {
    triggerHaptic('selection');
    setActiveSection(section);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({behavior: 'smooth'});
    }
  };

  const handleNativeShare = async () => {
    triggerHaptic('medium');
    const res = await shareContent({
      title: 'Varda — 3D Spatial & Eco-Living Platform',
      text: 'Explore interactive 3D micro-grid hardware, custom GLSL shaders, community living, and South African payment settlements.',
    });

    if (res === 'copied') {
      setShareFeedback('Link Copied');
      setTimeout(() => setShareFeedback(null), 2000);
    } else if (res === 'shared') {
      setShareFeedback('Shared');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  const ledgerCount = ledger.length > 0 ? ledger.length : 2;

  return (
    <>
      <AnimatePresence>
        {shareFeedback && (
          <motion.div
            initial={{opacity: 0, y: 10, scale: 0.95}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 6, scale: 0.95}}
            transition={{type: 'spring', stiffness: 420, damping: 28}}
            className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#144239] text-[#E6C465] text-xs font-sans font-semibold px-4 py-2 rounded-xl shadow-xl border border-[#E6C465]/35 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{shareFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F4F3EC]/95 backdrop-blur-xl border-t border-[#144239]/15 shadow-[0_-10px_30px_rgba(17,54,46,0.1)] px-2 pt-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] font-sans antialiased"
      >
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto gap-0.5">
          {/* Tab 01: 3D Studio */}
          <button
            type="button"
            onClick={() => scrollTo('studio', 'studio')}
            className={`relative flex flex-col items-center justify-center w-full min-h-[50px] py-1 rounded-xl transition-colors cursor-pointer ${
              activeSection === 'studio'
                ? 'text-[#144239]'
                : 'text-[#144239]/60 hover:text-[#144239]/90'
            }`}
          >
            {activeSection === 'studio' && (
              <motion.span
                layoutId="mobile-nav-active-pill"
                transition={{type: 'spring', stiffness: 380, damping: 30}}
                className="absolute inset-x-1.5 inset-y-0.5 rounded-xl bg-[#144239]/8 border border-[#144239]/15 -z-10"
              />
            )}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-mono tabular-nums text-[9px] font-semibold text-[#144239]/55">
                01
              </span>
              <Layers className="w-4 h-4" />
            </div>
            <span
              className={`text-[11px] leading-none tracking-[-0.01em] ${
                activeSection === 'studio' ? 'font-semibold' : 'font-medium'
              }`}
            >
              3D Studio
            </span>
          </button>

          {/* Tab 02: Community Board */}
          <button
            type="button"
            onClick={() => scrollTo('community-board', 'board')}
            className={`relative flex flex-col items-center justify-center w-full min-h-[50px] py-1 rounded-xl transition-colors cursor-pointer ${
              activeSection === 'board'
                ? 'text-[#144239]'
                : 'text-[#144239]/60 hover:text-[#144239]/90'
            }`}
          >
            {activeSection === 'board' && (
              <motion.span
                layoutId="mobile-nav-active-pill"
                transition={{type: 'spring', stiffness: 380, damping: 30}}
                className="absolute inset-x-1.5 inset-y-0.5 rounded-xl bg-[#144239]/8 border border-[#144239]/15 -z-10"
              />
            )}
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-mono tabular-nums text-[9px] font-semibold text-[#144239]/55">
                02
              </span>
              <Calendar className="w-4 h-4" />
            </div>
            <span
              className={`text-[11px] leading-none tracking-[-0.01em] ${
                activeSection === 'board' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Board
            </span>
          </button>

          {/* Center Geometric Action: VARDA Hub / Fast Settle */}
          <button
            type="button"
            onClick={() => scrollTo('sa-payments', 'payments')}
            className="flex flex-col items-center justify-center -translate-y-3 group min-h-[54px] min-w-[58px] cursor-pointer"
            aria-label="Varda Quick Settle"
          >
            <div className="w-12 h-11 rounded-2xl rotate-0 bg-[#144239] group-active:scale-95 text-[#E6C465] flex items-center justify-center shadow-[0_6px_16px_rgba(20,66,57,0.28)] border-2 border-[#F4F3EC] transition-transform">
              <Zap className="w-4 h-4 fill-current" />
              <span className="font-mono tabular-nums text-[10px] font-bold ml-0.5">
                ZAR
              </span>
            </div>
            <span className="font-serif text-[10px] font-bold text-[#144239] mt-0.5 tracking-tight leading-none">
              Varda
            </span>
          </button>

          {/* Tab 03: Native Share */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="relative flex flex-col items-center justify-center w-full min-h-[50px] py-1 rounded-xl text-[#144239]/60 hover:text-[#144239] active:scale-95 transition-all cursor-pointer"
            title="Share Varda platform"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-mono tabular-nums text-[9px] font-semibold text-[#144239]/55">
                03
              </span>
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium leading-none tracking-[-0.01em]">
              Share
            </span>
          </button>

          {/* Tab 04: SA Payments with Font-Mono Ledger Count */}
          <button
            type="button"
            onClick={() => scrollTo('sa-payments', 'payments')}
            className={`relative flex flex-col items-center justify-center w-full min-h-[50px] py-1 rounded-xl transition-colors cursor-pointer ${
              activeSection === 'payments'
                ? 'text-[#144239]'
                : 'text-[#144239]/60 hover:text-[#144239]/90'
            }`}
          >
            {activeSection === 'payments' && (
              <motion.span
                layoutId="mobile-nav-active-pill"
                transition={{type: 'spring', stiffness: 380, damping: 30}}
                className="absolute inset-x-1.5 inset-y-0.5 rounded-xl bg-[#144239]/8 border border-[#144239]/15 -z-10"
              />
            )}
            <div className="flex items-center gap-1 mb-0.5">
              <CreditCard className="w-4 h-4" />
              <span className="font-mono tabular-nums text-[9px] font-bold px-1 py-0.2 rounded bg-[#144239]/12 text-[#144239]">
                {ledgerCount}
              </span>
            </div>
            <span
              className={`text-[11px] leading-none tracking-[-0.01em] ${
                activeSection === 'payments' ? 'font-semibold' : 'font-medium'
              }`}
            >
              Pay · EFT
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
