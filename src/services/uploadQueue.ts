/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// (v7.7) Hang doi tai anh nen — de Yen bam Luu xong khong phai doi:
// anh hien ngay trong Gallery (optimistic UI), viec tai len Storage +
// ghi Firestore chay ngam o day, toi da 4 job cung luc, moi job tu
// thu lai toi da 3 lan. Queue song o cap App (singleton) nen dong modal
// hay chuyen tab trong web cung khong mat job; tat tab trinh duyet thi
// job dang chay se mat (blob anh chi co trong bo nho) — anh chua dong bo
// xong se khong tu hien lai sau khi tai lai trang.

export const MAX_CONCURRENT_UPLOADS = 4;
export const MAX_UPLOAD_ATTEMPTS = 3;
/** Cho giua cac lan thu lai: lan 2 sau 2s, lan 3 sau 5s. */
export const UPLOAD_RETRY_DELAYS_MS = [2000, 5000];

export type UploadJobStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadJob {
  id: string;
  /** Ten hien tren chip tien do (vd ten file). */
  label: string;
  status: UploadJobStatus;
  /** 0-100, chi co y nghia khi dang uploading. */
  progress: number;
  /** So lan da chay (tinh ca lan dang chay). */
  attempts: number;
  /** Thong bao loi da dich tieng Viet (chi khi status = 'error'). */
  error?: string;
  /** Cong viec that: goi onProgress de bao %; throw khi loi. */
  run: (onProgress: (pct: number) => void) => Promise<void>;
  /** Goi 1 lan khi job chay xong (sau lan thu cuoi neu thanh cong). */
  onDone?: () => void;
  /** Goi 1 lan khi job loi het 3 lan thu (khong goi giua cac lan thu). */
  onError?: (error: unknown) => void;
}

/** Job dang chay (uploading) + job dang cho co duoc chay tiep khong. */
export function selectJobsToStart(
  jobs: UploadJob[],
  maxConcurrent: number = MAX_CONCURRENT_UPLOADS
): UploadJob[] {
  const running = jobs.filter((j) => j.status === 'uploading').length;
  const free = Math.max(0, maxConcurrent - running);
  if (free === 0) return [];
  return jobs.filter((j) => j.status === 'queued').slice(0, free);
}

/** Tien do tong cua hang doi: done = so job xong / tong so job con giu. */
export function computeQueueProgress(jobs: UploadJob[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = jobs.length;
  if (total === 0) return { done: 0, total: 0, percent: 100 };
  const done = jobs.filter((j) => j.status === 'done').length;
  const sum = jobs.reduce(
    (acc, j) => acc + (j.status === 'done' ? 100 : Math.max(0, Math.min(100, j.progress))),
    0
  );
  return { done, total, percent: Math.round(sum / total) };
}

/** Job loi co duoc thu lai khong: con luot thu (toi da 3 lan chay). */
export function shouldRetryJob(job: Pick<UploadJob, 'status' | 'attempts'>): boolean {
  return job.status === 'error' && job.attempts < MAX_UPLOAD_ATTEMPTS;
}

/** Thoi gian cho truoc lan thu lai thu `attempt` (attempt = 1, 2, ...). */
export function retryDelayMs(attempt: number): number {
  const idx = Math.max(0, Math.min(attempt - 1, UPLOAD_RETRY_DELAYS_MS.length - 1));
  return UPLOAD_RETRY_DELAYS_MS[idx];
}

/**
 * Chay nhieu viec bat dong bo voi gioi han dong thoi (dung de nen nhieu
 * anh song song luc chon file proofing). Tra ve ket qua theo dung thu tu
 * dau vao; viec nao loi thi o do tra ve loi (khong dung ca loat).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  maxConcurrent: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<({ ok: true; value: R } | { ok: false; error: unknown })[]> {
  const results: ({ ok: true; value: R } | { ok: false; error: unknown })[] = new Array(
    items.length
  );
  let next = 0;
  const workers = new Array(Math.max(1, Math.min(maxConcurrent, items.length)))
    .fill(null)
    .map(async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        try {
          results[i] = { ok: true, value: await fn(items[i], i) };
        } catch (error) {
          results[i] = { ok: false, error };
        }
      }
    });
  await Promise.all(workers);
  return results;
}

type Listener = () => void;

/** Hang doi tai nen dung chung cho ca web (singleton `uploadQueue`). */
export class UploadQueue {
  private jobs: UploadJob[] = [];
  private listeners = new Set<Listener>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Tang moi lan hang doi doi — dung lam snapshot on dinh cho
   *  useSyncExternalStore (getJobs() tra mang moi nen khong dung lam
   *  snapshot duoc, React se lap render vo han). */
  private version = 0;

  getJobs(): UploadJob[] {
    return [...this.jobs];
  }

  getVersion(): number {
    return this.version;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.version += 1;
    this.listeners.forEach((fn) => fn());
  }

  /** Them job moi (hoac thay job cung id) roi chay ngay neu con cho. */
  enqueue(job: UploadJob): string {
    this.clearTimer(job.id);
    this.jobs = this.jobs.filter((j) => j.id !== job.id);
    this.jobs.push({ ...job, status: 'queued', progress: 0, attempts: 0 });
    this.emit();
    this.pump();
    return job.id;
  }

  /** Thu lai 1 job da loi (reset ve queued, chay lai khi co cho). */
  retry(id: string): void {
    const job = this.jobs.find((j) => j.id === id);
    if (!job || job.status !== 'error') return;
    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    this.emit();
    this.pump();
  }

  /** Bo 1 job khoi hang doi (vd admin xoa anh dang doi dong bo). */
  remove(id: string): void {
    this.clearTimer(id);
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.emit();
  }

  private clearTimer(id: string): void {
    const t = this.timers.get(id);
    if (t !== undefined) {
      clearTimeout(t);
      this.timers.delete(id);
    }
  }

  private pump(): void {
    const toStart = selectJobsToStart(this.jobs);
    for (const job of toStart) {
      job.status = 'uploading';
      job.attempts += 1;
      job.progress = 0;
      this.emit();
      void this.runJob(job);
    }
  }

  private async runJob(job: UploadJob): Promise<void> {
    try {
      await job.run((pct) => {
        if (job.status !== 'uploading') return;
        job.progress = Math.max(0, Math.min(100, Math.round(pct)));
        this.emit();
      });
      job.status = 'done';
      job.progress = 100;
      this.emit();
      job.onDone?.();
      // Giu job 'done' vai giay de chip hien "Da dong bo xong" roi tu an.
      this.timers.set(
        job.id,
        setTimeout(() => {
          this.remove(job.id);
          this.pump();
        }, 5000)
      );
      this.pump();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (job.attempts < MAX_UPLOAD_ATTEMPTS) {
        // Con luot: cho vai giay roi tu chay lai, khong bao loi voi Yen.
        job.status = 'queued';
        job.progress = 0;
        this.emit();
        this.timers.set(
          job.id,
          setTimeout(() => {
            this.pump();
          }, retryDelayMs(job.attempts))
        );
      } else {
        job.status = 'error';
        job.error = message;
        this.emit();
        job.onError?.(err);
      }
    }
  }
}

/** Singleton dung chung cho ca web. */
export const uploadQueue = new UploadQueue();
