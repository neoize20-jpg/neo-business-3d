/* 네오비즈니스 3D 투어 엔진 (app.js)
   ※ 공간 치수·가구 배치는 여기서 고치지 말고 layout.js 를 고치세요. 이 파일은 layout.js 를 읽어 3D로 그립니다. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
import { makeTextures, textTexture } from './textures.js?v=11181930';

const L = window.LAYOUT, B = L.building, H = B.ceiling, EYE = B.eye || 1.6, W = B.width, D = B.depth;
const TW = Object.assign({ exterior: 0.24, interior: 0.14, thick: 0.3 }, B.wall || {});
const DEG = Math.PI / 180;
const params = new URLSearchParams(location.search);
const SHOT = params.get('shot'), EDIT = params.get('edit') === '1';
const TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
if (SHOT) document.body.classList.add('shot');
if (TOUCH && !SHOT) document.body.classList.add('touch');
if (EDIT) document.body.classList.add('edit');
let Q = params.get('q') || localStorage.getItem('neo_q') || (TOUCH ? 'low' : 'high');
if (Q !== 'high' && Q !== 'low') Q = 'high';
const HIGH = Q === 'high';
const CUT_Y = 1.45;            // 3D 보기에서 벽을 자르는 높이
const FOV_WALK = 72, FOV_ORBIT = 38;

/* ---------------- renderer / scene ---------------- */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!SHOT });
renderer.setPixelRatio(SHOT ? 1 : HIGH ? Math.min(devicePixelRatio, 2) : 1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.88;
renderer.shadowMap.enabled = HIGH;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.appendChild(renderer.domElement);
const labelR = new CSS2DRenderer(); labelR.setSize(innerWidth, innerHeight);
Object.assign(labelR.domElement.style, { position: 'fixed', inset: '0', pointerEvents: 'none' });
document.body.appendChild(labelR.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe4eaf1);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
const camera = new THREE.PerspectiveCamera(FOV_WALK, innerWidth / innerHeight, 0.05, 140);
camera.rotation.order = 'YXZ';
scene.add(new THREE.HemisphereLight(0xffffff, 0xc2bdb4, 0.5));
const sun = new THREE.DirectionalLight(0xfffaf2, HIGH ? 0.95 : 0.75);
sun.position.set(W / 2 - 3, 14, D / 2 + 4); sun.target.position.set(W / 2, 0, D / 2); scene.add(sun, sun.target);
if (HIGH) {
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -13; sc.right = 13; sc.top = 13; sc.bottom = -13; sc.near = 2; sc.far = 30;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
}

/* ---------------- materials ---------------- */
const T = makeTextures(Q);
const V2 = (a) => new THREE.Vector2(a, a);
const std = (o) => new THREE.MeshStandardMaterial(o);
const world = (m) => { m.userData.world = true; return m; };   // 월드 좌표 UV(미터 단위 타일링)
const M = {
  floor: world(std({ color: 0xffffff, map: T.floor.map, roughnessMap: T.floor.roughnessMap, normalMap: T.floor.normalMap, normalScale: V2(0.35), roughness: 1, envMapIntensity: 0.55 })),
  paint: world(std({ color: 0xffffff, map: T.paint.map, normalMap: T.paint.normalMap, normalScale: V2(0.18), roughness: 0.9 })),
  ceiling: world(std({ color: 0xffffff, map: T.ceiling.map, normalMap: T.ceiling.normalMap, normalScale: V2(0.5), roughness: 0.95 })),
  oak: world(std({ color: 0xffffff, map: T.oak.map, roughnessMap: T.oak.roughnessMap, normalMap: T.oak.normalMap, normalScale: V2(0.35), roughness: 1 })),
  marble: world(std({ color: 0xffffff, map: T.marble.map, roughnessMap: T.marble.roughnessMap, roughness: 1, envMapIntensity: 1.2 })),
  darkTop: world(std({ color: 0xffffff, map: T.dark.map, roughnessMap: T.dark.roughnessMap, roughness: 1, metalness: 0.05 })),
  white: std({ color: 0xf6f6f4, roughness: 0.42 }),
  black: std({ color: 0x1d1f23, roughness: 0.48, metalness: 0.35 }),
  metal: std({ color: 0xc6cad0, roughness: 0.26, metalness: 0.9 }),
  frame: std({ color: 0x202328, roughness: 0.42, metalness: 0.5 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xe6f1f6, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 }),
  frost: new THREE.MeshPhysicalMaterial({ color: 0xf2f5f7, roughness: 0.6, transparent: true, opacity: 0.74, depthWrite: false, side: THREE.DoubleSide }),
  mint: std({ color: 0xdcefe8, roughness: 0.07, envMapIntensity: 1.4 }),
  screen: std({ color: 0xf6f6f6, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0.05 }),
  tv: std({ color: 0x0c111c, roughness: 0.15, metalness: 0.2, emissive: 0x1a3d72, emissiveIntensity: 0.35 }),
  led: new THREE.MeshBasicMaterial({ color: 0xfdfdf8 }),
  glow: std({ color: 0xffdcab, emissive: 0xffb45c, emissiveIntensity: 1.2 }),
  leaf: std({ color: 0x3c7a37, roughness: 0.75, flatShading: true }),
  leaf2: std({ color: 0x5a9843, roughness: 0.75, flatShading: true }),
  pot: std({ color: 0xf5f5f2, roughness: 0.3 }),
  soil: std({ color: 0x4a3b2d, roughness: 1 }),
  cap: std({ color: 0x0B2E67, roughness: 0.6 }),
  capGlass: std({ color: 0x6f8fbf, roughness: 0.6 }),
  ground: std({ color: 0xd9dde2, roughness: 1 }),
  fixture: std({ color: 0xf6f6f4, roughness: 0.42 })
};
M.led.userData.noShadow = M.ceiling.userData.noShadow = M.fixture.userData.noShadow = true;
M.ceiling.emissive = new THREE.Color(0xffffff); M.ceiling.emissiveMap = T.ceiling.map; M.ceiling.emissiveIntensity = 0.14;
const FABRIC = { fabricGray: 0x9a9da3, fabricTeal: 0x2f8fb0, fabricBeige: 0xc2b496, fabricOrange: 0xe0682f, fabricGreen: 0x86a659, fabricBlue: 0x3584bd, fabricRed: 0xd2482f, orange: 0xff8207, chairLight: 0xe9e9e9 };
const fabCache = {};
function fabric(name) {
  if (!fabCache[name]) fabCache[name] = world(std({ color: FABRIC[name], map: T.fabric.map, normalMap: T.fabric.normalMap, normalScale: V2(0.7), roughness: 0.95 }));
  return fabCache[name];
}
function matOf(name, fallback = 'white') {
  if (!name) name = fallback;
  if (FABRIC[name]) return fabric(name);
  if (M[name]) return M[name];
  console.warn('알 수 없는 재질 이름:', name); return M.white;
}
const plainCache = {};
const plain = (hex) => plainCache[hex] || (plainCache[hex] = std({ color: hex, roughness: 0.55 }));

/* ---------------- geometry helpers ---------------- */
const root = new THREE.Group(); scene.add(root);
function box(w, h, d, m, x, y, z, p = root) { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.position.set(x, y + h / 2, z); p.add(g); return g; }
function cyl(rt, rb, h, m, x, y, z, seg = 20, p = root) { const g = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); g.position.set(x, y + h / 2, z); p.add(g); return g; }
function grp(x, z, rotDeg = 0, p = root) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotDeg * DEG; p.add(g); return g; }

/* ---------------- floor / ceiling / shell ---------------- */
box(W, 0.02, D, M.floor, W / 2, -0.02, D / 2).userData.floor = true;
box(W + 0.1, 0.3, D + 0.1, M.cap, W / 2, -0.32, D / 2);                       // 건물 바닥 슬래브(3D 보기용)
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), M.ground); ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, -0.33, D / 2); ground.receiveShadow = true; scene.add(ground);
box(W, 0.04, D, M.ceiling, W / 2, H, D / 2);

