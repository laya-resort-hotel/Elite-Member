import { $, $$ } from '../core/dom.js';
import { escapeHtml, formatDate, formatNumber, formatTHB } from '../core/format.js';
import { t, getLanguage } from '../core/i18n.js';
import { getLocalizedContent } from '../services/content-service.js?v=20260405cms4b';

function setAllById(id, value) {
  document.querySelectorAll(`[id="${id}"]`).forEach((node) => {
    node.textContent = value;
  });
}

export function updateStatusLabels({ firebaseState, authState, modeState }) {
  if (firebaseState !== undefined && $('firebaseState')) $('firebaseState').textContent = firebaseState;
  if (authState !== undefined && $('authState')) $('authState').textContent = authState;
  if (modeState !== undefined && $('modeState')) $('modeState').textContent = modeState;
}

export function renderCards(listEl, items = [], emptyText = t('common.noData'), options = {}) {
  if (!listEl) return;
  if (!items.length) {
    listEl.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }

  const contentType = typeof options === 'string' ? options : options.contentType;
  listEl.innerHTML = items.map((item) => {
    const localized = getLocalizedContent(item, getLanguage());
    const href = contentType ? buildContentDetailHref(contentType, localized, `./${contentType}.html`) : '';
    const wrapperTag = href ? 'a' : 'div';
    const wrapperAttrs = href
      ? `class="card-item card-item-link" href="${href}" aria-label="${escapeHtml(localized.title || localized.outlet || contentType || 'detail')}"`
      : 'class="card-item"';

    return `
      <${wrapperTag} ${wrapperAttrs}>
        <h4>${escapeHtml(localized.title || localized.outlet || '-')}</h4>
        <p>${escapeHtml(localized.summary || localized.body || localized.description || '')}</p>
        ${localized.createdLabel ? `<small>${escapeHtml(localized.createdLabel)}</small>` : ''}
      </${wrapperTag}>
    `;
  }).join('');
}

function buildContentDetailHref(type, item, fallbackHref) {
  const id = String(item?.id || '').trim();
  return id ? `./${type}-detail.html?id=${encodeURIComponent(id)}` : fallbackHref;
}

export function renderVaultHome(newsItems = [], promotionItems = []) {
  const hero = $('homeNewsHero');
  if (hero) {
    const localizedNewsItems = (Array.isArray(newsItems) ? newsItems : [newsItems])
      .filter(Boolean)
      .map((item) => getLocalizedContent(item || {}, getLanguage()));

    let slides = [];
    if (localizedNewsItems.length > 1) {
      slides = localizedNewsItems.map((item, index) => ({
        image: item?.coverImageUrl || item?.galleryImages?.[0]?.url || '',
        title: item?.title || `${t('content.news')} ${index + 1}`,
      })).filter((slide) => slide.image);
    } else if (localizedNewsItems.length === 1) {
      const item = localizedNewsItems[0];
      const imageCandidates = [
        item?.coverImageUrl || '',
        ...((item?.galleryImages || []).map((galleryItem) => galleryItem?.url || '').filter(Boolean)),
      ].filter(Boolean);
      slides = [...new Set(imageCandidates)].map((image, index) => ({
        image,
        title: item?.title || `${t('content.news')} ${index + 1}`,
      }));
    }

    hero.innerHTML = slides.length
      ? `
        <div class="vault-news-scroll" aria-label="${escapeHtml(t('content.news'))}">
          ${slides.map((slide, index) => `
            <div class="vault-news-slide" data-slide-index="${index}">
              <div class="vault-news-image-wrap vault-news-frame">
                <img class="vault-news-image" src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.title)}" />
              </div>
            </div>
          `).join('')}
        </div>
        ${slides.length > 1 ? `
          <div class="vault-news-dots" aria-hidden="true">
            ${slides.map((_, index) => `<span class="vault-news-dot${index === 0 ? ' is-active' : ''}"></span>`).join('')}
          </div>
        ` : ''}
      `
      : `
        <div class="vault-news-image-wrap vault-news-frame">
          <div class="vault-news-image vault-news-fallback">${escapeHtml(t('content.news'))}</div>
        </div>
      `;

    const scroller = hero.querySelector('.vault-news-scroll');
    const dots = [...hero.querySelectorAll('.vault-news-dot')];
    if (scroller && dots.length) {
      const setActiveDot = () => {
        const slideWidth = scroller.clientWidth || 1;
        const index = Math.round(scroller.scrollLeft / slideWidth);
        dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
      };
      scroller.addEventListener('scroll', setActiveDot, { passive: true });
      setActiveDot();
    }
  }

  const promoGrid = $('homePromotionGrid');
  if (promoGrid) {
    const items = promotionItems;
    promoGrid.innerHTML = items.map((item) => {
      const localized = getLocalizedContent(item, getLanguage());
      const image = localized.coverImageUrl || localized.galleryImages?.[0]?.url || '';
      const promoHref = buildContentDetailHref('promotions', localized, './promotions.html');
      return `
        <a class="vault-promo-card image-only" href="${promoHref}" aria-label="${escapeHtml(localized.title || t('content.promotion'))}">
          <div class="vault-promo-thumb-wrap">
            ${image ? `<img class="vault-promo-thumb" src="${escapeHtml(image)}" alt="${escapeHtml(localized.title || t('content.promotion'))}" />` : `<div class="vault-promo-thumb vault-news-fallback">${escapeHtml(t('content.promotion'))}</div>`}
          </div>
        </a>
      `;
    }).join('');
  }
}

