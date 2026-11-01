import apiClient from '../lib/api.js';

/**
 * Service boundary for Sinka Administrative Product Management and Cloudflare R2 Uploads.
 * Integrates with dedicated backend endpoints under /api/admin/products and /api/admin/upload.
 *
 * All requests automatically attach the Authorization: Bearer <ADMIN_JWT>
 * header via the centralized apiClient interceptor.
 */

export const productService = {
  /**
   * List all products with pagination, search, category, and status filters.
   *
   * @param {object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search='']
   * @param {string} [params.category='']
   * @param {string} [params.isActive='all'] - 'all' | 'true' | 'false'
   * @param {string} [params.isFeatured='all'] - 'all' | 'true' | 'false'
   * @param {string} [params.sort='createdAt:desc']
   * @returns {Promise<{ products: Array, meta: { total: number, page: number, limit: number, totalPages: number } }>}
   */
  async getProducts({
    page = 1,
    limit = 10,
    search = '',
    category = '',
    isActive = 'all',
    isFeatured = 'all',
    sort = 'createdAt:desc',
  } = {}) {
    const query = { page, limit, sort };
    if (search && search.trim()) query.search = search.trim();
    if (category && category !== 'all') query.category = category;
    if (isActive && isActive !== 'all') query.isActive = isActive;
    if (isFeatured && isFeatured !== 'all') query.isFeatured = isFeatured;

    const response = await apiClient.get('/admin/products', { params: query });

    return {
      products: response.data?.data?.products || [],
      meta: response.data?.meta || { total: 0, page: 1, limit, totalPages: 1 },
    };
  },

  /**
   * Retrieve a single product by its unique ID for editing.
   *
   * @param {string} id - 24-character hex ObjectId string
   * @returns {Promise<object>} The product object
   */
  async getProductById(id) {
    if (!id) throw new Error('Product ID is required.');
    const response = await apiClient.get(`/admin/products/${id}`);
    return response.data?.data?.product || null;
  },

  /**
   * Create a new product.
   *
   * @param {object} productData - Creation payload matching createProductSchema
   * @returns {Promise<object>} The created product object
   */
  async createProduct(productData) {
    const response = await apiClient.post('/admin/products', productData);
    return response.data?.data?.product;
  },

  /**
   * Update an existing product.
   *
   * @param {string} id - Product ID
   * @param {object} updateData - Updated fields matching updateProductSchema
   * @returns {Promise<object>} The updated product object
   */
  async updateProduct(id, updateData) {
    if (!id) throw new Error('Product ID is required.');
    const response = await apiClient.patch(`/admin/products/${id}`, updateData);
    return response.data?.data?.product;
  },

  /**
   * Safely delete a product and clean up unreferenced R2 images.
   *
   * @param {string} id - Product ID
   * @returns {Promise<object>}
   */
  async deleteProduct(id) {
    if (!id) throw new Error('Product ID is required.');
    const response = await apiClient.delete(`/admin/products/${id}`);
    return response.data?.data?.product;
  },

  /**
   * Upload multiple images to Cloudflare R2 object storage via backend endpoint.
   * Sends multipart/form-data with field name 'images'.
   * Never sets multipart Content-Type header manually to allow browser to generate boundary.
   *
   * @param {File[]} files - Array of File objects (max 10, max 8 MB each)
   * @param {Function} [onProgress] - Optional upload progress callback (percentage: number) => void
   * @returns {Promise<Array<{ key: string, url: string, contentType: string, size: number, originalName: string }>>}
   */
  async uploadImages(files, onProgress) {
    if (!files || !files.length) {
      throw new Error('At least one image file is required for upload.');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await apiClient.post('/admin/upload/products', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data?.data?.images || [];
  },

  /**
   * Safely delete an unassigned image from Cloudflare R2 storage by its key.
   *
   * @param {string} key - R2 object key under products/
   * @returns {Promise<object>}
   */
  async deleteR2Image(key) {
    if (!key) throw new Error('Image key is required for deletion.');
    const response = await apiClient.delete('/admin/upload/products', {
      data: { key },
    });
    return response.data?.data;
  },
};

export default productService;

