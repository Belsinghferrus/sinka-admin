import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { reviewService } from '../src/services/review.service.js';
import {
  ROUTES,
  NAVIGATION_ITEMS,
  REVIEW_STATUSES,
  REVIEW_STATUS_CONFIG,
  REVIEW_RATING_FILTERS,
} from '../src/constants.js';
import apiClient from '../src/lib/api.js';

describe('Admin Customer Review Management Module Tests', () => {
  let originalGet, originalPatch, originalDelete;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPatch = apiClient.patch;
    originalDelete = apiClient.delete;
  });

  afterEach(() => {
    apiClient.get = originalGet;
    apiClient.patch = originalPatch;
    apiClient.delete = originalDelete;
  });

  test('1. Constants: ROUTES, NAVIGATION_ITEMS, and review statuses are properly configured', () => {
    assert.equal(ROUTES.REVIEWS, '/reviews');

    const navItem = NAVIGATION_ITEMS.find((item) => item.name === 'Reviews');
    assert.ok(navItem, 'Reviews must be in NAVIGATION_ITEMS');
    assert.equal(navItem.path, '/reviews');

    assert.deepEqual(REVIEW_STATUSES, ['PENDING', 'APPROVED', 'REJECTED']);

    // Check status color semantics
    assert.ok(REVIEW_STATUS_CONFIG.PENDING.badgeClass.includes('amber'), 'Pending must use warning amber');
    assert.ok(REVIEW_STATUS_CONFIG.APPROVED.badgeClass.includes('emerald'), 'Approved must use success emerald');
    assert.ok(REVIEW_STATUS_CONFIG.REJECTED.badgeClass.includes('rose') || REVIEW_STATUS_CONFIG.REJECTED.badgeClass.includes('red'), 'Rejected must use error red/rose');

    assert.equal(REVIEW_RATING_FILTERS.length, 6);
  });

  test('2. reviewService.getReviews passes pagination, search, status, and rating query parameters', async () => {
    let capturedUrl = '';
    let capturedConfig = null;

    apiClient.get = async (url, config) => {
      capturedUrl = url;
      capturedConfig = config;
      return {
        data: {
          success: true,
          data: {
            reviews: [
              {
                id: 'rev_1',
                customer: { name: 'Alen Roy', email: 'alen@example.com' },
                product: { name: 'Elif Executive Table' },
                rating: 5,
                title: 'Excellent quality',
                content: 'The table looks exactly like the pictures.',
                verifiedPurchase: true,
                status: 'PENDING',
                createdAt: '2026-11-15T10:00:00.000Z',
              },
            ],
            pagination: { total: 1, page: 2, limit: 10, totalPages: 1 },
            counts: { total: 1, pending: 1, approved: 0, rejected: 0 },
          },
        },
      };
    };

    const result = await reviewService.getReviews({
      page: 2,
      limit: 10,
      search: 'Alen',
      status: 'PENDING',
      rating: 5,
      sort: 'createdAt:desc',
    });

    assert.equal(capturedUrl, '/admin/reviews');
    assert.equal(capturedConfig.params.page, 2);
    assert.equal(capturedConfig.params.limit, 10);
    assert.equal(capturedConfig.params.search, 'Alen');
    assert.equal(capturedConfig.params.status, 'PENDING');
    assert.equal(capturedConfig.params.rating, 5);
    assert.equal(capturedConfig.params.sort, 'createdAt:desc');

    assert.equal(result.reviews.length, 1);
    assert.equal(result.reviews[0].customer.name, 'Alen Roy');
    assert.equal(result.meta.total, 1);
    assert.equal(result.counts.pending, 1);
  });

  test('3. reviewService.getReviewById fetches single review by ID', async () => {
    let capturedUrl = '';

    apiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: {
            review: {
              id: 'rev_123',
              rating: 5,
              title: 'Great craftsmanship',
            },
          },
        },
      };
    };

    const review = await reviewService.getReviewById('rev_123');
    assert.equal(capturedUrl, '/admin/reviews/rev_123');
    assert.equal(review.id, 'rev_123');
    assert.equal(review.title, 'Great craftsmanship');
  });

  test('4. reviewService.approveReview patches review to APPROVED', async () => {
    let capturedUrl = '';

    apiClient.patch = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: {
            review: { id: 'rev_123', status: 'APPROVED' },
          },
        },
      };
    };

    const res = await reviewService.approveReview('rev_123');
    assert.equal(capturedUrl, '/admin/reviews/rev_123/approve');
    assert.equal(res.status, 'APPROVED');
  });

  test('5. reviewService.approveReview falls back to status endpoint on 404/405', async () => {
    let callCount = 0;
    let fallbackBody = null;

    apiClient.patch = async (url, body) => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('Not Found');
        error.response = { status: 404 };
        throw error;
      }
      fallbackBody = body;
      return {
        data: {
          success: true,
          data: { review: { id: 'rev_123', status: 'APPROVED' } },
        },
      };
    };

    const res = await reviewService.approveReview('rev_123');
    assert.equal(callCount, 2);
    assert.deepEqual(fallbackBody, { status: 'APPROVED' });
    assert.equal(res.status, 'APPROVED');
  });

  test('6. reviewService.rejectReview patches review to REJECTED with reason', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    apiClient.patch = async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          success: true,
          data: {
            review: { id: 'rev_456', status: 'REJECTED', rejectionReason: 'Spam' },
          },
        },
      };
    };

    const res = await reviewService.rejectReview('rev_456', 'Spam');
    assert.equal(capturedUrl, '/admin/reviews/rev_456/reject');
    assert.deepEqual(capturedBody, { reason: 'Spam' });
    assert.equal(res.status, 'REJECTED');
  });

  test('7. reviewService.deleteReview deletes review by ID', async () => {
    let capturedUrl = '';

    apiClient.delete = async (url) => {
      capturedUrl = url;
      return {
        data: {
          success: true,
          data: { id: 'rev_789', deleted: true },
        },
      };
    };

    const res = await reviewService.deleteReview('rev_789');
    assert.equal(capturedUrl, '/admin/reviews/rev_789');
    assert.equal(res.deleted, true);
  });

  test('8. Sidebar mounts Reviews navigation item next to Products', () => {
    const sidebarPath = path.resolve('src/components/layout/Sidebar.jsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert.match(content, /ROUTES\.REVIEWS/);
    assert.match(content, /name:\s*'Reviews'/);
  });

  test('9. ReviewsListPage implements standard admin table, header, tabs, and pagination', () => {
    const listPagePath = path.resolve('src/pages/reviews/ReviewsListPage.jsx');
    const content = fs.readFileSync(listPagePath, 'utf8');

    // Header
    assert.match(content, /Reviews/);
    assert.match(content, /Manage customer product reviews and moderation\./);

    // Filter tabs
    assert.match(content, /All Reviews/);
    assert.match(content, /Pending/);
    assert.match(content, /Approved/);
    assert.match(content, /Rejected/);

    // Table columns
    assert.match(content, /Product/);
    assert.match(content, /Customer/);
    assert.match(content, /Rating/);
    assert.match(content, /Verified/);
    assert.match(content, /Status/);
    assert.match(content, /Actions/);

    // Verified Purchase display
    assert.match(content, /✓ Verified Purchase/);

    // Empty state
    assert.match(content, /No customer reviews yet\./);

    // Delete action handler
    assert.match(content, /handleOpenDeleteConfirmation/);
  });

  test('10. ReviewDetailModal renders complete context and excludes review photos', () => {
    const modalPath = path.resolve('src/components/reviews/ReviewDetailModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    // Context cards
    assert.match(content, /Customer Information/);
    assert.match(content, /Associated Product/);
    assert.match(content, /Order Reference/);
    assert.match(content, /✓ Verified Purchase/);

    // Actions
    assert.match(content, /Approve Review/);
    assert.match(content, /Reject Review/);
    assert.match(content, /Delete Review/);

    // Must omit customer review photos
    assert.doesNotMatch(content, /review\.photos/);
    assert.doesNotMatch(content, /review\.images/);
  });
});
