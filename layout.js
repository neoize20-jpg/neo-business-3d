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
    width: 12.45,        // 건물 가로(동서) 길이
    depth: 12.1,        // 건물 세로(남북) 길이 — 바꾸면 남쪽 벽·입구·부스·커피존 좌표(z)도 같이 옮겨 주세요 (11/19 실측 스케치 2차: 12.45 × 12.1m)
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
     capacity, area : 수용 인원(명)·면적(㎡) — 모르면 생략(○○ 표시)
     card.use / card.services / card.note : 주요 용도 · 제공 서비스 목록 · 참고 문구 (회사 소개서 기준)
     순서가 중요해요: 위에 있는 방이 먼저 판정돼요(라운지는 나머지 전체라 맨 아래).          */
  rooms: [
    { id:'coaching', name:'소회의실', en:'Small Meeting Room', rect:[0, 0, 2.63, 6.22], floor:'floor',
      label:[1.3, 4.7], jump:{ x:2.05, z:5.4, look:[1.0, 1.4] },
      card:{ photos:['IMG_0415','IMG_0418','IMG_0419','IMG_0416'],
             desc:'창가 쪽 코너에 있는 작은 회의실이에요. 블랙 미팅 테이블과 화이트보드가 있고, 기둥 뒤 창가에는 L자 바 테이블과 바 스툴이 있어요.' } },
    { id:'meeting', name:'회의실', en:'Meeting Room', rect:[2.63, 0, 6.75, 6.22], floor:'floor', capacity:12, area:23,
      label:[3.35, 3.0], jump:{ x:3.35, z:5.6, look:[4.9, 0.6] },
      card:{ photos:['IMG_0393','IMG_0391','IMG_0390'],
             desc:'MEETING ROOM. 긴 화이트 테이블과 블랙 체어, 프로젝터 스크린과 화이트보드를 갖춘 회의실이에요. 라운지 쪽은 통유리벽이에요.',
             use:'교육 · 면접 · 회의 · 간담회 · 세미나',
             services:['와이드 스크린','빔프로젝터','무선마이크(2대)','TV 모니터(55인치)','공기청정기','정수기','냉난방'],
             note:'교육장 대관 시 무료 이용 가능' } },
    { id:'classroom', name:'교육장', en:'Education Center', rect:[6.75, 0, 12.45, 9.18], floor:'floor', capacity:30, area:55,
      label:[8.2, 4.6], jump:{ x:10.45, z:8.55, look:[9.6, 0.5] },
      card:{ photos:['IMG_0380','IMG_0382','IMG_0384','IMG_0383'],
             desc:'Neoful biz space EDUCATION CENTER. 라운지 쪽 출입구에는 백라이트 패널과 TV, 안내 배너가 있고, 내부는 앞쪽에 단상과 와이드 스크린, 화이트 강의용 책상 5줄이 놓인 교육장이에요.',
             use:'교육 · 면접 · 회의(온라인) · 워크숍 · 시상식 · 세미나',
             services:['와이드 스크린','빔프로젝터','무선마이크(2대)','TV 모니터(55인치)','공기청정기','정수기','냉난방 · 시스템 공기청정기','강사 대기석','행사 전 물품 택배 배송 가능'] } },
    { id:'focus', name:'NEOBOX', en:'Focus Booth · NEOBOX', small:true, rect:[0.24, 10.8, 5.1, 12.1], floor:'floor',
      label:[2.7, 10.55], labelY:2.35, jump:{ x:2.7, z:9.7, look:[2.7, 12.0] },
      card:{ photos:['IMG_0398','IMG_0397','IMG_0401','IMG_0403'],
             desc:'NEOBOX1 · NEOBOX2 · NEOBOX3, 모니터와 책상이 있는 1인용 부스 3개예요. 커피존 바로 옆, 우드 슬랫 파티션 너머에 나란히 있어요.' } },
    { id:'coffee', name:'커피존', en:'Pantry', small:true, rect:[5.24, 11.2, 9.52, 12.1], floor:'floor',
      label:[7.4, 11.3], labelY:1.6, jump:{ x:7.4, z:10.2, look:[7.4, 12.0] },
      card:{ photos:['IMG_0386','IMG_0387','IMG_0398'],
             desc:'공용 사용 공간(LOUNGE & AMENITIES). 커피머신과 수납장, 분리수거함이 있는 탕비 공간이에요. 우드 슬랫 파티션으로 라운지와 나뉘어 있어요.',
             services:['정수기','커피머신','제빙기','전자레인지','공기청정기','냉난방'] } },
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[9.52, 11.2, 12.45, 12.1], floor:'floor',
      label:[11.1, 11.6], jump:{ x:11.1, z:11.45, look:[3.5, 7.4] },
      card:{ photos:['IMG_0378','IMG_0380','IMG_0388'],
             desc:'유리문 위에 Neoful business space 사인이 있는 입구예요. 들어오면 교육장 앞 디스플레이 월과 배너가 보여요.' } },
    { id:'lounge', name:'라운지', en:'Lounge', rect:[0, 6.22, 12.45, 12.1], floor:'floor',
      label:[3.2, 8.4], jump:{ x:3.2, z:9.9, look:[5.4, 7.0] },
      card:{ photos:['IMG_0420','IMG_0421','IMG_0422','IMG_0424'],
             desc:'공용 사용 공간(LOUNGE & AMENITIES) — 탁 트인 휴식 공간이에요. 흰 몰딩 벽을 따라 긴 바 테이블과 스툴이 놓여 있고, 회의실 유리벽 앞 코너에는 회색 벤치, 컬러 큐브 스툴, 원형 테이블과 블루·베이지 암체어가 있어요.',
             services:['정수기','커피머신','제빙기','전자레인지','공기청정기','냉난방','휴식 공간'] } }
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
                double:true 면 양문(두 짝)
                style:'tall' (창문) = 바닥~천장 통창(밝은 회색 프레임). transoms:[가로 창살 높이들], bay(세로 창살 간격), blind(롤스크린 내림 정도 0~1)
                style:'band' (유리벽) = 바닥~천장 유리 + 블랙 프레임, band:[0.9, 2.0] 반투명 시트 높이, stripes:3 = 시트 위쪽 가는 줄무늬
                sign:{ text, at, y, size, icon } = 유리 레터링 (icon:true 면 왼쪽 작은 원형 아이콘)
                door:'frameless' = 바닥~천장 시트 유리문(블랙 세로 손잡이, 상부 금속 패치)
                ★ 문은 모두 닫힌 상태로 시작하고, 걷기 모드에서 문 앞에서 E키(모바일은 '열기' 버튼)로 여닫아요.
                  처음부터 열어 두려면 open:true 를 넣으세요. (3D 보기에서는 잘 보이도록 모두 열린 모습으로 보여요)
                  swing = 열렸을 때 각도(도). NEOBOX 부스 문도 booth 가구에 open:true / swing 을 넣을 수 있어요.          */
  walls: [
    // (11/19 실측 스케치 2차 반영 — 건물 12.45 × 12.1m, 0.028m/px)
    // 바깥벽 — 북쪽(위), 초록색 = 창문
    { from:[0, 0],     to:[0.22, 0],  type:'solid',  outer:true },
    { from:[0.22, 0],  to:[1.62, 0],  type:'window', outer:true, style:'tall', blind:0.55 },   // 소회의실 창 (통창, 롤스크린 반쯤 내림)
    { from:[1.62, 0],  to:[3.14, 0],  type:'solid',  outer:true },
    { from:[3.14, 0],  to:[4.26, 0],  type:'window', outer:true },   // 회의실 창 ①
    { from:[4.26, 0],  to:[4.82, 0],  type:'solid',  outer:true },
    { from:[4.82, 0],  to:[6.30, 0],  type:'window', outer:true },   // 회의실 창 ②
    { from:[6.30, 0],  to:[7.62, 0],  type:'solid',  outer:true },
    { from:[7.62, 0],  to:[9.16, 0],  type:'window', outer:true },   // 교육장 창 ①
    { from:[9.16, 0],  to:[10.05, 0], type:'solid',  outer:true },
    { from:[10.05, 0], to:[11.59, 0], type:'window', outer:true },   // 교육장 창 ②
    { from:[11.59, 0], to:[12.45, 0], type:'solid',  outer:true },
    // 바깥벽 — 서쪽(왼쪽)
    { from:[0, 0],     to:[0, 0.24],  type:'solid',  outer:true },
    { from:[0, 0.24],  to:[0, 2.46],  type:'window', outer:true, style:'tall', blind:0.6 },    // 소회의실 창 ① — 롤스크린 내림
    { from:[0, 2.46],  to:[0, 3.05],  type:'solid',  outer:true },
    { from:[0, 3.05],  to:[0, 5.38],  type:'window', outer:true, style:'tall', blind:0 },      // 소회의실 창 ② — 롤스크린 올림
    { from:[0, 5.38],  to:[0, 5.9],   type:'solid',  outer:true },
    { from:[0, 5.9],   to:[0, 12.1],  type:'solid',  outer:true, molding:'east', moldingFrom:6.35, moldingTo:10.7 },  // 라운지 몰딩 벽 (molding: 몰딩을 붙일 면, From~To 구간)
    // 바깥벽 — 남쪽(아래), 입구 유리 양문 (입구 x9.52–12.45 안)
    { from:[0, 12.1],  to:[12.45, 12.1], type:'solid', outer:true,
      openings:[ { at:10.2, width:1.8, door:'glass', double:true, entrance:true } ] },
    // 바깥벽 — 동쪽(오른쪽)
    { from:[12.45, 0], to:[12.45, 12.1], type:'solid', outer:true },

    // 안쪽 벽
    { from:[2.63, 0],  to:[2.63, 6.22], type:'solid' },                       // 소회의실 | 회의실
    { from:[6.75, 0],  to:[6.75, 9.18], type:'solid', t:0.30, molding:'west', moldingFrom:6.29, moldingTo:9.18 },  // 회의실·라운지 | 교육장
    // 라운지 쪽 통유리벽: 바닥~천장 유리 + 블랙 프레임, 0.9~2.0m 반투명 시트 띠, 프레임리스 시트 유리문(1.0m) + 세로 블랙 손잡이
    { from:[0.24, 6.22], to:[2.56, 6.22], type:'glass', style:'band', band:[0.9, 2.0], bay:1.5, sign:{ text:'COACHING ROOM', at:1.0, y:1.45, size:0.09, icon:true },
      openings:[ { at:1.56, width:1.0, door:'frameless', hinge:'end', swing:-63 } ] },    // 소회의실 앞 통유리 2장(고정 1 + 문 1, 문은 동쪽 끝)
    { from:[2.70, 6.22], to:[6.60, 6.22], type:'glass', style:'band', band:[0.9, 2.0], stripes:3, bay:1.45, sign:{ text:'MEETING ROOM', at:4.2, y:1.45, size:0.09 },
      openings:[ { at:2.70, width:1.0, door:'frameless', hinge:'start', swing:63 } ] },   // 회의실 앞 통유리 3장(문 1 + 고정 2, 문은 서쪽 끝)
    // bay = 유리 한 장의 대략 폭(m). 구간 길이 ÷ bay 를 반올림한 수만큼 유리가 나뉘어요.
    { from:[6.75, 9.18], to:[12.45, 9.18], type:'solid', t:0.30, sign:{ text:'EDUCATION CENTER', at:11.475, y:2.33, size:0.1 },   // 문 위 사인
      openings:[ { at:11.0, width:0.95, door:'glass', frame:'white', hinge:'end', swing:-88 } ] }  // 교육장 출입문(남쪽 벽 동쪽 끝). 경첩은 동쪽, 교육장 안으로 88° 열려 동쪽 벽 쪽에 붙음 → 통로 쪽 길을 막지 않음
  ],

  /* 벽 블록(소회의실 안 흰 정사각형) 같은 기둥: rect = [x1,z1,x2,z2], slats = 우드 슬랫을 붙일 면 */
  columns: [
    { rect:[0.78, 0.7, 1.76, 1.68], slats:['west','north'] }   // 소회의실 흰 벽 블록 x0.78–1.76, z0.7–1.68 (실측 스케치 2차)
  ],

  /* ---------- 4. 천장 조명 ----------
     panels : [x1,z1,x2,z2] 영역에 가로 nx × 세로 nz 개의 LED 평판 조명
     strips : 일자형 LED 라인 조명 { x, z, len(길이), w(폭), rot(회전°, 0 = 남북 방향) }
     projectors : 천장 빔 프로젝터 { x, z, aim:[x,z](렌즈가 향하는 곳), drop(천장에서 내려온 길이), label(글씨, false 면 숨김) }
     downlights : 작은 원형 다운라이트 [x, z]
     aircon : 천장형 에어컨 위치 [x, z] 또는 [x, z, 크기(m)]                           */
  ceiling: {
    panels: [
      { rect:[0, 1.8, 2.63, 6.22],    nx:1, nz:2 },
      { rect:[2.63, 0, 6.75, 6.22],   nx:2, nz:2 },
      { rect:[2.9, 6.22, 6.75, 10.8], nx:2, nz:2 },
      { rect:[6.75, 9.18, 12.45, 11.2], nx:3, nz:1 }
    ],
    // 교육장: 남북 방향 일자 LED 2열 × 3줄 — 가운데 줄의 에어컨·프로젝터를 피해 양옆에
    strips: [
      { x:8.2, z:2.4, len:1.2 }, { x:11.2, z:2.4, len:1.2 },
      { x:8.2, z:4.9, len:1.2 }, { x:11.2, z:4.9, len:1.2 },
      { x:8.2, z:7.4, len:1.2 }, { x:11.2, z:7.4, len:1.2 }
    ],
    projectors: [
      { x:9.69, z:5.9, aim:[9.555, 0.64], drop:0.3, color:'black', label:'프로젝트 빔' },
      { x:4.63, z:4.2, aim:[4.63, 0.59], drop:0.15, color:'white', label:'프로젝트 빔' }   // 회의실: 천장 흰색 프로젝터(사진 IMG_0391), 스크린을 향함   // 에어컨 뒤쪽, 내려오는 스크린 정면을 향함
    ],
    downlights: [[7.4, 1.0], [8.2, 1.0], [10.9, 1.0], [11.8, 1.0]],   // 앞쪽 작은 원형 다운라이트
    aircon: [[4.63, 2.96], [9.69, 4.0, 1.0], [1.96, 8.9, 1.0]]   // [x, z, 크기] — 회의실, 교육장 1대, 라운지 1대
  },

  /* ---------- 5. 가구 ----------
     공통: type(종류), x, z(중심 위치), rot(회전°)
     크기: w(가로) d(세로) h(높이) — 생략하면 종류별 기본값
     색/재질: color 에 아래 이름 중 하나
        fabricGray, fabricTeal, fabricBeige, fabricOrange, fabricGreen, fabricBlue, fabricRed,
        oak, marble, darkTop, white, black, metal
     반복 배치: type:'array' 로 묶고 xs:[...], zs:[...] 에 좌표 목록 → 모든 조합에 item 을 배치
     종류 목록은 수정방법.md 참고                                                     */
  /* ---------- 교육장 벽걸이 스피커 ----------
     x, z : 위치(벽 안쪽 면에서 약 0.12m), rot : 앞면이 향하는 방향(°, 180 = 남쪽, -90 = 동쪽, 90 = 서쪽)
     tilt : 아래로 숙인 각도(°), w·h·d : 크기(기본 0.25 × 0.35 × 0.2), top : 위 끝 높이(기본 천장 바로 아래)   */
  speakers: [
    { x:7.12,  z:0.36, rot:200 },   // 앞벽(북쪽) 왼쪽 모서리, 방 안쪽으로 살짝
    { x:12.0,  z:0.36, rot:160 },   // 앞벽(북쪽) 오른쪽 모서리
    { x:7.02,  z:7.6,  rot:-90 },   // 서쪽 벽 뒤쪽 (단상에서 본 사진)
    { x:12.09, z:5.0,  rot:90 }     // 동쪽 벽 가운데
  ],

  furniture: [
    /* --- 소회의실 (x0~2.63, z0~6.22) --- */
    { type:'tableSet', x:1.285, z:2.91, w:0.95, d:2.24, top:'darkTop', chairsLeft:3, chairsRight:3, chairInset:0.3, legInset:0.1 },   // 블랙 미팅 테이블 x0.81–1.76, z1.79–4.03 + 의자 3+3
    { type:'whiteboard', x:2.52, z:4.75, w:1.5, rot:90 },
    { type:'barCounter', x:0.45, z:0.98, w:0.42, d:1.24 },          // 창가 L자 바 테이블 — 서쪽 창 쪽
    { type:'barCounter', x:1.6, z:0.45, w:1.88, d:0.42 },           // 창가 L자 바 테이블 — 북쪽 창 쪽
    { type:'stool', x:2.0, z:0.95, color:'fabricGray',  h:0.68 },
    { type:'stool', x:2.38, z:0.95, color:'fabricOrange', h:0.68 },
    { type:'cabinet', x:0.42, z:5.6, w:0.35, d:0.9, h:0.6, color:'black' },
    { type:'block', x:0.45, z:1.3, w:0.08, d:0.06, h:0.14, y:1.02, color:'black' },   // 바 테이블 위 폰 거치대

    /* --- 회의실 (x2.63~6.75, z0~6.22) --- */
    { type:'block', x:2.63, z:6.22, w:0.16, d:0.08, h:2.7, color:'black' },   // 두 문 사이 블랙 기둥(벽 끝 마감)
    { type:'tableSet', x:4.63, z:1.83, w:0.98, d:2.1, top:'white', chairsLeft:3, chairsRight:3 },    // 회의 테이블 ① x4.14–5.12, z0.78–2.88
    { type:'tableSet', x:4.63, z:4.115, w:0.98, d:2.13, top:'white', chairsLeft:3, chairsRight:3 },  // 회의 테이블 ② x4.14–5.12, z3.05–5.18 (총 12석)
    // 천장 매입형 전동 스크린: 사진(IMG_0391·0393)처럼 창문 쪽(북쪽) 벽 앞 천장에서 내려와 긴 테이블 축을 바라봄. 북쪽 벽 안쪽 면(z0.24)에서 0.35m 앞
    { type:'ceilingScreen', x:4.63, z:0.59, w:2.0, h:1.65 },   // 아래 바가 바닥에서 약 0.95m
    { type:'whiteboard', x:2.72, z:3.0, w:2.0, rot:-90 },
    { type:'cabinet', x:6.05, z:0.45, w:0.9, d:0.4, h:0.6, color:'white' },

    /* --- 교육장 (x6.75~12.45, z0~9.18) --- */
    { type:'stage', x:9.555, z:0.87, w:5.31, d:1.26, h:0.2, top:'darkTop', stepX:0.9 },   // 단상: 북쪽 벽 전체(벽 안쪽 면 사이), z0.24–1.5, 높이 0.2, 계단은 통로 앞
    // 천장 매입형 전동 스크린: 북쪽 벽·창문에서 약 0.4m 앞 천장에서 내려옴 (2.4 × 1.45m, 단상·방 가운데)
    { type:'ceilingScreen', x:9.555, z:0.64, w:2.4, h:1.45 },
    { type:'podium', x:7.65, z:0.9, w:0.62, d:0.48, rot:180, elev:0.2 },   // 발표용 강연대 — 단상 왼쪽 (x7.2–8.1, z0.6–1.2)
    { type:'whiteboard', x:6.92, z:5.0, w:7.4, rot:-90, style:'glass' },   // 서쪽 벽 연두 유리 화이트보드 0.9~2.1m + 레지
    { type:'whiteboard', x:12.19, z:5.0, w:7.4, rot:90, style:'glass' },   // 동쪽 벽도 같은 연두 유리 화이트보드 (단상에서 본 사진 11/19)
    // 수강 책상 5줄(간격 1.15m — 맨 뒷줄 의자 등받이 z≈7.8, 교육장 문 열림 반경(경첩 x11.0, 0.95m → z≈8.2) 밖): 붙은 책상 2개 | 통로 x9.92–10.98 | 동쪽 벽 쪽 1개. 책상마다 의자 2개(총 30석), 의자는 단상(북쪽)을 바라봄
    { type:'array', xs:[7.70],   zs:[2.4, 3.55, 4.7, 5.85, 7.0], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } },   // x6.97–8.43
    { type:'array', xs:[9.19],   zs:[2.4, 3.55, 4.7, 5.85, 7.0], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } },   // x8.46–9.92
    { type:'array', xs:[11.595], zs:[2.4, 3.55, 4.7, 5.85, 7.0], item:{ type:'deskPair', w:1.23, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } },   // x10.98–12.21(동쪽 벽 안쪽 면)
    // 교육장 뒤쪽 벽(남쪽, 안쪽 면 z9.03) — 단상에서 문을 본 사진(11/19)
    { type:'clock', x:9.55, z:9.03, y:2.1 },                              // 둥근 벽시계
    { type:'exitSign', x:11.475, z:9.03, y:2.2 },                         // 문 위 비상구 유도등
    { type:'block', x:10.86, z:9.02, w:0.08, d:0.02, h:0.12, y:1.15, color:'white' },   // 문 옆 키패드/스위치
    { type:'heater', x:9.2, z:8.96, w:1.2, h:0.5 },                       // 저상형 히터
    { type:'purifier', x:7.7, z:8.8 },                                    // 공기청정기(라운지와 같은 모델)
    { type:'block', x:10.45, z:5.3, w:0.12, d:0.12, h:0.006, color:'metal' },   // 바닥 콘센트 커버
    // 교육장 입구(라운지 쪽): 문 왼쪽 백라이트 TV 패널 + 배너, 오른쪽 슬랫 + 화분
    { type:'tvWall', x:9.85, z:9.38, w:2.0, rot:180 },
    { type:'signStand', x:10.35, z:9.85 },
    { type:'signStand', x:10.7, z:9.85 },
    { type:'slats', from:[12.0, 9.37], to:[12.2, 9.37], h:2.6, count:3 },
    { type:'plant', x:12.07, z:9.75, scale:0.9 },

    /* --- NEOBOX 부스 (스케치 폭 그대로, 내부 책상·모니터는 폭에 맞게 축소) --- */
    { type:'booth', x:0.97,  z:11.4, w:1.26, d:1.2, label:'NEOBOX1' },   // x0.34–1.60
    { type:'booth', x:2.685, z:11.4, w:1.29, d:1.2, label:'NEOBOX2' },   // x2.04–3.33
    { type:'booth', x:4.395, z:11.4, w:1.29, d:1.2, label:'NEOBOX3' },   // x3.75–5.04

    /* --- 커피존 (x5.24~9.52, z11.2~12.1) --- */
    { type:'slats', from:[5.16, 11.85], to:[5.16, 10.85], h:2.45, count:9, thick:true },
    { type:'pantry', x:7.38, z:11.56, w:4.28 },

    /* --- 라운지 --- */
    { type:'barCounter', x:0.39, z:8.1, w:0.5, d:3.0, h:1.04 },         // 서쪽 몰딩 벽 바 테이블
    { type:'array', xs:[0.97], zs:[6.9, 7.5, 8.1, 8.7, 9.3],
      item:{ type:'stool', h:0.72 }, colors:['fabricRed','fabricRed','fabricGray','fabricRed','fabricGray'] },
    { type:'cube', x:4.6,  z:6.55, color:'fabricGreen' },
    { type:'cube', x:5.05, z:6.55, color:'fabricBlue' },
    { type:'cube', x:5.5,  z:6.55, color:'fabricRed' },
    { type:'bench', x:6.35, z:7.3, w:0.5, d:1.6, color:'fabricGray' },  // 교육장 벽 쪽 회색 벤치
    { type:'roundTable', x:5.4, z:7.35 },
    { type:'armchair', x:4.75, z:7.95, rot:9,  color:'fabricTeal' },
    { type:'armchair', x:5.75, z:8.3, rot:99, color:'fabricBeige' },
    { type:'purifier', x:6.35, z:8.6 },

    /* --- 입구 --- */
    { type:'mat', x:11.1, z:11.4, w:1.6, d:0.9, color:'orange' }
  ]
};
