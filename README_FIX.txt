Fix for blank page on GitHub Pages

Replace these files in your project:
- vite.config.ts
- src/app/router.tsx

Then rebuild and upload the new dist/ folder.

Why it was blank:
1) The app is hosted under /Elite-Member/, but Vite base was not set.
2) GitHub Pages works more reliably for SPA routing with createHashRouter.

After this fix, the URL will work like:
https://laya-resort-hotel.github.io/Elite-Member/#/login
