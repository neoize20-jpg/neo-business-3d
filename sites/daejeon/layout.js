/* =====================================================================
   대전 교육장 — 공간 설정 파일 (sites/daejeon/layout.js)
   사용자 도면(11/19, 534×277px) 기준: 교육장 윗부분 px x153–348 = 15.2m → 0.078 m/px.
   기준점(0,0) = 도면 px (81, 23) = 건물 북서쪽 모서리. x = 동쪽, z = 남쪽, 단위 m.
   rot: 0 = 북쪽, 90 = 서쪽, 180 = 남쪽, -90 = 동쪽.  (px → m: x=(px-81)*0.078, z=(py-23)*0.078)
   - 건물 전체: 31.36 × 16.15m (px x81–483, y23–230), 천장 2.7m
   - 교육장(빨간 선, L자): 윗부분 x5.62–20.83 z5.30–8.19 + 아랫부분 x3.28–20.83 z8.19–16.15
   - 출입 안내도로(복도): 북쪽 띠 z0–5.30, 서쪽 x0–3.28, 동쪽 x20.83–31.36
   - 북쪽 띠 안의 흰 상자(px x153–348, y50–91) = 다른 공간(투어 제외) → columns 의 label 블록
   - 입구: 서쪽 바깥벽 z3.05–5.05 유리 양문 → 동쪽으로 x4.45 → 남쪽으로 교육장 북서쪽 문(z8.19)
   ※ 도면 비율로 잡은 추정값이에요. 실측값을 받으면 숫자만 바꾸면 됩니다.
   ===================================================================== */
