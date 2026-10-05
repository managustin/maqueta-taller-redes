import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { B, px, pz, SECTIONS, FLOORS, RACKS, CORE_PORTS, BACKBONE } from './data.js';
import { lang, setLang, tr, num, applyStatic } from './i18n.js';

applyStatic();

// Textos de datos en el idioma actual
const secName = (s) => tr(SECTIONS[s].name, SECTIONS[s].en);
const floorName = (f) => tr(f.name, f.en);
const rackTitle = (rk) => tr(rk.title, rk.titleEn);
const unitDesc = (u) => tr(u[4], u[5]);

// ---------------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------------
const app = document.getElementById('app');
// Tamaño real de la vista. Puede valer 0 un instante (pestaña recién restaurada, ventana minimizada):
// en ese caso no se toca la cámara y se espera al próximo cambio de tamaño.
const viewSize = () => [app.clientWidth || window.innerWidth, app.clientHeight || window.innerHeight];

const loader = {
  el: document.getElementById('loading'),
  step(text, pct) {
    if (!this.el) return;
    document.getElementById('loadingMsg').textContent = text;
    document.getElementById('loadingBar').style.width = pct + '%';
  },
  fail(text) {
    if (!this.el) return;
    this.el.classList.add('error');
    document.getElementById('loadingMsg').textContent = text;
  },
  done() {
    if (!this.el) return;
    const el = this.el;
    this.el = null;
    el.classList.add('done');
    setTimeout(() => el.remove(), 450);
  },
};

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (e) {
  loader.fail(tr('Este navegador no puede mostrar gráficos 3D (WebGL). Pruebe con otro navegador o active la aceleración por hardware.',
    'This browser cannot display 3D graphics (WebGL). Try another browser or turn on hardware acceleration.'));
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// la escena es estática: el mapa de sombras se recalcula solo cuando algo cambia
renderer.shadowMap.autoUpdate = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
app.appendChild(labelRenderer.domElement);

// Render a demanda: solo se redibuja cuando algo cambió (cámara, capas, animaciones).
let needsRender = true, labelsDirty = true;
function invalidate() {
  needsRender = labelsDirty = true;
  renderer.shadowMap.needsUpdate = true;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9eef4');
scene.fog = new THREE.Fog('#e9eef4', 90, 220);

const camera = new THREE.PerspectiveCamera(40, 1.6, 0.2, 400);
camera.position.set(42, 30, 50);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.52;
controls.minDistance = 0.8;
controls.maxDistance = 140;
controls.target.set(7.5, 6, 12.5);
controls.addEventListener('change', () => { needsRender = labelsDirty = true; });

scene.add(new THREE.HemisphereLight('#ffffff', '#b6c2d1', 1.25));
const sun = new THREE.DirectionalLight('#ffffff', 1.7);
sun.position.set(38, 55, 26);
sun.target.position.set(7.5, 6, 12.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 28, bottom: -28, near: 1, far: 140 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);

// Terreno
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#dde4ec', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.25;
ground.receiveShadow = true;
scene.add(ground);
const lot = new THREE.Mesh(new THREE.PlaneGeometry(B.W + 10, B.L + 10), new THREE.MeshStandardMaterial({ color: '#cfd8e3', roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
lot.rotation.x = -Math.PI / 2;
lot.position.set(B.W / 2, -0.21, B.L / 2);
lot.receiveShadow = true;
scene.add(lot);

// ---------------------------------------------------------------------------
// Materiales
// ---------------------------------------------------------------------------
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...o });
// planos apoyados sobre otra superficie: se adelantan en profundidad para que no parpadeen
const decal = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
const clear = (color, opacity, o = {}) => std(color, { transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, ...o });

const M = {
  slab: std('#9aa8ba', { roughness: 0.95 }),
  finish: std('#f4f6f9', { roughness: 0.9 }),
  glass: clear('#9ec5e8', 0.08, { roughness: 0.1, metalness: 0.2 }),
  mullion: std('#475569', { metalness: 0.4, roughness: 0.4 }),
  structure: std('#b8c2cf', { roughness: 0.9 }),
  core: std('#c9d3df', { roughness: 0.95 }),
  stair: std('#e2e8f0'),
  lift: clear('#334155', 0.55),
  riser: clear('#ef4444', 0.13),
  riserPipe: std('#dc2626', { roughness: 0.5 }),
  seal: std('#ef4444', { roughness: 0.6 }),
  tray: std('#16a34a', { metalness: 0.45, roughness: 0.45 }),
  trayCable: std('#2563eb', { roughness: 0.6 }),
  support: std('#64748b', { metalness: 0.5, roughness: 0.4 }),
  conduit: std('#0284c7', { roughness: 0.5 }),
  column: std('#a5b4c6', { metalness: 0.3, roughness: 0.45 }),
  canal: std('#e5e9ef', { roughness: 0.6 }),
  rosette: std('#ffffff', { roughness: 0.4 }),
  patch: std('#16a34a', { roughness: 0.5 }),
  desk: std('#d9bf94', { roughness: 0.7 }),
  deskLeg: std('#3b4656', { metalness: 0.3, roughness: 0.5 }),
  monitor: std('#0f172a', { roughness: 0.4 }),
  screen: std('#0b3b5c', { emissive: '#0ea5e9', emissiveIntensity: 0.35, roughness: 0.3 }),
  pc: std('#334155', { roughness: 0.5 }),
  chairInit: std('#2563eb', { roughness: 0.6 }),
  chairGrowth: std('#f59e0b', { roughness: 0.6 }),
  chairBase: std('#1e293b', { metalness: 0.3, roughness: 0.5 }),
  kiosk: std('#f8fafc', { roughness: 0.5 }),
  rackBody: std('#111827', { metalness: 0.35, roughness: 0.5 }),
  rackPost: std('#4b5563', { metalness: 0.6, roughness: 0.35 }),
  device: std('#1f2937', { metalness: 0.5, roughness: 0.4 }),
  ef: std('#fde68a', { roughness: 0.6 }),
  hit: new THREE.MeshBasicMaterial({ visible: false }),
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Junta geometrías por material para que la escena tenga pocas llamadas de dibujo.
class Batch {
  constructor() { this.parts = new Map(); }
  push(mat, geo) {
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(geo);
  }
  box(mat, w, h, d, x, y, z, ry = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    this.push(mat, g);
  }
  cyl(mat, r, h, x, y, z, axis = 'y', seg = 10) {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    if (axis === 'x') g.rotateZ(Math.PI / 2);
    if (axis === 'z') g.rotateX(Math.PI / 2);
    g.translate(x, y, z);
    this.push(mat, g);
  }
  tube(mat, points, r, seg = 16) {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, 5, false);
    this.push(mat, g);
  }
  build(parent, { cast = true, receive = true } = {}) {
    for (const [mat, list] of this.parts) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast && !mat.transparent;
      mesh.receiveShadow = receive;
      parent.add(mesh);
      list.forEach((g) => g.dispose());
    }
    this.parts.clear();
  }
}

const labels = [];
// maxDist: a partir de esa distancia de la cámara la etiqueta se oculta (evita amontonamiento)
const MAXD = { '': 44, small: 20, room: 48, floor: 70 };
function label(text, cls, parent, x, y, z, maxDist = MAXD[cls || '']) {
  const el = document.createElement('div');
  el.className = 'lbl ' + (cls || '');
  el.textContent = typeof text === 'function' ? text() : text;
  const obj = new CSS2DObject(el);
  obj.position.set(x, y, z);
  obj.userData.want = true;
  obj.userData.text = text;
  obj.userData.maxDist = maxDist;
  obj.userData.minDist = cls === 'floor' ? 20 : 0;
  parent.add(obj);
  labels.push(obj);
  return obj;
}

function outline(parent, x0, z0, x1, z1, y, color) {
  const pts = [V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1), V(x0, y, z0)];
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color }));
  parent.add(line);
}

const clickables = [];
function clickable(obj, data) {
  obj.userData.pick = data;
  clickables.push(obj);
}

const layers = { facade: [], ceiling: [], furniture: [], zones: [], paths: [], backbone: [], labels: [] };
function layerGroup(name, parent) {
  const g = new THREE.Group();
  g.name = name;
  layers[name].push(g);
  parent.add(g);
  return g;
}

const pad = (n, l = 2) => String(n).padStart(l, '0');