/* ---------------- walls ---------------- */
const WALLSEGS = [];   // 미니맵·벽 단면(cap)용
/* 문: E키로 여닫는 회전 문짝. DOORS 에 등록되고, 닫힌 문은 충돌(통과 불가), 열린 문은 통과 가능 */
const DOORS = [];
function registerDoor(leaves, open, name) { const d = { leaves, target: open ? 1 : 0, cur: open ? 1 : 0, name, box: null, c: null }; DOORS.push(d); return d; }
function door(hx, hz, w, baseRad, swingRad, leafMat, frameMat) {
  const g = new THREE.Group(); g.position.set(hx, 0, hz); g.rotation.y = baseRad; root.add(g);
  g.userData.noCollide = true; g.userData.dynamic = true;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 2.04, 0.02), leafMat); leaf.position.set(w / 2, 1.04, 0); g.add(leaf);
  box(w, 0.045, 0.05, frameMat, w / 2, 2.04, 0, g); box(w, 0.06, 0.05, frameMat, w / 2, 0, 0, g);
  box(0.045, 2.1, 0.05, frameMat, 0.022, 0, 0, g); box(0.045, 2.1, 0.05, frameMat, w - 0.022, 0, 0, g);
  box(0.025, 0.5, 0.06, M.metal, w - 0.12, 0.8, 0, g);
  return { g, base: baseRad, swing: swingRad };
}
function wallPiece(horiz, a0, a1, fixed, t, type) {
  const len = a1 - a0; if (len < 0.005) return;
  const c = (a0 + a1) / 2, cx = horiz ? c : fixed, cz = horiz ? fixed : c;
  const Wd = horiz ? len : t, Dd = horiz ? t : len;
  const sz = (along, thick) => horiz ? [along, thick] : [thick, along];
  WALLSEGS.push(horiz ? { x1: a0, z1: fixed, x2: a1, z2: fixed, t, type } : { x1: fixed, z1: a0, x2: fixed, z2: a1, t, type });
  if (type === 'solid') { box(Wd, H, Dd, M.paint, cx, 0, cz); return; }
  if (type === 'window') {
    const sill = 0.45, head = 2.35;
    box(Wd, sill, Dd, M.paint, cx, 0, cz); box(Wd, H - head, Dd, M.paint, cx, head, cz);
    const [pw, pd] = sz(len, 0.02); const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, head - sill, pd), M.glass); pane.position.set(cx, (sill + head) / 2, cz); root.add(pane);
    const [sw, sd] = sz(len, t + 0.06); box(sw, 0.03, sd, M.white, cx, sill, cz);           // 창턱
    const [fw, fd] = sz(len, 0.06); box(fw, 0.05, fd, M.frame, cx, head - 0.05, cz); box(fw, 0.04, fd, M.frame, cx, sill + 0.03, cz);
    const n = Math.max(1, Math.round(len / 1.3));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n; box(0.05, head - sill, 0.05, M.frame, horiz ? f : cx, sill, horiz ? cz : f); }
    const [bw, bd] = sz(len, 0.1); box(bw, 0.11, bd, M.white, cx, head - 0.16, cz);          // 롤 블라인드 박스
    return;
  }
  // glass: 블랙 프레임 + 반투명 시트(하부) + 투명 유리(상부)
  const pieces = [[0.06, 0.98, M.frost], [0.98, 1.06, M.glass], [1.06, 1.88, M.frost], [1.88, H - 0.05, M.glass]];
  for (const [y0, y1, m] of pieces) { const [pw, pd] = sz(len, 0.02); const p = new THREE.Mesh(new THREE.BoxGeometry(pw, y1 - y0, pd), m); p.position.set(cx, (y0 + y1) / 2, cz); root.add(p); }
  const [fw, fd] = sz(len, 0.06); box(fw, 0.06, fd, M.frame, cx, 0, cz); box(fw, 0.05, fd, M.frame, cx, H - 0.05, cz);
  const n = Math.max(1, Math.round(len / 1.2));
  for (let i = 0; i <= n; i++) { const f = a0 + len * i / n; box(0.045, H, 0.06, M.frame, horiz ? f : cx, 0, horiz ? cz : f); }
}
function molding(horiz, fixed, from, to, dir, panelW = 1.0) {   // 벽면 몰딩(판넬 프레임)
  const n = Math.max(1, Math.round((to - from) / panelW)), pw = (to - from) / n, t = 0.022, off = fixed + dir * t / 2;
  for (const [y0, y1] of [[0.15, 0.85], [1.0, 2.45]]) for (let i = 0; i < n; i++) {
    const c = from + pw * (i + 0.5), w = pw - 0.22;
    const add = (len, h, y, along) => horiz ? box(len, h, t, M.paint, along, y, off) : box(t, h, len, M.paint, off, y, along);
    add(w, 0.028, y0, c); add(w, 0.028, y1 - 0.028, c); add(0.028, y1 - y0, y0, c - w / 2); add(0.028, y1 - y0, y0, c + w / 2);
  }
}
for (const w of L.walls) {
  const horiz = Math.abs(w.from[1] - w.to[1]) < 1e-6;
  const t = w.t || (w.outer ? TW.exterior : TW.interior);
  let a0 = horiz ? Math.min(w.from[0], w.to[0]) : Math.min(w.from[1], w.to[1]);
  const a1 = horiz ? Math.max(w.from[0], w.to[0]) : Math.max(w.from[1], w.to[1]);
  // 바깥벽은 건물 안쪽으로 두께만큼 들어오도록(좌표 = 바깥 면 기준) 중심선 보정
  let fixed = horiz ? w.from[1] : w.from[0];
  if (w.outer) { if (fixed <= 0.001) fixed += t / 2; else if (horiz ? fixed >= D - 0.001 : fixed >= W - 0.001) fixed -= t / 2; }
  const ops = [...(w.openings || [])].sort((p, q) => p.at - q.at);
  let cur = a0;
  for (const o of ops) { wallPiece(horiz, cur, o.at, fixed, t, w.type); cur = o.at + o.width; }
  wallPiece(horiz, cur, a1, fixed, t, w.type);
  for (const o of ops) {
    const len = o.width, c = o.at + len / 2, cx = horiz ? c : fixed, cz = horiz ? fixed : c;
    const lintel = 2.12;
    if (w.type === 'glass') { const p = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.02, H - lintel, horiz ? 0.02 : len), M.glass); p.position.set(cx, (H + lintel) / 2, cz); root.add(p); box(horiz ? len : 0.06, 0.05, horiz ? 0.06 : len, M.frame, cx, H - 0.05, cz); }
    else box(horiz ? len : t, H - lintel, horiz ? t : len, M.paint, cx, lintel, cz);
    const fm = o.frame === 'white' ? M.white : M.frame;
    box(horiz ? len + 0.06 : t + 0.02, 0.05, horiz ? t + 0.02 : len + 0.06, fm, cx, lintel - 0.05, cz);
    if (!o.door || o.door === 'none') continue;
    const leafMat = o.door === 'wood' ? M.white : (w.type === 'glass' ? M.frost : M.glass);
    const baseStart = horiz ? 0 : -Math.PI / 2, baseEnd = horiz ? Math.PI : Math.PI / 2;
    if (o.double) {
      const hw = len / 2, sw = (o.swing || 80) * DEG;
      registerDoor([door(horiz ? o.at : fixed, horiz ? fixed : o.at, hw, baseStart, -sw, leafMat, fm),
                    door(horiz ? o.at + len : fixed, horiz ? fixed : o.at + len, hw, baseEnd, sw, leafMat, fm)], o.open === true, o.name);
    } else {
      const start = (o.hinge || 'start') === 'start', sw = (o.swing || 80) * DEG;
      const hp = start ? o.at : o.at + len;
      registerDoor([door(horiz ? hp : fixed, horiz ? fixed : hp, len, start ? baseStart : baseEnd, sw, leafMat, fm)], o.open === true, o.name);
    }
  }
  if (w.molding) {
    const dir = (w.molding === 'east' || w.molding === 'south') ? 1 : -1;
    molding(horiz, fixed + dir * t / 2, w.moldingFrom ?? a0, w.moldingTo ?? a1, dir);
  }
}
for (const c of (L.columns || [])) {
  const [x0, z0, x1, z1] = c.rect; box(x1 - x0, H, z1 - z0, M.paint, (x0 + x1) / 2, 0, (z0 + z1) / 2);
  WALLSEGS.push({ x1: x0, z1: z0, x2: x1, z2: z1, t: 0, type: 'column' });
  for (const f of (c.slats || [])) {
    const vert = f === 'west' || f === 'east', a = vert ? z0 : x0, b = vert ? z1 : x1, n = Math.max(3, Math.round((b - a) / 0.13));
    for (let i = 0; i < n; i++) {
      const p = a + 0.06 + i * ((b - a - 0.12) / (n - 1));
      if (vert) box(0.03, H, 0.05, M.oak, f === 'west' ? x0 - 0.015 : x1 + 0.015, 0, p);
      else box(0.05, H, 0.03, M.oak, p, 0, f === 'north' ? z0 - 0.015 : z1 + 0.015);
    }
  }
}

/* ---------------- ceiling fixtures ---------------- */
for (const p of (L.ceiling?.panels || [])) {
  const [x0, z0, x1, z1] = p.rect, sx = (x1 - x0) / p.nx, sz = (z1 - z0) / p.nz;
  for (let i = 0; i < p.nx; i++) for (let j = 0; j < p.nz; j++) {
    const x = x0 + sx * (i + 0.5), z = z0 + sz * (j + 0.5);
    box(0.62, 0.02, 0.62, M.fixture, x, H - 0.025, z); box(0.58, 0.01, 0.58, M.led, x, H - 0.032, z);
  }
}
for (const [x, z] of (L.ceiling?.aircon || [])) { box(0.84, 0.04, 0.84, M.fixture, x, H - 0.045, z); box(0.5, 0.012, 0.5, M.fixture, x, H - 0.055, z); }

