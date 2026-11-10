import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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

  test('ProductFormPage implements compact two-column CMS workspace with sticky storefront preview', () => {
    const productFormPath = path.resolve('src/pages/products/ProductFormPage.jsx');
    const content = fs.readFileSync(productFormPath, 'utf8');

    // 1. Two-column responsive grid layout: Left 70-75%, Right 25-30%
    assert.match(content, /grid-cols-1\s+lg:grid-cols-\[minmax\(0,1fr\)_340px\]\s+xl:grid-cols-\[minmax\(0,1fr\)_360px\]/);

    // 2. Right sidebar is sticky on desktop
    assert.match(content, /lg:sticky\s+lg:top-4/);

    // 3. Compact section cards for General Information, Pricing & Inventory, Product Images
    assert.match(content, /General Information/);
    assert.match(content, /Pricing &amp; Inventory/);
    assert.match(content, /Product Images/);

    // 4. Compact storefront live preview with category, pricing, discount, and Add to Cart
    assert.match(content, /Storefront Preview/);
    assert.match(content, /Add to Cart/);

    // 5. Catalogue visibility card with Active Status and Featured Product toggles
    assert.match(content, /Catalogue Visibility/);
    assert.match(content, /Active Status/);
    assert.match(content, /Featured Product/);

    // 6. Primary and secondary action buttons in header and sidebar
    assert.match(content, /Publish Product/);
  });

  test('ProductImageUploader implements compact gallery with primary cover and inline add tile', () => {
    const uploaderPath = path.resolve('src/components/products/ProductImageUploader.jsx');
    const content = fs.readFileSync(uploaderPath, 'utf8');

    // Primary cover indicator
    assert.match(content, /PRIMARY/);

    // Inline add tile
    assert.match(content, /Add More/);

    // Alt description field
    assert.match(content, /Alt description\.\.\./);

    // In-place replace capability
    assert.match(content, /handleTriggerReplace/);
    assert.match(content, /Replace image/);

    // High-resolution lightbox preview modal
    assert.match(content, /setPreviewIndex/);
    assert.match(content, /Preview high-res image/);
  });

  test('ProductFormPage supports comprehensive product specifications', () => {
    const productFormPath = path.resolve('src/pages/products/ProductFormPage.jsx');
    const content = fs.readFileSync(productFormPath, 'utf8');

    // Section title
    assert.match(content, /Product Details &amp; Specifications/);

    // Short description
    assert.match(content, /Short Description \/ Summary/);

    // Craftsmanship specifications fields
    assert.match(content, /Primary Material/);
    assert.match(content, /Color \/ Shade/);
    assert.match(content, /Finish \/ Texture/);
    assert.match(content, /Dimensions \(L x W x H\)/);
    assert.match(content, /Product Weight/);
    assert.match(content, /Assembly Information/);
    assert.match(content, /Warranty Period &amp; Coverage/);
    assert.match(content, /Return \/ Replacement Policy/);
    assert.match(content, /Care &amp; Maintenance Instructions/);

    // Structured specifications object construction
    assert.match(content, /specifications:\s*specs/);
  });

  test('ProductFormPage supports rich variant management with zero variant: null invariant', () => {
    const productFormPath = path.resolve('src/pages/products/ProductFormPage.jsx');
    const content = fs.readFileSync(productFormPath, 'utf8');

    // Variant Master Toggle
    assert.match(content, /Product has Multiple Variants/);

    // Variant action handlers: Add, Duplicate, Remove, Change
    assert.match(content, /handleAddVariant/);
    assert.match(content, /handleDuplicateVariant/);
    assert.match(content, /handleRemoveVariant/);
    assert.match(content, /handleVariantChange/);

    // Variant attributes & fields
    assert.match(content, /Variant Title/);
    assert.match(content, /Variant SKU/);
    assert.match(content, /Stock Units/);
    assert.match(content, /MRP \/ Original/);
    assert.match(content, /Variant Image:/);

    // Invariant: Never send variant: null (always array)
    assert.doesNotMatch(content, /variant:\s*null/);
    assert.match(content, /variants:\s*formData\.hasVariants/);

    // Duplicate variant name validation
    assert.match(content, /Variant name must be unique/);
  });

  test('ProductFormPage provides dual-mode live storefront preview (Card View and Detailed Customer PDP)', () => {
    const productFormPath = path.resolve('src/pages/products/ProductFormPage.jsx');
    const content = fs.readFileSync(productFormPath, 'utf8');

    // Dual mode buttons
    assert.match(content, /Detail PDP/);
    assert.match(content, /Card/);

    // Interactive PDP elements
    assert.match(content, /Available Configurations:/);
    assert.match(content, /Quick Specifications:/);
    assert.match(content, /previewSelectedVariant/);
  });

  test('ProductDetailModal renders structured specifications grid and variants table', () => {
    const modalPath = path.resolve('src/components/products/ProductDetailModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    // Specifications section
    assert.match(content, /Product Specifications &amp; Craftsmanship/);
    assert.match(content, /Material/);
    assert.match(content, /Dimensions/);
    assert.match(content, /Warranty/);
    assert.match(content, /Care Instructions/);

    // Variants table
    assert.match(content, /Product Variants/);
  });
});

