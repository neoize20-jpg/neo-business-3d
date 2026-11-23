/* 네오비즈니스 3D 투어 엔진 (app.js)
   ※ 공간 치수·가구 배치는 여기서 고치지 말고 layout.js 를 고치세요. 이 파일은 layout.js 를 읽어 3D로 그립니다. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/BufferGeometryUtils.js';
import { makeTextures, textTexture } from './textures.js?v=11191830';
import { applyLook } from './look.js?v=11202900';   // layout 에 look 이 있는 교육장만 조명·색감 보정

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
  winFrame: std({ color: 0xd8dadb, roughness: 0.38, metalness: 0.35 }),      // 밝은 회색 알루미늄 창틀(소회의실 사진)
  blind: std({ color: 0xefebe3, roughness: 0.95, side: THREE.DoubleSide }),   // 롤스크린 원단
  mirror: std({ color: 0xdce6ea, roughness: 0.05, metalness: 0.3, envMapIntensity: 1.8 }),  // 거울/유리 패널(교육장 동쪽 벽)
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
const FABRIC = { fabricGray: 0x9a9da3, fabricTeal: 0x2f8fb0, fabricBeige: 0xc2b496, fabricOrange: 0xe0682f, fabricGreen: 0x86a659, fabricBlue: 0x3584bd, fabricRed: 0xd2482f, orange: 0xff8207, chairLight: 0xe9e9e9, carpetDark: 0x4a4d53 };
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
function canvasTex(size, draw, repeatM, srgb = true) { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.repeat.set(1 / repeatM, 1 / repeatM); return t; }
let rs = 12345; const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
if (B.floorColor) {   // 시트 비닐 바닥(대전 사진: 회베이지) — 은은한 얼룩 노이즈
  const base = new THREE.Color(B.floorColor);
  const t = canvasTex(512, (k, n) => { k.fillStyle = '#' + base.getHexString(); k.fillRect(0, 0, n, n); for (let i = 0; i < 2600; i++) { const v = rnd(); k.fillStyle = v > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(60,50,40,.05)'; const r = 1 + rnd() * 5; k.fillRect(rnd() * n, rnd() * n, r * 2, r); } }, 2.0);
  M.floor = world(std({ color: 0xffffff, map: t, roughness: 0.7, envMapIntensity: 0.4 }));
}
if (B.floorPattern === 'tile') {   // 짙은 갈색 나뭇결/얼룩 무늬 광택 비닐 타일(부산 사진) — 0.45m 정사각 타일, 타일마다 결 방향 교차
  const base = new THREE.Color(B.floorColor || '#4a3b30'), tile = B.floorTile || 0.45;
  const t = canvasTex(512, (k, n) => {
    const h = n / 2;
    for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
      const x0 = tx * h, y0 = ty * h, c = base.clone().offsetHSL(0, 0, (rnd() - 0.5) * 0.025);
      k.fillStyle = '#' + c.getHexString(); k.fillRect(x0, y0, h, h);
      const vert = (tx + ty) % 2 === 0;
      for (let i = 0; i < 70; i++) { const a = 0.05 + rnd() * 0.1; k.fillStyle = rnd() > 0.45 ? `rgba(190,160,130,${a})` : `rgba(20,12,8,${a + 0.05})`;
        const L1 = 10 + rnd() * 70, T1 = 1 + rnd() * 4, px = x0 + rnd() * h, py = y0 + rnd() * h;
        if (vert) k.fillRect(px, py, T1, Math.min(L1, y0 + h - py)); else k.fillRect(px, py, Math.min(L1, x0 + h - px), T1); }
      for (let i = 0; i < 260; i++) { k.fillStyle = `rgba(${rnd() > 0.5 ? '210,180,150' : '15,10,6'},${0.05 + rnd() * 0.08})`; const r = 1 + rnd() * 4; k.beginPath(); k.arc(x0 + rnd() * h, y0 + rnd() * h, r, 0, 7); k.fill(); }
      k.strokeStyle = 'rgba(15,10,6,.22)'; k.lineWidth = 2; k.strokeRect(x0 + 1, y0 + 1, h - 2, h - 2);
    }
  }, tile * 2);
  M.floor = world(std({ color: 0xffffff, map: t, roughness: 0.28, metalness: 0.05, envMapIntensity: 1.0 }));
}
if (L.public) {   // 건물 공용 복도 재질(서울 사진): 회색 화강석 벽판 · 광택 베이지 테라조 바닥
  M.granite = world(std({ color: 0xffffff, roughness: 0.22, metalness: 0.02, envMapIntensity: 1.1, map: canvasTex(512, (k, n) => { k.fillStyle = '#8c8e92'; k.fillRect(0, 0, n, n);
    for (let i = 0; i < 26000; i++) { const v = rnd(); k.fillStyle = v < 0.45 ? 'rgba(40,40,44,.55)' : v < 0.8 ? 'rgba(220,220,222,.55)' : 'rgba(120,110,105,.5)'; const r = 0.6 + rnd() * 1.6; k.fillRect(rnd() * n, rnd() * n, r, r); }
    k.strokeStyle = 'rgba(60,60,64,.55)'; k.lineWidth = 2; k.strokeRect(0, 0, n, n / 2); k.strokeRect(0, n / 2, n, n / 2); }, 1.2) }));
  M.terrazzo = world(std({ color: 0xffffff, roughness: 0.12, metalness: 0.04, envMapIntensity: 1.3, map: canvasTex(512, (k, n) => { k.fillStyle = '#dcd2bf'; k.fillRect(0, 0, n, n);
    for (let i = 0; i < 9000; i++) { const v = rnd(); k.fillStyle = v < 0.5 ? 'rgba(170,155,130,.35)' : 'rgba(250,246,236,.45)'; const r = 0.6 + rnd() * 2.2; k.fillRect(rnd() * n, rnd() * n, r, r); }
    k.strokeStyle = 'rgba(150,138,118,.35)'; k.lineWidth = 1.5; k.strokeRect(0, 0, n, n); }, 0.6) }));
  M.pubWall = std({ color: 0xf2f1ee, roughness: 0.85 });
  M.steel = std({ color: 0xbfc3c8, metalness: 0.85, roughness: 0.28 });
}
if (B.ceilingTex === 'acoustic') {   // 흰 흡음 텍스 천장(미세 점 무늬) 0.6m 타일
  const t = canvasTex(512, (k, n) => { k.fillStyle = '#f7f7f5'; k.fillRect(0, 0, n, n); for (let i = 0; i < 5200; i++) { k.fillStyle = `rgba(90,90,90,${0.12 + rnd() * 0.25})`; const r = 0.6 + rnd() * 1.4; k.beginPath(); k.arc(rnd() * n, rnd() * n, r, 0, 7); k.fill(); }
    k.strokeStyle = 'rgba(150,150,150,.55)'; k.lineWidth = 3; k.strokeRect(0, 0, n, n); }, 0.6);
  M.ceiling = world(std({ color: 0xffffff, map: t, roughness: 0.95, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.14 })); M.ceiling.userData.noShadow = true;
}
box(W, 0.02, D, M.floor, W / 2, -0.02, D / 2).userData.floor = true;
box(W + 0.1, 0.3, D + 0.1, M.cap, W / 2, -0.32, D / 2);                       // 건물 바닥 슬래브(3D 보기용)
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), M.ground); ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, -0.33, D / 2); ground.receiveShadow = true; scene.add(ground);
box(W, 0.04, D, M.ceiling, W / 2, H, D / 2);
for (const [x0, z0, x1, z1] of (L.extensions || [])) {
  box(x1 - x0, 0.04, z1 - z0, M.floor, (x0 + x1) / 2, -0.04, (z0 + z1) / 2).userData.floor = true;
  box(x1 - x0, 0.04, z1 - z0, M.ceiling, (x0 + x1) / 2, H, (z0 + z1) / 2);
}

/* ---------------- walls ---------------- */
const WALLSEGS = [];   // 미니맵·벽 단면(cap)용
/* 문: E키로 여닫는 회전 문짝. DOORS 에 등록되고, 닫힌 문은 충돌(통과 불가), 열린 문은 통과 가능 */
const DOORS = [];
function registerDoor(leaves, open, name) { const d = { leaves, target: open ? 1 : 0, cur: open ? 1 : 0, name, box: null, c: null, locked: false }; DOORS.push(d); return d; }
function door(hx, hz, w, baseRad, swingRad, leafMat, frameMat, style) {
  const g = new THREE.Group(); g.position.set(hx, 0, hz); g.rotation.y = baseRad; root.add(g);
  g.userData.noCollide = true; g.userData.dynamic = true;
  if (style && style.frameless) {   // 프레임리스 유리문(사용자 사진): 바닥~천장, 시트 띠, 세로 블랙 D형 손잡이 0.3m, 상부 금속 패치
    const top = H - 0.07;
    for (const [y0, y1, m] of bandPieces(style, top)) { const p = new THREE.Mesh(new THREE.BoxGeometry(w - 0.03, y1 - y0, 0.012), m); p.position.set(w / 2, (y0 + y1) / 2 + 0.005, 0); g.add(p); }
    box(0.16, 0.07, 0.035, M.metal, 0.1, top - 0.07, 0, g); box(0.16, 0.07, 0.035, M.metal, 0.1, 0.02, 0, g);   // 상·하 패치 피팅
    const hx = w - 0.09;
    for (const sd of [-1, 1]) { box(0.022, 0.3, 0.022, M.black, hx, 0.9, sd * 0.055, g); box(0.02, 0.02, 0.06, M.black, hx, 0.92, sd * 0.03, g); box(0.02, 0.02, 0.06, M.black, hx, 1.16, sd * 0.03, g); }
    return { g, base: baseRad, swing: swingRad };
  }
  if (style && style.entrance) {   // 입구 프레임리스 유리 양문(사용자 사진): 통유리 + 상·하 금속 패치, 가운데 쪽 세로 스테인리스 바 손잡이, 디지털 도어락
    const lh = 2.08; const p = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, lh - 0.02, 0.012), M.glass); p.position.set(w / 2, lh / 2 + 0.01, 0); g.add(p);
    box(0.18, 0.06, 0.03, M.metal, 0.1, 0.02, 0, g); box(0.18, 0.06, 0.03, M.metal, 0.1, lh - 0.07, 0, g);
    if (style.frame) { const fm = M.steel || M.metal; box(w, 0.035, 0.03, fm, w / 2, 0, 0, g); box(w, 0.035, 0.03, fm, w / 2, lh - 0.035, 0, g); box(0.03, lh, 0.03, fm, 0.015, 0, 0, g); box(0.03, lh, 0.03, fm, w - 0.015, 0, 0, g); }   // 얇은 스테인리스 테두리(서울 입구 사진)
    const hx = w - 0.1;
    for (const sd of [-1, 1]) { cyl(0.014, 0.014, 1.3, M.metal, hx, 0.4, sd * 0.06, 12, g); box(0.02, 0.02, 0.06, M.metal, hx, 0.5, sd * 0.03, g); box(0.02, 0.02, 0.06, M.metal, hx, 1.6, sd * 0.03, g); }
    box(0.055, 0.15, 0.03, M.black, hx - 0.09, 0.98, 0.02, g); box(0.055, 0.15, 0.03, M.black, hx - 0.09, 0.98, -0.02, g);   // 도어락(안·밖)
    return { g, base: baseRad, swing: swingRad };
  }
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, 2.04, style?.vision ? 0.04 : 0.02), leafMat); leaf.position.set(w / 2, 1.04, 0); g.add(leaf);
  if (style?.vision) {   // 흰 문 + 반투명 유리 비전창(panel: 넓은 창 / strip: 세로 띠) + 레버 손잡이 (대전 사진)
    const strip = style.vision === 'strip', tall = style.vision === 'tall', vw = strip ? 0.12 : tall ? w * 0.36 : w * 0.5, vh = strip ? 1.3 : tall ? 1.6 : 1.05, vx = strip ? w * 0.32 : tall ? w * 0.36 : w * 0.45;
    const vy = tall ? 0.3 : 0.75; box(vw, vh, 0.046, M.visionG || (M.visionG = std({ color: 0xc4d0cc, roughness: 0.3, transparent: true, opacity: 0.9 })), vx, vy, 0, g); box(vw + 0.04, 0.02, 0.05, M.white, vx, vy - 0.01, 0, g); box(vw + 0.04, 0.02, 0.05, M.white, vx, vy + vh - 0.01, 0, g);
    for (const sd of [-1, 1]) { cyl(0.025, 0.025, 0.012, M.metal, w - 0.08, 0, 0, 14, g).position.set(w - 0.08, 1.0, sd * 0.026); box(0.13, 0.018, 0.022, M.metal, w - 0.13, 0.99, sd * 0.045, g); }
    return { g, base: baseRad, swing: swingRad };
  }
  box(w, 0.045, 0.05, frameMat, w / 2, 2.04, 0, g); box(w, 0.06, 0.05, frameMat, w / 2, 0, 0, g);
  box(0.045, 2.1, 0.05, frameMat, 0.022, 0, 0, g); box(0.045, 2.1, 0.05, frameMat, w - 0.022, 0, 0, g);
  box(0.025, 0.5, 0.06, M.metal, w - 0.12, 0.8, 0, g);
  return { g, base: baseRad, swing: swingRad };
}
const sz2 = (horiz, along, thick) => horiz ? [along, thick] : [thick, along];
function bandPieces(wo, top = H - 0.06) {   // [y0, y1, 재질] 목록: 투명 / 시트 띠 / (줄무늬) / 투명
  const b0 = wo.band?.[0] ?? 0.9, b1 = wo.band?.[1] ?? 2.0, pcs = [[0.035, b0, M.glass]];
  if (wo.stripes) { const n = wo.stripes, sp = 0.05, s0 = b1 - n * sp - 0.04; pcs.push([b0, s0, M.frost]); let y = s0; for (let i = 0; i < n; i++) { pcs.push([y, y + 0.02, M.glass], [y + 0.02, y + sp, M.frost]); y += sp; } pcs.push([y, b1, M.frost]); }
  else pcs.push([b0, b1, M.frost]);
  pcs.push([b1, top, M.glass]); return pcs;
}
function wallPiece(horiz, a0, a1, fixed, t, type, wo = {}, inward = 0) {
  const len = a1 - a0; if (len < 0.005) return;
  const c = (a0 + a1) / 2, cx = horiz ? c : fixed, cz = horiz ? fixed : c;
  const Wd = horiz ? len : t, Dd = horiz ? t : len;
  const sz = (along, thick) => horiz ? [along, thick] : [thick, along];
  WALLSEGS.push(horiz ? { x1: a0, z1: fixed, x2: a1, z2: fixed, t, type } : { x1: fixed, z1: a0, x2: fixed, z2: a1, t, type });
  if (type === 'solid') { box(Wd, H, Dd, wo.finish === 'granite' ? M.granite : wo.finish === 'white' ? M.pubWall : M.paint, cx, 0, cz);
    if (wo.finish === 'white' || wo.finish === 'granite') { const [bw, bd] = sz(len, t + 0.02); box(bw, 0.1, bd, plain(0x8d8f93), cx, 0, cz); }   // 회색 걸레받이
    return; }
  if (wo.style === 'store') {   // 다른 호실 프레임리스 유리 전면(서울 복도 사진): 바닥~천장 유리 + 스테인리스 세로 프레임, 위 흰 인방
    const head = 2.45, [pw, pd] = sz(len, 0.012); const p = new THREE.Mesh(new THREE.BoxGeometry(pw, head - 0.05, pd), M.glass); p.position.set(cx, (head + 0.05) / 2, cz); root.add(p);
    const [fw, fd] = sz(len, t); box(fw, H - head, fd, M.pubWall, cx, head, cz); const [rw, rd] = sz(len, 0.06); box(rw, 0.05, rd, M.steel, cx, 0, cz); box(rw, 0.05, rd, M.steel, cx, head - 0.05, cz);
    const n = Math.max(1, Math.round(len / (wo.bay || 1.4)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n; box(horiz ? 0.06 : 0.09, head, horiz ? 0.09 : 0.06, M.steel, horiz ? f : cx, 0, horiz ? cz : f); }
    return;
  }
  if (type === 'window' && wo.style === 'tall') {   // 바닥~천장 통창 (소회의실 사진 IMG_0414·0415): 밝은 회색 프레임, 가로 창살 2개, 롤스크린
    const sill = wo.sill ?? 0.1, head = wo.head ?? 2.55, fwid = wo.frameW ?? 0.07, fdep = 0.1;
    box(Wd, sill, Dd, M.paint, cx, 0, cz); box(Wd, H - head, Dd, M.paint, cx, head, cz);
    const [pw, pd] = sz(len, 0.02); const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, head - sill, pd), M.glass); pane.position.set(cx, (sill + head) / 2, cz); root.add(pane);
    const [fw, fd] = sz(len, fdep);
    box(fw, fwid, fd, M.winFrame, cx, sill, cz); box(fw, fwid, fd, M.winFrame, cx, head - fwid, cz);
    for (const y of (wo.transoms || [1.62, 2.25])) box(fw, fwid * 0.8, fd, M.winFrame, cx, y - fwid * 0.4, cz);
    const n = Math.max(1, Math.round(len / (wo.bay || 1.4)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n; box(horiz ? fwid : fdep, head - sill, horiz ? fdep : fwid, M.winFrame, horiz ? f : cx, sill, horiz ? cz : f); }
    const [kw, kd] = sz(len, t + 0.02); box(kw, 0.02, kd, M.white, cx, sill - 0.02, cz);      // 낮은 창턱
    if (inward) {
      const off = inward * (t / 2 + 0.06), bx = horiz ? cx : cx + off, bz = horiz ? cz + off : cz;
      const [bw, bd] = sz(len, 0.09); box(bw, 0.1, bd, M.white, bx, H - 0.1, bz);                // 롤스크린 박스(천장 아래)
      const bl = wo.blind ?? 0; if (bl > 0.001) { const yb = H - 0.1 - (H - 0.1 - sill) * bl; const [cw, cd] = sz(len - 0.04, 0.008); box(cw, H - 0.1 - yb, cd, M.blind, bx, yb, bz); box(cw, 0.025, 0.02, M.winFrame, bx, yb - 0.01, bz); }
    }
    return;
  }
  if (type === 'window' && wo.style === 'curtain') {   // 연속 창(부산 사진): 아래 흰 스팬드럴 → 작은 젖힘창 띠 → 큰 고정창, 회색 알루미늄 프레임
    const sp = wo.spandrel ?? 0.72, band = wo.band ?? 1.18, head = wo.head ?? 2.5, fw0 = 0.06, fd0 = 0.08;
    box(Wd, 0.05, Dd, M.paint, cx, 0, cz); box(Wd, H - head, Dd, M.paint, cx, head, cz);
    if (!M.spandrel) M.spandrel = std({ color: 0xeef0ef, roughness: 0.35 });
    const [sw, sd] = sz(len, 0.04); box(sw, sp - 0.05, sd, M.spandrel, cx, 0.05, cz);
    const [pw, pd] = sz(len, 0.02); const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, head - sp, pd), M.glass); pane.position.set(cx, (sp + head) / 2, cz); root.add(pane);
    const [fw, fd] = sz(len, fd0);
    for (const y of [0.05, sp - fw0 / 2, band - 0.03]) box(fw, fw0, fd, M.winFrame, cx, y, cz);
    box(fw, fw0, fd, M.winFrame, cx, head - fw0, cz);
    const n = Math.max(1, Math.round(len / (wo.bay || 1.5)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n, ww = (i === 0 || i === n) ? 0.08 : 0.06; box(horiz ? ww : fd0, head - 0.05, horiz ? fd0 : ww, M.winFrame, horiz ? f : cx, 0.05, horiz ? cz : f); }
    const io = inward || 0;
    for (let i = 0; i < n; i++) {   // 젖힘창 띠: 큰 칸마다 2개, 가운데 세로살 + 손잡이
      const f = a0 + len * (i + 0.5) / n; box(horiz ? 0.04 : fd0, band - sp, horiz ? fd0 : 0.04, M.winFrame, horiz ? f : cx, sp, horiz ? cz : f);
      for (const q of [0.25, 0.75]) { const fq = a0 + len * (i + q) / n, off = io * (fd0 / 2 + 0.02); box(horiz ? 0.08 : 0.02, 0.02, horiz ? 0.02 : 0.08, M.metal, horiz ? fq : cx + off, band - 0.09, horiz ? cz + off : fq); }
    }
    const [kw, kd] = sz(len, t / 2 + 0.04), off = io * (t / 4 + 0.02); box(kw, 0.025, kd, M.winFrame, horiz ? cx : cx + off, sp - 0.01, horiz ? cz + off : cz);   // 창대
    return;
  }
  if (type === 'window' && wo.style === 'ribbon') {   // 가로로 긴 알루미늄 창(대전 바깥벽 사진): 왼쪽(위 고정+아래 안으로 젖히는 창) · 가운데 큰 고정창 · 오른쪽(위 고정+아래 젖힘창), 흰 미장 창대
    const sill = wo.sill ?? 0.85, head = wo.head ?? 2.58, fw0 = 0.06, fd0 = 0.07, hh = head - sill;
    const lw = wo.left ?? 0.8, rw = wo.right ?? 0.7, ty = sill + hh * (wo.split ?? 1 / 3);
    box(Wd, sill, Dd, M.paint, cx, 0, cz); box(Wd, H - head, Dd, M.paint, cx, head, cz);
    const [pw, pd] = sz(len, 0.02); const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, hh, pd), M.glass); pane.position.set(cx, (sill + head) / 2, cz); root.add(pane);
    const [fw, fd] = sz(len, fd0); box(fw, fw0, fd, M.winFrame, cx, sill, cz); box(fw, fw0, fd, M.winFrame, cx, head - fw0, cz);
    const vbar = (f, ww = fw0) => box(horiz ? ww : fd0, hh, horiz ? fd0 : ww, M.winFrame, horiz ? f : cx, sill, horiz ? cz : f);
    vbar(a0 + fw0 / 2); vbar(a1 - fw0 / 2); vbar(a0 + lw); vbar(a1 - rw);
    const io = inward || 0, at = (f, off) => horiz ? [f, cz + off] : [cx + off, f];
    for (const [s0, s1] of [[a0, a0 + lw], [a1 - rw, a1]]) {
      const sc = (s0 + s1) / 2, sl = s1 - s0;
      const [tw, td] = sz(sl, fd0); box(tw, 0.05, td, M.winFrame, horiz ? sc : cx, ty - 0.025, horiz ? cz : sc);              // 가로 창살(아래 1/3)
      const [hw, hd] = sz(sl - 0.12, 0.03), [hx, hz] = at(sc, io * (fd0 / 2 + 0.015));                                          // 아래 젖힘창 안쪽 창틀
      box(hw, 0.035, hd, M.winFrame, hx, ty - 0.085, hz); box(hw, 0.035, hd, M.winFrame, hx, sill + fw0, hz);
      for (const e of [s0 + 0.06, s1 - 0.06]) { const [ex, ez] = at(e, io * (fd0 / 2 + 0.015)); box(horiz ? 0.035 : 0.03, ty - sill - 0.11, horiz ? 0.03 : 0.035, M.winFrame, ex, sill + fw0, ez); }
      const [kx, kz] = at(sc, io * (fd0 / 2 + 0.04)); box(horiz ? 0.1 : 0.025, 0.025, horiz ? 0.025 : 0.1, M.metal, kx, ty - 0.12, kz);   // 손잡이
    }
    const [rvw, rvd] = sz(len + 0.08, t / 2 + 0.06), [rx, rz] = at(horiz ? cx : cz, io * (t / 4 + 0.03));                     // 흰 미장 창대(실내 쪽)
    box(rvw, 0.03, rvd, M.white, rx, sill - 0.03, rz);
    return;
  }
  if (type === 'window' && wo.style === 'casement') {   // 흰 프레임 여닫이 창(대전 사진): 창턱 + 세로 창살(좁은 창) + 가로 바, 실내 쪽 흰 창대
    const sill = wo.sill ?? 0.8, head = wo.head ?? 2.4, fw0 = 0.06, fd0 = 0.09;
    box(Wd, sill, Dd, M.paint, cx, 0, cz); box(Wd, H - head, Dd, M.paint, cx, head, cz);
    const [pw, pd] = sz(len, 0.02); const pane = new THREE.Mesh(new THREE.BoxGeometry(pw, head - sill, pd), M.glass); pane.position.set(cx, (sill + head) / 2, cz); root.add(pane);
    const [fw, fd] = sz(len, fd0); box(fw, fw0, fd, M.white, cx, sill, cz); box(fw, fw0, fd, M.white, cx, head - fw0, cz);
    const bar = wo.bar ?? 1.95; box(fw, 0.05, fd, M.white, cx, bar - 0.025, cz);
    const n = Math.max(1, Math.round(len / (wo.bay || 0.7)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n, ww = (i === 0 || i === n) ? 0.08 : 0.05; box(horiz ? ww : fd0, head - sill, horiz ? fd0 : ww, M.white, horiz ? f : cx, sill, horiz ? cz : f); }
    for (let i = 0; i < n; i++) { const f = a0 + len * (i + 0.85) / n; box(horiz ? 0.015 : fd0 + 0.03, 0.09, horiz ? fd0 + 0.03 : 0.015, M.white, horiz ? f : cx, 1.3, horiz ? cz : f); }   // 손잡이
    const io = inward || 0, [kw, kd] = sz(len + 0.1, 0.16); box(kw, 0.03, kd, M.white, horiz ? cx : cx + io * (t / 2 + 0.05), sill - 0.03, horiz ? cz + io * (t / 2 + 0.05) : cz);   // 실내 창대
    return;
  }
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
  if (wo.style === 'clear') {   // 입구 옆 고정 유리: 문과 같은 윗선(head, 기본 2.12)까지 투명 유리 + 얇은 흰 프레임, 그 위는 문 위와 같은 벽
    const head = wo.head ?? 2.12;
    const [pw, pd] = sz(len, 0.012); const p = new THREE.Mesh(new THREE.BoxGeometry(pw, head - 0.03, pd), M.glass); p.position.set(cx, (head + 0.03) / 2, cz); root.add(p);
    box(Wd, H - head, Dd, M.paint, cx, head, cz);                                                   // 위 벽(문 위 벽과 같은 높이)
    const [hw, hd] = sz(len, t + 0.02); box(hw, 0.05, hd, M.white, cx, head - 0.05, cz);            // 문과 이어지는 같은 높이의 가로 헤더
    const [fw, fd] = sz(len, 0.04); box(fw, 0.03, fd, M.white, cx, 0, cz);                         // 바닥 레일
    for (const f of [a0 + 0.015, a1 - 0.015]) box(horiz ? 0.03 : 0.04, head, horiz ? 0.04 : 0.03, M.white, horiz ? f : cx, 0, horiz ? cz : f);   // 얇은 세로 프레임
    return;
  }
  if (wo.style === 'blinds') {   // 흰 프레임 유리 칸막이 + 안쪽 흰 베니션 블라인드(부산 복도 사진, 강사대기실 벽)
    if (!M.venetian) { const c = document.createElement('canvas'); c.width = 16; c.height = 64; const k = c.getContext('2d'); k.fillStyle = '#f3f3f0'; k.fillRect(0, 0, 16, 64); for (let y = 0; y < 64; y += 8) { k.fillStyle = '#d4d6d3'; k.fillRect(0, y + 6, 16, 2); }
      const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(1, 60); M.venetian = std({ color: 0xffffff, map: tx, roughness: 0.75, side: THREE.DoubleSide }); }
    const sill = 0.1, head = H - 0.06, [bw, bd] = sz(len - 0.02, 0.006);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(bw, head - sill, bd), M.venetian); bl.position.set(cx, (sill + head) / 2, cz); root.add(bl);
    for (const sd of [-1, 1]) { const off = sd * 0.03, [pw, pd] = sz(len, 0.008); const p = new THREE.Mesh(new THREE.BoxGeometry(pw, head - sill, pd), M.glass); p.position.set(horiz ? cx : cx + off, (sill + head) / 2, horiz ? cz + off : cz); root.add(p); }
    const [fw, fd] = sz(len, t); box(fw, sill, fd, M.white, cx, 0, cz); box(fw, H - head, fd, M.white, cx, head, cz);
    const n = Math.max(1, Math.round(len / (wo.bay || 0.95)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n, fwid = (i === 0 || i === n) ? 0.06 : 0.09; box(horiz ? fwid : t, H, horiz ? t : fwid, M.white, horiz ? f : cx, 0, horiz ? cz : f); }
    return;
  }
  if (wo.style === 'frost') {   // 반투명 유리 파티션(대전 사진): 바닥~천장, 연한 녹회색 반투명 유리, 가는 흰 알루미늄 세로 멀리언(bay 0.8)
    if (!M.frostG) M.frostG = new THREE.MeshPhysicalMaterial({ color: 0xdfe8e3, roughness: 0.35, transparent: true, opacity: 0.86, depthWrite: false, side: THREE.DoubleSide });
    const [pw, pd] = sz(len, 0.012); const p = new THREE.Mesh(new THREE.BoxGeometry(pw, H - 0.1, pd), M.frostG); p.position.set(cx, H / 2, cz); root.add(p);
    for (const y of [0.9, 1.75]) { const [rw, rd] = sz(len, 0.014); const r = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.012, rd), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false })); r.position.set(cx, y, cz); root.add(r); }   // 가로 반사 느낌
    const [fw, fd] = sz(len, 0.05); box(fw, 0.05, fd, M.white, cx, 0, cz); box(fw, 0.05, fd, M.white, cx, H - 0.05, cz);
    const n = Math.max(1, Math.round(len / (wo.bay || 0.8)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n; box(horiz ? 0.03 : 0.045, H, horiz ? 0.045 : 0.03, M.white, horiz ? f : cx, 0, horiz ? cz : f); }
    if (wo.switchAt != null) { const sd = wo.switchSide || 1, o2 = 0.03 * sd; box(horiz ? 0.08 : 0.02, 0.12, horiz ? 0.02 : 0.08, M.white, horiz ? wo.switchAt : cx + o2, 1.15, horiz ? cz + o2 : wo.switchAt); }
    return;
  }
  if (wo.style === 'band') {   // 라운지 쪽 유리 파티션 (사용자 사진): 바닥~천장 유리, 블랙 알루미늄 프레임, 0.9~2.0m 반투명 시트 띠(+선택: 위쪽 가는 줄무늬)
    const pcs = bandPieces(wo);
    for (const [y0, y1, m] of pcs) { const [pw, pd] = sz(len, 0.012); const p = new THREE.Mesh(new THREE.BoxGeometry(pw, y1 - y0, pd), m); p.position.set(cx, (y0 + y1) / 2, cz); root.add(p); }
    const [fw, fd] = sz(len, 0.05); box(fw, 0.035, fd, M.frame, cx, 0, cz); box(fw, 0.06, fd, M.frame, cx, H - 0.06, cz);   // 바닥 레일·상부 트랙
    const n = Math.max(1, Math.round(len / (wo.bay || 1.2)));
    for (let i = 0; i <= n; i++) { const f = a0 + len * i / n; box(horiz ? 0.04 : 0.055, H, horiz ? 0.055 : 0.04, M.frame, horiz ? f : cx, 0, horiz ? cz : f); }   // 블랙 세로 멀리언
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
  const inward = w.outer ? (fixed < (horiz ? D : W) / 2 ? 1 : -1) : 0;
  for (const o of ops) { wallPiece(horiz, cur, o.at, fixed, t, w.type, w, inward); cur = o.at + o.width; }
  wallPiece(horiz, cur, a1, fixed, t, w.type, w, inward);
  if (w.sign) {   // 유리벽 레터링 (예: COACHING ROOM)
    const sg = w.sign, c = document.createElement('canvas'); c.width = 1024; c.height = 128; const cx2 = c.getContext('2d');
    cx2.fillStyle = sg.color || '#1d1f23'; cx2.font = '600 84px Pretendard, sans-serif'; cx2.textAlign = 'center'; cx2.textBaseline = 'middle';
    const tw = cx2.measureText(sg.text).width, ic = sg.icon ? 90 : 0; cx2.fillText(sg.text, 512 + ic / 2, 68);
    if (sg.icon) { const ix = 512 - tw / 2 - ic / 2 + 10; cx2.lineWidth = 7; cx2.strokeStyle = cx2.fillStyle; cx2.beginPath(); cx2.arc(ix, 66, 30, 0, Math.PI * 2); cx2.stroke(); cx2.beginPath(); cx2.arc(ix, 66, 11, 0, Math.PI * 2); cx2.fill(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const hgt = sg.size || 0.16, wd = hgt * 8, side = sg.side || 1;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(wd, hgt), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
    pl.userData.keep = true; pl.renderOrder = 10; const off = sg.offset ?? (w.type === 'glass' ? 0.012 : t / 2 + 0.006); pl.position.set(horiz ? sg.at : fixed + side * off, sg.y || 1.48, horiz ? fixed + side * off : sg.at);
    pl.rotation.y = horiz ? (side > 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2); root.add(pl);
  }
  for (const o of ops) {
    const len = o.width, c = o.at + len / 2, cx = horiz ? c : fixed, cz = horiz ? fixed : c;
    const lintel = 2.12;
    if (o.full) continue;   // 바닥~천장 열린 틈(문·인방 없음)
    if (o.door === 'frameless') { const [fw, fd] = sz2(horiz, len, 0.05); box(fw, 0.06, fd, M.frame, cx, H - 0.06, cz); box(horiz ? 0.04 : 0.055, H, horiz ? 0.055 : 0.04, M.frame, horiz ? o.at : cx, 0, horiz ? cz : o.at); box(horiz ? 0.04 : 0.055, H, horiz ? 0.055 : 0.04, M.frame, horiz ? o.at + len : cx, 0, horiz ? cz : o.at + len); }
    else if (w.type === 'glass') { const p = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.02, H - lintel, horiz ? 0.02 : len), M.glass); p.position.set(cx, (H + lintel) / 2, cz); root.add(p); box(horiz ? len : 0.06, 0.05, horiz ? 0.06 : len, M.frame, cx, H - 0.05, cz); }
    else if (o.transom) {   // 문 위 유리 채광창(흰 프레임) — 천장까지
      const p = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.02, H - lintel - 0.06, horiz ? 0.02 : len), M.glass); p.position.set(cx, (H + lintel) / 2, cz); root.add(p);
      box(horiz ? len : t, 0.05, horiz ? t : len, M.white, cx, H - 0.05, cz);
    }
    else box(horiz ? len : t, H - lintel, horiz ? t : len, M.paint, cx, lintel, cz);
    if (o.casing) {   // 흰 솔리드 문틀(양옆 넓은 케이싱, 벽보다 살짝 두꺼움)
      const cw = o.casing === true ? 0.08 : o.casing, ch = o.transom ? H : lintel;
      for (const e of [o.at - cw / 2, o.at + len + cw / 2]) box(horiz ? cw : t + 0.04, ch, horiz ? t + 0.04 : cw, M.white, horiz ? e : cx, 0, horiz ? cz : e);
    }
    const fm = o.frame === 'white' ? M.white : M.frame;
    if (o.door !== 'frameless') box(horiz ? len + 0.06 : t + 0.02, 0.05, horiz ? t + 0.02 : len + 0.06, fm, cx, lintel - 0.05, cz);
    if (!o.door || o.door === 'none') continue;
    const leafMat = o.door === 'wood' ? M.white : (w.type === 'glass' ? M.frost : M.glass);
    const baseStart = horiz ? 0 : -Math.PI / 2, baseEnd = horiz ? Math.PI : Math.PI / 2;
    if (o.door === 'frameless') {
      const start = (o.hinge || 'start') === 'start', sw = (o.swing || 80) * DEG, hp = start ? o.at : o.at + len;
      registerDoor([door(horiz ? hp : fixed, horiz ? fixed : hp, len, start ? baseStart : baseEnd, sw, M.glass, fm, { frameless: true, band: w.band, stripes: w.stripes })], o.open === true, o.name).locked = !!o.locked;
    } else if (o.double) {
      const hw = len / 2, sw = (o.swing || 80) * DEG;
      const st = o.entrance ? { entrance: true, frame: !!o.leafFrame } : undefined;
      const leaves = [door(horiz ? o.at : fixed, horiz ? fixed : o.at, hw, baseStart, -sw, leafMat, fm, st),
                      door(horiz ? o.at + len : fixed, horiz ? fixed : o.at + len, hw, baseEnd, sw, leafMat, fm, st)];
      if (o.fixedLeaf === 'start' || o.fixedLeaf === 'end') {
        const fixedLeaf = leaves.splice(o.fixedLeaf === 'start' ? 0 : 1, 1)[0];
        fixedLeaf.g.userData.noCollide = false; fixedLeaf.g.userData.dynamic = false;
      }
      registerDoor(leaves, o.open === true, o.name).locked = !!o.locked;
    } else {
      const start = (o.hinge || 'start') === 'start', sw = (o.swing || 80) * DEG;
      const hp = start ? o.at : o.at + len;
      registerDoor([door(horiz ? hp : fixed, horiz ? fixed : hp, len, start ? baseStart : baseEnd, sw, leafMat, fm, o.vision ? { vision: o.vision } : undefined)], o.open === true, o.name).locked = !!o.locked;
    }
  }
  if (w.molding) {
    const dir = (w.molding === 'east' || w.molding === 'south') ? 1 : -1;
    molding(horiz, fixed + dir * t / 2, w.moldingFrom ?? a0, w.moldingTo ?? a1, dir);
  }
}
for (const c of (L.columns || [])) {
  const [x0, z0, x1, z1] = c.rect; box(x1 - x0, H, z1 - z0, M.paint, (x0 + x1) / 2, 0, (z0 + z1) / 2);
  WALLSEGS.push({ x1: x0, z1: z0, x2: x1, z2: z1, t: 0, type: 'column', block: !!c.block });
  // c.block: 투어에 안 들어가는 다른 공간 덩어리 → 미니맵에 옅은 회색
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
if (B.baseboard) {   // 회색 걸레받이: 단색 벽·창 아래벽 양면
  const bm = plain(new THREE.Color(B.baseboard.color || '#8f9296').getHex()), bh = B.baseboard.h || 0.08;
  for (const s2 of WALLSEGS) { if (s2.type !== 'solid' && s2.type !== 'window') continue; const horiz = Math.abs(s2.z1 - s2.z2) < 1e-6, len = horiz ? s2.x2 - s2.x1 : s2.z2 - s2.z1; if (len < 0.05) continue;
    for (const sd of [-1, 1]) { const off = sd * (s2.t / 2 + 0.006); horiz ? box(len, bh, 0.012, bm, (s2.x1 + s2.x2) / 2, 0, s2.z1 + off) : box(0.012, bh, len, bm, s2.x1 + off, 0, (s2.z1 + s2.z2) / 2); } }
}
for (const bd of (L.backdrop || [])) {   // 창밖 풍경: 하늘 + 도시 실루엣 판
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512; const k = c.getContext('2d');
  const gr = k.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#9cc7ec'); gr.addColorStop(0.6, '#d6e8f5'); gr.addColorStop(1, '#eef3f6'); k.fillStyle = gr; k.fillRect(0, 0, 2048, 512);
  let x = 0; while (x < 2048) { const bw = 60 + rnd() * 160, bh2 = 120 + rnd() * 260, sh = 150 + Math.floor(rnd() * 60); k.fillStyle = `rgb(${sh},${sh + 8},${sh + 18})`; k.fillRect(x, 512 - bh2, bw, bh2);
    k.fillStyle = 'rgba(255,255,255,.35)'; for (let yy = 512 - bh2 + 12; yy < 500; yy += 18) for (let xx = x + 8; xx < x + bw - 10; xx += 16) k.fillRect(xx, yy, 7, 9); x += bw + rnd() * 20; }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const bw = bd.w || W + 40, bh = bd.h || 16, m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: t, fog: false }));
  const dist = bd.dist || 10, y = (bd.y ?? -6) + bh / 2;
  if (bd.side === 'south') { m.position.set(W / 2, y, D + dist); m.rotation.y = Math.PI; }
  else if (bd.side === 'north') { m.position.set(W / 2, y, -dist); }
  else if (bd.side === 'west') { m.position.set(-dist, y, D / 2); m.rotation.y = Math.PI / 2; }
  else { m.position.set(W + dist, y, D / 2); m.rotation.y = -Math.PI / 2; }
  m.userData.keep = true; m.userData.noCollide = true; scene.add(m);
}
for (const [x, z] of (L.ceiling?.round || [])) { cyl(0.11, 0.11, 0.012, M.white, x, H - 0.014, z, 24); cyl(0.085, 0.085, 0.006, plain(0xd6d8db), x, H - 0.02, z, 24); }   // 원형 천장 스피커/센서
for (const p of (L.ceiling?.strips || [])) {          // 일자형(라인) LED 조명
  const len = p.len || 1.2, wd = p.w || 0.16, sg = new THREE.Group(); sg.position.set(p.x, 0, p.z); sg.rotation.y = (p.rot || 0) * DEG; root.add(sg);
  if (p.twin) {   // 2등용 형광등 기구(부산 사진): 흰 반사판 + 관 2개
    box(wd + 0.04, 0.03, len + 0.05, M.fixture, 0, H - 0.035, 0, sg);
    for (const sx of [-1, 1]) box(0.032, 0.03, len, M.led, sx * wd * 0.24, H - 0.065, 0, sg);
  } else { box(wd + 0.03, 0.02, len + 0.03, M.fixture, 0, H - 0.025, 0, sg); box(wd, 0.01, len, M.led, 0, H - 0.032, 0, sg); }
}
const projLabels = []; const pm0 = (p) => p.color ? matOf(p.color) : M.white;
for (const [x, z] of (L.ceiling?.downlights || [])) { cyl(0.075, 0.075, 0.012, M.fixture, x, H - 0.014, z, 20); cyl(0.058, 0.058, 0.006, M.led, x, H - 0.02, z, 20); }
for (const p of (L.ceiling?.projectors || [])) {      // 천장형 빔 프로젝터 (흰 본체 + 렌즈, 짧은 천장 행거)
  const pg = new THREE.Group(); pg.position.set(p.x, 0, p.z); root.add(pg);
  const aim = p.aim || [p.x, 0]; pg.rotation.y = Math.atan2(-(aim[0] - p.x), -(aim[1] - p.z));   // 렌즈(로컬 -z)가 aim 을 향함
  const drop = p.drop ?? 0.32, by = H - drop - 0.13;
  cyl(0.09, 0.09, 0.012, pm0(p), 0, H - 0.012, 0, 24, pg);                        // 천장 플레이트
  cyl(0.018, 0.018, drop - 0.03, M.metal, 0, by + 0.13 + 0.02, 0, 12, pg);          // 행거 봉
  box(0.16, 0.025, 0.12, M.black, 0, by + 0.125, 0, pg);                            // 마운트 브래킷
  const pm = p.color ? matOf(p.color) : M.white; const body = box(0.36, 0.12, 0.30, pm, 0, by, 0, pg); body.rotation.x = -0.05; // 본체
  const lens = cyl(0.042, 0.048, 0.035, p.color === 'black' ? M.metal : M.black, 0, 0, 0, 24, pg); lens.rotation.x = Math.PI / 2; lens.position.set(0.09, by + 0.06, -0.165);
  const glass = cyl(0.03, 0.03, 0.006, new THREE.MeshStandardMaterial({ color: 0x1b2a44, roughness: 0.05, metalness: 0.6 }), 0, 0, 0, 20, pg); glass.rotation.x = Math.PI / 2; glass.position.set(0.09, by + 0.06, -0.185);
  box(0.2, 0.004, 0.03, M.black, -0.06, by + 0.12, 0.13, pg);                       // 통풍구
  if (p.label !== false) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 72; const cx = c.getContext('2d');
    cx.fillStyle = 'rgba(255,255,255,0.78)'; cx.beginPath(); cx.roundRect(40, 6, 240, 60, 30); cx.fill();   /* 작은 연한 라벨 */
    cx.fillStyle = '#3a3d42'; cx.font = '600 40px Pretendard, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(p.label || '빔프로젝트', 160, 38);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); const th = p.labelSize || 0.045;
    sp.scale.set(th * 320 / 40, th * 72 / 40, 1);   /* 글자 높이 ≈ th(m) */ sp.position.set(p.x, by - 0.075, p.z); sp.renderOrder = 5; scene.add(sp); projLabels.push(sp);
  }
}
if (!M.acVent) { M.acVent = std({ color: 0x3a3d42, roughness: 0.6 }); M.acVent.userData.noShadow = true; }
for (const [x, z, sz = 0.84] of (L.ceiling?.aircon || [])) {   // [x, z, 크기(선택, 기본 0.84m)]
  box(sz, 0.04, sz, M.fixture, x, H - 0.045, z); box(sz * 0.6, 0.012, sz * 0.6, M.fixture, x, H - 0.055, z);
  for (const s of [-1, 1]) { box(sz * 0.7, 0.006, 0.06, M.acVent, x, H - 0.05, z + s * sz * 0.39); box(0.06, 0.006, sz * 0.7, M.acVent, x + s * sz * 0.39, H - 0.05, z); }   // 토출구 4면
}

