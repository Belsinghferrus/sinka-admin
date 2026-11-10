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
  Sliders,
  Layers,
  Plus,
  Trash2,
  Copy,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  RotateCcw,
  Wrench,
  Sparkle,
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
function SectionCard({ title, icon: Icon, badge, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 bg-stone-50/60">
        <div className="flex items-center space-x-2">
          {Icon && (
            <span className="p-1 rounded-md bg-stone-100 text-brand-primary shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </span>
          )}
          <h3 className="text-xs font-semibold text-stone-800 uppercase tracking-wide">{title}</h3>
        </div>
        {badge && (
          <span className="text-[10px] font-semibold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Sinka Admin — Add / Edit Furniture Product Workspace.
 *
 * Full lifecycle product manager supporting:
 *   - Basic product information (Title, Slug, Category, Pricing, MRP, Inventory, Status)
 *   - Customer product page narrative (Short Description, Full Story)
 *   - Craftsmanship specifications (Material, Color, Finish, Dimensions, Weight, Assembly, Warranty, Returns, Care)
 *   - Multi-image Cloudflare R2 gallery manager (Cover selection, in-place replace, zoom lightbox, reorder)
 *   - Furniture Variant Manager (Attributes, variant price, stock, variant-specific image assignment, duplication)
 *   - Customer Storefront Live Preview (Catalog Card vs Customer PDP Detail View)
 */
export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'sofas',
    shortDescription: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '10',
    sku: '',
    isActive: true,
    isFeatured: false,
    images: [],
    // Specifications / Product Details
    material: '',
    color: '',
    finish: '',
    dimensions: '',
    weight: '',
    assembly: '',
    warranty: '',
    returnPolicy: '',
    careInstructions: '',
    // Variants
    hasVariants: false,
    variants: [],
  });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  // Live preview interactive state
  const [previewTab, setPreviewTab] = useState('card'); // 'card' | 'pdp'
  const [previewSelectedVariant, setPreviewSelectedVariant] = useState(null);
  const [previewActiveImageIndex, setPreviewActiveImageIndex] = useState(0);

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
          const specs = product.specifications || {};
          const loadedVariants = Array.isArray(product.variants) ? product.variants : [];

          setFormData({
            name: product.name || '',
            slug: product.slug || '',
            category: product.category || 'sofas',
            shortDescription: product.shortDescription || '',
            description: product.description || '',
            price: product.price != null ? String(product.price) : '',
            originalPrice: product.originalPrice != null ? String(product.originalPrice) : '',
            stock: product.stock != null ? String(product.stock) : '0',
            sku: product.sku || '',
            isActive: Boolean(product.isActive),
            isFeatured: Boolean(product.isFeatured),
            images: Array.isArray(product.images) ? product.images : [],
            // Specifications
            material: specs.material || product.material || '',
            color: specs.color || product.color || '',
            finish: specs.finish || product.finish || '',
            dimensions: specs.dimensions || product.dimensions || '',
            weight: specs.weight || product.weight || '',
            assembly: specs.assembly || specs.assemblyRequired || product.assembly || '',
            warranty: specs.warranty || product.warranty || '',
            returnPolicy: specs.returnPolicy || product.returnPolicy || '',
            careInstructions: specs.careInstructions || product.careInstructions || '',
            // Variants
            hasVariants: loadedVariants.length > 0,
            variants: loadedVariants.map((v, i) => ({
              id: v.id || v._id || `variant-${Date.now()}-${i}`,
              name: v.name || '',
              sku: v.sku || '',
              price: v.price != null ? String(v.price) : '',
              originalPrice: v.originalPrice != null ? String(v.originalPrice) : '',
              stock: v.stock != null ? String(v.stock) : '0',
              color: v.color || '',
              size: v.size || '',
              material: v.material || '',
              finish: v.finish || '',
              image: v.image || v.imageUrl || '',
              isAvailable: v.isAvailable !== false,
            })),
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

  // ── Variant Handlers ────────────────────────────────────────────────────────
  const handleAddVariant = () => {
    setFormData((prev) => {
      const newIndex = prev.variants.length + 1;
      const defaultVariant = {
        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `Variant ${newIndex}`,
        sku: prev.sku ? `${prev.sku}-V${newIndex}` : '',
        price: prev.price || '',
        originalPrice: prev.originalPrice || '',
        stock: '5',
        color: prev.color || '',
        size: '',
        material: prev.material || '',
        finish: prev.finish || '',
        image: prev.images[0]?.url || '',
        isAvailable: true,
      };
      return {
        ...prev,
        hasVariants: true,
        variants: [...prev.variants, defaultVariant],
      };
    });
  };

  const handleDuplicateVariant = (index) => {
    setFormData((prev) => {
      const source = prev.variants[index];
      if (!source) return prev;
      const copy = {
        ...source,
        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: `${source.name} (Copy)`,
        sku: source.sku ? `${source.sku}-COPY` : '',
      };
      const nextList = [...prev.variants];
      nextList.splice(index + 1, 0, copy);
      return { ...prev, variants: nextList };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => {
      const nextList = prev.variants.filter((_, idx) => idx !== index);
      return {
        ...prev,
        variants: nextList,
        hasVariants: nextList.length > 0 ? prev.hasVariants : false,
      };
    });
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const nextList = prev.variants.map((v, idx) => (idx === index ? { ...v, [field]: value } : v));
      return { ...prev, variants: nextList };
    });

    const errorKey = `variant_${index}_${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────────
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

    if (formData.shortDescription && formData.shortDescription.length > 300) {
      errors.shortDescription = 'Short description cannot exceed 300 characters.';
    }

    // Variant Validation
    if (formData.hasVariants) {
      if (formData.variants.length === 0) {
        errors.variants = 'Please add at least one variant or disable the variants toggle.';
      } else {
        const seenNames = new Set();
        formData.variants.forEach((v, idx) => {
          if (!v.name.trim()) {
            errors[`variant_${idx}_name`] = 'Variant name is required.';
          } else {
            const normalized = v.name.trim().toLowerCase();
            if (seenNames.has(normalized)) {
              errors[`variant_${idx}_name`] = 'Variant name must be unique.';
            } else {
              seenNames.add(normalized);
            }
          }

          const vPrice = parseCurrencyInput(v.price);
          if (v.price === '' || v.price === null || Number.isNaN(vPrice) || vPrice < 0) {
            errors[`variant_${idx}_price`] = 'Valid price is required.';
          }

          const vStock = Number(v.stock);
          if (v.stock === '' || isNaN(vStock) || !Number.isInteger(vStock) || vStock < 0) {
            errors[`variant_${idx}_stock`] = 'Stock must be a non-negative whole integer.';
          }
        });
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Form Submission ─────────────────────────────────────────────────────────
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

    // Structured Specifications Object
    const specs = {
      material: formData.material.trim(),
      color: formData.color.trim(),
      finish: formData.finish.trim(),
      dimensions: formData.dimensions.trim(),
      weight: formData.weight.trim(),
      assembly: formData.assembly.trim(),
      warranty: formData.warranty.trim(),
      returnPolicy: formData.returnPolicy.trim(),
      careInstructions: formData.careInstructions.trim(),
    };

    // Construct Payload (variants is always an array, never null)
    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || slugify(formData.name),
      category: formData.category,
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      price: parsedPrice,
      originalPrice: parsedOriginalPrice,
      stock: Number(formData.stock),
      sku: formData.sku.trim() || null,
      isActive: Boolean(formData.isActive),
      isFeatured: Boolean(formData.isFeatured),
      // Top-level aliases for backwards compatibility with all consumers
      material: specs.material,
      color: specs.color,
      finish: specs.finish,
      dimensions: specs.dimensions,
      weight: specs.weight,
      assembly: specs.assembly,
      warranty: specs.warranty,
      returnPolicy: specs.returnPolicy,
      careInstructions: specs.careInstructions,
      specifications: specs,
      images: formData.images.map((img) => ({
        url: img.url,
        key: img.key,
        alt: img.alt ? img.alt.trim() : '',
      })),
      variants:
        formData.hasVariants && formData.variants.length > 0
          ? formData.variants.map((v) => ({
              name: v.name.trim(),
              sku: v.sku.trim() || undefined,
              price: parseCurrencyInput(v.price) || 0,
              originalPrice:
                v.originalPrice !== '' && v.originalPrice != null
                  ? parseCurrencyInput(v.originalPrice)
                  : null,
              stock: Number(v.stock) || 0,
              color: v.color.trim() || undefined,
              size: v.size.trim() || undefined,
              material: v.material.trim() || undefined,
              finish: v.finish.trim() || undefined,
              image: v.image ? v.image.trim() : undefined,
              isAvailable: Boolean(v.isAvailable),
            }))
          : [],
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
      let friendlyMessage = err.message || `Failed to ${isEditing ? 'update' : 'create'} product.`;
      if (friendlyMessage.includes('duplicate key') || friendlyMessage.includes('E11000')) {
        friendlyMessage = 'A product with this name, slug, or SKU already exists. Please adjust and retry.';
      }
      setError(friendlyMessage);
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

  // ── Derived Preview Values ──────────────────────────────────────────────────
  const activeVariant =
    formData.hasVariants && formData.variants.length > 0
      ? formData.variants.find((v) => v.id === previewSelectedVariant) || formData.variants[0]
      : null;

  const currentPrice = activeVariant
    ? parseCurrencyInput(activeVariant.price) || 0
    : parseCurrencyInput(formData.price) || 0;

  const originalPriceNum = activeVariant?.originalPrice
    ? parseCurrencyInput(activeVariant.originalPrice) || 0
    : parseCurrencyInput(formData.originalPrice) || 0;

  const hasDiscount = originalPriceNum > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalPriceNum - currentPrice) / originalPriceNum) * 100)
    : 0;

  const coverImage =
    (activeVariant?.image && activeVariant.image.trim()) ||
    formData.images[previewActiveImageIndex]?.url ||
    formData.images[0]?.url;

  const currentCategoryObj = PRODUCT_CATEGORIES.find((c) => c.value === formData.category);

  const displayStock = activeVariant ? Number(activeVariant.stock) : Number(formData.stock);
  const isOutOfStock = displayStock <= 0;
  const isLowStock = displayStock > 0 && displayStock <= 5;

  // Submit button label
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
                ? 'Update specifications, pricing, inventory, variants, and storefront media gallery.'
                : 'Create and publish rich product information for the Sinka customer catalogue.'}
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
            LEFT COLUMN — Product Information, Specifications, Media, Variants
            ══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* 1. General Information Card */}
          <SectionCard title="General Information" icon={Package}>
            <div className="space-y-3.5">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-stone-700 mb-1">
                  Product Title <span className="text-red-500">*</span>
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

              {/* Short Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="shortDescription" className="block text-xs font-semibold text-stone-700">
                    Short Description / Summary
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {formData.shortDescription.length}/300
                  </span>
                </div>
                <input
                  type="text"
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="e.g. Handcrafted solid teak sofa with dense foam cushions and durable linen upholstery."
                  maxLength={300}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400"
                />
                <p className="mt-0.5 text-[10px] text-stone-400">
                  Quick summary shown on category product cards and top of customer product detail page
                </p>
              </div>

              {/* Full Description */}
              <div>
                <label htmlFor="description" className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Product Story &amp; Details
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detail materials, artisanal joinery, cushion firmness, wood grain characteristics, styling suggestions..."
                  maxLength={5000}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 leading-relaxed resize-none"
                />
                <div className="flex justify-between mt-0.5 text-[10px] text-stone-400">
                  <span>Customer-facing narrative displayed in product details</span>
                  <span className="font-mono">{formData.description.length}/5000</span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 2. Pricing & Base Inventory Card */}
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
                    Shown with strikethrough to highlight customer savings
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
                      0 = out of stock; ≤ 5 shows low stock warning on storefront
                    </p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label htmlFor="sku" className="block text-xs font-semibold text-stone-700 mb-1">
                    Base SKU (Stock Keeping Unit)
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

          {/* 3. Product Media & Gallery Card */}
          <SectionCard title="Product Images" icon={ImageIcon}>
            <div className="space-y-3">
              <ProductImageUploader
                images={formData.images}
                onChange={handleImagesChange}
                disabled={isSubmitting}
              />
            </div>
          </SectionCard>

          {/* 4. Product Details & Specifications Card */}
          <SectionCard
            title="Product Details &amp; Specifications"
            icon={Sliders}
            badge="Customer PDP"
          >
            <div className="space-y-3">
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Provide comprehensive specifications for the customer product page. These details build buyer confidence and answer key dimensions, material, and care questions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Material */}
                <div>
                  <label htmlFor="material" className="block text-xs font-semibold text-stone-700 mb-1">
                    Primary Material
                  </label>
                  <input
                    type="text"
                    id="material"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="e.g. Solid Sheesham Wood / Teak Wood"
                    maxLength={100}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Color / Shade */}
                <div>
                  <label htmlFor="color" className="block text-xs font-semibold text-stone-700 mb-1">
                    Color / Shade
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g. Walnut Brown / Charcoal Grey"
                    maxLength={100}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Finish */}
                <div>
                  <label htmlFor="finish" className="block text-xs font-semibold text-stone-700 mb-1">
                    Finish / Texture
                  </label>
                  <input
                    type="text"
                    id="finish"
                    name="finish"
                    value={formData.finish}
                    onChange={handleChange}
                    placeholder="e.g. Natural Matte Lacquer / Water-resistant Polish"
                    maxLength={100}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Dimensions */}
                <div>
                  <label htmlFor="dimensions" className="block text-xs font-semibold text-stone-700 mb-1">
                    Dimensions (L x W x H)
                  </label>
                  <input
                    type="text"
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    placeholder="e.g. 82&quot; L x 35&quot; W x 32&quot; H (208 x 89 x 81 cm)"
                    maxLength={150}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label htmlFor="weight" className="block text-xs font-semibold text-stone-700 mb-1">
                    Product Weight
                  </label>
                  <input
                    type="text"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g. 48 kg"
                    maxLength={50}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Assembly Information */}
                <div>
                  <label htmlFor="assembly" className="block text-xs font-semibold text-stone-700 mb-1">
                    Assembly Information
                  </label>
                  <input
                    type="text"
                    id="assembly"
                    name="assembly"
                    value={formData.assembly}
                    onChange={handleChange}
                    placeholder="e.g. Free carpenter assembly provided at delivery"
                    maxLength={150}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Warranty */}
                <div>
                  <label htmlFor="warranty" className="block text-xs font-semibold text-stone-700 mb-1">
                    Warranty Period &amp; Coverage
                  </label>
                  <input
                    type="text"
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    placeholder="e.g. 3 Years comprehensive warranty against manufacturing defects"
                    maxLength={150}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>

                {/* Return Policy */}
                <div>
                  <label htmlFor="returnPolicy" className="block text-xs font-semibold text-stone-700 mb-1">
                    Return / Replacement Policy
                  </label>
                  <input
                    type="text"
                    id="returnPolicy"
                    name="returnPolicy"
                    value={formData.returnPolicy}
                    onChange={handleChange}
                    placeholder="e.g. 7 Days free replacement in case of transit damage"
                    maxLength={150}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900"
                  />
                </div>
              </div>

              {/* Care Instructions */}
              <div className="pt-1">
                <label htmlFor="careInstructions" className="block text-xs font-semibold text-stone-700 mb-1">
                  Care &amp; Maintenance Instructions
                </label>
                <textarea
                  id="careInstructions"
                  name="careInstructions"
                  rows={2}
                  value={formData.careInstructions}
                  onChange={handleChange}
                  placeholder="e.g. Clean with a damp microfiber cloth. Avoid placing hot items directly on wood polish. Keep away from prolonged direct sunlight."
                  maxLength={1000}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 resize-none"
                />
              </div>
            </div>
          </SectionCard>

          {/* 5. Product Variants Card */}
          <SectionCard
            title="Product Variants"
            icon={Layers}
            badge={formData.hasVariants ? `${formData.variants.length} Variants` : 'Single Item'}
          >
            <div className="space-y-3">
              {/* Variant Master Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-stone-900 block">
                    Product has Multiple Variants
                  </span>
                  <span className="text-[11px] text-stone-500 block leading-tight">
                    Enable if customers can select different sizes, colors, finishes, or configurations.
                  </span>
                </div>
                <ToggleSwitch
                  checked={formData.hasVariants}
                  onChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      hasVariants: val,
                      // If enabling for first time and empty, add initial variant based on current product
                      variants:
                        val && prev.variants.length === 0
                          ? [
                              {
                                id: `var_${Date.now()}_1`,
                                name: 'Default Variant',
                                sku: prev.sku ? `${prev.sku}-01` : '',
                                price: prev.price || '',
                                originalPrice: prev.originalPrice || '',
                                stock: prev.stock || '5',
                                color: prev.color || '',
                                size: '',
                                material: prev.material || '',
                                finish: prev.finish || '',
                                image: prev.images[0]?.url || '',
                                isAvailable: true,
                              },
                            ]
                          : prev.variants,
                    }));
                  }}
                  label="Toggle product variants"
                />
              </div>

              {/* Variant Error Banner */}
              {fieldErrors.variants && (
                <p className="text-xs text-red-600 font-medium px-1">{fieldErrors.variants}</p>
              )}

              {/* Variants List / Editor */}
              {formData.hasVariants && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-700">
                      Configure individual variant options:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Variant</span>
                    </button>
                  </div>

                  {formData.variants.length === 0 ? (
                    <div className="p-4 rounded-lg border-2 border-dashed border-stone-200 text-center text-xs text-stone-500">
                      No variants added yet. Click &quot;Add Variant&quot; above to create one.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.variants.map((v, index) => {
                        const nameError = fieldErrors[`variant_${index}_name`];
                        const priceError = fieldErrors[`variant_${index}_price`];
                        const stockError = fieldErrors[`variant_${index}_stock`];

                        return (
                          <div
                            key={v.id || index}
                            className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 space-y-2.5 transition-all hover:border-stone-300"
                          >
                            {/* Variant Header Row */}
                            <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-bold">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-semibold text-stone-900">
                                  {v.name || `Variant ${index + 1}`}
                                </span>
                                {v.isAvailable ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-stone-200 text-stone-600">
                                    Hidden
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateVariant(index)}
                                  className="p-1 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded transition-colors"
                                  title="Duplicate variant"
                                  aria-label="Duplicate variant"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(index)}
                                  className="p-1 text-stone-400 hover:text-red-600 hover:bg-stone-200/60 rounded transition-colors"
                                  title="Remove variant"
                                  aria-label="Remove variant"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Row 1: Name, SKU, Price, Stock */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  Variant Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={v.name}
                                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                                  placeholder="e.g. 3-Seater / Walnut"
                                  className={`w-full px-2 py-1 text-xs bg-white border rounded focus:outline-none focus:ring-1 ${
                                    nameError
                                      ? 'border-red-400 focus:ring-red-400'
                                      : 'border-stone-300 focus:ring-brand-primary'
                                  }`}
                                />
                                {nameError && <p className="text-[10px] text-red-600 mt-0.5">{nameError}</p>}
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  Variant SKU
                                </label>
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                  placeholder="SOF-WLN-3S"
                                  className="w-full px-2 py-1 text-xs font-mono uppercase bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  Price (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={v.price}
                                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                  placeholder="39999"
                                  className={`w-full px-2 py-1 text-xs font-mono bg-white border rounded focus:outline-none focus:ring-1 ${
                                    priceError
                                      ? 'border-red-400 focus:ring-red-400'
                                      : 'border-stone-300 focus:ring-brand-primary'
                                  }`}
                                />
                                {priceError && <p className="text-[10px] text-red-600 mt-0.5">{priceError}</p>}
                              </div>
                            </div>

                            {/* Row 2: Stock, MRP, Attributes (Color, Size) */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  Stock Units <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={v.stock}
                                  onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                  placeholder="5"
                                  className={`w-full px-2 py-1 text-xs font-mono bg-white border rounded focus:outline-none focus:ring-1 ${
                                    stockError
                                      ? 'border-red-400 focus:ring-red-400'
                                      : 'border-stone-300 focus:ring-brand-primary'
                                  }`}
                                />
                                {stockError && <p className="text-[10px] text-red-600 mt-0.5">{stockError}</p>}
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  MRP / Original (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={v.originalPrice}
                                  onChange={(e) =>
                                    handleVariantChange(index, 'originalPrice', e.target.value)
                                  }
                                  placeholder="46999"
                                  className="w-full px-2 py-1 text-xs font-mono bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  Color / Shade
                                </label>
                                <input
                                  type="text"
                                  value={v.color}
                                  onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                  placeholder="Walnut"
                                  className="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-600 mb-0.5">
                                  Size / Dimension
                                </label>
                                <input
                                  type="text"
                                  value={v.size}
                                  onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                  placeholder="3-Seater"
                                  className="w-full px-2 py-1 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                />
                              </div>
                            </div>

                            {/* Row 3: Image Assignment & Availability Toggle */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-stone-200/60 text-xs">
                              {/* Image Selector from Uploaded Gallery */}
                              <div className="flex items-center space-x-2">
                                <label className="text-[11px] font-medium text-stone-600 whitespace-nowrap">
                                  Variant Image:
                                </label>
                                {formData.images.length > 0 ? (
                                  <select
                                    value={v.image || ''}
                                    onChange={(e) => handleVariantChange(index, 'image', e.target.value)}
                                    className="px-2 py-0.5 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800 max-w-[200px] truncate"
                                  >
                                    <option value="">Use Primary Product Cover</option>
                                    {formData.images.map((img, imgIdx) => (
                                      <option key={img.key || imgIdx} value={img.url}>
                                        Image {imgIdx + 1} {imgIdx === 0 ? '(Cover)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-[10px] text-stone-400">
                                    Upload images above to assign
                                  </span>
                                )}
                                {v.image && (
                                  <img
                                    src={v.image}
                                    alt="Variant preview"
                                    className="w-5 h-5 rounded object-cover border border-stone-300 shrink-0"
                                  />
                                )}
                              </div>

                              {/* Availability Switch */}
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-[11px] text-stone-600">Available on Store:</span>
                                <ToggleSwitch
                                  checked={v.isAvailable}
                                  onChange={(val) => handleVariantChange(index, 'isAvailable', val)}
                                  label={`Toggle availability for ${v.name}`}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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

              {/* Preview View Mode Switcher */}
              <div className="flex items-center bg-stone-200/70 p-0.5 rounded text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('card')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    previewTab === 'card'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('pdp')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    previewTab === 'pdp'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Detail PDP
                </button>
              </div>
            </div>

            <div className="p-3.5">
              {/* MODE A: CATALOG CARD VIEW */}
              {previewTab === 'card' && (
                <div className="rounded-lg border border-stone-200 overflow-hidden bg-white shadow-2xs">
                  {/* Product Image Area */}
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt="Storefront Preview"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
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
                      <div
                        className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full text-stone-950 shadow-xs"
                        title="Featured product"
                      >
                        <Sparkles className="w-3 h-3" />
                      </div>
                    )}

                    {/* Stock Status Pill */}
                    {isOutOfStock ? (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white shadow-xs">
                          OUT OF STOCK
                        </span>
                      </div>
                    ) : isLowStock ? (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-stone-950 shadow-xs">
                          ONLY {displayStock} LEFT
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Product Card Body */}
                  <div className="p-3 space-y-1.5">
                    <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
                      {currentCategoryObj?.label || 'Collection'}
                    </span>

                    <h4 className="font-heading font-semibold text-xs sm:text-sm text-stone-900 line-clamp-1 leading-snug">
                      {formData.name || 'Your Product Title Here'}
                    </h4>

                    {formData.shortDescription && (
                      <p className="text-[11px] text-stone-500 line-clamp-1">
                        {formData.shortDescription}
                      </p>
                    )}

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
              )}

              {/* MODE B: CUSTOMER DETAILED PRODUCT PAGE PREVIEW */}
              {previewTab === 'pdp' && (
                <div className="rounded-lg border border-stone-200 overflow-hidden bg-white shadow-2xs p-3 space-y-3 text-xs">
                  {/* Hero Image & Thumbnails */}
                  <div className="space-y-1.5">
                    <div className="relative aspect-4/3 bg-stone-100 rounded-md overflow-hidden">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="PDP Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                          <ImageIcon className="w-6 h-6 mb-1 text-stone-300" />
                          <span className="text-[10px]">No image uploaded</span>
                        </div>
                      )}
                    </div>

                    {/* Mini Thumbnails */}
                    {formData.images.length > 1 && (
                      <div className="flex space-x-1.5 overflow-x-auto pb-1">
                        {formData.images.map((img, idx) => (
                          <button
                            key={img.key || idx}
                            type="button"
                            onClick={() => {
                              setPreviewActiveImageIndex(idx);
                              setPreviewSelectedVariant(null);
                            }}
                            className={`w-10 h-10 rounded border overflow-hidden shrink-0 transition-all ${
                              previewActiveImageIndex === idx && !previewSelectedVariant
                                ? 'border-brand-primary ring-1 ring-brand-primary/40'
                                : 'border-stone-200 opacity-60'
                            }`}
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Title & Pricing */}
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-brand-primary block tracking-wider">
                      {currentCategoryObj?.label || 'Furniture'}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-stone-900 leading-snug">
                      {formData.name || 'Product Title'}
                    </h4>

                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="font-heading font-bold text-base text-stone-900">
                        {formatCurrency(currentPrice)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-xs text-stone-400 line-through">
                            {formatCurrency(originalPriceNum)}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                            Save {formatCurrency(originalPriceNum - currentPrice)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock Availability */}
                  <div className="pt-0.5">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center text-[11px] font-semibold text-red-600">
                        <XCircle className="w-3 h-3 mr-1" /> Currently Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center text-[11px] font-semibold text-amber-700">
                        <AlertCircle className="w-3 h-3 mr-1" /> Only {displayStock} left in stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> In Stock ({displayStock} units available)
                      </span>
                    )}
                  </div>

                  {/* Interactive Variant Selection Pills (if enabled) */}
                  {formData.hasVariants && formData.variants.length > 0 && (
                    <div className="pt-1 space-y-1 border-t border-stone-100">
                      <label className="text-[10px] uppercase font-bold text-stone-500 block">
                        Available Configurations:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {formData.variants.map((v) => {
                          const isSelected =
                            v.id === previewSelectedVariant ||
                            (!previewSelectedVariant && v.id === formData.variants[0]?.id);
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => setPreviewSelectedVariant(v.id)}
                              className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                                isSelected
                                  ? 'border-brand-primary bg-brand-primary text-white shadow-2xs'
                                  : 'border-stone-300 bg-stone-50 text-stone-700 hover:border-stone-400'
                              }`}
                            >
                              {v.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Specifications Snapshot */}
                  {(formData.material || formData.dimensions || formData.warranty) && (
                    <div className="p-2 bg-stone-50 rounded border border-stone-200 text-[10px] space-y-1">
                      <span className="font-semibold text-stone-700 block uppercase tracking-wider">
                        Quick Specifications:
                      </span>
                      {formData.material && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Material:</span>
                          <span className="font-medium text-stone-800">{formData.material}</span>
                        </div>
                      )}
                      {formData.dimensions && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Dimensions:</span>
                          <span className="font-mono text-stone-800">{formData.dimensions}</span>
                        </div>
                      )}
                      {formData.warranty && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Warranty:</span>
                          <span className="font-medium text-stone-800">{formData.warranty}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-stone-400 text-center mt-2 leading-relaxed">
                Live interactive customer storefront preview.
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
