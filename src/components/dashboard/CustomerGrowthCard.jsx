import { useState, useMemo } from 'react';
import { Users, UserPlus, Repeat, Calendar } from 'lucide-react';

function getSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${monthNames[monthIdx] || ''} ${day}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const year = parts[0];
  return `${monthNames[monthIdx]} ${day}, ${year}`;
}

/**
 * Customer Growth Chart Component for Sinka Admin Dashboard.
 * Displays customer acquisition curve and retention metrics.
 *
 * @param {object} props
 * @param {object} props.customers - { total, new, returningCustomers, trend, percentageChange }
 * @param {boolean} props.isLoading
 */
export function CustomerGrowthCard({ customers = {}, isLoading = false }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const trend = useMemo(() => customers?.trend || [], [customers?.trend]);
  const total = customers?.total || 0;
  const newCust = customers?.new ?? customers?.newCustomersInPeriod ?? 0;
  const returning = customers?.returningCustomers || 0;

  // Chart canvas coordinate math
  const width = 540;
  const height = 120;
  const padding = { top: 12, right: 12, bottom: 22, left: 30 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxCust = useMemo(() => {
    if (!trend || trend.length === 0) return 5;
    const m = Math.max(...trend.map((t) => Number(t.newCustomers) || 0));
    return m > 0 ? (m <= 5 ? 5 : Math.ceil(m / 5) * 5) : 5;
  }, [trend]);

  const points = useMemo(() => {
    if (!trend || trend.length === 0) return [];
    const count = trend.length;
    const step = count > 1 ? innerW / (count - 1) : innerW / 2;

    return trend.map((item, idx) => {
      const val = Number(item.newCustomers) || 0;
      const x = padding.left + (count > 1 ? idx * step : innerW / 2);
      const y = padding.top + innerH - (val / maxCust) * innerH;
      return { x, y, value: val, date: item.date };
    });
  }, [trend, innerW, innerH, padding.left, padding.top, maxCust]);

  const pathString = useMemo(() => getSmoothPath(points), [points]);

  const areaString = useMemo(() => {
    if (!points || points.length === 0) return '';
    const bottomY = padding.top + innerH;
    const linePath = getSmoothPath(points);
    if (!linePath) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [points, innerH, padding.top]);

  const activeHoverData = hoverIndex !== null && trend[hoverIndex] ? trend[hoverIndex] : null;
  const activeHoverPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs font-sans flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="border-b border-stone-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-md bg-blue-50 text-blue-700">
            <Users className="w-4 h-4 text-blue-600" />
          </span>
          <h3 className="text-base font-heading font-semibold text-stone-900 tracking-tight">
            Customer Growth
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-stone-500">
          New customer registrations during the selected period.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3 py-3 animate-pulse">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-stone-100 rounded-lg" />
            <div className="h-10 bg-stone-100 rounded-lg" />
            <div className="h-10 bg-stone-100 rounded-lg" />
          </div>
          <div className="h-20 bg-stone-100 rounded-lg" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Key Metric Chips */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-[10px] uppercase font-semibold text-stone-400 block">Total Base</span>
              <span className="text-sm font-heading font-bold text-stone-900">
                {total.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100">
              <span className="text-[10px] uppercase font-semibold text-blue-600 block flex items-center space-x-1">
                <UserPlus className="w-3 h-3" />
                <span>New in Period</span>
              </span>
              <span className="text-sm font-heading font-bold text-blue-900">
                {newCust.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
              <span className="text-[10px] uppercase font-semibold text-stone-400 block flex items-center space-x-1">
                <Repeat className="w-3 h-3" />
                <span>Returning</span>
              </span>
              <span className="text-sm font-heading font-bold text-stone-900">
                {returning.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Acquisition Velocity Curve */}
          <div className="pt-2 relative select-none">
            {trend.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-xs text-stone-400">
                No customer registrations recorded in this period.
              </div>
            ) : (
              <div className="relative">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-auto overflow-visible"
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <defs>
                    <linearGradient id="custAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis zero and max guide lines */}
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left + innerW}
                    y2={padding.top}
                    stroke="#E7E5E4"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={padding.left}
                    y1={padding.top + innerH}
                    x2={padding.left + innerW}
                    y2={padding.top + innerH}
                    stroke="#E7E5E4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 6}
                    y={padding.top + 3.5}
                    textAnchor="end"
                    fontSize="9"
                    fill="#78716C"
                    className="font-mono"
                  >
                    {maxCust}
                  </text>
                  <text
                    x={padding.left - 6}
                    y={padding.top + innerH + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#78716C"
                    className="font-mono"
                  >
                    0
                  </text>

                  {/* Date labels */}
                  {trend.map((item, idx) => {
                    const count = trend.length;
                    const step = count > 1 ? innerW / (count - 1) : innerW / 2;
                    const x = padding.left + (count > 1 ? idx * step : innerW / 2);
                    const show =
                      count <= 7 ||
                      idx === 0 ||
                      idx === count - 1 ||
                      (count <= 14 && idx % 2 === 0) ||
                      (count > 14 && idx % Math.ceil(count / 6) === 0);

                    return (
                      <g key={`clabel-${item.date}`}>
                        {show && (
                          <text
                            x={x}
                            y={height - 10}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#78716C"
                            className="font-sans font-medium"
                          >
                            {formatDateLabel(item.date)}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaString && (
                    <path d={areaString} fill="url(#custAreaGrad)" className="transition-all duration-300" />
                  )}

                  {/* Curve */}
                  {pathString && (
                    <path
                      d={pathString}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Dots */}
                  {points.map((pt, pIdx) => {
                    const isHovered = hoverIndex === pIdx;
                    return (
                      <circle
                        key={`cp-${pIdx}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 4.5 : 3}
                        fill="#FFFFFF"
                        stroke="#3B82F6"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all pointer-events-none"
                      />
                    );
                  })}

                  {/* Hover rects */}
                  {trend.map((item, idx) => {
                    const count = trend.length;
                    const step = count > 1 ? innerW / (count - 1) : innerW / 2;
                    const x = padding.left + (count > 1 ? idx * step : innerW / 2);
                    const colWidth = count > 1 ? step : innerW;

                    return (
                      <rect
                        key={`ch-${item.date}`}
                        x={x - colWidth / 2}
                        y={padding.top}
                        width={colWidth}
                        height={innerH}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoverIndex(idx)}
                        onMouseMove={() => setHoverIndex(idx)}
                      />
                    );
                  })}

                  {/* Guide line */}
                  {activeHoverPoint && (
                    <line
                      x1={activeHoverPoint.x}
                      y1={padding.top}
                      x2={activeHoverPoint.x}
                      y2={padding.top + innerH}
                      stroke="#3B82F6"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      className="pointer-events-none"
                    />
                  )}
                </svg>

                {/* Hover Tooltip Box */}
                {activeHoverData && activeHoverPoint && (
                  <div
                    className="absolute z-20 pointer-events-none transition-all duration-75 ease-out shadow-lg bg-stone-900/95 text-white rounded-lg p-2.5 text-xs w-44 border border-stone-800"
                    style={{
                      top: '0px',
                      left: `${Math.min(Math.max(activeHoverPoint.x - 88, 5), width - 180)}px`,
                    }}
                  >
                    <div className="flex items-center space-x-1.5 pb-1 mb-1 border-b border-stone-800 font-medium text-stone-300 text-[11px]">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      <span>{formatFullDate(activeHoverData.date)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-300">New Registrations:</span>
                      <span className="font-mono font-bold text-blue-400">
                        {activeHoverData.newCustomers}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export const CustomerGrowthChart = CustomerGrowthCard;
export default CustomerGrowthCard;
