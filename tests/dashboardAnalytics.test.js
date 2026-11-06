import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { dashboardService } from '../src/services/dashboard.service.js';
import apiClient from '../src/lib/api.js';
import {
  ORDERS_ANALYTICS_SERIES,
  ORDERS_ANALYTICS_RANGES,
} from '../src/constants.js';

describe('Admin Business Analytics Service, Constants & Clean Dashboard Tests', () => {
  let originalGet;

  beforeEach(() => {
    originalGet = apiClient.get;
  });

  afterEach(() => {
    apiClient.get = originalGet;
  });

  test('1. ORDERS_ANALYTICS_SERIES configures all 8 lifecycle series with brand semantic colors', () => {
    const keys = ORDERS_ANALYTICS_SERIES.map((s) => s.key);
    assert.deepEqual(keys, [
      'total',
      'pending',
      'accepted',
      'processing',
      'packed',
      'shipped',
      'delivered',
      'cancelled',
    ]);

    const totalConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'total');
    assert.equal(totalConfig.color, '#48250F', 'Total orders must use Sinka primary brand brown');

    const pendingConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'pending');
    assert.equal(pendingConfig.color, '#F59E0B', 'Pending orders must use amber/orange');

    const acceptedConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'accepted');
    assert.equal(acceptedConfig.color, '#0284C7', 'Accepted orders must use sky blue');

    const processingConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'processing');
    assert.equal(processingConfig.color, '#3B82F6', 'Processing orders must use blue');

    const packedConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'packed');
    assert.equal(packedConfig.color, '#6366F1', 'Packed orders must use indigo');

    const shippedConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'shipped');
    assert.equal(shippedConfig.color, '#8B5CF6', 'Shipped orders must use purple');

    const deliveredConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'delivered');
    assert.equal(deliveredConfig.color, '#10B981', 'Delivered orders must use emerald green');

    const cancelledConfig = ORDERS_ANALYTICS_SERIES.find((s) => s.key === 'cancelled');
    assert.equal(cancelledConfig.color, '#EF4444', 'Cancelled orders must use rose/red');
  });

  test('2. ORDERS_ANALYTICS_RANGES defines 7D, 14D, 30D, 90D, and 1 Year options', () => {
    assert.equal(ORDERS_ANALYTICS_RANGES.length, 5);
    assert.deepEqual(
      ORDERS_ANALYTICS_RANGES.map((r) => r.key),
      ['7d', '14d', '30d', '90d', '1y']
    );
  });

  test('3. dashboardService.getDashboardAnalytics requests /admin/dashboard/analytics with period param', async () => {
    let capturedUrl = null;
    let capturedParams = null;

    apiClient.get = async (url, config) => {
      capturedUrl = url;
      capturedParams = config?.params;
      return {
        data: {
          success: true,
          data: {
            period: '30d',
            kpis: { totalOrders: 50, totalRevenue: 1250000 },
            orders: { trend: [] },
            revenue: { trend: [] },
            customers: { trend: [] },
            topProducts: [],
            lowStockProducts: [],
            recentOrders: [],
          },
        },
      };
    };

    const result = await dashboardService.getDashboardAnalytics('30d');

    assert.equal(capturedUrl, '/admin/dashboard/analytics');
    assert.deepEqual(capturedParams, { period: '30d' });
    assert.equal(result.period, '30d');
    assert.equal(result.kpis.totalOrders, 50);
  });

  test('4. dashboardService.getOrdersAnalytics requests /admin/dashboard/orders-analytics with range param', async () => {
    let capturedUrl = null;
    let capturedParams = null;

    apiClient.get = async (url, config) => {
      capturedUrl = url;
      capturedParams = config?.params;
      return {
        data: {
          success: true,
          data: {
            range: '7d',
            series: [
              {
                date: '2026-11-06',
                total: 4,
                pending: 1,
                processing: 1,
                shipped: 1,
                delivered: 1,
                cancelled: 0,
              },
            ],
          },
        },
      };
    };

    const result = await dashboardService.getOrdersAnalytics('7d');

    assert.equal(capturedUrl, '/admin/dashboard/orders-analytics');
    assert.deepEqual(capturedParams, { range: '7d' });
    assert.equal(result.range, '7d');
    assert.equal(result.series.length, 1);
  });

  test('5. Zero Dummy Data Invariant: verifies no hardcoded mock order counts are present', () => {
    for (const item of ORDERS_ANALYTICS_SERIES) {
      assert.equal('count' in item, false, 'Series config must not contain static count');
      assert.equal('percentage' in item, false, 'Series config must not contain fake percentage');
    }
  });

  test('6. DashboardPage completely removes all documentation, developer, and shortcut cards', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const content = await fs.readFile(
      path.resolve(process.cwd(), 'src/pages/dashboard/DashboardPage.jsx'),
      'utf-8'
    );

    // Verify removed documentation sections
    assert.equal(content.includes('Administrator Profile'), false, 'Administrator Profile card must be removed');
    assert.equal(content.includes('Backend Integration'), false, 'Backend Integration card must be removed');
    assert.equal(content.includes('Order Fulfillment & Operations'), false, 'Order Operations documentation card must be removed');
    assert.equal(content.includes('Homepage Hero Banners'), false, 'Homepage Banners shortcut card must be removed');
    assert.equal(content.includes('Active REST API endpoint'), false, 'REST API endpoint info must be removed');
    assert.equal(content.includes('MongoDB RBAC'), false, 'RBAC documentation must be removed');
    assert.equal(content.includes('Core Foundation Stack'), false, 'Core Foundation Stack must be removed');
    assert.equal(content.includes('Browse orders'), false, 'Browse orders shortcut card must be removed');
    assert.equal(content.includes('Manage logistics'), false, 'Manage logistics shortcut card must be removed');
  });

  test('7. DashboardPage mounts all 7 dedicated business analytics sections', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const content = await fs.readFile(
      path.resolve(process.cwd(), 'src/pages/dashboard/DashboardPage.jsx'),
      'utf-8'
    );

    assert.ok(content.includes('KpiOverviewCards'), 'DashboardPage must render KpiOverviewCards');
    assert.ok(content.includes('OrdersAnalyticsChart'), 'DashboardPage must render OrdersAnalyticsChart');
    assert.ok(content.includes('RevenueAnalyticsChart'), 'DashboardPage must render RevenueAnalyticsChart');
    assert.ok(content.includes('OrderStatusDistributionChart'), 'DashboardPage must render OrderStatusDistributionChart');
    assert.ok(content.includes('CustomerGrowthCard'), 'DashboardPage must render CustomerGrowthCard');
    assert.ok(content.includes('TopSellingProducts'), 'DashboardPage must render TopSellingProducts');
    assert.ok(content.includes('InventoryAlertsCard'), 'DashboardPage must render InventoryAlertsCard');
    assert.ok(content.includes('RecentOrdersTable'), 'DashboardPage must render RecentOrdersTable');
  });
});