// ---------------------------------------------------------------------------
// Texturas
// ---------------------------------------------------------------------------
function ceilingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f8fafc';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#94a3b8';
  g.lineWidth = 3;
  g.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(B.W / 0.6, B.L / 0.6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Frente de cada equipo del rack, dibujado en el canvas del rack con origen en (0, 0).
const FACE_W = 1024, FACE_U = 96;
function drawFace(g, type, id, h, opts = {}) {
  const W = FACE_W, H = FACE_U * h;
  const bg = { ODF: '#fff4e6', PP: '#dbeafe', ORG: '#334155', SW: '#1e1b4b', CORE: '#14123a', SRV: '#1e1b4b', RT: '#0f2e22', PDU: '#fde047', UPS: '#16191f', SV: '#1f2937', BLANK: '#1b2230' }[type];
  const dark = !['ODF', 'PP', 'PDU'].includes(type);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // orejas y tornillos
  g.fillStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  g.fillRect(0, 0, 40, H); g.fillRect(W - 40, 0, 40, H);
  g.fillStyle = '#9ca3af';
  for (const yy of [16, H - 16]) for (const xx of [20, W - 20]) { g.beginPath(); g.arc(xx, yy, 7, 0, 7); g.fill(); }
  // rótulo
  g.fillStyle = dark ? '#e2e8f0' : '#0f172a';
  g.font = `700 ${type === 'BLANK' ? 26 : 32}px Inter, sans-serif`;
  g.textBaseline = 'middle';
  g.fillText(type === 'BLANK' ? tr('RESERVA', 'SPARE') : id, 56, H / 2);

  const port = (x, y, w = 24, hh = 20, used = false) => {
    g.fillStyle = '#0b1220'; g.fillRect(x, y, w, hh);
    g.fillStyle = '#b08d2a'; g.fillRect(x + 5, y + 3, w - 10, 3);
    if (used) { g.fillStyle = '#22c55e'; g.fillRect(x + 2, y + hh + 2, w - 4, 4); }
  };
  const sfp = (x, y, used, w = 40, hh = 18) => {
    g.fillStyle = '#cbd5e1'; g.fillRect(x, y, w, hh);
    g.fillStyle = '#0b1220'; g.fillRect(x + 4, y + 4, w - 8, hh - 8);
    if (used) { g.fillStyle = '#22d3ee'; g.fillRect(x + 6, y + 5, w - 12, hh - 10); }
  };
  const led = (x, y, col = '#22c55e') => { g.fillStyle = col; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); };

  if (type === 'PP') {
    const used = opts.used ?? 24;
    for (let i = 0; i < 24; i++) port(330 + i * 26 + Math.floor(i / 6) * 10, H / 2 - 14, 22, 20, i < used);
    g.fillStyle = '#334155'; g.font = '500 16px Inter, sans-serif';
    g.fillText('Cat 6 · 24p', 56, H / 2 + 30 > H - 6 ? H - 10 : H / 2 + 30);
  } else if (type === 'SW' || type === 'SRV') {
    const cols = type === 'SW' ? 24 : 12;
    for (let r = 0; r < 2; r++) for (let i = 0; i < cols; i++) port(300 + i * 23 + Math.floor(i / 6) * 6, 14 + r * 38, 20, 18, true);
    const sx = 300 + cols * 23 + 40;
    const nS = type === 'SW' ? 4 : 2;
    for (let i = 0; i < nS; i++) sfp(sx + (i % 2) * 46, 14 + Math.floor(i / 2) * 38, i === 0);
    if (type === 'SW') { sfp(sx + 100, 14, false, 56, 20); sfp(sx + 100, 52, false, 56, 20); }
    for (let i = 0; i < 6; i++) led(240 + (i % 3) * 14, 30 + Math.floor(i / 3) * 30);
  } else if (type === 'CORE') {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) {
      const n = r * 8 + i + 1;
      sfp(420 + i * 62, 14 + r * 38, n <= 9, 48, 20);
    }
    port(330, 30, 30, 22, true);
    led(950, 30); led(950, 60, '#3b82f6');
  } else if (type === 'RT') {
    for (let i = 0; i < 10; i++) port(380 + i * 34, H / 2 - 12, 28, 22, i < 2);
    sfp(740, H / 2 - 10, false);
    led(820, H / 2, '#22c55e'); led(840, H / 2, '#f59e0b');
  } else if (type === 'ODF') {
    const n = opts.adapters ?? 6, used = opts.used ?? 3;
    for (let i = 0; i < n; i++) {
      const x = 360 + i * (n > 6 ? 48 : 80);
      g.fillStyle = i < used ? '#06b6d4' : '#7dd3fc';
      g.fillRect(x, H / 2 - 16, 36, 32);
      g.fillStyle = '#0f172a'; g.fillRect(x + 6, H / 2 - 8, 10, 16); g.fillRect(x + 20, H / 2 - 8, 10, 16);
    }
    g.fillStyle = '#9a3412'; g.font = '500 16px Inter, sans-serif';
    g.fillText('LC/UPC · OM3', 56, H - 14);
  } else if (type === 'ORG') {
    for (let i = 0; i < 5; i++) { g.fillStyle = '#0f172a'; g.fillRect(260 + i * 150, 18, 110, H - 36); g.fillStyle = '#475569'; g.fillRect(260 + i * 150, H / 2 - 3, 110, 6); }
  } else if (type === 'PDU') {
    for (let i = 0; i < 12; i++) { const x = 320 + i * 52; g.fillStyle = '#111827'; g.fillRect(x, H / 2 - 18, 38, 36); g.fillStyle = '#fde047'; g.fillRect(x + 8, H / 2 - 10, 6, 10); g.fillRect(x + 24, H / 2 - 10, 6, 10); g.fillRect(x + 16, H / 2 + 4, 6, 8); }
  } else if (type === 'UPS') {
    g.fillStyle = '#a7f3d0'; g.fillRect(560, H / 2 - 40, 190, 80);
    g.fillStyle = '#065f46'; g.font = '600 24px JetBrains Mono, monospace'; g.fillText('230V  ON', 580, H / 2);
    g.fillStyle = '#e5e7eb'; g.font = '700 26px Inter, sans-serif'; g.fillText('APC Smart-UPS', 56, H / 2 + 44 < H - 10 ? H / 2 + 44 : H - 14);
    for (let i = 0; i < 3; i++) { g.fillStyle = '#374151'; g.beginPath(); g.arc(800 + i * 44, H / 2, 14, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(320 + i * 5, 20, 2, H - 40); }
  } else if (type === 'SV') {
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
      const x = 330 + i * 140, y = 22 + r * 78;
      g.fillStyle = '#374151'; g.fillRect(x, y, 128, 66);
      g.fillStyle = '#111827'; g.fillRect(x + 8, y + 10, 112, 10);
      led(x + 112, y + 52, '#22c55e');
    }
    g.fillStyle = '#94a3b8'; g.font = '500 18px Inter, sans-serif'; g.fillText(opts.role || '', 56, H / 2 + 40);
    g.fillStyle = '#e5e7eb'; g.beginPath(); g.arc(940, H / 2, 16, 0, 7); g.fill();
    led(940, H / 2, '#3b82f6');
  } else if (type === 'BLANK') {
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 60; i++) g.fillRect(260 + i * 11, 22, 5, H - 44);
  }
}

