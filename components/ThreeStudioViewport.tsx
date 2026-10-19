'use client';

import React, {useEffect, useRef, useState, useCallback} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {
  VARDA_ASSEMBLIES,
  INITIAL_SCENE_NODES,
  SCENE_NODE_TEMPLATES,
  type ShaderMode,
  type VardaProductAssembly,
  type AnatomyPart,
  type SceneAssetNode,
} from '@/lib/sa-data';
import {
  Layers,
  Box,
  Cpu,
  Flame,
  Droplets,
  Zap,
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Eye,
  Compass,
  Move,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';

// ============================================================================
// CUSTOM GLSL SHADERS (FIRE, WATER, PLASMA)
// ============================================================================

const COMMON_NOISE_GLSL = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3D(p);
      p = p * 2.03 + vec3(0.0, 1.2, 0.0);
      a *= 0.5;
    }
    return v;
  }
`;

const FIRE_VERTEX_SHADER = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float n = noise3D(pos * 3.5 - vec3(0.0, time * 3.2, 0.0));
    float heightFactor = smoothstep(-0.5, 1.0, pos.y);
    pos += normal * (n - 0.4) * 0.14 * intensity * (0.4 + heightFactor);

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FIRE_FRAGMENT_SHADER = `
  uniform float time;
  uniform float intensity;
  ${COMMON_NOISE_GLSL}

  void main() {
    vec3 samplePos = vLocalPos * 3.2 - vec3(0.0, time * 2.8, 0.0);
    float n = fbm(samplePos);
    float n2 = fbm(samplePos * 2.1 + vec3(time * 0.7));

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.2);

    float heat = clamp(n * 0.75 + n2 * 0.45 + fresnel * 0.35, 0.0, 1.0);

    vec3 deepEmber = vec3(0.55, 0.07, 0.02);
    vec3 solarFlame = vec3(0.96, 0.38, 0.06);
    vec3 goldenCore = vec3(1.0, 0.86, 0.35);
    vec3 whiteHot = vec3(1.0, 0.98, 0.9);

    vec3 col = mix(deepEmber, solarFlame, smoothstep(0.15, 0.5, heat));
    col = mix(col, goldenCore, smoothstep(0.5, 0.78, heat));
    col = mix(col, whiteHot, smoothstep(0.78, 0.98, heat));

    gl_FragColor = vec4(col * (0.9 + 0.25 * intensity), 0.95);
  }
`;

const WATER_VERTEX_SHADER = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying float vWaveHeight;

  void main() {
    vUv = uv;
    vLocalPos = position;

    vec3 pos = position;
    float wave1 = sin(pos.x * 5.0 + time * 2.6) * cos(pos.z * 4.5 + time * 2.1);
    float wave2 = sin((pos.x + pos.z) * 8.0 - time * 3.4) * 0.5;
    float combinedWave = (wave1 + wave2) * 0.06 * intensity;

    pos += normal * combinedWave;
    vWaveHeight = combinedWave;

    vNormal = normalize(normalMatrix * normalize(normal + vec3(wave1 * 0.15, 0.0, wave2 * 0.15)));
    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const WATER_FRAGMENT_SHADER = `
  uniform float time;
  varying float vWaveHeight;
  ${COMMON_NOISE_GLSL}

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 3.0);

    float causticNoise = fbm(vLocalPos * 5.5 + vec3(time * 0.9, time * 0.6, -time * 0.7));
    float caustics = smoothstep(0.48, 0.76, causticNoise);

    vec3 deepAbyss = vec3(0.04, 0.25, 0.23);
    vec3 hydroTeal = vec3(0.08, 0.58, 0.48);
    vec3 foamCrest = vec3(0.78, 0.97, 0.93);

    vec3 waterCol = mix(deepAbyss, hydroTeal, clamp(vUv.y + vWaveHeight * 4.0, 0.0, 1.0));
    waterCol += foamCrest * caustics * 0.45;
    waterCol = mix(waterCol, foamCrest, fresnel * 0.65);

    gl_FragColor = vec4(waterCol, 0.9);
  }
`;

const PLASMA_VERTEX_SHADER = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    float pulse = sin(pos.y * 8.0 - time * 4.5) * cos(pos.x * 8.0 + time * 3.2);
    pos += normal * pulse * 0.035 * intensity;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const PLASMA_FRAGMENT_SHADER = `
  uniform float time;
  uniform float intensity;
  ${COMMON_NOISE_GLSL}

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.4);

    vec3 p = vLocalPos * 4.2;
    float arc1 = abs(sin(p.x * 3.0 + fbm(p + time * 2.2) * 6.0 - time * 3.0));
    float arc2 = abs(cos(p.y * 4.0 - fbm(p * 1.6 - time * 1.8) * 5.0 + time * 2.5));

    float filament = pow(1.0 - clamp(arc1 * arc2, 0.0, 1.0), 6.0);

    vec3 forestCore = vec3(0.05, 0.22, 0.18);
    vec3 vardaEmerald = vec3(0.08, 0.88, 0.46);
    vec3 electricCyan = vec3(0.45, 0.99, 0.78);
    vec3 goldSpark = vec3(0.92, 0.82, 0.35);

    vec3 col = mix(forestCore, vardaEmerald, filament * 0.85 + fresnel * 0.5);
    col = mix(col, electricCyan, pow(filament, 2.0) * 0.9);
    col += goldSpark * pow(fresnel, 4.0) * 0.65;

    gl_FragColor = vec4(col * (0.95 + 0.2 * intensity), 0.96);
  }
