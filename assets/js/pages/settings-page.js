import { $, $$ } from '../core/dom.js';
import { state } from '../core/state.js';
import { renderResidentCard } from '../ui/renderers.js';
import { showToast } from '../ui/toast.js';
import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

function splitName(name = '') {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function setPanelVisible(visible) {
  $('editNamePanel')?.classList.toggle('hidden', !visible);
}

function fillForm() {
  const name = state.currentProfile?.displayName || state.currentResident?.fullName || state.currentResident?.displayName || state.currentUser?.displayName || '';
  const { firstName, lastName } = splitName(name);
  if ($('settingsFirstName')) $('settingsFirstName').value = firstName;
  if ($('settingsLastName')) $('settingsLastName').value = lastName;
}

async function saveName() {
  const firstName = $('settingsFirstName')?.value.trim() || '';
  const lastName = $('settingsLastName')?.value.trim() || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const status = $('editNameStatus');
  const saveBtn = $('saveNameBtn');

  if (!state.currentUser?.uid || !state.db) {
    showToast('Please log in again.', 'error');
    return;
  }
  if (!firstName || !lastName) {
    showToast('Please enter both first name and last name.', 'error');
    return;
  }

  try {
    if (saveBtn) saveBtn.disabled = true;
    await updateProfile(state.currentUser, { displayName: fullName }).catch(() => undefined);

    const userRef = doc(state.db, 'users', state.currentUser.uid);
    const existing = await getDoc(userRef).catch(() => null);
    const current = existing && existing.exists() ? (existing.data() || {}) : {};
    await setDoc(userRef, {
      ...current,
      uid: state.currentUser.uid,
      email: current.email || state.currentUser.email || '',
      role: current.role || state.currentRole || 'resident',
      employeeId: current.employeeId || '',
      memberId: current.memberId || state.currentProfile?.memberId || '',
      memberCode: current.memberCode || state.currentProfile?.memberCode || '',
      publicCardCode: current.publicCardCode || state.currentProfile?.publicCardCode || '',
      residentId: current.residentId || state.currentProfile?.residentId || '',
      isActive: current.isActive !== false,
      createdAt: current.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: current.lastLoginAt || serverTimestamp(),
      displayName: fullName,
    }, { merge: true });

    state.currentProfile = { ...(state.currentProfile || {}), displayName: fullName };
    state.currentResident = { ...(state.currentResident || {}), firstName, lastName, displayName: fullName, fullName };
    renderResidentCard(state.currentResident);
    if ($('vaultMemberName')) $('vaultMemberName').textContent = fullName;
    if ($('memberName')) $('memberName').textContent = fullName;
    if (status) {
      status.textContent = 'Name updated successfully.';
      status.classList.remove('hidden');
    }
    showToast('Name updated successfully.');
    setPanelVisible(false)
  } catch (error) {
    console.error(error);
    if (status) {
      status.textContent = error?.message || 'Failed to update your name.';
      status.classList.remove('hidden');
    }
    showToast(error?.message || 'Failed to update your name.', 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

export function bindSettingsPage() {
  const editBtn = $('editNameBtn');
  const cancelBtn = $('cancelEditNameBtn');
  const saveBtn = $('saveNameBtn');
  if (editBtn && !editBtn.dataset.bound) {
    editBtn.dataset.bound = '1';
    editBtn.addEventListener('click', () => {
      fillForm();
      $('editNameStatus')?.classList.add('hidden');
      setPanelVisible(true);
    });
  }
  if (cancelBtn && !cancelBtn.dataset.bound) {
    cancelBtn.dataset.bound = '1';
    cancelBtn.addEventListener('click', () => setPanelVisible(false));
  }
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = '1';
    saveBtn.addEventListener('click', saveName);
  }
}
