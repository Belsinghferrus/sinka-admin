import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Layers,
} from 'lucide-react';
import dashboardService from '../../services/dashboard.service.js';
import {
  ORDERS_ANALYTICS_SERIES as SERIES_CONFIG,
  ORDERS_ANALYTICS_RANGES as RANGES,
} from '../../constants.js';

/**
 * Computes smooth cubic Bézier SVG path data passing through an array of { x, y } points.
 * Ensures the curve stays within the valid chart bounds.
 *
 * @param {Array<{ x: number, y: number }>} points
 * @param {number} bottomY - Bottom clamping boundary
 * @returns {string} SVG path string
 */
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

    // Prevent overshoot below baseline
    if (bottomY !== undefined) {
      cp1y = Math.min(cp1y, bottomY);
      cp2y = Math.min(cp2y, bottomY);
    }

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

/**
 * Format date string "YYYY-MM-DD" to human readable format.
 */
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
 * Orders Overview interactive multi-line chart component for Sinka Admin Dashboard.
 * Consumes real backend MongoDB aggregation data via GET /api/admin/dashboard/analytics.
 */
export function OrdersAnalyticsChart({
  trend,
  range: controlledRange,
  onRangeChange,
  isLoading: controlledLoading,
  error: controlledError,
}) {
  const [internalRange, setInternalRange] = useState('7d');
  const [internalData, setInternalData] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const activeRange = controlledRange || internalRange;
  const isControlledData = Array.isArray(trend);
  const isLoading = controlledLoading !== undefined ? controlledLoading : internalLoading;
  const error = controlledError !== undefined ? controlledError : internalError;

  // Series visibility toggle state for all 8 canonical order lifecycle stages
  const [visibleSeries, setVisibleSeries] = useState({
    total: true,
    pending: true,
    accepted: true,
    processing: true,
    packed: true,
    shipped: true,
    delivered: true,
    cancelled: true,
  });

  // Active hover tooltip state
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartContainerRef = useRef(null);

  const fetchAnalytics = useCallback(async (selectedRange) => {
    if (isControlledData) return;
    setInternalLoading(true);
    setInternalError(null);
    try {
      const response = await dashboardService.getOrdersAnalytics(selectedRange);
      setInternalData(response);
    } catch (err) {
      setInternalError(err.message || 'Unable to load order analytics.');
    } finally {
      setInternalLoading(false);
    }
  }, [isControlledData]);

  useEffect(() => {
    if (!isControlledData) {
      fetchAnalytics(activeRange);
    }
  }, [activeRange, isControlledData, fetchAnalytics]);

  const handleRangeSelect = (newRange) => {
    if (onRangeChange) {
      onRangeChange(newRange);
    } else {
      setInternalRange(newRange);
    }
  };

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => {
      // Don't allow hiding all series at once
      const activeKeys = Object.entries(prev).filter(([, v]) => v).map(([k]) => k);
      if (activeKeys.length === 1 && activeKeys[0] === key) {
        return prev;
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  const series = useMemo(() => {
    if (isControlledData) return trend;
    return internalData?.series || [];
  }, [isControlledData, trend, internalData?.series]);

  // Determine whether all order counts are genuinely 0
  const isPeriodEmpty = useMemo(() => {
    if (!series || series.length === 0) return true;
    return series.every((item) => Number(item.total) === 0);
  }, [series]);

  // Aggregate summary totals for quick KPI chips
  const totalsSummary = useMemo(() => {
    return series.reduce(
      (acc, curr) => {
        acc.total += curr.total || 0;
        acc.pending += curr.pending || 0;
        acc.accepted += curr.accepted || 0;
        acc.processing += curr.processing || 0;
        acc.packed += curr.packed || 0;
        acc.shipped += curr.shipped || 0;
        acc.delivered += curr.delivered || 0;
        acc.cancelled += curr.cancelled || 0;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        accepted: 0,
        processing: 0,
        packed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      }
    );
  }, [series]);

  // Chart coordinate calculations
  // Virtual canvas dimensions: 840 x 210 — compact for side-by-side column layout
  const svgWidth = 840;
  const svgHeight = 210;
  const padding = useMemo(() => ({ top: 20, right: 20, bottom: 35, left: 42 }), []);
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Compute maximum Y value across all visible series to set scale dynamically
  const maxY = useMemo(() => {
    if (!series || series.length === 0) return 5;
    let max = 0;
    for (const item of series) {
      if (visibleSeries.total && item.total > max) max = item.total;
      if (visibleSeries.pending && item.pending > max) max = item.pending;
      if (visibleSeries.accepted && item.accepted > max) max = item.accepted;
      if (visibleSeries.processing && item.processing > max) max = item.processing;
      if (visibleSeries.packed && item.packed > max) max = item.packed;
      if (visibleSeries.shipped && item.shipped > max) max = item.shipped;
      if (visibleSeries.delivered && item.delivered > max) max = item.delivered;
      if (visibleSeries.cancelled && item.cancelled > max) max = item.cancelled;
    }
    if (max === 0) return 5;
    if (max <= 5) return 5;
    if (max <= 10) return 10;
    if (max <= 20) return 20;
    if (max <= 50) return Math.ceil(max / 5) * 5;
    return Math.ceil(max / 10) * 10;
  }, [series, visibleSeries]);

  // Generate 4-5 horizontal grid line values
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 4;
    for (let i = 0; i <= count; i++) {
      ticks.push(Math.round((maxY / count) * i));
    }
    return [...new Set(ticks)].sort((a, b) => a - b);
  }, [maxY]);

  // Map series to coordinates
  const pointsBySeries = useMemo(() => {
    if (!series || series.length === 0) return {};
    const count = series.length;
    const xStep = count > 1 ? innerWidth / (count - 1) : innerWidth / 2;

    const result = {};
    for (const config of SERIES_CONFIG) {
      const key = config.key;
      result[key] = series.map((item, idx) => {
        const val = Number(item[key]) || 0;
        const x = padding.left + (count > 1 ? idx * xStep : innerWidth / 2);
        const y = padding.top + innerHeight - (val / maxY) * innerHeight;
        return { x, y, value: val, date: item.date };
      });
    }
    return result;
  }, [series, innerWidth, innerHeight, padding.left, padding.top, maxY]);

  // Helper for tooltip positioning
  const activeHoverData = hoverIndex !== null && series[hoverIndex] ? series[hoverIndex] : null;
  const activeHoverPointX =
    hoverIndex !== null && pointsBySeries.total && pointsBySeries.total[hoverIndex]
      ? pointsBySeries.total[hoverIndex].x
      : null;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs font-sans space-y-3">
      {/* 1. Header: Title, Description, Period Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-md bg-stone-100 text-stone-700">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
            </span>
            <h2 className="text-lg font-heading font-semibold text-stone-900 tracking-tight">
              Orders Overview
            </h2>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Order activity and fulfillment status over time.
          </p>
        </div>

        {/* Range Controls: 7D, 14D, 30D, 90D, 1Y */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-stone-100/90 p-1 rounded-lg border border-stone-200/80">
          {RANGES.map((r) => {
            const isActive = activeRange === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRangeSelect(r.key)}
                disabled={isLoading && activeRange === r.key}
                aria-pressed={isActive}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
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
      </div>

      {/* 2. Interactive KPI Mini-Chips */}
      {!isLoading && !error && !isPeriodEmpty && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-0.5">
          {SERIES_CONFIG.map((cfg) => {
            const isVisible = visibleSeries[cfg.key];
            const count = totalsSummary[cfg.key] || 0;
            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => toggleSeries(cfg.key)}
                className={`p-1.5 rounded-lg border text-left transition-all duration-150 select-none ${
                  isVisible
                    ? 'bg-stone-50/70 border-stone-200/80 hover:border-stone-300'
                    : 'bg-stone-100/40 border-dashed border-stone-200 opacity-60 hover:opacity-80'
                }`}
                title={`Click to ${isVisible ? 'hide' : 'show'} ${cfg.label} on chart`}
              >
                <div className="flex items-center space-x-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-[10px] font-medium text-stone-600 truncate">
                    {cfg.label}
                  </span>
                </div>
                <div className="mt-0.5 flex items-baseline justify-between">
                  <span className="text-sm font-heading font-bold text-stone-900">
                    {count.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {isVisible ? 'on' : 'off'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main Chart Canvas Area */}
      <div
        ref={chartContainerRef}
        className="relative w-full min-h-[200px] flex items-center justify-center select-none"
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="w-full h-[200px] flex flex-col justify-between py-5 px-4 animate-pulse">
            <div className="flex justify-between items-center">
              <span className="w-32 h-4 bg-stone-200 rounded" />
              <span className="w-24 h-3 bg-stone-200 rounded" />
            </div>
            <div className="space-y-6">
              <div className="w-full h-px bg-stone-200" />
              <div className="w-full h-px bg-stone-200" />
              <div className="w-full h-px bg-stone-200" />
              <div className="w-full h-px bg-stone-200" />
            </div>
            <div className="flex justify-between text-xs text-stone-300 pt-2">
              <span className="w-10 h-2.5 bg-stone-200 rounded" />
              <span className="w-10 h-2.5 bg-stone-200 rounded" />
              <span className="w-10 h-2.5 bg-stone-200 rounded" />
              <span className="w-10 h-2.5 bg-stone-200 rounded" />
              <span className="w-10 h-2.5 bg-stone-200 rounded" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">
                Unable to load order analytics
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">Please retry or check network.</p>
            </div>
            <button
              type="button"
              onClick={() => fetchAnalytics(activeRange)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-md shadow-xs hover:bg-brand-primary-hover transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State (genuinely zero orders in timeframe) */}
        {!isLoading && !error && isPeriodEmpty && (
          <div className="w-full py-14 flex flex-col items-center justify-center text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-sm font-semibold text-stone-800">
              No order activity for this period.
            </p>
            <p className="text-xs text-stone-500 max-w-sm">
              As orders are placed, volume trends and fulfillment breakdowns will appear here.
            </p>
          </div>
        )}

        {/* Render Chart when data is ready */}
        {!isLoading && !error && !isPeriodEmpty && (
          <div className="w-full relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible"
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Horizontal Grid Lines & Y-Axis Labels */}
              {yTicks.map((val) => {
                const y = padding.top + innerHeight - (val / maxY) * innerHeight;
                return (
                  <g key={`ytick-${val}`}>
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
                      {val.toLocaleString('en-IN')}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Dates & Minor Tick Marks */}
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
                  <g key={`xtick-${item.date}`}>
                    {showLabel && (
                      <text
                        x={x}
                        y={svgHeight - 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#78716C"
                        className="font-sans font-medium"
                      >
                        {formatDateLabel(item.date)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Multi-Line Curves (rendered in background-to-foreground sequence) */}
              {SERIES_CONFIG.map((cfg) => {
                if (!visibleSeries[cfg.key]) return null;
                const points = pointsBySeries[cfg.key];
                if (!points || points.length === 0) return null;
                const pathString = getSmoothPath(points, padding.top + innerHeight);

                return (
                  <g key={`path-${cfg.key}`}>
                    {/* Shadow / outline line for clarity when lines overlap */}
                    <path
                      d={pathString}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={cfg.strokeWidth + 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Primary semantic curve */}
                    <path
                      d={pathString}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth={cfg.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-opacity duration-200"
                    />
                  </g>
                );
              })}

              {/* Circular Data Nodes (rendered on top of paths) */}
              {SERIES_CONFIG.map((cfg) => {
                if (!visibleSeries[cfg.key]) return null;
                const points = pointsBySeries[cfg.key];
                if (!points) return null;

                return (
                  <g key={`dots-${cfg.key}`}>
                    {points.map((pt, pIdx) => {
                      const isHovered = hoverIndex === pIdx;
                      return (
                        <circle
                          key={`dot-${cfg.key}-${pIdx}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? cfg.dotRadius + 2 : cfg.dotRadius}
                          fill="#FFFFFF"
                          stroke={cfg.color}
                          strokeWidth={isHovered ? 2.5 : 2}
                          className="transition-all duration-150 pointer-events-none"
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Interactive Hover Columns & Crosshairs */}
              {series.map((item, idx) => {
                const count = series.length;
                const xStep = count > 1 ? innerWidth / (count - 1) : innerWidth / 2;
                const x = padding.left + (count > 1 ? idx * xStep : innerWidth / 2);
                const colWidth = count > 1 ? xStep : innerWidth;

                return (
                  <rect
                    key={`hit-${item.date}`}
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

              {/* Hover Crosshair Guide Line */}
              {activeHoverPointX !== null && (
                <line
                  x1={activeHoverPointX}
                  y1={padding.top}
                  x2={activeHoverPointX}
                  y2={padding.top + innerHeight}
                  stroke="#78716C"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />
              )}
            </svg>

            {/* Floating Tooltip Box */}
            {activeHoverData && (
              <div
                className="absolute z-20 pointer-events-none transition-all duration-75 ease-out shadow-lg bg-stone-900/95 text-white rounded-lg p-3 text-xs w-56 border border-stone-800"
                style={{
                  top: '12px',
                  left: `${Math.min(
                    Math.max(activeHoverPointX - 112, 10),
                    svgWidth - 230
                  )}px`,
                }}
              >
                <div className="flex items-center space-x-1.5 pb-2 mb-2 border-b border-stone-800 font-medium text-stone-300">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>{formatFullDate(activeHoverData.date)}</span>
                </div>

                <div className="space-y-1.5">
                  {SERIES_CONFIG.map((cfg) => {
                    const isVisible = visibleSeries[cfg.key];
                    const count = activeHoverData[cfg.key] || 0;
                    return (
                      <div
                        key={cfg.key}
                        className={`flex items-center justify-between space-x-3 ${
                          !isVisible ? 'opacity-40 line-through' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cfg.color }}
                          />
                          <span className="text-stone-300 font-medium">
                            {cfg.label}:
                          </span>
                        </div>
                        <span className="font-mono font-bold text-white">
                          {count.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Interactive Legend (Toggle Individual Series) */}
      {!isLoading && !error && !isPeriodEmpty && (
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-stone-400">
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px]">Click legend pills to toggle series lines:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SERIES_CONFIG.map((cfg) => {
              const isVisible = visibleSeries[cfg.key];
              return (
                <button
                  key={cfg.key}
                  type="button"
                  onClick={() => toggleSeries(cfg.key)}
                  aria-pressed={isVisible}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all select-none border ${
                    isVisible
                      ? 'bg-white border-stone-300 text-stone-800 shadow-2xs hover:bg-stone-50'
                      : 'bg-stone-100 border-stone-200 text-stone-400 line-through hover:text-stone-600'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export const OrdersOverviewChart = OrdersAnalyticsChart;
export default OrdersAnalyticsChart;
