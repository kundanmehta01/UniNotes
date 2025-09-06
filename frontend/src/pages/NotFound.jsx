import { Link } from 'react-router-dom';
import { Button } from '../components';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button>
                Go back home
              </Button>
            </Link>
            <Link to="/papers">
              <Button variant="outline">
                Browse papers
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Need help? {' '}
            <Link to="/contact" className="font-medium text-blue-600 hover:text-blue-500">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
