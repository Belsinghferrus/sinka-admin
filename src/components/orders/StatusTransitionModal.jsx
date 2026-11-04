import { useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import OrderStatusBadge from './OrderStatusBadge.jsx';

/**
 * Modal dialog for confirming and annotating order status transitions.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm - async callback ({ status, note }) => Promise<void>
 * @param {string} props.currentStatus
 * @param {string} props.targetStatus
 * @param {string} props.orderNumber
 */
export function StatusTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  targetStatus,
  orderNumber,
}) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const isRestoration = targetStatus === 'CANCELLED' || targetStatus === 'REJECTED';
  const isTerminal = ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(targetStatus);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm({ status: targetStatus, note });
      setNote('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update order status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionLabel = (status) => {
    const map = {
      ACCEPTED: 'Accept Order',
      PROCESSING: 'Mark as Processing',
      PACKED: 'Mark as Packed',
      SHIPPED: 'Mark as Shipped',
      OUT_FOR_DELIVERY: 'Mark Out for Delivery',
      DELIVERED: 'Confirm Delivery',
      CANCELLED: 'Cancel Order',
      REJECTED: 'Reject Order',
    };
    return map[status] || `Transition to ${status}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transition-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-heading font-semibold text-stone-900 text-sm">
              Confirm Status Transition
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-xs">
              {error}
            </div>
          )}

          {/* Status Progression Summary */}
          <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Current Status
              </span>
              <div className="mt-1">
                <OrderStatusBadge status={currentStatus} />
              </div>
            </div>

            <span className="text-stone-400 text-lg font-light">→</span>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Target Status
              </span>
              <div className="mt-1 flex justify-end">
                <OrderStatusBadge status={targetStatus} />
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            You are about to change the status of order{' '}
            <span className="font-mono font-semibold text-stone-900">#{orderNumber}</span> to{' '}
            <span className="font-semibold text-stone-900">{targetStatus}</span>.
          </p>

          {/* Inventory Restoration Warning */}
          {isRestoration && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start space-x-2.5 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Inventory Restoration Notice</p>
                <p className="mt-0.5 leading-relaxed">
                  Transitioning to {targetStatus} will automatically restore the reserved product quantities back to live catalogue stock in MongoDB.
                </p>
              </div>
            </div>
          )}

          {/* Terminal Warning */}
          {isTerminal && !isRestoration && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Note: <span className="font-semibold">{targetStatus}</span> is a terminal state. Once set, further automated lifecycle transitions will be closed.
              </p>
            </div>
          )}

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="transition-note"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Administrative Note (Optional)
            </label>
            <textarea
              id="transition-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified payment with bank, item packed in warehouse rack B-4..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              maxLength={1000}
            />
            <p className="text-[11px] text-stone-400 text-right">{note.length}/1000 characters</p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isRestoration ? 'secondary' : 'primary'}
              size="sm"
              isLoading={isSubmitting}
            >
              {getActionLabel(targetStatus)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StatusTransitionModal;

