import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../lib/firebase/storage";
import { firebaseEnabled } from "../lib/firebase/config";

export async function uploadContentImage(options: {
  file: File;
  contentType: "news" | "promotions" | "benefits";
  docId: string;
  slot: "cover" | "banner" | "detail" | "icon";
}): Promise<string> {
  if (!firebaseEnabled || !storage) {
    return Promise.resolve(URL.createObjectURL(options.file));
  }

  const extension = options.file.name.split(".").pop() || "jpg";
  const path = `resident-content/${options.contentType}/${options.docId}/${options.slot}-${Date.now()}.${extension}`;
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, options.file, {
    contentType: options.file.type,
  });
  return getDownloadURL(snapshot.ref);
}
