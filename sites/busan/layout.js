/* =====================================================================
   부산 교육장 — 공간 설정 파일 (sites/busan/layout.js)  ※ 준비 중(임시 빈 공간)
   사진·도면을 받으면 서울 구로(sites/seoul/layout.js)와 같은 형식으로 채워 주세요.
   기준점(0,0) = 건물 왼쪽 위(북서쪽) 바깥 모서리, x = 동쪽, z = 남쪽, 단위 m
   ===================================================================== */
window.LAYOUT = {
  building: { name: '부산 교육장', width: 10, depth: 8, ceiling: 2.7, eye: 1.6, wall: { exterior: 0.24, interior: 0.14, thick: 0.30 } },
  photoDir: 'sites/busan/photos/',
  rooms: [
    { id:'entrance', name:'부산 교육장', en:'Coming soon', rect:[0, 0, 10, 8], floor:'floor',
      label:[5, 4], labelY:1.8, jump:{ x:5, z:6.6, look:[5, 1] },
      card:{ photos:[], desc:'부산 교육장 3D 투어는 준비 중이에요. 사진과 도면을 받으면 실제 공간으로 만들어 드릴게요.' } }
  ],
  start: { mode:'orbit', room:'entrance' },
  walls: [
    { from:[0, 0],  to:[10, 0], type:'solid', outer:true, sign:{ text:'준비 중 · COMING SOON', at:5, y:1.6, size:0.22 } },
    { from:[0, 0],  to:[0, 8],  type:'solid', outer:true },
    { from:[0, 8],  to:[10, 8], type:'solid', outer:true },
    { from:[10, 0], to:[10, 8], type:'solid', outer:true }
  ],
  columns: [],
  ceiling: { panels: [ { rect:[0, 0, 10, 8], nx:3, nz:2 } ], strips: [], projectors: [], downlights: [], aircon: [] },
  equipment: [],
  furniture: []
};
