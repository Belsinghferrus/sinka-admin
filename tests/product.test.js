import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { productService } from '../src/services/product.service.js';
import {
  PRODUCT_CATEGORIES,
  MAX_PRODUCT_IMAGES_PER_REQUEST,
  MAX_PRODUCT_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from '../src/constants.js';
import apiClient from '../src/lib/api.js';

describe('Product Service & Constants Unit Tests', () => {
  let originalGet, originalPost, originalPatch, originalDelete;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPost = apiClient.post;
    originalPatch = apiClient.patch;
    originalDelete = apiClient.delete;
  });

  afterEach(() => {
    apiClient.get = originalGet;
    apiClient.post = originalPost;
    apiClient.patch = originalPatch;
    apiClient.delete = originalDelete;
  });

  test('PRODUCT_CATEGORIES matches all 10 canonical Sinka categories', () => {
    assert.equal(PRODUCT_CATEGORIES.length, 10);
    const values = PRODUCT_CATEGORIES.map((c) => c.value);
    const expected = [
      'sofas',
      'beds',
      'mattresses',
      'dining',
      'tv-units',
      'sofa-cum-beds',
      'coffee-tables',
      'study-tables',
      'wardrobes',
      'cabinets-sideboards',
    ];
    assert.deepEqual(values, expected);
  });

  test('Cloudflare R2 upload constraints match backend limits', () => {
    assert.equal(MAX_PRODUCT_IMAGES_PER_REQUEST, 10);
    assert.equal(MAX_PRODUCT_IMAGE_SIZE_BYTES, 8 * 1024 * 1024);
    assert.deepEqual(ALLOWED_IMAGE_TYPES, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ]);
  });

  test('productService.getProducts passes search, category, and status query parameters', async () => {
    let capturedUrl = '';
    let capturedConfig = null;

    apiClient.get = async (url, config) => {
      capturedUrl = url;
      capturedConfig = config;
      return {
        data: {
          success: true,
          data: {
            products: [{ id: 'prod_1', name: 'Teak Coffee Table', price: 15999 }],
          },
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      };
    };

    const result = await productService.getProducts({
      page: 2,
      limit: 10,
      search: 'Teak',
      category: 'coffee-tables',
      isActive: 'true',
      isFeatured: 'all',
      sort: 'price:asc',
    });

    assert.equal(capturedUrl, '/admin/products');
    assert.equal(capturedConfig.params.page, 2);
    assert.equal(capturedConfig.params.limit, 10);
    assert.equal(capturedConfig.params.search, 'Teak');
    assert.equal(capturedConfig.params.category, 'coffee-tables');
    assert.equal(capturedConfig.params.isActive, 'true');
    assert.equal(capturedConfig.params.isFeatured, undefined); // 'all' is omitted
    assert.equal(capturedConfig.params.sort, 'price:asc');

    assert.equal(result.products.length, 1);
    assert.equal(result.meta.total, 1);
  });

  test('productService.getProductById fetches single product by ID', async () => {
    let capturedUrl = '';

    apiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: {
            product: { id: 'prod_123', name: 'King Bed' },
          },
        },
      };
    };

    const product = await productService.getProductById('prod_123');
    assert.equal(capturedUrl, '/admin/products/prod_123');
    assert.equal(product.name, 'King Bed');
  });

  test('productService.createProduct posts payload to /admin/products', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.post = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            product: { id: 'new_prod', ...body },
          },
        },
      };
    };

    const payload = {
      name: 'Artisan Study Table',
      category: 'study-tables',
      price: 18500,
      stock: 5,
      images: [{ url: 'https://cdn.example.com/products/img1.webp', key: 'products/img1.webp', alt: '' }],
    };

    const created = await productService.createProduct(payload);
    assert.equal(capturedUrl, '/admin/products');
    assert.equal(capturedBody.name, 'Artisan Study Table');
    assert.equal(created.id, 'new_prod');
  });

  test('productService.updateProduct patches product by ID', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.patch = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            product: { id: 'prod_456', ...body },
          },
        },
      };
    };

    const updated = await productService.updateProduct('prod_456', { price: 19999 });
    assert.equal(capturedUrl, '/admin/products/prod_456');
    assert.equal(capturedBody.price, 19999);
    assert.equal(updated.price, 19999);
  });

  test('productService.deleteProduct deletes product by ID', async () => {
    let capturedUrl = '';

    apiClient.delete = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: {
            product: { id: 'prod_456', deleted: true },
          },
        },
      };
    };

    const res = await productService.deleteProduct('prod_456');
    assert.equal(capturedUrl, '/admin/products/prod_456');
    assert.equal(res.deleted, true);
  });

  test('productService.uploadImages rejects empty file array', async () => {
    await assert.rejects(
      async () => {
        await productService.uploadImages([]);
      },
      {
        message: 'At least one image file is required for upload.',
      }
    );
  });
});

