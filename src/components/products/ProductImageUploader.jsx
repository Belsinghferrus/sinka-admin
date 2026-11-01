import { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileImage,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import productService from '../../services/product.service.js';
import {
  MAX_PRODUCT_IMAGES_PER_REQUEST,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '../../constants.js';

/**
 * Cloudflare R2 Product Image Uploader component.
 *
 * Capabilities:
 * - Direct upload to backend R2 upload endpoint (/api/admin/upload/products).
 * - Multi-image file picker & drag-and-drop.
 * - Client-side validation for file size (<= 8 MB) and MIME types (JPEG, PNG, WebP, AVIF).
 * - Batch size enforcement (max 10 images per batch).
 * - Upload progress indicator.
 * - Reorder images (left/right) to determine display sequence.
 * - Set primary / cover image (index 0 is authoritative cover).
 * - Alt text editing for SEO and accessibility.
 * - Safe image removal (removes from product array without deleting R2 asset prematurely).
 *
 * @param {object} props
 * @param {Array<{ url: string, key: string, alt?: string }>} props.images - Ordered image array
 * @param {Function} props.onChange - Callback with updated image array
 * @param {boolean} [props.disabled=false]
 */
export function ProductImageUploader({ images = [], onChange, disabled = false }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
        } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            ) : (
              <UploadCloud className="w-6 h-6 text-stone-600" />
            )}
          </div>

          <div className="text-xs sm:text-sm text-stone-700">
            <span className="font-semibold text-brand-primary hover:underline">Click to upload</span> or drag and drop
          </div>
          <p className="text-[11px] text-stone-500">
            JPEG, PNG, WebP, or AVIF (up to 8 MB per image, max 10 per batch)
          </p>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-4 max-w-xs mx-auto">
            <div className="flex justify-between text-[11px] text-stone-600 font-medium mb-1">
              <span>Uploading to Cloudflare R2...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-primary h-1.5 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Upload issue: </span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 p-0.5"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview List */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span>
              Product Gallery ({images.length} {images.length === 1 ? 'image' : 'images'})
            </span>
            <span className="text-[11px] text-stone-400">First image is the primary cover</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, index) => {
              const isCover = index === 0;
              return (
                <div
                  key={img.key || img.url || index}
                  className={`relative rounded-lg border bg-white overflow-hidden shadow-2xs group transition-shadow hover:shadow-xs ${
                    isCover ? 'border-brand-primary ring-1 ring-brand-primary/30' : 'border-stone-200'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.alt || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Cover Badge */}
                    {isCover ? (
                      <span className="absolute top-2 left-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary text-white shadow-xs">
                        <Star className="w-3 h-3 fill-white" />
                        <span>Cover</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-900/80 text-white hover:bg-stone-900"
                        title="Set as primary cover"
                      >
                        <Star className="w-3 h-3" />
                        <span>Make Cover</span>
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-stone-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
                      title="Remove image from product"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    {/* Reorder Buttons */}
                    <div className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 rounded-md p-0.5 text-white">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="p-1 hover:bg-stone-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move left"
                        aria-label="Move left"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono px-1">{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === images.length - 1}
                        className="p-1 hover:bg-stone-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move right"
                        aria-label="Move right"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alt Text / Metadata */}
                  <div className="p-2 space-y-1 bg-stone-50/50 border-t border-stone-100">
                    <input
                      type="text"
                      value={img.alt || ''}
                      onChange={(e) => handleAltChange(index, e.target.value)}
                      placeholder="Alt text / description..."
                      className="w-full px-2 py-1 text-xs border border-stone-200 rounded bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                      maxLength={200}
                    />
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono truncate">
                      <span className="truncate" title={img.key}>
                        {img.key ? img.key.split('/').pop() : 'R2 object'}
                      </span>
                      <span className="flex items-center space-x-0.5 text-emerald-600 shrink-0 ml-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>R2</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State Help */}
      {images.length === 0 && (
        <div className="flex items-center space-x-2 text-xs text-stone-500 bg-amber-50/60 border border-amber-200/60 rounded-md p-2.5">
          <FileImage className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Upload at least one product image. The first uploaded image will automatically serve as the catalogue cover.</span>
        </div>
      )}
    </div>
  );
}

export default ProductImageUploader;

