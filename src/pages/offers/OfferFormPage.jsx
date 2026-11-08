import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tag,
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import offerService from '../../services/offer.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import OfferImageUploader from '../../components/offers/OfferImageUploader.jsx';
import { ROUTES } from '../../constants.js';

/**
 * Format Date object or ISO string to `YYYY-MM-DDTHH:MM` for datetime-local inputs.
 */
function toDatetimeLocalValue(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Reusable accessible toggle switch component.
 */
function ToggleSwitch({ checked, onChange, label, size = 'md' }) {
  const isLg = size === 'lg';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${
        isLg ? 'h-6 w-11' : 'h-5 w-9'
      } ${checked ? 'bg-brand-primary' : 'bg-stone-300'}`}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          isLg ? 'h-5 w-5' : 'h-4 w-4'
        } ${checked ? (isLg ? 'translate-x-5' : 'translate-x-4') : 'translate-x-0'}`}
      />
    </button>
  );
}

/**
 * Compact Section Card container.
 */
function SectionCard({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden ${className}`}>
      <div className="flex items-center space-x-2 px-4 py-3 border-b border-stone-100 bg-stone-50/60">
        {Icon && (
          <span className="p-1 rounded-md bg-stone-100 text-brand-primary shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
        <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Sinka Admin — Create / Edit Promotional Offer.
 *
 * Compact, professional campaign creation workspace:
 *   Left (70–75%): Campaign Details, Media & Call to Action, Scheduling & Priority
 *   Right (25–30%): Sticky Live Storefront Preview, Publication Settings, Actions
 *
 * 100% preserves existing backend integration, API payload schema,
 * validation, Cloudflare R2 image upload, and state handling.
 */
export function OfferFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    imageKey: null,
    ctaLabel: 'Shop Now',
    ctaUrl: '/products',
    offerDetails: '',
    priority: 0,
    startDate: toDatetimeLocalValue(new Date()),
    endDate: '',
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imgPreviewError, setImgPreviewError] = useState(false);

  // ── Fetch offer when editing ────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;

    let isMounted = true;
    async function loadOffer() {
      setIsLoading(true);
      setError(null);
      try {
        const offer = await offerService.getOfferById(id);
        if (!offer) {
          throw new Error('Promotional offer not found.');
        }
        if (isMounted) {
          setFormData({
            title: offer.title || '',
            description: offer.description || '',
            imageUrl: offer.imageUrl || '',
            imageKey: offer.imageKey || null,
            ctaLabel: offer.ctaLabel || 'Shop Now',
            ctaUrl: offer.ctaUrl || '/products',
            offerDetails: offer.offerDetails || '',
            priority: offer.priority ?? 0,
            startDate: toDatetimeLocalValue(offer.startDate || new Date()),
            endDate: toDatetimeLocalValue(offer.endDate),
            isActive: Boolean(offer.isActive),
          });
          setImgPreviewError(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load offer details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOffer();
    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextVal = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextVal,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required (1-120 characters).';
    } else if (formData.title.trim().length > 120) {
      errors.title = 'Title cannot exceed 120 characters.';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required (1-500 characters).';
    } else if (formData.description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      errors.imageUrl = 'A promotional banner image is required. Please upload an image.';
    } else if (!/^https?:\/\/.+/i.test(formData.imageUrl.trim())) {
      errors.imageUrl = 'Banner image must be a valid HTTP or HTTPS web address.';
    }

    if (!formData.ctaLabel.trim()) {
      errors.ctaLabel = 'Call to action label is required (1-50 characters).';
    } else if (formData.ctaLabel.trim().length > 50) {
      errors.ctaLabel = 'CTA label cannot exceed 50 characters.';
    }

    if (!formData.ctaUrl.trim()) {
      errors.ctaUrl = 'CTA destination URL or relative path is required.';
    } else if (
      !formData.ctaUrl.trim().startsWith('/') &&
      !/^https?:\/\/.+/i.test(formData.ctaUrl.trim())
    ) {
      errors.ctaUrl = 'Must start with a leading slash (e.g. /products) or http(s)://.';
    }

    if (formData.offerDetails && formData.offerDetails.length > 255) {
      errors.offerDetails = 'Offer details cannot exceed 255 characters.';
    }

    const priorityNum = Number(formData.priority);
    if (isNaN(priorityNum) || priorityNum < 0 || !Number.isInteger(priorityNum)) {
      errors.priority = 'Priority must be a non-negative integer (>= 0).';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate).getTime();
      const end = new Date(formData.endDate).getTime();
      if (end < start) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
      imageKey: formData.imageKey || null,
      ctaLabel: formData.ctaLabel.trim(),
      ctaUrl: formData.ctaUrl.trim(),
      offerDetails: formData.offerDetails.trim() || null,
      priority: Number(formData.priority) || 0,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      isActive: Boolean(formData.isActive),
    };

    try {
      if (isEditing) {
        await offerService.updateOffer(id, payload);
      } else {
        await offerService.createOffer(payload);
      }
      navigate(ROUTES.OFFERS);
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} promotional offer.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4 font-sans">
        <LoadingIndicator size="lg" message="Loading promotional offer data..." />
      </div>
    );
  }

  // Reusable submit button label
  const publishBtnContent = (
    <>
      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Offer Changes' : 'Publish Offer'}</span>
    </>
  );

  return (
    <div className="space-y-5 font-sans">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-start space-x-3">
          <Link
            to={ROUTES.OFFERS}
            className="mt-0.5 p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
            title="Return to Offers List"
            aria-label="Back to offers list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-1.5 mb-0.5">
              <Link
                to={ROUTES.OFFERS}
                className="text-[11px] text-stone-400 hover:text-brand-primary transition-colors"
              >
                Offers
              </Link>
              <span className="text-[11px] text-stone-300">/</span>
              <span className="text-[11px] text-stone-500">
                {isEditing ? 'Edit Offer' : 'New Offer'}
              </span>
            </div>
            <h1 className="text-lg font-heading font-semibold text-stone-900 tracking-tight leading-tight">
              {isEditing ? 'Edit Promotional Offer' : 'Create Promotional Offer'}
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              {isEditing
                ? 'Update offer copy, imagery, schedules, and storefront banner settings.'
                : 'Configure and publish a new promotional campaign for Sinka Home & Living.'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link to={ROUTES.OFFERS}>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="offer-form"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 shadow-xs"
          >
            {publishBtnContent}
          </Button>
        </div>
      </div>

      {/* ── Global Error Alert ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Unable to save offer</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Main Form Grid: 70–75% Left, 25–30% Right ───────────────────────── */}
      <form
        id="offer-form"
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start"
      >
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT COLUMN — Campaign Details, Media & CTA, Scheduling
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* 1. Campaign Details Card */}
          <SectionCard title="Campaign Details" icon={Tag}>
            <div className="space-y-3.5">
              {/* Offer Title */}
              <div>
                <label htmlFor="title" className="block text-xs font-semibold text-stone-700 mb-1">
                  Offer Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Spring Living Room Sale — Up to 40% Off"
                  maxLength={120}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 transition-colors ${
                    fieldErrors.title
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                />
                <div className="flex justify-between mt-1 text-[10px] text-stone-400">
                  {fieldErrors.title ? (
                    <span id="title-error" className="text-red-600 font-medium">{fieldErrors.title}</span>
                  ) : (
                    <span>Clear, high-impact headline displayed on the storefront</span>
                  )}
                  <span className="font-mono">{formData.title.length}/120</span>
                </div>
              </div>

              {/* Description / Subtitle */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-stone-700 mb-1">
                  Description / Subtitle <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g. Upgrade your home sanctuary with handcrafted sofas, artisanal rugs, and teak coffee tables at seasonal discounts."
                  maxLength={500}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 leading-relaxed resize-none transition-colors ${
                    fieldErrors.description
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                />
                <div className="flex justify-between mt-0.5 text-[10px] text-stone-400">
                  {fieldErrors.description ? (
                    <span id="description-error" className="text-red-600 font-medium">{fieldErrors.description}</span>
                  ) : (
                    <span>Customer-facing campaign narrative</span>
                  )}
                  <span className="font-mono">{formData.description.length}/500</span>
                </div>
              </div>

              {/* Fine Print / Offer Terms */}
              <div>
                <label htmlFor="offerDetails" className="block text-xs font-semibold text-stone-700 mb-1">
                  Fine Print / Offer Terms <span className="font-normal text-stone-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="offerDetails"
                  name="offerDetails"
                  value={formData.offerDetails}
                  onChange={handleChange}
                  placeholder="e.g. Valid through May 15. Cannot be combined with other discount codes."
                  maxLength={255}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 transition-colors ${
                    fieldErrors.offerDetails
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                />
                <div className="flex justify-between mt-1 text-[10px] text-stone-400">
                  {fieldErrors.offerDetails ? (
                    <span className="text-red-600 font-medium">{fieldErrors.offerDetails}</span>
                  ) : (
                    <span>Terms, exclusions, or coupon requirements</span>
                  )}
                  <span className="font-mono">{formData.offerDetails.length}/255</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 2. Media & Call to Action Card */}
          <SectionCard title="Media &amp; Call to Action" icon={ImageIcon}>
            <div className="space-y-3.5">
              {/* Banner Image */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Promotional Banner Image <span className="text-red-500">*</span>
                </label>
                <OfferImageUploader
                  value={formData.imageUrl}
                  imageKey={formData.imageKey}
                  onChange={({ url, key }) => {
                    setFormData((prev) => ({
                      ...prev,
                      imageUrl: url,
                      imageKey: key,
                    }));
                    setImgPreviewError(false);
                    if (fieldErrors.imageUrl) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.imageUrl;
                        return updated;
                      });
                    }
                  }}
                  disabled={isSubmitting}
                  error={fieldErrors.imageUrl}
                />
              </div>

              {/* Call to Action Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-100">
                {/* CTA Label */}
                <div>
                  <label htmlFor="ctaLabel" className="block text-xs font-semibold text-stone-700 mb-1">
                    Button Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="ctaLabel"
                    name="ctaLabel"
                    value={formData.ctaLabel}
                    onChange={handleChange}
                    placeholder="e.g. Shop Now"
                    maxLength={50}
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 ${
                      fieldErrors.ctaLabel
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-stone-300 focus:ring-brand-primary'
                    }`}
                  />
                  {fieldErrors.ctaLabel && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.ctaLabel}</p>
                  )}
                </div>

                {/* CTA Destination URL */}
                <div>
                  <label htmlFor="ctaUrl" className="block text-xs font-semibold text-stone-700 mb-1">
                    Destination URL / Path <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      id="ctaUrl"
                      name="ctaUrl"
                      value={formData.ctaUrl}
                      onChange={handleChange}
                      placeholder="/products?category=living"
                      maxLength={500}
                      className={`w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 ${
                        fieldErrors.ctaUrl
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-stone-300 focus:ring-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.ctaUrl && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.ctaUrl}</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 3. Scheduling & Priority Card */}
          <SectionCard title="Scheduling &amp; Priority" icon={Calendar}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-xs font-semibold text-stone-700 mb-1">
                  Display Priority
                </label>
                <input
                  type="number"
                  id="priority"
                  name="priority"
                  min="0"
                  step="1"
                  value={formData.priority}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 font-mono ${
                    fieldErrors.priority
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                />
                <p className="mt-1 text-[10px] text-stone-400">
                  Higher number = higher storefront precedence
                </p>
                {fieldErrors.priority && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.priority}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-xs font-semibold text-stone-700 mb-1">
                  Start Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800"
                />
                <p className="mt-1 text-[10px] text-stone-400">When the offer goes live</p>
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-xs font-semibold text-stone-700 mb-1">
                  End Date &amp; Time <span className="font-normal text-stone-400">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-800 ${
                    fieldErrors.endDate
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                />
                <p className="mt-1 text-[10px] text-stone-400">Leave blank for indefinite run</p>
                {fieldErrors.endDate && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.endDate}</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Mobile / Tablet bottom action row */}
          <div className="flex items-center justify-end space-x-2 pt-1 lg:hidden">
            <Link to={ROUTES.OFFERS}>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 shadow-xs"
            >
              {publishBtnContent}
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN — Sticky Live Preview, Publication Settings & Actions
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:sticky lg:top-4 space-y-4">

          {/* 1. Storefront Live Preview Card */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden font-sans">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/60">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-stone-100 shrink-0">
                  <Eye className="w-3.5 h-3.5 text-brand-primary" />
                </span>
                <span className="text-xs font-semibold text-stone-800 uppercase tracking-wide">
                  Storefront Preview
                </span>
              </div>
              <span className="text-[10px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                Live Card
              </span>
            </div>

            <div className="p-3.5">
              {/* Mock Storefront Offer Card */}
              <div className="rounded-lg border border-stone-200 overflow-hidden bg-stone-900 text-white relative shadow-2xs">
                {/* Banner Image Area */}
                <div className="aspect-16/9 sm:aspect-21/9 bg-stone-800 relative overflow-hidden">
                  {formData.imageUrl && !imgPreviewError ? (
                    <img
                      src={formData.imageUrl}
                      alt="Storefront Banner Preview"
                      className="w-full h-full object-cover object-center opacity-90 transition-opacity duration-200"
                      onError={() => setImgPreviewError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 p-4 text-center bg-stone-900">
                      <ImageIcon className="w-6 h-6 mb-1 text-stone-600" />
                      <span className="text-[11px] text-stone-400 font-medium">Upload banner image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950/90 via-stone-950/30 to-transparent pointer-events-none" />
                  <div className="absolute top-2 left-2 flex items-center space-x-1 bg-amber-500/90 text-stone-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs backdrop-blur-xs">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Special Offer</span>
                  </div>
                </div>

                {/* Offer Card Body */}
                <div className="p-3 space-y-1.5 bg-stone-950">
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-100 line-clamp-1 leading-snug">
                    {formData.title || 'Your Offer Headline Here'}
                  </h4>
                  <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                    {formData.description || 'Campaign description copy will appear here...'}
                  </p>
                  {formData.offerDetails && (
                    <p className="text-[10px] text-stone-400 italic line-clamp-1">
                      *{formData.offerDetails}
                    </p>
                  )}
                  <div className="pt-1.5">
                    <span className="inline-block px-3 py-1 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-brand-primary/90 transition-colors shadow-2xs">
                      {formData.ctaLabel || 'Shop Now'} &rarr;
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 text-center mt-2 leading-relaxed">
                Live customer storefront appearance.
              </p>
            </div>
          </div>

          {/* 2. Publication Settings Card */}
          <SectionCard title="Publication Settings" icon={Tag}>
            <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-semibold text-stone-900 block">Active Status</span>
                <span className="text-[11px] text-stone-500 block leading-tight">
                  {formData.isActive ? 'Offer is eligible to be shown' : 'Offer is disabled / draft'}
                </span>
              </div>
              <ToggleSwitch
                checked={formData.isActive}
                onChange={(val) => setFormData((p) => ({ ...p, isActive: val }))}
                label="Toggle active status"
              />
            </div>
          </SectionCard>

          {/* 3. Offer Actions Card (Desktop Sidebar) */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-3.5 space-y-2">
            <Button
              type="submit"
              form="offer-form"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              className="inline-flex items-center justify-center space-x-1.5 shadow-xs"
            >
              {publishBtnContent}
            </Button>

            <Link to={ROUTES.OFFERS} className="block">
              <Button
                variant="outline"
                fullWidth
                disabled={isSubmitting}
                className="justify-center text-xs"
              >
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default OfferFormPage;
