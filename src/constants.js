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
  PRODUCTS: '/products',
  PRODUCTS_NEW: '/products/new',
  PRODUCTS_EDIT: '/products/:id/edit',
  OFFERS: '/offers',
  OFFERS_NEW: '/offers/new',
  OFFERS_EDIT: '/offers/:id/edit',
};

export const NAVIGATION_ITEMS = [
  {
    name: 'Dashboard',
    path: ROUTES.DASHBOARD,
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
