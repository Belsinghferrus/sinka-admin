import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Edit,
  Tag,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PRODUCT_CATEGORIES, ROUTES } from '../../constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function ProductDetailModal({ product, isOpen, onClose }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!isOpen || !product) return null;

  const categoryObj = PRODUCT_CATEGORIES.find((c) => c.value === product.category);
  const categoryLabel = categoryObj?.label || product.category;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.thumbnail
    ? [{ url: product.thumbnail, key: 'thumbnail', alt: product.name }]
    : [];

  const currentImage = images[selectedImageIndex] || images[0];

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/50">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-stone-200/70 text-stone-700">
              <Package className="w-4 h-4 text-brand-primary" />
            </span>
            <div>
              <h3 id="product-detail-title" className="text-sm sm:text-base font-heading font-semibold text-stone-900 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-[11px] text-stone-500 font-mono">
                SKU: {product.sku || 'N/A'} &bull; Slug: {product.slug}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto font-sans">
          {/* Top Gallery + Core Meta Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gallery View */}
            <div className="space-y-3">
              <div className="relative aspect-4/3 rounded-lg border border-stone-200 bg-stone-100 overflow-hidden shadow-2xs">
                {currentImage ? (
                  <img
                    src={currentImage.url}
                    alt={currentImage.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span>No image uploaded</span>
                  </div>
                )}

                {/* Status Badges Overlay */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {product.isFeatured && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>Featured</span>
                    </span>
                  )}
                  {product.isActive ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-600 text-white shadow-xs">
                      <XCircle className="w-3 h-3" />
                      <span>Inactive</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.key || idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 shrink-0 rounded-md border overflow-hidden transition-all ${
                        selectedImageIndex === idx
                          ? 'border-brand-primary ring-2 ring-brand-primary/20 shadow-xs'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Pricing Breakdown */}
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200 mb-2">
                  <Tag className="w-3 h-3 mr-1 text-brand-primary" />
                  {categoryLabel}
                </span>
                <h4 className="text-xl font-heading font-bold text-stone-900 leading-snug">
                  {product.name}
                </h4>
              </div>

              {/* Pricing Block */}
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Catalogue Pricing
                </span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-heading font-bold text-stone-900">
                    {formatCurrency(product.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-sm text-stone-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Customer saves {formatCurrency(product.originalPrice - product.price)}
                  </p>
                )}
              </div>

              {/* Inventory & Stock Block */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    Inventory Status
                  </span>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center text-red-700 font-bold">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center text-amber-700 font-bold">
                      Low Stock ({product.stock} units)
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {product.stock} in stock
                    </span>
                  )}
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    SKU Identifier
                  </span>
                  <span className="font-mono font-medium text-stone-800">
                    {product.sku || 'Not assigned'}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="text-[11px] text-stone-500 space-y-1 pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span className="font-medium text-stone-700">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Modified:</span>
                  <span className="font-medium text-stone-700">
                    {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 border-t border-stone-200 pt-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Product Description
            </h5>
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-lg border border-stone-200 whitespace-pre-line">
              {product.description || 'No description provided for this product.'}
            </div>
          </div>

          {/* R2 Image Storage References */}
          {images.length > 0 && (
            <div className="space-y-2 border-t border-stone-200 pt-4">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-primary" />
                <span>Cloudflare R2 Object Storage References</span>
              </h5>
              <div className="space-y-1.5">
                {images.map((img, idx) => (
                  <div
                    key={img.key || idx}
                    className="flex items-center justify-between p-2 bg-stone-50 rounded border border-stone-200 text-xs font-mono"
                  >
                    <span className="text-stone-700 truncate mr-2" title={img.key}>
                      {idx + 1}. {img.key}
                    </span>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:underline flex items-center space-x-1 shrink-0 font-sans text-[11px]"
                    >
                      <span>View CDN</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
          >
            Close
          </button>

          <Link
            to={ROUTES.PRODUCTS_EDIT.replace(':id', product.id || product._id)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-md shadow-xs hover:bg-brand-primary-hover transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Product</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;

