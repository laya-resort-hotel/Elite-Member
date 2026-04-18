Static page patch

Replace this file in your repo:
- assets/js/services/static-page-service.js

What this patch does:
- Detects escaped HTML stored in Firestore, such as &lt;h2&gt;...&lt;/h2&gt;
- Decodes it before rendering and before normalizing editor state
- Lets About / Contact / FAQ pages render HTML normally again

After uploading:
- Push to GitHub
- Hard refresh the browser with Ctrl+F5
