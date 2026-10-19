'use client';

import React, {useState} from 'react';
import {
  type AnatomyPart,
  getPartInspectorData,
  type PartMaterialData,
  type PartEnergyEfficiencyData,
} from '@/lib/sa-data';
import {triggerHaptic} from '@/lib/haptics';
import {
  X,
  Zap,
  Layers,
  Cpu,
  Flame,
  Droplets,
  Box,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Sliders,
  Maximize2,
  CheckCircle2,
  Clock,
  Compass,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';

interface SubComponentInspectorProps {
  part: AnatomyPart;
  assemblyId: string;
  isOpen: boolean;
  onClose: () => void;
  onPulsePart?: () => void;
  onSelectShader?: (shader: 'pbr' | 'plasma' | 'fire' | 'water' | 'wireframe') => void;
}

export default function SubComponentInspector({
  part,
  assemblyId,
  isOpen,
  onClose,
  onPulsePart,
  onSelectShader,
}: SubComponentInspectorProps) {
  const [activeTab, setActiveTab] = useState<'material' | 'energy' | 'simulation'>('energy');
  const [simulatedLoadPct, setSimulatedLoadPct] = useState<number>(75);

  if (!isOpen) return null;

  const {material, energy} = getPartInspectorData(part, assemblyId);

  // Dynamic simulation calculations based on load slider
  const loadFactor = simulatedLoadPct / 100;
  // Non-linear efficiency curve: slight drop-off at extremes
  const dynamicEfficiency = Number(
    (
      energy.efficiencyPercent -
      Math.pow(Math.abs(loadFactor - 0.72), 2) * 2.8
    ).toFixed(2)
  );
  const dynamicHeatDissipation = (energy.heatDissipationW * Math.pow(loadFactor, 1.4)).toFixed(1);
  const dynamicArbitrageHourlyZar = (
    (energy.peakTariffArbitrageZarPerKwh * (part.massKg * 0.18) * loadFactor)
  ).toFixed(2);

  const getShaderIcon = (category: string) => {
    switch (category) {
      case 'plasma':
        return <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />;
      case 'fire':
        return <Flame className="w-3.5 h-3.5 text-[#FB923C]" />;
      case 'water':
        return <Droplets className="w-3.5 h-3.5 text-[#60A5FA]" />;
      case 'glass':
        return <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />;
      default:
        return <Box className="w-3.5 h-3.5 text-[#E6C465]" />;
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    if (grade === 'Ultra-Resonant' || grade === 'Direct Pass-Through') {
      return 'bg-[#19B86B]/20 text-[#4FFFB0] border-[#19B86B]/40';
    }
    if (grade.startsWith('A+++')) {
      return 'bg-[#E6C465]/20 text-[#F5DF98] border-[#E6C465]/40';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Responsive Inspector: Bottom Sheet on Mobile, Right Sidebar on Desktop */}
      <div
        role="dialog"
        aria-labelledby="inspector-title"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-3xl border-t border-white/20 sm:rounded-none sm:border-t-0 sm:border-l sm:absolute sm:inset-y-0 sm:right-0 sm:z-30 w-full sm:w-[410px] md:w-[450px] max-w-full bg-[#081F1A]/95 sm:bg-[#081F1A]/95 backdrop-blur-xl flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom sm:slide-in-from-right"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {/* Inspector Top Sticky Header */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 bg-[#0E2D26]/90 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-white/10 text-[#C4C6AF]">
                Sub-Component Inspector
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#143D34] text-[#E6C465] border border-[#E6C465]/25">
                {getShaderIcon(part.shaderCategory)}
                {part.shaderCategory.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getGradeBadgeColor(energy.energyRatingGrade)}`}>
                {energy.energyRatingGrade}
              </span>
            </div>
            <h3 id="inspector-title" className="text-base sm:text-lg font-semibold text-[#F4F3EC] leading-tight truncate">
              {part.name}
            </h3>
            <p className="text-xs text-[#A1B8AD] truncate">
              {part.role}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Close component inspector"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#C4C6AF] hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1.5 p-1 mt-3.5 rounded-xl bg-[#071915] border border-white/10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('energy');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'energy'
                ? 'bg-[#19B86B] text-[#072018] font-semibold shadow-sm'
                : 'text-[#A1B8AD] hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Energy</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('material');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'material'
                ? 'bg-[#19B86B] text-[#072018] font-semibold shadow-sm'
                : 'text-[#A1B8AD] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Material</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('simulation');
            }}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'simulation'
                ? 'bg-[#19B86B] text-[#072018] font-semibold shadow-sm'
                : 'text-[#A1B8AD] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Simulation</span>
          </button>
        </div>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/20">
        {activeTab === 'energy' && (
          <div className="space-y-4">
            {/* Main Energy Efficiency Hero Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#123E33] to-[#0A241E] border border-[#19B86B]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#A1B8AD] uppercase tracking-wider">
                  Conversion & Storage Efficiency
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#19B86B] text-[#082019]">
                  {energy.energyRatingGrade}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                  {energy.efficiencyPercent}%
                </span>
                <span className="text-xs text-[#4FFFB0] font-mono">
                  Peak Operating Rate
                </span>
              </div>

              {/* Efficiency Visual Bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#19B86B] via-[#4FFFB0] to-[#E6C465] transition-all duration-500"
                    style={{width: `${Math.min(100, energy.efficiencyPercent)}%`}}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#89A397]">
                  <span>90.0% Base</span>
                  <span>95.0% High-Eff</span>
                  <span>100.0% Theoretical</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-[#D1DFD7] border-t border-white/10 flex items-center justify-between">
                <span className="text-[#A1B8AD]">Optimal Power Window:</span>
                <span className="font-mono text-[#E6C465] font-semibold">{energy.optimalPowerBand}</span>
              </div>
            </div>

            {/* South Africa Load-Shedding & Grid Telemetry */}
            <div className="p-3.5 rounded-xl bg-[#0B2520] border border-white/10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#19B86B]" />
                <span>SA Grid & Load-Shedding Resilience</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#071A15] border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#A1B8AD]">Outage Buffer Rating</span>
                  <span className="font-mono text-white font-medium">{energy.loadSheddingEndurance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A1B8AD]">Eskom Peak Arbitrage Value</span>
                  <span className="font-mono text-[#4FFFB0] font-semibold">
                    +R {energy.peakTariffArbitrageZarPerKwh.toFixed(2)} / kWh
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A1B8AD]">Annual Carbon Offset</span>
                  <span className="font-mono text-[#E6C465] font-semibold">
                    {energy.annualCarbonOffsetKg} kg CO₂ / yr
                  </span>
                </div>
              </div>
            </div>

            {/* Thermal & Parasitic Loss Specifications */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#A1B8AD] uppercase tracking-wider">Standby Power Loss</span>
                <p className="text-base font-mono font-bold text-white">
                  {energy.standbyPowerLossW} W
                </p>
                <span className="text-[10px] text-[#4FFFB0]">Quiescent Idle Drain</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#A1B8AD] uppercase tracking-wider">Heat Dissipation</span>
                <p className="text-base font-mono font-bold text-[#FB923C]">
                  {energy.heatDissipationW} W
                </p>
                <span className="text-[10px] text-[#A1B8AD] truncate block">{energy.coolingMethod}</span>
              </div>
            </div>

            {/* Durability & Lifecycle */}
            <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E6C465]" />
                <div>
                  <span className="text-[10px] text-[#A1B8AD] block">Expected Service Life</span>
                  <span className="text-xs font-semibold text-white">{energy.durabilityCycleLife}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white">
                Varda Verified
              </span>
            </div>
          </div>
        )}

        {activeTab === 'material' && (
          <div className="space-y-4">
            {/* Primary Substrate Spec Card */}
            <div className="p-4 rounded-xl bg-[#0E2F27] border border-white/15 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#A1B8AD] uppercase tracking-wider">
                  Material Composition
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#19B86B]/20 text-[#4FFFB0] border border-[#19B86B]/30">
                  {part.massKg} kg Net Mass
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white leading-snug">
                {material.composition}
              </h4>
              <p className="text-xs text-[#C4D6CD]">
                <strong className="text-white">Alloy / Grade:</strong> {material.grade}
              </p>
              <div className="p-2 rounded-lg bg-[#081F1A] border border-white/5 text-[11px] text-[#A1B8AD]">
                <span className="text-white font-medium">Surface Treatment: </span>
                {material.surfaceTreatment}
              </div>
            </div>

            {/* Thermal, Mechanical & Environmental Properties Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider block">
                Physical & Thermal Telemetry
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-[#A1B8AD]">Thermal Conductivity (k)</span>
                  <p className="text-sm font-mono font-bold text-white">
                    {material.thermalConductivityWmK} <span className="text-[10px] font-normal text-[#C4C6AF]">W/m·K</span>
                  </p>
                  <div className="w-full h-1 rounded bg-black/40 overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#E6C465]"
                      style={{width: `${Math.min(100, (material.thermalConductivityWmK / 400) * 100)}%`}}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-[#A1B8AD]">Tensile / Yield Strength</span>
                  <p className="text-sm font-mono font-bold text-white">
                    {material.tensileStrengthMpa} <span className="text-[10px] font-normal text-[#C4C6AF]">MPa</span>
                  </p>
                  <div className="w-full h-1 rounded bg-black/40 overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#38BDF8]"
                      style={{width: `${Math.min(100, (material.tensileStrengthMpa / 1200) * 100)}%`}}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-[#A1B8AD]">Operating Temperature</span>
                  <p className="text-xs font-mono font-semibold text-[#F4F3EC]">
                    {material.temperatureRatingRange}
                  </p>
                  <span className="text-[10px] text-[#A1B8AD]">High-Stress Stability</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-0.5">
                  <span className="text-[10px] text-[#A1B8AD]">Corrosion & Weather</span>
                  <p className="text-xs font-mono font-semibold text-[#4FFFB0] truncate">
                    {material.corrosionRating}
                  </p>
                  <span className="text-[10px] text-[#A1B8AD]">SA Coastal Rated</span>
                </div>
              </div>
            </div>

            {/* Circular Economy & Embodied Carbon Footprint */}
            <div className="p-3.5 rounded-xl bg-[#0B2520] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#19B86B]" />
                  Circular Economy & Recycling
                </span>
                <span className="font-mono text-xs font-bold text-[#19B86B]">
                  {material.recyclabilityRate}% Closed-Loop
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#19B86B]"
                  style={{width: `${material.recyclabilityRate}%`}}
                />
              </div>
              <div className="flex justify-between items-center pt-1 text-[11px] text-[#A1B8AD]">
                <span>Embodied Carbon Footprint</span>
                <span className="font-mono text-[#F4F3EC] font-medium">
                  {material.embodiedCarbonKgCo2ePerKg} kg CO₂e / kg
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulation' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#0E2F27] border border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Dynamic Electrical Load Test</span>
                <span className="px-2 py-0.5 rounded font-mono text-xs bg-[#19B86B] text-[#072018] font-bold">
                  {simulatedLoadPct}% Load
                </span>
              </div>

              <div className="space-y-1.5">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={simulatedLoadPct}
                  onChange={(e) => {
                    setSimulatedLoadPct(parseInt(e.target.value, 10));
                  }}
                  className="w-full accent-[#19B86B] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#A1B8AD]">
                  <span>10% Idle</span>
                  <span>50% Nominal</span>
                  <span>75% Optimal</span>
                  <span>100% Surge</span>
                </div>
              </div>
            </div>

            {/* Dynamic Calculated Outputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#A1B8AD]">Instantaneous Efficiency</span>
                <p className="text-xl font-mono font-bold text-[#4FFFB0]">
                  {dynamicEfficiency}%
                </p>
                <span className="text-[10px] text-[#A1B8AD]">Resonant Harmonic Lock</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B2520] border border-white/10 space-y-1">
                <span className="text-[10px] text-[#A1B8AD]">Thermal Dissipation Flux</span>
                <p className="text-xl font-mono font-bold text-[#FB923C]">
                  {dynamicHeatDissipation} W
                </p>
                <span className="text-[10px] text-[#A1B8AD]">Active Cooling Balance</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B2520] border border-white/10 space-y-2">
              <span className="text-[11px] font-semibold text-white block">
                Estimated Peak-Shaving Savings at {simulatedLoadPct}% Load
              </span>
              <div className="p-2.5 rounded-lg bg-[#071A15] border border-white/5 flex items-center justify-between">
                <span className="text-[#A1B8AD]">Hourly Eskom TOU Offset:</span>
                <span className="font-mono text-sm font-bold text-[#E6C465]">
                  R {dynamicArbitrageHourlyZar} / hr
                </span>
              </div>
              <p className="text-[10px] text-[#89A397]">
                Calculated based on City of Cape Town / Eskom Homeflex Time-of-Use tariff structure during peak morning and evening intervals.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inspector Bottom Action Footer */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0E2D26]/90 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          {onPulsePart && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onPulsePart();
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-[#143D34] hover:bg-[#1B5246] text-[#E6C465] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <Activity className="w-3.5 h-3.5 text-[#19B86B]" />
              Pulse 3D Component
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#C4C6AF] hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </>
);
}
