import { state } from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import { createContentShell, deleteCMSItem, getLocalizedContent, loadCollectionSafe, loadDocumentById, publishCMSItem, saveStructuredCMS, unpublishCMSItem, updateStructuredCMS } from '../services/content-service.js';
import { deleteStoragePaths, uploadCmsCover, uploadCmsGallery } from '../services/storage-service.js';
import { escapeHtml } from '../core/format.js';
import { showToast } from '../ui/toast.js';

const labelMap = {
  news: 'News',
  promotions: 'Promotions',
  benefits: 'Benefits',
};

let editingItemId = '';
let isDraftShell = false;
let currentCoverImagePath = '';
let currentCoverImageName = '';
let currentGalleryImages = [];
let uploadInProgress = false;
let currentItemStatus = 'draft';
let currentPublishedLabel = '';
let currentUnpublishedLabel = '';

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

function detailHref(type, localized) {
  return `./${type}-detail.html?id=${encodeURIComponent(item.id || '')}`;
}

function syncCmsEditorVisibility() {
  const panel = document.querySelector('.cms-editor-panel');
  const note = $('cmsReadOnlyNote');
  const canEdit = canManageContent();
  if (panel) panel.classList.toggle('hidden', !canEdit);
  if (note) {
    note.textContent = canEdit
      ? 'คุณกำลังอยู่ในโหมดแก้ไขข้อมูลจริงผ่าน Firebase'
      : 'แขกจะเห็นเฉพาะรายการและหน้ารายละเอียดที่เผยแพร่แล้ว';
  }
}

function getStatusLabel(status = 'draft') {
  if (status === 'published') return 'Published';
  if (status === 'unpublished') return 'Unpublished';
  return 'Draft';
}

function getStatusBadgeClass(status = 'draft') {
  if (status === 'published') return 'gold';
  if (status === 'unpublished') return 'subtle';
  return '';
}

function applyEditorStatus(status = 'draft', item = {}) {
  currentItemStatus = status || 'draft';
  currentPublishedLabel = item?.publishedLabel || '';
  currentUnpublishedLabel = item?.unpublishedLabel || '';
}

function applyLoadedItemToEditor(type, item = {}) {
  editingItemId = item.id || '';
  isDraftShell = false;
  applyEditorStatus(item.status || 'draft', item);
  setFormValues(item);
  updateEditorUi(type);
}

