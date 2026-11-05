/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Save,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Upload,
} from 'lucide-react';
import { PhotoItem, PhotoCategory, CATEGORY_LABELS } from '../utils/portfolioLogic';
import { PHOTO_SERIES } from '../data/portfolioData';
import { uploadPhotoToStorage } from '../services/firebase';

interface EditPhotoModalProps {
  isOpen: boolean;
  photo: PhotoItem | null;
  onClose: () => void;
  onSave: (updatedPhoto: PhotoItem) => void;
}

export const EditPhotoModal: React.FC<EditPhotoModalProps> = ({
  isOpen,
  photo,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<PhotoItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  // File moi nguoi dung chon de thay anh: chi upload khi submit, khong luu base64.
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState('');
  const [error, setError] = useState('');
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    if (photo) {
      setFormData({ ...photo });
      setTagsInput(photo.tags ? photo.tags.join(', ') : '');
      setNewFile(null);
      setNewPreview('');
      setError('');
      setImageBroken(false);
    }
  }, [photo]);

  if (!isOpen || !formData) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => (prev ? { ...prev, [name]: checked } : null));
    } else if (name === 'iso') {
      setFormData((prev) => (prev ? { ...prev, iso: Number(value) || 100 } : null));
    } else if (name === 'image') {
      // Doi URL thi bo co anh hong de xem truoc hien lai.
      setImageBroken(false);
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    } else if (name === 'seriesId') {
      setFormData((prev) => (prev ? { ...prev, seriesId: value || undefined } : null));
    } else if (name === 'aspectRatio') {
      // Gallery dung orientation de chon khung: doi ti le thi doi huong theo.
      const orientation: PhotoItem['orientation'] =
        value === '3:4' ? 'portrait' : value === '1:1' ? 'square' : 'landscape';
      setFormData((prev) =>
        prev ? { ...prev, aspectRatio: value as PhotoItem['aspectRatio'], orientation } : null
      );
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
    const parsedTags = e.target.value
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    setFormData((prev) => (prev ? { ...prev, tags: parsedTags } : null));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('Kích thước ảnh không vượt quá 8MB');
      return;
    }
    // Giu File goc de upload len Storage khi submit; preview base64 chi de xem truoc.
    setNewFile(file);
    setImageBroken(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewPreview(reader.result);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const clearNewFile = () => {
    setNewFile(null);
    setNewPreview('');
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!formData) return;
    setIsSaving(true);
    setError('');
    try {
      let updatedPhoto = formData;
      if (newFile) {
        // Co file moi: upload len Firebase Storage lay downloadURL lam anh moi.
        let downloadURL: string;
        try {
          downloadURL = await uploadPhotoToStorage(newFile, formData.id);
        } catch (err) {
          const detail = err instanceof Error ? err.message : String(err);
          setError(
            `Tải ảnh lên Storage thất bại: ${detail} Vui lòng kiểm tra Storage rules đã deploy chưa rồi thử lại.`
          );
          setIsSaving(false);
          return;
        }
        updatedPhoto = { ...formData, image: downloadURL };
      }
      onSave(updatedPhoto);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sửa thông tin ảnh"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0e0e11] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-800">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-white">
                Chỉnh Sửa Thông Tin Bức Ảnh
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                Mã ảnh: #{formData.id} · Đồng bộ lưu vĩnh viễn trên Cloud Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Image preview & URL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="md:col-span-1 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-3/4 relative group">
              {newPreview ? (
                <img
                  src={newPreview}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              ) : formData.image && !imageBroken ? (
                <img
                  src={formData.image}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageBroken(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-400">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">Chưa có ảnh</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] text-white font-mono truncate">{formData.title}</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Đường dẫn ảnh (Image URL) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleChange}
                      required
                      placeholder="https://..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Upload anh moi: neu chon file thi upload len Storage khi luu, thay anh cu */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Hoặc tải lên ảnh mới (thay ảnh hiện tại)
                </label>
                {newPreview ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Đã chọn ảnh mới — sẽ tải lên Storage khi bấm Lưu.</span>
                    <button
                      type="button"
                      onClick={clearNewFile}
                      className="ml-auto px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
                    >
                      Hủy ảnh mới
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500 rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                    <Upload className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-300">
                      Bấm để chọn file ảnh từ máy tính (JPEG, PNG, WebP — tối đa 8MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Tiêu đề chính (Tiếng Anh/Phổ thông) *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="VD: Heritage Sunlight"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Tiêu đề Tiếng Việt
                  </label>
                  <input
                    type="text"
                    name="vietnameseTitle"
                    value={formData.vietnameseTitle || ''}
                    onChange={handleChange}
                    placeholder="VD: Nắng Hoàng Thành Thăng Long"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Bộ sưu tập (Series)
                </label>
                <select
                  name="seriesId"
                  value={formData.seriesId || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Không thuộc bộ nào</option>
                  {PHOTO_SERIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.vietnameseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Phân loại danh mục (Category) *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {(Object.entries(CATEGORY_LABELS) as [PhotoCategory, string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Địa điểm chụp *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      placeholder="VD: Hoàng Thành Thăng Long, Hà Nội"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Camera & EXIF specs (Sony A7 Mark III) */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50/60 dark:bg-[#121216] space-y-3">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-neutral-900 dark:text-white">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Thông Số Máy Ảnh & EXIF (Sony Alpha 7 Mark III)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Máy ảnh
                </label>
                <input
                  type="text"
                  name="camera"
                  value={formData.camera}
                  onChange={handleChange}
                  placeholder="Sony Alpha 7 Mark III"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Ống kính (Lens)
                </label>
                <input
                  type="text"
                  name="lens"
                  value={formData.lens}
                  onChange={handleChange}
                  placeholder="FE 85mm f/1.8"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Khẩu độ
                </label>
                <input
                  type="text"
                  name="aperture"
                  value={formData.aperture}
                  onChange={handleChange}
                  placeholder="f/1.4"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Tốc độ màn trập
                </label>
                <input
                  type="text"
                  name="shutterSpeed"
                  value={formData.shutterSpeed}
                  onChange={handleChange}
                  placeholder="1/800s"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  ISO
                </label>
                <input
                  type="number"
                  name="iso"
                  value={formData.iso}
                  onChange={handleChange}
                  placeholder="100"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Tiêu cự (Focal Length)
                </label>
                <input
                  type="text"
                  name="focalLength"
                  value={formData.focalLength}
                  onChange={handleChange}
                  placeholder="85mm"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Năm thực hiện
                </label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="2026"
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                  Khung tỉ lệ ảnh
                </label>
                <select
                  name="aspectRatio"
                  value={formData.aspectRatio}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono"
                >
                  <option value="3:4">3:4 (Dọc tiêu chuẩn)</option>
                  <option value="16:9">16:9 (Ngang điện ảnh)</option>
                  <option value="4:3">4:3 (Ngang cổ điển)</option>
                  <option value="1:1">1:1 (Vuông Fine Art)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description & Story */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Mô tả ngắn (Description)
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Tóm tắt cảm xúc, ánh sáng hoặc bố cục..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Câu chuyện nghệ thuật / Ý niệm bộ ảnh (Artistic Story)
              </label>
              <textarea
                name="story"
                rows={3}
                value={formData.story}
                onChange={handleChange}
                placeholder="Câu chuyện hậu trường, cảm xúc của bạn sinh viên / thiếu nữ khi đứng trước ống kính..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 leading-relaxed font-serif"
              />
            </div>
          </div>

          {/* Tags & Featured highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                Thẻ tìm kiếm (cách nhau bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={handleTagsChange}
                placeholder="áo dài, hoàng thành, kỉ yếu, sony a7m3"
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-4 sm:pt-2">
              <label className="relative inline-flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={Boolean(formData.featured)}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ghim làm ảnh tiêu biểu (Featured Hero)</span>
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#121216] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Huỷ bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi Lên Đám Mây'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
