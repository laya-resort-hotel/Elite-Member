import { $$ } from './dom.js';

export function highlightCurrentNav() {
  const page = document.body?.dataset?.page || '';
  const activeMap = {
    'news-detail': 'news',
    'promotions-detail': 'promotions',
    'benefits-detail': 'benefits',
  };
  const activePage = activeMap[page] || page;
  $$('[data-page-link]').forEach((link) => {
    const isActive = link.dataset.pageLink === activePage;
    link.classList.toggle('active', isActive);
  });
}
