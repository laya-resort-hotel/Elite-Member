# LAYA Resident — Elite Black Card Starter

Starter project สำหรับทำ Web App สมาชิก Resident ของ LAYA Resort Hotel

## สิ่งที่มีใน ZIP นี้
- Frontend ฝั่ง Resident แบบ mobile-first luxury style
- หน้า Home / Card / Points / Benefits / News / Profile
- หน้า Admin เบื้องต้นสำหรับ Dashboard / Members / Scan Spend / Content
- Mock data พร้อมรันเดโมได้ทันที
- Firebase-ready structure สำหรับต่อระบบจริง

## วิธีเปิดบน VS Code
1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์นี้ใน VS Code
3. เปิด Terminal
4. รันคำสั่ง

```bash
npm install
npm run dev
```

จากนั้นเปิด URL ที่ Vite แสดงใน Terminal

## ถ้าจะใช้ Firebase จริง
1. copy ไฟล์ `.env.example` เป็น `.env`
2. ใส่ค่า Firebase ของโปรเจกต์
3. เปลี่ยน `VITE_USE_MOCK=true` เป็น `VITE_USE_MOCK=false`
4. เขียน service ฝั่ง Firestore เพิ่มใน `src/lib/services/`

## โครงสร้างหลัก
- `src/pages/resident` หน้าฝั่งสมาชิก
- `src/pages/admin` หน้าฝั่งหลังบ้าน
- `src/layouts` layout ของแอพ
- `src/context` auth mock context
- `src/lib/services` service layer
- `src/routes` protected route

## หมายเหตุ
โปรเจกต์นี้เป็น starter ที่เน้นให้เห็นโครงสร้างและ UI direction ก่อน
ยังไม่ได้เชื่อม auth / firestore / QR scanner จริง แต่เตรียมฐานไว้ให้แล้ว
