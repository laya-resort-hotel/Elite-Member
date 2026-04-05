import { state, setMode } from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import { loadAllResidents } from '../services/member-service.js';
import { addSpendTransaction, loadTransactions } from '../services/transaction-service.js';
import {
  createContentShell,
  deleteCMSItem,
  loadCollectionSafe,
  loadDocumentById,
  publishCMSItem,
  saveStructuredCMS,
  unpublishCMSItem,
  updateStructuredCMS,
} from '../services/content-service.js';
import { deleteStoragePaths, uploadCmsCover, uploadCmsGallery } from '../services/storage-service.js';
import {
  createResidentInviteCode,
  disableResidentInviteCode,
  loadResidentInviteCodes,
  normalizeUnitCode,
  parseUnitCodes,
  regenerateResidentInviteCode,
  explainInvitePermissionError,
} from '../services/resident-invite-service.js';
import {
  createMemberShell,
  deleteMemberRecord,
  loadMemberById,
  loadMemberInsights,
  loadMembersSafe,
  saveMemberRecord,
  updateMemberRecord,
} from '../services/member-admin-service.js';
import { renderAdminKpis, renderResidentSearchResults, renderTable, updateStatusLabels } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';
import { escapeHtml, formatTHB, formatNumber } from '../core/format.js';

const labelMap = {
  news: 'News',
  promotions: 'Promotions',
  benefits: 'Benefits',
  rewards: 'Redemption',
  members: 'Members',
};

const contentCollectionMap = {
  news: 'news',
  promotions: 'promotions',
  benefits: 'benefits',
  rewards: 'reward_catalog',
};

const adminContentState = {
  activeType: 'news',
  cache: {
    news: [],
    promotions: [],
    benefits: [],
    rewards: [],
  },
  editors: {
    news: blankContentEditorState(),
    promotions: blankContentEditorState(),
    benefits: blankContentEditorState(),
    rewards: blankContentEditorState(),
  },
};

const adminMembersState = {
  cache: [],
  editor: blankMemberEditorState(),
  insights: blankMemberInsightsState(),
};

const adminInviteState = {
  cache: [],
  filterStatus: 'all',
  searchTerm: '',
  sortBy: 'created_desc',
  pageSize: 20,
  currentPage: 1,
};

let dragImageId = '';

function blankContentEditorState() {
  return {
    docId: '',
    isExisting: false,
    title: '',
    summary: '',
    fullDetails: '',
    terms: '',
    ctaLabel: '',
    pointsCost: 0,
    rewardCategory: '',
    stockTotal: 0,
    rewardCodeExpiryDays: 30,
    rewardIsActive: true,
    coverImageUrl: '',
    coverImagePath: '',
    coverImageName: '',
    galleryImages: [],
    status: 'draft',
    publishedLabel: '',
    unpublishedLabel: '',
  };
}

function getContentStatusLabel(status = 'draft') {
  if (status === 'published') return 'Published';
  if (status === 'unpublished') return 'Unpublished';
  return 'Draft';
}

function getContentStatusBadgeClass(status = 'draft') {
  if (status === 'published') return 'gold';
  if (status === 'unpublished') return 'subtle';
  return '';
}

function mapContentItemToEditor(item = {}) {
  return {
    docId: item.id || item.docId || '',
    isExisting: Boolean(item.id || item.docId),
    title: item.title || '',
    summary: item.summary || item.body || '',
    fullDetails: item.fullDetails || (Array.isArray(item.details) ? item.details.join('\n') : ''),
    terms: Array.isArray(item.terms) ? item.terms.join('\n') : (item.terms || ''),
    ctaLabel: item.ctaLabel || '',
    pointsCost: Number(item.pointsCost || 0),
    rewardCategory: item.rewardCategory || item.category || '',
    stockTotal: Number(item.stockTotal || 0),
    rewardCodeExpiryDays: Math.max(1, Number(item.rewardCodeExpiryDays || item.codeExpiryDays || 30)),
    rewardIsActive: item.rewardIsActive !== false,
    coverImageUrl: item.coverImageUrl || '',
    coverImagePath: item.coverImagePath || '',
    coverImageName: item.coverImageName || '',
    galleryImages: normalizeGalleryImages(item.galleryImages || []),
    status: item.status || 'draft',
    publishedLabel: item.publishedLabel || '',
    unpublishedLabel: item.unpublishedLabel || '',
  };
}

function blankMemberEditorState() {
  return {
    memberId: '',
    publicCardCode: '',
    authUid: '',
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    tier: 'elite_black',
    ownerType: 'resident_owner',
    preferredLanguage: 'en',
    avatarUrl: '',
    ownedUnitsText: '',
    notes: '',
    isExisting: false,
  };
}

function blankMemberInsightsState() {
  return {
    wallet: {
      currentPoints: 0,
      pendingPoints: 0,
      lifetimeEarned: 0,
      lifetimeRedeemed: 0,
      updatedLabel: '',
      tier: 'elite_black',
    },
    recentRedemptions: [],
  };
}

function getMemberInsightsState() {
  return adminMembersState.insights || blankMemberInsightsState();
}

function setMemberInsightsState(nextState = {}) {
  adminMembersState.insights = {
    ...blankMemberInsightsState(),
    ...nextState,
    wallet: {
      ...blankMemberInsightsState().wallet,
      ...(nextState.wallet || {}),
    },
    recentRedemptions: Array.isArray(nextState.recentRedemptions) ? nextState.recentRedemptions : [],
  };
}

function canManageContent() {
  return state.firebaseReady && ['admin', 'manager', 'staff'].includes(state.currentRole || '');
}

function getCollectionNameForType(type = getActiveType()) {
  return contentCollectionMap[type] || type;
}

function getActiveType() {
  return adminContentState.activeType;
}

function isMembersTab(type = getActiveType()) {
  return type === 'members';
}

function getContentEditorState(type = getActiveType()) {
  return adminContentState.editors[type];
}

function setContentEditorState(type, nextState) {
  adminContentState.editors[type] = {
    ...blankContentEditorState(),
    ...nextState,
    galleryImages: normalizeGalleryImages(nextState?.galleryImages || []),
  };
}

function getMemberEditorState() {
  return adminMembersState.editor;
}

function setMemberEditorState(nextState) {
  adminMembersState.editor = {
    ...blankMemberEditorState(),
    ...nextState,
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

function unitsToText(ownedUnits = []) {
  return (Array.isArray(ownedUnits) ? ownedUnits : [])
    .map((row) => [row?.unitNo || '', row?.roomType || '', row?.ownershipStatus || 'owned'].join('|'))
    .join('\n');
}

function parseUnitsText(text = '') {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [unitNo = '', roomType = '', ownershipStatus = 'owned'] = line.split('|').map((part) => part.trim());
      return {
        unitNo,
        roomType,
        ownershipStatus: ownershipStatus || 'owned',
      };
    })
    .filter((row) => row.unitNo);
}

