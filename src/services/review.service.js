import apiClient from '../lib/api.js';

/**
 * Service boundary for Sinka Administrative Review Management.
 * Integrates with dedicated backend endpoints under /api/admin/reviews.
 *
 * All requests automatically attach the Authorization: Bearer <ADMIN_JWT>
 * header via the centralized apiClient interceptor.
 */

export const reviewService = {
  /**
   * List reviews with server-side pagination, search, status, and rating filters.
   *
   * @param {object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search=''] - Multi-field search across customer, product, title, content
   * @param {string} [params.status='all'] - 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'
   * @param {string|number} [params.rating='all'] - 'all' | 1 | 2 | 3 | 4 | 5
   * @param {string} [params.productId] - Optional product filter
   * @param {string} [params.sort='createdAt:desc']
   * @returns {Promise<{ reviews: Array, meta: { total: number, page: number, limit: number, totalPages: number }, counts?: object }>}
   */
  async getReviews({
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    rating = 'all',
    productId = '',
    sort = 'createdAt:desc',
  } = {}) {
    const query = { page, limit, sort };
    if (search && search.trim()) query.search = search.trim();
    if (status && status !== 'all') query.status = status;
    if (rating && rating !== 'all') query.rating = rating;
    if (productId && productId.trim()) query.productId = productId.trim();

    const response = await apiClient.get('/admin/reviews', { params: query });

    const data = response.data?.data;
    const reviews = Array.isArray(data?.reviews)
      ? data.reviews
      : Array.isArray(response.data?.reviews)
      ? response.data.reviews
      : Array.isArray(data)
      ? data
      : [];

    const meta =
      response.data?.meta ||
      data?.pagination ||
      response.data?.pagination || {
        total: reviews.length,
        page,
        limit,
        totalPages: Math.ceil(reviews.length / limit) || 1,
      };

    const counts = data?.counts || response.data?.counts || null;

    return { reviews, meta, counts };
  },

  /**
   * Retrieve a single review by its unique ID for detailed inspection.
   *
   * @param {string} reviewId - MongoDB ObjectId string
   * @returns {Promise<object>} Full review document
   */
  async getReviewById(reviewId) {
    if (!reviewId) throw new Error('Review ID is required.');
    const response = await apiClient.get(`/admin/reviews/${reviewId}`);
    return response.data?.data?.review || response.data?.data || response.data?.review || null;
  },

  /**
   * Approve a customer review (transitions to APPROVED).
   * Makes the review eligible for public storefront display.
   *
   * @param {string} reviewId - MongoDB ObjectId string
   * @returns {Promise<object>} Updated review document
   */
  async approveReview(reviewId) {
    if (!reviewId) throw new Error('Review ID is required.');

    try {
      const response = await apiClient.patch(`/admin/reviews/${reviewId}/approve`);
      return response.data?.data?.review || response.data?.data || response.data;
    } catch (err) {
      // Fallback to generic status endpoint if dedicated action route is not mounted
      if (err.response?.status === 404 || err.response?.status === 405) {
        const fallback = await apiClient.patch(`/admin/reviews/${reviewId}/status`, {
          status: 'APPROVED',
        });
        return fallback.data?.data?.review || fallback.data?.data || fallback.data;
      }
      throw err;
    }
  },

  /**
   * Reject a customer review (transitions to REJECTED).
   * Ensures the review remains completely hidden from public display.
   *
   * @param {string} reviewId - MongoDB ObjectId string
   * @param {string} [reason=''] - Optional moderation rejection reason
   * @returns {Promise<object>} Updated review document
   */
  async rejectReview(reviewId, reason = '') {
    if (!reviewId) throw new Error('Review ID is required.');

    const payload = reason && reason.trim() ? { reason: reason.trim() } : {};

    try {
      const response = await apiClient.patch(`/admin/reviews/${reviewId}/reject`, payload);
      return response.data?.data?.review || response.data?.data || response.data;
    } catch (err) {
      // Fallback to generic status endpoint if dedicated action route is not mounted
      if (err.response?.status === 404 || err.response?.status === 405) {
        const fallback = await apiClient.patch(`/admin/reviews/${reviewId}/status`, {
          status: 'REJECTED',
          ...payload,
        });
        return fallback.data?.data?.review || fallback.data?.data || fallback.data;
      }
      throw err;
    }
  },

  /**
   * Transition review status directly.
   *
   * @param {string} reviewId - MongoDB ObjectId string
   * @param {'PENDING'|'APPROVED'|'REJECTED'} status
   * @param {string} [reason='']
   * @returns {Promise<object>}
   */
  async updateReviewStatus(reviewId, status, reason = '') {
    if (!reviewId) throw new Error('Review ID is required.');
    if (!status) throw new Error('Review status is required.');

    const payload = {
      status: status.toUpperCase(),
      ...(reason && reason.trim() ? { reason: reason.trim() } : {}),
    };

    const response = await apiClient.patch(`/admin/reviews/${reviewId}/status`, payload);
    return response.data?.data?.review || response.data?.data || response.data;
  },

  /**
   * Permanently delete a review if supported by backend moderation policies.
   *
   * @param {string} reviewId - MongoDB ObjectId string
   * @returns {Promise<object>}
   */
  async deleteReview(reviewId) {
    if (!reviewId) throw new Error('Review ID is required.');
    const response = await apiClient.delete(`/admin/reviews/${reviewId}`);
    return response.data?.data || response.data;
  },
};

export default reviewService;
