export type ShaderMode = 'pbr' | 'wireframe' | 'plasma' | 'fire' | 'water';

export interface AnatomyPart {
  id: string;
  name: string;
  role: string;
  materialSpec: string;
  telemetry: string;
  massKg: number;
  shaderCategory: 'structural' | 'plasma' | 'fire' | 'water' | 'glass';
  explodeOffset: [number, number, number];
  defaultPosition: [number, number, number];
  rotationAxis?: 'x' | 'y' | 'z';
  rotationSpeed?: number;
  collisionRadius: number;
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
  templateId: 'solar-core' | 'hydro-tank' | 'thermal-geyser' | 'pay-vault' | 'mobility-pod';
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
  category: 'Culture' | 'Party' | 'Food & Drinks' | 'Work';
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
  tone: 'sage' | 'coral' | 'ochre' | 'mint';
}

export interface OfflineTransactionItem {
  id: string;
  timestamp: string;
  title: string;
  method: 'PayShap' | 'Ozow EFT' | 'SnapScan QR' | 'Capitec Pay' | 'Stokvel Pool' | 'USSD Voucher';
  amountZar: number;
  reference: string;
  synced: boolean;
}

export const VARDA_ASSEMBLIES: VardaProductAssembly[] = [
  {
    id: 'karoo-inverter-vault',
    name: 'Varda Karoo-X8 Hybrid Micro-Grid Core',
    subtitle: 'Solar energy storage & smart metering hub',
    category: 'Energy & Fintech Hardware',
    priceZar: 24800,
    monthlyStokvelZar: 2150,
    recommendedShader: 'plasma',
    summary:
      'Engineered for South African residential co-ops and micro-grids. Combines a 8kW bi-directional toroidal plasma inverter, modular LiFePO4 battery blades, and a contactless NFC/QR PayShap token terminal in a frosted ballistic polycarbonate enclosure.',
    parts: [
      {
        id: 'outer-glass-shield',
        name: '01. Frosted Polycarbonate Acoustic Shield',
        role: 'IP65 Dust & Hail Enclosure',
        materialSpec: 'Optical Lexan 12mm · IOR 1.58',
        telemetry: '34.2°C Surface · 0.0 dB Leak',
        massKg: 6.4,
        shaderCategory: 'glass',
        defaultPosition: [0, 1.35, 0],
        explodeOffset: [0, 1.35, 0],
        collisionRadius: 1.45,
      },
      {
        id: 'plasma-toroid-core',
        name: '02. High-Frequency Plasma Toroid Inductor',
        role: 'Bi-Directional DC-AC Resonant Core',
        materialSpec: 'Nanocrystalline Copper + GLSL Plasma Field',
        telemetry: '230.2V AC · 50.00Hz · 98.4% Eff',
        massKg: 11.2,
        shaderCategory: 'plasma',
        defaultPosition: [0, 1.4, 0],
        explodeOffset: [0, 0.55, 0],
        rotationAxis: 'y',
        rotationSpeed: 1.1,
        collisionRadius: 0.78,
      },
      {
        id: 'lifepo4-blade-west',
        name: '03. Primary LiFePO4 Prismatic Blade A',
        role: '5.12 kWh Deep-Cycle Storage Bank',
        materialSpec: 'Brushed Anodized Forest Aluminum',
        telemetry: 'SOC 94% · 6,000 Cycles Rated',
        massKg: 42.0,
        shaderCategory: 'structural',
        defaultPosition: [-0.72, 1.1, 0],
        explodeOffset: [-1.15, 0.1, 0],
        collisionRadius: 0.65,
      },
      {
        id: 'lifepo4-blade-east',
        name: '04. Secondary LiFePO4 Prismatic Blade B',
        role: '5.12 kWh Peak Shaving Reserve',
        materialSpec: 'Brushed Anodized Forest Aluminum',
        telemetry: 'SOC 92% · Active Balancing',
        massKg: 42.0,
        shaderCategory: 'structural',
        defaultPosition: [0.72, 1.1, 0],
        explodeOffset: [1.15, 0.1, 0],
        collisionRadius: 0.65,
      },
      {
        id: 'thermal-fire-heatsink',
        name: '05. Silicon-Carbide Thermal Dissipation Array',
        role: 'Active MPPT Solar Charge Manifold',
        materialSpec: 'Extruded Copper Fin + GLSL Thermal Shader',
        telemetry: '61.8°C Junction · 4.8kW PV Input',
        massKg: 5.8,
        shaderCategory: 'fire',
        defaultPosition: [0, 1.95, -0.45],
        explodeOffset: [0, 0.9, -1.1],
        collisionRadius: 0.6,
      },
      {
        id: 'hydro-cooling-loop',
        name: '06. Closed-Loop Dielectric Hydro Reservoir',
        role: 'Silent Liquid Thermal Exchange',
        materialSpec: 'Borosilicate + GLSL Wave Displacement',
        telemetry: 'Flow 2.4 L/min · 28.5°C Return',
        massKg: 3.9,
        shaderCategory: 'water',
        defaultPosition: [0, 0.85, 0.58],
        explodeOffset: [0, -0.25, 1.25],
        collisionRadius: 0.58,
      },
      {
        id: 'payshap-nfc-terminal',
        name: '07. PayShap & Offline USSD Token Module',
        role: 'Prepaid Co-op Tariff & Tap-to-Share Interface',
        materialSpec: 'Emerald Ceramic + Gold Contact Bus',
        telemetry: 'Offline Queue Ready · R 0.00 Arrears',
        massKg: 1.4,
        shaderCategory: 'structural',
        defaultPosition: [0, 1.55, 0.82],
        explodeOffset: [0, 0.4, 1.45],
        rotationAxis: 'z',
        rotationSpeed: 0.35,
        collisionRadius: 0.5,
      },
      {
        id: 'seismic-base-plinth',
        name: '08. Cast Ductile Base & Grounding Busbar',
        role: 'Anti-Vibration Floor Anchor & Surge Arrestor',
        materialSpec: 'Sand-Cast Obsidian Iron · 40kA Surge',
        telemetry: 'Earth Impedance 0.18 Ω',
        massKg: 18.5,
        shaderCategory: 'structural',
        defaultPosition: [0, 0.22, 0],
        explodeOffset: [0, -0.75, 0],
        collisionRadius: 1.3,
      },
    ],
  },
  {
    id: 'table-mountain-hydro-thermal',
    name: 'Varda Drakensberg Hydro-Solar Rooftop Unit',
    subtitle: 'Integrated Greywater Filtration + Vacuum Tube Solar Thermal Geyser',
    category: 'Water & Thermal Infrastructure',
    priceZar: 18450,
    monthlyStokvelZar: 1620,
    recommendedShader: 'water',
    summary:
      'Designed for Cape Town and Gauteng rooftop gardens and co-living developments. Harvests rainwater, purifies greywater for rooftop vegetable beds, and heats domestic water using evacuated solar thermal tubes.',
    parts: [
      {
        id: 'outer-glass-shield',
        name: '01. UV-Stabilized Vapour Dome',
        role: 'Greenhouse Micro-Climate Cover',
        materialSpec: 'Twin-Wall Polycarbonate · 88% Light Transmittance',
        telemetry: 'UV Index 9.2 · Zero Algae',
        massKg: 5.2,
        shaderCategory: 'glass',
        defaultPosition: [0, 1.35, 0],
        explodeOffset: [0, 1.4, 0],
        collisionRadius: 1.45,
      },
      {
        id: 'hydro-cooling-loop',
        name: '02. 1,200L Vortex Rainwater Catchment Core',
        role: 'First-Flush Cyclonic Sediment Filter',
        materialSpec: 'Food-Grade LLDPE + GLSL Water Surface Shader',
        telemetry: 'Level 86% (1,032L) · TDS 42 ppm',
        massKg: 14.8,
        shaderCategory: 'water',
        defaultPosition: [0, 1.2, 0],
        explodeOffset: [0, 0.35, 0],
        collisionRadius: 0.85,
      },
      {
        id: 'thermal-fire-heatsink',
        name: '03. Evacuated Copper Heat-Pipe Manifold',
        role: 'Solar Thermal Boiler Core',
        materialSpec: 'Borosilicate Vacuum + GLSL Fire/Thermal Shader',
        telemetry: 'Water Temp 68.4°C · Zero Grid Draw',
        massKg: 9.6,
        shaderCategory: 'fire',
        defaultPosition: [0, 1.85, -0.35],
        explodeOffset: [0, 1.0, -1.0],
        collisionRadius: 0.7,
      },
      {
        id: 'plasma-toroid-core',
        name: '04. UV-C Plasma Sterilization Chamber',
        role: 'Pathogen Eradication for Rooftop Irrigation',
        materialSpec: 'Quartz Sleeve + 254nm Plasma Arc',
        telemetry: '99.99% Sterile · 18W Solar Driven',
        massKg: 3.1,
        shaderCategory: 'plasma',
        defaultPosition: [0, 1.45, 0.65],
        explodeOffset: [0, 0.5, 1.25],
        rotationAxis: 'y',
        rotationSpeed: 1.6,
        collisionRadius: 0.55,
      },
      {
        id: 'lifepo4-blade-west',
        name: '05. Mineral Remineralization Cartridge',
        role: 'Dolomite & Rooibos Activated Carbon Bed',
        materialSpec: 'Sintered Ceramic + Western Cape Dolomite',
        telemetry: 'pH 7.4 · Filter Life 82%',
        massKg: 7.5,
        shaderCategory: 'structural',
        defaultPosition: [-0.75, 1.05, 0],
        explodeOffset: [-1.2, 0.0, 0],
        collisionRadius: 0.6,
      },
      {
        id: 'lifepo4-blade-east',
        name: '06. Brushless DC Booster Pump & Impeller',
        role: 'Constant-Pressure Drip Irrigation Feed',
        materialSpec: '316 Marine Stainless Steel',
        telemetry: '2.8 Bar · 14 L/min Active',
        massKg: 6.2,
        shaderCategory: 'structural',
        defaultPosition: [0.75, 1.05, 0],
        explodeOffset: [1.2, 0.0, 0],
        rotationAxis: 'x',
        rotationSpeed: 2.2,
        collisionRadius: 0.6,
      },
      {
        id: 'seismic-base-plinth',
        name: '07. Galvanized Rooftop Load-Distribution Cradle',
        role: 'Structural Deck Mount',
        materialSpec: 'Hot-Dip Galvanized S355 Steel',
        telemetry: 'Wind Rated 160 km/h (Cape Doctor)',
        massKg: 21.0,
        shaderCategory: 'structural',
        defaultPosition: [0, 0.22, 0],
        explodeOffset: [0, -0.75, 0],
        collisionRadius: 1.3,
      },
    ],
  },
];

