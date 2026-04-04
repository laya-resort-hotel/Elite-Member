import { $, $$ } from '../core/dom.js?v=20260404fix5';
import { escapeHtml } from '../core/format.js?v=20260404fix5';
import { state } from '../core/state.js?v=20260404fix5';
import { deleteCMSItem, loadCollectionSafe, loadDocumentById } from '../services/content-service.js?v=20260404fix5';
import { showToast } from '../ui/toast.js?v=20260404fix5';

const labelMap = {
  news: 'News',
  promotions: 'Promotion',
  benefits: 'Benefit',
};

const pageTitleMap = {
  news: 'News Detail',
  promotions: 'Promotion Detail',
  benefits: 'Benefit Detail',
};

let currentItem = null;
let currentType = '';
let lightboxGallery = [];
let currentLightboxIndex = 0;

function canManageContent() {
  return state.firebaseReady && state.currentMode.includes('live') && ['admin', 'manager', 'staff'].includes(state.currentRole);
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id') || ''
  };
}

function normalizeContent(item = {}) {
  const fullDetails = String(item.fullDetails || '').trim();
  const details = Array.isArray(item.details)
    ? item.details
    : String(fullDetails || item.details || item.body || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const terms = Array.isArray(item.terms)
    ? item.terms
    : String(item.terms || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const galleryImages = Array.isArray(item.galleryImages)
    ? item.galleryImages.filter((entry) => entry?.url)
    : [];
  const primaryImage = item.coverImageUrl || galleryImages[0]?.url || '';
  const mergedGallery = [];
  const pushUnique = (entry) => {
    if (!entry?.url) return;
    if (mergedGallery.some((existing) => existing.url === entry.url)) return;
    mergedGallery.push({
      url: entry.url,
      path: entry.path || '',
      name: entry.name || '',
    });
  };
  pushUnique({ url: primaryImage, path: item.coverImagePath || '', name: item.coverImageName || '' });
  galleryImages.forEach(pushUnique);
  return {
    ...item,
    summary: item.summary || item.body || '',
    body: item.body || item.summary || '',
    fullDetails: fullDetails || details.join('\n'),
    details,
    terms,
    ctaLabel: item.ctaLabel || 'Contact team',
    coverImageUrl: primaryImage,
    galleryImages: mergedGallery,
  };
}

function renderList(items = []) {
  if (!items.length) return '<p class="muted">-</p>';
  return `<ul class="detail-bullets">${items.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>`;
}

function getRelated(items, currentId) {
  return items.filter((entry) => entry.id !== currentId).slice(0, 3);
}

function renderRelated(type, items = []) {
  const target = $('relatedList');
  if (!target) return;
  if (!items.length) {
    target.innerHTML = '<div class="card-item"><p>ไม่มีรายการอื่นในตอนนี้</p></div>';
    return;
  }
  target.innerHTML = items.map((item) => {
    const href = `./${type}-detail.html?id=${encodeURIComponent(item.id)}`;
    return `
    <a class="card-item detail-link-card" href="${href}">
      <div class="eyebrow gold">Related ${escapeHtml(labelMap[type])}</div>
      <h4>${escapeHtml(item.title || '-')}</h4>
      <p>${escapeHtml(item.summary || item.body || '')}</p>
      <span class="text-link">Open detail</span>
    </a>
  `;
  }).join('');
}

function renderAdminTools(type, item) {
  const card = $('detailAdminTools');
  const editBtn = $('detailEditBtn');
  const deleteBtn = $('detailDeleteBtn');
  const note = $('detailAdminNote');
  if (!card) return;
  const manageable = canManageContent() && Boolean(item?.id && item?.createdLabel);
  card.classList.toggle('hidden', !canManageContent());
  if (note) {
    note.textContent = manageable
      ? 'รายการนี้เป็นข้อมูลจริงจาก Firebase สามารถกดแก้ไขหรือลบได้'
      : 'ยังไม่มีสิทธิ์แก้ไขรายการนี้';
  }
  if (editBtn) {
    editBtn.classList.toggle('hidden', !canManageContent());
    editBtn.href = manageable ? `./${type}.html?edit=${encodeURIComponent(item.id)}` : `./${type}.html`;
  }
  if (deleteBtn) {
    deleteBtn.classList.toggle('hidden', !canManageContent());
    deleteBtn.disabled = !manageable;
  }
}

function renderGallery(item) {
  const target = $('detailCoverWrap');
  if (!target) return;
  const images = item.galleryImages || [];
  lightboxGallery = images;
  currentLightboxIndex = 0;
  if (!images.length) {
    target.innerHTML = `<div class="detail-cover detail-cover-fallback"><span>${escapeHtml(labelMap[currentType])}</span></div>`;
    return;
  }
  const mainImage = images[0];
  target.innerHTML = `
    <div class="detail-gallery-shell">
      <button id="detailMainImageBtn" class="detail-main-image-btn" type="button" data-lightbox-index="0" aria-label="Open image fullscreen">
        <img id="detailMainImage" class="detail-cover" src="${escapeHtml(mainImage.url)}" alt="${escapeHtml(item.title || labelMap[currentType])}" loading="lazy">
        <span class="detail-zoom-chip">Tap to view full screen</span>
      </button>
      ${images.length > 1 ? `
        <div id="detailThumbList" class="detail-thumb-grid">
          ${images.map((image, index) => `
            <button class="detail-thumb ${index === 0 ? 'active' : ''}" type="button" data-image-url="${escapeHtml(image.url)}" data-image-index="${index}">
              <img src="${escapeHtml(image.url)}" alt="Thumbnail ${index + 1}" loading="lazy">
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function ensureLightbox() {
  if ($('detailLightbox')) return;
  const overlay = document.createElement('div');
  overlay.id = 'detailLightbox';
  overlay.className = 'detail-lightbox hidden';
  overlay.innerHTML = `
    <div class="detail-lightbox-backdrop" data-lightbox-close></div>
    <div class="detail-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image preview">
      <button class="detail-lightbox-close" type="button" data-lightbox-close aria-label="Close fullscreen image">×</button>
      <button class="detail-lightbox-nav prev" type="button" data-lightbox-nav="prev" aria-label="Previous image">‹</button>
      <div class="detail-lightbox-stage">
        <img id="detailLightboxImage" class="detail-lightbox-image" src="" alt="Fullscreen preview">
        <div id="detailLightboxCaption" class="detail-lightbox-caption">1 / 1</div>
      </div>
      <button class="detail-lightbox-nav next" type="button" data-lightbox-nav="next" aria-label="Next image">›</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function updateLightbox() {
  const image = $('detailLightboxImage');
  const caption = $('detailLightboxCaption');
  if (!image || !lightboxGallery.length) return;
  const safeIndex = Math.max(0, Math.min(currentLightboxIndex, lightboxGallery.length - 1));
  currentLightboxIndex = safeIndex;
  const entry = lightboxGallery[safeIndex];
  image.src = entry.url;
  image.alt = `${currentType} image ${safeIndex + 1}`;
  if (caption) caption.textContent = `${safeIndex + 1} / ${lightboxGallery.length}`;
}

function openLightbox(index = 0) {
  if (!lightboxGallery.length) return;
  ensureLightbox();
  currentLightboxIndex = Number(index) || 0;
  updateLightbox();
  $('detailLightbox')?.classList.remove('hidden');
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  $('detailLightbox')?.classList.add('hidden');
  document.body.classList.remove('lightbox-open');
}

function stepLightbox(direction = 1) {
  if (!lightboxGallery.length) return;
  currentLightboxIndex = (currentLightboxIndex + direction + lightboxGallery.length) % lightboxGallery.length;
  updateLightbox();
}

function renderDetail(type, item) {
  const safe = normalizeContent(item);
  if ($('detailEyebrow')) $('detailEyebrow').textContent = labelMap[type];
  if ($('detailHeading')) $('detailHeading').textContent = safe.title || pageTitleMap[type];
  if ($('detailSummary')) $('detailSummary').textContent = safe.summary || safe.body || '';
  if ($('detailMeta')) {
    const galleryCount = safe.galleryImages?.length ? ` • ${safe.galleryImages.length} photos` : '';
    $('detailMeta').textContent = safe.createdLabel && safe.createdLabel !== '-' ? `Published ${safe.createdLabel}${galleryCount}` : `Demo ${labelMap[type]} detail${galleryCount}`;
  }
  renderGallery(safe);
  if ($('detailBody')) {
    $('detailBody').innerHTML = `
      <section class="detail-section">
        <div class="section-head"><h3>Overview</h3><span class="eyebrow">Summary</span></div>
        <p class="detail-paragraph">${escapeHtml(safe.summary || safe.body || '')}</p>
      </section>
      <section class="detail-section">
        <div class="section-head"><h3>Full Details</h3><span class="eyebrow">Expanded content</span></div>
        <p class="detail-paragraph">${escapeHtml(safe.fullDetails || '').replaceAll('\n', '<br>')}</p>
      </section>
      ${safe.galleryImages?.length ? `
      <section class="detail-section">
        <div class="section-head"><h3>Photo Gallery</h3><span class="eyebrow">${safe.galleryImages.length} images</span></div>
        <div class="detail-gallery-grid">
          ${safe.galleryImages.map((image, index) => `
            <button class="detail-gallery-card" type="button" data-image-url="${escapeHtml(image.url)}" data-image-index="${index}" data-lightbox-index="${index}">
              <img src="${escapeHtml(image.url)}" alt="Gallery image ${index + 1}" loading="lazy">
            </button>
          `).join('')}
        </div>
      </section>` : ''}
      <section class="detail-section">
        <div class="section-head"><h3>Key Points</h3><span class="eyebrow">Highlights</span></div>
        ${renderList(safe.details)}
      </section>
      <section class="detail-section">
        <div class="section-head"><h3>Terms</h3><span class="eyebrow">Conditions</span></div>
        ${renderList(safe.terms.length ? safe.terms : ['Please contact the hotel team for full details.'])}
      </section>
    `;
  }
  if ($('detailCtaLabel')) $('detailCtaLabel').textContent = safe.ctaLabel || 'Contact team';
  renderAdminTools(type, safe);
}

async function resolveItem(type) {
  const { id } = getParams();
  if (!id || !state.firebaseReady) return null;
  try {
    return await loadDocumentById(type, id);
  } catch (error) {
    console.warn(error);
    showToast('อ่านข้อมูล detail จาก Firestore ไม่ได้', 'error');
    return null;
  }
}

async function loadRelatedItems(type, current) {
  if (current?.id && state.firebaseReady) {
    try {
      const rows = await loadCollectionSafe(type, { limit: 6 });
      return getRelated(rows, current.id);
    } catch (error) {
      console.warn(error);
    }
  }
  return [];
}

function switchMainImage(url, index) {
  const mainImage = $('detailMainImage');
  const mainButton = $('detailMainImageBtn');
  if (mainImage && url) mainImage.src = url;
  if (mainButton) mainButton.dataset.lightboxIndex = String(index);
  $$('[data-image-index]').forEach((el) => {
    el.classList.toggle('active', String(el.dataset.imageIndex) === String(index));
  });
}

export async function loadDetailPage(type) {
  currentType = type;
  const item = await resolveItem(type);
  currentItem = item;
  if (!item) {
    if ($('detailHeading')) $('detailHeading').textContent = `${pageTitleMap[type]} not found`;
    if ($('detailSummary')) $('detailSummary').textContent = 'ไม่พบข้อมูลรายการนี้';
    if ($('detailBody')) $('detailBody').innerHTML = '<div class="card-item"><p>ลองกลับไปที่หน้ารายการหลักแล้วเลือกใหม่อีกครั้ง</p></div>';
    return;
  }
  renderDetail(type, item);
  renderRelated(type, await loadRelatedItems(type, item));
}

export function bindDetailPage(type) {
  if ($('backToListBtn')) {
    $('backToListBtn').addEventListener('click', () => {
      window.location.href = `./${type}.html`;
    });
  }
  if ($('detailCtaBtn')) {
    $('detailCtaBtn').addEventListener('click', () => {
      showToast(`${labelMap[type]} action is ready for next step`);
    });
  }
  ensureLightbox();
  document.addEventListener('click', (event) => {
    const thumbTrigger = event.target.closest('.detail-thumb');
    if (thumbTrigger) {
      switchMainImage(thumbTrigger.dataset.imageUrl || '', thumbTrigger.dataset.imageIndex || '0');
      return;
    }
    const lightboxTrigger = event.target.closest('[data-lightbox-index]');
    if (lightboxTrigger) {
      openLightbox(lightboxTrigger.dataset.lightboxIndex || lightboxTrigger.dataset.imageIndex || '0');
      return;
    }
    const closeBtn = event.target.closest('[data-lightbox-close]');
    if (closeBtn) {
      closeLightbox();
      return;
    }
    const navBtn = event.target.closest('[data-lightbox-nav]');
    if (navBtn) {
      stepLightbox(navBtn.dataset.lightboxNav === 'prev' ? -1 : 1);
    }
  });
  document.addEventListener('keydown', (event) => {
    if ($('detailLightbox')?.classList.contains('hidden')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowRight') stepLightbox(1);
    if (event.key === 'ArrowLeft') stepLightbox(-1);
  });
  if ($('detailDeleteBtn')) {
    $('detailDeleteBtn').addEventListener('click', async () => {
      if (!canManageContent() || !currentItem?.id || !currentItem?.createdLabel) {
        showToast('รายการนี้ยังลบไม่ได้', 'error');
        return;
      }
      const ok = window.confirm(`ยืนยันลบ ${labelMap[currentType]} นี้?`);
      if (!ok) return;
      try {
        await deleteCMSItem(currentType, currentItem.id);
        showToast(`Deleted ${labelMap[currentType]}`);
        window.location.href = `./${currentType}.html`;
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Delete failed', 'error');
      }
    });
  }
  $$('[data-detail-label]').forEach((el) => {
    el.textContent = pageTitleMap[type];
  });
}
