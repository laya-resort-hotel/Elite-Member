import { state } from '../core/state.js';
import { loadStaticPageContent, getLocalizedStaticPage, STATIC_PAGE_LABELS } from '../services/static-page-service.js';

function text(value = '') {
  return String(value || '').trim();
}

function fallbackTitle(slug = 'about') {
  return STATIC_PAGE_LABELS[slug] || slug;
}

export async function loadStaticPage(slug = document.body?.dataset?.page || 'about') {
  const pageData = await loadStaticPageContent(slug);
  const localized = getLocalizedStaticPage(pageData, state.currentLanguage || 'en');

  const sectionTitle = document.getElementById('staticPageSectionTitle');
  const meta = document.getElementById('staticProfileMeta');
  const root = document.getElementById('staticPageRoot');
  if (sectionTitle) sectionTitle.textContent = text(localized.sectionTitle) || fallbackTitle(slug).toUpperCase();
  if (meta) meta.textContent = text(localized.profileMeta) || fallbackTitle(slug);
  if (!root) return localized;

  root.innerHTML = `
    <section class="panel about-panel">
      <div class="about-hero-copy">
        <div class="about-kicker">${text(localized.heroKicker)}</div>
        <h1 class="about-title">${text(localized.heroTitle) || fallbackTitle(slug)}</h1>
        <p class="about-lead">${text(localized.heroLead)}</p>
      </div>
    </section>
    <section class="panel about-copy-card faq-list-card static-page-content-card">
      ${localized.contentHtml || ''}
    </section>
    ${localized.footerHtml ? `<section class="panel about-contact-card static-page-footer-card">${localized.footerHtml}</section>` : ''}
  `;

  document.title = `LAYA Resident – ${text(localized.sectionTitle) || fallbackTitle(slug)}`;
  return localized;
}