function makeCardCodeFromMemberId(memberId = '') {
  const suffix = String(memberId || '').replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase();
  return `LAYA-${suffix || Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function syncCurrentEditorFromDom() {
  if (isMembersTab()) {
    syncMemberEditorFromDom();
  } else {
    syncContentEditorFromDom(getActiveType());
  }
}

function updateEditorHeader() {
  const type = getActiveType();
  if (isMembersTab(type)) return;

  const label = labelMap[type];
  const editor = getContentEditorState(type);
  if ($('editorTypeLabel')) $('editorTypeLabel').textContent = label;
  if ($('adminTabEyebrow')) $('adminTabEyebrow').textContent = label;
  if ($('adminTabTitle')) $('adminTabTitle').textContent = `${label} items`;
  if ($('editorModeLabel')) $('editorModeLabel').textContent = editor.isExisting ? `Editing ${label}` : `Create new ${label}`;
  if ($('editorDocIdLabel')) $('editorDocIdLabel').textContent = editor.docId || 'Not created';
  updateRewardConfigUi(type);
  updateContentStatusUi();
}

function updateRewardConfigUi(type = getActiveType()) {
  const isRewardType = type === 'rewards';
  $('rewardConfigBlock')?.classList.toggle('hidden', !isRewardType);
  if ($('contentCtaLabel')) $('contentCtaLabel').placeholder = isRewardType ? 'Redeem now' : 'Learn more';
}

function updateContentStatusUi() {
  const type = getActiveType();
  if (isMembersTab(type)) return;
  const editor = getContentEditorState(type);
  const saveBtn = $('saveContentBtn');
  const publishBtn = $('publishContentBtn');
  const unpublishBtn = $('unpublishContentBtn');
  const deleteBtn = $('deleteContentBtn');
  const cancelBtn = $('cancelContentEditBtn');
  const statusNote = $('contentStatusNote');
  const statusLabel = getContentStatusLabel(editor.status || 'draft');
  const isPublished = editor.status === 'published';
  const hasDoc = Boolean(editor.docId);

  if (saveBtn) saveBtn.textContent = isPublished ? 'Save Changes' : 'Save Draft';
  if (publishBtn) {
    publishBtn.disabled = isPublished;
    publishBtn.textContent = isPublished ? 'Published' : 'Publish Item';
  }
  if (unpublishBtn) {
    unpublishBtn.classList.toggle('hidden', !hasDoc || !isPublished);
    unpublishBtn.disabled = !hasDoc || !isPublished;
  }
  if (deleteBtn) {
    deleteBtn.classList.toggle('hidden', !hasDoc);
    deleteBtn.disabled = !hasDoc;
  }
  if (cancelBtn) cancelBtn.classList.toggle('hidden', !hasDoc);
  if (statusNote) {
    const detailBits = [
      editor.status === 'published' && editor.publishedLabel && editor.publishedLabel !== '-' ? `เผยแพร่ ${editor.publishedLabel}` : '',
      editor.status === 'unpublished' && editor.unpublishedLabel && editor.unpublishedLabel !== '-' ? `ยกเลิกเผยแพร่ ${editor.unpublishedLabel}` : '',
      editor.status === 'draft' ? 'ยังไม่แสดงบนหน้าสาธารณะ' : '',
    ].filter(Boolean);
    statusNote.classList.toggle('hidden', !hasDoc);
    statusNote.textContent = hasDoc ? `Status: ${statusLabel}${detailBits.length ? ` • ${detailBits.join(' • ')}` : ''}` : '';
  }
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

function updateMemberReadonlyNote() {
  const note = $('memberReadOnlyNote');
  if (!note) return;
  if (canManageContent()) {
    note.textContent = 'แท็บ Members จะบันทึกข้อมูลสมาชิกจริงไปที่ Firestore collection: members และ point_wallets';
    return;
  }
  note.textContent = 'โหมดนี้ใช้ดูตัวอย่างสมาชิกได้ แต่การบันทึก/ลบจะใช้ได้เมื่อ login เป็น admin / manager / staff และเชื่อม Firebase สำเร็จ';
}

function syncContentEditorFromDom(type = getActiveType()) {
  const editor = getContentEditorState(type);
  editor.title = $('contentTitle')?.value.trim() || '';
  editor.summary = $('contentSummary')?.value.trim() || '';
  editor.fullDetails = $('contentFullDetails')?.value.trim() || '';
  editor.terms = $('contentTerms')?.value.trim() || '';
  editor.ctaLabel = $('contentCtaLabel')?.value.trim() || '';
  editor.pointsCost = Math.max(0, Number($('contentPointsCost')?.value || editor.pointsCost || 0));
  editor.rewardCategory = $('contentRewardCategory')?.value.trim() || '';
  editor.stockTotal = Math.max(0, Number($('contentRewardStock')?.value || editor.stockTotal || 0));
  editor.rewardCodeExpiryDays = Math.max(1, Number($('contentRewardExpiryDays')?.value || editor.rewardCodeExpiryDays || 30));
  editor.rewardIsActive = $('contentRewardActive') ? Boolean($('contentRewardActive').checked) : (editor.rewardIsActive !== false);
  editor.coverImageUrl = $('contentCoverImageUrl')?.value.trim() || editor.coverImageUrl || '';
  setContentEditorState(type, editor);
}

function syncMemberEditorFromDom() {
  const editor = getMemberEditorState();
  editor.memberId = $('memberIdInput')?.value.trim() || editor.memberId || '';
  editor.publicCardCode = $('memberCardCodeInput')?.value.trim() || '';
  editor.authUid = $('memberAuthUidInput')?.value.trim() || '';
  editor.fullName = $('memberFullNameInput')?.value.trim() || '';
  editor.firstName = $('memberFirstNameInput')?.value.trim() || '';
  editor.lastName = $('memberLastNameInput')?.value.trim() || '';
  editor.email = $('memberEmailInput')?.value.trim() || '';
  editor.phone = $('memberPhoneInput')?.value.trim() || '';
  editor.status = $('memberStatusInput')?.value || 'active';
  editor.tier = $('memberTierInput')?.value || 'elite_black';
  editor.ownerType = $('memberOwnerTypeInput')?.value || 'resident_owner';
  editor.preferredLanguage = $('memberPreferredLanguageInput')?.value || 'en';
  editor.avatarUrl = $('memberAvatarUrlInput')?.value.trim() || '';
  editor.ownedUnitsText = $('memberOwnedUnitsInput')?.value || '';
  editor.notes = $('memberNotesInput')?.value || '';
  setMemberEditorState(editor);
}

function hydrateContentEditorFromState(type = getActiveType()) {
  const editor = getContentEditorState(type);
  if ($('contentTitle')) $('contentTitle').value = editor.title || '';
  if ($('contentSummary')) $('contentSummary').value = editor.summary || '';
  if ($('contentFullDetails')) $('contentFullDetails').value = editor.fullDetails || '';
  if ($('contentTerms')) $('contentTerms').value = editor.terms || '';
  if ($('contentCtaLabel')) $('contentCtaLabel').value = editor.ctaLabel || '';
  if ($('contentPointsCost')) $('contentPointsCost').value = String(Number(editor.pointsCost || 0) || 0);
  if ($('contentRewardCategory')) $('contentRewardCategory').value = editor.rewardCategory || '';
  if ($('contentRewardStock')) $('contentRewardStock').value = String(Number(editor.stockTotal || 0) || 0);
  if ($('contentRewardExpiryDays')) $('contentRewardExpiryDays').value = String(Math.max(1, Number(editor.rewardCodeExpiryDays || 30)));
  if ($('contentRewardActive')) $('contentRewardActive').checked = editor.rewardIsActive !== false;
  if ($('contentCoverImageUrl')) $('contentCoverImageUrl').value = editor.coverImageUrl || '';
  if ($('contentCoverFile')) $('contentCoverFile').value = '';
  if ($('contentGalleryFiles')) $('contentGalleryFiles').value = '';
  updateEditorHeader();
  updateCoverPreview();
  updateCoverMeta();
  renderGalleryPreview();
  updateContentStatusUi();
}

function hydrateMemberEditorFromState() {
  const editor = getMemberEditorState();
  if ($('memberIdInput')) $('memberIdInput').value = editor.memberId || '';
  if ($('memberCardCodeInput')) $('memberCardCodeInput').value = editor.publicCardCode || '';
  if ($('memberAuthUidInput')) $('memberAuthUidInput').value = editor.authUid || '';
  if ($('memberFullNameInput')) $('memberFullNameInput').value = editor.fullName || '';
  if ($('memberFirstNameInput')) $('memberFirstNameInput').value = editor.firstName || '';
  if ($('memberLastNameInput')) $('memberLastNameInput').value = editor.lastName || '';
  if ($('memberEmailInput')) $('memberEmailInput').value = editor.email || '';
  if ($('memberPhoneInput')) $('memberPhoneInput').value = editor.phone || '';
  if ($('memberStatusInput')) $('memberStatusInput').value = editor.status || 'active';
  if ($('memberTierInput')) $('memberTierInput').value = editor.tier || 'elite_black';
  if ($('memberOwnerTypeInput')) $('memberOwnerTypeInput').value = editor.ownerType || 'resident_owner';
  if ($('memberPreferredLanguageInput')) $('memberPreferredLanguageInput').value = editor.preferredLanguage || 'en';
  if ($('memberAvatarUrlInput')) $('memberAvatarUrlInput').value = editor.avatarUrl || '';
  if ($('memberOwnedUnitsInput')) $('memberOwnedUnitsInput').value = editor.ownedUnitsText || '';
  if ($('memberNotesInput')) $('memberNotesInput').value = editor.notes || '';

  if ($('memberEditorModeLabel')) $('memberEditorModeLabel').textContent = editor.isExisting ? 'Editing member' : 'Create new member';
  if ($('memberEditorDocIdLabel')) $('memberEditorDocIdLabel').textContent = editor.memberId || 'Not created';
  renderMemberQrPreview();
}

function updateCoverPreview() {
  const editor = getContentEditorState();
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
  const editor = getContentEditorState();
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
  const editor = getContentEditorState();
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
    const statusLabel = getContentStatusLabel(item.status || 'draft');
    const statusClass = getContentStatusBadgeClass(item.status || 'draft');
    return `
      <article class="content-admin-card ${getContentEditorState(type).docId === item.id ? 'active' : ''}">
        ${image ? `<img class="content-admin-card-image" src="${escapeHtml(image)}" alt="${escapeHtml(item.title || '')}" loading="lazy">` : '<div class="content-admin-card-image fallback">No image</div>'}
        <div class="content-admin-card-body">
          <div class="content-admin-card-top">
            <strong>${escapeHtml(item.title || '(Untitled)')}</strong>
            <small>${escapeHtml(item.updatedLabel || item.createdLabel || '')}</small>
          </div>
          <div class="gallery-badge-row mt-sm">
            <span class="mini-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
            ${type === 'rewards' && Number(item.pointsCost || 0) > 0 ? `<span class="mini-badge gold">${formatNumber(item.pointsCost)} pts</span>` : ''}
            ${type === 'rewards' && (item.rewardCategory || item.category) ? `<span class="mini-badge">${escapeHtml(item.rewardCategory || item.category)}</span>` : ''}
            ${type === 'rewards' ? `<span class="mini-badge ${item.rewardIsActive === false ? 'subtle' : ''}">${item.rewardIsActive === false ? 'Paused' : 'Active'}</span>` : ''}
            ${type === 'rewards' ? `<span class="mini-badge ${Number(item.stockTotal || 0) > 0 && Number(item.stockRemaining || 0) <= 0 ? 'subtle' : ''}">${Number(item.stockTotal || 0) > 0 ? `${formatNumber(item.stockRemaining || 0)} left` : 'Unlimited'}</span>` : ''}
            ${type === 'rewards' ? `<span class="mini-badge">${formatNumber(item.rewardCodeExpiryDays || item.codeExpiryDays || 30)}d code</span>` : ''}
            ${Array.isArray(item.galleryImages) && item.galleryImages.length ? `<span class="mini-badge">${item.galleryImages.length} photos</span>` : ''}
          </div>
          <p>${escapeHtml(item.summary || item.body || '')}</p>
          <div class="content-admin-card-actions">
            <button class="ghost-btn" type="button" data-content-action="edit" data-item-id="${escapeHtml(item.id)}">Edit</button>
            ${item.status === 'published'
              ? `<button class="ghost-btn" type="button" data-content-action="unpublish" data-item-id="${escapeHtml(item.id)}">Unpublish</button>`
              : `<button class="secondary-btn" type="button" data-content-action="publish" data-item-id="${escapeHtml(item.id)}">Publish</button>`}
            <button class="danger-btn" type="button" data-content-action="delete" data-item-id="${escapeHtml(item.id)}">Delete</button>
            ${type === 'rewards'
              ? `<a class="ghost-btn" href="./redemption.html">Open redemption page</a>`
              : `<a class="ghost-btn" href="./${type}-detail.html?id=${encodeURIComponent(item.id)}">Open detail</a>`}
          </div>
        </div>
      </article>
    `;
  }).join('');
}


async function copyTextToClipboard(text = '') {
  const value = String(text || '').trim();
  if (!value) throw new Error('No card code to copy');

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const el = document.createElement('textarea');
  el.value = value;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function renderMemberQrPreview() {
  const editor = getMemberEditorState();
  const code = String(editor.publicCardCode || editor.memberId || '').trim();
  const canvas = $('memberQrPreviewCanvas');
  const codeText = $('memberQrCodeText');
  const copyBtn = $('copyMemberCardCodeBtn');
  const downloadBtn = $('downloadMemberQrBtn');

  if (codeText) codeText.textContent = code || 'Not created';
  if (copyBtn) copyBtn.disabled = !code;
  if (downloadBtn) downloadBtn.disabled = !code;
  if (!canvas) return;

  if (!code) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    ctx.font = '12px sans-serif';
    ctx.fillText('No QR yet', 48, 86);
    return;
  }

  if (window.QRious) {
    new window.QRious({
      element: canvas,
      value: code,
      size: 164,
      background: 'white',
      foreground: '#111111',
      level: 'H',
      padding: 10,
    });
  } else {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111111';
    ctx.font = '12px sans-serif';
    ctx.fillText(code, 10, 82);
  }
}

async function handleCopyMemberCardCode() {
  try {
    const code = getMemberEditorState().publicCardCode || getMemberEditorState().memberId || '';
    await copyTextToClipboard(code);
    showToast('Copied card code');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Copy card code failed', 'error');
  }
}

function handleDownloadMemberQr() {
  const editor = getMemberEditorState();
  const code = String(editor.publicCardCode || editor.memberId || '').trim();
  const canvas = $('memberQrPreviewCanvas');
  if (!code || !canvas) {
    showToast('No QR to download', 'error');
    return;
  }

  const link = document.createElement('a');
  const baseName = (editor.memberId || editor.publicCardCode || 'member-qr').replace(/[^a-z0-9-_]/gi, '-');
  link.href = canvas.toDataURL('image/png');
  link.download = `${baseName}-qr.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Downloaded QR image');
}

