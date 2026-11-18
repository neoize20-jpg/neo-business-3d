// 절차적(코드로 생성) 타일 텍스처 — 외부 이미지 없이 사진 속 재질을 흉내 냄
import * as THREE from 'three';

let seed = 1337;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// 타일링되는 value noise
function makeNoise(n) {
  const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd();
  const sm = t => t * t * (3 - 2 * t);
  return (x, y) => { // x,y in grid units, wraps at n
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = (i, j) => g[((j % n + n) % n) * n + ((i % n + n) % n)];
    const v00 = a(xi, yi), v10 = a(xi + 1, yi), v01 = a(xi, yi + 1), v11 = a(xi + 1, yi + 1);
    return (v00 * (1 - xf) + v10 * xf) * (1 - yf) + (v01 * (1 - xf) + v11 * xf) * yf;
  };
}
function fbm(noise, x, y, oct, base) { let v = 0, amp = 0.5, f = base, tot = 0; for (let o = 0; o < oct; o++) { v += amp * noise(x * f, y * f); tot += amp; amp *= 0.5; f *= 2; } return v / tot; }

function canvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
function toTex(c, repeatM, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  t.repeat.set(1 / repeatM, 1 / repeatM); return t;
}
// 높이맵(0..1 배열) → 노멀맵 캔버스 (타일링)
function normalCanvas(h, size, strength) {
  const c = canvas(size), g = c.getContext('2d'), img = g.createImageData(size, size), d = img.data;
  const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    let nx = -dx, ny = -dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * size + x) * 4; d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}
function field(size, fn) { // fn(x,y)->[r,g,b,height,rough]
  const col = canvas(size), cg = col.getContext('2d'), ci = cg.createImageData(size, size);
  const rough = canvas(size), rg = rough.getContext('2d'), ri = rg.createImageData(size, size);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, gg, b, hh, ro] = fn(x, y); const i = (y * size + x) * 4;
    ci.data[i] = r; ci.data[i + 1] = gg; ci.data[i + 2] = b; ci.data[i + 3] = 255;
    const rv = Math.max(0, Math.min(255, ro * 255)); ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = rv; ri.data[i + 3] = 255;
    h[y * size + x] = hh;
  }
  cg.putImageData(ci, 0, 0); rg.putImageData(ri, 0, 0); return { col, rough, h };
}