export const INITIAL_SCENE_NODES: SceneAssetNode[] = [
  {
    uid: 'node-1',
    templateId: 'solar-core',
    label: 'Karoo-X8 Plasma Inverter',
    shaderType: 'plasma',
    position: [-2.1, 0, -0.6],
    rotationY: 0.3,
    scale: 1,
    radius: 0.95,
    powerKw: 8.0,
    priceZar: 24800,
  },
  {
    uid: 'node-2',
    templateId: 'hydro-tank',
    label: 'JoJo Vortex Hydro Catchment',
    shaderType: 'water',
    position: [2.1, 0, -0.5],
    rotationY: -0.4,
    scale: 1,
    radius: 0.95,
    powerKw: -0.4,
    priceZar: 9200,
  },
  {
    uid: 'node-3',
    templateId: 'thermal-geyser',
    label: 'Solar Thermal Fire Manifold',
    shaderType: 'fire',
    position: [0.1, 0, -2.1],
    rotationY: 0,
    scale: 1,
    radius: 0.9,
    powerKw: 4.2,
    priceZar: 12400,
  },
  {
    uid: 'node-4',
    templateId: 'pay-vault',
    label: 'PayShap & Stokvel NFC Vault',
    shaderType: 'pbr',
    position: [0.0, 0, 1.65],
    rotationY: 0.15,
    scale: 1,
    radius: 0.85,
    powerKw: -0.1,
    priceZar: 5600,
  },
];