function renderMemberInsights() {
  const editor = getMemberEditorState();
  const insights = getMemberInsightsState();
  const wallet = insights.wallet || {};
  const redemptions = Array.isArray(insights.recentRedemptions) ? insights.recentRedemptions : [];
  const unitsCount = parseUnitsText(editor.ownedUnitsText || '').length;

  const displayName = editor.fullName || 'New member';
  const initials = (displayName || 'M')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'M';

  if ($('memberDetailAvatar')) $('memberDetailAvatar').textContent = initials;
  if ($('memberDetailName')) $('memberDetailName').textContent = displayName;
  if ($('memberDetailCode')) $('memberDetailCode').textContent = editor.publicCardCode || 'Not created';
  renderMemberQrPreview();
  if ($('memberDetailTier')) $('memberDetailTier').textContent = editor.tier || 'elite_black';
  if ($('memberDetailStatus')) $('memberDetailStatus').textContent = editor.status || 'active';
  if ($('memberDetailOwnerType')) $('memberDetailOwnerType').textContent = editor.ownerType || 'resident_owner';
  if ($('memberDetailEmail')) $('memberDetailEmail').textContent = editor.email || '-';
  if ($('memberDetailPhone')) $('memberDetailPhone').textContent = editor.phone || '-';
  if ($('memberDetailLanguage')) $('memberDetailLanguage').textContent = editor.preferredLanguage || 'en';
  if ($('memberDetailUnits')) $('memberDetailUnits').textContent = String(unitsCount);
  if ($('memberPointTierBadge')) $('memberPointTierBadge').textContent = wallet.tier || editor.tier || 'elite_black';
  if ($('memberPointCurrent')) $('memberPointCurrent').textContent = formatNumber(wallet.currentPoints || 0);
  if ($('memberPointPending')) $('memberPointPending').textContent = formatNumber(wallet.pendingPoints || 0);
  if ($('memberPointEarned')) $('memberPointEarned').textContent = formatNumber(wallet.lifetimeEarned || 0);
  if ($('memberPointRedeemed')) $('memberPointRedeemed').textContent = formatNumber(wallet.lifetimeRedeemed || 0);
  if ($('memberPointUpdatedAt')) {
    $('memberPointUpdatedAt').textContent = wallet.updatedLabel
      ? `Wallet updated ${wallet.updatedLabel}`
      : 'No wallet data yet';
  }
  if ($('memberRedemptionCount')) {
    $('memberRedemptionCount').textContent = `${redemptions.length} item${redemptions.length === 1 ? '' : 's'}`;
  }

  const list = $('memberRecentRedemptions');
  if (!list) return;

  if (!redemptions.length) {
    list.innerHTML = '<div class="member-redemption-empty">ยังไม่มีประวัติแลกสิทธิ์ของสมาชิกคนนี้</div>';
    return;
  }

  list.innerHTML = redemptions.map((item) => {
    const points = Number(item.pointsCost || 0);
    const dateLabel = item.usedLabel || item.approvedLabel || item.createdLabel || '-';
    return `
      <article class="member-redemption-item">
        <div class="member-redemption-top">
          <div>
            <div class="member-redemption-title">${escapeHtml(item.targetTitleSnapshot || item.targetTitle || item.title || 'Untitled redemption')}</div>
            <div class="member-redemption-meta">${escapeHtml(item.redemptionCode || item.id || '')}</div>
          </div>
          <span class="mini-badge ${item.status === 'used' ? 'gold' : 'subtle'}">${escapeHtml(item.status || 'pending')}</span>
        </div>
        <div class="member-redemption-foot">
          <span>${points ? `${formatNumber(points)} pts` : '0 pts'}</span>
          <span>${escapeHtml(dateLabel)}</span>
        </div>
      </article>
    `;
  }).join('');
}

