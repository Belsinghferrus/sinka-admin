import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  ShoppingBag,
  User,
  MapPin,
  CreditCard,
  Truck,
  History,
  FileText,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Phone,
  Mail,
  Send,
  Plus,
} from 'lucide-react';
import orderService from '../../services/order.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import PaymentStatusBadge from '../../components/orders/PaymentStatusBadge.jsx';
import StatusTransitionModal from '../../components/orders/StatusTransitionModal.jsx';
import CourierTrackingModal from '../../components/orders/CourierTrackingModal.jsx';
import { getAllowedTransitions, isTerminalStatus, ROUTES } from '../../constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Status transition modal state
  const [targetStatus, setTargetStatus] = useState(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  // Courier modal state
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);

  // Admin note state
  const [adminNoteText, setAdminNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to retrieve order details.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleStatusTransition = async ({ status, note }) => {
    const updated = await orderService.updateOrderStatus(order._id || order.id || order.orderNumber, {
      status,
      note,
    });
    setOrder(updated);
    setFeedback(`Order status successfully updated to ${status}.`);
  };

  const handleSaveTracking = async (trackingData) => {
    const updated = await orderService.updateOrderTracking(
      order._id || order.id || order.orderNumber,
      trackingData
    );
    setOrder(updated);
    setFeedback(
      `Courier tracking details saved successfully. Status is now ${updated.status}.`
    );
  };

  const handleAddAdminNote = async (e) => {
    e.preventDefault();
    if (!adminNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const updated = await orderService.addAdminNote(
        order._id || order.id || order.orderNumber,
        { note: adminNoteText.trim() }
      );
      setOrder(updated);
      setAdminNoteText('');
      setFeedback('Admin note added successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add admin note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 font-sans">
        <LoadingIndicator message="Loading order details..." fullPage />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6 font-sans space-y-4 max-w-4xl mx-auto">
        <Link
          to={ROUTES.ORDERS}
          className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Order Not Found or Failed to Load</span>
          </div>
          <p className="mt-2 text-xs text-red-700">{error || `Order '${orderId}' could not be located.`}</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchOrder}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allowedTransitions = getAllowedTransitions(order.status);
  const terminal = isTerminalStatus(order.status);
  const hasCourier = Boolean(order.courier && order.courier.trackingId);

  const getTransitionButtonVariant = (status) => {
    if (status === 'CANCELLED' || status === 'REJECTED') return 'secondary';
    if (status === 'DELIVERED') return 'primary';
    return 'outline';
  };

  const getTransitionLabel = (status) => {
    const map = {
      ACCEPTED: 'Accept Order',
      PROCESSING: 'Mark Processing',
      PACKED: 'Mark Packed',
      SHIPPED: 'Mark Shipped',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Mark Delivered',
      CANCELLED: 'Cancel Order',
      REJECTED: 'Reject Order',
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={ROUTES.ORDERS}
            className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-primary shrink-0" />
              <span>Order #{order.orderNumber}</span>
            </h1>

            <button
              type="button"
              onClick={() => handleCopy(order.orderNumber, 'orderNumber')}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title="Copy Order Number"
              aria-label="Copy Order Number"
            >
              {copiedKey === 'orderNumber' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <OrderStatusBadge status={order.status} size="md" />
              <PaymentStatusBadge status={order.payment?.status || 'PENDING'} size="md" />
            </div>
          </div>
          <p className="mt-1 text-xs text-stone-500 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Placed on {formatDateTime(order.createdAt)}</span>
          </p>
        </div>

        {/* Quick Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCourierModalOpen(true)}
            icon={Truck}
          >
            {hasCourier ? 'Edit Tracking' : 'Assign Tracking'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrder}
            icon={RotateCcw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Success Feedback Alert */}
      {feedback && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs sm:text-sm shadow-xs"
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
            <span className="sr-only">Dismiss</span>
            &times;
          </button>
        </div>
      )}

      {/* Lifecycle Status Action Bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Order Lifecycle Stage
            </h2>
            <p className="text-xs text-stone-700 mt-0.5">
              Current Status: <span className="font-semibold text-stone-900">{order.status}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {terminal ? (
              <span className="inline-flex items-center text-xs text-stone-500 bg-stone-100 px-3 py-1.5 rounded-md font-medium">
                Terminal Status (No further transitions permitted)
              </span>
            ) : allowedTransitions.length > 0 ? (
              allowedTransitions.map((nextStatus) => (
                <Button
                  key={nextStatus}
                  variant={getTransitionButtonVariant(nextStatus)}
                  size="sm"
                  onClick={() => {
                    setTargetStatus(nextStatus);
                    setIsTransitionModalOpen(true);
                  }}
                >
                  {getTransitionLabel(nextStatus)}
                </Button>
              ))
            ) : (
              <span className="text-xs text-stone-400">No active transitions</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Customer & Shipping (Left/Top) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer Information Card */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <User className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Customer Information
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Full Name:</span>
              <span className="font-semibold text-stone-900">
                {order.customerSnapshot?.name || 'Customer'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Email:</span>
              <div className="flex items-center space-x-1">
                <a
                  href={`mailto:${order.customerSnapshot?.email}`}
                  className="font-mono text-brand-primary hover:underline"
                >
                  {order.customerSnapshot?.email || 'N/A'}
                </a>
                {order.customerSnapshot?.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(order.customerSnapshot?.email, 'email')}
                    className="p-1 text-stone-400 hover:text-stone-700"
                    title="Copy Email"
                  >
                    {copiedKey === 'email' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Phone Number:</span>
              <div className="flex items-center space-x-1">
                <a
                  href={`tel:${order.customerSnapshot?.phone}`}
                  className="font-mono text-stone-900 hover:text-brand-primary"
                >
                  {order.customerSnapshot?.phone || 'N/A'}
                </a>
                {order.customerSnapshot?.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(order.customerSnapshot?.phone, 'phone')}
                    className="p-1 text-stone-400 hover:text-stone-700"
                    title="Copy Phone"
                  >
                    {copiedKey === 'phone' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-stone-500 font-medium">Customer ID:</span>
              <span className="font-mono text-stone-500 text-[11px]">
                {order.customer?._id || order.customer || 'Guest / Direct'}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Information Card */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-brand-primary" />
              <h2 className="font-heading font-semibold text-stone-900 text-sm">
                Shipping Information
              </h2>
            </div>
            {order.shippingAddress?.addressLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-700 uppercase">
                {order.shippingAddress.addressLabel}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-stone-500 font-medium block">Recipient Name:</span>
              <p className="font-semibold text-stone-900 mt-0.5">
                {order.shippingAddress?.recipientName || order.customerSnapshot?.name}
              </p>
            </div>

            <div>
              <span className="text-stone-500 font-medium block">Delivery Address:</span>
              <p className="text-stone-800 leading-relaxed mt-0.5">
                {order.shippingAddress?.addressLine1}
                {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                {order.shippingAddress?.landmark && ` (Near ${order.shippingAddress.landmark})`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
              <div>
                <span className="text-stone-500 font-medium block">City & State:</span>
                <p className="text-stone-800 mt-0.5">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
              </div>

              <div>
                <span className="text-stone-500 font-medium block">PIN Code & Country:</span>
                <p className="text-stone-800 font-mono mt-0.5">
                  {order.shippingAddress?.pinCode}, {order.shippingAddress?.country || 'India'}
                </p>
              </div>
            </div>

            {order.shippingAddress?.alternatePhone && (
              <div className="pt-1 border-t border-stone-100">
                <span className="text-stone-500 font-medium block">Alternate Phone:</span>
                <p className="text-stone-800 font-mono mt-0.5">
                  {order.shippingAddress.alternatePhone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Courier Tracking Section */}
      <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Courier Tracking Details
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCourierModalOpen(true)}
          >
            {hasCourier ? 'Update Tracking Details' : 'Assign Courier Tracking'}
          </Button>
        </div>

        {hasCourier ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-[11px] uppercase tracking-wider">
                Logistics Provider
              </span>
              <p className="font-semibold text-stone-900 mt-1 text-sm">
                {order.courier.name}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-[11px] uppercase tracking-wider">
                AWB / Tracking Number
              </span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {order.courier.trackingId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.courier.trackingId, 'trackingId')}
                  className="p-1 text-stone-400 hover:text-stone-700"
                  title="Copy Tracking ID"
                >
                  {copiedKey === 'trackingId' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium block text-[11px] uppercase tracking-wider">
                Shipment Handover Date
              </span>
              <p className="font-medium text-stone-800 mt-1">
                {order.courier.shipmentDate ? formatDateTime(order.courier.shipmentDate) : 'Recorded'}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex flex-col justify-between">
              <span className="text-stone-500 font-medium block text-[11px] uppercase tracking-wider">
                Live Shipment Link
              </span>
              {order.courier.trackingUrl ? (
                <a
                  href={order.courier.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 mt-1 text-xs font-semibold text-brand-primary hover:underline"
                >
                  <span>Track Live on {order.courier.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-stone-400 text-xs mt-1">Direct link not configured</span>
              )}
            </div>

            {order.courier.shippingNote && (
              <div className="sm:col-span-2 lg:col-span-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-stone-500 font-medium block text-[11px] uppercase tracking-wider">
                  Shipping Note
                </span>
                <p className="text-stone-700 mt-1">{order.courier.shippingNote}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-stone-50/60 rounded-lg border border-stone-200/80 text-center">
            <Truck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-stone-700">No courier tracking assigned yet.</p>
            <p className="text-[11px] text-stone-500 max-w-md mx-auto mt-0.5 mb-3">
              When items are packed and dispatched, assign the courier name and AWB tracking number so customers receive shipment updates.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCourierModalOpen(true)}
              icon={Truck}
            >
              Assign Tracking &amp; Ship
            </Button>
          </div>
        )}
      </div>

      {/* Order Items Table Card */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Ordered Items ({(order.items || []).length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[11px] font-semibold tracking-wider select-none">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Product
                </th>
                <th scope="col" className="px-4 py-3">
                  SKU / Variant
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Quantity
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Unit Price
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {(order.items || []).map((item, idx) => {
                const unitPriceFormatted = formatCurrency(item.unitPrice || 0);
                const subtotalFormatted = formatCurrency(item.itemSubtotal || item.unitPrice * item.quantity || 0);

                return (
                  <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                    {/* Thumbnail & Product Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-md bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-stone-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 text-xs sm:text-sm leading-snug">
                            {item.name}
                          </p>
                          {item.variant?.name && (
                            <span className="text-[11px] text-stone-500 block">
                              Variant: {item.variant.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-stone-600 text-xs">
                        {item.sku || 'N/A'}
                      </span>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-800">
                        {item.quantity}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap text-stone-700">
                      {unitPriceFormatted}
                    </td>

                    {/* Item Subtotal */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap font-heading font-semibold text-stone-900">
                      {subtotalFormatted}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary & Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Payment Transaction & Details */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-brand-primary" />
              <h2 className="font-heading font-semibold text-stone-900 text-sm">
                Payment Details
              </h2>
            </div>
            <PaymentStatusBadge status={order.payment?.status || 'PENDING'} />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Payment Method:</span>
              <span className="font-semibold text-stone-900 uppercase">
                {order.payment?.method || 'COD (Cash on Delivery)'}
              </span>
            </div>

            {order.payment?.transactionId && (
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Transaction ID:</span>
                <div className="flex items-center space-x-1">
                  <span className="font-mono text-stone-800 text-[11px]">
                    {order.payment.transactionId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.payment.transactionId, 'txId')}
                    className="p-1 text-stone-400 hover:text-stone-700"
                    title="Copy Transaction ID"
                  >
                    {copiedKey === 'txId' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {order.payment?.paymentOrderId && (
              <div className="flex justify-between items-center py-1 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Gateway Order ID:</span>
                <span className="font-mono text-stone-800 text-[11px]">
                  {order.payment.paymentOrderId}
                </span>
              </div>
            )}

            {order.payment?.paidAt && (
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Payment Timestamp:</span>
                <span className="text-stone-800">{formatDateTime(order.payment.paidAt)}</span>
              </div>
            )}

            {order.payment?.refundId && (
              <div className="flex justify-between py-1 border-b border-stone-100 text-purple-800">
                <span className="font-medium">Refund Reference:</span>
                <span className="font-mono text-[11px]">{order.payment.refundId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Breakdown Card */}
        <div className="bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <FileText className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Pricing Breakdown
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-stone-600">Items Subtotal:</span>
              <span className="font-medium text-stone-900">
                {formatCurrency(order.pricing?.subtotal || 0)}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-stone-600">Discounts Applied:</span>
              <span className="text-emerald-700 font-medium">
                {order.pricing?.discountAmount > 0
                  ? `-${formatCurrency(order.pricing.discountAmount)}`
                  : '₹0'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-stone-600">Shipping Charges:</span>
              <span className="font-medium text-stone-900">
                {order.pricing?.shippingCharges > 0
                  ? formatCurrency(order.pricing.shippingCharges)
                  : '₹0 (Free Shipping)'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-stone-600">Taxes (GST):</span>
              <span className="text-stone-500">₹0 (Included in catalog price)</span>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-stone-900">Final Total Amount:</span>
              <span className="text-xl font-heading font-bold text-stone-900">
                {formatCurrency(order.pricing?.totalAmount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order History Timeline & Internal Admin Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Status History Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <History className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Order Lifecycle Timeline
            </h2>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {((order.statusHistory || []).slice().reverse()).map((event, idx) => (
              <div key={idx} className="relative">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-brand-primary ring-4 ring-white" />

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-stone-900">
                      {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      by {event.changedBy || 'System'}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500">
                    {formatDateTime(event.timestamp)}
                  </p>

                  {event.note && (
                    <p className="text-xs text-stone-700 bg-stone-50 p-2 rounded-md border border-stone-200/60 mt-1">
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Administrative Notes (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <FileText className="w-4 h-4 text-brand-primary" />
            <h2 className="font-heading font-semibold text-stone-900 text-sm">
              Internal Admin Notes
            </h2>
          </div>

          {/* Form to Append Note */}
          <form onSubmit={handleAddAdminNote} className="space-y-2">
            <textarea
              rows={2}
              value={adminNoteText}
              onChange={(e) => setAdminNoteText(e.target.value)}
              placeholder="Add an internal note visible only to back-office admins..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              maxLength={2000}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={isSubmittingNote}
                disabled={!adminNoteText.trim()}
                icon={Plus}
              >
                Add Note
              </Button>
            </div>
          </form>

          {/* Existing Notes List */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pt-2 border-t border-stone-100">
            {(order.adminNotes || []).length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-4">
                No internal admin notes recorded yet.
              </p>
            ) : (
              (order.adminNotes || []).slice().reverse().map((noteItem, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50 rounded-md border border-stone-200/60 text-xs space-y-1">
                  <p className="text-stone-800 leading-relaxed">{noteItem.note}</p>
                  <div className="flex justify-between text-[10px] text-stone-400 pt-1">
                    <span>{noteItem.addedBy}</span>
                    <span>{formatDateTime(noteItem.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Status Transition Modal */}
      <StatusTransitionModal
        isOpen={isTransitionModalOpen}
        onClose={() => {
          setIsTransitionModalOpen(false);
          setTargetStatus(null);
        }}
        onConfirm={handleStatusTransition}
        currentStatus={order.status}
        targetStatus={targetStatus}
        orderNumber={order.orderNumber}
      />

      {/* Courier Tracking Modal */}
      <CourierTrackingModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        onSave={handleSaveTracking}
        initialCourier={order.courier || {}}
        orderNumber={order.orderNumber}
        currentStatus={order.status}
      />
    </div>
  );
}

export default OrderDetailPage;