function normalizeGalleryImages(value = []) {
  const list = Array.isArray(value) ? value : [];
  return list
    .map((item, index) => ({
      id: String(item?.id || '').trim() || `img_${Date.now()}_${index}`,
      url: String(item?.url || '').trim(),
      path: String(item?.path || '').trim(),
      name: String(item?.name || item?.fileName || '').trim(),
      fileName: String(item?.fileName || item?.name || '').trim(),
      sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index,
      isCover: Boolean(item?.isCover),
    }))
    .filter((item) => item.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

function resetSortOrders(items = []) {
  return items.map((item, index) => ({ ...item, sortOrder: index }));
}

function getSelectedCoverFile() {
  return $('contentCoverFile')?.files?.[0] || null;
}

function getSelectedGalleryFiles() {
  return Array.from($('contentGalleryFiles')?.files || []);
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
    galleryImages: resetSortOrders(currentGalleryImages),
  };
}

function setFormValues(item = {}) {
  currentCoverImagePath = item.coverImagePath || '';
  currentCoverImageName = item.coverImageName || '';
  currentGalleryImages = normalizeGalleryImages(localized.galleryImages || []);
  if ($('contentTitle')) $('contentTitle').value = localized.title || '';
  if ($('contentSummary')) $('contentSummary').value = localized.summary || localized.body || '';
  if ($('contentFullDetails')) {
    $('contentFullDetails').value = item.fullDetails || (Array.isArray(item.details) ? item.details.join('\n') : localized.body || '');
  }
  if ($('contentTerms')) {
    $('contentTerms').value = Array.isArray(item.terms) ? item.terms.join('\n') : (item.terms || '');
  }
  if ($('contentCtaLabel')) $('contentCtaLabel').value = item.ctaLabel || '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = localized.coverImageUrl || '';
  if ($('contentCoverFile')) $('contentCoverFile').value = '';
  if ($('contentGalleryFiles')) $('contentGalleryFiles').value = '';
  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();
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
  ['uploadCoverBtn', 'uploadGalleryBtn', 'saveContentBtn', 'cancelContentEditBtn'].forEach((id) => {
    if ($(id)) $(id).disabled = isBusy;
  });
}

function updateCoverMeta() {
  const meta = $('contentCoverMeta');
  if (!meta) return;
  const coverUrl = $('contentCoverImageUrl')?.value.trim() || '';
  if (currentCoverImageName) {
    meta.textContent = `ไฟล์ปกหลัก: ${currentCoverImageName}`;
    meta.classList.remove('hidden');
    return;
  }
  if (coverUrl) {
    meta.textContent = 'รูปปกพร้อมใช้งานและจะถูกบันทึกไปพร้อมรายการ';
    meta.classList.remove('hidden');
    return;
  }
  meta.textContent = '';
  meta.classList.add('hidden');
}

function renderGalleryPreview() {
  const list = $('contentGalleryPreviewList');
  const count = $('contentGalleryCount')?.querySelector('strong') || $('contentGalleryCount');
  if (!list) return;
  const gallery = resetSortOrders(currentGalleryImages);
  if (count) count.textContent = gallery.length ? `${gallery.length} images` : '0 images';
  if (!gallery.length) {
    list.innerHTML = '<div class="gallery-empty">ยังไม่มีรูป gallery สำหรับรายการนี้</div>';
    return;
  }
  list.innerHTML = gallery.map((item, index) => `
    <div class="gallery-preview-card ${item.isCover ? 'is-cover' : ''}">
      <img src="${escapeHtml(item.url)}" alt="Gallery ${index + 1}" loading="lazy" />
      <div class="gallery-preview-meta">
        <strong>${item.isCover ? 'Cover image' : `Image ${index + 1}`}</strong>
        <small>${escapeHtml(item.name || item.fileName || 'uploaded-image')}</small>
      </div>
      <div class="gallery-preview-actions">
        <button class="ghost-btn gallery-preview-btn" type="button" data-gallery-action="make-cover" data-gallery-index="${index}">Use as cover</button>
        <button class="danger-btn gallery-preview-btn" type="button" data-gallery-action="remove" data-gallery-index="${index}">Remove</button>
      </div>
    </div>
  `).join('');
}

function previewSelectedCoverFile() {
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
    meta.textContent = `เลือกรูปปกแล้ว: ${file.name} — กด Upload cover`;
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

function previewSelectedGalleryFiles() {
  const files = getSelectedGalleryFiles();
  const status = $('contentGalleryUploadStatus');
  if (!files.length) {
    if (status) {
      status.textContent = '';
      status.classList.add('hidden');
    }
    renderGalleryPreview();
    return;
  }
  if (status) {
    status.textContent = `เลือกรูป gallery แล้ว ${files.length} รูป — กด Upload gallery images`;
    status.classList.remove('hidden');
  }
}

async function ensureWorkingDocId(type) {
  if (editingItemId) return editingItemId;

  const draftPayload = getFormValues();
  editingItemId = await createContentShell(type, draftPayload);

  isDraftShell = true;
  applyEditorStatus('draft');
  updateEditorUi(type);

  if ($('contentUploadStatus')) {
    $('contentUploadStatus').textContent = 'สร้าง draft document ใน Firestore แล้ว พร้อมอัปโหลดรูป';
    $('contentUploadStatus').classList.remove('hidden');
  }

  return editingItemId;
}

async function uploadSelectedCover(type) {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
    return;
  }
  const file = getSelectedCoverFile();
  if (!file) {
    showToast('เลือกรูปปกก่อนอัปโหลด', 'error');
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
      $('contentUploadStatus').textContent = 'กำลังอัปโหลดรูปปกขึ้น Firebase Storage...';
      $('contentUploadStatus').classList.remove('hidden');
    }

    const workingDocId = await ensureWorkingDocId(type);
    const result = await uploadCmsCover(file, type, workingDocId);

    currentCoverImagePath = result.path || '';
    currentCoverImageName = result.name || file.name || '';
    if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = result.url || '';

    currentGalleryImages = normalizeGalleryImages([
      { ...result, isCover: true, sortOrder: 0 },
      ...currentGalleryImages.filter((img) => img.path !== result.path),
    ]).map((img) => ({
      ...img,
      isCover: img.path === result.path,
    }));

    updateCoverPreview();
    updateCoverMeta();
    renderGalleryPreview();

    if ($('contentUploadStatus')) $('contentUploadStatus').textContent = 'อัปโหลดรูปปกสำเร็จแล้ว';
    showToast('อัปโหลดรูปปกสำเร็จ');
  } catch (error) {
    console.error(error);
    if ($('contentUploadStatus')) $('contentUploadStatus').textContent = error.message || 'อัปโหลดรูปปกไม่สำเร็จ';
    showToast(error.message || 'อัปโหลดรูปปกไม่สำเร็จ', 'error');
  } finally {
    setUploadBusy(false);
  }
}

