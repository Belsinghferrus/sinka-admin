import { Link } from 'react-router-dom';
import {
  X,
  Edit,
  ExternalLink,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { BannerHeroPreview } from './BannerHeroPreview.jsx';
import { ROUTES } from '../../constants.js';
import Button from '../ui/Button.jsx';

/**
 * Modal dialog for inspecting a homepage hero banner in storefront preview mode.
 *
 * @param {object} props
 * @param {object|null} props.banner - Banner record
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Modal dismissal handler
 */
export function BannerPreviewModal({ banner, isOpen, onClose }) {
  if (!isOpen || !banner) return null;

  const bannerId = banner.id || banner._id;
  const editUrl = bannerId ? ROUTES.BANNERS_EDIT.replace(':id', bannerId) : null;

  const now = new Date();
  const start = banner.startDate ? new Date(banner.startDate) : null;
  const end = banner.endDate ? new Date(banner.endDate) : null;

  let scheduleStatus = 'Always Active';
  let scheduleColor = 'bg-stone-100 text-stone-700 border-stone-200';

  if (start && now < start) {
    scheduleStatus = 'Scheduled';
    scheduleColor = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (end && now > end) {
    scheduleStatus = 'Expired';
    scheduleColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (start || end) {
    scheduleStatus = 'Live in Schedule';
    scheduleColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  const hasEyebrow = Boolean(banner.eyebrow && banner.eyebrow.trim());
  const hasTitle = Boolean(banner.title && banner.title.trim());
  const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim());
  const hasCta = Boolean(banner.ctaText && banner.ctaText.trim());
  const hasTextOverlay = hasEyebrow || hasTitle || hasSubtitle || hasCta;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="banner-preview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/50">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-stone-200/70 text-stone-700">
              <Sparkles className="w-4 h-4 text-brand-primary" />
            </span>
            <div>
              <h3 id="banner-preview-title" className="text-sm sm:text-base font-heading font-semibold text-stone-900 line-clamp-1">
                Storefront Banner Preview
              </h3>
              <p className="text-[11px] text-stone-500 font-mono">
                {banner.title || 'Untitled Banner'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {editUrl && (
              <Link to={editUrl} onClick={onClose}>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex items-center space-x-1.5 text-xs">
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Banner</span>
                </Button>
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-130px)] overflow-y-auto">
          {/* Hero Carousel Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Customer Storefront Appearance
              </h4>
              <span className="text-[11px] text-stone-400">
                Mirrors desktop & mobile hero slide layout
              </span>
            </div>

            <BannerHeroPreview
              image={banner.image}
              altText={banner.altText}
              showTextOverlay={hasTextOverlay}
              showEyebrow={hasEyebrow}
              eyebrow={banner.eyebrow}
              showTitle={hasTitle}
              title={banner.title}
              showSubtitle={hasSubtitle}
              subtitle={banner.subtitle}
              showCta={hasCta}
              ctaText={banner.ctaText}
              ctaLink={banner.ctaLink}
              isActive={banner.isActive}
              sortOrder={banner.sortOrder}
              showChrome={true}
              allowViewportToggle={true}
            />
          </div>

          {/* Banner Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-stone-50 border border-stone-200">
            {/* Status */}
            <div>
              <span className="text-[11px] font-medium text-stone-500 block mb-1">Status</span>
              <div className="flex items-center space-x-1.5">
                {banner.isActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-300">
                    <XCircle className="w-3 h-3 mr-1 text-stone-500" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Display Order */}
            <div>
              <span className="text-[11px] font-medium text-stone-500 block mb-1">Display Priority</span>
              <div className="flex items-center space-x-1 text-stone-800 font-mono text-sm">
                <Layers className="w-3.5 h-3.5 text-brand-primary mr-1" />
                <span className="font-semibold">Position #{banner.sortOrder ?? 0}</span>
              </div>
            </div>

            {/* CTA Destination */}
            <div>
              <span className="text-[11px] font-medium text-stone-500 block mb-1">CTA Destination</span>
              <div className="flex items-center space-x-1 text-xs text-brand-primary font-mono truncate">
                <span className="truncate">{banner.ctaLink || '/shop'}</span>
                {banner.ctaLink && (
                  <a
                    href={banner.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-400 hover:text-stone-600 inline-flex items-center shrink-0 ml-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Schedule Window */}
            <div>
              <span className="text-[11px] font-medium text-stone-500 block mb-1">Schedule Window</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-stone-400 mr-1" />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${scheduleColor}`}>
                  {scheduleStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Dates & Storage Key Details */}
          <div className="space-y-2 text-xs text-stone-600">
            {(banner.startDate || banner.endDate) && (
              <div className="flex items-center space-x-2 text-[11px] text-stone-500">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  Valid from{' '}
                  <strong className="text-stone-700">
                    {banner.startDate ? new Date(banner.startDate).toLocaleString() : 'Immediate'}
                  </strong>{' '}
                  until{' '}
                  <strong className="text-stone-700">
                    {banner.endDate ? new Date(banner.endDate).toLocaleString() : 'Indefinite'}
                  </strong>
                </span>
              </div>
            )}

            {banner.imageKey && (
              <div className="text-[11px] text-stone-400 font-mono truncate">
                Cloudflare R2 Object Key: <span className="text-stone-600">{banner.imageKey}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200 bg-stone-50/50">
          <div className="text-[11px] text-stone-400 font-mono">
            {bannerId && `ID: ${bannerId}`}
          </div>
          <div className="flex items-center space-x-2">
            {editUrl && (
              <Link to={editUrl} onClick={onClose} className="sm:hidden">
                <Button variant="outline" size="sm" className="text-xs">
                  Edit
                </Button>
              </Link>
            )}
            <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Close Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BannerPreviewModal;

