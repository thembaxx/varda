'use client';

import React, {useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
  WEEKLY_SCHEDULE_SLOTS,
  COMMUNITY_INQUIRIES,
  CONFERENCE_ROOMS,
  NEIGHBOURHOOD_SPOTS,
  type CommunityInquiryCard,
  type WeeklyScheduleSlot,
} from '@/lib/sa-data';
import {
  Calendar,
  Heart,
  X,
  Plus,
  KeyRound,
  Home,
  Bike,
  BookOpen,
  Sprout,
  Check,
  MapPin,
  Sparkles,
  Users,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {triggerHaptic} from '@/lib/haptics';

interface VardaCommunityBoardProps {
  onTriggerCheckout: (item: {
    name: string;
    description: string;
    amountZar: number;
  }) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [13, 14, 15, 16, 17, 18, 19];

export default function VardaCommunityBoard({
  onTriggerCheckout,
}: VardaCommunityBoardProps) {
  // Interactive State
  const [selectedSlot, setSelectedSlot] = useState<WeeklyScheduleSlot>(
    WEEKLY_SCHEDULE_SLOTS[0]
  );
  const [rsvpedSlotIds, setRsvpedSlotIds] = useState<string[]>(['slot-lunch']);

  // Eco-level & Rooftop garden interactive state
  const [energySavedPct, setEnergySavedPct] = useState<number>(80);
  const [wateredCrops, setWateredCrops] = useState<Record<string, number>>({
    Tomatoes: 84,
    Carrots: 72,
    Salad: 91,
  });

  // Inquiries & Filter State
  const [categoryFilter, setCategoryFilter] = useState<
    'All' | CommunityInquiryCard['category']
  >('All');
  const [inquiries, setInquiries] = useState<CommunityInquiryCard[]>(COMMUNITY_INQUIRIES);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [JoinedIds, setJoinedIds] = useState<string[]>(['inq-2']);
  const [showNewInquiryForm, setShowNewInquiryForm] = useState<boolean>(false);
  const [newInquiryTitle, setNewInquiryTitle] = useState<string>('');
  const [newInquiryQuote, setNewInquiryQuote] = useState<string>('');
  const [newInquiryCat, setNewInquiryCat] =
    useState<CommunityInquiryCard['category']>('Culture');

  // Resident Suite & Conference Room Booking State
  const [activeResidentTile, setActiveResidentTile] = useState<
    'key' | 'apartment' | 'services' | 'manual'
  >('key');
  const [keyUnlocked, setKeyUnlocked] = useState<boolean>(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('fynbos');
  const [selectedSpotId, setSelectedSpotId] = useState<string>(NEIGHBOURHOOD_SPOTS[0].id);

  const filteredInquiries =
    categoryFilter === 'All'
      ? inquiries
      : inquiries.filter((i) => i.category === categoryFilter);

  const currentInquiry =
    filteredInquiries[activeCardIndex % Math.max(1, filteredInquiries.length)] ||
    inquiries[0];

  const handleNextCard = () => {
    triggerHaptic('light');
    setActiveCardIndex((prev) => (prev + 1) % Math.max(1, filteredInquiries.length));
  };

  const handleJoinInquiry = (id: string) => {
    triggerHaptic('medium');
    setJoinedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiryTitle.trim() || !newInquiryQuote.trim()) return;
    const created: CommunityInquiryCard = {
      id: `inq-${Date.now()}`,
      author: 'Themba Mndebele',
      unit: 'Loft 305 · Woodstock',
      category: newInquiryCat,
      title: newInquiryTitle.trim(),
      quote: newInquiryQuote.trim(),
      timeLabel: 'Sat 24/10 · 4:00 pm',
      venue: 'Varda Courtyard',
      attendeesCount: 1,
    };
    setInquiries((prev) => [created, ...prev]);
    setNewInquiryTitle('');
    setNewInquiryQuote('');
    setShowNewInquiryForm(false);
    setActiveCardIndex(0);
  };

  const selectedRoom =
    CONFERENCE_ROOMS.find((r) => r.id === selectedRoomId) || CONFERENCE_ROOMS[0];
  const selectedSpot =
    NEIGHBOURHOOD_SPOTS.find((s) => s.id === selectedSpotId) || NEIGHBOURHOOD_SPOTS[0];

  return (
    <section id="community-board" className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#144239]/70">
            02. Co-Living & Micro-Grid Board · Woodstock & Maboneng
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#11362E] tracking-tight mt-1">
            Varda Board & Community Goals
          </h2>
        </div>
        <p className="text-sm text-[#11362E]/80 max-w-md">
          Real-time rooftop energy savings, urban harvest tracking, resident social
          inquiries, and shared space reservations synced across offline mesh nodes.
        </p>
      </div>

      {/* Main Noli-Inspired 3-Column Architectural Board */}
      <div className="rounded-3xl overflow-hidden border-4 border-[#1D2624] bg-[#F7F6F1] shadow-2xl">
        {/* Top White Architectural Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 sm:px-8 py-5 bg-white border-b border-[#144239]/10">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#144239]">
              VARDA
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-medium text-[#144239]/85">
              Board
            </span>
            <span className="text-xs text-[#144239]/60 ml-2">
              Cape Town & Johannesburg Co-Living Hub
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#144239]">
                Sync with Varda Mobile Pass
              </p>
              <p className="text-[11px] text-[#144239]/65">
                Works offline during Stage 6 Load-Shedding
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onTriggerCheckout({
                  name: 'Varda Co-op Resident Monthly Stokvel Pass',
                  description:
                    'Includes Solar Micro-Grid Quota + Rooftop Harvest Share + Conference Credits',
                  amountZar: 1450,
                })
              }
              className="px-4 py-2 rounded-xl bg-[#144239] hover:bg-[#1B574B] text-[#F4F3EC] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Top Up Resident Pass · R 1,450
            </button>
          </div>
        </div>

        {/* 3-Column Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* ================================================================
              COLUMN 1 (LEFT): EVENTS TIMETABLE, FEATURED EVENT & DEALS TODAY
             ================================================================ */}
          <div className="lg:col-span-4 bg-[#144239] text-[#F4F3EC] p-6 sm:p-7 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Events</h3>
                <p className="text-xs text-[#C4C6AF] mt-0.5">
                  This week · 19–25 October · Tap any block to inspect
                </p>
              </div>

              {/* Weekly Timetable Grid with smooth mobile horizontal scroll */}
              <div className="bg-[#0F352D] rounded-2xl p-3 border border-white/10 overflow-x-auto">
                <div className="min-w-[290px]">
                  <div className="grid grid-cols-8 gap-1 text-[10px] text-[#C4C6AF] pb-2 border-b border-white/10 text-center font-medium">
                    <span>Hr</span>
                    {DAYS.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                <div className="divide-y divide-white/5">
                  {HOURS.map((hr) => (
                    <div
                      key={hr}
                      className="grid grid-cols-8 gap-1 min-h-[34px] items-center py-0.5"
                    >
                      <span className="text-[10px] font-mono tabular-nums text-[#C4C6AF]/70 text-center">
                        {hr > 12 ? `${hr - 12}pm` : `${hr}pm`}
                      </span>
                      {DAYS.map((_, dayIdx) => {
                        const slot = WEEKLY_SCHEDULE_SLOTS.find(
                          (s) => s.dayIndex === dayIdx && Math.floor(s.startHour) === hr
                        );
                        if (!slot) {
                          return (
                            <div
                              key={dayIdx}
                              className="h-7 rounded bg-white/[0.02]"
                            />
                          );
                        }
                        const isSelected = selectedSlot.id === slot.id;
                        const toneClass =
                          slot.tone === 'coral'
                            ? 'bg-[#F3B2A8] text-[#144239]'
                            : slot.tone === 'ochre'
                            ? 'bg-[#E6C465] text-[#144239]'
                            : slot.tone === 'mint'
                            ? 'bg-[#D6EADF] text-[#144239]'
                            : 'bg-[#C4C6AF] text-[#144239]';

                        return (
                          <button
                            key={dayIdx}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`h-7 rounded px-1 text-[9px] font-semibold leading-tight truncate transition-transform ${toneClass} ${
                              isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-105'
                            }`}
                            title={slot.title}
                          >
                            {slot.title.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

              {/* Selected Event Detail Card (Inspired by Noli Pink Yoga Pill Card) */}
              <div className="space-y-2">
                <h4 className="font-serif text-lg font-medium text-white">Event</h4>
                <motion.div
                  key={selectedSlot.id}
                  initial={{opacity: 0, y: 6}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.18}}
                  className="rounded-2xl bg-[#F3B2A8] text-[#144239] p-4 flex items-center justify-between gap-4 shadow-md"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-[#144239]/75">
                      {DAYS[selectedSlot.dayIndex]} · {selectedSlot.startHour - 12}:00 pm ·{' '}
                      {selectedSlot.location}
                    </div>
                    <h5 className="font-serif text-lg font-bold leading-snug">
                      {selectedSlot.title}
                    </h5>
                    <p className="text-xs text-[#144239]/80">{selectedSlot.subtitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      setRsvpedSlotIds((prev) =>
                        prev.includes(selectedSlot.id)
                          ? prev.filter((i) => i !== selectedSlot.id)
                          : [...prev, selectedSlot.id]
                      );
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      rsvpedSlotIds.includes(selectedSlot.id)
                        ? 'bg-[#144239] text-white'
                        : 'bg-white text-[#144239] hover:bg-[#F4F3EC]'
                    }`}
                  >
                    {rsvpedSlotIds.includes(selectedSlot.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Booked
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        RSVP Free
                      </>
                    )}
                  </button>
                </motion.div>
              </div>
            </div>

            {/* Deals Today & Local Partners */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="font-serif text-lg font-medium text-white">Deals today</h4>
              <div className="rounded-2xl bg-[#0F352D] border border-white/10 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#E6C465] font-medium">
                    Truth & Origin Solar Roastery
                  </p>
                  <p className="font-serif text-base font-semibold text-white mt-0.5">
                    20% Korting / Rebate on Artisan Coffee & Pastries
                  </p>
                  <p className="text-xs text-[#C4C6AF] mt-0.5">
                    Redeemable with Varda NFC Key or SnapScan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onTriggerCheckout({
                      name: 'Truth & Origin Solar Coffee Bundle (5x Flat Whites)',
                      description: 'Includes 20% Varda Resident Rebate',
                      amountZar: 160,
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-[#E6C465] text-[#144239] text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  Buy · R 160
                </button>
              </div>
            </div>
          </div>

          {/* ================================================================
              COLUMN 2 (CENTER): COMMUNITY GOALS (80% ECO-LEVEL + ROOFTOP VEG)
              & NEIGHBOURHOOD MAP (DIRECT INSPIRATION FROM IMG_5838 & IMG_5837)
             ================================================================ */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            {/* Upper Sage Panel: Eco-Level 80% Energy Saved */}
            <div className="bg-[#C4C6AF] text-[#144239] p-6 sm:p-7 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#144239]">
                    Community Goals
                  </h3>
                  <p className="text-xs text-[#144239]/80 mt-1 leading-relaxed">
                    Supporting collective energy independence during load-shedding and
                    cultivating organic produce on our rooftop beds.
                  </p>
                </div>
              </div>

              {/* 1. Saving Energy Ring + Tri-Color Bar with Floating Callout Pin */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#144239]">
                    1. Saving energy (Solar Micro-Grid)
                  </span>
                  <div className="flex items-center gap-1">
                    {[72, 80, 92].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEnergySavedPct(val)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums transition-colors ${
                          energySavedPct === val
                            ? 'bg-[#144239] text-white font-semibold'
                            : 'bg-white/50 text-[#144239] hover:bg-white'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-5 pt-2">
                  {/* Circular 80% Gauge */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="rgba(255,255,255,0.45)"
                        strokeWidth="7"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={
                          2 * Math.PI * 32 * (1 - energySavedPct / 100)
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-serif text-lg font-bold tabular-nums text-[#144239]">
                        {energySavedPct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Tri-Color Bar + Floating Speech Pin */}
                  <div className="flex-1 space-y-2">
                    <div className="relative pt-7 pb-1">
                      {/* Floating Callout Bubble */}
                      <div
                        className="absolute top-0 -translate-x-1/2 transition-all duration-300"
                        style={{left: `${energySavedPct}%`}}
                      >
                        <div className="bg-white text-[#144239] px-2.5 py-0.5 rounded-full text-[11px] font-serif font-bold shadow-sm whitespace-nowrap">
                          VARDA
                        </div>
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white mx-auto" />
                      </div>

                      {/* Bar Track */}
                      <div className="h-3.5 w-full rounded-full bg-white/40 p-0.5 flex overflow-hidden">
                        <div className="w-1/4 bg-[#8E1B24] h-full rounded-l-full" />
                        <div className="w-1/3 bg-[#E6C465] h-full" />
                        <div className="flex-1 bg-[#5A9A58] h-full rounded-r-full" />
                      </div>
                    </div>
                    <p className="text-[11px] font-medium text-[#144239]/80">
                      Energy saved vs. Eskom Stage-4 Baseline · R 14,200 Co-op Rebate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Olive Panel: 2. Planting Vegetable on the Rooftop */}
            <div className="bg-[#9BA882] text-[#144239] p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#144239]">
                  2. Planting vegetable on the rooftop
                </h4>
                <span className="text-[11px] text-[#144239]/80">
                  Tap crop to irrigate from Hydro Tank
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['Tomatoes', 'Carrots', 'Salad'] as const).map((crop) => (
                  <button
                    key={crop}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setWateredCrops((prev) => ({
                        ...prev,
                        [crop]: Math.min(100, prev[crop] + 4),
                      }));
                    }}
                    className="p-3 rounded-2xl bg-white/35 hover:bg-white/55 transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer"
                  >
                    <Sprout className="w-6 h-6 text-[#144239]" />
                    <span className="font-serif text-sm font-bold text-[#144239]">
                      {crop}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[#144239]/80">
                      Moisture {wateredCrops[crop]}%
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-[#144239]/15">
                <span className="font-semibold">Plantsitters this week:</span>
                <span className="text-[#144239]/85">
                  Thandiwe N. · Sipho D. · Naledi M.
                </span>
              </div>
            </div>

            {/* Lower Ochre Panel: Neighbourhood Map & Directory */}
            <div className="bg-[#E6C465] text-[#144239] p-6 sm:p-7 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-xl font-bold text-[#144239]">
                  Neighbourhood
                </h4>
                <span className="text-xs font-medium text-[#144239]/80">
                  Woodstock & Maboneng Local Partners
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Interactive Vector Neighbourhood Map */}
                <div className="relative h-36 rounded-2xl bg-[#D8E8E4] overflow-hidden border border-[#144239]/15 shadow-inner">
                  {/* Stylized water/harbour & roads */}
                  <svg className="w-full h-full" viewBox="0 0 200 140">
                    <path
                      d="M0 0 L200 0 L200 45 Q130 65 80 35 T0 55 Z"
                      fill="#9ED3EB"
                    />
                    <path
                      d="M20 140 L95 40 M80 140 L165 20 M0 85 L200 95"
                      stroke="#FFFFFF"
                      strokeWidth="5"
                      fill="none"
                    />
                    <circle cx="100" cy="75" r="7" fill="#144239" />
                  </svg>

                  {NEIGHBOURHOOD_SPOTS.map((spot) => {
                    const active = spot.id === selectedSpotId;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => setSelectedSpotId(spot.id)}
                        style={{left: `${spot.coords.x}%`, top: `${spot.coords.y}%`}}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                          active
                            ? 'bg-[#144239] text-[#E6C465] scale-125 shadow-md'
                            : 'bg-white text-[#144239] hover:scale-110'
                        }`}
                        title={spot.name}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>

                {/* Partner Spot List */}
                <div className="space-y-1.5">
                  {NEIGHBOURHOOD_SPOTS.map((spot) => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setSelectedSpotId(spot.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                        selectedSpotId === spot.id
                          ? 'bg-[#144239] text-white'
                          : 'bg-white/45 hover:bg-white/70 text-[#144239]'
                      }`}
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold truncate">{spot.name}</p>
                        <p
                          className={`text-[10px] truncate ${
                            selectedSpotId === spot.id
                              ? 'text-[#E6C465]'
                              : 'text-[#144239]/75'
                          }`}
                        >
                          {spot.discount}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums shrink-0">
                        {spot.walkTime}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              COLUMN 3 (RIGHT): SWIPEABLE INQUIRIES DECK + RESIDENT UNIT SUITE
              (DIRECT INSPIRATION FROM IMG_5821, IMG_5818, IMG_5822)
             ================================================================ */}
          <div className="lg:col-span-4 bg-[#144239] text-[#F4F3EC] p-6 sm:p-7 flex flex-col justify-between gap-6 border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    Inquiries
                  </h3>
                  <p className="text-xs text-[#C4C6AF] mt-0.5">
                    Resident social board & Stokvel co-op invites
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewInquiryForm((s) => !s)}
                  className="p-2 rounded-full bg-white text-[#144239] hover:bg-[#E6C465] transition-colors"
                  aria-label="Post new community inquiry"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Category Filter Buttons (Culture, Party, Food & Drinks, Work) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Culture', 'Party', 'Food & Drinks', 'Work'] as const).map(
                  (cat) => {
                    const active = categoryFilter === cat;
                    const activeTone =
                      cat === 'Culture'
                        ? 'bg-[#F3B2A8] text-[#144239]'
                        : cat === 'Party'
                        ? 'bg-[#E6C465] text-[#144239]'
                        : cat === 'Food & Drinks'
                        ? 'bg-[#C4C6AF] text-[#144239]'
                        : 'bg-white text-[#144239]';

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat);
                          setActiveCardIndex(0);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? activeTone
                            : 'bg-[#0F352D] text-[#C4C6AF] hover:text-white border border-white/15'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Optional New Inquiry Form */}
              <AnimatePresence>
                {showNewInquiryForm && (
                  <motion.form
                    initial={{opacity: 0, height: 0}}
                    animate={{opacity: 1, height: 'auto'}}
                    exit={{opacity: 0, height: 0}}
                    onSubmit={handleAddInquiry}
                    className="bg-[#0F352D] rounded-2xl p-4 border border-white/15 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#E6C465]">
                        New Resident Inquiry Card
                      </span>
                      <select
                        value={newInquiryCat}
                        onChange={(e) =>
                          setNewInquiryCat(
                            e.target.value as CommunityInquiryCard['category']
                          )
                        }
                        className="bg-[#144239] text-white text-xs rounded-lg px-2 py-1 border border-white/15"
                      >
                        <option value="Culture">Culture</option>
                        <option value="Food & Drinks">Food & Drinks</option>
                        <option value="Party">Party</option>
                        <option value="Work">Work</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Event title (e.g., First Thursdays Gallery Walk)"
                      value={newInquiryTitle}
                      onChange={(e) => setNewInquiryTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#144239] text-white text-xs border border-white/15 placeholder:text-[#C4C6AF]/50"
                    />
                    <textarea
                      rows={2}
                      placeholder="Write your invite message to neighbours..."
                      value={newInquiryQuote}
                      onChange={(e) => setNewInquiryQuote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#144239] text-white text-xs border border-white/15 placeholder:text-[#C4C6AF]/50"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-[#E6C465] text-[#144239] text-xs font-bold"
                    >
                      Publish to Varda Board
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Stacked Noli-Style Inquiry Card with X & Heart Buttons */}
              <div className="relative pt-1 pb-2">
                {/* Subtle stacked card backing */}
                <div className="absolute inset-x-3 top-3 bottom-0 rounded-3xl bg-[#1C554A] border border-white/10 translate-x-2 translate-y-2 pointer-events-none" />

                <motion.div
                  key={currentInquiry.id}
                  initial={{opacity: 0, scale: 0.96, x: 12}}
                  animate={{opacity: 1, scale: 1, x: 0}}
                  transition={{duration: 0.2}}
                  className="relative rounded-3xl bg-[#194E43] border border-white/15 p-6 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {currentInquiry.author}
                      </p>
                      <p className="text-[11px] text-[#C4C6AF]">
                        {currentInquiry.unit} · {currentInquiry.category}
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#E6C465]">
                      {currentInquiry.attendeesCount +
                        (JoinedIds.includes(currentInquiry.id) ? 1 : 0)}{' '}
                      joined
                    </span>
                  </div>

                  <div>
                    <h4 className="font-serif text-2xl font-bold text-[#F3B2A8]">
                      {currentInquiry.title}
                    </h4>
                    <p className="font-serif text-sm text-[#F4F3EC]/95 leading-relaxed mt-2">
                      “{currentInquiry.quote}”
                    </p>
                  </div>

                  <div className="text-xs text-[#C4C6AF] flex items-center gap-2 pt-1">
                    <Clock className="w-3.5 h-3.5 text-[#E6C465]" />
                    <span>{currentInquiry.timeLabel}</span>
                    <span>·</span>
                    <span>{currentInquiry.venue}</span>
                  </div>

                  {/* Bottom Card Actions: Dismiss (X) & Join/Heart */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleNextCard}
                      className="w-10 h-10 rounded-full border border-[#F3B2A8]/60 text-[#F3B2A8] hover:bg-[#F3B2A8] hover:text-[#144239] flex items-center justify-center transition-colors"
                      aria-label="Next inquiry card"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <span className="text-[11px] text-[#C4C6AF]">
                      Card {(activeCardIndex % filteredInquiries.length) + 1} of{' '}
                      {filteredInquiries.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleJoinInquiry(currentInquiry.id)}
                      className={`px-4 h-10 rounded-full border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                        JoinedIds.includes(currentInquiry.id)
                          ? 'bg-[#E6C465] border-[#E6C465] text-[#144239]'
                          : 'border-[#E6C465]/70 text-[#E6C465] hover:bg-[#E6C465]/20'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      {JoinedIds.includes(currentInquiry.id)
                        ? 'Counted In!'
                        : 'Count me in'}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Lower White/Light Panel: "Welcome to your new home" Resident Suite & Room Booking */}
            <div className="rounded-2xl bg-[#F7F6F1] text-[#144239] p-5 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-xl font-bold text-[#144239]">
                    Welcome, Themba
                  </h4>
                  <p className="text-xs text-[#144239]/70">
                    Unit 305 Smart Controls & Conference Pods
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-[#144239] font-semibold">
                  UPS: 98%
                </span>
              </div>

              {/* 4 Pastel Resident Tiles Inspired by IMG_5817 & IMG_5822 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    {
                      id: 'key',
                      label: 'Digital key',
                      bg: 'bg-[#F3B2A8]',
                      icon: KeyRound,
                    },
                    {
                      id: 'apartment',
                      label: 'Apartment',
                      bg: 'bg-[#E6C465]',
                      icon: Home,
                    },
                    {
                      id: 'services',
                      label: 'Book Pod',
                      bg: 'bg-[#B7C4B8]',
                      icon: Users,
                    },
                    {
                      id: 'manual',
                      label: 'Guest Manual',
                      bg: 'bg-[#C4C6AF]',
                      icon: BookOpen,
                    },
                  ] as const
                ).map((tile) => {
                  const Icon = tile.icon;
                  const active = activeResidentTile === tile.id;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => setActiveResidentTile(tile.id)}
                      className={`${tile.bg} p-3 rounded-2xl text-[#144239] flex flex-col items-center justify-center gap-1.5 transition-transform ${
                        active ? 'ring-2 ring-[#144239] scale-[1.03]' : 'hover:scale-[1.02]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[11px] font-bold whitespace-nowrap">
                        {tile.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Interactive Drawer for Selected Tile */}
              <div className="p-3.5 rounded-xl bg-white border border-[#144239]/10 text-xs space-y-2.5">
                {activeResidentTile === 'key' && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#144239]">
                        NFC Smart Lock · Loft 305 & Rooftop Gate
                      </p>
                      <p className="text-[#144239]/70 text-[11px]">
                        Works offline via Bluetooth Low Energy token
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setKeyUnlocked((u) => !u)}
                      className={`px-3.5 py-2 rounded-xl font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        keyUnlocked
                          ? 'bg-[#19B86B] text-[#082019]'
                          : 'bg-[#144239] text-white'
                      }`}
                    >
                      {keyUnlocked ? 'Unlocked (Tap to Lock)' : 'Tap to Unlock Door'}
                    </button>
                  </div>
                )}

                {activeResidentTile === 'apartment' && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#144239]">
                        Load-Shedding Essential Circuit Relay
                      </p>
                      <p className="text-[#144239]/70 text-[11px]">
                        Solar Geyser: 66°C · Fibre UPS: Active · Draw: 0.42 kW
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-[#144239]">
                      STAGE 0
                    </span>
                  </div>
                )}

                {activeResidentTile === 'services' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#144239]">
                        Book a Conference Room (PayShap / Ozow)
                      </span>
                      <span className="font-mono text-[#144239]">
                        R {selectedRoom.rateZar}/hr
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CONFERENCE_ROOMS.map((rm) => (
                        <button
                          key={rm.id}
                          type="button"
                          disabled={!rm.available}
                          onClick={() => setSelectedRoomId(rm.id)}
                          className={`p-2 rounded-lg text-left border transition-colors ${
                            selectedRoomId === rm.id
                              ? 'bg-[#144239] text-white border-[#144239]'
                              : rm.available
                              ? 'bg-[#F4F3EC] text-[#144239] border-transparent'
                              : 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                          }`}
                        >
                          <p className="font-bold text-[11px]">{rm.name}</p>
                          <p className="text-[10px] opacity-80 truncate">{rm.features}</p>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerCheckout({
                          name: `Conference Room Booking: ${selectedRoom.name}`,
                          description: `${selectedRoom.features} · 2 Hour Slot`,
                          amountZar: selectedRoom.rateZar * 2,
                        })
                      }
                      className="w-full py-2 rounded-lg bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs transition-colors"
                    >
                      Book {selectedRoom.name} (2 hrs) · R {selectedRoom.rateZar * 2}
                    </button>
                  </div>
                )}

                {activeResidentTile === 'manual' && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#144239]">
                        Offline Emergency & Co-Living GuideCached
                      </p>
                      <p className="text-[#144239]/70 text-[11px]">
                        Includes Cape Town & Joburg water-saving & solar protocols
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#19B86B] font-bold">
                      READY OFFLINE
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
