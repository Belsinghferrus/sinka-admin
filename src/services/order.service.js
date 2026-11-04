import apiClient from '../lib/api.js';

/**
 * Service boundary for Sinka Administrative Order Management.
 * Integrates with dedicated backend endpoints under /api/admin/orders.
 *
 * All requests automatically attach the Authorization: Bearer <ADMIN_JWT>
 * header via the centralized apiClient interceptor.
 */

export const orderService = {
  /**
   * List orders with pagination, search, status, payment status, and date range filters.
   *
   * @param {object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search='']
   * @param {string} [params.status='all']
   * @param {string} [params.paymentStatus='all']
   * @param {string} [params.startDate='']
   * @param {string} [params.endDate='']
   * @param {string} [params.sort='createdAt:desc']
   * @returns {Promise<{ orders: Array, meta: { total: number, page: number, limit: number, totalPages: number } }>}
   */
  async getOrders({
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    paymentStatus = 'all',
    startDate = '',
    endDate = '',
    sort = 'createdAt:desc',
  } = {}) {
    const query = { page, limit, sort };
    if (search && search.trim()) query.search = search.trim();
    if (status && status !== 'all') query.status = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;
    if (startDate && startDate.trim()) query.startDate = startDate.trim();
    if (endDate && endDate.trim()) query.endDate = endDate.trim();

    const response = await apiClient.get('/admin/orders', { params: query });

    const orders = response.data?.data?.orders || [];
    const meta =
      response.data?.meta ||
      response.data?.data?.pagination || {
        total: orders.length,
        page,
        limit,
        totalPages: Math.ceil(orders.length / limit) || 1,
      };

    return { orders, meta };
  },

  /**
   * Retrieve a single order by its unique ID or orderNumber for inspection.
   *
   * @param {string} orderId - MongoDB ObjectId or orderNumber
   * @returns {Promise<object>} Full order document
   */
  async getOrderById(orderId) {
    if (!orderId) throw new Error('Order ID is required.');
    const response = await apiClient.get(`/admin/orders/${orderId}`);
    return response.data?.data?.order || null;
  },

  /**
   * Transition order lifecycle status with administrative note and backend validation.
   *
   * @param {string} orderId - MongoDB ObjectId or orderNumber
   * @param {object} payload
   * @param {string} payload.status - Proposed target status
   * @param {string} [payload.note=''] - Optional note for status history
   * @returns {Promise<object>} Updated order document
   */
  async updateOrderStatus(orderId, { status, note = '' }) {
    if (!orderId) throw new Error('Order ID is required.');
    if (!status) throw new Error('Target status is required.');

    const response = await apiClient.patch(`/admin/orders/${orderId}/status`, {
      status,
      note: note ? note.trim() : '',
    });

    return response.data?.data?.order || null;
  },

  /**
   * Assign or update courier tracking details.
   * Automatically advances order to SHIPPED if currently in an earlier processing state.
   *
   * @param {string} orderId
   * @param {object} trackingData
   * @param {string} trackingData.courierName
   * @param {string} trackingData.trackingId
   * @param {string} [trackingData.trackingUrl]
   * @param {Date|string} [trackingData.shipmentDate]
   * @param {string} [trackingData.shippingNote]
   * @returns {Promise<object>} Updated order document
   */
  async updateOrderTracking(orderId, trackingData) {
    if (!orderId) throw new Error('Order ID is required.');
    if (!trackingData?.courierName?.trim()) throw new Error('Courier name is required.');
    if (!trackingData?.trackingId?.trim()) throw new Error('Tracking ID / AWB is required.');

    const payload = {
      courierName: trackingData.courierName.trim(),
      trackingId: trackingData.trackingId.trim(),
      trackingUrl: trackingData.trackingUrl ? trackingData.trackingUrl.trim() : '',
      shipmentDate: trackingData.shipmentDate || new Date().toISOString(),
      shippingNote: trackingData.shippingNote ? trackingData.shippingNote.trim() : '',
    };

    const response = await apiClient.patch(`/admin/orders/${orderId}/tracking`, payload);
    return response.data?.data?.order || null;
  },

  /**
   * Append an internal administrative note to an order.
   *
   * @param {string} orderId
   * @param {object} payload
   * @param {string} payload.note
   * @returns {Promise<object>} Updated order document
   */
  async addAdminNote(orderId, { note }) {
    if (!orderId) throw new Error('Order ID is required.');
    if (!note || !note.trim()) throw new Error('Admin note cannot be empty.');

    const response = await apiClient.patch(`/admin/orders/${orderId}/admin-note`, {
      note: note.trim(),
    });

    return response.data?.data?.order || null;
  },
};

export default orderService;

