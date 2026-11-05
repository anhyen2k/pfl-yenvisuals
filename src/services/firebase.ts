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
  where,
  limit,
  getDocFromServer,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type StorageReference,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { validatePackagePrices, isAdminEmail } from '../utils/portfolioLogic';
import {
  decideLeadWriteMode,
  getFirestoreErrorCode,
  isUploadStalled,
  stripUndefinedFields,
  translateCloudError,
  FIRESTORE_DATABASE_ID,
  UPLOAD_FIRST_PROGRESS_TIMEOUT_MS,
  UPLOAD_STALL_TIMEOUT_MS,
} from '../utils/portfolioLogic';
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent,
  validateSiteContent,
  type SiteContent,
} from '../config/content';
import type {
  BookingLead,
  BookingStatus,
  EmailNotificationLog,
  PackagePrices,
  PhotoItem,
  ProofingPhoto,
  ProofingSelection,
  PublicOrder,
} from '../utils/portfolioLogic';
import { PROOFING_QUERY_LIMIT, buildPublicOrder } from '../utils/portfolioLogic';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore with dedicated Database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Firebase Storage — anh dung de luu file anh that (Firestore chi luu link).
// Bucket lay tu firebase-applet-config.json (storageBucket da co san).
export const storage = getStorage(app);

export const MAX_PHOTO_DIMENSION = 1600;
export const PHOTO_JPEG_QUALITY = 0.82;
/** (v7.7) Anh proofing chi de khach chon anh: 1400px JPEG 0.78, nhe hon
 * ~30% so voi 1600px 0.82 ma van du net de chon. Anh portfolio GIU
 * NGUYEN 1600px 0.82, khong doi. */
export const PROOFING_MAX_DIMENSION = 1400;
export const PROOFING_JPEG_QUALITY = 0.78;
// File goc da nho thi khong nen lai: upload thang, vua nhanh vua giu chat luong goc.
export const SKIP_COMPRESS_MAX_BYTES = 600 * 1024;

// --- Toc do tai/xem anh (v6) ---
/** Thumbnail: toi da 600px, WebP 0.75 — luoi Gallery/Proofing load ban nay. */
export const THUMB_MAX_DIMENSION = 600;
export const THUMB_WEBP_QUALITY = 0.75;
/** Cache trinh duyet / CDN 1 nam cho anh da upload (file co ten duy nhat). */
export const STORAGE_CACHE_CONTROL = 'public,max-age=31536000,immutable';

/**
 * Chan ghi admin o phia client (lop phong thu them, truoc ca firestore.rules
 * / storage.rules tren Cloud): chi tai khoan Google anhyenk26@gmail.com
 * moi duoc goi cac ham luu gia / noi dung / proofing / upload anh.
 * Khach (guest) hoac tai khoan Google khac goi se throw ngay, khong cham
 * toi Firestore/Storage. Ham nay KHONG dung cho luu lua chon proofing
 * cua khach (public, xem saveProofingSelection).
 */
export function requireAdmin(): void {
  if (!isAdminEmail(auth.currentUser?.email)) {
    throw new Error('Chỉ quản trị viên (anhyenk26@gmail.com) mới được thực hiện thao tác này. Vui lòng đăng nhập Google bằng tài khoản admin.');
  }
}

/**
 * Tao thumbnail ~600px WebP quality 0.75 tu file/blob goc, dung chung cho
 * anh portfolio + anh proofing. Tra ve null neu khong tao duoc (trinh duyet
 * khong ho tro / anh loi) — ben goi fallback dung anh goc lam thumb.
 */
export async function makeThumbnailBlob(file: File | Blob): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;
  try {
    const { width, height } = bitmap;
    const scale = Math.min(1, THUMB_MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));
    const resized = await createImageBitmap(bitmap, {
      resizeWidth: targetW,
      resizeHeight: targetH,
    }).catch(() => null);
    const source = resized ?? bitmap;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, targetW, targetH);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', THUMB_WEBP_QUALITY));
    if (resized) resized.close();
    // Trinh duyet khong xuat duoc WebP thi toBlob tra null — ben goi fallback.
    return blob;
  } finally {
    bitmap.close();
  }
}

/**
 * Upload 1 blob len 1 duong dan Storage tuy y, co tien do % + cache 1 nam.
 * Dung chung cho anh goc + thumbnail (portfolio + proofing).
 * (v7.6) Watchdog chong ket o 0%: phien resumable co khi khong nhan duoc
 * progress event nao cung khong bao loi (wifi manh van ket) nen promise
 * khong bao gio settle. Neu qua 20s chua co progress event nao, hoac qua
 * 120s khong tien trien giua chung, thi huy phien va thu lai 1 lan bang
 * uploadBytes (PUT 1 lan duy nhat — duong resumable bi chan thi PUT
 * thuong co the qua duoc). Van loi thi nem loi that cho modal hien.
 */
