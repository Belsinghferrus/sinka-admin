import apiClient from '../lib/api.js';

/**
 * Service boundary for Sinka Administrative Promotional Offer Management.
 * Integrates with dedicated backend endpoints under /api/admin/offers.
 *
 * All requests automatically attach the Authorization: Bearer <FIREBASE_ID_TOKEN>
 * header via the centralized apiClient interceptor.
 */

export const offerService = {
  /**
   * List all promotional offers with pagination and status filtering.
   *
   * @param {object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.status='all'] - 'all' | 'active' | 'inactive'
   * @returns {Promise<{ offers: Array, meta: { total: number, page: number, limit: number, totalPages: number } }>}
   */
  async getOffers({ page = 1, limit = 20, status = 'all' } = {}) {
    const response = await apiClient.get('/admin/offers', {
      params: { page, limit, status },
    });

    return {
      offers: response.data?.data?.offers || [],
      meta: response.data?.meta || { total: 0, page: 1, limit, totalPages: 1 },
    };
  },

  /**
   * Retrieve a single promotional offer by its unique ID.
   *
   * @param {string} id - 24-character hex ObjectId string
   * @returns {Promise<object>} The offer object
   */
  async getOfferById(id) {
    if (!id) throw new Error('Offer ID is required.');
    const response = await apiClient.get(`/admin/offers/${id}`);
    return response.data?.data?.offer || null;
  },

  /**
   * Create a new promotional offer.
   *
   * @param {object} offerData - Creation payload matching createOfferSchema
   * @returns {Promise<object>} The created offer object
   */
  async createOffer(offerData) {
    const response = await apiClient.post('/admin/offers', offerData);
    return response.data?.data?.offer;
  },

  /**
   * Update an existing promotional offer (PUT).
   *
   * @param {string} id - Offer ID
   * @param {object} updateData - Updated fields matching updateOfferSchema
   * @returns {Promise<object>} The updated offer object
   */
  async updateOffer(id, updateData) {
    if (!id) throw new Error('Offer ID is required.');
    const response = await apiClient.put(`/admin/offers/${id}`, updateData);
    return response.data?.data?.offer;
  },

  /**
   * Partially update an existing promotional offer (PATCH).
   *
   * @param {string} id - Offer ID
   * @param {object} updateData - Partial fields
   * @returns {Promise<object>} The updated offer object
   */
  async patchOffer(id, updateData) {
    if (!id) throw new Error('Offer ID is required.');
    const response = await apiClient.patch(`/admin/offers/${id}`, updateData);
    return response.data?.data?.offer;
  },

  /**
   * Activate or deactivate a promotional offer.
   *
   * @param {string} id - Offer ID
   * @param {boolean} isActive - Desired active state
   * @returns {Promise<object>} The updated offer object
   */
  async setOfferStatus(id, isActive) {
    if (!id) throw new Error('Offer ID is required.');
    const response = await apiClient.patch(`/admin/offers/${id}/status`, { isActive });
    return response.data?.data?.offer;
  },

  /**
   * Permanently delete a promotional offer.
   *
   * @param {string} id - Offer ID
   * @returns {Promise<{ id: string, deleted: boolean }>}
   */
  async deleteOffer(id) {
    if (!id) throw new Error('Offer ID is required.');
    const response = await apiClient.delete(`/admin/offers/${id}`);
    return response.data?.data;
  },

  /**
   * Preview the single winning active promotional offer currently served to customers.
   *
   * @returns {Promise<object|null>} The active offer object or null if none eligible
   */
  async getActiveOffer() {
    const response = await apiClient.get('/admin/offers/active');
    return response.data?.data || null;
  },
};

export default offerService;
