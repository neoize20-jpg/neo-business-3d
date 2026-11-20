/* 실내 조명·색감 보정 (look.js)
   layout.js 에 look: { ... } 가 있는 교육장에만 적용돼요. 없으면 아무것도 바꾸지 않아요(기존 화면 그대로).
   app.js 의 장면이 다 만들어진 뒤 한 번 실행되고, 조명 세기·방향과 색 처리만 바꿔요. 공간·가구·기능은 그대로예요.

   look: {
     toneMapping: 'aces',  // 'aces'(기존 방식, 흰 벽과 검은 가구의 대비가 사진에 가까움) 또는 'agx'(더 부드럽고 회색빛)
     exposure: 1.3,        // 전체 밝기 (기존 0.88)
     environment: 0.6,     // 은은한 반사광(주변 환경) 세기 (기존 0.5)
     hemisphere: { sky: '#ffffff', ground: '#e9e6e0', intensity: 0.8 },   // 천장·벽에서 튕긴 듯한 고른 빛 (기존 0.5). 너무 높이면 검은 의자가 회색으로 떠요
     ceiling: { intensity: 2.2, tilt: 8, color: '#fffdf8' }               // 천장 LED처럼 위에서 내려오는 주 조명(그림자가 가구 바로 아래) (기존 햇빛 0.95)
   }                       // tilt: 수직에서 기울인 각도(°). 0 이면 완전히 위에서 아래로.
*/
import * as THREE from 'three';

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
}
