export type ShaderMode = "pbr" | "wireframe" | "plasma" | "fire" | "water" | "thermal";

/**
 * Deterministic ZAR currency formatter ensuring exact server and client hydration parity.
 * Avoids browser/Node ICU locale discrepancies (such as space vs comma separators).
 */
export function formatZarPrice(val: number, decimals: number = 0): string {
  if (isNaN(val) || val === null || val === undefined) return "0";
  const fixed = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  const [intPart, decPart] = fixed.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

export interface PartMaterialData {
  composition: string;
  grade: string;
  thermalConductivityWmK: number;
  tensileStrengthMpa: number;
  recyclabilityRate: number; // percentage, e.g. 98.5%
  surfaceTreatment: string;
  embodiedCarbonKgCo2ePerKg: number;
  temperatureRatingRange: string;
  corrosionRating: string;
  densityGPerCm3: number;
}

export interface PartEnergyEfficiencyData {
  efficiencyPercent: number; // e.g. 99.4%
  energyRatingGrade: "A+++" | "A++" | "A+" | "Ultra-Resonant" | "Direct Pass-Through";
  standbyPowerLossW: number;
  heatDissipationW: number;
  coolingMethod: string;
  loadSheddingEndurance: string;
  peakTariffArbitrageZarPerKwh: number;
  annualCarbonOffsetKg: number;
  durabilityCycleLife: string;
  optimalPowerBand: string;
}

export interface AnatomyPart {
  id: string;
  name: string;
  role: string;
  materialSpec: string;
  telemetry: string;
  massKg: number;
  shaderCategory: "structural" | "plasma" | "fire" | "water" | "glass";
  explodeOffset: [number, number, number];
  defaultPosition: [number, number, number];
  rotationAxis?: "x" | "y" | "z";
  rotationSpeed?: number;
  collisionRadius: number;
  materialData?: PartMaterialData;
  energyEfficiencyData?: PartEnergyEfficiencyData;
}

export interface VardaProductAssembly {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  priceZar: number;
  monthlyStokvelZar: number;
  recommendedShader: ShaderMode;
  summary: string;
  parts: AnatomyPart[];
}

export interface SceneAssetNode {
  uid: string;
  templateId: "solar-core" | "hydro-tank" | "thermal-geyser" | "pay-vault" | "mobility-pod";
  label: string;
  shaderType: ShaderMode;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  radius: number;
  powerKw: number;
  priceZar: number;
  isColliding?: boolean;
  collidingWith?: string[];
}

export interface CommunityInquiryCard {
  id: string;
  author: string;
  unit: string;
  category: "Culture" | "Party" | "Food & Drinks" | "Work";
  title: string;
  quote: string;
  timeLabel: string;
  venue: string;
  attendeesCount: number;
  liked?: boolean;
}

export interface WeeklyScheduleSlot {
  id: string;
  dayIndex: number; // 0 = Mon .. 6 = Sun
  startHour: number; // 13..19
  durationHours: number;
  title: string;
  subtitle: string;
  location: string;
  tone: "sage" | "coral" | "ochre" | "mint";
}

export interface OfflineTransactionItem {
  id: string;
  timestamp: string;
  title: string;
  method: "PayShap" | "Ozow EFT" | "SnapScan QR" | "Capitec Pay" | "Stokvel Pool" | "USSD Voucher";
  amountZar: number;
  reference: string;
  synced: boolean;
}

export const VARDA_ASSEMBLIES: VardaProductAssembly[] = [
  {
    id: "karoo-inverter-vault",
    name: "Varda Karoo-X8 Hybrid Micro-Grid Core",
    subtitle: "Solar energy storage & smart metering hub",
    category: "Energy & Fintech Hardware",
    priceZar: 24800,
    monthlyStokvelZar: 2150,
    recommendedShader: "plasma",
    summary:
      "Engineered for South African residential co-ops and micro-grids. Combines a 8kW bi-directional toroidal plasma inverter, modular LiFePO4 battery blades, and a contactless NFC/QR PayShap token terminal in a frosted ballistic polycarbonate enclosure.",
    parts: [
      {
        id: "outer-glass-shield",
        name: "01. Frosted Polycarbonate Acoustic Shield",
        role: "IP65 Dust & Hail Enclosure",
        materialSpec: "Optical Lexan 12mm · IOR 1.58",
        telemetry: "34.2°C Surface · 0.0 dB Leak",
        massKg: 6.4,
        shaderCategory: "glass",
        defaultPosition: [0, 1.35, 0],
        explodeOffset: [0, 1.35, 0],
        collisionRadius: 1.45,
      },
      {
        id: "plasma-toroid-core",
        name: "02. High-Frequency Plasma Toroid Inductor",
        role: "Bi-Directional DC-AC Resonant Core",
        materialSpec: "Nanocrystalline Copper + GLSL Plasma Field",
        telemetry: "230.2V AC · 50.00Hz · 98.4% Eff",
        massKg: 11.2,
        shaderCategory: "plasma",
        defaultPosition: [0, 1.4, 0],
        explodeOffset: [0, 0.55, 0],
        rotationAxis: "y",
        rotationSpeed: 1.1,
        collisionRadius: 0.78,
      },
      {
        id: "lifepo4-blade-west",
        name: "03. Primary LiFePO4 Prismatic Blade A",
        role: "5.12 kWh Deep-Cycle Storage Bank",
        materialSpec: "Brushed Anodized Forest Aluminum",
        telemetry: "SOC 94% · 6,000 Cycles Rated",
        massKg: 42.0,
        shaderCategory: "structural",
        defaultPosition: [-0.72, 1.1, 0],
        explodeOffset: [-1.15, 0.1, 0],
        collisionRadius: 0.65,
      },
      {
        id: "lifepo4-blade-east",
        name: "04. Secondary LiFePO4 Prismatic Blade B",
        role: "5.12 kWh Peak Shaving Reserve",
        materialSpec: "Brushed Anodized Forest Aluminum",
        telemetry: "SOC 92% · Active Balancing",
        massKg: 42.0,
        shaderCategory: "structural",
        defaultPosition: [0.72, 1.1, 0],
        explodeOffset: [1.15, 0.1, 0],
        collisionRadius: 0.65,
      },
      {
        id: "thermal-fire-heatsink",
        name: "05. Silicon-Carbide Thermal Dissipation Array",
        role: "Active MPPT Solar Charge Manifold",
        materialSpec: "Extruded Copper Fin + GLSL Thermal Shader",
        telemetry: "61.8°C Junction · 4.8kW PV Input",
        massKg: 5.8,
        shaderCategory: "fire",
        defaultPosition: [0, 1.95, -0.45],
        explodeOffset: [0, 0.9, -1.1],
        collisionRadius: 0.6,
      },
      {
        id: "hydro-cooling-loop",
        name: "06. Closed-Loop Dielectric Hydro Reservoir",
        role: "Silent Liquid Thermal Exchange",
        materialSpec: "Borosilicate + GLSL Wave Displacement",
        telemetry: "Flow 2.4 L/min · 28.5°C Return",
        massKg: 3.9,
        shaderCategory: "water",
        defaultPosition: [0, 0.85, 0.58],
        explodeOffset: [0, -0.25, 1.25],
        collisionRadius: 0.58,
      },
      {
        id: "payshap-nfc-terminal",
        name: "07. PayShap & Offline USSD Token Module",
        role: "Prepaid Co-op Tariff & Tap-to-Share Interface",
        materialSpec: "Emerald Ceramic + Gold Contact Bus",
        telemetry: "Offline Queue Ready · R 0.00 Arrears",
        massKg: 1.4,
        shaderCategory: "structural",
        defaultPosition: [0, 1.55, 0.82],
        explodeOffset: [0, 0.4, 1.45],
        rotationAxis: "z",
        rotationSpeed: 0.35,
        collisionRadius: 0.5,
      },
      {
        id: "seismic-base-plinth",
        name: "08. Cast Ductile Base & Grounding Busbar",
        role: "Anti-Vibration Floor Anchor & Surge Arrestor",
        materialSpec: "Sand-Cast Obsidian Iron · 40kA Surge",
        telemetry: "Earth Impedance 0.18 Ω",
        massKg: 18.5,
        shaderCategory: "structural",
        defaultPosition: [0, 0.22, 0],
        explodeOffset: [0, -0.75, 0],
        collisionRadius: 1.3,
      },
    ],
  },
  {
    id: "table-mountain-hydro-thermal",
    name: "Varda Drakensberg Hydro-Solar Rooftop Unit",
    subtitle: "Integrated Greywater Filtration + Vacuum Tube Solar Thermal Geyser",
    category: "Water & Thermal Infrastructure",
    priceZar: 18450,
    monthlyStokvelZar: 1620,
    recommendedShader: "water",
    summary:
      "Designed for Cape Town and Gauteng rooftop gardens and co-living developments. Harvests rainwater, purifies greywater for rooftop vegetable beds, and heats domestic water using evacuated solar thermal tubes.",
    parts: [
      {
        id: "outer-glass-shield",
        name: "01. UV-Stabilized Vapour Dome",
        role: "Greenhouse Micro-Climate Cover",
        materialSpec: "Twin-Wall Polycarbonate · 88% Light Transmittance",
        telemetry: "UV Index 9.2 · Zero Algae",
        massKg: 5.2,
        shaderCategory: "glass",
        defaultPosition: [0, 1.35, 0],
        explodeOffset: [0, 1.4, 0],
        collisionRadius: 1.45,
      },
      {
        id: "hydro-cooling-loop",
        name: "02. 1,200L Vortex Rainwater Catchment Core",
        role: "First-Flush Cyclonic Sediment Filter",
        materialSpec: "Food-Grade LLDPE + GLSL Water Surface Shader",
        telemetry: "Level 86% (1,032L) · TDS 42 ppm",
        massKg: 14.8,
        shaderCategory: "water",
        defaultPosition: [0, 1.2, 0],
        explodeOffset: [0, 0.35, 0],
        collisionRadius: 0.85,
      },
      {
        id: "thermal-fire-heatsink",
        name: "03. Evacuated Copper Heat-Pipe Manifold",
        role: "Solar Thermal Boiler Core",
        materialSpec: "Borosilicate Vacuum + GLSL Fire/Thermal Shader",
        telemetry: "Water Temp 68.4°C · Zero Grid Draw",
        massKg: 9.6,
        shaderCategory: "fire",
        defaultPosition: [0, 1.85, -0.35],
        explodeOffset: [0, 1.0, -1.0],
        collisionRadius: 0.7,
      },
      {
        id: "plasma-toroid-core",
        name: "04. UV-C Plasma Sterilization Chamber",
        role: "Pathogen Eradication for Rooftop Irrigation",
        materialSpec: "Quartz Sleeve + 254nm Plasma Arc",
        telemetry: "99.99% Sterile · 18W Solar Driven",
        massKg: 3.1,
        shaderCategory: "plasma",
        defaultPosition: [0, 1.45, 0.65],
        explodeOffset: [0, 0.5, 1.25],
        rotationAxis: "y",
        rotationSpeed: 1.6,
        collisionRadius: 0.55,
      },
      {
        id: "lifepo4-blade-west",
        name: "05. Mineral Remineralization Cartridge",
        role: "Dolomite & Rooibos Activated Carbon Bed",
        materialSpec: "Sintered Ceramic + Western Cape Dolomite",
        telemetry: "pH 7.4 · Filter Life 82%",
        massKg: 7.5,
        shaderCategory: "structural",
        defaultPosition: [-0.75, 1.05, 0],
        explodeOffset: [-1.2, 0.0, 0],
        collisionRadius: 0.6,
      },
      {
        id: "lifepo4-blade-east",
        name: "06. Brushless DC Booster Pump & Impeller",
        role: "Constant-Pressure Drip Irrigation Feed",
        materialSpec: "316 Marine Stainless Steel",
        telemetry: "2.8 Bar · 14 L/min Active",
        massKg: 6.2,
        shaderCategory: "structural",
        defaultPosition: [0.75, 1.05, 0],
        explodeOffset: [1.2, 0.0, 0],
        rotationAxis: "x",
        rotationSpeed: 2.2,
        collisionRadius: 0.6,
      },
      {
        id: "seismic-base-plinth",
        name: "07. Galvanized Rooftop Load-Distribution Cradle",
        role: "Structural Deck Mount",
        materialSpec: "Hot-Dip Galvanized S355 Steel",
        telemetry: "Wind Rated 160 km/h (Cape Doctor)",
        massKg: 21.0,
        shaderCategory: "structural",
        defaultPosition: [0, 0.22, 0],
        explodeOffset: [0, -0.75, 0],
        collisionRadius: 1.3,
      },
    ],
  },
];

export const INITIAL_SCENE_NODES: SceneAssetNode[] = [
  {
    uid: "node-1",
    templateId: "solar-core",
    label: "Karoo-X8 Plasma Inverter",
    shaderType: "plasma",
    position: [-2.1, 0, -0.6],
    rotationY: 0.3,
    scale: 1,
    radius: 0.95,
    powerKw: 8.0,
    priceZar: 24800,
  },
  {
    uid: "node-2",
    templateId: "hydro-tank",
    label: "JoJo Vortex Hydro Catchment",
    shaderType: "water",
    position: [2.1, 0, -0.5],
    rotationY: -0.4,
    scale: 1,
    radius: 0.95,
    powerKw: -0.4,
    priceZar: 9200,
  },
  {
    uid: "node-3",
    templateId: "thermal-geyser",
    label: "Solar Thermal Fire Manifold",
    shaderType: "fire",
    position: [0.1, 0, -2.1],
    rotationY: 0,
    scale: 1,
    radius: 0.9,
    powerKw: 4.2,
    priceZar: 12400,
  },
  {
    uid: "node-4",
    templateId: "pay-vault",
    label: "PayShap & Stokvel NFC Vault",
    shaderType: "pbr",
    position: [0.0, 0, 1.65],
    rotationY: 0.15,
    scale: 1,
    radius: 0.85,
    powerKw: -0.1,
    priceZar: 5600,
  },
];

export const SCENE_NODE_TEMPLATES: Array<{
  templateId: SceneAssetNode["templateId"];
  label: string;
  subtitle: string;
  shaderType: ShaderMode;
  powerKw: number;
  priceZar: number;
  radius: number;
}> = [
  {
    templateId: "solar-core",
    label: "Plasma Inverter Core",
    subtitle: "+8.0 kW · GLSL Plasma Field",
    shaderType: "plasma",
    powerKw: 8.0,
    priceZar: 24800,
    radius: 0.95,
  },
  {
    templateId: "hydro-tank",
    label: "Hydro Catchment Pod",
    subtitle: "1,200L · GLSL Water Waves",
    shaderType: "water",
    powerKw: -0.4,
    priceZar: 9200,
    radius: 0.95,
  },
  {
    templateId: "thermal-geyser",
    label: "Thermal Geyser Manifold",
    subtitle: "+4.2 kW Heat · GLSL Fire Core",
    shaderType: "fire",
    powerKw: 4.2,
    priceZar: 12400,
    radius: 0.9,
  },
  {
    templateId: "pay-vault",
    label: "PayShap Wallet Terminal",
    subtitle: "ZAR Tap & Offline USSD",
    shaderType: "pbr",
    powerKw: -0.1,
    priceZar: 5600,
    radius: 0.85,
  },
  {
    templateId: "mobility-pod",
    label: "EV Scooter Charge Dock",
    subtitle: "-1.8 kW · Shared Co-op Fleet",
    shaderType: "wireframe",
    powerKw: -1.8,
    priceZar: 8900,
    radius: 0.9,
  },
];

export const WEEKLY_SCHEDULE_SLOTS: WeeklyScheduleSlot[] = [
  {
    id: "slot-yoga",
    dayIndex: 1, // Tuesday
    startHour: 17,
    durationHours: 2,
    title: "Rooftop Sunset Yoga",
    subtitle: "60 min · Deck Studio",
    location: "Woodstock Roof",
    tone: "coral",
  },
  {
    id: "slot-sauna",
    dayIndex: 2, // Wednesday
    startHour: 16,
    durationHours: 1.5,
    title: "Hydro Recovery & Plunge",
    subtitle: "60 min · Solar Heated",
    location: "Courtyard Spa",
    tone: "mint",
  },
  {
    id: "slot-lunch",
    dayIndex: 4, // Friday
    startHour: 13,
    durationHours: 1.5,
    title: "Friday Harvest Potjie",
    subtitle: "Rooftop Veggies · Free",
    location: "Varda Kitchen",
    tone: "sage",
  },
  {
    id: "slot-yoga-fri",
    dayIndex: 4, // Friday
    startHour: 17,
    durationHours: 2,
    title: "Acoustic Amapiano & Flow",
    subtitle: "60 min · Zero-Grid Sound",
    location: "Solar Atrium",
    tone: "coral",
  },
  {
    id: "slot-hike",
    dayIndex: 6, // Sunday
    startHour: 14,
    durationHours: 3.5,
    title: "Lion’s Head & Micro-Grid Tour",
    subtitle: "3h Trail + Rooftop Braai",
    location: "Meet at Lobby",
    tone: "ochre",
  },
];

export const COMMUNITY_INQUIRIES: CommunityInquiryCard[] = [
  {
    id: "inq-1",
    author: "Thandiwe Nkosi",
    unit: "Studio 402 · Maboneng",
    category: "Culture",
    title: "Market Theatre",
    quote:
      'I would like to go to the evening performance of "Woza Albert!" at The Market Theatre in Newtown. Anyone keen to share an Uber Electric and join? Would love to meet fellow theatre lovers in the building.',
    timeLabel: "Wed 21/10 · 7:30 pm",
    venue: "Newtown Cultural Precinct",
    attendeesCount: 4,
  },
  {
    id: "inq-2",
    author: "Sipho & Liam",
    unit: "Loft 208 · Woodstock",
    category: "Food & Drinks",
    title: "Friday Rooftop Braai",
    quote:
      "Harvesting fresh tomatoes, baby spinach, and carrots from the Varda rooftop beds this Friday! Bringing chakalaka and roosterkoek — tap in with R 65 via PayShap if you want us to prep an extra plate.",
    timeLabel: "Fri 23/10 · 1:00 pm",
    venue: "Varda Sky Garden",
    attendeesCount: 9,
  },
  {
    id: "inq-3",
    author: "Naledi Mokoena",
    unit: "Penthouse 601",
    category: "Party",
    title: "Vinyl & Rooibos Night",
    quote:
      "Who would like to hang out in the solar lounge and spin classic Hugh Masekela & Brenda Fassie records during the evening peak tariff window? Micro-grid battery is at 96%!",
    timeLabel: "Fri 23/10 · 8:00 pm",
    venue: "Varda Listening Room",
    attendeesCount: 7,
  },
  {
    id: "inq-4",
    author: "Pieter van der Merwe",
    unit: "Workshop 104",
    category: "Work",
    title: "Solar Stokvel Co-op",
    quote:
      "We are 84% funded on our 4th rooftop LiFePO4 battery blade! Join our 20-minute courtyard huddle to inspect the 3D thermal telemetry and vote on next month’s tariff rebate.",
    timeLabel: "Thu 22/10 · 5:30 pm",
    venue: "Courtyard Conference Pod",
    attendeesCount: 12,
  },
];

export const CONFERENCE_ROOMS = [
  {
    id: "karoo",
    name: "Karoo — 6 pers.",
    features: "3D Spatial Projector · Off-Grid AC",
    rateZar: 180,
    available: true,
  },
  {
    id: "fynbos",
    name: "Fynbos — 4 pers.",
    features: "Acoustic Glass Pod · PayShap Tap",
    rateZar: 120,
    available: true,
  },
  {
    id: "tsitsikamma",
    name: "Tsitsikamma — 2 pers.",
    features: "Focus Booth · Fibre + UPS",
    rateZar: 75,
    available: true,
  },
  {
    id: "marula",
    name: "Marula — 8 pers.",
    features: "Boardroom · Solar Espresso Bar",
    rateZar: 240,
    available: false,
  },
];

export const NEIGHBOURHOOD_SPOTS = [
  {
    id: "spot-1",
    name: "Truth & Origin Roastery",
    category: "Solar Micro-Roaster & Bakery",
    walkTime: "4 min",
    discount: "20% Varda Key Discount",
    coords: { x: 42, y: 38 },
  },
  {
    id: "spot-2",
    name: "Oranjezicht Farm Market",
    category: "Organic Produce & Zero-Waste",
    walkTime: "9 min",
    discount: "Free Compost Drop-off",
    coords: { x: 68, y: 28 },
  },
  {
    id: "spot-3",
    name: "Workshop17 Hardware Lab",
    category: "3D Printing & CNC Fabrication",
    walkTime: "6 min",
    discount: "15% Off Member Day Pass",
    coords: { x: 54, y: 64 },
  },
  {
    id: "spot-4",
    name: "Maboneng E-Bike Hub",
    category: "Solar Charged Commuter Fleet",
    walkTime: "2 min",
    discount: "First 30 min Free via App",
    coords: { x: 29, y: 58 },
  },
];

// ============================================================================
// COMPONENT INSPECTOR DATA PROVIDER (Material Specs & Energy Efficiency Metrics)
// ============================================================================

export const PART_INSPECTOR_REGISTRY: Record<
  string,
  { material: PartMaterialData; energy: PartEnergyEfficiencyData }
> = {
  "outer-glass-shield": {
    material: {
      composition: "Optical Polycarbonate (Lexan Resin 9034) + UV400 Co-Extrusion",
      grade: "Impact-Resistant Architectural Grade 12mm · IOR 1.58",
      thermalConductivityWmK: 0.21,
      tensileStrengthMpa: 82.5,
      recyclabilityRate: 94.8,
      surfaceTreatment: "Silica Anti-Scratch Nanocoat + Hydrophobic Rain Repellent",
      embodiedCarbonKgCo2ePerKg: 3.2,
      temperatureRatingRange: "-40°C to +130°C",
      corrosionRating: "Extreme UV & C5 Hail Class 4",
      densityGPerCm3: 1.2,
    },
    energy: {
      efficiencyPercent: 97.4,
      energyRatingGrade: "A+++",
      standbyPowerLossW: 0.0,
      heatDissipationW: 14.2,
      coolingMethod: "Passive Ambient Convective Chimney",
      loadSheddingEndurance: "Continuous All-Weather Ingress Protection (IP65)",
      peakTariffArbitrageZarPerKwh: 0.85,
      annualCarbonOffsetKg: 95,
      durabilityCycleLife: "25-Year Anti-Degradation Hail Warranty",
      optimalPowerBand: "Zero Parasitic Load Barrier",
    },
  },
  "plasma-toroid-core": {
    material: {
      composition: "Nanocrystalline High-Permeability FeSiB Ribbon + Oxygen-Free Cu ETP",
      grade: "Metglas 2605SA1 Toroidal Core / Class 220 Enamel",
      thermalConductivityWmK: 398.0,
      tensileStrengthMpa: 310.0,
      recyclabilityRate: 99.4,
      surfaceTreatment: "Plasma Vapor Deposition (PVD) Gold Contact Terminals",
      embodiedCarbonKgCo2ePerKg: 1.6,
      temperatureRatingRange: "-30°C to +180°C",
      corrosionRating: "Hermetic Inert Dielectric Seal",
      densityGPerCm3: 7.85,
    },
    energy: {
      efficiencyPercent: 99.4,
      energyRatingGrade: "Ultra-Resonant",
      standbyPowerLossW: 0.28,
      heatDissipationW: 28.5,
      coolingMethod: "Direct Dielectric Fluid Submersion",
      loadSheddingEndurance: "Stage-8 Resilient (Instantaneous 2ms UPS Transfer)",
      peakTariffArbitrageZarPerKwh: 4.85,
      annualCarbonOffsetKg: 780,
      durabilityCycleLife: "150,000 High-Frequency Resonant Hours",
      optimalPowerBand: "2.5 kW – 8.2 kW Resonant Sweet Spot",
    },
  },
  "lifepo4-blade-west": {
    material: {
      composition: "Lithium Iron Phosphate (LiFePO4) Prismatic Cells + Recycled 6061-T6 Aluminum",
      grade: "Automotive EV Class A+ Grade · Nanophosphate Cathode",
      thermalConductivityWmK: 167.0,
      tensileStrengthMpa: 290.0,
      recyclabilityRate: 96.2,
      surfaceTreatment: "25µm Hard Anodized Deep Forest Green (Mil-A-8625 Type III)",
      embodiedCarbonKgCo2ePerKg: 4.8,
      temperatureRatingRange: "-15°C to +60°C",
      corrosionRating: "Industrial C4 Salt Spray 1,000h",
      densityGPerCm3: 2.7,
    },
    energy: {
      efficiencyPercent: 96.8,
      energyRatingGrade: "A+++",
      standbyPowerLossW: 0.35,
      heatDissipationW: 42.0,
      coolingMethod: "Conductive Cold-Plate Thermal Bus Interface",
      loadSheddingEndurance: "Stage-8 (14.5 Hours Sustained 1.2kW Co-op Base Load)",
      peakTariffArbitrageZarPerKwh: 4.15,
      annualCarbonOffsetKg: 1150,
      durabilityCycleLife: "8,000 Full Cycles @ 80% DoD (22-Year Life)",
      optimalPowerBand: "0.2C to 1.0C Continuous Charge/Discharge",
    },
  },
  "lifepo4-blade-east": {
    material: {
      composition: "Lithium Iron Phosphate (LiFePO4) Prismatic Cells + Solid Copper Busbars",
      grade: "Automotive EV Class A+ Grade · Active BMS Cell Balancing",
      thermalConductivityWmK: 167.0,
      tensileStrengthMpa: 290.0,
      recyclabilityRate: 96.2,
      surfaceTreatment: "25µm Hard Anodized Deep Forest Green + Nickel-Plated Terminals",
      embodiedCarbonKgCo2ePerKg: 4.8,
      temperatureRatingRange: "-15°C to +60°C",
      corrosionRating: "Industrial C4 Salt Spray 1,000h",
      densityGPerCm3: 2.7,
    },
    energy: {
      efficiencyPercent: 96.5,
      energyRatingGrade: "A+++",
      standbyPowerLossW: 0.38,
      heatDissipationW: 44.0,
      coolingMethod: "Conductive Cold-Plate Thermal Bus Interface",
      loadSheddingEndurance: "Stage-8 Peak Shaving Reserve (5.12 kWh Usable)",
      peakTariffArbitrageZarPerKwh: 4.15,
      annualCarbonOffsetKg: 1150,
      durabilityCycleLife: "8,000 Full Cycles @ 80% DoD (22-Year Life)",
      optimalPowerBand: "0.2C to 1.0C Continuous Charge/Discharge",
    },
  },
  "thermal-fire-heatsink": {
    material: {
      composition: "Silicon-Carbide (SiC) Trench MOSFETs + Cold-Forged Tellurium Copper C14500",
      grade: "Semiconductor SiC Gen-3 / C14500 High-Conductivity 93% IACS",
      thermalConductivityWmK: 355.0,
      tensileStrengthMpa: 340.0,
      recyclabilityRate: 98.8,
      surfaceTreatment: "Electroless Nickel Immersion Gold (ENIG) + Micro-Skived Fins",
      embodiedCarbonKgCo2ePerKg: 2.1,
      temperatureRatingRange: "-40°C to +175°C",
      corrosionRating: "Aerospace ISO-9 Standard",
      densityGPerCm3: 8.94,
    },
    energy: {
      efficiencyPercent: 99.1,
      energyRatingGrade: "Ultra-Resonant",
      standbyPowerLossW: 0.15,
      heatDissipationW: 58.0,
      coolingMethod: "Vapor Chamber Phase-Change Thermal Spreading",
      loadSheddingEndurance: "Ultra-Fast Surge Clamping (10kA 8/20µs Transient Arrest)",
      peakTariffArbitrageZarPerKwh: 3.4,
      annualCarbonOffsetKg: 520,
      durabilityCycleLife: "100,000 Thermal Shock Cycles (-20°C to +100°C)",
      optimalPowerBand: "3.2 kW – 5.5 kW PV Array MPPT Window",
    },
  },
  "hydro-cooling-loop": {
    material: {
      composition:
        "Borosilicate Glass 3.3 Reservoir + Synthetic Biodegradable Ester Dielectric Fluid",
      grade: "DIN ISO 3585 Schott Duran / MIDEL 7131 Dielectric Non-Toxic",
      thermalConductivityWmK: 1.2,
      tensileStrengthMpa: 110.0,
      recyclabilityRate: 99.8,
      surfaceTreatment: "Fire-Polished Stress-Relieved Annealing + Viton O-Rings",
      embodiedCarbonKgCo2ePerKg: 0.85,
      temperatureRatingRange: "-20°C to +140°C",
      corrosionRating: "Chemical Inert Class 1 / Zero Hydrolysis",
      densityGPerCm3: 2.23,
    },
    energy: {
      efficiencyPercent: 98.7,
      energyRatingGrade: "A+++",
      standbyPowerLossW: 0.65,
      heatDissipationW: 320.0,
      coolingMethod: "Closed-Loop Dielectric Natural Thermosiphon Circulation",
      loadSheddingEndurance: "Passive 4-Hour Thermal Buffering without Grid Draw",
      peakTariffArbitrageZarPerKwh: 1.9,
      annualCarbonOffsetKg: 340,
      durabilityCycleLife: "20-Year Sealed Fluid Integrity (Zero Top-Up Required)",
      optimalPowerBand: "2.0 – 6.0 L/min Flow Dynamic Equilibrium",
    },
  },
  "payshap-nfc-terminal": {
    material: {
      composition: "Zirconia (ZrO2) Sintered High-Tech Ceramic + 24k Gold Busbar Traces",
      grade: "Yttria-Stabilized Tetragonal Zirconia Polycrystal (Y-TZP)",
      thermalConductivityWmK: 2.7,
      tensileStrengthMpa: 1200.0,
      recyclabilityRate: 92.4,
      surfaceTreatment: "Diamond-Polished Matte Finish + Micro-Embossed Braille Dial",
      embodiedCarbonKgCo2ePerKg: 3.4,
      temperatureRatingRange: "-20°C to +85°C",
      corrosionRating: "IP67 Submersible & Scratch-Proof Mohs 8.5 Hardness",
      densityGPerCm3: 6.05,
    },
    energy: {
      efficiencyPercent: 99.9,
      energyRatingGrade: "Direct Pass-Through",
      standbyPowerLossW: 0.08,
      heatDissipationW: 0.8,
      coolingMethod: "Passive Substrate Conductive Sinking",
      loadSheddingEndurance: "Offline Non-Volatile Flash + 48h Supercapacitor Backup",
      peakTariffArbitrageZarPerKwh: 2.8,
      annualCarbonOffsetKg: 180,
      durabilityCycleLife: "1,000,000 Tap & Transaction Cycles",
      optimalPowerBand: "0.08W Sleep / 1.8W Active NFC Burst",
    },
  },
  "seismic-base-plinth": {
    material: {
      composition:
        "Obsidian Ductile Spheroidal Graphite Iron (EN-GJS-500-7) + Heavy Solid Copper Bus",
      grade: "Ductile Iron SABS 936 / S355 Structural Heavy Foundation Grade",
      thermalConductivityWmK: 36.0,
      tensileStrengthMpa: 500.0,
      recyclabilityRate: 100.0,
      surfaceTreatment: "Bituminous Corrosion Shield + Phosphated Zinc Primer",
      embodiedCarbonKgCo2ePerKg: 1.15,
      temperatureRatingRange: "-40°C to +200°C",
      corrosionRating: "Underground & Marine Heavy C5-M (50-Year Spec)",
      densityGPerCm3: 7.15,
    },
    energy: {
      efficiencyPercent: 99.98,
      energyRatingGrade: "Direct Pass-Through",
      standbyPowerLossW: 0.0,
      heatDissipationW: 5.0,
      coolingMethod: "Direct Sub-Floor Conductive Ground Thermal Sinking",
      loadSheddingEndurance: "40kA Lightning Surge Shunt (Zero Grid Return Impedance)",
      peakTariffArbitrageZarPerKwh: 0.4,
      annualCarbonOffsetKg: 60,
      durabilityCycleLife: "50-Year Structural Anchor Guarantee",
      optimalPowerBand: "Static Low-Impedance Base (0.18 Ω Earth Bus)",
    },
  },
};

/**
 * Returns specific material properties and real-time energy efficiency metrics
 * for any given 3D Anatomy Part.
 */
export function getPartInspectorData(
  part: AnatomyPart,
  assemblyId?: string,
): { material: PartMaterialData; energy: PartEnergyEfficiencyData } {
  if (part.materialData && part.energyEfficiencyData) {
    return {
      material: part.materialData,
      energy: part.energyEfficiencyData,
    };
  }

  const registered = PART_INSPECTOR_REGISTRY[part.id];
  if (registered) {
    // If it's the Drakensberg Hydro-Solar unit, provide water-specific adaptations
    if (assemblyId === "table-mountain-hydro-thermal") {
      if (part.id === "plasma-toroid-core") {
        return {
          material: {
            ...registered.material,
            composition: "Synthetic Fused Silica Quartz Sleeve + 254nm UV-C Arc Emitter",
            grade: "High-Purity Quartz Glass JGS1 / 316L Stainless Chamber",
            tensileStrengthMpa: 48.0,
          },
          energy: {
            ...registered.energy,
            efficiencyPercent: 99.2,
            heatDissipationW: 18.0,
            standbyPowerLossW: 0.12,
            loadSheddingEndurance: "Solar Direct DC Sterilization (99.99% Pathogen Free)",
          },
        };
      }
      if (part.id === "thermal-fire-heatsink") {
        return {
          material: {
            ...registered.material,
            composition:
              "Evacuated Double-Wall Borosilicate + Copper Heat-Pipe with AL-N/AL Selective Coating",
            grade: "Solar Thermal Class 1 Evacuated Vacuum Tube",
            thermalConductivityWmK: 380.0,
          },
          energy: {
            ...registered.energy,
            efficiencyPercent: 89.4,
            heatDissipationW: 2400.0, // Useful thermal yield
            coolingMethod: "Thermosiphon Heat Exchange to Water Boiler",
            loadSheddingEndurance: "Zero Grid Draw Hot Water (Heats up to 72°C purely on solar)",
            annualCarbonOffsetKg: 890,
          },
        };
      }
    }
    return registered;
  }

  // Graceful fallback for custom dynamic nodes
  return {
    material: {
      composition: part.materialSpec || "Aerospace Lightweight Composite",
      grade: "Industrial Spec Grade 1",
      thermalConductivityWmK: 45.0,
      tensileStrengthMpa: 250.0,
      recyclabilityRate: 92.0,
      surfaceTreatment: "UV-Resistant Protective Nanocoat",
      embodiedCarbonKgCo2ePerKg: 2.5,
      temperatureRatingRange: "-20°C to +85°C",
      corrosionRating: "IP65 All-Weather",
      densityGPerCm3: 2.8,
    },
    energy: {
      efficiencyPercent: 96.0,
      energyRatingGrade: "A++",
      standbyPowerLossW: 0.5,
      heatDissipationW: 25.0,
      coolingMethod: "Passive Ambient Convection",
      loadSheddingEndurance: "Stage-8 Resilient",
      peakTariffArbitrageZarPerKwh: 3.2,
      annualCarbonOffsetKg: 300,
      durabilityCycleLife: "10,000 Operating Cycles",
      optimalPowerBand: "Standard Operating Range",
    },
  };
}
