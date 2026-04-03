import { $$ } from '../core/dom.js';

function setSide(card, side) {
  if (!card) return;
  const flipInner = card.querySelector('.elite-card-scene');
  const frontBtn = card.querySelector('[data-card-side="front"]');
  const backBtn = card.querySelector('[data-card-side="back"]');
  const label = card.querySelector('[data-card-label]');
  const isBack = side === 'back';
  flipInner?.classList.toggle('is-flipped', isBack);
  frontBtn?.classList.toggle('active', !isBack);
  backBtn?.classList.toggle('active', isBack);
  if (label) label.textContent = isBack ? 'Back view' : 'Front view';
  card.dataset.side = side;
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

    frontBtn?.addEventListener('click', () => setSide(card, 'front'));
    backBtn?.addEventListener('click', () => setSide(card, 'back'));
    toggleBtn?.addEventListener('click', () => {
      const nextSide = card.dataset.side === 'back' ? 'front' : 'back';
      setSide(card, nextSide);
    });
    flipInner?.addEventListener('click', () => {
      const nextSide = card.dataset.side === 'back' ? 'front' : 'back';
      setSide(card, nextSide);
    });

    setSide(card, card.dataset.defaultSide || 'front');
  });
}
