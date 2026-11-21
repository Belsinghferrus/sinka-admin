import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  User,
  Package,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Clock,
  Mail,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import StarRating from './StarRating.jsx';
import ReviewStatusBadge from './ReviewStatusBadge.jsx';
import Button from '../ui/Button.jsx';
import { ROUTES } from '../../constants.js';

/**
 * Detailed Review Inspection and Moderation Modal.
 *
 * Displays:
 *   - Customer Information (name, email)
 *   - Product Information (title, image, category/SKU, link to edit product)
 *   - Order Information (order number, link to order details)
 *   - Rating & Verified Purchase badge
 *   - Review Title & Full Review Content
 *   - Moderation Status & Timestamps
 *   - Direct Moderation Actions: Approve & Reject
 *
 * NOTE: As explicitly specified in the requirements, customer review photos
 * are omitted to maintain a clean text-focused back-office moderation review.
 */
export function ReviewDetailModal({
  review,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onDelete,
  isProcessing = false,
  canModerate = true,
}) {
  // Keyboard accessibility: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isProcessing]);

  if (!isOpen || !review) return null;

  // Extract Customer details safely
  const customerName =
    review.customer?.name ||
    review.userName ||
    review.customerName ||
    review.user?.name ||
    review.authorName ||
    'Anonymous Customer';

  const customerEmail =
    review.customer?.email ||
    review.userEmail ||
    review.user?.email ||
    review.email ||
    null;

  // Extract Product details safely
  const productObj = review.product || {};
  const productName = productObj.name || review.productName || 'Unspecified Product';
  const productId = productObj.id || productObj._id || review.productId || null;
  const productImage =
    productObj.thumbnail ||
    productObj.images?.[0]?.url ||
    review.productImage ||
    null;
  const productCategory = productObj.category || review.category || null;

  // Extract Order details safely
  const orderObj = review.order || {};
  const orderNumber =
    orderObj.orderNumber ||
    review.orderNumber ||
    review.orderId ||
    orderObj.id ||
    orderObj._id ||
    null;

  // Verified purchase check
  const isVerifiedPurchase = Boolean(review.verifiedPurchase ?? review.isVerifiedPurchase ?? false);

  // Status check
  const normalizedStatus = (review.status || 'PENDING').toUpperCase();
  const isApproved = normalizedStatus === 'APPROVED';
  const isRejected = normalizedStatus === 'REJECTED';

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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-detail-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/60">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-md bg-stone-200/70 text-stone-700">
              <MessageSquare className="w-4 h-4 text-brand-primary" />
            </span>
            <div>
              <h3 id="review-detail-title" className="text-sm sm:text-base font-heading font-semibold text-stone-900">
                Customer Review Details
              </h3>
              <p className="text-[11px] text-stone-500 font-mono">
                Review ID: {review.id || review._id || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ReviewStatusBadge status={normalizedStatus} size="sm" />
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-130px)] overflow-y-auto text-xs sm:text-sm">
          {/* Top Context Cards Grid: Customer, Product & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Customer Information Card */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block flex items-center space-x-1">
                <User className="w-3 h-3 text-stone-400" />
                <span>Customer Information</span>
              </span>
              <p className="font-semibold text-stone-900 text-sm">{customerName}</p>
              {customerEmail ? (
                <a
                  href={`mailto:${customerEmail}`}
                  className="text-stone-600 hover:text-brand-primary flex items-center space-x-1 truncate text-xs transition-colors"
                >
                  <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                  <span className="truncate">{customerEmail}</span>
                </a>
              ) : (
                <p className="text-[11px] text-stone-400">Email not provided</p>
              )}
            </div>

            {/* Order & Verification Information Card */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block flex items-center space-x-1">
                <ShoppingBag className="w-3 h-3 text-stone-400" />
                <span>Order Reference</span>
              </span>
              {orderNumber ? (
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-stone-900 text-xs sm:text-sm">
                    {orderNumber}
                  </span>
                  <Link
                    to={ROUTES.ORDERS_DETAIL.replace(':orderId', orderNumber)}
                    className="text-[11px] text-brand-primary hover:underline inline-flex items-center space-x-1"
                    title="View related customer order"
                  >
                    <span>View Order</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-stone-500 font-mono">Not linked to order</p>
              )}

              {/* Verified Purchase indicator */}
              <div className="pt-0.5">
                {isVerifiedPurchase ? (
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Verified Purchase</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-stone-500 text-[11px] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    <span>Unverified Purchase</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Association Card */}
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block flex items-center space-x-1">
              <Package className="w-3 h-3 text-stone-400" />
              <span>Associated Product</span>
            </span>
            <div className="flex items-center space-x-3">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0 bg-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-stone-200 text-stone-400 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-heading font-semibold text-stone-900 text-sm truncate">
                  {productName}
                </h4>
                {productCategory && (
                  <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                    {productCategory}
                  </span>
                )}
              </div>
              {productId && (
                <Link
                  to={ROUTES.PRODUCTS_EDIT.replace(':id', productId)}
                  className="text-xs text-brand-primary hover:underline inline-flex items-center space-x-1 shrink-0 font-medium"
                  title="Inspect or edit product in catalogue"
                >
                  <span>Edit Product</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Review Rating & Content Section */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <StarRating rating={review.rating || 5} size="md" />
                <span className="text-xs font-semibold text-stone-500">
                  ({review.rating || 5} out of 5 stars)
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-stone-400">
                <Calendar className="w-3 h-3" />
                <span>Submitted: {formatDate(review.createdAt)}</span>
              </div>
            </div>

            {/* Review Title */}
            {review.title && (
              <h5 className="font-heading font-bold text-stone-900 text-sm sm:text-base leading-snug">
                {review.title}
              </h5>
            )}

            {/* Review Body */}
            <div className="text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-stone-50/70 p-3.5 rounded-lg border border-stone-100">
              {review.content || review.comment || review.reviewText || review.body || 'No review comment provided.'}
            </div>

            {/* Rejection Note/Reason if previously rejected */}
            {review.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                <span className="font-semibold block mb-0.5">Moderation Note / Rejection Reason:</span>
                <span>{review.rejectionReason}</span>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-stone-400 pt-1">
            <span>Created: {formatDate(review.createdAt)}</span>
            {review.updatedAt && review.updatedAt !== review.createdAt && (
              <span>Last Modified: {formatDate(review.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Modal Footer with Moderation Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 py-3.5 border-t border-stone-200 bg-stone-50">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
            >
              Close
            </button>
            {canModerate && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(review)}
                disabled={isProcessing}
                className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors inline-flex items-center space-x-1"
                title="Delete review permanently"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Review</span>
              </button>
            )}
          </div>

          {canModerate && (
            <div className="flex items-center space-x-2">
              {/* Reject Action */}
              {!isRejected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(review)}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5 text-rose-700 hover:bg-rose-50 border-rose-200"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Reject Review</span>
                </Button>
              )}

              {/* Approve Action */}
              {!isApproved && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApprove(review)}
                  disabled={isProcessing}
                  className="inline-flex items-center space-x-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Approve Review</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewDetailModal;
