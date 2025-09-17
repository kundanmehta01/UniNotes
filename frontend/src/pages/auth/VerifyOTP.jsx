import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { 
  Button, 
  OTPInput, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Alert, 
  AlertDescription 
} from '../../components';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, sendLoginOTP, sendRegistrationOTP, isLoading } = useAuthStore();
  
  // Get data from navigation state
  const { 
    email, 
    isRegistration = false, 
    userData = null,
    from = '/dashboard' 
  } = location.state || {};

  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/auth', { replace: true });
    }
  }, [email, navigate]);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (value) => {
    setOtp(value);
    // Clear errors when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleOTPComplete = async (otpValue) => {
    if (otpValue.length === 6) {
      await handleSubmit(null, otpValue);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!otp || otp.length !== 6) {
      newErrors.otp = 'Please enter a valid 6-digit OTP';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must contain only numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e, otpValue = null) => {
    if (e) e.preventDefault();
    
    const otpToVerify = otpValue || otp;
    
    if (!otpToVerify || otpToVerify.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    if (!validateForm() && !otpValue) {
      return;
    }

    try {
      const response = await verifyOTP(email, otpToVerify);
      
      // Navigate based on the response or provided redirect
      navigate(from, { replace: true });
    } catch (error) {
      console.error('OTP verification error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error?.message || 'Invalid OTP';
        if (errorMessage.toLowerCase().includes('expired')) {
          setErrors({ otp: 'OTP has expired. Please request a new one.' });
          setCanResend(true);
        } else if (errorMessage.toLowerCase().includes('invalid')) {
          setErrors({ otp: 'Invalid OTP. Please try again.' });
        } else {
          setErrors({ otp: errorMessage });
        }
      } else {
        setErrors({ otp: 'Failed to verify OTP. Please try again.' });
      }
    }
  };

  const handleResendOTP = async () => {
    try {
      if (isRegistration && userData) {
        await sendRegistrationOTP(userData);
      } else {
        await sendLoginOTP(email);
      }
      
      // Reset timer
      setTimeLeft(300);
      setCanResend(false);
      setOtp('');
      setErrors({});
      
      toast.success('New OTP sent successfully!');
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  const goBack = () => {
    // Always go back to unified auth page
    navigate('/auth', { replace: true });
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isRegistration ? 'Complete Registration' : 'Sign In'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter verification code
                </label>
                <OTPInput
                  value={otp}
                  onChange={handleOTPChange}
                  onComplete={handleOTPComplete}
                  disabled={isLoading}
                  error={!!errors.otp}
                  autoFocus
                />
                {errors.otp && (
                  <p className="mt-2 text-sm text-red-600">{errors.otp}</p>
                )}
              </div>

              {/* Timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-600">
                    Code expires in{' '}
                    <span className="font-semibold text-blue-600">
                      {formatTime(timeLeft)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-red-600">
                    Your OTP has expired
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading || otp.length !== 6}
              >
                {isRegistration ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Resend OTP */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isLoading}
                className={`mt-2 font-medium text-sm ${
                  canResend && !isLoading
                    ? 'text-blue-600 hover:text-blue-500 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Sending...' : 'Send new code'}
              </button>
            </div>

            {/* Back button */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={goBack}
                className="text-sm text-gray-600 hover:text-gray-500"
                disabled={isLoading}
              >
                ← Back to authentication
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Info alert */}
        <Alert>
          <AlertDescription>
            <strong>Can't find the email?</strong> Check your spam folder or try resending the code.
            The verification code is valid for 5 minutes.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default VerifyOTP;
