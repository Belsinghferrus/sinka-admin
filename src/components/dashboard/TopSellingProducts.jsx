import { Trophy, Package, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { ROUTES } from '../../constants.js';

/**
 * Top Selling Products section for Sinka Admin Dashboard.
 * Calculated dynamically from real order item purchases.
 *
 * @param {object} props
 * @param {Array<{ id: string, name: string, image: string, sku: string, unitsSold: number, revenue: number }>} props.products
 * @param {boolean} props.isLoading
 */
export function TopSellingProducts({ products = [], isLoading = false }) {
  const items = products || [];

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs font-sans flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <Trophy className="w-4 h-4 text-amber-600" />
            </span>
            <h3 className="text-base font-heading font-semibold text-stone-900 tracking-tight">
              Top Selling Products
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Best performing furniture designs ranked by units ordered.
          </p>
        </div>
        <Link
          to={ROUTES.PRODUCTS}
          className="text-xs font-medium text-brand-primary hover:underline flex items-center space-x-1"
        >
          <span>All Catalogue</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3 py-2 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center space-x-3 p-2 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-stone-200 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <div className="w-32 h-3 bg-stone-200 rounded" />
                <div className="w-20 h-2.5 bg-stone-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="py-10 flex flex-col items-center justify-center text-center space-y-2 text-stone-400">
          <Package className="w-8 h-8 stroke-1 text-stone-300" />
          <p className="text-xs font-semibold text-stone-700">No sales data available</p>
          <p className="text-[11px] text-stone-400 max-w-xs">
            As customers complete orders, top performing furniture designs will be ranked here.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
          {items.map((prod, idx) => (
            <div
              key={prod.id || prod.name || idx}
              className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {/* Rank Badge */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    idx === 0
                      ? 'bg-amber-100 text-amber-800'
                      : idx === 1
                      ? 'bg-stone-200 text-stone-700'
                      : idx === 2
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-11 h-11 rounded-md bg-stone-200 overflow-hidden shrink-0 border border-stone-200">
                  {prod.image ? (
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      <Package className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-900 truncate" title={prod.name}>
                    {prod.name}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-700">{prod.unitsSold}</span> sold
                  </p>
                </div>
              </div>

              {/* Revenue */}
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-heading font-bold text-stone-900 block">
                  {formatCurrency(prod.revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopSellingProducts;
