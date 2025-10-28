import { type RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from '../components/feature/ProtectedRoute';

// Error component for lazy loading failures
const ErrorComponent = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <i className="ri-error-warning-line text-3xl text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Available</h2>
      <p className="text-gray-600 mb-6">We're having trouble loading this page. Please try refreshing or going back.</p>
      <div className="space-x-4">
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
        >
          Refresh Page
        </button>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
);

// Helper function for lazy loading
const lazyLoad = (factory: () => Promise<any>) => 
  lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.error('Error loading module:', error);
      return { default: ErrorComponent };
    }
  });

// Lazy load components
const AccessSelection = lazyLoad(() => import('../pages/access-selection/page'));
const Home = lazyLoad(() => import('../pages/home/page'));
const Menu = lazyLoad(() => import('../pages/menu/page'));
const Cart = lazyLoad(() => import('../pages/cart/page'));
const Checkout = lazyLoad(() => import('../pages/checkout'));
const FoodDetails = lazyLoad(() => import('../pages/food-details/page'));
const Login = lazyLoad(() => import('../pages/login/page'));
const Signup = lazyLoad(() => import('../pages/signup/page'));
const KioskLogin = lazyLoad(() => import('../pages/kiosk-login/page'));
const Orders = lazyLoad(() => import('../pages/orders/page'));
const OrderDetails = lazyLoad(() => import('../pages/order-details/page'));
const OrderConfirmation = lazyLoad(() => import('../pages/order-confirmation/page'));
const Profile = lazyLoad(() => import('../pages/profile/page'));
const NotFound = lazyLoad(() => import('../pages/NotFound'));

// Admin components
const AdminDashboard = lazyLoad(() => import('../pages/admin/dashboard/page'));
const AdminMenu = lazyLoad(() => import('../pages/admin/menu/page'));
const AdminOrders = lazyLoad(() => import('../pages/admin/orders/page'));
const AdminCustomers = lazyLoad(() => import('../pages/admin/customers/page'));
const AdminCategories = lazyLoad(() => import('../pages/admin/categories/page'));
const AdminReports = lazyLoad(() => import('../pages/admin/reports/page'));
const AdminSettings = lazyLoad(() => import('../pages/admin/settings/page'));
const AdminLayout = lazyLoad(() => import('../components/layout/AdminLayout'));

// Layout components
const CustomerLayout = lazyLoad(() => import('../components/layout/CustomerLayout'));
const KioskLayout = lazyLoad(() => import('../components/layout/KioskLayout'));

// Kiosk components
const KioskDashboard = lazyLoad(() => import('../pages/kiosk/dashboard/page'));
const KioskMenu = lazyLoad(() => import('../pages/kiosk/menu/page'));
const KioskCart = lazyLoad(() => import('../pages/kiosk/cart/page'));
const KioskOrders = lazyLoad(() => import('../pages/kiosk/orders/page'));
const KioskOrderSuccess = lazyLoad(() => import('../pages/kiosk/order-success/page'));
const KioskAccessDenied = lazyLoad(() => import('../components/feature/KioskAccessDenied'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <CustomerLayout>
        <Home />
      </CustomerLayout>
    ),
  },
  {
    path: '/home',
    element: (
      <CustomerLayout>
        <Home />
      </CustomerLayout>
    ),
  },
  {
    path: '/menu',
    element: (
      <CustomerLayout>
        <Menu />
      </CustomerLayout>
    ),
  },
  {
    path: '/cart',
    element: (
      <CustomerLayout>
        <Cart />
      </CustomerLayout>
    ),
  },
  {
    path: '/checkout',
    element: (
      <CustomerLayout>
        <Checkout />
      </CustomerLayout>
    ),
  },
  {
    path: '/food/:id',
    element: (
      <CustomerLayout>
        <FoodDetails />
      </CustomerLayout>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/kiosk-login',
    element: <KioskLogin />,
  },
  {
    path: '/kiosk-access-denied',
    element: <KioskAccessDenied />,
  },
  {
    path: '/orders',
    element: (
      <CustomerLayout>
        <Orders />
      </CustomerLayout>
    ),
  },
  {
    path: '/orders/:id',
    element: (
      <CustomerLayout>
        <OrderDetails />
      </CustomerLayout>
    ),
  },
  {
    path: '/order-confirmation/:id',
    element: (
      <CustomerLayout>
        <OrderConfirmation />
      </CustomerLayout>
    ),
  },
  {
    path: '/profile',
    element: (
      <CustomerLayout>
        <Profile />
      </CustomerLayout>
    ),
  },
  // Kiosk routes
  {
    path: '/kiosk',
    element: (
      <ProtectedRoute requiredRole="kiosk">
        <KioskLayout>
          <KioskDashboard />
        </KioskLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/kiosk/menu',
    element: (
      <ProtectedRoute requiredRole="kiosk">
        <KioskLayout>
          <KioskMenu />
        </KioskLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/kiosk/cart',
    element: (
      <ProtectedRoute requiredRole="kiosk">
        <KioskLayout>
          <KioskCart />
        </KioskLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/kiosk/orders',
    element: (
      <ProtectedRoute requiredRole="kiosk">
        <KioskLayout>
          <KioskOrders />
        </KioskLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/kiosk/order-success',
    element: (
      <ProtectedRoute requiredRole="kiosk">
        <KioskLayout>
          <KioskOrderSuccess />
        </KioskLayout>
      </ProtectedRoute>
    ),
  },
  // Admin routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/menu',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminMenu />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminOrders />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/customers',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminCustomers />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/categories',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminCategories />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminReports />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminLayout>
          <AdminSettings />
        </AdminLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;