// ---------------------------------------------------------------------------
// Puestos y cables (numeración del Anexo A)
// ---------------------------------------------------------------------------
const desks = [];
for (const f of FLOORS) {
  const rack = RACKS[f.rack];
  let cable = 0;
  const total = f.order.reduce((acc, s) => acc + f.rows.filter((r) => r.s === s).reduce((a, r) => a + r.xs.length * (r.single ? 1 : 2), 0), 0);
  f.totalCables = total;
  for (const s of f.order) {
    let num = 0;
    for (const row of f.rows.filter((r) => r.s === s)) {
      const xc = px(row.xs[row.col]);
      row.xs.forEach((xp, i) => {
        num++;
        const n = row.single ? 1 : 2;
        const cables = [];
        for (let k = 0; k < n; k++) {
          cable++;
          const pp = Math.ceil(cable / f.ppPorts);
          const port = ((cable - 1) % f.ppPorts) + 1;
          const sw = Math.ceil(pp / 2);
          cables.push({ c: cable, pp, port, sw, eth: ((pp - 1) % 2) * f.ppPorts + port, toma: n === 1 ? 'U' : (k ? 'B' : 'A') });
        }
        const x = px(xp), z = pz(row.y);
        const hOrtho = Math.abs(x - xc) + Math.abs(B.TRAY_X - xc) + Math.abs(z - rack.z) + Math.abs(B.TRAY_X - rack.x);
        desks.push({
          id: `P${f.n}-${s}-${pad(num)}`, floor: f.n, s, x, z, xc, isCol: i === row.col,
          growth: row.g.includes(i), single: !!row.single, cables, row,
          length: Math.ceil(hOrtho + 2.3 + 2.5 + 1.0 + 0.3), colDesk: `P${f.n}-${s}-${pad(num - i + row.col)}`,
        });
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Construcción de cada piso
// ---------------------------------------------------------------------------
const floorGroups = [];
const roomWalls = [];
const rackObjects = {};
const ceilTex = ceilingTexture();

function buildFloor(f) {
  const G = new THREE.Group();
  G.name = 'Piso ' + f.n;
  scene.add(G);
  const L = { facade: layerGroup('facade', G), ceiling: layerGroup('ceiling', G), furniture: layerGroup('furniture', G), zones: layerGroup('zones', G), paths: layerGroup('paths', G), labels: layerGroup('labels', G) };
  const base = new Batch(), fac = new Batch(), fur = new Batch(), pth = new Batch();
  const rack = RACKS[f.rack];

  // Losa y solado
  base.box(M.slab, B.W, 0.18, B.L, B.W / 2, -0.11, B.L / 2);
  base.box(M.finish, B.W, 0.02, B.L, B.W / 2, -0.01, B.L / 2);

  // Fachada: columnas, montantes de carpintería y vidrio
  const hh = B.H - B.SLAB;
  for (const x of [0, 5, 10, 15]) for (const z of [0, 25]) fac.box(M.structure, 0.35, hh, 0.35, Math.min(Math.max(x, 0.17), 14.83), hh / 2, Math.min(Math.max(z, 0.17), 24.83));
  for (const z of [5, 10, 15, 20]) for (const x of [0, 15]) fac.box(M.structure, 0.35, hh, 0.35, x ? 14.83 : 0.17, hh / 2, z);
  for (let x = 1.25; x < B.W; x += 1.25) for (const z of [0.02, B.L - 0.02]) fac.box(M.mullion, 0.05, hh, 0.06, x, hh / 2, z);
  for (let z = 1.25; z < B.L; z += 1.25) for (const x of [0.02, B.W - 0.02]) fac.box(M.mullion, 0.06, hh, 0.05, x, hh / 2, z);
  for (const y of [0.05, 0.9, hh - 0.05]) {
    fac.box(M.mullion, B.W, 0.05, 0.06, B.W / 2, y, 0.02); fac.box(M.mullion, B.W, 0.05, 0.06, B.W / 2, y, B.L - 0.02);
    fac.box(M.mullion, 0.06, 0.05, B.L, 0.02, y, B.L / 2); fac.box(M.mullion, 0.06, 0.05, B.L, B.W - 0.02, y, B.L / 2);
  }
  fac.box(M.glass, B.W, hh, 0.02, B.W / 2, hh / 2, 0.02);
  fac.box(M.glass, B.W, hh, 0.02, B.W / 2, hh / 2, B.L - 0.02);
  fac.box(M.glass, 0.02, hh, B.L, 0.02, hh / 2, B.L / 2);
  fac.box(M.glass, 0.02, hh, B.L, B.W - 0.02, hh / 2, B.L / 2);

  // Núcleo de servicios 2 × 7 m: ascensor y escalera
  const cz0 = pz(1329), cz1 = B.L;
  base.box(M.core, 0.15, hh, cz1 - cz0, 1.925, hh / 2, (cz0 + cz1) / 2);
  base.box(M.core, 1.85, hh, 0.15, 0.925, hh / 2, cz0 + 0.075);
  base.box(M.core, 1.85, hh, 0.15, 0.925, hh / 2, cz0 + 2.3);
  // pasadizo del ascensor: separado unos cm de losas y muros para que ninguna cara quede coplanar
  base.box(M.lift, 1.6, hh - 0.06, 1.9, 0.95, hh / 2, cz0 + 1.2);
  base.box(M.structure, 1.0, 2.2, 0.012, 0.95, 1.1, cz0 - 0.008);
  base.box(M.mullion, 0.9, 2.1, 0.02, 0.95, 1.06, cz0 - 0.02);
  base.box(M.rackBody, 0.01, 2.1, 0.01, 0.95, 1.06, cz0 - 0.032);
  if (f.n === 1) base.box(M.rackPost, 1.4, 2.3, 1.6, 0.95, 1.2, cz0 + 1.2);
  for (let i = 0; i < 10; i++) {
    base.box(M.stair, 0.85, 0.16 * (i + 1), 0.28, 0.55, 0.08 * (i + 1), cz0 + 2.6 + i * 0.28);
    base.box(M.stair, 0.85, 0.16 * (i + 1) + 1.6, 0.28, 1.45, (0.16 * (i + 1) + 1.6) / 2, cz1 - 1.2 - i * 0.28);
  }
  base.box(M.stair, 1.69, 1.6, 1.0, 1, 0.8, cz1 - 0.6);
  label(() => tr('Núcleo · ascensor y escaleras', 'Core · elevator and stairs'), 'small', L.labels, 1, 2.2, 21.5);

  // Montante vertical M (CV12 / CV23) con sellado cortafuego
  const rx = px(320), rz = pz(1304);
  const riser = new THREE.Mesh(new THREE.BoxGeometry(0.74, B.H - 0.04, 0.74), M.riser);
  riser.position.set(rx, B.H / 2 - B.SLAB, rz);
  L.paths.add(riser);
  clickable(riser, { kind: 'riser' });
  for (const dx of [-0.15, 0, 0.15]) pth.cyl(M.riserPipe, 0.03, B.H, rx + dx, B.H / 2 - B.SLAB, rz + (dx ? -0.1 : 0.1));
  if (f.n > 1) pth.box(M.seal, 0.82, 0.22, 0.82, rx, -0.1, rz);
  label(() => tr('Montante M (CV)', 'Riser M (CV)'), 'small', L.labels, rx, 3.0, rz);

  // Recinto técnico
  const r = f.room;
  const wallMat = clear(r.color, 0.16);
  roomWalls.push({ mat: wallMat, group: G, c: V((r.x0 + r.x1) / 2, 1.6, (r.z0 + r.z1) / 2) });
  const rw = new Batch();
  rw.box(wallMat, r.x1 - r.x0, hh - 0.02, 0.08, (r.x0 + r.x1) / 2, hh / 2, r.z0);
  rw.box(wallMat, r.x1 - r.x0, hh - 0.02, 0.08, (r.x0 + r.x1) / 2, hh / 2, r.z1);
  rw.box(wallMat, 0.08, hh - 0.02, r.z1 - r.z0, r.x0, hh / 2, (r.z0 + r.z1) / 2);
  rw.box(wallMat, 0.08, hh - 0.02, r.z1 - r.z0, r.x1, hh / 2, (r.z0 + r.z1) / 2);
  rw.build(L.facade, { cast: false });
  const roomFloor = new THREE.Mesh(new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0), clear(r.color, 0.18, decal));
  roomFloor.rotation.x = -Math.PI / 2;
  roomFloor.position.set((r.x0 + r.x1) / 2, 0.012, (r.z0 + r.z1) / 2);
  G.add(roomFloor);
  clickable(roomFloor, { kind: 'room', floor: f.n });
  outline(G, r.x0, r.z0, r.x1, r.z1, 0.025, r.color);
  outline(L.facade, r.x0, r.z0, r.x1, r.z1, hh, r.color);
  label(() => tr(r.label, r.en), 'room', L.labels, (r.x0 + r.x1) / 2, hh + 0.1, r.z0);

  // Facilidad de entrada (solo piso 1)
  if (f.n === 1) {
    const ex0 = px(232), ex1 = px(295), ez0 = pz(1216), ez1 = pz(1290);
    const ef = new THREE.Mesh(new THREE.BoxGeometry(ex1 - ex0, 2.0, ez1 - ez0), M.ef);
    ef.position.set((ex0 + ex1) / 2, 1.0, (ez0 + ez1) / 2);
    ef.castShadow = true;
    G.add(ef);
    clickable(ef, { kind: 'ef' });
    label(() => tr('EF01 · Entrada ISP', 'EF01 · ISP entrance'), 'room', L.labels, (ex0 + ex1) / 2, 2.25, (ez0 + ez1) / 2);
  }

  // Zonas por sección (todas en una malla y un juego de líneas por piso)
  const zoneGeos = [], zoneLine = [], zoneLineCol = [];
  for (const s of f.order) {
    const ds = desks.filter((d) => d.floor === f.n && d.s === s);
    const x0 = Math.min(...ds.map((d) => d.x)) - 0.7, x1 = Math.max(...ds.map((d) => d.x)) + 0.7;
    const z0 = Math.min(...ds.map((d) => d.z)) - 0.35, z1 = Math.max(...ds.map((d) => d.z)) + 1.4;
    const col = SECTIONS[s].color;
    const c3 = new THREE.Color(col);
    const pg = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    pg.rotateX(-Math.PI / 2);
    pg.translate((x0 + x1) / 2, 0.01, (z0 + z1) / 2);
    pg.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pg.attributes.position.count).fill([c3.r, c3.g, c3.b]).flat(), 3));
    zoneGeos.push(pg);
    const cn = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    cn.forEach(([ax, az], i) => {
      const [bx, bz] = cn[(i + 1) % 4];
      zoneLine.push(ax, 0.02, az, bx, 0.02, bz);
      zoneLineCol.push(c3.r, c3.g, c3.b, c3.r, c3.g, c3.b);
    });
    const tomas = ds.reduce((a, d) => a + d.cables.length, 0);
    const txt = () => (s === 'SH'
      ? tr(`SH · Show Room · ${tomas} tomas`, `SH · Showroom · ${tomas} outlets`)
      : `${s} · ${secName(s)} · ${tr(`${ds.length} P / ${tomas} T`, `${ds.length} desks / ${tomas} outlets`)}`);
    const lb = label(txt, '', L.labels, (x0 + x1) / 2, 1.9, (z0 + z1) / 2);
    lb.element.style.borderColor = col;
  }

  L.zones.add(new THREE.Mesh(mergeGeometries(zoneGeos), clear('#ffffff', 0.13, { vertexColors: true, ...decal })));
  const zl = new THREE.BufferGeometry();
  zl.setAttribute('position', new THREE.Float32BufferAttribute(zoneLine, 3));
  zl.setAttribute('color', new THREE.Float32BufferAttribute(zoneLineCol, 3));
  L.zones.add(new THREE.LineSegments(zl, new THREE.LineBasicMaterial({ vertexColors: true })));

  // Puestos
  for (const d of desks.filter((d) => d.floor === f.n)) buildDesk(d, fur, pth, G);

  // Columnas de servicio, cablecanal y conduits por fila
  for (const row of f.rows) {
    const z = pz(row.y);
    const xs = row.xs.map(px);
    const xc = xs[row.col];
    const xa = Math.min(...xs) - 0.1, xb = Math.max(...xs) + 0.1;
    pth.box(M.canal, xb - xa, 0.04, 0.06, (xa + xb) / 2, 0.02, z - 0.03);
    pth.box(M.column, 0.1, B.CEIL + 0.04, 0.1, xc, (B.CEIL + 0.04) / 2, z - 0.09);
    const ty = 2.76;
    pth.cyl(M.conduit, 0.025, ty - B.CEIL + 0.03, xc, (ty + B.CEIL) / 2, z - 0.09);
    const xe = xc < B.TRAY_X ? B.TRAY_X - 0.1 : B.TRAY_X + 0.1;
    pth.cyl(M.conduit, 0.025, Math.abs(xe - xc), (xc + xe) / 2, ty, z - 0.09, 'x');
    pth.box(M.conduit, 0.06, 0.06, 0.06, xc, ty, z - 0.09);
  }

  // Bandeja portacables troncal (x = 9,80) y tramo E hasta el rack
  const trayRun = (x0, z0, x1, z1) => {
    const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y = B.TRAY;
    const w = 0.2, wall = 0.008;
    if (alongX) {
      pth.box(M.tray, len, wall, w, cx, y - 0.025, cz);
      pth.box(M.tray, len, 0.05, wall, cx, y, cz - w / 2);
      pth.box(M.tray, len, 0.05, wall, cx, y, cz + w / 2);
      pth.box(M.trayCable, len, 0.022, w - 0.03, cx, y - 0.01, cz);
    } else {
      pth.box(M.tray, w, wall, len, cx, y - 0.025, cz);
      pth.box(M.tray, wall, 0.05, len, cx - w / 2, y, cz);
      pth.box(M.tray, wall, 0.05, len, cx + w / 2, y, cz);
      pth.box(M.trayCable, w - 0.03, 0.022, len, cx, y - 0.01, cz);
    }
    for (let t = 0.3; t < len; t += 1.5) {
      const sx = alongX ? Math.min(x0, x1) + t : cx, sz = alongX ? cz : Math.min(z0, z1) + t;
      const top = B.H - B.SLAB;
      for (const o of [-0.13, 0.13]) pth.cyl(M.support, 0.008, top - y + 0.03, alongX ? sx : sx + o, (top + y) / 2, alongX ? sz + o : sz, 'y', 6);
      pth.box(M.support, alongX ? 0.03 : 0.3, 0.02, alongX ? 0.3 : 0.03, sx, y - 0.04, sz);
    }
  };
  trayRun(B.TRAY_X, f.tray.z0, B.TRAY_X, f.tray.z1);
  trayRun(rack.x, rack.z, B.TRAY_X, rack.z);
  // bajada vertical (escalerilla) hasta el rack
  const drops = f.n === 3 ? [RACKS.R03, RACKS.R04] : [rack];
  for (const rk of drops) {
    for (const o of [-0.1, 0.1]) pth.box(M.tray, 0.01, B.TRAY - 1.25, 0.04, rk.x + o, (B.TRAY + 1.25) / 2, rk.z - 0.3);
    for (let y = 1.4; y < B.TRAY; y += 0.3) pth.box(M.tray, 0.2, 0.015, 0.03, rk.x, y, rk.z - 0.3);
  }
  const trayHit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, f.tray.z1 - f.tray.z0), M.hit);
  trayHit.position.set(B.TRAY_X, B.TRAY, (f.tray.z0 + f.tray.z1) / 2);
  L.paths.add(trayHit);
  clickable(trayHit, { kind: 'tray', floor: f.n });
  label(`T${f.n}-N`, 'small', L.labels, B.TRAY_X + 0.3, B.TRAY + 0.15, (f.tray.z0 + rack.z) / 2);
  label(`T${f.n}-S`, 'small', L.labels, B.TRAY_X + 0.3, B.TRAY + 0.15, (rack.z + f.tray.z1) / 2);

  // Cielorraso suspendido
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(B.W, B.L), new THREE.MeshStandardMaterial({ map: ceilTex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(B.W / 2, B.CEIL, B.L / 2);
  L.ceiling.add(ceil);

  label(() => `${floorName(f).toUpperCase()} · ${tr('N.P.T.', 'FFL')} ${f.n === 1 ? '±' + num(0) : '+' + num((f.n - 1) * B.H)} m`, 'floor', L.labels, -0.6, 0.4, -0.6);

  base.build(G);
  fac.build(L.facade, { cast: false });
  fur.build(L.furniture);
  pth.build(L.paths);

  // Racks del piso
  for (const [id, rk] of Object.entries(RACKS)) if (rk.floor === f.n) G.add(buildRack(id, rk, f));

  floorGroups.push(G);
  return G;
}

function buildDesk(d, fur, pth, G) {
  const { x, z } = d;
  const xs = d.row.xs.map(px);
  const spacing = xs.length > 1 ? Math.min(...xs.slice(1).map((v, i) => v - xs[i])) : 1.3;
  const dw = Math.min(1.1, spacing - 0.12);

  if (d.single) {
    // Exhibidor del Show Room con una toma
    fur.box(M.kiosk, 0.55, 0.95, 0.4, x, 0.475, z + 0.4);
    fur.box(M.monitor, 0.6, 0.38, 0.04, x, 1.25, z + 0.3);
    fur.box(M.screen, 0.55, 0.33, 0.01, x, 1.25, z + 0.325);
    fur.box(M.deskLeg, 0.05, 0.3, 0.05, x, 1.0, z + 0.28);
  } else {
    fur.box(M.desk, dw, 0.03, 0.62, x, 0.735, z + 0.4);
    for (const o of [-1, 1]) fur.box(M.deskLeg, 0.03, 0.72, 0.56, x + o * (dw / 2 - 0.03), 0.36, z + 0.4);
    fur.box(M.deskLeg, dw - 0.08, 0.3, 0.015, x, 0.55, z + 0.15);
    fur.box(M.monitor, 0.52, 0.32, 0.03, x - 0.08, 1.03, z + 0.2);
    fur.box(M.screen, 0.48, 0.28, 0.005, x - 0.08, 1.03, z + 0.217);
    fur.box(M.monitor, 0.04, 0.2, 0.04, x - 0.08, 0.83, z + 0.18);
    fur.box(M.monitor, 0.2, 0.012, 0.14, x - 0.08, 0.756, z + 0.2);
    fur.box(M.pc, 0.17, 0.38, 0.38, x + dw / 2 - 0.15, 0.94, z + 0.32);
    const seat = d.growth ? M.chairGrowth : M.chairInit;
    fur.box(seat, 0.46, 0.07, 0.46, x, 0.47, z + 1.0);
    fur.box(seat, 0.44, 0.46, 0.06, x, 0.78, z + 1.24);
    fur.cyl(M.chairBase, 0.025, 0.42, x, 0.23, z + 1.0, 'y', 8);
    fur.cyl(M.chairBase, 0.27, 0.03, x, 0.03, z + 1.0, 'y', 14);
  }

  // Roseta (sobre la columna en el puesto que la tiene, si no sobre el cablecanal)
  const ro = d.isCol ? V(d.xc, 0.3, z - 0.02) : V(x, 0.09, z - 0.03);
  pth.box(M.rosette, d.isCol ? 0.08 : 0.09, d.isCol ? 0.11 : 0.05, d.isCol ? 0.03 : 0.08, ro.x, ro.y, ro.z);
  const pcPt = d.single ? V(x, 0.6, z + 0.25) : V(x + dw / 2 - 0.15, 0.8, z + 0.2);
  pth.tube(M.patch, [V(ro.x, ro.y, ro.z + 0.03), V(ro.x + 0.05, 0.03, z + 0.2), V(pcPt.x, 0.04, pcPt.z), pcPt], 0.007, 14);
  d.rosette = ro;

  const hit = new THREE.Mesh(new THREE.BoxGeometry(d.single ? 0.7 : dw, 1.3, 1.45), M.hit);
  hit.position.set(x, 0.65, z + 0.65);
  G.add(hit);
  clickable(hit, { kind: 'desk', desk: d });
  d.hit = hit;
}

const U = 0.04445;
const rackPainters = [];
const DEPTH = { ODF: 0.25, PP: 0.1, ORG: 0.08, SW: 0.3, CORE: 0.3, SRV: 0.25, RT: 0.23, PDU: 0.06, UPS: 0.6, SV: 0.7, BLANK: 0.02 };

function buildRack(id, rk, f) {
  const g = new THREE.Group();
  g.position.set(rk.x, 0, rk.z);
  const W = 0.6, D = 1.0, H = 1.25;
  const parts = new Batch();
  parts.box(M.rackBody, 0.02, H, D, -W / 2 + 0.01, H / 2, 0);
  parts.box(M.rackBody, 0.02, H, D, W / 2 - 0.01, H / 2, 0);
  parts.box(M.rackBody, W, 0.05, D, 0, H - 0.025, 0);
  parts.box(M.rackBody, W, 0.09, D, 0, 0.045, 0);
  parts.box(M.rackBody, W, H, 0.02, 0, H / 2, -D / 2 + 0.01);
  for (const o of [-1, 1]) {
    parts.box(M.rackPost, 0.035, 24 * U + 0.02, 0.03, o * 0.255, 0.1 + 12 * U, D / 2 - 0.035);
    parts.box(M.rackPost, 0.035, 24 * U + 0.02, 0.03, o * 0.255, 0.1 + 12 * U, -D / 2 + 0.06);
  }
  // ventilación superior
  for (const o of [-0.12, 0.12]) parts.cyl(M.rackPost, 0.07, 0.02, o, H + 0.005, 0, 'y', 16);
  parts.build(g);
  g.children.forEach((m) => clickable(m, { kind: 'rack', rack: id }));

  const used = new Set();
  const units = [...rk.units];
  rk.units.forEach(([u, h]) => { for (let i = 0; i < h; i++) used.add(u + i); });
  for (let u = 1; u <= 24; u++) if (!used.has(u)) units.push([u, 1, 'BLANK', `${id}-U${pad(u)}`, 'Panel ciego / espacio de crecimiento', 'Blank panel / growth space']);

  // Todos los frentes del rack se dibujan en una sola textura y todos los equipos van en una sola malla
  // (antes era una malla con 6 materiales por equipo). Cada equipo conserva una caja invisible para el clic.
  const atlasH = FACE_U * 24 + 32;
  const canvas = document.createElement('canvas');
  canvas.width = FACE_W;
  canvas.height = atlasH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, FACE_U * 24, FACE_W, 32);
  const sideV = 1 - (FACE_U * 24 + 16) / atlasH;
  const top = (unit) => (24 - (unit[0] + unit[1] - 1)) * FACE_U;
  // dibuja todos los frentes (se vuelve a llamar al cambiar de idioma)
  const paint = () => {
    for (const unit of units) {
      const [, h, type, devId] = unit;
      const opts = {};
      if (type === 'PP') {
        const k = +devId.slice(-2);
        opts.used = Math.max(0, Math.min(f.ppPorts, f.totalCables - (k - 1) * f.ppPorts));
      }
      if (type === 'ODF') Object.assign(opts, id === 'R03' ? { adapters: 12, used: 5 } : { adapters: 6, used: id === 'R01' ? 3 : 2 });
      if (type === 'SV') opts.role = unitDesc(unit).split(' · ')[0];
      ctx.save();
      ctx.translate(0, top(unit));
      ctx.beginPath();
      ctx.rect(0, 0, FACE_W, h * FACE_U);
      ctx.clip();
      drawFace(ctx, type, devId, h, opts);
      ctx.restore();
    }
  };
  paint();
  const geos = [];
  for (const unit of units) {
    const [u, h, type] = unit;
    const d = DEPTH[type];
    const hgt = h * U - 0.002;

    const y = 0.1 + (u - 1) * U + hgt / 2 + 0.001, z = D / 2 - 0.03 - d / 2;
    const geo = new THREE.BoxGeometry(0.483, hgt, d);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      // vértices 16..19 = cara frontal (+z); el resto toma la franja oscura del final del atlas
      if (i >= 16 && i < 20) uv.setXY(i, uv.getX(i), 1 - (top(unit) + (1 - uv.getY(i)) * h * FACE_U) / atlasH);
      else uv.setXY(i, 0.5, sideV);
    }
    geo.translate(0, y, z);
    geos.push(geo);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.483, hgt, d), M.hit);
    hit.position.set(0, y, z);
    g.add(hit);
    clickable(hit, { kind: 'device', rack: id, unit });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const devices = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.15 }));
  devices.castShadow = devices.receiveShadow = true;
  g.add(devices);
  geos.forEach((geo) => geo.dispose());
  rackPainters.push(() => { paint(); tex.needsUpdate = true; });
  label(`${id} · 24U`, 'room', g, 0, H + 0.25, 0, 30);
  rackObjects[id] = g;
  return g;
}

