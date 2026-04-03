# LAYA Resident – Admin Buttons Patch

ไฟล์ชุดนี้เป็นแพตช์สำหรับโปรเจกต์ static Firebase ของ LAYA Resident

## ไฟล์ที่ต้องเอาไปทับของเดิม
- `assets/js/services/storage-service.js`
- `assets/js/services/content-service.js`
- `assets/js/pages/content-page.js`

## หลังอัปแพตช์นี้
ปุ่มในหน้า admin editor ของ
- `news.html`
- `promotions.html`
- `benefits.html`

จะใช้งานได้ตามนี้
- Upload Cover
- Upload Gallery Images
- Use as Cover
- Remove
- Save Content
- Delete Item

## หมายเหตุ
- ถ้ายังไม่ได้กด Save แต่มีการอัปโหลดรูป ระบบจะเก็บรูปไว้ใน draft state ก่อน
- ถ้ากด Cancel edit ตอนยังเป็น draft ระบบจะพยายามลบรูป draft ที่อัปไว้
- ต้อง login เป็น `admin`, `manager` หรือ `staff`
- ต้องลง `firestore.rules` และ `storage.rules` ให้ตรงกับเวอร์ชันล่าสุดก่อน
