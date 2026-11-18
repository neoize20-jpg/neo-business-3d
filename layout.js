/* =====================================================================
   네오비즈니스 3D 투어 — 공간 설정 파일 (layout.js)
   ---------------------------------------------------------------------
   ★ 이 파일만 고치면 도면·3D 투어 전체가 다시 그려져요.
   ★ 단위는 모두 미터(m), 각도는 도(°)예요.
   ★ 기준점(0,0) = 건물 왼쪽 위(북서쪽) 바깥 모서리
        x : 오른쪽(동쪽)으로 갈수록 커짐   (0 ~ building.width)
        z : 아래쪽(남쪽)으로 갈수록 커짐   (0 ~ building.depth)
        도면을 위에서 본 모습 그대로 왼쪽 위가 (0,0)이에요.
   ★ rot(회전): 0 = 정면이 북쪽(위)을 봄, 90 = 서쪽(왼쪽), 180 = 남쪽, -90 = 동쪽
   ★ 주소 끝에 ?edit=1 을 붙이면 1m 격자와 마우스 위치 좌표가 보여요(측정용).
   ===================================================================== */
window.LAYOUT = {

  /* ---------- 1. 건물 기본값 ---------- */
  building: {
    name: '네오비즈니스',
    width: 18.0,        // 건물 가로(동서) 길이
    depth: 19.6,        // 건물 세로(남북) 길이
    ceiling: 2.7,       // 천장 높이
    eye: 1.6,           // 걷기 모드 눈높이
    wall: { exterior: 0.24, interior: 0.14, thick: 0.30 }  // 벽 두께 기본값 (벽마다 t 로 따로 지정 가능)
  },

  /* ---------- 2. 방(구역) ----------
     id      : 내부 이름(영문, 바꾸지 마세요)
     name    : 화면에 보이는 이름
     rect    : [x1, z1, x2, z2]  방의 왼쪽 위 ~ 오른쪽 아래 좌표
     floor   : 바닥 재질(floor / floorDark)
     label   : 방 이름표 위치 [x, z], labelY 는 이름표 높이(생략 시 2.05m)
     jump    : 빠른 이동 버튼 위치 {x, z, look:[바라볼 x, z]}
     card    : 이름표를 누르면 뜨는 사진 카드 (photos 폴더 파일 이름)
     순서가 중요해요: 위에 있는 방이 먼저 판정돼요(라운지는 나머지 전체라 맨 아래).          */
  rooms: [
    { id:'coaching', name:'소회의실', en:'Small Meeting Room', rect:[0, 0, 3.81, 9.74], floor:'floor',
      label:[1.9, 6.0], jump:{ x:2.6, z:4.7, look:[0.4, 0.9] },
      card:{ photos:['IMG_0415','IMG_0418','IMG_0419','IMG_0416'],
             desc:'창가 쪽 코너에 있는 작은 회의실이에요. 블랙 미팅 테이블과 화이트보드가 있고, 기둥 뒤 창가에는 L자 바 테이블과 바 스툴, 회색 수납 벤치와 주황 큐브 스툴이 있어요.' } },
    { id:'meeting', name:'회의실', en:'Meeting Room', rect:[3.81, 0, 9.79, 9.74], floor:'floor',
      label:[6.9, 5.6], jump:{ x:6.9, z:8.8, look:[6.9, 0.3] },
      card:{ photos:['IMG_0393','IMG_0391','IMG_0390'],
             desc:'긴 화이트 테이블과 블랙 체어, 프로젝터 스크린과 화이트보드를 갖춘 회의실이에요. 라운지 쪽은 반투명 유리벽이에요.' } },
    { id:'classroom', name:'교육장', en:'Education Center', rect:[9.79, 0, 18, 14.14], floor:'floor',
      label:[13.9, 7.3], jump:{ x:13.91, z:13.3, look:[13.91, 0.3] },
      card:{ photos:['IMG_0380','IMG_0382','IMG_0384','IMG_0383'],
             desc:'라운지 쪽 출입구에는 백라이트 패널과 TV, 안내 배너, EDUCATION CENTER 유리문이 있어요. 내부는 화이트 강의용 책상이 두 줄로 길게 놓인 대형 교육장이에요.' } },
    { id:'focus', name:'NEOBOX', en:'Focus Booth · NEOBOX', small:true, rect:[0.24, 17.6, 7.52, 19.6], floor:'floor',
      label:[3.9, 17.3], labelY:2.35, jump:{ x:5.1, z:16.0, look:[3.4, 19.3] },
      card:{ photos:['IMG_0398','IMG_0397','IMG_0401','IMG_0403'],
             desc:'NEOBOX1 · NEOBOX2 · NEOBOX3, 모니터와 책상이 있는 1인용 부스 3개예요. 커피존 바로 옆, 우드 슬랫 파티션 너머에 나란히 있어요.' } },
    { id:'coffee', name:'커피존', en:'Pantry', small:true, rect:[7.52, 17.2, 13.8, 19.6], floor:'floor',
      label:[10.7, 18.0], labelY:1.6, jump:{ x:10.9, z:16.4, look:[10.3, 19.4] },
      card:{ photos:['IMG_0386','IMG_0387','IMG_0398'],
             desc:'커피머신과 수납장, 분리수거함이 있는 탕비 공간이에요. 우드 슬랫 파티션으로 라운지와 나뉘어 있어요.' } },
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[13.8, 16.9, 18, 19.6], floor:'floor',
      label:[15.9, 18.6], jump:{ x:17.3, z:18.25, look:[6.0, 10.4] },
      card:{ photos:['IMG_0378','IMG_0380','IMG_0388'],
             desc:'유리문 위에 Neoful business space 사인이 있는 입구예요. 들어오면 교육장 앞 디스플레이 월과 배너가 보여요.' } },
    { id:'lounge', name:'라운지', en:'Lounge', rect:[0, 9.74, 18, 19.6], floor:'floor',
      label:[4.4, 14.2], jump:{ x:2.8, z:16.1, look:[8.2, 10.7] },
      card:{ photos:['IMG_0420','IMG_0421','IMG_0422','IMG_0424'],
             desc:'흰 몰딩 벽을 따라 긴 바 테이블과 스툴이 놓여 있고, 회의실 유리벽 앞 코너에는 회색 벤치, 컬러 큐브 스툴, 원형 테이블과 블루·베이지 암체어가 있는 오픈 라운지예요.' } }
  ],

  /* 처음 열었을 때 모드: 'orbit' = 3D 보기(전체 조망), 'walk' = 입구에서 걷기 */
  start: { mode:'orbit', room:'entrance' },

  /* ---------- 3. 벽 ----------
     from, to : 벽의 시작점과 끝점 [x, z]  (가로 또는 세로로 곧은 벽만)
     type     : solid(일반 벽) / glass(유리 파티션, 반투명 띠 포함) / window(바깥 창문)
     t        : 벽 두께(생략하면 building.wall 기본값: 바깥벽 exterior, 그 외 interior)
     openings : 문·통로 목록. at = 벽 방향 좌표에서 문이 시작하는 위치, width = 문 폭
                door: 'glass'(유리문) / 'wood'(흰 목재문) / 'none'(문 없이 뚫린 통로)
                hinge: 'start'|'end' (경첩 쪽), swing: 열린 각도(도, +/-로 방향)
                double:true 면 양문(두 짝), open:false 면 닫힌 상태(입구 유리문 등)          */
  walls: [
    // 바깥벽 — 북쪽(위)
    { from:[0, 0],     to:[0.42, 0],  type:'solid',  outer:true },
    { from:[0.42, 0],  to:[3.49, 0],  type:'window', outer:true },   // 소회의실 창
    { from:[3.49, 0],  to:[5.45, 0],  type:'solid',  outer:true },
    { from:[5.45, 0],  to:[8.36, 0],  type:'window', outer:true },   // 회의실 창
    { from:[8.36, 0],  to:[18, 0],    type:'solid',  outer:true },
    // 바깥벽 — 서쪽(왼쪽)
    { from:[0, 0],     to:[0, 0.48],  type:'solid',  outer:true },
    { from:[0, 0.48],  to:[0, 9.21],  type:'window', outer:true },   // 소회의실 창
    { from:[0, 9.21],  to:[0, 19.6],  type:'solid',  outer:true, molding:'east', moldingFrom:9.9, moldingTo:17.3 },  // 라운지 몰딩 벽 (molding: 몰딩을 붙일 면, From~To 구간)
    // 바깥벽 — 남쪽(아래), 입구 유리 양문
    { from:[0, 19.6],  to:[18, 19.6], type:'solid',  outer:true,
      openings:[ { at:14.56, width:2.7, door:'glass', double:true, open:false, entrance:true } ] },
    // 바깥벽 — 동쪽(오른쪽)
    { from:[18, 0],    to:[18, 19.6], type:'solid',  outer:true },

    // 안쪽 벽
    { from:[3.81, 0],  to:[3.81, 9.74], type:'solid' },                       // 소회의실 | 회의실
    { from:[9.79, 0],  to:[9.79, 14.14], type:'solid', t:0.30, molding:'west', moldingFrom:9.86, moldingTo:14.14 },  // 회의실·라운지 | 교육장
    { from:[0, 9.74],  to:[3.81, 9.74], type:'glass',
      openings:[ { at:1.85, width:1.59, door:'glass', hinge:'end', swing:-63 } ] },    // 소회의실 앞 유리벽 + 문
    { from:[3.81, 9.74], to:[9.79, 9.74], type:'glass',
      openings:[ { at:4.24, width:1.59, door:'glass', hinge:'start', swing:63 } ] },   // 회의실 앞 유리벽 + 문
    { from:[9.79, 14.14], to:[18, 14.14], type:'solid', t:0.30,
      openings:[ { at:16.41, width:0.95, door:'glass', frame:'white', hinge:'start', swing:66 } ] }  // 교육장 출입문
  ],

  /* 벽 블록(소회의실 안 흰 정사각형) 같은 기둥: rect = [x1,z1,x2,z2], slats = 우드 슬랫을 붙일 면 */
  columns: [
    { rect:[0.90, 1.01, 1.91, 2.01], slats:['west','north'] }
  ],

  /* ---------- 4. 천장 조명 ----------
     panels : [x1,z1,x2,z2] 영역에 가로 nx × 세로 nz 개의 LED 평판 조명
     aircon : 천장형 에어컨 위치 [x, z]                                             */
  ceiling: {
    panels: [
      { rect:[0, 2.4, 3.81, 9.74],   nx:1, nz:3 },
      { rect:[3.81, 0, 9.79, 9.74],  nx:2, nz:3 },
      { rect:[9.79, 0, 18, 14.14],   nx:3, nz:4 },
      { rect:[0, 9.74, 9.79, 17.7],  nx:3, nz:2 },
      { rect:[9.79, 14.14, 18, 19.6], nx:2, nz:1 }
    ],
    aircon: [[6.9,4.8],[12.0,4.3],[15.8,4.3],[12.0,10.3],[15.8,10.3],[4.5,13.0]]
  },

  /* ---------- 5. 가구 ----------
     공통: type(종류), x, z(중심 위치), rot(회전°)
     크기: w(가로) d(세로) h(높이) — 생략하면 종류별 기본값
     색/재질: color 에 아래 이름 중 하나
        fabricGray, fabricTeal, fabricBeige, fabricOrange, fabricGreen, fabricBlue, fabricRed,
        oak, marble, darkTop, white, black, metal
     반복 배치: type:'array' 로 묶고 xs:[...], zs:[...] 에 좌표 목록 → 모든 조합에 item 을 배치
     종류 목록은 수정방법.md 참고                                                     */
  furniture: [
    /* --- 소회의실 --- */
    { type:'tableSet', x:2.0, z:7.09, w:1.05, d:2.6, top:'darkTop', chairsLeft:4, chairsRight:4, chairInset:0.37, legInset:0.1 },   // 블랙 미팅 테이블 + 의자 4+4
    { type:'whiteboard', x:3.71, z:7.09, w:2.0, rot:90 },
    { type:'barCounter', x:0.33, z:1.96, w:0.42, d:3.67 },          // 창가 L자 바 테이블 — 서쪽 창 쪽
    { type:'barCounter', x:1.80, z:0.33, w:2.51, d:0.42 },          // 창가 L자 바 테이블 — 북쪽 창 쪽
    { type:'stool', x:0.86, z:2.44, color:'fabricGray',  h:0.68 },
    { type:'stool', x:0.86, z:3.19, color:'fabricOrange', h:0.68 },
    { type:'stool', x:2.25, z:0.86, color:'fabricGray',  h:0.68 },
    { type:'stool', x:2.80, z:0.86, color:'fabricGray',  h:0.68 },
    { type:'bench', x:3.52, z:1.24, w:0.4, d:1.0, h:0.42, color:'fabricGray' },
    { type:'cube',  x:3.51, z:2.04, size:0.42, color:'fabricOrange' },
    { type:'plant', x:2.46, z:2.36, scale:1.0 },
    { type:'cabinet', x:0.32, z:8.94, w:0.35, d:1.2, h:0.6, color:'black' },
    { type:'block', x:0.32, z:2.8, w:0.08, d:0.06, h:0.14, y:1.02, color:'black' },   // 바 테이블 위 폰 거치대

    /* --- 회의실 --- */
    { type:'tableSet', x:6.9, z:4.79, w:1.25, d:5.6, top:'white', modules:3, chairsLeft:6, chairsRight:6 },          // 긴 테이블(3모듈) + 의자 6+6
    { type:'screen', x:6.9, z:0.18, w:2.2, rot:180 },
    { type:'whiteboard', x:3.91, z:4.79, w:2.4, rot:-90 },
    { type:'cabinet', x:8.4, z:0.47, w:1.6, d:0.4, h:0.6, color:'white' },

    /* --- 교육장 --- */
    { type:'screen', x:13.91, z:0.18, w:3.0, rot:180 },
    { type:'desk', x:12.31, z:1.72, w:1.4, d:0.6 },
    { type:'chair', x:12.31, z:1.22, rot:180 },
    { type:'tvStand', x:10.84, z:1.42, rot:29 },
    { type:'whiteboard', x:9.97, z:7.07, w:8.5, rot:-90 },
    { type:'whiteboard', x:17.85, z:7.07, w:8.5, rot:90 },
    { type:'array', xs:[10.95, 12.47, 15.35, 16.87], zs:[3.12, 4.57, 6.02, 7.47, 8.92, 10.37, 11.82],
      item:{ type:'deskPair', w:1.5, d:0.5 } },                    // 강의 책상(의자 2개 포함) 7줄 × 4개
    { type:'tvWall', x:14.82, z:14.34, w:2.5, rot:180 },                     // 교육장 앞 백라이트 TV 패널(라운지 쪽)
    { type:'signStand', x:15.17, z:14.84 },
    { type:'signStand', x:15.57, z:14.84 },
    { type:'slats', from:[17.49, 14.33], to:[17.90, 14.33], h:2.6, count:6 },
    { type:'plant', x:17.69, z:14.74, scale:1.05 },

    /* --- NEOBOX 부스 --- */
    { type:'booth', x:1.405, z:18.6, w:1.85, d:1.69, label:'NEOBOX1' },
    { type:'booth', x:3.89,  z:18.6, w:1.86, d:1.69, label:'NEOBOX2' },
    { type:'booth', x:6.38,  z:18.6, w:1.86, d:1.69, label:'NEOBOX3' },

    /* --- 커피존 --- */
    { type:'slats', from:[7.46, 19.37], to:[7.46, 17.92], h:2.45, count:13, thick:true },
    { type:'pantry', x:10.64, z:19.17, w:5.74 },
    { type:'plant', x:13.56, z:18.57, scale:1.15 },

    /* --- 라운지 --- */
    { type:'barCounter', x:0.39, z:13.09, w:0.5, d:4.4, h:1.04 },
    { type:'array', xs:[0.97], zs:[11.29, 11.89, 12.49, 13.09, 13.69, 14.29, 14.89],
      item:{ type:'stool', h:0.72 }, colors:['fabricRed','fabricRed','fabricGray','fabricRed','fabricRed','fabricGray','fabricRed'] },
    { type:'cube', x:6.25, z:10.11, color:'fabricGreen' },
    { type:'cube', x:6.75, z:10.11, color:'fabricBlue' },
    { type:'cube', x:7.25, z:10.09, color:'fabricGreen' },
    { type:'cube', x:7.75, z:10.07, color:'fabricRed' },
    { type:'bench', x:9.34, z:11.26, w:0.5, d:2.6, color:'fabricGray' },
    { type:'bench', x:8.79, z:10.11, w:0.5, d:0.6, color:'fabricGray' },
    { type:'cube',  x:9.34, z:12.86, size:0.45, h:0.42, color:'fabricOrange' },
    { type:'roundTable', x:8.25, z:10.76 },
    { type:'roundTable', x:7.15, z:11.36 },
    { type:'armchair', x:8.45, z:11.96, rot:99, color:'fabricBeige' },
    { type:'armchair', x:7.45, z:12.46, rot:9,  color:'fabricTeal' },
    { type:'cube', x:8.05, z:12.56, size:0.45, color:'fabricTeal' },
    { type:'purifier', x:9.34, z:13.41 },
    { type:'roundTable', x:3.4, z:13.39, r:0.42 },
    { type:'armchair', x:2.6, z:13.69, rot:72,  color:'fabricBeige' },
    { type:'armchair', x:4.1, z:14.09, rot:-54, color:'fabricTeal' },
    { type:'plant', x:0.52, z:16.39, scale:1.1 },

    /* --- 입구 --- */
    { type:'mat', x:15.91, z:18.68, w:2.1, d:1.3, color:'orange' }
  ]
};