/* ---------------- furniture builders ---------------- */
// ※ 가구 모양·치수는 v1 그대로 유지(사용자 요청). 재질만 실제 느낌으로 교체.
function chair(g, o = {}) {      // 사무용 회전의자 (등받이 = 로컬 +z)
  const m = o.color ? matOf(o.color) : M.black;
  box(0.46, 0.07, 0.44, m, 0, 0.42, 0, g); box(0.44, 0.42, 0.05, m, 0, 0.52, 0.22, g);
  cyl(0.025, 0.025, 0.38, M.metal, 0, 0.05, 0, 8, g);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const leg = box(0.28, 0.03, 0.04, M.black, Math.cos(a) * 0.13, 0.03, Math.sin(a) * 0.13, g); leg.rotation.y = -a; }
}
function meshChair(g) {   // 사진 속 NEOBOX 의자: 흰 5발 베이스 + 베이지 시트 + 흰 루프 팔걸이 + 연회색 메쉬 등받이 (등받이 = 로컬 +z, 정면 = -z)
  const W2 = M.white, seat = matOf('fabricBeige');
  const mesh = M.chairMesh || (M.chairMesh = std({ color: 0xcfd2d6, roughness: 0.85, side: THREE.DoubleSide }));
  const tube = (pts, r, m = W2, seg = 24) => { const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 6, false), m); g.add(t); return t; };
  // 5발 베이스(살짝 아래로 휘는 다리) + 바퀴
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
    tube([[ca * 0.03, 0.105, sa * 0.03], [ca * 0.16, 0.095, sa * 0.16], [ca * 0.29, 0.07, sa * 0.29]], 0.016, W2, 6);
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 6), M.black); w.position.set(ca * 0.29, 0.027, sa * 0.29); g.add(w);
    cyl(0.008, 0.008, 0.03, W2, ca * 0.29, 0.045, sa * 0.29, 6, g);
  }
  cyl(0.045, 0.05, 0.05, W2, 0, 0.08, 0, 14, g);                  // 허브
  cyl(0.018, 0.018, 0.25, W2, 0, 0.12, 0, 10, g);                 // 가스 실린더(슬림)
  cyl(0.026, 0.03, 0.08, W2, 0, 0.12, 0, 10, g);
  box(0.16, 0.035, 0.18, W2, 0, 0.36, 0.01, g);                    // 틸트 메커니즘
  // 시트: 둥근 사각 쿠션 (폭 0.47, 깊이 0.45, 윗면 높이 0.46)
  const sh = new THREE.Shape(), sw = 0.47, sd = 0.45, r = 0.09;
  sh.moveTo(-sw / 2 + r, -sd / 2); sh.lineTo(sw / 2 - r, -sd / 2); sh.quadraticCurveTo(sw / 2, -sd / 2, sw / 2, -sd / 2 + r); sh.lineTo(sw / 2, sd / 2 - r); sh.quadraticCurveTo(sw / 2, sd / 2, sw / 2 - r, sd / 2);
  sh.lineTo(-sw / 2 + r, sd / 2); sh.quadraticCurveTo(-sw / 2, sd / 2, -sw / 2, sd / 2 - r); sh.lineTo(-sw / 2, -sd / 2 + r); sh.quadraticCurveTo(-sw / 2, -sd / 2, -sw / 2 + r, -sd / 2);
  const sg = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 4 });
  sg.rotateX(Math.PI / 2); const st = new THREE.Mesh(sg, seat); st.position.set(0, 0.44, -0.01); g.add(st);   // 윗면 ≈ 0.46
  box(0.42, 0.02, 0.4, W2, 0, 0.375, -0.01, g);                    // 시트 아래 흰 쉘
  // 등받이: 아래가 넓고 위가 좁은, 위가 둥근 메쉬 판 (살짝 휘고 뒤로 기울어짐)
  const bh = 0.56, bwB = 0.42, bwT = 0.34, y0 = 0.56;
  const outline = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; outline.push([-(bwB / 2) + (bwB - bwT) / 2 * t, t * (bh - bwT / 2)]); }
  for (let i = 1; i < 12; i++) { const a = Math.PI - i * Math.PI / 12; outline.push([Math.cos(a) * bwT / 2, bh - bwT / 2 + Math.sin(a) * bwT / 2 * 0.75]); }
  for (let i = 8; i >= 0; i--) { const t = i / 8; outline.push([(bwB / 2) - (bwB - bwT) / 2 * t, t * (bh - bwT / 2)]); }
  const bs = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const bg = new THREE.ShapeGeometry(bs, 6); const P = bg.attributes.position;
  const bend = (x) => -1.1 * x * x;                                 // 좌우가 앞으로 감싸듯 휨
  for (let i = 0; i < P.count; i++) P.setZ(i, bend(P.getX(i)));
  bg.computeVertexNormals();
  const back = new THREE.Group(); back.position.set(0, y0, 0.215); back.rotation.x = 0.14; g.add(back);   // 위쪽이 뒤로 기울어짐
  back.add(new THREE.Mesh(bg, mesh));
  const fr = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline.map(([x, y]) => new THREE.Vector3(x, y, bend(x))), true), 64, 0.012, 6, true), W2); back.add(fr);
  tube([[0, 0.39, 0.12], [0, 0.45, 0.2], [0, 0.6, 0.235]], 0.02);   // 등받이 지지대(스파인)
  // 팔걸이: 시트 옆에서 올라와 앞쪽으로 둥글게 돌아 등받이에 이어지는 흰 튜브 루프
  for (const sx of [-1, 1]) {
    tube([[sx * 0.2, 0.44, 0.13], [sx * 0.245, 0.5, 0.0], [sx * 0.255, 0.62, -0.1], [sx * 0.255, 0.665, -0.03], [sx * 0.25, 0.665, 0.1], [sx * 0.215, 0.7, 0.22]], 0.011, W2, 32);
    tube([[sx * 0.2, 0.44, -0.14], [sx * 0.24, 0.52, -0.13], [sx * 0.255, 0.62, -0.1]], 0.011, W2, 10);
  }
}
function stool(g, o) {
  const h = o.h || 0.72, m = matOf(o.color || 'fabricGray');
  cyl(0.17, 0.17, 0.06, m, 0, h, 0, 16, g); cyl(0.02, 0.02, h, M.black, 0, 0, 0, 6, g);
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 16), M.black); r.rotation.x = Math.PI / 2; r.position.set(0, 0.28, 0); g.add(r);
}
function armchair(g, o) {
  const m = matOf(o.color || 'fabricTeal');
  box(0.72, 0.36, 0.68, m, 0, 0.04, 0, g); box(0.72, 0.36, 0.14, m, 0, 0.38, 0.27, g);
  box(0.12, 0.2, 0.62, m, -0.3, 0.38, 0.03, g); box(0.12, 0.2, 0.62, m, 0.3, 0.38, 0.03, g);
  box(0.6, 0.04, 0.56, M.black, 0, 0, 0, g);
}
function cube(g, o) { const s = o.size || 0.42; box(s, o.h || s, s, matOf(o.color || 'fabricOrange'), 0, 0, 0, g); }
function roundTable(g, o) {
  const r = o.r || 0.36, h = o.h || 0.74;
  cyl(r, r, 0.035, matOf(o.top || 'marble'), 0, h - 0.035, 0, 28, g); cyl(0.035, 0.035, h - 0.04, M.black, 0, 0, 0, 8, g); cyl(0.24, 0.26, 0.03, M.black, 0, 0, 0, 20, g);
}
function plant(g, o) {
  const s = o.scale || 1;
  cyl(0.18 * s, 0.14 * s, 0.38 * s, M.pot, 0, 0, 0, 14, g);
  const leaves = [[0, 0.85, 0, 0.32], [0.14, 0.7, 0.08, 0.24], [-0.13, 0.75, -0.06, 0.25], [0.04, 1.08, -0.05, 0.22], [-0.06, 0.6, 0.12, 0.2]];
  leaves.forEach(([dx, dy, dz, r], i) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 0), i % 2 ? M.leaf2 : M.leaf); m.position.set(dx * s, dy * s, dz * s); g.add(m); });
}
function legs4(g, w, d, h, m, inset = 0.06, sz = 0.04) {
  for (const sx of [-1, 1]) for (const sz2 of [-1, 1]) box(sz, h, sz, m, sx * (w / 2 - inset), 0, sz2 * (d / 2 - inset), g);
}
function desk(g, o) {
  const w = o.w || 1.4, d = o.d || 0.6, h = o.h || 0.72;
  box(w, 0.035, d, matOf(o.top || 'white'), 0, h - 0.035, 0, g); legs4(g, w, d, h - 0.035, matOf(o.legs || 'metal'));
}
function deskPair(g, o) {
  const w = o.w || 1.5, d = o.d || 0.5; desk(g, { w, d });
  for (const dx of [-w * 0.24, w * 0.24]) chair(grp(dx, d / 2 + 0.3, 0, g), {});
}
function tableSet(g, o) {   // 테이블(세로 d 방향으로 길게) + 양옆 의자
  const w = o.w, d = o.d, h = 0.72, mods = o.modules || 1, legs = matOf(o.legs || (o.top === 'darkTop' ? 'metal' : 'black'));
  for (let i = 0; i < mods; i++) {
    const md = d / mods - (mods > 1 ? 0.02 : 0), z = -d / 2 + d / mods * (i + 0.5);
    const t = grp(0, z, 0, g); box(w, o.top === 'darkTop' ? 0.04 : 0.035, md, matOf(o.top || 'white'), 0, h - 0.035, 0, t);
    legs4(t, w, md, h - 0.035, legs, o.legInset ?? 0.06, o.top === 'darkTop' ? 0.06 : 0.04);
  }
  const inset = o.chairInset ?? 0.45;
  const place = (cnt, side) => { for (let i = 0; i < cnt; i++) { const z = cnt === 1 ? 0 : -d / 2 + inset + i * (d - 2 * inset) / (cnt - 1); chair(grp(side * (w / 2 + 0.275), z, side * 90, g), {}); } };
  place(o.chairsLeft || 0, -1); place(o.chairsRight || 0, 1);
}
function whiteboard(g, o) { box(o.w || 2, 1.05, 0.04, M.mint, 0, 0.95, 0, g); }
function screen(g, o) { const w = o.w || 2.2; box(w + 0.06, 1.46, 0.015, M.black, 0, 0.92, 0.01, g); box(w, 1.4, 0.02, M.screen, 0, 0.95, -0.01, g); box(w + 0.2, 0.12, 0.14, M.black, 0, 2.38, -0.04, g); }
function tvStand(g) { box(1.3, 0.75, 0.07, M.tv, 0, 0.55, 0, g); box(0.05, 0.6, 0.05, M.black, -0.45, 0, 0, g); box(0.05, 0.6, 0.05, M.black, 0.45, 0, 0, g); box(1.1, 0.04, 0.5, M.black, 0, 0, 0, g); }
function tvWall(g, o) {
  const w = o.w || 2.5; box(w, 1.95, 0.1, M.white, 0, 0.35, 0, g);
  box(1.25, 0.72, 0.04, M.tv, 0, 1.0, -0.07, g);
  box(w - 0.1, 0.025, 0.03, M.glow, 0, 0.37, -0.07, g); box(w - 0.1, 0.025, 0.03, M.glow, 0, 2.26, -0.07, g);
}
function signStand(g) { box(0.32, 0.5, 0.03, M.black, 0, 0.7, 0, g); box(0.025, 0.7, 0.025, M.metal, 0, 0, 0, g); box(0.28, 0.02, 0.22, M.black, 0, 0, 0, g); }
function bench(g, o) { box(o.w || 0.5, o.h || 0.4, o.d || 1.2, matOf(o.color || 'fabricGray'), 0, 0, 0, g); }
function cabinet(g, o) { box(o.w || 1.2, o.h || 0.7, o.d || 0.4, matOf(o.color || 'white'), 0, 0, 0, g); }
function block(g, o) { box(o.w || 0.1, o.h || 0.1, o.d || 0.1, matOf(o.color || 'black'), 0, o.y || 0, 0, g); }   // 단순 박스(소품)
function barCounter(g, o) {
  const w = o.w, d = o.d, h = o.h || 1.02, long = Math.max(w, d), alongX = w >= d;
  box(w, 0.04, d, M.darkTop, 0, h - 0.04, 0, g); box(w + 0.02, 0.045, d + 0.02, M.oak, 0, h - 0.075, 0, g);
  const n = Math.max(1, Math.round(long / 1.4));
  for (let i = 0; i <= n; i++) { const p = -long / 2 + 0.1 + i * (long - 0.2) / n; const sh = (alongX ? d : w) / 2 - 0.06; for (const s of [-1, 1]) box(0.04, h - 0.08, 0.04, M.black, alongX ? p : s * sh, 0, alongX ? s * sh : p, g); }
}
function purifier(g) { cyl(0.19, 0.19, 0.95, M.white, 0, 0, 0, 20, g); const r = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 20), M.black); r.position.set(0, 1.05, 0); r.rotation.y = Math.PI / 2; g.add(r); }
function mat(g, o) { const m = box(o.w || 2, 0.006, o.d || 1.2, matOf(o.color || 'orange'), 0, 0, 0, g); g.userData.noCollide = true; g.userData.noBlob = true; return m; }
function booth(g, o) {   // NEOBOX 1인 부스: 앞(문) = 로컬 -z
  const w = o.w || 1.85, d = o.d || 1.7, ph = 2.2, t = 0.07, x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  box(w, 0.06, d, M.black, 0, 0, 0, g);
  box(t, ph, d, M.white, x0 + t / 2, 0, 0, g); box(t, ph, d, M.white, x1 - t / 2, 0, 0, g); box(w, ph, t, M.white, 0, 0, z1 - t / 2, g);
  for (const xx of [x0 + 0.03, x1 - 0.03]) for (const zz of [z0 + 0.03, z1 - 0.03]) box(0.07, ph + 0.02, 0.07, M.black, xx, 0, zz, g);
  box(w, 0.04, 0.08, M.black, 0, ph, z0 + 0.03, g); box(w, 0.04, 0.08, M.black, 0, ph, z1 - 0.03, g);
  box(0.08, 0.04, d, M.black, x0 + 0.03, ph, 0, g); box(0.08, 0.04, d, M.black, x1 - 0.03, ph, 0, g);
  box(w, 0.05, d, M.white, 0, ph - 0.05, 0, g);
  const dg = new THREE.Group(); dg.position.set(x0 + 0.14, 0, z0 + 0.02); dg.rotation.y = 0; g.add(dg); dg.userData.noCollide = true; dg.userData.dynamic = true;
  registerDoor([{ g: dg, base: 0, swing: (o.swing || 72) * DEG }], o.open === true, o.label);
  const lw = w - 0.38, leaf = new THREE.Mesh(new THREE.BoxGeometry(lw, 2.08, 0.045), M.frost); leaf.position.set(lw / 2, 1.04, 0); dg.add(leaf);
  box(lw, 0.04, 0.055, M.black, lw / 2, 2.06, 0, dg); box(lw, 0.04, 0.055, M.black, lw / 2, 0, 0, dg);
  box(0.04, 2.1, 0.055, M.black, 0.02, 0, 0, dg); box(0.04, 2.1, 0.055, M.black, lw - 0.02, 0, 0, dg);
  box(0.22, ph, 0.05, M.black, x1 - 0.13, 0, z0 + 0.02, g); box(0.04, ph - 0.1, 0.05, M.black, x0 + 0.12, 0.04, z0 + 0.02, g); box(w, ph - 2.1, 0.05, M.black, 0, 2.1, z0 + 0.02, g);
  if (o.label) { const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.17), new THREE.MeshBasicMaterial({ map: textTexture(o.label) })); lab.position.set(0, 2.15, z0 - 0.01); lab.rotation.y = Math.PI; lab.userData.keep = true; g.add(lab); }
  // 내부: 회색 패브릭 흡음 벽 + 어두운 카펫
  const fab = matOf('fabricGray'), carpet = plain(0x3b3e44);
  box(w - 0.16, 0.012, d - 0.12, carpet, 0, 0.06, 0, g);
  box(0.02, ph - 0.12, d - 0.14, fab, x0 + t + 0.01, 0.06, 0, g); box(0.02, ph - 0.12, d - 0.14, fab, x1 - t - 0.01, 0.06, 0, g);
  box(w - 0.16, ph - 0.12, 0.02, fab, 0, 0.06, z1 - t - 0.01, g);
  // 책상: 문에서 봤을 때 왼쪽 벽(로컬 +x)을 따라 긴 흰 상판, 문 쪽 끝은 둥글게
  const dw = 0.6, dl = d - 0.5, dcx = x1 - t - dw / 2 - 0.02, dcz = (z1 - t) - dl / 2 - 0.02;
  box(dw, 0.03, dl - dw / 2, M.white, dcx, 0.72, dcz + dw / 4, g);
  const cap = cyl(dw / 2, dw / 2, 0.03, M.white, dcx, 0.72, dcz - dl / 2 + dw / 2, 24, g);
  box(0.03, 0.72, 0.45, M.white, x1 - t - 0.05, 0, dcz + dl / 2 - 0.3, g);
  // 오크 모니터 선반 + 모니터 + 키보드·마우스
  const sw = 0.24, scx = x1 - t - sw / 2 - 0.03;
  box(sw, 0.03, dl - 0.15, M.oak, scx, 0.86, dcz + 0.05, g);
  box(0.03, 0.11, 0.03, M.black, scx, 0.75, dcz - dl / 2 + 0.35, g); box(0.03, 0.11, 0.03, M.black, scx, 0.75, dcz + dl / 2 - 0.15, g);
  box(0.2, 0.012, 0.22, M.black, scx, 0.89, dcz + 0.25, g); box(0.03, 0.12, 0.03, M.black, scx + 0.03, 0.9, dcz + 0.25, g);
  box(0.03, 0.34, 0.58, M.tv, scx - 0.02, 1.0, dcz + 0.25, g);
  box(0.15, 0.02, 0.44, M.black, x1 - t - 0.42, 0.75, dcz + 0.05, g); box(0.07, 0.025, 0.05, M.black, x1 - t - 0.42, 0.75, dcz - 0.28, g);
  // 링라이트 스탠드 (문 쪽 모서리)
  const rlx = x1 - t - 0.12, rlz = z0 + 0.22;
  cyl(0.012, 0.012, 1.5, M.black, rlx, 0, rlz, 8, g);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 28), M.white); ring.position.set(rlx - 0.04, 1.62, rlz); ring.rotation.y = Math.PI / 2; g.add(ring);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const l = box(0.2, 0.015, 0.02, M.black, rlx + Math.cos(a) * 0.08, 0.06, rlz + Math.sin(a) * 0.08, g); l.rotation.y = -a; }
  // 의자: 흰 프레임 + 베이지 시트 + 연회색 메쉬 등받이, 책상(+x)을 바라봄
  meshChair(grp(x1 - t - 0.95, dcz - 0.05, -90, g));
}
function pantry(g, o) {   // 탕비 카운터: 뒤(벽) = 로컬 +z
  const w = o.w || 5, x0 = -w / 2;
  box(w, 0.88, 0.6, M.white, 0, 0, 0, g); box(w, 0.03, 0.62, M.marble, 0, 0.88, -0.01, g);
  box(0.4, 0.45, 0.42, M.black, x0 + 1.4, 0.91, -0.02, g); box(0.6, 0.012, 0.4, M.metal, x0 + 3.3, 0.912, -0.02, g); cyl(0.015, 0.015, 0.25, M.metal, x0 + 3.3, 0.91, -0.2, 8, g);
  box(w, 0.85, 0.36, M.white, 0, 1.55, 0.12, g); for (let i = 1; i < 7; i++) box(0.01, 0.8, 0.01, plain(0xb7bbc1), x0 + i * w / 7, 1.57, -0.06, g);
  box(0.3, 0.35, 0.38, M.darkTop, x0 + 1.9, 0.91, -0.02, g); box(0.5, 0.3, 0.36, M.black, x0 + 0.7, 0.91, -0.02, g);
  [0x2b5fa8, 0xf2c230, 0x4caf50, 0xe0e0e0].forEach((c, i) => box(0.42, 0.6, 0.02, plain(c), x0 + 2.6 + i * 0.48, 0.15, -0.31, g));
}
function slats(o) {   // from → to 선을 따라 세로 우드 루버
  const [ax, az] = o.from, [bx, bz] = o.to, n = o.count || 8, h = o.h || 2.5, horiz = Math.abs(az - bz) < 1e-6;
  const g = new THREE.Group(); root.add(g);
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0 : i / (n - 1), x = ax + (bx - ax) * f, z = az + (bz - az) * f;
    box(horiz ? 0.05 : (o.thick ? 0.07 : 0.06), h, horiz ? (o.thick ? 0.07 : 0.06) : 0.05, M.oak, x, 0, z, g);
  }
  if (o.thick) box(horiz ? Math.abs(bx - ax) + 0.1 : 0.08, 0.04, horiz ? 0.08 : Math.abs(bz - az) + 0.1, M.oak, (ax + bx) / 2, h, (az + bz) / 2, g);
  g.userData.noBlob = true; return g;
}
const BUILDERS = { block, chair, stool, armchair, cube, roundTable, plant, desk, deskPair, tableSet, whiteboard, screen, tvStand, tvWall, signStand, bench, cabinet, barCounter, purifier, mat, booth, pantry };
const NOBLOB = new Set(['whiteboard', 'screen', 'tvWall', 'mat', 'slats', 'booth']);
const blobs = [];
function place(o) {
  if (o.type === 'array') {
    let k = 0;
    for (const z of o.zs) for (const x of o.xs) { const it = Object.assign({}, o.item, { x, z }); if (o.colors) it.color = o.colors[k % o.colors.length]; if (o.rot != null && it.rot == null) it.rot = o.rot; place(it); k++; }
    return;
  }
  if (o.type === 'slats') { slats(o); return; }
  const fn = BUILDERS[o.type]; if (!fn) { console.warn('알 수 없는 가구 type:', o.type, o); return; }
  const g = grp(o.x, o.z, o.rot || 0); fn(g, o);
  if (!NOBLOB.has(o.type) && !g.userData.noBlob) blobs.push(g);
}
for (const f of L.furniture) place(f);

