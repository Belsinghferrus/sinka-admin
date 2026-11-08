import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { offerService } from '../src/services/offer.service.js';
import {
  MAX_OFFER_IMAGE_SIZE_BYTES,
  ALLOWED_OFFER_IMAGE_TYPES,
  ALLOWED_OFFER_IMAGE_EXTENSIONS,
} from '../src/constants.js';
import apiClient from '../src/lib/api.js';

describe('Promotional Offer Service & Image Upload Tests', () => {
  let originalGet, originalPost, originalPut, originalPatch, originalDelete;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPost = apiClient.post;
    originalPut = apiClient.put;
    originalPatch = apiClient.patch;
    originalDelete = apiClient.delete;
  });

  afterEach(() => {
    apiClient.get = originalGet;
    apiClient.post = originalPost;
    apiClient.put = originalPut;
    apiClient.patch = originalPatch;
    apiClient.delete = originalDelete;
  });

  test('Offer image upload constants enforce 5 MB limit and JPG/PNG/WebP formats', () => {
    assert.equal(MAX_OFFER_IMAGE_SIZE_BYTES, 5 * 1024 * 1024);
    assert.deepEqual(ALLOWED_OFFER_IMAGE_TYPES, [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    assert.deepEqual(ALLOWED_OFFER_IMAGE_EXTENSIONS, [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
    ]);
  });

  test('offerService.uploadOfferImage sends FormData to /admin/upload/offers', async () => {
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
            key: 'offers/1730470000000-banner123.webp',
            url: 'https://pub-r2.dev/offers/1730470000000-banner123.webp',
            contentType: 'image/webp',
            size: 250000,
            originalName: 'banner.webp',
          },
        },
      };
    };

    const mockFile = new File(['mock binary image'], 'banner.webp', { type: 'image/webp' });

    let progressReported = null;
    const result = await offerService.uploadOfferImage(mockFile, (p) => {
      progressReported = p;
    });

    assert.equal(capturedUrl, '/admin/upload/offers');
    assert.ok(capturedBody instanceof FormData);
    assert.equal(capturedBody.get('image').name, 'banner.webp');
    assert.equal(capturedBody.get('image').size, mockFile.size);
    assert.ok(capturedConfig.onUploadProgress);

    // Verify progress callback works
    capturedConfig.onUploadProgress({ loaded: 50, total: 100 });
    assert.equal(progressReported, 50);

    assert.equal(result.key, 'offers/1730470000000-banner123.webp');
    assert.equal(result.url, 'https://pub-r2.dev/offers/1730470000000-banner123.webp');
  });

  test('offerService.uploadOfferImage rejects missing file argument', async () => {
    await assert.rejects(
      async () => {
        await offerService.uploadOfferImage(null);
      },
      {
        message: 'A banner image file is required for upload.',
      }
    );
  });

  test('offerService.deleteUploadedImage calls DELETE /admin/upload/offers with key', async () => {
    let capturedUrl = '';
    let capturedConfig = null;

    apiClient.delete = async (url, config) => {
      capturedUrl = url;
      capturedConfig = config;
      return {
        data: {
          success: true,
          data: { key: 'offers/temp-to-delete.webp' },
        },
      };
    };

    const result = await offerService.deleteUploadedImage('offers/temp-to-delete.webp');
    assert.equal(capturedUrl, '/admin/upload/offers');
    assert.deepEqual(capturedConfig.data, { key: 'offers/temp-to-delete.webp' });
    assert.equal(result.key, 'offers/temp-to-delete.webp');
  });

  test('offerService.deleteUploadedImage rejects missing key', async () => {
    await assert.rejects(
      async () => {
        await offerService.deleteUploadedImage('');
      },
      {
        message: 'Image key is required for deletion.',
      }
    );
  });

  test('offerService.createOffer sends payload with imageUrl and optional imageKey', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.post = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            offer: { id: 'offer_123', ...body },
          },
        },
      };
    };

    const payload = {
      title: 'Spring Festival Sale',
      description: 'Exclusive furniture offers.',
      imageUrl: 'https://pub-r2.dev/offers/banner.webp',
      imageKey: 'offers/banner.webp',
      ctaLabel: 'Shop Now',
      ctaUrl: '/products',
      priority: 10,
    };

    const created = await offerService.createOffer(payload);
    assert.equal(capturedUrl, '/admin/offers');
    assert.equal(capturedBody.imageUrl, 'https://pub-r2.dev/offers/banner.webp');
    assert.equal(capturedBody.imageKey, 'offers/banner.webp');
    assert.equal(created.id, 'offer_123');
  });

  test('offerService.updateOffer sends updated imageUrl and imageKey', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.put = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            offer: { id: 'offer_123', ...body },
          },
        },
      };
    };

    const updatePayload = {
      title: 'Updated Festival Sale',
      imageUrl: 'https://pub-r2.dev/offers/new-banner.webp',
      imageKey: 'offers/new-banner.webp',
    };

    const updated = await offerService.updateOffer('offer_123', updatePayload);
    assert.equal(capturedUrl, '/admin/offers/offer_123');
    assert.equal(capturedBody.imageUrl, 'https://pub-r2.dev/offers/new-banner.webp');
    assert.equal(capturedBody.imageKey, 'offers/new-banner.webp');
    assert.equal(updated.title, 'Updated Festival Sale');
  });

  test('OfferFormPage implements compact two-column promotional workspace with sticky live storefront preview', () => {
    const offerFormPath = path.resolve('src/pages/offers/OfferFormPage.jsx');
    const content = fs.readFileSync(offerFormPath, 'utf8');

    // 1. Two-column responsive grid workspace: Left (~70-75%), Right (~25-30%)
    assert.match(content, /grid-cols-1\s+lg:grid-cols-\[minmax\(0,1fr\)_340px\]\s+xl:grid-cols-\[minmax\(0,1fr\)_360px\]/);

    // 2. Right sidebar is sticky on desktop
    assert.match(content, /lg:sticky\s+lg:top-4/);

    // 3. Compact section cards for Campaign Details, Media & Call to Action, Scheduling & Priority
    assert.match(content, /Campaign Details/);
    assert.match(content, /Media &amp; Call to Action/);
    assert.match(content, /Scheduling &amp; Priority/);

    // 4. Compact storefront live preview with Special Offer badge, title, subtitle, and CTA button
    assert.match(content, /Storefront Preview/);
    assert.match(content, /Special Offer/);

    // 5. Publication Settings card with Active Status toggle
    assert.match(content, /Publication Settings/);
    assert.match(content, /Active Status/);

    // 6. Action buttons in desktop sidebar and mobile bottom bar
    assert.match(content, /Publish Offer/);
  });

  test('OfferImageUploader implements compact dropzone styling', () => {
    const uploaderPath = path.resolve('src/components/offers/OfferImageUploader.jsx');
    const content = fs.readFileSync(uploaderPath, 'utf8');

    // Compact dropzone padding and icon sizing
    assert.match(content, /p-5/);
    assert.match(content, /w-10\s+h-10/);
    assert.match(content, /Supports JPG, JPEG, PNG, and WebP \(up to 5 MB\)/);
  });
});
