# LAYA Resident – Admin Dashboard Tabs Patch

ไฟล์ในแพตช์นี้ใช้สำหรับรวมหน้า Admin ให้เป็นหน้าเดียวแบบมีแท็บ News / Promotions / Benefits

## ไฟล์ที่อยู่ใน ZIP
- admin.html
- assets/css/components.css
- assets/js/pages/admin-page.js
- assets/js/services/storage-service.js
- assets/js/services/content-service.js

## วิธีอัปเดต
1. แตก ZIP
2. เอาไฟล์ข้างในไปทับของเดิมในโปรเจกต์
3. อัปขึ้น GitHub Pages ตามปกติ

## สิ่งที่เพิ่มให้
- Admin Dashboard หน้าเดียว
- แท็บ News / Promotions / Benefits
- รายการด้านซ้าย + ฟอร์มแก้ไขด้านขวา
- Upload Cover
- Upload Gallery Images
- Use as Cover
- Move first
- Remove image
- Save Content
- Delete Item

## หมายเหตุ
- ต้องใช้ Firestore Rules / Storage Rules เวอร์ชันล่าสุดที่ตั้งไว้ก่อนหน้านี้
- ปุ่ม upload / save / delete จะทำงานจริงเมื่อ login เป็น admin / manager / staff และ Firebase เชื่อมสำเร็จ
