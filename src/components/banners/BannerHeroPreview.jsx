import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Percent,
  Sparkles,
  FileImage,
  Monitor,
  Smartphone,
} from 'lucide-react';

/**
 * High-Fidelity Admin Homepage Hero Banner Preview.
 * Faithfully mirrors the customer storefront hero carousel (HeroCarousel.jsx in sinka-frontend):
 * - Clean edge-to-edge photography.
 * - Directional dark gradient scrim rendered ONLY when text content exists.
 * - Only enabled typography elements (eyebrow, title, subtitle, CTA button) are rendered.
 * - Restrained typography sizing and generous padding prevent any overlap with navigation controls.
 * - Floating circular navigation arrows and bottom indicator pill in exact storefront positions.
 * - 4-item customer trust assurance bar directly beneath the carousel.
 * - Interactive Desktop Widescreen vs. Mobile viewport preview modes.
 *
 * @param {object} props
 * @param {string} [props.image] - Hero banner image URL
 * @param {string} [props.altText] - Image alt text
 * @param {boolean} [props.showTextOverlay=false] - Master toggle for text narrative
 * @param {boolean} [props.showEyebrow=false] - Eyebrow label toggle
 * @param {string} [props.eyebrow=''] - Eyebrow text
 * @param {boolean} [props.showTitle=false] - Title headline toggle
 * @param {string} [props.title=''] - Headline text
 * @param {boolean} [props.showSubtitle=false] - Subtitle toggle
 * @param {string} [props.subtitle=''] - Subtitle text
 * @param {boolean} [props.showCta=false] - CTA button toggle
 * @param {string} [props.ctaText=''] - CTA button label
 * @param {string} [props.ctaLink='/shop'] - Destination link / URL
 * @param {boolean} [props.isActive=true] - Visibility status flag
 * @param {number} [props.sortOrder=0] - Carousel display priority
 * @param {boolean} [props.showChrome=true] - Whether to show mock navigation and trust bar
 * @param {boolean} [props.allowViewportToggle=true] - Allow switching between Desktop and Mobile preview
 */