async function refreshMemberInsights(memberRecord = null) {
  const editor = getMemberEditorState();
  const memberId = memberRecord?.memberId || editor.memberId;

  if (!memberId) {
    setMemberInsightsState(blankMemberInsightsState());
    renderMemberInsights();
    return;
  }

  if (canManageContent()) {
    try {
      const loaded = await loadMemberInsights(memberId);
      setMemberInsightsState({
        wallet: loaded.wallet || {
          currentPoints: 0,
          pendingPoints: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
          updatedLabel: '',
          tier: editor.tier || 'elite_black',
        },
        recentRedemptions: loaded.recentRedemptions || [],
      });
      renderMemberInsights();
      return;
    } catch (error) {
      console.warn(error);
    }
  }

  const demoWallet = {
    currentPoints: Number(demoResident.points || 0),
    pendingPoints: 0,
    lifetimeEarned: Number(demoResident.points || 0) + 12000,
    lifetimeRedeemed: 4800,
    updatedLabel: 'Demo data',
    tier: editor.tier || 'elite_black',
  };

  const demoRedemptions = [
    {
      id: 'demo-red-001',
      targetTitleSnapshot: 'Complimentary Welcome Cocktail',
      redemptionCode: 'RDM-DEMO-001',
      status: 'used',
      pointsCost: 500,
      usedLabel: '2 Apr 2026, 19:20',
    },
    {
      id: 'demo-red-002',
      targetTitleSnapshot: 'Late Checkout Benefit',
      redemptionCode: 'RDM-DEMO-002',
      status: 'approved',
      pointsCost: 1200,
      approvedLabel: '29 Mar 2026, 13:10',
    },
    {
      id: 'demo-red-003',
      targetTitleSnapshot: 'Complimentary Dessert',
      redemptionCode: 'RDM-DEMO-003',
      status: 'pending',
      pointsCost: 350,
      createdLabel: '28 Mar 2026, 16:00',
    },
  ];

  setMemberInsightsState({
    wallet: demoWallet,
    recentRedemptions: demoRedemptions,
  });
  renderMemberInsights();
}

