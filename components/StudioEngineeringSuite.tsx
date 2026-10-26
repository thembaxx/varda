"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Thermometer,
  Scissors,
  FileSpreadsheet,
  Users,
  Download,
  Share2,
  Check,
  ShoppingBag,
  BatteryCharging,
  Sun,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
  type VardaProductAssembly,
  type SceneAssetNode,
  type ShaderMode,
  formatZarPrice,
} from "@/lib/sa-data";
import { triggerHaptic } from "@/lib/haptics";
import { shareContent } from "@/lib/native-share";

interface StudioEngineeringSuiteProps {
  workspaceMode: "anatomy" | "scene-editor";
  currentAssembly: VardaProductAssembly;
  sceneNodes: SceneAssetNode[];
  clipPercent: number;
  onClipPercentChange: (val: number) => void;
  clipAxis: "y" | "x";
  onClipAxisChange: (axis: "y" | "x") => void;
  eskomStage: number;
  onEskomStageChange: (stage: number) => void;
  activeShader: ShaderMode;
  onSelectShader: (shader: ShaderMode) => void;
  onSelectOrderForPayment: (item: { name: string; description: string; amountZar: number }) => void;
}

export default function StudioEngineeringSuite({
  workspaceMode,
  currentAssembly,
  sceneNodes,
  clipPercent,
  onClipPercentChange,
  clipAxis,
  onClipAxisChange,
  eskomStage,
  onEskomStageChange,
  activeShader,
  onSelectShader,
  onSelectOrderForPayment,
}: StudioEngineeringSuiteProps) {
  const [activeTab, setActiveTab] = useState<"loadshedding" | "cross-section" | "bom-stokvel">(
    "loadshedding",
  );
  const [stokvelMembers, setStokvelMembers] = useState<number>(8);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Compute aggregate electrical, mass & ZAR metrics from either Anatomy Assembly or Scene Editor
  const metrics = useMemo(() => {
    if (workspaceMode === "scene-editor") {
      const totalZar = sceneNodes.reduce((s, n) => s + n.priceZar, 0);
      const genKw = sceneNodes.filter((n) => n.powerKw > 0).reduce((s, n) => s + n.powerKw, 0);
      const loadKw = Math.abs(
        sceneNodes.filter((n) => n.powerKw < 0).reduce((s, n) => s + n.powerKw, 0),
      );
      const batteryKwh = Math.max(12.8, genKw * 1.65);
      const totalMassKg = sceneNodes.length * 48.5;
      return {
        title: `Custom Micro-Grid (${sceneNodes.length} Modules)`,
        totalZar,
        peakSolarKw: Number(Math.max(4.5, genKw).toFixed(1)),
        batteryStorageKwh: Number(batteryKwh.toFixed(1)),
        baseHouseholdLoadKw: Number(Math.max(1.8, loadKw + 1.4).toFixed(1)),
        totalMassKg: Number(totalMassKg.toFixed(1)),
      };
    }

    const totalMassKg = currentAssembly.parts.reduce((s, p) => s + p.massKg, 0);
    const isKaroo = currentAssembly.id === "karoo-inverter-vault";
    return {
      title: currentAssembly.name,
      totalZar: currentAssembly.priceZar,
      peakSolarKw: isKaroo ? 12.0 : 9.4,
      batteryStorageKwh: isKaroo ? 24.0 : 18.6,
      baseHouseholdLoadKw: isKaroo ? 2.1 : 1.7,
      totalMassKg: Number(totalMassKg.toFixed(1)),
    };
  }, [workspaceMode, currentAssembly, sceneNodes]);

  // Simulate 24-hour Eskom Load-Shedding Stage 0..8 and LiFePO4 State of Charge (SoC %)
  const simulation = useMemo(() => {
    // Outage hours per 24h cycle based on Eskom stage (Stage 0 = 0h, Stage 4 = 6h, Stage 8 = 12h)
    const outageHoursPerDay = eskomStage === 0 ? 0 : Math.min(14, Math.round(eskomStage * 1.5));

    // Deterministic Eskom outage slots across 24 hours
    const isHourBlackout = (hour: number): boolean => {
      if (eskomStage === 0) return false;
      const slots: number[] = [];
      if (eskomStage >= 1) slots.push(6, 7);
      if (eskomStage >= 2) slots.push(18, 19);
      if (eskomStage >= 3) slots.push(14);
      if (eskomStage >= 4) slots.push(2, 15);
      if (eskomStage >= 5) slots.push(10, 20);
      if (eskomStage >= 6) slots.push(3, 11);
      if (eskomStage >= 7) slots.push(21);
      if (eskomStage >= 8) slots.push(0, 12);
      return slots.includes(hour);
    };

    let currentSoc = 78; // Start at 78% at 00:00 SAST
    let minSoc = 100;

    const hours: Array<{
      hour: number;
      label: string;
      solarKw: number;
      loadKw: number;
      blackout: boolean;
      soc: number;
    }> = [];
    for (let h = 0; h < 24; h += 1) {
      // Solar bell curve between 06:00 and 18:00 SAST
      const sunFactor = h >= 6 && h <= 18 ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
      const solarKw = Number((metrics.peakSolarKw * sunFactor * 0.86).toFixed(2));

      // Evening & morning residential load spikes
      const demandMultiplier =
        (h >= 6 && h <= 8) || (h >= 18 && h <= 21) ? 1.45 : h <= 4 ? 0.55 : 0.9;
      const loadKw = Number((metrics.baseHouseholdLoadKw * demandMultiplier).toFixed(2));
      const blackout = isHourBlackout(h);

      const netDeltaKwh = solarKw - loadKw;
      const socDelta = (netDeltaKwh / metrics.batteryStorageKwh) * 100;

      if (blackout) {
        currentSoc = Math.max(8, Math.min(100, currentSoc + socDelta));
      } else {
        // Grid trickle-assist if SoC drops below 30% outside solar hours
        const gridAssist = currentSoc < 30 && solarKw < 0.5 ? 6.5 : 0;
        currentSoc = Math.max(15, Math.min(100, currentSoc + socDelta + gridAssist));
      }

      minSoc = Math.min(minSoc, currentSoc);

      hours.push({
        hour: h,
        label: `${String(h).padStart(2, "0")}:00`,
        solarKw,
        loadKw,
        blackout,
        soc: Math.round(currentSoc),
      });
    }

    const totalSolarHarvestKwh = hours.reduce((sum, hour) => sum + hour.solarKw, 0);

    // Eskom peak tariff arbitrage & solar harvest savings at R 3.42 / kWh
    const dailySavingsZar = Math.round(totalSolarHarvestKwh * 3.42 + outageHoursPerDay * 18.5);
    const monthlySavingsZar = dailySavingsZar * 30;
    const paybackMonths = Number((metrics.totalZar / Math.max(1200, monthlySavingsZar)).toFixed(1));

    return {
      outageHoursPerDay,
      hours,
      minSoc: Math.round(minSoc),
      totalSolarHarvestKwh: Number(totalSolarHarvestKwh.toFixed(1)),
      monthlySavingsZar,
      paybackMonths,
    };
  }, [eskomStage, metrics]);

  // Itemized BOM rows from either Anatomy parts or Scene Editor nodes
  const bomItems = useMemo(() => {
    if (workspaceMode === "scene-editor") {
      return sceneNodes.map((node, idx) => ({
        index: String(idx + 1).padStart(2, "0"),
        id: node.uid,
        name: node.label,
        spec: `${node.shaderType.toUpperCase()} Shader · Radius ${node.radius}m`,
        massKg: 48.5,
        powerKw: node.powerKw,
        priceZar: node.priceZar,
      }));
    }

    const partCount = currentAssembly.parts.length;
    const totalMass = currentAssembly.parts.reduce((s, p) => s + p.massKg, 0);

    return currentAssembly.parts.map((part, idx) => {
      const weightRatio = part.massKg / Math.max(1, totalMass);
      const allocatedZar =
        idx === partCount - 1
          ? Math.round(currentAssembly.priceZar * weightRatio)
          : Math.round(
              (currentAssembly.priceZar * (weightRatio * 0.7 + (1 / partCount) * 0.3)) / 50,
            ) * 50;
      return {
        index: String(idx + 1).padStart(2, "0"),
        id: part.id,
        name: part.name,
        spec: part.materialSpec,
        massKg: part.massKg,
        powerKw: Number(((part.energyEfficiencyData?.heatDissipationW || 120) / 100).toFixed(1)),
        priceZar: allocatedZar,
      };
    });
  }, [workspaceMode, currentAssembly, sceneNodes]);

  const perMemberUpfrontZar = Math.round(metrics.totalZar / stokvelMembers);
  const perMemberMonthlyZar = Math.round(metrics.totalZar / (stokvelMembers * 12));

  const handleExportBomFile = () => {
    triggerHaptic("success");
    const lines = [
      "====================================================================",
      `VARDA SPATIAL STUDIO — ENGINEERING BILL OF MATERIALS (BOM)`,
      `Configuration: ${metrics.title}`,
      // oxlint-disable-next-line react/purity -- Timestamp is created in a user event handler, outside render.
      `Timestamp: ${new Date().toISOString()}`,
      `Total Mass: ${metrics.totalMassKg} kg | Peak Solar: ${metrics.peakSolarKw} kW | Storage: ${metrics.batteryStorageKwh} kWh`,
      `Total Valuation: R ${formatZarPrice(metrics.totalZar)} ZAR`,
      `Stokvel Split (${stokvelMembers} Members): R ${formatZarPrice(perMemberUpfrontZar)} / member`,
      "====================================================================",
      "",
      "IDX | COMPONENT / MODULE                | SPECIFICATION                        | MASS (KG) | ALLOCATION (ZAR)",
      "----+-----------------------------------+--------------------------------------+-----------+-----------------",
      ...bomItems.map(
        (item) =>
          `#${item.index} | ${item.name.padEnd(33, " ").slice(0, 33)} | ${item.spec.padEnd(36, " ").slice(0, 36)} | ${String(item.massKg).padStart(6, " ")} kg | R ${formatZarPrice(item.priceZar)}`,
      ),
      "====================================================================",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `varda-bom-${currentAssembly.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedNotice("BOM Spec (.TXT) Downloaded");
    setTimeout(() => setCopiedNotice(null), 2600);
  };

  const handleShareStokvelSplit = async () => {
    triggerHaptic("medium");
    const res = await shareContent({
      title: `Varda Stokvel Split — ${metrics.title}`,
      text: `Join our ${stokvelMembers}-member Varda Micro-Grid Stokvel Pool for ${metrics.title}. Per-member share: R ${formatZarPrice(perMemberUpfrontZar)} upfront (or R ${formatZarPrice(perMemberMonthlyZar)}/mo). Dial *120*882*305# or settle via PayShap.`,
      url: typeof window !== "undefined" ? `${window.location.origin}/#sa-payments` : undefined,
    });
    if (res === "copied" || res === "shared") {
      setCopiedNotice(
        res === "copied" ? "Stokvel Split & USSD Pool Copied" : "Stokvel Split Shared",
      );
      setTimeout(() => setCopiedNotice(null), 2600);
    }
  };

  return (
    <div className="bg-[#081C17] border-t border-white/10 px-3.5 sm:px-5 py-4 space-y-4">
      {/* Top Bar: Engineering Suite Mode Switcher + Live Telemetry Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-[#0D2A23] p-1 rounded-xl border border-white/10">
          {(
            [
              {
                id: "loadshedding",
                num: "01",
                label: "Load-Shedding & Solar ROI",
                icon: Zap,
              },
              {
                id: "cross-section",
                num: "02",
                label: "3D Slice Plane & Thermal IR",
                icon: Scissors,
              },
              {
                id: "bom-stokvel",
                num: "03",
                label: "Export BOM & Stokvel Split",
                icon: FileSpreadsheet,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#19B86B] text-[#072018] font-bold shadow-xs"
                    : "text-[#C4C6AF] hover:text-white"
                }`}
              >
                <span className="font-mono tabular-nums text-[10px] opacity-75">{tab.num}</span>
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Unboxed Clean Telemetry Summary Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#C4C6AF] font-mono tabular-nums">
          <span className="text-[#4FFFB0] font-semibold">
            {eskomStage === 0 ? "GRID ONLINE (STAGE 0)" : `ESKOM STAGE ${eskomStage} ACTIVE`}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Slice: {clipPercent}% ({clipAxis.toUpperCase()})
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-[#E6C465] font-semibold">
            ROI: R {formatZarPrice(simulation.monthlySavingsZar)}/mo
          </span>
          {copiedNotice && (
            <span className="inline-flex items-center gap-1 text-[#4FFFB0] font-sans font-semibold bg-[#143D34] px-2.5 py-0.5 rounded-lg border border-[#4FFFB0]/30">
              <Check className="w-3 h-3" />
              {copiedNotice}
            </span>
          )}
        </div>
      </div>

      {/* Tab Content Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "loadshedding" && (
          <motion.div
            key="loadshedding"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
          >
            {/* Left Column: Stage 0–8 Scrubber & Quantitative Autonomy Metrics */}
            <div className="lg:col-span-5 bg-[#0D2A23]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        eskomStage >= 4 ? "text-[#EF4444]" : "text-[#E6C465]"
                      }`}
                    />
                    Eskom Load-Shedding Stage Scrubber
                  </span>
                  <span className="font-mono tabular-nums text-xs font-bold text-[#E6C465]">
                    {simulation.outageHoursPerDay}h / 24h Blackout
                  </span>
                </div>

                {/* Segmented Stage Selector */}
                <div className="grid grid-cols-5 gap-1.5 bg-[#081C17] p-1 rounded-xl border border-white/10">
                  {[
                    { stage: 0, label: "Stage 0" },
                    { stage: 2, label: "Stage 2" },
                    { stage: 4, label: "Stage 4" },
                    { stage: 6, label: "Stage 6" },
                    { stage: 8, label: "Stage 8" },
                  ].map((item) => {
                    const active = eskomStage === item.stage;
                    return (
                      <button
                        key={item.stage}
                        type="button"
                        onClick={() => {
                          triggerHaptic(item.stage >= 6 ? "heavy" : "selection");
                          onEskomStageChange(item.stage);
                        }}
                        className={`py-2 px-2 rounded-lg font-mono tabular-nums text-[11px] font-semibold transition-all cursor-pointer ${
                          active
                            ? item.stage >= 6
                              ? "bg-[#EF4444] text-white font-bold shadow-xs"
                              : item.stage >= 2
                                ? "bg-[#E6C465] text-[#081C17] font-bold shadow-xs"
                                : "bg-[#19B86B] text-[#081C17] font-bold shadow-xs"
                            : "text-[#C4C6AF] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4-Metric Telemetry Grid in font-mono tabular-nums */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-[#081C17] border border-white/8">
                  <span className="text-[11px] text-[#C4C6AF] flex items-center gap-1">
                    <Sun className="w-3 h-3 text-[#E6C465]" />
                    Daily Solar Yield
                  </span>
                  <p className="font-mono tabular-nums text-sm sm:text-base font-bold text-white mt-0.5">
                    {simulation.totalSolarHarvestKwh} kWh
                  </p>
                  <span className="font-mono tabular-nums text-[10px] text-[#4FFFB0]">
                    Peak {metrics.peakSolarKw} kW Array
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#081C17] border border-white/8">
                  <span className="text-[11px] text-[#C4C6AF] flex items-center gap-1">
                    <BatteryCharging className="w-3 h-3 text-[#19B86B]" />
                    Min LiFePO4 Reserve
                  </span>
                  <p className="font-mono tabular-nums text-sm sm:text-base font-bold text-[#4FFFB0] mt-0.5">
                    {simulation.minSoc}% SoC
                  </p>
                  <span className="font-mono tabular-nums text-[10px] text-[#C4C6AF]">
                    {metrics.batteryStorageKwh} kWh Bank · 0ms Switch
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#081C17] border border-white/8">
                  <span className="text-[11px] text-[#C4C6AF]">Est. Tariff Savings</span>
                  <p className="font-mono tabular-nums text-sm sm:text-base font-bold text-[#E6C465] mt-0.5">
                    R {formatZarPrice(simulation.monthlySavingsZar)}/mo
                  </p>
                  <span className="font-mono tabular-nums text-[10px] text-[#C4C6AF]">
                    @ R 3.42/kWh Peak Arbitrage
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#081C17] border border-white/8">
                  <span className="text-[11px] text-[#C4C6AF]">Capital Payback</span>
                  <p className="font-mono tabular-nums text-sm sm:text-base font-bold text-white mt-0.5">
                    {simulation.paybackMonths} mos
                  </p>
                  <span className="font-mono tabular-nums text-[10px] text-[#4FFFB0]">
                    100% Uptime Guaranteed
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: 24-Hour SAST Autonomy & Battery SoC Visualizer */}
            <div className="lg:col-span-7 bg-[#0D2A23]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">
                    24-Hour SAST Solar Harvest vs. Load-Shedding Autonomy Curve
                  </h4>
                  <p className="text-[11px] text-[#C4C6AF]">
                    Crimson bars mark Eskom blackout windows; emerald height tracks LiFePO4 battery
                    state-of-charge (SoC %).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-[#C4C6AF]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#19B86B]" /> SoC %
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#E6C465]" /> Solar PV
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#EF4444]" /> Grid Drop
                  </span>
                </div>
              </div>

              {/* 24-Hour Bar Scrubber */}
              <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 pt-2 items-end h-28 sm:h-32 px-1 bg-[#081C17] rounded-xl border border-white/8 p-2.5">
                {simulation.hours.map((h) => (
                  <div
                    key={h.hour}
                    className={`flex flex-col items-center justify-end h-full gap-1 group relative ${
                      h.hour % 2 === 1 ? "hidden sm:flex" : "flex"
                    }`}
                    title={`${h.label} SAST | SoC: ${h.soc}% | Solar: ${h.solarKw}kW | Load: ${h.loadKw}kW${
                      h.blackout ? " | ESKOM OUTAGE" : ""
                    }`}
                  >
                    <div className="w-full flex-1 flex flex-col justify-end rounded-xs overflow-hidden bg-white/5 relative">
                      {/* Solar harvest overlay */}
                      {h.solarKw > 0 && (
                        <div
                          style={{
                            height: `${Math.min(100, Math.round((h.solarKw / metrics.peakSolarKw) * 100))}%`,
                          }}
                          className="w-full bg-[#E6C465]/40 absolute bottom-0 inset-x-0"
                        />
                      )}
                      {/* Battery SoC bar */}
                      <div
                        style={{ height: `${h.soc}%` }}
                        className={`w-full transition-all duration-300 rounded-t-xs ${
                          h.blackout ? "bg-[#EF4444]" : h.soc > 70 ? "bg-[#19B86B]" : "bg-[#4FFFB0]"
                        }`}
                      />
                    </div>
                    <span className="font-mono tabular-nums text-[9px] text-[#C4C6AF]">
                      {String(h.hour).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#C4C6AF]">
                <span>
                  Configured Hardware: <strong className="text-white">{metrics.title}</strong>
                </span>
                <span className="font-mono tabular-nums text-[#4FFFB0]">
                  Zero inverter trip · 14ms islanding relay active
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "cross-section" && (
          <motion.div
            key="cross-section"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          >
            {/* Left Column: 3D Clip-Plane Cross-Section Controls */}
            <div className="lg:col-span-6 bg-[#0D2A23]/90 border border-white/10 rounded-2xl p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-[#4FFFB0]" />
                    Real-Time WebGL Clip-Plane Cross-Section
                  </h4>
                  <p className="text-[11px] text-[#C4C6AF]">
                    Slice through the 3D geometry to inspect internal toroidal windings, LiFePO4
                    cells, and hydro manifolds.
                  </p>
                </div>
                <span className="font-mono tabular-nums text-xs font-bold px-2.5 py-1 rounded-lg bg-[#081C17] text-[#4FFFB0] border border-white/10">
                  Depth: {clipPercent}% ({clipAxis.toUpperCase()}-Axis)
                </span>
              </div>

              {/* Slider + Presets */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={85}
                  step={1}
                  value={clipPercent}
                  onChange={(e) => onClipPercentChange(parseInt(e.target.value, 10))}
                  aria-label="3D Cross-Section Clip Plane Depth"
                  className="w-full accent-[#4FFFB0] cursor-pointer"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {[
                      { val: 0, label: "0% (Uncut)" },
                      { val: 30, label: "30% Shield Cut" },
                      { val: 50, label: "50% Core Bisect" },
                      { val: 75, label: "75% Base Busbar" },
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          onClipPercentChange(preset.val);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono tabular-nums text-[11px] transition-colors cursor-pointer ${
                          Math.abs(clipPercent - preset.val) <= 3
                            ? "bg-[#4FFFB0] text-[#081C17] font-bold"
                            : "bg-[#081C17] text-[#C4C6AF] hover:text-white border border-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Axis Toggle */}
                  <div className="flex items-center gap-1 bg-[#081C17] p-1 rounded-lg border border-white/10">
                    {(
                      [
                        { id: "y", label: "Y-Horizontal" },
                        { id: "x", label: "X-Vertical" },
                      ] as const
                    ).map((ax) => (
                      <button
                        key={ax.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          onClipAxisChange(ax.id);
                          if (clipPercent === 0) onClipPercentChange(45);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono tabular-nums cursor-pointer ${
                          clipAxis === ax.id
                            ? "bg-[#E6C465] text-[#081C17] font-bold"
                            : "text-[#C4C6AF] hover:text-white"
                        }`}
                      >
                        {ax.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Thermal Infrared Heatmap Shader Calibration */}
            <div className="lg:col-span-6 bg-[#0D2A23]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-[#E6C465]" />
                    FLIR Thermal Infrared (IR) Heatmap Shader
                  </h4>
                  <p className="text-[11px] text-[#C4C6AF]">
                    Maps real-time surface temperature gradients and isotherm contour lines across
                    active 3D sub-components.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("medium");
                    onSelectShader(activeShader === "thermal" ? "plasma" : "thermal");
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeShader === "thermal"
                      ? "bg-[#EF4444] text-white shadow-sm"
                      : "bg-[#E6C465] text-[#081C17] hover:bg-[#f2d277]"
                  }`}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>
                    {activeShader === "thermal"
                      ? "Thermal IR Active · Switch to Plasma"
                      : "Activate Thermal IR Shader"}
                  </span>
                </button>
              </div>

              {/* Infrared Temperature Scale Bar */}
              <div className="space-y-1.5 bg-[#081C17] p-3 rounded-xl border border-white/8">
                <div className="h-3 w-full rounded-full bg-gradient-to-r from-[#1E1B4B] via-[#10B981] via-[#F59E0B] to-[#FFFBEB] border border-white/15" />
                <div className="flex items-center justify-between font-mono tabular-nums text-[10px] text-[#C4C6AF]">
                  <span>24°C Ambient</span>
                  <span>46°C LiFePO4 Bus</span>
                  <span>68°C MPPT Coil</span>
                  <span className="text-[#FDE68A] font-bold">92°C Core Peak</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "bom-stokvel" && (
          <motion.div
            key="bom-stokvel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          >
            {/* Left Column: Itemized Engineering Bill of Materials (BOM) */}
            <div className="lg:col-span-7 bg-[#0D2A23]/90 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#19B86B]" />
                    Engineering Bill of Materials ({bomItems.length} Line Items)
                  </h4>
                  <p className="text-[11px] text-[#C4C6AF]">
                    Total Mass:{" "}
                    <span className="font-mono tabular-nums text-white">
                      {metrics.totalMassKg} kg
                    </span>{" "}
                    · Assembly Valuation:{" "}
                    <span className="font-mono tabular-nums text-[#E6C465]">
                      R {formatZarPrice(metrics.totalZar)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBomFile}
                  className="px-3 py-1.5 rounded-xl bg-[#143D34] hover:bg-[#1B5246] border border-white/15 text-xs font-semibold text-[#4FFFB0] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export BOM (.TXT)</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                {bomItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 rounded-xl bg-[#081C17] border border-white/8 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#143D34] text-[#4FFFB0] shrink-0">
                        #{item.index}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-[#C4C6AF] truncate">{item.spec}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-right">
                      <span className="text-[11px] text-[#C4C6AF] hidden sm:inline">
                        {item.massKg} kg
                      </span>
                      <span className="text-xs font-bold text-[#E6C465]">
                        R {formatZarPrice(item.priceZar)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Stokvel Group Split Calculator */}
            <div className="lg:col-span-5 bg-[#0D2A23]/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3.5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#E6C465]" />
                    Stokvel Co-Ownership Split
                  </span>
                  <span className="font-mono tabular-nums text-xs font-bold text-[#4FFFB0]">
                    {stokvelMembers} Households
                  </span>
                </div>

                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={stokvelMembers}
                  onChange={(e) => {
                    triggerHaptic("selection");
                    setStokvelMembers(parseInt(e.target.value, 10));
                  }}
                  aria-label="Number of Stokvel Members"
                  className="w-full accent-[#E6C465] cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-[#081C17] border border-white/8">
                    <span className="text-[10px] text-[#C4C6AF]">Per-Member Upfront Share</span>
                    <p className="font-mono tabular-nums text-base font-bold text-[#E6C465] mt-0.5">
                      R {formatZarPrice(perMemberUpfrontZar)}
                    </p>
                    <span className="font-mono tabular-nums text-[10px] text-[#C4C6AF]">
                      1/{stokvelMembers} Fractional Title
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#081C17] border border-white/8">
                    <span className="text-[10px] text-[#C4C6AF]">12-Mo Stokvel Pool</span>
                    <p className="font-mono tabular-nums text-base font-bold text-[#4FFFB0] mt-0.5">
                      R {formatZarPrice(perMemberMonthlyZar)}/mo
                    </p>
                    <span className="font-mono tabular-nums text-[10px] text-[#C4C6AF]">
                      Zero Interest · USSD *120*882#
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("medium");
                    onSelectOrderForPayment({
                      name: `${metrics.title} — Stokvel Share (1/${stokvelMembers})`,
                      description: `Co-ownership share for 1 of ${stokvelMembers} members (${metrics.peakSolarKw}kW Solar + ${metrics.batteryStorageKwh}kWh Storage)`,
                      amountZar: perMemberUpfrontZar,
                    });
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#E6C465] hover:bg-[#f3d378] text-[#081C17] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">
                    Pay Member Share · R {formatZarPrice(perMemberUpfrontZar)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleShareStokvelSplit}
                  className="py-2 px-3 rounded-xl bg-[#143D34] hover:bg-[#1B5246] border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Share Stokvel Pool Invite Link"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#4FFFB0]" />
                  <span>Invite</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