async function uploadSelectedGallery(type) {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
    return;
  }
  const files = getSelectedGalleryFiles();
  if (!files.length) {
    showToast('เลือกรูป gallery ก่อนอัปโหลด', 'error');
    return;
  }
  if (files.some((file) => !file.type.startsWith('image/'))) {
    showToast('อัปโหลด gallery ได้เฉพาะไฟล์รูป', 'error');
    return;
  }
  if (files.some((file) => file.size > 5 * 1024 * 1024)) {
    showToast('มีไฟล์อย่างน้อย 1 รูปใหญ่เกิน 5MB', 'error');
    return;
  }

  try {
    setUploadBusy(true);
    if ($('contentGalleryUploadStatus')) {
      $('contentGalleryUploadStatus').textContent = `กำลังอัปโหลด ${files.length} รูปขึ้น Firebase Storage...`;
      $('contentGalleryUploadStatus').classList.remove('hidden');
    }

    const workingDocId = await ensureWorkingDocId(type);
    const uploaded = await uploadCmsGallery(files, type, workingDocId);

    currentGalleryImages = normalizeGalleryImages([...currentGalleryImages, ...uploaded]);

    if (!$('contentCoverImageUrl')?.value.trim() && currentGalleryImages[0]) {
      const firstImage = currentGalleryImages[0];
      currentCoverImagePath = firstImage.path || '';
      currentCoverImageName = firstImage.name || firstImage.fileName || '';
      if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = firstImage.url || '';
      currentGalleryImages = currentGalleryImages.map((img, index) => ({
        ...img,
        isCover: index === 0,
      }));
    }

    if ($('contentGalleryFiles')) $('contentGalleryFiles').value = '';
    renderGalleryPreview();
    updateCoverPreview();
    updateCoverMeta();

    if ($('contentGalleryUploadStatus')) $('contentGalleryUploadStatus').textContent = `อัปโหลด gallery สำเร็จ ${uploaded.length} รูป`;
    showToast(`อัปโหลด gallery สำเร็จ ${uploaded.length} รูป`);
  } catch (error) {
    console.error(error);
    if ($('contentGalleryUploadStatus')) $('contentGalleryUploadStatus').textContent = error.message || 'อัปโหลด gallery ไม่สำเร็จ';
    showToast(error.message || 'อัปโหลด gallery ไม่สำเร็จ', 'error');
  } finally {
    setUploadBusy(false);
  }
}

