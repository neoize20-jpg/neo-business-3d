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
    { id:'focus', name:'NEOBOX', en:'Focus Booth · NEOBOX', small:true, rect:[0.24, 10.8, 4.8, 12.1], floor:'floor',
      label:[2.7, 10.55], labelY:2.35, jump:{ x:2.7, z:9.7, look:[2.7, 12.0] },
      card:{ photos:['IMG_0398','IMG_0397','IMG_0401','IMG_0403'],
             desc:'NEOBOX1 · NEOBOX2 · NEOBOX3, 모니터와 책상이 있는 1인용 부스 3개예요. 남쪽 벽을 따라 나란히 있고, 동쪽 끝 나무 가벽 너머가 커피존이에요.' } },
    { id:'coffee', name:'커피존', en:'Pantry', small:true, rect:[4.8, 11.2, 9.2, 12.1], floor:'floor',
      label:[7.05, 11.3], labelY:1.6, jump:{ x:7.05, z:9.9, look:[7.05, 11.8] },
      card:{ photos:['IMG_0386','IMG_0387','IMG_0398'],
             desc:'공용 사용 공간(LOUNGE & AMENITIES). 흰 상·하부장 카운터에 전자레인지, 커피머신, 얼음 디스펜서, 싱크가 있고 하부장에 분리수거함(일반쓰레기·플라스틱·캔/병)이 있어요. 입구 옆 우드 슬랫 가벽 바로 뒤예요.',
             services:['정수기','커피머신','제빙기','전자레인지','공기청정기','냉난방'] } },
    { id:'entrance', name:'입구', en:'Entrance', small:true, rect:[9.2, 11.0, 12.45, 12.1], floor:'floor',
      label:[11.0, 11.6], jump:{ x:11.5, z:11.3, look:[11.2, 8.0] },
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
    // 바깥벽 — 남쪽(아래): 서쪽 벽 x0–9.6 | 고정 통유리 x9.6–10.8 | 입구 유리 양문 x10.8–12.25 (사용자 스케치 11/19 4차)
    { from:[0, 12.1],    to:[9.6, 12.1],   type:'solid', outer:true },
    { from:[9.6, 12.1],  to:[10.8, 12.1],  type:'glass', style:'clear', outer:true, t:0.24 },   // 입구 왼쪽 고정 통유리(바닥~천장)
    { from:[10.8, 12.1], to:[12.45, 12.1], type:'solid', outer:true,
      openings:[ { at:10.8, width:1.45, door:'glass', double:true, entrance:true, frame:'white' } ] },   // 입구 프레임리스 유리 양문
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

  /* 입구 바깥 복도(건물 밖 짧은 복도) + 입구 포털(바깥에서 본 모습, 사용자 사진)
     rect : 복도 [x1, z1, x2, z2] (z1 = 건물 남쪽 바깥면), portal : 세이지 그린 프레임 x0~x1, door = 양문 [x 시작, x 끝], text = 간판 글씨, room = 호수 */
  corridor: { rect:[7.8, 12.1, 13.4, 14.3],
    portal: { x0:9.4, x1:12.45, door:[10.8, 12.25], top:2.12, color:'#9BA59A', text:'Neoful business space', room:'210호' } },

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
      { x:9.69, z:5.9, aim:[9.555, 0.4], drop:0.3, color:'black', label:'빔프로젝트' },
      { x:4.63, z:4.2, aim:[4.63, 0.59], drop:0.15, color:'white', label:'빔프로젝트' }   // 회의실: 천장 흰색 프로젝터(사진 IMG_0391), 스크린을 향함   // 에어컨 뒤쪽, 내려오는 스크린 정면을 향함
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
  speakers: [   // 교육장 서쪽 벽 높은 곳, 동쪽(방 안)을 향함 — 사용자 스케치 11/19: 앞(단상 옆) 1개, 뒤 1개
    { x:7.02, z:0.5, rot:-90 },
    { x:7.02, z:8.2, rot:-90 }
  ],

  /* ---------- 교육장 책상 배치 (화면 오른쪽 위 "책상 배치 바꾸기" 버튼 / B 키로 순서대로 바뀜) ----------
     list 의 각 항목 = 배치 하나. name 은 버튼·안내에 표시, items 는 furniture 와 같은 형식.
     island : 책상 2개를 긴 변끼리 붙인 섬 { x, z(중심), len(책상 긴 변, 섬의 남북 길이), dd(책상 폭), perSide(한쪽 의자 수), basket, tents, rot }
     규칙: 교육장 문(동쪽 경첩 x11.95, 반지름 0.95m → z≈8.2 이남, x11.0~12.2)과 단상 앞(z<2.1)은 비워 두세요.   */
  deskLayouts: {
    start: 0,
    list: [
      { id:'lecture', name:'강의식', items:[
        // 단상(북쪽)을 바라보는 5줄: 붙은 책상 2개 | 통로 x9.92–10.98 | 동쪽 벽 쪽 1개, 책상마다 의자 2개 = 30석
        { type:'array', xs:[7.70],   zs:[2.4, 3.55, 4.7, 5.85, 7.0], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } },
        { type:'array', xs:[9.19],   zs:[2.4, 3.55, 4.7, 5.85, 7.0], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } },
        { type:'array', xs:[11.595], zs:[2.4, 3.55, 4.7, 5.85, 7.0], item:{ type:'deskPair', w:1.23, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } }
      ] },
      { id:'group', name:'조별', items:[
        // 사용자 사진 1: 책상 2개를 붙인 섬, 긴 축이 스크린 방향, 양쪽에 2명씩 마주 봄 — 2열 × 3줄 = 6섬 × 4명 = 24석
        { type:'array', xs:[8.0, 11.1], zs:[2.95, 5.05, 7.15], item:{ type:'island', len:1.46, dd:0.5, perSide:2, basket:true, tents:true } }
      ] },
      { id:'group_aisle', name:'조별 (가운데 통로)', items:[
        // 사용자 사진 2: 가운데 통로(x9.02–10.08)를 단상까지 비우고, 양쪽 벽 쪽에 섬 2줄 — 4섬 × 6명(한쪽 3명) = 24석
        { type:'array', xs:[8.0, 11.1], zs:[3.2, 5.9], item:{ type:'island', len:1.8, dd:0.5, perSide:3, basket:true, tents:true } }
      ] },
      { id:'ushape', name:'ㄷ자', items:[
        // 단상을 향해 열린 ㄷ자: 서쪽·동쪽 팔 책상 3개씩 + 뒤쪽 책상 2개, 의자는 바깥쪽에서 안쪽을 바라봄 = 16석
        { type:'array', xs:[7.85],  zs:[2.93, 4.39, 5.85], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver', rot:-90 } },
        { type:'array', xs:[11.25], zs:[2.93, 4.39, 5.85], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver', rot:90 } },
        { type:'array', xs:[8.83, 10.29], zs:[7.45], item:{ type:'deskPair', w:1.46, d:0.55, chairs:2, casters:true, tag:true, chairBase:'silver' } }
      ] }
    ]
  },

  /* ---------- 장비 안내 (마우스를 올리면 작은 안내 카드, 걷기 중 마우스 잠금 시에는 화면 가운데 조준점 기준) ----------
     name : 이름, room : 방 이름(작게 표시), lines : 안내 문구 줄 목록(자유롭게 수정)
     box  : [x1, z1, x2, z2, 아래높이, 위높이] — 이 상자 안의 물체에 마우스가 닿으면 표시. 여러 개면 boxes:[[...],[...]]
     label: true 면 이름을 항상 작은 글씨로 띄움 (labelAt:[x, y, z] 로 위치 지정 가능)
     ※ 아래 안내 문구의 '(예: …) — 수정 필요' 는 예시예요. 실제 내용으로 바꿔 주세요.   */
  equipment: [
    // 교육장
    { id:'edu_projector', name:'빔프로젝트', room:'교육장', box:[9.4, 5.6, 10.0, 6.15, 2.15, 2.7],
      lines:['연결 케이블: (예: HDMI) — 수정 필요', '리모컨 위치: (예: 강사 단상 서랍) — 수정 필요', '사용 방법: (예: 전원 → 입력 HDMI 선택) — 수정 필요'] },
    { id:'edu_screen', name:'전동 스크린', room:'교육장', box:[8.3, 0.28, 10.8, 0.52, 1.05, 2.7],
      lines:['내리기/올리기: (예: 벽 스위치) — 수정 필요', '크기: 약 2.4m 폭(3D 모델 기준)'] },
    { id:'edu_speaker', name:'스피커', room:'교육장', boxes:[[6.85, 0.2, 7.3, 0.8, 2.2, 2.7], [6.85, 7.9, 7.3, 8.5, 2.2, 2.7]],
      lines:['음량 조절: (예: 앰프·리모컨 위치) — 수정 필요', '마이크: (예: 무선 마이크 2개) — 수정 필요'] },
    { id:'edu_ac', name:'에어컨', room:'교육장', box:[9.15, 3.45, 10.25, 4.55, 2.5, 2.75],
      lines:['리모컨/조작: (예: 출입문 옆 벽 컨트롤러) — 수정 필요'] },
    { id:'edu_podium', name:'강사 단상', room:'교육장', box:[7.6, 1.0, 8.3, 1.6, 0.15, 1.5],
      lines:['구성: (예: 노트북 거치, HDMI 단자) — 수정 필요'] },
    { id:'edu_board', name:'유리 화이트보드', room:'교육장', boxes:[[6.88, 1.2, 7.08, 8.8, 0.8, 2.2], [12.08, 1.2, 12.26, 8.8, 0.8, 2.2]],
      lines:['마커·지우개: (예: 레지 위 비치) — 수정 필요'] },
    { id:'edu_clock', name:'시계', room:'교육장', box:[9.3, 8.9, 9.8, 9.1, 1.85, 2.35], lines:['뒤쪽 벽 시계'] },
    { id:'edu_heater', name:'난방기', room:'교육장', box:[8.55, 8.8, 9.85, 9.1, 0, 0.6], lines:['사용 방법: (예: 전원 스위치 위치) — 수정 필요'] },
    { id:'edu_purifier', name:'공기청정기', room:'교육장', box:[7.45, 8.55, 7.95, 9.05, 0, 1.2], lines:['사용 방법: (예: 전원 버튼) — 수정 필요'] },
    // 회의실
    { id:'mtg_screen', name:'스크린', room:'회의실', box:[3.55, 0.45, 5.7, 0.75, 0.85, 2.7],
      lines:['내리기/올리기: (예: 벽 스위치) — 수정 필요'] },
    { id:'mtg_projector', name:'빔프로젝트', room:'회의실', box:[4.35, 3.95, 4.9, 4.45, 2.3, 2.7],
      lines:['연결 케이블: (예: HDMI) — 수정 필요', '리모컨 위치: (예: 테이블 위) — 수정 필요'] },
    { id:'mtg_table', name:'회의 테이블', room:'회의실', box:[4.14, 0.78, 5.12, 5.18, 0.6, 0.8],
      lines:['테이블 2개 · 12석', '전원: (예: 테이블 콘센트) — 수정 필요'] },
    // 커피존 (항상 이름 표시)
    { id:'microwave', name:'전자레인지', room:'커피존', box:[8.37, 11.3, 8.87, 11.8, 0.9, 1.22], label:true,
      lines:['사용 후 문을 닫아 주세요 (예시) — 수정 필요'] },
    { id:'coffee', name:'커피머신', room:'커피존', box:[7.94, 11.3, 8.3, 11.8, 0.9, 1.62], label:true,
      lines:['사용 방법: (예: 컵 올리고 메뉴 선택) — 수정 필요', '원두 보충: (예: 상부장) — 수정 필요'] },
    { id:'ice', name:'제빙기', room:'커피존', box:[7.52, 11.3, 7.88, 11.8, 0.9, 1.37], label:true,
      lines:['사용 방법: (예: 컵을 대고 버튼) — 수정 필요'] },
    { id:'water', name:'정수기', room:'커피존 · 개수대', boxes:[[5.22, 11.3, 5.82, 11.86, 0.88, 1.38]], labelAt:[5.52, 1.42, 11.32], label:true,
      lines:['냉수·온수: (예: 온수 잠금 버튼) — 수정 필요'] }
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
    { type:'stage', x:9.6, z:1.3, w:4.0, d:0.6, h:0.2, top:'darkTop', stepX:0.9 },   // 단상: x7.6–11.6, z1.0–1.6 (양 끝 0.6m 이상 비워 뒤로 들어갈 수 있음), 높이 0.2 — 뒤(창문 쪽 z0.24–1.0)로 걸어갈 수 있게 깊이를 줄임 (사용자 11/19)
    // 천장 매입형 전동 스크린: 북쪽 벽·창문에서 약 0.4m 앞 천장에서 내려옴 (2.4 × 1.45m, 단상·방 가운데)
    { type:'ceilingScreen', x:9.555, z:0.4, w:2.4, h:1.45 },
    { type:'podium', x:7.95, z:1.36, w:0.62, d:0.48, rot:180, elev:0.2 },   // 발표용 강연대 — 단상 왼쪽 끝 위 (x7.64–8.26, z1.12–1.6)
    { type:'whiteboard', x:6.92, z:5.0, w:7.4, rot:-90, style:'glass' },   // 서쪽 벽 연두 유리 화이트보드 0.9~2.1m + 레지
    { type:'whiteboard', x:12.19, z:5.0, w:7.4, rot:90, style:'glass' },   // 동쪽 벽도 같은 연두 유리 화이트보드 (단상에서 본 사진 11/19)
    // 수강 책상은 아래 deskLayouts(책상 배치 바꾸기)에서 정해요.
    // (강의식) 수강 책상 5줄(간격 1.15m — 맨 뒷줄 의자 등받이 z≈7.8, 교육장 문 열림 반경(경첩 x11.0, 0.95m → z≈8.2) 밖): 붙은 책상 2개 | 통로 x9.92–10.98 | 동쪽 벽 쪽 1개. 책상마다 의자 2개(총 30석), 의자는 단상(북쪽)을 바라봄
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
    { type:'booth', x:2.545, z:11.4, w:1.29, d:1.2, label:'NEOBOX2' },   // x1.90–3.19
    { type:'booth', x:4.135, z:11.4, w:1.29, d:1.2, label:'NEOBOX3' },   // x3.49–4.78 (가벽 x4.95 앞)

    /* --- 남쪽 벽, 서쪽부터: NEOBOX(x0.34–4.78) → 가벽(슬랫 x4.95) → 커피존 카운터(x5.1–9.0) → 고정 유리(x9.6–10.8) → 입구 양문(x10.8–12.25) --- */
    { type:'slats', from:[4.95, 11.85], to:[4.95, 10.85], h:2.45, count:9, thick:true },   // 가벽: NEOBOX3 과 커피존 카운터 사이
    { type:'pantry', x:7.05, z:11.56, w:3.9 },   // 커피존 카운터 x5.1–9.0: 서쪽 끝(가벽 옆) 싱크+정수기 … 동쪽으로 제빙기·커피머신·전자레인지(동쪽 끝)
    { type:'zzPlant', x:9.32, z:11.68, scale:1.25 },   // 흰 화분 ZZ 플랜트 (카운터 동쪽 끝과 입구 고정 유리 사이)

    /* --- 라운지 --- */
    { type:'barCounter', x:0.39, z:8.1, w:0.5, d:3.0, h:1.04 },         // 서쪽 몰딩 벽 바 테이블
    { type:'array', xs:[0.97], zs:[6.9, 7.5, 8.1, 8.7, 9.3],
      item:{ type:'stool', h:0.72 }, colors:['fabricRed','fabricRed','fabricGray','fabricRed','fabricGray'] },
    // 라운지 북동쪽 코너 (사진: NEOBOX 쪽에서 회의실 유리를 본 모습) — 회의실 유리(z6.22) 앞 큐브 줄 + 교육장 몰딩 벽(x6.6) 앞 L자 회색 벤치
    { type:'cube', x:4.55, z:6.58, color:'fabricGreen' },
    { type:'cube', x:5.0,  z:6.58, color:'fabricBlue' },
    { type:'cube', x:5.45, z:6.58, color:'fabricGreen' },
    { type:'cube', x:5.9,  z:6.58, color:'fabricOrange' },
    { type:'bench', x:6.36, z:7.36, w:0.45, d:1.92, h:0.42, color:'fabricGray' },  // 몰딩 벽 아래 벤치 z6.4–8.32 (벽 끝 z9.18 안쪽에 벤치·큐브·청정기가 모두 들어가게)
    { type:'cube', x:6.36, z:8.55, color:'fabricOrange' },                         // 벤치 남쪽 끝 주황 큐브 z8.34–8.76
    { type:'roundTable', x:5.0,  z:7.22, r:0.3, h:0.72 },                          // 큐브 앞 카페 테이블
    { type:'roundTable', x:5.75, z:7.78, r:0.3, h:0.72 },                          // 벤치 앞(코너 쪽) 카페 테이블
    { type:'armchair', x:5.0,  z:8.55, rot:0, color:'fabricTeal' },               // 청록 암체어 — 카페 테이블(5.0, 7.22)을 정면으로 봄
    { type:'armchair', x:5.75, z:8.55, rot:0, color:'fabricBeige' },              // 베이지 암체어 — 옆에 나란히, 테이블(5.75, 7.78)을 봄
    { type:'purifier', x:6.4, z:8.96 },                                            // LG 공기청정기 z8.80–9.13 — 몰딩 벽 남쪽 끝(z9.18)보다 5cm 안쪽

    /* --- 입구 --- */
    { type:'mat', x:11.52, z:11.4, w:1.4, d:0.8, color:'orange' }
  ]
};
