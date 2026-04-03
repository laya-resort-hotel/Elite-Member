import { state, setMode } from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import { demoResident, demoTransactions, demoBenefits, demoNews, demoPromotions } from '../data/demo.js';
import { loadAllResidents } from '../services/member-service.js';
import { addSpendTransaction, loadTransactions } from '../services/transaction-service.js';
import {
  createContentShell,
  deleteCMSItem,
  loadCollectionSafe,
  loadDocumentById,
  saveStructuredCMS,
  updateStructuredCMS,
} from '../services/content-service.js';
import { deleteStoragePaths, uploadCmsCover, uploadCmsGallery } from '../services/storage-service.js';
import { renderAdminKpis, renderResidentSearchResults, renderTable, updateStatusLabels } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, formatDate, formatTHB } from '../core/format.js';

const demoContentMap = {
  news: demoNews,
  promotions: demoPromotions,
  benefits: demoBenefits,
};

const labelMap = {
  news: 'News',
  promotions: 'Promotions',
  benefits: 'Benefits',
};

const adminContentState = {
  activeType: 'news',
  cache: {
    news: [],
    promotions: [],
    benefits: [],
  },
  editors: {
    news: blankEditorState(),
    promotions: blankEditorState(),
    benefits: blankEditorState(),
  },
};

let dragImageId = '';

function blankEditorState() {
  return {
    docId: '',
    isExisting: false,
    title: '',
    summary: '',
    fullDetails: '',
    terms: '',
    ctaLabel: '',
    coverImageUrl: '',
    coverImagePath: '',
    coverImageName: '',
    galleryImages: [],
  };
}

function canManageContent() {
  return state.firebaseReady && ['admin', 'manager', 'staff'].includes(state.currentRole || '');
}

function getActiveType() {
  return adminContentState.activeType;
}

function getEditorState(type = getActiveType()) {
  return adminContentState.editors[type];
}

function setEditorState(type, nextState) {
  adminContentState.editors[type] = {
    ...blankEditorState(),
    ...nextState,
    galleryImages: normalizeGalleryImages(nextState?.galleryImages || []),
  };
}

