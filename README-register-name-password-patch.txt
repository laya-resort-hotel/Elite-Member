PATCH CONTENTS
- resident-login.html
- settings.html
- assets/js/main.js
- assets/js/pages/resident-login-page.js
- assets/js/pages/settings-page.js
- assets/js/services/auth-service.js
- assets/js/core/i18n.js

WHAT CHANGED
- Added First name and Last name fields to Resident Sign Up
- Changed resident-facing wording from PIN to Password
- Sign-up now requires a password with at least 6 characters
- After sign-up/login, the entered display name is shown on Home / Member / Settings
- Added Edit name button and inline name editor in Settings

NOTES
- Name edits are saved to the users collection and Firebase Auth displayName.
- Existing resident documents are not overwritten by this patch, but the app display will prefer the updated user profile displayName.
