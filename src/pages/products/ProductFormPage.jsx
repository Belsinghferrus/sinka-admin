import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Save,
  AlertCircle,
  Eye,
  Tag,
  DollarSign,
  Boxes,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';
import productService from '../../services/product.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import ProductImageUploader from '../../components/products/ProductImageUploader.jsx';
import { PRODUCT_CATEGORIES, ROUTES } from '../../constants.js';
import { formatCurrency, parseCurrencyInput } from '../../utils/formatCurrency.js';

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form State
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

  // Load product if editing
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
      // Auto-generate slug when name changes if user hasn't typed custom slug
      if (name === 'name' && autoSlug) {
        updated.slug = slugify(value);
      }
      return updated;
    });

    if (name === 'slug') {
      setAutoSlug(false);
    }

    // Clear field-specific error
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
    if (!validate()) return;

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

    // Auto-set thumbnail to images[0].url if available
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

  // Cover image for live preview
  const coverImage = formData.images[0]?.url;
  const currentPrice = parseCurrencyInput(formData.price) || 0;
  const originalPriceNum = parseCurrencyInput(formData.originalPrice) || 0;
  const hasDiscount = originalPriceNum > currentPrice && currentPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((originalPriceNum - currentPrice) / originalPriceNum) * 100)
    : 0;

  const currentCategoryObj = PRODUCT_CATEGORIES.find((c) => c.value === formData.category);

  return (
    <div className="space-y-6 font-sans max-w-6xl">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <Link
          to={ROUTES.PRODUCTS}
          className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          title="Return to Product List"
          aria-label="Back to products"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900">
            {isEditing ? 'Edit Furniture Product' : 'Add New Furniture Product'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {isEditing
              ? 'Update specifications, pricing, inventory, and Cloudflare R2 media gallery.'
              : 'Add a new handcrafted furniture item to the Sinka catalogue.'}
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save product</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Core Product Details & Media */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
                <Package className="w-4 h-4 text-brand-primary" />
                <span>General Information</span>
              </h3>

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
                  className={`w-full px-3 py-2 text-sm border rounded-md shadow-2xs focus:outline-none focus:ring-2 transition-colors ${
                    fieldErrors.name
                      ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                      : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                  }`}
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                <div className="flex justify-between mt-1 text-[11px] text-stone-400">
                  {fieldErrors.name ? (
                    <span className="text-red-600 font-medium">{fieldErrors.name}</span>
                  ) : (
                    <span>High-impact title shown on the storefront</span>
                  )}
                  <span>{formData.name.length}/200</span>
                </div>
              </div>

              {/* Slug & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
                    className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detail materials, dimensions, artisanal craftsmanship, wood finishes, and care instructions..."
                  maxLength={5000}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary leading-relaxed"
                />
                <div className="flex justify-between mt-1 text-[11px] text-stone-400">
                  <span>Comprehensive description for the customer product page</span>
                  <span>{formData.description.length}/5000</span>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-2 border-b border-stone-100 pb-2">
                <DollarSign className="w-4 h-4 text-brand-primary" />
                <span>Pricing &amp; Inventory</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selling Price */}
                <div>
                  <label htmlFor="price" className="block text-xs font-semibold text-stone-700 mb-1">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-500 text-sm font-semibold pointer-events-none">
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
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-md shadow-2xs focus:outline-none focus:ring-2 transition-colors ${
                        fieldErrors.price
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                          : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
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
                    <span className="absolute left-3 top-2.5 text-stone-500 text-sm font-semibold pointer-events-none">
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
                      className="w-full pl-8 pr-3 py-2 text-sm border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Displayed with strikethrough to showcase discounts
                  </p>
                </div>
              </div>

              {/* Stock Quantity & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Stock */}
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
                    className={`w-full px-3 py-2 text-sm border rounded-md shadow-2xs focus:outline-none focus:ring-2 transition-colors ${
                      fieldErrors.stock
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-stone-300 focus:ring-brand-primary/20 focus:border-brand-primary'
                    }`}
                  />
                  {fieldErrors.stock ? (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">{fieldErrors.stock}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-stone-400">
                      0 indicates out of stock; &le; 5 displays low stock indicator
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
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  />
                  <p className="mt-1 text-[11px] text-stone-400">Unique internal warehouse inventory code</p>
                </div>
              </div>
            </div>

            {/* Cloudflare R2 Media Gallery Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-brand-primary" />
                  <span>Cloudflare R2 Media Gallery</span>
                </h3>
                <span className="text-[10px] text-stone-400 font-mono">
                  Prefix: products/ &bull; Max 8 MB
                </span>
              </div>

              <ProductImageUploader
                images={formData.images}
                onChange={handleImagesChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Right Column (1 Col): Visibility Settings & Storefront Live Preview */}
          <div className="space-y-6">
            {/* Publication Settings Card */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-heading font-semibold text-stone-900 border-b border-stone-100 pb-2">
                Catalogue Visibility
              </h3>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div>
                  <span className="text-xs font-semibold text-stone-900 block">Active Status</span>
                  <span className="text-[11px] text-stone-500 block">
                    {formData.isActive ? 'Visible to storefront customers' : 'Draft / hidden from storefront'}
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

              {/* Featured Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div>
                  <span className="text-xs font-semibold text-stone-900 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Featured Product</span>
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    {formData.isFeatured ? 'Promoted in homepage highlights' : 'Standard catalogue placement'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  icon={Save}
                >
                  {isEditing ? 'Save Product Changes' : 'Publish Product'}
                </Button>

                <Button
                  to={ROUTES.PRODUCTS}
                  variant="outline"
                  fullWidth
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Live Storefront Card Preview */}
            <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-3 sticky top-20">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-sm font-heading font-semibold text-stone-900 flex items-center space-x-1.5">
                  <Eye className="w-4 h-4 text-stone-600" />
                  <span>Storefront Live Preview</span>
                </h3>
                <span className="text-[10px] uppercase font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                  Live Card
                </span>
              </div>

              {/* Mock Storefront Product Card */}
              <div className="rounded-lg border border-stone-200 overflow-hidden bg-white shadow-sm flex flex-col">
                <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt="Storefront Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span>Upload cover image</span>
                    </div>
                  )}

                  {/* Category Pill on Image */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/95 text-stone-800 shadow-xs">
                      {currentCategoryObj?.label || 'Furniture'}
                    </span>
                  </div>

                  {/* Featured Star */}
                  {formData.isFeatured && (
                    <div className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full text-stone-950 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-1.5">
                  <h4 className="font-heading font-semibold text-xs sm:text-sm text-stone-900 line-clamp-1">
                    {formData.name || 'Your Product Title Here'}
                  </h4>

                  <div className="flex items-baseline space-x-2">
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

                  <div className="pt-2">
                    <div className="w-full py-1.5 bg-stone-900 text-white rounded text-[11px] font-semibold text-center opacity-90">
                      Add to Cart &rarr;
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                Rendered preview of how customers see this product card in the online storefront.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ProductFormPage;

