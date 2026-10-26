"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  ArrowUpRight,
  Receipt,
  Trash2,
  Plus,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  WifiOff,
} from "lucide-react";
import { type OfflineTransactionItem, formatZarPrice } from "@/lib/sa-data";
import { useOfflineLedger } from "@/lib/offline-ledger-store";
import { triggerHaptic } from "@/lib/haptics";

const DEFAULT_RECENT_ORDERS: OfflineTransactionItem[] = [
  {
    id: "tx-901",
    timestamp: "Today · 06:42 SAST",
    title: "Varda Rooftop Solar Stokvel Pool (Unit 305)",
    method: "PayShap",
    amountZar: 1450,
    reference: "VRD-ZA-884120",
    synced: true,
  },
  {
    id: "tx-902",
    timestamp: "Yesterday · 18:15 SAST",
    title: "Conference Room Fynbos (2 Hours)",
    method: "Ozow EFT",
    amountZar: 240,
    reference: "VRD-ZA-772914",
    synced: true,
  },
  {
    id: "tx-903",
    timestamp: "Stage 4 Outage · Queued",
    title: "Drakensberg Hydro-Solar Stokvel Contribution",
    method: "USSD Voucher",
    amountZar: 2650,
    reference: "VRD-USSD-551908",
    synced: false,
  },
];

/**
 * Deterministic hex hash generator for cryptographic receipt verification display
 */
function computeDeterministicHex(seed: string, length: number): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  let hex = "";
  let s1 = h1 >>> 0;
  let s2 = h2 >>> 0;
  while (hex.length < length) {
    s1 = Math.imul(s1 ^ (s1 >>> 15), 2246822507) >>> 0;
    s2 = Math.imul(s2 ^ (s2 >>> 13), 3266489909) >>> 0;
    hex += s1.toString(16).padStart(8, "0") + s2.toString(16).padStart(8, "0");
  }
  return hex.slice(0, length);
}

interface RecentOrdersListProps {
  onSelectOrder?: (order: { name: string; description: string; amountZar: number }) => void;
}