export function makeTextures(Q) {
  const S = Q === 'high' ? 1024 : 512, s2 = S / 2;
  const T = {};
  // 1) 바닥: 밝은 회색 스페클 비닐 타일(600mm), 텍스처 1장 = 1.2m (2×2 타일)
  {
    const n = makeNoise(16);
    const speck = new Float32Array(S * S), speckC = new Uint8Array(S * S * 3);
    const count = Math.round(S * S * 0.0075 * (1024 / S) * (1024 / S) * (S / 1024) * (S / 1024));
    const k0 = S / 1024;   // 해상도와 무관하게 칩 크기(mm) 유지
    for (let k = 0; k < count; k++) {
      const x = Math.floor(rnd() * S), y = Math.floor(rnd() * S), r = Math.max(1, Math.round((1.2 + rnd() * rnd() * 3.5) * k0));
      const t = rnd(); const gv = 120 + rnd() * 45; const c = t < 0.6 ? [gv, gv + 2, gv + 4] : t < 0.85 ? [238, 238, 235] : [176, 166, 150];
      for (let dy = -r + 1; dy < r; dy++) for (let dx = -r + 1; dx < r; dx++) { if (dx * dx + dy * dy > (r - 0.5) * (r - 0.5) + 0.5) continue; const xx = (x + dx + S) % S, yy = (y + dy + S) % S, i = yy * S + xx; speck[i] = t < 0.5 ? -1 : 1; speckC.set(c, i * 3); }
    }
    const f = field(S, (x, y) => {
      const v = fbm(n, x / S * 16, y / S * 16, 4, 1) - 0.5; const i = y * S + x;
      let r = 196 + v * 22, g = 198 + v * 22, b = 199 + v * 20;
      if (speck[i]) { r = r * 0.2 + speckC[i * 3] * 0.8; g = g * 0.2 + speckC[i * 3 + 1] * 0.8; b = b * 0.2 + speckC[i * 3 + 2] * 0.8; }
      const seam = (x % s2 < 2 || y % s2 < 2) ? 1 : 0; if (seam) { r -= 16; g -= 16; b -= 15; }
      return [r, g, b, (speck[i] ? 0.4 : 0) - seam * 0.8 + v * 0.3, 0.66 + v * 0.2 + seam * 0.15];
    });
    T.floor = { map: toTex(f.col, 1.2), roughnessMap: toTex(f.rough, 1.2, false), normalMap: toTex(normalCanvas(f.h, S, 1.2), 1.2, false) };
  }
  // 2) 벽 페인트: 아주 미세한 요철(오렌지필)
  {
    const n = makeNoise(64), m = makeNoise(8), sz = S / 2;
    const f = field(sz, (x, y) => { const v = n(x / sz * 64, y / sz * 64), w = m(x / sz * 8, y / sz * 8) - 0.5; const c = 241 + w * 5; return [c, c, c - 2, v, 0.88]; });
    T.paint = { map: toTex(f.col, 1.0), normalMap: toTex(normalCanvas(f.h, sz, 0.9), 1.0, false) };
  }
  // 3) 천장 흡음 텍스타일(600mm 그리드 + 핀홀), 텍스처 1장 = 1.2m
  {
    const n = makeNoise(32);
    const holes = new Float32Array(S * S);
    for (let k = 0; k < S * S * 0.03; k++) { const x = Math.floor(rnd() * S), y = Math.floor(rnd() * S); holes[y * S + x] = 0.5 + rnd() * 0.5; }
    const f = field(S, (x, y) => {
      const i = y * S + x, v = fbm(n, x / S * 32, y / S * 32, 3, 1) - 0.5;
      let c = 236 + v * 10 - holes[i] * 55; let hh = -holes[i] + v * 0.4;
      const gx = Math.min(x % s2, s2 - (x % s2)), gy = Math.min(y % s2, s2 - (y % s2)), gd = Math.min(gx, gy);
      if (gd < S / 220) { c = 246; hh = 1.2; } else if (gd < S / 140) { c -= 18; hh = -0.8; }
      return [c, c, c - 3, hh, 0.95];
    });
    T.ceiling = { map: toTex(f.col, 1.2), normalMap: toTex(normalCanvas(f.h, S, 1.0), 1.2, false) };
  }
  // 4) 밝은 오크 원목(결은 세로 방향), 텍스처 1장 = 0.6m
  {
    const n = makeNoise(32), sz = S / 2;
    const f = field(sz, (x, y) => {
      const u = x / sz, v = y / sz; const w = fbm(n, u * 4, v * 1, 4, 1);
      const ring = Math.sin((u * 26 + w * 6) * Math.PI * 2) * 0.5 + 0.5; const fine = n(u * 160, v * 6);
      const k = 0.86 + ring * 0.1 + fine * 0.06;
      return [216 * k, 188 * k, 146 * k, ring * 0.6 + fine * 0.4, 0.62 + ring * 0.12];
    });
    T.oak = { map: toTex(f.col, 0.6), roughnessMap: toTex(f.rough, 0.6, false), normalMap: toTex(normalCanvas(f.h, sz, 0.6), 0.6, false) };
  }
  // 5) 패브릭 직조(색은 재질 color로 곱해짐), 텍스처 1장 = 0.12m
  {
    const sz = 256, n = makeNoise(32);
    const f = field(sz, (x, y) => {
      const a = Math.sin(x / sz * Math.PI * 2 * 24) * 0.5 + 0.5, b = Math.sin(y / sz * Math.PI * 2 * 24) * 0.5 + 0.5;
      const over = ((Math.floor(x / sz * 24) + Math.floor(y / sz * 24)) % 2) ? a : b; const nz = n(x / sz * 32, y / sz * 32);
      const c = 210 + over * 35 + nz * 10; return [c, c, c, over * 0.8 + nz * 0.2, 0.95];
    });
    T.fabric = { map: toTex(f.col, 0.12), normalMap: toTex(normalCanvas(f.h, sz, 1.6), 0.12, false) };
  }
  // 6) 흰 대리석(원형 테이블 상판), 텍스처 1장 = 0.9m
  {
    const n = makeNoise(16), sz = S / 2;
    const f = field(sz, (x, y) => {
      const u = x / sz, v = y / sz; const w = fbm(n, u * 3, v * 3, 5, 1);
      const vein = Math.abs(Math.sin((u * 2 + v * 3 + w * 4) * Math.PI)); const line = Math.pow(1 - vein, 14);
      const c = 238 - line * 70 - (1 - w) * 8; return [c, c - 1, c - 4, -line, 0.25 + line * 0.2];
    });
    T.marble = { map: toTex(f.col, 0.9), roughnessMap: toTex(f.rough, 0.9, false) };
  }
  // 7) 짙은 상판(미세 노이즈)
  {
    const n = makeNoise(64), sz = 256;
    const f = field(sz, (x, y) => { const v = n(x / sz * 64, y / sz * 64); const c = 40 + v * 10; return [c, c + 1, c + 4, v, 0.38 + v * 0.15]; });
    T.dark = { map: toTex(f.col, 0.5), roughnessMap: toTex(f.rough, 0.5, false) };
  }
  // 8) 바닥 그림자(블롭) — 가구 밑 은은한 접지 그림자
  {
    const c = canvas(128), g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); T.blob = t;
  }
  return T;
}

export function textTexture(txt, w = 256, h = 48, bg = '#1d2026', fg = '#fff', font = '700 28px Pretendard, sans-serif') {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