/* ---------------- furniture builders ---------------- */
// ※ 가구 모양·치수는 v1 그대로 유지(사용자 요청). 재질만 실제 느낌으로 교체.
function chair(g, o = {}) {      // 사무용 회전의자 (등받이 = 로컬 +z)
  const m = o.color ? matOf(o.color) : M.black;
  box(0.46, 0.07, 0.44, m, 0, 0.42, 0, g); box(0.44, 0.42, 0.05, m, 0, 0.52, 0.22, g);
  cyl(0.025, 0.025, 0.38, M.metal, 0, 0.05, 0, 8, g);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const leg = box(0.28, 0.03, 0.04, o.base === 'silver' ? M.metal : M.black, Math.cos(a) * 0.13, 0.03, Math.sin(a) * 0.13, g); leg.rotation.y = -a; if (o.base === 'silver') cyl(0.022, 0.022, 0.03, M.black, Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26, 8, g); }
  if (o.tag) box(0.09, 0.055, 0.004, M.white, 0, 0.82, 0.248, g);   // 등받이 뒤 흰 이름표
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
/* 둥근 모서리 상자: 패브릭 큐브·벤치용 (ExtrudeGeometry + bevel) — y 는 아래 끝 */
function rbox(w, h, d, r, m, x, y, z, p = root) {
  r = Math.min(r, w / 2 - 0.005, d / 2 - 0.005, h / 2 - 0.005);
  const sw = w - 2 * r, sd = d - 2 * r, cr = Math.min(0.02, sw / 2, sd / 2), sh = new THREE.Shape();
  sh.moveTo(-sw / 2 + cr, -sd / 2); sh.lineTo(sw / 2 - cr, -sd / 2); sh.quadraticCurveTo(sw / 2, -sd / 2, sw / 2, -sd / 2 + cr); sh.lineTo(sw / 2, sd / 2 - cr);
  sh.quadraticCurveTo(sw / 2, sd / 2, sw / 2 - cr, sd / 2); sh.lineTo(-sw / 2 + cr, sd / 2); sh.quadraticCurveTo(-sw / 2, sd / 2, -sw / 2, sd / 2 - cr); sh.lineTo(-sw / 2, -sd / 2 + cr); sh.quadraticCurveTo(-sw / 2, -sd / 2, -sw / 2 + cr, -sd / 2);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 4, curveSegments: 4 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, r, 0); geo.computeVertexNormals();
  const g = new THREE.Mesh(geo, m); g.position.set(x, y, z); p.add(g); return g;
}
/* 부채꼴 고리(앞이 열린 C자) 압출: 터브 암체어 등받이·팔걸이. open = 앞쪽(로컬 -z) 열림 각도 */
function arcWall(R0, R1, h, open, m, y, p, bevel = 0.025) {
  const a0 = Math.PI / 2 + open / 2, a1 = Math.PI / 2 - open / 2 + Math.PI * 2, sh = new THREE.Shape();
  sh.absarc(0, 0, R1, a0, a1, false); sh.absarc(0, 0, R0, a1, a0, true); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.01, h - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: 28 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, y + bevel, 0); geo.computeVertexNormals();
  const g = new THREE.Mesh(geo, m); p.add(g); return g;
}
function armchair(g, o) {   // 라운지 암체어(상자형): 폭 0.66 × 깊이 0.64 × 높이 0.75, 앞 = 로컬 -z
  const m = matOf(o.color || 'fabricTeal'), w = o.w || 0.66, d = o.d || 0.64, aw = 0.09;
  box(w - 0.08, 0.05, d - 0.08, M.black, 0, 0, 0, g);                          // 낮은 검정 받침
  box(w, 0.37, d, m, 0, 0.05, 0, g);                                           // 몸통 + 방석 (앉는 높이 0.42)
  box(w, 0.33, 0.12, m, 0, 0.42, d / 2 - 0.06, g);                             // 등받이 (위 끝 0.75)
  box(aw, 0.18, d - 0.1, m, -(w / 2 - aw / 2), 0.42, 0.05, g); box(aw, 0.18, d - 0.1, m, w / 2 - aw / 2, 0.42, 0.05, g);   // 팔걸이
}
function cube(g, o) { const s = o.size || 0.42; rbox(s, o.h || s, s, 0.045, matOf(o.color || 'fabricOrange'), 0, 0, 0, g); }   // 패브릭 큐브 스툴(둥근 모서리)
function roundTable(g, o) {   // 카페 원형 테이블: 대리석 상판 + 가는 검정 기둥 + 둥근 검정 원판 받침
  const r = o.r || 0.3, h = o.h || 0.72;
  cyl(r, r, 0.03, matOf(o.top || 'marble'), 0, h - 0.03, 0, 36, g); cyl(r - 0.01, r - 0.01, 0.012, M.black, 0, h - 0.042, 0, 36, g);
  cyl(0.022, 0.022, h - 0.06, M.black, 0, 0.02, 0, 10, g); cyl(0.2, 0.22, 0.02, M.black, 0, 0, 0, 28, g); cyl(0.06, 0.08, 0.04, M.black, 0, 0.02, 0, 16, g);
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
  if (o.style === 'training') return trainingTable(g, o);
  const w = o.w || 1.4, d = o.d || 0.6, h = o.h || 0.72;
  box(w, 0.035, d, matOf(o.top || 'white'), 0, h - 0.035, 0, g); legs4(g, w, d, h - 0.035, matOf(o.legs || 'metal'));
  if (o.casters) { box(w - 0.1, 0.36, 0.012, M.white, 0, h - 0.4, -d / 2 + 0.06, g); for (const sx of [-1, 1]) for (const sz2 of [-1, 1]) cyl(0.025, 0.025, 0.04, M.black, sx * (w / 2 - 0.06), 0, sz2 * (d / 2 - 0.06), 8, g); }   // 접이식 강의 책상: 앞 가림판 + 바퀴
}
/* 실사형 재질(부산 사진): 새틴 화이트 / 브러시드 메탈 / 무광 검정 플라스틱 / 짙은 회색 쉘 / 검정 방석 / 흰 튜브 */
const RM = () => M.rSatin ? M : Object.assign(M, {
  rSatin: std({ color: 0xf4f4f1, roughness: 0.32, metalness: 0, envMapIntensity: 0.9 }),
  rBrushed: std({ color: 0xb4b9bf, roughness: 0.34, metalness: 0.85 }),
  rPlastic: std({ color: 0x151618, roughness: 0.72, metalness: 0 }),
  rShell: std({ color: 0x35373b, roughness: 0.55, metalness: 0 }),
  rCushion: std({ color: 0x1b1c1e, roughness: 0.9, metalness: 0 }),
  rTube: std({ color: 0xe8eaec, roughness: 0.28, metalness: 0.55 })
});
function tube(pts, r, m, p, seg = 20) {   // 둥근 파이프(곡선)
  const c = new THREE.CatmullRomCurve3(pts.map((a) => new THREE.Vector3(a[0], a[1], a[2])), false, 'centripetal');
  const g = new THREE.Mesh(new THREE.TubeGeometry(c, seg, r, 8, false), m); p.add(g); return g;
}
function twinCaster(x, z, rotY, p) {   // 검정 쌍바퀴 캐스터 (바퀴 반지름 0.028)
  const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rotY; p.add(c);
  for (const s of [-1, 1]) { const w = cyl(0.028, 0.028, 0.014, M.rPlastic, s * 0.013, 0.021, 0, 16, c); w.rotation.z = Math.PI / 2; w.position.y = 0.028; }
  rbox(0.04, 0.03, 0.05, 0.008, M.rPlastic, 0, 0.04, -0.008, c); cyl(0.009, 0.009, 0.03, M.rBrushed, 0, 0.065, 0, 8, c);
}
/* 접이식(플립탑) 강의 테이블: 얇은 둥근 상판 + 가림판(상판과 틈) + T자 다리(검정 캡) + 벌어진 발 + 쌍바퀴 2개씩. 앉는 쪽 = 로컬 +z */
function trainingTable(g, o) {
  RM(); const w = o.w || 1.5, d = o.d || 0.5, h = o.h || 0.72, t = 0.025;
  rbox(w, t, d, 0.011, M.rSatin, 0, h - t, 0, g);                                                  // 상판(모서리 둥근 2.5cm)
  box(w - 0.04, 0.004, d - 0.04, M.rPlastic, 0, h - t - 0.004, 0, g);                               // 상판 밑 그늘(검정 테두리 느낌)
  for (const sx of [-1, 1]) {
    const lx = sx * (w / 2 - 0.13), g2 = new THREE.Group(); g2.position.x = lx; g.add(g2);
    box(0.035, 0.022, d - 0.1, M.rPlastic, 0, h - t - 0.026, 0, g2);                              // 상판 받침 암(검정)
    rbox(0.075, 0.075, 0.065, 0.015, M.rPlastic, 0, h - t - 0.1, 0.02, g2);                         // 플립 관절 캡(검정)
    rbox(0.05, h - t - 0.1 - 0.105, 0.032, 0.012, M.rBrushed, 0, 0.105, 0.02, g2);                  // 기둥(은회색)
    rbox(0.07, 0.04, 0.06, 0.012, M.rPlastic, 0, 0.085, 0.02, g2);                                  // 기둥 밑 소켓
    const fl = d + 0.06;                                                                           // 발: 양끝이 살짝 내려간 바
    tube([[0, 0.078, -fl / 2], [0, 0.1, -fl / 4], [0, 0.108, 0.02], [0, 0.1, fl / 4 + 0.02], [0, 0.078, fl / 2]], 0.016, M.rBrushed, g2, 16).scale.set(1.5, 1, 1);
    for (const ez of [-1, 1]) twinCaster(0, ez * (fl / 2 - 0.02), 0, g2);
  }
  rbox(w - 0.36, 0.3, 0.012, 0.005, M.rSatin, 0, h - t - 0.065 - 0.3, -d / 2 + 0.07, g);         // 가림판(상판 아래 4cm 틈)
  for (const sx of [-1, 1]) box(0.025, 0.05, 0.03, M.rPlastic, sx * (w / 2 - 0.2), h - t - 0.09, -d / 2 + 0.085, g);   // 가림판 브래킷
  g.userData.noBlob = false;
}
// 조별 섬: 책상 2개를 긴 변끼리 붙이고(긴 축 = 로컬 z, 스크린 방향) 양쪽 긴 변에 의자가 마주 봄
function island(g, o) {
  const len = o.len || 1.46, dd = o.dd || 0.5, n = o.perSide || 2;
  desk(grp(-dd / 2, 0, 90, g), { w: len, d: dd, casters: true, style: o.style });
  desk(grp(dd / 2, 0, -90, g), { w: len, d: dd, casters: true, style: o.style });
  for (let i = 0; i < n; i++) {
    const z = -len / 2 + len / (2 * n) + i * len / n;
    if (o.chairStyle === 'nest') { nestChair(grp(-(dd + 0.25), z, -90, g)); nestChair(grp(dd + 0.25, z, 90, g)); }
    else { chair(grp(-(dd + 0.3), z, -90, g), { tag: true, base: 'silver' }); chair(grp(dd + 0.3, z, 90, g), { tag: true, base: 'silver' }); }
    if (o.tents !== false) for (const sx of [-1, 1]) { const t = box(0.025, 0.07, 0.15, M.white, sx * (dd - 0.1), 0.72, z, g); t.rotation.z = sx * 0.25; }   // 이름표(텐트)
  }
  if (o.basket !== false) { box(0.3, 0.09, 0.2, matOf('oak'), 0, 0.72, 0, g); box(0.26, 0.012, 0.16, M.black, 0, 0.8, 0, g); box(0.05, 0.08, 0.03, matOf('fabricRed'), -0.06, 0.8, 0.02, g); box(0.04, 0.1, 0.03, matOf('fabricBlue'), 0.05, 0.8, -0.03, g); }   // 바구니 + 필기구
}
function shellChair(g, o = {}) {   // 검정 플라스틱 쉘 의자 + 메쉬 느낌 등받이 + 크롬 5발 바퀴 베이스 (등받이 = 로컬 +z)
  const BKp = M.shellBlack || (M.shellBlack = std({ color: 0x18191b, roughness: 0.45 })), CR = M.chrome || (M.chrome = std({ color: 0xd9dde2, metalness: 0.9, roughness: 0.18 }));
  const meshM = M.chairMeshBk || (M.chairMeshBk = std({ color: 0x2a2c30, roughness: 0.9, transparent: true, opacity: 0.88 }));
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const leg = box(0.27, 0.025, 0.035, CR, Math.cos(a) * 0.13, 0.045, Math.sin(a) * 0.13, g); leg.rotation.y = -a; const w = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), M.black); w.position.set(Math.cos(a) * 0.26, 0.025, Math.sin(a) * 0.26); g.add(w); }
  cyl(0.02, 0.02, 0.36, CR, 0, 0.06, 0, 10, g); box(0.14, 0.03, 0.14, CR, 0, 0.4, 0, g);
  box(0.46, 0.04, 0.44, BKp, 0, 0.43, -0.01, g); box(0.46, 0.03, 0.06, BKp, 0, 0.45, -0.21, g);                     // 쉘 시트 + 앞 말림
  const bk = new THREE.Group(); bk.position.set(0, 0.47, 0.22); bk.rotation.x = -0.12; g.add(bk);
  box(0.44, 0.44, 0.03, BKp, 0, 0, 0, bk).geometry.translate(0, 0, 0);
  box(0.36, 0.34, 0.035, meshM, 0, 0.05, -0.002, bk);                                                                  // 메쉬 판
  for (const sx of [-1, 1]) box(0.03, 0.12, 0.03, CR, sx * 0.17, -0.1, -0.01, bk);
  if (o.tag) box(0.09, 0.055, 0.004, M.white, 0, 0.36, 0.02, bk);
}
function nestChair(g, o = {}) {   // 네스팅 의자(부산 사진): 짙은 회색 일체형 쉘(등받이 손잡이 홈) + 검정 방석 + 흰 튜브 썰매 프레임 + 바퀴 4개. 등받이 = 로컬 +z
  RM(); const r = 0.011, sh = 0.455;
  for (const sx of [-1, 1]) {
    const x = sx * 0.215;
    tube([[x, 0.07, -0.215], [x, 0.3, -0.2], [x, sh - 0.03, -0.17], [x, sh - 0.035, 0], [x, sh - 0.04, 0.14], [x * 1.02, 0.33, 0.21], [x * 1.04, 0.07, 0.255]], r, M.rTube, g, 28);  // 앞다리-좌판 레일-뒤 썰매다리
    tube([[x, sh - 0.04, 0.1], [x * 0.97, sh + 0.06, 0.16], [x * 0.95, sh + 0.16, 0.22]], r * 0.9, M.rTube, g, 10);                                            // 등받이 지지대
    twinCaster(x, -0.215, 0, g); twinCaster(x * 1.04, 0.255, 0, g);
  }
  tube([[-0.215, 0.34, -0.198], [0, 0.345, -0.2], [0.215, 0.34, -0.198]], r * 0.9, M.rTube, g, 6);          // 앞 가로대
  rbox(0.46, 0.022, 0.44, 0.009, M.rShell, 0, sh - 0.03, -0.01, g);                                          // 쉘 좌판
  rbox(0.43, 0.045, 0.41, 0.02, M.rCushion, 0, sh - 0.012, -0.02, g);                                        // 검정 방석
  // 일체형 쉘 등받이(손잡이 홈) — 살짝 감싸는 곡면 + 뒤로 젖힘
  const W = 0.44, Hh = 0.36, cr = 0.06, s = new THREE.Shape();
  s.moveTo(-W / 2 + cr, 0); s.lineTo(W / 2 - cr, 0); s.quadraticCurveTo(W / 2, 0, W / 2, cr); s.lineTo(W / 2, Hh - cr); s.quadraticCurveTo(W / 2, Hh, W / 2 - cr, Hh);
  s.lineTo(-W / 2 + cr, Hh); s.quadraticCurveTo(-W / 2, Hh, -W / 2, Hh - cr); s.lineTo(-W / 2, cr); s.quadraticCurveTo(-W / 2, 0, -W / 2 + cr, 0);
  const hw = 0.075, hy = Hh - 0.075, hr = 0.017, hole = new THREE.Path();
  hole.moveTo(-hw, hy - hr); hole.lineTo(hw, hy - hr); hole.absarc(hw, hy, hr, -Math.PI / 2, Math.PI / 2, false); hole.lineTo(-hw, hy + hr); hole.absarc(-hw, hy, hr, Math.PI / 2, Math.PI * 1.5, false);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 8 });
  const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i); P.setZ(i, P.getZ(i) - 0.7 * x * x); } geo.computeVertexNormals();
  const bk = new THREE.Group(); bk.position.set(0, sh + 0.07, 0.2); bk.rotation.x = 0.2; g.add(bk);
  const m = new THREE.Mesh(geo, M.rShell); m.position.z = -0.006; bk.add(m);
  const nk = rbox(0.34, 0.1, 0.016, 0.006, M.rShell, 0, sh - 0.025, 0.19, g); nk.rotation.x = 0.4;        // 좌판-등받이 연결(일체형)
  if (o.tag) box(0.09, 0.05, 0.004, M.white, 0, 0.12, 0.02, bk);
  g.userData.noBlob = false;
}
function deskPair(g, o) {   // 책상 + 뒤쪽 의자 n개(기본 2), 의자는 책상(북쪽, -z)을 바라봄
  const w = o.w || 1.5, d = o.d || 0.5, n = o.chairs || 2; desk(g, { w, d, casters: o.casters, style: o.style });
  const cz = d / 2 + (o.tuck ?? 0.3);
  for (let i = 0; i < n; i++) { const cg = grp(n === 2 ? (i ? 1 : -1) * w * 0.24 : -w / 2 + w / (2 * n) + i * w / n, cz, 0, g); if (o.chairStyle === 'shell') shellChair(cg, { tag: o.tag }); else if (o.chairStyle === 'nest') nestChair(cg, { tag: o.tag }); else chair(cg, { tag: o.tag, base: o.chairBase }); }
}
function extinguisher(g) { cyl(0.075, 0.075, 0.5, plain(0xd8261c), 0, 0, 0, 16, g); cyl(0.03, 0.04, 0.06, M.black, 0, 0.5, 0, 10, g); box(0.12, 0.02, 0.03, M.black, 0.03, 0.56, 0, g); box(0.08, 0.1, 0.005, M.white, 0, 0.25, -0.076, g); }
function elevator(g, o) {   // 엘리베이터: 벽판 + 스테인리스 문 2짝 + 프레임 + 호출 버튼 + 층 표시 (정면 = 로컬 -z)
  if (o && o.recessed) {
    const st = new THREE.MeshStandardMaterial({ color: 0x8e9399, metalness: 0.45, roughness: 0.45 });
    const dm = new THREE.MeshStandardMaterial({ color: 0x2f2c2b, metalness: 0.25, roughness: 0.55 });
    box(0.08, 2.22, 0.14, st, -0.59, 0, -0.05, g);
    box(0.08, 2.22, 0.14, st,  0.59, 0, -0.05, g);
    box(1.26, 0.08, 0.14, st,  0, 2.14, -0.05, g);
    box(0.54, 2.14, 0.02, dm, -0.275, 0, -0.005, g);
    box(0.54, 2.14, 0.02, dm,  0.275, 0, -0.005, g);
    box(0.11, 0.40, 0.02, plain(0x6e7378), -0.78, 1.56, -0.01, g);
    box(0.07, 0.18, 0.02, M.black, -0.78, 1.62, -0.02, g);
    const ft = textTexture(String(o.floor || 2), '#111111', '#ff4422', { w: 64, h: 64, font: 'bold 40px Pretendard,sans-serif' });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshBasicMaterial({ map: ft }));
    fm.position.set(-0.78, 1.71, -0.032); fm.rotation.y = Math.PI; g.add(fm);
    box(0.06, 0.18, 0.02, M.black, -0.78, 0.98, -0.01, g);
    cyl(0.014, 0.014, 0.01, plain(0xffffff), -0.78, 1.09, -0.022, 10, g);
    cyl(0.014, 0.014, 0.01, plain(0xffffff), -0.78, 1.04, -0.022, 10, g);
    if (o.wallFloor) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128; const k = c.getContext('2d');
      k.fillStyle = '#1d2024'; k.font = '800 72px Pretendard,sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillText(o.wallFloor, 64, 64);
      const wt = new THREE.CanvasTexture(c); wt.colorSpace = THREE.SRGBColorSpace;
      const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshBasicMaterial({ map: wt, transparent: true }));
      wm.position.set(1.20, 1.88, -0.015); wm.rotation.y = Math.PI; wm.userData.keep = true; g.add(wm);
    }
    if (o.sideLed) {
      box(0.36, 0.10, 0.03, M.black, -1.15, 2.18, -0.02, g);
      const lt = textTexture('▲ ' + (o.floor || 2), '#111111', '#ff4422', { w: 128, h: 48, font: 'bold 30px Pretendard,sans-serif' });
      const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.08), new THREE.MeshBasicMaterial({ map: lt }));
      lm.position.set(-1.15, 2.23, -0.038); lm.rotation.y = Math.PI; g.add(lm);
    }
    g.userData.noBlob = true;
    return;
  }
   if (!o || !o.noPanel) box(2.4, H, 0.12, plain(0xe4e1da), 0, 0, 0.06, g);
  const st = M.chrome || (M.chrome = std({ color: 0xd9dde2, metalness: 0.9, roughness: 0.18 }));
  const dm = o && o.dark ? (M.evDark || (M.evDark = std({ color: 0x34373c, metalness: 0.6, roughness: 0.35 }))) : st;
  box(1.2, 2.2, 0.06, o && o.dark ? (M.steel || st) : plain(0xb9bcc0), 0, 0, -0.02, g); box(0.53, 2.1, 0.02, dm, -0.27, 0, -0.06, g); box(0.53, 2.1, 0.02, dm, 0.27, 0, -0.06, g);
  box(0.06, 0.12, 0.02, M.black, 0.8, 1.1, -0.01, g); cyl(0.015, 0.015, 0.01, plain(0xffffff), 0.8, 1.15, -0.02, 10, g);
  box(0.36, 0.12, 0.02, M.black, 0, 2.3, -0.01, g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const k = c.getContext('2d'); k.fillStyle = '#ff6a2a'; k.font = '700 44px monospace'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('▲ ' + (o && o.floor || 10), 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.09), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, 2.36, -0.021); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 64; const k2 = c2.getContext('2d'); k2.fillStyle = '#1b2333'; k2.font = '700 40px Pretendard, sans-serif'; k2.textAlign = 'center'; k2.textBaseline = 'middle'; k2.fillText('엘리베이터', 128, 34);
  const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; const m2 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), new THREE.MeshBasicMaterial({ map: t2, transparent: true })); m2.position.set(0, 2.52, -0.004); m2.rotation.y = Math.PI; m2.userData.keep = true; g.add(m2);
  g.userData.noBlob = true;
}
function restroom(g, o = {}) {   // 화장실 표시: 문 + 남/녀 픽토그램 판 (정면 = 로컬 -z), kind:'f'|'m' = 여자/남자 하나만
  if (o && o.frosted) {
  const w = o.w || 0.95;
const st = new THREE.MeshStandardMaterial({ color: 0xc8cdd2, metalness: 0.85, roughness: 0.22 });
box(0.06, 2.38, 0.08, st, -w / 2 - 0.03, 0, -0.02, g);
box(0.06, 2.38, 0.08, st,  w / 2 + 0.03, 0, -0.02, g);
box(w + 0.12, 0.06, 0.08, st, 0, 2.32, -0.02, g);
box(w + 0.06, 0.06, 0.06, st, 0, 2.04, -0.02, g);
box(w + 0.06, 0.05, 0.06, st, 0, 0, -0.02, g);
for (let i = 0; i < 4; i++) box(w, 0.018, 0.03, st, 0, 2.12 + i * 0.05, -0.02, g);
const c = document.createElement('canvas'); c.width = 256; c.height = 512; const k = c.getContext('2d');
k.fillStyle = '#d4d9dc'; k.fillRect(0, 0, 256, 512);
k.fillStyle = '#22262a'; k.font = '600 22px Pretendard, sans-serif'; k.textAlign = 'center';
k.fillText(o.kind === 'f' ? 'Women' : 'Men', 128, 92);
k.strokeStyle = '#22262a'; k.lineWidth = 7; k.lineCap = 'round'; k.lineJoin = 'round';
k.beginPath(); k.arc(128, 168, 20, 0, Math.PI * 2); k.stroke();
if (o.kind === 'f') {
k.beginPath();
k.moveTo(114, 208); k.quadraticCurveTo(128, 202, 142, 208);
k.lineTo(166, 305); k.lineTo(138, 305); k.lineTo(138, 385);
k.moveTo(118, 385); k.lineTo(118, 305); k.lineTo(90, 305); k.closePath();
k.stroke();
} else {
k.beginPath();
k.moveTo(100, 212); k.quadraticCurveTo(128, 204, 156, 212);
k.lineTo(156, 290); k.quadraticCurveTo(156, 304, 142, 308); k.lineTo(142, 385);
k.moveTo(114, 385); k.lineTo(114, 308); k.quadraticCurveTo(100, 304, 100, 290); k.closePath();
k.stroke();
}
const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.08 }));
panel.position.set(0, 1.05, -0.032); panel.rotation.y = Math.PI; panel.userData.keep = true; g.add(panel);
box(w, 2.0, 0.02, plain(0xd4d9dc), 0, 0.05, -0.02, g);
const hx = o.kind === 'f' ? -(w / 2 - 0.12) : (w / 2 - 0.12);
box(0.025, 0.72, 0.03, st, hx, 0.72, -0.06, g);
g.userData.noBlob = true; g.userData.noCollide = true;
return;
  }
   box(o.w || 1.0, 2.1, 0.04, plain(o.doorColor ? new THREE.Color(o.doorColor).getHex() : 0xd5d0c6), 0, 0, -0.02, g); box(0.02, 0.2, 0.03, M.metal, 0.38, 0.95, -0.05, g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const k = c.getContext('2d'); k.fillStyle = '#ffffff'; k.fillRect(0, 0, 256, 128);
  const person = (x, col, skirt) => { k.fillStyle = col; k.beginPath(); k.arc(x, 30, 12, 0, 7); k.fill(); if (skirt) { k.beginPath(); k.moveTo(x - 20, 92); k.lineTo(x, 46); k.lineTo(x + 20, 92); k.fill(); } else k.fillRect(x - 13, 46, 26, 46); k.fillRect(x - 9, 90, 7, 28); k.fillRect(x + 2, 90, 7, 28); };
  if (o.kind === 'f') person(128, '#e2463c', true); else if (o.kind === 'm') person(128, '#2f6fd6', false); else { person(80, '#2f6fd6', false); person(176, '#e2463c', true); k.fillStyle = '#999'; k.fillRect(127, 14, 2, 100); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, 2.3, -0.045); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  const c2 = document.createElement('canvas'); c2.width = 256; c2.height = 64; const k2 = c2.getContext('2d'); k2.fillStyle = '#1b2333'; k2.font = '700 40px Pretendard, sans-serif'; k2.textAlign = 'center'; k2.textBaseline = 'middle'; k2.fillText(o.text || '화장실', 128, 34, 240);
  const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; const m2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshBasicMaterial({ map: t2, transparent: true })); m2.position.set(0, 2.14, -0.045); m2.rotation.y = Math.PI; m2.userData.keep = true; g.add(m2);
  g.userData.noBlob = true; g.userData.noCollide = true;
}
function plainDoor(g, o) {   // 닫힌 흰 문(공용 복도 관리실 등, 장식) 정면 = 로컬 -z
  if (o && o.ps) {
    const w = o.w || 0.70, h = 1.55, y0 = 0.28;
    box(w + 0.05, h + 0.05, 0.025, plain(0xdcd9d3), 0, y0 - 0.025, -0.012, g);
    const c = document.createElement('canvas'); c.width = 256; c.height = 512; const k = c.getContext('2d');
    k.fillStyle = '#e8e6e2'; k.fillRect(0, 0, 256, 512);
    k.strokeStyle = '#555555'; k.lineWidth = 3; k.strokeRect(10, 10, 236, 492);
    k.fillStyle = '#222222'; k.textAlign = 'center';
    k.font = '700 32px Pretendard, sans-serif'; k.fillText('PS', 128, 152);
    k.font = '600 18px Pretendard, sans-serif'; k.fillText('(유수검지장치실)', 128, 180);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.05 }));
    p.position.set(0, y0 + h / 2, -0.028); p.rotation.y = Math.PI; p.userData.keep = true; g.add(p);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.018, 14), new THREE.MeshStandardMaterial({ color: 0xcfd4d9, metalness: 0.9, roughness: 0.18 }));
    knob.rotation.x = Math.PI / 2; knob.position.set(-(w / 2 - 0.09), y0 + 0.52, -0.036); g.add(knob);
    g.userData.noCollide = true; g.userData.noBlob = true;
    return;
  }
  if (o && o.evWhite) {
    const w = o.w || 0.95;
    box(w + 0.08, 2.16, 0.04, plain(0xd8d6d0), 0, 0, -0.01, g);
    box(w, 2.12, 0.04, plain(0xedece8), 0, 0, -0.025, g);
    box(0.04, 0.04, 0.04, M.metal, w / 2 - 0.10, 0.95, -0.055, g);
    box(0.11, 0.022, 0.02, M.metal, w / 2 - 0.14, 0.96, -0.075, g);
    box(0.22, 0.05, 0.04, plain(0x9ca1a6), -(w / 2 - 0.18), 2.02, -0.055, g);
    box(0.04, 0.22, 0.12, plain(0x24344d), w / 2 + 0.06, 1.78, -0.06, g);
    g.userData.noCollide = true; g.userData.noBlob = true;
    return;
  }
  box((o.w || 0.9) + 0.1, 2.15, 0.05, M.steel || M.metal, 0, 0, -0.01, g); box(o.w || 0.9, 2.1, 0.05, plain(0xf3f2ef), 0, 0, -0.03, g); box(0.02, 0.14, 0.04, M.metal, (o.w || 0.9) / 2 - 0.1, 0.95, -0.07, g);
  g.userData.noCollide = true; g.userData.noBlob = true;
}
function stairsDoor(g, o) {   // 베이지 방화문 + 푸시바 + STAIRS 사인 + 비상구 유도등(서울 복도 사진) 정면 = 로컬 -z
  const bg = plain(0xd9d3c0); box(1.04, 2.16, 0.06, M.steel || M.metal, 0, 0, -0.01, g); box(0.95, 2.1, 0.05, bg, 0, 0, -0.04, g);
  box(0.6, 0.04, 0.05, M.metal, 0.05, 1.0, -0.1, g); box(0.04, 0.08, 0.06, M.metal, -0.27, 0.98, -0.08, g); box(0.04, 0.08, 0.06, M.metal, 0.35, 0.98, -0.08, g);
  const c = document.createElement('canvas'); c.width = 128; c.height = 160; const k = c.getContext('2d'); k.fillStyle = '#d9d3c0'; k.fillRect(0, 0, 128, 160); k.strokeStyle = '#333'; k.lineWidth = 6; k.strokeRect(24, 14, 80, 80);
  k.beginPath(); k.moveTo(32, 86); k.lineTo(52, 86); k.lineTo(52, 66); k.lineTo(72, 66); k.lineTo(72, 46); k.lineTo(96, 46); k.stroke(); k.fillStyle = '#333'; k.font = '700 22px sans-serif'; k.textAlign = 'center'; k.fillText('STAIRS', 64, 130);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, 1.6, -0.067); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  box(0.16, 0.2, 0.06, plain(0x2b3550), 0.35, 2.3, -0.04, g);   // 파란 STAIRS 사인 박스
  const c2 = document.createElement('canvas'); c2.width = 128; c2.height = 64; const k2 = c2.getContext('2d'); k2.fillStyle = '#18a84a'; k2.fillRect(0, 0, 128, 64); k2.fillStyle = '#fff'; k2.font = '700 26px sans-serif'; k2.textAlign = 'center'; k2.fillText('비상구', 64, 42);
  const t2 = new THREE.CanvasTexture(c2); t2.colorSpace = THREE.SRGBColorSpace; const m2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), new THREE.MeshBasicMaterial({ map: t2 })); m2.position.set(-0.05, 2.42, -0.03); m2.rotation.y = Math.PI; m2.userData.keep = true; g.add(m2);
  g.userData.noCollide = true; g.userData.noBlob = true;
}
function fireCabinet(g, o) {   // 베이지 옥내소화전/경보 함(사진) 정면 = 로컬 -z
  box(0.45, 1.3, 0.12, plain(0xdcd6c4), 0, 0.3, -0.06, g); cyl(0.04, 0.04, 0.02, plain(0xd23b2b), -0.08, 1.3, -0.125, 14, g).rotation.x = Math.PI / 2;
  box(0.3, 0.12, 0.01, plain(0xf4f2ea), 0, 1.45, -0.125, g); g.userData.noBlob = true;
}
function hangSign(g, o) {   // 천장 매달린 안내 사인(양면): 픽토그램 + 글자
  const w = o.w || 1.0, h = 0.26, c = document.createElement('canvas'); c.width = 512; c.height = 134; const k = c.getContext('2d'); k.fillStyle = '#2b3550'; k.fillRect(0, 0, 512, 134);
  const col = o.kind === 'f' ? '#ff6b6b' : o.kind === 'm' ? '#6fb0ff' : '#fff'; k.fillStyle = col; k.beginPath(); k.arc(70, 36, 13, 0, 7); k.fill();
  if (o.kind === 'f') { k.beginPath(); k.moveTo(48, 100); k.lineTo(70, 54); k.lineTo(92, 100); k.fill(); } else k.fillRect(56, 54, 28, 46); k.fillRect(60, 98, 8, 26); k.fillRect(72, 98, 8, 26);
  k.fillStyle = '#fff'; k.font = '800 58px Pretendard, sans-serif'; k.textBaseline = 'middle'; k.fillText(o.text || '화장실', 130, 70, 370);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const mat = new THREE.MeshBasicMaterial({ map: t });
  box(w + 0.02, h + 0.02, 0.03, plain(0x1c2232), 0, 2.2, 0, g);
  for (const sd of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(0, 2.2 + (h + 0.02) / 2, sd * 0.017); m.rotation.y = sd < 0 ? Math.PI : 0; m.userData.keep = true; g.add(m); }
  for (const sx of [-w / 2 + 0.08, w / 2 - 0.08]) box(0.01, H - 2.48, 0.01, M.metal, sx, 2.48, 0, g);
  g.userData.noCollide = true; g.userData.noBlob = true;
}
function pictoPlate(g, o) {   // 벽 파란 픽토그램 사인(사진: 화장실 통로 입구 옆) 정면 = 로컬 -z
  const c = document.createElement('canvas'); c.width = 96; c.height = 160; const k = c.getContext('2d'); k.fillStyle = '#2d5fb8'; k.fillRect(0, 0, 96, 160); k.fillStyle = '#fff';
  k.beginPath(); k.arc(48, 42, 12, 0, 7); k.fill(); if (o.kind === 'f') { k.beginPath(); k.moveTo(26, 110); k.lineTo(48, 60); k.lineTo(70, 110); k.fill(); } else k.fillRect(34, 60, 28, 50); k.fillRect(37, 108, 9, 32); k.fillRect(50, 108, 9, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.25), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, 1.55, -0.012); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  g.userData.noCollide = true; g.userData.noBlob = true;
}
function okSlats(g, o) {   // 옆 호실(L211 OK 세무회계) 입구 옆 우드 슬랫 기둥 + 위 우드 띠 + 흰 사인판(사진 seoul_entrance_out) 정면 = 로컬 -z
  const wd = M.slatWood || (M.slatWood = std({ color: 0xc89a66, roughness: 0.6 })), w = o.w || 0.9, n = Math.round(w / 0.06);
  box(w, H, 0.02, plain(0x8a6a48), 0, 0, -0.01, g);
  for (let i = 0; i < n; i++) box(0.035, 2.45, 0.05, wd, -w / 2 + 0.03 + i * (w - 0.06) / (n - 1), 0, -0.045, g);
  box(w, H - 2.45, 0.06, wd, 0, 2.45, -0.04, g);
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const k = c.getContext('2d'); k.fillStyle = '#f5f4f1'; k.fillRect(0, 0, 512, 160); k.fillStyle = '#222'; k.font = '700 66px Pretendard, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(o.text || '', 256, 84, 480);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; box(w * 0.92, 0.3, 0.03, plain(0xf5f4f1), 0, 1.45, -0.085, g);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.9 * 160 / 512), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, 1.6, -0.101); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  g.userData.noBlob = true;
}
function tactile(g, o) {   // 노란 점자블록(엘리베이터 앞)
  box(o.w || 0.6, 0.008, o.d || 0.3, plain(0xf2c230), 0, 0, 0, g); g.userData.noCollide = true; g.userData.noBlob = true;
}
function goldSign(g, o) {   // 복도 벽 금색 사인 패널(사진): 금색 세로 띠 2개 + 가운데 흰 판 + 로고 글자, 앞 = 로컬 -z
  const GD = M.gold || (M.gold = std({ color: 0xb08a4e, roughness: 0.3, metalness: 0.7 })), w = o.w || 0.9, h = o.h || 2.3;
  box(0.16, h, 0.01, GD, -w / 2 + 0.08, 0.1, 0, g); box(0.16, h, 0.01, GD, w / 2 - 0.08, 0.1, 0, g); box(w - 0.32, h, 0.008, M.white, 0, 0.1, 0, g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const k = c.getContext('2d'); k.fillStyle = '#2b3550'; k.font = '800 40px Pretendard, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('NEOIZE', 128, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.105), new THREE.MeshBasicMaterial({ map: t, transparent: true })); m.position.set(0, 1.55, -0.008); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  g.userData.noCollide = true; g.userData.noBlob = true;
}
function wallPlate(g, o) { box(o.w || 0.2, o.h || 0.12, 0.012, matOf(o.color || 'white'), 0, o.y || 1.6, 0, g); g.userData.noCollide = true; g.userData.noBlob = true; }
/* 단상(무대): 걸어 올라갈 수 있는 낮은 플랫폼. 위에 놓는 가구는 elev(바닥에서 띄우는 높이)를 단상 높이로 */
const PLATFORMS = [];
function stage(g, o) {   // 닫힌 상자형 단상: 짙은 회색 몸체 + 카펫 상판 + 보이는 모든 모서리 금속 트림 + 가운데 계단
  const w = o.w || 4, d = o.d || 1.5, h = o.h || 0.2, side = plain(0x2c2e33), top = matOf(o.top || 'carpetDark'), tr = M.metal, t = 0.022;
  box(w, h - 0.018, d, side, 0, 0, 0, g);                                                        // 몸체(6면 닫힘)
  box(w - 0.02, 0.018, d - 0.02, top, 0, h - 0.018, 0, g);                                       // 카펫 상판
  box(w, 0.012, t, tr, 0, h - 0.012, d / 2 - t / 2, g); box(w, 0.012, t, tr, 0, h - 0.012, -d / 2 + t / 2, g);          // 앞·뒤 위 모서리
  box(t, 0.012, d, tr, -w / 2 + t / 2, h - 0.012, 0, g); box(t, 0.012, d, tr, w / 2 - t / 2, h - 0.012, 0, g);         // 양옆 위 모서리
  box(w + 0.008, 0.035, 0.004, tr, 0, h - 0.035, d / 2 + 0.002, g); box(w + 0.008, 0.035, 0.004, tr, 0, h - 0.035, -d / 2 - 0.002, g);   // 앞·뒤 금속 띠
  box(0.004, 0.035, d + 0.008, tr, -w / 2 - 0.002, h - 0.035, 0, g); box(0.004, 0.035, d + 0.008, tr, w / 2 + 0.002, h - 0.035, 0, g);   // 양옆 금속 띠
  box(w - 0.02, 0.025, 0.004, plain(0x16171a), 0, 0, d / 2 + 0.002, g);                           // 아래 걸레받이 그늘
  const sx = o.stepX || 0, sw = Math.min(1.2, w * 0.3), sh = h / 2;
  if (o.step !== false) {
    box(sw, sh - 0.015, 0.3, side, sx, 0, d / 2 + 0.15, g); box(sw - 0.02, 0.015, 0.28, top, sx, sh - 0.015, d / 2 + 0.15, g);   // 계단 한 칸(닫힘)
    box(sw + 0.008, 0.03, 0.004, tr, sx, sh - 0.03, d / 2 + 0.302, g); box(sw, 0.01, t, tr, sx, sh - 0.01, d / 2 + 0.3 - t / 2, g);
    for (const e of [-1, 1]) box(0.004, 0.03, 0.3, tr, sx + e * (sw / 2 + 0.002), sh - 0.03, d / 2 + 0.15, g);
  }
  g.userData.noCollide = true; g.userData.noBlob = true;
  const r = o.rot || 0; if (r % 180 !== 0) console.warn('stage 는 rot 0/180 만 지원');
  PLATFORMS.push({ x0: o.x - w / 2, x1: o.x + w / 2, z0: o.z - d / 2, z1: o.z + d / 2, h });
  if (o.step !== false) { const px = o.x + sx; PLATFORMS.push({ x0: px - sw / 2, x1: px + sw / 2, z0: o.z + d / 2, z1: o.z + d / 2 + 0.3, h: sh }); }
}
function floorHeight(x, z) { let h = 0; for (const p of PLATFORMS) if (x >= p.x0 - 0.05 && x <= p.x1 + 0.05 && z >= p.z0 - 0.05 && z <= p.z1 + 0.05) h = Math.max(h, p.h); return h; }
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
function avCabinet(g, o) {
  const w = o.w || 0.68, d = o.d || 0.55, h = o.h || 0.78;
  const panel = plain(0x77766c), dark = plain(0x20252a);
  box(w, 0.045, d, dark, 0, h - 0.045, 0, g);
  box(w, 0.06, d, dark, 0, 0.08, 0, g);
  box(w, h - 0.16, 0.025, dark, 0, 0.12, d / 2 - 0.012, g);
  for (const side of [-1, 1]) {
    box(0.035, h - 0.16, d, panel, side * (w / 2 - 0.018), 0.12, 0, g);
    for (let z = -d / 2 + 0.02; z < d / 2; z += 0.025) box(0.003, h - 0.18, 0.006, M.metal, side * (w / 2 + 0.001), 0.13, z, g);
    box(0.035, h - 0.16, 0.035, dark, side * (w / 2 - 0.018), 0.12, -d / 2, g);
    for (const z of [-d / 2 + 0.08, d / 2 - 0.08]) {
      const wheel = cyl(0.04, 0.04, 0.035, M.black, side * (w / 2 - 0.07), 0, z, 12, g);
      wheel.rotation.z = Math.PI / 2; wheel.position.y = 0.04;
    }
  }
  for (const y of [0.22, 0.42, 0.61]) {
    box(w - 0.09, 0.018, d - 0.06, M.metal, 0, y, 0, g);
    box(w - 0.15, 0.09, d - 0.12, M.black, 0, y + 0.02, 0, g);
    for (const x of [-0.18, -0.1, 0.12]) box(0.025, 0.025, 0.012, M.metal, x, y + 0.05, -d / 2 + 0.05, g);
  }
  box(w - 0.075, h - 0.2, 0.009, std({ color:0x26333d, transparent:true, opacity:0.48, roughness:0.15, depthWrite:false }), 0, 0.14, -d / 2 - 0.006, g);
  for (const y of [0.16, h - 0.17]) box(0.035, 0.055, 0.018, M.metal, w / 2 - 0.055, y, -d / 2 - 0.018, g);
  box(0.025, 0.09, 0.025, M.metal, -w / 2 + 0.07, h * 0.45, -d / 2 - 0.025, g);
}
function podium(g, o) {   // 발표용 스탠딩 강연대 (앞 = 로컬 -z → rot:180 이면 청중(남쪽)을 향함)
  if (o.style === 'slimDark') {
    const w = o.w || 0.5, d = o.d || 0.4, h = o.h || 1.05;
    box(w, 0.035, d, M.black, 0, 0, 0, g);
    box(w * 0.84, h - 0.08, d * 0.62, plain(0x333638), 0, 0.035, 0, g);
    for (let x = -w * 0.34; x < w * 0.36; x += 0.045) box(0.008, h - 0.16, 0.009, M.metal, x, 0.07, -d * 0.31 - 0.005, g);
    const top = box(w + 0.04, 0.035, d + 0.05, M.black, 0, h - 0.05, 0, g); top.rotation.x = -0.12;
    return;
  }
  const w = o.w || 0.62, d = o.d || 0.48, h = o.h || 1.08, m = matOf(o.color || 'white'), acc = matOf(o.accent || 'oak');
  box(w, h - 0.06, d, m, 0, 0, 0, g);                                           // 몸체
  box(w + 0.04, 0.03, d + 0.04, m, 0, 0, 0, g);                                 // 받침
  box(w * 0.86, h * 0.55, 0.012, acc, 0, h * 0.2, -d / 2 - 0.006, g);           // 앞면 포인트 패널
  const top = box(w + 0.06, 0.035, d + 0.08, acc, 0, h - 0.06, 0.02, g); top.rotation.x = -0.18;   // 기울어진 상판
  cyl(0.008, 0.008, 0.3, M.black, w * 0.3, h - 0.03, 0.05, 8, g);              // 구즈넥 마이크
}
function whiteboard(g, o) {
  if (o.style === 'mirror') {   // 대형 유리/거울 패널 + 하부 선반(교육장 동쪽 벽, 사진 IMG_0382)
    const w = o.w || 2, n = Math.max(1, Math.round(w / 1.2)), y0 = o.y0 ?? 0.9, y1 = o.y1 ?? 2.45;
    box(w, y1 - y0, 0.02, M.mirror, 0, y0, 0, g);
    for (let i = 0; i <= n; i++) box(0.02, y1 - y0, 0.035, M.frame, -w / 2 + w * i / n, y0, -0.008, g);
    box(w, 0.025, 0.035, M.frame, 0, y1, -0.008, g);
    box(w, 0.03, 0.1, M.white, 0, y0 - 0.03, -0.04, g); return;   // 선반(레지)
  }
  if (o.style === 'glass') {   // 연두빛 유리 화이트보드(벽 길이 거의 전체) + 하부 레지 (교육장 양쪽 벽, 사진)
    const w = o.w || 2, y0 = o.y0 ?? 0.9, y1 = o.y1 ?? 2.1;
    box(w, y1 - y0, 0.02, M.mint, 0, y0, 0, g);
    box(w + 0.02, 0.015, 0.03, M.white, 0, y1, -0.005, g); box(0.015, y1 - y0, 0.03, M.white, -w / 2, y0, -0.005, g); box(0.015, y1 - y0, 0.03, M.white, w / 2, y0, -0.005, g);
    box(w, 0.025, 0.08, M.white, 0, y0 - 0.025, -0.035, g); return;   // 레지(마커 받침)
  }
  box(o.w || 2, 1.05, 0.04, M.mint, 0, 0.95, 0, g);
}
// 벽시계: 검은 테두리 + 흰 판 + 바늘 (앞면 = 로컬 -z)
function wallClock(g, o) {
  const r = o.r || 0.17, y = o.y || 2.1;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 10, 36), M.black); rim.position.set(0, y, -0.03); g.add(rim);
  const face = cyl(r, r, 0.03, M.white, 0, 0, 0, 36, g); face.rotation.x = Math.PI / 2; face.position.set(0, y, -0.02);
  const hh = box(0.012, r * 0.55, 0.006, M.black, 0, 0, 0, g); hh.position.set(0.03, y + 0.02, -0.04); hh.rotation.z = -0.9;
  const mh = box(0.008, r * 0.8, 0.006, M.black, 0, 0, 0, g); mh.position.set(-0.02, y + 0.06, -0.042); mh.rotation.z = 0.35;
  g.userData.noBlob = true; g.userData.noCollide = true;
}
// 비상구 유도등 (초록, 문 위)
function exitSign(g, o) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  x.fillStyle = '#12a150'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#fff'; x.font = '700 40px Pretendard, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('비상구', 150, 40); x.font = '600 22px Pretendard, sans-serif'; x.fillText('EXIT', 150, 76);
  x.beginPath(); x.arc(46, 30, 9, 0, 7); x.fill(); x.fillRect(38, 42, 16, 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  box(0.36, 0.14, 0.04, M.white, 0, o.y || 2.25, 0, g);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.125), new THREE.MeshBasicMaterial({ map: t })); pl.position.set(0, (o.y || 2.25) + 0.07, -0.021); pl.rotation.y = Math.PI; g.add(pl);
  g.userData.noBlob = true; g.userData.noCollide = true;
}
// 벽걸이 저상형 히터(다리 있음)
function heater(g, o) {
  const w = o.w || 1.2, h = o.h || 0.5, d = o.d || 0.12;
  box(w, h - 0.12, d, M.white, 0, 0.12, 0, g);
  for (let i = 0; i < Math.round(w / 0.06); i++) box(0.012, h - 0.2, 0.005, M.paint, -w / 2 + 0.04 + i * 0.06, 0.16, -d / 2 - 0.002, g);
  for (const xx of [-w / 2 + 0.08, w / 2 - 0.08]) { box(0.04, 0.12, 0.08, M.white, xx, 0, 0, g); box(0.08, 0.015, 0.2, M.white, xx, 0, -0.02, g); }
}
// 천장 매입형 전동 스크린: 천장 슬롯(흰 하우징)에서 흰 막이 내려오고 아래에 얇은 검은 바. 벽에서 떨어져(앞으로) 매달림
const SCREENS = [];
function ceilingScreen(g, o) {   // box(.., y) 의 y 는 아래 끝 높이
  const w = o.w || 2.4, h = o.h || 1.45, top = H - 0.07;
  box(w + 0.24, 0.07, 0.18, M.white, 0, top, 0, g);                    // 천장 하우징
  box(w + 0.1, 0.012, 0.03, M.black, 0, top - 0.012, 0, g);            // 슬롯
  if (o.interactive !== false) {
    const roll = new THREE.Group(); roll.position.y = top; roll.userData.dynamic = true; g.add(roll);
    box(w, 0.12, 0.006, M.black, 0, -0.12, 0, roll);
    box(w, h - 0.12, 0.006, M.screen, 0, -h, 0, roll);
    const bar = box(w + 0.04, 0.035, 0.025, M.black, 0, top - 0.035, 0, g); bar.userData.dynamic = true;
    const cur = o.raised ? 0 : 1; roll.scale.y = 0.015 + cur * 0.985; bar.position.y = top - h * roll.scale.y - 0.0175;
    const rec = { g, roll, bar, top, h, w, cur, target: cur };
    g.userData.screenRef = rec;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.34, 0.32), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    hit.position.set(0, top - 0.1, 0); hit.userData.noCollide = true; hit.userData.noBlob = true; hit.userData.noPick = true; g.add(hit);
    SCREENS.push(rec);
    g.userData.noCollide = true; g.userData.noBlob = true; return;
  }
  box(w, 0.12, 0.006, M.black, 0, top - 0.12, 0, g);                   // 윗부분 검은 리더
  box(w, h - 0.12, 0.006, M.screen, 0, top - h, 0, g);                 // 흰 스크린 면
  box(w + 0.04, 0.035, 0.025, M.black, 0, top - h - 0.035, 0, g);      // 아래 검은 바
  g.userData.noBlob = true;
}
// 벽걸이 박스 스피커: 천장 바로 아래, 살짝 아래·안쪽을 향함 (앞면 = 로컬 -z)
function speaker(g, o) {
  const w = o.w || 0.25, h = o.h || 0.35, d = o.d || 0.2, top = o.top || (H - 0.06);
  const s = new THREE.Group(); s.position.set(0, top - h / 2, 0); s.rotation.x = -(o.tilt == null ? 12 : o.tilt) * DEG; g.add(s);
  const wh = o.color === 'white';
  box(w, h, d, wh ? M.white : M.black, 0, -h / 2, 0, s);
  box(w - 0.03, h - 0.03, 0.006, plain(wh ? 0xd9dbdd : 0x2a2c30), 0, -h / 2 + 0.015, -d / 2 - 0.003, s);   // 그릴
  box(0.05, 0.03, 0.12, M.black, 0, h / 2 - 0.03, d / 2 + 0.04, s);                      // 벽 브래킷
  g.userData.noBlob = true; g.userData.noCollide = true;
}
function screen(g, o) { const w = o.w || 2.2; box(w + 0.06, 1.46, 0.015, M.black, 0, 0.92, 0.01, g); box(w, 1.4, 0.02, M.screen, 0, 0.95, -0.01, g); box(w + 0.2, 0.12, 0.14, M.black, 0, 2.38, -0.04, g); }
function tvStand(g) { box(1.3, 0.75, 0.07, M.tv, 0, 0.55, 0, g); box(0.05, 0.6, 0.05, M.black, -0.45, 0, 0, g); box(0.05, 0.6, 0.05, M.black, 0.45, 0, 0, g); box(1.1, 0.04, 0.5, M.black, 0, 0, 0, g); }
// 백라이트 디스플레이 월: 앞면 = 로컬 -z, 뒤(+z)가 벽. 판 네 변 뒤에 숨은 LED가 벽을 따뜻하게 비춤
function tvWallBacklit(g, o) {
  const w = o.w || 2.5, y0 = 0.35, h = 1.95, d = 0.1, back = o.wallGap ?? 0.05, off = o.standoff ?? 0.04;   // back: 배치 중심에서 벽면까지(m), off: 판을 벽에서 띄우는 거리(m)
  box(w, h, d, std({ color: 0xe6e6e3, roughness: 0.55 }), 0, y0, -off, g);            // 판: 벽보다 살짝 회색, 반광
  // 판 테두리 뒤쪽 LED 띠(옆에서 보면 판 가장자리 뒤가 밝게 빛남)
  const led = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
  for (const [bw, bh, x, y] of [[w - 0.04, 0.012, 0, y0 + 0.01], [w - 0.04, 0.012, 0, y0 + h - 0.022], [0.012, h - 0.04, -w / 2 + 0.01, y0 + 0.02], [0.012, h - 0.04, w / 2 - 0.022, y0 + 0.02]]) box(bw, bh, 0.02, led, x, y, d / 2 - off + 0.012, g);
  // 벽에 번진 빛: 판보다 큰 둥근 사각형 빛무리(가장자리로 갈수록 사라짐), 판 뒤 벽면에 붙임
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const k = c.getContext('2d'), img = k.createImageData(S, S);
  const pad = o.glowSize ?? 0.42, gw = w + pad * 2, gh = h + pad * 2, ix = w / gw, iy = h / gh;
  for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
    const u = Math.abs((xx + 0.5) / S - 0.5) * 2, v = Math.abs((yy + 0.5) / S - 0.5) * 2;
    const du = Math.max(0, (u - ix) / (1 - ix)), dv = Math.max(0, (v - iy) / (1 - iy)), dd = Math.min(1, Math.hypot(du, dv));
    const top = yy < S / 2 ? 1.15 : 0.9, a = Math.pow(1 - dd, 2.4) * top, i = (yy * S + xx) * 4;
    img.data[i] = 255; img.data[i + 1] = 196; img.data[i + 2] = 128; img.data[i + 3] = Math.min(255, Math.round(a * 255));
  }
  k.putImageData(img, 0, 0);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: o.glow ?? 0.85, toneMapped: false }));   // 흰 벽 위라 더하기 대신 따뜻한 색을 덮어 노란 빛 번짐
  halo.position.set(0, y0 + h / 2, back - 0.004); halo.rotation.y = Math.PI; halo.userData.keep = true; halo.userData.noCollide = true; halo.renderOrder = 3; g.add(halo);
  // TV: 검은 베젤 + 화면(행사 슬라이드)
  const tw = o.tvW || 1.25, th = tw * 9 / 16, ty = o.tvY ?? 1.0;
  box(tw + 0.03, th + 0.03, 0.045, std({ color: 0x111316, roughness: 0.35, metalness: 0.2 }), 0, ty - 0.015, -0.07 - off, g);
  const sc = document.createElement('canvas'); sc.width = 640; sc.height = 360; const q = sc.getContext('2d');
  const gr = q.createLinearGradient(0, 0, 640, 360); gr.addColorStop(0, '#163a4a'); gr.addColorStop(1, '#0d2533'); q.fillStyle = gr; q.fillRect(0, 0, 640, 360);
  q.fillStyle = '#ff6a1a'; q.beginPath(); q.moveTo(560, 360); q.lineTo(640, 280); q.lineTo(640, 360); q.fill();
  q.fillStyle = '#ffffff'; q.font = '700 34px Pretendard, sans-serif'; q.textBaseline = 'top';
  if (o.screenText && o.screenText.length === 1) {   // 문구 한 줄: 화면 가운데 크게(예: ['네오아이즈'])
    q.font = '800 72px Pretendard, sans-serif'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(o.screenText[0], 320, 176);
  } else {
    (o.screenText || ['2024년도', '네오아이즈', '하반기 전략회의']).forEach((t, i) => q.fillText(t, 48, 52 + i * 42));
    if (!o.screenText) { q.font = '500 15px Pretendard, sans-serif'; q.fillStyle = 'rgba(255,255,255,0.8)'; q.fillText('•  일시 : 2024년 7월 22일 09:00', 52, 238); q.fillText('•  장소 : NEOFUL BUSINESS SPACE', 52, 262); }
  }
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(tw, th), new THREE.MeshBasicMaterial({ map: st, toneMapped: false, color: new THREE.Color().setScalar(0.9) }));
  scr.position.set(0, ty + th / 2, -0.094 - off); scr.rotation.y = Math.PI; scr.userData.keep = true; g.add(scr);
}
function tvWall(g, o) {
  if (o.backlit) return tvWallBacklit(g, o);   // backlit:true = 벽에서 띄운 판 + 네 변 뒤 LED 간접조명(서울 입구 사진). 생략하면 기존 그대로
  const w = o.w || 2.5; box(w, 1.95, 0.1, M.white, 0, 0.35, 0, g);
  box(1.25, 0.72, 0.04, M.tv, 0, 1.0, -0.07, g);
  box(w - 0.1, 0.025, 0.03, M.glow, 0, 0.37, -0.07, g); box(w - 0.1, 0.025, 0.03, M.glow, 0, 2.26, -0.07, g);
}
function signStand(g) { box(0.32, 0.5, 0.03, M.black, 0, 0.7, 0, g); box(0.025, 0.7, 0.025, M.metal, 0, 0, 0, g); box(0.28, 0.02, 0.22, M.black, 0, 0, 0, g); }
function bench(g, o) {   // 낮은 패브릭 벤치(둥근 모서리) + 얇은 검정 받침
  const w = o.w || 0.45, h = o.h || 0.42, d = o.d || 1.2, m = matOf(o.color || 'fabricGray');
  box(w - 0.06, 0.04, d - 0.06, M.black, 0, 0, 0, g); rbox(w, h - 0.04, d, 0.05, m, 0, 0.04, 0, g);
}
function stanchion(g) {   // 크롬 차단봉(벨트 릴) — 둥근 받침 + 기둥 + 위 캡/벨트 카세트
  cyl(0.16, 0.17, 0.03, M.metal, 0, 0, 0, 24, g); cyl(0.028, 0.028, 0.9, M.metal, 0, 0.03, 0, 14, g); cyl(0.045, 0.04, 0.1, M.metal, 0, 0.88, 0, 16, g); box(0.012, 0.05, 0.03, M.black, 0.05, 0.9, 0, g);
}
/* ---- 대전 교육장 소품 (앞면 = 로컬 -z) ---- */
function coffeeCabinet(g, o) {   // 흰 낮은 수납장 + 커피머신 · 얼음/전자레인지 · 정수기 (대전 사진: 북서쪽 모서리)
  const w = o.w || 2.0, d = o.d || 0.5, h = o.h || 0.85;
  box(w, 0.08, d - 0.04, M.paint, 0, 0, 0.01, g); box(w, h - 0.08, d, M.white, 0, 0.08, 0, g); box(w + 0.02, 0.03, d + 0.02, M.white, 0, h, 0, g);
  const n = Math.max(2, Math.round(w / 0.5)); for (let i = 1; i < n; i++) box(0.006, h - 0.12, 0.01, plain(0xc9ccd1), -w / 2 + w * i / n, 0.1, -d / 2 - 0.001, g);
  const t = h + 0.03, x0 = -w / 2;
  const cx = o.coffeeAt ?? (x0 + 0.3); box(0.32, 0.5, 0.42, M.black, cx, t, 0, g); box(0.18, 0.1, 0.06, M.metal, cx, t + 0.16, -0.22, g);   // 커피머신
  const ix = o.iceAt ?? (cx + 0.5); box(0.48, 0.3, 0.38, M.white, ix, t, 0.02, g); box(0.34, 0.22, 0.005, M.black, ix - 0.05, t + 0.04, -0.172, g);   // 얼음/전자레인지 유닛
  const wx = o.waterAt ?? (x0 + w - 0.25); box(0.28, 0.48, 0.36, M.white, wx, t, 0.02, g); box(0.18, 0.12, 0.005, plain(0x2b3440), wx, t + 0.3, -0.162, g); box(0.05, 0.03, 0.08, M.metal, wx, t + 0.18, -0.19, g);   // 정수기
}
function standFan(g) {   // 둥근 흰 스탠드 선풍기
  cyl(0.16, 0.18, 0.04, M.white, 0, 0, 0, 24, g); cyl(0.02, 0.02, 0.85, M.white, 0, 0.04, 0, 10, g);
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 10, 32), M.white); r.position.set(0, 1.05, -0.02); g.add(r);
  const c = cyl(0.19, 0.19, 0.06, plain(0xe8eaec), 0, 0, 0, 28, g); c.rotation.x = Math.PI / 2; c.position.set(0, 1.05, 0); cyl(0.06, 0.07, 0.12, M.white, 0, 0.98, 0.08, 14, g);
}
function cafeTable(g, o) {   // 흰 상판 + 오크 엣지 + 검정 철제 다리 테이블(부산 복도 사진)
  const w = o.w || 1.2, d = o.d || 0.7, h = o.h || 0.73, BK = M.rPlastic || plain(0x1a1b1e);
  box(w, 0.025, d, M.white, 0, h - 0.025, 0, g); box(w + 0.004, 0.018, d + 0.004, matOf('oak'), 0, h - 0.043, 0, g);
  for (const sx of [-1, 1]) for (const sz3 of [-1, 1]) box(0.035, h - 0.043, 0.035, BK, sx * (w / 2 - 0.04), 0, sz3 * (d / 2 - 0.04), g);
  for (const sz3 of [-1, 1]) box(w - 0.1, 0.03, 0.02, BK, 0, h - 0.075, sz3 * (d / 2 - 0.04), g); for (const sx of [-1, 1]) box(0.02, 0.03, d - 0.1, BK, sx * (w / 2 - 0.04), h - 0.075, 0, g);
  if (o.sanitizer) { cyl(0.03, 0.03, 0.17, plain(0xdfeaf2), -w / 2 + 0.2, h, 0.05, 12, g); cyl(0.03, 0.03, 0.17, plain(0xdfeaf2), -w / 2 + 0.28, h, 0.1, 12, g); }
  if (o.outlet) {
     box(0.36, 0.008, 0.12, plain(0xd0d4d8), 0, h, 0, g);
     box(0.31, 0.006, 0.075, plain(0x2d3136), 0, h + 0.004, 0, g);
     box(0.31, 0.012, 0.014, plain(0xbec4ca), 0, h + 0.005, -0.025, g);
  }
}
function mobileTv(g, o) {   // 이동형 TV 스탠드(검정) + 약 55형 TV + 아래 선반, 앞 = 로컬 -z
  const BK = plain(0x17181b);
  box(1.24, 0.72, 0.06, M.tv, 0, 0.95, 0, g); box(1.26, 0.74, 0.04, BK, 0, 0.94, 0.03, g);
  for (const sx of [-0.3, 0.3]) box(0.06, 1.55, 0.05, BK, sx, 0.06, 0.07, g);
  box(0.7, 0.02, 0.35, BK, 0, 0.5, 0.05, g); box(0.62, 0.04, 0.06, BK, 0, 0.06, 0.07, g);
  for (const sx of [-1, 1]) { box(0.06, 0.04, 0.5, BK, sx * 0.32, 0.03, 0.02, g); for (const ez of [-1, 1]) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), BK); w.position.set(sx * 0.32, 0.03, 0.02 + ez * 0.23); g.add(w); } }
}
function waterDispenser(g, o) {   // 바닥형 흰 정수기(약 0.35 × 0.45 × 1.35) + 컵 디스펜서, 앞 = 로컬 -z
  const d = 0.45, fz = -d / 2 - 0.005, W = plain(0xf4f4f2);
  box(0.35, 1.35, d, W, 0, 0, 0, g); box(0.3, 0.45, 0.01, plain(0xe6e8ea), 0, 0.78, fz - 0.005, g);
  box(0.26, 0.1, 0.07, plain(0xdfe1e4), 0, 0.92, fz - 0.035, g); box(0.26, 0.03, 0.11, plain(0x4a4d52), 0, 0.7, fz - 0.055, g);
  cyl(0.012, 0.012, 0.05, plain(0xd23b2b), -0.06, 0.87, fz - 0.04, 8, g); cyl(0.012, 0.012, 0.05, plain(0x2b6fd2), 0.06, 0.87, fz - 0.04, 8, g);
  box(0.16, 0.06, 0.005, plain(0x2b3440), 0, 1.18, fz - 0.006, g);
  cyl(0.04, 0.04, 0.32, plain(0xeceff2), 0.12, 1.0, fz - 0.03, 14, g).rotation.z = 0;   // 컵 디스펜서
}
function bin(g, o) { if (o.square) { box(o.w || 0.26, o.h || 0.4, o.w || 0.26, M.black, 0, 0, 0, g); return; } cyl(o.r || 0.15, (o.r || 0.15) * 0.92, o.h || 0.55, o.color ? matOf(o.color) : M.black, 0, 0, 0, 20, g); }   // 검정 휴지통
function ledClock(g, o) {   // 빨간 LED 디지털 시계 (벽걸이)
  const y = o.y || 2.0; box(0.5, 0.2, 0.04, M.black, 0, y, 0, g);
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const k = c.getContext('2d'); k.fillStyle = '#111'; k.fillRect(0, 0, 256, 96);
  k.fillStyle = '#ff2a1a'; k.font = '700 64px monospace'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(o.text || '10:30', 128, 52);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), new THREE.MeshBasicMaterial({ map: tx })); m.position.set(0, y + 0.1, -0.021); m.rotation.y = Math.PI; m.userData.keep = true; g.add(m);
  g.userData.noBlob = true;
}
function coffeeCorner(g, o) {   // 대전 커피 코너(사진 11/19, 책상 0.72m 기준 실제 크기): 그룹 원점 = 벽면, 앞(-z)이 실내. u = 벽을 바라볼 때 왼→오른쪽 거리 → 로컬 x = -u
  const X = (u) => -u, W = plain(0xf4f4f2), BK = plain(0x1c1d20), GR = plain(0x9aa0a6);
  // 흰 2문 수납장 1.2 × 0.5 × 0.9
  { const u = o.cab ?? -0.3, x = X(u), cw = 1.2, h = 0.9, d = 0.5;
    box(cw - 0.02, 0.07, d - 0.05, plain(0xd9d9d6), x, 0, -d / 2 + 0.01, g); box(cw, h - 0.07, d, W, x, 0.07, -d / 2, g); box(cw + 0.02, 0.03, d + 0.02, W, x, h - 0.03, -d / 2, g);
    box(0.006, h - 0.16, 0.01, plain(0xc9ccd1), x, 0.1, -d - 0.002, g);
    for (const s of [-1, 1]) box(0.014, 0.16, 0.022, M.metal, x + s * 0.05, 0.62, -d - 0.013, g);
    const t = h;
    // 종이컵 묶음 0.35m (왼쪽)
    { const cx = X(u - 0.48); cyl(0.045, 0.035, 0.35, W, cx, t, -0.16, 16, g); cyl(0.045, 0.035, 0.3, W, cx, t, -0.28, 16, g); }
    // 캡슐 커피머신 0.38 × 0.55(받침 서랍 0.14 포함)
    { const cx = X(u - 0.2); box(0.38, 0.14, 0.42, BK, cx, t, -0.23, g); box(0.24, 0.005, 0.006, GR, cx, t + 0.07, -0.443, g);
      box(0.34, 0.33, 0.38, BK, cx, t + 0.14, -0.22, g); box(0.32, 0.08, 0.34, plain(0x2a2c30), cx, t + 0.47, -0.22, g);
      box(0.2, 0.05, 0.1, plain(0x3a3d42), cx, t + 0.34, -0.45, g); box(0.15, 0.014, 0.12, M.metal, cx, t + 0.15, -0.37, g); }
    // 검정 제빙기 0.4 × 0.45 × 0.45 (둥근 윗면)
    { const ix = X(u + 0.28), dd = 0.45; box(0.4, 0.39, dd, BK, ix, t, -dd / 2 - 0.01, g);
      const top = cyl(0.2, 0.2, dd, BK, ix, 0, 0, 28, g); top.rotation.x = Math.PI / 2; top.scale.set(1, 1, 0.3); top.position.set(ix, t + 0.39, -dd / 2 - 0.01);
      box(0.26, 0.15, 0.005, plain(0x30343a), ix, t + 0.2, -dd - 0.013, g); box(0.07, 0.022, 0.005, plain(0x5ab0ff), ix, t + 0.33, -dd - 0.013, g); }
  }
  // 바닥형 흰 정수기 0.4 × 0.45 × 1.35, 꼭지 1.0m + 물받이, 위에 비품
  { const x = X(o.water ?? 0.54), d = 0.45, fz = -d - 0.01;
    box(0.4, 1.35, d, W, x, 0, -d / 2 - 0.01, g); box(0.34, 0.5, 0.01, plain(0xe9eaec), x, 0.82, fz - 0.005, g);
    box(0.3, 0.12, 0.07, plain(0xdfe1e4), x, 0.95, fz - 0.035, g);
    cyl(0.014, 0.014, 0.06, plain(0xd23b2b), x - 0.07, 0.9, fz - 0.04, 8, g); cyl(0.014, 0.014, 0.06, plain(0x2b6fd2), x + 0.07, 0.9, fz - 0.04, 8, g);
    box(0.3, 0.03, 0.12, plain(0x4a4d52), x, 0.74, fz - 0.06, g);
    box(0.22, 0.07, 0.005, plain(0x2b3440), x, 1.2, fz - 0.006, g);
    cyl(0.05, 0.05, 0.22, plain(0xf2c230), x - 0.1, 1.35, -0.26, 16, g);       // 노란 컵 홀더
    box(0.14, 0.12, 0.2, plain(0x2f6fd6), x + 0.08, 1.35, -0.2, g);            // 파란 상자
    box(0.12, 0.08, 0.14, W, x + 0.07, 1.47, -0.22, g); box(0.1, 0.14, 0.1, W, x + 0.02, 1.35, -0.38, g);
  }
  // 검정 사각 쓰레기통 0.4(벽 방향) × 0.45(앞뒤) × 0.75 (모서리) + 위 회색 벽 선반
  { const x = X(o.bin ?? 0.98); box(0.4, 0.72, 0.45, BK, x, 0, -0.245, g); box(0.42, 0.04, 0.47, plain(0x2a2b2e), x, 0.71, -0.245, g);
    box(0.42, 0.025, 0.24, GR, x, 1.55, -0.12, g); box(0.025, 0.14, 0.22, GR, x - 0.2, 1.43, -0.12, g); box(0.025, 0.14, 0.22, GR, x + 0.2, 1.43, -0.12, g); }
  // 테 없는 흰(분홍기) LED 숫자 시계 0.9 × 0.25 @2.2m + 왼쪽 빨간 화재 경보함 0.2
  { const x = X(o.clock ?? -0.3), y = o.clockY ?? 2.2;
    const c = document.createElement('canvas'); c.width = 768; c.height = 220; const k = c.getContext('2d');
    k.shadowColor = '#ffd6dc'; k.shadowBlur = 22; k.fillStyle = '#fff2f4'; k.font = '700 200px monospace'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(o.text || '13:39', 384, 116, 740);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.26), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); m.position.set(x, y, -0.012); m.rotation.y = Math.PI; m.userData.keep = true; m.renderOrder = 5; g.add(m);
    const ax = X(o.alarm ?? -1.05), ay = o.alarmY ?? 2.05; box(0.2, 0.26, 0.07, plain(0xd8261c), ax, ay, -0.035, g);
    const bt = cyl(0.045, 0.045, 0.015, plain(0xf2f2f2), 0, 0, 0, 16, g); bt.rotation.x = Math.PI / 2; bt.position.set(ax, ay + 0.15, -0.075); }
  for (const [u, y, wd] of (o.switches || [[-0.62, 1.2, 0.08], [-0.05, 1.12, 0.14], [0.2, 1.12, 0.08]])) { box(wd, 0.12, 0.015, M.white, X(u), y, -0.008, g); box(wd * 0.5, 0.05, 0.004, plain(0xdfe1e4), X(u), y + 0.035, -0.017, g); }   // 스위치 · 콘센트
  g.userData.noBlob = true;
}
function cabinet(g, o) { box(o.w || 1.2, o.h || 0.7, o.d || 0.4, matOf(o.color || 'white'), 0, 0, 0, g); }
function block(g, o) { box(o.w || 0.1, o.h || 0.1, o.d || 0.1, matOf(o.color || 'black'), 0, o.y || 0, 0, g); }   // 단순 박스(소품)
function barCounter(g, o) {
  const w = o.w, d = o.d, h = o.h || 1.02, long = Math.max(w, d), alongX = w >= d;
  box(w, 0.04, d, M.darkTop, 0, h - 0.04, 0, g); box(w + 0.02, 0.045, d + 0.02, M.oak, 0, h - 0.075, 0, g);
  const n = Math.max(1, Math.round(long / 1.4));
  for (let i = 0; i <= n; i++) { const p = -long / 2 + 0.1 + i * (long - 0.2) / n; const sh = (alongX ? d : w) / 2 - 0.06; for (const s of [-1, 1]) box(0.04, h - 0.08, 0.04, M.black, alongX ? p : s * sh, 0, alongX ? s * sh : p, g); }
}
function purifier(g) {   // LG 공기청정기: 흰 원통 모듈 2단 + 사이 회색 띠 + 위 원형 센서 헤드(세운 링)
  cyl(0.16, 0.165, 0.03, plain(0xd8d9db), 0, 0, 0, 28, g);
  cyl(0.16, 0.16, 0.44, M.white, 0, 0.03, 0, 32, g); cyl(0.162, 0.162, 0.025, plain(0xb9bcc0), 0, 0.47, 0, 32, g); cyl(0.16, 0.16, 0.44, M.white, 0, 0.495, 0, 32, g);
  cyl(0.155, 0.16, 0.02, plain(0xcfd2d6), 0, 0.935, 0, 32, g);
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 12, 32), M.white); r.position.set(0, 1.11, 0); g.add(r);
  const dsk = new THREE.Mesh(new THREE.CircleGeometry(0.11, 28), plain(0x2a2d33)); dsk.position.set(0, 1.11, -0.002); dsk.rotation.y = Math.PI; g.add(dsk); const dsk2 = dsk.clone(); dsk2.position.z = 0.002; dsk2.rotation.y = 0; g.add(dsk2);
  cyl(0.03, 0.04, 0.03, M.white, 0, 0.955, 0, 12, g);
}
function mat(g, o) { const m = box(o.w || 2, 0.006, o.d || 1.2, matOf(o.color || 'orange'), 0, 0, 0, g); g.userData.noCollide = true; g.userData.noBlob = true; return m; }
let boothFrostM = null;
function boothFrost() {   // 아래는 뿌옇고 위로 갈수록 맑아지는 문 유리(서울 NEOBOX 사진)
  if (boothFrostM) return boothFrostM;
  const c = document.createElement('canvas'); c.width = 4; c.height = 256; const k = c.getContext('2d'), gr = k.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#5a5a5a'); gr.addColorStop(0.45, '#9a9a9a'); gr.addColorStop(1, '#ffffff'); k.fillStyle = gr; k.fillRect(0, 0, 4, 256);
  boothFrostM = M.frost.clone(); boothFrostM.alphaMap = new THREE.CanvasTexture(c); boothFrostM.opacity = 0.85; return boothFrostM;
}
function glassLabel(txt) {   // 유리에 붙인 이름표: 짙은 회색 글자 + 위아래 가는 줄
  const c = document.createElement('canvas'); c.width = 256; c.height = 76; const k = c.getContext('2d');
  k.fillStyle = 'rgba(70,72,76,0.85)'; k.fillRect(28, 8, 200, 2); k.fillRect(28, 66, 200, 2);
  k.font = '600 30px Pretendard, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(txt, 128, 39);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function booth(g, o) {   // NEOBOX 1인 부스: 앞(문) = 로컬 -z
  const w = o.w || 1.85, d = o.d || 1.7, ph = 2.2, t = 0.07, x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  const bodyM = o.body === 'white' ? M.white : M.black;   // body:'white' = 흰 몸체(앞 문틀만 검정, 서울 사진). 생략하면 기존 그대로
  box(w, 0.06, d, bodyM, 0, 0, 0, g);
  box(t, ph, d, M.white, x0 + t / 2, 0, 0, g); box(t, ph, d, M.white, x1 - t / 2, 0, 0, g); box(w, ph, t, M.white, 0, 0, z1 - t / 2, g);
  for (const xx of [x0 + 0.03, x1 - 0.03]) for (const zz of [z0 + 0.03, z1 - 0.03]) box(0.07, ph + 0.02, 0.07, zz < 0 ? M.black : bodyM, xx, 0, zz, g);
  box(w, 0.04, 0.08, M.black, 0, ph, z0 + 0.03, g); box(w, 0.04, 0.08, bodyM, 0, ph, z1 - 0.03, g);
  box(0.08, 0.04, d, bodyM, x0 + 0.03, ph, 0, g); box(0.08, 0.04, d, bodyM, x1 - 0.03, ph, 0, g);
  box(w, 0.05, d, M.white, 0, ph - 0.05, 0, g);
  const dg = new THREE.Group(); dg.position.set(x0 + 0.14, 0, z0 + 0.02); dg.rotation.y = 0; g.add(dg); dg.userData.noCollide = true; dg.userData.dynamic = true;
  registerDoor([{ g: dg, base: 0, swing: (o.swing || 72) * DEG }], o.open === true, o.label);
  const lw = w - 0.38, leaf = new THREE.Mesh(new THREE.BoxGeometry(lw, 2.08, 0.045), o.body === 'white' ? boothFrost() : M.frost); leaf.position.set(lw / 2, 1.04, 0); dg.add(leaf);
  box(lw, 0.04, 0.055, M.black, lw / 2, 2.06, 0, dg); box(lw, 0.04, 0.055, M.black, lw / 2, 0, 0, dg);
  box(0.04, 2.1, 0.055, M.black, 0.02, 0, 0, dg); box(0.04, 2.1, 0.055, M.black, lw - 0.02, 0, 0, dg);
  box(0.22, ph, 0.05, M.black, x1 - 0.13, 0, z0 + 0.02, g); box(0.04, ph - 0.1, 0.05, M.black, x0 + 0.12, 0.04, z0 + 0.02, g); box(w, ph - 2.1, 0.05, M.black, 0, 2.1, z0 + 0.02, g);
  if (o.label && o.body === 'white') {   // 서울 사진: 이름은 문 유리 위쪽에 작게(위아래 가는 줄)
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.1), new THREE.MeshBasicMaterial({ map: glassLabel(o.label), transparent: true, depthWrite: false }));
    lab.position.set(lw / 2, 1.62, -0.024); lab.rotation.y = Math.PI; lab.userData.keep = true; dg.add(lab);
  } else if (o.label) { const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.17), new THREE.MeshBasicMaterial({ map: textTexture(o.label) })); lab.position.set(0, 2.15, z0 - 0.01); lab.rotation.y = Math.PI; lab.userData.keep = true; g.add(lab); }
  // 내부: 회색 패브릭 흡음 벽 + 어두운 카펫
  const fab = matOf('fabricGray'), carpet = plain(0x3b3e44);
  box(w - 0.16, 0.012, d - 0.12, carpet, 0, 0.06, 0, g);
  box(0.02, ph - 0.12, d - 0.14, fab, x0 + t + 0.01, 0.06, 0, g); box(0.02, ph - 0.12, d - 0.14, fab, x1 - t - 0.01, 0.06, 0, g);
  box(w - 0.16, ph - 0.12, 0.02, fab, 0, 0.06, z1 - t - 0.01, g);
  // 책상: 문에서 봤을 때 왼쪽 벽(로컬 +x)을 따라 긴 흰 상판, 문 쪽 끝은 둥글게
  const dw = Math.min(0.6, w * 0.4), dl = d - 0.5,   /* 좁은 부스(약 1.27m)는 책상 폭을 줄임 */ dcx = x1 - t - dw / 2 - 0.02, dcz = (z1 - t) - dl / 2 - 0.02;
  box(dw, 0.03, dl - dw / 2, M.white, dcx, 0.72, dcz + dw / 4, g);
  const cap = cyl(dw / 2, dw / 2, 0.03, M.white, dcx, 0.72, dcz - dl / 2 + dw / 2, 24, g);
  box(0.03, 0.72, 0.45, M.white, x1 - t - 0.05, 0, dcz + dl / 2 - 0.3, g);
  // 오크 모니터 선반 + 모니터 + 키보드·마우스
  const sw = 0.24, scx = x1 - t - sw / 2 - 0.03;
  box(sw, 0.03, dl - 0.15, M.oak, scx, 0.86, dcz + 0.05, g);
  box(0.03, 0.11, 0.03, M.black, scx, 0.75, dcz - dl / 2 + 0.35, g); box(0.03, 0.11, 0.03, M.black, scx, 0.75, dcz + dl / 2 - 0.15, g);
  const mon = Math.min(0.58, dl - 0.12), mz = dcz + Math.min(0.25, (dl - mon) / 2 - 0.02);
  box(0.2, 0.012, 0.22, M.black, scx, 0.89, mz, g); box(0.03, 0.12, 0.03, M.black, scx + 0.03, 0.9, mz, g);
  box(0.03, mon * 0.59, mon, M.tv, scx - 0.02, 1.0, mz, g);
  const kx = x1 - t - dw * 0.7; box(0.15, 0.02, Math.min(0.44, dl - 0.2), M.black, kx, 0.75, dcz + 0.05, g); box(0.07, 0.025, 0.05, M.black, kx, 0.75, dcz - Math.min(0.28, dl / 2 - 0.1), g);
  // 링라이트 스탠드 (문 쪽 모서리)
  const rlx = x1 - t - 0.12, rlz = z0 + 0.22;
  cyl(0.012, 0.012, 1.5, M.black, rlx, 0, rlz, 8, g);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 10, 28), M.white); ring.position.set(rlx - 0.04, 1.62, rlz); ring.rotation.y = Math.PI / 2; g.add(ring);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const l = box(0.2, 0.015, 0.02, M.black, rlx + Math.cos(a) * 0.08, 0.06, rlz + Math.sin(a) * 0.08, g); l.rotation.y = -a; }
  // 의자: 흰 프레임 + 베이지 시트 + 연회색 메쉬 등받이, 책상(+x)을 바라봄
  meshChair(grp(Math.max(x0 + t + 0.28, x1 - t - 0.95), dcz - 0.05, -90, g));
}
function labelPlate(g, txt, sub, bg, fg, x, y, z) {   // 수납장 문 라벨(앞면 = 로컬 -z)
  const c = document.createElement('canvas'); c.width = 200; c.height = 120; const k = c.getContext('2d');
  k.fillStyle = '#fff'; k.fillRect(0, 0, 200, 120); k.fillStyle = bg; k.fillRect(10, 14, 180, 92);
  k.fillStyle = fg; k.textAlign = 'center'; k.textBaseline = 'middle'; k.font = '800 34px Pretendard, sans-serif'; k.fillText(txt, 100, sub ? 48 : 60);
  if (sub) { k.font = '700 20px Pretendard, sans-serif'; k.fillText(sub, 100, 84); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.09), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x, y, z); m.rotation.y = Math.PI; g.add(m);
}
const APPLIANCES = new Map();
function paperCup(parent, x, y, z) {
  const cup = new THREE.Group(); cup.position.set(x,y,z); parent.add(cup); cup.visible = false; cup.userData.dynamic = true; cup.userData.noCollide = true;
  const paper = std({color:0xfff9e9,roughness:0.85,side:THREE.DoubleSide});
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.044,0.031,0.12,28,1,true),paper); body.position.y=0.06;cup.add(body);
  cyl(0.031,0.031,0.004,paper,0,0,0,28,cup);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.044,0.0025,8,28),paper);rim.rotation.x=Math.PI/2;rim.position.y=0.12;cup.add(rim);
  return cup;
}
function appliancePart(parent, parts, x, y, z) {
  const pivot=new THREE.Group();pivot.position.set(x,y,z);pivot.userData.dynamic=true;pivot.userData.noCollide=true;parent.add(pivot);
  for(const p of parts){parent.remove(p);p.position.sub(pivot.position);pivot.add(p);}return pivot;
}
function photoPantry(g, o) {
  // Reference photo: viewed facing south, image-left is local +x.
  const w = o.w || 3.9, top = 0.91, black = plain(0x17191b), charcoal = plain(0x343638), silver = plain(0x9d9f9c), glass = std({color:0x171b20,roughness:0.18,metalness:0.22});
  const front = (ww, hh, mat, x, y, z) => box(ww, hh, 0.008, mat, x, y, z, g);
  const decal = (ww, hh, x, y, z, draw) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; draw(c.getContext('2d'), c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(ww, hh), new THREE.MeshBasicMaterial({map:t})); p.rotation.y = Math.PI; p.position.set(x, y + hh / 2, z); g.add(p);
  };
  box(w, 0.1, 0.56, M.paint, 0, 0, 0.02, g);
  // Hollow under the sink: no solid countertop or cabinet crosses the basin.
  box(w,0.52,0.6,M.white,0,0.1,0,g);
  box(w,0.26,0.025,M.white,0,0.62,-0.2875,g);box(w,0.26,0.025,M.white,0,0.62,0.2875,g);
  for(const [a,b] of [[-w/2-0.01,-1.06],[-0.5,w/2+0.01]]) box(b-a,0.03,0.63,M.white,(a+b)/2,0.88,-0.015,g);
  box(0.56,0.03,0.135,M.white,-0.78,0.88,-0.2625,g);box(0.56,0.03,0.175,M.white,-0.78,0.88,0.2125,g);
  for (let i=1;i<6;i++) front(0.006,0.75,plain(0xb9b9b5),-w/2+i*w/6,0.11,-0.304);
  ['TRASH','PLASTIC','CAN / GLASS'].forEach((text,i)=>decal(0.26,0.14,w/2-(i+0.5)*w/6,0.55,-0.311,(k,W,H)=>{
    k.fillStyle='#eeece7';k.fillRect(0,0,W,H);k.strokeStyle='#aaa8a1';k.lineWidth=6;k.strokeRect(8,8,W-16,H-16);k.fillStyle='#777872';k.textAlign='center';k.font='40px sans-serif';k.fillText(text,W/2,H*0.76);k.strokeRect(W/2-28,45,56,90);for(let j=-1;j<=1;j++)k.fillRect(W/2+j*16-2,56,4,67);
  }));
  box(w,0.83,0.02,plain(0xe2e0da),0,top,0.29,g);
  box(w,0.8,0.36,M.white,0,1.74,0.12,g);
  for(let i=1;i<6;i++) front(0.006,0.79,plain(0xb9b9b5),-w/2+i*w/6,1.745,-0.063);
  // Microwave: broad black door, silver right-hand keypad (image-right = -x).
  const mx=1.46;
  box(0.78,0.025,0.43,black,mx,top,-0.015,g);box(0.78,0.025,0.43,black,mx,top+0.335,-0.015,g);
  for(const x of [mx-0.38,mx+0.38])box(0.02,0.31,0.43,black,x,top+0.025,-0.015,g);
  box(0.74,0.31,0.015,silver,mx,top+0.025,0.19,g);
  box(0.6,0.012,0.38,silver,mx+0.055,top+0.025,-0.015,g);
  cyl(0.145,0.145,0.008,plain(0xd1d5d4),mx+0.055,top+0.039,-0.02,32,g);
  front(0.13,0.33,M.white,mx-0.315,top+0.015,-0.234);
  const microwaveDoorParts=[];
  microwaveDoorParts.push(front(0.62,0.31,black,mx+0.06,top+0.025,-0.24));
  microwaveDoorParts.push(front(0.43,0.22,glass,mx+0.055,top+0.07,-0.246));
  microwaveDoorParts.push(box(0.025,0.22,0.035,M.metal,mx-0.20,top+0.07,-0.265,g));
  front(0.065,0.035,black,mx-0.326,top+0.255,-0.246);
  for(let row=0;row<5;row++)for(let col=0;col<2;col++)front(0.018,0.012,silver,mx-0.343+col*0.035,top+0.06+row*0.035,-0.246);
  decal(0.1,0.07,mx+0.29,top+0.24,-0.247,(k,W,H)=>{k.fillStyle='#282b2b';k.fillRect(0,0,W,H);k.fillStyle='#c6aa60';k.beginPath();k.arc(W/2,H/2,H*.4,0,7);k.fill();});
  // Move the badge with the microwave door too.
  microwaveDoorParts.push(g.children[g.children.length-1]);
  const microwavePivot=appliancePart(g,microwaveDoorParts,mx+0.37,top,-0.24);
  microwavePivot.userData.equipmentId='microwave';
  APPLIANCES.set('microwave',{kind:'door',pivot:microwavePivot,axis:'y',angle:-1.65,cur:0,target:0,state:'closed'});
  // Coffee machine: drawer base, recessed dispensing bay, twin spouts and bean hopper.
  const cx=0.75; rbox(0.48,0.16,0.48,0.015,black,cx,top,-0.01,g);
  front(0.4,0.11,charcoal,cx,top+0.025,-0.254);front(0.19,0.017,silver,cx,top+0.05,-0.261);
  rbox(0.43,0.43,0.39,0.025,charcoal,cx,top+0.16,0.025,g);
  front(0.36,0.37,black,cx,top+0.19,-0.177);
  for(const side of [-1,1])box(0.065,0.25,0.065,silver,cx+side*0.16,top+0.19,-0.185,g);
  front(0.22,0.19,glass,cx,top+0.205,-0.19);
  box(0.3,0.025,0.16,black,cx,top+0.17,-0.17,g);
  for(let j=-5;j<=5;j++)box(0.012,0.003,0.12,M.metal,cx+j*0.023,top+0.197,-0.17,g);
  box(0.19,0.045,0.065,M.metal,cx,top+0.39,-0.211,g);
  for(const xx of [-0.045,0.045])cyl(0.012,0.012,0.035,M.metal,cx+xx,top+0.355,-0.229,10,g);
  decal(0.13,0.075,cx,top+0.455,-0.183,(k,W,H)=>{k.fillStyle='#192c4d';k.fillRect(0,0,W,H);k.fillStyle='#609bd4';k.fillRect(12,12,W-24,H-24);k.fillStyle='#eee';k.font='52px sans-serif';k.fillText('COFFEE',35,150);});
  box(0.25,0.09,0.2,std({color:0x574b3e,transparent:true,opacity:0.8,roughness:0.25}),cx,top+0.59,0.05,g);box(0.28,0.012,0.22,black,cx,top+0.68,0.05,g);
  decal(0.37,0.07,cx,top+0.57,-0.21,(k,W,H)=>{k.fillStyle='#17265d';k.fillRect(0,0,W,H);k.fillStyle='#fff';k.font='120px sans-serif';k.fillText('bliss',35,175);});
  const coffeeCup=paperCup(g,cx,top+0.201,-0.255);
  APPLIANCES.set('coffee',{kind:'cup',cup:coffeeCup,state:'empty'});
  // Ice maker: countertop body with top smoked lid that flips upward from the rear hinge.
  const ix=0.24;
  box(0.40,0.34,0.42,charcoal,ix,top,0,g);
  box(0.36,0.025,0.38,M.white,ix,top+0.335,0,g);
  box(0.32,0.08,0.32,plain(0xe8ecee),ix,top+0.27,0,g);
  const iceMaterial=std({color:0xc4e6ee,roughness:0.2,metalness:0.05,transparent:true,opacity:0.85});
  for(let i=0;i<18;i++){const ice=box(0.048,0.038,0.045,iceMaterial,ix-0.11+(i%6)*0.044,top+0.315+Math.floor(i/12)*0.025,-0.10+Math.floor((i%12)/6)*0.09,g);ice.rotation.set((i%3)*0.18,(i%5)*0.4,(i%4)*0.12);}
  const iceLidFrame=rbox(0.38,0.025,0.38,0.008,black,ix,top+0.36,-0.01,g);
  const iceLidGlass=box(0.31,0.012,0.28,std({color:0x1b2026,roughness:0.15,metalness:0.2,transparent:true,opacity:0.72}),ix,top+0.372,-0.02,g);
  const iceLidTab=box(0.08,0.016,0.025,black,ix,top+0.365,-0.205,g);
  const icePivot=appliancePart(g,[iceLidFrame,iceLidGlass,iceLidTab],ix,top+0.365,0.18);
  icePivot.userData.equipmentId='ice';
  APPLIANCES.set('ice',{kind:'door',pivot:icePivot,axis:'x',angle:1.35,cur:0,target:0,state:'closed'});
  // Cup stacks and slim dispensers between ice maker and sink.
  for(const xx of [-0.09,-0.23]){
    cyl(0.045,0.035,0.22,M.white,xx,top,-0.015,20,g);
    for(let y=0.04;y<0.23;y+=0.018)cyl(0.046,0.046,0.006,plain(0xe1ded3),xx,top+y,-0.015,20,g);
    box(0.012,0.24,0.012,M.metal,xx+0.055,top,0.025,g);
  }
  box(0.1,0.31,0.1,plain(0xe7e4dd),-0.4,top,0.11,g);
  cyl(0.055,0.045,0.1,M.metal,-0.16,top,-0.2,20,g);box(0.14,0.025,0.09,plain(0xf4efd0),-0.37,top,-0.21,g);
  // Sink, short mixer tap, and separate tall square purifier spout to its image-left.
  const sx=-0.78;
  // Actual recessed bowl: thin rim, four inside walls, bottom and drain 19 cm below the counter.
  const basin=std({color:0x7b8588,roughness:0.35,metalness:0.7});
  for(const x of [sx-0.30,sx+0.30])box(0.04,0.012,0.4,M.metal,x,top,-0.035,g);
  for(const z of [-0.215,0.145])box(0.56,0.012,0.04,M.metal,sx,top,z,g);
  for(const x of [sx-0.277,sx+0.277])box(0.006,0.19,0.32,basin,x,top-0.19,-0.035,g);
  for(const z of [-0.192,0.122])box(0.56,0.19,0.006,basin,sx,top-0.19,z,g);
  box(0.56,0.008,0.32,basin,sx,top-0.198,-0.035,g);
  cyl(0.037,0.037,0.004,M.metal,sx,top-0.189,-0.035,24,g);
  for(let i=0;i<6;i++)cyl(0.003,0.003,0.004,black,sx+Math.cos(i)*0.023,top-0.185,-0.035+Math.sin(i)*0.023,8,g);
  const fx=sx-0.07;cyl(0.03,0.034,0.13,M.metal,fx,top,0.18,18,g);
  box(0.065,0.035,0.15,M.metal,fx,top+0.09,0.115,g);box(0.02,0.015,0.1,M.metal,fx,top+0.16,0.15,g);
  const px=sx+0.34;
  box(0.035,0.31,0.04,M.metal,px,top,0.13,g);
  box(0.21,0.04,0.055,M.metal,px-0.087,top+0.29,0.13,g);
  box(0.032,0.04,0.035,M.metal,px-0.175,top+0.255,0.12,g);
  front(0.04,0.016,black,px-0.11,top+0.3,0.099);
  const waterCup=paperCup(g,px-0.175,top+0.014,0.12);
  const waterMat=std({color:0x80cee9,transparent:true,opacity:0.65,roughness:0.12});
  const fill=cyl(0.039,0.03,0.1,waterMat,0,0.005,0,28,waterCup);fill.scale.y=0.01;
  const stream=cyl(0.004,0.004,0.135,waterMat,px-0.175,top+0.12,0.12,10,g);stream.visible=false;stream.userData.dynamic=true;stream.userData.noCollide=true;
  APPLIANCES.set('water',{kind:'water',cup:waterCup,fill,stream,elapsed:0,state:'empty'});
  decal(0.34,0.19,-0.59,1.38,0.273,(k,W,H)=>{k.fillStyle='#dddcd7';k.fillRect(0,0,W,H);k.strokeStyle='#8c8b84';k.lineWidth=4;k.strokeRect(5,5,W-10,H-10);k.fillStyle='#77776f';for(let y=35;y<220;y+=26)k.fillRect(80,y,350-(y%3)*45,5);k.fillRect(20,25,30,190);});
}
function pantry(g, o) {   // 탕비 카운터(사진 IMG_0386): 뒤(벽) = 로컬 +z. 동쪽(+x) 끝부터 전자레인지 → 커피머신 → 얼음통 → 싱크(서쪽, 가벽 쪽)
  if (o.style === 'photoSeoul') { photoPantry(g, o); return; }
  const w = o.w || 3, x0 = -w / 2, x1 = w / 2, n = o.doors || Math.round(w / 0.5), dw = w / n;
  box(w, 0.1, 0.56, M.paint, 0, 0, 0.02, g);                                       // 걸레받이
  box(w, 0.78, 0.6, M.white, 0, 0.1, 0, g); box(w + 0.02, 0.03, 0.63, M.marble, 0, 0.88, -0.015, g);   // 하부장 + 상판
  for (let i = 1; i < n; i++) box(0.006, 0.74, 0.01, plain(0xc9ccd1), x0 + i * dw, 0.12, -0.301, g);       // 문 틈
  for (let i = 0; i < n; i++) box(0.012, 0.012, 0.01, plain(0xc9ccd1), x0 + (i + 0.5) * dw, 0.84, -0.302, g);
  const L = [['일반쓰레기', 'WASTED', '#111', '#fff'], ['플라스틱', 'PLASTIC', '#2b5fa8', '#fff'], ['캔/병', '', '#f2c230', '#111']];
  L.forEach(([t, s2, bg, fg], i) => labelPlate(g, t, s2, bg, fg, x1 - (i + 0.5) * dw, 0.62, -0.306));       // 동쪽 끝부터 3개 문 라벨
  box(w, 0.55, 0.02, M.white, 0, 0.91, 0.29, g);                                   // 백스플래시
  box(w, 0.8, 0.36, M.white, 0, 1.46, 0.12, g);                                    // 상부장
  for (let i = 1; i < n; i++) box(0.006, 0.76, 0.01, plain(0xc9ccd1), x0 + i * dw, 1.48, -0.061, g);
  box(w, 0.02, 0.37, plain(0xe8e8e8), 0, 1.44, 0.12, g);
  const top = 0.91;
  // 전자레인지 (흰 몸체 + 검은 유리문)
  const mx = x1 - 0.38; box(0.5, 0.3, 0.38, M.white, mx, top, 0.02, g); box(0.36, 0.24, 0.005, M.black, mx - 0.05, top + 0.03, -0.172, g); box(0.08, 0.24, 0.005, plain(0x30343a), mx + 0.19, top + 0.03, -0.172, g);
  // 커피머신 (검정, 원두 호퍼 + 파란 bliss 사인)
  const cx = mx - 0.5; box(0.35, 0.55, 0.45, M.black, cx, top, 0.0, g); box(0.2, 0.12, 0.08, M.metal, cx, top + 0.18, -0.24, g);
  cyl(0.08, 0.06, 0.16, M.glass, cx - 0.06, top + 0.55, 0.05, 14, g);
  { const c = document.createElement('canvas'); c.width = 160; c.height = 48; const k = c.getContext('2d'); k.fillStyle = '#1e4fa3'; k.fillRect(0, 0, 160, 48); k.fillStyle = '#fff'; k.font = '700 30px sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('bliss', 80, 26);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; box(0.22, 0.07, 0.04, plain(0x1e4fa3), cx + 0.05, top + 0.55, -0.1, g);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.066), new THREE.MeshBasicMaterial({ map: t })); m.position.set(cx + 0.05, top + 0.585, -0.121); m.rotation.y = Math.PI; g.add(m); }
  // 얼음 디스펜서 (검정 박스)
  const ix = cx - 0.42; box(0.35, 0.45, 0.45, M.black, ix, top, 0.0, g); box(0.25, 0.14, 0.006, plain(0x2a2d33), ix, top + 0.22, -0.226, g);
  // 싱크 + 정수기(개수대): 가늘고 높은 크롬 수전 + 옆에 작은 정수 꼭지 + 벽(백스플래시)의 작은 흰 정수기 본체
  const sx = x0 + 0.42; box(0.5, 0.012, 0.38, M.metal, sx, top, -0.03, g);
  { const fx = sx - 0.06; cyl(0.024, 0.024, 0.02, M.metal, fx, top + 0.012, 0.19, 12, g); cyl(0.012, 0.012, 0.42, M.metal, fx, top, 0.19, 10, g);   // 높은 수전 기둥
    box(0.022, 0.022, 0.18, M.metal, fx, top + 0.41, 0.11, g); cyl(0.01, 0.01, 0.07, M.metal, fx, top + 0.345, 0.03, 8, g);                        // 거위목 + 토출구
    box(0.012, 0.012, 0.07, M.metal, fx + 0.025, top + 0.2, 0.19, g); }                                                                             // 레버
  { const px = sx + 0.14; cyl(0.016, 0.016, 0.015, M.metal, px, top + 0.012, 0.2, 10, g); cyl(0.008, 0.008, 0.25, M.metal, px, top, 0.2, 8, g);      // 정수 꼭지
    box(0.016, 0.016, 0.09, M.metal, px, top + 0.24, 0.16, g); cyl(0.007, 0.007, 0.035, M.metal, px, top + 0.21, 0.118, 8, g); box(0.02, 0.025, 0.02, M.white, px, top + 0.255, 0.2, g);
    box(0.14, 0.19, 0.02, plain(0xb9bec6), px, top + 0.265, 0.27, g); box(0.13, 0.18, 0.03, plain(0xfafafa), px, top + 0.27, 0.262, g); box(0.02, 0.008, 0.004, plain(0x2b8cff), px, top + 0.39, 0.246, g); }               // 벽 정수기 본체 + LED
}
function zzPlant(g, o) {   // 흰 원통 화분 + 키 큰 ZZ 플랜트
  const s = o.scale || 1; cyl(0.17 * s, 0.15 * s, 0.45 * s, M.white, 0, 0, 0, 20, g);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + 0.3, tilt = 0.25 + (i % 3) * 0.12, hgt = (0.7 + (i % 4) * 0.12) * s;
    const st = new THREE.Group(); st.position.set(0, 0.42 * s, 0); st.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); g.add(st);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, hgt, 6), M.leaf2); stem.position.y = hgt / 2; st.add(stem);
    for (let j = 0; j < 6; j++) { const lf = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 8, 6), j % 2 ? M.leaf : M.leaf2); lf.scale.set(1, 0.25, 0.55); lf.position.set((j % 2 ? 1 : -1) * 0.04, hgt * (0.35 + j * 0.11), 0); lf.rotation.z = (j % 2 ? -1 : 1) * 0.5; st.add(lf); }
  }
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
const BUILDERS = { avCabinet, stage, podium, block, chair, stool, armchair, cube, roundTable, plant, desk, deskPair, tableSet, whiteboard, screen, ceilingScreen, speaker, island, clock: wallClock, exitSign, heater, tvStand, tvWall, signStand, bench, cabinet, barCounter, purifier, stanchion, mat, booth, pantry, zzPlant, coffeeCabinet, coffeeCorner, standFan, bin, ledClock, shellChair, nestChair, trainingTable, cafeTable, mobileTv, waterDispenser, goldSign, plainDoor, stairsDoor, fireCabinet, tactile, hangSign, pictoPlate, okSlats, wallPlate, extinguisher, elevator, restroom };
const NOBLOB = new Set(['clock', 'exitSign', 'stage', 'whiteboard', 'screen', 'ceilingScreen', 'tvWall', 'mat', 'slats', 'booth']);
const blobs = [];
function place(o, parent = root) {
  if (o.type === 'array') {
    let k = 0;
    for (const z of o.zs) for (const x of o.xs) { const it = Object.assign({}, o.item, { x, z }); if (o.colors) it.color = o.colors[k % o.colors.length]; if (o.rot != null && it.rot == null) it.rot = o.rot; place(it, parent); k++; }
    return;
  }
  if (o.type === 'slats') { slats(o); return; }
  const fn = BUILDERS[o.type]; if (!fn) { console.warn('알 수 없는 가구 type:', o.type, o); return; }
  const g = grp(o.x, o.z, o.rot || 0, parent); if (o.elev) g.position.y = o.elev; fn(g, o);
  if (parent === root && !NOBLOB.has(o.type) && !g.userData.noBlob) blobs.push(g);
}
/* ---------------- 바닥 동선 표시 (layout.js 의 route: 초록 점선 + 화살표) ---------------- */
for (const rt of (L.routes || (L.route ? [L.route] : []))) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(rt.color || '#2fa84f'), transparent: true, opacity: rt.opacity ?? 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
  const dash = rt.dash || 0.32, gap = rt.gap || 0.2, wdt = rt.width || 0.07, pts = rt.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
    for (let d = 0; d < len - 0.05; d += dash + gap) {
      const l = Math.min(dash, len - d), t = (d + l / 2) / len;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(wdt, l), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = ang; m.position.set(x0 + (x1 - x0) * t, 0.006, z0 + (z1 - z0) * t); m.userData.keep = true; root.add(m);
    }
    const sh = new THREE.Shape(); sh.moveTo(-0.16, 0); sh.lineTo(0, 0.2); sh.lineTo(0.16, 0); sh.lineTo(0.16, -0.06); sh.lineTo(0, 0.12); sh.lineTo(-0.16, -0.06); sh.closePath();
    for (let d = 0.8; d < len - 0.3; d += rt.arrowEvery || 1.6) {
      const t = d / len, m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI + ang;
      m.position.set(x0 + (x1 - x0) * t, 0.007, z0 + (z1 - z0) * t); m.userData.keep = true; root.add(m);
    }
  }
}
/* ---------------- 바깥 복도 + 입구 포털 (layout.js 의 corridor) ---------------- */
for (const r of (L.outside || [])) {   // 건물 밖 바닥(입구 앞): 하늘 아래 회색 보도블록
  const w = r[2] - r[0], d = r[3] - r[1], cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2; box(w, 0.02, d, plain(0xb9b6ae), cx, -0.02, cz).userData.floor = true; box(w, 0.3, d, M.cap, cx, -0.32, cz);
  if (L.outsideWalls) {   // 엘리베이터 로비처럼 실내인 바깥 공간: 천장 + 바깥 3면 벽(건물 쪽 면은 건물 벽)
    const wm = plain(0xe4e1da), side = r[0] < 0 ? 'w' : r[2] > W ? 'e' : '';
    box(w, 0.04, d, M.ceiling, cx, H, cz);
    if (side === 'w') { box(0.16, H, d + 0.32, wm, r[0] - 0.08, 0, cz); }
    else if (side === 'e') { box(0.16, H, d + 0.32, wm, r[2] + 0.08, 0, cz); }
    box(w, H, 0.16, wm, cx, 0, r[1] - 0.08); box(w, H, 0.16, wm, cx, 0, r[3] + 0.08);
  }
}
for (const r of ((L.public && L.public.floors) || [])) {   // 공용 복도 바닥(테라조) + 천장
  const w = r[2] - r[0], d = r[3] - r[1], cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2;
  box(w, 0.02, d, M.terrazzo, cx, -0.02, cz).userData.floor = true; box(w, 0.3, d, M.cap, cx, -0.32, cz); box(w, 0.04, d, plain(0xf6f6f4), cx, H, cz);
}
for (const r of ((L.public && L.public.units) || [])) {   // 유리 너머 다른 호실(출입 불가): 바닥 + 천장 + 안쪽 벽
  const w = r[2] - r[0], d = r[3] - r[1], cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2;
  box(w, 0.02, d, plain(0xcfcdc8), cx, -0.02, cz); box(w, 0.04, d, plain(0xf4f4f2), cx, H, cz);
  const open = r[4] || 'e', uw = M.pubWall || M.paint;   // r[4] = 유리(복도) 쪽 면: 'e'|'w'|'n'|'s' — 그 면은 막지 않음
  if (open !== 'w') box(0.12, H, d, uw, r[0] - 0.06, 0, cz); if (open !== 'e') box(0.12, H, d, uw, r[2] + 0.06, 0, cz);
  if (open !== 'n') box(w, H, 0.12, uw, cx, 0, r[1] - 0.06); if (open !== 's') box(w, H, 0.12, uw, cx, 0, r[3] + 0.06);
  if (open === 'e') for (let z = r[1] + 1.5; z < r[3] - 0.5; z += 3) box(0.04, 0.9, 2.6, plain(0xffffff), r[0] + 0.03, 0.8, z);   // 안쪽 벽 흰 판(빈 사무실 느낌)
  if (open === 's') for (let x = r[0] + 1.5; x < r[2] - 0.5; x += 3) box(2.6, 0.9, 0.04, plain(0xffffff), x, 0.8, r[1] + 0.03);
}
if (L.corridor) {
  const cr = L.corridor.rect, cw = cr[2] - cr[0], cd = cr[3] - cr[1], ccx = (cr[0] + cr[2]) / 2, ccz = (cr[1] + cr[3]) / 2;
  if (L.corridor.shell !== false) {
  box(cw, 0.02, cd, plain(0xc9c6bf), ccx, -0.02, ccz).userData.floor = true; box(cw + 0.1, 0.3, cd, M.cap, ccx, -0.32, ccz);
  box(cw, 0.04, cd, M.ceiling, ccx, H, ccz);
  box(cw + 0.24, H, 0.16, plain(0xe9e6df), ccx, 0, cr[3] + 0.08);                          // 복도 맞은편 벽
  box(0.16, H, cd, plain(0xe9e6df), cr[0] - 0.08, 0, ccz); box(0.16, H, cd, plain(0xe9e6df), cr[2] + 0.08, 0, ccz);   // 복도 양 끝 벽
  }
  for (let x = cr[0] + 1; x < cr[2] - 0.5 && L.corridor.shell !== false; x += 2) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.position.set(x, H - 0.02, ccz); m.userData.keep = true; root.add(m); }
  const P = L.corridor.portal;
  if (P) {   // 입구 바깥 면: 세이지 그린 포털 프레임 + 위 간판 "Neoful business space" + 210호 + 카드리더 + 경광등
    const sage = plain(new THREE.Color(P.color || '#9BA59A').getHex()), zf = cr[1], x0 = P.x0, x1 = P.x1, top = P.top ?? 2.12;
    box(0.2, H, 0.08, sage, x0 + 0.1, 0, zf + 0.04); box(0.2, H, 0.08, sage, x1 - 0.1, 0, zf + 0.04);   // 좌우 기둥
    box(x1 - x0, H - top, 0.1, sage, (x0 + x1) / 2, top, zf + 0.05);                                    // 위 간판 판
    { const c = document.createElement('canvas'); c.width = 1536; c.height = 256; const k = c.getContext('2d');
      k.fillStyle = '#111'; k.font = 'italic 900 128px Pretendard, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(P.text || 'Neoful business space', 750, 136, 1400);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      const hh = (H - top) * 0.7, ww = Math.min(x1 - x0 - 0.3, hh * 6);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, ww / 6), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.position.set((x0 + x1) / 2, top + (H - top) / 2, zf + 0.102); m.userData.keep = true; m.renderOrder = 10; root.add(m); }
    if (P.room) { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const k = c.getContext('2d'); k.fillStyle = '#111'; k.font = '800 64px Pretendard, sans-serif'; k.textBaseline = 'middle'; k.fillText(P.room, 10, 50);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.09), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.position.set(P.door[0] + 0.15, top + 0.08, zf + 0.102); m.userData.keep = true; m.renderOrder = 10; root.add(m); }
    box(0.07, 0.11, 0.025, M.black, x1 - 0.1, 1.15, zf + 0.09); box(0.04, 0.02, 0.005, plain(0x2b8cff), x1 - 0.1, 1.23, zf + 0.104);   // 카드 리더
    cyl(0.04, 0.045, 0.07, std({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 0.8 }), x1 - 0.1, top + 0.33, zf + 0.14, 16);   // 경광등
    box(0.08, 0.03, 0.06, M.black, x1 - 0.1, top + 0.3, zf + 0.12);
  }
}
for (const f of L.furniture) place(f);
for (const sp of (L.speakers || [])) place(Object.assign({ type: 'speaker' }, sp));
/* 교육장 책상 배치: 배치마다 따로 그룹을 만들고 하나만 보이게(충돌도 보이는 배치만) */
const DESK_LAYOUTS = (L.deskLayouts && L.deskLayouts.list) || [];
const deskGroups = DESK_LAYOUTS.map((dl) => { const lg = new THREE.Group(); lg.userData.dynamic = true; lg.userData.noCollide = true; root.add(lg); for (const it of dl.items) place(it, lg); return lg; });
let deskIdx = Math.min(DESK_LAYOUTS.length - 1, Math.max(0, (L.deskLayouts && L.deskLayouts.start) || 0));
{ const q = new URLSearchParams(location.search).get('desks'); if (q) { const i = DESK_LAYOUTS.findIndex((d) => d.id === q); if (i >= 0) deskIdx = i; } }
deskGroups.forEach((g, i) => { g.visible = i === deskIdx; });

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
const DESK_COLL = deskGroups.map((lg) => {
  root.updateMatrixWorld(true); const out = [], bb = new THREE.Box3();
  lg.traverse((o) => { if (!o.isMesh) return; bb.setFromObject(o); if (bb.max.y > 0.12 && bb.min.y < 1.75) out.push([bb.min.x, bb.min.z, bb.max.x, bb.max.z]); });
  return out;
});
const PR = 0.24;
const DESK_BB = DESK_COLL.map((l) => l.length ? l.reduce((b, [a, c, e, f]) => [Math.min(b[0], a - PR), Math.min(b[1], c - PR), Math.max(b[2], e + PR), Math.max(b[3], f + PR)], [1e9, 1e9, -1e9, -1e9]) : null);   // 배치별 책상 영역(충돌 검사 범위)
const circleHits = (x, z, a, b, c, d) => { const cx = Math.max(a, Math.min(x, c)), cz = Math.max(b, Math.min(z, d)); return (x - cx) ** 2 + (z - cz) ** 2 < PR * PR; };
const doorClosed = (d, plan) => d.target === 0 || (!plan && d.cur < 0.85);
function blocked(x, z, plan = false) {
  if (x < PR || z < PR || x > W - PR || z > D - PR) { const cr = L.corridor?.rect; if (!(cr && x > cr[0] + PR && x < cr[2] - PR && z >= D - PR && z < cr[3] - PR)
      && !(L.outside || []).some((r) => x > r[0] + PR && x < r[2] + PR && z > r[1] + PR && z < r[3] - PR && (x < PR || x > W - PR) && z > PR && z < D - PR)
      && !((L.public && L.public.floors) || []).some((r) => x > r[0] && x < r[2] && z > r[1] && z < r[3])
      && !(L.extensions || []).some((r) => x > r[0] && x < r[2] && z > r[1] && z <= r[3] + PR)) return true; }
  for (const [a, b, c, d2] of (L.barriers || [])) { const cx = Math.max(a, Math.min(x, c)), cz = Math.max(b, Math.min(z, d2)); if ((x - cx) ** 2 + (z - cz) ** 2 < PR * PR) return true; }   // 보이지 않는 출입 금지 선
  for (const d of DOORS) if (doorClosed(d, plan) && circleHits(x, z, d.box.min.x, d.box.min.z, d.box.max.x, d.box.max.z)) return true;
  const dc = DESK_COLL[deskIdx], db = DESK_BB[deskIdx]; if (dc && db && x > db[0] && x < db[2] && z > db[1] && z < db[3]) for (const [a, b, c, d] of dc) { const cx = Math.max(a, Math.min(x, c)), cz = Math.max(b, Math.min(z, d)); if ((x - cx) ** 2 + (z - cz) ** 2 < PR * PR) return true; }
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
function zoneAt(x, z) { for (const r of L.rooms) for (const [a, b, c, d] of [r.rect, ...(r.rects || [])]) { if (x >= a && x <= c && z >= b && z <= d) return r; } return null; }   // rects: L자 방 등 추가 영역
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
  const main = document.getElementById('cMain'); main.src = c.photos[0] ? `${L.photoDir || 'photos/'}${c.photos[0]}.jpg` : ''; main.alt = r.name;
  const th = document.getElementById('cThumbs'); th.innerHTML = '';
  c.photos.forEach((p, i) => { const im = document.createElement('img'); im.src = `${L.photoDir || 'photos/'}${p}.jpg`; if (!i) im.className = 'on'; im.onclick = () => { main.src = im.src; th.querySelectorAll('img').forEach((x) => x.classList.remove('on')); im.classList.add('on'); }; th.appendChild(im); });
  document.getElementById('cInfo').innerHTML = `<span>수용 인원 ${r.capacity ?? '○○'}명</span><span>면적 ${r.area ?? '○○'}㎡</span>`;
  document.getElementById('cDesc').textContent = c.desc;
  const ex = document.getElementById('cExtra'); ex.innerHTML = '';
  const esc = (t) => String(t).replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  if (c.use) ex.innerHTML += `<div class="row"><b>주요 용도</b>${esc(c.use)}</div>`;
  if (c.services?.length) ex.innerHTML += `<div class="row"><b>제공 서비스</b><div class="chips">${c.services.map((x) => `<i>${esc(x)}</i>`).join('')}</div></div>`;
  if (c.note) ex.innerHTML += `<div class="row note">${esc(c.note)}</div>`;
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
      if (touch && !d.locked) { d.target = 1; opened++; }
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
  if (d.locked) { toast('출입 불가 구역이에요'); return; }
  if (d.target === 1) {
    if (circleHits(player.x, player.z, d.box.min.x, d.box.min.z, d.box.max.x, d.box.max.z)) { toast('문 앞에서 조금 비켜 주세요'); return; }
    d.target = 0;
  } else d.target = 1;
}
function updateDoors(dt) {
  for (const d of DOORS) {
    const goal = d.locked ? 0 : mode === 'orbit' ? 1 : d.target;   // 3D 보기에서는 모든 문을 열어서 보여 줌
    if (d.cur !== goal) { const s = dt / 0.6; d.cur = goal > d.cur ? Math.min(goal, d.cur + s) : Math.max(goal, d.cur - s); for (const l of d.leaves) l.g.rotation.y = l.base + l.swing * ease(d.cur); }
  }
  const nd = findNearDoor();
  if (nd !== nearDoor || (nd && doorPrompt.dataset.st !== String(nd.target))) {
    nearDoor = nd;
    const label = nd ? (nd.locked ? '출입 불가' : nd.target === 1 ? '닫기' : '열기') : '';
    doorPrompt.dataset.st = nd ? String(nd.target) : '';
    doorPrompt.innerHTML = nd ? `<kbd>E</kbd>${label}` : ''; doorPrompt.classList.toggle('on', !!nd);
    doorBtn.textContent = label; doorBtn.classList.toggle('on', !!nd);
  }
}
doorBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); toggleDoor(nearDoor); });
window.__doors = DOORS; window.__blocked = (x, z) => blocked(x, z);
// Interactive screens are opt-in per layout; other venues retain their fixed screens.
const screenBtn = document.createElement('button');
screenBtn.id = 'screenControl'; screenBtn.type = 'button'; screenBtn.hidden = true;
Object.assign(screenBtn.style, { position:'fixed', left:'50%', top:'68%', transform:'translateX(-50%)', zIndex:9, background:'#0B2E67', color:'#fff', border:'2px solid white', borderRadius:'12px', padding:'12px 18px', font:'700 15px Pretendard, sans-serif', cursor:'pointer' });
if (SCREENS.length) document.body.appendChild(screenBtn);
let nearScreen = null;
function toggleScreen() { if (nearScreen) nearScreen.target = 1 - nearScreen.target; }
screenBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
screenBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleScreen(); });
addEventListener('keydown', (e) => { if (e.code === 'KeyR' && !e.repeat && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) toggleScreen(); });
const screenRay = new THREE.Raycaster(), screenNdc = new THREE.Vector2();
let scrMouse = null, hoverScreen = null, hoverScreenUntil = 0, overScreenBtn = false;
renderer.domElement.addEventListener('mousemove', (e) => { scrMouse = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('mouseleave', (e) => { if (e.relatedTarget !== screenBtn) scrMouse = null; });
screenBtn.addEventListener('mouseenter', () => { overScreenBtn = true; });
screenBtn.addEventListener('mouseleave', () => { overScreenBtn = false; });

function updateScreens(dt) {
  let proxScreen = null;
  for (const s of SCREENS) {
    const delta = dt / 2.2;
    s.cur = s.target > s.cur ? Math.min(s.target, s.cur + delta) : Math.max(s.target, s.cur - delta);
    s.roll.scale.y = 0.015 + s.cur * 0.985;
    s.bar.position.y = s.top - s.h * s.roll.scale.y - 0.0175;
    const dx = player.x - s.g.position.x, dz = player.z - s.g.position.z;
    const inFront = Math.abs(s.g.rotation.y) < 0.01
       ? (Math.abs(dx) < s.w / 2 + 0.4 && dz > 0 && dz < 2.5)
       : (Math.hypot(dx, dz) < 4.5 && player.x < s.g.position.x + 0.2 && Math.abs(dz) < s.w / 2 + 0.8);
   if (mode === 'walk' && !flight && inFront) proxScreen = s;
  }
  const now = performance.now();
  if (!flight && SCREENS.length) {
    const locked = isLocked();
    if (locked || scrMouse) {
      const sx = locked ? innerWidth / 2 : scrMouse[0], sy = locked ? innerHeight / 2 : scrMouse[1];
      screenNdc.set((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1);
      screenRay.setFromCamera(screenNdc, camera); screenRay.far = 25;
      const hits = screenRay.intersectObjects(SCREENS.map((s) => s.g), true);
      if (hits.length) {
        let p = hits[0].object;
        while (p && !p.userData.screenRef) p = p.parent;
        if (p && p.userData.screenRef) { hoverScreen = p.userData.screenRef; hoverScreenUntil = now + 1800; }
      }
    }
  }
  nearScreen = (hoverScreen && (overScreenBtn || now < hoverScreenUntil)) ? hoverScreen : proxScreen;
  screenBtn.hidden = !nearScreen;
  if (nearScreen) screenBtn.textContent = `${TOUCH ? '' : 'R · '}스크린 ${nearScreen.target ? '올리기' : '내리기'}`;
}

/* ---------------- player / modes / flights ---------------- */
const player = { x: 0, z: 0, yaw: 0, pitch: -0.04 }; window.__player = player; window.__camera = camera;
window.__player = player;
const yawTo = (fx, fz, tx, tz) => Math.atan2(-(tx - fx), -(tz - fz));
let mode = 'walk', flight = null, visitedWalk = false;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08; controls.screenSpacePanning = false;
controls.minDistance = 3; controls.maxDistance = 48; controls.maxPolarAngle = 80 * DEG; controls.enabled = false;
controls.target.set(W / 2, 0, D / 2);
const SZ = Math.max(W, D) / 19.6;   // 건물 크기에 맞춰 카메라 거리 조절 (19.6m 기준)
const ORBIT_HOME = { pos: new THREE.Vector3(W / 2 - 8.5 * SZ, 26.5 * SZ, D / 2 + 21.5 * SZ), target: new THREE.Vector3(W / 2, 0, D / 2 + 2.4 * SZ) };
{ // 세로 화면(모바일)에서는 건물 전체가 들어오도록 더 멀리서 시작
  const asp = innerWidth / innerHeight, k = asp < 1.2 ? Math.min(2.4, Math.pow(1.2 / asp, 0.85)) : 1;
  ORBIT_HOME.pos.sub(ORBIT_HOME.target).multiplyScalar(k).add(ORBIT_HOME.target);
}
let orbitSaved = { pos: ORBIT_HOME.pos.clone(), target: ORBIT_HOME.target.clone() };
if (SHOT === 'plan') orbitSaved = { pos: new THREE.Vector3(W / 2, 33 * SZ, D / 2 + 3.4 * SZ), target: new THREE.Vector3(W / 2, 0, D / 2 + 0.2 * SZ) };   // 위에서 내려다본 평면 스크린샷용
if (SHOT === 'planwide') {   // 공용 복도까지 포함한 넓은 평면 스크린샷
  let x0 = 0, z0 = 0, x1 = W, z1 = D; for (const r of ((L.public && L.public.floors) || [])) { x0 = Math.min(x0, r[0]); z0 = Math.min(z0, r[1]); x1 = Math.max(x1, r[2]); z1 = Math.max(z1, r[3]); }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, span = Math.max((x1 - x0) / 1.9, z1 - z0); controls.maxDistance = 200;
  orbitSaved = { pos: new THREE.Vector3(cx, span * 1.75, cz + 0.6), target: new THREE.Vector3(cx, 0, cz) };
}
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
for (const id of jumpOrder.filter((id) => !ROOMS[id].noEntry)) {
  const b = document.createElement('button'); b.textContent = ROOMS[id].name; b.dataset.id = id;
  b.onclick = () => { if (flight) return; if (mode === 'orbit') goRoom(id); else { const j = ROOMS[id].jump; enterWalk(j.x, j.z, yawTo(j.x, j.z, j.look[0], j.look[1]), true); } };
  jumps.appendChild(b);
}
const qb = document.getElementById('quality'); qb.textContent = HIGH ? '화질 높음' : '화질 낮음'; qb.classList.toggle('hi', HIGH);
qb.onclick = () => { const nq = HIGH ? 'low' : 'high'; localStorage.setItem('neo_q', nq); const p = new URLSearchParams(location.search); p.set('q', nq); if (!p.has('site') && window.__site) { p.set('site', window.__site); try { sessionStorage.setItem('neo_enter_site', window.__site); } catch (e) {} } location.search = p.toString(); };   // 화질 바꿔 다시 불러올 때만 같은 교육장 유지(새로고침은 선택 화면)

/* ---------------- input ---------------- */
const keys = {};
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; keys[e.code] = true; if (e.code === 'KeyE' && !e.repeat && !useAppliance() && mode === 'walk') toggleDoor(nearDoor); if (e.code === 'KeyV') document.querySelector(`#modes button[data-mode=${mode === 'walk' ? 'orbit' : 'walk'}]`)?.click(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cv = renderer.domElement; let drag = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
function floorAt(cx, cy) { ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.ray.intersectPlane(floorPlane, hit) && hit.x >= 0 && hit.x <= W && hit.z >= 0 && hit.z <= D ? hit.clone() : null; }
/* 걷기 모드(PC): 화면을 한 번 클릭하면 마우스가 시점에 고정되어, 마우스를 움직이는 방향으로 둘러봐요. Esc로 해제. */
const LOCKABLE = !TOUCH && !SHOT && 'requestPointerLock' in cv;
const isLocked = () => document.pointerLockElement === cv;
const lockHint = document.createElement('div'); lockHint.id = 'lockHint';
lockHint.style.cssText = 'position:fixed;left:50%;top:76px;transform:translateX(-50%);padding:6px 12px;border-radius:10px;background:rgba(18,36,82,.6);color:#fff;font:600 12px Pretendard,sans-serif;pointer-events:none;z-index:30;display:none;text-align:center;line-height:1.45;white-space:nowrap';   /* 걷기: 화면 위쪽, 작고 반투명(가운데 시설이 보이게) */
lockHint.innerHTML = '화면을 클릭하면 마우스로 둘러볼 수 있어요 <span style="font-weight:400;opacity:.8">· Esc 해제</span>';
document.body.appendChild(lockHint);
const crosshair = document.createElement('div');
crosshair.style.cssText = 'position:fixed;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;box-shadow:0 0 0 1.5px rgba(18,36,82,.7);pointer-events:none;z-index:30;display:none';
document.body.appendChild(crosshair);
let hintSince = 0, hintDone = false;   // 안내 문구는 몇 초 뒤 또는 마우스 잠금이 시작되면 숨김
function updLockUI() {
  const w = LOCKABLE && mode === 'walk' && !flight && !isLocked() && !hintDone;
  if (isLocked()) hintDone = true;
  if (w && !hintSince) hintSince = performance.now();
  if (w && performance.now() - hintSince > 6000) hintDone = true;
  lockHint.style.display = w && !hintDone ? 'block' : 'none'; crosshair.style.display = isLocked() ? 'block' : 'none';
}
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
function setDeskLayout(i, quiet) {
  if (!DESK_LAYOUTS.length) return;
  deskIdx = ((i % DESK_LAYOUTS.length) + DESK_LAYOUTS.length) % DESK_LAYOUTS.length;
  deskGroups.forEach((g, k) => { g.visible = k === deskIdx; });
  const nm = DESK_LAYOUTS[deskIdx].name, el = document.getElementById('deskName'); if (el) el.textContent = nm;
  if (mode === 'walk' && blocked(player.x, player.z)) { const [x, z] = freeNear(player.x, player.z); player.x = x; player.z = z; }   // 책상 안에 갇히지 않게
  if (!quiet) toast('책상 배치: ' + nm + ' (' + (deskIdx + 1) + '/' + DESK_LAYOUTS.length + ')');
}
window.__deskLayout = (id) => setDeskLayout(typeof id === 'number' ? id : DESK_LAYOUTS.findIndex((d) => d.id === id), true);
{ const b = document.getElementById('deskBtn'); if (b) { if (!DESK_LAYOUTS.length) b.style.display = 'none'; b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); setDeskLayout(deskIdx + 1); }); b.addEventListener('click', (e) => e.stopPropagation()); } setDeskLayout(deskIdx, true); }
function placeDeskBtn() { const b = document.getElementById('deskBtn'), m = document.getElementById('mapwrap'); if (!b || !m) return; const r = m.getBoundingClientRect(); b.style.top = Math.round(r.bottom + 10) + 'px'; }
placeDeskBtn(); addEventListener('resize', placeDeskBtn); setTimeout(placeDeskBtn, 500);
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT' || e.repeat) return; if (e.code === 'KeyB') setDeskLayout(deskIdx + 1); });
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 1600); }
// joystick
const joy = document.getElementById('joy'), knob = joy.querySelector('i'); const jv = { x: 0, y: 0 }; let joyId = null;
joy.addEventListener('pointerdown', (e) => { e.stopPropagation(); joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = (e) => { if (e.pointerId !== joyId) return; joyId = null; jv.x = jv.y = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
function joyMove(e) { const r = joy.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } jv.x = x; jv.y = y; knob.style.transform = `translate(${x * 34}px,${y * 34}px)`; }

/* ---------------- 장비 안내(마우스 올리면 툴팁) — layout.js 의 equipment ---------------- */
const EQUIP = (L.equipment || []).map((e) => ({ ...e, bx: (e.boxes || [e.box]).filter(Boolean) }));
{ // 항상 보이는 작은 글씨 라벨 (label:true)
  for (const e of EQUIP) if (e.label) for (const b of e.bx) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const k = c.getContext('2d');
    k.fillStyle = 'rgba(255,255,255,0.82)'; k.beginPath(); k.roundRect(8, 8, 240, 48, 24); k.fill();
    k.fillStyle = '#23324d'; k.font = '700 30px Pretendard, sans-serif'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText(e.name, 128, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false })); const th = e.labelSize || 0.045;
    sp.scale.set(th * 256 / 30, th * 64 / 30, 1); const lp = e.labelAt || [(b[0] + b[2]) / 2, Math.min((b[5] ?? 1) + 0.07, 1.4), b[1] - 0.08];
    sp.position.set(lp[0], lp[1], lp[2]); sp.renderOrder = 5; sp.userData.noPick = true; scene.add(sp);
  }
}
const tipEl = document.createElement('div'); tipEl.id = 'equipTip'; document.body.appendChild(tipEl);
const tipRay = new THREE.Raycaster(), tipNdc = new THREE.Vector2(), tipV = new THREE.Vector3(); let tipBox = null; let tipMouse = null, tipLast = 0, tipCur = null;
renderer.domElement.addEventListener('mousemove', (e) => { tipMouse = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('mouseleave', (e) => { if(e.relatedTarget?.id !== 'applianceUse') tipMouse = null; });
const visibleUp = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
function findEquip(p) {
  for (const e of EQUIP) for (const b of e.bx) { const t = 0.06;
    if (p.x >= b[0] - t && p.x <= b[2] + t && p.z >= b[1] - t && p.z <= b[3] + t && p.y >= (b[4] ?? 0) - t && p.y <= (b[5] ?? H) + t) { tipBox = b; return e; } }
  return null;
}
function updateTip(now) {
  if (!EQUIP.length || now - tipLast < 90 || flight) return; tipLast = now;
  const locked = isLocked(); let sx, sy;
  if (locked) { sx = innerWidth / 2; sy = innerHeight / 2; } else if (tipMouse) { [sx, sy] = tipMouse; } else { tipEl.classList.remove('on'); tipCur = null; return; }
  tipNdc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); tipRay.setFromCamera(tipNdc, camera); tipRay.far = 9;
  const hits = tipRay.intersectObject(root, true); let e = null;
  for (const h of hits) {
    if (h.object.isSprite || h.object.userData.noPick || !visibleUp(h.object)) continue;
    let id;for(let p=h.object;p;p=p.parent)if(p.userData.equipmentId){id=p.userData.equipmentId;break;}
    e=id?EQUIP.find(v=>v.id===id):findEquip(h.point);if(id&&e)tipBox=e.bx[0];break;
  }
  if (!e) { tipEl.classList.remove('on'); tipCur = null; return; }
  if (tipCur !== e) { tipEl.innerHTML = `<b>${e.name}</b>${e.room ? `<small>${e.room}</small>` : ''}` + (e.lines || []).map((l) => `<div>${l}</div>`).join(''); tipCur = e; }
  // 카드 위치: 장비 상자 윗면 가운데를 화면에 투영해 그 바로 위, 가로 가운데 (화면 밖으로 안 나가게)
  const bb = tipBox, topY = e.label ? Math.max(bb[5] ?? H, (e.labelAt ? e.labelAt[1] : (bb[5] ?? 1) + 0.07) + 0.07) : (bb[5] ?? H); tipV.set((bb[0] + bb[2]) / 2, Math.min(topY, H - 0.02), (bb[1] + bb[3]) / 2).project(camera);   // 이름표가 있으면 그 위
  const w = tipEl.offsetWidth || 220, hgt = tipEl.offsetHeight || 80;
  let ax = (tipV.x + 1) / 2 * innerWidth, ay = (1 - tipV.y) / 2 * innerHeight; if (tipV.z > 1) { ax = sx; ay = sy; }
  tipEl.style.left = Math.max(10, Math.min(innerWidth - w - 10, ax - w / 2)) + 'px';
  tipEl.style.top = Math.max(10, Math.min(innerHeight - hgt - 10, ay - hgt - 10)) + 'px';
  tipEl.classList.add('on');
}
window.__tip = (x, y) => { tipMouse = [x, y]; tipLast = 0; updateTip(performance.now() + 1000); return tipCur && tipCur.name; };

/* ---------------- pantry appliance interactions ---------------- */
const useBtn=document.createElement('button');useBtn.id='applianceUse';useBtn.hidden=true;
Object.assign(useBtn.style,{position:'fixed',left:'50%',top:'72%',transform:'translateX(-50%)',zIndex:10,border:'2px solid white',borderRadius:'12px',padding:'11px 18px',background:'#0B2E67',color:'white',font:'700 15px Pretendard,sans-serif',cursor:'pointer'});
if(APPLIANCES.size)document.body.appendChild(useBtn);
const actionLabel=(id,a)=>a.kind==='door'?(a.target?'닫기':'열기'):a.kind==='cup'?(a.cup.visible?'종이컵 치우기':'종이컵 올리기'):a.state==='empty'?'종이컵 대고 물받기':a.state==='filling'?'물 받는 중…':'종이컵 치우기';
function activeAppliance(){
  if(flight||!tipCur)return null;
  const a=APPLIANCES.get(tipCur.id);if(!a)return null;
  const b=tipCur.bx[0];if(camera.position.distanceTo(new THREE.Vector3((b[0]+b[2])/2,(b[4]+b[5])/2,(b[1]+b[3])/2))>3.2)return null;
  return {id:tipCur.id,a};
}
function useAppliance(){
  const current=activeAppliance();if(!current)return false;
  const {a}=current;
  if(a.kind==='door'){a.target=1-a.target;a.state=a.target?'open':'closed';}
  else if(a.kind==='cup'){a.cup.visible=!a.cup.visible;a.state=a.cup.visible?'placed':'empty';}
  else if(a.state==='empty'){a.cup.visible=true;a.stream.visible=true;a.elapsed=0;a.state='filling';}
  else if(a.state==='full'){a.cup.visible=false;a.state='empty';a.fill.scale.y=0.01;}
  return true;
}
useBtn.addEventListener('pointerdown',e=>e.stopPropagation());useBtn.addEventListener('click',e=>{e.stopPropagation();useAppliance();});
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){tipMouse=[e.clientX,e.clientY];tipLast=0;updateTip(performance.now()+1000);}});
function updateAppliances(dt){
  for(const a of APPLIANCES.values()){
    if(a.kind==='door'){a.cur=THREE.MathUtils.damp(a.cur,a.target,9,dt);a.pivot.rotation[a.axis]=a.cur*a.angle;}
    if(a.kind==='water'&&a.state==='filling'){a.elapsed+=dt;const f=Math.min(1,a.elapsed/3);a.fill.scale.y=0.02+0.98*f;a.fill.position.y=0.005+0.05*a.fill.scale.y;if(f===1){a.stream.visible=false;a.state='full';}}
  }
  const current=activeAppliance();useBtn.hidden=!current;
  if(current){const lbl=current.a.kind==='door'?(current.a.target?'E-닫기':'E-열기'):'E - 사용하기';useBtn.textContent=TOUCH?lbl.replace(/^E\s*-\s*/,''):lbl;useBtn.disabled=current.a.state==='filling';}
}
window.__applianceState=()=>Object.fromEntries([...APPLIANCES].map(([id,a])=>[id,{state:a.state,open:a.cur??null,cup:a.cup?.visible??false,water:a.fill?.scale.y??0}]));

