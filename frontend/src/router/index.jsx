import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, AdminRoute, ModeratorRoute } from '../components';

// Layout Components
import Layout from '../components/layout/Layout';

// Auth Pages
import Auth from '../pages/auth/Auth';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';
import VerifyOTP from '../pages/auth/VerifyOTP';

// Main Pages
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Papers from '../pages/papers/Papers';
import PaperDetail from '../pages/papers/PaperDetail';
import Notes from '../pages/notes/Notes';
import Upload from '../pages/shared/Upload';
import Universities from '../pages/Universities';
import HowItWorks from '../pages/HowItWorks';

// User Pages
import Profile from '../pages/user/Profile';
import MyPapers from '../pages/user/MyPapers';
import MyNotes from '../pages/user/MyNotes';
import RecentActivity from '../pages/user/RecentActivity';
import Notifications from '../pages/user/Notifications';
import Bookmarks from '../pages/Bookmarks';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import PaperModeration from '../pages/admin/PaperModeration';
import NoteModeration from '../pages/admin/NoteModeration';
import ReportsManagement from '../pages/admin/ReportsManagement';
import TaxonomyManagement from '../pages/admin/TaxonomyManagement';
import Analytics from '../pages/admin/Analytics';
import SystemConfig from '../pages/admin/SystemConfig';
import AuditLogs from '../pages/admin/AuditLogs';
import DebugTestPage from '../routes/admin/DebugTestPage';

// Static Pages
import About from '../pages/static/About';
import Contact from '../pages/static/Contact';

// Legal Pages
import PrivacyPolicy from '../pages/static/PrivacyPolicy';
import TermsOfService from '../pages/static/TermsOfService';
import CookiePolicy from '../pages/static/CookiePolicy';
import Guidelines from '../pages/static/Guidelines';

// Error Pages
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import ErrorPage from '../pages/ErrorPage';

const router = createBrowserRouter([
  // Public routes (accessible without authentication)
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: 'privacy',
        element: <PrivacyPolicy />,
      },
      {
        path: 'terms',
        element: <TermsOfService />,
      },
      {
        path: 'universities',
        element: <Universities />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorks />,
      },
      // Legal pages
      {
        path: 'privacy-policy',
        element: <PrivacyPolicy />,
      },
      {
        path: 'terms-of-service',
        element: <TermsOfService />,
      },
      {
        path: 'cookie-policy',
        element: <CookiePolicy />,
      },
      {
        path: 'guidelines',
        element: <Guidelines />,
      },
      // Public paper browsing (read-only for non-authenticated users)
      {
        path: 'papers',
        element: <Papers />,
      },
      {
        path: 'papers/:id',
        element: <PaperDetail />,
      },
      // Notes functionality - now enabled with backend support
      {
        path: 'notes',
        element: <Notes />,
      },
    ],
  },

  // Authentication routes (redirect if already authenticated)
  {
    path: '/auth',
    element: <Layout showFooter={false} />,
    children: [
      {
        index: true,
        element: (
          <PublicRoute>
            <Auth />
          </PublicRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicRoute>
            <Register />
          </PublicRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        ),
      },
      {
        path: 'verify-email',
        element: (
          <PublicRoute>
            <VerifyEmail />
          </PublicRoute>
        ),
      },
      {
        path: 'verify-otp',
        element: (
          <PublicRoute>
            <VerifyOTP />
          </PublicRoute>
        ),
      },
    ],
  },

  // Legacy auth routes (for backward compatibility)
  {
    path: '/login',
    element: (
      <Layout showFooter={false}>
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Layout>
    ),
  },
  {
    path: '/register',
    element: (
      <Layout showFooter={false}>
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Layout>
    ),
  },

  // Protected user routes
  {
    path: '/dashboard',
    element: (
      <Layout>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/upload',
    element: (
      <Layout>
        <ProtectedRoute>
          <Upload />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/profile',
    element: (
      <Layout>
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/my-papers',
    element: (
      <Layout>
        <ProtectedRoute>
          <MyPapers />
        </ProtectedRoute>
      </Layout>
    ),
  },
  // Notes functionality - now enabled with backend support
  {
    path: '/my-notes',
    element: (
      <Layout>
        <ProtectedRoute>
          <MyNotes />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/bookmarks',
    element: (
      <Layout>
        <ProtectedRoute>
          <Bookmarks />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/activity',
    element: (
      <Layout>
        <ProtectedRoute>
          <RecentActivity />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/notifications',
    element: (
      <Layout>
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Layout>
    ),
  },

  // Admin routes
  {
    path: '/admin',
    element: (
      <Layout>
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <Layout>
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/papers',
    element: (
      <Layout>
        <ModeratorRoute>
          <PaperModeration />
        </ModeratorRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/notes',
    element: (
      <Layout>
        <ModeratorRoute>
          <NoteModeration />
        </ModeratorRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/reports',
    element: (
      <Layout>
        <ModeratorRoute>
          <ReportsManagement />
        </ModeratorRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/taxonomy',
    element: (
      <Layout>
        <AdminRoute>
          <TaxonomyManagement />
        </AdminRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/analytics',
    element: (
      <Layout>
        <AdminRoute>
          <Analytics />
        </AdminRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/config',
    element: (
      <Layout>
        <AdminRoute>
          <SystemConfig />
        </AdminRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/logs',
    element: (
      <Layout>
        <AdminRoute>
          <AuditLogs />
        </AdminRoute>
      </Layout>
    ),
  },
  {
    path: '/admin/debug-test',
    element: (
      <Layout>
        <AdminRoute>
          <DebugTestPage />
        </AdminRoute>
      </Layout>
    ),
  },

  // Error routes
  {
    path: '/unauthorized',
    element: (
      <Layout>
        <Unauthorized />
      </Layout>
    ),
  },
  {
    path: '*',
    element: (
      <Layout>
        <NotFound />
      </Layout>
    ),
  },
]);

export default router;
