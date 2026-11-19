/* =====================================================================
   부산 교육장 — 공간 설정 파일 (sites/busan/layout.js)
   공식 안내도(9F, busan_guide.png) + 실사진 3장 기준.
   축척: 4인책상 한 줄(책상 1.8m × 2 = 3.6m)이 안내도 약 120px → 0.03 m/px (안내도 1024px 폭 기준).
   기준점(0,0) = 건물 북서쪽. x = 동쪽, z = 남쪽, 단위 m.  rot: 0 = 북쪽, 90 = 서쪽, 180 = 남쪽, -90 = 동쪽.
   안내도 px → m: x = (px-200)*0.03, z = (py-208)*0.03 + 2.0   (북쪽 2m 는 입구 앞 엘리베이터 홀, 추정)
   - 건물(안내도 외곽): 20.7 × 11.52m (+ 북쪽 홀 2m), 천장 2.7m
   - 입구: 서쪽 벽 화장실 옆(사용자 표시) → 서쪽 복도 북쪽 → 북쪽 복도 → 교육장 문(교육장 서쪽 벽 북쪽 끝)
   - 교육장: x10.0–20.7, z2.0–13.52. 스크린 = 서쪽 벽, 책상 = 북쪽·남쪽 2구역 × 5줄(4인, 사진 기준), 가운데쯤 흰 사각 기둥 2개(x15.4–16.4)
   - 강사대기실 · 직원 사무실 = 출입 불가
   ※ 안내도 비율로 잡은 추정값이에요. 실측값을 받으면 숫자만 바꾸면 됩니다.
   ===================================================================== */
