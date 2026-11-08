import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { bannerService } from '../src/services/banner.service.js';
import {
  MAX_BANNER_IMAGE_SIZE_BYTES,
  ALLOWED_BANNER_IMAGE_TYPES,
  ALLOWED_BANNER_IMAGE_EXTENSIONS,
  ROUTES,
} from '../src/constants.js';
import apiClient from '../src/lib/api.js';

describe('Homepage Hero Banner Service & Cloudflare R2 Upload Tests', () => {
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

  test('Homepage banner constants enforce 8 MB limit, allowed MIME types, and routes', () => {
    assert.equal(MAX_BANNER_IMAGE_SIZE_BYTES, 8 * 1024 * 1024);
    assert.deepEqual(ALLOWED_BANNER_IMAGE_TYPES, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ]);
    assert.deepEqual(ALLOWED_BANNER_IMAGE_EXTENSIONS, [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.avif',
    ]);
    assert.equal(ROUTES.BANNERS, '/banners');
    assert.equal(ROUTES.BANNERS_NEW, '/banners/new');
    assert.equal(ROUTES.BANNERS_EDIT, '/banners/:id/edit');
  });

  test('bannerService.getBanners calls GET /admin/banners with query parameters', async () => {
    let capturedUrl = '';
    let capturedConfig = null;

    apiClient.get = async (url, config) => {
      capturedUrl = url;
      capturedConfig = config;
      return {
        data: {
          success: true,
          data: {
            banners: [
              {
                id: 'banner_1',
                title: 'Handcrafted Solid Teak Living Essentials',
                eyebrow: 'Sinka Living Edit',
                sortOrder: 0,
                isActive: true,
              },
            ],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
          },
        },
      };
    };

    const result = await bannerService.getBanners({
      page: 1,
      limit: 10,
      search: 'Teak',
      isActive: 'true',
      sort: 'sortOrder:asc',
    });

    assert.equal(capturedUrl, '/admin/banners');
    assert.deepEqual(capturedConfig.params, {
      page: 1,
      limit: 10,
      sort: 'sortOrder:asc',
      search: 'Teak',
      isActive: 'true',
    });
    assert.equal(result.banners.length, 1);
    assert.equal(result.banners[0].title, 'Handcrafted Solid Teak Living Essentials');
    assert.equal(result.meta.total, 1);
  });

  test('bannerService.getBannerById fetches single banner by ID', async () => {
    let capturedUrl = '';

    apiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: {
            banner: {
              id: 'banner_abc',
              title: 'Festive Season Grand Sale',
              sortOrder: 1,
            },
          },
        },
      };
    };

    const banner = await bannerService.getBannerById('banner_abc');
    assert.equal(capturedUrl, '/admin/banners/banner_abc');
    assert.equal(banner.title, 'Festive Season Grand Sale');

    await assert.rejects(async () => {
      await bannerService.getBannerById('');
    }, { message: 'Banner ID is required.' });
  });

  test('bannerService.createBanner posts payload to /admin/banners', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.post = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            banner: { id: 'banner_new', ...body },
          },
        },
      };
    };

    const payload = {
      title: 'Monsoon Sanctuary',
      subtitle: 'Waterproof outdoor teak',
      eyebrow: 'Outdoor Edit',
      image: 'https://pub-r2.dev/banners/monsoon.webp',
      imageKey: 'banners/monsoon.webp',
      sortOrder: 2,
      isActive: true,
    };

    const created = await bannerService.createBanner(payload);
    assert.equal(capturedUrl, '/admin/banners');
    assert.deepEqual(capturedBody, payload);
    assert.equal(created.id, 'banner_new');
    assert.equal(created.title, 'Monsoon Sanctuary');
  });

  test('bannerService.createBanner supports image-only banner with empty title and text', async () => {
    let capturedBody = null;

    apiClient.post = async (url, body) => {
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            banner: { id: 'banner_img_only', ...body },
          },
        },
      };
    };

    const payload = {
      image: 'https://pub-r2.dev/banners/art.webp',
      imageKey: 'banners/art.webp',
      altText: 'Promotional Banner',
      title: '',
      subtitle: '',
      eyebrow: '',
      ctaText: '',
      ctaLink: '',
      sortOrder: 0,
      isActive: true,
      startDate: null,
      endDate: null,
    };

    const created = await bannerService.createBanner(payload);
    assert.deepEqual(capturedBody, payload);
    assert.equal(created.id, 'banner_img_only');
    assert.equal(created.title, '');
  });

  test('bannerService.createBanner supports headline-only banner without subtitle or CTA', async () => {
    let capturedBody = null;

    apiClient.post = async (url, body) => {
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            banner: { id: 'banner_headline', ...body },
          },
        },
      };
    };

    const payload = {
      image: 'https://pub-r2.dev/banners/wood.webp',
      imageKey: 'banners/wood.webp',
      altText: 'Solid Teak Sanctuary',
      title: 'Solid Teak Sanctuary',
      subtitle: '',
      eyebrow: '',
      ctaText: '',
      ctaLink: '',
      sortOrder: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    };

    const created = await bannerService.createBanner(payload);
    assert.deepEqual(capturedBody, payload);
    assert.equal(created.title, 'Solid Teak Sanctuary');
    assert.equal(created.subtitle, '');
    assert.equal(created.ctaText, '');
  });

  test('bannerService.updateBanner patches payload to /admin/banners/:id', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.patch = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            banner: { id: 'banner_123', ...body },
          },
        },
      };
    };

    const updated = await bannerService.updateBanner('banner_123', {
      title: 'Updated Headline',
      isActive: false,
    });

    assert.equal(capturedUrl, '/admin/banners/banner_123');
    assert.deepEqual(capturedBody, { title: 'Updated Headline', isActive: false });
    assert.equal(updated.title, 'Updated Headline');

    await assert.rejects(async () => {
      await bannerService.updateBanner('', {});
    }, { message: 'Banner ID is required.' });
  });

  test('bannerService.reorderBanners sends batch order sequence to /admin/banners/reorder', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.patch = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: { updatedCount: 2 },
        },
      };
    };

    const bannerOrders = [
      { id: 'b_1', sortOrder: 0 },
      { id: 'b_2', sortOrder: 1 },
    ];

    const result = await bannerService.reorderBanners(bannerOrders);
    assert.equal(capturedUrl, '/admin/banners/reorder');
    assert.deepEqual(capturedBody, { bannerOrders });
    assert.equal(result.updatedCount, 2);

    await assert.rejects(async () => {
      await bannerService.reorderBanners([]);
    }, { message: 'At least one banner order item is required for reordering.' });
  });

  test('bannerService.deleteBanner calls DELETE /admin/banners/:id', async () => {
    let capturedUrl = '';

    apiClient.delete = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: { deletedId: 'banner_del' },
        },
      };
    };

    const result = await bannerService.deleteBanner('banner_del');
    assert.equal(capturedUrl, '/admin/banners/banner_del');
    assert.equal(result.deletedId, 'banner_del');

    await assert.rejects(async () => {
      await bannerService.deleteBanner(null);
    }, { message: 'Banner ID is required.' });
  });

  test('bannerService.uploadBannerImage sends FormData to /admin/upload/banners with progress tracking', async () => {
    let capturedUrl = '';
    let capturedBody = null;
    let capturedConfig = null;

    apiClient.post = async (url, body, config) => {
      capturedUrl = url;
      capturedBody = body;
      capturedConfig = config;
      return {
        data: {
          success: true,
          data: {
            key: 'banners/1730650000000-hero.webp',
            url: 'https://pub-r2.dev/banners/1730650000000-hero.webp',
            contentType: 'image/webp',
            size: 420000,
            originalName: 'hero.webp',
          },
        },
      };
    };

    const mockFile = new File(['hero-binary-data'], 'hero.webp', { type: 'image/webp' });

    let progressPct = 0;
    const result = await bannerService.uploadBannerImage(mockFile, (p) => {
      progressPct = p;
    });

    assert.equal(capturedUrl, '/admin/upload/banners');
    assert.ok(capturedBody instanceof FormData);
    assert.equal(capturedBody.get('image').name, 'hero.webp');
    assert.ok(capturedConfig.onUploadProgress);

    capturedConfig.onUploadProgress({ loaded: 75, total: 100 });
    assert.equal(progressPct, 75);

    assert.equal(result.key, 'banners/1730650000000-hero.webp');
    assert.equal(result.url, 'https://pub-r2.dev/banners/1730650000000-hero.webp');
  });

  test('bannerService.uploadBannerImage rejects missing file', async () => {
    await assert.rejects(async () => {
      await bannerService.uploadBannerImage(null);
    }, { message: 'A banner image file is required for upload.' });
  });

  test('bannerService.deleteUploadedImage calls DELETE /admin/upload/banners with key in data payload', async () => {
    let capturedUrl = '';
    let capturedConfig = null;

    apiClient.delete = async (url, config) => {
      capturedUrl = url;
      capturedConfig = config;
      return {
        data: {
          success: true,
          data: { key: 'banners/hero.webp', deletedKey: 'banners/hero.webp' },
        },
      };
    };

    const result = await bannerService.deleteUploadedImage('banners/hero.webp');
    assert.equal(capturedUrl, '/admin/upload/banners');
    assert.deepEqual(capturedConfig.data, { key: 'banners/hero.webp' });
    assert.equal(result.key, 'banners/hero.webp');

    await assert.rejects(async () => {
      await bannerService.deleteUploadedImage('');
    }, { message: 'Image key is required for deletion.' });
  });

  test('BannerFormPage implements compact two-column CMS layout with sticky live preview', () => {
    const bannerFormPath = path.resolve('src/pages/banners/BannerFormPage.jsx');
    const content = fs.readFileSync(bannerFormPath, 'utf8');

    // 1. Two-column responsive grid workspace: left config (~65%), right preview (~35%)
    assert.match(content, /grid-cols-1\s+xl:grid-cols-\[minmax\(0,1\.85fr\)_minmax\(0,1fr\)\]/);

    // 2. Right preview column is sticky on desktop
    assert.match(content, /xl:sticky\s+xl:top-6/);

    // 3. Compact live preview contains viewport toggle (Desktop / Mobile)
    assert.match(content, /Desktop/);
    assert.match(content, /Mobile/);
    assert.match(content, /setViewportMode/);

    // 4. Compact artwork upload section with BannerImageUploader
    assert.match(content, /BannerImageUploader/);
    assert.match(content, /Banner Artwork/);

    // 5. Text overlay toggle and narrative inputs
    assert.match(content, /Storefront Text Overlay/);
    assert.match(content, /Eyebrow Label/);
    assert.match(content, /Main Headline/);
    assert.match(content, /Subtitle \/ Description/);
    assert.match(content, /Call to Action \(CTA\) Button/);

    // 6. Settings section with display position and publish status
    assert.match(content, /Carousel Settings/);
    assert.match(content, /Display Position/);
    assert.match(content, /Publish Status/);

    // 7. No giant full-width preview above the form
    assert.doesNotMatch(content, /PROMINENT FULL-WIDTH STOREFRONT HERO PREVIEW/);
  });
});

