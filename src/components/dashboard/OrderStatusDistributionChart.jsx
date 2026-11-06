import { useState, useMemo } from 'react';
import { PieChart as PieIcon, Layers } from 'lucide-react';

/**
 * Clean SVG Donut Chart Component for Sinka Order Status Distribution.
 * Consumes real backend distribution from GET /api/admin/dashboard/analytics.
 *
 * @param {object} props
 * @param {Array<{ status: string, rawStatus: string, label: string, color: string, count: number, percentage: number }>} props.distribution
 * @param {boolean} props.isLoading
 */
export function OrderStatusDistributionChart({ distribution = [], isLoading = false }) {
  const [hoveredStatus, setHoveredStatus] = useState(null);

  const items = useMemo(() => distribution || [], [distribution]);
  const totalOrders = useMemo(() => {
    return items.reduce((sum, it) => sum + (it.count || 0), 0);
  }, [items]);

  // Compute SVG arc angles for Donut
  const arcs = useMemo(() => {
    if (!items || items.length === 0 || totalOrders === 0) return [];
    let currentAngle = -Math.PI / 2; // Start from 12 o'clock

    return items
      .filter((it) => it.count > 0)
      .map((it) => {
        const sliceAngle = (it.count / totalOrders) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngle;
        currentAngle = endAngle;

        const radius = 80;
        const innerRadius = 52;
        const cx = 110;
        const cy = 110;

        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        const innerX1 = cx + innerRadius * Math.cos(endAngle);
        const innerY1 = cy + innerRadius * Math.sin(endAngle);
        const innerX2 = cx + innerRadius * Math.cos(startAngle);
        const innerY2 = cy + innerRadius * Math.sin(startAngle);

        const largeArc = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
          `M ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
          `L ${innerX1} ${innerY1}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerX2} ${innerY2}`,
          'Z',
        ].join(' ');

        return {
          ...it,
          pathData,
        };
      });
  }, [items, totalOrders]);

  const activeItem = useMemo(() => {
    if (!hoveredStatus) return null;
    return items.find((it) => it.status === hoveredStatus);
  }, [hoveredStatus, items]);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs font-sans flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-md bg-stone-100 text-stone-700">
            <PieIcon className="w-4 h-4 text-brand-primary" />
          </span>
          <h3 className="text-base font-heading font-semibold text-stone-900 tracking-tight">
            Order Status
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-stone-500">
          Proportion of customer orders across lifecycle fulfillment stages.
        </p>
      </div>

      {isLoading && (
        <div className="h-56 flex items-center justify-center animate-pulse">
          <div className="w-36 h-36 rounded-full border-8 border-stone-200 border-t-brand-primary/40" />
        </div>
      )}

      {!isLoading && totalOrders === 0 && (
        <div className="h-56 flex flex-col items-center justify-center text-center space-y-1.5 text-stone-400">
          <Layers className="w-8 h-8 stroke-1 text-stone-300" />
          <p className="text-xs font-semibold text-stone-700">No orders yet</p>
          <p className="text-[11px] text-stone-400">
            Customer orders will categorize across fulfillment statuses here.
          </p>
        </div>
      )}

      {!isLoading && totalOrders > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* SVG Donut Visual */}
          <div className="relative flex items-center justify-center">
            <svg
              viewBox="0 0 220 220"
              className="w-48 h-48 drop-shadow-2xs select-none"
              onMouseLeave={() => setHoveredStatus(null)}
            >
              {arcs.map((arc) => {
                const isHovered = hoveredStatus === arc.status;
                return (
                  <path
                    key={arc.status}
                    d={arc.pathData}
                    fill={arc.color}
                    className="transition-all duration-200 cursor-pointer hover:opacity-90"
                    style={{
                      transformOrigin: '110px 110px',
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    }}
                    onMouseEnter={() => setHoveredStatus(arc.status)}
                  />
                );
              })}

              {/* Center Stat Monogram */}
              <circle cx="110" cy="110" r="48" fill="#FFFFFF" />
              <text
                x="110"
                y="105"
                textAnchor="middle"
                className="font-heading font-bold text-lg fill-stone-900"
              >
                {activeItem ? activeItem.count : totalOrders.toLocaleString('en-IN')}
              </text>
              <text
                x="110"
                y="122"
                textAnchor="middle"
                className="font-sans text-[10px] font-medium fill-stone-400 uppercase tracking-wider"
              >
                {activeItem ? `${activeItem.percentage}%` : 'Total Orders'}
              </text>
            </svg>
          </div>

          {/* Interactive Legend Items */}
          <div className="space-y-1.5">
            {items.map((it) => {
              const isHovered = hoveredStatus === it.status;
              return (
                <div
                  key={it.status}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isHovered ? 'bg-stone-100 font-semibold text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                  onMouseEnter={() => setHoveredStatus(it.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: it.color }}
                    />
                    <span className="truncate">{it.label}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
                    <span className="text-stone-900 font-semibold">
                      {it.count.toLocaleString('en-IN')}
                    </span>
                    <span className="text-stone-400 w-10 text-right">
                      {it.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const OrderStatusChart = OrderStatusDistributionChart;
export default OrderStatusDistributionChart;
