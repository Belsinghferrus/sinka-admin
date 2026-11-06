import apiClient from '../lib/api.js';

/**
 * Service boundary for Sinka Administrative Dashboard & Business Analytics.
 * Integrates with dedicated backend endpoints under /api/admin/dashboard/*.
 *
 * All requests automatically attach the Authorization: Bearer <ADMIN_JWT>
 * header via the centralized apiClient interceptor.
 */
export const dashboardService = {
  /**
   * Fetches real consolidated business analytics including KPIs, order trends,
   * revenue trends, status distribution, top selling products, low stock alerts,
   * customer metrics, and recent orders from the MongoDB aggregation engine.
   *
   * @param {string} [period='7d'] - Time period ('7d', '14d', '30d', '90d', '1y')
   * @returns {Promise<object>} Complete business analytics payload
   */
  async getDashboardAnalytics(period = '7d') {
    const response = await apiClient.get('/admin/dashboard/analytics', {
      params: { period }
    });

    const data = response.data?.data;
    if (!data || !data.kpis) {
      throw new Error('Malformed dashboard analytics response received from server.');
    }

    return data;
  },

  /**
   * Fetches real aggregated daily orders analytics across lifecycle statuses.
   *
   * @param {string} [range='7d'] - Time range ('7d', '14d', '30d', '90d', '1y')
   * @returns {Promise<{ range: string, series: Array<object> }>}
   */
  async getOrdersAnalytics(range = '7d') {
    const response = await apiClient.get('/admin/dashboard/orders-analytics', {
      params: { range }
    });

    const data = response.data?.data;
    if (!data || !Array.isArray(data.series)) {
      throw new Error('Malformed orders analytics response received from server.');
    }

    return data;
  }
};

export default dashboardService;
