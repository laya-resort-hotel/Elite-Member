
import { $$ } from './dom.js';

export function highlightCurrentNav() {
  const page = document.body?.dataset?.page || '';
  $$('[data-page-link]').forEach((link) => {
    const isActive = link.dataset.pageLink === page;
    link.classList.toggle('active', isActive);
  });
}
