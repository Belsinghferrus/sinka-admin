import { AlertTriangle, Package, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants.js';

function getStockStatusBadge(status) {
  switch (status) {
    case 'Out of Stock':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Critical':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Low Stock':
      return 'bg-stone-100 text-stone-700 border-stone-300';
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
}

/**
 * Low Stock & Inventory Alerts Component.
 * Surfaces items requiring restock attention based on actual stock levels.
 *
 * @param {object} props
 * @param {Array<{ id: string, name: string, stock: number, status: string, statusLabel: string, image: string, category: string, sku: string }>} props.products
 * @param {boolean} props.isLoading
 */
export function InventoryAlertsCard({ products = [], isLoading = false }) {
  const items = products || [];

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs font-sans flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </span>
            <h3 className="text-base font-heading font-semibold text-stone-900 tracking-tight">
              Inventory Alerts
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Stock items requiring restock attention (≤ 5 units remaining).
          </p>
        </div>
        <Link
          to={ROUTES.PRODUCTS}
          className="text-xs font-medium text-brand-primary hover:underline flex items-center space-x-1"
        >
          <span>Manage Stock</span>
          <ExternalLink className="w-3.5 h-3.5" />
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
          <Package className="w-8 h-8 stroke-1 text-emerald-500" />
          <p className="text-xs font-semibold text-stone-800">
            All products are sufficiently stocked.
          </p>
          <p className="text-[11px] text-stone-400 max-w-xs">
            Zero products currently below the 5-unit safety stock threshold.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
          {items.map((prod) => {
            const label = prod.statusLabel || (prod.stock === 0 ? 'Out of Stock' : prod.stock <= 2 ? 'Critical' : 'Low Stock');
            return (
              <div
                key={prod.id || prod.productId}
                className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-md bg-stone-200 overflow-hidden shrink-0 border border-stone-200">
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

                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-900 truncate" title={prod.name}>
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-stone-400 font-mono">
                      {prod.sku ? `SKU: ${prod.sku}` : prod.category || 'Furniture'}
                    </p>
                  </div>
                </div>

                {/* Stock Counter & Badge */}
                <div className="flex items-center space-x-3 shrink-0 pl-2">
                  <div className="text-right">
                    <span className="text-xs font-bold text-stone-900 block font-mono">
                      {prod.stock} {prod.stock === 1 ? 'unit' : 'units'}
                    </span>
                    <span className="text-[10px] text-stone-400">current stock</span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStockStatusBadge(
                      label
                    )}`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const InventoryAlerts = InventoryAlertsCard;
export default InventoryAlertsCard;
