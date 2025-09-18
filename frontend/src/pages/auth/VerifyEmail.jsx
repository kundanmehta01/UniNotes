import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent } from '../../components';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show deprecation notice
    toast.error('Email verification is no longer supported. Please use our new OTP authentication system.');
    
    // Redirect to auth page after 3 seconds
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication System Updated</h3>
            <p className="text-gray-600 mb-6">
              Email verification has been replaced with our new OTP (One-Time Password) authentication system. 
              This provides better security and a smoother user experience.
            </p>
            <div className="space-y-3">
              <Link to="/auth">
                <Button className="w-full">
                  Continue with OTP Authentication
                </Button>
              </Link>
              <p className="text-sm text-gray-500">
                You will be automatically redirected in a few seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
