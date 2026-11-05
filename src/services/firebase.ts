import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  BookingLead,
  BookingStatus,
  EmailNotificationLog,
  PhotoItem,
} from '../utils/portfolioLogic';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with dedicated Database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Firebase Storage — anh dung de luu file anh that (Firestore chi luu link).
// Bucket lay tu firebase-applet-config.json (storageBucket da co san).
export const storage = getStorage(app);

/**
 * Nen anh xuong toi da 1600px (giu ti le) roi upload len Storage, tra ve downloadURL.
 * KHONG luu base64 vao Firestore nua — Firestore gioi han truong image 50.000 ky tu.
 * Neu Storage chua deploy rules / upload loi thi throw, de giao dien bao loi ro
 * cho admin thay vi luu lang local roi tuong da len cloud.
 */
export async function uploadPhotoToStorage(file: File, photoId: string): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  let blob: Blob = file;
  if (bitmap) {
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      if (out) blob = out;
    }
    bitmap.close();
  }
  // Phan mo rong theo dinh dang that cua blob sau khi nen (anh nen ra JPEG
  // thi phai la .jpg, khong duoc ghi .png nhu file goc).
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const storageRef = ref(storage, `portfolio_photos/${photoId}.${ext}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}


// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot per skill directive
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or reconnecting.');
    }
  }
}
testFirestoreConnection();

/**
 * Saves a new booking lead permanently to Cloud Firestore
 */
export async function saveBookingLeadToCloud(lead: BookingLead): Promise<void> {
  const path = 'booking_leads';
  try {
    await setDoc(doc(db, path, lead.id), lead, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${lead.id}`);
  }
}

export { onAuthStateChanged, type User };

/**
 * Real-time subscription to photoshoot booking leads for Admin
 */
export function subscribeToBookingLeads(
  onLeads: (leads: BookingLead[]) => void,
  onError?: (error: unknown) => void
): () => void {
  // CRITICAL per Firebase integration guidelines:
  // Only attach onSnapshot listeners if auth is ready and user is authenticated
  if (!auth.currentUser) {
    return () => {};
  }
  const path = 'booking_leads';
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: BookingLead[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as BookingLead);
      });
      // Sort newest first by createdAt or ID
      items.sort((a, b) => (b.id > a.id ? 1 : -1));
      onLeads(items);
    },
    (error) => {
      console.error('Failed to listen to booking leads:', error);
      if (onError) onError(error);
      // KHONG throw trong callback onSnapshot: loi se thanh uncaught exception.
    }
  );
}

/**
 * Updates lead workflow status in Cloud Firestore
 */
export async function updateLeadStatusInCloud(
  leadId: string,
  newStatus: BookingStatus
): Promise<void> {
  const path = `booking_leads/${leadId}`;
  try {
    await updateDoc(doc(db, 'booking_leads', leadId), {
      status: newStatus,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a booking lead from Cloud Firestore
 */
export async function deleteBookingLeadFromCloud(leadId: string): Promise<void> {
  const path = `booking_leads/${leadId}`;
  try {
    await deleteDoc(doc(db, 'booking_leads', leadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Saves an email notification log into Cloud Firestore
 */
export async function saveEmailLogToCloud(log: EmailNotificationLog): Promise<void> {
  const path = 'email_logs';
  try {
    await setDoc(doc(db, path, log.id), log, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${log.id}`);
  }
}

/**
 * Real-time subscription to email logs for Admin
 */
export function subscribeToEmailLogs(
  onLogs: (logs: EmailNotificationLog[]) => void,
  onError?: (error: unknown) => void
): () => void {
  // CRITICAL per Firebase integration guidelines:
  // Only attach onSnapshot listeners if auth is ready and user is authenticated
  if (!auth.currentUser) {
    return () => {};
  }
  const path = 'email_logs';
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: EmailNotificationLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as EmailNotificationLog);
      });
      items.sort((a, b) => (b.id > a.id ? 1 : -1));
      onLogs(items);
    },
    (error) => {
      console.error('Failed to listen to email logs:', error);
      if (onError) onError(error);
      // KHONG throw trong callback onSnapshot: loi se thanh uncaught exception.
    }
  );
}

/**
 * Photographer Google Login
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Photographer Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Saves or updates a portfolio photo in Cloud Firestore
 */
export async function savePhotoToCloud(photo: PhotoItem): Promise<void> {
  const path = 'portfolio_photos';
  try {
    await setDoc(doc(db, path, photo.id), photo, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${photo.id}`);
  }
}

/**
 * Updates partial photo information in Cloud Firestore
 */
export async function updatePhotoInCloud(
  photoId: string,
  updates: Partial<PhotoItem>
): Promise<void> {
  const path = `portfolio_photos/${photoId}`;
  try {
    await updateDoc(doc(db, 'portfolio_photos', photoId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes a portfolio photo permanently from Cloud Firestore
 */
export async function deletePhotoFromCloud(photoId: string): Promise<void> {
  const path = `portfolio_photos/${photoId}`;
  try {
    await deleteDoc(doc(db, 'portfolio_photos', photoId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to portfolio photos (public read permitted)
 */
export function subscribeToPortfolioPhotos(
  onPhotos: (photos: PhotoItem[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = 'portfolio_photos';
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PhotoItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as PhotoItem);
      });
      // Sort photos by ID or order
      items.sort((a, b) => a.id.localeCompare(b.id));
      onPhotos(items);
    },
    (error) => {
      console.warn('Portfolio photos subscription warning:', error);
      if (onError) onError(error);
      // KHONG throw trong callback onSnapshot: loi se thanh uncaught exception.
    }
  );
}

/**
 * Xoá file gốc trên Firebase Storage khi xoá ảnh (tránh file mồ côi).
 * Chỉ xử lý URL Storage thật; ảnh SVG mẫu / URL ngoài thì bỏ qua.
 * File đã mất trước đó thì coi như xoá xong, không throw.
 */
export async function deletePhotoFromStorage(imageUrl: string): Promise<void> {
  if (
    !imageUrl ||
    (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.startsWith('gs://'))
  ) {
    return;
  }
  try {
    await deleteObject(ref(storage, imageUrl));
  } catch (err: any) {
    if (err?.code === 'storage/object-not-found') return;
    throw err;
  }
}

/**
 * Ensures initial curated portfolio photos are stored in Cloud Firestore if collection is empty
 */
export async function seedPortfolioPhotosIfEmpty(initialPhotos: PhotoItem[]): Promise<void> {
  const path = 'portfolio_photos';
  try {
    const snapshot = await getDocs(collection(db, path));
    if (snapshot.empty) {
      for (const photo of initialPhotos) {
        await setDoc(doc(db, path, photo.id), photo);
      }
    }
  } catch (error) {
    console.warn('Seed photos check warning:', error);
  }
}

/**
 * Seed cac anh mau con thieu len Cloud (chi admin goi, xem App).
 * Khac seedPortfolioPhotosIfEmpty (chi chay khi collection rong): ham nay
 * them tung anh mau chua co, nen anh Yen them truoc do khong bi mat va
 * anh mau cung khong bien mat khoi gallery khi cloud da co anh.
 * Chi chay 1 lan / trinh duyet (co localStorage o App) de khong hoi sinh
 * anh Yen da chu dong xoa.
 */
export async function seedMissingPortfolioPhotos(initialPhotos: PhotoItem[]): Promise<void> {
  const path = 'portfolio_photos';
  for (const photo of initialPhotos) {
    const snap = await getDoc(doc(db, path, photo.id));
    if (!snap.exists()) {
      await setDoc(doc(db, path, photo.id), photo);
    }
  }
}

