import {
  ShoppingBag,
  IndianRupee,
  Users,
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency.js';

/**
 * Renders an indicator badge for period-over-period percentage change.
 */
export function ComparisonBadge({ change, label = 'vs previous period' }) {
  if (change === null || change === undefined || Number.isNaN(change)) {
    return null;
  }

  const numChange = Number(change);
  const isPositive = numChange > 0;
  const isZero = numChange === 0;

  const badgeClass = isPositive
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : isZero
    ? 'text-stone-600 bg-stone-50 border-stone-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';

  const Icon = isPositive ? TrendingUp : isZero ? Minus : TrendingDown;

  return (
    <div className="flex items-center space-x-1.5 mt-2">
      <span
        className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}`}
      >
        <Icon className="w-3 h-3" />
        <span>{isPositive ? `+${numChange}%` : `${numChange}%`}</span>
      </span>
      <span className="text-[11px] text-stone-400 truncate">{label}</span>
    </div>
  );
}

/**
 * Individual KPI Metric Card.
 */
export function KpiCard({
  title,
  value,
  icon,
  iconColor = 'text-brand-primary bg-brand-primary/10',
  change,
  badgeText,
  badgeClass,
  subtext,
}) {
  const IconComponent = icon;
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between transition-all hover:border-stone-300">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-stone-500 truncate" title={title}>
            {title}
          </span>
          <span className={`p-1.5 rounded-lg shrink-0 ${iconColor}`}>
            {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
          </span>
        </div>
        <p className="text-xl sm:text-2xl font-heading font-bold text-stone-900 tracking-tight">
          {value}
        </p>
      </div>

      <div>
        {change !== undefined && change !== null ? (
          <ComparisonBadge change={change} />
        ) : badgeText ? (
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeClass}`}
            >
              {badgeText}
            </span>
          </div>
        ) : subtext ? (
          <p className="mt-2 text-[11px] text-stone-400 truncate">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Top KPI Metrics Row for Sinka Admin Business Analytics Dashboard.
 * Consumes real database counts and period comparisons.
 *
 * @param {object} props
 * @param {object} props.kpis
 * @param {boolean} props.isLoading
 */
export function KpiOverviewCards({ kpis, isLoading = false }) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="w-16 h-3 bg-stone-200 rounded" />
              <div className="w-7 h-7 rounded-lg bg-stone-100" />
            </div>
            <div className="w-20 h-6 bg-stone-200 rounded" />
            <div className="w-24 h-3 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Extract values supporting both { current, previous, percentageChange } objects and flat counts
  const rawOrders = kpis.totalOrders;
  const ordersCount =
    typeof rawOrders === 'object' && rawOrders !== null
      ? rawOrders.current ?? kpis.lifetime?.orders ?? 0
      : Number(rawOrders) || 0;
  const ordersChange =
    typeof rawOrders === 'object' && rawOrders !== null
      ? rawOrders.percentageChange
      : kpis.comparisons?.ordersChange;

  const rawRevenue = kpis.totalRevenue;
  const revenueValue =
    typeof rawRevenue === 'object' && rawRevenue !== null
      ? rawRevenue.current ?? kpis.lifetime?.revenue ?? 0
      : Number(rawRevenue) || 0;
  const revenueChange =
    typeof rawRevenue === 'object' && rawRevenue !== null
      ? rawRevenue.percentageChange
      : kpis.comparisons?.revenueChange;

  const rawCustomers = kpis.totalCustomers;
  const customersCount =
    typeof rawCustomers === 'object' && rawCustomers !== null
      ? rawCustomers.current ?? kpis.lifetime?.customers ?? 0
      : Number(rawCustomers) || 0;
  const customersChange =
    kpis.newCustomers?.percentageChange ??
    (typeof rawCustomers === 'object' && rawCustomers !== null
      ? rawCustomers.percentageChange
      : kpis.comparisons?.customersChange);

  const rawProducts = kpis.totalProducts;
  const productsCount =
    typeof rawProducts === 'object' && rawProducts !== null
      ? rawProducts.current ?? kpis.lifetime?.products ?? 0
      : Number(rawProducts) || 0;

  const rawPending = kpis.pendingOrders;
  const pendingCount =
    typeof rawPending === 'object' && rawPending !== null
      ? rawPending.current ?? 0
      : Number(rawPending) || 0;

  const rawLowStock = kpis.lowStockProducts;
  const lowStockCount =
    typeof rawLowStock === 'object' && rawLowStock !== null
      ? rawLowStock.current ?? 0
      : Number(rawLowStock) || 0;

  const cards = [
    {
      title: 'Total Orders',
      value: ordersCount.toLocaleString('en-IN'),
      icon: ShoppingBag,
      iconColor: 'text-brand-primary bg-brand-primary/10',
      change: ordersChange,
      subtext: `${kpis.periodStats?.ordersInPeriod || 0} in period`,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(revenueValue),
      icon: IndianRupee,
      iconColor: 'text-emerald-700 bg-emerald-50',
      change: revenueChange,
      subtext: `${formatCurrency(kpis.periodStats?.revenueInPeriod || 0)} in period`,
    },
    {
      title: 'Customers',
      value: customersCount.toLocaleString('en-IN'),
      icon: Users,
      iconColor: 'text-blue-700 bg-blue-50',
      change: customersChange,
      subtext: `${kpis.periodStats?.newCustomersInPeriod || 0} new in period`,
    },
    {
      title: 'Products',
      value: productsCount.toLocaleString('en-IN'),
      icon: Package,
      iconColor: 'text-purple-700 bg-purple-50',
      badgeText: 'Active catalogue',
      badgeClass: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      title: 'Pending Orders',
      value: pendingCount.toLocaleString('en-IN'),
      icon: Clock,
      iconColor: 'text-amber-700 bg-amber-50',
      badgeText: pendingCount > 0 ? 'Action required' : 'All clear',
      badgeClass:
        pendingCount > 0
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Low Stock',
      value: lowStockCount.toLocaleString('en-IN'),
      icon: AlertTriangle,
      iconColor: 'text-rose-700 bg-rose-50',
      badgeText: lowStockCount > 0 ? '≤ 5 units' : 'Healthy inventory',
      badgeClass:
        lowStockCount > 0
          ? 'text-rose-700 bg-rose-50 border-rose-200'
          : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-sans">
      {cards.map((card) => (
        <KpiCard key={card.title} {...card} />
      ))}
    </div>
  );
}

export const DashboardKpiGrid = KpiOverviewCards;
export default KpiOverviewCards;