// ---------------------------------------------------------------------------
// Backbone entre pisos (se rearma al separar los pisos)
// ---------------------------------------------------------------------------
const bbGroup = new THREE.Group();
scene.add(bbGroup);
layers.backbone.push(bbGroup);
let explode = 0.7, explodeTarget = 0.7;
const floorY = (i) => i * B.H + explode * i * 4.5;
const pulses = [];
const flowMats = {};
for (const [k, v] of Object.entries(BACKBONE)) flowMats[k] = std(v.color, { emissive: v.color, emissiveIntensity: 0.25, roughness: 0.4 });
const pulseMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
const pulseMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), pulseMat, 16);
pulseMesh.frustumCulled = false;
pulseMesh.count = 0;
scene.add(pulseMesh);
const dummy = new THREE.Object3D();

function polyPath(pts) {
  const p = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) p.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return p;
}

function buildBackbone() {
  for (const c of bbGroup.children.slice()) {
    bbGroup.remove(c);
    c.geometry.dispose();
    const ci = clickables.indexOf(c);
    if (ci >= 0) clickables.splice(ci, 1);
  }
  const phases = pulses.map((p) => p.phase);
  pulses.length = 0;
  const [F1, F2, F3] = [floorY(0), floorY(1), floorY(2)];
  const R1 = RACKS.R01, R2 = RACKS.R02, R3 = RACKS.R03, R4 = RACKS.R04;
  const rx = px(320), rz = pz(1304);
  const ex = (px(232) + px(295)) / 2, ez = (pz(1216) + pz(1290)) / 2;
  const routes = {
    BB01: [V(R3.x - 0.1, F3 + 1.25, R3.z - 0.15), V(R3.x - 0.1, F3 + 3.0, R3.z - 0.15), V(rx - 0.15, F3 + 3.0, R3.z - 0.15), V(rx - 0.15, F3 + 3.0, rz - 0.1), V(rx - 0.15, F1 + 3.0, rz - 0.1), V(rx - 0.15, F1 + 3.0, R1.z - 0.15), V(R1.x, F1 + 3.0, R1.z - 0.15), V(R1.x, F1 + 1.25, R1.z - 0.15)],
    BB02: [V(R3.x + 0.05, F3 + 1.25, R3.z), V(R3.x + 0.05, F3 + 3.06, R3.z), V(rx, F3 + 3.06, R3.z), V(rx, F3 + 3.06, rz + 0.1), V(rx, F2 + 3.06, rz + 0.1), V(rx, F2 + 3.06, R2.z - 0.15), V(R2.x, F2 + 3.06, R2.z - 0.15), V(R2.x, F2 + 1.25, R2.z - 0.15)],
    WAN01: [V(ex, F1 + 2.0, ez), V(ex, F1 + 2.92, ez), V(rx + 0.15, F1 + 2.92, ez), V(rx + 0.15, F1 + 2.92, rz - 0.1), V(rx + 0.15, F3 + 2.92, rz - 0.1), V(rx + 0.15, F3 + 2.92, R3.z + 0.15), V(R3.x + 0.18, F3 + 2.92, R3.z + 0.15), V(R3.x + 0.18, F3 + 1.25, R3.z + 0.15)],
    DAC04: [V(R3.x + 0.15, F3 + 1.25, R3.z + 0.3), V(R3.x + 0.3, F3 + 1.55, R3.z + 0.3), V(R4.x - 0.3, F3 + 1.55, R4.z + 0.3), V(R4.x - 0.15, F3 + 1.25, R4.z + 0.3)],
    ISP: [V(-7, 0.2, ez), V(px(232), 0.2, ez), V(ex, 0.2, ez), V(ex, 0.4, ez)],
  };
  for (const [k, pts] of Object.entries(routes)) {
    const path = k === 'DAC04' ? new THREE.CatmullRomCurve3(pts) : polyPath(pts);
    const mat = flowMats[k] || flowMats.WAN01;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(path, k === 'DAC04' ? 30 : 240, k === 'ISP' ? 0.06 : k === 'DAC04' ? 0.02 : 0.035, 6, false), mat);
    bbGroup.add(tube);
    clickable(tube, { kind: 'backbone', key: k === 'ISP' ? 'WAN01' : k });
    for (let i = 0; i < 3; i++) {
      pulses.push({ path, phase: phases[pulses.length] ?? i / 3, speed: k === 'DAC04' ? 0.5 : 0.12, size: k === 'DAC04' ? 0.035 : 0.055 });
    }
  }
}

