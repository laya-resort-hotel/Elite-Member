import { $, $$ } from '../core/dom.js';
import { escapeHtml } from '../core/format.js';
import { state } from '../core/state.js';
import { demoBenefits, demoNews, demoPromotions } from '../data/demo.js';
import { loadDocumentById } from '../services/content-service.js';
import { showToast } from '../ui/toast.js';

const demoMap = {
  news: demoNews,
  promotions: demoPromotions,
  benefits: demoBenefits,
};

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

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id') || '',
    demo: params.get('demo') || '',
  };
}

function normalizeContent(item = {}) {
  const details = Array.isArray(item.details)
    ? item.details
    : String(item.details || item.body || '').split('\n').filter(Boolean);
  const terms = Array.isArray(item.terms)
    ? item.terms
    : String(item.terms || '').split('\n').filter(Boolean);
  return {
    ...item,
    summary: item.summary || item.body || '',
    details,
    terms,
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
  target.innerHTML = items.map((item) => `
    <a class="card-item detail-link-card" href="./${type}-detail.html?demo=${encodeURIComponent(item.id)}">
      <div class="eyebrow gold">Related ${escapeHtml(labelMap[type])}</div>
      <h4>${escapeHtml(item.title || '-')}</h4>
      <p>${escapeHtml(item.summary || item.body || '')}</p>
      <span class="text-link">Open detail</span>
    </a>
  `).join('');
}

function renderDetail(type, item) {
  const safe = normalizeContent(item);
  if ($('detailEyebrow')) $('detailEyebrow').textContent = labelMap[type];
  if ($('detailHeading')) $('detailHeading').textContent = safe.title || pageTitleMap[type];
  if ($('detailSummary')) $('detailSummary').textContent = safe.summary || safe.body || '';
  if ($('detailMeta')) $('detailMeta').textContent = safe.createdLabel && safe.createdLabel !== '-' ? `Published ${safe.createdLabel}` : `Demo ${labelMap[type]} detail`;
  if ($('detailBody')) {
    $('detailBody').innerHTML = `
      <section class="detail-section">
        <div class="section-head"><h3>Overview</h3><span class="eyebrow">Summary</span></div>
        <p class="detail-paragraph">${escapeHtml(safe.body || safe.summary || '')}</p>
      </section>
      <section class="detail-section">
        <div class="section-head"><h3>Details</h3><span class="eyebrow">Key points</span></div>
        ${renderList(safe.details)}
      </section>
      <section class="detail-section">
        <div class="section-head"><h3>Terms</h3><span class="eyebrow">Conditions</span></div>
        ${renderList(safe.terms.length ? safe.terms : ['Please contact the hotel team for full details.'])}
      </section>
    `;
  }
  if ($('detailCtaLabel')) $('detailCtaLabel').textContent = safe.ctaLabel || 'Contact team';
}

async function resolveItem(type) {
  const { id, demo } = getParams();
  if (id && state.firebaseReady) {
    try {
      const liveItem = await loadDocumentById(type, id);
      if (liveItem) return liveItem;
    } catch (error) {
      console.warn(error);
      showToast('อ่านข้อมูล detail จาก Firestore ไม่ได้ ใช้ข้อมูลตัวอย่างแทน', 'error');
    }
  }
  if (demo) {
    return demoMap[type].find((item) => item.id === demo) || null;
  }
  return demoMap[type][0] || null;
}

export async function loadDetailPage(type) {
  const item = await resolveItem(type);
  if (!item) {
    if ($('detailHeading')) $('detailHeading').textContent = `${pageTitleMap[type]} not found`;
    if ($('detailSummary')) $('detailSummary').textContent = 'ไม่พบข้อมูลรายการนี้';
    if ($('detailBody')) $('detailBody').innerHTML = '<div class="card-item"><p>ลองกลับไปที่หน้ารายการหลักแล้วเลือกใหม่อีกครั้ง</p></div>';
    return;
  }
  renderDetail(type, item);
  renderRelated(type, getRelated(demoMap[type], item.id));
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
  $$('[data-detail-label]').forEach((el) => {
    el.textContent = pageTitleMap[type];
  });
}