`;

// Pre-allocated math helpers at module scope to prevent GC in the animation loop
const _tempVec3 = new THREE.Vector3();
const _targetVec3 = new THREE.Vector3();
const _dragIntersect = new THREE.Vector3();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

interface SpringState {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  target: THREE.Vector3;
  scale: number;
  scaleVel: number;
  targetScale: number;
}

interface ThreeStudioViewportProps {
  lowBandwidthMode: boolean;
  onSelectOrderForPayment: (item: {
    name: string;
    description: string;
    amountZar: number;
  }) => void;
}

export default function ThreeStudioViewport({
  lowBandwidthMode,
  onSelectOrderForPayment,
}: ThreeStudioViewportProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Studio State
  const [workspaceMode, setWorkspaceMode] = useState<'anatomy' | 'scene-editor'>('anatomy');
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string>(VARDA_ASSEMBLIES[0].id);
  const [activeShader, setActiveShader] = useState<ShaderMode>('plasma');
  const [isIsometric, setIsIsometric] = useState<boolean>(false);
  const [explodeFactor, setExplodeFactor] = useState<number>(0.18);
  const [selectedPartId, setSelectedPartId] = useState<string>(
    VARDA_ASSEMBLIES[0].parts[1].id
  );
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [webglReady, setWebglReady] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Scene Editor & Collision State
  const [sceneNodes, setSceneNodes] = useState<SceneAssetNode[]>(INITIAL_SCENE_NODES);
  const [selectedNodeUid, setSelectedNodeUid] = useState<string>('node-1');
  const [activeCollisions, setActiveCollisions] = useState<string[]>([]);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);

  const currentAssembly: VardaProductAssembly =
    VARDA_ASSEMBLIES.find((a) => a.id === selectedAssemblyId) || VARDA_ASSEMBLIES[0];
  const currentPart: AnatomyPart =
    currentAssembly.parts.find((p) => p.id === selectedPartId) || currentAssembly.parts[0];

  // Mutable refs for the WebGL loop so React state updates never recreate the canvas
  const stateRef = useRef({
    workspaceMode,
    selectedAssemblyId,
    activeShader: lowBandwidthMode ? ('wireframe' as ShaderMode) : activeShader,
    isIsometric,
    explodeFactor,
    selectedPartId,
    sceneNodes,
    selectedNodeUid,
    snapToGrid,
    soundEnabled,
  });

  useEffect(() => {
    stateRef.current = {
      workspaceMode,
      selectedAssemblyId,
      activeShader: lowBandwidthMode ? 'wireframe' : activeShader,
      isIsometric,
      explodeFactor,
      selectedPartId,
      sceneNodes,
      selectedNodeUid,
      snapToGrid,
      soundEnabled,
    };
  }, [
    workspaceMode,
    selectedAssemblyId,
    activeShader,
    lowBandwidthMode,
    isIsometric,
    explodeFactor,
    selectedPartId,
    sceneNodes,
    selectedNodeUid,
    snapToGrid,
    soundEnabled,
  ]);

  // Procedural Web Audio synthesizer for tactile micro-interactions, drag-and-drop, and collision feedback
  const playTactileTone = useCallback(
    (type: 'select' | 'collide' | 'snap' | 'spawn' | 'dragstart' | 'dragmove' | 'drop' | 'dock-spawn') => {
      if (!stateRef.current.soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
        if (!AudioCtx) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        if (type === 'dragstart') {
          // Subtle upward tactile blip when picking up a 3D component
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(360, now);
          osc.frequency.exponentialRampToValueAtTime(560, now + 0.05);
          gain.gain.setValueAtTime(0.045, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
        } else if (type === 'dragmove') {
          // Micro-tick as component glides across grid divisions
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(820, now);
          osc.frequency.exponentialRampToValueAtTime(680, now + 0.015);
          gain.gain.setValueAtTime(0.018, now);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.018);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.02);
        } else if (type === 'drop') {
          // Satisfying resonant mechanical latch / settling thud
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(230, now);
          osc.frequency.exponentialRampToValueAtTime(74, now + 0.11);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        } else if (type === 'snap') {
          // Crisp magnetic busbar snap
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(740, now);
          osc.frequency.exponentialRampToValueAtTime(960, now + 0.04);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
        } else if (type === 'dock-spawn' || type === 'spawn') {
          // Melodic two-tone confirmation chime when dropping new module into the scene
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(420, now);
          osc1.frequency.exponentialRampToValueAtTime(580, now + 0.08);
          osc2.frequency.setValueAtTime(640, now + 0.04);
          osc2.frequency.exponentialRampToValueAtTime(840, now + 0.12);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now);
          osc2.start(now + 0.04);
          osc1.stop(now + 0.14);
          osc2.stop(now + 0.14);
        } else if (type === 'collide') {
          // Soft rubberized warning bump
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(155, now);
          osc.frequency.exponentialRampToValueAtTime(68, now + 0.14);
          gain.gain.setValueAtTime(0.14, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === 'select') {
          // Part anatomy selection ping
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(780, now + 0.07);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.08);
        }
      } catch {
        // Ignore audio errors if blocked by browser autoplay policy
      }
    },
    []
  );

  // Build procedural canvas dial texture for ground pad
  const createTechnicalGridTexture = useCallback((maxAnisotropy: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0E2D26';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(200, 214, 185, 0.12)';
    ctx.lineWidth = 1.5;
    const step = 64;
    for (let i = 0; i <= 1024; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Concentric isometric calibration rings
    ctx.strokeStyle = 'rgba(230, 196, 101, 0.28)';
    ctx.lineWidth = 2;
    [180, 320, 440].forEach((radius) => {
      ctx.beginPath();
      ctx.arc(512, 512, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  }, []);

  // Initialize Three.js Scene Once
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0B241E');
    scene.fog = new THREE.FogExp2('#0B241E', 0.042);

    // Cameras: Perspective & Orthographic Isometric
    const perspCamera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    perspCamera.position.set(4.2, 3.3, 4.6);

    const frustumSize = 5.6;
    const orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    orthoCamera.position.set(5.5, 5.5, 5.5);

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight('#D4E8DC', '#0A1F1A', 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF3D6', 2.4);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    const d = 5.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#2EE58D', 1.5);
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Controls
    const controls = new OrbitControls(perspCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.0, 0);
    controls.minDistance = 2.4;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;

    // Ground Calibration Pad (offset slightly on Y to prevent coplanar z-fighting)
    const gridTex = createTechnicalGridTexture(renderer.capabilities.getMaxAnisotropy());
    const padGeo = new THREE.CylinderGeometry(4.8, 5.0, 0.14, 64);
    const padMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.65,
      metalness: 0.2,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.y = -0.07;
    padMesh.receiveShadow = true;
    scene.add(padMesh);

    // Contact shadow plane directly beneath hero assembly
    const contactCanvas = document.createElement('canvas');
    contactCanvas.width = 256;
    contactCanvas.height = 256;
    const cCtx = contactCanvas.getContext('2d')!;
    const grad = cCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    cCtx.fillStyle = grad;
    cCtx.fillRect(0, 0, 256, 256);
    const contactTex = new THREE.CanvasTexture(contactCanvas);
    const contactPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.01;
    scene.add(contactPlane);

    // Custom GLSL Shader Materials
    const fireShaderMat = new THREE.ShaderMaterial({
      uniforms: {time: {value: 0}, intensity: {value: 1.0}},
      vertexShader: FIRE_VERTEX_SHADER,
      fragmentShader: FIRE_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const waterShaderMat = new THREE.ShaderMaterial({
      uniforms: {time: {value: 0}, intensity: {value: 1.0}},
      vertexShader: WATER_VERTEX_SHADER,
      fragmentShader: WATER_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const plasmaShaderMat = new THREE.ShaderMaterial({
      uniforms: {time: {value: 0}, intensity: {value: 1.0}},
      vertexShader: PLASMA_VERTEX_SHADER,
      fragmentShader: PLASMA_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const wireframeBlueprintMat = new THREE.MeshStandardMaterial({
      color: '#4FFFB0',
      emissive: '#107C4F',
      emissiveIntensity: 0.55,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });

    // PBR Structural Materials
    const forestAnodizedMat = new THREE.MeshPhysicalMaterial({
      color: '#174C3F',
      metalness: 0.82,
      roughness: 0.24,
      clearcoat: 0.4,
    });

    const brushedGoldMat = new THREE.MeshPhysicalMaterial({
      color: '#E6C465',
      metalness: 0.92,
      roughness: 0.18,
    });

    const obsidianIronMat = new THREE.MeshStandardMaterial({
      color: '#18221F',
      metalness: 0.65,
      roughness: 0.52,
    });

    const frostedGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#D8F5E7',
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.12,
      ior: 1.52,
      thickness: 1.2,
      depthWrite: false,
    });

    // ========================================================================
    // 1. ANATOMY GROUP (8-PART COMPOSITE PROCEDURAL MODEL WITH SPRING PHYSICS)
    // ========================================================================
    const anatomyGroup = new THREE.Group();
    scene.add(anatomyGroup);

    const partMeshesMap = new Map<string, THREE.Object3D>();
    const partSpringsMap = new Map<string, SpringState>();
    const raycastTargets: THREE.Object3D[] = [];

    // Build distinct multi-part geometry for each of the 8 parts
    const buildAnatomyMeshes = (assembly: VardaProductAssembly) => {
      while (anatomyGroup.children.length > 0) {
        anatomyGroup.remove(anatomyGroup.children[0]);
      }
      partMeshesMap.clear();
      partSpringsMap.clear();
      raycastTargets.length = 0;

      assembly.parts.forEach((part) => {
        const partHolder = new THREE.Group();
        partHolder.userData = {partId: part.id, isAnatomyPart: true};

        if (part.id === 'outer-glass-shield') {
          // Translucent frosted glass cube with chamfered frame bars (inspired by IMG_5646)
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(2.35, 2.25, 2.05),
            frostedGlassMat
          );
          box.renderOrder = 3;
          partHolder.add(box);

          const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(box.geometry),
            new THREE.LineBasicMaterial({color: '#67F2B0', transparent: true, opacity: 0.45})
          );
          partHolder.add(edges);
          box.userData = {partId: part.id};
          raycastTargets.push(box);
        } else if (part.id === 'plasma-toroid-core') {
          // Toroidal plasma inductor + inner spinning rotor rings
          const torus = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.46, 0.13, 96, 24, 2, 3),
            plasmaShaderMat
          );
          torus.castShadow = true;
          torus.userData = {partId: part.id, shaderCategory: 'plasma'};
          partHolder.add(torus);

          const outerRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.76, 0.04, 16, 64),
            brushedGoldMat
          );
          outerRing.rotation.x = Math.PI / 2;
          outerRing.userData = {partId: part.id};
          partHolder.add(outerRing);
          raycastTargets.push(torus, outerRing);
        } else if (part.id === 'lifepo4-blade-west' || part.id === 'lifepo4-blade-east') {
          // Prismatic LiFePO4 battery module with cooling fins & brass terminals
          const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.46, 1.35, 1.25),
            forestAnodizedMat.clone()
          );
          body.castShadow = true;
          body.receiveShadow = true;
          body.userData = {partId: part.id};
          partHolder.add(body);

          const terminalA = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.18, 20),
            brushedGoldMat
          );
          terminalA.position.set(0, 0.74, -0.35);
          terminalA.userData = {partId: part.id};
          partHolder.add(terminalA);

          const terminalB = terminalA.clone();
          terminalB.position.set(0, 0.74, 0.35);
          partHolder.add(terminalB);
          raycastTargets.push(body);
        } else if (part.id === 'thermal-fire-heatsink') {
          // Solar thermal manifold with evacuated tubes & custom GLSL Fire shader core
          const core = new THREE.Mesh(
            new THREE.CylinderGeometry(0.42, 0.42, 1.28, 32, 24),
            fireShaderMat
          );
          core.rotation.z = Math.PI / 2;
          core.userData = {partId: part.id, shaderCategory: 'fire'};
          partHolder.add(core);

          for (let i = -2; i <= 2; i++) {
            const fin = new THREE.Mesh(
              new THREE.TorusGeometry(0.48, 0.025, 12, 32),
              brushedGoldMat
            );
            fin.rotation.y = Math.PI / 2;
            fin.position.x = i * 0.24;
            fin.userData = {partId: part.id};
            partHolder.add(fin);
          }
          raycastTargets.push(core);
        } else if (part.id === 'hydro-cooling-loop') {
          // Hydro catchment cylinder with animated GLSL Water wave shader
          const waterTank = new THREE.Mesh(
            new THREE.CylinderGeometry(0.52, 0.52, 0.72, 36, 24),
            waterShaderMat
          );
          waterTank.userData = {partId: part.id, shaderCategory: 'water'};
          partHolder.add(waterTank);

          const collar = new THREE.Mesh(
            new THREE.TorusGeometry(0.54, 0.035, 16, 48),
            forestAnodizedMat.clone()
          );
          collar.rotation.x = Math.PI / 2;
          collar.position.y = 0.34;
          collar.userData = {partId: part.id};
          partHolder.add(collar);
          raycastTargets.push(waterTank);
        } else if (part.id === 'payshap-nfc-terminal') {
          // Tactile emerald wallet/card NFC terminal inspired by IMG_5648 & IMG_5649
          const walletBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.68, 0.58, 0.16),
            new THREE.MeshPhysicalMaterial({
              color: '#19B86B',
              roughness: 0.28,
              metalness: 0.25,
              clearcoat: 0.6,
            })
          );
          walletBody.userData = {partId: part.id};
          partHolder.add(walletBody);

          const smartCard = new THREE.Mesh(
            new THREE.BoxGeometry(0.52, 0.34, 0.04),
            brushedGoldMat
          );
          smartCard.position.set(0.12, 0.18, 0.11);
          smartCard.rotation.z = -0.12;
          smartCard.userData = {partId: part.id};
          partHolder.add(smartCard);
          raycastTargets.push(walletBody, smartCard);
        } else {
          // Seismic Base Plinth + Busbar
          const plinth = new THREE.Mesh(
            new THREE.BoxGeometry(2.45, 0.28, 2.15),
            obsidianIronMat
          );
          plinth.castShadow = true;
          plinth.receiveShadow = true;
          plinth.userData = {partId: part.id};
          partHolder.add(plinth);
          raycastTargets.push(plinth);
        }

        const initPos = new THREE.Vector3(...part.defaultPosition);
        partHolder.position.copy(initPos);
        anatomyGroup.add(partHolder);
        partMeshesMap.set(part.id, partHolder);

        partSpringsMap.set(part.id, {
          pos: initPos.clone(),
          vel: new THREE.Vector3(),
          target: initPos.clone(),
          scale: 1,
          scaleVel: 0,
          targetScale: 1,
        });
      });
    };

    buildAnatomyMeshes(VARDA_ASSEMBLIES[0]);

    // ========================================================================
    // 2. SCENE EDITOR GROUP (DRAG-AND-DROP ASSETS & REACTIVE COLLISIONS)
    // ========================================================================
    const editorGroup = new THREE.Group();
    editorGroup.visible = false;
    scene.add(editorGroup);

    // Central orbital micro-grid ring connecting the nodes (inspired by IMG_5649)
    const orbitalTrack = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.06, 16, 96),
      new THREE.MeshPhysicalMaterial({
        color: '#9BE8C5',
        transmission: 0.75,
        transparent: true,
        roughness: 0.15,
      })
    );
    orbitalTrack.rotation.x = Math.PI / 2;
    orbitalTrack.position.y = 0.08;
    editorGroup.add(orbitalTrack);

    const nodeMeshesMap = new Map<
      string,
      {
        root: THREE.Group;
        ring: THREE.Mesh;
        rotor: THREE.Object3D;
        vel: THREE.Vector3;
      }
    >();
    const editorDragTargets: THREE.Object3D[] = [];

    const syncEditorNodes = (nodes: SceneAssetNode[]) => {
      // Remove deleted nodes
      for (const [uid, entry] of nodeMeshesMap.entries()) {
        if (!nodes.some((n) => n.uid === uid)) {
          editorGroup.remove(entry.root);
          nodeMeshesMap.delete(uid);
        }
      }

      editorDragTargets.length = 0;

      nodes.forEach((node) => {
        let entry = nodeMeshesMap.get(node.uid);
        if (!entry) {
          const root = new THREE.Group();
          root.position.set(node.position[0], 0, node.position[2]);
          root.userData = {nodeUid: node.uid};

          // Base pedestal
          const pedestal = new THREE.Mesh(
            new THREE.CylinderGeometry(node.radius * 0.78, node.radius * 0.85, 0.22, 32),
            obsidianIronMat
          );
          pedestal.position.y = 0.11;
          pedestal.castShadow = true;
          pedestal.receiveShadow = true;
          pedestal.userData = {nodeUid: node.uid};
          root.add(pedestal);

          // Main functional core according to template
          let rotor: THREE.Object3D;
          if (node.templateId === 'solar-core') {
            rotor = new THREE.Mesh(
              new THREE.TorusKnotGeometry(0.38, 0.11, 64, 16),
              plasmaShaderMat
            );
            rotor.position.y = 0.85;
          } else if (node.templateId === 'hydro-tank') {
            rotor = new THREE.Mesh(
              new THREE.CylinderGeometry(0.48, 0.48, 0.95, 32, 16),
              waterShaderMat
            );
            rotor.position.y = 0.7;
          } else if (node.templateId === 'thermal-geyser') {
            rotor = new THREE.Mesh(
              new THREE.SphereGeometry(0.46, 32, 24),
              fireShaderMat
            );
            rotor.position.y = 0.78;
          } else if (node.templateId === 'pay-vault') {
            rotor = new THREE.Mesh(
              new THREE.BoxGeometry(0.75, 0.65, 0.28),
              new THREE.MeshPhysicalMaterial({
                color: '#19B86B',
                metalness: 0.35,
                roughness: 0.22,
                clearcoat: 0.8,
              })
            );
            rotor.position.y = 0.68;
          } else {
            rotor = new THREE.Mesh(
              new THREE.OctahedronGeometry(0.46, 1),
              wireframeBlueprintMat
            );
            rotor.position.y = 0.75;
          }
          rotor.castShadow = true;
          rotor.userData = {nodeUid: node.uid};
          root.add(rotor);

          // Collision / Selection Perimeter Ring on Ground
          const ringMat = new THREE.MeshBasicMaterial({
            color: '#2EE58D',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
          });
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(node.radius * 0.92, node.radius, 48),
            ringMat
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = 0.03;
          root.add(ring);

          editorGroup.add(root);
          entry = {root, ring, rotor, vel: new THREE.Vector3()};
          nodeMeshesMap.set(node.uid, entry);
        }

        entry.root.children.forEach((child) => {
          child.userData = {nodeUid: node.uid};
          editorDragTargets.push(child);
        });
      });
    };

    syncEditorNodes(INITIAL_SCENE_NODES);

    // ========================================================================
    // POINTER RAYCASTING & DRAG-AND-DROP INTERACTION
    // ========================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let draggingNodeUid: string | null = null;
    let lastCollisionHash = '';
    let lastDragAudioTime = 0;
    let lastAudioX = 0;
    let lastAudioZ = 0;

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointer(e);
      const activeCam = stateRef.current.isIsometric ? orthoCamera : perspCamera;
      raycaster.setFromCamera(pointer, activeCam);

      if (stateRef.current.workspaceMode === 'anatomy') {
        const hits = raycaster.intersectObjects(raycastTargets, false);
        if (hits.length > 0) {
          const hitPartId = hits[0].object.userData.partId;
          if (hitPartId) {
            setSelectedPartId(hitPartId);
            playTactileTone('select');
            const spring = partSpringsMap.get(hitPartId);
            if (spring) {
              spring.scaleVel += 1.6; // Tactile spring impulse on click
            }
          }
        }
      } else {
        const hits = raycaster.intersectObjects(editorDragTargets, false);
        if (hits.length > 0) {
          const uid = hits[0].object.userData.nodeUid;
          if (uid) {
            draggingNodeUid = uid;
            setSelectedNodeUid(uid);
            controls.enabled = false;
            renderer.domElement.style.cursor = 'grabbing';
            const entry = nodeMeshesMap.get(uid);
            if (entry) {
              lastAudioX = entry.root.position.x;
              lastAudioZ = entry.root.position.z;
            }
            playTactileTone('dragstart');
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e);
      const activeCam = stateRef.current.isIsometric ? orthoCamera : perspCamera;

      if (draggingNodeUid && stateRef.current.workspaceMode === 'scene-editor') {
        raycaster.setFromCamera(pointer, activeCam);
        if (raycaster.ray.intersectPlane(_groundPlane, _dragIntersect)) {
          const clampedX = THREE.MathUtils.clamp(_dragIntersect.x, -3.7, 3.7);
          const clampedZ = THREE.MathUtils.clamp(_dragIntersect.z, -3.7, 3.7);

          const finalX = stateRef.current.snapToGrid
            ? Math.round(clampedX * 2) / 2
            : clampedX;
          const finalZ = stateRef.current.snapToGrid
            ? Math.round(clampedZ * 2) / 2
            : clampedZ;

          const entry = nodeMeshesMap.get(draggingNodeUid);
          if (entry) {
            entry.root.position.set(finalX, 0, finalZ);
          }

          // Trigger subtle micro-tick audio feedback when dragging across space
          const distMoved = Math.hypot(finalX - lastAudioX, finalZ - lastAudioZ);
          const now = performance.now();
          if (distMoved >= 0.35 && now - lastDragAudioTime > 85) {
            lastDragAudioTime = now;
            lastAudioX = finalX;
            lastAudioZ = finalZ;
            playTactileTone('dragmove');
          }

          setSceneNodes((prev) =>
            prev.map((n) =>
              n.uid === draggingNodeUid
                ? {
                    ...n,
                    position: [
                      Number(finalX.toFixed(2)),
                      0,
                      Number(finalZ.toFixed(2)),
                    ],
                  }
                : n
            )
          );
        }
      }
    };

    const onPointerUp = () => {
      if (draggingNodeUid) {
        if (stateRef.current.snapToGrid) {
          playTactileTone('snap');
        } else {
          playTactileTone('drop');
        }
        draggingNodeUid = null;
        controls.enabled = true;
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Pre-compile shaders
    renderer.compile(scene, perspCamera);
    setWebglReady(true);

    // Track assembly changes inside loop
    let currentBuiltAssemblyId = VARDA_ASSEMBLIES[0].id;

    // ========================================================================
    // ANIMATION, SPRING PHYSICS & REACTIVE COLLISION LOOP
    // ========================================================================
    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // Update GLSL Shader Uniforms
      fireShaderMat.uniforms.time.value = elapsed;
      waterShaderMat.uniforms.time.value = elapsed;
      plasmaShaderMat.uniforms.time.value = elapsed;

      // Rebuild anatomy meshes if user switched product assembly
      if (st.selectedAssemblyId !== currentBuiltAssemblyId) {
        currentBuiltAssemblyId = st.selectedAssemblyId;
        const found =
          VARDA_ASSEMBLIES.find((a) => a.id === st.selectedAssemblyId) ||
          VARDA_ASSEMBLIES[0];
        buildAnatomyMeshes(found);
      }

      // Sync editor nodes if count changed
      if (nodeMeshesMap.size !== st.sceneNodes.length) {
        syncEditorNodes(st.sceneNodes);
      }

      // Toggle workspace visibility
      anatomyGroup.visible = st.workspaceMode === 'anatomy';
      editorGroup.visible = st.workspaceMode === 'scene-editor';

      if (st.workspaceMode === 'anatomy') {
        const assembly =
          VARDA_ASSEMBLIES.find((a) => a.id === st.selectedAssemblyId) ||
          VARDA_ASSEMBLIES[0];

        assembly.parts.forEach((part) => {
          const holder = partMeshesMap.get(part.id);
          const spring = partSpringsMap.get(part.id);
          if (!holder || !spring) return;

          const isSelected = st.selectedPartId === part.id;

          // Compute target position using Explode Factor + selection lift
          _targetVec3.set(
            part.defaultPosition[0] + part.explodeOffset[0] * st.explodeFactor,
            part.defaultPosition[1] +
              part.explodeOffset[1] * st.explodeFactor +
              (isSelected ? 0.14 : 0),
            part.defaultPosition[2] + part.explodeOffset[2] * st.explodeFactor
          );
          spring.target.copy(_targetVec3);
          spring.targetScale = isSelected ? 1.07 : 1.0;

          // Second-order Spring Physics (F = -k*x - c*v)
          const stiffness = 135;
          const damping = 14;

          _tempVec3.subVectors(spring.target, spring.pos).multiplyScalar(stiffness);
          spring.vel.addScaledVector(_tempVec3, dt);
          spring.vel.multiplyScalar(Math.exp(-damping * dt));
          spring.pos.addScaledVector(spring.vel, dt);
          holder.position.copy(spring.pos);

          const scaleForce = (spring.targetScale - spring.scale) * 160;
          spring.scaleVel += scaleForce * dt;
          spring.scaleVel *= Math.exp(-12 * dt);
          spring.scale += spring.scaleVel * dt;
          holder.scale.setScalar(spring.scale);

          // Individual part continuous rotation/motion
          if (part.rotationAxis && part.rotationSpeed) {
            holder.rotation[part.rotationAxis] += part.rotationSpeed * dt;
          }

          // Apply active shader override or wireframe mode
          holder.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (st.activeShader === 'wireframe') {
                mesh.material = wireframeBlueprintMat;
              } else if (st.activeShader === 'fire' && part.shaderCategory !== 'glass') {
                if (part.shaderCategory === 'fire' || isSelected) {
                  mesh.material = fireShaderMat;
                }
              } else if (st.activeShader === 'water' && part.shaderCategory !== 'glass') {
                if (part.shaderCategory === 'water' || isSelected) {
                  mesh.material = waterShaderMat;
                }
              } else if (st.activeShader === 'plasma' && part.shaderCategory !== 'glass') {
                if (part.shaderCategory === 'plasma') {
                  mesh.material = plasmaShaderMat;
                }
              }
            }
          });
        });
      } else {
        // ====================================================================
        // SCENE EDITOR: REAL-TIME BOUNDING-SPHERE COLLISION DETECTION & PHYSICS
        // ====================================================================
        const collisionPairs: string[] = [];
        const collidingUids = new Set<string>();

        const nodes = st.sceneNodes;
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          const entryA = nodeMeshesMap.get(a.uid);
          if (!entryA) continue;

          // Continuous rotor animation
          entryA.rotor.rotation.y += dt * 0.9;
          entryA.rotor.position.y = 0.72 + Math.sin(elapsed * 2.2 + i) * 0.05;

          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const entryB = nodeMeshesMap.get(b.uid);
            if (!entryB) continue;

            const dx = entryA.root.position.x - entryB.root.position.x;
            const dz = entryA.root.position.z - entryB.root.position.z;
            const dist = Math.hypot(dx, dz);
            const minDist = a.radius + b.radius;

            if (dist < minDist) {
              collidingUids.add(a.uid);
              collidingUids.add(b.uid);
              collisionPairs.push(`${a.label} ↔ ${b.label}`);

              // Reactive spring repulsion when user isn't actively holding the node
              if (draggingNodeUid !== a.uid && draggingNodeUid !== b.uid && dist > 0.001) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const nz = dz / dist;
                const push = overlap * 3.5 * dt;
                entryA.root.position.x = THREE.MathUtils.clamp(
                  entryA.root.position.x + nx * push,
                  -3.7,
                  3.7
                );
                entryA.root.position.z = THREE.MathUtils.clamp(
                  entryA.root.position.z + nz * push,
                  -3.7,
                  3.7
                );
                entryB.root.position.x = THREE.MathUtils.clamp(
                  entryB.root.position.x - nx * push,
                  -3.7,
                  3.7
                );
                entryB.root.position.z = THREE.MathUtils.clamp(
                  entryB.root.position.z - nz * push,
                  -3.7,
                  3.7
                );
              }
            }
          }
        }

        // Update perimeter ring colors based on collision / selection state
        for (const [uid, entry] of nodeMeshesMap.entries()) {
          const mat = entry.ring.material as THREE.MeshBasicMaterial;
          if (collidingUids.has(uid)) {
            mat.color.set('#EF4444'); // Crimson collision alert
            mat.opacity = 0.95;
          } else if (st.selectedNodeUid === uid) {
            mat.color.set('#E6C465'); // Ochre gold selected state
            mat.opacity = 0.9;
          } else {
            mat.color.set('#2EE58D'); // Normal emerald
            mat.opacity = 0.45;
          }
        }

        const nextHash = collisionPairs.join('|');
        if (nextHash !== lastCollisionHash) {
          if (collisionPairs.length > lastCollisionHash.split('|').filter(Boolean).length) {
            playTactileTone('collide');
          }
          lastCollisionHash = nextHash;
          setActiveCollisions(collisionPairs);
        }
      }

      controls.update();

      // Sync orthographic camera position/orientation with OrbitControls when Isometric mode is active
      if (st.isIsometric) {
        orthoCamera.position.copy(perspCamera.position);
        orthoCamera.quaternion.copy(perspCamera.quaternion);
        orthoCamera.lookAt(controls.target);
        renderer.render(scene, orthoCamera);
      } else {
        renderer.render(scene, perspCamera);
      }
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 600;
      const asp = w / h;

      perspCamera.aspect = asp;
      perspCamera.updateProjectionMatrix();

      orthoCamera.left = (-frustumSize * asp) / 2;
      orthoCamera.right = (frustumSize * asp) / 2;
      orthoCamera.top = frustumSize / 2;
      orthoCamera.bottom = -frustumSize / 2;
      orthoCamera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      controls.dispose();
      renderer.dispose();
    };
  }, [createTechnicalGridTexture, playTactileTone]);

  // Add a new 3D node into the scene editor from the drag-and-drop asset dock
  const handleAddSceneNode = (template: (typeof SCENE_NODE_TEMPLATES)[number]) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 1.2 + Math.random() * 1.4;
    const newNode: SceneAssetNode = {
      uid: `node-${Date.now()}`,
      templateId: template.templateId,
      label: template.label,
      shaderType: template.shaderType,
      position: [
        Number((Math.cos(angle) * dist).toFixed(2)),
        0,
        Number((Math.sin(angle) * dist).toFixed(2)),
      ],
      rotationY: 0,
      scale: 1,
      radius: template.radius,
      powerKw: template.powerKw,
      priceZar: template.priceZar,
    };
    setWorkspaceMode('scene-editor');
    setSceneNodes((prev) => [...prev, newNode]);
    setSelectedNodeUid(newNode.uid);
    playTactileTone('dock-spawn');
  };

  const handleRemoveSelectedNode = () => {
    if (sceneNodes.length <= 1) return;
    setSceneNodes((prev) => {
      const filtered = prev.filter((n) => n.uid !== selectedNodeUid);
      if (filtered.length > 0) {
        setSelectedNodeUid(filtered[0].uid);
      }
      return filtered;
    });
  };

  const totalSceneZar = sceneNodes.reduce((acc, n) => acc + n.priceZar, 0);
  const netScenePowerKw = sceneNodes.reduce((acc, n) => acc + n.powerKw, 0);

  return (
    <section
      id="spatial-studio"
      className="relative w-full rounded-2xl overflow-hidden border border-[#144239]/20 bg-[#0B241E] text-[#F4F3EC] shadow-xl"
    >
      {/* Top Minimal Viewport Header Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-[#0E2D26] border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-serif text-lg font-semibold tracking-tight text-[#F4F3EC] whitespace-nowrap">
            {workspaceMode === 'anatomy'
              ? currentAssembly.name
              : 'Varda Rooftop Micro-Grid Spatial Configurator'}
          </span>
          <span className="hidden sm:inline-block text-xs text-[#C4C6AF]">·</span>
          <span className="hidden sm:inline-block text-xs font-mono tabular-nums text-[#E6C465]">
            {workspaceMode === 'anatomy'
              ? `R ${currentAssembly.priceZar.toLocaleString('en-ZA')} (${currentAssembly.lowBandwidthSizeKb} KB Mesh)`
              : `${sceneNodes.length} Modules · Net ${netScenePowerKw >= 0 ? '+' : ''}${netScenePowerKw.toFixed(1)} kW · R ${totalSceneZar.toLocaleString('en-ZA')}`}
          </span>
        </div>

        {/* Workspace Mode Switcher & Camera Preset Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-[#091D18] border border-white/10">
            <button
              type="button"
              onClick={() => setWorkspaceMode('anatomy')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                workspaceMode === 'anatomy'
                  ? 'bg-[#19B86B] text-[#082019] font-semibold'
                  : 'text-[#C4C6AF] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3D Anatomy & Shaders
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('scene-editor')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                workspaceMode === 'scene-editor'
                  ? 'bg-[#E6C465] text-[#091D18] font-semibold'
                  : 'text-[#C4C6AF] hover:text-white'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              Drag & Collision Scene
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsIsometric((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isIsometric
                ? 'bg-[#E6C465] text-[#0B241E] border-[#E6C465]'
                : 'bg-[#12382F] text-[#F4F3EC] border-white/15 hover:bg-[#18493E]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {isIsometric ? 'Isometric Ortho' : 'Perspective 3D'}
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label="Toggle tactile audio"
            className="p-2 rounded-lg bg-[#12382F] text-[#C4C6AF] hover:text-white border border-white/10"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main 3D Viewport Container (100% unobstructed center) */}
      <div
        className="relative w-full h-[460px] sm:h-[560px] lg:h-[640px] select-none"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const tplId = e.dataTransfer.getData('text/plain');
          const found = SCENE_NODE_TEMPLATES.find((t) => t.templateId === tplId);
          if (found) {
            handleAddSceneNode(found);
          }
        }}
      >
        {/* Dedicated Empty WebGL Canvas Mount Ref with touch-none for smooth mobile interaction */}
        <div
          ref={canvasMountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        />

        {!webglReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B241E] text-[#C4C6AF] gap-2">
            <Cpu className="w-8 h-8 text-[#19B86B]" />
            <p className="text-sm font-medium">
              Initializing Three.js WebGL Studio & GLSL Shaders...
            </p>
          </div>
        )}

        {/* Top-Left Compact Telemetry Spec Strip (Unobtrusive & responsive on mobile) */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-auto max-w-[calc(100%-1.5rem)] sm:max-w-sm bg-[#0D2A23]/95 border border-white/15 rounded-xl p-3 sm:p-3.5 shadow-lg">
          {workspaceMode === 'anatomy' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs text-[#C4C6AF]">
                <span>Selected Component Anatomy</span>
                <span className="font-mono tabular-nums text-[#E6C465]">
                  {currentPart.massKg} kg
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">{currentPart.name}</h3>
              <p className="text-xs text-[#C4C6AF]">
                {currentPart.role} · {currentPart.materialSpec}
              </p>
              <div className="pt-1 flex items-center justify-between text-xs font-mono tabular-nums text-[#4FFFB0]">
                <span>{currentPart.telemetry}</span>
                <span>Shader: {lowBandwidthMode ? 'WIREFRAME' : activeShader.toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs text-[#C4C6AF]">
                <span>Real-Time Collision & Physics Engine</span>
                <span className="font-mono tabular-nums text-[#E6C465]">
                  {activeCollisions.length === 0 ? 'CLEAR' : `${activeCollisions.length} OVERLAP`}
                </span>
              </div>
              {activeCollisions.length > 0 ? (
                <div className="p-2 rounded-lg bg-[#4C1414] border border-[#EF4444]/50 text-xs text-[#FCA5A5] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">
                      Bounding-Sphere Collision Detected
                    </p>
                    <p className="font-mono text-[11px]">{activeCollisions[0]}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#C4C6AF]">
                  Drag 3D modules across the pad or drop new nodes from the bottom dock. Spring
                  repulsion prevents structural overlap.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Unified Bottom Control Dock */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-[940px] transition-transform duration-200"
          style={{
            transform: dockCollapsed
              ? 'translate(-50%, calc(100% - 36px))'
              : 'translate(-50%, 0)',
          }}
        >
          {/* Collapse / Expand Handle */}
          <div className="flex justify-center mb-1.5">
            <button
              type="button"
              onClick={() => setDockCollapsed((c) => !c)}
              className="px-3.5 py-1 rounded-full bg-[#0E2D26] border border-white/15 text-xs font-medium text-[#C4C6AF] hover:text-white flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0"
            >
              {dockCollapsed ? (
                <>
                  <Maximize2 className="w-3 h-3" />▴ Show 3D Controls
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3" />▾ Hide Controls (Zen Mode)
                </>
              )}
            </button>
          </div>

          {/* Dock Body */}
          <div className="bg-[#0E2D26]/95 border border-white/15 rounded-2xl p-4 shadow-2xl space-y-3.5">
            {workspaceMode === 'anatomy' ? (
              <>
                {/* Top Row: Assembly Selector, Shader Buttons, Explode Spring Slider, Checkout CTA */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Assembly Switcher */}
                  <div className="flex items-center gap-1.5">
                    {VARDA_ASSEMBLIES.map((asm) => (
                      <button
                        key={asm.id}
                        type="button"
                        onClick={() => {
                          setSelectedAssemblyId(asm.id);
                          setSelectedPartId(asm.parts[0].id);
                          setActiveShader(asm.recommendedShader);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          selectedAssemblyId === asm.id
                            ? 'bg-[#F4F3EC] text-[#0E2D26] font-semibold'
                            : 'bg-[#143D34] text-[#C4C6AF] hover:text-white'
                        }`}
                      >
                        {asm.id === 'karoo-inverter-vault'
                          ? 'Karoo-X8 Inverter'
                          : 'Drakensberg Hydro-Solar'}
                      </button>
                    ))}
                  </div>

                  {/* WebGL Shader Switcher (Fire, Water, Plasma, Isometric Wireframe, PBR) */}
                  <div className="flex items-center gap-1 bg-[#091D18] p-1 rounded-lg border border-white/10">
                    {(
                      [
                        {id: 'plasma', label: 'Plasma', icon: Zap},
                        {id: 'fire', label: 'Fire Core', icon: Flame},
                        {id: 'water', label: 'Hydro Wave', icon: Droplets},
                        {id: 'wireframe', label: 'Wireframe', icon: Box},
                        {id: 'pbr', label: 'Studio PBR', icon: Eye},
                      ] as const
                    ).map((sh) => {
                      const Icon = sh.icon;
                      const isActive = (lowBandwidthMode ? 'wireframe' : activeShader) === sh.id;
                      return (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => setActiveShader(sh.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ${
                            isActive
                              ? 'bg-[#19B86B] text-[#072018] font-semibold'
                              : 'text-[#C4C6AF] hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {sh.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Exploded View Spring Slider */}
                  <div className="flex items-center gap-2.5">
                    <label
                      htmlFor="explode-slider"
                      className="text-xs text-[#C4C6AF] whitespace-nowrap"
                    >
                      Explode Spring:
                    </label>
                    <input
                      id="explode-slider"
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={explodeFactor}
                      onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                      className="w-24 accent-[#E6C465] cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setExplodeFactor(explodeFactor > 0.5 ? 0 : 0.85)}
                      className="px-2.5 py-1 rounded-md bg-[#143D34] text-xs text-[#E6C465] hover:bg-[#1B4F43] whitespace-nowrap shrink-0"
                    >
                      {explodeFactor > 0.5 ? 'Assemble' : 'Explode All'}
                    </button>
                  </div>

                  {/* Direct SA Checkout Button */}
                  <button
                    type="button"
                    onClick={() =>
                      onSelectOrderForPayment({
                        name: currentAssembly.name,
                        description: currentAssembly.subtitle,
                        amountZar: currentAssembly.priceZar,
                      })
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-[#E6C465] hover:bg-[#f0cf73] text-[#0B241E] text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Order · R {currentAssembly.priceZar.toLocaleString('en-ZA')}
                  </button>
                </div>

                {/* Bottom Row: Interactive Part Anatomy Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {currentAssembly.parts.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => {
                        setSelectedPartId(part.id);
                        playTactileTone('select');
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap shrink-0 ${
                        selectedPartId === part.id
                          ? 'bg-[#19B86B]/25 border border-[#19B86B] text-white font-medium'
                          : 'bg-[#12352D] text-[#C4C6AF] hover:text-white border border-transparent'
                      }`}
                    >
                      {part.name}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Scene & Collision Editor Dock */
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#C4C6AF]">
                    <span className="font-semibold text-white">
                      Drag-and-Drop 3D Asset Library
                    </span>
                    <span>·</span>
                    <span>Click or drag onto the 3D pad to spawn & test collisions</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSnapToGrid((s) => !s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                        snapToGrid
                          ? 'bg-[#19B86B] text-[#082019] border-[#19B86B]'
                          : 'bg-[#12382F] text-[#C4C6AF] border-white/10'
                      }`}
                    >
                      {snapToGrid ? 'Grid Snap: 0.5m ON' : 'Free Physics Drag'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveSelectedNode}
                      className="px-2.5 py-1 rounded-lg bg-[#3A1818] hover:bg-[#522020] text-[#FCA5A5] text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => setSceneNodes(INITIAL_SCENE_NODES)}
                      className="px-2.5 py-1 rounded-lg bg-[#12382F] hover:bg-[#194B3F] text-[#C4C6AF] text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Scene
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectOrderForPayment({
                          name: `Custom Varda Micro-Grid Bundle (${sceneNodes.length} Modules)`,
                          description: sceneNodes.map((n) => n.label).join(' + '),
                          amountZar: totalSceneZar,
                        })
                      }
                      className="px-3.5 py-1 rounded-lg bg-[#E6C465] text-[#091D18] text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      Checkout Bundle · R {totalSceneZar.toLocaleString('en-ZA')}
                    </button>
                  </div>
                </div>

                {/* Draggable Asset Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SCENE_NODE_TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.templateId}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', tpl.templateId);
                        playTactileTone('dragstart');
                      }}
                      onClick={() => handleAddSceneNode(tpl)}
                      className="p-2.5 rounded-xl bg-[#12352D] hover:bg-[#18473C] border border-white/10 cursor-pointer transition-colors flex flex-col justify-between gap-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {tpl.label}
                        </span>
                        <Plus className="w-3.5 h-3.5 text-[#19B86B] shrink-0" />
                      </div>
                      <span className="text-[11px] text-[#C4C6AF] truncate">
                        {tpl.subtitle}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums text-[#E6C465]">
                        R {tpl.priceZar.toLocaleString('en-ZA')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
