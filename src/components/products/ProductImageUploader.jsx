import { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Plus,
  Eye,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import productService from '../../services/product.service.js';
import {
  MAX_PRODUCT_IMAGES_PER_REQUEST,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '../../constants.js';

/**
 * Enhanced Cloudflare R2 Product Image Manager.
 *
 * Supports:
 * - Batch uploads (up to 10 files, 8 MB each, JPEG/PNG/WebP/AVIF)
 * - Drag-and-drop and manual file picker
 * - Primary cover image selection (pinned to index 0)
 * - Safe image removal
 * - In-place image replacement
 * - Full-screen / Lightbox image preview modal with keyboard navigation
 * - Reordering (left/right sequence)
 * - Accessible image alt descriptions
 * - Progress tracking & robust error handling
 *
 * @param {object} props
 * @param {Array<{ url: string, key: string, alt?: string }>} props.images - Ordered image array
 * @param {Function} props.onChange - Callback with updated image array
 * @param {boolean} [props.disabled=false]
 */
export function ProductImageUploader({ images = [], onChange, disabled = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replacingIndex, setReplacingIndex] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // ── Batch Upload ────────────────────────────────────────────────────────────
  const handleFiles = async (fileList) => {
    if (!fileList || !fileList.length || disabled) return;
    setError(null);

    const rawFiles = Array.from(fileList);

    // 1. Batch size limit check (max 10)
    if (rawFiles.length > MAX_PRODUCT_IMAGES_PER_REQUEST) {
      setError(`You can upload at most ${MAX_PRODUCT_IMAGES_PER_REQUEST} images in a single batch.`);
      return;
    }

    // 2. Validate format and size for each file
    const validFiles = [];
    for (const file of rawFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported format. Please upload JPEG, PNG, WebP, or AVIF.`);
        return;
      }
      if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setError(`"${file.name}" exceeds the 8 MB size limit (${sizeMb} MB).`);
        return;
      }
      validFiles.push(file);
    }

    // 3. Dispatch upload via productService
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedResults = await productService.uploadImages(validFiles, (progress) => {
        setUploadProgress(progress);
      });

      // Format into product image schema: { url, key, alt }
      const newImages = uploadedResults.map((item) => ({
        url: item.url,
        key: item.key,
        alt: '',
      }));

      // Append new images to existing array
      onChange([...images, ...newImages]);
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ── In-place Image Replacement ──────────────────────────────────────────────
  const handleTriggerReplace = (index) => {
    if (disabled || isUploading || replacingIndex !== null) return;
    setReplacingIndex(index);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileChange = async (e) => {
    const file = e.target.files?.[0];
    const targetIdx = replacingIndex;
    if (!file || targetIdx === null) {
      setReplacingIndex(null);
      return;
    }

    setError(null);

    // Validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(`"${file.name}" is not a supported format. Please upload JPEG, PNG, WebP, or AVIF.`);
      setReplacingIndex(null);
      return;
    }
    if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`"${file.name}" exceeds the 8 MB size limit (${sizeMb} MB).`);
      setReplacingIndex(null);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const [uploaded] = await productService.uploadImages([file], (progress) => {
        setUploadProgress(progress);
      });

      if (uploaded) {
        const updated = [...images];
        const existingAlt = updated[targetIdx]?.alt || '';
        updated[targetIdx] = {
          url: uploaded.url,
          key: uploaded.key,
          alt: existingAlt,
        };
        onChange(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to replace image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setReplacingIndex(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!disabled && !isUploading) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleMakeCover = (index) => {
    if (index === 0) return;
    const target = images[index];
    const remaining = images.filter((_, idx) => idx !== index);
    onChange([target, ...remaining]);
  };

  const handleMove = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    onChange(updated);
  };

  const handleAltChange = (index, value) => {
    const updated = images.map((img, idx) => (idx === index ? { ...img, alt: value } : img));
    onChange(updated);
  };

  const triggerPicker = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Hidden Main Batch File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Hidden Single File Input for In-Place Replacement */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleReplaceFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Case 1: No images uploaded yet — clean compact dropzone */}
      {images.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerPicker}
          className={`relative border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-brand-primary bg-brand-primary/5'
              : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
              ) : (
                <UploadCloud className="w-5 h-5 text-stone-600" />
              )}
            </div>

            <div className="text-xs text-stone-700">
              <span className="font-semibold text-brand-primary hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-[11px] text-stone-400">
              JPEG, PNG, WebP, or AVIF (up to 8 MB per file, max 10 per batch)
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-3 max-w-xs mx-auto">
              <div className="flex justify-between text-[11px] text-stone-600 font-medium mb-1">
                <span className="flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-primary mr-1" />
                  <span>Uploading images to Cloudflare R2...</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-primary h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Case 2: Images uploaded — compact gallery with inline "+ Add" tile */}
      {images.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span className="flex items-center space-x-1.5">
              <span>Product Gallery</span>
              <span className="text-[11px] text-stone-400 font-normal">
                ({images.length} {images.length === 1 ? 'image' : 'images'} &bull; Primary image shown first)
              </span>
            </span>
            <button
              type="button"
              onClick={triggerPicker}
              disabled={disabled || isUploading}
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover inline-flex items-center space-x-1 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Images</span>
            </button>
          </div>

          {/* Responsive compact image grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {images.map((img, index) => {
              const isCover = index === 0;
              const isReplacingThis = replacingIndex === index && isUploading;

              return (
                <div
                  key={img.key || img.url || index}
                  className={`relative rounded-lg border bg-white overflow-hidden shadow-2xs group transition-all hover:shadow-xs ${
                    isCover ? 'border-brand-primary ring-1 ring-brand-primary/40' : 'border-stone-200'
                  }`}
                >
                  {/* Thumbnail & Quick Actions */}
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.alt || `Product image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Replacement overlay spinner */}
                    {isReplacingThis && (
                      <div className="absolute inset-0 bg-stone-900/60 flex flex-col items-center justify-center text-white z-10">
                        <Loader2 className="w-5 h-5 animate-spin text-white mb-1" />
                        <span className="text-[10px] font-medium">{uploadProgress}%</span>
                      </div>
                    )}

                    {/* Top Left: Primary Cover Badge or Make Cover Button */}
                    {isCover ? (
                      <span className="absolute top-1.5 left-1.5 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-primary text-white shadow-xs z-10">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        <span>PRIMARY</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone-900/80 text-white hover:bg-stone-900 z-10"
                        title="Set as primary cover image"
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Make Cover</span>
                      </button>
                    )}

                    {/* Top Right: Action Controls (Preview, Replace, Remove) */}
                    <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 z-10">
                      {/* Zoom / Lightbox Preview */}
                      <button
                        type="button"
                        onClick={() => setPreviewIndex(index)}
                        className="w-5 h-5 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white flex items-center justify-center transition-colors shadow-xs opacity-0 group-hover:opacity-100"
                        title="Preview high-res image"
                        aria-label="Preview image"
                      >
                        <Eye className="w-3 h-3" />
                      </button>

                      {/* In-place Replace */}
                      <button
                        type="button"
                        onClick={() => handleTriggerReplace(index)}
                        disabled={disabled || isUploading}
                        className="w-5 h-5 rounded-full bg-stone-900/70 hover:bg-brand-primary text-white flex items-center justify-center transition-colors shadow-xs opacity-0 group-hover:opacity-100 disabled:opacity-40"
                        title="Replace image"
                        aria-label="Replace image"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="w-5 h-5 rounded-full bg-stone-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Remove image from gallery"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Bottom Right: Reorder Sequence Buttons */}
                    <div className="absolute bottom-1.5 right-1.5 flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 rounded p-0.5 text-white z-10">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-stone-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move left"
                        aria-label="Move left"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[9px] font-mono px-1">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === images.length - 1}
                        className="p-0.5 hover:bg-stone-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move right"
                        aria-label="Move right"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Alt text field */}
                  <div className="p-1.5 bg-stone-50/60 border-t border-stone-100">
                    <input
                      type="text"
                      value={img.alt || ''}
                      onChange={(e) => handleAltChange(index, e.target.value)}
                      placeholder="Alt description..."
                      className="w-full px-1.5 py-0.5 text-[11px] border border-stone-200 rounded bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      maxLength={200}
                    />
                  </div>
                </div>
              );
            })}

            {/* Inline "+ Add More" tile in the grid */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerPicker}
              className={`aspect-4/3 rounded-lg border-2 border-dashed border-stone-300 hover:border-brand-primary flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-colors p-2 text-center ${
                disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading && replacingIndex === null ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-primary mb-1" />
                  <span className="text-[10px] text-stone-500 font-medium">{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-stone-400 mb-0.5" />
                  <span className="text-[11px] font-medium text-stone-600">Add More</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Bar when adding to existing gallery */}
      {images.length > 0 && isUploading && replacingIndex === null && (
        <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
          <div className="flex justify-between text-[11px] text-stone-600 font-medium mb-1">
            <span className="flex items-center space-x-1">
              <Loader2 className="w-3 h-3 animate-spin text-brand-primary mr-1" />
              <span>Uploading to Cloudflare R2...</span>
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-primary h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${Math.max(uploadProgress, 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1 text-[11px]">
            <span className="font-semibold">Upload issue: </span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── High-Res Lightbox Preview Modal ───────────────────────────────────── */}
      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-3xl w-full bg-stone-900 rounded-xl overflow-hidden shadow-2xl border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-950/70 border-b border-stone-800 text-white">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold">
                  Image {previewIndex + 1} of {images.length}
                </span>
                {previewIndex === 0 && (
                  <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    PRIMARY
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {previewIndex !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleMakeCover(previewIndex);
                      setPreviewIndex(0);
                    }}
                    className="text-xs bg-stone-800 hover:bg-stone-700 text-white px-2.5 py-1 rounded transition-colors"
                  >
                    Set as Primary Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewIndex(null)}
                  className="p-1 text-stone-400 hover:text-white rounded transition-colors"
                  aria-label="Close image preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="relative aspect-16/10 bg-black flex items-center justify-center overflow-hidden">
              <img
                src={images[previewIndex].url}
                alt={images[previewIndex].alt || `Preview image ${previewIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer (CDN Key / Alt) */}
            <div className="px-4 py-2 bg-stone-950/70 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
              <span className="font-mono truncate mr-2" title={images[previewIndex].key}>
                {images[previewIndex].key || images[previewIndex].url}
              </span>
              <span>{images[previewIndex].alt || 'No alt description'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductImageUploader;
