import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import dashboardService from '../../services/dashboard.service.js';
import {
  DashboardHeader,
  KpiOverviewCards,
  OrdersAnalyticsChart,
  RevenueAnalyticsChart,
  OrderStatusDistributionChart,
  TopSellingProducts,
  CustomerGrowthCard,
  InventoryAlertsCard,
  RecentOrdersTable,
} from '../../components/dashboard/index.js';

/**
 * Sinka Home & Living Executive Ecommerce Analytics Dashboard.
 * 100% Backend-driven from real MongoDB collections via GET /api/admin/dashboard/analytics.
 * Zero dummy data, zero developer/documentation cards.
 */
export function DashboardPage() {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (selectedPeriod, isBackground = false) => {
    if (isBackground) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await dashboardService.getDashboardAnalytics(selectedPeriod);
      setData(response);
    } catch {
      setError('Unable to load dashboard analytics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const handleRefresh = () => {
    fetchAnalytics(period, true);
  };

  const revenuePeriodTotal =
    data?.revenue?.current ??
    data?.revenue?.periodTotal ??
    data?.kpis?.totalRevenue?.current ??
    data?.kpis?.periodStats?.revenueInPeriod ??
    0;

  const revenueAov =
    data?.revenue?.averageOrderValue?.current ??
    data?.revenue?.averageOrderValue ??
    data?.kpis?.averageOrderValue?.current ??
    0;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header with Period Selector & Refresh */}
      <DashboardHeader
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
      />

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-red-800 text-xs sm:text-sm shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-900">Unable to load dashboard analytics</p>
              <p className="mt-0.5 text-stone-600">Please check your network connection and try again.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics(period)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shrink-0 shadow-2xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Responsive KPI Cards Grid */}
      <KpiOverviewCards kpis={data?.kpis} isLoading={isLoading} />

      {/* 3. Orders Overview + Customer Growth — Side-by-Side Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] gap-5">
        <OrdersAnalyticsChart
          trend={data?.orders?.trend}
          range={period}
          onRangeChange={setPeriod}
          isLoading={isLoading}
          error={error}
        />
        <CustomerGrowthCard
          customers={data?.customers}
          isLoading={isLoading}
        />
      </div>

      {/* 4. Revenue Overview & 5. Order Status Distribution (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueAnalyticsChart
          trend={data?.revenue?.trend}
          periodTotal={revenuePeriodTotal}
          averageOrderValue={revenueAov}
          isLoading={isLoading}
        />

        <OrderStatusDistributionChart
          distribution={data?.orders?.statusDistribution || data?.statusDistribution}
          isLoading={isLoading}
        />
      </div>

      {/* 6. Top Selling Products & 8. Inventory Alerts (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingProducts
          products={data?.topProducts}
          isLoading={isLoading}
        />

        <InventoryAlertsCard
          products={data?.lowStockProducts}
          isLoading={isLoading}
        />
      </div>

      {/* 9. Recent Orders Full-Width Section */}
      <RecentOrdersTable
        orders={data?.recentOrders}
        isLoading={isLoading}
      />

      {/* Footer Metadata */}
      <div className="flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-200/80 pt-3 px-1">
        <span className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active Period Window: {period.toUpperCase()}</span>
        </span>
        <span>Sinka Home &amp; Living Business Intelligence Engine</span>
      </div>
    </div>
  );
}

export default DashboardPage;
