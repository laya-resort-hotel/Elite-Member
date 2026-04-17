# Patch Notes v20260418-r3

This patch focuses on production-hardening the admin/member flows:

1. Admin CMS locale tabs:
   - Fixed content locale tab binding so static page language buttons no longer trigger content locale handlers.

2. Invite Codes admin panel:
   - Added explicit error state + toast when invite code loading fails.
   - Prevents silent fallback to an empty list when Firestore/rules/index/network fail.

3. Resident Management:
   - Removed Demo Seed button from the page.
   - Disabled silent local/demo fallback in the live service layer.
   - Resident Management now requires Firebase Live.

4. Redemption page:
   - Locked reward redemption for accounts that are not linked to a real resident profile.
   - Shows a clear message instead of exposing reward catalog/redeem flow.
