/* =====================================================================
   대전 교육장 — 공간 설정 파일 (sites/daejeon/layout.js)
   사용자 도면(11/19, 534×277px) 기준: 교육장 윗부분 px x153–348 = 15.2m → 0.078 m/px.
   기준점(0,0) = 도면 px (81, 23) = 건물 북서쪽 모서리. x = 동쪽, z = 남쪽, 단위 m.
   rot: 0 = 북쪽, 90 = 서쪽, 180 = 남쪽, -90 = 동쪽.  (px → m: x=(px-81)*0.078, z=(py-23)*0.078)
   - 건물 전체: 31.36 × 16.15m (px x81–483, y23–230), 천장 2.7m
   - 교육장(빨간 선, L자): 윗부분 x5.62–20.83 z5.30–8.19 + 아랫부분 x3.28–20.83 z8.19–16.15
   - 출입 안내도로(복도): 북쪽 띠 z0–5.30, 서쪽 x0–3.28, 동쪽 x20.83–31.36
   - 북쪽 띠 안의 흰 상자(px x153–348, y50–91) = 다른 공간(투어 제외) → columns 의 label 블록
   - 입구(공식 안내도 10F 기준): 엘리베이터(건물 서쪽 밖 로비) → 서쪽 바깥벽 z3.05–5.05 유리 양문 → 서쪽 복도를 따라 남쪽 → 교육장 북서쪽 문(z8.19)
   - 안내도 명칭: 북쪽 띠 안 상자 = 온라인 교육장, 서쪽 아래 = 강사대기실, 동쪽 = 직원 사무실 (투어는 교육장 중심)
   ※ 도면 비율로 잡은 추정값이에요. 실측값을 받으면 숫자만 바꾸면 됩니다.
   ===================================================================== */
