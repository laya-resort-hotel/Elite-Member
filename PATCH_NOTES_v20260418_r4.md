# Patch Notes – v20260418 r4

This patch focuses on the final high-priority admin production issues identified during the admin tab audit.

## Fixed

1. **Admin dashboard KPI totals**
   - `All Issued Points` and `All Spend` now calculate from all `spend_transactions`, not just the latest 12 rows.
   - The Recent Transactions table remains limited to the latest 12 rows and is labeled accordingly.

2. **Resident/member merge in dashboard + search**
   - `loadAllResidents()` now loads both `residents` and legacy `members`, merges them, and avoids silently dropping one collection when the other exists.

3. **Members tab runtime fallback bug**
   - Removed the broken `demoResident` fallback from Admin member insights.
   - If wallet insights fail to load, the UI now shows a zeroed state instead of throwing a runtime error.

4. **Admin content list error handling**
   - Added `try/catch` and toast feedback for publish / unpublish / delete actions from the list panel.

5. **Admin tab switching error handling**
   - Added `try/catch` and toast feedback when loading a tab fails.

6. **Members tab > 50 records**
   - Members tab no longer hard-limits itself to 50 rows.
   - Added a search field for name, member ID, card code, email, phone, or room/unit.

## Files changed

- `admin.html`
- `assets/js/pages/admin-page.js`
- `assets/js/services/member-service.js`


---

## Point rule update — 2026-04-18 r4.1

Updated point earning rule from **35 THB = 10 points** to **1 THB = 1 point** across the latest project patch.

Changed files:
- `assets/js/services/resident-earn-service.js`
- `assets/js/services/transaction-service.js`
- `resident-points.html`
- `admin.html`

Notes:
- Resident scanner now auto-calculates points using 1:1.
- Stored formula labels for resident spend transactions now use the updated rule.
- Transaction-service fallback/default rule now uses 1 THB per 1 point.
- Admin and resident scanner UI copy now matches the new rule.