window.LAYOUT = {
  building: { name: '부산 교육장', width: 20.7, depth: 13.52, ceiling: 2.7, eye: 1.6, wall: { exterior: 0.24, interior: 0.14, thick: 0.30 },
              floorPattern: 'tile', floorColor: '#8a7a6b', floorTile: 0.45, ceilingTex: 'acoustic', baseboard: { color: '#3a3533', h: 0.08 } },
  photoDir: 'sites/busan/photos/',
  backdrop: [ { side:'east', dist:12 }, { side:'south', dist:12 } ],   // 동쪽·남쪽 창밖 하늘 + 도시

  rooms: [
    { id:'classroom', name:'교육장', en:'Education Center', rect:[10.0, 2.0, 20.7, 13.52], floor:'floor',
      label:[15.4, 8.24], jump:{ x:19.6, z:12.6, look:[10.0, 7.0] },
      card:{ photos:[],
             desc:'부산 교육장. 서쪽 벽에 스크린과 양옆 유리 화이트보드, 천장 빔프로젝트가 있고, 동쪽은 연속 창, 남쪽은 동쪽 끝 통창 2칸이에요. 흰 접이식 책상이 북쪽·남쪽 2구역에 5줄씩(줄마다 4인, 40석), 가운데 통로에 흰 사각 기둥이 있어요.',
             services:['스크린','빔프로젝트','유리 화이트보드','냉난방'] } },
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[-2.6, 4.0, 0, 7.0], floor:'floor',
      label:[-1.3, 5.0], jump:{ x:-2.0, z:5.57, look:[2.5, 4.9] },
      card:{ photos:[], desc:'9층 입구(서쪽 벽, 화장실 옆 유리문)예요. 엘리베이터에서 내려 문으로 들어와 초록 경로를 따라 서쪽 복도를 북쪽으로, 북쪽 복도를 동쪽으로 가면 교육장 문이에요.' } },
    { id:'corridor', name:'복도', en:'Corridor', small:true, rect:[0, 2.0, 10.0, 3.62], rects:[[0, 3.62, 2.64, 7.01]], floor:'floor',
      label:[6.6, 2.8], jump:{ x:4.2, z:2.8, look:[10.0, 2.8] }, card:{ photos:[], desc:'입구에서 교육장까지 이어지는 복도예요. 화장실 표시는 입구 앞 홀에 있어요.' } },
    { id:'instructor', name:'강사대기실', en:'Instructor Room', small:true, noEntry:true, rect:[4.65, 3.62, 10.0, 5.66], floor:'floor', label:[7.3, 4.64],
      jump:{ x:7.3, z:4.6, look:[10.0, 4.6] }, card:{ photos:[], desc:'복도와 교육장 사이의 강사대기실 (출입 불가).' } },
    { id:'office', name:'직원 사무실', en:'Staff Office', small:true, noEntry:true, rect:[0, 7.01, 10.0, 13.52], rects:[[2.64, 5.66, 10.0, 7.01], [2.64, 3.62, 4.65, 5.66]], floor:'floor', label:[5.0, 9.9],
      jump:{ x:5.0, z:9.9, look:[10.0, 9.9] }, card:{ photos:[], desc:'건물 남서쪽 직원 사무실 (출입 불가).' } }
  ],

  start: { mode:'orbit', room:'entrance' },
  // 입구 밖 엘리베이터 홀(건물 서쪽, 크기 추정): 천장 + 벽
  outside: [[-2.6, 4.0, 0, 7.0]], outsideWalls: true,

  // 바닥 동선: 서쪽 입구 → 서쪽 복도 북쪽 → 북쪽 복도 동쪽 → 교육장 문(사용자 표시 11/19)
  routes: [
    { color:'#2fa84f', points:[[-1.3, 5.57], [1.3, 5.57], [1.3, 2.8], [10.9, 2.8], [11.6, 3.4]] }
  ],

  walls: [
    // 바깥벽
    { from:[0, 0], to:[20.7, 0], type:'solid', outer:true },
    { from:[0, 0], to:[0, 13.52], type:'solid', outer:true,
      openings:[ { at:5.57, width:1.4, door:'glass', double:true, entrance:true, frame:'white', open:true } ] },   // 사용자 표시(빨간 박스): 서쪽 벽 입구(화장실 옆)
    // 동쪽 · 남쪽: 연속 창(사진: 흰 스팬드럴 + 작은 젖힘창 띠 + 큰 고정창, 회색 알루미늄)
    { from:[20.7, 2.0], to:[20.7, 13.52], type:'window', outer:true, style:'curtain', bay:1.5 },
    // 남쪽: 사용자 표시(초록 박스) — 기둥 동쪽에 통창 2칸만, 나머지는 흰 벽
    { from:[0, 13.52], to:[16.57, 13.52], type:'solid', outer:true },
    { from:[16.57, 13.52], to:[18.41, 13.52], type:'window', outer:true, style:'curtain', bay:1.84 },
    { from:[18.41, 13.52], to:[18.74, 13.52], type:'solid', outer:true },
    { from:[18.74, 13.52], to:[20.53, 13.52], type:'window', outer:true, style:'curtain', bay:1.79 },
    { from:[20.53, 13.52], to:[20.7, 13.52], type:'solid', outer:true },
    // 북쪽 벽: 막힌 벽(비상구 표시만 — 비상구)
    { from:[0, 2.0], to:[20.7, 2.0], type:'solid', outer:true },
    // 북쪽 복도 남쪽 벽 (강사대기실·사무실과 구분)
    { from:[2.64, 3.62], to:[10.0, 3.62], type:'solid',
      openings:[ { at:3.58, width:0.9, door:'wood', frame:'white', hinge:'start', swing:-88, locked:true } ] },   // 사용자 표시(빨간 박스): 북쪽 복도 → 직원 사무실 문(출입 불가)
    // 서쪽 복도 동쪽 벽 + 직원 사무실 문(추정 위치, 출입 불가)
    { from:[2.64, 3.62], to:[2.64, 7.01], type:'solid' },
    { from:[0, 7.01], to:[2.64, 7.01], type:'solid' },   // 서쪽 복도 끝
    // 강사대기실
    { from:[4.65, 3.62], to:[4.65, 5.66], type:'solid' },
    { from:[4.65, 5.66], to:[10.0, 5.66], type:'solid' },
    // 교육장 서쪽(스크린) 벽: 북쪽 끝(z2.25–3.25)에 교육장 문
    { from:[10.0, 2.0], to:[10.0, 13.52], type:'solid',
      openings:[ { at:2.75, width:1.0, door:'wood', vision:'strip', frame:'white', casing:0.06, hinge:'start', swing:-88 } ] }   // 사용자 표시(빨간 박스): 북쪽 복도 끝 = 교육장 문(E 로 열기)
  ],

  // 북쪽 2m 띠 중 입구 앞 홀(x1.5–6.0)만 걸을 수 있음 / 교육장 가운데쯤 흰 사각 기둥 2개(x15.4–16.4)(안내도 회색 사각형, 사진)
  columns: [
    { rect:[0, 0, 20.7, 2.0], block:true },
    { rect:[15.4, 7.74, 16.4, 8.74] },     // 사용자 표시(회색 박스): 앞(스크린 쪽)으로 옮김
    { rect:[15.4, 12.42, 16.4, 13.40] }
  ],

  ceiling: {
    panels: [],
    strips: [   // 교육장: 2등용 형광등 기구(1.2×0.3m), 긴 방향 = 동서, 5줄 × 4개 / 복도·방: 일자형
      { x:11.6, z:3.5, len:1.2, w:0.3, rot:90, twin:true }, { x:14.1, z:3.5, len:1.2, w:0.3, rot:90, twin:true }, { x:16.6, z:3.5, len:1.2, w:0.3, rot:90, twin:true }, { x:19.1, z:3.5, len:1.2, w:0.3, rot:90, twin:true },
      { x:11.6, z:5.85, len:1.2, w:0.3, rot:90, twin:true }, { x:14.1, z:5.85, len:1.2, w:0.3, rot:90, twin:true }, { x:16.6, z:5.85, len:1.2, w:0.3, rot:90, twin:true }, { x:19.1, z:5.85, len:1.2, w:0.3, rot:90, twin:true },
      { x:11.6, z:8.24, len:1.2, w:0.3, rot:90, twin:true }, { x:14.1, z:8.24, len:1.2, w:0.3, rot:90, twin:true }, { x:16.6, z:8.24, len:1.2, w:0.3, rot:90, twin:true }, { x:19.1, z:8.24, len:1.2, w:0.3, rot:90, twin:true },
      { x:11.6, z:10.6, len:1.2, w:0.3, rot:90, twin:true }, { x:14.1, z:10.6, len:1.2, w:0.3, rot:90, twin:true }, { x:16.6, z:10.6, len:1.2, w:0.3, rot:90, twin:true }, { x:19.1, z:10.6, len:1.2, w:0.3, rot:90, twin:true },
      { x:11.6, z:12.95, len:1.2, w:0.3, rot:90, twin:true }, { x:14.1, z:12.95, len:1.2, w:0.3, rot:90, twin:true }, { x:16.6, z:12.95, len:1.2, w:0.3, rot:90, twin:true }, { x:19.1, z:12.95, len:1.2, w:0.3, rot:90, twin:true },
      { x:-1.3, z:5.5, len:1.2, w:0.1, rot:0 },
      { x:2.0, z:2.8, len:1.2, w:0.1, rot:90 }, { x:5.0, z:2.8, len:1.2, w:0.1, rot:90 }, { x:8.0, z:2.8, len:1.2, w:0.1, rot:90 },
      { x:1.3, z:5.2, len:1.2, w:0.1, rot:0 },
      { x:7.3, z:4.64, len:1.2, w:0.1, rot:90 },
      { x:3.0, z:9.0, len:1.2, w:0.1, rot:90 }, { x:7.0, z:9.0, len:1.2, w:0.1, rot:90 }, { x:3.0, z:11.8, len:1.2, w:0.1, rot:90 }, { x:7.0, z:11.8, len:1.2, w:0.1, rot:90 }
    ],
    downlights: [   // 원형 매입 다운라이트(사진): 형광등 사이
      [12.85, 4.65], [15.35, 4.65], [17.85, 4.65], [12.85, 7.05], [15.35, 7.05], [17.85, 7.05],
      [12.85, 9.45], [15.35, 9.45], [17.85, 9.45], [12.85, 11.8], [15.35, 11.8], [17.85, 11.8], [10.7, 6.0], [10.7, 10.4]
    ],
    projectors: [ { x:14.2, z:8.2, aim:[10.0, 8.0], drop:0.35, color:'white', label:'빔프로젝트' } ],   // 사진2(기둥 바로 앞)·사진3(카메라 맞춤 역투영)으로 추정: 시계 기둥 서쪽 약 2m
    aircon: [[12.85, 5.85, 0.95], [12.85, 10.6, 0.95], [17.85, 5.85, 0.95], [17.85, 10.6, 0.95]]   // 4방향 카세트(사진, 개수·위치 추정)
  },

  /* 교육장 책상 배치 (책상 배치 바꾸기 버튼 / B 키). 스크린이 서쪽이라 책상은 rot:90(서쪽을 봄) */
  deskLayouts: {
    start: 0,
    list: [
      { id:'lecture', name:'강의식', items:[
        // 사진 1·2·3 기준: 구역마다 5줄, 줄마다 1.5m 테이블 2개(2인용 플립탑, 크기 추정 1.5×0.5m) = 40석. 줄 간격 약 1.3m, 동쪽 창가(x≈18.4–20.7)는 빈 바닥
        { type:'array', xs:[12.6, 13.9, 15.2, 16.5, 17.8], zs:[5.13, 6.63, 9.86, 11.36],
          item:{ type:'deskPair', w:1.5, d:0.5, chairs:2, style:'training', tag:false, chairStyle:'nest', tuck:0.12, rot:90 } }
      ] },
      { id:'group', name:'조별', items:[
        { type:'array', xs:[12.8, 15.5, 18.2], zs:[4.6, 10.4], item:{ type:'island', len:1.5, dd:0.5, perSide:2, style:'training', chairStyle:'nest', basket:true, tents:true, rot:90 } }
      ] }
    ]
  },

  /* 장비 안내(마우스를 올리면 안내 카드) — '(예: …) — 수정 필요' 는 예시 문구예요 */
  equipment: [
    { id:'bs_projector', name:'빔프로젝트', room:'교육장', box:[13.9, 7.9, 14.5, 8.5, 2.1, 2.7],
      lines:['연결 케이블: (예: HDMI) — 수정 필요', '리모컨 위치: (예: 강사 책상) — 수정 필요'] },
    { id:'bs_screen', name:'스크린', room:'교육장', box:[10.1, 6.75, 10.4, 9.25, 1.0, 2.7], label:true, labelAt:[10.25, 2.62, 8.0], lines:['스크린 내리기/올리기: (예: 벽 스위치) — 수정 필요'] },
    { id:'bs_board', name:'유리 화이트보드', room:'교육장', boxes:[[10.05, 5.4, 10.25, 6.8, 0.8, 2.2], [10.05, 9.3, 10.25, 11.8, 0.8, 2.2]], lines:['마커·지우개: (예: 레지 위 비치) — 수정 필요'] },
    { id:'bs_ac', name:'에어컨', room:'교육장', boxes:[[12.37, 5.37, 13.33, 6.33, 2.5, 2.75], [12.37, 10.12, 13.33, 11.08, 2.5, 2.75], [17.37, 5.37, 18.33, 6.33, 2.5, 2.75], [17.37, 10.12, 18.33, 11.08, 2.5, 2.75]], lines:['리모컨/조작: (예: 벽 컨트롤러) — 수정 필요'] }
  ],

  furniture: [
    /* --- 서쪽 벽(사진1): 남쪽 넓은 유리 화이트보드 · 스크린 · 북쪽 유리 화이트보드 · 흰 문(강사대기실) --- */
    { type:'ceilingScreen', x:10.25, z:8.0, w:2.4, h:1.6, rot:-90 },
    { type:'whiteboard', x:10.09, z:10.55, w:2.5, rot:-90, style:'glass' },
    { type:'whiteboard', x:10.09, z:6.1, w:1.4, rot:-90, style:'glass' },
    { type:'desk', x:10.75, z:12.0, w:1.4, d:0.55, rot:90 },      // 강사 책상(사진1 왼쪽, 추정)
    { type:'chair', x:11.3, z:12.0, rot:90 },
    { type:'clock', x:15.39, z:8.24, rot:90, y:2.1 },             // 가운데 기둥 서쪽 면 벽시계(사진2)

    /* --- 비상구 유도등 + 소화기 (안내도) --- */
    { type:'exitSign', x:3.73, z:2.14, y:2.3, rot:180 },          // 북쪽 벽 비상구 표시(안내도)
    { type:'exitSign', x:10.08, z:2.75, y:2.35, rot:-90 },          // 교육장 문 위(사진1)
    { type:'extinguisher', x:4.75, z:2.3 },
    { type:'extinguisher', x:11.9, z:2.3 },
    { type:'extinguisher', x:10.2, z:13.2 },
    { type:'extinguisher', x:4.95, z:3.95 },

    /* --- 입구 앞 홀(추정): 엘리베이터 / 서쪽 복도 끝 화장실 --- */
    { type:'elevator', x:-2.54, z:5.5, rot:-90, floor:9 },        // 서쪽 홀 엘리베이터(추정)
    { type:'restroom', x:-1.3, z:4.04, rot:180 }                  // 화장실 표시: 입구 옆 홀 북쪽 벽
  ]
};
