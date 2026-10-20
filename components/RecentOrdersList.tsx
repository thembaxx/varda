'use client';

import React, {useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowUpRight,
  Receipt,
  Trash2,
  Plus,
} from 'lucide-react';
import {type OfflineTransactionItem, formatZarPrice} from '@/lib/sa-data';
import {useOfflineLedger} from '@/lib/offline-ledger-store';
import {triggerHaptic} from '@/lib/haptics';

const DEFAULT_RECENT_ORDERS: OfflineTransactionItem[] = [
  {
    id: 'tx-901',
    timestamp: 'Today · 06:42 SAST',
    title: 'Varda Rooftop Solar Stokvel Pool (Unit 305)',
    method: 'PayShap',
    amountZar: 1450,
    reference: 'VRD-ZA-884120',
    synced: true,
  },
  {
    id: 'tx-902',
    timestamp: 'Yesterday · 18:15 SAST',
    title: 'Conference Room Fynbos (2 Hours)',
    method: 'Ozow EFT',
    amountZar: 240,
    reference: 'VRD-ZA-772914',
    synced: true,
  },
];

interface RecentOrdersListProps {
  onSelectOrder?: (order: {
    name: string;
    description: string;
    amountZar: number;
  }) => void;
}

export default function RecentOrdersList({onSelectOrder}: RecentOrdersListProps) {
  const [orders, persistOrders] = useOfflineLedger(DEFAULT_RECENT_ORDERS);
  const [filter, setFilter] = useState<'all' | 'synced' | 'queued'>('all');

  const filteredOrders = orders.filter((item) => {
    if (filter === 'synced') return item.synced;
    if (filter === 'queued') return !item.synced;
    return true;
  });

  const totalZarVolume = orders.reduce((sum, item) => sum + item.amountZar, 0);
  const verifiedCount = orders.filter((item) => item.synced).length;
  const queuedCount = orders.filter((item) => !item.synced).length;

  const handleLogQuickAttempt = () => {
    triggerHaptic('light');
    const refNum = Math.floor(100000 + Math.random() * 900000);
    const newAttempt: OfflineTransactionItem = {
      id: `tx-${Date.now()}`,
      timestamp: 'Attempted · Just now',
      title: 'Karoo-X8 Solar-Thermal Inverter Inspection Deposit',
      method: 'Capitec Pay',
      amountZar: 2500,
      reference: `VRD-ZA-${refNum}`,
      synced: true,
    };
    persistOrders([newAttempt, ...orders]);
  };

  const handleResetOrders = () => {
    triggerHaptic('warning');
    persistOrders(DEFAULT_RECENT_ORDERS);
  };

  return (
    <section
      id="recent-orders"
      aria-labelledby="recent-orders-heading"
      className="rounded-3xl bg-white border border-[#144239]/15 p-5 sm:p-8 shadow-sm space-y-5"
    >
      {/* Header & Summary Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#144239]/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#144239] text-[#E6C465]">
              <Receipt className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono tabular-nums text-xs font-semibold text-[#144239]/70 uppercase tracking-wider">
              03B · LocalStorage Persistence
            </span>
          </div>
          <h3
            id="recent-orders-heading"
            className="font-serif text-xl sm:text-2xl font-bold text-[#144239]"
          >
            Recent Orders & Transaction Attempts
          </h3>
        </div>

        {/* Quantitative Metrics in font-mono */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#F4F3EC] border border-[#144239]/12 flex items-center gap-2">
            <span className="text-xs text-[#144239]/70">Attempts:</span>
            <span className="font-mono tabular-nums text-xs font-bold text-[#144239]">
              {String(orders.length).padStart(2, '0')}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#F4F3EC] border border-[#144239]/12 flex items-center gap-2">
            <span className="text-xs text-[#144239]/70">Cumulative Volume:</span>
            <span className="font-mono tabular-nums text-xs font-bold text-[#144239]">
              R {formatZarPrice(totalZarVolume)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#F4F3EC] p-1 rounded-xl border border-[#144239]/10">
          {(
            [
              {id: 'all', label: 'All Attempts', count: orders.length},
              {id: 'synced', label: 'Verified', count: verifiedCount},
              {id: 'queued', label: 'Offline Queue', count: queuedCount},
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#144239] text-[#F4F3EC] font-semibold shadow-xs'
                  : 'text-[#144239]/75 hover:text-[#144239]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded ${
                  filter === tab.id
                    ? 'bg-[#E6C465] text-[#0B241E] font-bold'
                    : 'bg-[#144239]/10 text-[#144239]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogQuickAttempt}
            className="px-3 py-1.5 rounded-xl bg-[#144239]/8 hover:bg-[#144239]/15 text-[#144239] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Test Attempt</span>
          </button>
          {orders.length > DEFAULT_RECENT_ORDERS.length && (
            <button
              type="button"
              onClick={handleResetOrders}
              className="px-3 py-1.5 rounded-xl bg-[#8E1B24]/10 hover:bg-[#8E1B24]/20 text-[#8E1B24] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset to default sample transactions"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* LocalStorage-Backed Order Attempt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence initial={false}>
          {filteredOrders.map((order, idx) => (
            <motion.div
              key={order.id}
              layout
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, scale: 0.96}}
              transition={{type: 'spring', stiffness: 360, damping: 28}}
              className="group p-4 rounded-2xl bg-[#F4F3EC]/85 hover:bg-[#F4F3EC] border border-[#144239]/12 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="font-mono tabular-nums text-[11px] font-bold px-2 py-1 rounded-lg bg-[#144239] text-[#E6C465] shrink-0">
                    #{String(orders.length - idx).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#144239] truncate">
                      {order.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#144239]/70 mt-0.5">
                      <span className="font-semibold text-[#144239]">{order.method}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{order.reference}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{order.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono tabular-nums text-sm font-bold text-[#144239]">
                    R {formatZarPrice(order.amountZar)}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 font-mono tabular-nums text-[10px] font-semibold mt-0.5 ${
                      order.synced ? 'text-[#15803D]' : 'text-[#B45309]'
                    }`}
                  >
                    {order.synced ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        SETTLED
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        OFFLINE QUEUED
                      </>
                    )}
                  </span>
                </div>
              </div>

              {onSelectOrder && (
                <div className="pt-2 border-t border-[#144239]/8 flex items-center justify-between text-[11px]">
                  <span className="font-mono tabular-nums text-[#144239]/60">
                    Storage Key: varda_sa_offline_ledger_v1
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onSelectOrder({
                        name: order.title,
                        description: `Repeat order via ${order.method} (Prev Ref: ${order.reference})`,
                        amountZar: order.amountZar,
                      });
                    }}
                    className="font-semibold text-[#144239] hover:text-[#19B86B] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Load into Checkout</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
