(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const canvas = document.getElementById('canvas');
  const counter = document.getElementById('counter');
  const progress = document.getElementById('progress');
  const notesBody = document.querySelector('.notes-body');
  const thumbGrid = document.querySelector('.thumb-grid');
  let index = 0;
  let lastPointer = null;
  const clamp = n => Math.max(0, Math.min(slides.length - 1, n));
  const parseHash = () => {
    const match = location.hash.match(/(?:slide=|#)(\d+)/);
    return match ? clamp(Number(match[1]) - 1) : 0;
  };
  const fit = () => {
    const notesWidth = document.body.classList.contains('notes-open') ? 390 : 0;
    const w = Math.max(320, innerWidth - notesWidth - 24);
    const h = Math.max(240, innerHeight - 24);
    const scale = Math.min(w / 1280, h / 720);
    // Center the scaled canvas inside the usable browser area. CSS Grid aligns
    // an oversized 1280px item to the start before transforms are applied,
    // which pushed the scaled deck off the right edge in Codex's narrow panel.
    canvas.style.left = `${(innerWidth - notesWidth) / 2}px`;
    canvas.style.top = `${innerHeight / 2}px`;
    canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };
  const syncNotes = slide => {
    const tpl = slide.querySelector('template.notes');
    notesBody.innerHTML = tpl ? tpl.innerHTML : '<p>발표자 노트가 없습니다.</p>';
  };
  const restartAnimations = slide => {
    slide.removeAttribute('data-deck-active');
    void slide.offsetWidth;
    slide.setAttribute('data-deck-active', '');
  };
  const show = (next, {pushHash = true, replay = true} = {}) => {
    next = clamp(next);
    slides.forEach((slide, i) => {
      slide.removeAttribute('data-deck-active');
      slide.setAttribute('aria-hidden', i === next ? 'false' : 'true');
    });
    index = next;
    slides[index].setAttribute('data-deck-active', '');
    if (replay) restartAnimations(slides[index]);
    counter.textContent = `${String(index + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    document.title = `${String(index + 1).padStart(2,'0')} · ${slides[index].dataset.title} — DLC AI 브리핑`;
    syncNotes(slides[index]);
    [...thumbGrid.children].forEach((t,i) => t.classList.toggle('active', i === index));
    if (pushHash) history.replaceState(null, '', `#slide=${index + 1}`);
    document.getElementById('live').textContent = `${index + 1}번 슬라이드, ${slides[index].dataset.title}`;
  };
  const toggleNotes = force => {
    document.body.classList.toggle('notes-open', force ?? !document.body.classList.contains('notes-open'));
    requestAnimationFrame(fit);
  };
  const toggleOverview = force => {
    document.body.classList.toggle('overview-open', force ?? !document.body.classList.contains('overview-open'));
    if (document.body.classList.contains('overview-open')) thumbGrid.children[index]?.focus();
  };
  const toggleHelp = force => document.body.classList.toggle('help-open', force ?? !document.body.classList.contains('help-open'));
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };
  const adoptionStart = slides.findIndex(slide => slide.dataset.title === '상반기 포트폴리오');
  const sharedStart = slides.findIndex(slide => slide.dataset.title === '공동구독 운영');
  const codexStart = slides.findIndex(slide => slide.dataset.title === 'CLI와 에이전트 도구');
  const nextStart = slides.findIndex(slide => slide.dataset.title === '다음 90일');
  const closingStart = slides.findIndex(slide => slide.dataset.title === '마무리와 질문');
  // Layouts are derived from the 18-slide Design Interior source deck.
  // Existing HTML supplies content only; these classes own the composition.
      const diLayouts = [
    'cover','chapter','gallery','feature','editorial','feature','feature','plan','chapter','portfolio','duo','editorial','feature','gallery','duo','feature','editorial','milestone','rust','team','feature','feature','gallery','gallery','portfolio','editorial','gallery','feature','gallery','showcase','gallery','editorial','feature','feature','gallery','feature','statement','feature','process','duo','editorial','statement','chapter','plan','plan','plan','chapter','editorial','statement','feature','feature','fullbleed','process','gallery','editorial','editorial','feature','duo','rust','editorial','feature','data','plan','plan','portfolio','closing'
  ];
  const diSourceLayouts = [
    1,3,9,10,14,10,10,17,3,2,6,7,10,9,12,11,14,17,8,5,10,10,9,9,14,7,9,10,9,11,9,14,10,10,9,10,3,11,6,12,7,3,3,17,17,17,16,14,3,11,11,15,6,9,14,14,11,12,8,14,11,17,17,17,14,18
  ];
  const portfolioImages = [
    'html-deck/assets/evidence/detail/general-reader-html-normal.png',
    'html-deck/assets/sns-collector.png',
    'html-deck/assets/evidence/detail/green-excel-actual-screen.png',
    'html-deck/assets/evidence/detail/chatbot-platform-store-actual.png',
    '',
    'html-deck/assets/generated/member-automation-v1.png'
  ];
  const visualFeatureSlides = new Set([
    '한글 작업을 버리기까지',
    'V열 자유문에서 담당 부서 복원',
    '실제 파일이 보여준 두 가지 배포 위험',
    '이 한 문장을 만드는 데 5시간',
    'CLI란?',
    'Genspark에서 발표 내용 채우기',
    'PowerPoint와 에이전트 마감'
  ]);
  slides.forEach((slide, i) => {
    const diLayout = slide.dataset.diLayout || (visualFeatureSlides.has(slide.dataset.title) ? 'feature' : (diLayouts[i] || 'editorial'));
    slide.classList.add(`di-layout-${diLayout}`);
    slide.dataset.diSource ||= String(diSourceLayouts[i] || 14).padStart(2,'0');
    const title = slide.querySelector(':scope > .title');
    if (title) {
      title.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
    }
    if (diLayout === 'chapter' && !slide.querySelector('.a-num')) {
      const chapter = document.createElement('span');
      chapter.className = 'di-chapter-number a-num';
      chapter.textContent = slide.dataset.title === 'CLI와 에이전트 도구' ? '03' : slide.dataset.title === '공동구독 운영' ? '04' : '01';
      chapter.setAttribute('aria-hidden','true');
      slide.prepend(chapter);
    }
    if (slide.dataset.title === '상반기 포트폴리오') {
      slide.querySelectorAll('.card').forEach((card, cardIndex) => {
        const src = portfolioImages[cardIndex];
        if (!src) return;
        const img = document.createElement('img');
        img.className = 'di-portfolio-thumb';
        img.src = src;
        img.alt = '';
        img.setAttribute('aria-hidden','true');
        card.prepend(img);
      });
    }
    slide.classList.toggle('has-stat', Boolean(slide.querySelector('.stat')));
    const partLabel = i === 0 ? 'OPENING · 2026'
      : i < adoptionStart ? 'PART 01 · AI NEWS & CHAMPION'
      : i < codexStart ? 'PART 02 · AI ADOPTION'
      : i < sharedStart ? 'PART 03 · CLI, AGENTS & DECK PROCESS'
      : i < nextStart ? 'PART 04 · SHARED SUBSCRIPTION'
      : i < closingStart ? 'NEXT · ACTIONS'
      : 'CLOSING · Q&A';
    const chrome = [
      ['deck-brand', 'DLC AI동호회 브리핑 2026'],
      ['deck-meta', 'DLC SERIES'],
      ['deck-author', 'SEONGNAM · SAJINWOO'],
    ];
    chrome.forEach(([className, text]) => {
      const el = document.createElement('span');
      el.className = className;
      el.textContent = text;
      el.setAttribute('aria-hidden', 'true');
      slide.prepend(el);
    });
    slide.dataset.page = `${String(i + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    slide.setAttribute('role','group'); slide.setAttribute('aria-roledescription','slide'); slide.setAttribute('aria-label',`${i+1} / ${slides.length}: ${slide.dataset.title}`);
    const thumb = document.createElement('button');
    thumb.className = 'thumb'; thumb.innerHTML = `<span class="tn">${String(i+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}</span><strong>${slide.dataset.title}</strong>`;
    thumb.addEventListener('click', () => { show(i); toggleOverview(false); });
    thumbGrid.appendChild(thumb);
  });
  document.getElementById('prev').onclick = () => show(index - 1);
  document.getElementById('next').onclick = () => show(index + 1);
  document.getElementById('notes').onclick = () => toggleNotes();
  document.getElementById('overview-btn').onclick = () => toggleOverview();
  document.getElementById('fullscreen').onclick = toggleFullscreen;
  document.getElementById('notes-close').onclick = () => toggleNotes(false);
  document.getElementById('overview-close').onclick = () => toggleOverview(false);
  document.getElementById('help-close').onclick = () => toggleHelp(false);
  document.getElementById('canvas').addEventListener('pointerdown', e => { lastPointer = {x:e.clientX,y:e.clientY}; });
  document.getElementById('canvas').addEventListener('pointerup', e => {
    if (!lastPointer || e.target.closest('a,button,input,textarea,select')) return;
    const dx = e.clientX-lastPointer.x, dy=e.clientY-lastPointer.y;
    if (Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)) show(index+(dx<0?1:-1));
    else if (Math.abs(dx)<8 && Math.abs(dy)<8) show(index+(e.clientX<innerWidth/2?-1:1));
    lastPointer=null;
  });
  addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === 'Escape') { toggleOverview(false); toggleHelp(false); return; }
    if (document.body.classList.contains('overview-open') || document.body.classList.contains('help-open')) return;
    if (['ArrowRight','PageDown',' '].includes(e.key)) { e.preventDefault(); show(index+1); }
    else if (['ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); show(index-1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(slides.length-1); }
    else if (e.key.toLowerCase() === 'n') toggleNotes();
    else if (e.key.toLowerCase() === 'o') toggleOverview();
    else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    else if (e.key.toLowerCase() === 'r') restartAnimations(slides[index]);
    else if (e.key.toLowerCase() === 'h' || e.key === '?') toggleHelp();
    else if (e.key.toLowerCase() === 'u') document.body.classList.toggle('ui-hidden');
  });
  addEventListener('hashchange', () => show(parseHash(), {pushHash:false}));
  addEventListener('resize', fit); document.fonts?.ready.then(fit);
  index = parseHash(); show(index, {pushHash:false}); fit();
})();