/* ---------------- minimap ---------------- */
const mm = document.getElementById('minimap'), mctx = mm.getContext('2d'), dpr = Math.min(devicePixelRatio, 2);
const MAP_Z0 = Math.min(0, ...(L.extensions || []).map((r) => r[1]));
const MS = 190 / Math.max(W, D - MAP_Z0), PAD = 7, MW = W * MS + PAD * 2, MH = (D - MAP_Z0) * MS + PAD * 2;
mm.width = MW * dpr; mm.height = MH * dpr; mm.style.width = MW + 'px'; mm.style.height = MH + 'px';
const mx = (x) => PAD + x * MS, mz = (z) => PAD + (z - MAP_Z0) * MS;
const mapBase = document.createElement('canvas'); mapBase.width = mm.width; mapBase.height = mm.height;
{
  const c = mapBase.getContext('2d'); c.scale(dpr, dpr);
  c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(mx(0), mz(0), W * MS, D * MS);
  for (const r of L.rooms) { if (r.id === 'lounge') continue; for (const [a, b, cc, d] of [r.rect, ...(r.rects || [])]) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(mx(a), mz(b), (cc - a) * MS, (d - b) * MS); } }
  for (const s of WALLSEGS) {
    if (s.type === 'column') { c.fillStyle = s.block ? 'rgba(255,255,255,.28)' : '#fff'; c.fillRect(mx(s.x1), mz(s.z1), (s.x2 - s.x1) * MS, (s.z2 - s.z1) * MS); continue; }
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
  const r = mm.getBoundingClientRect(), k = MW / r.width; const x = ((e.clientX - r.left) * k - PAD) / MS, z = ((e.clientY - r.top) * k - PAD) / MS + MAP_Z0;
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
{ const wh = document.getElementById('where'); if (wh) { wh.style.cursor = 'pointer'; wh.title = '공간 정보 보기'; wh.addEventListener('click', () => { const r = L.rooms.find((x) => x.name === whereName.textContent); if (r) openCard(r.id); }); } }
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
  player.y = (player.y ?? 0) + (floorHeight(player.x, player.z) - (player.y ?? 0)) * Math.min(1, dt * 10);   // 단상 위로 올라가면 눈높이도 올라감
  camera.position.set(player.x, EYE + player.y, player.z); camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
}
function tick() {
  requestAnimationFrame(tick);
  updateTip(performance.now());
  const dt = Math.min(clock.getDelta(), 0.05);
  if (flight) stepFlight(dt); else if (mode === 'walk') step(dt); else if (mode === 'orbit') controls.update();
  updateDoors(dt);
  updateScreens(dt);
  updateAppliances(dt);
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
applyLook(L.look, { renderer, scene, walls: WALLSEGS, rooms: L.rooms, height: H });   // 조명·색감 보정(look.js) — layout 에 look 이 없으면 아무 변화 없음
const SHOTS = { entrance: 'entrance', lounge: 'lounge', edu: 'classroom', focus: 'focus' };
const startMode = SHOT ? (SHOT === 'orbit' || SHOT === 'dollhouse' || SHOT === 'plan' || SHOT === 'planwide' ? 'orbit' : 'walk') : (params.get('mode') || L.start?.mode || 'orbit');
if (startMode === 'walk') goRoom(SHOTS[SHOT] || params.get('room') || L.start?.room || 'entrance', true);
else { player.x = ROOMS.entrance.jump.x; player.z = ROOMS.entrance.jump.z; enterOrbit(true); }
document.fonts.ready.then(() => { tick(); setTimeout(() => { const ld = document.getElementById('loading'); ld.style.opacity = 0; setTimeout(() => ld.remove(), 450); window.__ready = true; }, 400); });
