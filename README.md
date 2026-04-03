# LAYA Resident – Elite Black Card (Structured Static Edition)

เวอร์ชันนี้ทำมาเพื่อคนที่ต้องการ **อัปขึ้น GitHub Pages ได้ง่าย** แต่ยังอยากให้โครงสร้างไฟล์เป็นระเบียบกว่าแบบ 3 ไฟล์ล้วน

## จุดเด่น
- ไม่ต้องติดตั้ง Node.js
- ไม่ต้องใช้ `npm install`
- ไม่ต้อง `npm run dev`
- อัปขึ้น GitHub Pages ได้ตรง ๆ
- ใช้ Firebase Web SDK จาก CDN
- แยกไฟล์เป็นหมวด: `config`, `core`, `data`, `services`, `ui`, `pages`, `css`

## โครงสร้างไฟล์
```text
index.html
404.html
.nojekyll
README.md
firestore.rules
assets/
  css/
    base.css
    layout.css
    components.css
    responsive.css
  js/
    main.js
    config/
      firebase-config.js
    core/
      dom.js
      state.js
      format.js
    data/
      demo.js
    services/
      firebase-service.js
      auth-service.js
      member-service.js
      content-service.js
      transaction-service.js
    ui/
      toast.js
      renderers.js
      navigation.js
    pages/
      auth-page.js
      resident-page.js
      admin-page.js
```

## วิธีอัปขึ้น GitHub Pages
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
ไฟล์ `assets/js/config/firebase-config.js` ใส่ค่าโปรเจกต์นี้ไว้แล้ว:
- projectId: `elite-black-card`

## Login จริง
หน้า Login ใช้ **Email / Password** จาก Firebase Authentication

## โหมด Demo
ถ้ายังไม่มี user หรือ collection ใน Firebase สามารถกด
- `Open Demo Resident`
- `Open Demo Admin`

## Collection ที่แอปใช้
- `users`
- `residents`
- `transactions`
- `news`
- `promotions`
- `benefits`

## โครงสร้าง users แนะนำ
Document path: `users/{uid}`

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
- ถ้า Firestore Rules ยังไม่เปิดให้อ่าน/เขียนตาม role ระบบจะ fallback ไปใช้ข้อมูล demo บางส่วนเพื่อไม่ให้จอขาว
- เวอร์ชันนี้ยังเหมาะมากกับการเริ่มจริงบน GitHub Pages ก่อน แล้วค่อยแตกต่อเป็นระบบใหญ่ในอนาคต
