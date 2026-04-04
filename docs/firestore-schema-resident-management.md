# LAYA Resident – Firestore-ready Resident Management Starter

คอลเลกชันหลักที่หน้า `resident-management.html` ใช้งาน:

## 1) `residents/{residentId}`
เก็บ master profile ของ Resident

```json
{
  "memberCode": "RES-0001",
  "qrCodeValue": "LAYA-RES-0001",
  "cardNumber": "CARD-0001",
  "firstName": "Noi",
  "lastName": "Resident",
  "displayName": "Noi Resident",
  "email": "noi@example.com",
  "phone": "+66812345678",
  "status": "active",
  "tier": "elite_black",
  "ownerType": "resident_owner",
  "primaryUnitCode": "A101",
  "unitCodes": ["A101", "A102"],
  "notes": "Internal notes",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

## 2) `resident_wallets/{residentId}`
เก็บคะแนนรวมปัจจุบันของสมาชิก 1 คนต่อ 1 wallet

```json
{
  "residentId": "resident_noi_001",
  "currentPoints": 12850,
  "pendingPoints": 0,
  "lifetimeEarned": 15200,
  "lifetimeRedeemed": 2350,
  "updatedAt": "serverTimestamp"
}
```

## 3) `resident_point_transactions/{transactionId}`
เก็บ point history แบบ append-only

```json
{
  "residentId": "resident_noi_001",
  "memberCode": "RES-0001",
  "type": "earn",
  "pointsDelta": 2500,
  "balanceAfter": 12850,
  "source": "fb_spend",
  "referenceNo": "POS-AR-0001",
  "note": "Dinner at Aroonsawat",
  "createdByUid": "admin_uid",
  "createdByName": "admin@example.com",
  "createdAt": "serverTimestamp"
}
```

## 4) `resident_cards/{residentId}`
เก็บ permanent card / QR config ต่อสมาชิก

```json
{
  "residentId": "resident_noi_001",
  "memberCode": "RES-0001",
  "cardNumber": "CARD-0001",
  "qrCodeValue": "LAYA-RES-0001",
  "status": "active",
  "issuedAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

## 5) `resident_activity_logs/{logId}`
เก็บ admin action ที่มีผลกับระบบคะแนนหรือข้อมูลสำคัญ

```json
{
  "residentId": "resident_noi_001",
  "action": "points_added",
  "pointsDelta": 500,
  "memberCode": "RES-0001",
  "referenceNo": "POS-0001",
  "note": "Manual adjustment",
  "createdByUid": "admin_uid",
  "createdByName": "admin@example.com",
  "createdAt": "serverTimestamp"
}
```

---

## Suggested rules intent
- `resident` อ่านได้เฉพาะ doc ของตัวเอง
- `admin / manager / staff` อ่านและเขียนได้ทั้งหมดใน starter นี้
- `resident` ห้ามเขียน wallet และ point transaction เอง
- QR ควรเก็บแค่ `qrCodeValue` / `memberCode` ไม่ควร encode ข้อมูลส่วนตัวลงใน QR โดยตรง

## Suggested page flow
- Create/Edit Resident -> เขียน `residents`
- Save ครั้งแรก -> สร้าง `resident_wallets` และ `resident_cards`
- Add / Redeem points -> เขียน `resident_point_transactions` + update `resident_wallets`
- ทุก action สำคัญ -> เพิ่ม `resident_activity_logs`