const UPLOAD_STALL_ERROR_CODE = 'upload-stalled';

function isStalledUploadError(error: unknown): boolean {
  return error instanceof Error && (error as { code?: unknown }).code === UPLOAD_STALL_ERROR_CODE;
}

function stalledUploadError(receivedProgress: boolean): Error {
  const err = new Error(
    receivedProgress
      ? 'Tải lên bị kẹt quá 120 giây không tiến triển (kẹt giữa chừng). Kiểm tra mạng rồi thử lại.'
      : 'Không kết nối được tới Firebase Storage trong 20 giây (kẹt ở 0%). Kiểm tra mạng, thử lại, hoặc kiểm tra Storage rules đã deploy chưa.'
  );
  (err as { code?: string }).code = UPLOAD_STALL_ERROR_CODE;
  return err;
}

function runResumableUpload(
  storageRef: StorageReference,
  blob: Blob,
  metadata: { contentType: string; cacheControl: string },
  onProgress?: (percent: number) => void
): Promise<void> {
  const task = uploadBytesResumable(storageRef, blob, metadata);
  const startedAt = Date.now();
  let lastProgressAt = startedAt;
  let receivedProgress = false;
  let settled = false;
  return new Promise<void>((resolve, reject) => {
    const timer = setInterval(() => {
      if (settled) return;
      const timeoutMs = receivedProgress
        ? UPLOAD_STALL_TIMEOUT_MS
        : UPLOAD_FIRST_PROGRESS_TIMEOUT_MS;
      if (isUploadStalled(lastProgressAt, Date.now(), timeoutMs)) {
        settled = true;
        clearInterval(timer);
        task.cancel();
        reject(stalledUploadError(receivedProgress));
      }
    }, 1000);
    task.on(
      'state_changed',
      (snapshot) => {
        lastProgressAt = Date.now();
        receivedProgress = true;
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearInterval(timer);
        reject(err);
      },
      () => {
        if (settled) return;
        settled = true;
        clearInterval(timer);
        resolve();
      }
    );
  });
}

export async function uploadBlobToStorage(
  blob: Blob,
  storagePath: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const metadata = {
    contentType: blob.type || 'image/jpeg',
    cacheControl: STORAGE_CACHE_CONTROL,
  };
  try {
    await runResumableUpload(storageRef, blob, metadata, onProgress);
  } catch (err) {
    if (isStalledUploadError(err)) {
      // Thu lai 1 lan bang PUT 1 lan duy nhat; van loi thi nem loi that.
      await uploadBytes(storageRef, blob, metadata);
    } else {
      throw err;
    }
  }
  return getDownloadURL(storageRef);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = PHOTO_JPEG_QUALITY
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function bitmapToJpeg(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number = PHOTO_JPEG_QUALITY
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, 'image/jpeg', quality);
}

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Nen anh xuong toi da 1600px (giu ti le), JPEG 0.82.
 * - File goc da <=1600px va <=600KB: tra thang file goc, khong nen.
 * - Uu tien resize native cua createImageBitmap (nhanh hon canvas drawImage);
 *   anh rat lon thi ha bac (halve) truoc roi moi resize ve dich, tranh
 *   drawImage 1 lan tu 6000px xuong 1600px bi cham / mo.
 * - Trinh duyet khong ho tro resizeWidth thi fallback canvas nhu cu.
 * Tra ve Blob da nen (hoac chinh file goc neu khong can nen / nen loi).
 * (v7.7) `options` cho phep nen nhe hon cho anh proofing (1400px 0.78).
 */