/* ---------------- blob contact shadows ---------------- */
{
  root.updateMatrixWorld(true);
  const geos = [], bb = new THREE.Box3(), c = new THREE.Vector3(), s = new THREE.Vector3();
  for (const g of blobs) {
    bb.setFromObject(g); bb.getCenter(c); bb.getSize(s);
    const pg = new THREE.PlaneGeometry(s.x * 1.15 + 0.25, s.z * 1.15 + 0.25); pg.rotateX(-Math.PI / 2); pg.translate(c.x, 0.004, c.z); geos.push(pg);
  }
  if (geos.length) {
    const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ map: T.blob, transparent: true, depthWrite: false, opacity: HIGH ? 0.42 : 0.75, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.renderOrder = 1; scene.add(m);
  }
}

/* ---------------- colliders + merge static meshes ---------------- */
const COLL = [], CELL = 1, grid = new Map();
const wallMeshes = [];
{
  root.updateMatrixWorld(true);
  const bb = new THREE.Box3(), groups = new Map(), remove = [];
  const noCol = (o) => { for (let p = o; p; p = p.parent) if (p.userData.noCollide) return true; return false; };
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (!noCol(o)) { bb.setFromObject(o); if (bb.max.y > 0.12 && bb.min.y < 1.75) COLL.push([bb.min.x, bb.min.z, bb.max.x, bb.max.z]); }
    const m = o.material;
    let dyn = false; for (let p = o; p; p = p.parent) if (p.userData.dynamic) { dyn = true; break; }
    if (dyn || o.userData.keep || m.transparent || (m.map && !m.userData.world)) { o.castShadow = HIGH && !m.transparent; o.receiveShadow = true; return; }
    let gg = o.geometry.clone(); gg.applyMatrix4(o.matrixWorld); if (gg.index) gg = gg.toNonIndexed();
    for (const k of Object.keys(gg.attributes)) if (k !== 'position' && k !== 'normal') gg.deleteAttribute(k);
    const P = gg.attributes.position, N = gg.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), nz = Math.abs(N.getZ(i));
      if (ny >= nx && ny >= nz) { uv[i * 2] = P.getX(i); uv[i * 2 + 1] = P.getZ(i); }
      else if (nx >= nz) { uv[i * 2] = P.getZ(i); uv[i * 2 + 1] = P.getY(i); }
      else { uv[i * 2] = P.getX(i); uv[i * 2 + 1] = P.getY(i); }
    }
    gg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (!groups.has(m)) groups.set(m, []); groups.get(m).push(gg); remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const [m, list] of groups) {
    const mesh = new THREE.Mesh(mergeGeometries(list), m);
    mesh.castShadow = HIGH && !m.userData.noShadow; mesh.receiveShadow = true; root.add(mesh);
    if (m === M.paint) wallMeshes.push(mesh);
    if (m === M.floor) mesh.userData.floor = true;
  }
  for (let i = 0; i < COLL.length; i++) {
    const [a, b, c, d] = COLL[i];
    for (let gx = Math.floor(a / CELL); gx <= Math.floor(c / CELL); gx++) for (let gz = Math.floor(b / CELL); gz <= Math.floor(d / CELL); gz++) {
      const k = gx + ',' + gz; if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i);
    }
  }
}
// 닫힌 상태의 문짝 영역(충돌 박스) 계산 후, 초기 상태로 회전
{
  const bb = new THREE.Box3();
  for (const d of DOORS) {
    for (const l of d.leaves) l.g.rotation.y = l.base;
    root.updateMatrixWorld(true);
    d.box = new THREE.Box3(); for (const l of d.leaves) d.box.union(bb.setFromObject(l.g));
    d.c = d.box.getCenter(new THREE.Vector3());
    for (const l of d.leaves) l.g.rotation.y = l.base + l.swing * d.cur;
  }
}
const PR = 0.24;
const circleHits = (x, z, a, b, c, d) => { const cx = Math.max(a, Math.min(x, c)), cz = Math.max(b, Math.min(z, d)); return (x - cx) ** 2 + (z - cz) ** 2 < PR * PR; };
const doorClosed = (d, plan) => d.target === 0 || (!plan && d.cur < 0.85);
function blocked(x, z, plan = false) {
  if (x < PR || z < PR || x > W - PR || z > D - PR) return true;
  for (const d of DOORS) if (doorClosed(d, plan) && circleHits(x, z, d.box.min.x, d.box.min.z, d.box.max.x, d.box.max.z)) return true;
  const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL);
  for (let i = gx - 1; i <= gx + 1; i++) for (let j = gz - 1; j <= gz + 1; j++) {
    const l = grid.get(i + ',' + j); if (!l) continue;
    for (const k of l) { const [a, b, c, d] = COLL[k]; const cx = Math.max(a, Math.min(x, c)), cz = Math.max(b, Math.min(z, d)); if ((x - cx) ** 2 + (z - cz) ** 2 < PR * PR) return true; }
  }
  return false;
}
function freeNear(x, z) {
  if (!blocked(x, z)) return [x, z];
  for (let r = 0.1; r < 3; r += 0.1) for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) { const xx = x + Math.cos(a) * r, zz = z + Math.sin(a) * r; if (!blocked(xx, zz)) return [xx, zz]; }
  return [x, z];
}

