
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


## Updated CMS fields
Admin pages for News, Promotions, and Benefits now support:
- title
- summary
- full details
- terms
- CTA label
- cover image URL


## Firebase Storage cover upload
Admin pages for News / Promotions / Benefits now support real image upload to **Firebase Storage**.

How it works:
- Choose an image file
- Click **Upload to Firebase Storage**
- The app stores the file under `cms-covers/<collection>/...`
- The download URL is written back to the CMS form automatically
- Then click **Save** to save the content item

New file included:
- `storage.rules`

Suggested Firebase Storage rules for this version:
- public read for cover images
- authenticated write for uploads

In Firebase Console:
1. Open **Storage**
2. Go to **Rules**
3. Paste the contents of `storage.rules`
4. Publish rules

Notes:
- Max upload size in this app is 5MB per image
- When you upload a new cover over an existing live item, the old Storage file is removed automatically
- When you delete a live News / Promotion / Benefit item, its Storage cover file is removed automatically too


## Multi-image content
- News / Promotions / Benefits now support multiple gallery images per item.
- In the admin form, upload a primary cover image and also upload multiple gallery images.
- Gallery images are saved in Firestore as `galleryImages` and uploaded to Firebase Storage.
- On the detail page, users can tap thumbnails to switch the main image.


## Gallery ordering
- Admin can drag & drop gallery images to control display order on detail pages.
- The first image in the gallery becomes the first image of the set on the detail page.
- Cover image can still be set independently with `Use as cover`.

## New in this build
- Detail pages support fullscreen lightbox viewing for gallery images.


## Card UI update
- Premium smooth flip effect
- White background removed from card artwork
- Download current card side from Home and Resident pages


## Front path split
- Resident / customer path: `home.html`, `redemption.html`, `member.html`, `settings.html`
- Admin / hotel path: `admin.html`, `members.html`, CMS pages


## Employee sign-up

- เปิด `signup.html` เพื่อสมัครสมาชิกด้วยรหัสพนักงาน
- ระบบจะสร้าง Firebase Authentication user และ Firestore `users/{uid}` อัตโนมัติ
- role เริ่มต้น = `staff`
