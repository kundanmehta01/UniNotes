import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert, AlertDescription } from '../../components';
import { authAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendLoginOTP, sendRegistrationOTP, isLoading } = useAuthStore();
  
  const [step, setStep] = useState('email'); // 'email', 'user-details', 'otp'
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  });
  const [userExists, setUserExists] = useState(null);
  const [errors, setErrors] = useState({});
  const [checkingUser, setCheckingUser] = useState(false);

  const from = location.state?.from || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEmail = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUserDetails = () => {
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if user exists with the provided email
  const checkUserExists = async (email) => {
    try {
      setCheckingUser(true);
      const response = await authAPI.checkUserExists(email);
      return response.exists;
    } catch (error) {
      console.error('Error checking user existence:', error);
      // If the check fails, assume user doesn't exist and proceed with registration flow
      return false;
    } finally {
      setCheckingUser(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) {
      return;
    }

    const exists = await checkUserExists(formData.email);
    setUserExists(exists);

    if (exists) {
      // User exists, proceed to send login OTP
      await handleSendOTP(false);
    } else {
      // User doesn't exist, ask for details
      setStep('user-details');
    }
  };

  const handleUserDetailsSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUserDetails()) {
      return;
    }

    // User provided details, send registration OTP
    await handleSendOTP(true);
  };

  const handleSendOTP = async (isRegistration) => {
    try {
      if (isRegistration) {
        const userData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
        };
        await sendRegistrationOTP(userData);
      } else {
        await sendLoginOTP(formData.email);
      }
      
      // Navigate to OTP verification page
      navigate('/auth/verify-otp', {
        state: {
          email: formData.email,
          isRegistration,
          userData: isRegistration ? {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
          } : null,
          from
        }
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      // Error will be handled by the store and show a toast
    }
  };

  const handleBack = () => {
    if (step === 'user-details') {
      setStep('email');
      setUserExists(null);
      setErrors({});
    }
  };

  const renderEmailStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Welcome to UniNotesHub</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailSubmit} className="space-y-6">
          <Input
            name="email"
            type="email"
            label="Email address"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
            disabled={isLoading || checkingUser}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>One-step Authentication:</strong> Enter your email and we'll either log you in or help you create an account. 
              No passwords needed!
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading || checkingUser}
            disabled={isLoading || checkingUser}
          >
            {checkingUser ? 'Checking...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderUserDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Complete Your Profile</CardTitle>
        <p className="text-sm text-gray-600 text-center mt-2">
          We need a few more details to create your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUserDetailsSubmit} className="space-y-6">
          {/* Show email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
              {formData.email}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="firstName"
              type="text"
              label="First name"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
              autoComplete="given-name"
              disabled={isLoading}
            />
            <Input
              name="lastName"
              type="text"
              label="Last name"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
              autoComplete="family-name"
              disabled={isLoading}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              <strong>Quick Setup:</strong> We'll create your account and send a verification code to your email.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={isLoading}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 'email' ? 'Sign in or Sign up' : 'Complete Registration'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' 
              ? 'Enter your email to get started'
              : 'Just a few more details and you\'re all set!'
            }
          </p>
        </div>

        {step === 'email' && renderEmailStep()}
        {step === 'user-details' && renderUserDetailsStep()}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