function renderMembersList() {
  const items = adminMembersState.cache || [];
  const container = $('adminMembersList');
  if (!container) return;
  if ($('memberItemCount')) $('memberItemCount').textContent = String(items.length);

  if (!items.length) {
    container.innerHTML = '<div class="card-item"><p>ยังไม่มีสมาชิกในระบบ</p></div>';
    return;
  }

  container.innerHTML = items.map((item) => {
    const active = getMemberEditorState().memberId === item.memberId || getMemberEditorState().memberId === item.id;
    const units = Array.isArray(item.ownedUnits) ? item.ownedUnits.length : 0;
    return `
      <article class="content-admin-card ${active ? 'active' : ''}">
        <div class="content-admin-card-image fallback">${escapeHtml((item.fullName || 'M').slice(0, 1).toUpperCase())}</div>
        <div class="content-admin-card-body">
          <div class="content-admin-card-top">
            <div class="member-admin-meta">
              <strong>${escapeHtml(item.fullName || '(No name)')}</strong>
              <small>${escapeHtml(item.memberId || item.id || '')}</small>
            </div>
            <small>${escapeHtml(item.updatedLabel || item.createdLabel || '')}</small>
          </div>
          <div class="member-admin-card-topline">
            <span class="mini-badge gold">${escapeHtml(item.tier || 'elite_black')}</span>
            <span class="mini-badge subtle">${escapeHtml(item.status || 'active')}</span>
            <span class="mini-badge">${units} unit${units === 1 ? '' : 's'}</span>
          </div>
          <p>${escapeHtml(item.email || item.phone || item.publicCardCode || '')}</p>
          <div class="content-admin-card-actions">
            <button class="ghost-btn" type="button" data-member-action="edit" data-member-id="${escapeHtml(item.memberId || item.id)}">Edit</button>
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

  adminContentState.cache[type] = await loadCollectionSafe(getCollectionNameForType(type), { limit: 40 });
  renderContentList();
  return adminContentState.cache[type];
}

async function loadMembersTab({ force = false } = {}) {
  if (!force && adminMembersState.cache?.length) {
    renderMembersList();
    return adminMembersState.cache;
  }

  adminMembersState.cache = await loadMembersSafe({ limit: 50 });
  renderMembersList();
  return adminMembersState.cache;
}

async function loadEditorItem(type, itemId) {
  const item = await loadDocumentById(getCollectionNameForType(type), itemId);

  if (!item) {
    showToast('ไม่พบรายการที่ต้องการเปิด', 'error');
    return;
  }

  setContentEditorState(type, mapContentItemToEditor(item));

  hydrateContentEditorFromState(type);
  renderContentList();
}

async function loadMemberEditorItem(memberId) {
  const item = await loadMemberById(memberId);

  if (!item) {
    showToast('ไม่พบสมาชิกที่ต้องการเปิด', 'error');
    return;
  }

  setMemberEditorState({
    memberId: item.memberId || item.id || '',
    publicCardCode: item.publicCardCode || '',
    authUid: item.authUid || '',
    fullName: item.fullName || '',
    firstName: item.firstName || '',
    lastName: item.lastName || '',
    email: item.email || '',
    phone: item.phone || '',
    status: item.status || 'active',
    tier: item.tier || 'elite_black',
    ownerType: item.ownerType || 'resident_owner',
    preferredLanguage: item.preferredLanguage || 'en',
    avatarUrl: item.avatarUrl || '',
    ownedUnitsText: unitsToText(item.ownedUnits || []),
    notes: item.notes || '',
    isExisting: true,
  });

  hydrateMemberEditorFromState();
  await refreshMemberInsights(item);
  renderMembersList();
}

function resetContentEditor(type = getActiveType()) {
  setContentEditorState(type, blankContentEditorState());
  hydrateContentEditorFromState(type);
  updateUploadStatus('contentUploadStatus', '');
  updateUploadStatus('contentGalleryUploadStatus', '');
}

function resetMemberEditor() {
  const memberId = createMemberShell();
  setMemberEditorState({
    ...blankMemberEditorState(),
    memberId,
    publicCardCode: makeCardCodeFromMemberId(memberId),
  });
  setMemberInsightsState(blankMemberInsightsState());
  hydrateMemberEditorFromState();
  renderMemberInsights();
}

async function ensureEditingDocId(type = getActiveType()) {
  syncContentEditorFromDom(type);
  const editor = getContentEditorState(type);
  if (editor.docId) return editor.docId;

  const draftPayload = {
    title: editor.title,
    summary: editor.summary,
    fullDetails: editor.fullDetails,
    terms: editor.terms,
    ctaLabel: editor.ctaLabel,
    pointsCost: editor.pointsCost,
    rewardCategory: editor.rewardCategory,
    stockTotal: editor.stockTotal,
    rewardCodeExpiryDays: editor.rewardCodeExpiryDays,
    rewardIsActive: editor.rewardIsActive !== false,
    coverImageUrl: editor.coverImageUrl,
    coverImagePath: editor.coverImagePath,
    coverImageName: editor.coverImageName,
    galleryImages: editor.galleryImages,
  };

  editor.docId = await createContentShell(getCollectionNameForType(type), draftPayload);
  editor.status = 'draft';
  editor.publishedLabel = '';
  editor.unpublishedLabel = '';
  setContentEditorState(type, editor);
  updateEditorHeader();
  return editor.docId;
}

function toggleAdminPanels(type) {
  $('adminContentLayout')?.classList.toggle('hidden', type === 'members');
  $('adminMembersLayout')?.classList.toggle('hidden', type !== 'members');
}

function setTab(type) {
  syncCurrentEditorFromDom();
  adminContentState.activeType = type;

  $$('.admin-tab-btn').forEach((btn) => {
    const active = btn.dataset.adminTab === type;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  toggleAdminPanels(type);

  if ($('adminContentNote')) {
    $('adminContentNote').textContent = type === 'members'
      ? 'แท็บ Members ใช้สร้าง แก้ไข และลบข้อมูลสมาชิกได้จากหน้าเดียว โดยแยก state ออกจากแท็บคอนเทนต์'
      : type === 'rewards'
        ? 'ตอนนี้กำลังจัดการ Redemption rewards แยกจาก Benefits แล้ว เพื่อไม่ให้สิทธิพิเศษทั่วไปปนกับของแลกแต้ม'
        : `ตอนนี้กำลังจัดการ ${labelMap[type]} ข้อมูลที่แก้ค้างไว้ของแต่ละแท็บจะถูกจำแยกกัน`;
  }

  if ($('newContentItemBtn')) {
    $('newContentItemBtn').textContent = type === 'members' ? 'New member' : 'New item';
  }

  if ($('refreshContentBtn')) {
    $('refreshContentBtn').textContent = type === 'members' ? 'Refresh members' : 'Refresh current tab';
  }

  if (type === 'members') {
    updateMemberReadonlyNote();
    hydrateMemberEditorFromState();
    renderMembersList();
    return;
  }

  hydrateContentEditorFromState(type);
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
    const editor = getContentEditorState(type);

    const filteredGallery = editor.galleryImages.filter((img) => !String(img.path || '').includes(`/${docId}/cover/`));
    const galleryImages = normalizeGalleryImages([
      { ...uploaded, isCover: true, sortOrder: 0 },
      ...filteredGallery.map((img) => ({ ...img, isCover: false })),
    ]);

    setContentEditorState(type, {
      ...editor,
      docId,
      coverImageUrl: uploaded.url,
      coverImagePath: uploaded.path,
      coverImageName: uploaded.name || uploaded.fileName || file.name,
      galleryImages,
    });

    hydrateContentEditorFromState(type);
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
    const editor = getContentEditorState(type);

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

    setContentEditorState(type, {
      ...editor,
      docId,
      coverImageUrl,
      coverImagePath,
      coverImageName,
      galleryImages,
    });

    hydrateContentEditorFromState(type);
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
  const editor = getContentEditorState(type);
  const target = editor.galleryImages.find((img) => img.id === imageId);
  if (!target) return;

  const galleryImages = editor.galleryImages.map((img) => ({
    ...img,
    isCover: img.id === imageId,
  }));

  setContentEditorState(type, {
    ...editor,
    coverImageUrl: target.url,
    coverImagePath: target.path,
    coverImageName: target.name || target.fileName,
    galleryImages,
  });

  hydrateContentEditorFromState(type);
}

async function handleRemoveGalleryImage(imageId) {
  const type = getActiveType();
  const editor = getContentEditorState(type);
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

  setContentEditorState(type, {
    ...editor,
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages,
  });
  hydrateContentEditorFromState(type);
  showToast('ลบรูปออกจากรายการแล้ว');
}

function handleMoveFirst(imageId) {
  const type = getActiveType();
  const editor = getContentEditorState(type);
  const target = editor.galleryImages.find((img) => img.id === imageId);
  if (!target) return;

  const galleryImages = [
    target,
    ...editor.galleryImages.filter((img) => img.id !== imageId),
  ].map((img, index) => ({
    ...img,
    sortOrder: index,
  }));

  setContentEditorState(type, { ...editor, galleryImages });
  hydrateContentEditorFromState(type);
}

function clearCoverSelection() {
  const type = getActiveType();
  const editor = getContentEditorState(type);
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

  setContentEditorState(type, {
    ...editor,
    coverImageUrl,
    coverImagePath,
    coverImageName,
    galleryImages,
  });
  hydrateContentEditorFromState(type);
}

async function persistCurrentContentEditor(type = getActiveType()) {
  syncContentEditorFromDom(type);
  const editor = getContentEditorState(type);

  if (!editor.title || !editor.summary || !editor.fullDetails) {
    showToast('กรอก title, summary และ full details ก่อนบันทึก', 'error');
    return null;
  }

  const docId = await ensureEditingDocId(type);
  const payload = {
    title: editor.title,
    summary: editor.summary,
    fullDetails: editor.fullDetails,
    terms: editor.terms,
    ctaLabel: editor.ctaLabel,
    pointsCost: editor.pointsCost,
    rewardCategory: editor.rewardCategory,
    stockTotal: editor.stockTotal,
    rewardCodeExpiryDays: editor.rewardCodeExpiryDays,
    rewardIsActive: editor.rewardIsActive !== false,
    coverImageUrl: editor.coverImageUrl,
    coverImagePath: editor.coverImagePath,
    coverImageName: editor.coverImageName,
    galleryImages: editor.galleryImages,
  };

  if (editor.isExisting) {
    await updateStructuredCMS(getCollectionNameForType(type), docId, payload);
  } else {
    await saveStructuredCMS(getCollectionNameForType(type), payload, { docId });
  }

  const saved = await loadDocumentById(getCollectionNameForType(type), docId);
  const nextEditor = saved ? mapContentItemToEditor(saved) : { ...editor, docId, isExisting: true, status: editor.status || 'draft' };
  setContentEditorState(type, nextEditor);
  hydrateContentEditorFromState(type);
  await loadAdminContent(type, { force: true });
  return saved || nextEditor;
}

async function saveCurrentEditor() {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin / manager / staff ก่อน', 'error');
    return;
  }

  if (isMembersTab()) {
    await saveCurrentMember();
    return;
  }

  const type = getActiveType();

  try {
    const saved = await persistCurrentContentEditor(type);
    if (!saved) return;
    showToast(`${labelMap[type]} saved`);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'บันทึกไม่สำเร็จ', 'error');
  }
}

async function publishCurrentEditor() {
  const type = getActiveType();
  const saved = await persistCurrentContentEditor(type);
  if (!saved?.id && !saved?.docId) return;
  const docId = saved.id || saved.docId;
  await publishCMSItem(getCollectionNameForType(type), docId);
  const reloaded = await loadDocumentById(getCollectionNameForType(type), docId);
  if (reloaded) {
    setContentEditorState(type, mapContentItemToEditor(reloaded));
    hydrateContentEditorFromState(type);
  }
  await loadAdminContent(type, { force: true });
  showToast(`${labelMap[type]} published`);
}

async function unpublishCurrentEditor() {
  const type = getActiveType();
  const editor = getContentEditorState(type);
  if (!editor.docId) {
    showToast('ยังไม่มีรายการให้ยกเลิกเผยแพร่', 'error');
    return;
  }
  await unpublishCMSItem(getCollectionNameForType(type), editor.docId);
  const reloaded = await loadDocumentById(getCollectionNameForType(type), editor.docId);
  if (reloaded) {
    setContentEditorState(type, mapContentItemToEditor(reloaded));
    hydrateContentEditorFromState(type);
  }
  await loadAdminContent(type, { force: true });
  showToast(`${labelMap[type]} unpublished`);
}

async function saveCurrentMember() {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin / manager / staff ก่อน', 'error');
    return;
  }

  syncMemberEditorFromDom();
  const editor = getMemberEditorState();

  if (!editor.fullName) {
    showToast('กรอก Full name ก่อนบันทึก', 'error');
    return;
  }

  const memberId = editor.memberId || createMemberShell();
  const publicCardCode = editor.publicCardCode || makeCardCodeFromMemberId(memberId);

  const payload = {
    memberId,
    publicCardCode,
    authUid: editor.authUid,
    fullName: editor.fullName,
    firstName: editor.firstName,
    lastName: editor.lastName,
    email: editor.email,
    phone: editor.phone,
    status: editor.status,
    tier: editor.tier,
    ownerType: editor.ownerType,
    preferredLanguage: editor.preferredLanguage,
    avatarUrl: editor.avatarUrl,
    ownedUnits: parseUnitsText(editor.ownedUnitsText),
    notes: editor.notes,
  };

  try {
    if (editor.isExisting) {
      await updateMemberRecord(memberId, payload);
    } else {
      await saveMemberRecord(payload, { memberId });
    }

    setMemberEditorState({
      ...editor,
      memberId,
      publicCardCode,
      isExisting: true,
    });
    hydrateMemberEditorFromState();
    await refreshMemberInsights({ memberId });
    await loadMembersTab({ force: true });
    await loadAdminOverview();
    showToast('Member saved');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'บันทึก member ไม่สำเร็จ', 'error');
  }
}

async function deleteCurrentEditor() {
  if (isMembersTab()) {
    await deleteCurrentMember();
    return;
  }

  const type = getActiveType();
  const editor = getContentEditorState(type);

  if (!editor.docId && !editor.galleryImages.length && !editor.coverImagePath) {
    resetContentEditor(type);
    return;
  }

  const ok = window.confirm(`Delete this ${labelMap[type]} item?`);
  if (!ok) return;

  try {
    if (canManageContent()) {
      if (editor.docId) {
        await deleteCMSItem(getCollectionNameForType(type), editor.docId);
      } else if (editor.coverImagePath || editor.galleryImages.length) {
        await deleteStoragePaths([
          editor.coverImagePath,
          ...editor.galleryImages.map((img) => img.path),
        ]);
      }
    }

    resetContentEditor(type);
    await loadAdminContent(type, { force: true });
    showToast(`${labelMap[type]} deleted`);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'ลบรายการไม่สำเร็จ', 'error');
  }
}

async function deleteCurrentMember() {
  const editor = getMemberEditorState();
  if (!editor.memberId && !editor.fullName) {
    resetMemberEditor();
    return;
  }

  const ok = window.confirm('Delete this member?');
  if (!ok) return;

  try {
    if (canManageContent() && editor.isExisting && editor.memberId) {
      await deleteMemberRecord(editor.memberId);
    }
    resetMemberEditor();
    setMemberInsightsState(blankMemberInsightsState());
    await loadMembersTab({ force: true });
    await loadAdminOverview();
    showToast('Member deleted');
  } catch (error) {
    console.error(error);
    showToast(error.message || 'ลบ member ไม่สำเร็จ', 'error');
  }
}

async function handleListClick(event) {
  const button = event.target.closest('[data-content-action]');
  if (!button) return;
  const itemId = button.dataset.itemId;
  const action = button.dataset.contentAction;
  if (!itemId) return;
  if (action === 'edit') {
    await loadEditorItem(getActiveType(), itemId);
    return;
  }
  if (action === 'publish') {
    await publishCMSItem(getCollectionNameForType(getActiveType()), itemId);
    await loadAdminContent(getActiveType(), { force: true });
    if (getContentEditorState(getActiveType()).docId === itemId) {
      await loadEditorItem(getActiveType(), itemId);
    }
    showToast(`${labelMap[getActiveType()]} published`);
    return;
  }
  if (action === 'unpublish') {
    await unpublishCMSItem(getCollectionNameForType(getActiveType()), itemId);
    await loadAdminContent(getActiveType(), { force: true });
    if (getContentEditorState(getActiveType()).docId === itemId) {
      await loadEditorItem(getActiveType(), itemId);
    }
    showToast(`${labelMap[getActiveType()]} unpublished`);
    return;
  }
  if (action === 'delete') {
    const currentEditor = getContentEditorState(getActiveType());
    if (currentEditor.docId === itemId) {
      await deleteCurrentEditor();
      return;
    }
    const ok = window.confirm(`Delete this ${labelMap[getActiveType()]} item?`);
    if (!ok) return;
    await deleteCMSItem(getCollectionNameForType(getActiveType()), itemId);
    await loadAdminContent(getActiveType(), { force: true });
    showToast(`${labelMap[getActiveType()]} deleted`);
  }
}

function handleMembersListClick(event) {
  const button = event.target.closest('[data-member-action="edit"]');
  if (!button) return;
  const memberId = button.dataset.memberId;
  if (!memberId) return;
  loadMemberEditorItem(memberId);
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
  if (!dragImageId) return;
  event.preventDefault();
}

function handleGalleryDrop(event) {
  if (!dragImageId) return;
  event.preventDefault();
  const card = event.target.closest('[data-gallery-card]');
  if (!card) return;
  const dropImageId = card.dataset.imageId;
  if (!dropImageId || dropImageId === dragImageId) return;

  const type = getActiveType();
  const editor = getContentEditorState(type);
  const dragged = editor.galleryImages.find((img) => img.id === dragImageId);
  const others = editor.galleryImages.filter((img) => img.id !== dragImageId);
  const dropIndex = others.findIndex((img) => img.id === dropImageId);
  if (!dragged || dropIndex < 0) return;

  others.splice(dropIndex, 0, dragged);
  const galleryImages = others.map((img, index) => ({ ...img, sortOrder: index }));
  setContentEditorState(type, { ...editor, galleryImages });
  hydrateContentEditorFromState(type);
  dragImageId = '';
}


function updateInviteReadonlyNote() {
  const note = $('inviteAdminNote');
  if (!note) return;
  note.textContent = canManageContent()
    ? 'แอดมินสามารถสร้างรหัสแนะนำตามห้องได้จากหน้านี้ เพื่อจำกัดการสมัครให้ตรงกับห้องที่ขายจริง'
    : 'ต้อง login เป็น admin / manager / staff และเชื่อม Firebase สำเร็จก่อน จึงจะสร้างรหัสแนะนำได้';
}


function getInviteStatusBadgeClass(status = 'active') {
  if (status === 'claimed') return 'subtle';
  if (status === 'disabled') return '';
  return 'gold';
}

function getInviteStatusLabel(status = 'active') {
  if (status === 'claimed') return 'Claimed';
  if (status === 'disabled') return 'Disabled';
  return 'Active';
}

function getInviteCreatedValue(item = {}) {
  return Number(item?.createdAt?.seconds || item?.createdAt?._seconds || item?.createdAt || 0);
}

function compareUnitCode(a = '', b = '') {
  return String(a || '').localeCompare(String(b || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function getSortedInviteItems(items = []) {
  const sortBy = adminInviteState.sortBy || 'created_desc';
  const cloned = [...items];
  if (sortBy === 'unit_asc') {
    return cloned.sort((left, right) => compareUnitCode(left.primaryUnitCode, right.primaryUnitCode) || compareUnitCode(left.code, right.code));
  }
  if (sortBy === 'unit_desc') {
    return cloned.sort((left, right) => compareUnitCode(right.primaryUnitCode, left.primaryUnitCode) || compareUnitCode(right.code, left.code));
  }
  return cloned.sort((left, right) => getInviteCreatedValue(right) - getInviteCreatedValue(left) || compareUnitCode(left.primaryUnitCode, right.primaryUnitCode));
}

function getVisibleInviteItems(items = []) {
  const pageSize = Math.max(1, Number(adminInviteState.pageSize || 20));
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (adminInviteState.currentPage > totalPages) adminInviteState.currentPage = totalPages;
  if (adminInviteState.currentPage < 1) adminInviteState.currentPage = 1;
  const start = (adminInviteState.currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    totalItems: items.length,
    startIndex: items.length ? start + 1 : 0,
    endIndex: Math.min(start + pageSize, items.length),
  };
}

function renderInvitePagination(totalItems = 0, totalPages = 1, startIndex = 0, endIndex = 0) {
  const summary = $('invitePaginationSummary');
  const prevBtn = $('invitePrevPageBtn');
  const nextBtn = $('inviteNextPageBtn');
  if (summary) {
    summary.textContent = totalItems
      ? `Showing ${startIndex}-${endIndex} of ${totalItems} · Page ${adminInviteState.currentPage} of ${totalPages}`
      : 'Page 1 of 1';
  }
  if (prevBtn) prevBtn.disabled = adminInviteState.currentPage <= 1 || totalItems === 0;
  if (nextBtn) nextBtn.disabled = adminInviteState.currentPage >= totalPages || totalItems === 0;
}

function getFilteredInviteItems() {
  const items = Array.isArray(adminInviteState.cache) ? adminInviteState.cache : [];
  const status = adminInviteState.filterStatus || 'all';
  const needle = String(adminInviteState.searchTerm || '').trim().toUpperCase();

  return items.filter((item) => {
    if (status !== 'all' && (item.status || 'active') !== status) return false;
    if (!needle) return true;
    const haystack = [
      item.code,
      item.id,
      item.primaryUnitCode,
      ...(Array.isArray(item.additionalUnitCodes) ? item.additionalUnitCodes : []),
      item.claimedByEmail,
      item.claimedResidentId,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    return haystack.includes(needle);
  });
}

function renderInviteSummary() {
  const total = (adminInviteState.cache || []).length;
  const active = (adminInviteState.cache || []).filter((item) => (item.status || 'active') === 'active').length;
  const claimed = (adminInviteState.cache || []).filter((item) => item.status === 'claimed').length;
  const disabled = (adminInviteState.cache || []).filter((item) => item.status === 'disabled').length;
  const summary = $('inviteFilterSummary');
  if (!summary) return;
  summary.textContent = `All ${total} · Active ${active} · Claimed ${claimed} · Disabled ${disabled}`;
}

function syncInviteFilterButtons() {
  $$('[data-invite-filter]').forEach((button) => {
    const active = button.dataset.inviteFilter === (adminInviteState.filterStatus || 'all');
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderInviteCodeList() {
  const container = $('adminInviteCodeList');
  if (!container) return;

  syncInviteFilterButtons();
  renderInviteSummary();

  const filteredItems = getFilteredInviteItems();
  const sortedItems = getSortedInviteItems(filteredItems);
  const { items, totalPages, totalItems, startIndex, endIndex } = getVisibleInviteItems(sortedItems);
  renderInvitePagination(totalItems, totalPages, startIndex, endIndex);

  if (!items.length) {
    container.innerHTML = '<div class="card-item"><p>ไม่พบ invite code ตามเงื่อนไขที่เลือก</p></div>';
    return;
  }

  container.innerHTML = items.map((item) => {
    const status = item.status || 'active';
    const units = [item.primaryUnitCode, ...(Array.isArray(item.additionalUnitCodes) ? item.additionalUnitCodes : [])].filter(Boolean);
    const canDisable = status === 'active';
    const canRegenerate = status !== 'claimed';
    const metaLine = status === 'claimed'
      ? `Used by ${escapeHtml(item.claimedByEmail || item.claimedResidentId || '-')}`
      : status === 'disabled'
        ? 'Disabled · hidden from sign-up'
        : 'Ready for sign-up';

    return `
      <article class="content-admin-card invite-status-${escapeHtml(status)} ${status === 'claimed' ? 'invite-claimed' : ''}">
        <div class="content-admin-card-image fallback">${escapeHtml((item.primaryUnitCode || 'R').slice(0, 1))}</div>
        <div class="content-admin-card-body">
          <div class="content-admin-card-top">
            <div>
              <strong>${escapeHtml(item.code || item.id || '')}</strong>
              <small>${escapeHtml(item.createdLabel || '')}</small>
            </div>
            <span class="mini-badge ${getInviteStatusBadgeClass(status)}">${escapeHtml(getInviteStatusLabel(status))}</span>
          </div>
          <p>Primary room: ${escapeHtml(item.primaryUnitCode || '-')}<br>${units.length > 1 ? `Extra rooms: ${escapeHtml(units.slice(1).join(', '))}` : 'Extra rooms: -'}</p>
          <div class="content-admin-card-actions invite-actions-wrap">
            <button class="ghost-btn" type="button" data-invite-action="copy" data-invite-code="${escapeHtml(item.code || item.id || '')}">Copy</button>
            ${canDisable ? `<button class="ghost-btn" type="button" data-invite-action="disable" data-invite-code="${escapeHtml(item.code || item.id || '')}">Disable</button>` : ''}
            ${canRegenerate ? `<button class="ghost-btn" type="button" data-invite-action="regenerate" data-invite-code="${escapeHtml(item.code || item.id || '')}">Regenerate</button>` : ''}
            <small class="muted invite-meta-line">${metaLine}</small>
          </div>
        </div>
      </article>
    `;
  }).join('');
}


async function loadInviteCodes({ force = false } = {}) {
  if (!force && adminInviteState.cache.length) {
    renderInviteCodeList();
    return adminInviteState.cache;
  }
  try {
    adminInviteState.cache = await loadResidentInviteCodes({ limit: 500 });
  } catch (error) {
    console.warn(error);
    adminInviteState.cache = [];
  }
  renderInviteCodeList();
  return adminInviteState.cache;
}

async function handleGenerateInviteCode() {
  if (!canManageContent()) {
    showToast('ต้อง login เป็น admin / manager / staff ก่อน', 'error');
    return;
  }

  const primaryUnitCode = normalizeUnitCode($('invitePrimaryUnitInput')?.value || '');
  const additionalUnitCodes = parseUnitCodes($('inviteAdditionalUnitsInput')?.value || '').filter((code) => code !== primaryUnitCode);
  if (!primaryUnitCode) {
    showToast('กรอกห้องหลักก่อนสร้างรหัสแนะนำ', 'error');
    return;
  }

  try {
    const created = await createResidentInviteCode({ primaryUnitCode, additionalUnitCodes });
    if ($('inviteCodePreviewInput')) $('inviteCodePreviewInput').value = created.code || '';
    if ($('inviteCodeStatus')) {
      $('inviteCodeStatus').textContent = `สร้างรหัสสำหรับห้อง ${created.primaryUnitCode} สำเร็จ: ${created.code}`;
      $('inviteCodeStatus').classList.remove('hidden');
    }
    showToast(`Invite code created: ${created.code}`);
    await loadInviteCodes({ force: true });
  } catch (error) {
    console.error(error);
    const inviteErrorMessage = explainInvitePermissionError(error);
    showToast(inviteErrorMessage, 'error');
    if ($('inviteCodeStatus')) {
      $('inviteCodeStatus').textContent = inviteErrorMessage;
      $('inviteCodeStatus').classList.remove('hidden');
    }
  }
}

function handleInviteFilterClick(event) {
  const button = event.target.closest('[data-invite-filter]');
  if (!button) return;
  adminInviteState.filterStatus = button.dataset.inviteFilter || 'all';
  adminInviteState.currentPage = 1;
  renderInviteCodeList();
}

function handleInviteSearchInput(event) {
  adminInviteState.searchTerm = String(event.target?.value || '').trim();
  adminInviteState.currentPage = 1;
  renderInviteCodeList();
}

function handleInviteSortChange(event) {
  adminInviteState.sortBy = String(event.target?.value || 'created_desc');
  adminInviteState.currentPage = 1;
  renderInviteCodeList();
}

function handleInvitePageSizeChange(event) {
  adminInviteState.pageSize = Math.max(1, Number(event.target?.value || 20));
  adminInviteState.currentPage = 1;
  renderInviteCodeList();
}

function handleInvitePrevPage() {
  if (adminInviteState.currentPage <= 1) return;
  adminInviteState.currentPage -= 1;
  renderInviteCodeList();
}

function handleInviteNextPage() {
  const totalItems = getSortedInviteItems(getFilteredInviteItems()).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(1, Number(adminInviteState.pageSize || 20))));
  if (adminInviteState.currentPage >= totalPages) return;
  adminInviteState.currentPage += 1;
  renderInviteCodeList();
}

function escapeExcelCell(value) {
  const raw = String(value ?? '');
  return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleInviteExportExcel() {
  const rows = getSortedInviteItems(getFilteredInviteItems());
  if (!rows.length) {
    showToast('ไม่มีรายการ invite code ให้ export', 'error');
    return;
  }

  const tableRows = rows.map((item) => {
    const extraRooms = Array.isArray(item.additionalUnitCodes) ? item.additionalUnitCodes.join(', ') : '';
    return `
      <tr>
        <td>${escapeExcelCell(item.code || item.id || '')}</td>
        <td>${escapeExcelCell(item.status || 'active')}</td>
        <td>${escapeExcelCell(item.primaryUnitCode || '')}</td>
        <td>${escapeExcelCell(extraRooms || '-')}</td>
        <td>${escapeExcelCell(item.createdLabel || '')}</td>
        <td>${escapeExcelCell(item.claimedLabel || '')}</td>
        <td>${escapeExcelCell(item.claimedByEmail || '')}</td>
        <td>${escapeExcelCell(item.claimedResidentId || '')}</td>
      </tr>`;
  }).join('');

  const html = `<!doctype html><html><head><meta charset="UTF-8"></head><body><table border="1">
    <tr>
      <th>Invite Code</th>
      <th>Status</th>
      <th>Primary Room</th>
      <th>Additional Rooms</th>
      <th>Created At</th>
      <th>Claimed At</th>
      <th>Claimed By Email</th>
      <th>Claimed Resident ID</th>
    </tr>${tableRows}
  </table></body></html>`;
  const stamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(`resident-invite-codes-${stamp}.xls`, html, 'application/vnd.ms-excel;charset=utf-8');
  showToast(`Exported ${rows.length} invite codes`);
}

async function handleInviteListClick(event) {
  const button = event.target.closest('[data-invite-action]');
  if (!button) return;
  const action = button.dataset.inviteAction || '';
  const code = button.dataset.inviteCode || '';
  if (!code) return;

  if (action === 'copy') {
    copyTextToClipboard(code)
      .then(() => showToast(`Copied ${code}`))
      .catch((error) => {
        console.error(error);
        showToast(error?.message || 'Copy failed', 'error');
      });
    return;
  }

  if (action === 'disable') {
    const ok = window.confirm(`Disable invite code ${code}?`);
    if (!ok) return;
    try {
      button.disabled = true;
      const updated = await disableResidentInviteCode(code);
      adminInviteState.cache = (adminInviteState.cache || []).map((item) => item.code === code ? updated : item);
      if ($('inviteCodeStatus')) {
        $('inviteCodeStatus').textContent = `ปิดการใช้งาน code ${code} แล้ว`;
        $('inviteCodeStatus').classList.remove('hidden');
      }
      showToast(`Disabled ${code}`);
      renderInviteCodeList();
    } catch (error) {
      console.error(error);
      showToast(explainInvitePermissionError(error), 'error');
    } finally {
      button.disabled = false;
    }
    return;
  }

  if (action === 'regenerate') {
    const ok = window.confirm(`Generate a new code to replace ${code}? Current code will be disabled.`);
    if (!ok) return;
    try {
      button.disabled = true;
      const created = await regenerateResidentInviteCode(code);
      if ($('inviteCodePreviewInput')) $('inviteCodePreviewInput').value = created.code || '';
      if ($('inviteCodeStatus')) {
        $('inviteCodeStatus').textContent = `สร้าง code ใหม่แทน ${code} สำเร็จ: ${created.code}`;
        $('inviteCodeStatus').classList.remove('hidden');
      }
      showToast(`New invite code: ${created.code}`);
      await loadInviteCodes({ force: true });
    } catch (error) {
      console.error(error);
      showToast(explainInvitePermissionError(error), 'error');
    } finally {
      button.disabled = false;
    }
  }
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
    renderTable($('adminTransactionsTable'), transactions, 'No transactions yet');
    renderResidentSearchResults($('residentSearchResults'), residents.slice(0, 6));
  } catch (error) {
    console.warn(error);
    renderAdminKpis({ residents: 0, points: 0, spend: 0 });
    renderTable($('adminTransactionsTable'), [], 'No transactions yet');
    renderResidentSearchResults($('residentSearchResults'), []);
    showToast('อ่านข้อมูลจาก Firestore ไม่สำเร็จ', 'error');
  }
}

export function openDemoAdmin() {
  return null;
}

async function refreshCurrentTab(force = true) {
  if (isMembersTab()) {
    await loadMembersTab({ force });
    return;
  }
  await loadAdminContent(getActiveType(), { force });
}

function bindAdminContentTabs() {
  $$('.admin-tab-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.adminTab;
      if (!type || type === getActiveType()) return;
      setTab(type);
      if (type === 'members') {
        await loadMembersTab({ force: false });
        return;
      }
      await loadAdminContent(type);
    });
  });

  $('adminContentList')?.addEventListener('click', handleListClick);
  $('adminMembersList')?.addEventListener('click', handleMembersListClick);
  $('contentGalleryPreviewList')?.addEventListener('click', handleGalleryAction);
  $('contentGalleryPreviewList')?.addEventListener('dragstart', handleGalleryDragStart);
  $('contentGalleryPreviewList')?.addEventListener('dragover', handleGalleryDragOver);
  $('contentGalleryPreviewList')?.addEventListener('drop', handleGalleryDrop);

  $('newContentItemBtn')?.addEventListener('click', () => {
    if (isMembersTab()) {
      resetMemberEditor();
    } else {
      resetContentEditor(getActiveType());
    }
  });

  $('refreshContentBtn')?.addEventListener('click', () => refreshCurrentTab(true));
  $('uploadCoverBtn')?.addEventListener('click', handleUploadCover);
  $('uploadGalleryBtn')?.addEventListener('click', handleUploadGallery);
  $('saveContentBtn')?.addEventListener('click', saveCurrentEditor);
  $('publishContentBtn')?.addEventListener('click', async () => {
    try {
      await publishCurrentEditor();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Publish failed', 'error');
    }
  });
  $('unpublishContentBtn')?.addEventListener('click', async () => {
    try {
      await unpublishCurrentEditor();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Unpublish failed', 'error');
    }
  });
  $('cancelContentEditBtn')?.addEventListener('click', async () => {
    const editor = getContentEditorState(getActiveType());
    if (editor.docId && !editor.isExisting) {
      try {
        await deleteCMSItem(getCollectionNameForType(getActiveType()), editor.docId);
      } catch (error) {
        console.warn(error);
      }
    }
    resetContentEditor(getActiveType());
  });
  $('deleteContentBtn')?.addEventListener('click', deleteCurrentEditor);
  $('clearCoverBtn')?.addEventListener('click', clearCoverSelection);

  $('saveMemberBtn')?.addEventListener('click', saveCurrentMember);
  $('cancelMemberEditBtn')?.addEventListener('click', resetMemberEditor);
  $('deleteMemberBtn')?.addEventListener('click', deleteCurrentMember);
  $('copyMemberCardCodeBtn')?.addEventListener('click', handleCopyMemberCardCode);
  $('downloadMemberQrBtn')?.addEventListener('click', handleDownloadMemberQr);

  $('contentCoverFile')?.addEventListener('change', () => {
    const file = $('contentCoverFile')?.files?.[0];
    if (!file) return;
    updateUploadStatus('contentUploadStatus', `เลือกรูปปกแล้ว: ${file.name} — กด Upload Cover`);
  });

  $('contentGalleryFiles')?.addEventListener('change', () => {
    const count = Array.from($('contentGalleryFiles')?.files || []).length;
    updateUploadStatus('contentGalleryUploadStatus', count ? `เลือกรูป gallery แล้ว ${count} รูป — กด Upload Gallery Images` : '');
  });

  $('memberIdInput')?.addEventListener('blur', () => {
    const memberIdInput = $('memberIdInput');
    const cardCodeInput = $('memberCardCodeInput');
    if (!memberIdInput || !cardCodeInput) return;
    if (memberIdInput.value.trim() && !cardCodeInput.value.trim()) {
      cardCodeInput.value = makeCardCodeFromMemberId(memberIdInput.value.trim());
    }
  });
}

function bindInviteCodeManager() {
  $('adminInviteCodeList')?.addEventListener('click', handleInviteListClick);
  $('inviteFilterBar')?.addEventListener('click', handleInviteFilterClick);
  $('inviteSearchInput')?.addEventListener('input', handleInviteSearchInput);
  $('inviteSortSelect')?.addEventListener('change', handleInviteSortChange);
  $('invitePageSizeSelect')?.addEventListener('change', handleInvitePageSizeChange);
  $('invitePrevPageBtn')?.addEventListener('click', handleInvitePrevPage);
  $('inviteNextPageBtn')?.addEventListener('click', handleInviteNextPage);
  $('exportInviteCodesBtn')?.addEventListener('click', handleInviteExportExcel);
  $('generateInviteCodeBtn')?.addEventListener('click', handleGenerateInviteCode);
  $('refreshInviteCodesBtn')?.addEventListener('click', () => loadInviteCodes({ force: true }));
  $('invitePrimaryUnitInput')?.addEventListener('blur', () => {
    const el = $('invitePrimaryUnitInput');
    if (el) el.value = normalizeUnitCode(el.value);
  });
  $('inviteAdditionalUnitsInput')?.addEventListener('blur', () => {
    const el = $('inviteAdditionalUnitsInput');
    if (el) el.value = parseUnitCodes(el.value).join(', ');
  });
}

async function loadInviteCodeManager() {
  if ($('adminInviteCodeList') || $('inviteCodeStatus') || document.body?.dataset?.page === 'invite-codes') {
    if ($('inviteSortSelect')) $('inviteSortSelect').value = adminInviteState.sortBy || 'created_desc';
    if ($('invitePageSizeSelect')) $('invitePageSizeSelect').value = String(adminInviteState.pageSize || 20);
    updateInviteReadonlyNote();
    await loadInviteCodes({ force: true });
  }
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

export async function loadAdminDashboard() {
  await loadAdminOverview();
  updateReadonlyNote();
  updateMemberReadonlyNote();
  if ($('adminInviteCodeList') || $('inviteCodeStatus') || document.body?.dataset?.page === 'invite-codes') {
    updateInviteReadonlyNote();
    await loadInviteCodes({ force: true });
  }
  if (!getMemberEditorState().memberId) resetMemberEditor();
  setTab(getActiveType());
  if (isMembersTab()) {
    await loadMembersTab({ force: true });
    return;
  }
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
      showToast('ต้อง login ก่อนใช้งานหลังบ้าน', 'error');
    });
  }
}

export function bindInviteCodeManagerPage() {
  bindInviteCodeManager();
}

export async function loadInviteCodeManagerPage() {
  await loadInviteCodeManager();
}
