import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ProductsListPage from '../pages/products/ProductsListPage.jsx';
import ProductFormPage from '../pages/products/ProductFormPage.jsx';
import OffersListPage from '../pages/offers/OffersListPage.jsx';
import OfferFormPage from '../pages/offers/OfferFormPage.jsx';
import BannersListPage from '../pages/banners/BannersListPage.jsx';
import BannerFormPage from '../pages/banners/BannerFormPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';
import { ROUTES } from '../constants.js';

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.PRODUCTS,
        element: <ProductsListPage />,
      },
      {
        path: ROUTES.PRODUCTS_NEW,
        element: <ProductFormPage />,
      },
      {
        path: ROUTES.PRODUCTS_EDIT,
        element: <ProductFormPage />,
      },
      {
        path: ROUTES.OFFERS,
        element: <OffersListPage />,
      },
      {
        path: ROUTES.OFFERS_NEW,
        element: <OfferFormPage />,
      },
      {
        path: ROUTES.OFFERS_EDIT,
        element: <OfferFormPage />,
      },
      {
        path: ROUTES.BANNERS,
        element: <BannersListPage />,
      },
      {
        path: ROUTES.BANNERS_NEW,
        element: <BannerFormPage />,
      },
      {
        path: ROUTES.BANNERS_EDIT,
        element: <BannerFormPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