export function BannerHeroPreview({
  image = '',
  altText = '',
  showTextOverlay = false,
  showEyebrow = false,
  eyebrow = '',
  showTitle = false,
  title = '',
  showSubtitle = false,
  subtitle = '',
  showCta = false,
  ctaText = '',
  ctaLink = '/shop',
  isActive = true,
  sortOrder = 0,
  showChrome = true,
  allowViewportToggle = true,
}) {
  const [imgError, setImgError] = useState(false);
  const [viewportMode, setViewportMode] = useState('desktop'); // 'desktop' | 'mobile'

  // Resolve which text elements are genuinely enabled and non-empty
  const activeEyebrow = showTextOverlay && showEyebrow && eyebrow?.trim() ? eyebrow.trim() : '';
  const activeTitle = showTextOverlay && showTitle && title?.trim() ? title.trim() : '';
  const activeSubtitle = showTextOverlay && showSubtitle && subtitle?.trim() ? subtitle.trim() : '';
  const activeCtaText = showTextOverlay && showCta && ctaText?.trim() ? ctaText.trim() : '';
  const activeCtaLink = showTextOverlay && showCta && ctaLink?.trim() ? ctaLink.trim() : '';

  // Determine whether ANY text element should appear on the banner
  const hasTextContent = Boolean(
    activeEyebrow || activeTitle || activeSubtitle || activeCtaText
  );

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-xs font-sans">
      {/* Top Preview Control Header */}
      <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-md bg-stone-200/70 text-stone-700">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
          </span>
          <div>
            <h4 className="text-xs font-semibold text-stone-900 tracking-tight flex items-center space-x-1.5">
              <span>Customer Storefront Preview</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <p className="text-[10px] text-stone-500">
              {viewportMode === 'desktop'
                ? 'Desktop Widescreen Hero Carousel (Full-Width Viewport)'
                : 'Mobile Storefront View (Compact Viewport)'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status indicators */}
          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-stone-200/60 text-stone-600 border border-stone-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-stone-400'}`} />
            <span>{isActive ? 'Active' : 'Draft'}</span>
          </span>

          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            Pos #{sortOrder}
          </span>

          {/* Viewport Switcher */}
          {allowViewportToggle && (
            <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 ml-1">
              <button
                type="button"
                onClick={() => setViewportMode('desktop')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md inline-flex items-center space-x-1 transition-colors cursor-pointer ${
                  viewportMode === 'desktop'
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Desktop Widescreen View"
              >
                <Monitor className="w-3 h-3" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewportMode('mobile')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md inline-flex items-center space-x-1 transition-colors cursor-pointer ${
                  viewportMode === 'mobile'
                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3 h-3" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Carousel Display Area */}
      <div className={`w-full bg-stone-950 flex items-center justify-center transition-all duration-300 ${
        viewportMode === 'mobile' ? 'p-6 sm:p-8 bg-stone-900' : 'p-0'
      }`}>
        <div className={`relative overflow-hidden select-none transition-all duration-300 ${
          viewportMode === 'mobile'
            ? 'w-[340px] sm:w-[380px] h-[520px] rounded-2xl shadow-2xl border-4 border-stone-800'
            : 'w-full aspect-16/9 sm:aspect-21/9 min-h-[340px] sm:min-h-[420px] lg:min-h-[480px]'
        }`}>
          {/* Background Artwork Layer */}
          {image && !imgError ? (
            <img
              src={image}
              alt={altText || activeTitle || 'Storefront Hero Banner'}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-stone-900 text-stone-400">
              <div className="w-16 h-16 rounded-full bg-stone-800/80 border border-stone-700 flex items-center justify-center mb-3 text-stone-400">
                <FileImage className="w-8 h-8" />
              </div>
              <span className="text-sm font-semibold text-stone-200">No Hero Artwork Uploaded</span>
              <span className="text-xs text-stone-400 mt-1 max-w-sm">
                Upload a high-resolution banner image (JPEG, PNG, WebP up to 8 MB) to preview your artwork in the customer carousel.
              </span>
            </div>
          )}

          {/* Directional Gradient Scrim — Rendered ONLY when text content exists */}
          {hasTextContent && (
            <div
              className={`absolute inset-0 pointer-events-none z-10 ${
                viewportMode === 'mobile'
                  ? 'bg-gradient-to-t from-stone-950/95 via-stone-950/60 to-transparent'
                  : 'bg-gradient-to-r from-stone-950/85 via-stone-950/50 to-transparent'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Foreground Narrative Content Layer — Rendered ONLY when text content exists */}
          {hasTextContent && (
            <div className={`absolute inset-0 z-20 pointer-events-none flex ${
              viewportMode === 'mobile'
                ? 'items-end justify-start px-6 pb-16 pt-8'
                : 'items-center justify-start px-8 sm:px-14 md:px-18 lg:px-24 py-10 sm:py-16'
            }`}>
              <div className={`text-left pointer-events-auto ${
                viewportMode === 'mobile' ? 'max-w-full' : 'max-w-lg lg:max-w-xl'
              }`}>
                {/* Eyebrow Label with Accent Pill */}
                {activeEyebrow && (
                  <div className="inline-flex items-center gap-2 mb-2 sm:mb-3">
                    <span className="w-5 h-0.5 bg-brand-secondary rounded-full" aria-hidden="true" />
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-stone-200 drop-shadow-sm font-sans">
                      {activeEyebrow}
                    </span>
                  </div>
                )}

                {/* Banner Headline */}
                {activeTitle && (
                  <h2 className={`font-bold font-heading text-white tracking-tight leading-[1.14] mb-2 sm:mb-3 drop-shadow-sm ${
                    viewportMode === 'mobile'
                      ? 'text-xl sm:text-2xl line-clamp-2'
                      : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl line-clamp-3'
                  }`}>
                    {activeTitle}
                  </h2>
                )}

                {/* Subtitle / Description */}
                {activeSubtitle && (
                  <p className={`text-stone-200/90 leading-relaxed drop-shadow-sm font-sans mb-4 sm:mb-5 ${
                    viewportMode === 'mobile'
                      ? 'text-xs line-clamp-2'
                      : 'text-xs sm:text-sm md:text-base max-w-lg line-clamp-3'
                  }`}>
                    {activeSubtitle}
                  </p>
                )}

                {/* CTA Button Action */}
                {activeCtaText && (
                  <div className="pt-0.5">
                    <div className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-brand-primary rounded-md shadow-sm pointer-events-none">
                      <span>{activeCtaText}</span>
                    </div>
                    {activeCtaLink && (
                      <span className="block text-[10px] text-stone-300/80 font-mono mt-1.5 truncate max-w-sm">
                        → {activeCtaLink}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating Circular Navigation Arrows (Exact Storefront Style) */}
          {showChrome && (
            <>
              <div
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/70 text-stone-800 shadow-md backdrop-blur-xs flex items-center justify-center opacity-75 pointer-events-none"
                aria-hidden="true"
              >
                <ChevronLeft className="w-5 h-5" />
              </div>

              <div
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/70 text-stone-800 shadow-md backdrop-blur-xs flex items-center justify-center opacity-75 pointer-events-none"
                aria-hidden="true"
              >
                <ChevronRight className="w-5 h-5" />
              </div>

              {/* Bottom Slide Indicators with Red Progress Pill */}
              <div
                className="absolute bottom-3 sm:bottom-5 inset-x-0 z-30 flex justify-center items-center pointer-events-none"
                aria-hidden="true"
              >
                <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
                  <span className="w-10 h-2 rounded-full bg-brand-secondary shadow-xs" />
                  <span className="w-2 h-2 rounded-full bg-white/50" />
                  <span className="w-2 h-2 rounded-full bg-white/50" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Customer Storefront Trust Assurance Bar */}
      {showChrome && (
        <div className="border-t border-stone-200 bg-stone-50 py-2.5 px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-stone-600">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-red-100 text-brand-secondary flex items-center justify-center shrink-0">
                <Percent className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-stone-800 truncate">Instant Savings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-stone-800 truncate">100% Solid Hardwood</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-stone-800 truncate">Free Delivery</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-stone-800 truncate">No-Cost EMI</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BannerHeroPreview;
