import { state } from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import { demoBenefits, demoNews, demoPromotions } from '../data/demo.js';
import { deleteCMSItem, loadCollectionSafe, loadDocumentById, saveStructuredCMS, updateStructuredCMS } from '../services/content-service.js';
import { uploadCmsCover } from '../services/storage-service.js';
import { escapeHtml } from '../core/format.js';
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

let editingItemId = '';
let currentCoverImagePath = '';
let currentCoverImageName = '';
let uploadInProgress = false;

function canManageContent() {
  return state.firebaseReady && state.currentMode.includes('live') && ['admin', 'manager', 'staff'].includes(state.currentRole);
}

function getEditRequestId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('edit') || '';
}

function clearEditRequestId() {
  const url = new URL(window.location.href);
  url.searchParams.delete('edit');
  window.history.replaceState({}, '', url.toString());
}

function detailHref(type, item) {
  if (item.id && item.createdLabel) return `./${type}-detail.html?id=${encodeURIComponent(item.id)}`;
  const demoId = item.id || '';
  return `./${type}-detail.html?demo=${encodeURIComponent(demoId)}`;
}

function getFormValues() {
  return {
    title: $('contentTitle')?.value.trim() || '',
    summary: $('contentSummary')?.value.trim() || '',
    fullDetails: $('contentFullDetails')?.value.trim() || '',
    terms: $('contentTerms')?.value.trim() || '',
    ctaLabel: $('contentCtaLabel')?.value.trim() || '',
    coverImageUrl: $('contentCoverImageUrl')?.value.trim() || '',
    coverImagePath: currentCoverImagePath || '',
    coverImageName: currentCoverImageName || '',
  };
}

function setFormValues(item = {}) {
  currentCoverImagePath = item.coverImagePath || '';
  currentCoverImageName = item.coverImageName || '';
  if ($('contentTitle')) $('contentTitle').value = item.title || '';
  if ($('contentSummary')) $('contentSummary').value = item.summary || item.body || '';
  if ($('contentFullDetails')) {
    $('contentFullDetails').value = item.fullDetails || (Array.isArray(item.details) ? item.details.join('\n') : item.body || '');
  }
  if ($('contentTerms')) {
    $('contentTerms').value = Array.isArray(item.terms) ? item.terms.join('\n') : (item.terms || '');
  }
  if ($('contentCtaLabel')) $('contentCtaLabel').value = item.ctaLabel || '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = item.coverImageUrl || '';
  if ($('contentCoverFile')) $('contentCoverFile').value = '';
  updateCoverPreview();
  updateCoverMeta();
}

function updateCoverPreview() {
  const url = $('contentCoverImageUrl')?.value.trim() || '';
  const img = $('contentCoverPreview');
  const empty = $('contentCoverPreviewEmpty');
  if (!img || !empty) return;
  if (url) {
    img.src = url;
    img.classList.remove('hidden');
    empty.classList.add('hidden');
  } else {
    img.removeAttribute('src');
    img.classList.add('hidden');
    empty.classList.remove('hidden');
  }
}

function setUploadBusy(isBusy) {
  uploadInProgress = isBusy;
  if ($('uploadCoverBtn')) $('uploadCoverBtn').disabled = isBusy;
  if ($('saveContentBtn')) $('saveContentBtn').disabled = isBusy;
}

function updateCoverMeta() {
  const meta = $('contentCoverMeta');
  if (!meta) return;
  if (currentCoverImageName) {
    meta.textContent = `ไฟล์ที่ผูกกับรายการ: ${currentCoverImageName}`;
    meta.classList.remove('hidden');
    return;
  }
  if ($('contentCoverImageUrl')?.value.trim()) {
    meta.textContent = 'รูปนี้พร้อมใช้งานและจะถูกบันทึกไปพร้อมรายการ';
    meta.classList.remove('hidden');
    return;
  }
  meta.textContent = '';
  meta.classList.add('hidden');
}

function getSelectedCoverFile() {
  return $('contentCoverFile')?.files?.[0] || null;
}