function normalizeGalleryImages(value = []) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item, index) => ({
      id: String(item?.id || `img_${Date.now()}_${index}`),
      url: String(item?.url || ''),
      path: String(item?.path || ''),
      name: String(item?.name || item?.fileName || ''),
      fileName: String(item?.fileName || item?.name || ''),
      sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index,
      isCover: Boolean(item?.isCover),
    }))
    .filter((item) => item.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

function updateEditorHeader() {
  const type = getActiveType();
  const label = labelMap[type];
  const editor = getEditorState(type);
  if ($('editorTypeLabel')) $('editorTypeLabel').textContent = label;
  if ($('adminTabEyebrow')) $('adminTabEyebrow').textContent = label;
  if ($('adminTabTitle')) $('adminTabTitle').textContent = `${label} items`;
  if ($('editorModeLabel')) $('editorModeLabel').textContent = editor.isExisting ? `Editing ${label}` : `Create new ${label}`;
  if ($('editorDocIdLabel')) $('editorDocIdLabel').textContent = editor.docId || 'Not created';
}

function updateReadonlyNote() {
  const note = $('cmsReadOnlyNote');
  if (!note) return;
  if (canManageContent()) {
    note.textContent = 'คุณกำลังแก้ไขข้อมูลจริงผ่าน Firebase Storage + Firestore จากหน้าเดียว';
    return;
  }
  note.textContent = 'โหมดนี้ใช้ดูตัวอย่างข้อมูลได้ แต่การอัปโหลด/บันทึกจะใช้ได้เมื่อ login เป็น admin / manager / staff และเชื่อม Firebase สำเร็จ';
}

function syncEditorStateFromDom(type = getActiveType()) {
  const editor = getEditorState(type);
  editor.title = $('contentTitle')?.value.trim() || '';
  editor.summary = $('contentSummary')?.value.trim() || '';
  editor.fullDetails = $('contentFullDetails')?.value.trim() || '';
  editor.terms = $('contentTerms')?.value.trim() || '';
  editor.ctaLabel = $('contentCtaLabel')?.value.trim() || '';
  editor.coverImageUrl = $('contentCoverImageUrl')?.value.trim() || '';
  setEditorState(type, editor);
}

function hydrateEditorFromState(type = getActiveType()) {
  const editor = getEditorState(type);
  if ($('contentTitle')) $('contentTitle').value = editor.title || '';
  if ($('contentSummary')) $('contentSummary').value = editor.summary || '';
  if ($('contentFullDetails')) $('contentFullDetails').value = editor.fullDetails || '';
  if ($('contentTerms')) $('contentTerms').value = editor.terms || '';
  if ($('contentCtaLabel')) $('contentCtaLabel').value = editor.ctaLabel || '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = editor.coverImageUrl || '';
  if ($('contentCoverFile')) $('contentCoverFile').value = '';
  if ($('contentGalleryFiles')) $('contentGalleryFiles').value = '';
  updateEditorHeader();
  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();
}

function updateCoverPreview() {
  const editor = getEditorState();
  const img = $('contentCoverPreview');
  const empty = $('contentCoverPreviewEmpty');
  if (!img || !empty) return;
  if (editor.coverImageUrl) {
    img.src = editor.coverImageUrl;
    img.classList.remove('hidden');
    empty.classList.add('hidden');
  } else {
    img.removeAttribute('src');
    img.classList.add('hidden');
    empty.classList.remove('hidden');
  }
}

function updateCoverMeta() {
  const editor = getEditorState();
  const meta = $('contentCoverMeta');
  if (!meta) return;
  if (editor.coverImageName) {
    meta.textContent = `ไฟล์ปกหลัก: ${editor.coverImageName}`;
    meta.classList.remove('hidden');
    return;
  }
  if (editor.coverImageUrl) {
    meta.textContent = 'รูปปกพร้อมใช้งานและจะถูกบันทึกไปพร้อมรายการ';
    meta.classList.remove('hidden');
    return;
  }
  meta.textContent = '';
  meta.classList.add('hidden');
}

function updateUploadStatus(id, text = '') {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('hidden', !text);
}

function renderGalleryPreview() {
  const editor = getEditorState();
  const list = $('contentGalleryPreviewList');
  const countEl = $('contentGalleryCount');
  if (countEl) countEl.textContent = `${editor.galleryImages.length} images`;
  if (!list) return;

  if (!editor.galleryImages.length) {
    list.innerHTML = '<div class="gallery-empty">ยังไม่มีรูป gallery สำหรับรายการนี้</div>';
    return;
  }

  list.innerHTML = editor.galleryImages.map((item, index) => {
    const badges = [
      item.isCover ? '<span class="mini-badge gold">Cover</span>' : '',
      index === 0 ? '<span class="mini-badge">First in set</span>' : '',
      '<span class="mini-badge subtle">Drag</span>',
    ].filter(Boolean).join('');

    return `
      <div class="gallery-preview-card" draggable="true" data-gallery-card data-image-id="${escapeHtml(item.id)}">
        <div class="gallery-preview-image-wrap">
          <img src="${escapeHtml(item.url)}" alt="Gallery ${index + 1}" loading="lazy" />
          <div class="gallery-order-chip">#${index + 1}</div>
        </div>
        <div class="gallery-preview-meta">
          <div class="gallery-badge-row">${badges}</div>
          <strong>Image ${index + 1}</strong>
          <small>${escapeHtml(item.name || item.fileName || 'uploaded-image')}</small>
        </div>
        <div class="gallery-preview-actions">
          <button class="ghost-btn gallery-preview-btn" type="button" data-gallery-action="move-first" data-image-id="${escapeHtml(item.id)}">Move first</button>
          <button class="ghost-btn gallery-preview-btn" type="button" data-gallery-action="make-cover" data-image-id="${escapeHtml(item.id)}">Use as cover</button>
          <button class="danger-btn gallery-preview-btn" type="button" data-gallery-action="remove" data-image-id="${escapeHtml(item.id)}">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderContentList() {
  const type = getActiveType();
  const items = adminContentState.cache[type] || [];
  const container = $('adminContentList');
  if (!container) return;
  if ($('adminItemCount')) $('adminItemCount').textContent = String(items.length);

  if (!items.length) {
    container.innerHTML = `<div class="card-item"><p>ยังไม่มี ${escapeHtml(labelMap[type])} ในระบบ</p></div>`;
    return;
  }

  container.innerHTML = items.map((item) => {
    const image = item.coverImageUrl || item.galleryImages?.[0]?.url || '';
    return `
      <article class="content-admin-card ${getEditorState(type).docId === item.id ? 'active' : ''}">
        ${image ? `<img class="content-admin-card-image" src="${escapeHtml(image)}" alt="${escapeHtml(item.title || '')}" loading="lazy">` : '<div class="content-admin-card-image fallback">No image</div>'}
        <div class="content-admin-card-body">
          <div class="content-admin-card-top">
            <strong>${escapeHtml(item.title || '(Untitled)')}</strong>
            <small>${escapeHtml(item.updatedLabel || item.createdLabel || '')}</small>
          </div>
          <p>${escapeHtml(item.summary || item.body || '')}</p>
          <div class="content-admin-card-actions">
            <button class="ghost-btn" type="button" data-content-action="edit" data-item-id="${escapeHtml(item.id)}">Edit</button>
            <a class="ghost-btn" href="./${type}-detail.html?id=${encodeURIComponent(item.id)}">Open detail</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

async function loadAdminContent(type, { force = false } = {}) {
  if (!force && adminContentState.cache[type]?.length) {
    renderContentList();
    return adminContentState.cache[type];
  }

  if (canManageContent()) {
    adminContentState.cache[type] = await loadCollectionSafe(type, { limit: 40 });
  } else {
    adminContentState.cache[type] = demoContentMap[type].map((item) => ({
      ...item,
      createdLabel: 'Demo item',
      updatedLabel: 'Demo item',
    }));
  }

  renderContentList();
  return adminContentState.cache[type];
}

async function loadEditorItem(type, itemId) {
  const item = canManageContent()
    ? await loadDocumentById(type, itemId)
    : (demoContentMap[type].find((row) => row.id === itemId) || null);

  if (!item) {
    showToast('ไม่พบรายการที่ต้องการเปิด', 'error');
    return;
  }

  setEditorState(type, {
    docId: item.id,
    isExisting: canManageContent(),
    title: item.title || '',
    summary: item.summary || item.body || '',
    fullDetails: item.fullDetails || (Array.isArray(item.details) ? item.details.join('\n') : ''),
    terms: Array.isArray(item.terms) ? item.terms.join('\n') : (item.terms || ''),
    ctaLabel: item.ctaLabel || '',
    coverImageUrl: item.coverImageUrl || '',
    coverImagePath: item.coverImagePath || '',
    coverImageName: item.coverImageName || '',
    galleryImages: normalizeGalleryImages(item.galleryImages || []),
  });

  hydrateEditorFromState(type);
  renderContentList();
}

function resetEditor(type = getActiveType()) {
  setEditorState(type, blankEditorState());
  hydrateEditorFromState(type);
  updateUploadStatus('contentUploadStatus', '');
  updateUploadStatus('contentGalleryUploadStatus', '');
}

async function ensureEditingDocId(type = getActiveType()) {
  const editor = getEditorState(type);
  if (editor.docId) return editor.docId;
  editor.docId = createContentShell(type);
  setEditorState(type, editor);
  updateEditorHeader();
  return editor.docId;
}

function setTab(type) {
  syncEditorStateFromDom(getActiveType());
  adminContentState.activeType = type;
  $$('.admin-tab-btn').forEach((btn) => {
    const active = btn.dataset.adminTab === type;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  if ($('adminContentNote')) $('adminContentNote').textContent = `ตอนนี้กำลังจัดการ ${labelMap[type]} ข้อมูลที่แก้ค้างไว้ของแต่ละแท็บจะถูกจำแยกกัน`; 
  hydrateEditorFromState(type);
  renderContentList();
  updateReadonlyNote();
}

async function handleUploadCover() {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin / manager / staff ก่อน', 'error');
    return;
  }

  const file = $('contentCoverFile')?.files?.[0];
  if (!file) {
    showToast('เลือกรูปปกก่อนอัปโหลด', 'error');
    return;
  }

  try {
    updateUploadStatus('contentUploadStatus', 'กำลังอัปโหลดรูปปกขึ้น Firebase Storage...');
    const type = getActiveType();
    const docId = await ensureEditingDocId(type);
    const uploaded = await uploadCmsCover(file, type, docId);
    const editor = getEditorState(type);

    const filteredGallery = editor.galleryImages.filter((img) => !String(img.path || '').includes(`/${docId}/cover/`));
    const galleryImages = normalizeGalleryImages([
      { ...uploaded, isCover: true, sortOrder: 0 },
      ...filteredGallery.map((img) => ({ ...img, isCover: false })),
    ]);

    setEditorState(type, {
      ...editor,
      docId,
      coverImageUrl: uploaded.url,
      coverImagePath: uploaded.path,
      coverImageName: uploaded.name || uploaded.fileName || file.name,
      galleryImages,
    });

    hydrateEditorFromState(type);
    updateUploadStatus('contentUploadStatus', 'อัปโหลดรูปปกสำเร็จแล้ว');
    showToast('อัปโหลดรูปปกสำเร็จ');
  } catch (error) {
    console.error(error);
    updateUploadStatus('contentUploadStatus', error.message || 'อัปโหลดรูปปกไม่สำเร็จ');
    showToast(error.message || 'อัปโหลดรูปปกไม่สำเร็จ', 'error');
  }
}

async function handleUploadGallery() {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin / manager / staff ก่อน', 'error');
    return;
  }

  const files = Array.from($('contentGalleryFiles')?.files || []);
  if (!files.length) {
    showToast('เลือกรูป gallery ก่อนอัปโหลด', 'error');
    return;
  }

  try {
    updateUploadStatus('contentGalleryUploadStatus', `กำลังอัปโหลด ${files.length} รูปขึ้น Firebase Storage...`);
    const type = getActiveType();
    const docId = await ensureEditingDocId(type);
    const uploaded = await uploadCmsGallery(files, type, docId);
    const editor = getEditorState(type);

    let galleryImages = normalizeGalleryImages([
      ...editor.galleryImages,
      ...uploaded.map((img) => ({ ...img, isCover: false })),
    ]);

    let coverImageUrl = editor.coverImageUrl;
    let coverImagePath = editor.coverImagePath;
    let coverImageName = editor.coverImageName;

    if (!coverImageUrl && galleryImages[0]) {
      galleryImages = galleryImages.map((img, index) => ({ ...img, isCover: index === 0 }));
      coverImageUrl = galleryImages[0].url;
      coverImagePath = galleryImages[0].path;
      coverImageName = galleryImages[0].name || galleryImages[0].fileName;
    }

    setEditorState(type, {
      ...editor,
      docId,
      coverImageUrl,
      coverImagePath,
      coverImageName,
      galleryImages,
    });

    hydrateEditorFromState(type);
    updateUploadStatus('contentGalleryUploadStatus', `อัปโหลด gallery สำเร็จ ${uploaded.length} รูป`);
    showToast(`อัปโหลด gallery สำเร็จ ${uploaded.length} รูป`);
  } catch (error) {
    console.error(error);
    updateUploadStatus('contentGalleryUploadStatus', error.message || 'อัปโหลด gallery ไม่สำเร็จ');
    showToast(error.message || 'อัปโหลด gallery ไม่สำเร็จ', 'error');
  }
}

function handleSetCover(imageId) {
  const type = getActiveType();
  const editor = getEditorState(type);
  const target = editor.galleryImages.find((img) => img.id === imageId);
  if (!target) return;

  const galleryImages = editor.galleryImages.map((img) => ({
    ...img,
    isCover: img.id === imageId,
  }));

  setEditorState(type, {
    ...editor,
    coverImageUrl: target.url,
    coverImagePath: target.path,
    coverImageName: target.name || target.fileName,
    galleryImages,
  });

  hydrateEditorFromState(type);
}

async function handleRemoveGalleryImage(imageId) {
  const type = getActiveType();
  const editor = getEditorState(type);
  const target = editor.galleryImages.find((img) => img.id === imageId);
  if (!target) return;

  if (canManageContent() && target.path) {
    try {
      await deleteStoragePaths([target.path]);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'ลบรูปจาก Storage ไม่สำเร็จ', 'error');
      return;
    }
  }

  let galleryImages = editor.galleryImages.filter((img) => img.id !== imageId).map((img, index) => ({
    ...img,
    sortOrder: index,
  }));

  let coverImageUrl = editor.coverImageUrl;
  let coverImagePath = editor.coverImagePath;
  let coverImageName = editor.coverImageName;

  if (target.isCover || editor.coverImagePath === target.path) {
    if (galleryImages[0]) {
      galleryImages = galleryImages.map((img, index) => ({ ...img, isCover: index === 0 }));
      coverImageUrl = galleryImages[0].url;
      coverImagePath = galleryImages[0].path;
      coverImageName = galleryImages[0].name || galleryImages[0].fileName;
    } else {
      coverImageUrl = '';
      coverImagePath = '';
      coverImageName = '';
    }
  }

  setEditorState(type, {
    ...editor,
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages,
  });
  hydrateEditorFromState(type);
  showToast('ลบรูปออกจากรายการแล้ว');
}

function handleMoveFirst(imageId) {
  const type = getActiveType();
  const editor = getEditorState(type);
  const target = editor.galleryImages.find((img) => img.id === imageId);
  if (!target) return;

  const galleryImages = [
    target,
    ...editor.galleryImages.filter((img) => img.id !== imageId),
  ].map((img, index) => ({ ...img, sortOrder: index }));

  setEditorState(type, { ...editor, galleryImages });
  hydrateEditorFromState(type);
}

function clearCoverSelection() {
  const type = getActiveType();
  const editor = getEditorState(type);
  const currentCoverPath = editor.coverImagePath;

  let galleryImages = editor.galleryImages.map((img) => ({ ...img, isCover: false }));
  let coverImageUrl = '';
  let coverImagePath = '';
  let coverImageName = '';

  if (galleryImages.length) {
    const fallback = galleryImages.find((img) => img.path !== currentCoverPath) || galleryImages[0];
    if (fallback) {
      galleryImages = galleryImages.map((img) => ({ ...img, isCover: img.id === fallback.id }));
      coverImageUrl = fallback.url;
      coverImagePath = fallback.path;
      coverImageName = fallback.name || fallback.fileName;
    }
  }

  setEditorState(type, {
    ...editor,
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages,
  });
  hydrateEditorFromState(type);
}

async function saveCurrentEditor() {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin / manager / staff ก่อน', 'error');
    return;
  }

  const type = getActiveType();
  syncEditorStateFromDom(type);
  const editor = getEditorState(type);

  if (!editor.title) {
    showToast('กรอก title ก่อนบันทึก', 'error');
    return;
  }

  try {
    const docId = await ensureEditingDocId(type);
    const payload = {
      title: editor.title,
      summary: editor.summary,
      fullDetails: editor.fullDetails,
      terms: editor.terms,
      ctaLabel: editor.ctaLabel,
      coverImageUrl: editor.coverImageUrl,
      coverImagePath: editor.coverImagePath,
      coverImageName: editor.coverImageName,
      galleryImages: editor.galleryImages,
    };

    if (editor.isExisting) {
      await updateStructuredCMS(type, docId, payload);
    } else {
      await saveStructuredCMS(type, payload, { docId });
    }

    setEditorState(type, { ...editor, docId, isExisting: true });
    hydrateEditorFromState(type);
    await loadAdminContent(type, { force: true });
    showToast(`${labelMap[type]} saved`);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'บันทึกไม่สำเร็จ', 'error');
  }
}

async function deleteCurrentEditor() {
  const type = getActiveType();
  const editor = getEditorState(type);

  if (!editor.docId && !editor.galleryImages.length && !editor.coverImagePath) {
    resetEditor(type);
    return;
  }

  const ok = window.confirm(`Delete this ${labelMap[type]} item?`);
  if (!ok) return;

  try {
    if (canManageContent()) {
      if (editor.isExisting) {
        await deleteCMSItem(type, editor.docId);
      } else {
        await deleteStoragePaths([
          editor.coverImagePath,
          ...editor.galleryImages.map((img) => img.path),
        ]);
      }
    }

    resetEditor(type);
    await loadAdminContent(type, { force: true });
    showToast(`${labelMap[type]} deleted`);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'ลบรายการไม่สำเร็จ', 'error');
  }
}

