import { $$ } from '../core/dom.js';

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

function bindSwipe(scene, card) {
  if (!scene || !card) return;

  let startX = 0;
  let startY = 0;
  let dragging = false;
  let recentSwipeAt = 0;

  const swipeThreshold = 28;
  const verticalTolerance = 46;
  const clickSuppressMs = 420;

  const handleSwipeResult = (deltaX, deltaY) => {
    if (Math.abs(deltaX) < swipeThreshold) return false;
    if (Math.abs(deltaY) > verticalTolerance && Math.abs(deltaY) > Math.abs(deltaX)) return false;

    recentSwipeAt = Date.now();
    setSide(card, deltaX < 0 ? 'back' : 'front');
    return true;
  };

  scene.addEventListener('touchstart', (event) => {
    if (!event.touches || !event.touches.length) return;
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    dragging = true;
  }, { passive: true });

  scene.addEventListener('touchend', (event) => {
    if (!dragging) return;
    const touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    handleSwipeResult(deltaX, deltaY);
    dragging = false;
  }, { passive: true });

  scene.addEventListener('touchcancel', () => {
    dragging = false;
  }, { passive: true });

  // Fallback for browsers/devices where touchend swipe is unreliable
  scene.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return;
    startX = event.clientX;
    startY = event.clientY;
    dragging = true;
  });

  scene.addEventListener('pointerup', (event) => {
    if (!dragging || event.pointerType !== 'touch') return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    handleSwipeResult(deltaX, deltaY);
    dragging = false;
  });

  scene.addEventListener('click', () => {
    if (Date.now() - recentSwipeAt < clickSuppressMs) return;
    toggleSide(card);
  });
}

function downloadCurrentSide(card) {
  const side = card.dataset.side === 'back' ? 'back' : 'front';
  const img = card.querySelector(`.elite-card-${side} img`);
  const src = img?.getAttribute('src');
  if (!src) return;

  if (side !== 'back') {
    const link = document.createElement('a');
    link.href = src;
    link.download = `laya-elite-black-card-${side}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  const badgeText = (card.querySelector('#memberBackResidenceCode')?.textContent || '').trim();
  if (!badgeText) {
    const link = document.createElement('a');
    link.href = src;
    link.download = `laya-elite-black-card-${side}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || 1050;
    canvas.height = image.naturalHeight || 636;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const boxW = canvas.width * 0.34;
    const boxH = canvas.height * 0.15;
    const x = canvas.width * 0.60;
    const y = canvas.height * 0.08;
    const radius = boxH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + boxW - radius, y);
    ctx.quadraticCurveTo(x + boxW, y, x + boxW, y + radius);
    ctx.lineTo(x + boxW, y + boxH - radius);
    ctx.quadraticCurveTo(x + boxW, y + boxH, x + boxW - radius, y + boxH);
    ctx.lineTo(x + radius, y + boxH);
    ctx.quadraticCurveTo(x, y + boxH, x, y + boxH - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(5,7,10,0.93)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, canvas.width * 0.0018);
    ctx.strokeStyle = 'rgba(216,188,124,0.24)';
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#f3ead3';
    ctx.font = `700 ${Math.round(canvas.height * 0.045)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';
    ctx.fillText(badgeText.toUpperCase(), x + (boxW / 2), y + (boxH / 2));

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `laya-elite-black-card-${side}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  image.src = src;
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

    bindSwipe(scene, card);
    bindTilt(scene);
    setSide(card, card.dataset.defaultSide || 'front');
  });
}
