/**
 * Order Constants
 * Centralized constants for order management
 */

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export const ORDER_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type OrderPriority = typeof ORDER_PRIORITY[keyof typeof ORDER_PRIORITY];

export const ORDER_TYPE = {
  STANDARD: 'standard',
  DRIP_FEED: 'drip_feed',
  BULK: 'bulk',
  CUSTOM: 'custom',
} as const;

export type OrderType = typeof ORDER_TYPE[keyof typeof ORDER_TYPE];

/**
 * Order status transitions - defines which status changes are allowed
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUS.PENDING]: [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.FAILED,
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.IN_PROGRESS,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.FAILED,
  ],
  [ORDER_STATUS.IN_PROGRESS]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.PARTIAL,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.FAILED,
  ],
  [ORDER_STATUS.COMPLETED]: [
    ORDER_STATUS.REFUNDED, // Only allow refund from completed
  ],
  [ORDER_STATUS.PARTIAL]: [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.REFUNDED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.CANCELLED]: [], // Terminal state
  [ORDER_STATUS.REFUNDED]: [], // Terminal state
  [ORDER_STATUS.FAILED]: [
    ORDER_STATUS.PENDING, // Allow retry
    ORDER_STATUS.REFUNDED,
  ],
};

/**
 * Order status descriptions for user display
 */
export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Order is waiting to be processed',
  [ORDER_STATUS.PROCESSING]: 'Order is being prepared for execution',
  [ORDER_STATUS.IN_PROGRESS]: 'Order is currently being fulfilled',
  [ORDER_STATUS.COMPLETED]: 'Order has been completed successfully',
  [ORDER_STATUS.PARTIAL]: 'Order has been partially completed',
  [ORDER_STATUS.CANCELLED]: 'Order has been cancelled',
  [ORDER_STATUS.REFUNDED]: 'Order has been refunded',
  [ORDER_STATUS.FAILED]: 'Order has failed to complete',
};

/**
 * Order priority weights for queue processing
 */
export const ORDER_PRIORITY_WEIGHTS: Record<OrderPriority, number> = {
  [ORDER_PRIORITY.LOW]: 1,
  [ORDER_PRIORITY.MEDIUM]: 2,
  [ORDER_PRIORITY.HIGH]: 3,
  [ORDER_PRIORITY.URGENT]: 5,
};

/**
 * Default order limits
 */
export const ORDER_LIMITS = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 1000000,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 10000,
  MAX_ORDERS_PER_USER_PER_DAY: 100,
  MAX_ORDERS_PER_USER_PER_HOUR: 10,
} as const;

/**
 * Order completion thresholds
 */
export const ORDER_COMPLETION_THRESHOLDS = {
  PARTIAL_THRESHOLD: 0.8, // 80% completion considered partial
  COMPLETION_THRESHOLD: 0.95, // 95% completion considered complete
} as const;

/**
 * Order timeout settings (in milliseconds)
 */
export const ORDER_TIMEOUTS = {
  PROCESSING_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  IN_PROGRESS_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PROVIDER_RESPONSE_TIMEOUT: 30 * 1000, // 30 seconds
} as const;

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) || false;
}

/**
 * Get next possible statuses for current status
 */
export function getNextPossibleStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if order status is terminal (no further transitions allowed)
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Check if order status indicates completion
 */
export function isCompletedStatus(status: OrderStatus): boolean {
  return [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIAL].includes(status);
}

/**
 * Check if order status indicates failure
 */
export function isFailedStatus(status: OrderStatus): boolean {
  return [ORDER_STATUS.FAILED, ORDER_STATUS.CANCELLED].includes(status);
}

/**
 * Check if order can be cancelled
 */
export function canBeCancelled(status: OrderStatus): boolean {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.IN_PROGRESS,
    ORDER_STATUS.PARTIAL,
  ].includes(status);
}

/**
 * Check if order can be refunded
 */
export function canBeRefunded(status: OrderStatus): boolean {
  return [
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.PARTIAL,
    ORDER_STATUS.FAILED,
  ].includes(status);
}

/**
 * Get order status color for UI
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    [ORDER_STATUS.PENDING]: '#FFA500', // Orange
    [ORDER_STATUS.PROCESSING]: '#1E90FF', // DodgerBlue
    [ORDER_STATUS.IN_PROGRESS]: '#32CD32', // LimeGreen
    [ORDER_STATUS.COMPLETED]: '#228B22', // ForestGreen
    [ORDER_STATUS.PARTIAL]: '#FFD700', // Gold
    [ORDER_STATUS.CANCELLED]: '#DC143C', // Crimson
    [ORDER_STATUS.REFUNDED]: '#9370DB', // MediumPurple
    [ORDER_STATUS.FAILED]: '#B22222', // FireBrick
  };

  return colors[status] || '#808080'; // Gray as default
}

/**
 * Get order priority color for UI
 */
export function getOrderPriorityColor(priority: OrderPriority): string {
  const colors: Record<OrderPriority, string> = {
    [ORDER_PRIORITY.LOW]: '#90EE90', // LightGreen
    [ORDER_PRIORITY.MEDIUM]: '#FFD700', // Gold
    [ORDER_PRIORITY.HIGH]: '#FFA500', // Orange
    [ORDER_PRIORITY.URGENT]: '#FF4500', // OrangeRed
  };

  return colors[priority] || '#808080'; // Gray as default
}