function handleListClick(event) {
  const button = event.target.closest('[data-content-action="edit"]');
  if (!button) return;
  const itemId = button.dataset.itemId;
  if (!itemId) return;
  loadEditorItem(getActiveType(), itemId);
}

function handleGalleryAction(event) {
  const button = event.target.closest('[data-gallery-action]');
  if (!button) return;
  const action = button.dataset.galleryAction;
  const imageId = button.dataset.imageId;
  if (!imageId) return;

  if (action === 'make-cover') handleSetCover(imageId);
  if (action === 'remove') handleRemoveGalleryImage(imageId);
  if (action === 'move-first') handleMoveFirst(imageId);
}

function handleGalleryDragStart(event) {
  const card = event.target.closest('[data-gallery-card]');
  if (!card) return;
  dragImageId = card.dataset.imageId || '';
}

function handleGalleryDragOver(event) {
  const card = event.target.closest('[data-gallery-card]');
  if (!card) return;
  event.preventDefault();
}

function handleGalleryDrop(event) {
  const card = event.target.closest('[data-gallery-card]');
  if (!card || !dragImageId) return;
  event.preventDefault();
  const dropImageId = card.dataset.imageId || '';
  if (!dropImageId || dropImageId === dragImageId) return;

  const type = getActiveType();
  const editor = getEditorState(type);
  const dragged = editor.galleryImages.find((img) => img.id === dragImageId);
  const others = editor.galleryImages.filter((img) => img.id !== dragImageId);
  const dropIndex = others.findIndex((img) => img.id === dropImageId);
  if (!dragged || dropIndex < 0) return;

  others.splice(dropIndex, 0, dragged);
  const galleryImages = others.map((img, index) => ({ ...img, sortOrder: index }));
  setEditorState(type, { ...editor, galleryImages });
  hydrateEditorFromState(type);
  dragImageId = '';
}

