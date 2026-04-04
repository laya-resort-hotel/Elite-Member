import { $$ } from '../core/dom.js?v=20260404fix5';

function setSide(card, side) {
  if (!card) return;
  const scene = card.querySelector('.elite-card-scene');
  const frontBtn = card.querySelector('[data-card-side="front"]');
  const backBtn = card.querySelector('[data-card-side="back"]');
  const label = card.querySelector('[data-card-label]');
  const downloadBtn = card.querySelector('[data-card-download]');
  const frontFace = card.querySelector('.elite-card-front');
  const backFace = card.querySelector('.elite-card-back');
  const isBack = side === 'back';

  scene?.classList.toggle('is-flipped', isBack);
  card.classList.toggle('is-flipped', isBack);
  frontBtn?.classList.toggle('active', !isBack);
  backBtn?.classList.toggle('active', isBack);
  frontFace?.setAttribute('aria-hidden', isBack ? 'true' : 'false');
  backFace?.setAttribute('aria-hidden', isBack ? 'false' : 'true');

  if (label) label.textContent = isBack ? 'Back view' : 'Front view';
  if (downloadBtn) downloadBtn.textContent = isBack ? 'Download back image' : 'Download front image';

  card.dataset.side = side;
}

function toggleSide(card) {
  setSide(card, card.dataset.side === 'back' ? 'front' : 'back');
}

function bindTilt(scene) {
  if (!scene) return;

  const coarse = () => window.matchMedia('(pointer: coarse)').matches;

  const resetTilt = () => {
    scene.style.setProperty('--tilt-x', '0deg');
    scene.style.setProperty('--tilt-y', '0deg');
    scene.style.setProperty('--pointer-x', '50%');
    scene.style.setProperty('--pointer-y', '50%');
    scene.classList.remove('is-pressed');
  };

  scene.addEventListener('mousemove', (event) => {
    if (coarse()) return;
    const rect = scene.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const tiltY = (px - 0.5) * 12;
    const tiltX = (0.5 - py) * 10;
    scene.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    scene.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    scene.style.setProperty('--pointer-x', `${(px * 100).toFixed(2)}%`);
    scene.style.setProperty('--pointer-y', `${(py * 100).toFixed(2)}%`);
  });

  scene.addEventListener('mouseleave', resetTilt);
  scene.addEventListener('blur', resetTilt);
  scene.addEventListener('pointerdown', () => {
    if (coarse()) {
      scene.classList.add('is-pressed');
    }
  });
  scene.addEventListener('pointercancel', resetTilt);
  scene.addEventListener('pointerleave', () => {
    if (coarse()) scene.classList.remove('is-pressed');
  });
  scene.addEventListener('pointerup', () => {
    if (coarse()) scene.classList.remove('is-pressed');
  });
}

function bindSceneFlip(scene, card) {
  if (!scene || !card) return;

  let startX = 0;
  let startY = 0;
  let pointerId = null;
  let moved = false;
  let lastPointerToggleAt = 0;

  const swipeThreshold = 34;
  const tapTolerance = 10;
  const verticalTolerance = 64;

  scene.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    moved = false;
    if (scene.setPointerCapture) {
      try { scene.setPointerCapture(pointerId); } catch (_) {}
    }
  });

  scene.addEventListener('pointermove', (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > tapTolerance || Math.abs(dy) > tapTolerance) moved = true;
  });

  const finishPointer = (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (scene.releasePointerCapture) {
      try { scene.releasePointerCapture(pointerId); } catch (_) {}
    }
    pointerId = null;

    if (Math.abs(dx) >= swipeThreshold && Math.abs(dx) > Math.abs(dy) && Math.abs(dy) < verticalTolerance) {
      setSide(card, dx < 0 ? 'back' : 'front');
      lastPointerToggleAt = Date.now();
      return;
    }

    if (!moved || (Math.abs(dx) < tapTolerance && Math.abs(dy) < tapTolerance)) {
      toggleSide(card);
      lastPointerToggleAt = Date.now();
    }
  };

  scene.addEventListener('pointerup', finishPointer);
  scene.addEventListener('pointercancel', (event) => {
    if (pointerId == null || event.pointerId !== pointerId) return;
    if (scene.releasePointerCapture) {
      try { scene.releasePointerCapture(pointerId); } catch (_) {}
    }
    pointerId = null;
  });

  // Fallback for browsers that still emit click after pointer events.
  scene.addEventListener('click', (event) => {
    if (Date.now() - lastPointerToggleAt < 350) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

function downloadCurrentSide(card) {
  const side = card.dataset.side === 'back' ? 'back' : 'front';
  const img = card.querySelector(`.elite-card-${side} img`);
  const src = img?.getAttribute('src');
  if (!src) return;
  const link = document.createElement('a');
  link.href = src;
  link.download = `laya-elite-black-card-${side}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function bindFlipCards() {
  const cards = $$('[data-card-flip]');
  cards.forEach((card) => {
    if (card.dataset.flipBound === 'true') return;
    card.dataset.flipBound = 'true';

    const scene = card.querySelector('.elite-card-scene');
    const frontBtn = card.querySelector('[data-card-side="front"]');
    const backBtn = card.querySelector('[data-card-side="back"]');
    const toggleBtn = card.querySelector('[data-card-toggle]');
    const downloadBtn = card.querySelector('[data-card-download]');

    frontBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSide(card, 'front');
    });

    backBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setSide(card, 'back');
    });

    toggleBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      toggleSide(card);
    });

    downloadBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      downloadCurrentSide(card);
    });

    scene?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSide(card);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSide(card, 'front');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSide(card, 'back');
      }
    });

    bindSceneFlip(scene, card);
    bindTilt(scene);
    setSide(card, card.dataset.defaultSide || 'front');
  });
}
