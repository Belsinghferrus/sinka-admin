import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Sparkles,
  Trash2,
} from 'lucide-react';
import reviewService from '../../services/review.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import StarRating from '../../components/reviews/StarRating.jsx';
import ReviewStatusBadge from '../../components/reviews/ReviewStatusBadge.jsx';
import ReviewDetailModal from '../../components/reviews/ReviewDetailModal.jsx';
import ReviewConfirmationModal from '../../components/reviews/ReviewConfirmationModal.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { REVIEW_STATUSES, REVIEW_RATING_FILTERS, ROUTES } from '../../constants.js';

export function ReviewsListPage() {
  const { user } = useAuth();
  const canModerate = user?.role === 'admin';

  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [counts, setCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sort, setSort] = useState('createdAt:desc');

  // Modals state
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [confirmationData, setConfirmationData] = useState({
    isOpen: false,
    actionType: null, // 'approve' | 'reject' | 'delete'
    review: null,
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Success / Feedback banner
  const [feedback, setFeedback] = useState(null);

  // ── Fetch Reviews ───────────────────────────────────────────────────────────
  const fetchReviews = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await reviewService.getReviews({
          page,
          limit: 10,
          search: appliedSearch,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          rating: ratingFilter !== 'all' ? ratingFilter : undefined,
          sort,
        });

        setReviews(data.reviews || []);
        setMeta(data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
        if (data.counts) {
          setCounts(data.counts);
        }
      } catch (err) {
        console.warn('Reviews fetch error:', err);
        let msg = 'Failed to load reviews from the backend.';
        const status = err.status || err.response?.status;
        if (status === 401) {
          msg = 'Session expired. Please sign in again.';
        } else if (status === 403) {
          msg = 'Access denied. You do not have permission to view reviews.';
        } else if (status === 404) {
          msg = 'Review not found or reviews endpoint unavailable.';
        } else if (status === 400 || status === 422) {
          msg = err.response?.data?.message || err.message || 'Invalid request parameters.';
        } else if (status === 409) {
          msg = 'Review already exists or conflicting state detected.';
        } else if (status >= 500) {
          msg = 'Server error. Please try again later.';
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          msg = 'Backend unavailable. Please verify your connection or try again shortly.';
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        }
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedSearch, statusFilter, ratingFilter, sort]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  // ── Search & Filter Handlers ────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
    setRatingFilter('all');
    setSort('createdAt:desc');
  };

  const hasActiveFilters = Boolean(
    appliedSearch ||
      statusFilter !== 'all' ||
      ratingFilter !== 'all' ||
      sort !== 'createdAt:desc'
  );

  // ── Moderation Action Handlers ──────────────────────────────────────────────
  const handleOpenApproveConfirmation = (review) => {
    setConfirmationData({
      isOpen: true,
      actionType: 'approve',
      review,
    });
  };

  const handleOpenRejectConfirmation = (review) => {
    setConfirmationData({
      isOpen: true,
      actionType: 'reject',
      review,
    });
  };

  const handleOpenDeleteConfirmation = (review) => {
    setConfirmationData({
      isOpen: true,
      actionType: 'delete',
      review,
    });
  };

  const handleCloseConfirmation = () => {
    if (isProcessingAction) return;
    setConfirmationData({
      isOpen: false,
      actionType: null,
      review: null,
    });
  };

  const handleExecuteModeration = async (review, reason = '') => {
    if (!review) return;
    setIsProcessingAction(true);
    setError(null);

    const actionType = confirmationData.actionType;

    try {
      if (actionType === 'approve') {
        await reviewService.approveReview(review.id || review._id);
        setFeedback({
          type: 'success',
          message: `Review by "${review.customer?.name || review.userName || 'Customer'}" was approved and published.`,
        });
      } else if (actionType === 'reject') {
        await reviewService.rejectReview(review.id || review._id, reason);
        setFeedback({
          type: 'success',
          message: `Review by "${review.customer?.name || review.userName || 'Customer'}" was rejected and hidden.`,
        });
      } else if (actionType === 'delete') {
        await reviewService.deleteReview(review.id || review._id);
        setFeedback({
          type: 'success',
          message: `Review by "${review.customer?.name || review.userName || 'Customer'}" was deleted successfully.`,
        });
      }

      // Close modals
      handleCloseConfirmation();
      if (isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedReview(null);
      }

      // Refresh list immediately from backend
      await fetchReviews(meta.page);
    } catch (err) {
      console.warn(`Review moderation action error [${actionType}]:`, err);
      let msg = `Failed to ${actionType} review.`;
      const status = err.status || err.response?.status;
      if (status === 401) {
        msg = 'Session expired. Please sign in again.';
      } else if (status === 403) {
        msg = 'Access denied. You do not have permission to moderate reviews.';
      } else if (status === 404) {
        msg = 'Review not found. It may have already been removed.';
      } else if (status === 400 || status === 422) {
        msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Invalid request. Please verify the submitted values.';
      } else if (status === 409) {
        msg = 'Review already exists or has already been modified by another administrator.';
      } else if (status >= 500) {
        msg = 'Server error. Unable to complete moderation action. Please try again shortly.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        msg = 'Backend unavailable. Please check your connection and try again.';
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
      handleCloseConfirmation();
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Open detail modal
  const handleOpenDetail = (review) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedReview(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    } catch {
      return dateString;
    }
  };

  const statusTabs = [
    { key: 'all', label: 'All Reviews', count: counts?.total },
    { key: 'PENDING', label: 'Pending', count: counts?.pending },
    { key: 'APPROVED', label: 'Approved', count: counts?.approved },
    { key: 'REJECTED', label: 'Rejected', count: counts?.rejected },
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
            Reviews
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage customer product reviews and moderation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchReviews(meta.page)}
          disabled={isLoading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
          title="Refresh reviews"
          aria-label="Refresh reviews"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-primary' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Feedback Toast / Banner ───────────────────────────────────────────── */}
      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs animate-in fade-in duration-150"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2.5 text-xs animate-in fade-in duration-150"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-stone-900">Unable to complete request</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 p-1 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Status Filter Tabs ────────────────────────────────────────────────── */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-2 overflow-x-auto pb-px" aria-label="Review status filters">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center space-x-1.5 py-2.5 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count !== null && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary font-bold'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, product, title, or review content..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50/70 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 transition-colors"
            />
          </div>

          {/* Rating Filter Dropdown */}
          <div className="sm:w-40">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800"
              aria-label="Filter by star rating"
            >
              {REVIEW_RATING_FILTERS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-44">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-800"
              aria-label="Sort reviews"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="rating:desc">Highest Rating</option>
              <option value="rating:asc">Lowest Rating</option>
            </select>
          </div>

          {/* Search Button */}
          <Button type="submit" variant="secondary" size="sm" className="shrink-0 text-xs">
            Search
          </Button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors shrink-0"
              title="Reset all filters"
              aria-label="Clear all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* ── Data Table / Card Container ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 font-sans">
            <LoadingIndicator size="md" message="Loading customer reviews from Sinka backend..." />
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="font-heading font-semibold text-stone-900 text-sm">
                No customer reviews yet.
              </h3>
              <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                {hasActiveFilters
                  ? 'No reviews matched your current search filters. Try resetting the filters or modifying your query.'
                  : 'Customer product reviews submitted on the Sinka storefront will appear here for moderation.'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          /* Desktop & Tablet Responsive Table */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
              <thead className="bg-stone-50/80 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Product</th>
                  <th scope="col" className="px-4 py-3">Customer</th>
                  <th scope="col" className="px-4 py-3">Rating</th>
                  <th scope="col" className="px-4 py-3 min-w-[200px]">Review</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Verified</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 whitespace-nowrap">Date</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {reviews.map((rev) => {
                  const customerName =
                    rev.customer?.name ||
                    rev.userName ||
                    rev.customerName ||
                    rev.authorName ||
                    'Anonymous';
                  const customerEmail = rev.customer?.email || rev.userEmail || rev.email || '';
                  const productName = rev.product?.name || rev.productName || 'Unspecified';
                  const productId = rev.product?.id || rev.product?._id || rev.productId || null;
                  const productImage =
                    rev.product?.thumbnail ||
                    rev.product?.images?.[0]?.url ||
                    rev.productImage ||
                    null;
                  const isVerified = Boolean(rev.verifiedPurchase ?? rev.isVerifiedPurchase ?? false);
                  const normalizedStatus = (rev.status || 'PENDING').toUpperCase();
                  const isApproved = normalizedStatus === 'APPROVED';
                  const isRejected = normalizedStatus === 'REJECTED';

                  return (
                    <tr
                      key={rev.id || rev._id}
                      className="hover:bg-stone-50/60 transition-colors"
                    >
                      {/* 1. Product */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2.5">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0 bg-white shadow-2xs"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center shrink-0 border border-stone-200">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[190px]">
                            {productId ? (
                              <Link
                                to={ROUTES.PRODUCTS_EDIT.replace(':id', productId)}
                                className="font-semibold text-stone-900 hover:text-brand-primary truncate block transition-colors leading-snug"
                                title={productName}
                              >
                                {productName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-stone-900 truncate block leading-snug" title={productName}>
                                {productName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-stone-200">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 truncate" title={customerName}>
                              {customerName}
                            </p>
                            {customerEmail && (
                              <p className="text-[11px] text-stone-400 truncate" title={customerEmail}>
                                {customerEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Rating */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StarRating rating={rev.rating || 5} size="sm" />
                      </td>

                      {/* 4. Review snippet */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-xs space-y-0.5">
                          {rev.title && (
                            <p className="font-semibold text-stone-900 line-clamp-1">{rev.title}</p>
                          )}
                          <p className="text-stone-600 text-[11px] line-clamp-2">
                            {rev.content || rev.comment || rev.reviewText || rev.body || '—'}
                          </p>
                        </div>
                      </td>

                      {/* 5. Verified Purchase */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isVerified ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>✓ Verified Purchase</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <ReviewStatusBadge status={normalizedStatus} />
                      </td>

                      {/* 7. Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-stone-500 font-mono">
                        {formatDate(rev.createdAt)}
                      </td>

                      {/* 8. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(rev)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                            title="Inspect Review Details"
                            aria-label={`View review by ${customerName}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Approve Action */}
                          {canModerate && !isApproved && (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveConfirmation(rev)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Approve Review"
                              aria-label={`Approve review by ${customerName}`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reject Action */}
                          {canModerate && !isRejected && (
                            <button
                              type="button"
                              onClick={() => handleOpenRejectConfirmation(rev)}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md transition-colors"
                              title="Reject Review"
                              aria-label={`Reject review by ${customerName}`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Action */}
                          {canModerate && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteConfirmation(rev)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Review"
                              aria-label={`Delete review by ${customerName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ─────────────────────────────────────────────────── */}
        {!isLoading && meta.total > 0 && (
          <div className="px-4 py-3 border-t border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
            <div>
              Showing <span className="font-semibold text-stone-900">{(meta.page - 1) * meta.limit + 1}</span> to{' '}
              <span className="font-semibold text-stone-900">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{' '}
              of <span className="font-semibold text-stone-900">{meta.total}</span> reviews
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fetchReviews(meta.page - 1)}
                disabled={meta.page <= 1}
                className="px-2.5 py-1.5 border border-stone-300 rounded-md bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-medium text-stone-700">
                Page {meta.page} of {meta.totalPages || 1}
              </span>

              <button
                type="button"
                onClick={() => fetchReviews(meta.page + 1)}
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

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      <ReviewDetailModal
        review={selectedReview}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onApprove={handleOpenApproveConfirmation}
        onReject={handleOpenRejectConfirmation}
        onDelete={handleOpenDeleteConfirmation}
        isProcessing={isProcessingAction}
        canModerate={canModerate}
      />

      {/* ── Confirmation Modal (Approve / Reject / Delete) ──────────────────────── */}
      <ReviewConfirmationModal
        isOpen={confirmationData.isOpen}
        actionType={confirmationData.actionType}
        review={confirmationData.review}
        onClose={handleCloseConfirmation}
        onConfirm={handleExecuteModeration}
        isProcessing={isProcessingAction}
      />
    </div>
  );
}

export default ReviewsListPage;