// Poste del operador (afuera del edificio)
const ispPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), std('#c2410c'));
ispPost.position.set(-7, 1.0, (pz(1216) + pz(1290)) / 2);
ispPost.castShadow = true;
scene.add(ispPost);
clickable(ispPost, { kind: 'backbone', key: 'WAN01' });
const ispLbl = label(() => tr('Acometida operador (ISP)', 'Carrier service entrance (ISP)'), 'room', scene, -7, 2.5, ispPost.position.z);

// ---------------------------------------------------------------------------
// Recorrido de un cable seleccionado
// ---------------------------------------------------------------------------
let highlight = null;
const hlMat = new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#06b6d4', emissiveIntensity: 0.9 });
const hlPulse = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffffff' }));

function showCablePath(d) {
  clearHighlight();
  const f = FLOORS[d.floor - 1];
  const rk = RACKS[f.rack];
  const ro = d.rosette;
  const zc = d.z - 0.09, ty = 2.76;
  const pp = d.cables[0].pp;
  const ppUnit = rk.units.find((u) => u[3] === `${f.rack}-PP${pad(pp)}`);
  const uy = 0.1 + (ppUnit[0] - 0.5) * U;
  const pts = [ro];
  if (!d.isCol) pts.push(V(d.x, 0.03, d.z - 0.03), V(d.xc, 0.03, d.z - 0.03));
  pts.push(V(d.xc, 0.03, zc), V(d.xc, ty, zc), V(B.TRAY_X, ty, zc), V(B.TRAY_X, B.TRAY, zc), V(B.TRAY_X, B.TRAY, rk.z), V(rk.x, B.TRAY, rk.z), V(rk.x, B.TRAY, rk.z - 0.3), V(rk.x, 1.3, rk.z - 0.3), V(rk.x, uy, rk.z + 0.3), V(rk.x + 0.1, uy, rk.z + 0.47));
  const clean = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-3);
  const path = polyPath(clean);
  highlight = new THREE.Group();
  highlight.add(new THREE.Mesh(new THREE.TubeGeometry(path, 300, 0.03, 6, false), hlMat));
  highlight.add(hlPulse);
  hlPulse.userData = { path, phase: 0, speed: 0.25 };
  floorGroups[d.floor - 1].add(highlight);
}