export async function compressImageFile(
  file: File | Blob,
  options?: CompressOptions
): Promise<Blob> {
  const maxDimension = options?.maxDimension ?? MAX_PHOTO_DIMENSION;
  const quality = options?.quality ?? PHOTO_JPEG_QUALITY;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  // Khai bao ngoai try de finally dong duoc ca bitmap goc va anh da ha bac.
  let source: ImageBitmap = bitmap;
  try {
    const { width, height } = bitmap;
    if (width <= maxDimension && height <= maxDimension && file.size <= SKIP_COMPRESS_MAX_BYTES) {
      return file;
    }
    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    // Buoc 1: ha bac neu can thu nho hon 1/2 (vd 6000px -> 3000px),
    // dung resize native neu trinh duyet ho tro.
    if (scale < 0.5) {
      const halfW = Math.max(targetW, Math.round(width / 2));
      const halfH = Math.max(targetH, Math.round(height / 2));
      const halved = await createImageBitmap(file, {
        resizeWidth: halfW,
        resizeHeight: halfH,
      }).catch(() => null);
      if (halved) {
        source = halved;
      }
    }

    // Buoc 2: resize ve kich thuoc dich. Uu tien resize native tren source
    // (la file goc hoac anh da ha bac); neu khong ho tro thi dung canvas.
    if (source === bitmap) {
      const resized = await createImageBitmap(file, {
        resizeWidth: targetW,
        resizeHeight: targetH,
      }).catch(() => null);
      if (resized) {
        // Anh da dung kich thuoc dich: chuyen sang JPEG qua canvas nho
        // (khong ve lai, chi doi dinh dang) — canvas 1600px nay re hon
        // nhieu so voi ve tu anh goc 6000px.
        const out = await bitmapToJpeg(resized, targetW, targetH, quality);
        resized.close();
        if (out) return out;
      }
    } else {
      const resized = await createImageBitmap(source, {
        resizeWidth: targetW,
        resizeHeight: targetH,
      }).catch(() => null);
      if (resized) {
        const out = await bitmapToJpeg(resized, targetW, targetH, quality);
        resized.close();
        if (out) return out;
      }
    }

    // Fallback: canvas drawImage tu source (anh goc hoac anh da ha bac).
    const out = await bitmapToJpeg(source, targetW, targetH, quality);
    if (out) return out;
    return file;
  } finally {
    if (source !== bitmap) source.close();
    bitmap.close();
  }
}

/**
 * Upload 1 blob (thuong la blob da nen san bang compressImageFile) len
 * Storage, tra ve downloadURL. Dung uploadBytesResumable de co tien do %
 * va tu tiep tuc khi mang dut giua chung, thay vi uploadBytes 1 lan.
 * Ten file giu nguyen nhu cu: portfolio_photos/<photoId>.<ext>.
 * Chi admin duoc upload (requireAdmin) + cache 1 nam (v6).
 */
export async function uploadCompressedPhoto(
  blob: Blob,
  photoId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  requireAdmin();
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  return uploadBlobToStorage(blob, `portfolio_photos/${photoId}.${ext}`, onProgress);
}

/**
 * (v6) Upload anh portfolio kem thumbnail: anh lon 1600px JPEG 0.82 +
 * thumb ~600px WebP. Tra ve { url, thumbUrl } — thumb tao loi thi
 * thumbUrl = url (fallback, Gallery van hien anh goc).
 * Luu thumbUrl vao doc portfolio_photos de Gallery load thumb truoc.
 * (v7.7) Thumbnail lam tu blob DA NEN (1600px) thay vi giai nen lai
 * file goc 6000px; anh lon + thumb tai SONG SONG (Promise.all) thay
 * vi noi tiep — tien do = 80% anh lon + 20% thumb.
 */
export async function uploadPhotoWithThumbnail(
  file: File,
  photoId: string,
  onProgress?: (percent: number) => void,
  /** Blob da nen san tu luc chon file (AddPhotoModal); co thi khong nen lai. */
  precompressed?: Blob | null
): Promise<{ url: string; thumbUrl: string }> {
  requireAdmin();
  const compressed = precompressed ?? (await compressImageFile(file));
  let mainPct = 0;
  let thumbPct = 0;
  const reportProgress = () => {
    onProgress?.(Math.round(mainPct * 0.8 + thumbPct * 0.2));
  };
  const uploadMain = uploadCompressedPhoto(compressed, photoId, (pct) => {
    mainPct = pct;
    reportProgress();
  });
  const uploadThumb = (async () => {
    try {
      // (v7.7) Lam thumb tu blob da nen — re hon nhieu so voi giai nen
      // lai file goc; thumb loi thi dung anh goc thay the.
      const thumbBlob = await makeThumbnailBlob(compressed);
      if (!thumbBlob) return null;
      return await uploadBlobToStorage(
        thumbBlob,
        `portfolio_photos/${photoId}_thumb.webp`,
        (pct) => {
          thumbPct = pct;
          reportProgress();
        }
      );
    } catch (err) {
      console.warn('Thumbnail upload warning (dung anh goc thay the):', err);
      return null;
    }
  })();
  const [url, thumbUrl] = await Promise.all([uploadMain, uploadThumb]);
  onProgress?.(100);
  return { url, thumbUrl: thumbUrl ?? url };
}

