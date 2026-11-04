import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Calendar,
  RotateCcw,
  RefreshCw,
  Phone,
  Mail,
  User,
  CreditCard,
  Truck,
} from 'lucide-react';
import orderService from '../../services/order.service.js';
import Button from '../../components/ui/Button.jsx';
import LoadingIndicator from '../../components/ui/LoadingIndicator.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import PaymentStatusBadge from '../../components/orders/PaymentStatusBadge.jsx';
import { ORDER_STATUSES, ROUTES } from '../../constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

export function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('createdAt:desc');

  // Feedback banner
  const [feedback, setFeedback] = useState(null);

  const fetchOrders = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await orderService.getOrders({
          page,
          limit: 10,
          search: appliedSearch,
          status: statusFilter,
          paymentStatus: paymentStatusFilter,
          startDate,
          endDate,
          sort,
        });

        setOrders(data.orders || []);
        setMeta(data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load orders.');
      } finally {
        setIsLoading(false);
      }
    },
    [appliedSearch, statusFilter, paymentStatusFilter, startDate, endDate, sort]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
  };

  const handleClearFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSort('createdAt:desc');
  };

  const hasActiveFilters = Boolean(
    appliedSearch ||
      statusFilter !== 'all' ||
      paymentStatusFilter !== 'all' ||
      startDate ||
      endDate ||
      sort !== 'createdAt:desc'
  );

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

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
              Order Management
            </h1>
            {!isLoading && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                {meta.total} {meta.total === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500">
            Track customer orders, manage fulfillment stages, assign courier tracking, and update status workflows.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(meta.page)}
            isLoading={isLoading}
            icon={RefreshCw}
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
            aria-label="Dismiss feedback"
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
            onClick={() => fetchOrders(meta.page)}
            className="underline font-semibold hover:text-red-900 ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-lg border border-stone-200 p-4 shadow-xs space-y-3">
        {/* Order Lifecycle Status Tabs */}
        <div className="flex items-center space-x-1 border-b border-stone-100 pb-3 overflow-x-auto text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            All Orders
          </button>
          {ORDER_STATUSES.map((statusKey) => {
            const label = statusKey.replace(/_/g, ' ');
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => setStatusFilter(statusKey)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors whitespace-nowrap ${
                  statusFilter === statusKey
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {label.toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer name, email, phone..."
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

          {/* Payment Status Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              aria-label="Filter by payment status"
            >
              <option value="all">All Payment Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Payment Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUND_PENDING">Refund Pending</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-4 flex items-center space-x-2">
            <div className="relative flex-1">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-stone-300 rounded-md bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                aria-label="Sort orders"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="pricing.totalAmount:desc">Amount: High to Low</option>
                <option value="pricing.totalAmount:asc">Amount: Low to High</option>
                <option value="orderNumber:asc">Order Number: A-Z</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center px-2.5 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors shrink-0"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Date Range Row */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3 text-xs text-stone-600">
          <div className="flex items-center space-x-1.5 font-medium text-stone-700">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span>Date Range:</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-stone-400">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                aria-label="Start Date"
              />
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-[11px] text-stone-400">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-stone-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                aria-label="End Date"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-brand-primary hover:underline font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-lg border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <LoadingIndicator message="Loading customer orders..." size="md" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-heading font-medium text-stone-900 mb-1">
              No orders found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No customer orders match the selected filters or search terms. Try loosening your criteria.'
                : 'No orders have been recorded in the system yet.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} icon={RotateCcw}>
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[11px] font-semibold tracking-wider select-none">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Order Number
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Contact
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Order Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Total Amount
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Order Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {orders.map((order) => {
                  const orderId = order.orderNumber || order.id || order._id;
                  const customerName = order.customerSnapshot?.name || 'Customer';
                  const customerEmail = order.customerSnapshot?.email || '—';
                  const customerPhone = order.customerSnapshot?.phone || '—';
                  const totalFormatted = formatCurrency(order.pricing?.totalAmount || 0);
                  const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

                  return (
                    <tr
                      key={order._id || order.id || order.orderNumber}
                      className="hover:bg-stone-50/70 transition-colors"
                    >
                      {/* Order Number */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Link
                          to={ROUTES.ORDERS_DETAIL.replace(':orderId', order.orderNumber || order.id || order._id)}
                          className="font-mono font-semibold text-stone-900 hover:text-brand-primary transition-colors flex items-center space-x-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>#{order.orderNumber}</span>
                        </Link>
                        <span className="text-[11px] text-stone-400 block mt-0.5">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-medium text-stone-900">{customerName}</span>
                        </div>
                      </td>

                      {/* Contact Info (Email & Phone) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="space-y-0.5 text-xs">
                          {customerEmail !== '—' && (
                            <a
                              href={`mailto:${customerEmail}`}
                              className="text-stone-600 hover:text-brand-primary flex items-center space-x-1 truncate max-w-[180px]"
                              title={customerEmail}
                            >
                              <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{customerEmail}</span>
                            </a>
                          )}
                          {customerPhone !== '—' && (
                            <a
                              href={`tel:${customerPhone}`}
                              className="text-stone-500 hover:text-stone-800 flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{customerPhone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-stone-500">
                        {formatDateTime(order.createdAt)}
                      </td>

                      {/* Total Amount (Indian Currency) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-heading font-semibold text-stone-900 text-sm">
                          {totalFormatted}
                        </span>
                        <span className="text-[10px] text-stone-400 uppercase block tracking-wider">
                          {order.payment?.method || 'COD'}
                        </span>
                      </td>

                      {/* Payment Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <PaymentStatusBadge status={order.payment?.status || 'PENDING'} />
                      </td>

                      {/* Order Status Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <OrderStatusBadge status={order.status || 'PENDING'} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={ROUTES.ORDERS_DETAIL.replace(':orderId', orderId)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-brand-primary hover:text-white transition-colors shadow-2xs"
                          title="View Order Details & Fulfillment"
                          aria-label={`View order ${order.orderNumber}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
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
              of <span className="font-semibold text-stone-900">{meta.total}</span> orders
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fetchOrders(meta.page - 1)}
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
                onClick={() => fetchOrders(meta.page + 1)}
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
    </div>
  );
}

export default OrdersListPage;