async function clearCoverSelection() {
  const pathsToDelete = [];
  if (currentCoverImagePath && isDraftShell) pathsToDelete.push(currentCoverImagePath);

  currentCoverImagePath = '';
  currentCoverImageName = '';
  if ($('contentCoverFile')) $('contentCoverFile').value = '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = '';
  if ($('contentUploadStatus')) {
    $('contentUploadStatus').textContent = '';
    $('contentUploadStatus').classList.add('hidden');
  }

  currentGalleryImages = currentGalleryImages.map((img) => ({ ...img, isCover: false }));
  if (currentGalleryImages[0]) {
    currentGalleryImages[0].isCover = true;
    currentCoverImagePath = currentGalleryImages[0].path || '';
    currentCoverImageName = currentGalleryImages[0].name || currentGalleryImages[0].fileName || '';
    if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = currentGalleryImages[0].url || '';
  }

  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();

  if (pathsToDelete.length) {
    try {
      await deleteStoragePaths(pathsToDelete);
    } catch (error) {
      console.warn(error);
    }
  }
}

async function clearGallerySelection() {
  const pathsToDelete = isDraftShell
    ? currentGalleryImages.map((img) => img.path)
    : [];

  currentGalleryImages = [];
  if ($('contentGalleryFiles')) $('contentGalleryFiles').value = '';
  if ($('contentGalleryUploadStatus')) {
    $('contentGalleryUploadStatus').textContent = '';
    $('contentGalleryUploadStatus').classList.add('hidden');
  }
  currentCoverImagePath = '';
  currentCoverImageName = '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = '';

  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();

  if (pathsToDelete.length) {
    try {
      await deleteStoragePaths(pathsToDelete);
    } catch (error) {
      console.warn(error);
    }
  }
}

function makeGalleryImageCover(index) {
  const item = currentGalleryImages[index];
  if (!item) return;
  currentCoverImagePath = item.path || '';
  currentCoverImageName = item.name || item.fileName || '';
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = item.url || '';
  currentGalleryImages = currentGalleryImages.map((img, itemIndex) => ({
    ...img,
    isCover: itemIndex === index,
  }));
  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();
  showToast('ตั้งรูปนี้เป็น cover แล้ว');
}

async function removeGalleryImage(index) {
  const removed = currentGalleryImages[index];
  if (!removed) return;

  currentGalleryImages = currentGalleryImages.filter((_, itemIndex) => itemIndex !== index);
  currentGalleryImages = resetSortOrders(currentGalleryImages);

  if (removed.path && isDraftShell) {
    try {
      await deleteStoragePaths([removed.path]);
    } catch (error) {
      console.warn(error);
    }
  }

  if (removed.isCover || $('contentCoverImageUrl')?.value.trim() === removed.url) {
    if (currentGalleryImages[0]) {
      makeGalleryImageCover(0);
      return;
    }
    currentCoverImagePath = '';
    currentCoverImageName = '';
    if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = '';
  }

  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();
  showToast('ลบรูปออกจากรายการในฟอร์มแล้ว');
}