export const SCENE_NODE_TEMPLATES: Array<{
  templateId: SceneAssetNode['templateId'];
  label: string;
  subtitle: string;
  shaderType: ShaderMode;
  powerKw: number;
  priceZar: number;
  radius: number;
}> = [
  {
    templateId: 'solar-core',
    label: 'Plasma Inverter Core',
    subtitle: '+8.0 kW · GLSL Plasma Field',
    shaderType: 'plasma',
    powerKw: 8.0,
    priceZar: 24800,
    radius: 0.95,
  },
  {
    templateId: 'hydro-tank',
    label: 'Hydro Catchment Pod',
    subtitle: '1,200L · GLSL Water Waves',
    shaderType: 'water',
    powerKw: -0.4,
    priceZar: 9200,
    radius: 0.95,
  },
  {
    templateId: 'thermal-geyser',
    label: 'Thermal Geyser Manifold',
    subtitle: '+4.2 kW Heat · GLSL Fire Core',
    shaderType: 'fire',
    powerKw: 4.2,
    priceZar: 12400,
    radius: 0.9,
  },
  {
    templateId: 'pay-vault',
    label: 'PayShap Wallet Terminal',
    subtitle: 'ZAR Tap & Offline USSD',
    shaderType: 'pbr',
    powerKw: -0.1,
    priceZar: 5600,
    radius: 0.85,
  },
  {
    templateId: 'mobility-pod',
    label: 'EV Scooter Charge Dock',
    subtitle: '-1.8 kW · Shared Co-op Fleet',
    shaderType: 'wireframe',
    powerKw: -1.8,
    priceZar: 8900,
    radius: 0.9,
  },
];

