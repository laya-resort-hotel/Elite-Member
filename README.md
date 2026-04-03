# LAYA Resident – Elite Black Card Starter

Starter project for the **LAYA Resident – Elite Black Card** web app.

## Stack
- Vite
- React
- TypeScript
- React Router
- Firebase-ready services and guards
- Demo mode included

## Quick start

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Demo mode
This starter runs in **demo mode by default**, so you can open it in VS Code and start testing immediately even before Firebase is configured.

### Resident demo login
- Login page: `/login`
- Identifier: `resident@example.com`
- Password: `demo123`

### Admin demo login
- Login page: `/admin/login`
- Employee ID: `9001`
- Password: `demo123`

## Enable Firebase later
1. Copy `.env.example` to `.env`
2. Fill in your Firebase project values
3. Set:

```env
VITE_ENABLE_FIREBASE=true
```

4. Restart the dev server

## Suggested next steps
- Connect real Firestore collections
- Connect Firebase Storage for content images
- Add CRUD screens with save actions
- Replace mock data with live service hooks

## Suggested Firestore collections
- `resident_members`
- `resident_transactions`
- `resident_news`
- `resident_promotions`
- `resident_benefits`
- `resident_auth_profiles`
- `staff_users`
