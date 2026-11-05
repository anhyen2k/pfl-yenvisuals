/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// (v7.7) Chip tien do dong bo nen — hien o goc duoi phai khi co anh dang
// tai len ngam (them/sua anh portfolio, up anh proofing). Yen bam Luu
// xong dong modal luon, chip nay la cho duy nhat theo doi tien do: hien
// "Dang dong bo X/Y anh…", bam vao thi mo danh sach job + nut thu lai
// tung anh loi. Job xong het thi chip hien "Da dong bo xong" vai giay
// roi tu an.

import React, { useEffect, useSyncExternalStore, useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { uploadQueue, computeQueueProgress, type UploadJob } from '../services/uploadQueue';

export const UploadQueueChip: React.FC = () => {
  // Snapshot la so version (on dinh) — doc jobs sau moi lan version doi.
  useSyncExternalStore(
    (onChange) => uploadQueue.subscribe(onChange),
    () => uploadQueue.getVersion()
  );
  const jobs = uploadQueue.getJobs();
  const [expanded, setExpanded] = useState(false);
  const [justFinished, setJustFinished] = useState(false);

  const active = jobs.filter((j) => j.status === 'queued' || j.status === 'uploading');
  const errored = jobs.filter((j) => j.status === 'error');
  const progress = computeQueueProgress(jobs);

  // Tat ca job xong: hien "Da dong bo xong" vai giay roi an.
  useEffect(() => {
    if (jobs.length > 0 && active.length === 0 && errored.length === 0) {
      setJustFinished(true);
      const t = setTimeout(() => setJustFinished(false), 4000);
      return () => clearTimeout(t);
    }
    setJustFinished(false);
    return undefined;
  }, [jobs.length, active.length, errored.length]);

  if (jobs.length === 0 && !justFinished) return null;
  if (jobs.length === 0 && justFinished) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg">
        <CheckCircle2 className="w-4 h-4" />
        <span>Đã đồng bộ xong</span>
      </div>
    );
  }

  const hasError = errored.length > 0;
  const title = hasError
    ? `${errored.length} ảnh chưa đồng bộ được`
    : active.length > 0
      ? `Đang đồng bộ ${progress.done}/${progress.total} ảnh…`
      : 'Đã đồng bộ xong';

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-left cursor-pointer"
        title="Bấm để xem chi tiết từng ảnh"
      >
        {hasError ? (
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        ) : active.length > 0 ? (
          <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        )}
        <span className="flex-1 text-xs font-semibold text-neutral-900 dark:text-white truncate">
          {title}
        </span>
        <span className="text-xs font-sans tabular-nums text-neutral-500">{progress.percent}%</span>
        {expanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronUp className="w-4 h-4 text-neutral-400" />}
      </button>
      <div className="h-1 bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full transition-all ${hasError ? 'bg-rose-500' : 'bg-amber-500'}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      {expanded && (
        <div className="max-h-56 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
          {jobs.map((job: UploadJob) => (
            <div key={job.id} className="flex items-center gap-2 px-3.5 py-2">
              {job.status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : job.status === 'error' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-neutral-800 dark:text-neutral-200 truncate" title={job.label}>
                  {job.label}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {job.status === 'done'
                    ? 'Đã xong'
                    : job.status === 'error'
                      ? job.error || 'Lỗi, bấm thử lại'
                      : job.status === 'uploading'
                        ? `Đang tải ${job.progress}%…`
                        : 'Đang chờ…'}
                </div>
              </div>
              {job.status === 'error' && (
                <button
                  type="button"
                  onClick={() => uploadQueue.retry(job.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  Thử lại
                </button>
              )}
              {job.status === 'done' && (
                <button
                  type="button"
                  onClick={() => uploadQueue.remove(job.id)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer shrink-0"
                  title="Ẩn"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
