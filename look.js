/* 실내 조명·색감 보정 (look.js)
   layout.js 에 look: { ... } 가 있는 교육장에만 적용돼요. 없으면 아무것도 바꾸지 않아요(기존 화면 그대로).
   app.js 의 장면이 다 만들어진 뒤 한 번 실행되고, 조명 세기·방향과 색 처리만 바꿔요. 공간·가구·기능은 그대로예요.

   look: {
     toneMapping: 'aces',  // 'aces'(기존 방식, 흰 벽과 검은 가구의 대비가 사진에 가까움) 또는 'agx'(더 부드럽고 회색빛)
     exposure: 1.3,        // 전체 밝기 (기존 0.88)
     environment: 0.6,     // 은은한 반사광(주변 환경) 세기 (기존 0.5)
     hemisphere: { sky: '#ffffff', ground: '#e9e6e0', intensity: 0.8 },   // 천장·벽에서 튕긴 듯한 고른 빛 (기존 0.5). 너무 높이면 검은 의자가 회색으로 떠요
     ceiling: { intensity: 2.2, tilt: 8, color: '#fffdf8' },              // 천장 LED처럼 위에서 내려오는 주 조명(그림자가 가구 바로 아래) (기존 햇빛 0.95)
     reflection: { roughness: 0.4, intensity: 0.9 }                       // 바닥 반사(아래 floorReflection 설명). 빼면 반사 없음
   }                       // tilt: 수직에서 기울인 각도(°). 0 이면 완전히 위에서 아래로.
*/
import * as THREE from 'three';
import { Reflector } from 'three/addons/Reflector.js';

const DEFAULTS = {
  toneMapping: 'aces', exposure: 1.3, environment: 0.6,
  hemisphere: { sky: '#ffffff', ground: '#e9e6e0', intensity: 0.8 },
  ceiling: { intensity: 2.2, tilt: 8, color: '#fffdf8' },
};

export function applyLook(look, { renderer, scene, walls = [], rooms = [], height = 2.7 }) {
  if (!look) return;
  const cfg = { ...DEFAULTS, ...look,
    hemisphere: { ...DEFAULTS.hemisphere, ...(look.hemisphere || {}) },
    ceiling: { ...DEFAULTS.ceiling, ...(look.ceiling || {}) } };

  // 1) 색 처리와 밝기: 기존 노출(0.88)은 흰 벽을 회색으로 눌러요. 사진처럼 밝은 흰 벽이 되도록 노출을 올려요.
  renderer.toneMapping = cfg.toneMapping === 'aces' ? THREE.ACESFilmicToneMapping : THREE.AgXToneMapping;
  renderer.toneMappingExposure = cfg.exposure;
  scene.environmentIntensity = cfg.environment;

  let hemi = null, key = null;
  scene.traverse((o) => { if (o.isHemisphereLight && !hemi) hemi = o; if (o.isDirectionalLight && !key) key = o; });

  // 2) 고른 바탕빛: 하얀 천장·벽에서 튕긴 빛처럼 위아래 모두 밝게
  if (hemi) {
    hemi.color.set(cfg.hemisphere.sky); hemi.groundColor.set(cfg.hemisphere.ground); hemi.intensity = cfg.hemisphere.intensity;
  }

  // 3) 주 조명: 실내는 천장 LED 가 위에서 비추므로 햇빛(비스듬한 그림자) 대신 거의 수직으로 내려오는 빛
  if (key) {
    const floor = new THREE.Box3();
    scene.traverse((o) => { if (o.isMesh && o.userData.floor) floor.expandByObject(o); });
    if (floor.isEmpty()) floor.setFromObject(scene);
    const c = floor.getCenter(new THREE.Vector3()), size = floor.getSize(new THREE.Vector3());
    const tilt = THREE.MathUtils.degToRad(cfg.ceiling.tilt), h = 14;
    key.color.set(cfg.ceiling.color); key.intensity = cfg.ceiling.intensity;
    key.target.position.set(c.x, 0, c.z);
    key.position.set(c.x + Math.sin(tilt) * h * 0.6, h, c.z + Math.sin(tilt) * h * 0.8);
    key.target.updateMatrixWorld();
    if (key.castShadow) {   // 그림자 범위를 바닥 전체(복도 포함)에 맞춤
      const r = Math.max(size.x, size.z) / 2 + 1, sc = key.shadow.camera;
      sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 2; sc.far = h + 6; sc.updateProjectionMatrix();
      key.shadow.radius = 4;
    }
  }

  // 3-1) 천장: 흡음 텍스 타일 무늬·T바 격자, 사진처럼 밝은 천장, LED 주변 은은한 빛 번짐
  if (cfg.ceilingTile) ceilingLook(cfg.ceilingTile, renderer, scene);

  // 3-3) 창밖 사진: 지정한 창 밖에 실제 사진 풍경(가장자리는 기존 하늘·도시 배경으로 녹아듦)
  if (cfg.windowViews) windowViews(cfg.windowViews, scene);
  if (cfg.windowImages) windowImages(cfg.windowImages, scene);   // 창 유리 자리에 사진(사진 속 창처럼)

  // 3-4) 3D 보기(위에서 내려다보기)에서는 창밖 풍경(하늘·도시 판, 창밖 사진)을 숨기고 걷기에서만 보여요
  if (cfg.hideOutsideInOrbit !== false) outsideOnlyWhenWalking(scene);

  // 3-1b) 모서리 그늘: 벽-천장·벽-바닥이 만나는 곳을 살짝 어둡게(실시간으로는 계산되지 않는 구석 그늘을 흉내)
  if (cfg.cornerShade) cornerShade(cfg.cornerShade, walls, height, scene);

  // 3-2) 벽 아래 검은 띠: 회의실·소회의실·교육장 벽 아랫부분 검은 칠(depth 를 키우면 튀어나온 걸레받이)
  if (cfg.baseboard) baseboards(cfg.baseboard, walls, rooms, scene);

  // 4) 바닥 무늬: 서울 사진처럼 한 방향으로 짧은 결이 흐르는 시트 장판(줄눈 없음)
  if (cfg.floor) floorTexture(cfg.floor, renderer, scene);

  // 5) 바닥 반사: 실제 공간(천장 LED·벽·가구)을 서 있는 자리에서 한 번 찍어 바닥에 비춰요.
  if (cfg.reflection) floorReflection(cfg.reflection, renderer, scene);
}

