import { useState, useMemo } from 'react';
import {
  Check,
  X,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge.jsx';
import Button from '../ui/Button.jsx';
import { deriveLifecycleStages } from '../../utils/orderLifecycle.js';

function formatFullDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Compact Horizontal Order Lifecycle Progress Bar for Sinka Admin Order Details.
 * Standard e-commerce progress tracker: ~150-180px tall.
 * Zero timestamps under stages; full historical timestamps isolated to expandable History drawer.
 *
 * @param {object} props
 * @param {object} props.order - Master order object from backend
 * @param {Array<string>} props.allowedTransitions - Permitted next statuses from state machine
 * @param {boolean} props.terminal - Whether the order is in a terminal status
 * @param {(status: string) => void} props.onTransitionClick - Callback to initiate status transition modal
 * @param {(status: string) => string} props.getTransitionButtonVariant - Styling helper for action button
 * @param {(status: string) => string} props.getTransitionLabel - Label helper for action button
 */
export function OrderLifecycleProgress({
  order,
  allowedTransitions = [],
  terminal = false,
  onTransitionClick,
  getTransitionButtonVariant,
  getTransitionLabel,
}) {
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const currentStatus = order?.status || 'PENDING';
  const historyList = useMemo(
    () => (Array.isArray(order?.statusHistory) ? order.statusHistory : []),
    [order?.statusHistory]
  );

  const stages = useMemo(
    () => deriveLifecycleStages(currentStatus, historyList),
    [currentStatus, historyList]
  );

  if (!order) return null;

  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';

  return (
    <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-xs font-sans">
      {/* 1. Header Bar: Stage Label, Current Status, Action Buttons & History Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Order Lifecycle Stage
            </span>
            <OrderStatusBadge status={currentStatus} size="sm" />
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Current Status: <span className="font-semibold text-stone-900">{currentStatus}</span>
            {isCancelled && (
              <span className="text-rose-600 font-medium ml-1.5">
                (Order fulfillment terminated)
              </span>
            )}
          </p>
        </div>

        {/* Actions & History Button */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {terminal ? (
            <span className="inline-flex items-center text-xs text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md font-medium border border-stone-200">
              Terminal Status
            </span>
          ) : allowedTransitions.length > 0 ? (
            allowedTransitions.map((nextStatus) => {
              const variant = getTransitionButtonVariant
                ? getTransitionButtonVariant(nextStatus)
                : nextStatus === 'CANCELLED'
                ? 'secondary'
                : 'primary';

              const label = getTransitionLabel ? getTransitionLabel(nextStatus) : nextStatus;

              return (
                <Button
                  key={nextStatus}
                  variant={variant}
                  size="sm"
                  onClick={() => onTransitionClick && onTransitionClick(nextStatus)}
                >
                  {label}
                </Button>
              );
            })
          ) : (
            <span className="text-xs text-stone-400">No active transitions</span>
          )}

          {/* History Toggle Button */}
          {historyList.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHistoryExpanded((prev) => !prev)}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer"
              title="Toggle detailed lifecycle transition history"
              aria-expanded={isHistoryExpanded}
            >
              <History className="w-3.5 h-3.5 text-brand-primary" />
              <span>History ({historyList.length})</span>
              {isHistoryExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Compact Horizontal Lifecycle Progress Tracker */}
      <div className="pt-5 pb-2 overflow-x-auto -mx-5 px-5 scrollbar-thin">
        <div className="min-w-[620px] flex items-start justify-between relative px-3">
          {stages.map((stage, idx) => {
            const isLast = idx === stages.length - 1;
            const isCompleted = stage.state === 'completed';
            const isCurrent = stage.state === 'current';
            const isStageCancelled = stage.state === 'cancelled';
            const isUpcoming = stage.state === 'upcoming';

            // Connector line styling to the next stage
            const nextStage = stages[idx + 1];
            const hasNextLine = !isLast && nextStage;
            const isNextCompletedOrCurrent =
              hasNextLine && (nextStage.state === 'completed' || nextStage.state === 'current');
            const isNextCancelled = hasNextLine && nextStage.state === 'cancelled';

            return (
              <div
                key={stage.key}
                className="flex-1 flex flex-col items-center relative group"
              >
                {/* Horizontal Connector Line passing directly through circle centers */}
                {hasNextLine && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-[2px] -translate-y-1/2 -z-0 transition-colors ${
                      isNextCancelled
                        ? 'bg-rose-400'
                        : isCompleted && isNextCompletedOrCurrent
                        ? 'bg-brand-primary'
                        : 'bg-stone-200'
                    }`}
                  />
                )}

                {/* Node Circle Wrapper (Height 32px, centered at top-4 = 16px) */}
                <div className="w-8 h-8 flex items-center justify-center relative z-10">
                  {isCompleted && (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-2xs"
                      title={`${stage.label} — Completed`}
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.8]" />
                    </div>
                  )}

                  {isCurrent && (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-xs ring-4 ring-brand-primary/15"
                      title={`${stage.label} — Current Status`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}

                  {isUpcoming && (
                    <div
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-stone-300 flex items-center justify-center"
                      title={`${stage.label} — Upcoming`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                    </div>
                  )}

                  {isStageCancelled && (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs ring-4 ring-rose-100"
                      title={`${stage.label} — Cancelled`}
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.8]" />
                    </div>
                  )}
                </div>

                {/* Stage Text (Close to circle; no timestamps) */}
                <div className="mt-2 text-center max-w-[95px]">
                  <span
                    className={`text-xs block leading-tight ${
                      isCurrent
                        ? 'font-bold text-brand-primary'
                        : isCompleted
                        ? 'font-semibold text-stone-800'
                        : isStageCancelled
                        ? 'font-bold text-rose-700'
                        : 'font-medium text-stone-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed History Drawer (Only appears when requested) */}
      {isHistoryExpanded && historyList.length > 0 && (
        <div className="pt-3 mt-3 border-t border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5 text-brand-primary" />
              <span>Lifecycle History Log</span>
            </h3>
            <span className="text-[11px] text-stone-400 font-mono">
              {historyList.length} {historyList.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {historyList
              .slice()
              .reverse()
              .map((event, idx) => {
                const isCancellation =
                  event.toStatus === 'CANCELLED' || event.toStatus === 'REJECTED';

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                      isCancellation
                        ? 'bg-rose-50/60 border-rose-200/80 text-rose-900'
                        : 'bg-stone-50/80 border-stone-200/70 text-stone-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isCancellation ? 'bg-rose-600' : 'bg-brand-primary'
                          }`}
                        />
                        <span className="font-semibold text-stone-900">
                          {event.fromStatus ? `${event.fromStatus} → ` : ''}
                          <span
                            className={isCancellation ? 'text-rose-700 font-bold' : 'text-stone-900'}
                          >
                            {event.toStatus}
                          </span>
                        </span>
                      </div>

                      <span className="text-[11px] text-stone-400 font-sans">
                        {formatFullDateTime(event.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>
                        Changed by:{' '}
                        <span className="font-mono text-stone-700 font-medium">
                          {event.changedBy || 'System'}
                        </span>
                      </span>
                    </div>

                    {event.note && (
                      <p className="mt-1 pt-1 border-t border-stone-200/50 text-[11px] text-stone-600 italic">
                        Note: &ldquo;{event.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderLifecycleProgress;
