/* 교육장 목록 (첫 화면 선택 카드 + ?site= 바로가기)
   id     : 주소에 쓰는 이름 (?site=id), 레이아웃은 sites/<id>/layout.js
   ready  : false 면 카드에 '준비 중' 표시 (바로가기 주소로는 임시 공간이 열려요)
   title / brand / addr : 투어 화면 왼쪽 위 제목 상자에 표시
   thumb  : 카드 이미지 (없으면 기본 그림)   */
window.SITES = [
  { id:'seoul',   name:'서울 구로', sub:'Neoful Business Space', ready:true,
    title:'네오비즈니스 3D 투어', brand:'NEOIZE · NEOFUL BUSINESS SPACE', addr:'서울시 구로구 디지털로26길 43, L동 210호 (2F)',
    desc:'교육장 55㎡ · 30명 / 회의실 23㎡ · 12명 / 소회의실 · NEOBOX · 라운지', thumb:'shot_plan.png' },
  { id:'daejeon', name:'대전 교육장', sub:'Daejeon Education Center', ready:true,
    title:'대전 교육장', brand:'NEOIZE · DAEJEON EDUCATION CENTER', addr:'대전시 서구 둔산서로 59 고운손빌딩 1002호 (10층)', desc:'10층 엘리베이터 바로 옆 출입문 · L자 교육장 · 책상 4줄(32석) · 전동 스크린 · 정수기·제빙기·커피머신', thumb:'shot_dj_plan.png' },
  { id:'busan',   name:'부산 교육장', sub:'Busan Education Center', ready:false,
    title:'부산 교육장 3D 투어', brand:'NEOIZE · BUSAN', addr:'부산 (주소 준비 중)', desc:'사진·도면 반영 후 공개 예정' }
];
