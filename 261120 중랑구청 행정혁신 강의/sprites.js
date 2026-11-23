// 픽셀 스프라이트와 배경 장면을 코드로 그린다 (외부 이미지 없음)
(() => {
  'use strict';
  const INK = '#141833';

  // ---- 캐릭터: 공통 몸 템플릿 + 팔레트 ----
  const BODY = [
    '....HHHHHH....',
    '..HHHHHHHHHH..',
    '.HHHHHHHHHHHH.',
    '.HHHHHHHHHHHH.',
    '.HHssHssssHHH.',
    '.Hsssssssssss.',
    '.sskksssskkss.',
    '.sskksssskkss.',
    '.sCsssssssCss.',
    '..sssskkssss..',
    '...SssssssS...',
    '....SSSSSS....',
    '..TTTTAATTTT..',
    '.TTTTTAATTTTT.',
    '.TTTTTAATTTTT.',
    '.sTTTTAATTTTs.',
    '.sTTTTTTTTTTs.',
    '..TTTTTTTTTT..',
    '..PPPPPPPPPP..',
    '..PPPP..PPPP..',
    '..kkkk..kkkk..'
  ];
  const SKIN = { s: '#f4c7a1', S: '#d99a74', C: '#f59a9a', k: INK };
  const CHARS = {
    hero:   { H: '#1f1a24', T: '#2b2f3a', A: '#6b7350', P: '#3a4366' },
    friend: { H: '#5a3b2a', T: '#8a5cf0', A: '#c9b6ff', P: '#2b2f3a', phones: '#ff5d8f' },
    mentor: { H: '#2a2230', T: '#3b6fd4', A: '#ffc93c', P: '#2b2f3a' },
    boss:   { H: '#b9bcc8', T: '#2a3566', A: '#e0465a', P: '#2a3566', collar: '#ffffff' },
    staff1: { H: '#3a2a20', T: '#4fa37a', A: '#ffffff', P: '#2b2f3a', long: 1 },
    staff2: { H: '#1f1a24', T: '#c9cfe0', A: '#7a86b8', P: '#3a4366' },
    staff3: { H: '#6a4630', T: '#e0965a', A: '#fff2cc', P: '#2b2f3a', long: 1 },
    staff4: { H: '#1f1a24', T: '#8a93a8', A: '#3b6fd4', P: '#2a3566' },
    budget: { H: '#2a2230', T: '#5e6b8a', A: '#ffc93c', P: '#2a3566', collar: '#ffffff' },
    ryu:    { H: '#1f1a24', T: '#f2f2f2', A: '#2a3566', P: '#2b2f3a' },
    won:    { H: '#2a2230', T: '#3d8a35', A: '#ffffff', P: '#2a3566', collar: '#ffffff' },
    student:{ H: '#5a3b2a', T: '#ff9f43', A: '#fff2cc', P: '#3a4366' }
  };

  function charGrid(name) {
    const c = CHARS[name];
    const g = BODY.map(r => r.split(''));
    if (c.long) for (let y = 4; y <= 12; y++) { g[y][0] = 'H'; g[y][13] = 'H'; if (y < 11) { g[y][1] = 'H'; g[y][12] = 'H'; } }
    if (c.phones) { for (let x = 1; x <= 12; x++) g[1][x] = 'E'; for (let y = 5; y <= 8; y++) { g[y][0] = 'E'; g[y][13] = 'E'; } }
    if (c.collar) { g[12][5] = 'W'; g[12][8] = 'W'; }
    const pal = { ...SKIN, H: c.H, T: c.T, A: c.A, P: c.P, E: c.phones, W: c.collar };
    return { grid: g, pal };
  }

  // ---- 소품 ----
  const PROPS = {
    trophy: { pal: { y: '#ffc93c', Y: '#d9962b', d: '#b87a1e', w: '#fff7c2', k: INK }, map: [
      '...yyyyyyyy...', '.YYyyyyyywyYY.', 'Y..yyyyywwy..Y', 'Y..yyyyyywy..Y', '.Y.yyyyyyyy.Y.', '..YYyyyyyyYY..',
      '....yyyyyy....', '.....dyyd.....', '......yy......', '......yy......', '....dyyyyd....', '...kkkkkkkk...', '...kyyyyyyk...', '...kkkkkkkk...'] },
    star: { pal: { y: '#ffc93c', w: '#fff7c2' }, map: [
      '....y....', '...ywy...', '...yyy...', 'yyyyyyyyy', '.yyyyyyy.', '..yyyyy..', '.yyy.yyy.', 'yy.....yy'] },
    paper: { pal: { w: '#ffffff', g: '#c7cbe0', p: '#ff5d8f' }, map: [
      'wwwwwwww..', 'wggggggww.', 'wwwwwwwwww', 'wggggggggw', 'wwwwwwwwww', 'wggggggggw', 'wwwwwwwwww', 'wpppwwwwww', 'wwwwwwwwww', 'wggggggggw', 'wwwwwwwwww'] },
    monitor: { pal: { k: '#2b2f3a', b: '#1c2a4a', g: '#4fe0a6', y: '#ffc93c', p: '#ff5d8f', s: '#8a93a8' }, map: [
      'kkkkkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbbbbk', 'kbggggbbbbbbbbbbbk', 'kbbbyyyyybbbbbbbbk', 'kbbbbbbggggggbbbbk', 'kbbbppppbbbbbbbbbk',
      'kbbbbbbbgggbbbbbbk', 'kbggggggbbbbbbbbbk', 'kbbbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkkkk', '.......ssss.......', '.....ssssssss.....'] },
    phone: { pal: { k: '#2b2f3a', b: '#86d6f6', w: '#ffffff' }, map: [
      'kkkkkk', 'kbbbbk', 'kbwwbk', 'kbbbbk', 'kbwbbk', 'kbbbbk', 'kkkkkk', 'kkwwkk'] },
    mail: { pal: { w: '#ffffff', g: '#c7cbe0', p: '#ff5d8f' }, map: [
      'wwwwwwwwwwww', 'gwwwwwwwwwwg', 'wgwwwwwwwwgw', 'wwgwwppwwgww', 'wwwgwppwgwww', 'wwwwggggwwww', 'wwwwwwwwwwww', 'wwwwwwwwwwww'] },
    excel: { pal: { g: '#1d7a45', G: '#2fae64', w: '#ffffff' }, map: [
      'gggggggggggg', 'gGGGGGGGGGGg', 'gGwwGGGGwwGg', 'gGGwwGGwwGGg', 'gGGGwwwwGGGg', 'gGGGGwwGGGGg', 'gGGGwwwwGGGg', 'gGGwwGGwwGGg', 'gGwwGGGGwwGg', 'gGGGGGGGGGGg', 'gggggggggggg'] },
    heart: { pal: { r: '#ff5d8f', w: '#ffd9e5' }, map: ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'] },
    bang: { pal: { y: '#ffc93c' }, map: ['yy', 'yy', 'yy', 'yy', '..', 'yy'] },
    medal: { pal: { r: '#e0465a', b: '#3b6fd4', y: '#ffc93c', Y: '#d9962b', w: '#fff7c2' }, map: [
      'rr....bb', '.rr..bb.', '..rrbb..', '...yy...', '..yyyy..', '.yywyyy.', '.yyyyyY.', '..yyYY..'] },
    laptop: { pal: { k: '#2b2f3a', b: '#1c2a4a', g: '#4fe0a6', y: '#ffc93c', s: '#c7cbe0', S: '#8a93a8' }, map: [
      '..kkkkkkkkkkkkkk..', '..kbbbbbbbbbbbbk..', '..kbggggbbbbbbbk..', '..kbbbyyyyybbbbk..', '..kbbbbbbgggbbbk..', '..kbggbbbbbbbbbk..', '..kbbbbbbbbbbbbk..', '..kkkkkkkkkkkkkk..',
      'ssssssssssssssssss', 'sSsSsSsSsSsSsSsSss', 'ssssssSSSSSSssssss'] },
    egg: { pal: { w: '#fff8e8', c: '#e8dcc0', s: '#ffffff' }, map: [
      '...wwww...', '..wwwwww..', '.wswwwwww.', '.swwwwwwww', 'wwwwwwwwww', 'wwwwwwwwcw', 'wwwwwwwwcw', '.wwwwwwcc.', '..wwwccc..', '...cccc...'] },
    duck: { pal: { y: '#ffd84a', Y: '#e0a92a', o: '#ff8a3c', k: '#141833' }, map: [
      '....yyy....', '...yyyyy...', '...ykyyyoo.', '...yyyyyooo', '....yyy....', 'y..yyyyy...', 'yyyyyyyyyy.', 'yyYYYYYyyy.', '.yyyyyyyy..', '..yyyyyy...'] },
    bolt: { pal: { y: '#ffc93c' }, map: ['...yy', '..yy.', '.yyyy', 'yyyy.', '..yy.', '.yy..', 'yy...'] }
  };

  function withOutline(grid) {
    const h = grid.length, w = Math.max(...grid.map(r => r.length));
    const out = Array.from({ length: h + 2 }, () => Array(w + 2).fill('.'));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y + 1][x + 1] = grid[y][x] || '.';
    const solid = (y, x) => out[y] && out[y][x] && out[y][x] !== '.' && out[y][x] !== 'O';
    for (let y = 0; y < h + 2; y++) for (let x = 0; x < w + 2; x++)
      if (out[y][x] === '.' && (solid(y - 1, x) || solid(y + 1, x) || solid(y, x - 1) || solid(y, x + 1))) out[y][x] = 'O';
    return out;
  }

  function paint(canvas, grid, pal, outline) {
    const g = outline ? withOutline(grid) : grid.map(r => (typeof r === 'string' ? r.split('') : r));
    const h = g.length, w = Math.max(...g.map(r => r.length));
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = g[y][x];
      if (!ch || ch === '.') continue;
      ctx.fillStyle = ch === 'O' ? INK : (pal[ch] || INK);
      ctx.fillRect(x, y, 1, 1);
    }
    return [w, h];
  }

  function drawSprite(canvas) {
    const name = canvas.dataset.sp, scale = +(canvas.dataset.scale || 8);
    let size;
    if (CHARS[name]) { const { grid, pal } = charGrid(name); size = paint(canvas, grid, pal, true); }
    else if (PROPS[name]) size = paint(canvas, PROPS[name].map, PROPS[name].pal, canvas.dataset.outline !== '0');
    else return;
    canvas.style.width = size[0] * scale + 'px';
    canvas.style.height = size[1] * scale + 'px';
  }

  // ---- 배경 장면 (160×90, 1칸 = 10px) ----
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const SCENES = {
    city(c, night) {
      const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(0, 0, 160, 22, night ? '#1f2650' : '#4fb8ec'); R(0, 22, 160, 18, night ? '#2c3672' : '#86d6f6'); R(0, 40, 160, 24, night ? '#3d4a92' : '#c4eefc');
      cloud(R, 14, 10, night); cloud(R, 104, 6, night); cloud(R, 62, 26, night);
      // 시청 건물
      R(84, 30, 66, 4, '#3d4a92'); R(88, 26, 58, 4, '#3d4a92'); R(96, 22, 42, 4, '#3d4a92');
      R(86, 34, 62, 32, '#e6edf6');
      for (let y = 36; y < 62; y += 5) for (let x = 89; x < 146; x += 6) R(x, y, 4, 3, night && rand() > .5 ? '#ffc93c' : '#6fa8dc');
      R(110, 54, 14, 12, '#2c3672'); R(112, 56, 10, 10, '#86d6f6');
      R(100, 14, 1, 12, '#8a93a8'); R(101, 14, 6, 4, '#e0465a');
      tree(R, 72, 50); tree(R, 150, 52); tree(R, 4, 52);
      R(0, 64, 160, 26, '#5bb84a'); R(0, 64, 160, 2, '#7fd36a');
      R(0, 74, 160, 8, '#e8d9a8'); R(0, 74, 160, 1, '#cbb98a');
      for (let x = 0; x < 160; x += 9) R(x + 3, 86, 2, 1, '#3d8a35');
    },
    office(c, night) {
      const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(0, 0, 160, 62, night ? '#2c3150' : '#efe6cf'); R(0, 56, 160, 6, night ? '#232842' : '#d9cba8');
      R(12, 8, 44, 30, '#3d4a92'); R(14, 10, 40, 26, night ? '#1f2650' : '#86d6f6'); R(33, 10, 2, 26, '#3d4a92'); R(14, 22, 40, 2, '#3d4a92');
      if (night) { R(42, 13, 5, 5, '#fff7c2'); R(44, 13, 3, 3, '#1f2650'); } else { R(18, 14, 8, 2, '#fff'); R(40, 28, 10, 2, '#fff'); }
      R(126, 20, 24, 42, night ? '#3a3f5e' : '#9aa3c4'); for (let y = 24; y < 60; y += 12) { R(128, y, 20, 9, night ? '#4a5070' : '#b7bfdc'); R(136, y + 4, 4, 1, '#2b2f3a'); }
      R(68, 6, 18, 12, night ? '#4a5070' : '#fff'); R(70, 8, 14, 1, '#c7cbe0'); R(70, 11, 10, 1, '#c7cbe0'); R(70, 14, 12, 1, '#ff5d8f');
      R(0, 62, 160, 28, night ? '#4a3a32' : '#c08f5e'); for (let y = 66; y < 90; y += 6) R(0, y, 160, 1, night ? '#3a2d26' : '#a7784b');
      R(60, 50, 56, 4, '#8a5a3a'); R(60, 50, 56, 1, '#a7744d'); R(62, 54, 3, 12, '#5e3c26'); R(111, 54, 3, 12, '#5e3c26');
      if (night) { c.fillStyle = 'rgba(79,224,166,.18)'; c.fillRect(60, 30, 50, 40); }
    },
    meeting(c) {
      const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(0, 0, 160, 60, '#dfe5f3'); R(0, 54, 160, 6, '#c3cbe2');
      R(102, 8, 42, 24, '#3d4a92'); R(104, 10, 38, 20, '#86d6f6'); R(122, 10, 2, 20, '#3d4a92');
      R(0, 60, 160, 30, '#8a93a8'); for (let x = 0; x < 160; x += 8) R(x, 60, 1, 30, '#7a83a0');
      R(60, 58, 96, 8, '#8a5a3a'); R(60, 58, 96, 2, '#a7744d'); R(66, 66, 3, 14, '#5e3c26'); R(146, 66, 3, 14, '#5e3c26');
    },
    hall(c) {
      const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(0, 0, 160, 50, '#2c3672'); R(0, 0, 18, 50, '#b83a52'); R(142, 0, 18, 50, '#b83a52'); R(0, 0, 160, 6, '#8f2a40');
      for (let x = 2; x < 18; x += 4) R(x, 6, 1, 44, '#8f2a40'); for (let x = 144; x < 160; x += 4) R(x, 6, 1, 44, '#8f2a40');
      R(44, 6, 72, 26, '#141833'); R(46, 8, 68, 22, '#3d4a92'); R(52, 14, 30, 3, '#ffc93c'); R(52, 20, 50, 2, '#86d6f6'); R(52, 24, 40, 2, '#86d6f6');
      R(0, 44, 160, 10, '#8a5a3a'); R(0, 44, 160, 2, '#a7744d');
      R(0, 54, 160, 36, '#1f2650');
      seed = 11;
      const hair = ['#1f1a24', '#3a2a20', '#1f1a24', '#6a4630', '#2a2230', '#b9bcc8'];
      for (let row = 0; row < 5; row++) {
        const y = 58 + row * 7, size = 4 + Math.floor(row / 2);
        for (let x = 2 + (row % 2) * 4; x < 160; x += size + 3) {
          R(x, y, size, size, hair[Math.floor(rand() * hair.length)]);
          R(x - 1, y + size, size + 2, 3, ['#3b6fd4', '#c9cfe0', '#4fa37a', '#8a93a8', '#2b2f3a'][Math.floor(rand() * 5)]);
        }
      }
    },
    river(c) {
      const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(0, 0, 160, 20, '#e9a07a'); R(0, 20, 160, 14, '#f2c094'); R(0, 34, 160, 10, '#f7dcb4');
      R(110, 8, 12, 12, '#fff2cc'); R(108, 10, 16, 8, '#fff2cc');
      R(0, 40, 160, 6, '#7a9a6a'); for (let x = 0; x < 160; x += 14) R(x, 38, 8, 2, '#7a9a6a');
      R(0, 46, 160, 30, '#3b7fc4');
      for (let y = 50; y < 76; y += 5) for (let x = (y % 10) ? 4 : 12; x < 160; x += 22) R(x, y, 8, 1, '#7fb8ea');
      R(0, 76, 160, 14, '#c9b07a'); R(0, 76, 160, 2, '#a88f5c'); for (let x = 3; x < 160; x += 11) R(x, 82, 3, 2, '#a88f5c');
    },
    elevator(c) { elevatorScene((x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }); },
    map(c) {
      const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
      R(0, 0, 160, 90, '#4fb8ec');
      for (let y = 4; y < 90; y += 8) for (let x = (y % 16) ? 6 : 0; x < 160; x += 18) R(x, y, 5, 1, '#86d6f6');
      for (let y = 2; y < 88; y++) {
        const l = Math.round(56 + 6 * Math.sin(y / 7) - (y > 60 ? (y - 60) * .3 : 0));
        const r = Math.round(104 + 5 * Math.sin(y / 5 + 1) - (y < 18 ? (18 - y) * .8 : 0) - (y > 70 ? (y - 70) * .5 : 0));
        R(l, y, r - l, 1, '#8fd18a'); R(l, y, 1, 1, '#5bb84a'); R(r - 1, y, 1, 1, '#5bb84a');
      }
      for (let i = 0; i < 26; i++) R(66 + (i * 13) % 30, 10 + (i * 17) % 70, 3, 2, '#5bb84a');
    }
  };
  // 엘리베이터 내부 (160x90). 위쪽 중앙 TV 화면 = 격자 (52,8) 56x32 → 화면 좌표 left:520px top:80px 560x320
  function elevatorScene(R) {
    // 천장
    R(0, 0, 160, 5, '#3a4060'); R(0, 4, 160, 1, '#2b2f48');
    for (let x = 30; x < 132; x += 26) { R(x, 1, 20, 2, '#fffbe8'); R(x + 1, 3, 18, 1, '#e8e2c8'); }
    // 뒷벽 (스테인리스 패널)
    R(22, 5, 116, 57, '#c3cada');
    for (let x = 22; x < 138; x += 29) { R(x, 5, 1, 57, '#9aa3b8'); R(x + 1, 5, 1, 57, '#e4e9f2'); }
    for (let y = 8; y < 60; y += 3) for (let x = 24; x < 137; x += 7) R(x + ((y / 3) % 2) * 3, y, 2, 1, '#d2d8e4');
    R(22, 5, 116, 2, '#a7afc4');
    // 옆벽 (원근)
    for (let x = 0; x < 22; x++) {
      const t = (22 - x) / 22, top = Math.round(5 - 5 * t), bot = Math.round(62 + 28 * t);
      R(x, top, 1, bot - top, '#a3abc0'); R(159 - x, top, 1, bot - top, '#a3abc0');
      if (x % 7 === 0) { R(x, top, 1, bot - top, '#8a93a8'); R(159 - x, top, 1, bot - top, '#8a93a8'); }
      const hy = Math.round(46 + 12 * t); R(x, hy, 1, 2, '#e8ecf4'); R(x, hy + 2, 1, 1, '#6a7290'); R(159 - x, hy, 1, 2, '#e8ecf4'); R(159 - x, hy + 2, 1, 1, '#6a7290');
    }
    R(21, 5, 1, 57, '#7a83a0'); R(138, 5, 1, 57, '#7a83a0');
    // 손잡이 (뒷벽)
    R(24, 46, 112, 2, '#eef1f7'); R(24, 48, 112, 1, '#6a7290'); for (const x of [30, 80, 130]) R(x, 48, 2, 3, '#8a93a8');
    // 바닥
    R(0, 62, 160, 28, '#5a5f7a');
    for (let y = 62; y < 90; y += 7) R(0, y, 160, 1, '#4a4f68');
    for (let x = -40; x < 200; x += 16) for (let y = 62; y < 90; y++) { const xx = Math.round(80 + (x - 80) * (1 + (y - 62) / 28)); if (xx >= 0 && xx < 160) R(xx, y, 1, 1, '#4a4f68'); }
    R(22, 62, 116, 1, '#7a809c');
    // TV 거치대 + 베젤 + 화면
    R(77, 5, 6, 2, '#2b2f3a'); R(79, 5, 2, 3, '#2b2f3a');
    R(49, 6, 62, 36, '#141833'); R(50, 7, 60, 34, '#262b48'); R(50, 7, 60, 1, '#3d4470');
    R(52, 8, 56, 32, '#000000');
    R(53, 40, 54, 1, '#141833'); R(104, 40, 2, 1, '#4fe0a6');
    R(46, 42, 68, 2, 'rgba(20,24,51,.25)');
    // 층 표시기
    R(118, 12, 14, 9, '#141833'); R(119, 13, 12, 7, '#1f1416');
    R(121, 14, 1, 1, '#ff8a3c'); R(120, 15, 3, 1, '#ff8a3c'); R(119, 16, 5, 1, '#ff8a3c');
    R(125, 14, 4, 1, '#ff8a3c'); R(128, 15, 1, 1, '#ff8a3c'); R(127, 16, 1, 1, '#ff8a3c'); R(126, 17, 1, 2, '#ff8a3c');
    // 버튼 패널 (오른쪽 옆벽)
    R(146, 26, 7, 22, '#8a93a8'); R(147, 27, 5, 20, '#d8dde8');
    for (let y = 29; y < 45; y += 3) { R(148, y, 1, 1, '#ffc93c'); R(150, y, 1, 1, y === 35 ? '#ff5d8f' : '#6a7290'); }
    // 조명 반사
    R(22, 5, 116, 4, 'rgba(255,251,232,.18)');
  }
  function cloud(R, x, y, night) { const col = night ? '#3d4a92' : '#ffffff'; R(x + 3, y, 8, 3, col); R(x, y + 3, 16, 3, col); R(x + 1, y + 6, 14, 1, night ? '#2c3672' : '#d6f2fd'); }
  function tree(R, x, y) { R(x + 3, y + 8, 2, 6, '#6b4a2a'); R(x, y, 8, 8, '#3d8a35'); R(x + 1, y - 2, 6, 2, '#3d8a35'); R(x + 1, y, 4, 3, '#5bb84a'); }

  function drawScene(canvas) {
    const [kind, mod] = canvas.dataset.scene.split(':');
    canvas.width = 160; canvas.height = 90;
    const ctx = canvas.getContext('2d');
    seed = 7;
    SCENES[kind] && SCENES[kind](ctx, mod === 'night');
  }

  // 바람 줄기·나뭇잎
  function buildWind(el) {
    const n = +(el.dataset.n || 6);
    seed = 3;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.style.top = (40 + rand() * 520) + 'px';
      s.style.width = (60 + rand() * 120) + 'px';
      s.style.animationDuration = (2.6 + rand() * 2.4) + 's';
      s.style.animationDelay = (-rand() * 4) + 's';
      el.append(s);
    }
    if (el.dataset.leaves) for (let i = 0; i < 5; i++) {
      const l = document.createElement('b'); l.className = 'leaf';
      l.style.top = (120 + rand() * 600) + 'px'; l.style.animationDuration = (5 + rand() * 4) + 's'; l.style.animationDelay = (-rand() * 8) + 's';
      el.append(l);
    }
  }
  function buildSparks(el, n, cls) {
    seed = 5;
    const cols = ['#ffc93c', '#ff5d8f', '#4fe0a6', '#86d6f6', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.style.left = rand() * 100 + '%'; s.style.top = cls === 'confetti' ? '-30px' : rand() * 100 + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDuration = (cls === 'confetti' ? 2.4 + rand() * 2 : 1 + rand()) + 's';
      s.style.animationDelay = (-rand() * 3) + 's';
      el.append(s);
    }
  }

  window.Pixel = {
    init(root = document) {
      root.querySelectorAll('canvas[data-sp]').forEach(drawSprite);
      root.querySelectorAll('canvas[data-scene]').forEach(drawScene);
      root.querySelectorAll('.wind').forEach(buildWind);
      root.querySelectorAll('.burst').forEach(el => buildSparks(el, 18, 'burst'));
      root.querySelectorAll('.confetti').forEach(el => buildSparks(el, 60, 'confetti'));
    }
  };
})();
