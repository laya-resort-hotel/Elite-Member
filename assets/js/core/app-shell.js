import { $$ } from './dom.js?v=20260404fix4';

export function highlightCurrentNav() {
  const page = document.body?.dataset?.page || '';
  const activeMap = {
    'news-detail': 'home',
    'promotions-detail': 'redemption',
    'benefits-detail': 'member',
    'news': 'home',
    'promotions': 'redemption',
    'benefits': 'member',
    'resident': 'member',
  };
  const activePage = activeMap[page] || page;
  $$('[data-page-link]').forEach((link) => {
    const isActive = link.dataset.pageLink === activePage;
    link.classList.toggle('active', isActive);
  });
}
