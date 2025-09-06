import { useRouteError, Link } from 'react-router-dom';
import { Button } from '../components';

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error?.statusText || error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-4 bg-red-50 rounded-md text-left">
            <summary className="cursor-pointer text-sm font-medium text-red-800">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap break-all">
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Link to="/">
              <Button variant="outline">
                Go back home
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            If this problem persists, please {' '}
            <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-500">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
