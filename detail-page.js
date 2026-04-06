import { $ } from '../core/dom.js';

let toastTimer = null;

export function showToast(message, type = 'success') {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
}
