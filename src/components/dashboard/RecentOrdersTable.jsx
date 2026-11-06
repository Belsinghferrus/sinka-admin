import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, ROUTES } from '../../constants.js';

function formatOrderDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Recent Orders Table for Admin Dashboard.
 * Displays the latest 5-8 orders with status badges and details link.
 *
 * @param {object} props
 * @param {Array<object>} props.orders
 * @param {boolean} props.isLoading
 */
export function RecentOrdersTable({ orders = [], isLoading = false }) {
  const navigate = useNavigate();
  const items = orders || [];

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs font-sans space-y-4">
      {/* Table Header & View All Orders link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-brand-primary/10 text-brand-primary">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <h3 className="text-base font-heading font-semibold text-stone-900 tracking-tight">
              Recent Orders
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Latest purchase transactions requiring fulfillment and courier tracking.
          </p>
        </div>

        <Link
          to={ROUTES.ORDERS}
          className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover inline-flex items-center space-x-1 transition-colors"
        >
          <span>View All Orders →</span>
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3 py-6 animate-pulse">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-10 bg-stone-100 rounded-lg w-full" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-stone-400">
          <ShoppingBag className="w-8 h-8 stroke-1 text-stone-300" />
          <p className="text-xs font-semibold text-stone-700">No orders yet</p>
          <p className="text-[11px] text-stone-400">
            Customer checkout orders will immediately populate this table.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-medium">
                <th className="py-2.5 pr-4 font-semibold">Order</th>
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold">Items</th>
                <th className="py-2.5 px-4 font-semibold">Amount</th>
                <th className="py-2.5 px-4 font-semibold">Payment</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Tracking</th>
                <th className="py-2.5 pl-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {items.map((order) => {
                const orderId = order.orderId || order.id;
                const statusMeta = ORDER_STATUS_CONFIG[order.orderStatus || order.status] || {
                  label: order.orderStatus || order.status || 'PENDING',
                  badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
                };
                const paymentMeta = PAYMENT_STATUS_CONFIG[order.paymentStatus] || {
                  label: order.paymentStatus || 'PENDING',
                  badgeClass: 'bg-stone-100 text-stone-700 border-stone-300',
                };

                return (
                  <tr
                    key={orderId}
                    onClick={() => navigate(`/orders/${orderId}`)}
                    className="hover:bg-stone-50/70 transition-colors cursor-pointer"
                  >
                    {/* Order Number */}
                    <td className="py-3 pr-4 font-mono font-semibold text-stone-900">
                      <Link
                        to={`/orders/${orderId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-brand-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="min-w-0 max-w-[160px]">
                        <p className="font-semibold text-stone-900 truncate" title={order.customerName}>
                          {order.customerName}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate" title={order.customerEmail}>
                          {order.customerEmail}
                        </p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-stone-500">
                      {formatOrderDate(order.date || order.createdAt)}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 font-heading font-bold text-stone-900">
                      {formatCurrency(order.totalAmount)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${paymentMeta.badgeClass}`}
                      >
                        {paymentMeta.label}
                      </span>
                    </td>

                    {/* Order Lifecycle Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Courier Tracking */}
                    <td className="py-3 px-4">
                      {order.trackingId ? (
                        <span className="inline-flex items-center space-x-1 font-mono text-[11px] text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded">
                          <span>{order.trackingId}</span>
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>

                    {/* Action link */}
                    <td className="py-3 pl-4 text-right">
                      <Link
                        to={`/orders/${orderId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-brand-primary hover:text-brand-primary-hover hover:underline"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const RecentOrders = RecentOrdersTable;
export default RecentOrdersTable;
