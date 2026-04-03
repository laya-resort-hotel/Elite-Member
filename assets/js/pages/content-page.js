
import { state } from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import { demoBenefits, demoNews, demoPromotions } from '../data/demo.js';
import { loadCollectionSafe, saveSimpleCMS } from '../services/content-service.js';
import { renderCards } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';

const demoMap = {
  news: demoNews,
  promotions: demoPromotions,
  benefits: demoBenefits,
};

const labelMap = {
  news: 'News',
  promotions: 'Promotions',
  benefits: 'Benefits',
};

export async function loadContentPage(type) {
  const target = $('contentList');
  try {
    const rows = await loadCollectionSafe(type, { limit: 20 });
    renderCards(target, rows.length ? rows : demoMap[type], `No ${labelMap[type]} yet`);
  } catch (error) {
    console.warn(error);
    renderCards(target, demoMap[type], `No ${labelMap[type]} yet`);
    showToast('ใช้ข้อมูลตัวอย่างชั่วคราว เพราะอ่าน Firestore ไม่ได้', 'error');
  }
}

export function applyContentPageState(type) {
  const heading = $('contentHeading');
  const subheading = $('contentSubheading');
  const titleInput = $('contentTitle');
  const bodyInput = $('contentBody');
  if (heading) heading.textContent = labelMap[type];
  if (subheading) subheading.textContent = `All ${labelMap[type]} items`;
  if (titleInput) titleInput.placeholder = `${labelMap[type]} title`;
  if (bodyInput) bodyInput.placeholder = `${labelMap[type]} details`;
  $$('[data-content-label]').forEach((el) => el.textContent = labelMap[type]);
}

export function bindContentPage(type) {
  if (!$('saveContentBtn')) return;
  $('saveContentBtn').addEventListener('click', async () => {
    if (!state.firebaseReady) {
      showToast('Firebase not ready', 'error');
      return;
    }
    const title = $('contentTitle')?.value.trim();
    const body = $('contentBody')?.value.trim();
    if (!title || !body) {
      showToast('กรอกข้อมูลให้ครบก่อนบันทึก', 'error');
      return;
    }
    try {
      await saveSimpleCMS(type, title, body);
      $('contentTitle').value = '';
      $('contentBody').value = '';
      showToast(`Saved ${labelMap[type]}`);
      await loadContentPage(type);
    } catch (error) {
      console.error(error);
      showToast(error.message || `Save ${labelMap[type]} failed`, 'error');
    }
  });
}