/* 바닥 반사(look.reflection)
   reflection: { roughness: 0.4, intensity: 0.9, size: 256, follow: true }
     roughness : 바닥 거칠기 배율(작을수록 또렷하게 비침, 1 이면 기존 그대로)
     intensity : 비치는 밝기
     tone      : 바닥 밝기 배율(1 = 그대로). 바닥이 너무 하얗면 반사가 안 보여서 조금 낮춰요
     lights    : 반사 속 천장 LED 밝기 배율(찍을 때만 적용, 화면의 LED는 그대로)
     planar    : { opacity, blur } 걷기 + 화질 높음에서 바닥에 가구·조명이 또렷하게 비치는 거울 반사(흐리게 섞음). 빼면 끔
     size      : 반사용으로 찍는 사진 크기(px). 크면 선명하지만 무거워요
     follow    : 걷기 중 2.5m 이상 움직이면 그 자리에서 다시 찍어요(반사가 위치에 맞게 바뀜)
   공간을 처음 만들 때 한 번, 로딩이 끝난 뒤 한 번, 그리고 follow 면 걸을 때 가끔 다시 찍어요. */
function floorReflection(opt, renderer, scene) {
  const o = { roughness: 0.4, intensity: 0.9, tone: 1, lights: 4, size: 256, follow: true, ...(opt === true ? {} : opt) };
  const mats = new Set();
  scene.traverse((m) => { if (m.isMesh && m.userData.floor && m.material?.isMeshStandardMaterial) mats.add(m.material); });
  window.__look = Object.assign(window.__look || {}, { floorMaterials: mats.size });   // 확인용(바닥 재질 수, 반사 촬영 횟수)
  if (!mats.size) return;
  for (const m of mats) { m.roughness *= o.roughness; m.envMapIntensity = o.intensity; m.color.multiplyScalar(o.tone); m.needsUpdate = true; }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const cubeRT = new THREE.WebGLCubeRenderTarget(o.size, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.05, 80, cubeRT);
  let envRT = null, last = null, lastTime = 0;
  const floorBox = new THREE.Box3();
  scene.traverse((m) => { if (m.isMesh && m.userData.floor) floorBox.expandByObject(m); });
  const centre = floorBox.getCenter(new THREE.Vector3());

  // 천장 LED(흰색으로만 칠한 판)는 찍을 때만 밝게 해서, 바닥에 조명이 또렷하게 비치게 해요(화면의 LED 모습은 그대로).
  const leds = new Set();
  scene.traverse((m) => { if (m.isMesh && m.material?.isMeshBasicMaterial && !m.material.map && m.material.color.getHexString() === 'fdfdf8') leds.add(m.material); });
  const mirror = o.planar ? planarMirror(o.planar, floorBox, renderer) : null;
  if (mirror) scene.add(mirror);
  const capture = (x, z) => {
    cubeCam.position.set(x, 1.2, z); cubeCam.updateMatrixWorld();
    if (mirror) mirror.visible = false;
    for (const m of leds) m.color.multiplyScalar(o.lights);
    cubeCam.update(renderer, scene);
    for (const m of leds) m.color.multiplyScalar(1 / o.lights);
    const next = pmrem.fromCubemap(cubeRT.texture);
    for (const m of mats) m.envMap = next.texture;
    envRT?.dispose(); envRT = next; last = { x, z }; lastTime = performance.now();
    window.__look.captures = (window.__look.captures || 0) + 1; window.__look.leds = leds.size;
  };
  capture(centre.x, centre.z);

  // 걷기 중에는 서 있는 자리 근처에서 다시 찍어 반사가 위치에 맞게 보이게 해요. 3D 보기에서는 공간 가운데 기준.
  const loop = () => {
    requestAnimationFrame(loop);
    const p = window.__player, walking = document.body.classList.contains('walk');
    if (mirror) mirror.visible = walking && renderer.shadowMap.enabled;   // 걷기 + 화질 높음에서만(그림자를 쓰는 고화질 모드)
    const want = walking && p && o.follow ? { x: p.x, z: p.z } : { x: centre.x, z: centre.z };
    const now = performance.now();
    if (!window.__ready || now - lastTime < 800) return;
    if (Math.hypot(want.x - last.x, want.z - last.z) > (walking ? 2.5 : 0.1) || !last.loaded) { capture(want.x, want.z); last.loaded = true; }
  };
  requestAnimationFrame(loop);
}

