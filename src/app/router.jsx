import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import OffersListPage from '../pages/offers/OffersListPage.jsx';
import OfferFormPage from '../pages/offers/OfferFormPage.jsx';
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
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
