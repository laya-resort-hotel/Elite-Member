import { $$ } from '../core/dom.js';

function setSide(card, side) {
  if (!card) return;
  const scene = card.querySelector('.elite-card-scene');
  const frontBtn = card.querySelector('[data-card-side="front"]');
  const backBtn = card.querySelector('[data-card-side="back"]');
  const label = card.querySelector('[data-card-label]');
  const downloadBtn = card.querySelector('[data-card-download]');
  const isBack = side === 'back';

  scene?.classList.toggle('is-flipped', isBack);
  frontBtn?.classList.toggle('active', !isBack);
  backBtn?.classList.toggle('active', isBack);

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
  };

  scene.addEventListener('mousemove', (event) => {
    if (coarse()) return;
    const rect = scene.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const tiltY = (px - 0.5) * 8;
    const tiltX = (0.5 - py) * 6;
    scene.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    scene.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
  });

  scene.addEventListener('mouseleave', resetTilt);
  scene.addEventListener('blur', resetTilt);
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

    scene?.addEventListener('click', () => toggleSide(card));
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

    bindTilt(scene);
    setSide(card, card.dataset.defaultSide || 'front');
  });
}
