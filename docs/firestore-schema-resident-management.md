# LAYA Resident – Resident Login + Resident Management Schema

เวอร์ชันนี้เพิ่มการเชื่อม **Resident login ของจริง** เข้ากับข้อมูลใน collection ใหม่ชุด Resident Management เพื่อให้ลูกค้าเห็นคะแนนและ QR ของตัวเองตรงจาก Firestore ได้ทันที

---

## 1) `users/{uid}`
ใช้เป็นจุดผูกบัญชี Firebase Auth กับ Resident profile

```json
{
  "uid": "firebase_auth_uid",
  "displayName": "John Smith",
  "email": "john.smith.resident@example.com",
  "role": "resident",
  "residentId": "resident_john_002",
  "memberId": "resident_john_002",
  "memberCode": "RES-0002",
  "publicCardCode": "LAYA-RES-0002",
  "isActive": true,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "lastLoginAt": "serverTimestamp"
}
```

> จุดสำคัญ: ถ้าจะให้ Resident login แล้วอ่านข้อมูลตัวเองได้แน่นอน ควรมี `residentId` ใน `users/{uid}`

---

## 2) `residents/{residentId}`
เก็บ master profile ของ Resident

```json
{
  "id": "resident_john_002",
  "memberCode": "RES-0002",
  "qrCodeValue": "LAYA-RES-0002",
  "cardNumber": "CARD-0002",
  "firstName": "John",
  "lastName": "Smith",
  "displayName": "John Smith",
  "email": "john.smith@example.com",
  "loginEmail": "john.smith.resident@example.com",
  "loginEmailLower": "john.smith.resident@example.com",
  "linkedUserUid": "firebase_auth_uid",
  "authUid": "firebase_auth_uid",
  "phone": "+66892224567",
  "status": "active",
  "tier": "elite_black",
  "ownerType": "resident_owner",
  "primaryUnitCode": "B202",
  "unitCodes": ["B202", "B203"],
  "notes": "Owns two adjacent units.",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### ฟิลด์ที่เพิ่มเข้ามาสำหรับ Resident login
- `loginEmail` = อีเมลที่ใช้ login ใน Firebase Auth
- `loginEmailLower` = เวอร์ชัน lower-case สำหรับ lookup
- `linkedUserUid` / `authUid` = UID ของ Firebase Auth user

---

## 3) `resident_wallets/{residentId}`
เก็บคะแนนรวมปัจจุบันของ Resident

```json
{
  "residentId": "resident_john_002",
  "currentPoints": 32600,
  "pendingPoints": 400,
  "lifetimeEarned": 40100,
  "lifetimeRedeemed": 7500,
  "updatedAt": "serverTimestamp"
}
```

---

## 4) `resident_cards/{residentId}`
เก็บ permanent QR / card config

```json
{
  "residentId": "resident_john_002",
  "memberCode": "RES-0002",
  "cardNumber": "CARD-0002",
  "qrCodeValue": "LAYA-RES-0002",
  "status": "active",
  "issuedAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

---

## 5) `resident_point_transactions/{transactionId}`
เก็บ point history แบบ append-only

```json
{
  "residentId": "resident_john_002",
  "memberCode": "RES-0002",
  "type": "earn",
  "pointsDelta": 5000,
  "balanceAfter": 32600,
  "source": "room_charge",
  "referenceNo": "POS-TT-0102",
  "note": "Weekend family dining",
  "createdByUid": "admin_uid",
  "createdByName": "admin@example.com",
  "createdAt": "serverTimestamp"
}
```

---

## 6) `resident_activity_logs/{logId}`
เก็บ admin action สำคัญ เช่น เพิ่ม/หักคะแนน

```json
{
  "residentId": "resident_john_002",
  "action": "points_added",
  "pointsDelta": 500,
  "memberCode": "RES-0002",
  "referenceNo": "POS-0001",
  "note": "Manual adjustment",
  "createdByUid": "admin_uid",
  "createdByName": "admin@example.com",
  "createdAt": "serverTimestamp"
}
```

---

## Flow ที่แนะนำสำหรับของจริง

### A. สร้าง Firebase Auth user ก่อน
- สร้าง email/password ให้ Resident ใน Firebase Authentication
- ได้ `uid` ของ user คนนั้น

### B. ไปที่หน้า `resident-management.html`
กรอกอย่างน้อย
- Display Name
- Primary Unit
- Resident Login Email
- Linked User UID

เมื่อกด Save ระบบจะ:
1. บันทึก `residents/{residentId}`
2. สร้าง/อัปเดต `resident_wallets/{residentId}`
3. สร้าง/อัปเดต `resident_cards/{residentId}`
4. sync `users/{uid}` ให้เป็น role `resident` พร้อม `residentId`

### C. ตอนลูกค้า login
ระบบจะอ่าน `users/{uid}` -> ได้ `residentId` -> ไปดึง
- `residents/{residentId}`
- `resident_wallets/{residentId}`
- `resident_cards/{residentId}`
- `resident_point_transactions` ของ resident คนนั้น

แล้วแสดงในหน้า Home / Member ทันที

---

## หมายเหตุด้าน Security
- Resident ควรอ่านได้เฉพาะ `residentId` ของตัวเอง
- Resident ห้ามเขียน `resident_wallets` และ `resident_point_transactions` เอง
- Admin / Manager / Staff เท่านั้นที่แก้คะแนนและข้อมูล profile หลักได้
- ใน QR ควรใส่แค่ `qrCodeValue` หรือ `memberCode` ไม่ควร encode ข้อมูลส่วนตัวทั้งหมดลงไปโดยตรง
