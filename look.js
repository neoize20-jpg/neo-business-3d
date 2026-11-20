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

export function applyLook(look, { renderer, scene }) {
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
  window.__look = { floorMaterials: mats.size };   // 확인용(바닥 재질 수, 반사 촬영 횟수)
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
