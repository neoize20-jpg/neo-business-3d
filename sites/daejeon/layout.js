/* =====================================================================
   대전 교육장 — 공간 설정 파일 (sites/daejeon/layout.js)
   사용자 스케치(11/19) 기준: 책상 1.8m ≈ 36px → 약 0.05 m/px.
   기준점(0,0) = 스케치 px (122, 147). x = 동쪽, z = 남쪽, 단위 m. rot: 0 = 북쪽, 90 = 서쪽, 180 = 남쪽, -90 = 동쪽.
   - 교육장(빨간 선): x 2.75–17.95, z 0–9.25 (15.2 × 9.25m, 천장 2.7m)
   - 입구·통로(흰 선, 교육장 서쪽): x 0–2.75, z 2.5–9.25 — 투어는 여기서 시작, 서쪽 벽 문으로 교육장에 들어감
   - 스크린은 동쪽 벽 → 책상은 동쪽을 바라봄
   ※ 치수는 스케치 비율로 잡은 추정값이에요. 실측값을 받으면 숫자만 바꾸면 됩니다.
   ===================================================================== */
window.LAYOUT = {
  building: { name: '대전 교육장', width: 17.95, depth: 9.25, ceiling: 2.7, eye: 1.6, wall: { exterior: 0.24, interior: 0.14, thick: 0.30 } },
  photoDir: 'sites/daejeon/photos/',

  rooms: [
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[0, 2.5, 2.75, 9.25], floor:'floor',
      label:[1.375, 6.4], jump:{ x:1.0, z:4.6, look:[2.75, 8.0] },
      card:{ photos:[], desc:'대전 교육장 입구와 통로예요. 통로 오른쪽(동쪽) 유리 파티션의 문으로 교육장에 들어가요.' } },
    { id:'classroom', name:'교육장', en:'Education Center', rect:[2.75, 0, 17.95, 9.25], floor:'floor',
      label:[10.4, 4.6], jump:{ x:4.2, z:7.75, look:[17.9, 4.2] },
      card:{ photos:[],
             desc:'대전 교육장. 동쪽 벽에 천장형 전동 스크린과 양옆 유리 화이트보드, 천장 빔프로젝터가 있고, 남쪽은 큰 창문이에요. 흰 접이식 책상 4열 × 4개, 메시 등받이 의자. 북서쪽 모서리에 커피머신·정수기가 있는 수납장이 있어요.',
             services:['전동 스크린','빔프로젝터','유리 화이트보드','스피커','냉난방','커피머신','정수기'] } }
  ],

  start: { mode:'orbit', room:'entrance' },

  walls: [
    // 바깥벽 — 북쪽 (교육장 구간만, 북서쪽 x0–2.75 는 다른 공간이라 막음 → columns)
    { from:[2.75, 0], to:[17.95, 0], type:'solid', outer:true },
    // 바깥벽 — 서쪽(입구 통로): 유리 양문 입구
    { from:[0, 2.5], to:[0, 9.25], type:'solid', outer:true,
      openings:[ { at:3.7, width:1.6, door:'glass', double:true, entrance:true, frame:'white' } ] },
    // 바깥벽 — 남쪽: 초록 = 창문 4개 (흰 프레임 큰 여닫이창)
    { from:[0, 9.25],     to:[4.15, 9.25],  type:'solid',  outer:true },
    { from:[4.15, 9.25],  to:[6.15, 9.25],  type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.0, blind:0 },
    { from:[6.15, 9.25],  to:[7.0, 9.25],   type:'solid',  outer:true },
    { from:[7.0, 9.25],   to:[8.9, 9.25],   type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.0, blind:0 },
    { from:[8.9, 9.25],   to:[12.0, 9.25],  type:'solid',  outer:true },
    { from:[12.0, 9.25],  to:[13.9, 9.25],  type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.0, blind:0 },
    { from:[13.9, 9.25],  to:[14.7, 9.25],  type:'solid',  outer:true },
    { from:[14.7, 9.25],  to:[16.65, 9.25], type:'window', outer:true, style:'tall', sill:0.75, head:2.45, bay:1.0, blind:0 },
    { from:[16.65, 9.25], to:[17.95, 9.25], type:'solid',  outer:true },
    // 바깥벽 — 동쪽: 스크린 벽, 남쪽 끝에 문
    { from:[17.95, 0], to:[17.95, 9.25], type:'solid', outer:true,
      openings:[ { at:7.35, width:0.95, door:'wood', frame:'white', hinge:'end', swing:-80 } ] },
    // 교육장 서쪽 벽: 북쪽 끝은 벽, 그 아래는 반투명 유리 슬라이딩 파티션(북서쪽 통로 개구부 + 남쪽 끝 문)
    { from:[2.75, 0], to:[2.75, 2.5], type:'solid' },
    { from:[2.75, 2.5], to:[2.75, 9.25], type:'glass', style:'band', band:[0.1, 2.3], bay:1.0,
      openings:[ { at:2.55, width:0.9 },                                             // 북서쪽 개구부(통로 쪽)
                 { at:7.2, width:1.0, door:'frameless', hinge:'start', swing:88 } ] }  // 교육장 문 (스케치 y285–315): 북쪽 경첩, 교육장 안으로 88° 열려 통로를 막지 않음
  ],

  // 막힌 덩어리: 북서쪽 다른 공간, 남쪽 벽 흰 기둥, 남서쪽 모서리 흰 사각 기둥
  columns: [
    { rect:[0, 0, 2.75, 2.5] },
    { rect:[9.9, 8.8, 11.05, 9.13] },
    { rect:[2.82, 8.65, 3.3, 9.13] }
  ],

  ceiling: {
    panels: [ { rect:[2.75, 0, 17.95, 9.25], nx:6, nz:3 }, { rect:[0, 2.5, 2.75, 9.25], nx:1, nz:2 } ],   // 사각 매입 LED 패널
    strips: [],
    projectors: [ { x:10.6, z:4.2, aim:[17.6, 4.2], drop:0.3, color:'white', label:'빔프로젝트' } ],
    downlights: [],
    aircon: [[6.6, 4.6, 0.9], [13.6, 4.6, 0.9]]   // 천장 카세트 에어컨 2대
  },

  speakers: [   // 스크린 쪽 양옆 벽(북·남) 높은 곳
    { x:16.9, z:0.24, rot:180 },
    { x:16.9, z:9.01, rot:0 }
  ],

  /* 교육장 책상 배치 (책상 배치 바꾸기 버튼 / B 키). 스크린이 동쪽이라 책상은 rot:-90(동쪽을 봄) */
  deskLayouts: {
    start: 0,
    list: [
      { id:'lecture', name:'강의식', items:[
        // 스케치: 4열 × 흰 접이식 책상 4개(1.8×0.5m) 이어 붙임, 책상마다 의자 2개(서쪽에서 동쪽을 봄) = 32석
        { type:'array', xs:[8.35, 10.375, 12.375, 14.475], zs:[1.95, 3.75, 5.55, 7.35],
          item:{ type:'deskPair', w:1.8, d:0.5, chairs:2, casters:true, tag:true, chairBase:'silver', rot:-90 } }
      ] },
      { id:'group', name:'조별', items:[
        // 책상 2개를 붙인 섬(긴 변이 스크린 방향), 양쪽에 2명씩 = 9섬 × 4명 = 36석
        { type:'array', xs:[6.9, 10.0, 13.1], zs:[2.0, 4.6, 7.2], item:{ type:'island', len:1.8, dd:0.5, perSide:2, basket:true, tents:true, rot:90 } }
      ] }
    ]
  },

  /* 장비 안내(마우스를 올리면 안내 카드) — '(예: …) — 수정 필요' 는 예시 문구예요 */
  equipment: [
    { id:'dj_projector', name:'빔프로젝트', room:'교육장', box:[10.3, 3.9, 10.9, 4.5, 2.15, 2.7],
      lines:['연결 케이블: (예: HDMI) — 수정 필요', '리모컨 위치: (예: 수납장 위) — 수정 필요', '사용 방법: (예: 전원 → 입력 선택) — 수정 필요'] },
    { id:'dj_screen', name:'전동 스크린', room:'교육장', box:[17.4, 2.9, 17.8, 5.5, 1.05, 2.7], lines:['내리기/올리기: (예: 벽 스위치) — 수정 필요'] },
    { id:'dj_board', name:'유리 화이트보드', room:'교육장', boxes:[[17.65, 1.4, 17.86, 2.9, 0.8, 2.2], [17.65, 5.5, 17.86, 7.0, 0.8, 2.2]], lines:['마커·지우개: (예: 레지 위 비치) — 수정 필요'] },
    { id:'dj_speaker', name:'스피커', room:'교육장', boxes:[[16.6, 0.1, 17.2, 0.5, 2.2, 2.7], [16.6, 8.75, 17.2, 9.15, 2.2, 2.7]], lines:['음량 조절: (예: 앰프 위치) — 수정 필요', '마이크: (예: 무선 마이크) — 수정 필요'] },
    { id:'dj_ac', name:'에어컨', room:'교육장', boxes:[[6.1, 4.1, 7.1, 5.1, 2.5, 2.75], [13.1, 4.1, 14.1, 5.1, 2.5, 2.75]], lines:['리모컨/조작: (예: 벽 컨트롤러) — 수정 필요'] },
    { id:'dj_coffee', name:'커피머신', room:'교육장', box:[4.58, 0.12, 4.92, 0.64, 0.85, 1.42], label:true, labelAt:[4.75, 1.5, 0.72], lines:['사용 방법: (예: 컵 올리고 버튼) — 수정 필요'] },
    { id:'dj_ice', name:'얼음/전자레인지', room:'교육장', box:[4.0, 0.12, 4.5, 0.64, 0.85, 1.2], label:true, labelAt:[4.25, 1.3, 0.72], lines:['사용 방법: 예시 — 수정 필요'] },
    { id:'dj_water', name:'정수기', room:'교육장', box:[3.15, 0.12, 3.45, 0.64, 0.85, 1.4], label:true, labelAt:[3.3, 1.5, 0.72], lines:['냉수·온수: (예: 온수 잠금 버튼) — 수정 필요'] },
    { id:'dj_clock', name:'디지털 시계', room:'교육장', box:[3.8, 0.1, 4.3, 0.2, 1.85, 2.15], lines:['수납장 위 벽 LED 시계'] }
  ],

  furniture: [
    /* --- 스크린 벽(동쪽): 천장형 전동 스크린 + 양옆 작은 유리 화이트보드 --- */
    { type:'ceilingScreen', x:17.6, z:4.2, w:2.4, h:1.45, rot:90 },
    { type:'whiteboard', x:17.81, z:2.15, w:1.3, rot:90, style:'glass' },
    { type:'whiteboard', x:17.81, z:6.25, w:1.3, rot:90, style:'glass' },

    /* --- 북서쪽 모서리: 흰 낮은 수납장(커피머신·얼음/전자레인지·정수기) + LED 시계 + 선풍기 + 휴지통 --- */
    { type:'coffeeCabinet', x:4.05, z:0.37, w:2.0, rot:180 },
    { type:'ledClock', x:4.05, z:0.13, y:1.85, rot:180 },
    { type:'standFan', x:5.45, z:0.55, rot:180 },
    { type:'bin', x:5.95, z:0.35 },

    /* --- 입구 통로 --- */
    { type:'mat', x:0.75, z:4.5, w:0.9, d:1.4, color:'orange' }
  ]
};
