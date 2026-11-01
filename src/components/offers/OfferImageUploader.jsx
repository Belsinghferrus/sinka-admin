import { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  RefreshCw,
  AlertCircle,
  FileImage,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import offerService from '../../services/offer.service.js';
import Button from '../ui/Button.jsx';
import {
  MAX_OFFER_IMAGE_SIZE_BYTES,
  ALLOWED_OFFER_IMAGE_TYPES,
} from '../../constants.js';

/**
 * Reusable Promotional Offer Image Uploader.
 *
 * Capabilities:
 * - Direct upload to Cloudflare R2 via `/api/admin/upload/offers`.
 * - Drag-and-drop or device file picker via "Browse Image" button.
 * - Client-side validation: JPG, JPEG, PNG, WebP up to 5 MB.
 * - Upload progress indicator with real-time percentage.
 * - Image preview maintaining correct aspect ratio and object-fit.
 * - "Replace Image" and "Remove Image" controls.
 * - Displays existing uploaded image when editing an offer.
 * - Supports existing external image URLs seamlessly.
 *
 * @param {object} props
 * @param {string} [props.value=''] - Current image URL
 * @param {string|null} [props.imageKey=null] - Cloudflare R2 object key (if applicable)
 * @param {Function} props.onChange - Callback `({ url, key }) => void`
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.error] - External validation error message
 */
export function OfferImageUploader({
  value = '',
  imageKey = null,
  onChange,
  disabled = false,
  error = null,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef(null);

  const displayError = localError || error;

  const validateFile = (file) => {
    if (!file) {
      return 'No file selected.';
    }

    // MIME type check
    const mime = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();
    const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);

    if (!ALLOWED_OFFER_IMAGE_TYPES.includes(mime) && !hasValidExt) {
      return `"${file.name}" is not a supported image format. Please select a JPG, JPEG, PNG, or WebP file.`;
    }

    // Size limit check (5 MB)
    if (file.size > MAX_OFFER_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return `"${file.name}" exceeds the maximum allowed size of 5 MB (${sizeMb} MB).`;
    }

    if (file.size === 0) {
      return 'Selected file is empty (0 bytes).';
    }

    return null;
  };

  const handleUpload = async (file) => {
    if (!file || disabled || isUploading) return;
    setLocalError(null);
    setImageLoadError(false);

    const validationMessage = validateFile(file);
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await offerService.uploadOfferImage(file, (percent) => {
        setUploadProgress(percent);
      });

      if (!result || !result.url) {
        throw new Error('Upload succeeded but no image URL was returned.');
      }

      onChange({
        url: result.url,
        key: result.key || null,
      });
    } catch (err) {
      setLocalError(err.message || 'Image upload failed. Please verify storage connectivity and try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
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
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    }
  };

  const handleRemove = () => {
    if (disabled || isUploading) return;
    setLocalError(null);
    setImageLoadError(false);
    onChange({ url: '', key: null });
  };

  const handleTriggerPicker = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isR2Asset = Boolean(imageKey || (value && value.includes('.r2.dev')));

  return (
    <div className="space-y-3 font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        aria-label="Upload promotional offer banner image"
      />

      {/* State 1: Image is selected / existing */}
      {value && !isUploading ? (
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden shadow-xs">
          {/* Banner Preview Area */}
          <div className="relative aspect-16/9 sm:aspect-21/9 bg-stone-100 overflow-hidden group">
            {!imageLoadError ? (
              <img
                src={value}
                alt="Promotional Banner Preview"
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.01]"
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center">
                <FileImage className="w-8 h-8 mb-1.5 text-stone-300" />
                <span className="text-xs font-medium">Unable to load image preview</span>
                <span className="text-[10px] text-stone-400 mt-0.5 max-w-xs truncate">{value}</span>
              </div>
            )}

            {/* Storage Badge Overlay */}
            <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5">
              {isR2Asset ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Cloudflare R2</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-stone-900/80 text-white backdrop-blur-xs shadow-xs">
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                  <span>External URL</span>
                </span>
              )}
            </div>

            {/* Hover Actions Bar */}
            <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-3 backdrop-blur-[2px]">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleTriggerPicker}
                disabled={disabled}
                icon={RefreshCw}
              >
                Replace Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="bg-white/95 text-red-600 hover:text-red-700 hover:bg-white border-white/80"
                icon={X}
              >
                Remove
              </Button>
            </div>
          </div>

          {/* Metadata & Secondary Actions Bar */}
          <div className="p-3 bg-stone-50/80 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="min-w-0 flex-1">
              <span className="text-stone-500 text-[11px] block font-mono truncate" title={value}>
                {imageKey || value}
              </span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleTriggerPicker}
                disabled={disabled}
                icon={RefreshCw}
                className="text-stone-600 hover:text-stone-900 text-xs px-2.5 py-1"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                icon={X}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2.5 py-1"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* State 2: Empty dropzone or uploading */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all ${
            isDragOver
              ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20'
              : 'border-stone-300 hover:border-stone-400 bg-stone-50/50'
          } ${disabled || isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* Upload Icon or Spinner */}
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 shadow-2xs">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              ) : (
                <UploadCloud className="w-6 h-6 text-stone-600" />
              )}
            </div>

            {/* Instruction Copy */}
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-medium text-stone-800">
                <span>Drag and drop your banner image here, or </span>
                <button
                  type="button"
                  onClick={handleTriggerPicker}
                  disabled={disabled || isUploading}
                  className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline focus:outline-none focus:underline"
                >
                  browse from device
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                Supports JPG, JPEG, PNG, and WebP (up to 5 MB)
              </p>
            </div>

            {/* Choose Image Button */}
            {!isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTriggerPicker}
                disabled={disabled}
                icon={FileImage}
                className="mt-1 font-semibold text-xs border-stone-300 hover:bg-stone-100"
              >
                Choose Banner Image
              </Button>
            )}

            {/* Real-time Upload Progress Bar */}
            {isUploading && (
              <div className="w-full max-w-xs mx-auto pt-2">
                <div className="flex justify-between text-[11px] text-stone-600 font-medium mb-1.5">
                  <span className="flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin text-brand-primary mr-1" />
                    <span>Uploading to Cloudflare R2...</span>
                  </span>
                  <span className="font-mono font-semibold text-brand-primary">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-primary h-1.5 rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Feedback Message */}
      {displayError && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold">Image upload issue: </span>
            <span>{displayError}</span>
          </div>
          {localError && (
            <button
              type="button"
              onClick={() => setLocalError(null)}
              className="text-red-500 hover:text-red-700 p-0.5"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default OfferImageUploader;

