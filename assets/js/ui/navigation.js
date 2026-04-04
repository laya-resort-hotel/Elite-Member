import { $$ } from '../core/dom.js?v=20260404fix5';

const screens = () => $$('.screen');
const navButtons = () => $$('[data-screen]');

export function setScreen(screenId) {
  screens().forEach((screen) => screen.classList.toggle('active', screen.id === screenId));
  navButtons().forEach((btn) => btn.classList.toggle('active', btn.dataset.screen === screenId));
}

export function bindScreenButtons() {
  navButtons().forEach((btn) => {
    btn.addEventListener('click', () => setScreen(btn.dataset.screen));
  });
}