/* ---------------- wall caps (3D 보기 단면) ---------------- */
const caps = new THREE.Group(); caps.visible = false; scene.add(caps);
for (const s of WALLSEGS) {
  const m = s.type === 'solid' || s.type === 'column' ? M.cap : M.capGlass;
  const cw = s.type === 'column' ? s.x2 - s.x1 : (s.z1 === s.z2 ? s.x2 - s.x1 : (s.type === 'solid' ? s.t : 0.08));
  const cd = s.type === 'column' ? s.z2 - s.z1 : (s.z1 === s.z2 ? (s.type === 'solid' ? s.t : 0.08) : s.z2 - s.z1);
  box(cw, 0.02, cd, m, (s.x1 + s.x2) / 2, CUT_Y - 0.021, (s.z1 + s.z2) / 2, caps);
}
const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_Y);
let cutOn = null;
function setCut(on) { if (on === cutOn) return; cutOn = on; renderer.clippingPlanes = on ? [cutPlane] : []; caps.visible = on; }

/* ---------------- edit grid ---------------- */
let editTip = null;
if (EDIT) {
  const n = Math.ceil(Math.max(W, D)) + 2;
  const gh = new THREE.GridHelper(n, n, 0xff8207, 0x0b2e67); gh.position.set(n / 2 - 1, 0.012, n / 2 - 1); gh.material.transparent = true; gh.material.opacity = 0.35; scene.add(gh);
  const ax = new THREE.AxesHelper(2); ax.position.set(0, 0.02, 0); scene.add(ax);
  for (let x = 0; x <= Math.ceil(W); x += 2) { const e = document.createElement('div'); e.className = 'tick'; e.textContent = 'x ' + x; const o = new CSS2DObject(e); o.position.set(x, 0.05, -0.5); scene.add(o); }
  for (let z = 0; z <= Math.ceil(D); z += 2) { const e = document.createElement('div'); e.className = 'tick'; e.textContent = 'z ' + z; const o = new CSS2DObject(e); o.position.set(-0.6, 0.05, z); scene.add(o); }
  editTip = document.getElementById('coord');
}

