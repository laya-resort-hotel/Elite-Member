
import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { demoResident } from '../data/demo.js';
import { loadAllResidents, searchResidents } from '../services/member-service.js';
import { renderResidentSearchResults } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';

export async function loadMembersPage() {
  try {
    const residents = await loadAllResidents();
    renderResidentSearchResults($('membersList'), residents.length ? residents : [demoResident]);
    if ($('memberCountBadge')) $('memberCountBadge').textContent = `${residents.length || 1} members`;
  } catch (error) {
    console.warn(error);
    renderResidentSearchResults($('membersList'), [demoResident]);
    if ($('memberCountBadge')) $('memberCountBadge').textContent = '1 member';
    showToast('แสดงข้อมูล demo member เพราะยังอ่าน Firestore ไม่ได้', 'error');
  }
}

export function bindMembersPage() {
  if (!$('membersSearchBtn')) return;
  $('membersSearchBtn').addEventListener('click', async () => {
    const keyword = $('membersSearch')?.value.trim();
    if (!state.firebaseReady) {
      renderResidentSearchResults($('membersList'), [demoResident]);
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
