
# LAYA Resident – Elite Black Card (Multipage Static Edition)

เวอร์ชันนี้เป็น static web app ที่อัปขึ้น GitHub Pages ได้ตรง ๆ โดย **ไม่ต้องใช้ npm / React build** และได้แยกหน้า HTML จริงออกจากกันแล้ว

## หน้าแยกจริงในเวอร์ชันนี้
- `index.html` = Login / Landing
- `resident.html` = Resident home
- `news.html` = News page
- `promotions.html` = Promotions page
- `benefits.html` = Benefits page
- `admin.html` = Admin dashboard
- `members.html` = Members page

## วิธีอัปขึ้น GitHub Pages
1. แตก ZIP
2. อัปโหลดทุกไฟล์ขึ้น GitHub repository
3. ไปที่ **Settings > Pages**
4. เลือก **Deploy from a branch**
5. เลือก `main` และ `/root`
6. Save

## Firebase
ไฟล์ `assets/js/config/firebase-config.js` ใส่ค่า Firebase ไว้แล้ว

## หมายเหตุ
แม้จะเป็น multi-page แต่ยังคงใช้ static hosting แบบง่ายเหมือนเดิม


## Added detail pages
- news-detail.html
- promotions-detail.html
- benefits-detail.html


## Admin content editing
- Login with an admin/staff account to manage News, Promotions, and Benefits.
- Open each list page and use **Edit** or **Delete** on live Firebase items.
- Detail pages now include **Admin Tools** with an edit shortcut and delete button for live items.
- Demo items are view-only and cannot be edited or deleted.