export function renderTable(container, rows = [], emptyText = t('common.noData')) {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }
  container.innerHTML = `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>${escapeHtml(t('faq.sectionTitle') === 'FAQ' ? 'Date' : 'วันที่')}</th>
            <th>${escapeHtml(t('common.member'))}</th>
            <th>${escapeHtml(t('contact.resortLabel') === 'Resort' ? 'Outlet' : 'เอาต์เล็ต')}</th>
            <th>${escapeHtml(t('contact.phoneLabel') === 'Telephone' ? 'Amount' : 'ยอดใช้จ่าย')}</th>
            <th>${escapeHtml(t('member.availablePoints'))}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.createdLabel || formatDate(row.createdAt))}</td>
              <td>${escapeHtml(row.memberName || row.fullName || '')}<br><small>${escapeHtml(row.memberCode || '')}</small></td>
              <td>${escapeHtml(row.outlet || '-')}</td>
              <td>${formatTHB(row.amount || 0)}</td>
              <td>${formatNumber(row.points || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderResidentCard(resident = {}) {
  const fullName = resident.fullName || resident.displayName || t('common.residentMember');
  const initials = fullName.trim().charAt(0).toUpperCase() || 'R';
  const qrCode = resident.qrCodeValue || resident.publicCardCode || resident.memberCode || resident.memberId || 'LAYA-0001';
  const currentPoints = formatNumber(resident.points || 0);

  setAllById('memberName', fullName);
  setAllById('memberTier', resident.tier || 'Elite Black');
  setAllById('memberStatusPill', resident.status || 'ACTIVE');
  setAllById('memberCode', resident.memberCode || qrCode);
  const residenceCode = resident.residence || resident.primaryUnitCode || '-';
  setAllById('memberResidence', residenceCode);
  setAllById('memberBackResidenceCode', residenceCode);
  setAllById('memberPoints', currentPoints);
  setAllById('memberSpend', formatTHB(resident.totalSpend || 0));
  setAllById('memberQrCodeText', qrCode);
  setAllById('memberCardNumber', resident.cardNumber || '-');
  setAllById('memberLoginEmail', resident.email || resident.contactEmail || '-');
  setAllById('memberPendingPoints', formatNumber(resident.pendingPoints || 0));
  setAllById('memberLifetimeEarned', formatNumber(resident.lifetimeEarned || 0));
  setAllById('memberLifetimeRedeemed', formatNumber(resident.lifetimeRedeemed || 0));

  if ($('memberAvatarLetter')) $('memberAvatarLetter').textContent = initials;
  if ($('vaultMemberName')) $('vaultMemberName').textContent = fullName;
  renderQr(qrCode);
}

export function renderResidentSearchResults(container, residents = []) {
  if (!container) return;
  if (!residents.length) {
    container.innerHTML = `<div class="card-item"><p>${escapeHtml(t('common.noData'))}</p></div>`;
    return;
  }
  container.innerHTML = residents.map((resident) => `
    <div class="card-item">
      <h4>${escapeHtml(resident.fullName || resident.memberName || '-')}</h4>
      <p>${escapeHtml(resident.memberCode || '-')}
      <br>${escapeHtml(resident.email || '')}
      <br>${escapeHtml(resident.residence || '')}
      <br><small>${escapeHtml(resident.cardNumber || resident.qrCodeValue || '')}</small></p>
    </div>
  `).join('');
}

export function renderAdminKpis({ residents = 0, points = 0, spend = 0 }) {
  if ($('kpiResidents')) $('kpiResidents').textContent = formatNumber(residents);
  if ($('kpiPoints')) $('kpiPoints').textContent = formatNumber(points);
  if ($('kpiSpend')) $('kpiSpend').textContent = formatTHB(spend);
}

export function renderResidentPointHistoryMini(container, rows = [], emptyText = t('common.noPointHistoryYet')) {
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }

  container.innerHTML = rows.map((row) => {
    const delta = Number(row.pointsDelta || 0);
    const sign = delta > 0 ? '+' : '';
    return `
      <div class="card-item">
        <div class="row space-between gap">
          <div>
            <strong>${escapeHtml(row.type || 'transaction')}</strong>
            <p>${escapeHtml(row.source || '-')} · ${escapeHtml(row.referenceNo || '-')}</p>
            ${row.note ? `<small>${escapeHtml(row.note)}</small>` : ''}
          </div>
          <div class="text-right">
            <strong class="${delta < 0 ? 'text-danger' : 'text-gold'}">${sign}${formatNumber(delta)}</strong>
            <p><small>${escapeHtml(formatDate(row.createdAt))}</small></p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderQr(text) {
  const canvas = $('memberQrCanvas');
  if (!canvas) return;
  if (window.QRious) {
    new window.QRious({ element: canvas, value: text, size: 124, background: 'white', foreground: '#111111' });
  } else {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.font = '12px sans-serif';
    ctx.fillText(text, 12, 70);
  }
}
