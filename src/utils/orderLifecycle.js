import {
  Clock,
  CheckCircle2,
  Package,
  Box,
  Truck,
  Navigation,
  CheckCheck,
  X,
} from 'lucide-react';

/**
 * Standard forward progression lifecycle stages for Sinka Home & Living.
 */
export const STANDARD_LIFECYCLE_STAGES = [
  { key: 'PENDING', label: 'Pending', icon: Clock },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'PACKED', label: 'Packed', icon: Box },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Navigation },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCheck },
];

/**
 * Derives the active lifecycle stage items based on the order's current status and history.
 * Correctly distinguishes normal forward progression from cancellation branches.
 *
 * @param {string} currentStatus
 * @param {Array<object>} statusHistory
 * @returns {Array<{ key: string, label: string, icon: any, state: 'completed'|'current'|'upcoming'|'cancelled', timestamp: string|null }>}
 */
export function deriveLifecycleStages(currentStatus = 'PENDING', statusHistory = []) {
  const isCancelled = currentStatus === 'CANCELLED' || currentStatus === 'REJECTED';
  const historyList = Array.isArray(statusHistory) ? statusHistory : [];

  // Map each status to the latest timestamp in statusHistory
  const statusTimestampMap = {};
  for (const event of historyList) {
    if (event.toStatus) {
      statusTimestampMap[event.toStatus] = event.timestamp;
    }
  }

  if (!isCancelled) {
    const currentIndex = STANDARD_LIFECYCLE_STAGES.findIndex((s) => s.key === currentStatus);
    const validCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
    const isAllDelivered = currentStatus === 'DELIVERED';

    return STANDARD_LIFECYCLE_STAGES.map((stage, idx) => {
      let state = 'upcoming';
      if (isAllDelivered) {
        state = 'completed';
      } else if (idx < validCurrentIndex) {
        state = 'completed';
      } else if (idx === validCurrentIndex) {
        state = 'current';
      }

      return {
        ...stage,
        state,
        timestamp: statusTimestampMap[stage.key] || null,
      };
    });
  }

  // Cancelled or Rejected order handling
  // Collect stages traversed prior to cancellation
  const traversedSet = new Set(['PENDING']);
  for (const event of historyList) {
    if (event.toStatus && event.toStatus !== 'CANCELLED' && event.toStatus !== 'REJECTED') {
      traversedSet.add(event.toStatus);
    }
    if (event.fromStatus && event.fromStatus !== 'CANCELLED' && event.fromStatus !== 'REJECTED') {
      traversedSet.add(event.fromStatus);
    }
  }

  // Preserve the standard order for traversed stages
  const activeTraversed = STANDARD_LIFECYCLE_STAGES.filter((s) => traversedSet.has(s.key)).map(
    (stage) => ({
      ...stage,
      state: 'completed',
      timestamp: statusTimestampMap[stage.key] || null,
    })
  );

  // Append the terminal cancelled stage
  const cancelLabel = currentStatus === 'REJECTED' ? 'Rejected' : 'Cancelled';
  activeTraversed.push({
    key: currentStatus,
    label: cancelLabel,
    icon: X,
    state: 'cancelled',
    timestamp: statusTimestampMap[currentStatus] || null,
  });

  return activeTraversed;
}

export default {
  STANDARD_LIFECYCLE_STAGES,
  deriveLifecycleStages,
};

