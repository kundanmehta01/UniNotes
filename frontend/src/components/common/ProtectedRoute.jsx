import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { PageLoading } from '../ui/Loading';

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requiredRoles = [], 
  redirectTo = '/login',
  fallback = null 
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoading />;
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with return url
    return <Navigate 
      to={redirectTo} 
      state={{ from: location.pathname }} 
      replace 
    />;
  }

  // Check if user should not be authenticated (like login/register pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Check role-based access
  if (requireAuth && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // User doesn't have required role
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center">
            <svg
              className="mx-auto h-24 w-24 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-9V6a3 3 0 00-6 0v6a2 2 0 01-2 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 01-2-2V6a3 3 0 00-6 0z"
              />
            </svg>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

// HOC version for wrapping components
export const withProtectedRoute = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

// Role-specific route components
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute 
    requiredRoles={['admin']} 
    redirectTo="/unauthorized"
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const ModeratorRoute = ({ children, ...props }) => (
  <ProtectedRoute 
    requiredRoles={['admin', 'moderator']} 
    redirectTo="/unauthorized"
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const UserRoute = ({ children, ...props }) => (
  <ProtectedRoute 
    requiredRoles={['admin', 'moderator', 'user']} 
    {...props}
  >
    {children}
  </ProtectedRoute>
);

// Public route (for login/register pages)
export const PublicRoute = ({ children, ...props }) => (
  <ProtectedRoute 
    requireAuth={false} 
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