async function loadAdminOverview() {
  try {
    const [residents, transactions] = await Promise.all([
      loadAllResidents(),
      loadTransactions({ limit: 12 }),
    ]);
    const totalPoints = transactions.reduce((sum, row) => sum + Number(row.points || 0), 0);
    const totalSpend = transactions.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    renderAdminKpis({ residents: residents.length, points: totalPoints, spend: totalSpend });
    renderTable($('adminTransactionsTable'), transactions);
    renderResidentSearchResults($('residentSearchResults'), residents.slice(0, 6));
  } catch (error) {
    console.warn(error);
    renderAdminKpis({
      residents: 1,
      points: demoTransactions.reduce((a, b) => a + b.points, 0),
      spend: demoTransactions.reduce((a, b) => a + b.amount, 0),
    });
    renderTable($('adminTransactionsTable'), demoTransactions);
    renderResidentSearchResults($('residentSearchResults'), [demoResident]);
    showToast('แสดงข้อมูล demo admin เพราะยังอ่าน Firestore ไม่ได้', 'error');
  }
}

function openDemoAdmin() {
  renderAdminKpis({
    residents: 1,
    points: demoTransactions.reduce((a, b) => a + b.points, 0),
    spend: demoTransactions.reduce((a, b) => a + b.amount, 0),
  });
  renderResidentSearchResults($('residentSearchResults'), [demoResident]);
  renderTable($('adminTransactionsTable'), demoTransactions);
  setMode('demo-admin');
  updateStatusLabels({ modeState: 'demo-admin' });
}

