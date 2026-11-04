import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import productService from '../../services/product.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import ProductDetailModal from '../../components/products/ProductDetailModal.jsx';
import { PRODUCT_CATEGORIES, ROUTES } from '../../constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive' | 'featured'
  const [sort, setSort] = useState('createdAt:desc');

  // Deletion modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail / Preview modal state
  const [previewProduct, setPreviewProduct] = useState(null);

  // Feedback banner
  const [feedback, setFeedback] = useState(null);

  const fetchProducts = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        let isActiveParam = 'all';
        let isFeaturedParam = 'all';

        if (statusFilter === 'active') isActiveParam = 'true';
        if (statusFilter === 'inactive') isActiveParam = 'false';
        if (statusFilter === 'featured') isFeaturedParam = 'true';

        const data = await productService.getProducts({
          page,
          limit: 10,
          search: appliedSearch,
          category,
          isActive: isActiveParam,
          isFeatured: isFeaturedParam,
          sort,
        });

        setProducts(data.products);
        setMeta(data.meta);
      } catch (err) {
        setError(err.message || 'Failed to load catalogue products.');
      } finally {
        setIsLoading(false);
      }
    },
    [appliedSearch, category, statusFilter, sort]
  );

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setCategory('all');
    setStatusFilter('all');
    setSort('createdAt:desc');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    setError(null);

    try {
      await productService.deleteProduct(deleteCandidate.id || deleteCandidate._id);
      setFeedback(`Product "${deleteCandidate.name}" deleted successfully.`);
      setDeleteCandidate(null);
      setTimeout(() => setFeedback(null), 4000);
      fetchProducts(meta.page);
    } catch (err) {
      setError(err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-stone-100 text-stone-800">
              <Package className="w-5 h-5 text-brand-primary" />
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900">
              Product Catalogue
            </h2>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Manage your furniture catalogue, Cloudflare R2 media gallery, pricing, and stock levels.
          </p>
        </div>

        <Button to={ROUTES.PRODUCTS_NEW} variant="primary" icon={Plus} size="md">
          Add Product
        </Button>
      </div>

      {/* Success / Feedback Toast Banner */}
      {feedback && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs sm:text-sm shadow-xs animate-in fade-in"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-red-800 text-xs sm:text-sm shadow-xs"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchProducts(meta.page)}
            className="underline font-semibold hover:text-red-900 ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-xs space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 border-b border-stone-100 pb-3 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' },
            { id: 'featured', label: 'Featured' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, description, SKU..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setAppliedSearch('');
                }}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              aria-label="Sort products"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="stock:asc">Stock: Low to High</option>
              <option value="name:asc">Name: A to Z</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(appliedSearch || category !== 'all' || statusFilter !== 'all' || sort !== 'createdAt:desc') && (
            <div className="sm:col-span-1 flex items-center">
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors flex items-center justify-center"
                title="Reset all filters"
                aria-label="Reset all filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <LoadingIndicator size="lg" message="Loading product catalogue..." />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-heading font-semibold text-stone-900">
              No products found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {appliedSearch || category !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting the applied filters.'
                : 'Get started by adding your first furniture product to the catalogue.'}
            </p>
            {appliedSearch || category !== 'all' || statusFilter !== 'all' ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 rounded-md hover:bg-brand-primary/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            ) : (
              <Button to={ROUTES.PRODUCTS_NEW} variant="primary" size="sm" icon={Plus}>
                Add First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  <th scope="col" className="px-4 py-3">Product</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Price (₹)</th>
                  <th scope="col" className="px-4 py-3">Inventory</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {products.map((product) => {
                  const coverImage = product.thumbnail || product.images?.[0]?.url;
                  const catObj = PRODUCT_CATEGORIES.find((c) => c.value === product.category);
                  const catLabel = catObj?.label || product.category;
                  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

                  const isLowStock = product.stock > 0 && product.stock <= 5;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <tr key={product.id || product._id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Product Thumbnail + Title + SKU */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-md bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                            {coverImage ? (
                              <img
                                src={coverImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <button
                              type="button"
                              onClick={() => setPreviewProduct(product)}
                              className="font-heading font-semibold text-stone-900 hover:text-brand-primary truncate block text-left text-sm transition-colors"
                            >
                              {product.name}
                            </button>
                            <span className="text-[11px] text-stone-500 font-mono block">
                              SKU: {product.sku || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">
                          {catLabel}
                        </span>
                      </td>

                      {/* Pricing */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-stone-900">
                          {formatCurrency(product.price)}
                        </div>
                        {hasDiscount && (
                          <div className="text-[10px] text-stone-400 line-through">
                            {formatCurrency(product.originalPrice)}
                          </div>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">
                            Out of Stock (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                            Low Stock ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-stone-700">
                            {product.stock} in stock
                          </span>
                        )}
                      </td>

                      {/* Active / Featured Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {product.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-stone-200 text-stone-600">
                              Inactive
                            </span>
                          )}
                          {product.isFeatured && (
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
                              title="Featured on storefront"
                            >
                              <Sparkles className="w-3 h-3 mr-0.5" />
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Preview Details */}
                          <button
                            type="button"
                            onClick={() => setPreviewProduct(product)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                            title="Quick View Details"
                            aria-label={`Preview ${product.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <Link
                            to={ROUTES.PRODUCTS_EDIT.replace(':id', product.id || product._id)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-brand-primary hover:bg-stone-100 transition-colors"
                            title="Edit Product"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(product)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
            <div>
              Showing <span className="font-semibold text-stone-900">{(meta.page - 1) * meta.limit + 1}</span> to{' '}
              <span className="font-semibold text-stone-900">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{' '}
              of <span className="font-semibold text-stone-900">{meta.total}</span> products
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fetchProducts(meta.page - 1)}
                disabled={meta.page <= 1}
                className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-medium text-stone-800">
                Page {meta.page} of {meta.totalPages}
              </span>

              <button
                type="button"
                onClick={() => fetchProducts(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 id="delete-dialog-title" className="text-base font-heading font-semibold text-stone-900">
                Delete Product
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-stone-900 font-semibold">"{deleteCandidate.name}"</strong>?
              This action will remove the product and clean up its associated Cloudflare R2 images. This cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDeleteConfirm}
                loading={isDeleting}
                disabled={isDeleting}
              >
                Delete Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={previewProduct}
        isOpen={Boolean(previewProduct)}
        onClose={() => setPreviewProduct(null)}
      />
    </div>
  );
}

export default ProductsListPage;