window.LAYOUT = {
  building: { name: '대전 교육장', width: 31.36, depth: 16.15, ceiling: 2.7, eye: 1.6, wall: { exterior: 0.24, interior: 0.14, thick: 0.30 } },
  photoDir: 'sites/daejeon/photos/',

  // 건물 밖(입구 앞) 걸을 수 있는 바닥 — 도면의 점선 '경로'가 바깥(px x55)에서 들어옴
  outside: [ [-3.2, 2.7, 0, 5.4] ],

  rooms: [
    { id:'classroom', name:'교육장', en:'Education Center', rect:[3.28, 8.19, 20.83, 16.15], rects:[[5.62, 5.30, 20.83, 8.19]], floor:'floor',
      label:[12.4, 11.2], jump:{ x:7.4, z:13.4, look:[19.9, 10.2] },
      card:{ photos:[],
             desc:'대전 교육장(L자 공간). 동쪽 벽 앞에 천장형 전동 스크린과 양옆 유리 화이트보드, 천장 빔프로젝터가 있고, 남쪽은 큰 창문 4개예요. 흰 접이식 책상 4열 × 4개(32석), 메시 등받이 의자. 북서쪽 벽을 따라 정수기 · 제빙기 · 커피머신이 있어요.',
             services:['전동 스크린','빔프로젝터','유리 화이트보드','스피커','냉난방','정수기','제빙기','커피머신'] } },
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[0, 2.11, 5.62, 8.19], rects:[[-3.2, 2.7, 0, 5.4]], floor:'floor',
      label:[1.6, 6.6], jump:{ x:-1.7, z:4.05, look:[4.45, 4.3] },
      card:{ photos:[], desc:'건물 입구예요. 바닥의 초록 점선(경로)을 따라 동쪽으로 간 뒤 남쪽으로 꺾으면 교육장 북서쪽 문이 있어요.' } },
    { id:'road_w', name:'출입 안내도로', en:'Corridor', small:true, rect:[0, 8.19, 3.28, 16.15], floor:'floor', label:[1.64, 12.2],
      jump:{ x:1.6, z:10.0, look:[1.6, 15.0] }, card:{ photos:[], desc:'교육장 서쪽 복도. 동쪽 유리 파티션 문으로 교육장에 들어가요.' } },
    { id:'road_n', name:'출입 안내도로', en:'Corridor', small:true, rect:[0, 0, 20.83, 2.11], floor:'floor', label:[12.4, 1.05],
      jump:{ x:6.0, z:1.05, look:[20.0, 1.05] }, card:{ photos:[], desc:'북쪽 복도. 동쪽 끝 문으로 동쪽 복도와 이어져요.' } },
    { id:'road_e', name:'출입 안내도로', en:'Corridor', small:true, rect:[20.83, 0, 31.36, 16.15], floor:'floor', label:[26.1, 9.5],
      jump:{ x:22.2, z:14.6, look:[20.83, 14.6] }, card:{ photos:[], desc:'동쪽 복도. 서쪽 벽 남쪽 끝 문으로 교육장에 들어가요.' } }
  ],

  start: { mode:'orbit', room:'entrance' },

  // 바닥 동선: 초록 점선 + 화살표 (바깥 → 입구 → 동쪽 → 남쪽 → 교육장 문)
  route: { color:'#2fa84f', points:[[-2.9, 4.05], [4.45, 4.05], [4.45, 8.19], [4.45, 9.4]] },

  walls: [
    // 바깥벽
    { from:[0, 0], to:[31.36, 0], type:'solid', outer:true },
    { from:[31.36, 0], to:[31.36, 16.15], type:'solid', outer:true },
    { from:[0, 0], to:[0, 16.15], type:'solid', outer:true,
      openings:[ { at:3.05, width:2.0, door:'glass', double:true, entrance:true, frame:'white', open:true } ] },   // 입구 (px y62–88)
    // 남쪽: 초록 = 창문 4개 (px 145–172, 185–212, 262–289, 302–329)
    { from:[0, 16.15],     to:[4.99, 16.15],  type:'solid',  outer:true },
    { from:[4.99, 16.15],  to:[7.10, 16.15],  type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.05, blind:0 },
    { from:[7.10, 16.15],  to:[8.11, 16.15],  type:'solid',  outer:true },
    { from:[8.11, 16.15],  to:[10.22, 16.15], type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.05, blind:0 },
    { from:[10.22, 16.15], to:[14.12, 16.15], type:'solid',  outer:true },
    { from:[14.12, 16.15], to:[16.22, 16.15], type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.05, blind:0 },
    { from:[16.22, 16.15], to:[17.24, 16.15], type:'solid',  outer:true },
    { from:[17.24, 16.15], to:[19.34, 16.15], type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.05, blind:0 },
    { from:[19.34, 16.15], to:[31.36, 16.15], type:'solid',  outer:true },

    // 북쪽 복도 동쪽 끝 문 (px x345, y28–50)
    { from:[20.83, 0], to:[20.83, 2.11], type:'solid',
      openings:[ { at:0.4, width:1.5, door:'glass', double:true, frame:'white' } ] },
    // 교육장 윗부분 서쪽 벽 (정수기·제빙기·커피머신이 붙는 벽)
    { from:[5.62, 5.30], to:[5.62, 8.19], type:'solid' },
    // L자 꺾인 곳의 북쪽 벽 = 교육장 북서쪽 문 (입구 경로 끝, px x123–150)
    { from:[3.28, 8.19], to:[5.62, 8.19], type:'glass', style:'band', band:[0.1, 2.3], bay:1.0,
      openings:[ { at:3.95, width:1.0, door:'frameless', hinge:'start', swing:-88 } ] },
    // 아랫부분 서쪽 벽: 반투명 유리 파티션 + 서쪽 복도 문 (px y193–217)
    { from:[3.28, 8.19], to:[3.28, 16.15], type:'glass', style:'band', band:[0.1, 2.3], bay:1.0,
      openings:[ { at:13.7, width:1.0, door:'frameless', hinge:'start', swing:88 } ] },
    // 동쪽 벽 + 동쪽 복도 문 (px y200–222) — 복도 쪽으로 열림
    { from:[20.83, 5.30], to:[20.83, 16.15], type:'solid',
      openings:[ { at:14.15, width:1.0, door:'wood', frame:'white', hinge:'start', swing:88 } ] }
  ],

  // 막힌 덩어리: 북쪽 띠 안의 다른 공간(투어 제외), 남쪽 벽 흰 기둥, 남서쪽 모서리 흰 사각 기둥
  columns: [
    { rect:[5.62, 2.11, 20.83, 5.30], block:true },   // 다른 공간(투어 제외)
    { rect:[11.54, 15.75, 12.79, 16.03] },
    { rect:[3.35, 15.44, 3.82, 16.03] }
  ],

  ceiling: {
    panels: [ { rect:[3.28, 8.19, 20.83, 16.15], nx:7, nz:3 }, { rect:[5.62, 5.30, 20.83, 8.19], nx:6, nz:1 },
              { rect:[0, 2.11, 5.62, 8.19], nx:2, nz:2 }, { rect:[0, 8.19, 3.28, 16.15], nx:1, nz:3 },
              { rect:[0, 0, 20.83, 2.11], nx:7, nz:1 }, { rect:[20.83, 0, 31.36, 16.15], nx:3, nz:5 } ],
    strips: [],
    projectors: [ { x:14.0, z:10.2, aim:[19.9, 10.2], drop:0.3, color:'white', label:'빔프로젝트' } ],
    downlights: [],
    aircon: [[10.8, 10.2, 0.9], [16.9, 12.6, 0.9]]
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
        { type:'array', xs:[9.67, 12.09, 14.35, 16.93], zs:[7.58, 9.63, 11.68, 13.73],
          item:{ type:'deskPair', w:1.8, d:0.5, chairs:2, casters:true, tag:true, chairBase:'silver', rot:-90 } }
      ] },
      { id:'group', name:'조별', items:[
        { type:'array', xs:[9.0, 12.2, 15.4], zs:[7.4, 10.0, 12.6], item:{ type:'island', len:1.8, dd:0.5, perSide:2, basket:true, tents:true, rot:90 } }
      ] }
    ]
  },

  /* 장비 안내(마우스를 올리면 안내 카드) — '(예: …) — 수정 필요' 는 예시 문구예요 */
  equipment: [
    { id:'dj_projector', name:'빔프로젝트', room:'교육장', box:[13.7, 9.9, 14.3, 10.5, 2.15, 2.7],
      lines:['연결 케이블: (예: HDMI) — 수정 필요', '리모컨 위치: (예: 수납장 위) — 수정 필요', '사용 방법: (예: 전원 → 입력 선택) — 수정 필요'] },
    { id:'dj_screen', name:'스크린', room:'교육장', box:[19.75, 8.95, 20.05, 11.45, 1.05, 2.7], label:true, labelAt:[19.9, 2.62, 10.2], lines:['전동 스크린 내리기/올리기: (예: 벽 스위치) — 수정 필요'] },
    { id:'dj_board', name:'유리 화이트보드', room:'교육장', boxes:[[20.6, 7.3, 20.8, 8.7, 0.8, 2.2], [20.6, 11.7, 20.8, 13.1, 0.8, 2.2]], lines:['마커·지우개: (예: 레지 위 비치) — 수정 필요'] },
    { id:'dj_speaker', name:'스피커', room:'교육장', boxes:[[19.6, 5.3, 20.2, 5.7, 2.2, 2.7], [19.6, 15.63, 20.2, 16.03, 2.2, 2.7]], lines:['음량 조절: (예: 앰프 위치) — 수정 필요', '마이크: (예: 무선 마이크) — 수정 필요'] },
    { id:'dj_ac', name:'에어컨', room:'교육장', boxes:[[10.3, 9.7, 11.3, 10.7, 2.5, 2.75], [16.4, 12.1, 17.4, 13.1, 2.5, 2.75]], lines:['리모컨/조작: (예: 벽 컨트롤러) — 수정 필요'] },
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

    /* --- 입구 --- */
    { type:'mat', x:0.75, z:4.05, w:0.8, d:1.3, color:'orange' }
  ]
};
