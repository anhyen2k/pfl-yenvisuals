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
} from 'lucide-react';
import { PhotoItem, PhotoCategory } from '../utils/portfolioLogic';

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

  useEffect(() => {
    if (photo) {
      setFormData({ ...photo });
      setTagsInput(photo.tags ? photo.tags.join(', ') : '');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setIsSaving(true);
    try {
      onSave(formData);
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
          {/* Image preview & URL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="md:col-span-1 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 aspect-3/4 relative group">
              <img
                src={formData.image}
                alt={formData.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
                }}
              />
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
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
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
                    <option value="aodai-trang">Áo Dài Trắng Nữ Sinh</option>
                    <option value="kiyieu-nhom">Kỉ Yếu Nhóm Lớp / Cử Nhân</option>
                    <option value="cophuc">Cổ Phục & Việt Phục</option>
                    <option value="aodai-pho">Áo Dài Phố Cổ & Di Tích</option>
                    <option value="nang-tho">Nàng Thơ & Chân Dung Ngoại Cảnh</option>
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
                  placeholder="FE 85mm f/1.4 GM"
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
                  placeholder="2024"
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
