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
  Plus,
} from 'lucide-react';
import productService from '../../services/product.service.js';
import {
  MAX_PRODUCT_IMAGES_PER_REQUEST,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '../../constants.js';

/**
 * Compact Cloudflare R2 Product Image Uploader.
 *
 * Preserves 100% of the existing Cloudflare R2 / Cloudinary upload integration,
 * batch validations, image reordering, primary cover assignment, and alt text support
 * while presenting a dense, professional media workspace.
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

  const triggerPicker = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-3 font-sans">
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
                  <span>Uploading images...</span>
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
                ({images.length} {images.length === 1 ? 'image' : 'images'})
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
              return (
                <div
                  key={img.key || img.url || index}
                  className={`relative rounded-lg border bg-white overflow-hidden shadow-2xs group transition-all hover:shadow-xs ${
                    isCover ? 'border-brand-primary ring-1 ring-brand-primary/40' : 'border-stone-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.alt || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Primary Cover Badge */}
                    {isCover ? (
                      <span className="absolute top-1.5 left-1.5 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-primary text-white shadow-xs">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        <span>PRIMARY</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone-900/80 text-white hover:bg-stone-900"
                        title="Set as primary cover"
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Make Cover</span>
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-stone-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Reorder Buttons */}
                    <div className="absolute bottom-1.5 right-1.5 flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 rounded p-0.5 text-white">
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

            {/* Inline "+ Add" tile in the grid */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerPicker}
              className={`aspect-4/3 rounded-lg border-2 border-dashed border-stone-300 hover:border-brand-primary flex flex-col items-center justify-center cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition-colors p-2 text-center ${
                disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
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
      {images.length > 0 && isUploading && (
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
    </div>
  );
}

export default ProductImageUploader;