export const WEEKLY_SCHEDULE_SLOTS: WeeklyScheduleSlot[] = [
  {
    id: 'slot-yoga',
    dayIndex: 1, // Tuesday
    startHour: 17,
    durationHours: 2,
    title: 'Rooftop Sunset Yoga',
    subtitle: '60 min · Deck Studio',
    location: 'Woodstock Roof',
    tone: 'coral',
  },
  {
    id: 'slot-sauna',
    dayIndex: 2, // Wednesday
    startHour: 16,
    durationHours: 1.5,
    title: 'Hydro Recovery & Plunge',
    subtitle: '60 min · Solar Heated',
    location: 'Courtyard Spa',
    tone: 'mint',
  },
  {
    id: 'slot-lunch',
    dayIndex: 4, // Friday
    startHour: 13,
    durationHours: 1.5,
    title: 'Friday Harvest Potjie',
    subtitle: 'Rooftop Veggies · Free',
    location: 'Varda Kitchen',
    tone: 'sage',
  },
  {
    id: 'slot-yoga-fri',
    dayIndex: 4, // Friday
    startHour: 17,
    durationHours: 2,
    title: 'Acoustic Amapiano & Flow',
    subtitle: '60 min · Zero-Grid Sound',
    location: 'Solar Atrium',
    tone: 'coral',
  },
  {
    id: 'slot-hike',
    dayIndex: 6, // Sunday
    startHour: 14,
    durationHours: 3.5,
    title: 'Lion’s Head & Micro-Grid Tour',
    subtitle: '3h Trail + Rooftop Braai',
    location: 'Meet at Lobby',
    tone: 'ochre',
  },
];

