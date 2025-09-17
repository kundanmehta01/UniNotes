import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '../../components';

const ResetPassword = () => {
  const navigate = useNavigate();

  // Auto redirect to auth page after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            No Reset Needed!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've upgraded to password-free authentication
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication Upgraded!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>Great news!</strong> You no longer need to reset passwords. We now use 
                secure email verification codes instead.
              </AlertDescription>
            </Alert>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">New login process:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
                <li>Go to the login page</li>
                <li>Enter your email address</li>
                <li>Check your email for a 6-digit code</li>
                <li>Enter the code and you're in!</li>
              </ol>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                🚀 Faster • 🔒 More secure • 🎯 No passwords to manage
              </p>
            </div>

            <div className="space-y-3">
              <Link to="/auth">
                <Button className="w-full">
                  Go to auth page
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Redirecting to auth page automatically...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
