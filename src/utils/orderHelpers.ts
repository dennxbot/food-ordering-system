/**
 * Order cancellation window configuration
 */
export const ORDER_CONFIG = {
  // Time window in minutes for order cancellation
  CANCELLATION_WINDOW: 15,
  // Statuses where cancellation is allowed
  CANCELLABLE_STATUSES: ['pending', 'preparing'] as const,
  // Maximum cancellations allowed per user per day
  MAX_CANCELLATIONS_PER_DAY: 3,
};

/**
 * Check if an order is within its cancellation window
 * @param orderCreatedAt - Order creation timestamp
 * @returns boolean indicating if order can still be cancelled
 */
export const isWithinCancellationWindow = (orderCreatedAt: string): boolean => {
  const orderDate = new Date(orderCreatedAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
  return diffInMinutes <= ORDER_CONFIG.CANCELLATION_WINDOW;
};

/**
 * Check if an order can be cancelled based on its status
 * @param status - Current order status
 * @returns boolean indicating if order status allows cancellation
 */
export const isStatusCancellable = (status: string): boolean => {
  return ORDER_CONFIG.CANCELLABLE_STATUSES.includes(status as any);
};

/**
 * Get formatted cancellation window time remaining
 * @param orderCreatedAt - Order creation timestamp
 * @returns string with formatted time remaining or null if window expired
 */
export const getCancellationTimeRemaining = (orderCreatedAt: string): string | null => {
  const orderDate = new Date(orderCreatedAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60);
  const remainingMinutes = ORDER_CONFIG.CANCELLATION_WINDOW - diffInMinutes;

  if (remainingMinutes <= 0) return null;

  if (remainingMinutes < 1) {
    return `${Math.round(remainingMinutes * 60)} seconds`;
  }

  return `${Math.round(remainingMinutes)} minutes`;
};

/**
 * Format cancellation reason for display
 * @param reason - Cancellation reason code
 * @returns Formatted reason string
 */
export const formatCancellationReason = (reason: string): string => {
  const reasons: { [key: string]: string } = {
    changed_mind: "Changed my mind",
    wrong_order: "Ordered wrong items",
    long_wait: "Wait time too long",
    duplicate: "Duplicate order",
    other: "Other reason"
  };
  return reasons[reason] || reason;
};
