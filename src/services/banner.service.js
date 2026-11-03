import apiClient from '../lib/api.js';

/**
 * Service boundary for Sinka Administrative Homepage Banner Management.
 * Integrates with dedicated backend endpoints under /api/admin/banners and /api/admin/upload/banners.
 *
 * All requests automatically attach the Authorization: Bearer <ADMIN_JWT>
 * header via the centralized apiClient interceptor.
 */

export const bannerService = {
  /**
   * List all homepage hero banners with pagination, search, and status filters.
   *
   * @param {object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search='']
   * @param {string} [params.isActive='all'] - 'all' | 'true' | 'false'
   * @param {string} [params.sort='sortOrder:asc']
   * @returns {Promise<{ banners: Array, meta: { total: number, page: number, limit: number, totalPages: number } }>}
   */
  async getBanners({
    page = 1,
    limit = 10,
    search = '',
    isActive = 'all',
    sort = 'sortOrder:asc',
  } = {}) {
    const query = { page, limit, sort };
    if (search && search.trim()) query.search = search.trim();
    if (isActive && isActive !== 'all') query.isActive = isActive;

    const response = await apiClient.get('/admin/banners', { params: query });

    const banners = response.data?.data?.banners || [];
    const meta = response.data?.meta ||
      response.data?.data?.pagination || {
        total: banners.length,
        page,
        limit,
        totalPages: Math.ceil(banners.length / limit) || 1,
      };

    return { banners, meta };
  },

  /**
   * Retrieve a single banner by its unique ID for editing.
   *
   * @param {string} id - 24-character hex ObjectId string
   * @returns {Promise<object>} The banner object
   */
  async getBannerById(id) {
    if (!id) throw new Error('Banner ID is required.');
    const response = await apiClient.get(`/admin/banners/${id}`);
    return response.data?.data?.banner || null;
  },

  /**
   * Create a new homepage hero banner.
   *
   * @param {object} bannerData - Creation payload matching createBannerSchema
   * @returns {Promise<object>} The created banner object
   */
  async createBanner(bannerData) {
    const response = await apiClient.post('/admin/banners', bannerData);
    return response.data?.data?.banner;
  },

  /**
   * Update an existing homepage hero banner.
   *
   * @param {string} id - Banner ID
   * @param {object} updateData - Updated fields matching updateBannerSchema
   * @returns {Promise<object>} The updated banner object
   */
  async updateBanner(id, updateData) {
    if (!id) throw new Error('Banner ID is required.');
    const response = await apiClient.patch(`/admin/banners/${id}`, updateData);
    return response.data?.data?.banner;
  },

  /**
   * Bulk update display sortOrder sequence for banners.
   *
   * @param {Array<{ id: string, sortOrder: number }>} bannerOrders - Array of { id, sortOrder }
   * @returns {Promise<object>} Updated count result
   */
  async reorderBanners(bannerOrders) {
    if (!Array.isArray(bannerOrders) || bannerOrders.length === 0) {
      throw new Error('At least one banner order item is required for reordering.');
    }
    const response = await apiClient.patch('/admin/banners/reorder', { bannerOrders });
    return response.data?.data;
  },

  /**
   * Safely delete a homepage hero banner and clean up unreferenced R2 image.
   *
   * @param {string} id - Banner ID
   * @returns {Promise<object>} The deletion confirmation data
   */
  async deleteBanner(id) {
    if (!id) throw new Error('Banner ID is required.');
    const response = await apiClient.delete(`/admin/banners/${id}`);
    return response.data?.data;
  },

  /**
   * Upload a homepage hero banner image to Cloudflare R2 via backend endpoint.
   * Sends multipart/form-data with field name 'image'.
   * Never sets multipart Content-Type header manually to allow browser to generate boundary.
   *
   * @param {File} file - File object (max 8 MB, JPEG/PNG/WebP/AVIF)
   * @param {Function} [onProgress] - Optional upload progress callback (percentage: number) => void
   * @returns {Promise<{ key: string, url: string, contentType: string, size: number, originalName: string }>}
   */
  async uploadBannerImage(file, onProgress) {
    if (!file) {
      throw new Error('A banner image file is required for upload.');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/admin/upload/banners', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data?.data;
  },

  /**
   * Safely delete an uncommitted/cancelled banner image from Cloudflare R2 storage by its key.
   *
   * @param {string} key - R2 object key under banners/
   * @returns {Promise<object>}
   */
  async deleteUploadedImage(key) {
    if (!key) throw new Error('Image key is required for deletion.');
    const response = await apiClient.delete('/admin/upload/banners', {
      data: { key },
    });
    return response.data?.data;
  },
};

export default bannerService;

