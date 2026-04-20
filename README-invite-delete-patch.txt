Patch: Add Delete button to Invite Codes page.

Files included:
- assets/js/services/resident-invite-service.js
- assets/js/pages/admin-page.js

Behavior:
- Adds Delete button for invite codes that are not claimed.
- Claimed codes cannot be deleted.
- Firestore rules must allow delete on resident_invite_codes for admin/staff/manager.