function clearHighlight() {
  if (!highlight) return;
  highlight.parent.remove(highlight);
  highlight.children[0].geometry.dispose();
  highlight = null;
}

// ---------------------------------------------------------------------------
// Panel de información
// ---------------------------------------------------------------------------
const info = document.getElementById('info');
const infoBody = document.getElementById('infoBody');
// el panel guarda la función que lo arma, así se puede rehacer al cambiar de idioma
let infoFn = null;
const showInfo = (fn) => { infoFn = fn; infoBody.innerHTML = fn(); info.hidden = false; };
const OK = () => `<span class="ok">≤ 90 m ✓</span>`;

function summaryHTML() {
  const rows = FLOORS.map((f) => {
    const ds = desks.filter((d) => d.floor === f.n && !d.single);
    return `<tr><td>${tr('Piso', 'Floor')} ${f.n}</td><td>${ds.length}${f.n === 2 ? ' + SH' : ''}</td><td>${f.totalCables}</td><td>${f.rack}</td></tr>`;
  }).join('');
  return `<h3>${tr('Resumen del proyecto', 'Project summary')}</h3><div class="sub">MisioTIC S.A. · Posadas, Misiones · ANSI/TIA-568 / 569 / 606-B</div>
  <table><tr><th>${tr('Piso', 'Floor')}</th><th>${tr('Puestos', 'Workstations')}</th><th>${tr('Tomas', 'Outlets')}</th><th>Rack</th></tr>${rows}
  <tr><td><b>Total</b></td><td><b>146</b></td><td><b>304</b></td><td>4 racks 24U</td></tr></table>
  <div class="kv">
    <div>${tr('Horizontal', 'Horizontal')}</div><div>${tr('U/UTP Cat 6 Belden 2412 · T568B · 6.710 m netos (25 cajas)', 'U/UTP Cat 6 Belden 2412 · T568B · 6,710 m net (25 boxes)')}</div>
    <div>Backbone</div><div>${tr('Fibra OM3 12 hilos Belden FI3D012R9 · 10GBASE-SR', '12-strand OM3 fiber Belden FI3D012R9 · 10GBASE-SR')}</div>
    <div>${tr('Núcleo', 'Core')}</div><div>${tr('MikroTik CRS317-1G-16S+RM en ER03/MDF03', 'MikroTik CRS317-1G-16S+RM in ER03/MDF03')}</div>
    <div>${tr('Acceso', 'Access')}</div><div>8× MikroTik CRS354 (48p GbE + SFP+)</div>
    <div>${tr('Servidores', 'Servers')}</div><div>${tr('SV01 Archivos · SV02 Correo · SV03 Web · SV04 DNS · SV05 Firewall', 'SV01 Files · SV02 Mail · SV03 Web · SV04 DNS · SV05 Firewall')}</div>
    <div>${tr('Enlace más largo', 'Longest link')}</div><div>34 m (${tr('canal', 'channel')} 39 m) ${OK()}</div>
  </div>
  <p>${tr('Haga clic en un puesto para ver sus cables, la patchera y el puerto del switch, y el recorrido completo hasta el rack.', 'Click a workstation to see its cables, the patch panel and switch port, and the full route to the rack.')}</p>`;
}

function deskHTML(d) {
  const f = FLOORS[d.floor - 1];
  const tag = d.single ? `<span class="tag" style="background:#fef9c3;color:#854d0e">${tr('Toma de exhibición', 'Showroom outlet')}</span>`
    : d.growth ? `<span class="tag" style="background:#fef3c7;color:#92400e">${tr('Crecimiento +30 %', 'Growth +30 %')}</span>`
    : `<span class="tag" style="background:#dbeafe;color:#1e40af">${tr('Puesto inicial', 'Initial workstation')}</span>`;
  const toma = (c) => (c.toma === 'U' ? tr('Única', 'Single') : c.toma);
  const rows = d.cables.map((c) => `<tr><td>${toma(c)}</td><td class="mono">P${d.floor}-C${pad(c.c, 3)}</td><td class="mono">${f.rack}-PP${pad(c.pp)} · ${pad(c.port)}</td><td class="mono">${f.rack}-SW${pad(c.sw)} · eth${c.eth}</td></tr>`).join('');
  const nums = d.cables.map((c) => pad(c.c, 3));
  const tramo = d.z < RACKS[f.rack].z ? 'N' : 'S';
  return `<h3>${d.id}</h3><div class="sub">${secName(d.s)} · ${floorName(f)}</div>${tag}
  <table style="margin-top:10px"><tr><th>${tr('Toma', 'Outlet')}</th><th>Cable</th><th>${tr('Patchera · puerto', 'Patch panel · port')}</th><th>Switch</th></tr>${rows}</table>
  <div class="kv">
    <div>Patchcords</div><div class="mono">Rack P${d.floor}-PR${nums.join('/')} (2 m)<br>${tr('Puesto', 'Desk')} P${d.floor}-PU${nums.join('/')} (3 m)</div>
    <div>${tr('Roseta', 'Faceplate')}</div><div>${d.isCol ? tr('Sobre la columna de servicio, a +0,30 m', 'On the service pole, at +0.30 m') : tr('Sobre el cablecanal de la fila (60×40 mm)', 'On the row raceway (60×40 mm)')}</div>
    <div>${tr('Bajada', 'Drop')}</div><div>${tr('Columna de servicio 100×100 mm junto a', '100×100 mm service pole next to')} ${d.colDesk}</div>
    <div>${tr('Recorrido', 'Route')}</div><div>${tr(
      `Cablecanal → columna → conduit Ø50 en pleno (+2,76 m) → bandeja T${d.floor}-${tramo} (x = 9,80 m) → T${d.floor}-E → ${f.rack}`,
      `Raceway → service pole → Ø50 conduit in the plenum (+2.76 m) → tray T${d.floor}-${tramo} (x = 9.80 m) → T${d.floor}-E → ${f.rack}`)}</div>
    <div>${tr('Longitud', 'Length')}</div><div>≈ ${d.length} m ${tr('con la fórmula del TP', 'using the project formula')} ${OK()}</div>
  </div>
  <p style="color:var(--muted)">${tr('El recorrido del cable está resaltado en celeste.', 'The cable route is highlighted in light blue.')}</p>`;
}

