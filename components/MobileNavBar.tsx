'use client';

import React, {useState, useEffect} from 'react';
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

export default function MobileNavBar() {
  const [activeSection, setActiveSection] = useState<'studio' | 'board' | 'share' | 'specs' | 'payments'>('studio');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const studioEl = document.getElementById('studio') || document.getElementById('spatial-studio');
      const boardEl = document.getElementById('community-board');
      const payEl = document.getElementById('sa-payments');
      const specsEl = document.getElementById('architecture-specs');

      if (specsEl && scrollY >= specsEl.offsetTop - 300) {
        setActiveSection('specs');
      } else if (payEl && scrollY >= payEl.offsetTop - 300) {
        setActiveSection('payments');
      } else if (boardEl && scrollY >= boardEl.offsetTop - 300) {
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
      setShareFeedback('Link Copied!');
      setTimeout(() => setShareFeedback(null), 2000);
    } else if (res === 'shared') {
      setShareFeedback('Shared!');
      setTimeout(() => setShareFeedback(null), 2000);
    }
  };

  return (
    <>
      {shareFeedback && (
        <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#144239] text-[#E6C465] text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-[#E6C465]/30 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5" />
          <span>{shareFeedback}</span>
        </div>
      )}

      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F4F3EC]/95 backdrop-blur-xl border-t border-[#144239]/15 shadow-[0_-8px_24px_rgba(20,66,57,0.08)] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] transition-transform duration-200"
      >
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
          {/* Tab 1: 3D Studio */}
          <button
            type="button"
            onClick={() => scrollTo('studio', 'studio')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-colors ${
              activeSection === 'studio'
                ? 'text-[#144239] font-bold scale-105'
                : 'text-[#144239]/60 hover:text-[#144239]'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">3D Studio</span>
          </button>

          {/* Tab 2: Community Board */}
          <button
            type="button"
            onClick={() => scrollTo('community-board', 'board')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-colors ${
              activeSection === 'board'
                ? 'text-[#144239] font-bold scale-105'
                : 'text-[#144239]/60 hover:text-[#144239]'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Varda Board</span>
          </button>

          {/* Center Elevated Action: VARDA Hub / Fast Checkout */}
          <button
            type="button"
            onClick={() => scrollTo('sa-payments', 'payments')}
            className="flex flex-col items-center justify-center -translate-y-3.5 group min-h-[56px] min-w-[56px]"
            aria-label="Varda Quick Settle"
          >
            <div className="w-12 h-12 rounded-full bg-[#144239] group-active:scale-95 text-[#E6C465] flex items-center justify-center shadow-lg border-2 border-[#F4F3EC] transition-transform">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[9px] font-bold text-[#144239] mt-0.5 tracking-wider uppercase font-serif">
              Varda
            </span>
          </button>

          {/* Tab 4: Native Share */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 text-[#144239]/60 hover:text-[#144239] active:scale-95 transition-all"
            title="Share Varda platform"
          >
            <Share2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Share</span>
          </button>

          {/* Tab 5: SA Payments */}
          <button
            type="button"
            onClick={() => scrollTo('sa-payments', 'payments')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 transition-colors ${
              activeSection === 'payments'
                ? 'text-[#144239] font-bold scale-105'
                : 'text-[#144239]/60 hover:text-[#144239]'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Pay / EFT</span>
          </button>
        </div>
      </nav>
    </>
  );
}
