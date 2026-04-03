
import { $$ } from '../core/dom.js';

function setSide(card, side) {
  if (!card) return;
  const flipInner = card.querySelector('.elite-card-scene');
  const frontBtn = card.querySelector('[data-card-side="front"]');
  const backBtn = card.querySelector('[data-card-side="back"]');
  const label = card.querySelector('[data-card-label]');
  const downloadBtn = card.querySelector('[data-card-download]');
  const isBack = side === 'back';
  flipInner?.classList.toggle('is-flipped', isBack);
  frontBtn?.classList.toggle('active', !isBack);
  backBtn?.classList.toggle('active', isBack);
  if (label) label.textContent = isBack ? 'Back view' : 'Front view';
  if (downloadBtn) {
    downloadBtn.textContent = isBack ? 'Download back image' : 'Download front image';
  }
  card.dataset.side = side;
}

function toggleSide(card) {
  const nextSide = card.dataset.side === 'back' ? 'front' : 'back';
  setSide(card, nextSide);
}

function bindTilt(scene) {
  if (!scene) return;

  const resetTilt = () => {
    scene.style.setProperty('--tilt-x', '0deg');
    scene.style.setProperty('--tilt-y', '0deg');
  };

  scene.addEventListener('mousemove', (event) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = scene.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const tiltY = (px - 0.5) * 10;
    const tiltX = (0.5 - py) * 8;
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

    const flipInner = card.querySelector('.elite-card-scene');
    const frontBtn = card.querySelector('[data-card-side="front"]');
    const backBtn = card.querySelector('[data-card-side="back"]');
    const toggleBtn = card.querySelector('[data-card-toggle]');
    const downloadBtn = card.querySelector('[data-card-download]');

    frontBtn?.addEventListener('click', () => setSide(card, 'front'));
    backBtn?.addEventListener('click', () => setSide(card, 'back'));
    toggleBtn?.addEventListener('click', () => toggleSide(card));
    downloadBtn?.addEventListener('click', () => downloadCurrentSide(card));

    flipInner?.addEventListener('click', () => toggleSide(card));
    flipInner?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleSide(card);
      }
      if (event.key === 'ArrowLeft') setSide(card, 'front');
      if (event.key === 'ArrowRight') setSide(card, 'back');
    });

    bindTilt(flipInner);
    setSide(card, card.dataset.defaultSide || 'front');
  });
}
