// 픽셀 스프라이트와 배경 장면을 코드로 그린다 (외부 이미지 없음)
(() => {
  'use strict';
  const INK = '#141833';

  // ---- 색 유틸: 기본색에서 그림자/하이라이트 자동 유도 ----
  const hexToRgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const rgbToHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (hex, p = 0.18) => rgbToHex(hexToRgb(hex).map(v => v * (1 - p)));
  const tint = (hex, p = 0.14) => rgbToHex(hexToRgb(hex).map(v => v + (255 - v) * p));

  // ---- 캐릭터: 머리(HAIR) / 얼굴 / 몸통(TORSO) / 다리 부품 조합 ----
  // 14x21 격자. 행 0~10 머리, 11 목, 12~17 몸통, 18~20 다리. 발은 항상 맨 아래 행.
  // 기호: s/l/S 피부(기본/밝음/그림자) H/h/j 머리 T/t/u 상의 A/a 포인트 P/p/q 바지 k 먹선 e 흰색 m/M 입
  //       W 흰 옷깃 R 빨강 Y 금 F 서류철 B 갈색 z 지퍼 n 끈 c 카드 b 카드띠 E/g/f 헤드폰·머리끈
  const SKIN = '#f4c7a1';
  const BASEPAL = {
    k: INK, e: '#ffffff', C: '#f59a9a', m: '#b45a5a', M: '#7a2f3a',
    W: '#ffffff', R: '#e0465a', Y: '#ffc93c', F: '#8a5a3a', B: '#8a5a3a', z: '#9aa3c4', n: '#e0e4f0', c: '#ffffff', b: '#4f86d6', E: '#ff5d8f'
  };

  const LEGS = ['..PPPPPPPPPP..', '..PPPP..PPPP..', '..kkkk..kkkk..'];

  // 머리 오버레이 (행 0부터, '.' = 변경 없음). 긴 머리는 행 13까지.
  const HAIR = {
    hero: ['....hhHHHH....', '..hhHHHHHHHj..', '.hhHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHHsssHHHHHj.', '.H..........j.'],
    friend: ['..H..hH..H.H..', '..EEEEEEEEEE..', '.EhHHHHHHHHHE.', '.EHHHHHHHHHHE.', '.EHHHssssHHjE.', 'gE..........Ef', 'EE..........Ef', 'EE..........Ef', 'EE..........Ef'],
    mentor: ['...hhHHHHHH...', '..hHHHHHHHHj..', '.hHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HH........HH.', '.H..........H.'],
    boss: ['....hHHHHH....', '..hHHHHHHHHj..', '.hHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHHsHHHHsHHj.', '.H..........H.'],
    long: ['....hhHHHH....', '..hhHHHHHHHj..', '.hHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHHHHHHHHHHj.', 'HHH........HHH', 'HH..........HH', 'HH..........HH', 'HH..........Hj', 'HH..........Hj', 'HH..........Hj', 'HH..........Hj', 'HH..........HH', 'HH..........HH'],
    pony: ['....hHHHHH....', '..hHHHHHHHHj..', '.hHHHHHHHHHHjH', '.HHHHHHHHHHHjH', '.HHsssssssHHjE', '.H..........HH', '............HH', '............HH', '............Hj', '............Hj', '.............H'],
    sport: ['..............', '...hhHHHHHH...', '..hHHHHHHHHj..', '.HHHHHHHHHHHj.', '.HH........Hj.'],
    side: ['..............', '...hhHHHHHH...', '..hHHHHHHHHHj.', '.hHHHHHHHHHHHj', '.HHHHHsssHHHH.', '.H..........j.'],
    p28: ['....hhHHHH....', '..hhHHHHHHHj..', '.hHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HssHHHHHHHHj.', '.H..........H.'],
    curly: ['...HhH.HH.H...', '..hHHHHHHHHj..', '.hHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHsHHsHHsHHj.', 'HH..........HH'],
    plain: ['...hhHHHHHH...', '..hHHHHHHHHj..', '.hHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHHHsssHHHHj.', '.H..........H.'],
    kid: ['...hhHHHHH....', '..hhHHHHHHHj..', '.hhHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHHHHHHHHHHj.', '.HHH......HHj.']
  };

  // 몸통 7행 (행 11~17). 행 14는 표준 키에서 잘려 나가므로 행 13과 같게 둔다.
  const TORSO = {
    hero: ['..TTSnSSnSTT..', '.TTTTnAAnTTTT.', '.TTTTTnnTTTTT.', '.TTTTTnnTTTTT.', '.sTTTTbbTTTTs.', '.sTTTTccTTTTs.', '..uuuuzzuuuu..'],
    friend: ['..TTSSSSSSTT..', '.TTTTATTATTTT.', '.TTTTATTATTTT.', '.TTTTATTATTTT.', '.sTTuuuuuuTTs.', '.sTTuTTTTuTTs.', '..TTuuuuuuTT..'],
    mentor: ['..WWSSAASSWW..', '..TTTTAATTTT..', '.tTTTTAATTTTt.', '.tTTTTAATTTTt.', '.sTTTTAATTTTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..'],
    boss: ['.TTWSSSSSSWTT.', 'TTTTTWRRWTTTTT', '.TTYTWRRWTTTT.', '.TTYTWRRWTTTT.', '.sTTTTRRTTTTs.', '.sTTTTRRTTTTs.', '..TTTTTTTTTT..'],
    staff1: ['..TASSSSSSAT..', '..TTTAAAATTT..', '.TTTTAAAATTTT.', '.TTTTAAAATTTT.', '.sTTTAAAATTTs.', '.sTTTTAATTTTs.', '..TTTTTTTTTT..'],
    staff2: ['..TTSASSASTT..', '.TTTTATTATTTT.', '.TTTTATTATTTT.', '.TTTTATTATTTT.', '.sTTTTAATTTTs.', '.sTTTTWWTTTTs.', '..TTTTTTTTTT..'],
    staff3: ['...ASSSSSSA...', '..TTTTTTTTTT..', '.TTTTTAATTTTT.', '.TTTTTAATTTTT.', '.sTTTTTTTTTTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..'],
    staff4: ['..AASSSSSSAA..', '.AATTTAATTTAA.', '.AATTTTTTTTAA.', '.AATTTTTTTTAA.', '.sATTTTTTTTAs.', '.sATTTTTTTTAs.', '..TuTuTuTuTT..'],
    budget: ['..WWSSAASSWW..', '..WTTTAATTTW..', '.WWTTTAATTTWW.', '.WWTTTAATTTWW.', '.sWTTTTTTTTWFF', '.sWTTTTTTTTWFF', '..TTTTTTTTTTFF'],
    ryu: ['...TSSSSSST...', '..TTTTAATTTT..', '.TTTTTAATTTTT.', '.TTTTTAATTTTT.', '.sTTTTAATTTTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..'],
    won: ['..TTSSSSSSTT..', '..TTTTzTTTTT..', '.TTTTTzTTTTTT.', '.TTuuTzTTTTTT.', '.sTttTzTTTTTs.', '.sTTTTzTTTTTs.', '..TTTTzTTTTT..'],
    student: ['....SSSSSS....', '..TTBTTTTBTT..', '.TTTBTTTTBTTT.', '.TTTBTTTTBTTT.', '.sTTBTTTTBTTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..']
  };

  // hair=머리, torso=몸통, cut=삭제할 행(키 조절), 팔레트 H/T/A/P 대표색은 유지
  const CHARS = {
    hero:   { hair: 'hero',   torso: 'hero',   cut: [14], H: '#1f1a24', T: '#2b2f3a', A: '#6b7350', P: '#3a4366' },
    friend: { hair: 'friend', torso: 'friend', cut: [14], H: '#5a3b2a', T: '#8a5cf0', A: '#c9b6ff', P: '#2b2f3a' },
    mentor: { hair: 'mentor', torso: 'mentor', cut: [14], H: '#2a2230', T: '#3b6fd4', A: '#ffc93c', P: '#2b2f3a', x: { W: '#e8f0ff' } },
    boss:   { hair: 'boss',   torso: 'boss',   cut: [14], H: '#b9bcc8', T: '#2a3566', A: '#e0465a', P: '#2a3566' },
    staff1: { hair: 'long',   torso: 'staff1', cut: [14], H: '#3a2a20', T: '#4fa37a', A: '#ffffff', P: '#2b2f3a' },
    staff2: { hair: 'sport',  torso: 'staff2', cut: [14], H: '#1f1a24', T: '#c9cfe0', A: '#7a86b8', P: '#3a4366' },
    staff3: { hair: 'pony',   torso: 'staff3', cut: [14], H: '#6a4630', T: '#e0965a', A: '#fff2cc', P: '#2b2f3a' },
    staff4: { hair: 'side',   torso: 'staff4', cut: [14], H: '#1f1a24', T: '#8a93a8', A: '#3b6fd4', P: '#2a3566' },
    budget: { hair: 'p28',    torso: 'budget', cut: [14], H: '#2a2230', T: '#5e6b8a', A: '#ffc93c', P: '#2a3566' },
    ryu:    { hair: 'curly',  torso: 'ryu',    cut: [13, 14], H: '#1f1a24', T: '#f2f2f2', A: '#2a3566', P: '#2b2f3a' },
    won:    { hair: 'plain',  torso: 'won',    cut: [], H: '#2a2230', T: '#3d8a35', A: '#ffffff', P: '#2a3566', x: { z: '#c9cfe0' } },
    student:{ hair: 'kid',    torso: 'student', cut: [13, 14, 16, 19], H: '#5a3b2a', T: '#ff9f43', A: '#fff2cc', P: '#3a4366' }
  };

  function charPal(c) {
    const p = Object.assign({}, BASEPAL, {
      s: SKIN, l: tint(SKIN), S: shade(SKIN),
      H: c.H, h: tint(c.H), j: shade(c.H),
      T: c.T, t: tint(c.T), u: shade(c.T),
      A: c.A, a: shade(c.A),
      P: c.P, p: tint(c.P), q: shade(c.P)
    }, c.x || {});
    p.g = tint(p.E); p.f = shade(p.E);
    return p;
  }

  // 한 프레임의 격자(21행 → 키 조절 후 위쪽 투명 행 패딩). f: {breath, blink, talk}
  function charRows(name, f) {
    const c = CHARS[name];
    const g = Array.from({ length: 21 }, () => Array(14).fill('.'));
    const put = (y, x, ch) => { g[y][x] = ch; };
    for (let y = 2; y <= 8; y++) for (let x = 1; x <= 12; x++) put(y, x, 's');
    for (let x = 2; x <= 11; x++) put(9, x, 's');
    for (let x = 3; x <= 10; x++) put(10, x, 'S');
    for (let y = 6; y <= 8; y++) put(y, 12, 'S');
    put(5, 2, 'l'); put(8, 2, 'C'); put(8, 10, 'C');
    // 눈 2x2 + 좌상단 캐치라이트
    for (const x of [3, 9]) {
      put(6, x, f.blink ? 's' : 'e'); put(6, x + 1, f.blink ? 's' : 'k');
      put(7, x, 'k'); put(7, x + 1, 'k');
    }
    // 입 (talk: 열림)
    if (f.talk === 2) { put(9, 6, 'M'); put(9, 7, 'M'); put(10, 6, 'M'); put(10, 7, 'M'); }
    else { put(9, 6, 'm'); put(9, 7, 'm'); }
    // 몸통
    TORSO[c.torso].forEach((r, i) => { for (let x = 0; x < 14; x++) put(11 + i, x, r[x]); });
    LEGS.forEach((r, i) => { for (let x = 0; x < 14; x++) put(18 + i, x, r[x]); });
    // 음영: 몸통 오른쪽 1열, 왼쪽 어깨 하이라이트, 바지 안쪽
    const SH = { T: 'u', A: 'a', P: 'q', s: 'S' };
    for (let y = 12; y <= 17; y++) {
      let xr = 13; while (xr > 0 && g[y][xr] === '.') xr--;
      if (SH[g[y][xr]]) g[y][xr] = SH[g[y][xr]];
    }
    let xl = 0; while (xl < 13 && g[12][xl] === '.') xl++;
    if (g[12][xl] === 'T') g[12][xl] = 't';
    if (g[12][xl + 1] === 'T') g[12][xl + 1] = 't';
    const hlRow = f.breath ? 15 : 13;
    for (const x of [2, 3, 4]) if (g[hlRow][x] === 'T') g[hlRow][x] = 't';
    g[18][2] = 'p'; g[18][11] = 'q'; g[19][5] = 'q'; g[19][8] = 'q'; g[19][11] = 'q'; g[19][2] = 'p';
    // 숨쉬기: 어깨 바깥 1칸을 한 행 내림
    if (f.breath) {
      let a = 0; while (a < 13 && g[12][a] === '.') a++;
      let b = 13; while (b > 0 && g[12][b] === '.') b--;
      if (g[12][a] !== 'W' && g[12][a] !== 'E') g[12][a] = '.';
      if (g[12][b] !== 'W' && g[12][b] !== 'E') g[12][b] = '.';
    }
    // 머리 오버레이 (마지막에 덮음)
    HAIR[c.hair].forEach((r, y) => { for (let x = 0; x < 14; x++) if (r[x] !== '.') put(y, x, r[x]); });
    // 키 조절: 행 삭제 후 위쪽에 투명 행 패딩 (발은 항상 맨 아래)
    const rows = g.filter((_, i) => !c.cut.includes(i));
    while (rows.length < 21) rows.unshift(Array(14).fill('.'));
    return rows;
  }

  // ---- 소품 (캔버스 크기는 기존과 동일, 3~4톤) ----
  const PROPS = {
    trophy: { pal: { y: '#ffc93c', l: '#fff3a8', Y: '#d9962b', d: '#a8691a', w: '#fff7c2', k: INK }, map: [
      '...lyyyyyyd...', '.YYlyyyyyydYY.', 'Y..lyyyyyyd..Y', 'Y..lyyyyyyd..Y', '.Y.lyyyyyyd.Y.', '..YYlyyyydYY..',
      '....lyyyyd....', '.....lyyd.....', '......yd......', '......yd......', '...lyyyyyyd...', '...kkkkkkkk...', '...kwwwwwwk...', '...kkkkkkkk...'] },
    star: { pal: { y: '#ffc93c', c: '#fff3a8', Y: '#d9962b', D: '#b87a1e', w: '#ffffff' }, map: [
      '....y....', '...ycY...', '...yccY..', 'YyyyccyyD', '.yyccyyD.', '..yyccD..', '.yyy.yDD.', 'yY.....DD'] },
    paper: { pal: { w: '#ffffff', g: '#c7cbe0', p: '#ff5d8f', d: '#9aa3c4', S: '#8a93a8' }, map: [
      'wwwwwww...', 'wwwwwwwdd.', 'wwwwwwwwwd', 'wggggggggS', 'wwwwwwwwwS', 'wggggggggS', 'wwwwwwwwwS', 'wpppwwwwwS', 'wwwwwwwwwS', 'wggggggggS', 'SSSSSSSSSS'] },
    monitor: { pal: { k: '#2b2f3a', K: '#4a5070', b: '#1c2a4a', R: '#2f4372', g: '#4fe0a6', y: '#ffc93c', p: '#ff5d8f', c: '#86d6f6', s: '#8a93a8', S: '#5e6785', L: '#4fe0a6' }, map: [
      'kKKKKKKKKKKKKKKKKk', 'kbbbbbbbbbbbbbbRRk', 'kbggggbbbbbbbbRRbk', 'kbbbyyyyybbbbRRbbk', 'kbbbbbbccccccbbbbk', 'kbbbppppbbbbbbbbbk',
      'kbbbbbbbgggbbbbbbk', 'kbggggggbbbbbbbbbk', 'kbbbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkLkk', '.......ssSS.......', '.....sssssSSS.....'] },
    phone: { pal: { k: '#2b2f3a', K: '#4a5070', b: '#86d6f6', B: '#4fa8d6', w: '#ffffff', n: '#8a93a8' }, map: [
      'kKKKKk', 'kwbbBk', 'kbwbBk', 'kbbwBk', 'kbbbBk', 'kbbbBk', 'kkkkkk', 'kknnkk'] },
    mail: { pal: { w: '#ffffff', W: '#e6e9f5', g: '#c7cbe0', p: '#ff5d8f', S: '#8a93a8' }, map: [
      'wwwwwwwwwwww', 'gWWWWWWWWWWg', 'wgWWWWWWWWgw', 'wwgWWppWWgww', 'wwwgWppWgwww', 'wwwwggggwwww', 'wwwwwwwwwwww', 'SSSSSSSSSSSS'] },
    excel: { pal: { g: '#1d7a45', G: '#2fae64', L: '#6fe0a0', w: '#ffffff', d: '#17603a' }, map: [
      'LLLLLLLLLLLL', 'gGGGgGGGgGGd', 'gGwwGGGGwwGd', 'gGGwwGGwwGGd', 'gGGGwwwwGGGd', 'gGGGGwwGGGGd', 'gGGGwwwwGGGd', 'gGGwwGGwwGGd', 'gGwwGGGGwwGd', 'gGGGgGGGgGGd', 'dddddddddddd'] },
    heart: { pal: { r: '#ff5d8f', w: '#ffd9e5', R: '#d93a6e' }, map: ['.rr.rr.', 'rwrrrrR', 'rrrrrrR', '.rrrrR.', '..rRR..', '...R...'] },
    bang: { pal: { y: '#ffc93c', Y: '#d9962b', w: '#fff3a8' }, map: ['wy', 'yY', 'yY', 'yY', '..', 'yY'] },
    medal: { pal: { r: '#e0465a', R: '#b83a52', b: '#3b6fd4', B: '#2c55a8', y: '#ffc93c', Y: '#d9962b', w: '#fff7c2', L: '#b87a1e' }, map: [
      'rR....bB', '.rR..bB.', '..rRbB..', '...LL...', '..LwyyL.', '.LwyyyYL', '.LyyyyYL', '..LLLL..'] },
    laptop: { pal: { k: '#2b2f3a', K: '#4a5070', b: '#1c2a4a', R: '#2f4372', g: '#4fe0a6', y: '#ffc93c', p: '#ff5d8f', c: '#86d6f6', e: '#e6e9f5', s: '#c7cbe0', S: '#8a93a8' }, map: [
      '..kKKKKKKKKKKKKk..', '..kbbbbbbbbbbRRk..', '..kbggggbbbbbRRk..', '..kbbbyyyyybbbbk..', '..kbbbbbbcccbbbk..', '..kbppbbbbbbbbbk..', '..kbbbbbbbbbbbbk..', '..kkkkkkkkkkkkkk..',
      'eeeeeeeeeeeeeeeeee', 'sSsSsSsSsSsSsSsSss', 'ssssssSSSSSSssssss'] },
    egg: { pal: { w: '#fff3d8', c: '#e8dcc0', C: '#cdbf9e', s: '#ffffff' }, map: [
      '...swwc...', '..sswwwc..', '.sswwwwwc.', '.swwwwwwcc', 'wwwwwwwwwc', 'wwwwwwwwcc', 'wwwwwwwwcC', '.wwwwwwcCc', '..wwwwccC.', '...cccCC..'] },
    duck: { pal: { y: '#ffd84a', h: '#fff0a0', Y: '#e0a92a', o: '#ff8a3c', O: '#d9692a', k: '#141833' }, map: [
      '....hyy....', '...hhyyy...', '...hkyyyoo.', '...hyyyYoOO', '....yyY....', 'y..hyyyyY..', 'yyyhyyyyyY.', 'yyYYYYYyyY.', '.yyyyyyyY..', '..yyyyyY...'] },
    bolt: { pal: { y: '#ffc93c', h: '#fff3a8', Y: '#d9962b' }, map: ['...hy', '..hy.', '.hyyY', 'hyyY.', '..yY.', '.hY..', 'yY...'] }
  };

  // 소품 애니메이션: 프레임별 덮어쓰기 [x, y, 기호] (같은 타이머, 가벼운 것만)
  const PROP_ANIM = {
    star: [[[4, 3, 'w']], [[2, 3, 'w'], [6, 1, 'w']]],
    trophy: [[[3, 1, 'w']], [[3, 2, 'w']], [[3, 3, 'w']], [[3, 4, 'w']]],
    medal: [[[3, 4, 'w']], [[5, 5, 'w']]],
    monitor: [[[2, 8, 'w']], []],
    laptop: [[[8, 6, 'w']], []],
    bang: [[], [[0, 1, 'w'], [0, 2, 'w'], [0, 3, 'w'], [0, 5, 'w']]]
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

  // 격자 → 오프스크린 캔버스
  function render(grid, pal, outline) {
    const g = outline ? withOutline(grid) : grid.map(r => (typeof r === 'string' ? r.split('') : r));
    const h = g.length, w = Math.max(...g.map(r => r.length));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = g[y][x];
      if (!ch || ch === '.') continue;
      ctx.fillStyle = ch === 'O' ? INK : (pal[ch] || INK);
      ctx.fillRect(x, y, 1, 1);
    }
    return cv;
  }

  // (이름, 프레임)별 캐시
  const PALS = {}, FRAMES = {};
  function charFrame(name, f) {
    const key = name + '|' + (f.breath ? 1 : 0) + (f.blink ? 1 : 0) + (f.talk || 0);
    if (!FRAMES[key]) {
      if (!PALS[name]) PALS[name] = charPal(CHARS[name]);
      FRAMES[key] = render(charRows(name, f), PALS[name], true);
    }
    return FRAMES[key];
  }
  function propFrame(name, fi, outline) {
    const key = name + '|p' + fi + (outline ? 'o' : 'n');
    if (!FRAMES[key]) {
      const P = PROPS[name];
      const m = P.map.map(r => r.split(''));
      const ov = PROP_ANIM[name] && PROP_ANIM[name][fi];
      if (ov) ov.forEach(([x, y, ch]) => { if (m[y] && m[y][x] !== undefined && m[y][x] !== '.') m[y][x] = ch; });
      FRAMES[key] = render(m, P.pal, outline);
    }
    return FRAMES[key];
  }

  function blit(canvas, src) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0);
  }

  let spSeq = 0;
  function drawSprite(canvas) {
    const name = canvas.dataset.sp, scale = +(canvas.dataset.scale || 8);
    const outline = canvas.dataset.outline !== '0';
    let src;
    if (CHARS[name]) src = charFrame(name, {});
    else if (PROPS[name]) src = propFrame(name, 0, outline);
    else return;
    if (canvas._pxId === undefined) canvas._pxId = spSeq++;
    canvas.width = src.width; canvas.height = src.height;
    blit(canvas, src);
    canvas._pxKey = 'idle';
    canvas.style.width = src.width * scale + 'px';
    canvas.style.height = src.height * scale + 'px';
  }

  // ---- 프레임 애니메이션: 모듈 전역 타이머 1개 ----
  let tick = 0, timer = null;
  function stepCanvas(cv) {
    const name = cv.dataset.sp, id = cv._pxId;
    if (id === undefined) return;
    if (CHARS[name]) {
      const period = 25 + (id * 7) % 18;               // 약 3~5초
      const blink = (tick + (id * 11) % period) % period === 0;
      const breath = Math.floor((tick + id * 3) / 5) % 2; // 약 1.2초 주기
      const talk = cv.classList.contains('talk') ? (((tick >> 1) & 1) ? 2 : 1) : 0;
      const key = (breath ? 1 : 0) + '' + (blink ? 1 : 0) + talk;
      if (cv._pxKey === key) return;
      cv._pxKey = key;
      blit(cv, charFrame(name, { breath, blink, talk }));
    } else if (PROP_ANIM[name]) {
      const n = PROP_ANIM[name].length;
      const fi = Math.floor((tick + id * 2) / 4) % n;
      const key = 'p' + fi;
      if (cv._pxKey === key) return;
      cv._pxKey = key;
      blit(cv, propFrame(name, fi, cv.dataset.outline !== '0'));
    }
  }
  function step() {
    if (document.hidden) return;
    tick++;
    document.querySelectorAll('.slide.on canvas[data-sp], .achpop.open canvas[data-sp]').forEach(stepCanvas);
  }
  function startTimer() {
    if (timer) return;
    let reduce = false;
    try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
    if (reduce) return;
    timer = setInterval(step, 120);
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
  // v2 확장 훅: scenes-v2.js가 window.PIXEL_SCENES_EXT에 장면을 등록하면 덮어쓴다
  if (window.PIXEL_SCENES_EXT) Object.assign(SCENES, window.PIXEL_SCENES_EXT);
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
    SCENES[kind] && SCENES[kind](ctx, mod === 'night', mod);
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
    _rows: (n, f) => charRows(n, f || {}),
    init(root = document) {
      root.querySelectorAll('canvas[data-sp]').forEach(drawSprite);
      root.querySelectorAll('canvas[data-scene]').forEach(drawScene);
      root.querySelectorAll('.wind').forEach(buildWind);
      root.querySelectorAll('.burst').forEach(el => buildSparks(el, 18, 'burst'));
      root.querySelectorAll('.confetti').forEach(el => buildSparks(el, 60, 'confetti'));
      startTimer();
    }
  };
})();
