import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { orderService } from '../src/services/order.service.js';
import {
  ORDER_STATUSES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  VALID_STATUS_TRANSITIONS,
  isValidTransition,
  getAllowedTransitions,
  isTerminalStatus,
  COURIER_PROVIDERS,
  ROUTES,
} from '../src/constants.js';
import { formatCurrency, parseCurrencyInput } from '../src/utils/formatCurrency.js';
import apiClient from '../src/lib/api.js';

describe('Order Management Constants & State Machine Tests', () => {
  test('ORDER_STATUSES contains all 9 canonical lifecycle statuses', () => {
    assert.deepEqual(ORDER_STATUSES, [
      'PENDING',
      'ACCEPTED',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'REJECTED',
    ]);
  });

  test('ORDER_STATUS_CONFIG provides valid badge styling for every status', () => {
    for (const status of ORDER_STATUSES) {
      const config = ORDER_STATUS_CONFIG[status];
      assert.ok(config, `Missing config for ${status}`);
      assert.ok(config.label, `Missing label for ${status}`);
      assert.ok(config.badgeClass, `Missing badgeClass for ${status}`);
      assert.ok(config.dotClass, `Missing dotClass for ${status}`);
    }
  });

  test('PAYMENT_STATUS_CONFIG covers all 5 payment statuses', () => {
    const statuses = ['PAID', 'PENDING', 'FAILED', 'REFUND_PENDING', 'REFUNDED'];
    for (const st of statuses) {
      assert.ok(PAYMENT_STATUS_CONFIG[st], `Missing payment status config for ${st}`);
      assert.ok(PAYMENT_STATUS_CONFIG[st].label);
      assert.ok(PAYMENT_STATUS_CONFIG[st].badgeClass);
    }
  });

  test('isValidTransition strictly adheres to the backend state machine', () => {
    // Valid transitions
    assert.equal(isValidTransition('PENDING', 'ACCEPTED'), true);
    assert.equal(isValidTransition('PENDING', 'CANCELLED'), true);
    assert.equal(isValidTransition('PENDING', 'REJECTED'), true);
    assert.equal(isValidTransition('ACCEPTED', 'PROCESSING'), true);
    assert.equal(isValidTransition('PROCESSING', 'PACKED'), true);
    assert.equal(isValidTransition('PACKED', 'SHIPPED'), true);
    assert.equal(isValidTransition('SHIPPED', 'OUT_FOR_DELIVERY'), true);
    assert.equal(isValidTransition('SHIPPED', 'DELIVERED'), true);
    assert.equal(isValidTransition('OUT_FOR_DELIVERY', 'DELIVERED'), true);

    // Invalid transitions (jumps, revivals)
    assert.equal(isValidTransition('PENDING', 'DELIVERED'), false);
    assert.equal(isValidTransition('PENDING', 'SHIPPED'), false);
    assert.equal(isValidTransition('DELIVERED', 'PENDING'), false);
    assert.equal(isValidTransition('CANCELLED', 'ACCEPTED'), false);
    assert.equal(isValidTransition('REJECTED', 'SHIPPED'), false);

    // Idempotent transitions
    assert.equal(isValidTransition('PENDING', 'PENDING'), true);
    assert.equal(isValidTransition('DELIVERED', 'DELIVERED'), true);
  });

  test('isTerminalStatus correctly flags terminal states', () => {
    assert.equal(isTerminalStatus('DELIVERED'), true);
    assert.equal(isTerminalStatus('CANCELLED'), true);
    assert.equal(isTerminalStatus('REJECTED'), true);
    assert.equal(isTerminalStatus('PENDING'), false);
    assert.equal(isTerminalStatus('ACCEPTED'), false);
    assert.equal(isTerminalStatus('PROCESSING'), false);
    assert.equal(isTerminalStatus('PACKED'), false);
    assert.equal(isTerminalStatus('SHIPPED'), false);
    assert.equal(isTerminalStatus('OUT_FOR_DELIVERY'), false);
  });

  test('getAllowedTransitions returns correct next actions', () => {
    assert.deepEqual(getAllowedTransitions('PENDING'), ['ACCEPTED', 'CANCELLED', 'REJECTED']);
    assert.deepEqual(getAllowedTransitions('ACCEPTED'), ['PROCESSING', 'CANCELLED']);
    assert.deepEqual(getAllowedTransitions('DELIVERED'), []);
    assert.deepEqual(getAllowedTransitions('CANCELLED'), []);
  });

  test('COURIER_PROVIDERS contains major Indian logistics carriers', () => {
    const names = COURIER_PROVIDERS.map((c) => c.value);
    assert.ok(names.includes('Delhivery'));
    assert.ok(names.includes('BlueDart'));
    assert.ok(names.includes('DTDC'));
    assert.ok(names.includes('IndiaPost'));
    assert.ok(names.includes('Shiprocket'));
    assert.ok(names.includes('Other'));
  });

  test('ROUTES contains orders listing and detail paths', () => {
    assert.equal(ROUTES.ORDERS, '/orders');
    assert.equal(ROUTES.ORDERS_DETAIL, '/orders/:orderId');
  });
});