async function refreshCurrentTab(force = true) {
  await loadAdminContent(getActiveType(), { force });
}

function bindAdminContentTabs() {
  $$('.admin-tab-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.adminTab;
      if (!type || type === getActiveType()) return;
      setTab(type);
      await loadAdminContent(type);
    });
  });

  $('adminContentList')?.addEventListener('click', handleListClick);
  $('contentGalleryPreviewList')?.addEventListener('click', handleGalleryAction);
  $('contentGalleryPreviewList')?.addEventListener('dragstart', handleGalleryDragStart);
  $('contentGalleryPreviewList')?.addEventListener('dragover', handleGalleryDragOver);
  $('contentGalleryPreviewList')?.addEventListener('drop', handleGalleryDrop);

  $('newContentItemBtn')?.addEventListener('click', () => resetEditor(getActiveType()));
  $('refreshContentBtn')?.addEventListener('click', () => refreshCurrentTab(true));
  $('uploadCoverBtn')?.addEventListener('click', handleUploadCover);
  $('uploadGalleryBtn')?.addEventListener('click', handleUploadGallery);
  $('saveContentBtn')?.addEventListener('click', saveCurrentEditor);
  $('cancelContentEditBtn')?.addEventListener('click', () => resetEditor(getActiveType()));
  $('deleteContentBtn')?.addEventListener('click', deleteCurrentEditor);
  $('clearCoverBtn')?.addEventListener('click', clearCoverSelection);

  $('contentCoverFile')?.addEventListener('change', () => {
    const file = $('contentCoverFile')?.files?.[0];
    if (!file) return;
    updateUploadStatus('contentUploadStatus', `เลือกรูปปกแล้ว: ${file.name} — กด Upload Cover`);
  });

  $('contentGalleryFiles')?.addEventListener('change', () => {
    const count = Array.from($('contentGalleryFiles')?.files || []).length;
    updateUploadStatus('contentGalleryUploadStatus', count ? `เลือกรูป gallery แล้ว ${count} รูป — กด Upload Gallery Images` : '');
  });
}

