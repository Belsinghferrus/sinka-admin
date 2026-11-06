import { useState, useMemo, useRef } from 'react';
import { IndianRupee, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency.js';

function getSmoothPath(points, bottomY) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    if (bottomY !== undefined) {
      cp1y = Math.min(cp1y, bottomY);
      cp2y = Math.min(cp2y, bottomY);
    }

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
 * Revenue Overview Chart Component with Indian Currency Formatting.
 * Shows revenue trend, period total, and average order value.
 *
 * @param {object} props
 * @param {Array<{ date: string, revenue: number }>} props.trend
 * @param {number} props.periodTotal
 * @param {number} props.averageOrderValue
 * @param {boolean} props.isLoading
 */
export function RevenueAnalyticsChart({
  trend = [],
  periodTotal = 0,
  averageOrderValue = 0,
  isLoading = false,
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartRef = useRef(null);

  const series = useMemo(() => trend || [], [trend]);
  const isPeriodEmpty = useMemo(() => {
    return !series || series.length === 0 || series.every((s) => Number(s.revenue) === 0);
  }, [series]);

  const svgWidth = 840;
  const svgHeight = 280;
  const padding = useMemo(() => ({ top: 30, right: 30, bottom: 45, left: 65 }), []);
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const maxRevenue = useMemo(() => {
    if (!series || series.length === 0) return 10000;
    const max = Math.max(...series.map((s) => Number(s.revenue) || 0));
    if (max <= 0) return 10000;
    if (max <= 50000) return Math.ceil(max / 10000) * 10000;
    if (max <= 200000) return Math.ceil(max / 25000) * 25000;
    return Math.ceil(max / 50000) * 50000;
  }, [series]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round((maxRevenue / count) * i));
    }
    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [maxRevenue]);

  const points = useMemo(() => {
    if (!series || series.length === 0) return [];
    const count = series.length;
    const xStep = count > 1 ? innerWidth / (count - 1) : innerWidth / 2;

    return series.map((item, idx) => {
      const val = Number(item.revenue) || 0;
      const x = padding.left + (count > 1 ? idx * xStep : innerWidth / 2);
      const y = padding.top + innerHeight - (val / maxRevenue) * innerHeight;
      return { x, y, value: val, date: item.date };
    });
  }, [series, innerWidth, innerHeight, padding.left, padding.top, maxRevenue]);

  const areaPath = useMemo(() => {
    if (!points || points.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    const linePath = getSmoothPath(points, bottomY);
    if (!linePath) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [points, padding.top, innerHeight]);

  const linePath = useMemo(() => {
    return getSmoothPath(points, padding.top + innerHeight);
  }, [points, padding.top, innerHeight]);

  const activeHoverData = hoverIndex !== null && series[hoverIndex] ? series[hoverIndex] : null;
  const activeHoverPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs font-sans space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </span>
            <h3 className="text-base font-heading font-semibold text-stone-900 tracking-tight">
              Revenue Overview
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">
            Revenue generated during the selected period.
          </p>
        </div>

        {/* Financial Highlights */}
        <div className="flex items-center space-x-4 self-start sm:self-auto bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/80">
          <div>
            <span className="text-[10px] uppercase font-semibold text-stone-400 block">Period Total</span>
            <span className="text-sm font-heading font-bold text-stone-900">
              {formatCurrency(periodTotal)}
            </span>
          </div>
          <div className="w-px h-6 bg-stone-200" />
          <div>
            <span className="text-[10px] uppercase font-semibold text-stone-400 block">Avg Order Value</span>
            <span className="text-sm font-heading font-bold text-stone-900">
              {formatCurrency(averageOrderValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative min-h-[260px] flex items-center justify-center">
        {isLoading && (
          <div className="w-full h-[260px] flex flex-col justify-between py-6 px-4 animate-pulse">
            <div className="space-y-6">
              <div className="w-full h-px bg-stone-200" />
              <div className="w-full h-px bg-stone-200" />
              <div className="w-full h-px bg-stone-200" />
              <div className="w-full h-px bg-stone-200" />
            </div>
          </div>
        )}

        {!isLoading && isPeriodEmpty && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-stone-400">
            <IndianRupee className="w-8 h-8 stroke-1 text-stone-300" />
            <p className="text-xs font-semibold text-stone-700">No revenue recorded in this period</p>
            <p className="text-[11px] text-stone-400">
              Realized customer payments will plot along this curve.
            </p>
          </div>
        )}

        {!isLoading && !isPeriodEmpty && (
          <div ref={chartRef} className="w-full relative select-none">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible"
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Amount Labels */}
              {yTicks.map((val) => {
                const y = padding.top + innerHeight - (val / maxRevenue) * innerHeight;
                return (
                  <g key={`y-${val}`}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + innerWidth}
                      y2={y}
                      stroke="#E7E5E4"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      fill="#78716C"
                      className="font-mono"
                    >
                      {formatCurrency(val)}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Dates */}
              {series.map((item, idx) => {
                const count = series.length;
                const xStep = count > 1 ? innerWidth / (count - 1) : innerWidth / 2;
                const x = padding.left + (count > 1 ? idx * xStep : innerWidth / 2);
                const showLabel =
                  count <= 10 ||
                  idx === 0 ||
                  idx === count - 1 ||
                  (count <= 15 && idx % 2 === 0) ||
                  (count > 15 && idx % Math.ceil(count / 7) === 0);

                return (
                  <g key={`x-${item.date}`}>
                    {showLabel && (
                      <text
                        x={x}
                        y={svgHeight - 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#78716C"
                        className="font-medium font-sans"
                      >
                        {formatDateLabel(item.date)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Smooth Area Gradient Fill */}
              {areaPath && (
                <path d={areaPath} fill="url(#revenueAreaGrad)" className="transition-all duration-300" />
              )}

              {/* Main Curve */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Point Markers */}
              {points.map((pt, pIdx) => {
                const isHovered = hoverIndex === pIdx;
                return (
                  <circle
                    key={`p-${pIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#10B981"
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-150 pointer-events-none"
                  />
                );
              })}

              {/* Hover Rectangles */}
              {series.map((item, idx) => {
                const count = series.length;
                const xStep = count > 1 ? innerWidth / (count - 1) : innerWidth / 2;
                const x = padding.left + (count > 1 ? idx * xStep : innerWidth / 2);
                const colWidth = count > 1 ? xStep : innerWidth;

                return (
                  <rect
                    key={`h-${item.date}`}
                    x={x - colWidth / 2}
                    y={padding.top}
                    width={colWidth}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseMove={() => setHoverIndex(idx)}
                  />
                );
              })}

              {/* Vertical Guide Line */}
              {activeHoverPoint && (
                <line
                  x1={activeHoverPoint.x}
                  y1={padding.top}
                  x2={activeHoverPoint.x}
                  y2={padding.top + innerHeight}
                  stroke="#10B981"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* Hover Tooltip Box */}
            {activeHoverData && activeHoverPoint && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-75 ease-out shadow-lg bg-stone-900/95 text-white rounded-lg p-3 text-xs w-52 border border-stone-800"
                style={{
                  top: '12px',
                  left: `${Math.min(Math.max(activeHoverPoint.x - 104, 10), svgWidth - 218)}px`,
                }}
              >
                <div className="flex items-center space-x-1.5 pb-2 mb-2 border-b border-stone-800 font-medium text-stone-300">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>{formatFullDate(activeHoverData.date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-300">Revenue:</span>
                  <span className="font-heading font-bold text-emerald-400">
                    {formatCurrency(activeHoverData.revenue)}
                  </span>
                </div>
                {activeHoverData.orders !== undefined && (
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
                    <span>Orders Placed:</span>
                    <span className="font-mono text-stone-200">{activeHoverData.orders}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const RevenueOverviewChart = RevenueAnalyticsChart;
export default RevenueAnalyticsChart;
