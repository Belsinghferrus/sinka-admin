/**
 * Shared Application Constants for Sinka Admin Panel.
 */

export const APP_NAME = 'Sinka Admin';
export const APP_TITLE = 'Sinka Home & Living Back Office';

export const DEFAULT_API_TIMEOUT = 15000;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ORDERS: '/orders',
  ORDERS_DETAIL: '/orders/:orderId',
  PRODUCTS: '/products',
  PRODUCTS_NEW: '/products/new',
  PRODUCTS_EDIT: '/products/:id/edit',
  OFFERS: '/offers',
  OFFERS_NEW: '/offers/new',
  OFFERS_EDIT: '/offers/:id/edit',
  BANNERS: '/banners',
  BANNERS_NEW: '/banners/new',
  BANNERS_EDIT: '/banners/:id/edit',
};

export const NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    path: ROUTES.DASHBOARD,
  },
  {
    name: 'Orders',
    path: ROUTES.ORDERS,
  },
  {
    name: 'Homepage Banners',
    path: ROUTES.BANNERS,
  },
  {
    name: 'Products',
    path: ROUTES.PRODUCTS,
  },
  {
    name: 'Promotional Offers',
    path: ROUTES.OFFERS,
  },
];

/**
 * Canonical Sinka Furniture Categories.
 * Strictly aligned with backend ALLOWED_CATEGORIES and storefront filters.
 */
export const PRODUCT_CATEGORIES = [
  { value: 'sofas', label: 'Sofas & Couches' },
  { value: 'beds', label: 'Beds' },
  { value: 'mattresses', label: 'Mattresses' },
  { value: 'dining', label: 'Dining Tables & Sets' },
  { value: 'tv-units', label: 'TV Units' },
  { value: 'sofa-cum-beds', label: 'Sofa Cum Beds' },
  { value: 'coffee-tables', label: 'Coffee Tables' },
  { value: 'study-tables', label: 'Study Tables' },
  { value: 'wardrobes', label: 'Wardrobes' },
  { value: 'cabinets-sideboards', label: 'Cabinets & Sideboards' },
];

/**
 * Cloudflare R2 Upload Limits enforced by backend
 */
export const MAX_PRODUCT_IMAGES_PER_REQUEST = 10;
export const MAX_PRODUCT_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Cloudflare R2 Promotional Offer Banner Limits
 * Supports JPG, JPEG, PNG, and WebP up to 5 MB.
 */
export const MAX_OFFER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_OFFER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_OFFER_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Cloudflare R2 Homepage Hero Banner Limits
 * Supports JPEG, PNG, WebP, and AVIF up to 8 MB under the banners/ prefix.
 */
export const MAX_BANNER_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED_BANNER_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const ALLOWED_BANNER_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

/**
 * Standard Order Lifecycle Statuses for Sinka Home & Living.
 * Aligned with backend orderStatus.service.js.
 */
export const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
];

/**
 * UI presentation configuration for Order Statuses.
 */
export const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    description: 'Order placed, awaiting administrative acceptance or payment confirmation.',
  },
  ACCEPTED: {
    label: 'Accepted',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
    description: 'Order accepted and queued for fulfillment.',
  },
  PROCESSING: {
    label: 'Processing',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dotClass: 'bg-indigo-500',
    description: 'Items are being assembled or prepared in the warehouse.',
  },
  PACKED: {
    label: 'Packed',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
    description: 'Items are boxed, crated, and ready for courier pickup.',
  },
  SHIPPED: {
    label: 'Shipped',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
    description: 'Dispatched with logistics provider and assigned tracking AWB.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-600',
    description: 'Package has reached local hub and is out with delivery agent.',
  },
  DELIVERED: {
    label: 'Delivered',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    description: 'Package delivered to the recipient. (Terminal state)',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    description: 'Order cancelled. Inventory reserved has been restored. (Terminal state)',
  },
  REJECTED: {
    label: 'Rejected',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-300',
    dotClass: 'bg-stone-500',
    description: 'Order rejected by merchant. Inventory has been restored. (Terminal state)',
  },
};

/**
 * Order Status State Machine Transitions.
 * Matches backend VALID_STATUS_TRANSITIONS.
 */
export const VALID_STATUS_TRANSITIONS = {
  PENDING: ['ACCEPTED', 'CANCELLED', 'REJECTED'],
  ACCEPTED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  REJECTED: [],
};

/**
 * Checks if a status transition is permitted.
 */
export function isValidTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

/**
 * Returns allowed next statuses for a given status.
 */
export function getAllowedTransitions(currentStatus) {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Checks whether an order is in a terminal status.
 */
export function isTerminalStatus(status) {
  return ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(status);
}

/**
 * Payment Statuses and UI styling.
 */
export const PAYMENT_STATUS_CONFIG = {
  PAID: {
    label: 'Paid',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  FAILED: {
    label: 'Failed',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  REFUND_PENDING: {
    label: 'Refund Pending',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  REFUNDED: {
    label: 'Refunded',
    badgeClass: 'bg-stone-200 text-stone-700 border-stone-300',
    dotClass: 'bg-stone-500',
  },
};

/**
 * Popular Courier Logistics Providers in India.
 */
export const COURIER_PROVIDERS = [
  { value: 'Delhivery', label: 'Delhivery', autoUrl: true },
  { value: 'BlueDart', label: 'Blue Dart Express', autoUrl: true },
  { value: 'DTDC', label: 'DTDC Express', autoUrl: true },
  { value: 'IndiaPost', label: 'India Post (Speed Post)', autoUrl: true },
  { value: 'Shiprocket', label: 'Shiprocket', autoUrl: true },
  { value: 'Other', label: 'Other Logistics Provider', autoUrl: false },
];

/**
 * Orders Analytics Chart Series Configuration.
 */
export const ORDERS_ANALYTICS_SERIES = [
  {
    key: 'total',
    label: 'Total Orders',
    color: '#48250F', // Sinka Brand Primary Brown
    strokeWidth: 2.5,
    dotRadius: 4,
    description: 'Total orders placed on this date',
  },
  {
    key: 'pending',
    label: 'Pending',
    color: '#F59E0B', // Amber / Orange
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders awaiting admin confirmation',
  },
  {
    key: 'accepted',
    label: 'Accepted',
    color: '#0284C7', // Sky Blue
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders accepted by administrator',
  },
  {
    key: 'processing',
    label: 'Processing',
    color: '#3B82F6', // Blue
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders in fulfillment processing',
  },
  {
    key: 'packed',
    label: 'Packed',
    color: '#6366F1', // Indigo
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders packaged and ready for dispatch',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    color: '#8B5CF6', // Purple
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders dispatched or out for delivery',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    color: '#10B981', // Emerald Green
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders successfully delivered',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    color: '#EF4444', // Red / Rose
    strokeWidth: 2,
    dotRadius: 3.5,
    description: 'Orders cancelled or rejected',
  },
];

/**
 * Orders Analytics Chart Range Options.
 */
export const ORDERS_ANALYTICS_RANGES = [
  { key: '7d', label: '7 Days' },
  { key: '14d', label: '14 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: '1y', label: '1 Year' },
];


