/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon, Camera, Plus, Check } from 'lucide-react';
import { PhotoItem, PhotoCategory, CATEGORY_LABELS } from '../utils/portfolioLogic';
import { PHOTO_SERIES } from '../data/portfolioData';
import { uploadPhotoToStorage } from '../services/firebase';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhoto: (newPhoto: PhotoItem) => void;
}

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({
  isOpen,
  onClose,
  onAddPhoto,
}) => {
  const [title, setTitle] = useState('');
  const [vietnameseTitle, setVietnameseTitle] = useState('');
  const [category, setCategory] = useState<PhotoCategory>('aodai-trang');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [location, setLocation] = useState('Hà Nội, Việt Nam');
  const [year, setYear] = useState('2026');
  const [camera, setCamera] = useState('Sony A7 Mark III');
  const [lens, setLens] = useState('Sony FE 85mm f/1.8');
  const [focalLength, setFocalLength] = useState('85mm');
  const [aperture, setAperture] = useState('f/1.8');
  const [shutterSpeed, setShutterSpeed] = useState('1/1000s');
  const [iso, setIso] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [story, setStory] = useState('');
  const [tags, setTags] = useState('kỉ yếu, áo dài trắng, thanh xuân, sony a7 mark 3');
  const [seriesId, setSeriesId] = useState('');
  // Huong / ti le that cua anh vua chon (mac dinh landscape 4:3).
  const [orientation, setOrientation] = useState<PhotoItem['orientation']>('landscape');
  const [aspectRatio, setAspectRatio] = useState<PhotoItem['aspectRatio']>('4:3');
  const [error, setError] = useState('');
  // File goc nguoi dung chon — chi dung de preview (base64) va upload len Storage.
  // KHONG luu base64 vao Firestore nua.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Kích thước ảnh không vượt quá 8MB');
        return;
      }
      // Giu File goc de upload len Storage khi submit; preview base64 chi de xem truoc.
      setSelectedFile(file);
      setImageUrlInput('');
      // Doc kich thuoc that cua anh de dat dung orientation / aspectRatio
      // (truoc day moi anh them moi deu bi gan landscape 4:3, anh doc bi hien sai khung).
      const probe = new Image();
      probe.onload = () => {
        const ratio = probe.naturalWidth / Math.max(1, probe.naturalHeight);
        if (ratio < 0.9) {
          setOrientation('portrait');
          setAspectRatio('3:4');
        } else if (ratio < 1.15) {
          setOrientation('square');
          setAspectRatio('1:1');
        } else if (ratio < 1.5) {
          setOrientation('landscape');
          setAspectRatio('4:3');
        } else {
          setOrientation('landscape');
          setAspectRatio('16:9');
        }
      };
      probe.src = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
          setError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview('');
    setSelectedFile(null);
    setImageUrlInput('');
  };

  // Reset toan bo form: modal giu state khi dong (khong unmount) nen khong
  // reset thi lan mo sau van hien du lieu anh cu.
  const resetForm = () => {
    setTitle('');
    setVietnameseTitle('');
    setCategory('aodai-trang');
    setImagePreview('');
    setImageUrlInput('');
    setLocation('Hà Nội, Việt Nam');
    setYear('2026');
    setCamera('Sony A7 Mark III');
    setLens('Sony FE 85mm f/1.8');
    setFocalLength('85mm');
    setAperture('f/1.8');
    setShutterSpeed('1/1000s');
    setIso(100);
    setDescription('');
    setStory('');
    setTags('kỉ yếu, áo dài trắng, thanh xuân, sony a7 mark 3');
    setSeriesId('');
    setOrientation('landscape');
    setAspectRatio('4:3');
    setError('');
    setSelectedFile(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUrlApply = () => {
    if (imageUrlInput.trim()) {
      // Chi dan URL: dung thang URL do, khong upload.
      setSelectedFile(null);
      setImagePreview(imageUrlInput.trim());
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vietnameseTitle.trim()) {
      setError('Vui lòng nhập tiêu đề tác phẩm');
      return;
    }
    if (!imagePreview) {
      setError('Vui lòng tải lên ảnh hoặc nhập liên kết ảnh');
      return;
    }

    const newPhotoId = `custom-photo-${Date.now()}`;

    // Co file: upload len Firebase Storage lay downloadURL roi moi goi onAddPhoto.
    let imageUrl = imagePreview;
    if (selectedFile) {
      setIsUploading(true);
      setError('');
      try {
        imageUrl = await uploadPhotoToStorage(selectedFile, newPhotoId);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setError(
          `Tải ảnh lên Storage thất bại: ${detail} Vui lòng kiểm tra Storage rules đã deploy chưa rồi thử lại.`
        );
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newPhoto: PhotoItem = {
      id: newPhotoId,
      title: title.trim() || vietnameseTitle.trim(),
      vietnameseTitle: vietnameseTitle.trim(),
      category,
      year: year || '2026',
      location: location.trim() || 'Việt Nam',
      camera: camera.trim() || 'Máy ảnh kỹ thuật số',
      lens: lens.trim() || 'Ống kính tiêu cự cố định',
      focalLength: focalLength.trim() || '35mm',
      aperture: aperture.trim() || 'f/2.8',
      shutterSpeed: shutterSpeed.trim() || '1/500s',
      iso: Number(iso) || 100,
      description: description.trim() || 'Tác phẩm mới được thêm vào bộ sưu tập cá nhân.',
      story: story.trim() || description.trim(),
      image: imageUrl,
      aspectRatio,
      orientation,
      seriesId: seriesId || undefined,
      tags: tagArray.length > 0 ? tagArray : ['portfolio', 'tác phẩm mới'],
      edition: 'Bộ ảnh kỉ yếu & áo dài',
    };

    onAddPhoto(newPhoto);
    resetForm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thêm tác phẩm vào portfolio"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white dark:bg-[#0c0c0e] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-neutral-900 dark:text-white" />
            <div>
              <h3 className="text-lg font-serif font-medium text-neutral-900 dark:text-white">
                Thêm Tác Phẩm Vào Portfolio
              </h3>
              <p className="text-xs text-neutral-500">
                Tải lên ảnh bạn đã chụp để trưng bày trực tiếp trên trang web cá nhân.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          {/* Image source: File upload or URL */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Hình ảnh tác phẩm *
            </label>

            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-700 aspect-[16/9] w-full max-h-56 bg-neutral-900">
                <img
                  src={imagePreview}
                  alt="Ảnh xem trước"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                    Bấm để chọn file ảnh từ máy tính
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">
                    Hỗ trợ JPEG, PNG, WebP (Tối đa 8MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Hoặc dán URL ảnh trực tiếp..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleUrlApply}
                    className="px-3 py-2 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Dùng URL
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Tiêu đề tiếng Việt *
              </label>
              <input
                type="text"
                required
                placeholder="Vd: Nụ Cười Ngày Bế Giảng THPT Chu Văn An"
                value={vietnameseTitle}
                onChange={(e) => setVietnameseTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Tiêu đề tiếng Anh (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Vd: Graduation Smiles at Chu Van An"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Category & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Thể loại kỉ yếu / áo dài
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PhotoCategory)}
                className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
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
              <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Bộ sưu tập (Series) — tùy chọn
              </label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
              >
                <option value="">Không thuộc bộ nào</option>
                {PHOTO_SERIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.vietnameseTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
                Năm chụp & Địa điểm
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="col-span-1 text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Trường THPT / Hà Nội"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="col-span-2 text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Camera Gear & EXIF */}
          <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              Thông số máy ảnh & EXIF
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-neutral-500 font-mono block">MÁY ẢNH</span>
                <input
                  type="text"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 font-mono block">ỐNG KÍNH</span>
                <input
                  type="text"
                  value={lens}
                  onChange={(e) => setLens(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 font-mono block">KHẨU ĐỘ</span>
                <input
                  type="text"
                  value={aperture}
                  onChange={(e) => setAperture(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 font-mono block">TỐC ĐỘ</span>
                <input
                  type="text"
                  value={shutterSpeed}
                  onChange={(e) => setShutterSpeed(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Description & Story */}
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Câu chuyện & Cảm xúc phía sau bức ảnh
            </label>
            <textarea
              rows={3}
              placeholder="Chia sẻ về khoảnh khắc bạn bấm máy, góc nhìn hoặc ý nghĩa..."
              value={story}
              onChange={(e) => {
                setStory(e.target.value);
                setDescription(e.target.value);
              }}
              className="w-full text-xs p-3 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-neutral-700 dark:text-neutral-300 mb-1">
              Thẻ phân loại (ngăn cách bởi dấu phẩy)
            </label>
            <input
              type="text"
              placeholder="kiến trúc, ánh sáng, tối giản"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Đang tải ảnh lên...' : 'Thêm Vào Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
