import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Tag,
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import offerService from '../../services/offer.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
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

export function OfferFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
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

  // Fetch offer when editing
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
            ctaLabel: offer.ctaLabel || 'Shop Now',
            ctaUrl: offer.ctaUrl || '/products',
            offerDetails: offer.offerDetails || '',
            priority: offer.priority ?? 0,
            startDate: toDatetimeLocalValue(offer.startDate || new Date()),
            endDate: toDatetimeLocalValue(offer.endDate),
            isActive: Boolean(offer.isActive),
          });
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

    // Clear field-specific error when user edits it
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

    if (!formData.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required.';
    } else if (!/^https?:\/\/.+/i.test(formData.imageUrl.trim())) {
      errors.imageUrl = 'Image URL must be a valid HTTP or HTTPS web address.';
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
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Prepare payload matching backend Zod schema
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
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
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
        <LoadingIndicator size="lg" message="Loading promotional offer data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-5xl">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to={ROUTES.OFFERS}
            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            title="Return to Offers List"
            aria-label="Back to offers list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900">
              {isEditing ? 'Edit Promotional Offer' : 'Create Promotional Offer'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {isEditing
                ? 'Update offer copy, imagery, schedules, and storefront banner settings.'
                : 'Configure and publish a new promotional campaign banner for Sinka Home & Living.'}
            </p>
          </div>
        </div>
      </div>

      {/* Global Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Unable to save offer</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* General Information Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
                <Tag className="w-4 h-4 text-brand-primary" />
                <span>Campaign Details</span>
              </h3>

              {/* Title */}
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
                  className={`w-full px-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.title
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                  }`}
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                />
                <div className="flex justify-between mt-1 text-[11px] text-stone-400">
                  {fieldErrors.title ? (
                    <span id="title-error" className="text-red-600 font-medium">{fieldErrors.title}</span>
                  ) : (
                    <span>Clear, high-impact headline for the hero banner</span>
                  )}
                  <span>{formData.title.length}/120</span>
                </div>
              </div>

              {/* Description */}
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
                  className={`w-full px-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.description
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                  }`}
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                />
                <div className="flex justify-between mt-1 text-[11px] text-stone-400">
                  {fieldErrors.description ? (
                    <span id="description-error" className="text-red-600 font-medium">{fieldErrors.description}</span>
                  ) : (
                    <span>Customer-facing offer summary (max 500 characters)</span>
                  )}
                  <span>{formData.description.length}/500</span>
                </div>
              </div>

              {/* Offer Details / Fine Print */}
              <div>
                <label htmlFor="offerDetails" className="block text-xs font-semibold text-stone-700 mb-1">
                  Fine Print / Offer Terms (Optional)
                </label>
                <input
                  type="text"
                  id="offerDetails"
                  name="offerDetails"
                  value={formData.offerDetails}
                  onChange={handleChange}
                  placeholder="e.g. Valid through May 15. Cannot be combined with other discount codes."
                  maxLength={255}
                  className={`w-full px-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.offerDetails
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                  }`}
                />
                <div className="flex justify-between mt-1 text-[11px] text-stone-400">
                  {fieldErrors.offerDetails ? (
                    <span className="text-red-600 font-medium">{fieldErrors.offerDetails}</span>
                  ) : (
                    <span>Terms, exclusions, or coupon requirements (max 255 characters)</span>
                  )}
                  <span>{formData.offerDetails.length}/255</span>
                </div>
              </div>
            </div>

            {/* Media & Action Links Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
                <ImageIcon className="w-4 h-4 text-brand-primary" />
                <span>Media &amp; Call to Action</span>
              </h3>

              {/* Image URL */}
              <div>
                <label htmlFor="imageUrl" className="block text-xs font-semibold text-stone-700 mb-1">
                  Banner Image URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/photo-..."
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.imageUrl
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                    }`}
                  />
                  <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
                {fieldErrors.imageUrl && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.imageUrl}</p>
                )}
              </div>

              {/* Call to Action Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className={`w-full px-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.ctaLabel
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
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
                    <input
                      type="text"
                      id="ctaUrl"
                      name="ctaUrl"
                      value={formData.ctaUrl}
                      onChange={handleChange}
                      placeholder="/products?category=living"
                      maxLength={500}
                      className={`w-full pl-9 pr-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.ctaUrl
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                      }`}
                    />
                    <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  {fieldErrors.ctaUrl && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.ctaUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Scheduling & Priority Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <span>Scheduling &amp; Priority</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className={`w-full px-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.priority
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-stone-400">
                    Highest number takes storefront precedence
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
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">When the offer goes live</p>
                </div>

                {/* End Date */}
                <div>
                  <label htmlFor="endDate" className="block text-xs font-semibold text-stone-700 mb-1">
                    End Date &amp; Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border rounded-md shadow-xs focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.endDate
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Leave blank for indefinite run</p>
                  {fieldErrors.endDate && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Live Preview Column */}
          <div className="space-y-5">
            {/* Publication Status Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 border-b border-stone-100 pb-2">
                Publication Settings
              </h3>

              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-md border border-stone-200">
                <div>
                  <span className="text-xs font-semibold text-stone-900 block">Active Status</span>
                  <span className="text-[11px] text-stone-500 block">
                    {formData.isActive ? 'Offer is eligible to be shown' : 'Offer is disabled / draft'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  icon={Save}
                >
                  {isEditing ? 'Save Offer Changes' : 'Publish Offer'}
                </Button>
                <Link to={ROUTES.OFFERS} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </div>

            {/* Live Storefront Preview Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-stone-600" />
                  <span>Storefront Preview</span>
                </h3>
                <span className="text-[10px] uppercase font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                  Live Preview
                </span>
              </div>

              {/* Mock Banner */}
              <div className="rounded-lg border border-stone-200 overflow-hidden bg-stone-900 text-white relative shadow-sm">
                <div className="h-32 sm:h-36 bg-stone-800 relative overflow-hidden">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover opacity-75"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-500 text-xs">
                      No image URL specified
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950/90 via-stone-950/40 to-transparent" />
                  <div className="absolute top-2 left-2 flex items-center space-x-1 bg-amber-500/90 text-stone-900 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Special Offer</span>
                  </div>
                </div>

                <div className="p-3.5 space-y-1.5 bg-stone-950">
                  <h4 className="font-heading font-bold text-xs sm:text-sm text-stone-100 line-clamp-1">
                    {formData.title || 'Your Offer Headline Here'}
                  </h4>
                  <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                    {formData.description || 'Campaign description copy will appear here...'}
                  </p>
                  {formData.offerDetails && (
                    <p className="text-[10px] text-stone-400 italic">
                      *{formData.offerDetails}
                    </p>
                  )}
                  <div className="pt-2">
                    <span className="inline-block px-3 py-1 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-brand-primary/90 transition-colors">
                      {formData.ctaLabel || 'Shop Now'} &rarr;
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 text-center">
                Simulated appearance as viewed on the customer storefront.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default OfferFormPage;