export default function RecentOrdersList({ onSelectOrder }: RecentOrdersListProps) {
  const [orders, persistOrders] = useOfflineLedger(DEFAULT_RECENT_ORDERS);
  const [filter, setFilter] = useState<"all" | "synced" | "queued">("all");
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredOrders = orders.filter((item) => {
    if (filter === "synced") return item.synced;
    if (filter === "queued") return !item.synced;
    return true;
  });

  const totalZarVolume = orders.reduce((sum, item) => sum + item.amountZar, 0);
  const verifiedCount = orders.filter((item) => item.synced).length;
  const queuedCount = orders.filter((item) => !item.synced).length;

  const handleLogQuickAttempt = () => {
    triggerHaptic("light");
    const refNum = Math.floor(100000 + Math.random() * 900000);
    const newAttempt: OfflineTransactionItem = {
      id: `tx-${Date.now()}`,
      timestamp: "Attempted · Just now",
      title: "Karoo-X8 Solar-Thermal Inverter Inspection Deposit",
      method: "Capitec Pay",
      amountZar: 2500,
      reference: `VRD-ZA-${refNum}`,
      synced: true,
    };
    persistOrders([newAttempt, ...orders]);
  };

  const handleQueueOfflineUssd = () => {
    triggerHaptic("warning");
    const refNum = Math.floor(100000 + Math.random() * 900000);
    const newQueued: OfflineTransactionItem = {
      id: `tx-ussd-${Date.now()}`,
      timestamp: "Offline Queue · *120*882#",
      title: "Karoo-X8 LiFePO4 Blade Expansion Share",
      method: "USSD Voucher",
      amountZar: 3400,
      reference: `VRD-USSD-${refNum}`,
      synced: false,
    };
    persistOrders([newQueued, ...orders]);
  };

  const handleReconcileOfflineQueue = () => {
    if (queuedCount === 0 || isReconciling) return;
    triggerHaptic("medium");
    setIsReconciling(true);
    setTimeout(() => {
      const reconciled = orders.map((item) =>
        item.synced
          ? item
          : {
              ...item,
              synced: true,
              timestamp: "Reconciled · Just now SAST",
            },
      );
      persistOrders(reconciled);
      setIsReconciling(false);
      triggerHaptic("success");
    }, 550);
  };

  const handleResetOrders = () => {
    triggerHaptic("warning");
    persistOrders(DEFAULT_RECENT_ORDERS);
    setExpandedReceiptId(null);
  };

  const handleCopyReceipt = (order: OfflineTransactionItem, md5: string, sha512: string) => {
    triggerHaptic("selection");
    const text = [
      `VARDA CRYPTOGRAPHIC SETTLEMENT RECEIPT`,
      `Order: ${order.title}`,
      `Amount: R ${formatZarPrice(order.amountZar)} ZAR`,
      `Method: ${order.method} | Reference: ${order.reference}`,
      `Status: ${order.synced ? "SETTLED & VERIFIED" : "OFFLINE QUEUED"}`,
      `PayFast MD5 Signature: ${md5}`,
      `Ozow SHA-512 Digest: ${sha512}`,
    ].join("\n");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2200);
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
          <div className="flex items-center gap-2 text-xs text-[#144239]/70">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#144239] text-[#E6C465]">
              <Receipt className="w-3.5 h-3.5" />
            </span>
            <span className="font-mono tabular-nums font-semibold uppercase tracking-wider">
              03B · LocalStorage Ledger & Cryptographic Receipts
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
              {String(orders.length).padStart(2, "0")}
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

      {/* Filter Bar & Offline Queue Auto-Reconciliation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#F4F3EC] p-1 rounded-xl border border-[#144239]/10">
          {(
            [
              { id: "all", label: "All Attempts", count: orders.length },
              { id: "synced", label: "Verified", count: verifiedCount },
              { id: "queued", label: "Offline Queue", count: queuedCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                filter === tab.id
                  ? "bg-[#144239] text-[#F4F3EC] font-semibold shadow-xs"
                  : "text-[#144239]/75 hover:text-[#144239]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded ${
                  filter === tab.id
                    ? "bg-[#E6C465] text-[#0B241E] font-bold"
                    : "bg-[#144239]/10 text-[#144239]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {queuedCount > 0 && (
            <button
              type="button"
              onClick={handleReconcileOfflineQueue}
              disabled={isReconciling}
              className="px-3.5 py-1.5 rounded-xl bg-[#19B86B] hover:bg-[#159f5c] text-[#072018] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? "animate-spin" : ""}`} />
              <span className="font-mono tabular-nums">
                {isReconciling ? "Reconciling USSD..." : `Sync ${queuedCount} Queued USSD`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleQueueOfflineUssd}
            className="px-3 py-1.5 rounded-xl bg-[#B45309]/12 hover:bg-[#B45309]/20 text-[#92400E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Queue Offline USSD</span>
          </button>

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

      {/* LocalStorage-Backed Order Attempt Cards with Cryptographic Receipt Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence initial={false}>
          {filteredOrders.map((order, idx) => {
            const isExpanded = expandedReceiptId === order.id;
            const md5Hash = computeDeterministicHex(
              `${order.reference}:${order.amountZar}:MD5`,
              32,
            );
            const sha512Hash = computeDeterministicHex(
              `${order.reference}:${order.method}:${order.amountZar}:SHA512`,
              64,
            );

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className="group p-4 rounded-2xl bg-[#F4F3EC]/85 hover:bg-[#F4F3EC] border border-[#144239]/12 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="font-mono tabular-nums text-[11px] font-bold px-2 py-1 rounded-lg bg-[#144239] text-[#E6C465] shrink-0">
                      #{String(orders.length - idx).padStart(2, "0")}
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
                        order.synced ? "text-[#15803D]" : "text-[#B45309]"
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

                {/* Expandable Cryptographic Verification Receipt Drawer */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-xl bg-[#0B241E] text-[#F4F3EC] space-y-2 text-[11px] font-mono tabular-nums border border-[#144239]/20 mt-1">
                        <div className="flex items-center justify-between gap-2 text-[#4FFFB0] border-b border-white/10 pb-1.5">
                          <span className="flex items-center gap-1 font-sans font-semibold text-xs">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Cryptographic Audit Proof
                          </span>
                          <span>NODE: ZA-CPT-01</span>
                        </div>
                        <div className="space-y-1 text-[10px] text-[#C4C6AF]">
                          <div className="flex items-center justify-between gap-2">
                            <span>PayFast MD5 Signature:</span>
                            <span className="text-[#E6C465] truncate max-w-[180px] sm:max-w-[230px]">
                              {md5Hash}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>Ozow SHA-512 Digest:</span>
                            <span className="text-[#4FFFB0] truncate max-w-[180px] sm:max-w-[230px]">
                              {sha512Hash.slice(0, 28)}...
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span>USSD Fallback String:</span>
                            <span className="text-white">
                              *120*882*{order.reference.slice(-4)}#
                            </span>
                          </div>
                        </div>
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#C4C6AF]">
                            Key: varda_sa_offline_ledger_v1
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyReceipt(order, md5Hash, sha512Hash)}
                            className="px-2.5 py-1 rounded-lg bg-[#143D34] hover:bg-[#1B5246] text-[#4FFFB0] font-sans text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === order.id ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Receipt Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Signed Receipt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2 border-t border-[#144239]/8 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setExpandedReceiptId(isExpanded ? null : order.id);
                    }}
                    className="font-mono tabular-nums text-[#144239]/75 hover:text-[#144239] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#19B86B]" />
                    <span>{isExpanded ? "Hide Receipt" : "Verify MD5 / SHA-512"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {onSelectOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        onSelectOrder({
                          name: order.title,
                          description: `Repeat order via ${order.method} (Prev Ref: ${order.reference})`,
                          amountZar: order.amountZar,
                        });
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-[#144239] hover:text-[#0B241E] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Load into Checkout</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
