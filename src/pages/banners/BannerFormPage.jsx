import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  Layers,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Type,
  Info,
  Monitor,
  Smartphone,
  FileImage,
  ChevronLeft,
  ChevronRight,
  Percent,
  ShieldCheck,
  Truck,
  CreditCard,
} from 'lucide-react';
import bannerService from '../../services/banner.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import { BannerImageUploader } from '../../components/banners/BannerImageUploader.jsx';
import { ROUTES } from '../../constants.js';

/**
 * Format Date object or ISO string to `YYYY-MM-DDTHH:MM` for datetime-local inputs.
 */
function toDatetimeLocalValue(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Reusable accessible toggle switch. */
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

/** Compact card section with titled header. */
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
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

/** Toggle + collapsible input row for content elements. */
function ContentToggleRow({ label, description, checked, onToggle, children, error }) {
  return (
    <div className={`rounded-lg border transition-colors ${
      checked ? 'bg-amber-50/40 border-amber-200' : 'bg-stone-50/50 border-stone-200'
    }`}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="min-w-0 pr-3">
          <span className="text-xs font-semibold text-stone-900 block">{label}</span>
          {description && (
            <span className="text-[11px] text-stone-500 block mt-0.5 leading-snug">{description}</span>
          )}
        </div>
        <ToggleSwitch checked={checked} onChange={onToggle} label={`Toggle ${label}`} />
      </div>
      {checked && children && (
        <div className="px-3 pb-3 pt-1 border-t border-amber-200/50 animate-in fade-in duration-150">
          {children}
          {error && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact storefront banner preview card — right column.
 * Proportional preview (aspect-video for desktop, phone frame for mobile).
 * Updates live as form state changes.
 */
function CompactBannerPreview({
  image, altText,
  showTextOverlay, showEyebrow, eyebrow,
  showTitle, title, showSubtitle, subtitle,
  showCta, ctaText, ctaLink,
  isActive, sortOrder,
}) {
  const [viewportMode, setViewportMode] = useState('desktop');
  const [imgError, setImgError] = useState(false);
  const [prevImg, setPrevImg] = useState(image);

  if (image !== prevImg) { setPrevImg(image); setImgError(false); }

  const ae = showTextOverlay && showEyebrow   && eyebrow?.trim()   ? eyebrow.trim()   : '';
  const at = showTextOverlay && showTitle     && title?.trim()     ? title.trim()     : '';
  const as_ = showTextOverlay && showSubtitle && subtitle?.trim()  ? subtitle.trim()  : '';
  const ac = showTextOverlay && showCta       && ctaText?.trim()   ? ctaText.trim()   : '';
  const al = showTextOverlay && showCta       && ctaLink?.trim()   ? ctaLink.trim()   : '';
  const hasText = Boolean(ae || at || as_ || ac);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 bg-stone-50/60">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-md bg-stone-100 shrink-0">
            <Eye className="w-3.5 h-3.5 text-brand-primary" />
          </span>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-stone-800 uppercase tracking-wide">Live Preview</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-stone-400 leading-none mt-0.5">
              {viewportMode === 'desktop' ? 'Desktop viewport' : 'Mobile viewport'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-stone-100 text-stone-500 border border-stone-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
            <span>{isActive ? 'Active' : 'Draft'}</span>
          </span>
          <span className="text-[10px] font-mono font-semibold text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded">
            #{sortOrder}
          </span>

          {/* Viewport switcher */}
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewportMode('desktop')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md inline-flex items-center space-x-1 transition-colors ${
                viewportMode === 'desktop'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Desktop preview"
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('mobile')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md inline-flex items-center space-x-1 transition-colors ${
                viewportMode === 'mobile'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Mobile preview"
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className={`w-full flex items-center justify-center transition-all duration-300 ${
        viewportMode === 'mobile' ? 'bg-stone-200/70 p-5' : 'bg-stone-100 p-0'
      }`}>
        <div className={`relative overflow-hidden select-none transition-all duration-300 ${
          viewportMode === 'mobile'
            ? 'w-[200px] h-[320px] rounded-2xl shadow-xl border-4 border-stone-700'
            : 'w-full aspect-video'
        }`}>
          {image && !imgError ? (
            <img
              src={image}
              alt={altText || at || 'Banner preview'}
              className="w-full h-full object-cover object-center"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-500 p-4 text-center">
              <FileImage className="w-7 h-7 mb-2 opacity-50" />
              <span className="text-[11px] font-medium text-stone-400">
                {image && imgError ? 'Unable to load image' : 'Upload an image to preview'}
              </span>
            </div>
          )}

          {/* Gradient scrim */}
          {hasText && (
            <div
              className={`absolute inset-0 pointer-events-none z-10 ${
                viewportMode === 'mobile'
                  ? 'bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent'
                  : 'bg-gradient-to-r from-stone-950/80 via-stone-950/35 to-transparent'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Text content */}
          {hasText && (
            <div className={`absolute inset-0 z-20 pointer-events-none flex ${
              viewportMode === 'mobile'
                ? 'items-end justify-start px-4 pb-9 pt-4'
                : 'items-center justify-start px-5 py-4'
            }`}>
              <div className="text-left max-w-full">
                {ae && (
                  <div className="inline-flex items-center gap-1 mb-1">
                    <span className="w-3 h-0.5 bg-red-400 rounded-full" aria-hidden="true" />
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-200">{ae}</span>
                  </div>
                )}
                {at && (
                  <h2 className={`font-bold font-heading text-white leading-tight mb-1 drop-shadow-sm line-clamp-2 ${
                    viewportMode === 'mobile' ? 'text-sm' : 'text-base'
                  }`}>{at}</h2>
                )}
                {as_ && (
                  <p className={`text-stone-200/90 leading-snug mb-2 line-clamp-2 ${
                    viewportMode === 'mobile' ? 'text-[9px]' : 'text-[10px]'
                  }`}>{as_}</p>
                )}
                {ac && (
                  <div className="inline-flex items-center px-3 py-1 text-[10px] font-semibold text-white bg-brand-primary rounded shadow-sm">
                    {ac}
                  </div>
                )}
                {al && ac && (
                  <span className="block text-[9px] text-stone-300/70 font-mono mt-1 truncate max-w-[180px]">
                    → {al}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chrome: arrows */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-5 h-5 rounded-full bg-white/70 flex items-center justify-center opacity-70 pointer-events-none" aria-hidden="true">
            <ChevronLeft className="w-3 h-3 text-stone-800" />
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-5 h-5 rounded-full bg-white/70 flex items-center justify-center opacity-70 pointer-events-none" aria-hidden="true">
            <ChevronRight className="w-3 h-3 text-stone-800" />
          </div>

          {/* Slide dots */}
          <div className="absolute bottom-2 inset-x-0 z-30 flex justify-center pointer-events-none" aria-hidden="true">
            <div className="flex items-center space-x-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="w-4 h-1 rounded-full bg-red-400" />
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span className="w-1 h-1 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Trust bar (desktop viewport only) */}
      {viewportMode === 'desktop' && (
        <div className="border-t border-stone-100 bg-stone-50 py-2 px-3">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full bg-red-100 text-brand-secondary flex items-center justify-center shrink-0">
                <Percent className="w-2.5 h-2.5" />
              </div>
              <span className="font-medium text-stone-700 truncate">Instant Savings</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" />
              </div>
              <span className="font-medium text-stone-700 truncate">100% Solid Hardwood</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                <Truck className="w-2.5 h-2.5" />
              </div>
              <span className="font-medium text-stone-700 truncate">Free Delivery</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CreditCard className="w-2.5 h-2.5" />
              </div>
              <span className="font-medium text-stone-700 truncate">No-Cost EMI</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div className="px-4 py-2 border-t border-stone-100">
        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          Updates live as you configure. Actual rendering may vary by device.
        </p>
      </div>
    </div>
  );
}

/**
 * Sinka Admin — Create / Edit Homepage Banner
 *
 * Two-column professional CMS workspace:
 *   Left (~65%):  Banner configuration — Artwork, Text Overlay, Carousel Settings
 *   Right (~35%): Compact sticky live preview + configuration summary
 *
 * All existing backend integration, API calls, validation, upload functionality,
 * scheduling, ordering logic, and business rules are preserved unchanged.
 */
export function BannerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // ── Form State ──────────────────────────────────────────────────────────────
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

  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [showEyebrow, setShowEyebrow]         = useState(false);
  const [showTitle, setShowTitle]             = useState(false);
  const [showSubtitle, setShowSubtitle]       = useState(false);
  const [showCta, setShowCta]                 = useState(false);

  const [isLoading, setIsLoading]     = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Load banner when editing ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;
    let isMounted = true;

    async function loadBanner() {
      setIsLoading(true);
      setError(null);
      try {
        const banner = await bannerService.getBannerById(id);
        if (!banner) throw new Error('Homepage banner not found.');
        if (isMounted) {
          const hasEyebrow  = Boolean(banner.eyebrow?.trim());
          const hasTitle    = Boolean(banner.title?.trim());
          const hasSubtitle = Boolean(banner.subtitle?.trim());
          const hasCta      = Boolean(banner.ctaText?.trim());

          setFormData({
            image:     banner.image     || '',
            imageKey:  banner.imageKey  || null,
            altText:   banner.altText   || '',
            eyebrow:   banner.eyebrow   || '',
            title:     banner.title     || '',
            subtitle:  banner.subtitle  || '',
            ctaText:   banner.ctaText   || 'Shop Collection',
            ctaLink:   banner.ctaLink   || '/shop',
            sortOrder: banner.sortOrder ?? 0,
            isActive:  Boolean(banner.isActive),
            startDate: toDatetimeLocalValue(banner.startDate),
            endDate:   toDatetimeLocalValue(banner.endDate),
          });

          setShowTextOverlay(hasEyebrow || hasTitle || hasSubtitle || hasCta);
          setShowEyebrow(hasEyebrow);
          setShowTitle(hasTitle);
          setShowSubtitle(hasSubtitle);
          setShowCta(hasCta);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load banner details.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBanner();
    return () => { isMounted = false; };
  }, [id, isEditing]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => { const c = { ...prev }; delete c[name]; return c; });
    }
  };

  const handleImageUploaded = ({ url, key }) => {
    setFormData((prev) => ({
      ...prev,
      image:    url  || '',
      imageKey: key  || null,
      altText:  prev.altText || prev.title || '',
    }));
    if (fieldErrors.image) {
      setFieldErrors((prev) => { const c = { ...prev }; delete c.image; return c; });
    }
  };

  const handleMasterOverlayToggle = (enable) => {
    setShowTextOverlay(enable);
    if (!enable) {
      setFieldErrors((prev) => {
        const c = { ...prev };
        ['title','subtitle','eyebrow','ctaText','ctaLink'].forEach((k) => delete c[k]);
        return c;
      });
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {};

    if (!formData.image || !formData.imageKey) {
      errors.image = 'A hero banner image is required. Please upload an image.';
    }

    if (showTextOverlay) {
      if (showTitle) {
        const t = formData.title.trim();
        if (!t)         errors.title = 'Banner headline is required when headline toggle is ON.';
        else if (t.length < 2)   errors.title = 'Banner headline must be at least 2 characters.';
        else if (t.length > 150) errors.title = 'Banner headline cannot exceed 150 characters.';
      }
      if (showEyebrow && formData.eyebrow && formData.eyebrow.length > 100) {
        errors.eyebrow = 'Eyebrow cannot exceed 100 characters.';
      }
      if (showSubtitle && formData.subtitle && formData.subtitle.length > 300) {
        errors.subtitle = 'Subtitle cannot exceed 300 characters.';
      }
      if (showCta) {
        if (!formData.ctaText?.trim()) errors.ctaText = 'CTA button text is required when CTA toggle is ON.';
        else if (formData.ctaText.length > 50) errors.ctaText = 'CTA button text cannot exceed 50 characters.';
        if (formData.ctaLink && formData.ctaLink.length > 500) errors.ctaLink = 'CTA destination URL cannot exceed 500 characters.';
      }
    }

    if (formData.sortOrder === '' || isNaN(Number(formData.sortOrder)) || Number(formData.sortOrder) < 0) {
      errors.sortOrder = 'Sort order must be a non-negative number (0, 1, 2...).';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errors.endDate = 'End date cannot be earlier than start date.';
      }
    }

    return errors;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
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

    const eff = (cond, val) => (cond && val ? val.trim() : '');
    const effectiveEyebrow  = eff(showTextOverlay && showEyebrow,  formData.eyebrow);
    const effectiveTitle    = eff(showTextOverlay && showTitle,    formData.title);
    const effectiveSubtitle = eff(showTextOverlay && showSubtitle, formData.subtitle);
    const effectiveCtaText  = eff(showTextOverlay && showCta,      formData.ctaText);
    const effectiveCtaLink  = eff(showTextOverlay && showCta,      formData.ctaLink);
    const effectiveAltText  = formData.altText?.trim() || effectiveTitle || 'Promotional Banner';

    const payload = {
      image:     formData.image.trim(),
      imageKey:  formData.imageKey.trim(),
      altText:   effectiveAltText,
      eyebrow:   effectiveEyebrow,
      title:     effectiveTitle,
      subtitle:  effectiveSubtitle,
      ctaText:   effectiveCtaText,
      ctaLink:   effectiveCtaLink,
      sortOrder: Number(formData.sortOrder) || 0,
      isActive:  Boolean(formData.isActive),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate:   formData.endDate   ? new Date(formData.endDate).toISOString()   : null,
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

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <LoadingIndicator size="lg" message="Loading banner details..." />
      </div>
    );
  }

  // ── Shared publish button props ───────────────────────────────────────────────
  const publishBtn = (
    <>
      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Banner' : 'Publish Banner'}</span>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 font-sans">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-start space-x-3">
          <Link
            to={ROUTES.BANNERS}
            className="mt-0.5 p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
            title="Back to Banners"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-1.5 mb-0.5">
              <Link
                to={ROUTES.BANNERS}
                className="text-[11px] text-stone-400 hover:text-brand-primary transition-colors"
              >
                Banners
              </Link>
              <span className="text-[11px] text-stone-300">/</span>
              <span className="text-[11px] text-stone-500">
                {isEditing ? 'Edit Banner' : 'New Banner'}
              </span>
            </div>
            <h1 className="text-lg font-heading font-semibold text-stone-900 tracking-tight leading-tight">
              {isEditing ? 'Edit Homepage Banner' : 'Create Homepage Banner'}
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              {isEditing
                ? 'Update artwork, text overlay, scheduling and visibility settings.'
                : 'Configure and publish a new hero slide for the Sinka storefront carousel.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Link to={ROUTES.BANNERS}>
            <Button variant="secondary" size="sm">Cancel</Button>
          </Link>
          <Button
            type="submit"
            form="banner-form"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 shadow-xs"
          >
            {publishBtn}
          </Button>
        </div>
      </div>

      {/* ── Global Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Could not save banner</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Two-Column Workspace ─────────────────────────────────────────────── */}
      <form
        id="banner-form"
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] gap-5 items-start"
      >

        {/* ══════════════════════════════════════════════════════════════════════
            LEFT COLUMN — Configuration
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* A. Banner Artwork */}
          <SectionCard title="Banner Artwork" icon={ImageIcon}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">
                    Artwork File <span className="text-red-500">*</span>
                  </label>
                  {!formData.image && (
                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                      1920 × 700 px recommended · JPG / PNG / WebP · Max 8 MB
                    </span>
                  )}
                </div>
                <BannerImageUploader
                  value={formData.image}
                  imageKey={formData.imageKey}
                  onChange={handleImageUploaded}
                  disabled={isSubmitting}
                  error={fieldErrors.image}
                />
              </div>

              <div>
                <label htmlFor="altText" className="block text-xs font-semibold text-stone-700 mb-1">
                  Image Alt Text
                  <span className="ml-1 font-normal text-stone-400 text-[11px]">(Accessibility &amp; SEO)</span>
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
                <p className="mt-1 text-[10px] text-stone-400">
                  Defaults to headline text or &ldquo;Promotional Banner&rdquo; if blank.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* B. Storefront Text Overlay */}
          <SectionCard title="Storefront Text Overlay" icon={Type}>
            <div className="space-y-3">

              {/* Master toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200">
                <div className="flex items-start space-x-2 min-w-0 pr-3">
                  <Info className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-stone-900 block">
                      {showTextOverlay ? 'Text overlay enabled' : 'Pure image banner (no text overlay)'}
                    </span>
                    <span className="text-[11px] text-stone-500 leading-snug block">
                      {showTextOverlay
                        ? 'Enable individual elements below to show them on the banner.'
                        : 'Banner displays as edge-to-edge photography — no headline or CTA.'}
                    </span>
                  </div>
                </div>
                <ToggleSwitch
                  checked={showTextOverlay}
                  onChange={handleMasterOverlayToggle}
                  label="Toggle text overlay"
                  size="lg"
                />
              </div>

              {showTextOverlay ? (
                <div className="space-y-2 animate-in fade-in duration-200">

                  {/* Eyebrow */}
                  <ContentToggleRow
                    label="Eyebrow Label"
                    description="Small badge above headline (e.g. «Festive Spotlight»)"
                    checked={showEyebrow}
                    onToggle={setShowEyebrow}
                    error={fieldErrors.eyebrow}
                  >
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="eyebrow" className="text-xs font-semibold text-stone-700">Eyebrow Text</label>
                        <span className="text-[10px] text-stone-400 font-mono">{formData.eyebrow.length}/100</span>
                      </div>
                      <input
                        type="text"
                        id="eyebrow"
                        name="eyebrow"
                        value={formData.eyebrow}
                        onChange={handleInputChange}
                        maxLength={100}
                        placeholder="e.g. Sinka Living Edit"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400"
                      />
                    </div>
                  </ContentToggleRow>

                  {/* Headline */}
                  <ContentToggleRow
                    label="Main Headline"
                    description="Primary bold heading displayed prominently over the banner"
                    checked={showTitle}
                    onToggle={setShowTitle}
                    error={fieldErrors.title}
                  >
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="title" className="text-xs font-semibold text-stone-700">
                          Headline Text <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-stone-400 font-mono">{formData.title.length}/150</span>
                      </div>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        maxLength={150}
                        placeholder="e.g. Handcrafted Solid Teak Living Essentials"
                        className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 ${
                          fieldErrors.title ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-brand-primary'
                        }`}
                      />
                    </div>
                  </ContentToggleRow>

                  {/* Subtitle */}
                  <ContentToggleRow
                    label="Subtitle / Description"
                    description="Secondary narrative copy beneath the headline"
                    checked={showSubtitle}
                    onToggle={setShowSubtitle}
                    error={fieldErrors.subtitle}
                  >
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor="subtitle" className="text-xs font-semibold text-stone-700">Subtitle Copy</label>
                        <span className="text-[10px] text-stone-400 font-mono">{formData.subtitle.length}/300</span>
                      </div>
                      <textarea
                        id="subtitle"
                        name="subtitle"
                        value={formData.subtitle}
                        onChange={handleInputChange}
                        rows={2}
                        maxLength={300}
                        placeholder="e.g. Timeless aesthetics, sustainably harvested hardwood, and mindful living essentials."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 resize-none"
                      />
                    </div>
                  </ContentToggleRow>

                  {/* CTA */}
                  <ContentToggleRow
                    label="Call to Action (CTA) Button"
                    description="Interactive button routing customers to a collection or category"
                    checked={showCta}
                    onToggle={setShowCta}
                  >
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="ctaText" className="block text-xs font-semibold text-stone-700 mb-1">
                          Button Label <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="ctaText"
                          name="ctaText"
                          value={formData.ctaText}
                          onChange={handleInputChange}
                          maxLength={50}
                          placeholder="e.g. Shop Collection"
                          className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 ${
                            fieldErrors.ctaText ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-brand-primary'
                          }`}
                        />
                        {fieldErrors.ctaText && <p className="mt-1 text-xs text-red-600">{fieldErrors.ctaText}</p>}
                      </div>
                      <div>
                        <label htmlFor="ctaLink" className="block text-xs font-semibold text-stone-700 mb-1">
                          Destination Link
                        </label>
                        <div className="relative">
                          <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                          <input
                            type="text"
                            id="ctaLink"
                            name="ctaLink"
                            value={formData.ctaLink}
                            onChange={handleInputChange}
                            maxLength={500}
                            placeholder="/shop or /products?category=sofas"
                            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 font-mono"
                          />
                        </div>
                        {fieldErrors.ctaLink && <p className="mt-1 text-xs text-red-600">{fieldErrors.ctaLink}</p>}
                      </div>
                    </div>
                  </ContentToggleRow>
                </div>
              ) : (
                /* Overlay OFF: compact notice */
                <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-stone-300 bg-stone-50/60">
                  <span className="text-[11px] text-stone-500">
                    No text will appear on this banner. Customers see edge-to-edge photography.
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMasterOverlayToggle(true)}
                    className="text-xs shrink-0 ml-3 inline-flex items-center space-x-1"
                  >
                    <Type className="w-3 h-3" />
                    <span>Add Text</span>
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* C. Carousel Settings & Scheduling */}
          <SectionCard title="Carousel Settings &amp; Scheduling" icon={Layers}>
            <div className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display order */}
                <div>
                  <label htmlFor="sortOrder" className="block text-xs font-semibold text-stone-700 mb-1">
                    Display Position
                  </label>
                  <input
                    type="number"
                    id="sortOrder"
                    name="sortOrder"
                    min="0"
                    step="1"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 ${
                      fieldErrors.sortOrder ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-brand-primary'
                    }`}
                  />
                  <p className="mt-1 text-[10px] text-stone-400">Lower numbers display first (0 = highest priority).</p>
                  {fieldErrors.sortOrder && <p className="mt-1 text-xs text-red-600">{fieldErrors.sortOrder}</p>}
                </div>

                {/* Active status */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Publish Status</label>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-stone-50 h-9">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                      <span className="text-xs font-medium text-stone-700">
                        {formData.isActive ? 'Active on storefront' : 'Hidden (Draft)'}
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={formData.isActive}
                      onChange={(val) => setFormData((p) => ({ ...p, isActive: val }))}
                      label="Toggle banner active"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-stone-400">Draft banners are saved but not displayed.</p>
                </div>
              </div>

              {/* Scheduling */}
              <div className="pt-3 border-t border-stone-100">
                <div className="flex items-center space-x-1.5 mb-2.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-semibold text-stone-700">Optional Scheduling Window</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="startDate" className="block text-[11px] font-medium text-stone-600 mb-1">
                      Start Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800"
                    />
                    <p className="mt-0.5 text-[10px] text-stone-400">Immediate if blank.</p>
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-[11px] font-medium text-stone-600 mb-1">
                      End Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-800 ${
                        fieldErrors.endDate ? 'border-red-400 focus:ring-red-400' : 'border-stone-300 focus:ring-brand-primary'
                      }`}
                    />
                    <p className="mt-0.5 text-[10px] text-stone-400">Indefinite if blank.</p>
                    {fieldErrors.endDate && <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p>}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Mobile/tablet bottom action row */}
          <div className="flex items-center justify-end space-x-2 pt-1 xl:hidden">
            <Link to={ROUTES.BANNERS}>
              <Button variant="secondary" size="sm">Cancel</Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 shadow-xs"
            >
              {publishBtn}
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN — Compact Sticky Live Preview + Summary
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="xl:sticky xl:top-6 space-y-3">

          {/* Live preview card */}
          <CompactBannerPreview
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
          />

          {/* Configuration summary */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-4">
            <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wide mb-3">
              Configuration Summary
            </h4>
            <div className="space-y-1.5">
              {[
                {
                  label: 'Artwork',
                  value: formData.image ? (
                    <span className="text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Uploaded</span>
                    </span>
                  ) : (
                    <span className="text-red-500 font-semibold">Required</span>
                  ),
                },
                {
                  label: 'Text Overlay',
                  value: showTextOverlay
                    ? <span className="text-brand-primary font-medium">Enabled</span>
                    : <span className="text-stone-400">Off (image-only)</span>,
                },
                {
                  label: 'Status',
                  value: formData.isActive
                    ? <span className="text-emerald-600 font-medium">Active</span>
                    : <span className="text-stone-400">Draft</span>,
                },
                {
                  label: 'Position',
                  value: <span className="font-mono text-stone-600">#{formData.sortOrder}</span>,
                },
                {
                  label: 'Scheduled',
                  value: formData.startDate || formData.endDate
                    ? <span className="text-amber-600 font-medium">Yes</span>
                    : <span className="text-stone-400">No</span>,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0 text-xs"
                >
                  <span className="text-stone-500">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop-only action buttons in right column */}
          <div className="hidden xl:flex items-center space-x-2">
            <Link to={ROUTES.BANNERS} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full justify-center">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              form="banner-form"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center space-x-1.5 shadow-xs"
            >
              {publishBtn}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BannerFormPage;