export const COMMUNITY_INQUIRIES: CommunityInquiryCard[] = [
  {
    id: 'inq-1',
    author: 'Thandiwe Nkosi',
    unit: 'Studio 402 · Maboneng',
    category: 'Culture',
    title: 'Market Theatre',
    quote:
      'I would like to go to the evening performance of "Woza Albert!" at The Market Theatre in Newtown. Anyone keen to share an Uber Electric and join? Would love to meet fellow theatre lovers in the building.',
    timeLabel: 'Wed 21/10 · 7:30 pm',
    venue: 'Newtown Cultural Precinct',
    attendeesCount: 4,
  },
  {
    id: 'inq-2',
    author: 'Sipho & Liam',
    unit: 'Loft 208 · Woodstock',
    category: 'Food & Drinks',
    title: 'Friday Rooftop Braai',
    quote:
      'Harvesting fresh tomatoes, baby spinach, and carrots from the Varda rooftop beds this Friday! Bringing chakalaka and roosterkoek — tap in with R 65 via PayShap if you want us to prep an extra plate.',
    timeLabel: 'Fri 23/10 · 1:00 pm',
    venue: 'Varda Sky Garden',
    attendeesCount: 9,
  },
  {
    id: 'inq-3',
    author: 'Naledi Mokoena',
    unit: 'Penthouse 601',
    category: 'Party',
    title: 'Vinyl & Rooibos Night',
    quote:
      'Who would like to hang out in the solar lounge and spin classic Hugh Masekela & Brenda Fassie records during the evening peak tariff window? Micro-grid battery is at 96%!',
    timeLabel: 'Fri 23/10 · 8:00 pm',
    venue: 'Varda Listening Room',
    attendeesCount: 7,
  },
  {
    id: 'inq-4',
    author: 'Pieter van der Merwe',
    unit: 'Workshop 104',
    category: 'Work',
    title: 'Solar Stokvel Co-op',
    quote:
      'We are 84% funded on our 4th rooftop LiFePO4 battery blade! Join our 20-minute courtyard huddle to inspect the 3D thermal telemetry and vote on next month’s tariff rebate.',
    timeLabel: 'Thu 22/10 · 5:30 pm',
    venue: 'Courtyard Conference Pod',
    attendeesCount: 12,
  },
];

export const CONFERENCE_ROOMS = [
  {
    id: 'karoo',
    name: 'Karoo — 6 pers.',
    features: '3D Spatial Projector · Off-Grid AC',
    rateZar: 180,
    available: true,
  },
  {
    id: 'fynbos',
    name: 'Fynbos — 4 pers.',
    features: 'Acoustic Glass Pod · PayShap Tap',
    rateZar: 120,
    available: true,
  },
  {
    id: 'tsitsikamma',
    name: 'Tsitsikamma — 2 pers.',
    features: 'Focus Booth · Fibre + UPS',
    rateZar: 75,
    available: true,
  },
  {
    id: 'marula',
    name: 'Marula — 8 pers.',
    features: 'Boardroom · Solar Espresso Bar',
    rateZar: 240,
    available: false,
  },
];

export const NEIGHBOURHOOD_SPOTS = [
  {
    id: 'spot-1',
    name: 'Truth & Origin Roastery',
    category: 'Solar Micro-Roaster & Bakery',
    walkTime: '4 min',
    discount: '20% Varda Key Discount',
    coords: {x: 42, y: 38},
  },
  {
    id: 'spot-2',
    name: 'Oranjezicht Farm Market',
    category: 'Organic Produce & Zero-Waste',
    walkTime: '9 min',
    discount: 'Free Compost Drop-off',
    coords: {x: 68, y: 28},
  },
  {
    id: 'spot-3',
    name: 'Workshop17 Hardware Lab',
    category: '3D Printing & CNC Fabrication',
    walkTime: '6 min',
    discount: '15% Off Member Day Pass',
    coords: {x: 54, y: 64},
  },
  {
    id: 'spot-4',
    name: 'Maboneng E-Bike Hub',
    category: 'Solar Charged Commuter Fleet',
    walkTime: '2 min',
    discount: 'First 30 min Free via App',
    coords: {x: 29, y: 58},
  },
];