/**
 * Nen anh xuong toi da 1600px (giu ti le) roi upload len Storage, tra ve downloadURL.
 * KHONG luu base64 vao Firestore nua — Firestore gioi han truong image 50.000 ky tu.
 * Neu Storage chua deploy rules / upload loi thi throw, de giao dien bao loi ro
 * cho admin thay vi luu lang local roi tuong da len cloud.
 * Luu y: modal nen goi compressImageFile() ngay khi chon file va
 * uploadCompressedPhoto() khi bam Luu de spinner chi con upload; ham nay
 * (nen + upload lien nhau) giu lai cho cac cho goi cu / truong hop chua nen san.
 */
export async function uploadPhotoToStorage(
  file: File,
  photoId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const blob = await compressImageFile(file);
  return uploadCompressedPhoto(blob, photoId, onProgress);
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
  // (v7.6) Giu lai ma loi (permission-denied...) trong errInfo de banner
  // hien duoc ly do that — truoc day chi co message tieng Anh chung chung
  // ("Missing or insufficient permissions") nen khong dich duoc.
  const errInfo: FirestoreErrorInfo & { code: string } = {
    error: error instanceof Error ? error.message : String(error),
    code: getFirestoreErrorCode(error),
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
 * (v7.6) Don chi co tren may Yen (chua tung len Cloud) ma ghi bang setDoc
 * merge se bi rule tinh la CREATE va phai qua validate isValidBookingLead
 * (vd email trong / groupSize sai kieu la bi chan). Kiem tra doc da ton
 * tai chua: co roi thi updateDoc (rule update chi can admin), chua co thi
 * setDoc nhu cu. Loai bo field undefined truoc khi ghi (Firestore nem
 * loi ca o setDoc merge lan updateDoc neu gap undefined).
 */
export async function saveBookingLeadToCloud(lead: BookingLead): Promise<void> {
  const path = 'booking_leads';
  const ref = doc(db, path, lead.id);
  try {
    const snap = await getDoc(ref);
    const data = stripUndefinedFields(lead as unknown as Record<string, unknown>);
    if (decideLeadWriteMode(snap.exists()) === 'update') {
      await updateDoc(ref, data);
    } else {
      await setDoc(ref, data, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${lead.id}`);
  }
}

/**
 * (v7.6) Tu chan doan ket noi Cloud cho Dashboard (tab Cai dat): kiem tra
 * da dang nhap Google chua, roi test that ca Firestore lan Storage.
 * KHONG ghi du lieu that len Cloud khi kiem tra — file test Storage duoc
 * xoa ngay sau khi up. Tra ve ket qua rieng tung muc de Yen biet dung
 * cho nao hong (rules Firestore hay rules Storage).
 */
export interface CloudDiagnosis {
  ok: boolean;
  firestore: string;
  storage: string;
}

/** Cho 1 promise chay toi da ms — qua han thi reject voi ma code cho truoc. */
function withTimeout<T>(promise: Promise<T>, ms: number, code: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`Timed out after ${ms}ms`);
      (err as { code?: string }).code = code;
      reject(err);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Test Storage that: up 1 blob nho (1KB text) len duong dan tam
 * `diagnostics/test-<timestamp>.txt` roi xoa ngay. Can rule
 * `diagnostics/{fileName}` trong storage.rules (chi admin ghi/xoa). */
async function testStorageConnection(): Promise<{ ok: boolean; message: string }> {
  const testRef = ref(storage, `diagnostics/test-${Date.now()}.txt`);
  const blob = new Blob(['yen-photo-test'], { type: 'text/plain' });
  try {
    await withTimeout(uploadBytes(testRef, blob), 15000, UPLOAD_STALL_ERROR_CODE);
    try {
      await deleteObject(testRef);
    } catch {
      // Bo qua loi xoa file test — up duoc la da du ket luan Storage OK.
    }
    return { ok: true, message: 'Storage: OK — tải thử 1KB và xoá file test thành công.' };
  } catch (error) {
    if (isStalledUploadError(error)) {
      return {
        ok: false,
        message:
          'Storage: Lỗi (kẹt) — Không kết nối được tới Storage trong 15 giây. Thử đổi wifi/4G hoặc tắt VPN rồi kiểm tra lại.',
      };
    }
    return { ok: false, message: `Storage: Lỗi — ${translateCloudError(error)}` };
  }
}

export async function diagnoseCloudConnection(): Promise<CloudDiagnosis> {
  const user = auth.currentUser;
  if (!user) {
    const msg =
      'Chưa đăng nhập Google (unauthenticated): đăng nhập lại bằng anhyenk26@gmail.com rồi thử lại.';
    return { ok: false, firestore: `Firestore: Lỗi — ${msg}`, storage: `Storage: Lỗi — ${msg}` };
  }
  let firestore: { ok: boolean; message: string };
  try {
    await getDocFromServer(doc(db, 'settings', 'pricing'));
    firestore = {
      ok: true,
      message: `Firestore: OK — đã đăng nhập: ${user.email || '(không rõ email)'}, đọc được settings/pricing từ database ${FIRESTORE_DATABASE_ID}.`,
    };
  } catch (error) {
    firestore = { ok: false, message: `Firestore: Lỗi — ${translateCloudError(error)}` };
  }
  const storage = await testStorageConnection();
  return { ok: firestore.ok && storage.ok, firestore: firestore.message, storage: storage.message };
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

// --- Bang gia goi (settings/pricing) ---
// Doc `settings/pricing` luu { prices: PackagePrices, updatedAt, updatedBy }.
// Public duoc doc (khach xem gia), chi admin duoc ghi (xem firestore.rules).

function isCompletePackagePrices(value: unknown): value is PackagePrices {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p['aodai-solo'] === 'number' &&
    typeof p['kiyieu-lop'] === 'number' &&
    typeof p['cophuc-heritage'] === 'number' &&
    typeof p['photobook-print'] === 'number' &&
    typeof p.extraPerPerson === 'number'
  );
}

/**
 * Doc bang gia hien tai, hoac null neu chua co doc / du lieu khong hop le.
 */
export async function loadPackagePrices(): Promise<PackagePrices | null> {
  const snap = await getDoc(doc(db, 'settings', 'pricing'));
  if (!snap.exists()) return null;
  const prices = (snap.data() as Record<string, unknown>).prices;
  if (!isCompletePackagePrices(prices)) return null;
  if (validatePackagePrices(prices).length > 0) return null;
  return prices;
}

export interface PackagePricesMeta {
  prices: PackagePrices;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * Doc bang gia kem thoi gian luu lan cuoi (de Dashboard hien "Luu lan cuoi").
 */
export async function loadPackagePricesMeta(): Promise<PackagePricesMeta | null> {
  const snap = await getDoc(doc(db, 'settings', 'pricing'));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  const prices = data.prices;
  if (!isCompletePackagePrices(prices)) return null;
  if (validatePackagePrices(prices).length > 0) return null;
  return {
    prices,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
  };
}

/**
 * Luu bang gia goi (chi admin goi; requireAdmin chan truoc o client,
 * firestore.rules chan lai tren Cloud).
 */
export async function savePackagePrices(prices: PackagePrices): Promise<void> {
  requireAdmin();
  await setDoc(
    doc(db, 'settings', 'pricing'),
    {
      prices,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || '',
    },
    { merge: true }
  );
}

/**
 * Lang nghe bang gia goi theo thoi gian thuc. Chi goi cb khi doc ton tai
 * va du lieu day du + hop le (validatePackagePrices khong loi).
 * Tra ve ham unsubscribe.
 */
export function subscribeToPackagePrices(cb: (p: PackagePrices) => void): () => void {
  return onSnapshot(
    doc(db, 'settings', 'pricing'),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const prices = (snapshot.data() as Record<string, unknown>).prices;
      if (!isCompletePackagePrices(prices)) return;
      if (validatePackagePrices(prices).length > 0) return;
      cb(prices);
    },
    (error) => {
      console.warn('Package prices subscription warning:', error);
      // KHONG throw trong callback onSnapshot: loi se thanh uncaught exception.
    }
  );
}


// --- Noi dung giao dien (v6, theo dung mau settings/pricing) ---
// Doc `settings/content` luu { content: SiteContent, updatedAt, updatedBy }.
// Public duoc doc (khach xem web), chi admin duoc ghi (requireAdmin o day
// + firestore.rules tren Cloud). Cache localStorage `yen_photo_site_content`
// de mo trang van hien noi dung ngay ca khi chua tai xong Cloud.
export const SITE_CONTENT_CACHE_KEY = 'yen_photo_site_content';
export const SITE_CONTENT_UPDATED_AT_KEY = 'yen_photo_site_content_updated_at';

export function loadCachedSiteContent(): SiteContent {
  try {
    const saved = localStorage.getItem(SITE_CONTENT_CACHE_KEY);
    if (saved) return mergeSiteContent(JSON.parse(saved));
  } catch (e) {
    console.warn('Failed to parse cached site content', e);
  }
  return { ...DEFAULT_SITE_CONTENT, packageDescriptions: { ...DEFAULT_SITE_CONTENT.packageDescriptions } };
}

/** Doc noi dung hien tai, hoac null neu chua co doc / du lieu khong hop le. */
export async function loadSiteContent(): Promise<SiteContent | null> {
  const snap = await getDoc(doc(db, 'settings', 'content'));
  if (!snap.exists()) return null;
  const content = (snap.data() as Record<string, unknown>).content;
  if (!content || typeof content !== 'object') return null;
  if (validateSiteContent(content).length > 0) return null;
  return mergeSiteContent(content);
}

export interface SiteContentMeta {
  content: SiteContent;
  updatedAt?: string;
  updatedBy?: string;
}

/** Doc noi dung kem thoi gian luu lan cuoi (de Dashboard hien "Luu lan cuoi"). */
export async function loadSiteContentMeta(): Promise<SiteContentMeta | null> {
  const snap = await getDoc(doc(db, 'settings', 'content'));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  const content = data.content;
  if (!content || typeof content !== 'object') return null;
  if (validateSiteContent(content).length > 0) return null;
  return {
    content: mergeSiteContent(content),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
  };
}

/**
 * Luu noi dung giao dien (CHI ADMIN; requireAdmin throw ngay neu khong
 * phai anhyenk26@gmail.com — Dashboard goi ham nay qua App, va App kiem
 * tra lai userRole truoc khi goi).
 */
export async function saveSiteContent(content: SiteContent): Promise<void> {
  requireAdmin();
  const errors = validateSiteContent(content);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
  await setDoc(
    doc(db, 'settings', 'content'),
    {
      content: mergeSiteContent(content),
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || '',
    },
    { merge: true }
  );
}

/**
 * Lang nghe noi dung giao dien theo thoi gian thuc. Chi goi cb khi doc ton
 * tai va du lieu hop le. Tra ve ham unsubscribe.
 */
export function subscribeToSiteContent(cb: (c: SiteContent) => void): () => void {
  return onSnapshot(
    doc(db, 'settings', 'content'),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const content = (snapshot.data() as Record<string, unknown>).content;
      if (!content || typeof content !== 'object') return;
      if (validateSiteContent(content).length > 0) return;
      cb(mergeSiteContent(content));
    },
    (error) => {
      console.warn('Site content subscription warning:', error);
    }
  );
}

// --- Proofing theo tung don (v6) ---
// Collection `proofing_photos` (1 doc / 1 anh), `proofing_selections`
// (1 doc / 1 ma don, id = leadId). Rules (firestore.rules):
// - proofing_photos: public read, CHI ADMIN write.
// - proofing_selections: public chi doc dung doc theo ma minh nhap (get,
//   KHONG list), create/update neu leadId trong du lieu == id doc;
//   delete + list chi admin. Khach khong doc duoc lua chon cua don khac
//   vi khong list duoc va khong biet ma don do.
// - booking_leads KHONG mo read cong khai: khach xac minh bang ma don +
//   4 so cuoi SDT luu kem moi anh proofing (phoneSuffix).

function toProofingPhoto(id: string, data: Record<string, unknown>): ProofingPhoto {
  return {
    id,
    leadId: typeof data.leadId === 'string' ? data.leadId : '',
    url: typeof data.url === 'string' ? data.url : '',
    thumbUrl: typeof data.thumbUrl === 'string' ? data.thumbUrl : undefined,
    order: typeof data.order === 'number' ? data.order : 0,
    phoneSuffix: typeof data.phoneSuffix === 'string' ? data.phoneSuffix : '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
  };
}

/**
 * Tai anh proofing cua 1 don: query where leadId == ma (chu hoa), order
 * theo `order`, limit 50. Neu Firestore bao thieu composite index
 * (failed-precondition) thi fallback: query khong orderBy roi sap xep
 * o client — anh van hien dung thu tu, Yen tao index theo link trong
 * thong bao loi Firebase Console khi ranh (xem PAGES-NOTES-V6.md).
 */
export async function fetchProofingPhotos(leadId: string): Promise<ProofingPhoto[]> {
  const code = (leadId || '').trim().toUpperCase();
  const col = collection(db, 'proofing_photos');
  try {
    const q = query(col, where('leadId', '==', code), orderBy('order'), limit(PROOFING_QUERY_LIMIT));
    const snap = await getDocs(q);
    const items: ProofingPhoto[] = [];
    snap.forEach((d) => items.push(toProofingPhoto(d.id, d.data() as Record<string, unknown>)));
    return items;
  } catch (err: any) {
    if (err?.code !== 'failed-precondition') throw err;
    console.warn('Proofing query can composite index, dung fallback sap xep o client:', err?.message);
    const snap = await getDocs(query(col, where('leadId', '==', code), limit(PROOFING_QUERY_LIMIT)));
    const items: ProofingPhoto[] = [];
    snap.forEach((d) => items.push(toProofingPhoto(d.id, d.data() as Record<string, unknown>)));
    items.sort((a, b) => a.order - b.order);
    return items;
  }
}

/** Luu 1 doc anh proofing (chi admin; goi sau khi upload file len Storage). */
export async function saveProofingPhotoToCloud(photo: ProofingPhoto): Promise<void> {
  requireAdmin();
  await setDoc(doc(db, 'proofing_photos', photo.id), photo, { merge: true });
}

/**
 * (v6) Upload 1 anh proofing cho 1 don: nen ve 1400px JPEG 0.78 + thumb
 * ~600px WebP, up len Storage `proofing/<LEADID>/<photoId>.jpg` (+ thumb
 * `_thumb.webp`), cache 1 nam, ghi doc Firestore kem phoneSuffix.
 * Tra ve ProofingPhoto da luu. Chi admin duoc goi.
 * (v7.7) Nhan them blob da nen san tu luc chon file (ProofingManager nen
 * truoc, song song toi da 4 file); thumb lam tu blob da nen; anh lon +
 * thumb tai SONG SONG (Promise.all) — tien do = 80% anh lon + 20% thumb.
 */
export async function uploadProofingPhoto(
  file: File,
  leadId: string,
  phoneSuffix: string,
  order: number,
  onProgress?: (percent: number) => void,
  /** Blob da nen san tu luc chon file (ProofingManager); co thi khong nen lai. */
  precompressed?: Blob | null
): Promise<ProofingPhoto> {
  requireAdmin();
  const code = (leadId || '').trim().toUpperCase();
  const photoId = `proof-${code}-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`;
  const compressed =
    precompressed ??
    (await compressImageFile(file, {
      maxDimension: PROOFING_MAX_DIMENSION,
      quality: PROOFING_JPEG_QUALITY,
    }));
  const ext = compressed.type === 'image/png' ? 'png' : 'jpg';
  let mainPct = 0;
  let thumbPct = 0;
  const reportProgress = () => {
    onProgress?.(Math.round(mainPct * 0.8 + thumbPct * 0.2));
  };
  const uploadMain = uploadBlobToStorage(
    compressed,
    `proofing/${code}/${photoId}.${ext}`,
    (pct) => {
      mainPct = pct;
      reportProgress();
    }
  );
  const uploadThumb = (async () => {
    try {
      const thumbBlob = await makeThumbnailBlob(compressed);
      if (!thumbBlob) return null;
      return await uploadBlobToStorage(
        thumbBlob,
        `proofing/${code}/${photoId}_thumb.webp`,
        (pct) => {
          thumbPct = pct;
          reportProgress();
        }
      );
    } catch (err) {
      console.warn('Proofing thumbnail upload warning (dung anh goc thay the):', err);
      return null;
    }
  })();
  const [url, thumbUrl] = await Promise.all([uploadMain, uploadThumb]);
  onProgress?.(100);
  const photo: ProofingPhoto = {
    id: photoId,
    leadId: code,
    url,
    thumbUrl: thumbUrl ?? url,
    order,
    phoneSuffix: (phoneSuffix || '').replace(/[^0-9]/g, '').slice(-4),
    createdAt: new Date().toISOString(),
  };
  await saveProofingPhotoToCloud(photo);
  return photo;
}

/**
 * Xoa 1 anh proofing: xoa doc Firestore + file goc + thumb tren Storage.
 * File da mat truoc do thi coi nhu xoa xong. Chi admin duoc goi.
 */
export async function deleteProofingPhoto(photo: ProofingPhoto): Promise<void> {
  requireAdmin();
  await deleteDoc(doc(db, 'proofing_photos', photo.id));
  const base = `proofing/${photo.leadId}/${photo.id}`;
  for (const path of [`${base}.jpg`, `${base}.png`, `${base}_thumb.webp`]) {
    try {
      await deleteObject(ref(storage, path));
    } catch (err: any) {
      if (err?.code === 'storage/object-not-found') continue;
      console.warn('Proofing storage delete warning:', path, err);
    }
  }
}

/** Doc lua chon cua khach cho 1 don (null neu khach chua gui). */
export async function loadProofingSelection(leadId: string): Promise<ProofingSelection | null> {
  const code = (leadId || '').trim().toUpperCase();
  const snap = await getDoc(doc(db, 'proofing_selections', code));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    leadId: code,
    selectedIds: Array.isArray(data.selectedIds) ? (data.selectedIds as string[]) : [],
    ratings: (data.ratings as Record<string, number>) || {},
    notes: (data.notes as Record<string, string>) || {},
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  };
}

/**
 * Khach gui lua chon len Cloud. Day la ham PUBLIC (khach khong dang nhap):
 * ghi doc co id = ma don, kem leadId == id doc — firestore.rules chi cho
 * create/update khi 2 gia tri nay khop, cam list/delete. KHONG goi
 * requireAdmin o day.
 */
export async function saveProofingSelection(selection: ProofingSelection): Promise<void> {
  const code = (selection.leadId || '').trim().toUpperCase();
  if (!code) throw new Error('Thiếu mã đơn.');
  await setDoc(
    doc(db, 'proofing_selections', code),
    {
      leadId: code,
      selectedIds: selection.selectedIds,
      ratings: selection.ratings,
      notes: selection.notes,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// --- Tra cuu don moi may (v7.5) ---
// Collection `public_orders` (1 doc / 1 ma don, id = lead.id): chi chua
// truong toi thieu de tra cuu (xem buildPublicOrder — KHONG co email,
// notes, message, cancelReason). Rules (firestore.rules):
// - public: chi get 1 doc theo ma (KHONG list) + doi chieu SDT o client;
// - create/update/delete: CHI ADMIN.
// Ghi: App goi savePublicOrder moi khi don duoc tao/cap nhat; doc:
// ContactSection goi fetchPublicOrder khi khong tim thay don trong leads
// cuc bo. PHAI deploy lai firestore.rules thi tra cuu moi may moi chay.

/**
 * Ghi / cap nhat ban ghi tra cuu cong khai cua 1 don (chi admin).
 * Dung setDoc merge, doc id = ma don (vd KY-12345).
 */
export async function savePublicOrder(lead: BookingLead): Promise<void> {
  requireAdmin();
  const order = buildPublicOrder(lead);
  await setDoc(doc(db, 'public_orders', order.id), order, { merge: true });
}

/** Xoa ban ghi tra cuu cong khai khi xoa don (chi admin). */
export async function deletePublicOrder(leadId: string): Promise<void> {
  requireAdmin();
  await deleteDoc(doc(db, 'public_orders', (leadId || '').trim().toUpperCase()));
}

/**
 * Doc 1 ban ghi tra cuu theo ma don (public get — khach khong dang nhap
 * van doc duoc 1 doc khi biet ma; KHONG list duoc). Tra ve null neu doc
 * khong ton tai. Ben goi PHAI doi chieu SDT bang matchesPublicOrderPhone
 * truoc khi hien ket qua — khong hien gi chi vi doc ton tai.
 */
export async function fetchPublicOrder(orderId: string): Promise<PublicOrder | null> {
  const code = (orderId || '').trim().toUpperCase();
  if (!code) return null;
  const snap = await getDoc(doc(db, 'public_orders', code));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    id: typeof data.id === 'string' && data.id ? data.id : code,
    clientName: typeof data.clientName === 'string' ? data.clientName : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    packageType: (typeof data.packageType === 'string' ? data.packageType : 'aodai-solo') as PublicOrder['packageType'],
    status: (typeof data.status === 'string' ? data.status : 'new') as PublicOrder['status'],
    preferredDate: typeof data.preferredDate === 'string' ? data.preferredDate : '',
    timeSlot: typeof data.timeSlot === 'string' ? data.timeSlot : undefined,
    estimatedPrice: typeof data.estimatedPrice === 'number' ? data.estimatedPrice : 0,
    depositAmount: typeof data.depositAmount === 'number' ? data.depositAmount : 0,
    paidAmount: typeof data.paidAmount === 'number' ? data.paidAmount : 0,
    balance: typeof data.balance === 'number' ? data.balance : 0,
    driveLink: typeof data.driveLink === 'string' ? data.driveLink : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  };
}

/**
 * Dong bo lai tra cuu cho TOAN BO don hien co (chi admin): ghi de tung
 * lead len `public_orders` 1 lan — de cac don tao truoc v7.5 cung tra
 * duoc moi may. Tra ve so don da dong bo thanh cong; don nao loi thi
 * bo qua (ghi console) chu khong dung ca loat.
 */
export async function syncAllPublicOrders(leads: BookingLead[]): Promise<number> {
  requireAdmin();
  let synced = 0;
  for (const lead of leads) {
    try {
      await savePublicOrder(lead);
      synced += 1;
    } catch (err) {
      console.warn('Sync public order warning:', lead.id, err);
    }
  }
  return synced;
}
