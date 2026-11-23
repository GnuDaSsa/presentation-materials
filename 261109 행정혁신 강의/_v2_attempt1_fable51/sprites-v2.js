// 픽셀 스프라이트와 배경 장면을 코드로 그린다 (외부 이미지 없음)
(() => {
  'use strict';
  const INK = '#141833';

  // ---- 색 헬퍼: 팔레트에서 음영/하이라이트 자동 계산 ----
  const hex2 = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (c, t, f) => { const a = hex2(c), b = hex2(t); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
  const dk = (c, f) => mix(c, '#0a0c1e', f);
  const lt = (c, f) => mix(c, '#ffffff', f);

  // ---- 캐릭터: 머리(헤어) + 얼굴 + 상체 + 하체 파츠 조합 (본체 14x21) ----
  // 글자: H 머리 h 머리밝음 j 머리그늘 s/S/C 피부·그늘·볼 k 잉크 w 흰 반사 T/t 상의·그늘 U 라펠 A/a 포인트
  //       P/p 바지 F/f 신발 W 칼라 E 헤드폰 G 안경 N 끈 c 카드 K 모자 R 머리끈 B 가방끈 D/d 서류철
  const FACE = [ // 행 6~11 (눈 행 6,7 / 입 행 9)
    '.sskksssskkss.',
    '.sskksssskkss.',
    '.sCsssssssCss.',
    '..sssskkssss..',
    '...SssssssS...',
    '....SSSSSS....'
  ];
  const LEGS = ['..PPPPPPPPPP..', '..PPPP..PPPP..', '..FFFF..FFFF..'];
  const LEGS_W = ['.PPPPPPPPPPPP.', '.PPPPP..PPPPP.', '.FFFFF..FFFFF.'];

  const SKIN_N = { s: '#f4c7a1', S: '#d99a74', C: '#f59a9a' };
  const SKIN_T = { s: '#dca878', S: '#b9805a', C: '#e08a7a' };

  const DEF = {
    hero: {
      pal: { H: '#1f1a24', T: '#2b2f3a', A: '#6b7350', P: '#3a4366', N: '#7aa7d8', c: '#ffffff', shoe: '#3a2a22' },
      hair: ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHHHHHHsssHH.', '.HHHsssssssss.'],
      torso: ['..TTUAAAAUTT..', '.TTTUNAANUTTT.', '.TTTUAccAUTTT.', '.sTTUAccAUTTs.', '.sTTTTTtTTTTs.', '..TTTTTtTTTT..']
    },
    friend: {
      pal: { H: '#5a3b2a', T: '#8a5cf0', A: '#e8e0ff', P: '#2b2f3a', E: '#ff5d8f', shoe: '#2b2f3a' },
      hair: ['..HH.HHHH.HH..', '.HHHHHHHHHHHH.', 'HHHHHHHHHHHHHH', 'HHHHHHHHHHHHHH', '.HHsHHHHHHsHH.', '.HHssssssssHH.'],
      torso: ['..TTUTTTTUTT..', '.TTTTATTATTTT.', '.TTTTATTATTTT.', '.sTTTTTTTTTTs.', '.sTttttttttTs.', '..TTTTTTTTTT..'],
      over(g) { for (let x = 1; x <= 12; x++) g[1][x] = 'E'; for (let y = 5; y <= 8; y++) { g[y][0] = 'E'; g[y][13] = 'E'; } g[6][1] = 'H'; g[7][1] = 'H'; }
    },
    mentor: {
      pal: { H: '#2a2230', T: '#3b6fd4', A: '#ffc93c', P: '#2b2f3a', shoe: '#2b2f3a' },
      hair: ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHHHsssssssH.', '.ssssssssssss.'],
      torso: ['..TTTWAAWTTT..', '.TTTTTAATTTTT.', '.TTTTTAATTTTT.', '.sTTTTAATTTTs.', '.sTTTTaaTTTTs.', '..TTTTTTTTTT..'],
      over(g) { glasses(g); }
    },
    boss: {
      pal: { H: '#b9bcc8', T: '#2a3566', A: '#e0465a', P: '#2a3566', W: '#ffffff', shoe: '#2b2f3a' },
      hair: ['....HHHHHH....', '..HHHjHHHHHH..', '.HHHHjHHHHHHH.', '.HHHHjHHHHHHH.', '.HHHsssssssHH.', '.HssssssssssH.'],
      torso: ['TTTTWWAAWWTTTT', 'TTTTTWAAWTTTTT', 'TTTTTtAAtTTTTT', 'sTTTTtAAtTTTTs', 'sTTTTTTTTTTTTs', 'TTTTTTTTTTTTTT'],
      legs: LEGS_W
    },
    staff1: {
      pal: { H: '#3a2a20', T: '#4fa37a', A: '#ffffff', P: '#2b2f3a', N: '#86d6f6', c: '#ffd9e5', shoe: '#4a3426' },
      hair: ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHssssssssHH.'],
      torso: ['..TTTNAANTTT..', '.TTTTNAANTTTT.', '.TTTTAccATTTT.', '.sTTTAccATTTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..'],
      drop: 1,
      over(g) { for (let y = 5; y <= 12; y++) { g[y][0] = 'H'; g[y][13] = 'H'; if (y < 11) { g[y][1] = 'H'; g[y][12] = 'H'; } } }
    },
    staff2: {
      pal: { H: '#1f1a24', T: '#c9cfe0', A: '#7a86b8', P: '#3a4366', W: '#eef0f8', shoe: '#2b2f3a' },
      hair: ['..............', '....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHssssssHHH.', '.ssssssssssss.'],
      torso: ['..TTTWSSWTTT..', '.TTTTTTATTTTT.', '.sTTTTTATTTTs.', '.sTTTTTATTTTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..']
    },
    staff3: {
      pal: { H: '#6a4630', T: '#e0965a', A: '#fff2cc', P: '#2b2f3a', R: '#ff5d8f', shoe: '#6a4630' },
      hair: ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHHsssssssHH.', '.Hsssssssssss.'],
      torso: ['..TTTTAATTTT..', '.TTTTTAATTTTT.', '.TTtTTtTTtTTT.', '.sTTTtTTTtTTs.', '.sTtTTtTTtTTs.', '..tttttttttt..'],
      drop: 1,
      over(g) { g[3][13] = 'R'; g[4][13] = 'H'; for (let y = 5; y <= 10; y++) g[y][13] = 'H'; }
    },
    staff4: {
      pal: { H: '#1f1a24', T: '#8a93a8', A: '#3b6fd4', P: '#2a3566', shoe: '#2b2f3a' },
      hair: ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHHsHHHsHHHH.'],
      torso: ['..TTTAAAATTT..', '.ATTTTAATTTTA.', '.ATTTTAATTTTA.', '.sTTTTTtTTTTs.', '.sTTTTTtTTTTs.', '..TTTTTtTTTT..']
    },
    budget: {
      pal: { H: '#2a2230', T: '#5e6b8a', A: '#ffc93c', P: '#2a3566', W: '#ffffff', D: '#ffffff', d: '#c7cbe0', shoe: '#2b2f3a' },
      hair: ['....HHHHHH....', '..HjHHHHHHHH..', '.HHjHHHHHHHHH.', '.HHjHHHHHHHHH.', '.HHHsssssssHH.', '.ssssssssssss.'],
      torso: ['..TTTWAAWTTT..', '.TTTTtAAtTTTT.', '.TTTTtAAtTTTDD', '.sTTTtAAtTTsDD', '.sTTTTTTTTTTdd', '..TTTTTTTTTT..'],
      over(g) { glasses(g); }
    },
    ryu: {
      pal: { H: '#1f1a24', T: '#f2f2f2', A: '#2a3566', P: '#2b2f3a', U: '#c7cbe0', shoe: '#2b2f3a' },
      hair: ['...HHHHHHHH...', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHssssssssHH.', '.HssssssssssH.'],
      torso: ['..TTTUAAUTTT..', '.TTTTTAATTTTT.', '.TTTTTAATTTtT.', '.sTTTTAATTTTs.', '.sTTTTaaTTTTs.', '..TTTTTTTTTT..']
    },
    won: {
      pal: { H: '#2a2230', T: '#3d8a35', A: '#c9cfe0', P: '#2a3566', W: '#ffffff', shoe: '#4a3426' },
      skin: SKIN_T,
      hair: ['....HHHHHH....', '..HHHHHHHHHH..', '.HHHHHHHHHHHH.', '.HHHHHHHHHHHH.', '.HHssHssssHHH.', '.Hsssssssssss.'],
      torso: ['..TTTWSSWTTT..', '.TTTTTTATTTTT.', '.TTTTTTATTttT.', '.sTTTTTATTTTs.', '.sTTTTTATTTTs.', '..tttttttttt..']
    },
    student: {
      pal: { H: '#5a3b2a', T: '#ff9f43', A: '#fff2cc', P: '#3a4366', K: '#3b6fd4', B: '#6a4630', shoe: '#e8e8f0' },
      hair: ['....KKKKKK....', '..KKKKKKKKKK..', '.KKKKKKKKKKKK.', '.KKKKKKKKKKKK.', 'KKKKKKKKKKKKKK', '.Hsssssssssss.'],
      torso: ['..TTUTTTTUTT..', '.TTBTTTTTTBTT.', '.TTBTTTTTTBTT.', '.sTBTTTTTTBTs.', '.sTTTTTTTTTTs.', '..TTTTTTTTTT..'],
      drop: 2
    }
  };

  function glasses(g) {
    for (let x = 2; x <= 5; x++) { g[5][x] = 'G'; g[5][x + 6] = 'G'; }
    for (let y = 6; y <= 7; y++) for (const x of [2, 5, 8, 11]) g[y][x] = 'G';
    g[6][6] = 'G'; g[6][7] = 'G';
  }

  // 모든 행을 14칸으로 맞추고 구성
  const fit = r => r.padEnd(14, '.').slice(0, 14).split('');
  function buildBase(name) {
    const d = DEF[name];
    const g = [...d.hair, ...FACE, ...d.torso, ...(d.legs || LEGS)].map(fit);
    if (d.over) d.over(g);
    shade(g);
    let dy = 0;
    if (d.drop) { // 키 작게: 몸통 중간 행을 빼고 위를 비운다 (발은 그대로)
      [16, 13].slice(0, d.drop).sort((a, b) => b - a).forEach(r => g.splice(r, 1));
      for (let i = 0; i < d.drop; i++) g.unshift(Array(14).fill('.'));
      dy = d.drop;
    }
    return { g, dy };
  }

  // 2톤 음영 자동 적용 (광원 좌상단)
  function shade(g) {
    const hairSet = ch => ch === 'H' || ch === 'h' || ch === 'j' || ch === 'K';
    const H = g.length;
    // 머리 하단 그림자
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < 14; x++)
      if (g[y][x] === 'H' && !hairSet(g[y + 1][x])) g[y][x] = 'j';
    // 이마 그늘 (머리 바로 아래 피부)
    for (let y = 1; y < 12; y++) for (let x = 0; x < 14; x++)
      if (g[y][x] === 's' && hairSet(g[y - 1][x])) g[y][x] = 'S';
    // 정수리 좌상단 하이라이트
    let r0 = g.findIndex(r => r.includes('H'));
    if (r0 >= 0) {
      const a = g[r0].indexOf('H');
      for (const x of [a + 1, a + 2]) if (g[r0][x] === 'H') g[r0][x] = 'h';
      const b = g[r0 + 1].indexOf('H');
      if (b >= 0 && g[r0 + 1][b + 1] === 'H') g[r0 + 1][b + 1] = 'h';
    }
    // 상의·바지 어두운 톤: 오른쪽 가장자리, 상의 밑단
    for (let y = 12; y <= 19; y++) for (let x = 0; x < 14; x++) {
      const n = g[y][x + 1];
      if (g[y][x] === 'T' && (n === undefined || n === '.' || n === 's')) g[y][x] = 't';
      if (g[y][x] === 'P' && (n === undefined || n === '.')) g[y][x] = 'p';
    }
    for (let x = 0; x < 14; x++) if (g[17][x] === 'T') g[17][x] = 't';
    // 신발 앞코 하이라이트
    for (let x = 0; x < 14; x++) if (g[20][x] === 'F' && (x === 0 || g[20][x - 1] !== 'F')) g[20][x] = 'f';
  }

  const BASE = {};
  function charPal(name) {
    const d = DEF[name], c = d.pal, sk = d.skin || SKIN_N;
    const shoe = c.shoe || '#4a3426';
    return {
      ...sk, k: INK, w: '#ffffff', M: '#8a2a3a',
      H: c.H, h: lt(c.H, .24), j: dk(c.H, .3),
      T: c.T, t: dk(c.T, .26), U: c.U || lt(c.T, .14),
      A: c.A, a: dk(c.A, .25),
      P: c.P, p: dk(c.P, .3),
      F: shoe, f: lt(shoe, .4),
      W: c.W || '#ffffff', E: c.E, G: '#3f4a6e', N: c.N, c: c.c,
      K: c.K, B: c.B, R: c.R, D: c.D, d: c.d
    };
  }

  // 프레임 합성: 숨쉬기(br) / 눈감기(bl) / 입벌림(mo)
  function charFrame(name, br, bl, mo) {
    const b = BASE[name] || (BASE[name] = buildBase(name));
    const g = b.g.map(r => r.slice()), ey = 6 + b.dy;
    if (bl) { for (const x of [3, 4, 9, 10]) g[ey][x] = 's'; }
    else { g[ey][3] = 'w'; g[ey][9] = 'w'; }
    if (mo) { g[ey + 3][6] = 'M'; g[ey + 3][7] = 'M'; g[ey + 4][6] = 'M'; g[ey + 4][7] = 'M'; }
    if (br) { g.splice(17, 1); g.unshift(Array(14).fill('.')); }
    return g;
  }

  // ---- 소품 ----
  const edit = (map, list) => { const g = map.map(r => r.split('')); list.forEach(([x, y, c]) => { if (g[y]) g[y][x] = c; }); return g.map(r => r.join('')); };
  const bob1 = map => { const w = map[0].length; return ['.'.repeat(w), ...map.slice(0, -2), map[map.length - 1]]; };

  const CODE = [
    '.gggg...........', '...yyyyy..cc....', '...ggggggg......', '...pppp.cccc....',
    '.gggggg.........', '...ccc..yyy.....', '...ggggg..pp....', '.gg.............'
  ];
  const codeRows = (n, w, i) => {
    const out = [];
    for (let r = 0; r < n; r++) out.push(CODE[(r + (i >> 1)) % CODE.length].slice(0, w).replace(/\./g, 'b'));
    if (i % 2 === 0) { // 마지막 줄 끝에 커서
      const s = CODE[((n - 1) + (i >> 1)) % CODE.length].slice(0, w), e = s.search(/\.*$/);
      if (e < w) out[n - 1] = out[n - 1].slice(0, e) + 'w' + out[n - 1].slice(e + 1);
    }
    return out;
  };
  const monitorMap = i => {
    const rows = ['kekkkkkkkkkkkkkkkk', 'kvvvbbbbbbbbbbbbbk'];
    codeRows(6, 16, i).forEach(r => rows.push('k' + r + 'k'));
    rows.push('kbbbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkkkk', '.......ssSS.......', '.....ssssSSSS.....');
    return rows;
  };
  const laptopMap = i => {
    const rows = ['..kkkkkkkkkkkkkk..'];
    codeRows(6, 12, i).forEach(r => rows.push('..k' + r + 'k..'));
    rows.push('..kkkkkkkkkkkkkk..', 'hhhhhhhhhhhhhhhhhh', 'sSsSsSsSsSsSsSsSss', 'SSSSSSssssssSSSSSS');
    return rows;
  };

  const TROPHY = [
    '...yyyyyyyY...', '.YYyyyyyyyYYY.', 'Y..yyyyyyyY..Y', 'Y..yyyyyyyY..Y', '.Y.yyyyyyyY.Y.', '..YYyyyyyyYY..',
    '....yyyyyd....', '.....dyyd.....', '......yd......', '......yd......', '....dyyyyd....', '...kkkkkkkk...', '...kyyyyydk...', '...kkkkkkkk...'];
  const STAR = ['....y....', '...ywY...', '...yyY...', 'yyyyyyyYY', '.yyyyyyY.', '..yyyyY..', '.yyy.yYY.', 'yy.....YY'];
  const HEART = ['.rr.rR.', 'rrrrrrR', 'rrrrrrR', '.rrrrR.', '..rrR..', '...R...'];
  const BOLT = ['...yY', '..yY.', '.yyyY', 'yyyY.', '..yY.', '.yY..', 'yY...'];
  const DUCK = ['....yyy....', '...ywyyy...', '...ykyyyoo.', '...yyyyyooo', '....yyy....', 'y..yyyyy...', 'yyyyyyyyyY.', 'yyYYYYYyyY.', '.yyyyyyYY..', '..yyyyYY...'];

  const PROPS = {
    trophy: { pal: { y: '#ffd24a', Y: '#e0a92a', d: '#b87a1e', w: '#fff7c2', k: INK }, map: TROPHY,
      anim: { ms: 240, seq: [0, 1, 2, 3, 3, 3, 3, 3], make: i => edit(TROPHY, i < 3 ? [[4 + i * 2, 1, 'w'], [4 + i * 2, 2, 'w'], [4 + i * 2, 3, 'w']] : [[4, 1, 'w'], [4, 2, 'w'], [5, 1, 'w']]) } },
    star: { pal: { y: '#ffc93c', w: '#fff7c2', Y: '#e0a92a' }, map: STAR,
      anim: { ms: 420, seq: [0, 1], make: i => i ? edit(STAR, [[4, 1, 'y'], [1, 3, 'w'], [6, 3, 'w'], [3, 4, 'w']]) : STAR } },
    paper: { pal: { w: '#ffffff', g: '#9aa3c4', G: '#c7cbe0', f: '#aab0cc', p: '#ff5d8f' }, map: [
      'wwwwwwwf..', 'wggggggff.', 'wwwwwwwwwG', 'wggggggggG', 'wwwwwwwwwG', 'wggggggggG', 'wwwwwwwwwG', 'wpppwwwwwG', 'wwwwwwwwwG', 'wggggggggG', 'GGGGGGGGGG'] },
    monitor: { pal: { k: '#2b2f3a', e: '#5a6080', b: '#1c2a4a', v: '#2d4a7a', g: '#4fe0a6', y: '#ffc93c', p: '#ff5d8f', c: '#86d6f6', w: '#ffffff', s: '#a9b0c6', S: '#6f7896' },
      map: monitorMap(0), anim: { ms: 400, seq: [0, 1, 2, 3, 4, 5], make: monitorMap } },
    phone: { pal: { k: '#2b2f3a', h: '#5a6080', b: '#86d6f6', v: '#c4eefc', w: '#ffffff', r: '#ff5d8f' }, map: [
      'hhkkkk', 'kvbbrk', 'kbwwbk', 'kbbbbk', 'kbwbbk', 'kbbbbk', 'kkkkkk', 'kkwwkk'],
      anim: { ms: 360, seq: [0, 0, 1], make: i => i ? edit(['hhkkkk', 'kvbbrk', 'kbwwbk', 'kbbbbk', 'kbwbbk', 'kbbbbk', 'kkkkkk', 'kkwwkk'], [[4, 1, 'b']]) : ['hhkkkk', 'kvbbrk', 'kbwwbk', 'kbbbbk', 'kbwbbk', 'kbbbbk', 'kkkkkk', 'kkwwkk'] } },
    mail: { pal: { w: '#ffffff', g: '#b4bad6', G: '#dfe2f0', p: '#ff5d8f', q: '#ffb3cc' }, map: [
      'wwwwwwwwwwww', 'gwwwwwwwwwwg', 'wgwwwwwwwwgw', 'wwgwwqpwwgww', 'wwwgwppwgwww', 'wwwwggggwwww', 'wgwwwwwwwwgw', 'gGGGGGGGGGGg'] },
    excel: { pal: { g: '#1d7a45', G: '#2fae64', L: '#7fe0a8', d: '#14592f', w: '#ffffff' }, map: [
      'gggggggggggg', 'gLLLLLLLLLLd', 'gGwwGGGGwwGd', 'gGGwwGGwwGGd', 'gGGGwwwwGGGd', 'gGGGGwwGGGGd', 'gGGGwwwwGGGd', 'gGGwwGGwwGGd', 'gGwwGGGGwwGd', 'gGGGGGGGGGGd', 'dddddddddddd'] },
    heart: { pal: { r: '#ff5d8f', R: '#d93a6c', w: '#ffd9e5' }, map: edit(HEART, [[1, 1, 'w']]),
      anim: { ms: 300, seq: [0, 1], make: i => edit(HEART, i ? [[1, 1, 'w'], [2, 1, 'w'], [1, 2, 'w']] : [[1, 1, 'w']]) } },
    bang: { pal: { y: '#ffc93c', Y: '#e0a92a', w: '#fff7c2' }, map: ['wy', 'yY', 'yY', 'yY', '..', 'yY'] },
    medal: { pal: { r: '#e0465a', R: '#b8324a', b: '#3b6fd4', B: '#2a54a8', y: '#ffc93c', Y: '#d9962b', w: '#fff7c2' }, map: [
      'rr....bb', '.rR..Bb.', '..rRBb..', '...yy...', '..yyyy..', '.ywyyyY.', '.yyyyYY.', '..yyYY..'] },
    laptop: { pal: { k: '#2b2f3a', b: '#1c2a4a', g: '#4fe0a6', y: '#ffc93c', p: '#ff5d8f', c: '#86d6f6', w: '#ffffff', s: '#c7cbe0', S: '#8a93a8', h: '#eef0f8' },
      map: laptopMap(0), anim: { ms: 400, seq: [0, 1, 2, 3, 4, 5], make: laptopMap } },
    egg: { pal: { w: '#fff8e8', c: '#e8dcc0', C: '#c9b88f', s: '#ffffff' }, map: [
      '...wwww...', '..wwwwww..', '.wswwwwww.', '.swwwwwwwc', 'wwwwwwwwwc', 'wwwwwwwwcC', 'wwwwwwwwcC', '.wwwwwwcC.', '..wwcccCC.', '...ccCC...'] },
    duck: { pal: { y: '#ffd84a', Y: '#e0a92a', o: '#ff8a3c', w: '#fff7c2', k: '#141833' }, map: DUCK,
      anim: { ms: 360, seq: [0, 1], make: i => i ? bob1(DUCK) : DUCK } },
    bolt: { pal: { y: '#ffc93c', Y: '#e0a92a', w: '#ffffff' }, map: BOLT,
      anim: { ms: 150, seq: [0, 0, 0, 1, 0, 1], make: i => i ? BOLT.map(r => r.replace(/[yY]/g, 'w')) : BOLT } }
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

  // ---- 프레임 캐시 + 전역 타이머 1개 ----
  const palCache = {}, frameCache = new Map(), states = new WeakMap();
  const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // 눈 깜빡임 전용 난수 (배경/바람/스파크용 seed 난수와 분리)
  let r2 = 20260;
  const brand = () => (r2 = (r2 * 48271) % 2147483647) / 2147483647;

  function frameOf(name, key, outline) {
    const id = name + '|' + key + '|' + (outline ? 1 : 0);
    let cv = frameCache.get(id);
    if (cv) return cv;
    cv = document.createElement('canvas');
    if (DEF[name]) {
      const p = palCache[name] || (palCache[name] = charPal(name));
      paint(cv, charFrame(name, +key[0], +key[1], +key[2]), p, true);
    } else {
      const P = PROPS[name];
      paint(cv, P.anim ? P.anim.make(+key) : P.map, P.pal, outline);
    }
    frameCache.set(id, cv);
    return cv;
  }

  function drawSprite(canvas) {
    const name = canvas.dataset.sp, scale = +(canvas.dataset.scale || 8);
    const outline = canvas.dataset.outline !== '0';
    let key, size;
    if (DEF[name]) key = '000';
    else if (PROPS[name]) key = '0';
    else return;
    const src = frameOf(name, key, outline);
    canvas.width = src.width; canvas.height = src.height;
    canvas.getContext('2d').drawImage(src, 0, 0);
    size = [src.width, src.height];
    canvas.style.width = size[0] * scale + 'px';
    canvas.style.height = size[1] * scale + 'px';
    const now = performance.now();
    states.set(canvas, { name, outline, key, ph: brand() * 2000, next: now + 800 + brand() * 4200, until: 0 });
  }

  const SEL = '.slide.on canvas[data-sp], #achPop canvas[data-sp]';
  function tick() {
    if (document.hidden) return;
    const t = performance.now();
    document.querySelectorAll(SEL).forEach(cv => {
      const st = states.get(cv);
      if (!st) return;
      let key;
      if (DEF[st.name]) {
        if (t >= st.next) { st.until = t + 120; st.next = t + 2800 + brand() * 2200; }
        const still = cv.classList.contains('bob') || cv.classList.contains('talk');
        const br = still ? 0 : (((t + st.ph) / 700) | 0) % 2;
        const mo = cv.classList.contains('talk') ? ((t / 160) | 0) % 2 : 0;
        key = '' + br + (t < st.until ? 1 : 0) + mo;
      } else {
        const a = PROPS[st.name] && PROPS[st.name].anim;
        if (!a) return;
        key = '' + a.seq[(((t + st.ph) / a.ms) | 0) % a.seq.length];
      }
      if (key === st.key) return;
      st.key = key;
      const src = frameOf(st.name, key, st.outline), ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(src, 0, 0);
    });
  }
  let timer = 0;
  function startTimer() { if (!timer && !reduced) timer = setInterval(tick, 120); }


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
      startTimer();
    }
  };
})();
