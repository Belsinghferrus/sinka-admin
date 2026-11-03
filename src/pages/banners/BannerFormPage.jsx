import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Type,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import bannerService from '../../services/banner.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import { BannerImageUploader } from '../../components/banners/BannerImageUploader.jsx';
import { BannerHeroPreview } from '../../components/banners/BannerHeroPreview.jsx';
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

export function BannerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form Field State
  const [formData, setFormData] = useState({
    image: '',
    imageKey: null,
    altText: '',
    eyebrow: '',
    title: '',
    subtitle: '',
    ctaText: 'Shop Collection',
    ctaLink: '/shop',
    sortOrder: 0,
    isActive: true,
    startDate: '',
    endDate: '',
  });

  // Independent Content Visibility Toggles (Default: all text OFF)
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [showEyebrow, setShowEyebrow] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCta, setShowCta] = useState(false);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Load existing banner data if editing
  useEffect(() => {
    if (!isEditing) return;

    let isMounted = true;
    async function loadBanner() {
      setIsLoading(true);
      setError(null);
      try {
        const banner = await bannerService.getBannerById(id);
        if (!banner) {
          throw new Error('Homepage banner not found.');
        }
        if (isMounted) {
          // Derive sensible toggle states from saved content
          const hasEyebrow = Boolean(banner.eyebrow && banner.eyebrow.trim());
          const hasTitle = Boolean(banner.title && banner.title.trim());
          const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim());
          const hasCta = Boolean(banner.ctaText && banner.ctaText.trim());
          const hasAnyText = hasEyebrow || hasTitle || hasSubtitle || hasCta;

          setFormData({
            image: banner.image || '',
            imageKey: banner.imageKey || null,
            altText: banner.altText || '',
            eyebrow: banner.eyebrow || '',
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            ctaText: banner.ctaText || 'Shop Collection',
            ctaLink: banner.ctaLink || '/shop',
            sortOrder: banner.sortOrder ?? 0,
            isActive: Boolean(banner.isActive),
            startDate: toDatetimeLocalValue(banner.startDate),
            endDate: toDatetimeLocalValue(banner.endDate),
          });

          // Restore saved toggle states
          setShowTextOverlay(hasAnyText);
          setShowEyebrow(hasEyebrow);
          setShowTitle(hasTitle);
          setShowSubtitle(hasSubtitle);
          setShowCta(hasCta);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load banner details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBanner();
    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  // Form field change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Dedicated image uploader callback
  const handleImageUploaded = ({ url, key }) => {
    setFormData((prev) => ({
      ...prev,
      image: url || '',
      imageKey: key || null,
      altText: prev.altText || prev.title || '',
    }));

    if (fieldErrors.image) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.image;
        return copy;
      });
    }
  };

  // Master Toggle Change Handler
  const handleMasterOverlayToggle = (enable) => {
    setShowTextOverlay(enable);
    if (!enable) {
      // Clear field errors for text fields when overlay is turned off
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.title;
        delete copy.subtitle;
        delete copy.eyebrow;
        delete copy.ctaText;
        delete copy.ctaLink;
        return copy;
      });
    }
  };

  // Client-side validation
  const validate = () => {
    const errors = {};

    // 1. Mandatory Banner Image
    if (!formData.image || !formData.imageKey) {
      errors.image = 'A hero banner image is required. Please upload an image.';
    }

    // 2. Validate Text Fields ONLY when Text Overlay is enabled
    if (showTextOverlay) {
      // Headline validation (only when headline toggle is enabled)
      if (showTitle) {
        const trimmedTitle = formData.title.trim();
        if (!trimmedTitle) {
          errors.title = 'Banner headline is required when headline toggle is ON.';
        } else if (trimmedTitle.length < 2) {
          errors.title = 'Banner headline must be at least 2 characters.';
        } else if (trimmedTitle.length > 150) {
          errors.title = 'Banner headline cannot exceed 150 characters.';
        }
      }

      // Eyebrow validation (only when eyebrow toggle is enabled)
      if (showEyebrow && formData.eyebrow && formData.eyebrow.length > 100) {
        errors.eyebrow = 'Eyebrow cannot exceed 100 characters.';
      }

      // Subtitle validation (only when subtitle toggle is enabled)
      if (showSubtitle && formData.subtitle && formData.subtitle.length > 300) {
        errors.subtitle = 'Subtitle cannot exceed 300 characters.';
      }

      // CTA validation (only when CTA toggle is enabled)
      if (showCta) {
        if (!formData.ctaText || !formData.ctaText.trim()) {
          errors.ctaText = 'CTA button text is required when CTA toggle is ON.';
        } else if (formData.ctaText.length > 50) {
          errors.ctaText = 'CTA button text cannot exceed 50 characters.';
        }

        if (formData.ctaLink && formData.ctaLink.length > 500) {
          errors.ctaLink = 'CTA destination URL cannot exceed 500 characters.';
        }
      }
    }

    // 3. Display Order Validation
    if (formData.sortOrder === '' || isNaN(Number(formData.sortOrder)) || Number(formData.sortOrder) < 0) {
      errors.sortOrder = 'Sort order must be a non-negative number (0, 1, 2...).';
    }

    // 4. Scheduling Window Validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    return errors;
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Build payload ensuring disabled fields are never submitted with stale values
    const effectiveEyebrow = showTextOverlay && showEyebrow && formData.eyebrow ? formData.eyebrow.trim() : '';
    const effectiveTitle = showTextOverlay && showTitle && formData.title ? formData.title.trim() : '';
    const effectiveSubtitle = showTextOverlay && showSubtitle && formData.subtitle ? formData.subtitle.trim() : '';
    const effectiveCtaText = showTextOverlay && showCta && formData.ctaText ? formData.ctaText.trim() : '';
    const effectiveCtaLink = showTextOverlay && showCta && formData.ctaLink ? formData.ctaLink.trim() : '';

    const effectiveAltText = formData.altText
      ? formData.altText.trim()
      : effectiveTitle || 'Promotional Banner';

    const payload = {
      image: formData.image.trim(),
      imageKey: formData.imageKey.trim(),
      altText: effectiveAltText,
      eyebrow: effectiveEyebrow,
      title: effectiveTitle,
      subtitle: effectiveSubtitle,
      ctaText: effectiveCtaText,
      ctaLink: effectiveCtaLink,
      sortOrder: Number(formData.sortOrder) || 0,
      isActive: Boolean(formData.isActive),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
    };

    try {
      if (isEditing) {
        await bannerService.updateBanner(id, payload);
      } else {
        await bannerService.createBanner(payload);
      }
      navigate(ROUTES.BANNERS);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        `Failed to ${isEditing ? 'update' : 'create'} homepage banner.`;
      setError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingIndicator size="lg" message="Loading banner details..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center space-x-3">
          <Link
            to={ROUTES.BANNERS}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="Back to Banners"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-md bg-stone-100 text-brand-primary">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
                {isEditing ? 'Edit Homepage Banner' : 'Create Homepage Banner'}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              {isEditing
                ? 'Adjust artwork, configure optional text overlay, destination link, and scheduling.'
                : 'Publish a new full-bleed or narrative hero slide to the customer storefront carousel.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={ROUTES.BANNERS}>
            <Button variant="secondary" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="banner-form"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Banner' : 'Publish Banner'}</span>
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-2 animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Could not save banner</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: PROMINENT FULL-WIDTH STOREFRONT HERO PREVIEW */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-brand-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Live Storefront Hero Carousel Preview
            </h2>
          </div>
          <span className="text-[11px] text-stone-400">
            {showTextOverlay
              ? 'Previewing banner with custom text overlay & CTA button'
              : 'Previewing pure image-only banner (no text overlay)'}
          </span>
        </div>

        <BannerHeroPreview
          image={formData.image}
          altText={formData.altText}
          showTextOverlay={showTextOverlay}
          showEyebrow={showEyebrow}
          eyebrow={formData.eyebrow}
          showTitle={showTitle}
          title={formData.title}
          showSubtitle={showSubtitle}
          subtitle={formData.subtitle}
          showCta={showCta}
          ctaText={formData.ctaText}
          ctaLink={formData.ctaLink}
          isActive={formData.isActive}
          sortOrder={Number(formData.sortOrder) || 0}
          showChrome={true}
          allowViewportToggle={true}
        />
      </div>

      {/* SECTION 2: STRUCTURED FORM CONTROLS */}
      <form
        id="banner-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        noValidate
      >
        {/* Left Column (5 Cols on LG): Artwork & Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Artwork Upload (Mandatory) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
              <span className="p-1 rounded bg-stone-100 text-brand-primary">
                <ImageIcon className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                1. Banner Artwork (Required)
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Artwork File <span className="text-red-500">*</span>
              </label>
              <BannerImageUploader
                value={formData.image}
                imageKey={formData.imageKey}
                onChange={handleImageUploaded}
                disabled={isSubmitting}
                error={fieldErrors.image}
              />
            </div>

            {/* Alt text for accessibility */}
            <div>
              <label
                htmlFor="altText"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Image Alt Text <span className="text-stone-400 font-normal">(Accessibility & SEO)</span>
              </label>
              <input
                type="text"
                id="altText"
                name="altText"
                value={formData.altText}
                onChange={handleInputChange}
                maxLength={200}
                placeholder="e.g. Minimalist living room with solid teak lounge chair and neutral tones"
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400"
              />
              <p className="mt-1 text-[10px] text-stone-500">
                Screen-reader description. Defaults to headline or "Promotional Banner" if left blank.
              </p>
            </div>
          </div>

          {/* Card 2: Display Priority & Scheduling */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-stone-100">
              <span className="p-1 rounded bg-stone-100 text-brand-primary">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
                2. Carousel Settings & Timing
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Order */}
              <div>
                <label
                  htmlFor="sortOrder"
                  className="block text-xs font-semibold text-stone-700 mb-1"
                >
                  Display Order Position
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  name="sortOrder"
                  min="0"
                  step="1"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 ${
                    fieldErrors.sortOrder
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                />
                <p className="mt-1 text-[10px] text-stone-500">
                  Lower numbers display first (0 is highest priority).
                </p>
                {fieldErrors.sortOrder && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.sortOrder}</p>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Publish Status
                </label>
                <div className="h-9 flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-50">
                  <span className="text-xs text-stone-700 font-medium truncate mr-1">
                    {formData.isActive ? 'Active on Storefront' : 'Hidden (Draft)'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      formData.isActive ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                    role="switch"
                    aria-checked={formData.isActive}
                  >
                    <span className="sr-only">Toggle banner active</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        formData.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Scheduling */}
            <div className="pt-3 border-t border-stone-100">
              <div className="flex items-center space-x-1.5 mb-2.5 text-xs font-semibold text-stone-700">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>Optional Scheduling Window</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Start Date */}
                <div>
                  <label htmlFor="startDate" className="block text-[11px] font-medium text-stone-600 mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800"
                  />
                  <p className="mt-0.5 text-[10px] text-stone-400">Immediate if blank</p>
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="endDate" className="block text-[11px] font-medium text-stone-600 mb-1">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-800 ${
                      fieldErrors.endDate
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-stone-300 focus:ring-brand-primary'
                    }`}
                  />
                  <p className="mt-0.5 text-[10px] text-stone-400">Indefinite if blank</p>
                  {fieldErrors.endDate && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols on LG): Text Overlay & Content Toggles */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-5">
            {/* Master Text Overlay Toggle Card Header */}
            <div className="pb-4 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded bg-stone-100 text-brand-primary">
                    <Type className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                      Storefront Text Overlay
                    </h3>
                    <p className="text-xs text-stone-500">
                      Master control for headlines, descriptions, badges, and CTA buttons.
                    </p>
                  </div>
                </div>

                {/* Master Switch */}
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold ${showTextOverlay ? 'text-brand-primary' : 'text-stone-500'}`}>
                    {showTextOverlay ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMasterOverlayToggle(!showTextOverlay)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      showTextOverlay ? 'bg-brand-primary' : 'bg-stone-300'
                    }`}
                    role="switch"
                    aria-checked={showTextOverlay}
                    title="Toggle Text Overlay"
                  >
                    <span className="sr-only">Toggle Text Overlay</span>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        showTextOverlay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Friendly guidance message */}
              <div className="mt-3 p-3 rounded-lg text-xs flex items-start space-x-2 bg-stone-50 border border-stone-200">
                <Info className="w-4 h-4 text-stone-500 mt-0.5 shrink-0" />
                <p className="text-stone-600 leading-relaxed">
                  {showTextOverlay ? (
                    <span>
                      <strong>Text overlay is ON.</strong> Use the independent toggles below to choose which narrative elements appear over the banner image.
                    </span>
                  ) : (
                    <span>
                      <strong>Text overlay is OFF (Pure Image Banner).</strong> This banner will display as a full-bleed visual image on the storefront without headings, dark gradient scrim, or buttons.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* INDEPENDENT CONTENT TOGGLES & INPUTS */}
            {showTextOverlay ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. EYEBROW LABEL TOGGLE & INPUT */}
                <div className={`p-4 rounded-xl border transition-colors ${
                  showEyebrow ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50/60 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Show Eyebrow Label
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Small uppercase badge displayed directly above the headline (e.g. "Festive Spotlight")
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEyebrow(!showEyebrow)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        showEyebrow ? 'bg-brand-primary' : 'bg-stone-300'
                      }`}
                      role="switch"
                      aria-checked={showEyebrow}
                    >
                      <span className="sr-only">Toggle Eyebrow</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          showEyebrow ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {showEyebrow && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="eyebrow" className="text-xs font-semibold text-stone-700">
                          Eyebrow Text
                        </label>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {formData.eyebrow.length}/100
                        </span>
                      </div>
                      <input
                        type="text"
                        id="eyebrow"
                        name="eyebrow"
                        value={formData.eyebrow}
                        onChange={handleInputChange}
                        maxLength={100}
                        placeholder="e.g. Sinka Living Edit, Limited Edition"
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  )}
                </div>

                {/* 2. MAIN HEADLINE TOGGLE & INPUT */}
                <div className={`p-4 rounded-xl border transition-colors ${
                  showTitle ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50/60 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Show Main Headline
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Primary bold headline text (e.g. "Handcrafted Solid Teak Living Essentials")
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTitle(!showTitle)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        showTitle ? 'bg-brand-primary' : 'bg-stone-300'
                      }`}
                      role="switch"
                      aria-checked={showTitle}
                    >
                      <span className="sr-only">Toggle Headline</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          showTitle ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {showTitle && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="title" className="text-xs font-semibold text-stone-700">
                          Headline Text <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {formData.title.length}/150
                        </span>
                      </div>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        maxLength={150}
                        placeholder="e.g. Handcrafted Solid Teak Living Essentials"
                        className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 ${
                          fieldErrors.title
                            ? 'border-red-400 focus:ring-red-500'
                            : 'border-stone-300 focus:ring-brand-primary'
                        }`}
                      />
                      {fieldErrors.title && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {fieldErrors.title}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. SUBTITLE TOGGLE & INPUT */}
                <div className={`p-4 rounded-xl border transition-colors ${
                  showSubtitle ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50/60 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Show Subtitle / Description
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Secondary narrative copy beneath the headline
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSubtitle(!showSubtitle)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        showSubtitle ? 'bg-brand-primary' : 'bg-stone-300'
                      }`}
                      role="switch"
                      aria-checked={showSubtitle}
                    >
                      <span className="sr-only">Toggle Subtitle</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          showSubtitle ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {showSubtitle && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="subtitle" className="text-xs font-semibold text-stone-700">
                          Subtitle Copy
                        </label>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {formData.subtitle.length}/300
                        </span>
                      </div>
                      <textarea
                        id="subtitle"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleInputChange}
                        rows={2}
                        maxLength={300}
                        placeholder="e.g. Timeless aesthetics, sustainably harvested hardwood, and mindful living essentials."
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* 4. CTA BUTTON TOGGLE & INPUTS */}
                <div className={`p-4 rounded-xl border transition-colors ${
                  showCta ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50/60 border-stone-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-stone-900 block">
                        Show Call to Action (CTA) Button
                      </span>
                      <span className="text-[11px] text-stone-500 block mt-0.5">
                        Interactive button routing customers to collections or product categories
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCta(!showCta)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        showCta ? 'bg-brand-primary' : 'bg-stone-300'
                      }`}
                      role="switch"
                      aria-checked={showCta}
                    >
                      <span className="sr-only">Toggle CTA</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          showCta ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {showCta && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* CTA Label */}
                        <div>
                          <label htmlFor="ctaText" className="block text-xs font-semibold text-stone-700 mb-1">
                            CTA Button Label <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="ctaText"
                            name="ctaText"
                            value={formData.ctaText}
                            onChange={handleInputChange}
                            maxLength={50}
                            placeholder="e.g. Shop Collection, Explore Sofas"
                            className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 ${
                              fieldErrors.ctaText
                                ? 'border-red-400 focus:ring-red-500'
                                : 'border-stone-300 focus:ring-brand-primary'
                            }`}
                          />
                          {fieldErrors.ctaText && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.ctaText}</p>
                          )}
                        </div>

                        {/* CTA Destination */}
                        <div>
                          <label htmlFor="ctaLink" className="block text-xs font-semibold text-stone-700 mb-1">
                            Destination Link / Path
                          </label>
                          <input
                            type="text"
                            id="ctaLink"
                            name="ctaLink"
                            value={formData.ctaLink}
                            onChange={handleInputChange}
                            maxLength={500}
                            placeholder="e.g. /shop, /products?category=sofas"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 text-center rounded-xl border border-dashed border-stone-300 bg-stone-50/50">
                <div className="w-10 h-10 rounded-full bg-stone-200/70 text-stone-500 flex items-center justify-center mx-auto mb-2">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-stone-800">Pure Image Banner Mode</p>
                <p className="text-[11px] text-stone-500 max-w-sm mx-auto mt-0.5">
                  No text, headline, or button will be rendered. Customers will see your edge-to-edge photography in full clarity.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMasterOverlayToggle(true)}
                  className="mt-3 text-xs inline-flex items-center space-x-1"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Enable Text Overlay</span>
                </Button>
              </div>
            )}
          </div>

          {/* Bottom Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <Link to={ROUTES.BANNERS}>
              <Button variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Banner' : 'Publish Banner'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BannerFormPage;