describe('Order Currency Formatting Tests', () => {
  test('Indian Rupee formatting works as required (e.g. ₹45,000)', () => {
    assert.equal(formatCurrency(45000), '₹45,000');
    assert.equal(formatCurrency(199), '₹199');
    assert.equal(formatCurrency(0), '₹0');
    assert.equal(formatCurrency(125000), '₹1,25,000');
    assert.equal(formatCurrency(1000000), '₹10,00,000');
  });

  test('parseCurrencyInput cleans monetary strings accurately', () => {
    assert.equal(parseCurrencyInput('₹45,000'), 45000);
    assert.equal(parseCurrencyInput(199), 199);
    assert.equal(isNaN(parseCurrencyInput('')), true);
  });
});

describe('Order Service Integration Tests', () => {
  let originalGet, originalPatch;

  beforeEach(() => {
    originalGet = apiClient.get;
    originalPatch = apiClient.patch;
  });

  afterEach(() => {
    apiClient.get = originalGet;
    apiClient.patch = originalPatch;
  });

  test('orderService.getOrders passes pagination, search, status, and date range filters', async () => {
    let capturedUrl = '';
    let capturedConfig = null;

    apiClient.get = async (url, config) => {
      capturedUrl = url;
      capturedConfig = config;
      return {
        data: {
          statusCode: 200,
          data: {
            orders: [
              {
                orderNumber: 'ORD-20261104-TEST',
                status: 'PENDING',
                pricing: { totalAmount: 45000 },
              },
            ],
            pagination: {
              total: 1,
              page: 2,
              limit: 10,
              totalPages: 1,
            },
          },
          meta: {
            total: 1,
            page: 2,
            limit: 10,
            totalPages: 1,
          },
        },
      };
    };

    const result = await orderService.getOrders({
      page: 2,
      limit: 10,
      search: 'Sharma',
      status: 'PENDING',
      paymentStatus: 'PAID',
      startDate: '2026-11-01',
      endDate: '2026-11-04',
      sort: 'createdAt:desc',
    });

    assert.equal(capturedUrl, '/admin/orders');
    assert.deepEqual(capturedConfig.params, {
      page: 2,
      limit: 10,
      sort: 'createdAt:desc',
      search: 'Sharma',
      status: 'PENDING',
      paymentStatus: 'PAID',
      startDate: '2026-11-01',
      endDate: '2026-11-04',
    });
    assert.equal(result.orders.length, 1);
    assert.equal(result.meta.page, 2);
    assert.equal(result.meta.total, 1);
  });

  test('orderService.getOrderById fetches single order by ID or orderNumber', async () => {
    let capturedUrl = '';

    apiClient.get = async (url) => {
      capturedUrl = url;
      return {
        data: {
          statusCode: 200,
          data: {
            order: {
              orderNumber: 'ORD-20261104-ABCD',
              status: 'PROCESSING',
            },
          },
        },
      };
    };

    const order = await orderService.getOrderById('ORD-20261104-ABCD');
    assert.equal(capturedUrl, '/admin/orders/ORD-20261104-ABCD');
    assert.equal(order.orderNumber, 'ORD-20261104-ABCD');
    assert.equal(order.status, 'PROCESSING');
  });

  test('orderService.getOrderById throws error on empty orderId', async () => {
    await assert.rejects(async () => {
      await orderService.getOrderById('');
    }, /Order ID is required/);
  });

  test('orderService.updateOrderStatus sends PATCH with status and note', async () => {
    let capturedUrl = '';
    let capturedPayload = null;

    apiClient.patch = async (url, data) => {
      capturedUrl = url;
      capturedPayload = data;
      return {
        data: {
          statusCode: 200,
          data: {
            order: {
              orderNumber: 'ORD-123',
              status: 'ACCEPTED',
            },
          },
        },
      };
    };

    const updated = await orderService.updateOrderStatus('ORD-123', {
      status: 'ACCEPTED',
      note: 'Payment verified with gateway',
    });

    assert.equal(capturedUrl, '/admin/orders/ORD-123/status');
    assert.deepEqual(capturedPayload, {
      status: 'ACCEPTED',
      note: 'Payment verified with gateway',
    });
    assert.equal(updated.status, 'ACCEPTED');
  });

  test('orderService.updateOrderStatus validates required parameters', async () => {
    await assert.rejects(async () => {
      await orderService.updateOrderStatus('', { status: 'ACCEPTED' });
    }, /Order ID is required/);

    await assert.rejects(async () => {
      await orderService.updateOrderStatus('ORD-123', {});
    }, /Target status is required/);
  });

  test('orderService.updateOrderTracking sends tracking details', async () => {
    let capturedUrl = '';
    let capturedPayload = null;

    apiClient.patch = async (url, data) => {
      capturedUrl = url;
      capturedPayload = data;
      return {
        data: {
          statusCode: 200,
          data: {
            order: {
              orderNumber: 'ORD-123',
              status: 'SHIPPED',
              courier: data,
            },
          },
        },
      };
    };

    const shipmentDate = '2026-11-04T10:00:00.000Z';
    const result = await orderService.updateOrderTracking('ORD-123', {
      courierName: 'Delhivery',
      trackingId: 'DEL987654321',
      trackingUrl: 'https://www.delhivery.com/track/package/DEL987654321',
      shipmentDate,
      shippingNote: 'Shipped via express surface cargo',
    });

    assert.equal(capturedUrl, '/admin/orders/ORD-123/tracking');
    assert.equal(capturedPayload.courierName, 'Delhivery');
    assert.equal(capturedPayload.trackingId, 'DEL987654321');
    assert.equal(capturedPayload.trackingUrl, 'https://www.delhivery.com/track/package/DEL987654321');
    assert.equal(capturedPayload.shippingNote, 'Shipped via express surface cargo');
    assert.equal(result.status, 'SHIPPED');
  });

  test('orderService.updateOrderTracking validates courier name and tracking ID', async () => {
    await assert.rejects(async () => {
      await orderService.updateOrderTracking('ORD-123', {
        courierName: '',
        trackingId: '123',
      });
    }, /Courier name is required/);

    await assert.rejects(async () => {
      await orderService.updateOrderTracking('ORD-123', {
        courierName: 'Delhivery',
        trackingId: '',
      });
    }, /Tracking ID \/ AWB is required/);
  });

  test('orderService.addAdminNote sends internal administrative note', async () => {
    let capturedUrl = '';
    let capturedPayload = null;

    apiClient.patch = async (url, data) => {
      capturedUrl = url;
      capturedPayload = data;
      return {
        data: {
          statusCode: 200,
          data: {
            order: {
              orderNumber: 'ORD-123',
              adminNotes: [{ note: data.note, addedBy: 'admin' }],
            },
          },
        },
      };
    };

    const result = await orderService.addAdminNote('ORD-123', {
      note: 'Customer requested delayed dispatch to weekend',
    });

    assert.equal(capturedUrl, '/admin/orders/ORD-123/admin-note');
    assert.equal(capturedPayload.note, 'Customer requested delayed dispatch to weekend');
    assert.equal(result.adminNotes.length, 1);
  });

  test('orderService.addAdminNote rejects empty note', async () => {
    await assert.rejects(async () => {
      await orderService.addAdminNote('ORD-123', { note: '   ' });
    }, /Admin note cannot be empty/);
  });
});
