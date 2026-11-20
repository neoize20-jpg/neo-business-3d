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

  // 4) 바닥 반사: 실제 공간(천장 LED·벽·가구)을 서 있는 자리에서 한 번 찍어 바닥에 비춰요.
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
