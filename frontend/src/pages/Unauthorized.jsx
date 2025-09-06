import { Link } from 'react-router-dom';
import { Button } from '../components';

const Unauthorized = () => {
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
              d="M12 15v2m0 0v2m0-2h2m-2 0H8m4-9V6a3 3 0 00-6 0v6a2 2 0 01-2 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 01-2-2V6a3 3 0 00-6 0z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page. This could be because you need to sign in, or you don't have the required role.
          </p>
        </div>
        
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button>
                Go back home
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please {' '}
            <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-500">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
