"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { type OfflineTransactionItem, formatZarPrice } from "@/lib/sa-data";
import type { SaGatewayProvider } from "@/app/api/payments/checkout/route";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Building2,
  QrCode,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Terminal,
  Wallet,
  CreditCard,
  Download,
  ExternalLink,
  Share2,
  PhoneCall,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { shareContent } from "@/lib/native-share";
import { useOfflineLedger } from "@/lib/offline-ledger-store";

interface CheckoutSessionResponse {
  status: string;
  provider: SaGatewayProvider;
  txReference: string;
  createdAt: string;
  currency: string;
  totalAmountZar: number;
  effectiveAmountZar: number;
  stokvelMembers: number;
  bankName: string;
  shapId: string;
  security: {
    encryption: string;
    payfastMd5Signature: string;
    ozowSha512Hash: string;
    fullOzowHash: string;
  };
  payfast: {
    processUrl: string;
    isSandbox: boolean;
    fields: Record<string, string>;
  };
  ozow: {
    processUrl: string;
    fields: Record<string, string>;
  };
  qrPayload: string;
  ussdString: string;
}

interface SouthAfricaPaymentHubProps {
  selectedOrder: {
    name: string;
    description: string;
    amountZar: number;
  };
  isOfflineSimulated: boolean;
  onToggleOfflineSimulation: () => void;
  lowBandwidthMode: boolean;
  onToggleLowBandwidth: () => void;
}

const SA_BANKS = [
  "Capitec Bank",
  "First National Bank (FNB)",
  "Standard Bank",
  "Absa Bank",
  "Nedbank",
  "TymeBank",
  "Discovery Bank",
];

const INITIAL_LEDGER: OfflineTransactionItem[] = [
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
];