/* 바닥 거울 반사: 바닥 바로 위에 반투명 거울을 깔아, 가구·천장 조명이 비치는 모습을 흐리게 섞어요.
   보는 각도가 낮을수록(멀리 볼수록) 더 많이 비쳐요(프레넬). 매 프레임 장면을 한 번 더 그리므로 고화질 걷기에서만 켜요. */
function planarMirror(opt, floorBox, renderer) {
  const o = { opacity: 0.35, blur: 0.006, fresnel: [0.25, 1], size: 512, ...(opt === true ? {} : opt) };
  const size = floorBox.getSize(new THREE.Vector3()), c = floorBox.getCenter(new THREE.Vector3());
  const aspect = innerWidth / innerHeight;
  const mirror = new Reflector(new THREE.PlaneGeometry(size.x, size.z), {
    textureWidth: o.size, textureHeight: Math.round(o.size / aspect), multisample: 0, clipBias: 0.003,
    shader: {
      name: 'SoftFloorMirror',
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
        opacity: { value: o.opacity }, blur: { value: o.blur }, fmin: { value: o.fresnel[0] }, fmax: { value: o.fresnel[1] } },
      vertexShader: /* glsl */`
        uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
        void main() { vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 color; uniform sampler2D tDiffuse; uniform float opacity, blur, fmin, fmax; varying vec4 vUv; varying vec3 vWorld;
        void main() {
          vec2 uv = vUv.xy / vUv.w; vec3 acc = vec3(0.0);
          for (int i = 0; i < 12; i++) { float r = blur * sqrt((float(i) + 0.5) / 12.0), t = float(i) * 2.39996; acc += texture2D(tDiffuse, uv + r * vec2(cos(t), sin(t))).rgb; }
          vec3 V = normalize(cameraPosition - vWorld); float f = mix(fmin, fmax, pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0));
          gl_FragColor = vec4(acc / 12.0 * color, opacity * f);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  mirror.material.uniforms.color.value = new THREE.Color(1, 1, 1);
  mirror.material.transparent = true; mirror.material.depthWrite = false;
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(c.x, floorBox.max.y + 0.003, c.z);
  mirror.renderOrder = 1; mirror.visible = false; mirror.name = 'floorMirror';
  return mirror;
}

/* 바닥 무늬(look.floor) — 줄눈 없는 시트 장판. 짧은 결(밝은 회색·짙은 회색·베이지)이 한 방향으로 촘촘하게 흘러요.
   floor: { base: '#cfccc6', light: '#efece6', dark: '#9c9994', warm: '#c2b6a5', size: 1.0, angle: 0, density: 1, gloss: 0.6 }
     base/light/dark/warm : 바탕색·밝은 결·짙은 결·따뜻한 결 색
     size    : 무늬 한 장이 덮는 크기(m)
     angle   : 결 방향(°). 0 = 동서(x) 방향, 90 = 남북(z) 방향
     density : 결의 양(1 = 기본)
     streak  : 결의 길이·굵기 배율(1 = 기본, 길이 약 6~40mm)
     gloss   : 바닥 거칠기(작을수록 매끈). 반사(look.reflection)의 roughness 배율과 곱해져요 */
function floorTexture(opt, renderer, scene) {
  const o = { base: '#cfccc6', light: '#f1eee8', dark: '#97938d', warm: '#bfb29f', size: 1.0, angle: 0, density: 1, streak: 1, gloss: 0.6, ...opt };
  const mats = new Set();
  scene.traverse((m) => { if (m.isMesh && m.userData.floor && m.material?.isMeshStandardMaterial && m.material.map) mats.add(m.material); });
  if (!mats.size) return;

  let seed = 20261120; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const N = renderer.capabilities.maxTextureSize >= 2048 && renderer.shadowMap.enabled ? 1024 : 512, px = N / (o.size * 1000);  // px per mm
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  g.fillStyle = o.base; g.fillRect(0, 0, N, N);
  // 넓은 얼룩(아주 옅은 명암 변화)
  for (let i = 0; i < 70; i++) {
    const x = rnd() * N, y = rnd() * N, r = (40 + rnd() * 120) * px * 2, lighter = rnd() < 0.5;
    for (const [dx, dy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      gr.addColorStop(0, lighter ? 'rgba(255,255,255,0.10)' : 'rgba(90,85,78,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
    }
  }
  // 짧은 결: 한 방향(± 약간 흔들림)으로 길쭉한 획을 촘촘하게. 가장자리는 반대편에도 그려 이음새 없이 반복
  const base = THREE.MathUtils.degToRad(o.angle), count = Math.round(26000 * o.density * (N / 1024) ** 2);
  const palette = [[o.light, 0.42], [o.dark, 0.28], [o.warm, 0.18], ['#ffffff', 0.12]];
  g.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    let t = rnd(), col = palette[0][0]; for (const [cc, w] of palette) { if (t < w) { col = cc; break; } t -= w; }
    const len = (6 + rnd() * rnd() * 34) * o.streak * px, a = base + (rnd() - 0.5) * 0.3, x = rnd() * N, y = rnd() * N;
    const dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
    g.strokeStyle = col; g.globalAlpha = 0.45 + rnd() * 0.5; g.lineWidth = Math.max(0.8, (1.0 + rnd() * 2.0) * o.streak * px);
    const draw = (ox, oy) => { g.beginPath(); g.moveTo(x - dx + ox, y - dy + oy); g.lineTo(x + dx + ox, y + dy + oy); g.stroke(); };
    draw(0, 0);
    if (x < len) draw(N, 0); if (x > N - len) draw(-N, 0); if (y < len) draw(0, N); if (y > N - len) draw(0, -N);
  }
  g.globalAlpha = 1;
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  // 거칠기: 결 무늬를 따라 아주 조금씩 다르게(밝은 결이 살짝 더 매끈)
  const r = document.createElement('canvas'); r.width = r.height = N; const rg = r.getContext('2d');
  rg.drawImage(c, 0, 0); const img = rg.getImageData(0, 0, N, N), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const v = Math.round((o.gloss + (0.5 - d[i] / 255) * 0.25) * 255); d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, v)); }
  rg.putImageData(img, 0, 0);
  const rough = new THREE.CanvasTexture(r); rough.colorSpace = THREE.NoColorSpace;
  for (const t of [map, rough]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / o.size, 1 / o.size); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true; }
  for (const m of mats) {
    m.map = map; m.roughnessMap = rough; m.roughness = 1;
    m.normalMap = null;   // 기존 타일 텍스처의 줄눈 요철 제거(시트 장판은 이음새가 거의 안 보여요)
    m.needsUpdate = true;
  }
}

/* 천장(look.ceilingTile) — 60cm 흡음 텍스 타일(잔 구멍·짧은 홈), 흰 T바 격자, 밝은 천장, LED 빛 번짐
   ceilingTile: { base: '#f3f3f1', pits: 1, grid: '#fbfbfa', edge: '#c8c8c4', tile: 0.6, glow: 0.35, halo: { opacity: 0.22, spread: 0.45 } }
     pits   : 잔 구멍·홈의 양(1 = 기본), pitSize: 구멍 크기 배율
     grid   : T바(격자) 색, edge: T바 양옆 그늘선 색
     glow   : 천장 자체 밝기(위에서 내려오는 조명은 천장을 비추지 못해서, 바닥에서 튕긴 빛을 대신함)
     halo   : LED 주변 빛 번짐 { opacity: 세기, spread: 퍼지는 폭(m) }. 빼면 없음 */
function ceilingLook(opt, renderer, scene) {
  const o = { base: '#f3f3f1', pits: 1, pitSize: 1, grid: '#fbfbfa', edge: '#c8c8c4', tile: 0.6, glow: 0.35, halo: { opacity: 0.22, spread: 0.45 }, ...opt };
  const mats = new Set();
  scene.traverse((m) => { const mt = m.material; if (m.isMesh && mt?.isMeshStandardMaterial && mt.userData.world && mt.emissiveMap && mt.emissiveMap === mt.map) mats.add(mt); });
  window.__look = Object.assign(window.__look || {}, { ceilingMaterials: mats.size });
  if (mats.size) {
    let seed = 7713; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const span = o.tile * 2, N = renderer.shadowMap.enabled ? 1024 : 512, px = N / (span * 1000);   // 한 장 = 타일 2×2, px per mm
    const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
    g.fillStyle = o.base; g.fillRect(0, 0, N, N);
    // 잔 구멍(작고 불규칙한 점)과 짧은 홈(벌레 먹은 듯한 선)
    const pits = Math.round(9000 * o.pits * (N / 1024) ** 2);
    for (let i = 0; i < pits; i++) {
      const x = rnd() * N, y = rnd() * N, r = Math.max(0.9, (0.8 + rnd() * rnd() * 2.6) * px * o.pitSize), v = 105 + rnd() * 70;
      g.fillStyle = `rgba(${v},${v},${v - 3},${0.35 + rnd() * 0.45})`;
      g.beginPath(); g.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * 3.14, 0, 6.283); g.fill();
    }
    g.lineCap = 'round';
    for (let i = 0; i < pits / 9; i++) {
      let x = rnd() * N, y = rnd() * N, a = rnd() * 6.283; const v = 140 + rnd() * 50;
      g.strokeStyle = `rgba(${v},${v},${v - 3},${0.3 + rnd() * 0.35})`; g.lineWidth = Math.max(0.6, (0.5 + rnd() * 0.7) * px);
      g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++) { a += (rnd() - 0.5) * 1.6; x += Math.cos(a) * 2.5 * px; y += Math.sin(a) * 2.5 * px; g.lineTo(x, y); } g.stroke();
    }
    // T바 격자(폭 24mm) + 양옆 얇은 그늘선. 타일 경계(0, 절반)에 그리고 가장자리는 반대편에도 이어 그림
    const bar = 24 * px, edge = Math.max(1, 1.6 * px);
    for (const p0 of [0, N / 2, N]) {
      g.fillStyle = o.edge; g.fillRect(p0 - bar / 2 - edge, 0, bar + edge * 2, N); g.fillRect(0, p0 - bar / 2 - edge, N, bar + edge * 2);
    }
    for (const p0 of [0, N / 2, N]) { g.fillStyle = o.grid; g.fillRect(p0 - bar / 2, 0, bar, N); g.fillRect(0, p0 - bar / 2, N, bar); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / span, 1 / span); t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    for (const m of mats) { m.map = t; m.emissiveMap = t; m.emissiveIntensity = o.glow; m.normalMap = null; m.needsUpdate = true; }
  }
  if (o.halo) ledHalos(o.halo, scene);
}

// 천장 LED(흰색만 칠한 판·원형 조명) 위치를 찾아, 그 둘레에 은은한 빛 번짐 판을 붙여요.
function ledHalos(h, scene) {
  const leds = [];
  scene.traverse((m) => { if (m.isMesh && m.material?.isMeshBasicMaterial && !m.material.map && m.material.color.getHexString() === 'fdfdf8') leds.push(m); });
  // 아래를 향한 면(LED 앞면)을 위치별로 묶어 조명 한 개씩 찾기
  const rects = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), cc = new THREE.Vector3(), n = new THREE.Vector3();
  for (const m of leds) {
    m.updateMatrixWorld(); const pos = m.geometry.attributes.position, idx = m.geometry.index;
    const tri = idx ? idx.count / 3 : pos.count / 3;
    for (let i = 0; i < tri; i++) {
      const i0 = idx ? idx.getX(i * 3) : i * 3, i1 = idx ? idx.getX(i * 3 + 1) : i * 3 + 1, i2 = idx ? idx.getX(i * 3 + 2) : i * 3 + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld); b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld); cc.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld);
      n.subVectors(cc, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
      if (n.y > -0.9 && n.y < 0.9) continue;   // 옆면은 건너뜀(아래·위 면만)
      if (Math.abs(n.y) > 0.9 && a.y > 0.5) rects.push({ x0: Math.min(a.x, b.x, cc.x), x1: Math.max(a.x, b.x, cc.x), z0: Math.min(a.z, b.z, cc.z), z1: Math.max(a.z, b.z, cc.z), y: Math.min(a.y, b.y, cc.y) });
    }
  }
  const groups = [];
  for (const r of rects) {
    const gg = groups.find((q) => r.x0 <= q.x1 + 0.01 && r.x1 >= q.x0 - 0.01 && r.z0 <= q.z1 + 0.01 && r.z1 >= q.z0 - 0.01 && Math.abs(r.y - q.y) < 0.05);
    if (gg) { gg.x0 = Math.min(gg.x0, r.x0); gg.x1 = Math.max(gg.x1, r.x1); gg.z0 = Math.min(gg.z0, r.z0); gg.z1 = Math.max(gg.z1, r.z1); gg.y = Math.min(gg.y, r.y); } else groups.push({ ...r });
  }
  if (!groups.length) return;
  // 둥근 사각형 모양으로 가장자리가 부드럽게 사라지는 빛 번짐 텍스처
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = Math.max(0, Math.abs(x - S / 2 + 0.5) / (S / 2) - 0.0), dy = Math.max(0, Math.abs(y - S / 2 + 0.5) / (S / 2) - 0.0);
    const d = Math.min(1, Math.hypot(Math.max(0, dx * 1.0), Math.max(0, dy * 1.0)));
    const v = Math.pow(1 - d, 2.2), i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(v * 255);
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: h.opacity ?? 0.22, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(Math.PI / 2);   // 아래를 향하는 판
  const sp = h.spread ?? 0.45, group = new THREE.Group(); group.name = 'ledHalos';
  for (const q of groups) {
    const w = q.x1 - q.x0, d = q.z1 - q.z0; if (w < 0.03 && d < 0.03) continue;
    const halo = new THREE.Mesh(geo, mat); halo.scale.set(w + sp * 2, 1, d + sp * 2);
    halo.position.set((q.x0 + q.x1) / 2, q.y + 0.004, (q.z0 + q.z1) / 2); halo.renderOrder = 2; group.add(halo);
  }
  scene.add(group);
  window.__look = Object.assign(window.__look || {}, { ledHalos: group.children.length });
}

/* 벽 아래 띠(look.baseboard) — 지정한 방 안쪽 벽면 아래에만 띠를 둘러요(문 자리는 자동으로 비움).
   서울은 칠한 띠라 depth:0.002(벽면과 거의 같은 높이). 튀어나온 걸레받이는 depth 0.01 정도.
   baseboard: { rooms: ['meeting', 'coaching', 'classroom'], color: '#1d1e21', h: 0.08, depth: 0.012 }
     rooms : 띠를 둘 방 id(layout 의 rooms), color: 색, h: 높이(m), depth: 벽에서 튀어나온 두께(m) */
function baseboards(opt, walls, rooms, scene) {
  const o = { rooms: ['meeting', 'coaching', 'classroom'], color: '#1d1e21', h: 0.08, depth: 0.012, ...opt };
  const rects = rooms.filter((r) => o.rooms.includes(r.id)).flatMap((r) => [r.rect, ...(r.rects || [])]);
  if (!rects.length) return;
  const flat = o.depth < 0.005;   // 칠한 띠: 무광 페인트, 그림자 받지만 턱 그림자 없음
  const mat = new THREE.MeshStandardMaterial({ color: o.color, roughness: flat ? 0.75 : 0.45, metalness: flat ? 0 : 0.1, polygonOffset: flat, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const geos = [];
  for (const w of walls) {
    if (w.type !== 'solid' && w.type !== 'window') continue;
    const horiz = Math.abs(w.z1 - w.z2) < 1e-6;
    const a0 = horiz ? Math.min(w.x1, w.x2) : Math.min(w.z1, w.z2), a1 = horiz ? Math.max(w.x1, w.x2) : Math.max(w.z1, w.z2), fixed = horiz ? w.z1 : w.x1;
    for (const sd of [-1, 1]) {
      const face = fixed + sd * (w.t / 2), probe = face + sd * 0.05;
      for (const [x0, z0, x1, z1] of rects) {
        const inBand = horiz ? probe > z0 && probe < z1 : probe > x0 && probe < x1;
        if (!inBand) continue;
        const lo = Math.max(a0, horiz ? x0 : z0), hi = Math.min(a1, horiz ? x1 : z1);
        if (hi - lo < 0.05) continue;
        const g = new THREE.BoxGeometry(horiz ? hi - lo : o.depth, o.h, horiz ? o.depth : hi - lo);
        const c = face + sd * o.depth / 2;
        g.translate(horiz ? (lo + hi) / 2 : c, o.h / 2, horiz ? c : (lo + hi) / 2);
        geos.push(g);
      }
    }
  }
  if (!geos.length) return;
  for (const g of geos) { const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.name = 'baseboard'; scene.add(m); }
  window.__look = Object.assign(window.__look || {}, { baseboards: geos.length });
}

/* 창밖 사진(look.windowViews) — 창 밖 일정 거리에 실제 사진 판을 세워요. 사진은 창 안쪽에서 보이는 배경만 잘라 만든 것
   (photos/views/*.webp, 좌우·아래 가장자리가 투명). 판 밖은 layout 의 backdrop(하늘 + 도시)이 그대로 보여요.
   windowViews: [ { src: 'photos/views/seoul_north.webp', side: 'north', at: 0.92, dist: 3, w: 5.2, h: 7.5, y: -3, bright: 1.1 } ]
     side : 창이 있는 벽 방향(north 는 z=0 바깥, west 는 x=0 바깥) · at: 판 가운데(north 는 x, west 는 z)
     dist : 벽에서 떨어진 거리(m) · w,h: 판 크기(m) · y: 판 아래끝 높이(바닥 0, 밖의 땅은 더 아래) · bright: 밝기 */
function windowViews(list, scene) {
  const loader = new THREE.TextureLoader();
  for (const v of list) {
    const o = { dist: 3, w: 5, h: 7.5, y: -3, bright: 1.1, ...v };
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, color: new THREE.Color().setScalar(o.bright) });
    loader.load(o.src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.needsUpdate = true; });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), mat);
    const cy = o.y + o.h / 2;
    if (o.side === 'west') { m.position.set(-o.dist, cy, o.at); m.rotation.y = Math.PI / 2; }
    else if (o.side === 'east') { m.position.set(o.dist, cy, o.at); m.rotation.y = -Math.PI / 2; }   // east/south 는 dist 대신 벽 좌표 + 거리로 at·dist 지정
    else if (o.side === 'south') { m.position.set(o.at, cy, o.dist); m.rotation.y = Math.PI; }
    else { m.position.set(o.at, cy, -o.dist); }
    m.name = 'windowView'; m.userData.noCollide = true; m.renderOrder = -1;
    scene.add(m);
  }
}

// 창밖 풍경 판(backdrop 의 하늘·도시, windowViews 사진 — 둘 다 fog:false 인 MeshBasicMaterial)을 3D 보기에서 숨겨요.
function outsideOnlyWhenWalking(scene) {
  const planes = [];
  scene.traverse((m) => { if (m.isMesh && m.material?.isMeshBasicMaterial && m.material.fog === false && m.geometry?.type === 'PlaneGeometry') planes.push(m); });
  if (!planes.length) return;
  let last = null;
  const loop = () => {
    requestAnimationFrame(loop);
    const show = !document.body.classList.contains('orbit');
    if (show !== last) { for (const m of planes) m.visible = show; last = show; }
  };
  requestAnimationFrame(loop);
  window.__look = Object.assign(window.__look || {}, { outsidePlanes: planes.length });
}

/* 창 사진(look.windowImages) — 창 유리 바로 바깥에 창 크기에 꼭 맞춘 사진을 붙여, 사진 속 창처럼 바깥이 보여요.
   windowImages: [ { src: 'photos/views/seoul_win_north.webp', side: 'north', from: 0.22, to: 1.62, wall: 0, sill: 0.1, head: 2.55, inset: 0.05 } ]
     side : 창이 있는 벽(north = z 가 wall 인 가로벽, west = x 가 wall 인 세로벽) · from/to: 창 범위(north 는 x, west 는 z)
     sill/head : 창 아래·위 높이 · inset: 벽 바깥면에서 안쪽으로 들어온 거리(유리 바로 바깥) · bright: 밝기 */
function windowImages(list, scene) {
  const loader = new THREE.TextureLoader();
  for (const v of list) {
    const o = { wall: 0, sill: 0.1, head: 2.55, inset: 0.05, bright: 1, ...v };
    const mat = new THREE.MeshBasicMaterial({ fog: false, toneMapped: false, color: new THREE.Color().setScalar(o.bright) });
    loader.load(o.src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; mat.map = t; mat.needsUpdate = true; });
    const len = Math.abs(o.to - o.from), c = (o.from + o.to) / 2, h = o.head - o.sill;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat), y = o.sill + h / 2;
    if (o.side === 'west') { m.position.set(o.wall + o.inset, y, c); m.rotation.y = Math.PI / 2; }
    else if (o.side === 'east') { m.position.set(o.wall - o.inset, y, c); m.rotation.y = -Math.PI / 2; }
    else if (o.side === 'south') { m.position.set(c, y, o.wall - o.inset); m.rotation.y = Math.PI; }
    else { m.position.set(c, y, o.wall + o.inset); }
    m.name = 'windowImage'; m.userData.noCollide = true;
    scene.add(m);
  }
}

/* 모서리 그늘(look.cornerShade) — 벽 윗부분·천장 가장자리·벽 아랫부분에 부드럽게 사라지는 어두운 띠를 붙여요.
   cornerShade: { ceiling: { size: 0.45, strength: 0.22 }, floor: { size: 0.18, strength: 0.12 } }
     size: 띠 폭(m), strength: 모서리에서의 어둡기(0~1). 막힌 벽(solid)에만, 문 자리는 비움 */
function cornerShade(opt, walls, H, scene) {
  const o = { ceiling: { size: 0.45, strength: 0.22 }, floor: { size: 0.18, strength: 0.12 }, ...opt };
  const grad = (strength) => {   // 위(v=1)가 진하고 아래로 사라지는 세로 그라데이션
    const c = document.createElement('canvas'); c.width = 2; c.height = 64; const k = c.getContext('2d'), g = k.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, `rgba(40,38,36,${strength})`); g.addColorStop(0.35, `rgba(40,38,36,${strength * 0.45})`); g.addColorStop(1, 'rgba(40,38,36,0)');
    k.fillStyle = g; k.fillRect(0, 0, 2, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const mk = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mc = o.ceiling ? mk(grad(o.ceiling.strength)) : null, mf = o.floor ? mk(grad(o.floor.strength)) : null;
  const group = new THREE.Group(); group.name = 'cornerShade';
  const add = (mat, w, h, pos, rotY, rotX = 0, flip = false) => {
    const g = new THREE.PlaneGeometry(w, h); if (flip) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); }
    const m = new THREE.Mesh(g, mat); m.position.copy(pos); m.rotation.set(rotX, rotY, 0, 'YXZ'); m.renderOrder = 1; m.userData.noCollide = true; group.add(m);
  };
  for (const w of walls) {
    if (w.type !== 'solid') continue;
    const horiz = Math.abs(w.z1 - w.z2) < 1e-6, len = horiz ? Math.abs(w.x2 - w.x1) : Math.abs(w.z2 - w.z1);
    if (len < 0.1) continue;
    const c = horiz ? (w.x1 + w.x2) / 2 : (w.z1 + w.z2) / 2, fixed = horiz ? w.z1 : w.x1;
    for (const sd of [-1, 1]) {
      const face = fixed + sd * (w.t / 2 + 0.002), rotY = horiz ? (sd > 0 ? 0 : Math.PI) : (sd > 0 ? Math.PI / 2 : -Math.PI / 2);
      const at = (y, off = 0) => horiz ? new THREE.Vector3(c, y, face + sd * off) : new THREE.Vector3(face + sd * off, y, c);
      if (mc) {
        const s2 = o.ceiling.size;
        add(mc, len, s2, at(H - s2 / 2), rotY);                                          // 벽 윗부분(천장 쪽이 진함)
        add(mc, len, s2, at(H - 0.002, s2 / 2), rotY, Math.PI / 2, true);                  // 천장 가장자리(벽 쪽이 진함)
      }
      if (mf) { const s3 = o.floor.size; add(mf, len, s3, at(s3 / 2), rotY, 0, true); }   // 벽 아랫부분(바닥 쪽이 진함)
    }
  }
  scene.add(group);
  window.__look = Object.assign(window.__look || {}, { cornerShade: group.children.length });
}