/* ---------------- rooms / labels ---------------- */
const ROOMS = {}; for (const r of L.rooms) ROOMS[r.id] = r;
function zoneAt(x, z) { for (const r of L.rooms) { const [a, b, c, d] = r.rect; if (x >= a && x <= c && z >= b && z <= d) return r; } return null; }
const tagEls = {}, tagObjs = {};
for (const r of L.rooms) {
  const el = document.createElement('div'); el.className = 'tag' + (r.small ? ' sm' : ''); el.dataset.id = r.id;
  el.innerHTML = `<div class="pill"><i></i>${r.name}<small>${r.en.split(' · ')[0]}</small></div><div class="stem"></div><div class="dot"></div>`;
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => { e.stopPropagation(); if (mode === 'orbit') goRoom(r.id); openCard(r.id); });
  const o = new CSS2DObject(el); o.position.set(r.label[0], r.labelY || 2.05, r.label[1]); scene.add(o);
  tagEls[r.id] = el; tagObjs[r.id] = o;
}
const card = document.getElementById('card');
function openCard(id) {
  const r = ROOMS[id], c = r.card || { photos: [], desc: '' };
  Object.values(tagEls).forEach((e) => e.classList.remove('active')); tagEls[id].classList.add('active');
  document.getElementById('cEn').textContent = r.en; document.getElementById('cTitle').textContent = r.name;
  const main = document.getElementById('cMain'); main.src = c.photos[0] ? `photos/${c.photos[0]}.jpg` : ''; main.alt = r.name;
  const th = document.getElementById('cThumbs'); th.innerHTML = '';
  c.photos.forEach((p, i) => { const im = document.createElement('img'); im.src = `photos/${p}.jpg`; if (!i) im.className = 'on'; im.onclick = () => { main.src = im.src; th.querySelectorAll('img').forEach((x) => x.classList.remove('on')); im.classList.add('on'); }; th.appendChild(im); });
  document.getElementById('cInfo').innerHTML = `<span>수용 인원 ${r.capacity ?? '○○'}명</span><span>면적 ${r.area ?? '○○'}㎡</span>`;
  document.getElementById('cDesc').textContent = c.desc;
  card.classList.add('open');
}
document.getElementById('cClose').onclick = () => { card.classList.remove('open'); Object.values(tagEls).forEach((e) => e.classList.remove('active')); };

/* ---------------- 문: 갇히지 않게 자동 열기 ----------------
   착지 지점에서 라운지까지 걸어서 갈 수 없으면(닫힌 문으로 막힌 방), 그 방을 둘러싼 문을 자동으로 열어요. */
function ensureEscape(x, z) {
  const S = 0.2, NX = Math.ceil(W / S), NZ = Math.ceil(D / S), ref = ROOMS.lounge?.jump || { x: W / 2, z: D / 2 };
  const [rx, rz] = freeNear(ref.x, ref.z);
  const rk = Math.floor(rx / S) + Math.floor(rz / S) * NX;
  for (let iter = 0; iter < 5; iter++) {
    const seen = new Uint8Array(NX * NZ), q = [], k0 = Math.floor(x / S) + Math.floor(z / S) * NX;
    q.push(k0); seen[k0] = 1; let found = false;
    while (q.length) {
      const k = q.pop(); if (k === rk) { found = true; break; }
      const ix = k % NX, iz = (k / NX) | 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= NX || jz >= NZ) continue;
        const j = jx + jz * NX; if (seen[j]) continue; seen[j] = 1;
        if (!blocked((jx + 0.5) * S, (jz + 0.5) * S, true)) q.push(j);
      }
    }
    if (found) return;
    let opened = 0;
    for (const d of DOORS) {
      if (d.target === 1) continue;
      const a = Math.floor((d.box.min.x - 0.4) / S), b = Math.floor((d.box.max.x + 0.4) / S), c = Math.floor((d.box.min.z - 0.4) / S), e = Math.floor((d.box.max.z + 0.4) / S);
      let touch = false;
      for (let ix = a; ix <= b && !touch; ix++) for (let iz = c; iz <= e; iz++) { if (ix >= 0 && iz >= 0 && ix < NX && iz < NZ && seen[ix + iz * NX] && !blocked((ix + 0.5) * S, (iz + 0.5) * S, true)) { touch = true; break; } }
      if (touch) { d.target = 1; opened++; }
    }
    if (!opened) return;
  }
}
/* ---------------- 문: 가까이 가면 E 열기/닫기 ---------------- */
const doorPrompt = document.getElementById('doorPrompt'), doorBtn = document.getElementById('doorBtn');
let nearDoor = null;
function findNearDoor() {
  if (mode !== 'walk' || flight) return null;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); let best = null, bd = 1e9;
  for (const d of DOORS) {
    const dx = d.c.x - player.x, dz = d.c.z - player.z, dist = Math.hypot(dx, dz); if (dist > 1.8) continue;
    const cos = (dx * fx + dz * fz) / (dist || 1);
    if (cos < 0.55 && dist > 0.8) continue;
    if (dist < bd) { bd = dist; best = d; }
  }
  return best;
}
function toggleDoor(d) {
  if (!d) return;
  if (d.target === 1) {
    if (circleHits(player.x, player.z, d.box.min.x, d.box.min.z, d.box.max.x, d.box.max.z)) { toast('문 앞에서 조금 비켜 주세요'); return; }
    d.target = 0;
  } else d.target = 1;
}
function updateDoors(dt) {
  for (const d of DOORS) {
    const goal = mode === 'orbit' ? 1 : d.target;   // 3D 보기에서는 모든 문을 열어서 보여 줌
    if (d.cur !== goal) { const s = dt / 0.6; d.cur = goal > d.cur ? Math.min(goal, d.cur + s) : Math.max(goal, d.cur - s); for (const l of d.leaves) l.g.rotation.y = l.base + l.swing * ease(d.cur); }
  }
  const nd = findNearDoor();
  if (nd !== nearDoor || (nd && doorPrompt.dataset.st !== String(nd.target))) {
    nearDoor = nd;
    const label = nd ? (nd.target === 1 ? '닫기' : '열기') : '';
    doorPrompt.dataset.st = nd ? String(nd.target) : '';
    doorPrompt.innerHTML = nd ? `<kbd>E</kbd>${label}` : ''; doorPrompt.classList.toggle('on', !!nd);
    doorBtn.textContent = label; doorBtn.classList.toggle('on', !!nd);
  }
}
doorBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); toggleDoor(nearDoor); });
window.__doors = DOORS;

