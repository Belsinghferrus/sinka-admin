import { useState, useEffect } from 'react';
import { Truck, ExternalLink, X, Info } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { COURIER_PROVIDERS } from '../../constants.js';

/**
 * Modal dialog for assigning or updating courier tracking details.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onSave - async callback (trackingData) => Promise<void>
 * @param {object} [props.initialCourier] - existing courier object { name, trackingId, trackingUrl, shipmentDate, shippingNote }
 * @param {string} props.orderNumber
 * @param {string} props.currentStatus
 */
export function CourierTrackingModal({
  isOpen,
  onClose,
  onSave,
  initialCourier = {},
  orderNumber,
  currentStatus,
}) {
  const [selectedProvider, setSelectedProvider] = useState('Delhivery');
  const [customCourierName, setCustomCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const existingName = initialCourier?.name || '';
      const matched = COURIER_PROVIDERS.find(
        (p) => p.value.toLowerCase() === existingName.toLowerCase()
      );

      if (matched && matched.value !== 'Other') {
        setSelectedProvider(matched.value);
        setCustomCourierName('');
      } else if (existingName) {
        setSelectedProvider('Other');
        setCustomCourierName(existingName);
      } else {
        setSelectedProvider('Delhivery');
        setCustomCourierName('');
      }

      setTrackingId(initialCourier?.trackingId || '');
      setTrackingUrl(initialCourier?.trackingUrl || '');

      const initialDate = initialCourier?.shipmentDate
        ? new Date(initialCourier.shipmentDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setShipmentDate(initialDate);

      setShippingNote(initialCourier?.shippingNote || '');
    }
  }, [isOpen, initialCourier]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const resolvedCourierName =
      selectedProvider === 'Other' ? customCourierName.trim() : selectedProvider.trim();

    if (!resolvedCourierName) {
      setError('Please provide the courier provider name.');
      return;
    }

    if (!trackingId.trim()) {
      setError('Tracking ID / AWB Number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        courierName: resolvedCourierName,
        trackingId: trackingId.trim(),
        trackingUrl: trackingUrl.trim(),
        shipmentDate: shipmentDate ? new Date(shipmentDate).toISOString() : new Date().toISOString(),
        shippingNote: shippingNote.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save courier tracking details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const willAutoShip = ['PENDING', 'ACCEPTED', 'PROCESSING', 'PACKED'].includes(currentStatus);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="courier-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-brand-primary" />
            <h3 id="courier-modal-title" className="font-heading font-semibold text-stone-900 text-sm">
              Courier Tracking Details
            </h3>
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

          {willAutoShip && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start space-x-2 text-blue-800 text-xs">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-blue-900">Auto-Ship Progression:</span>
                <p className="mt-0.5 text-blue-700 leading-relaxed">
                  Assigning courier tracking will automatically transition order{' '}
                  <span className="font-mono font-medium">#{orderNumber}</span> to{' '}
                  <span className="font-semibold">SHIPPED</span> and dispatch customer email notification.
                </p>
              </div>
            </div>
          )}

          {/* Courier Provider Select */}
          <div className="space-y-1.5">
            <label
              htmlFor="courier-provider"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Courier Provider Name <span className="text-red-500">*</span>
            </label>
            <select
              id="courier-provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              {COURIER_PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Courier Input if 'Other' selected */}
          {selectedProvider === 'Other' && (
            <div className="space-y-1.5">
              <label
                htmlFor="custom-courier-name"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Custom Courier Name <span className="text-red-500">*</span>
              </label>
              <input
                id="custom-courier-name"
                type="text"
                value={customCourierName}
                onChange={(e) => setCustomCourierName(e.target.value)}
                placeholder="e.g. Professional Couriers, Gati, SafeExpress..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                required
              />
            </div>
          )}

          {/* Tracking ID / AWB Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="tracking-id"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Tracking ID / AWB Number <span className="text-red-500">*</span>
            </label>
            <input
              id="tracking-id"
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. 1234567890123"
              className="w-full font-mono px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              required
            />
          </div>

          {/* Tracking URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="tracking-url"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
              >
                Direct Tracking URL (Optional)
              </label>
              {selectedProvider !== 'Other' && (
                <span className="text-[10px] text-stone-400">
                  Auto-generated for {selectedProvider} if left blank
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="tracking-url"
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700"
                  title="Test Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Shipment Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="shipment-date"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Shipment / Handover Date
            </label>
            <input
              id="shipment-date"
              type="date"
              value={shipmentDate}
              onChange={(e) => setShipmentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md shadow-2xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          {/* Shipping Note */}
          <div className="space-y-1.5">
            <label
              htmlFor="shipping-note"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-700"
            >
              Shipping Notes / Instructions (Optional)
            </label>
            <textarea
              id="shipping-note"
              rows={2}
              value={shippingNote}
              onChange={(e) => setShippingNote(e.target.value)}
              placeholder="e.g. Heavy furniture packaged in 2 wooden crates. Fragile glass inside."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              maxLength={500}
            />
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
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              icon={Truck}
            >
              Save Tracking Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourierTrackingModal;