function updateEditorUi(type) {
  const saveBtn = $('saveContentBtn');
  const publishBtn = $('publishContentBtn');
  const unpublishBtn = $('unpublishContentBtn');
  const deleteBtn = $('deleteContentBtn');
  const cancelBtn = $('cancelContentEditBtn');
  const note = $('editStateNote');
  const statusNote = $('contentStatusNote');
  const titleLabel = labelMap[type].slice(0, -1) || labelMap[type];
  const hasDoc = Boolean(editingItemId);
  const isPublished = currentItemStatus === 'published';

  if (saveBtn) {
    saveBtn.textContent = isPublished ? `Save ${titleLabel} Changes` : `Save ${titleLabel} Draft`;
  }
  if (publishBtn) {
    publishBtn.disabled = uploadInProgress || isPublished;
    publishBtn.classList.toggle('hidden', false);
    publishBtn.textContent = isPublished ? `Published ${titleLabel}` : `Publish ${titleLabel}`;
  }
  if (unpublishBtn) {
    unpublishBtn.classList.toggle('hidden', !hasDoc || !isPublished);
    unpublishBtn.disabled = uploadInProgress || !hasDoc || !isPublished;
  }
  if (deleteBtn) {
    deleteBtn.classList.toggle('hidden', !hasDoc);
    deleteBtn.disabled = uploadInProgress || !hasDoc;
  }
  if (cancelBtn) cancelBtn.classList.toggle('hidden', !hasDoc);
  if (note) {
    note.classList.toggle('hidden', !hasDoc);
    note.textContent = hasDoc
      ? (isDraftShell ? `กำลังสร้าง ${titleLabel} ใหม่ (draft media ready)` : `กำลังแก้ไข ${titleLabel} item`)
      : '';
  }
  if (statusNote) {
    const statusLabel = getStatusLabel(currentItemStatus);
    const detailBits = [
      currentItemStatus === 'published' && currentPublishedLabel && currentPublishedLabel !== '-' ? `เผยแพร่ ${currentPublishedLabel}` : '',
      currentItemStatus === 'unpublished' && currentUnpublishedLabel && currentUnpublishedLabel !== '-' ? `ยกเลิกเผยแพร่ ${currentUnpublishedLabel}` : '',
      currentItemStatus === 'draft' ? 'ยังไม่แสดงบนหน้าสาธารณะ' : '',
    ].filter(Boolean);
    statusNote.classList.toggle('hidden', !hasDoc);
    statusNote.textContent = hasDoc ? `Status: ${statusLabel}${detailBits.length ? ` • ${detailBits.join(' • ')}` : ''}` : '';
  }
  updateCoverMeta();
}

async function resetEditor(type, options = {}) {
  const shouldCleanupDraft = Boolean(options.cleanupDraft && isDraftShell && editingItemId);
  const draftId = shouldCleanupDraft ? editingItemId : '';

  editingItemId = '';
  isDraftShell = false;
  applyEditorStatus('draft');
  currentCoverImagePath = '';
  currentCoverImageName = '';
  currentGalleryImages = [];
  setFormValues({});
  ['contentUploadStatus', 'contentGalleryUploadStatus'].forEach((id) => {
    if ($(id)) {
      $(id).textContent = '';
      $(id).classList.add('hidden');
    }
  });
  updateEditorUi(type);

  if (draftId) {
    try {
      await deleteCMSItem(type, draftId);
    } catch (error) {
      console.warn(error);
    }
  }
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
    applyLoadedItemToEditor(type, item);
    $('contentTitle')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('โหลดข้อมูลเข้าฟอร์มแก้ไขแล้ว');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'เปิดโหมดแก้ไขไม่สำเร็จ', 'error');
  }
}

async function persistEditor(type) {
  const payload = getFormValues();
  if (!payload.title || !payload.summary || !payload.fullDetails) {
    showToast('กรอก title, summary และ full details ก่อนบันทึก', 'error');
    return null;
  }
  if (uploadInProgress) {
    showToast('รอให้อัปโหลดรูปเสร็จก่อน', 'error');
    return null;
  }

  const docId = editingItemId || await createContentShell(type, payload);

  if (editingItemId && !isDraftShell) {
    await updateStructuredCMS(type, docId, payload);
  } else {
    await saveStructuredCMS(type, payload, { docId });
  }

  const saved = await loadDocumentById(type, docId);
  if (saved) applyLoadedItemToEditor(type, saved);
  else {
    editingItemId = docId;
    isDraftShell = false;
    applyEditorStatus('draft');
    updateEditorUi(type);
  }
  return saved || { id: docId, status: 'draft' };
}

async function handlePublish(type) {
  const saved = await persistEditor(type);
  if (!saved?.id) return;
  await publishCMSItem(type, saved.id);
  const published = await loadDocumentById(type, saved.id);
  if (published) applyLoadedItemToEditor(type, published);
  await loadContentPage(type);
  showToast(`${labelMap[type].slice(0, -1)} published`);
}

