# Laya Resident Part 4 Patch

This patch adds:
- Firestore schema guide
- Firestore rules
- Storage rules
- Firestore indexes
- Firebase Storage helper
- Media upload service
- Real CRUD content service
- Wired admin editor pages

## Files to copy
- firestore.rules -> project root
- storage.rules -> project root
- firestore.indexes.json -> project root
- src/lib/types/content.ts
- src/lib/firebase/storage.ts
- src/services/media.service.ts
- src/services/content.service.ts
- src/pages/admin/NewsEditorPage.tsx
- src/pages/admin/PromotionsEditorPage.tsx
- src/pages/admin/BenefitsEditorPage.tsx

## Expected Firestore collections
- resident_members
- resident_transactions
- resident_news
- resident_promotions
- resident_benefits
- resident_auth_profiles
- staff_users
- point_adjustments
- audit_logs

## Expected Storage paths
- resident-content/news/{docId}/cover-{timestamp}.jpg
- resident-content/promotions/{docId}/banner-{timestamp}.jpg
- resident-content/promotions/{docId}/detail-{timestamp}.jpg
- resident-content/benefits/{docId}/icon-{timestamp}.png
- resident-content/benefits/{docId}/cover-{timestamp}.jpg

## Firebase CLI deploy
firebase deploy --only firestore:rules,firestore:indexes,storage
