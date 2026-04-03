# LAYA Resident – Elite Black Card (Static GitHub Upload Version)

เวอร์ชันนี้ทำมาเพื่อ **อัปขึ้น GitHub ได้เลย**

## จุดเด่น
- ไม่ต้องติดตั้ง Node.js
- ไม่ต้องใช้ npm install
- ไม่ต้อง npm run dev
- ใช้ไฟล์ล้วน: `index.html` + `styles.css` + `app.js`
- ใช้ Firebase Web SDK จาก CDN
- เหมาะกับ GitHub Pages

## วิธีใช้งานแบบง่ายที่สุด
1. สร้าง GitHub repository ใหม่
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไปที่ root ของ repo
3. ไปที่ **Settings > Pages**
4. ที่หัวข้อ **Build and deployment** เลือก
   - Source = **Deploy from a branch**
   - Branch = **main**
   - Folder = **/root**
5. กด Save
6. รอสักครู่ GitHub จะให้ลิงก์เว็บ

## Firebase ที่ใส่ไว้แล้ว
ในไฟล์ `app.js` ใส่ Firebase config ของโปรเจกต์นี้ไว้แล้ว:
- projectId: `elite-black-card`

## Login จริง
หน้า Login ใช้ **Email / Password** จาก Firebase Authentication

## โหมด Demo
ถ้ายังไม่มี user ใน Firebase สามารถกด
- `Open Demo Resident`
- `Open Demo Admin`

เพื่อเปิดดูหน้าเว็บและ UI ได้ทันที

## Collection ที่แอปใช้
- `users`
- `residents`
- `transactions`
- `news`
- `promotions`
- `benefits`

## โครงสร้าง users แนะนำ
Document path: `users/{uid}`

ตัวอย่าง:
```json
{
  "role": "admin",
  "email": "admin@laya.com",
  "memberCode": "LAYA-ADMIN-01"
}
```

## โครงสร้าง residents แนะนำ
```json
{
  "fullName": "Noi Resident",
  "memberCode": "LAYA-0001",
  "residence": "D-108",
  "status": "ACTIVE",
  "tier": "Elite Black",
  "email": "resident@laya.com",
  "points": 42580,
  "totalSpend": 238900
}
```

## หมายเหตุ
ถ้า Firestore Rules ยังไม่เปิดให้อ่าน/เขียนตาม role ระบบจะ fallback ไปใช้ข้อมูล demo บางส่วนเพื่อไม่ให้จอขาว
