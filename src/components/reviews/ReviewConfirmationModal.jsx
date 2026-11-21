import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import Button from '../ui/Button.jsx';

/**
 * Confirmation dialog for review moderation actions (Approve, Reject, Delete).
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {'approve'|'reject'|'delete'|null} props.actionType
 * @param {object} props.review
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm - Callback (review, reason) => Promise<void>
 * @param {boolean} props.isProcessing
 */
export function ReviewConfirmationModal({
  isOpen,
  actionType,
  review,
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  // Keyboard accessibility
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

  if (!isOpen || !review || !actionType) return null;

  const isApprove = actionType === 'approve';
  const isDelete = actionType === 'delete';
  const isReject = actionType === 'reject';

  const customerName =
    review.customer?.name ||
    review.userName ||
    review.customerName ||
    review.authorName ||
    'this customer';
  const productName = review.product?.name || review.productName || 'the product';

  const handleConfirm = () => {
    onConfirm(review, reason);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50/60">
          <div className="flex items-center space-x-2.5">
            <span
              className={`p-1.5 rounded-md ${
                isApprove
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isApprove ? (
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
              ) : isDelete ? (
                <Trash2 className="w-4 h-4 text-rose-600" />
              ) : (
                <ThumbsDown className="w-4 h-4 text-rose-600" />
              )}
            </span>
            <h3 id="confirm-modal-title" className="text-sm font-heading font-semibold text-stone-900">
              {isApprove
                ? 'Approve Customer Review'
                : isDelete
                ? 'Delete Customer Review'
                : 'Reject Customer Review'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs text-stone-700">
          <p className="leading-relaxed">
            {isApprove ? (
              <>
                Are you sure you want to approve the review by{' '}
                <strong className="text-stone-900 font-semibold">{customerName}</strong> for{' '}
                <strong className="text-stone-900 font-semibold">{productName}</strong>?
                <br />
                <span className="text-emerald-700 font-medium mt-1 block">
                  Once approved, this review will be published to the customer storefront.
                </span>
              </>
            ) : isDelete ? (
              <>
                Are you sure you want to delete this review by{' '}
                <strong className="text-stone-900 font-semibold">{customerName}</strong>?
                <br />
                <span className="text-rose-700 font-medium mt-1 block">
                  This action permanently removes the review from the database.
                </span>
              </>
            ) : (
              <>
                Are you sure you want to reject the review by{' '}
                <strong className="text-stone-900 font-semibold">{customerName}</strong> for{' '}
                <strong className="text-stone-900 font-semibold">{productName}</strong>?
                <br />
                <span className="text-rose-700 font-medium mt-1 block">
                  Rejected reviews will be hidden from public customer display.
                </span>
              </>
            )}
          </p>

          {/* Review snippet */}
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              Review Snippet
            </span>
            {review.title && (
              <p className="font-semibold text-stone-900 line-clamp-1">{review.title}</p>
            )}
            <p className="text-stone-600 text-[11px] line-clamp-2 italic">
              &quot;{review.content || review.comment || review.reviewText || review.body}&quot;
            </p>
          </div>

          {/* Optional reason textarea for rejection */}
          {isReject && (
            <div>
              <label htmlFor="rejection-reason" className="block text-[11px] font-medium text-stone-700 mb-1">
                Moderation Reason (Optional)
              </label>
              <textarea
                id="rejection-reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Inappropriate language, off-topic, spam, or pricing dispute..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary text-stone-900 placeholder:text-stone-400 resize-none"
                maxLength={300}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3 border-t border-stone-200 bg-stone-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <Button
            variant={isApprove ? 'primary' : 'danger'}
            size="sm"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="inline-flex items-center space-x-1.5 shadow-xs"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isApprove ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isDelete ? (
              <Trash2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>
              {isProcessing
                ? 'Processing...'
                : isApprove
                ? 'Yes, Approve Review'
                : isDelete
                ? 'Yes, Delete Review'
                : 'Yes, Reject Review'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReviewConfirmationModal;