function rackHTML(id) {
  const rk = RACKS[id];
  const all = [...rk.units].sort((a, b) => b[0] - a[0]);
  const used = all.reduce((a, u) => a + u[1], 0);
  const free = 24 - used, pct = Math.round((free / 24) * 100);
  const rows = all.map((u) => `<tr class="u-row" data-dev="${u[3]}"><td class="mono">U${u[1] > 1 ? `${pad(u[0])}-${pad(u[0] + u[1] - 1)}` : pad(u[0])}</td><td class="mono">${u[3]}</td><td>${unitDesc(u)}</td></tr>`).join('');
  return `<h3>${rackTitle(rk)}</h3><div class="sub">${tr(
    `Gabinete 19" 24U · 600 × 1000 mm · ${used}U en uso · ${free}U libres (${pct} % de reserva)`,
    `19" 24U cabinet · 600 × 1000 mm · ${used}U in use · ${free}U free (${pct} % spare)`)}</div>
  <div class="kv"><div>${tr('Carga', 'Load')}</div><div>${tr(rk.load, rk.loadEn)}</div><div>${tr('Tierra', 'Grounding')}</div><div>${tr('Barra TGB (ANSI/TIA-607)', 'TGB busbar (ANSI/TIA-607)')}</div></div>
  <table><tr><th>U</th><th>${tr('Equipo', 'Device')}</th><th>${tr('Detalle', 'Details')}</th></tr>${rows}</table>`;
}

function deviceHTML(rackId, unit) {
  const [u, h, type, id] = unit;
  const rk = RACKS[rackId];
  let extra = '';
  if (type === 'CORE') extra = `<table style="margin-top:8px"><tr><th>${tr('Puerto', 'Port')}</th><th>${tr('Destino', 'Destination')}</th><th>${tr('Medio', 'Medium')}</th></tr>${CORE_PORTS.map((p) => `<tr><td class="mono">${p[0]}</td><td>${tr(p[1], p[3])}</td><td>${tr(p[2], p[4])}</td></tr>`).join('')}</table>`;
  if (type === 'PP') {
    const f = FLOORS[rk.floor - 1];
    const k = +id.slice(-2);
    const a = (k - 1) * f.ppPorts + 1, b = Math.min(k * f.ppPorts, f.totalCables);
    const users = desks.filter((d) => d.floor === f.n && d.cables.some((c) => c.pp === k)).map((d) => d.id);
    extra = `<div class="kv"><div>Cables</div><div class="mono">P${f.n}-C${pad(a, 3)} ${tr('a', 'to')} P${f.n}-C${pad(b, 3)}</div><div>${tr('Puestos', 'Workstations')}</div><div>${users.join(', ')}</div></div>`;
  }
  if (type === 'SV' && id === 'SV05') extra = `<p>${tr('Cadena de borde', 'Edge chain')}: ISP → EF01 → WAN01 → RB4011 ether1 → ether2 → SV05 (WAN) → SV05 (LAN) → SW-SRV → SW-CORE SFP+9.</p>`;
  const pos = h > 1 ? `U${pad(u)}-U${pad(u + h - 1)}` : `U${pad(u)}`;
  return `<h3>${type === 'BLANK' ? tr('Espacio libre', 'Free space') : id}</h3><div class="sub">${rackTitle(rk)} · ${pos}</div><p>${unitDesc(unit)}</p>${extra}
  <p><a href="#" data-open-rack="${rackId}">${tr('Ver el rack completo', 'View the full rack')}</a></p>`;
}

const ROOM_TEXT = {
  1: () => [tr('TC01 / IDF01 · Armario de Telecomunicaciones', 'TC01 / IDF01 · Telecommunications Room'), tr(
    'Superficie 6,60 m² (3,00 × 2,20 m). Aloja el Rack R01 de 24U con 100 tomas del primer piso, 5 patcheras y 3 switches CRS354. Uplinks 10G por BB01 hacia el MDF03.',
    'Area 6.60 m² (3.00 × 2.20 m). Houses the 24U rack R01 with the 100 outlets of the first floor, 5 patch panels and 3 CRS354 switches. 10G uplinks to MDF03 over BB01.')],
  2: () => [tr('TC02 / IDF02 · Armario de Telecomunicaciones', 'TC02 / IDF02 · Telecommunications Room'), tr(
    'Superficie 6,60 m². Aloja el Rack R02 de 24U con 84 tomas del segundo piso, 4 patcheras y 2 switches CRS354. Uplinks 10G por BB02.',
    'Area 6.60 m². Houses the 24U rack R02 with the 84 outlets of the second floor, 4 patch panels and 2 CRS354 switches. 10G uplinks over BB02.')],
  3: () => [tr('ER03 / MDF03 · Sala de Equipos', 'ER03 / MDF03 · Equipment Room'), tr(
    'Superficie 13,69 m² (3,70 × 3,70 m), por encima del mínimo de 13,5 m². Contigua al Área de Sistemas. Aloja R03 (núcleo y distribución del piso 3) y R04 (granja de servidores), unidos por DAC04.',
    'Area 13.69 m² (3.70 × 3.70 m), above the 13.5 m² minimum. Next to the IT Department. Houses R03 (core and floor 3 distribution) and R04 (server farm), linked by DAC04.')],
};
const TRAY_TEXT = {
  1: () => tr('T1-E 6 m (100 cables, 29,7 %) · T1-N 13,7 m (23,2 %) · T1-S 8,6 m (6,5 %)', 'T1-E 6 m (100 cables, 29.7 %) · T1-N 13.7 m (23.2 %) · T1-S 8.6 m (6.5 %)'),
  2: () => tr('T2-E 2,9 m (25,0 %) · T2-N 13,8 m (21,4 %) · T2-S 8,2 m (3,6 %)', 'T2-E 2.9 m (25.0 %) · T2-N 13.8 m (21.4 %) · T2-S 8.2 m (3.6 %)'),
  3: () => tr('T3-E 3,4 m (35,7 %) · T3-N 11,85 m (18,4 %) · T3-S 9,95 m (17,2 %)', 'T3-E 3.4 m (35.7 %) · T3-N 11.85 m (18.4 %) · T3-S 9.95 m (17.2 %)'),
};

function pickHTML(p) {
  switch (p.kind) {
    case 'desk': return deskHTML(p.desk);
    case 'rack': return rackHTML(p.rack);
    case 'device': return deviceHTML(p.rack, p.unit);
    case 'room': { const [t, d] = ROOM_TEXT[p.floor](); return `<h3>${t}</h3><p>${d}</p>`; }
    case 'tray': return tr(
      `<h3>Bandeja portacables · Piso ${p.floor}</h3><div class="sub">200 × 50 mm a +2,80 m sobre el eje x = 9,80 m · soporte trapecio</div><p>${TRAY_TEXT[p.floor]()}</p><p>Ocupación máxima 35,69 % con 120 cables Cat 6. <span class="ok">Cumple ≤ 40 % ✓</span></p>`,
      `<h3>Cable tray · Floor ${p.floor}</h3><div class="sub">200 × 50 mm at +2.80 m along the x = 9.80 m axis · trapeze hangers</div><p>${TRAY_TEXT[p.floor]()}</p><p>Maximum fill 35.69 % with 120 Cat 6 cables. <span class="ok">Meets ≤ 40 % ✓</span></p>`);
    case 'riser': return tr(
      `<h3>Montante vertical M (CV)</h3><div class="sub">Eje (2,20; 17,60 m) · conduit rígido Ø50 mm</div><p>CV12 3,4 m (ocupación 4,52 %) · CV23 3,4 m (7,11 %). Acometidas a rack CV1R 6,6 m, CV2R 9,3 m, CV3R 10,25 m. Sellado cortafuego ASTM E814 en cada losa.</p><p>Lleva BB01, BB02 y WAN01.</p>`,
      `<h3>Vertical riser M (CV)</h3><div class="sub">Axis (2.20; 17.60 m) · Ø50 mm rigid conduit</div><p>CV12 3.4 m (4.52 % fill) · CV23 3.4 m (7.11 %). Runs to the racks CV1R 6.6 m, CV2R 9.3 m, CV3R 10.25 m. ASTM E814 firestop at every slab.</p><p>Carries BB01, BB02 and WAN01.</p>`);
    case 'ef': return tr(
      `<h3>EF01 · Facilidad de Entrada</h3><p>Ingreso del enlace del operador (ISP) en el primer piso, junto a la montante. Desde aquí sube WAN01 (20 m de Cat 6) hasta el router RB4011 en el ER03.</p>`,
      `<h3>EF01 · Entrance Facility</h3><p>Entry point of the carrier (ISP) link on the first floor, next to the riser. From here WAN01 (20 m of Cat 6) goes up to the RB4011 router in ER03.</p>`);
    case 'backbone': { const b = BACKBONE[p.key]; return `<h3>${tr(b.title, b.titleEn)}</h3><p>${tr(b.desc, b.descEn)}</p>`; }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Interacción
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
let selBox = null;

function visibleChain(o) {
  for (let p = o; p; p = p.parent) {
    if (!p.visible) return false;
    if (p === scene) return true;
  }
  return false;
}

function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickables.filter(visibleChain), false);
  return hits.length ? hits[0].object : null;
}

function nameOf(p) {
  switch (p.kind) {
    case 'desk': return `${p.desk.id} · ${secName(p.desk.s)}`;
    case 'rack': return rackTitle(RACKS[p.rack]);
    case 'device': return `${p.unit[3]} · U${pad(p.unit[0])}`;
    case 'room': return ROOM_TEXT[p.floor]()[0];
    case 'tray': return tr('Bandeja 200×50 mm', 'Cable tray 200×50 mm');
    case 'riser': return tr('Montante vertical M', 'Vertical riser M');
    case 'ef': return tr('EF01 · Facilidad de entrada', 'EF01 · Entrance facility');
    case 'backbone': return tr(BACKBONE[p.key].title, BACKBONE[p.key].titleEn);
  }
}

function select(obj) {
  invalidate();
  if (selBox) { selBox.parent.remove(selBox); selBox = null; }
  clearHighlight();
  if (!obj) return;
  const p = obj.userData.pick;
  showInfo(() => pickHTML(p));
  if (p.kind === 'desk') showCablePath(p.desk);
  if (p.kind !== 'backbone') {
    selBox = new THREE.BoxHelper(obj, '#f59e0b');
    scene.add(selBox);
  }
}

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
  const o = pick(e);
  if (o) select(o);
});
let hoverQueued = null;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  hoverQueued = e;
});
renderer.domElement.addEventListener('pointerleave', () => { tooltip.hidden = true; });

function doHover() {
  if (!hoverQueued) return;
  const e = hoverQueued;
  hoverQueued = null;
  const o = pick(e);
  if (o) {
    tooltip.textContent = nameOf(o.userData.pick);
    tooltip.style.left = e.clientX + 14 + 'px';
    tooltip.style.top = e.clientY + 12 + 'px';
    tooltip.hidden = false;
    renderer.domElement.style.cursor = 'pointer';
  } else {
    tooltip.hidden = true;
    renderer.domElement.style.cursor = '';
  }
}

document.getElementById('closeInfo').onclick = () => { info.hidden = true; infoFn = null; select(null); };

// Cambio de idioma: textos fijos, etiquetas 3D, panel abierto y frentes de los racks
document.getElementById('langBtn').addEventListener('click', () => {
  setLang(lang === 'es' ? 'en' : 'es');
  applyStatic();
  for (const l of labels) if (typeof l.userData.text === 'function') l.element.textContent = l.userData.text();
  if (infoFn && !info.hidden) infoBody.innerHTML = infoFn();
  rackPainters.forEach((paint) => paint());
  invalidate();
});
infoBody.addEventListener('click', (e) => {
  const a = e.target.closest('[data-open-rack]');
  if (a) { e.preventDefault(); focusRack(a.dataset.openRack); return; }
  const row = e.target.closest('[data-dev]');
  if (row) {
    const mesh = clickables.find((c) => c.userData.pick.kind === 'device' && c.userData.pick.unit[3] === row.dataset.dev);
    if (mesh) select(mesh);
  }
});

// Capas
document.querySelectorAll('[data-layer]').forEach((cb) => {
  cb.addEventListener('change', () => applyLayers());
});
function applyLayers() {
  document.querySelectorAll('[data-layer]').forEach((cb) => {
    for (const g of layers[cb.dataset.layer]) g.visible = cb.checked;
  });
  const showLabels = document.querySelector('[data-layer=labels]').checked;
  labels.forEach((l) => { l.userData.want = showLabels; });
  bbGroup.visible = document.querySelector('[data-layer=backbone]').checked && maxFloor === 3;
  ispPost.visible = bbGroup.visible;
  ispLbl.userData.want = showLabels && bbGroup.visible;
  invalidate();
}
const trafficCb = document.getElementById('traffic');
trafficCb.addEventListener('change', invalidate);

// Separación de pisos
const explodeInput = document.getElementById('explode');
explodeInput.addEventListener('input', () => { explodeTarget = +explodeInput.value; });

// Vistas y cámara
let maxFloor = 3;
let focusFloor = null; // con un piso enfocado solo se muestran sus etiquetas
let camAnim = null;
function flyTo(pos, target, dur = 1.1, fit = true) {
  // en pantallas angostas (celular) la cámara se aleja para que entre el edificio
  const aspect = camera.aspect > 0 && isFinite(camera.aspect) ? camera.aspect : 1.6;
  if (fit) pos = target.clone().add(pos.clone().sub(target).multiplyScalar(Math.max(1, 0.95 / aspect)));
  camAnim = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur: dur * 1000 };
}
function setMaxFloor(n) {
  maxFloor = n;
  floorGroups.forEach((g, i) => { g.visible = i < n; });
  applyLayers();
}
function setActive(btn) {
  document.querySelectorAll('[data-view],[data-rack]').forEach((b) => b.classList.toggle('active', b === btn));
}
function finalFloorY(i) { return i * B.H + explodeTarget * i * 4.5; }

const VIEWS = {
  general: () => { focusFloor = null; setMaxFloor(3); const h = finalFloorY(2) / 2 + 1.5; flyTo(V(40, h + 22, 46), V(7.5, h, 12.5)); },
  f1: () => floorView(1),
  f2: () => floorView(2),
  f3: () => floorView(3),
  corte: () => { focusFloor = null; setMaxFloor(3); explodeTarget = 0; explodeInput.value = 0; flyTo(V(-24, 6, 14), V(5, 5.0, 14)); },
  top: () => { focusFloor = maxFloor; const y = finalFloorY(maxFloor - 1); flyTo(V(7.5, y + 38, 12.55), V(7.5, y, 12.5)); },
};
function floorView(n) {
  focusFloor = n;
  setMaxFloor(n);
  const y = finalFloorY(n - 1);
  flyTo(V(24, y + 17, 36), V(7.5, y + 0.5, 12.5));
}
function focusRack(id) {
  const rk = RACKS[id];
  focusFloor = rk.floor;
  setMaxFloor(rk.floor);
  const y = finalFloorY(rk.floor - 1);
  flyTo(V(rk.x + 0.75, y + 1.35, rk.z + 2.1), V(rk.x, y + 0.65, rk.z + 0.3), 1.1, false);
  if (selBox) { selBox.parent.remove(selBox); selBox = null; }
  clearHighlight();
  showInfo(() => rackHTML(id));
  setActive(document.querySelector(`[data-rack=${id}]`));
}
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { VIEWS[b.dataset.view](); setActive(b); }));
document.querySelectorAll('[data-rack]').forEach((b) => b.addEventListener('click', () => focusRack(b.dataset.rack)));
document.getElementById('toggleControls').onclick = () => document.getElementById('controls').classList.toggle('collapsed');

// Mostrar u ocultar todos los paneles (botón o tecla H)
const uiToggle = document.getElementById('uiToggle');
function setPanelsHidden(off) {
  document.body.classList.toggle('ui-off', off);
  uiToggle.setAttribute('aria-pressed', String(off));
  uiToggle.dataset.i18nAria = off ? 'uiAriaShow' : 'uiAria';
  uiToggle.querySelector('span').dataset.i18n = off ? 'uiShow' : 'uiHide';
  applyStatic();
  try { localStorage.setItem('maqueta-ui-off', off ? '1' : '0'); } catch (e) { /* almacenamiento bloqueado */ }
}
uiToggle.addEventListener('click', () => setPanelsHidden(!document.body.classList.contains('ui-off')));
addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'h' || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.target.closest?.('input[type=text], textarea, [contenteditable]')) return;
  setPanelsHidden(!document.body.classList.contains('ui-off'));
});
try { if (localStorage.getItem('maqueta-ui-off') === '1') setPanelsHidden(true); } catch (e) { /* almacenamiento bloqueado */ }

let viewW = 0, viewH = 0;
function resize() {
  const [w, h] = viewSize();
  if (!w || !h || (w === viewW && h === viewH)) return;
  viewW = w;
  viewH = h;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  invalidate();
}
window.addEventListener('resize', resize);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(app);
renderer.domElement.addEventListener('webglcontextrestored', invalidate);

// Si por algún motivo la cámara quedara con valores inválidos, vuelve a la vista general.
const finite = (v) => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
function checkCamera() {
  if (finite(camera.position) && finite(controls.target)) return;
  camAnim = null;
  VIEWS.general();
  camera.position.copy(camAnim.p1);
  controls.target.copy(camAnim.t1);
  camAnim = null;
  invalidate();
}

// ---------------------------------------------------------------------------
// Bucle
// ---------------------------------------------------------------------------
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let last = performance.now();

const inRange = (dist, u) => dist < u.maxDist && dist > u.minDist;

let tickError = false;
function tick(now) {
  requestAnimationFrame(tick);
  try {
    frame(now);
  } catch (e) {
    if (!tickError) console.error(e);
    tickError = true;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  resize();

  if (Math.abs(explode - explodeTarget) > 1e-4) {
    explode += (explodeTarget - explode) * Math.min(1, dt * 6);
    if (Math.abs(explode - explodeTarget) < 0.002) explode = explodeTarget;
    floorGroups.forEach((g, i) => { g.position.y = floorY(i); });
    buildBackbone();
    if (selBox) selBox.update();
    invalidate();
  }

  if (camAnim) {
    const t = Math.min(1, (now - camAnim.start) / camAnim.dur);
    const k = ease(t);
    camera.position.lerpVectors(camAnim.p0, camAnim.p1, k);
    controls.target.lerpVectors(camAnim.t0, camAnim.t1, k);
    if (t >= 1) camAnim = null;
  }
  controls.update();
  checkCamera();

  // tráfico animado: una sola malla instanciada para todos los pulsos
  const traffic = trafficCb.checked && bbGroup.visible;
  pulseMesh.visible = traffic;
  if (traffic) {
    pulses.forEach((p, i) => {
      p.phase = (p.phase + dt * p.speed) % 1;
      dummy.position.copy(p.path.getPointAt(p.phase));
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      pulseMesh.setMatrixAt(i, dummy.matrix);
    });
    pulseMesh.count = pulses.length;
    pulseMesh.instanceMatrix.needsUpdate = true;
    needsRender = true;
  }
  if (highlight) {
    const u = hlPulse.userData;
    u.phase = (u.phase + dt * u.speed) % 1;
    hlPulse.position.copy(u.path.getPointAt(u.phase));
    needsRender = true;
  }

  // etiquetas y paredes de recintos: solo se recalculan cuando se movió la cámara o cambió algo
  if (labelsDirty) {
    for (const w of roomWalls) {
      const near = camera.position.distanceTo(tmpV.copy(w.c).add(w.group.position)) < 5;
      w.mat.opacity = near ? 0.03 : 0.16;
    }
    for (const l of labels) {
      if (l.userData.fi === undefined) {
        let a = l;
        while (a && !floorGroups.includes(a)) a = a.parent;
        l.userData.fi = a ? floorGroups.indexOf(a) : -1;
      }
      if (focusFloor && l.userData.fi !== -1 && l.userData.fi !== focusFloor - 1) { l.visible = false; continue; }
      l.visible = l.userData.want && visibleChain(l.parent) && inRange(camera.position.distanceTo(l.getWorldPosition(tmpV)), l.userData);
    }
    labelRenderer.render(scene, camera);
    labelsDirty = false;
  }

  doHover();
  if (needsRender && viewW && viewH) {
    renderer.render(scene, camera);
    needsRender = false;
    loader.done();
  }
}
const tmpV = new THREE.Vector3();

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
// deja que el navegador pinte el cartel de carga entre paso y paso
const breathe = () => new Promise((r) => { requestAnimationFrame(() => r()); setTimeout(r, 60); });

(async () => {
  try {
    loader.step(tr('Cargando tipografías…', 'Loading fonts…'), 15);
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
    for (const f of FLOORS) {
      loader.step(tr(`Construyendo el piso ${f.n} de 3…`, `Building floor ${f.n} of 3…`), 15 + f.n * 20);
      await breathe();
      buildFloor(f);
    }
    loader.step(tr('Conectando backbone y racks…', 'Connecting backbone and racks…'), 85);
    await breathe();
    floorGroups.forEach((g, i) => { g.position.y = floorY(i); });
    buildBackbone();
    applyLayers();
    resize();
    const narrow = viewW > 0 && viewW <= 760;
    if (!narrow) showInfo(summaryHTML);
    else document.getElementById('controls').classList.add('collapsed');
    VIEWS.general();
    camera.position.copy(camAnim.p1);
    controls.target.copy(camAnim.t1);
    camAnim = null;
    loader.step(tr('Preparando la vista 3D…', 'Preparing the 3D view…'), 95);
    await breathe();
    // compila los shaders antes del primer cuadro para que no se trabe al aparecer
    try { await renderer.compileAsync(scene, camera); } catch (e) { /* se compilan en el primer cuadro */ }
    invalidate();
    requestAnimationFrame(tick);
  } catch (e) {
    console.error(e);
    loader.fail(tr('No se pudo armar la maqueta. Recargue la página.', 'The model could not be built. Please reload the page.'));
  }
})();
