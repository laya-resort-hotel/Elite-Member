# LAYA Resident – Elite Black Card

Luxury mobile-first web app for LAYA Resident members, built with React + Vite + Firebase and prepared for GitHub upload / GitHub Pages deployment.

## What is included

- Resident frontend: Home, Card, Points, Benefits, News, Profile
- Firebase Auth login page
- Firestore-connected resident dashboard
- Admin backend: dashboard, members, spend entry, benefits/news CMS
- GitHub Pages-safe routing using hash router
- Firebase Hosting config and Firestore rules starter

## 1) Install

```bash
npm install
```

## 2) Firebase setup

Create a new Firebase project, then enable:

- Authentication -> Email/Password
- Firestore Database

This package already includes `.env` and `.env.production` prefilled for the Firebase project `elite-black-card`, so you can run it immediately.

If you want to switch to another Firebase project later, edit `.env` and `.env.production`.

## 3) Firestore collections

Create these collections:

### users/{uid}
```json
{
  "uid": "firebase auth uid",
  "email": "resident@example.com",
  "displayName": "Resident Name",
  "role": "resident",
  "residentId": "resident_001",
  "isActive": true
}
```

### residents/{residentId}
```json
{
  "fullName": "Resident Name",
  "email": "resident@example.com",
  "phone": "+66...",
  "roomLabel": "Villa A203",
  "status": "active",
  "memberId": "LAYA-RS-0007",
  "tier": "Elite Black Card",
  "since": "Member since 2026",
  "qrPayload": "resident:resident_001",
  "pointBalance": 28450,
  "pointsThisMonth": 1920,
  "pointsExpiringSoon": 650,
  "userUid": "firebase auth uid"
}
```

### benefits/{benefitId}
```json
{
  "title": "Dining Privilege",
  "description": "Receive 15% off food at selected outlets.",
  "tag": "Dining",
  "active": true,
  "sortOrder": 1
}
```

### news/{newsId}
```json
{
  "title": "Resident Sunset Evening at Mangrove",
  "excerpt": "Private resident gathering with complimentary canapes.",
  "body": "Long form content here",
  "category": "News",
  "isPublished": true,
  "publishedAt": "server timestamp"
}
```

### outlets/{outletId}
```json
{
  "name": "Aroonsawat",
  "pointRateBahtPerPoint": 10,
  "active": true
}
```

### pointTransactions/{transactionId}
```json
{
  "residentId": "resident_001",
  "userUid": "firebase auth uid",
  "memberId": "LAYA-RS-0007",
  "outlet": "Aroonsawat",
  "spendAmount": 3250,
  "points": 325,
  "status": "earned",
  "createdAt": "server timestamp",
  "createdByUid": "staff uid"
}
```

## 4) Create first users

1. Create accounts in Firebase Authentication.
2. Copy their UID.
3. Create matching `users` and `residents` docs in Firestore.
4. Use role values:
   - `resident`
   - `staff`
   - `manager`
   - `admin`

## 5) Run locally

```bash
npm run dev
```

## 6) Build

```bash
npm run build
```

## 7) Upload to GitHub

Create a new repository, then:

```bash
git init
git add .
git commit -m "Initial commit - LAYA Resident Elite Black Card"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

## 8) Deploy options

### Option A: GitHub Pages
Because this project uses hash routing, it works well on GitHub Pages.

- Push to GitHub
- In repository settings, enable GitHub Pages from the branch or use Actions
- Build output folder is `dist`

### Option B: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Important notes

- This package is already prefilled with the provided Firebase web config and is ready to run locally or upload to GitHub.
- The starter keeps UI elegant and mobile-first while giving you a practical backend flow.
- Spend entry in Admin automatically writes point transactions and updates resident points.
