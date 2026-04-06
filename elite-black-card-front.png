
import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { loadAllResidents, searchResidents } from '../services/member-service.js';
import { renderResidentSearchResults } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';

export async function loadMembersPage() {
  try {
    const residents = await loadAllResidents();
    renderResidentSearchResults($('membersList'), residents);
    if ($('memberCountBadge')) $('memberCountBadge').textContent = `${residents.length} members`;
  } catch (error) {
    console.warn(error);
    renderResidentSearchResults($('membersList'), []);
    if ($('memberCountBadge')) $('memberCountBadge').textContent = '0 members';
    showToast('ยังอ่านข้อมูลสมาชิกจาก Firestore ไม่ได้', 'error');
  }
}

export function bindMembersPage() {
  if (!$('membersSearchBtn') || $('membersSearchBtn').dataset.bound) return;
  $('membersSearchBtn').dataset.bound = '1';
  $('membersSearchBtn').addEventListener('click', async () => {
    const keyword = $('membersSearch')?.value.trim();
    if (!state.firebaseReady) {
      showToast('Firebase not ready', 'error');
      return;
    }
    try {
      const results = await searchResidents(keyword);
      renderResidentSearchResults($('membersList'), results);
      if ($('memberCountBadge')) $('memberCountBadge').textContent = `${results.length} members`;
    } catch (error) {
      console.error(error);
      showToast('Search failed', 'error');
    }
  });
}
