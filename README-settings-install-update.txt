This patch adds two buttons in Settings:
- Install LAYA Resident
- Update App Version

Included files:
- settings.html
- assets/js/main.js
- manifest.webmanifest
- sw.js
- assets/images/laya-app-icon-180-v20260420b.png
- assets/images/laya-app-icon-192-v20260420b.png
- assets/images/laya-app-icon-512-v20260420b.png

Notes:
- Android/Chrome can show a direct install prompt from the Settings button when available.
- iPhone/iPad will show Add to Home Screen instructions instead.
- Update App Version clears the app cache for this site and reloads the newest build.
- Existing Home Screen icons on iPhone/iPad may still need one manual remove + add again if iOS keeps the old icon/name.
