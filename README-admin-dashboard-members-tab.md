# LAYA Resident – Admin Dashboard Members Tab Patch

ไฟล์ชุดนี้เพิ่มแท็บ **Members** เข้าในหน้า `admin.html` เดียวกัน โดยไม่ต้องสลับไปหน้า `members.html`

## ไฟล์ที่มีในแพตช์
- `admin.html`
- `assets/css/components.css`
- `assets/js/pages/admin-page.js`
- `assets/js/services/member-admin-service.js`

## สิ่งที่เพิ่มให้
- แท็บ `Members` ในหน้า Admin เดียว
- รายการสมาชิกด้านซ้าย
- ฟอร์มแก้ไขสมาชิกด้านขวา
- ปุ่ม `Save Member`
- ปุ่ม `Delete Member`
- ปุ่ม `New member`
- รองรับ field:
  - memberId
  - publicCardCode
  - authUid
  - fullName
  - firstName
  - lastName
  - email
  - phone
  - status
  - tier
  - ownerType
  - preferredLanguage
  - avatarUrl
  - ownedUnits
  - notes

## วิธีใช้
1. แตก ZIP
2. เอาไฟล์ทั้งหมดในแพตช์นี้ไปทับของเดิมในโปรเจกต์
3. อัปขึ้น GitHub ตามเดิม
4. เปิด `admin.html`
5. กดแท็บ `Members`

## หมายเหตุ
- ตอนสร้างสมาชิกใหม่ ระบบจะสร้าง `memberId` ให้ก่อนอัตโนมัติ
- ถ้ายังไม่มี `publicCardCode` ระบบจะ generate จาก `memberId`
- ตอน Save member ครั้งแรก ระบบจะสร้าง `point_wallets/{memberId}` ให้ด้วย
