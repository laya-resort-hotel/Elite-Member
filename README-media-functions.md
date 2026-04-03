# LAYA Resident – Media Upload Patch

ไฟล์ชุดนี้เอาไว้แทนของเดิมในโปรเจกต์ static ของ LAYA Resident

## ไฟล์ที่ต้องแทน
- `assets/js/services/storage-service.js`
- `assets/js/services/content-service.js`

## ฟังก์ชันใหม่ที่เพิ่มแล้ว
- `createContentShell(contentType, seed)`
- `uploadCoverImage({ contentType, docId, file })`
- `uploadGalleryImages({ contentType, docId, files })`
- `setGalleryImageAsCover({ contentType, docId, imageId })`
- `removeGalleryImage({ contentType, docId, imageId })`
- `deleteContentItemWithImages({ contentType, docId })`
- `reorderGalleryImages({ contentType, docId, orderedImageIds })`
- `moveGalleryImageFirst({ contentType, docId, imageId })`

## Storage path ที่ใช้
- `news/{docId}/cover/{fileName}`
- `news/{docId}/gallery/{fileName}`
- `promotions/{docId}/cover/{fileName}`
- `promotions/{docId}/gallery/{fileName}`
- `benefits/{docId}/cover/{fileName}`
- `benefits/{docId}/gallery/{fileName}`

## ตัวอย่างเรียกใช้
```js
await uploadCoverImage({
  contentType: 'news',
  docId: 'news_000001',
  file,
});
```

```js
await uploadGalleryImages({
  contentType: 'promotions',
  docId: 'pro_000001',
  files,
});
```