function previewSelectedFile() {
  const file = getSelectedCoverFile();
  if (!file) {
    updateCoverPreview();
    updateCoverMeta();
    return;
  }
  const img = $('contentCoverPreview');
  const empty = $('contentCoverPreviewEmpty');
  if (!img || !empty) return;
  const meta = $('contentCoverMeta');
  if (meta) {
    meta.textContent = `เลือกรูปแล้ว: ${file.name} — กด Upload to Firebase Storage`;
    meta.classList.remove('hidden');
  }
  const reader = new FileReader();
  reader.onload = () => {
    img.src = String(reader.result || '');
    img.classList.remove('hidden');
    empty.classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

async function uploadSelectedCover(type) {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
    return;
  }
  const file = getSelectedCoverFile();
  if (!file) {
    showToast('เลือกรูปก่อนอัปโหลด', 'error');
    return;
  }
  if (!file.type.startsWith('image/')) {
    showToast('อัปโหลดได้เฉพาะไฟล์รูป', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('ไฟล์ใหญ่เกิน 5MB', 'error');
    return;
  }
  try {
    setUploadBusy(true);
    if ($('contentUploadStatus')) {
      $('contentUploadStatus').textContent = 'กำลังอัปโหลดรูปขึ้น Firebase Storage...';
      $('contentUploadStatus').classList.remove('hidden');
    }
    const result = await uploadCmsCover(file, type);
    currentCoverImagePath = result.path || '';
    currentCoverImageName = result.name || file.name || '';
    if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = result.url || '';
    updateCoverPreview();
    updateCoverMeta();
    if ($('contentUploadStatus')) $('contentUploadStatus').textContent = 'อัปโหลดรูปสำเร็จแล้ว';
    showToast('อัปโหลดรูปสำเร็จ');
  } catch (error) {
    console.error(error);
    if ($('contentUploadStatus')) $('contentUploadStatus').textContent = error.message || 'อัปโหลดรูปไม่สำเร็จ';
    showToast(error.message || 'อัปโหลดรูปไม่สำเร็จ', 'error');
  } finally {
    setUploadBusy(false);
  }
}

function clearCoverSelection() {
  currentCoverImagePath = '';
  currentCoverImageName = '';
  if ($('contentCoverFile')) $('contentCoverFile').value = '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = '';
  if ($('contentUploadStatus')) {
    $('contentUploadStatus').textContent = '';
    $('contentUploadStatus').classList.add('hidden');
  }
  updateCoverPreview();
  updateCoverMeta();
}

function updateEditorUi(type) {
  const saveBtn = $('saveContentBtn');
  const cancelBtn = $('cancelContentEditBtn');
  const note = $('editStateNote');
  const titleLabel = labelMap[type].slice(0, -1) || labelMap[type];
  if (saveBtn) saveBtn.textContent = editingItemId ? `Update ${titleLabel}` : `Save ${titleLabel}`;
  if (cancelBtn) cancelBtn.classList.toggle('hidden', !editingItemId);
  if (note) {
    note.classList.toggle('hidden', !editingItemId);
    note.textContent = editingItemId ? `กำลังแก้ไข ${titleLabel} item` : '';
  }
  updateCoverMeta();
}

function resetEditor(type) {
  editingItemId = '';
  currentCoverImagePath = '';
  currentCoverImageName = '';
  setFormValues({});
  if ($('contentUploadStatus')) {
    $('contentUploadStatus').textContent = '';
    $('contentUploadStatus').classList.add('hidden');
  }
  updateEditorUi(type);
}

async function startEdit(type, id) {
  if (!canManageContent()) {
    showToast('เฉพาะ admin/staff ที่ login แล้วเท่านั้น', 'error');
    return;
  }
  if (!id) {
    showToast('รายการตัวอย่างยังแก้ไขไม่ได้', 'error');
    return;
  }
  try {
    const item = await loadDocumentById(type, id);
    if (!item) {
      showToast('ไม่พบรายการที่ต้องการแก้ไข', 'error');
      return;
    }
    editingItemId = id;
    setFormValues(item);
    updateEditorUi(type);
    $('contentTitle')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('โหลดข้อมูลเข้าฟอร์มแก้ไขแล้ว');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'เปิดโหมดแก้ไขไม่สำเร็จ', 'error');
  }
}

async function confirmDelete(type, id) {
  if (!canManageContent()) {
    showToast('เฉพาะ admin/staff ที่ login แล้วเท่านั้น', 'error');
    return;
  }
  if (!id) {
    showToast('รายการตัวอย่างยังลบไม่ได้', 'error');
    return;
  }
  const ok = window.confirm(`ยืนยันลบ ${labelMap[type].slice(0, -1)} นี้?`);
  if (!ok) return;
  try {
    await deleteCMSItem(type, id);
    if (editingItemId === id) resetEditor(type);
    showToast(`Deleted ${labelMap[type].slice(0, -1)}`);
    await loadContentPage(type);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Delete failed', 'error');
  }
}

function renderContentCards(listEl, type, items = [], emptyText = 'No data') {
  if (!listEl) return;
  if (!items.length) {
    listEl.innerHTML = `<div class="card-item"><p>${escapeHtml(emptyText)}</p></div>`;
    return;
  }
  const manage = canManageContent();
  listEl.innerHTML = items.map((item) => {
    const liveItem = Boolean(item.id && item.createdLabel);
    const adminButtons = manage ? `
      <button class="ghost-btn" data-action="edit" data-id="${escapeHtml(item.id || '')}" ${liveItem ? '' : 'disabled'}>${liveItem ? 'Edit' : 'Demo only'}</button>
      <button class="danger-btn" data-action="delete" data-id="${escapeHtml(item.id || '')}" ${liveItem ? '' : 'disabled'}>${liveItem ? 'Delete' : 'Demo only'}</button>
    ` : '';
    const cover = item.coverImageUrl
      ? `<img class="entry-cover" src="${escapeHtml(item.coverImageUrl)}" alt="${escapeHtml(item.title || labelMap[type])}" loading="lazy">`
      : `<div class="entry-cover entry-cover-fallback"><span>${escapeHtml(labelMap[type].slice(0, -1) || labelMap[type])}</span></div>`;
    return `
    <article class="card-item content-entry-card">
      ${cover}
      <div class="content-entry-top">
        <div>
          <div class="eyebrow gold">${escapeHtml(labelMap[type].slice(0, -1) || labelMap[type])}</div>
          <h4>${escapeHtml(item.title || item.outlet || '-')}</h4>
        </div>
        ${item.createdLabel && item.createdLabel !== '-' ? `<small>${escapeHtml(item.createdLabel)}</small>` : '<small>Demo content</small>'}
      </div>
      <p>${escapeHtml(item.summary || item.body || item.description || '')}</p>
      <div class="row gap wrap mt-md">
        <a class="secondary-btn" href="${detailHref(type, item)}">Open detail</a>
        ${adminButtons}
      </div>
    </article>
  `}).join('');
}

async function hydrateEditRequest(type) {
  const id = getEditRequestId();
  if (!id || !canManageContent()) return;
  await startEdit(type, id);
  clearEditRequestId();
}

export async function loadContentPage(type) {
  const target = $('contentList');
  try {
    const rows = await loadCollectionSafe(type, { limit: 20 });
    renderContentCards(target, type, rows.length ? rows : demoMap[type], `No ${labelMap[type]} yet`);
    await hydrateEditRequest(type);
  } catch (error) {
    console.warn(error);
    renderContentCards(target, type, demoMap[type], `No ${labelMap[type]} yet`);
    showToast('ใช้ข้อมูลตัวอย่างชั่วคราว เพราะอ่าน Firestore ไม่ได้', 'error');
  }
}

export function applyContentPageState(type) {
  const heading = $('contentHeading');
  const subheading = $('contentSubheading');
  if (heading) heading.textContent = labelMap[type];
  if (subheading) subheading.textContent = `All ${labelMap[type]} items`;
  $$('[data-content-label]').forEach((el) => el.textContent = labelMap[type]);
  updateEditorUi(type);
  updateCoverPreview();
}

export function bindContentPage(type) {
  $('contentCoverImageUrl')?.addEventListener('input', () => { currentCoverImagePath = ''; currentCoverImageName = ''; updateCoverPreview(); updateCoverMeta(); });
  $('contentCoverFile')?.addEventListener('change', previewSelectedFile);
  $('uploadCoverBtn')?.addEventListener('click', () => uploadSelectedCover(type));
  $('clearCoverBtn')?.addEventListener('click', clearCoverSelection);

  if ($('saveContentBtn')) {
    $('saveContentBtn').addEventListener('click', async () => {
      if (!canManageContent()) {
        showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
        return;
      }
      const payload = getFormValues();
      if (!payload.title || !payload.summary || !payload.fullDetails) {
        showToast('กรอก title, summary และ full details ก่อนบันทึก', 'error');
        return;
      }
      if (uploadInProgress) {
        showToast('รอให้อัปโหลดรูปเสร็จก่อน', 'error');
        return;
      }
      try {
        if (editingItemId) {
          await updateStructuredCMS(type, editingItemId, payload);
          showToast(`Updated ${labelMap[type].slice(0, -1)}`);
        } else {
          await saveStructuredCMS(type, payload);
          showToast(`Saved ${labelMap[type].slice(0, -1)}`);
        }
        resetEditor(type);
        await loadContentPage(type);
      } catch (error) {
        console.error(error);
        showToast(error.message || `Save ${labelMap[type]} failed`, 'error');
      }
    });
  }

  if ($('cancelContentEditBtn')) {
    $('cancelContentEditBtn').addEventListener('click', () => {
      resetEditor(type);
      showToast('ยกเลิกโหมดแก้ไขแล้ว');
    });
  }

  if ($('contentList')) {
    $('contentList').addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      event.preventDefault();
      const action = button.dataset.action;
      const id = button.dataset.id || '';
      if (action === 'edit') await startEdit(type, id);
      if (action === 'delete') await confirmDelete(type, id);
    });
  }
}