window.LAYOUT = {
  building: { name: '대전 교육장', width: 31.36, depth: 16.15, ceiling: 2.7, eye: 1.6, wall: { exterior: 0.24, interior: 0.14, thick: 0.30 },
              floorColor: '#c8c2b5', ceilingTex: 'acoustic', baseboard: { color: '#8f9296', h: 0.08 } },
  photoDir: 'sites/daejeon/photos/',

  // (11/19 사용자 도면) 건물 윗부분 서쪽 벽은 x3.28 — 그 바깥(x0–3.28, z0–8.19)은 건물 밖. 엘리베이터 앞 얕은 승강장만 걸을 수 있음
  backdrop: [ { side:'south', dist:9 } ],   // 남쪽 창밖 하늘 + 도시

  rooms: [
    { id:'classroom', name:'교육장', en:'Education Center', rect:[3.28, 8.19, 20.83, 16.15], rects:[[5.62, 5.30, 20.83, 8.19]], floor:'floor',
      label:[12.4, 11.2], jump:{ x:7.4, z:13.4, look:[19.9, 10.2] },
      card:{ photos:[],
             desc:'대전 교육장(L자 공간). 동쪽 벽 앞에 천장형 전동 스크린과 양옆 유리 화이트보드, 천장 빔프로젝터가 있고, 남쪽은 큰 창문 4개예요. 흰 접이식 책상 4열 × 4개(32석), 메시 등받이 의자. 북서쪽 벽을 따라 정수기 · 제빙기 · 커피머신이 있어요.',
             services:['전동 스크린','빔프로젝터','유리 화이트보드','스피커','냉난방','정수기','제빙기','커피머신'] } },
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[0.9, 2.75, 3.28, 5.35], floor:'floor',
      label:[1.6, 2.95], jump:{ x:1.45, z:3.98, look:[4.9, 5.2] },
      card:{ photos:[], desc:'10층 엘리베이터에서 내리면 바로 앞(동쪽)이 입구예요. 들어와서 초록 경로를 따라 통로를 남쪽으로 내려가면 교육장 문이에요. 화장실은 엘리베이터 바로 북쪽이에요.' } },
    { id:'passage', name:'통로', en:'Passage', small:true, rect:[3.28, 0, 5.62, 8.19], floor:'floor', label:[4.45, 6.6],
      jump:{ x:4.45, z:4.6, look:[4.45, 9.0] }, card:{ photos:[], desc:'입구에서 교육장 문까지 이어지는 통로예요.' } },
    { id:'road_w', name:'강사대기실', en:'Instructor Room', small:true, noEntry:true, rect:[0, 8.19, 3.28, 16.15], floor:'floor', label:[1.64, 12.2],
      jump:{ x:1.6, z:10.0, look:[1.6, 15.0] }, card:{ photos:[], desc:'교육장 서쪽의 강사대기실 (출입 불가).' } },
    { id:'road_n', name:'북쪽 복도', en:'No entry', small:true, noEntry:true, rect:[5.62, 0, 20.83, 2.11], floor:'floor', label:[12.4, 1.05],
      jump:{ x:6.0, z:1.05, look:[20.0, 1.05] }, card:{ photos:[], desc:'온라인 교육장 앞 북쪽 복도 (출입 불가).' } },
    { id:'road_e', name:'직원 사무실', en:'Staff Office', small:true, noEntry:true, rect:[20.83, 0, 31.36, 16.15], floor:'floor', label:[26.1, 9.5],
      jump:{ x:22.2, z:14.6, look:[20.83, 14.6] }, card:{ photos:[], desc:'교육장 동쪽의 직원 사무실 (출입 불가).' } }
  ],

  start: { mode:'orbit', room:'entrance' },

  // 바닥 동선(사용자 도면 '경로'): 엘리베이터 → 입구(통로 서쪽 벽) → 통로 남쪽 → 교육장 문 / 엘리베이터 → 화장실(북쪽)
  routes: [
    { color:'#2fa84f', points:[[1.25, 3.98], [4.45, 3.98], [4.45, 8.19], [4.45, 9.4]] },
    { color:'#2fa84f', opacity:0.55, points:[[2.3, 3.45], [2.3, 2.85]] }
  ],
  // 출입 불가: 보이지 않는 선(북쪽 복도 동쪽으로 못 감). 강사대기실·직원 사무실·북쪽 복도 문은 locked
  barriers: [ [5.62, 0, 5.72, 2.11] ],

  walls: [
    // 바깥벽
    { from:[3.28, 0], to:[31.36, 0], type:'solid', outer:true },
    { from:[31.36, 0], to:[31.36, 16.15], type:'solid', outer:true },
    { from:[0, 8.19], to:[0, 16.15], type:'solid', outer:true },   // 강사대기실 서쪽 바깥벽
    // 윗부분 서쪽 바깥벽(사용자 도면 x150) + 입구 유리 양문(도면 y128–172) — 바로 바깥에 엘리베이터
    { from:[3.28, 0], to:[3.28, 8.19], type:'solid', outer:true,
      openings:[ { at:3.05, width:2.0, door:'glass', double:true, entrance:true, frame:'white', open:true } ] },
    // 남쪽: 사진 기준 가로로 긴 알루미늄 창 4개(3.3×1.73m, 창대 0.85·윗선 2.58) — 도면 창 위치(px x190–240, 260–310, 390–440, 465–515)를 기둥 사이에 고르게 넓힘
    { from:[0, 16.15], to:[3.88, 16.15], type:'solid', outer:true },
    { from:[3.88, 16.15], to:[7.18, 16.15], type:'window', outer:true, style:'ribbon', sill:0.85, head:2.58, left:0.8, right:0.7 },
    { from:[7.18, 16.15], to:[7.58, 16.15], type:'solid', outer:true },
    { from:[7.58, 16.15], to:[10.88, 16.15], type:'window', outer:true, style:'ribbon', sill:0.85, head:2.58, left:0.8, right:0.7 },
    { from:[10.88, 16.15], to:[13.33, 16.15], type:'solid', outer:true },
    { from:[13.33, 16.15], to:[16.63, 16.15], type:'window', outer:true, style:'ribbon', sill:0.85, head:2.58, left:0.8, right:0.7 },
    { from:[16.63, 16.15], to:[17.03, 16.15], type:'solid', outer:true },
    { from:[17.03, 16.15], to:[20.33, 16.15], type:'window', outer:true, style:'ribbon', sill:0.85, head:2.58, left:0.8, right:0.7 },
    { from:[20.33, 16.15], to:[31.36, 16.15], type:'solid', outer:true },

    // 북쪽 복도 동쪽 끝 문 (px x345, y28–50)
    { from:[20.83, 0], to:[20.83, 2.11], type:'solid',
      openings:[ { at:0.4, width:1.5, door:'glass', double:true, frame:'white', locked:true } ] },   // 출입 불가
    // 교육장 윗부분 서쪽 벽 (정수기·제빙기·커피머신이 붙는 벽)
    { from:[5.62, 5.30], to:[5.62, 8.19], type:'solid' },
    // L자 꺾인 곳(앞으로 튀어나온 흰 벽)의 남쪽 면: 좁은 흰 출입문 + 세로 반투명 비전 띠, 위에 비상구 유도등 (입구 경로 끝, px x123–150)
    { from:[0, 8.19], to:[3.28, 8.19], type:'solid', outer:true },   // 강사대기실 북쪽 바깥벽
    { from:[3.28, 8.19], to:[5.62, 8.19], type:'solid',
      openings:[ { at:4.0, width:0.85, door:'wood', vision:'strip', frame:'white', casing:0.06, hinge:'start', swing:-88 } ] },
    // 아랫부분 서쪽(뒤) 벽 — 실제 사진, 책상에서 보면 왼→오른쪽(남→북):
    //   흰 솔리드 문틀 + 흰 문(0.9×2.1, 반투명 비전창, 레버) + 위 유리 채광창(천장까지) → 반투명 유리 파티션 5칸(0.8m, 가는 흰 멀리언, 문 없음) → 흰 벽 1.2m
    { from:[3.28, 13.39], to:[3.28, 16.15], type:'solid',
      openings:[ { at:13.62, width:0.9, door:'wood', vision:'panel', transom:true, casing:0.14, frame:'white', hinge:'start', swing:88, locked:true } ] },
    { from:[3.28, 9.39], to:[3.28, 13.39], type:'glass', style:'frost', bay:0.8, switchAt:13.0, switchSide:1 },
    { from:[3.28, 8.19], to:[3.28, 9.39], type:'solid' },
    // 동쪽 벽 + 동쪽 복도 문 (px y200–222) — 복도 쪽으로 열림
    { from:[20.83, 5.30], to:[20.83, 16.15], type:'solid',
      openings:[ { at:14.15, width:1.0, door:'wood', frame:'white', hinge:'start', swing:88, locked:true } ] }
  ],

  // 막힌 덩어리: 북쪽 띠 안의 다른 공간(투어 제외), 남쪽 벽 흰 기둥, 남서쪽 모서리 흰 사각 기둥
  columns: [
    { rect:[0, 0, 3.16, 2.75], block:true }, { rect:[0, 5.35, 3.16, 8.19], block:true }, { rect:[0, 2.75, 0.9, 5.35], block:true },   // 건물 밖(엘리베이터 승강장 주변)
    { rect:[5.62, 2.11, 20.83, 5.30], block:true },   // 온라인 교육장(안내도, 투어 제외)
    { rect:[11.54, 15.75, 12.79, 16.03] },
    { rect:[3.35, 15.44, 3.82, 16.03] }
  ],

  ceiling: {
    panels: [],   // 대전은 사각 패널 대신 일자형 LED 라인 조명(사진)
    strips: [   // 교육장: 1.2×0.3m 일자형 LED 트로퍼 3줄 × 7개, 긴 방향 = 남북(스크린과 나란히, rot:0) / 복도·사무실: 일자형 라인
      { x:6.3, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:8.42, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:10.54, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:12.66, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:14.78, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:16.9, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:19.02, z:7.4, len:1.2, w:0.3, rot:0 },
      { x:6.3, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:8.42, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:10.54, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:12.66, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:14.78, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:16.9, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:19.02, z:10.75, len:1.2, w:0.3, rot:0 },
      { x:6.3, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:8.42, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:10.54, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:12.66, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:14.78, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:16.9, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:19.02, z:14.1, len:1.2, w:0.3, rot:0 },
      { x:4.60, z:1.05, len:1.2, w:0.1, rot:90 },
      { x:7.60, z:1.05, len:1.2, w:0.1, rot:90 },
      { x:10.60, z:1.05, len:1.2, w:0.1, rot:90 },
      { x:13.60, z:1.05, len:1.2, w:0.1, rot:90 },
      { x:16.60, z:1.05, len:1.2, w:0.1, rot:90 },
      { x:19.60, z:1.05, len:1.2, w:0.1, rot:90 },
      { x:4.20, z:3.6, len:1.2, w:0.1, rot:90 },
      { x:1.64, z:9.6, len:1.2, w:0.1, rot:0 },
      { x:1.64, z:12.2, len:1.2, w:0.1, rot:0 },
      { x:1.64, z:14.8, len:1.2, w:0.1, rot:0 },
      { x:23.20, z:1.6, len:1.2, w:0.1, rot:90 },
      { x:26.20, z:1.6, len:1.2, w:0.1, rot:90 },
      { x:29.20, z:1.6, len:1.2, w:0.1, rot:90 },
      { x:23.20, z:4.8, len:1.2, w:0.1, rot:90 },
      { x:26.20, z:4.8, len:1.2, w:0.1, rot:90 },
      { x:29.20, z:4.8, len:1.2, w:0.1, rot:90 },
      { x:23.20, z:8.0, len:1.2, w:0.1, rot:90 },
      { x:26.20, z:8.0, len:1.2, w:0.1, rot:90 },
      { x:29.20, z:8.0, len:1.2, w:0.1, rot:90 },
      { x:23.20, z:11.2, len:1.2, w:0.1, rot:90 },
      { x:26.20, z:11.2, len:1.2, w:0.1, rot:90 },
      { x:29.20, z:11.2, len:1.2, w:0.1, rot:90 },
      { x:23.20, z:14.4, len:1.2, w:0.1, rot:90 },
      { x:26.20, z:14.4, len:1.2, w:0.1, rot:90 },
      { x:29.20, z:14.4, len:1.2, w:0.1, rot:90 }
    ],
    round: [[18.2, 10.75]],   // 앞쪽 가운데 원형 천장 스피커/센서
    projectors: [ { x:13.7, z:10.2, aim:[19.9, 10.2], drop:0.35, color:'white', label:'빔프로젝트' } ],
    downlights: [],
    aircon: [[18.6, 9.1, 1.0], [10.0, 12.4, 0.75]]   // 앞 오른쪽(북동) 큰 4방향 카세트 + 뒤쪽 가운데 작은 것
  },

  speakers: [   // 스크린 쪽 양옆 벽(북·남) 높은 곳
    { x:19.9, z:5.42, rot:180 },
    { x:19.9, z:15.91, rot:0 }
  ],

  /* 교육장 책상 배치 (책상 배치 바꾸기 버튼 / B 키). 스크린이 동쪽이라 책상은 rot:-90(동쪽을 봄) */
  deskLayouts: {
    start: 0,
    list: [
      { id:'lecture', name:'강의식', items:[
        // 도면: 4열(px x200–210, 231–241, 260–270, 293–303) × 책상 4개(px y107–212), 책상마다 의자 2개(동쪽을 봄) = 32석
        { type:'array', xs:[9.67, 12.09, 14.35, 16.93], zs:[8.0, 9.8, 11.6, 13.4],
          item:{ type:'deskPair', w:1.8, d:0.45, chairs:2, casters:true, tag:false, chairStyle:'shell', tuck:0.2, rot:-90 } }
      ] },
      { id:'group', name:'조별', items:[
        { type:'array', xs:[9.0, 12.2, 15.4], zs:[7.4, 10.0, 12.6], item:{ type:'island', len:1.8, dd:0.5, perSide:2, basket:true, tents:true, rot:90 } }
      ] }
    ]
  },

  /* 장비 안내(마우스를 올리면 안내 카드) — '(예: …) — 수정 필요' 는 예시 문구예요 */
  equipment: [
    { id:'dj_projector', name:'빔프로젝트', room:'교육장', box:[13.4, 9.9, 14.0, 10.5, 2.1, 2.7],
      lines:['연결 케이블: (예: HDMI) — 수정 필요', '리모컨 위치: (예: 수납장 위) — 수정 필요', '사용 방법: (예: 전원 → 입력 선택) — 수정 필요'] },
    { id:'dj_screen', name:'스크린', room:'교육장', box:[19.75, 8.95, 20.05, 11.45, 1.05, 2.7], label:true, labelAt:[19.9, 2.62, 10.2], lines:['전동 스크린 내리기/올리기: (예: 벽 스위치) — 수정 필요'] },
    { id:'dj_board', name:'유리 화이트보드', room:'교육장', boxes:[[20.6, 7.3, 20.8, 8.7, 0.8, 2.2], [20.6, 11.7, 20.8, 13.1, 0.8, 2.2]], lines:['마커·지우개: (예: 레지 위 비치) — 수정 필요'] },
    { id:'dj_speaker', name:'스피커', room:'교육장', boxes:[[19.6, 5.3, 20.2, 5.7, 2.2, 2.7], [19.6, 15.63, 20.2, 16.03, 2.2, 2.7]], lines:['음량 조절: (예: 앰프 위치) — 수정 필요', '마이크: (예: 무선 마이크) — 수정 필요'] },
    { id:'dj_ac', name:'에어컨', room:'교육장', boxes:[[18.1, 8.6, 19.1, 9.6, 2.5, 2.75], [9.62, 12.02, 10.38, 12.78, 2.5, 2.75]], lines:['리모컨/조작: (예: 벽 컨트롤러) — 수정 필요'] },
    // 북서쪽 벽 커피 코너(사진): 남→북 수납장(커피머신·제빙기) · 정수기 · 쓰레기통
    { id:'dj_coffee', name:'커피머신', room:'교육장', box:[5.72, 6.81, 6.16, 7.19, 0.9, 1.45], label:true, labelAt:[5.92, 1.56, 7.0], lines:['사용 방법: (예: 캡슐 넣고 버튼) — 수정 필요', '종이컵: 왼쪽에 비치'] },
    { id:'dj_ice', name:'제빙기', room:'교육장', box:[5.7, 6.32, 6.16, 6.72, 0.9, 1.41], label:true, labelAt:[5.92, 1.52, 6.52], lines:['사용 방법: (예: 스쿱은 옆 걸이) — 수정 필요'] },
    { id:'dj_water', name:'정수기', room:'교육장', box:[5.69, 5.76, 6.16, 6.16, 0, 1.6], label:true, labelAt:[5.92, 1.7, 5.96], lines:['냉수·온수: (예: 온수 잠금 버튼) — 수정 필요', '컵·비품: 정수기 위'] },
    { id:'dj_bin', name:'쓰레기통', room:'교육장', box:[5.69, 5.32, 6.16, 5.72, 0, 0.76], label:true, labelAt:[5.92, 0.88, 5.52], lines:['분리수거: (예: 일반쓰레기) — 수정 필요'] },
    { id:'dj_clock', name:'디지털 시계', room:'교육장', box:[5.69, 6.35, 5.76, 7.25, 2.07, 2.33], lines:['수납장 위 벽 LED 시계'] }
  ],

  furniture: [
    /* --- 스크린(동쪽 벽 앞, 도면 px x333–339): 천장형 전동 스크린 + 벽의 유리 화이트보드 2개 --- */
    { type:'ceilingScreen', x:19.9, z:10.2, w:2.4, h:1.45, rot:90 },
    { type:'whiteboard', x:20.74, z:8.0, w:1.3, rot:90, style:'glass' },
    { type:'whiteboard', x:20.74, z:12.4, w:1.3, rot:90, style:'glass' },

    /* --- 북서쪽 벽 커피 코너(실제 사진 11/19): 벽을 바라볼 때 왼→오른쪽(남→북)
           흰 2문 수납장(커피머신·종이컵·제빙기) → 바닥형 정수기 → 모서리 검정 쓰레기통 + 회색 선반, 위에 LED 시계 · 화재 경보함
           그룹 원점 = 벽면(x5.69), z6.5 = u 0. 위치는 cab / water / bin / clock / alarm (u, m) 로 조정 --- */
    { type:'coffeeCorner', x:5.69, z:6.5, rot:-90, cab:-0.3, water:0.54, bin:0.98, clock:-0.3, alarm:-1.05 },

    { type:'exitSign', x:4.425, z:8.28, y:2.2, rot:180 },   // 출입문 위 비상구 유도등(교육장 쪽)

    /* --- 남쪽 창 사이 벽의 작은 파란 표지판 --- */

    /* --- 비상구 유도등 + 소화기 (안내도) --- */
    { type:'exitSign', x:18.9, z:0.14, y:2.2, rot:180 },        // 북쪽 복도
    { type:'exitSign', x:3.41, z:7.1, y:2.2, rot:-90 },         // 통로 서쪽 벽
    { type:'extinguisher', x:3.56, z:7.7 },
    { type:'exitSign', x:20.74, z:14.65, y:2.25, rot:90 },     // 교육장 동쪽 문(직원 사무실 쪽) 위
    { type:'extinguisher', x:20.5, z:15.6 },
    { type:'exitSign', x:2.6, z:16.02, y:2.2, rot:0 },          // 강사대기실 남서쪽
    { type:'extinguisher', x:2.9, z:15.75 },

    /* --- 엘리베이터 승강장(입구 바로 바깥): 엘리베이터 + 옆 비상구 표시, 북쪽 화장실 --- */
    { type:'elevator', x:0.96, z:3.98, rot:-90 },
    { type:'exitSign', x:0.97, z:5.08, y:2.2, rot:-90 },
    { type:'restroom', x:2.55, z:2.77, rot:180 },

    /* --- 입구 --- */
  ]
};
