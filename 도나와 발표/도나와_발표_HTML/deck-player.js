(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  if (!slides.length) return;

  if (new URLSearchParams(window.location.search).has('all')) {
    document.body.classList.add('render-mode');
    document.documentElement.classList.add('all-slides-mode');
    return;
  }

  let current = 0;
  let isAnimating = false;
  let wheelLocked = false;
  let touchStartX = 0;
  let touchStartY = 0;
  const naumPhotoSlide = document.querySelector('.naum-photo');
  const expoBannerSlide = document.querySelector('.expo-banner-slide');
  const getNaumStage = () => Number(naumPhotoSlide?.dataset.nameStage || 0);
  const setNaumStage = (stage) => {
    if (!naumPhotoSlide) return;
    naumPhotoSlide.dataset.nameStage = String(Math.max(0, Math.min(2, stage)));
  };
  const getExpoStage = () => Number(expoBannerSlide?.dataset.expoStage || 0);
  const setExpoStage = (stage) => {
    if (!expoBannerSlide) return;
    expoBannerSlide.dataset.expoStage = String(Math.max(0, Math.min(1, stage)));
  };

  const syncScale = () => {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--deck-scale', String(scale));
  };

  const ui = document.createElement('div');
  ui.className = 'presenter-ui';
  ui.innerHTML = `
    <button class="presenter-button presenter-prev" type="button" aria-label="이전 슬라이드">←</button>
    <div class="presenter-progress" aria-hidden="true"><span></span></div>
    <span class="presenter-count" aria-live="polite"></span>
    <button class="presenter-button presenter-next" type="button" aria-label="다음 슬라이드">→</button>
  `;
  document.body.append(ui);

  const count = ui.querySelector('.presenter-count');
  const progress = ui.querySelector('.presenter-progress span');
  const prevButton = ui.querySelector('.presenter-prev');
  const nextButton = ui.querySelector('.presenter-next');

  const normalizeIndex = (index) => Math.max(0, Math.min(slides.length - 1, index));
  const parseHash = () => {
    const value = Number(window.location.hash.replace('#slide-', ''));
    return Number.isFinite(value) && value > 0 ? normalizeIndex(value - 1) : 0;
  };
  const updateUi = () => {
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.transform = `scaleX(${(current + 1) / slides.length})`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
  };

  const setInitial = (index) => {
    current = normalizeIndex(index);
    slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === current));
    updateUi();
  };

  const go = (target) => {
    const next = normalizeIndex(target);
    if (next === current || isAnimating) return;

    const direction = next > current ? 'forward' : 'backward';
    const outgoing = slides[current];
    const incoming = slides[next];
    isAnimating = true;

    outgoing.classList.remove('is-active');
    outgoing.classList.add('is-exiting', direction);
    incoming.classList.add('is-active', direction === 'forward' ? 'enter-from-next' : 'enter-from-prev');

    requestAnimationFrame(() => incoming.classList.remove('enter-from-next', 'enter-from-prev'));
    current = next;
    updateUi();
    window.history.replaceState(null, '', `#slide-${current + 1}`);

    window.setTimeout(() => {
      outgoing.classList.remove('is-exiting', 'forward', 'backward');
      isAnimating = false;
    }, 360);
  };

  const next = () => {
    if (slides[current] === naumPhotoSlide && getNaumStage() < 2) {
      setNaumStage(getNaumStage() + 1);
      return;
    }
    if (slides[current] === expoBannerSlide && getExpoStage() < 1) {
      setExpoStage(getExpoStage() + 1);
      return;
    }
    go(current + 1);
  };
  const previous = () => {
    if (slides[current] === naumPhotoSlide && getNaumStage() > 0) {
      setNaumStage(getNaumStage() - 1);
      return;
    }
    if (slides[current] === expoBannerSlide && getExpoStage() > 0) {
      setExpoStage(getExpoStage() - 1);
      return;
    }
    go(current - 1);
  };

  setInitial(parseHash());
  syncScale();
  window.history.replaceState(null, '', `#slide-${current + 1}`);

  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      next();
    }
    if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(event.key)) {
      event.preventDefault();
      previous();
    }
    if (event.key === 'Home') go(0);
    if (event.key === 'End') go(slides.length - 1);
    if (event.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
  });

  document.addEventListener('wheel', (event) => {
    if (wheelLocked || Math.abs(event.deltaY) < 10) return;
    wheelLocked = true;
    event.deltaY > 0 ? next() : previous();
    window.setTimeout(() => { wheelLocked = false; }, 430);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.presenter-ui, a, button, input, select, textarea')) return;
    event.clientX < window.innerWidth * 0.32 ? previous() : next();
  });

  document.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  document.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < 48 && Math.abs(dy) < 48) return;
    Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? next() : previous()) : (dy < 0 ? next() : previous());
  }, { passive: true });

  prevButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  window.addEventListener('resize', syncScale);
  window.addEventListener('hashchange', () => go(parseHash()));
})();
