import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '../../components';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Auto redirect to auth page after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Password-Free Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've upgraded to a more secure login system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">No More Passwords!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                <strong>Good News!</strong> We've switched to a secure, password-free authentication system. 
                No more forgotten passwords!
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works now:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>Enter your email on the login page</li>
                  <li>We'll send you a 6-digit verification code</li>
                  <li>Enter the code and you're logged in instantly!</li>
                </ol>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  ✨ More secure • ⚡ Faster login • 🔐 No passwords to remember
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link to="/auth">
                <Button className="w-full">
                  Try the new auth system
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Redirecting to auth page automatically in a few seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