async function handleUnpublish(type) {
  if (!editingItemId) {
    showToast('ยังไม่มีรายการให้ยกเลิกเผยแพร่', 'error');
    return;
  }
  await unpublishCMSItem(type, editingItemId);
  const item = await loadDocumentById(type, editingItemId);
  if (item) applyLoadedItemToEditor(type, item);
  await loadContentPage(type);
  showToast(`${labelMap[type].slice(0, -1)} unpublished`);
}

async function confirmDelete(type, id) {
  if (!canManageContent()) {
    showToast('เฉพาะ admin/staff ที่ login แล้วเท่านั้น', 'error');
    return;
  }
  if (!id) {
    showToast('ไม่พบ id ของรายการ', 'error');
    return;
  }
  const ok = window.confirm(`ยืนยันลบ ${labelMap[type].slice(0, -1)} นี้?`);
  if (!ok) return;
  try {
    await deleteCMSItem(type, id);
    if (editingItemId === id) await resetEditor(type);
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
    const localized = getLocalizedContent(item);
    const liveItem = Boolean(localized.id && localized.createdLabel);
    const galleryCount = Array.isArray(localized.galleryImages) ? localized.galleryImages.length : 0;
    const statusLabel = getStatusLabel(localized.status || 'draft');
    const statusClass = getStatusBadgeClass(localized.status || 'draft');
    const adminButtons = manage ? `
      <button class="ghost-btn" data-action="edit" data-id="${escapeHtml(localized.id || '')}" ${liveItem ? '' : 'disabled'}>${liveItem ? 'Edit' : 'Demo only'}</button>
      ${localized.status === 'published'
        ? `<button class="ghost-btn" data-action="unpublish" data-id="${escapeHtml(localized.id || '')}" ${liveItem ? '' : 'disabled'}>Unpublish</button>`
        : `<button class="secondary-btn" data-action="publish" data-id="${escapeHtml(localized.id || '')}" ${liveItem ? '' : 'disabled'}>Publish</button>`}
      <button class="danger-btn" data-action="delete" data-id="${escapeHtml(localized.id || '')}" ${liveItem ? '' : 'disabled'}>${liveItem ? 'Delete' : 'Demo only'}</button>
    ` : '';
    const cover = localized.coverImageUrl
      ? `<img class="entry-cover" src="${escapeHtml(localized.coverImageUrl)}" alt="${escapeHtml(localized.title || labelMap[type])}" loading="lazy">`
      : `<div class="entry-cover entry-cover-fallback"><span>${escapeHtml(labelMap[type].slice(0, -1) || labelMap[type])}</span></div>`;
    return `
    <article class="card-item content-entry-card">
      ${cover}
      <div class="content-entry-top">
        <div>
          <div class="eyebrow gold">${escapeHtml(labelMap[type].slice(0, -1) || labelMap[type])}</div>
          <h4>${escapeHtml(localized.title || localized.outlet || '-')}</h4>
        </div>
        <div class="content-entry-side">
          <span class="mini-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
          ${galleryCount ? `<span class="badge-inline photo-badge"><span>Photos</span><strong>${galleryCount}</strong></span>` : ''}
          ${localized.status === 'published' && localized.publishedLabel && localized.publishedLabel !== '-'
            ? `<small>Published ${escapeHtml(localized.publishedLabel)}</small>`
            : (localized.updatedLabel && localized.updatedLabel !== '-' ? `<small>Updated ${escapeHtml(localized.updatedLabel)}</small>` : '<small>Firebase content</small>')}
        </div>
      </div>
      <p>${escapeHtml(localized.summary || localized.body || localized.description || '')}</p>
      <div class="row gap wrap mt-md">
        <a class="secondary-btn" href="${detailHref(type, localized)}">Open detail</a>
        ${adminButtons}
      </div>
    </article>
  `;
  }).join('');
}

async function hydrateEditRequest(type) {
  const id = getEditRequestId();
  if (!id || !canManageContent()) return;
  await startEdit(type, id);
  clearEditRequestId();
}