/* ---------------- player / modes / flights ---------------- */
const player = { x: 0, z: 0, yaw: 0, pitch: -0.04 }; window.__player = player;
window.__player = player;
const yawTo = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz));
let mode = 'walk', flight = null, visitedWalk = false;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = false;
controls.minDistance = 3; controls.maxDistance = 48; controls.maxPolarAngle = 80 * DEG; controls.enabled = false;
controls.target.set(W / 2, 0, D / 2);
const ORBIT_HOME = { pos: new THREE.Vector3(W / 2 - 8.5, 26.5, D / 2 + 21.5), target: new THREE.Vector3(W / 2, 0, D / 2 + 2.4) };
{ // 세로 화면(모바일)에서는 건물 전체가 들어오도록 더 멀리서 시작
  const asp = innerWidth / innerHeight, k = asp < 1.2 ? Math.min(2.4, Math.pow(1.2 / asp, 0.85)) : 1;
  ORBIT_HOME.pos.sub(ORBIT_HOME.target).multiplyScalar(k).add(ORBIT_HOME.target);
}
let orbitSaved = { pos: ORBIT_HOME.pos.clone(), target: ORBIT_HOME.target.clone() };
if (SHOT === 'plan') orbitSaved = { pos: new THREE.Vector3(W / 2, 33, D / 2 + 3.4), target: new THREE.Vector3(W / 2, 0, D / 2 + 0.2) };   // 위에서 내려다본 평면 스크린샷용
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
function quatLook(pos, target) { const m = new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0)); return new THREE.Quaternion().setFromRotationMatrix(m); }
function quatYawPitch(yaw, pitch) { return new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ')); }
function fly(toPos, toQuat, toFov, dur, kind, done) {
  flight = { p0: camera.position.clone(), q0: camera.quaternion.clone(), f0: camera.fov, p1: toPos, q1: toQuat, f1: toFov, t: 0, dur, kind, done };
  controls.enabled = false; document.body.classList.add('flying');
}
function stepFlight(dt) {
  const f = flight; f.t = Math.min(1, f.t + dt / f.dur); const t = f.t;
  let txz, ty;
  if (f.kind === 'down') { txz = ease(clamp01(t / 0.72)); ty = ease(clamp01((t - 0.12) / 0.88)); }
  else if (f.kind === 'up') { ty = ease(clamp01(t / 0.6)); txz = ease(clamp01((t - 0.15) / 0.85)); }
  else { txz = ty = ease(t); }
  camera.position.set(f.p0.x + (f.p1.x - f.p0.x) * txz, f.p0.y + (f.p1.y - f.p0.y) * ty, f.p0.z + (f.p1.z - f.p0.z) * txz);
  camera.quaternion.slerpQuaternions(f.q0, f.q1, ease(t));
  camera.fov = f.f0 + (f.f1 - f.f0) * ease(t); camera.updateProjectionMatrix();
  if (t >= 1) { flight = null; document.body.classList.remove('flying'); f.done && f.done(); }
}
function setModeUI() { if (mode !== "walk" && document.pointerLockElement) document.exitPointerLock();
  document.body.classList.toggle('orbit', mode === 'orbit'); document.body.classList.toggle('walk', mode === 'walk');
  document.querySelectorAll('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
}
function enterWalk(x, z, yaw, instant = false) {
  [x, z] = freeNear(x, z); ensureEscape(x, z);
  const land = () => { mode = 'walk'; player.x = x; player.z = z; player.yaw = yaw; player.pitch = -0.04; visitedWalk = true; setModeUI(); };
  if (mode === 'orbit') { orbitSaved = { pos: camera.position.clone(), target: controls.target.clone() }; }
  if (instant) { camera.fov = FOV_WALK; camera.updateProjectionMatrix(); land(); return; }
  const wasOrbit = mode === 'orbit'; mode = 'fly'; setModeUI();
  fly(new THREE.Vector3(x, EYE, z), quatYawPitch(yaw, -0.04), FOV_WALK, wasOrbit ? 2.0 : 0.9, wasOrbit ? 'down' : 'line', land);
}
function enterOrbit(instant = false) {
  const { pos, target } = orbitSaved;
  const land = () => { mode = 'orbit'; camera.position.copy(pos); controls.target.copy(target); controls.enabled = true; controls.update(); setModeUI(); };
  if (instant) { camera.fov = FOV_ORBIT; camera.updateProjectionMatrix(); land(); return; }
  mode = 'fly'; setModeUI();
  fly(pos.clone(), quatLook(pos, target), FOV_ORBIT, 1.8, 'up', land);
}
function goRoom(id, instant = false) {
  const j = ROOMS[id].jump; enterWalk(j.x, j.z, yawTo(j.x, j.z, j.look[0], j.look[1]), instant);
}
Object.defineProperty(window, '__mode', { get: () => mode });
window.__go = (m, id) => m === 'orbit' ? enterOrbit(true) : goRoom(id || 'entrance', true);

/* ---------------- UI: modes, jumps, quality ---------------- */
document.querySelectorAll('#modes button').forEach((b) => b.onclick = () => {
  if (flight) return;
  if (b.dataset.mode === 'orbit' && mode === 'walk') enterOrbit();
  else if (b.dataset.mode === 'walk' && mode === 'orbit') { if (visitedWalk) enterWalk(player.x, player.z, player.yaw); else goRoom(L.start?.room || 'entrance'); }
});
const jumps = document.getElementById('jumps');
const jumpOrder = ['entrance', 'lounge', 'classroom', 'meeting', 'coaching', 'focus', 'coffee'].filter((id) => ROOMS[id]).concat(L.rooms.map((r) => r.id).filter((id) => !['entrance', 'lounge', 'classroom', 'meeting', 'coaching', 'focus', 'coffee'].includes(id)));
for (const id of jumpOrder) {
  const b = document.createElement('button'); b.textContent = ROOMS[id].name; b.dataset.id = id;
  b.onclick = () => { if (flight) return; if (mode === 'orbit') goRoom(id); else { const j = ROOMS[id].jump; enterWalk(j.x, j.z, yawTo(j.x, j.z, j.look[0], j.look[1]), true); } };
  jumps.appendChild(b);
}
const qb = document.getElementById('quality'); qb.textContent = HIGH ? '화질 높음' : '화질 낮음'; qb.classList.toggle('hi', HIGH);
qb.onclick = () => { const nq = HIGH ? 'low' : 'high'; localStorage.setItem('neo_q', nq); const p = new URLSearchParams(location.search); p.set('q', nq); location.search = p.toString(); };

/* ---------------- input ---------------- */
const keys = {};
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; keys[e.code] = true; if (e.code === 'KeyE' && !e.repeat && mode === 'walk') toggleDoor(nearDoor); if (e.code === 'KeyV') document.querySelector(`#modes button[data-mode=${mode === 'walk' ? 'orbit' : 'walk'}]`)?.click(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cv = renderer.domElement; let drag = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
function floorAt(cx, cy) { ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(floorPlane, hit) && hit.x >= 0 && hit.x <= W && hit.z >= 0 && hit.z <= D ? hit.clone() : null; }
/* 걷기 모드(PC): 화면을 한 번 클릭하면 마우스가 시점에 고정되어, 마우스를 움직이는 방향으로 둘러봐요. Esc로 해제. */
const LOCKABLE = !TOUCH && !SHOT && 'requestPointerLock' in cv;
const isLocked = () => document.pointerLockElement === cv;
const lockHint = document.createElement('div'); lockHint.id = 'lockHint';
lockHint.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);padding:12px 18px;border-radius:12px;background:rgba(18,36,82,.82);color:#fff;font:600 14px Pretendard,sans-serif;pointer-events:none;z-index:30;display:none;text-align:center;line-height:1.5';
lockHint.innerHTML = '화면을 클릭하면 마우스로 둘러볼 수 있어요<br><span style="font-weight:400;opacity:.8">Esc를 누르면 해제 · 이름표·버튼을 누르려면 먼저 Esc</span>';
document.body.appendChild(lockHint);
const crosshair = document.createElement('div');
crosshair.style.cssText = 'position:fixed;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px rgba(18,36,82,.7);pointer-events:none;z-index:30;display:none';
document.body.appendChild(crosshair);
function updLockUI() { const w = LOCKABLE && mode === 'walk' && !flight; lockHint.style.display = w && !isLocked() ? 'block' : 'none'; crosshair.style.display = isLocked() ? 'block' : 'none'; }
document.addEventListener('pointerlockchange', updLockUI);
setInterval(updLockUI, 300);
document.addEventListener('mousemove', (e) => {
  if (!isLocked() || mode !== 'walk') return;
  player.yaw -= e.movementX * 0.0022; player.pitch = Math.max(-1.1, Math.min(0.9, player.pitch - e.movementY * 0.0022));
});
cv.addEventListener('pointerdown', (e) => {
  if (LOCKABLE && mode === 'walk' && !flight && e.pointerType === 'mouse') { if (!isLocked()) cv.requestPointerLock(); return; }
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() }; if (mode === 'walk') cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', (e) => {
  if (EDIT && editTip) { const p = floorAt(e.clientX, e.clientY); editTip.textContent = p ? `x ${p.x.toFixed(2)} m · z ${p.z.toFixed(2)} m` : '건물 밖'; }
  if (!drag || drag.id !== e.pointerId || mode !== 'walk') return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  player.yaw += dx * 0.0042; player.pitch = Math.max(-1.1, Math.min(0.9, player.pitch + dy * 0.0035));
});
cv.addEventListener('pointerup', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const click = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6 && performance.now() - drag.t < 450; drag = null;
  if (!click || flight) return;
  const p = floorAt(e.clientX, e.clientY); if (!p) return;
  if (EDIT) { const txt = `[${p.x.toFixed(2)}, ${p.z.toFixed(2)}]`; navigator.clipboard?.writeText(txt).catch(() => {}); toast(`${txt} 좌표 복사됨`); return; }
  if (mode === 'orbit') enterWalk(p.x, p.z, yawTo(camera.position.x, camera.position.z, p.x, p.z));
});
cv.addEventListener('dblclick', (e) => { if (!EDIT || mode !== 'orbit' || flight) return; const p = floorAt(e.clientX, e.clientY); if (p) enterWalk(p.x, p.z, yawTo(camera.position.x, camera.position.z, p.x, p.z)); });
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1600); }
// joystick
const joy = document.getElementById('joy'), knob = joy.querySelector('i'); const jv = { x: 0, y: 0 }; let joyId = null;
joy.addEventListener('pointerdown', (e) => { e.stopPropagation(); joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = (e) => { if (e.pointerId !== joyId) return; joyId = null; jv.x = jv.y = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
function joyMove(e) { const r = joy.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } jv.x = x; jv.y = y; knob.style.transform = `translate(${x * 34}px,${y * 34}px)`; }

/* ---------------- minimap ---------------- */
const mm = document.getElementById('minimap'), mctx = mm.getContext('2d'), dpr = Math.min(devicePixelRatio, 2);
const MS = 190 / Math.max(W, D), PAD = 7, MW = W * MS + PAD * 2, MH = D * MS + PAD * 2;
mm.width = MW * dpr; mm.height = MH * dpr; mm.style.width = MW + 'px'; mm.style.height = MH + 'px';
const mx = (x) => PAD + x * MS, mz = (z) => PAD + z * MS;
const mapBase = document.createElement('canvas'); mapBase.width = mm.width; mapBase.height = mm.height;
{
  const c = mapBase.getContext('2d'); c.scale(dpr, dpr);
  c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(mx(0), mz(0), W * MS, D * MS);
  for (const r of L.rooms) { if (r.id === 'lounge') continue; const [a, b, cc, d] = r.rect; c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(mx(a), mz(b), (cc - a) * MS, (d - b) * MS); }
  for (const s of WALLSEGS) {
    if (s.type === 'column') { c.fillStyle = '#fff'; c.fillRect(mx(s.x1), mz(s.z1), (s.x2 - s.x1) * MS, (s.z2 - s.z1) * MS); continue; }
    c.strokeStyle = s.type === 'solid' ? '#fff' : s.type === 'window' ? '#8fd0ff' : '#b9cde8'; c.lineWidth = s.type === 'solid' ? 2.4 : 1.6;
    c.beginPath(); c.moveTo(mx(s.x1), mz(s.z1)); c.lineTo(mx(s.x2), mz(s.z2)); c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '600 9.5px Pretendard, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const r of L.rooms) c.fillText(r.name, mx(r.label[0]), mz(r.label[1]));
}
function drawMap() {
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, mm.width, mm.height); mctx.drawImage(mapBase, 0, 0); mctx.scale(dpr, dpr);
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'), yaw = e.y;
  const px = mx(camera.position.x), pz = mz(camera.position.z), dx = -Math.sin(yaw), dz = -Math.cos(yaw), a = Math.atan2(dz, dx);
  if (mode === 'orbit') { const t = controls.target; mctx.strokeStyle = 'rgba(255,130,7,.9)'; mctx.lineWidth = 1.5; mctx.beginPath(); mctx.arc(mx(t.x), mz(t.z), 6, 0, Math.PI * 2); mctx.stroke(); return; }
  mctx.fillStyle = 'rgba(255,130,7,.35)'; mctx.beginPath(); mctx.moveTo(px, pz); mctx.arc(px, pz, 24, a - 0.6, a + 0.6); mctx.closePath(); mctx.fill();
  mctx.fillStyle = '#FF8207'; mctx.strokeStyle = '#fff'; mctx.lineWidth = 2; mctx.beginPath(); mctx.arc(px, pz, 5, 0, Math.PI * 2); mctx.fill(); mctx.stroke();
}
mm.addEventListener('pointerdown', (e) => {
  e.stopPropagation(); if (flight) return;
  const r = mm.getBoundingClientRect(), k = MW / r.width; const x = ((e.clientX - r.left) * k - PAD) / MS, z = ((e.clientY - r.top) * k - PAD) / MS;
  if (mode === 'orbit') enterWalk(x, z, yawTo(controls.target.x, controls.target.z + 30, x, z) || 0);
  else { [player.x, player.z] = freeNear(x, z); ensureEscape(player.x, player.z); }
});

/* ---------------- labels occlusion ---------------- */
const v3 = new THREE.Vector3(), lray = new THREE.Raycaster();
function updateLabels() {
  for (const [id, o] of Object.entries(tagObjs)) {
    let vis = true;
    if (mode === 'walk') {
      v3.copy(o.position).sub(camera.position); const d = v3.length(); vis = d < 16 && d > 2.2;
      if (vis) { lray.set(camera.position, v3.normalize()); lray.far = d - 0.3; vis = lray.intersectObjects(wallMeshes, false).length === 0; }
    } else if (mode === 'fly') vis = false;
    tagEls[id].classList.toggle('hid', !vis);
  }
}

/* ---------------- loop ---------------- */
const clock = new THREE.Clock(); let frame = 0, lastZone = '';
const whereName = document.getElementById('whereName');
function step(dt) {
  let f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1; if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyD) s += 1; if (keys.KeyA) s -= 1;
  if (keys.ArrowLeft) player.yaw += 1.8 * dt; if (keys.ArrowRight) player.yaw -= 1.8 * dt;
  if (Math.abs(jv.x) > 0.05 || Math.abs(jv.y) > 0.05) { f -= jv.y; s += jv.x; }
  const sp = (keys.ShiftLeft || keys.ShiftRight ? 3.4 : 1.8) * dt, m = Math.hypot(f, s); if (m > 1) { f /= m; s /= m; }
  if (m > 0.01) {
    const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
    const dx = (fx * f + rx * s) * sp, dz = (fz * f + rz * s) * sp, stuck = blocked(player.x, player.z);
    if (stuck || !blocked(player.x + dx, player.z)) player.x += dx;
    if (stuck || !blocked(player.x, player.z + dz)) player.z += dz;
  }
  camera.position.set(player.x, EYE, player.z); camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
}
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (flight) stepFlight(dt); else if (mode === 'walk') step(dt); else if (mode === 'orbit') controls.update();
  updateDoors(dt);
  setCut(mode === 'orbit' || (mode === 'fly' && camera.position.y > H - 0.1));
  if (frame++ % 6 === 0) {
    updateLabels();
    const n = mode === 'walk' ? (zoneAt(player.x, player.z)?.name || '') : '3D 보기 · 전체';
    if (n !== lastZone) { whereName.textContent = n; lastZone = n; }
  }
  drawMap();
  renderer.render(scene, camera); labelR.render(scene, camera);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); labelR.setSize(innerWidth, innerHeight); });

/* ---------------- start ---------------- */
const SHOTS = { entrance: 'entrance', lounge: 'lounge', edu: 'classroom', focus: 'focus' };
const startMode = SHOT ? (SHOT === 'orbit' || SHOT === 'dollhouse' || SHOT === 'plan' ? 'orbit' : 'walk') : (params.get('mode') || L.start?.mode || 'orbit');
if (startMode === 'walk') goRoom(SHOTS[SHOT] || params.get('room') || L.start?.room || 'entrance', true);
else { player.x = ROOMS.entrance.jump.x; player.z = ROOMS.entrance.jump.z; enterOrbit(true); }
document.fonts.ready.then(() => { tick(); setTimeout(() => { const ld = document.getElementById('loading'); ld.style.opacity = 0; setTimeout(() => ld.remove(), 450); window.__ready = true; }, 400); });
