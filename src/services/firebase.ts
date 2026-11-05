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
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
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
      handleFirestoreError(error, OperationType.LIST, path);
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
      handleFirestoreError(error, OperationType.LIST, path);
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
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
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