function bindSpendForm() {
  if (!$('addSpendBtn')) return;
  $('addSpendBtn').addEventListener('click', async () => {
    if (!state.firebaseReady) {
      showToast('Firebase not ready', 'error');
      return;
    }
    const payload = {
      memberCode: $('spendMemberCode')?.value.trim(),
      memberName: $('spendMemberName')?.value.trim(),
      outlet: $('spendOutlet')?.value.trim(),
      amount: Number($('spendAmount')?.value || 0),
      rate: Number($('pointRate')?.value || 1),
    };
    if (!payload.memberCode || !payload.memberName || !payload.outlet || !payload.amount) {
      showToast('กรอกข้อมูลให้ครบก่อน', 'error');
      return;
    }
    try {
      await addSpendTransaction(payload);
      if ($('spendAmount')) $('spendAmount').value = '';
      showToast('Transaction saved');
      await loadAdminOverview();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Save transaction failed', 'error');
    }
  });
}

export async function loadAdminDashboardPage() {
  await loadAdminOverview();
  updateReadonlyNote();
  setTab(getActiveType());
  await loadAdminContent(getActiveType(), { force: true });
}

export function bindAdminPage() {
  bindSpendForm();
  bindAdminContentTabs();

  if ($('loadAdminDataBtn')) {
    $('loadAdminDataBtn').addEventListener('click', async () => {
      if (state.currentMode.includes('live')) {
        await loadAdminOverview();
        await refreshCurrentTab(true);
        return;
      }
      openDemoAdmin();
      await refreshCurrentTab(true);
    });
  }
}

export { loadAdminDashboardPage as loadAdminDashboard, openDemoAdmin };
