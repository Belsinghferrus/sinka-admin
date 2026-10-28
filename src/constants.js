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
    name: 'Promotional Offers',
    path: ROUTES.OFFERS,
  },
];
