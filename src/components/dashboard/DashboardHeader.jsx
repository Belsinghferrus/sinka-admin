import { RefreshCw } from 'lucide-react';
import { ORDERS_ANALYTICS_RANGES } from '../../constants.js';

/**
 * Dashboard Header component for Sinka Home & Living Admin Dashboard.
 * Displays executive title, subtitle, period selector pills, and refresh action.
 *
 * @param {object} props
 * @param {string} props.period - Active period filter ('7d', '14d', '30d', '90d', '1y')
 * @param {(p: string) => void} props.onPeriodChange - Callback when period pill clicked
 * @param {() => void} props.onRefresh - Callback when refresh button clicked
 * @param {boolean} props.isLoading - Whether initial data load is in flight
 * @param {boolean} props.isRefreshing - Whether background refresh is active
 */
export function DashboardHeader({
  period = '7d',
  onPeriodChange,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-xs font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-semibold text-stone-900 tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-500">
          Overview of your store performance, orders, customers and inventory.
        </p>
      </div>

      {/* Period Selector Pills & Refresh Action */}
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <div
          role="radiogroup"
          aria-label="Analytics Period"
          className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg border border-stone-200/80"
        >
          {ORDERS_ANALYTICS_RANGES.map((r) => {
            const isActive = period === r.key;
            return (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onPeriodChange && onPeriodChange(r.key)}
                disabled={isLoading && period === r.key}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            title="Refresh analytics data"
            aria-label="Refresh analytics"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default DashboardHeader;