export default function SouthAfricaPaymentHub({
  selectedOrder,
  isOfflineSimulated,
  onToggleOfflineSimulation,
  lowBandwidthMode,
  onToggleLowBandwidth,
}: SouthAfricaPaymentHubProps) {
  const [provider, setProvider] = useState<SaGatewayProvider>("payfast");
  const [buyerName, setBuyerName] = useState<string>("Themba Mndebele");
  const [buyerEmail, setBuyerEmail] = useState<string>("mndebele.themba@gmail.com");
  const [buyerCell, setBuyerCell] = useState<string>("082 555 0143");
  const [bankName, setBankName] = useState<string>(SA_BANKS[0]);
  const [shapId, setShapId] = useState<string>("0825550143@capitec");
  const [stokvelMembers, setStokvelMembers] = useState<number>(6);

  const [sessionData, setSessionData] = useState<CheckoutSessionResponse | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [verifyingItn, setVerifyingItn] = useState<boolean>(false);
  const [paymentCompletedRef, setPaymentCompletedRef] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [showCryptoInspector, setShowCryptoInspector] = useState<boolean>(false);

  // QR Code Generation State (qrcode library)
  const [qrTargetApp, setQrTargetApp] = useState<"snapscan" | "zapper">("snapscan");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [generatingQr, setGeneratingQr] = useState<boolean>(false);

  // Offline-First LocalStorage Ledger synchronized via React 19 useSyncExternalStore
  const [ledger, persistLedger] = useOfflineLedger(INITIAL_LEDGER);
  const [syncingQueue, setSyncingQueue] = useState<boolean>(false);

  // Generate Cryptographic PayFast / Ozow / PayShap Session via Server Route
  const initializeGatewaySession = useCallback(async () => {
    setPaymentCompletedRef(null);
    if (isOfflineSimulated) {
      // Offline deterministic fallback token
      const offlineRef = `VRD-OFFLINE-${Date.now().toString().slice(-5)}`;
      const effAmount =
        provider === "stokvel_split"
          ? Number((selectedOrder.amountZar / stokvelMembers).toFixed(2))
          : selectedOrder.amountZar;
      setSessionData({
        status: "OFFLINE_CACHED",
        provider,
        txReference: offlineRef,
        createdAt: new Date().toISOString(),
        currency: "ZAR",
        totalAmountZar: selectedOrder.amountZar,
        effectiveAmountZar: effAmount,
        stokvelMembers,
        bankName,
        shapId,
        security: {
          encryption: "Offline SHA-256 Local Queue + USSD Token",
          payfastMd5Signature: "offline-cached-md5-signature-token",
          ozowSha512Hash: "offline-cached-sha512-hash...",
          fullOzowHash: "offline-cached-sha512-hash",
        },
        payfast: {
          processUrl: "https://sandbox.payfast.co.za/eng/process",
          isSandbox: true,
          fields: {
            merchant_id: "10000100",
            m_payment_id: offlineRef,
            amount: effAmount.toFixed(2),
            item_name: selectedOrder.name,
          },
        },
        ozow: {
          processUrl: "https://pay.ozow.com/",
          fields: {
            SiteCode: "TST-TST-001",
            TransactionReference: offlineRef,
            Amount: effAmount.toFixed(2),
          },
        },
        qrPayload: `VARDA-ZA-${offlineRef}-${effAmount}`,
        ussdString: `*120*82732*${Math.round(effAmount)}*${offlineRef.slice(-4)}#`,
      });
      return;
    }

    setLoadingSession(true);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          itemName: selectedOrder.name,
          itemDescription: selectedOrder.description,
          amountZar: selectedOrder.amountZar,
          buyerName,
          buyerEmail,
          buyerCell,
          bankName,
          shapId,
          stokvelMembers,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as CheckoutSessionResponse;
        setSessionData(data);
      }
    } catch {
      // Fallback if network drops
    } finally {
      setLoadingSession(false);
    }
  }, [
    isOfflineSimulated,
    provider,
    selectedOrder.name,
    selectedOrder.description,
    selectedOrder.amountZar,
    buyerName,
    buyerEmail,
    buyerCell,
    bankName,
    shapId,
    stokvelMembers,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeGatewaySession();
    }, 0);
    return () => clearTimeout(timer);
  }, [initializeGatewaySession]);

  // Generate dynamic QR code using 'qrcode' library for SnapScan and Zapper
  useEffect(() => {
    if (!sessionData) return;
    let isMounted = true;

    const amountCents = Math.round(sessionData.effectiveAmountZar * 100);
    const merchantSlug = "varda-sa";

    // South African standard SnapScan and Zapper deep links
    const payloadUrl =
      qrTargetApp === "snapscan"
        ? `https://pos.snapscan.io/qr/${merchantSlug}?id=${sessionData.txReference}&amount=${amountCents}`
        : `https://zapper.com/pay.aspx?tid=${sessionData.txReference}&amount=${sessionData.effectiveAmountZar.toFixed(2)}&merchant=Varda`;

    QRCode.toDataURL(payloadUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: "#144239",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (isMounted) {
          setQrCodeDataUrl(url);
          setGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error("Failed to generate QR code with qrcode:", err);
        if (isMounted) setGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sessionData, qrTargetApp]);

  // Authorize / Settle Payment via PayFast ITN / Ozow Webhook or Queue Offline
  const handleCompleteCheckout = async () => {
    if (!sessionData) return;

    const methodLabel: OfflineTransactionItem["method"] =
      provider === "payfast"
        ? "Capitec Pay"
        : provider === "ozow"
          ? "Ozow EFT"
          : provider === "payshap"
            ? "PayShap"
            : provider === "snapscan"
              ? "SnapScan QR"
              : "Stokvel Pool";

    if (isOfflineSimulated) {
      const newOfflineTx: OfflineTransactionItem = {
        id: `tx-${Date.now()}`,
        timestamp: "Queued Offline · Just now",
        title: selectedOrder.name,
        method: "USSD Voucher",
        amountZar: sessionData.effectiveAmountZar,
        reference: sessionData.txReference,
        synced: false,
      };
      persistLedger([newOfflineTx, ...ledger]);
      triggerHaptic("success");
      setPaymentCompletedRef(sessionData.txReference);
      return;
    }

    setVerifyingItn(true);
    try {
      const res = await fetch("/api/payments/itn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sessionData.payfast.fields,
          payment_status: "COMPLETE",
          amount_gross: sessionData.effectiveAmountZar.toFixed(2),
        }),
      });

      if (res.ok) {
        const newTx: OfflineTransactionItem = {
          id: `tx-${Date.now()}`,
          timestamp: "Verified · Just now",
          title: selectedOrder.name,
          method: methodLabel,
          amountZar: sessionData.effectiveAmountZar,
          reference: sessionData.txReference,
          synced: true,
        };
        persistLedger([newTx, ...ledger]);
        triggerHaptic("success");
        setPaymentCompletedRef(sessionData.txReference);
      }
    } finally {
      setVerifyingItn(false);
    }
  };

  // Sync Offline Transactions when back online
  const handleSyncOfflineQueue = async () => {
    triggerHaptic("medium");
    setSyncingQueue(true);
    try {
      await fetch("/api/payments/itn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          m_payment_id: "BATCH-OFFLINE-SYNC",
          payment_status: "COMPLETE",
        }),
      });
      const updated = ledger.map((item) => ({
        ...item,
        synced: true,
        timestamp: item.synced ? item.timestamp : "Synced · Just now",
      }));
      persistLedger(updated);
      triggerHaptic("success");
    } finally {
      setSyncingQueue(false);
    }
  };

  const unsyncedCount = ledger.filter((i) => !i.synced).length;

  return (
    <section id="sa-payments" className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#144239]/70">
            03. South African Fintech & Offline Data Resilience
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#11362E] tracking-tight mt-1">
            PayFast, Ozow & Offline USSD Vault
          </h2>
        </div>
        <p className="text-sm text-[#11362E]/80 max-w-md">
          Server-signed MD5 & SHA-512 checkout supporting Instant EFT, PayShap, Capitec Pay,
          SnapScan QR, Stokvel Co-op splits, and Stage-8 offline queuing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ==================================================================
            LEFT 7 COLUMNS: INTERACTIVE SOUTH AFRICAN GATEWAY CHECKOUT
           ================================================================== */}
        <div className="lg:col-span-7 rounded-3xl bg-[#144239] text-[#F4F3EC] p-6 sm:p-8 shadow-xl flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Selected Order Banner */}
            <div className="rounded-2xl bg-[#0E2F28] border border-white/10 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-[#E6C465]">
                  <Wallet className="w-4 h-4" />
                  <span>Active Varda Order · South African Rand (ZAR)</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-white">{selectedOrder.name}</h3>
                <p className="text-xs text-[#C4C6AF]">{selectedOrder.description}</p>
              </div>

              <div className="text-right">
                <p className="text-xs text-[#C4C6AF]">Total Payable</p>
                <p className="font-serif text-3xl font-bold font-mono tabular-nums text-[#4FFFB0]">
                  R {formatZarPrice(sessionData?.effectiveAmountZar ?? selectedOrder.amountZar, 2)}
                </p>
                {provider === "stokvel_split" && (
                  <p className="text-[11px] text-[#E6C465] font-mono tabular-nums">
                    Split across {stokvelMembers} members (Total R{" "}
                    {formatZarPrice(selectedOrder.amountZar)})
                  </p>
                )}
              </div>
            </div>

            {/* Payment Gateway Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#C4C6AF]">
                Select South African Payment Gateway
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    {
                      id: "payfast",
                      title: "PayFast",
                      sub: "Card · Capitec Pay",
                      icon: CreditCard,
                    },
                    {
                      id: "ozow",
                      title: "Ozow EFT",
                      sub: "Instant Bank EFT",
                      icon: Building2,
                    },
                    {
                      id: "payshap",
                      title: "PayShap",
                      sub: "Instant ShapID",
                      icon: Smartphone,
                    },
                    {
                      id: "snapscan",
                      title: "SnapScan",
                      sub: "Zapper & QR Code",
                      icon: QrCode,
                    },
                    {
                      id: "stokvel_split",
                      title: "Stokvel Split",
                      sub: "Co-op Pool Share",
                      icon: Users,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = provider === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProvider(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        active
                          ? "bg-[#E6C465] text-[#144239] border-[#E6C465] shadow-md"
                          : "bg-[#0F352D] text-[#F4F3EC] border-white/10 hover:bg-[#16483D]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-bold whitespace-nowrap">{item.title}</p>
                        <p
                          className={`text-[10px] truncate ${
                            active ? "text-[#144239]/80" : "text-[#C4C6AF]"
                          }`}
                        >
                          {item.sub}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Gateway Details Form */}
            <div className="rounded-2xl bg-[#0F352D] border border-white/10 p-5 space-y-4">
              {/* Buyer Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="varda-buyer-name"
                    className="block text-[11px] text-[#C4C6AF] mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="varda-buyer-name"
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#144239] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="varda-buyer-email"
                    className="block text-[11px] text-[#C4C6AF] mb-1"
                  >
                    Email Receipt
                  </label>
                  <input
                    id="varda-buyer-email"
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#144239] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="varda-buyer-cell"
                    className="block text-[11px] text-[#C4C6AF] mb-1"
                  >
                    SA Mobile (SMS / USSD)
                  </label>
                  <input
                    id="varda-buyer-cell"
                    type="tel"
                    value={buyerCell}
                    onChange={(e) => setBuyerCell(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#144239] border border-white/15 text-xs font-mono text-white"
                  />
                </div>
              </div>

              {/* Provider-Specific Controls */}
              {provider === "payfast" && (
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">
                      PayFast Secure Merchant Checkout (ID #
                      {sessionData?.payfast.fields.merchant_id || "10000100"})
                    </p>
                    <p className="text-[11px] text-[#C4C6AF]">
                      Supports Visa/Mastercard 3D-Secure, Capitec Pay, Mobicred & SCode retail
                      vouchers
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#4FFFB0]">MD5 Signature Verified</span>
                </div>
              )}

              {provider === "ozow" && (
                <div className="pt-2 border-t border-white/10 space-y-2.5">
                  <label className="block text-xs font-semibold text-white">
                    Select Your South African Bank for Instant Ozow EFT
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SA_BANKS.map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setBankName(bank)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          bankName === bank
                            ? "bg-[#19B86B] text-[#072018] font-bold"
                            : "bg-[#144239] text-[#C4C6AF] hover:text-white"
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {provider === "payshap" && (
                <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      PayShap ShapID (Cellphone or Bank Handle)
                    </label>
                    <input
                      type="text"
                      value={shapId}
                      onChange={(e) => setShapId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#144239] border border-white/15 text-xs font-mono text-[#E6C465]"
                    />
                  </div>
                  <div className="text-xs text-[#C4C6AF]">
                    Real-time SARB Rapid Payments Programme (RPP) clearing in under 4 seconds with
                    zero interbank delay.
                  </div>
                </div>
              )}

              {provider === "snapscan" && sessionData && (
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">
                      Instant QR Checkout · Generated via &apos;qrcode&apos;
                    </span>
                    <div className="flex items-center p-0.5 rounded-lg bg-[#091D18] border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setGeneratingQr(true);
                          setQrTargetApp("snapscan");
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          qrTargetApp === "snapscan"
                            ? "bg-[#19B86B] text-[#082019] font-bold"
                            : "text-[#C4C6AF] hover:text-white"
                        }`}
                      >
                        SnapScan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setGeneratingQr(true);
                          setQrTargetApp("zapper");
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                          qrTargetApp === "zapper"
                            ? "bg-[#E6C465] text-[#082019] font-bold"
                            : "text-[#C4C6AF] hover:text-white"
                        }`}
                      >
                        Zapper
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#081F1A] p-3.5 rounded-2xl border border-white/10">
                    {/* Real Dynamic QR Code image generated from qrcode library */}
                    <div className="p-2 bg-white rounded-xl shrink-0 shadow-md">
                      {generatingQr ? (
                        <div className="w-28 h-28 flex flex-col items-center justify-center text-xs text-[#144239] gap-1">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Generating QR...</span>
                        </div>
                      ) : qrCodeDataUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={qrCodeDataUrl}
                          alt={`${qrTargetApp === "snapscan" ? "SnapScan" : "Zapper"} Payment QR Code`}
                          className="w-28 h-28 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center text-xs text-red-600">
                          QR Error
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs flex-1">
                      <div>
                        <p className="font-semibold text-white">
                          Scan with {qrTargetApp === "snapscan" ? "SnapScan" : "Zapper"} or any SA
                          Banking App
                        </p>
                        <p className="text-[#C4C6AF] text-[11px]">
                          Compatible with FNB, Standard Bank, Capitec, Absa & Nedbank in-app scan to
                          pay.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {qrCodeDataUrl && (
                          <a
                            href={qrCodeDataUrl}
                            download={`varda-${qrTargetApp}-${sessionData.txReference}.png`}
                            onClick={() => triggerHaptic("light")}
                            className="px-2.5 py-1.5 rounded-lg bg-[#143D34] hover:bg-[#1A5044] text-[#E6C465] text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download QR
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            triggerHaptic("light");
                            await shareContent({
                              title: `Varda Payment · ${selectedOrder.name}`,
                              text: `Pay R ${sessionData.effectiveAmountZar.toFixed(2)} via ${qrTargetApp === "snapscan" ? "SnapScan" : "Zapper"}. Reference: ${sessionData.txReference}`,
                              url:
                                qrTargetApp === "snapscan"
                                  ? `https://pos.snapscan.io/qr/varda-sa?id=${sessionData.txReference}&amount=${Math.round(sessionData.effectiveAmountZar * 100)}`
                                  : `https://zapper.com/pay.aspx?tid=${sessionData.txReference}&amount=${sessionData.effectiveAmountZar.toFixed(2)}&merchant=Varda`,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#143D34] hover:bg-[#1A5044] text-[#4FFFB0] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share Link
                        </button>

                        <a
                          href={
                            qrTargetApp === "snapscan"
                              ? `https://pos.snapscan.io/qr/varda-sa?id=${sessionData.txReference}&amount=${Math.round(sessionData.effectiveAmountZar * 100)}`
                              : `https://zapper.com/pay.aspx?tid=${sessionData.txReference}&amount=${sessionData.effectiveAmountZar.toFixed(2)}&merchant=Varda`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#143D34] hover:bg-[#1A5044] text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open App
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#C4C6AF]/85">
                        <p>
                          Ref:{" "}
                          <span className="font-mono text-[#E6C465]">
                            {sessionData.txReference}
                          </span>
                        </p>
                        <a
                          href={`tel:${encodeURIComponent(sessionData.ussdString)}`}
                          onClick={() => triggerHaptic("medium")}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[#E6C465] font-mono transition-colors"
                          title="Tap to dial USSD code offline"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Tap to Dial {sessionData.ussdString}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {provider === "stokvel_split" && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      Number of Co-op / Stokvel Contributors: {stokvelMembers} Members
                    </span>
                    <span className="font-mono text-[#E6C465]">
                      R {(selectedOrder.amountZar / stokvelMembers).toFixed(2)} / member
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={stokvelMembers}
                    onChange={(e) => setStokvelMembers(parseInt(e.target.value, 10))}
                    className="w-full accent-[#E6C465] cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Bar & Cryptographic Payload Inspector */}
          <div className="space-y-4">
            {paymentCompletedRef ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-[#19B86B] text-[#072018] flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">
                      {isOfflineSimulated
                        ? "Queued in Offline USSD Vault!"
                        : "South African Payment Verified & Settled!"}
                    </p>
                    <p className="text-xs font-mono">
                      Ref: {paymentCompletedRef} · Amount: R{" "}
                      {sessionData?.effectiveAmountZar.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCompletedRef(null);
                    initializeGatewaySession();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#072018] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                >
                  New Transaction
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCompleteCheckout}
                  disabled={loadingSession || verifyingItn}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#E6C465] hover:bg-[#f2d174] text-[#144239] font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg whitespace-nowrap shrink-0"
                >
                  <Lock className="w-4 h-4" />
                  {verifyingItn
                    ? "Verifying PayFast / Ozow Signature..."
                    : isOfflineSimulated
                      ? `Queue Offline USSD Payment (R ${(sessionData?.effectiveAmountZar ?? selectedOrder.amountZar).toLocaleString("en-ZA")})`
                      : `Authorize ${provider.toUpperCase()} Payment · R ${(sessionData?.effectiveAmountZar ?? selectedOrder.amountZar).toLocaleString("en-ZA")}`}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowCryptoInspector((s) => !s)}
                  className="px-4 py-3.5 rounded-2xl bg-[#0F352D] hover:bg-[#17493E] text-[#C4C6AF] hover:text-white text-xs font-mono border border-white/10 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Terminal className="w-4 h-4 text-[#4FFFB0]" />
                  {showCryptoInspector ? "Hide Signatures" : "Inspect MD5/SHA512"}
                </button>
              </div>
            )}

            {/* Expandable Cryptographic Gateway Payload Inspector */}
            <AnimatePresence>
              {showCryptoInspector && sessionData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl bg-[#081C17] border border-white/15 p-4 text-xs font-mono space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[#4FFFB0]">
                    <span>Server-Generated Gateway Cryptographic Proof</span>
                    <span>{sessionData.security.encryption}</span>
                  </div>
                  <p className="text-[#C4C6AF] break-all">
                    <strong className="text-white">PayFast MD5 Signature:</strong>{" "}
                    {sessionData.security.payfastMd5Signature}
                  </p>
                  <p className="text-[#C4C6AF] break-all">
                    <strong className="text-white">Ozow SHA-512 HashCheck:</strong>{" "}
                    {sessionData.security.ozowSha512Hash}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#E6C465]">
                    <span>USSD Fallback String: {sessionData.ussdString}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(sessionData.ussdString);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 1800);
                      }}
                      className="flex items-center gap-1 text-white hover:text-[#4FFFB0]"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy USSD
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ==================================================================
            RIGHT 5 COLUMNS: OFFLINE DATA RESILIENCE & LOCALSTORAGE SYNC QUEUE
           ================================================================== */}
        <div className="lg:col-span-5 rounded-3xl bg-white border border-[#144239]/15 p-6 sm:p-8 shadow-lg flex flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#144239]">
                  Offline & Load-Shedding Vault
                </h3>
                <p className="text-xs text-[#144239]/70 mt-0.5">
                  Zero-data local ledger & 38 KB wireframe mesh caching for 2G/3G networks
                </p>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#19B86B] shrink-0" />
            </div>

            {/* Interactive Network & Low-Bandwidth Simulation Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onToggleOfflineSimulation}
                className={`p-3.5 rounded-2xl border text-left transition-colors flex flex-col justify-between gap-2 ${
                  isOfflineSimulated
                    ? "bg-[#8E1B24] text-white border-[#8E1B24]"
                    : "bg-[#F4F3EC] text-[#144239] border-[#144239]/15 hover:bg-[#EAE8DC]"
                }`}
              >
                <div className="flex items-center justify-between">
                  {isOfflineSimulated ? (
                    <WifiOff className="w-4 h-4 text-[#FCA5A5]" />
                  ) : (
                    <Wifi className="w-4 h-4 text-[#19B86B]" />
                  )}
                  <span className="text-[10px] font-mono uppercase font-bold">
                    {isOfflineSimulated ? "OFFLINE QUEUE" : "ONLINE 5G/FIBRE"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold">
                    {isOfflineSimulated ? "Stage-6 Offline Active" : "Simulate Offline Mode"}
                  </p>
                  <p className="text-[10px] opacity-80">
                    {isOfflineSimulated
                      ? "Payments queue in LocalStorage"
                      : "Tap to test offline resilience"}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={onToggleLowBandwidth}
                className={`p-3.5 rounded-2xl border text-left transition-colors flex flex-col justify-between gap-2 ${
                  lowBandwidthMode
                    ? "bg-[#144239] text-white border-[#144239]"
                    : "bg-[#F4F3EC] text-[#144239] border-[#144239]/15 hover:bg-[#EAE8DC]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <RefreshCw className="w-4 h-4 text-[#E6C465]" />
                  <span className="text-[10px] font-mono uppercase font-bold">
                    {lowBandwidthMode ? "38 KB WIREFRAME" : "FULL SHADERS"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold">
                    {lowBandwidthMode ? "Data-Saver 3D Active" : "Low-Bandwidth 3D"}
                  </p>
                  <p className="text-[10px] opacity-80">
                    Switches 3D studio to isometric wireframe
                  </p>
                </div>
              </button>
            </div>

            {/* Transaction & Offline Sync Ledger */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#144239]">
                  Recent ZAR Ledger & Offline Queue ({ledger.length})
                </span>
                {unsyncedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncOfflineQueue}
                    disabled={syncingQueue}
                    className="px-2.5 py-1 rounded-lg bg-[#19B86B] text-[#072018] font-semibold text-[11px] flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${syncingQueue ? "animate-spin" : ""}`} />
                    Sync {unsyncedCount} Offline Item{unsyncedCount > 1 ? "s" : ""}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {ledger.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[#F4F3EC] border border-[#144239]/10 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#144239] truncate">{tx.title}</p>
                      <p className="text-[11px] text-[#144239]/70 truncate">
                        {tx.method} · {tx.reference} · {tx.timestamp}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold tabular-nums text-[#144239]">
                        R {formatZarPrice(tx.amountZar)}
                      </p>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          tx.synced ? "text-[#15803D]" : "text-[#B45309]"
                        }`}
                      >
                        {tx.synced ? "SYNCED" : "QUEUED OFFLINE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#144239]/10 flex items-center justify-between text-xs text-[#144239]/75">
            <span>SARB National Payment System Ready</span>
            <span className="font-mono tabular-nums">IndexedDB + LocalStorage v1</span>
          </div>
        </div>
      </div>
    </section>
  );
}
