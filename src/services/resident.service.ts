import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, firebaseEnabled } from "../lib/firebase/config";
import { mapPointTransaction, mapResidentProfile } from "../lib/mappers/resident.mapper";
import { mockPointTransactions, mockResidentProfile } from "../lib/mock-data/resident";
import type { PointTransaction, ResidentProfile } from "../lib/types/resident";

export async function getResidentProfileByMemberId(
  memberId: string
): Promise<ResidentProfile | null> {
  if (!firebaseEnabled || !db) {
    return memberId === mockResidentProfile.memberId ? mockResidentProfile : null;
  }

  const q = query(
    collection(db, "resident_members"),
    where("memberId", "==", memberId)
  );
  const snapshot = await getDocs(q);
  const first = snapshot.docs[0];
  if (!first) return null;
  return mapResidentProfile(first.id, first.data());
}

export async function getResidentProfileByUid(
  uid: string
): Promise<ResidentProfile | null> {
  if (!firebaseEnabled || !db) {
    return mockResidentProfile;
  }

  const residentRef = doc(db, "resident_members", uid);
  const snap = await getDoc(residentRef);
  if (!snap.exists()) return null;
  return mapResidentProfile(snap.id, snap.data());
}

export async function getResidentTransactions(
  memberId: string
): Promise<PointTransaction[]> {
  if (!firebaseEnabled || !db) {
    return mockPointTransactions.filter((item) => item.memberId === memberId);
  }

  const q = query(
    collection(db, "resident_transactions"),
    where("memberId", "==", memberId),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) =>
    mapPointTransaction(item.id, item.data())
  );
}
