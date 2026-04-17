# Elite Member patch notes (2026-04-17)

## What was fixed
- Fixed a real runtime bug in `assets/js/services/auth-service.js` by importing `t` from `assets/js/core/i18n.js`.
- Normalized duplicated root JavaScript files into thin shims that point to the real source files under `assets/js/`.
- Normalized duplicated root CSS files into `@import` shims that point to the real source files under `assets/css/`.
- Added `.nojekyll` for safer GitHub Pages deployment.

## Source of truth
- JavaScript: `assets/js/`
- CSS: `assets/css/`
- Images: `assets/images/`

## Why this patch matters
This project contained duplicate root files whose names matched the active files, but several root files had the wrong contents (for example CSS inside `.js` files). That made future edits risky and could cause blank pages if a wrong file was imported.


## Patch round 2 – 2026-04-18
- Added missing `<div id="toast" class="toast hidden"></div>` to `invite-codes.html` and `resident-points.html`.
- Removed silent Firebase-to-demo fallback in `assets/js/services/resident-management-service.js` when `state.db` is available. Firebase errors now surface to the UI instead of writing to local demo storage.
- Removed demo reward fallback and benefit fallback from `assets/js/pages/redemption-page.js`. Redemption page now reads only from `reward_catalog`.
- Fixed history queries to fetch latest records deterministically:
  - `assets/js/services/member-service.js` uses `where('residentId', '==', ...) + orderBy('createdAt', 'desc')` for point history.
  - `assets/js/services/redemption-service.js` uses `orderBy('createdAt', 'desc')` for resident redemptions.
  - Removed the arbitrary `limit(200)` from legacy `spend_transactions` summary lookup.
- Note: the `resident_point_transactions` query may require a Firestore composite index for `residentId` + `createdAt desc` in production.
