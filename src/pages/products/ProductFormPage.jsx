import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  DollarSign,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Tag,
} from 'lucide-react';
import productService from '../../services/product.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import ProductImageUploader from '../../components/products/ProductImageUploader.jsx';
import { PRODUCT_CATEGORIES, ROUTES } from '../../constants.js';
import { formatCurrency, parseCurrencyInput } from '../../utils/formatCurrency.js';

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
 * Sinka Admin — Add / Edit Furniture Product.
 *
 * Compact, professional ecommerce CMS product creation workspace:
 *   Left (70–75%): General Information, Pricing & Inventory, Product Images
 *   Right (25–30%): Sticky Live Product Preview, Catalogue Visibility, Actions
 *
 * 100% preserves existing backend integration, API payload schema,
 * validation, Cloudflare R2 / Cloudinary storage, and state handling.
 */
export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'sofas',
    price: '',
    originalPrice: '',
    stock: '10',
    sku: '',
    isActive: true,
    isFeatured: false,
    images: [],
  });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  // ── Load product if editing ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return;

    let isMounted = true;
    async function loadProduct() {
      setIsLoading(true);
      setError(null);
      try {
        const product = await productService.getProductById(id);
        if (!product) throw new Error('Product not found.');

        if (isMounted) {
          setFormData({
            name: product.name || '',
            slug: product.slug || '',
            description: product.description || '',
            category: product.category || 'sofas',
            price: product.price != null ? String(product.price) : '',
            originalPrice: product.originalPrice != null ? String(product.originalPrice) : '',
            stock: product.stock != null ? String(product.stock) : '0',
            sku: product.sku || '',
            isActive: Boolean(product.isActive),
            isFeatured: Boolean(product.isFeatured),
            images: Array.isArray(product.images) ? product.images : [],
          });
          setAutoSlug(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load product details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  const slugify = (text) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/&/g, '-and-')
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextVal = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: nextVal };
      if (name === 'name' && autoSlug) {
        updated.slug = slugify(value);
      }
      return updated;
    });

    if (name === 'slug') {
      setAutoSlug(false);
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleImagesChange = (newImages) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters.';
    } else if (formData.name.trim().length > 200) {
      errors.name = 'Product name cannot exceed 200 characters.';
    }

    if (!formData.category) {
      errors.category = 'Please select a valid category.';
    }

    const priceNum = parseCurrencyInput(formData.price);
    if (formData.price === '' || formData.price === null || formData.price === undefined || Number.isNaN(priceNum)) {
      errors.price = 'Selling price is required.';
    } else if (priceNum < 0) {
      errors.price = 'Price cannot be negative.';
    }

    if (formData.originalPrice !== '' && formData.originalPrice != null) {
      const originalNum = parseCurrencyInput(formData.originalPrice);
      if (Number.isNaN(originalNum) || originalNum < 0) {
        errors.originalPrice = 'Original price must be a valid non-negative number.';
      }
    }

    const stockNum = Number(formData.stock);
    if (formData.stock === '' || isNaN(stockNum)) {
      errors.stock = 'Stock quantity is required.';
    } else if (!Number.isInteger(stockNum) || stockNum < 0) {
      errors.stock = 'Stock must be a non-negative whole integer.';
    }

    if (formData.sku && formData.sku.length > 50) {
      errors.sku = 'SKU cannot exceed 50 characters.';
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

    const parsedPrice = parseCurrencyInput(formData.price);
    const parsedOriginalPrice =
      formData.originalPrice !== '' && formData.originalPrice != null
        ? parseCurrencyInput(formData.originalPrice)
        : null;

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || slugify(formData.name),
      description: formData.description.trim(),
      category: formData.category,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      stock: Number(formData.stock),
      sku: formData.sku.trim() || null,
      isActive: Boolean(formData.isActive),
      isFeatured: Boolean(formData.isFeatured),
      images: formData.images.map((img) => ({
        url: img.url,
        key: img.key,
        alt: img.alt ? img.alt.trim() : '',
      })),
    };

    if (payload.images.length > 0) {
      payload.thumbnail = payload.images[0].url;
    }

    try {
      if (isEditing) {
        await productService.updateProduct(id, payload);
      } else {
        await productService.createProduct(payload);
      }
      navigate(ROUTES.PRODUCTS);
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} product.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 font-sans">
        <LoadingIndicator size="lg" message="Loading product information..." />
      </div>
    );
  }

  // Cover image and price derivation for live storefront preview
  const coverImage = formData.images[0]?.url;
  const currentPrice = parseCurrencyInput(formData.price) || 0;
  const originalPriceNum = parseCurrencyInput(formData.originalPrice) || 0;
  const hasDiscount = originalPriceNum > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalPriceNum - currentPrice) / originalPriceNum) * 100)
    : 0;

  const currentCategoryObj = PRODUCT_CATEGORIES.find((c) => c.value === formData.category);

  // Reusable submit button label
  const publishBtnContent = (
    <>
      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
      <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Product Changes' : 'Publish Product'}</span>
    </>
  );

  return (
    <div className="space-y-5 font-sans">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-start space-x-3">
          <Link
            to={ROUTES.PRODUCTS}
            className="mt-0.5 p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
            title="Return to Product List"
            aria-label="Back to products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-1.5 mb-0.5">
              <Link
                to={ROUTES.PRODUCTS}
                className="text-[11px] text-stone-400 hover:text-brand-primary transition-colors"
              >
                Products
              </Link>
              <span className="text-[11px] text-stone-300">/</span>
              <span className="text-[11px] text-stone-500">
                {isEditing ? 'Edit Product' : 'Add New Product'}
              </span>
            </div>
            <h1 className="text-lg font-heading font-semibold text-stone-900 tracking-tight leading-tight">
              {isEditing ? 'Edit Furniture Product' : 'Add New Product'}
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              {isEditing
                ? 'Update specifications, pricing, inventory, and storefront media gallery.'
                : 'Create and publish a new product to the Sinka catalogue.'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link to={ROUTES.PRODUCTS}>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="product-form"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-1.5 shadow-xs"
          >
            {publishBtnContent}
          </Button>
        </div>
      </div>

      {/* ── Global Error Banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Unable to save product</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Main Form Grid: 70–75% Left, 25–30% Right ───────────────────────── */}
      <form
        id="product-form"
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start"
      >
        {/* ══════════════════════════════════════════════════════════════════════
            LEFT COLUMN — Product Information, Pricing & Media Gallery
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* 1. General Information Card */}
          <SectionCard title="General Information" icon={Package}>
            <div className="space-y-3.5">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Nordic Teak 3-Seater Sofa"
                  maxLength={200}
                  className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 placeholder:text-stone-400 transition-colors ${
                    fieldErrors.name
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-stone-300 focus:ring-brand-primary'
                  }`}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                <div className="flex justify-between mt-1 text-[10px] text-stone-400">
                  {fieldErrors.name ? (
                    <span className="text-red-600 font-medium">{fieldErrors.name}</span>
                  ) : (
                    <span>Customer-facing title shown across the storefront</span>
                  )}
                  <span className="font-mono">{formData.name.length}/200</span>
                </div>
              </div>

              {/* Category & Slug Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-xs font-semibold text-stone-700 mb-1">
                    Furniture Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="slug" className="block text-xs font-semibold text-stone-700">
                      URL Slug
                    </label>
                    <span className="text-[10px] text-stone-400">Auto-generated</span>
                  </div>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="nordic-teak-3-seater-sofa"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detail materials, dimensions, artisanal craftsmanship, wood finishes, and care instructions..."
                  maxLength={5000}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 leading-relaxed resize-none"
                />
                <div className="flex justify-between mt-0.5 text-[10px] text-stone-400">
                  <span>Product narrative for customer details page</span>
                  <span className="font-mono">{formData.description.length}/5000</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 2. Pricing & Inventory Card */}
          <SectionCard title="Pricing &amp; Inventory" icon={DollarSign}>
            <div className="space-y-3.5">
              {/* Row 1: Selling Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Selling Price */}
                <div>
                  <label htmlFor="price" className="block text-xs font-semibold text-stone-700 mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      step="any"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="38999"
                      className={`w-full pl-6 pr-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 font-mono transition-colors ${
                        fieldErrors.price
                          ? 'border-red-400 focus:ring-red-400'
                          : 'border-stone-300 focus:ring-brand-primary'
                      }`}
                    />
                  </div>
                  {fieldErrors.price && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.price}</p>
                  )}
                </div>

                {/* Original Price / MRP */}
                <div>
                  <label htmlFor="originalPrice" className="block text-xs font-semibold text-stone-700 mb-1">
                    Original Price / MRP (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      id="originalPrice"
                      name="originalPrice"
                      min="0"
                      step="any"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="45999"
                      className="w-full pl-6 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 font-mono"
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] text-stone-400">
                    Shown with strikethrough to display discount
                  </p>
                </div>
              </div>

              {/* Row 2: Stock Quantity & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-100">
                {/* Stock Quantity */}
                <div>
                  <label htmlFor="stock" className="block text-xs font-semibold text-stone-700 mb-1">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={handleChange}
                    className={`w-full px-3 py-1.5 text-xs bg-white border rounded-lg focus:outline-none focus:ring-1 text-stone-900 font-mono ${
                      fieldErrors.stock
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-stone-300 focus:ring-brand-primary'
                    }`}
                  />
                  {fieldErrors.stock ? (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.stock}</p>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      0 = out of stock; ≤ 5 shows low stock warning
                    </p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label htmlFor="sku" className="block text-xs font-semibold text-stone-700 mb-1">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="SOF-TEAK-001"
                    maxLength={50}
                    className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400"
                  />
                  <p className="mt-0.5 text-[10px] text-stone-400">Internal warehouse tracking code</p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 3. Product Images Card */}
          <SectionCard title="Product Images" icon={ImageIcon}>
            <div className="space-y-3">
              <ProductImageUploader
                images={formData.images}
                onChange={handleImagesChange}
                disabled={isSubmitting}
              />
            </div>
          </SectionCard>

          {/* Mobile / Tablet bottom action row */}
          <div className="flex items-center justify-end space-x-2 pt-1 lg:hidden">
            <Link to={ROUTES.PRODUCTS}>
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
            RIGHT COLUMN — Sticky Live Preview, Catalogue Visibility & Actions
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
              {/* Product Card Container */}
              <div className="rounded-lg border border-stone-200 overflow-hidden bg-white shadow-2xs">
                {/* Product Image Area */}
                <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Storefront Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                      <ImageIcon className="w-7 h-7 mb-1 text-stone-300" />
                      <span className="text-[11px] text-stone-400">Upload product image</span>
                    </div>
                  )}

                  {/* Category Pill on Image */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/95 text-stone-800 shadow-xs backdrop-blur-xs">
                      {currentCategoryObj?.label || 'Furniture'}
                    </span>
                  </div>

                  {/* Featured Badge */}
                  {formData.isFeatured && (
                    <div className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full text-stone-950 shadow-xs" title="Featured product">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Product Card Body */}
                <div className="p-3 space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
                    {currentCategoryObj?.label || 'Collection'}
                  </span>

                  <h4 className="font-heading font-semibold text-xs sm:text-sm text-stone-900 line-clamp-1 leading-snug">
                    {formData.name || 'Your Product Title Here'}
                  </h4>

                  <div className="flex items-baseline space-x-2 pt-0.5">
                    <span className="font-heading font-bold text-sm text-stone-900">
                      {formatCurrency(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-[11px] text-stone-400 line-through">
                          {formatCurrency(originalPriceNum)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  <div className="pt-1.5">
                    <div className="w-full py-1.5 bg-stone-900 text-white rounded text-[11px] font-semibold text-center opacity-90 select-none">
                      Add to Cart &rarr;
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-stone-400 text-center mt-2 leading-relaxed">
                Live storefront product card preview.
              </p>
            </div>
          </div>

          {/* 2. Catalogue Visibility Card */}
          <SectionCard title="Catalogue Visibility" icon={Tag}>
            <div className="space-y-3">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-stone-900 block">Active Status</span>
                  <span className="text-[11px] text-stone-500 block leading-tight">
                    {formData.isActive ? 'Visible to storefront customers' : 'Draft / hidden from storefront'}
                  </span>
                </div>
                <ToggleSwitch
                  checked={formData.isActive}
                  onChange={(val) => setFormData((p) => ({ ...p, isActive: val }))}
                  label="Toggle active status"
                />
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-stone-900 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Featured Product</span>
                  </span>
                  <span className="text-[11px] text-stone-500 block leading-tight">
                    {formData.isFeatured ? 'Promoted in homepage highlights' : 'Standard catalogue placement'}
                  </span>
                </div>
                <ToggleSwitch
                  checked={formData.isFeatured}
                  onChange={(val) => setFormData((p) => ({ ...p, isFeatured: val }))}
                  label="Toggle featured product"
                />
              </div>
            </div>
          </SectionCard>

          {/* 3. Product Actions Card (Desktop Sidebar) */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-3.5 space-y-2">
            <Button
              type="submit"
              form="product-form"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              className="inline-flex items-center justify-center space-x-1.5 shadow-xs"
            >
              {publishBtnContent}
            </Button>

            <Link to={ROUTES.PRODUCTS} className="block">
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

export default ProductFormPage;