export async function loadContentPage(type) {
  syncCmsEditorVisibility();
  const target = $('contentList');
  try {
    const rows = await loadCollectionSafe(type, { limit: canManageContent() ? 40 : 50, publishedOnly: !canManageContent() });
    renderContentCards(target, type, rows, `No ${labelMap[type]} yet`);
    await hydrateEditRequest(type);
  } catch (error) {
    console.warn(error);
    renderContentCards(target, type, [], `No ${labelMap[type]} yet`);
    showToast('อ่านข้อมูลจาก Firestore ไม่สำเร็จ', 'error');
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
  renderGalleryPreview();
  syncCmsEditorVisibility();
}

export function bindContentPage(type) {
  $('contentCoverImageUrl')?.addEventListener('input', () => {
    currentCoverImagePath = '';
    currentCoverImageName = '';
    currentGalleryImages = currentGalleryImages.map((img) => ({ ...img, isCover: false }));
    updateCoverPreview();
    updateCoverMeta();
    renderGalleryPreview();
  });
  $('contentCoverFile')?.addEventListener('change', previewSelectedCoverFile);
  $('contentGalleryFiles')?.addEventListener('change', previewSelectedGalleryFiles);
  $('uploadCoverBtn')?.addEventListener('click', () => uploadSelectedCover(type));
  $('uploadGalleryBtn')?.addEventListener('click', () => uploadSelectedGallery(type));
  $('clearCoverBtn')?.addEventListener('click', () => clearCoverSelection());
  $('clearGalleryBtn')?.addEventListener('click', () => clearGallerySelection());
  $('publishContentBtn')?.addEventListener('click', async () => {
    if (!canManageContent()) {
      showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
      return;
    }
    try {
      await handlePublish(type);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Publish failed', 'error');
    }
  });
  $('unpublishContentBtn')?.addEventListener('click', async () => {
    if (!canManageContent()) {
      showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
      return;
    }
    try {
      await handleUnpublish(type);
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Unpublish failed', 'error');
    }
  });
  $('deleteContentBtn')?.addEventListener('click', async () => {
    if (!editingItemId) {
      showToast('ยังไม่มีรายการให้ลบ', 'error');
      return;
    }
    await confirmDelete(type, editingItemId);
  });

  $('contentGalleryPreviewList')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-gallery-action]');
    if (!button) return;
    const index = Number(button.dataset.galleryIndex || -1);
    if (index < 0) return;
    if (button.dataset.galleryAction === 'make-cover') makeGalleryImageCover(index);
    if (button.dataset.galleryAction === 'remove') await removeGalleryImage(index);
  });

  if ($('saveContentBtn')) {
    $('saveContentBtn').addEventListener('click', async () => {
      if (!canManageContent()) {
        showToast('ต้อง login เป็น admin/staff ก่อน', 'error');
        return;
      }
      try {
        const saved = await persistEditor(type);
        if (!saved?.id) return;
        showToast(`${labelMap[type].slice(0, -1)} saved`);
        await loadContentPage(type);
      } catch (error) {
        console.error(error);
        showToast(error.message || `Save ${labelMap[type]} failed`, 'error');
      }
    });
  }

  if ($('cancelContentEditBtn')) {
    $('cancelContentEditBtn').addEventListener('click', async () => {
      const cleanupDraft = isDraftShell && Boolean(editingItemId);
      await resetEditor(type, { cleanupDraft });
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
      if (action === 'publish') {
        await publishCMSItem(type, id);
        await loadContentPage(type);
        if (editingItemId === id) {
          const refreshed = await loadDocumentById(type, id);
          if (refreshed) applyLoadedItemToEditor(type, refreshed);
        }
        showToast(`${labelMap[type].slice(0, -1)} published`);
      }
      if (action === 'unpublish') {
        await unpublishCMSItem(type, id);
        await loadContentPage(type);
        if (editingItemId === id) {
          const refreshed = await loadDocumentById(type, id);
          if (refreshed) applyLoadedItemToEditor(type, refreshed);
        }
        showToast(`${labelMap[type].slice(0, -1)} unpublished`);
      }
      if (action === 'delete') await confirmDelete(type, id);
    });
  }
}
