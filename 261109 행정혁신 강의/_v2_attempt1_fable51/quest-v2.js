(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const $ = s => document.querySelector(s);
  const toc = $('#toc'), prog = $('#prog'), notes = $('#notes');
  let index = 0, step = 0, typing = null;

  // 업적 데이터: 나주 강의(2026-10-21) 수상·활동 기록 + 2026-11 추가분. [날짜, 짧은 제목, 전체 명칭, 금액·비고, 메모, 아이콘, 강조]
  const ACH = [
    ['2024.06', '복면끼왕 2등 · 복정동 약수터마스터', '복면끼왕 2등 · ‘복정동 약수터마스터’', '500,000원', '', 'medal'],
    ['2024.12.27', '정부혁신 우수사례 우수', '2024 정부혁신 우수사례 우수', '300,000원', '급수공사 공문 자동화', 'trophy', 1],
    ['2025.05.08', '직원 AI 활용 경진대회 최우수 (1위)', '직원 AI 활용 경진대회 최우수 (1위)', '1,000,000원', 'AI반도체과 발령 첫날 · 이 상금으로 노트북 구입', 'trophy', 1],
    ['2025.06.17', '청렴 에세이 장려', '청렴 에세이 장려', '50,000원', '', 'medal'],
    ['2025.09.02', '적극행정 마일리지 · 모범실패사례 제출', '적극행정 마일리지 · 범정부 모범실패사례 제출', '50,000원', '', 'star'],
    ['2025.10.14', '제3회 독후감 공모전 대상 (1위)', '제3회 독후감 공모전 대상 (1위)', '300,000원', '', 'trophy'],
    ['2025.10.22', '건강인성남 챌린지 우수 (2위)', '건강인성남 챌린지 우수 (2위)', '500,000원', '', 'medal'],
    ['2025.10.24', 'AI 챔피언 그린 취득', 'AI 챔피언 그린 취득', '', '', 'star'],
    ['2025.11.12', '하반기 직원 AI 경진대회 팀 장려상', '하반기 직원 AI 활용 경진대회 팀부문 장려상', '450,000원', '5만 원은 성재 주사님', 'medal'],
    ['2025.11.27', '범정부 모범실패사례 · 인사혁신처장', '범정부 모범실패사례 · 인사혁신처장상', '1,000,000 → 750,000원', '', 'trophy'],
    ['2025.12.06', '수도시설과 발표 지원', '수도시설과 발표 지원', '150,000원', '', 'heart'],
    ['2025.12', 'AI 챔피언 블루 취득', 'AI 챔피언 블루 취득', '', '', 'star'],
    ['2025.12.12', '1분 성남스토리 우수상 (2등)', '1분 성남스토리 우수상 (2등)', '1,500,000원', '', 'medal'],
    ['2025.12.23', '여기고기 숏폼 공모전 참가상', '여기고기 숏폼 공모전 참가상', '스타벅스 10,000원', '', 'heart'],
    ['2026.03.25', '롯데장학재단 공모전 참가상', '롯데장학재단 공모전 참가상', '50,000원', '', 'heart'],
    ['2026.05.07', '행안부 AI 전문인재교육 선발 · 4.7:1', '행정안전부 AI 전문인재교육 선발', '경쟁률 4.7 : 1', '', 'star'],
    ['2026.05.27', '환경의 날 AI 영상 제작 지원', '환경정책과 환경의 날 AI 영상 제작 지원', '', '', 'heart'],
    ['2026.06.09', '일반현황 하이퍼링크·책갈피 미션', '국장님 일반현황 하이퍼링크·책갈피 미션 완료', '', '', 'heart'],
    ['2026.06.29', '성남 페이스북 취합기 배포', '성남 페이스북 취합기 브라우저 확장 프로그램 배포', '', '1.22 업데이트 진행', 'star'],
    ['2026.06.30', '시장님 취임기념 영상 제작·배포', '시장님 취임기념 영상 제작 및 배포', '', '', 'heart'],
    ['2026.07.30', '성남시 출신 독립운동가 영상', '성남시 출신 독립운동가 영상 프로젝트', '진행 중', '2027년 합동평가 정성지표(2026년 실적) 「시민 참여형 보훈문화 행사·체험 우수사례」 기여', 'heart'],
    ['2026.09.04', '서울 국제협력 영상 챌린지 개인 대상', '서울 국제협력 영상 챌린지 공모전 · 개인분야 대상', '', '', 'trophy', 1],
    ['2026.10', '대구 달서구 BOOMBOOM 저출산 공모전 대상', '2026 대구 달서구 BOOMBOOM 저출산 공모전 대상', '', '', 'trophy', 1],
    ['2026.09.15', '경기도청 강의', '경기도청 · AI 영상 제작 강의', '', '', 'star'],
    ['2026.10.22', '한국방송통신전파진흥원 강의', '한국방송통신전파진흥원 · 나주 AI 활용 강의', '', '', 'star'],
    ['2026.11.11', '해양수산과학기술진흥원 강의 · 오늘', '해양수산과학기술진흥원 강의', '', '오늘 이 강의', 'star']
  ];
  const grid = $('#achGrid');
  if (grid) ACH.forEach(([d, t, full, amt, memo, ic, key]) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ach' + (key ? ' key' : '');
    el.innerHTML = `<canvas data-sp="${ic}" data-scale="4"></canvas><div><div class="d">${d}</div><div class="t">${t}</div></div>`;
    el.onclick = () => {
      const pop = $('#achPop');
      pop.innerHTML = `<div class="achcard"><canvas data-sp="${ic}" data-scale="12"></canvas><div><div class="d">${d}</div><div class="t">${full}</div>${amt ? `<div class="a">${amt}</div>` : ''}${memo ? `<div class="m">${memo}</div>` : ''}<div class="x">아무 곳이나 눌러 닫기</div></div></div>`;
      Pixel.init(pop); pop.classList.add('open');
    };
    grid.append(el);
  });
  if ($('#achPop')) $('#achPop').onclick = () => $('#achPop').classList.remove('open');
  if ($('#achCount')) $('#achCount').textContent = '×' + ACH.length;

  Pixel.init();
  document.querySelectorAll('.ach canvas').forEach(c => { c.style.width = '40px'; c.style.height = '40px'; });

  // ---- 목차·진행바 ----
  let lastStage = null;
  slides.forEach((s, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = String(i + 1).padStart(2, '0') + ' · ' + s.dataset.title;
    toc.append(o);
    const b = document.createElement('i');
    if (lastStage !== null && s.dataset.stage !== lastStage) b.className = 'cut';
    lastStage = s.dataset.stage;
    b.title = s.dataset.title;
    b.onclick = () => go(i);
    prog.append(b);
  });

  function fit() {
    if (innerWidth <= 680) return;
    $('#canvas').style.transform = `translate(-50%,-50%) scale(${Math.min((innerWidth - 24) / 1600, (innerHeight - 76) / 900)})`;
  }

  const maxStep = s => Math.max(0, ...[...s.querySelectorAll('[data-s]')].map(e => +e.dataset.s));

  // ---- 타자 효과 ----
  function typeIn(el) {
    if (!el.dataset.html) el.dataset.html = el.innerHTML;
    const html = el.dataset.html;
    const parts = html.split(/(<[^>]+>)/).filter(Boolean);
    let out = '', pi = 0, ci = 0;
    el.innerHTML = '';
    finishTyping();
    const timer = setInterval(() => {
      if (pi >= parts.length) { finishTyping(); return; }
      const part = parts[pi];
      if (part.startsWith('<')) { out += part; pi++; }
      else { out += part[ci++]; if (ci >= part.length) { pi++; ci = 0; } }
      el.innerHTML = out + '<span style="opacity:0">' + '</span>';
    }, 34);
    typing = { el, html, timer };
  }
  function finishTyping() {
    if (!typing) return false;
    clearInterval(typing.timer);
    typing.el.innerHTML = typing.html;
    typing = null;
    return true;
  }

  function reveal(el) {
    el.classList.add('shown');
    if (el.matches('.type')) typeIn(el);
    el.querySelectorAll('.type').forEach(typeIn);
    if (el.dataset.fx === 'shake') { const sl = el.closest('.slide'); sl.classList.remove('shake'); void sl.offsetWidth; sl.classList.add('shake'); }
    if (el.dataset.fx === 'flash') { const f = el.closest('.slide').querySelector('.flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  }

  function render(entering) {
    const s = slides[index];
    slides.forEach((x, i) => { x.classList.toggle('on', i === index); if (i !== index) x.classList.remove('enter'); });
    if (entering) {
      finishTyping();
      s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter');
      s.querySelectorAll('.type:not([data-s]):not([data-s] .type)').forEach(typeIn);
      runSlideFx(s);
    }
    s.querySelectorAll('[data-s]').forEach(e => {
      const want = +e.dataset.s <= step;
      if (want && !e.classList.contains('shown')) reveal(e);
      if (!want) e.classList.remove('shown');
    });
    s.querySelectorAll('.hp[data-hp]').forEach(h => {
      const v = h.dataset.hp.split(','), x = +v[Math.min(step, v.length - 1)];
      h.style.setProperty('--hp', x + '%'); h.classList.toggle('low', x < 30);
    });
    toc.value = index;
    $('#num').textContent = `${index + 1} / ${slides.length}`;
    $('#stageName').textContent = s.dataset.stage || '';
    [...prog.children].forEach((b, i) => { b.classList.toggle('done', i < index); b.classList.toggle('cur', i === index); });
    notes.innerHTML = '<b>NOTE · ' + (index + 1) + '</b>' + (s.querySelector('aside.note')?.innerHTML.trim() || '(노트 없음)');
    history.replaceState(null, '', '#' + (index + 1));
  }

  function runSlideFx(s) {
    s.querySelectorAll('video[autoplay]').forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
    if (s.querySelector('#achGrid')) {
      const items = [...s.querySelectorAll('.ach')];
      items.forEach(a => a.classList.remove('in'));
      items.forEach((a, i) => setTimeout(() => slides[index] === s && a.classList.add('in'), 120 + i * 90));
    }
    s.querySelectorAll('.papers').forEach(p => {
      const items = [...p.children];
      items.forEach(a => a.classList.remove('in'));
      items.forEach((a, i) => setTimeout(() => slides[index] === s && a.classList.add('in'), 300 + i * 260));
    });
    s.querySelectorAll('.stage-card .bar i').forEach((b, i, all) => {
      b.classList.remove('on');
      const lit = +(s.querySelector('.stage-card').dataset.lit || 0);
      if (i < lit) setTimeout(() => b.classList.add('on'), 200 + i * 160);
    });
    s.querySelectorAll('[data-cycle]').forEach(el => {
      const vals = el.dataset.cycle.split('|'); let k = 0;
      clearInterval(el._t);
      el._t = setInterval(() => { if (slides[index] !== s) return clearInterval(el._t); el.textContent = vals[k++ % vals.length]; }, 700);
    });
    s.querySelectorAll('[data-count]').forEach(el => {
      const [from, to, suf] = el.dataset.count.split('|'); let v = +from;
      el.textContent = v + suf;
      clearInterval(el._t);
      const dir = +to >= v ? 1 : -1, ms = Math.abs(+to - v) < 40 ? 90 : 22;
      el._t = setInterval(() => { v += dir; el.textContent = v + suf; if (v === +to) clearInterval(el._t); }, ms);
    });
  }

  function go(i) { if (i < 0 || i >= slides.length) return; closeVideos(); slides[index].querySelectorAll('video').forEach(v => v.pause()); index = i; step = 0; render(true); }
  function next() {
    if (finishTyping()) return;
    if (step < maxStep(slides[index])) { step++; render(false); }
    else go(index + 1);
  }
  function prev() {
    finishTyping();
    if (step > 0) { step--; render(false); }
    else if (index > 0) { index--; step = maxStep(slides[index]); render(true); }
  }

  addEventListener('keydown', e => {
    if (e.target === toc) return;
    if (e.key === 'Escape') return closeVideos();
    if (document.querySelector('.vmodal.open,.achpop.open')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key.toLowerCase() === 'f') toggleFs();
    else if (e.key.toLowerCase() === 'n') notes.classList.toggle('open');
  });
  // 영상 팝업: 열 때마다 처음부터, 닫거나 장을 넘기면 정지
  const closeVideos = () => { document.querySelectorAll('.vmodal.open').forEach(m => { m.classList.remove('open'); m.querySelector('video')?.pause(); }); $('#achPop')?.classList.remove('open'); };
  document.querySelectorAll('[data-video]').forEach(b => b.addEventListener('click', () => {
    const m = document.getElementById(b.dataset.video), v = m.querySelector('video');
    m.classList.add('open'); if (v) { v.currentTime = 0; v.play().catch(() => {}); }
  }));
  document.querySelectorAll('.vmodal').forEach(m => m.addEventListener('click', e => { if (e.target === m || m.dataset.closeAny !== undefined) closeVideos(); }));
  document.querySelectorAll('.vclose').forEach(b => b.addEventListener('click', closeVideos));
  $('#prev').onclick = prev; $('#next').onclick = next;
  $('#fs').onclick = toggleFs; $('#noteBtn').onclick = () => notes.classList.toggle('open');
  toc.onchange = () => go(+toc.value);
  function toggleFs() { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}); }

  // 개인 구독 현황: 체크하면 합계 포함, ChatGPT 금액을 누르면 필쫀쿠 할인 (나주 강의 5장과 같은 계산)
  const budget = $('#budget');
  if (budget) {
    const checks = [...budget.querySelectorAll('input')];
    const pro = budget.querySelector('[data-discount]'), coupon = $('#coupon');
    let discounted = false;
    const fmt = v => v.toLocaleString('ko-KR');
    const update = () => {
      let sum = 0;
      checks.forEach(c => {
        c.closest('.sub-row').classList.toggle('off', !c.checked);
        if (c.checked && c.dataset.price) sum += +(c === pro && discounted ? c.dataset.discount : c.dataset.price);
      });
      $('#budgetTotal').textContent = fmt(sum);
      coupon.disabled = !pro.checked;
      coupon.querySelector('del').hidden = !discounted;
      coupon.querySelector('strong').textContent = fmt(+(discounted ? pro.dataset.discount : pro.dataset.price)) + '원';
      coupon.querySelector('small').textContent = discounted ? '필쫀쿠 적용 · 눌러서 해제' : '눌러서 필쫀쿠 적용 ↗';
      $('#budgetSave').hidden = !(discounted && pro.checked);
    };
    checks.forEach(c => c.addEventListener('change', update));
    coupon.onclick = e => { e.preventDefault(); discounted = !discounted; update(); };
    $('#budgetReset').onclick = () => { discounted = false; checks.forEach(c => c.checked = true); update(); };
    update();
  }

  addEventListener('resize', fit); fit();
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1), 10); if (n > 0 && n <= slides.length && n - 1 !== index) go(n - 1); });
  const start = parseInt(location.hash.slice(1), 10);
  go(start > 0 && start <= slides.length ? start - 1 : 0);
})();
