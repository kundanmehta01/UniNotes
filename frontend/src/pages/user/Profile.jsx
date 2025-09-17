import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button, 
  Input, 
  Textarea,
  Badge,
  Alert,
  AlertDescription,
  Loading
} from '../../components';
import { authAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateProfile: updateAuthProfile, fetchProfile, isLoading: authLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    email: '',
    avatar_url: ''
  });
  const [errors, setErrors] = useState({});

  // Refresh profile data on component mount if user data seems incomplete
  // This will only run once when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const tryRefreshProfile = async () => {
      // Only try if user exists, is missing name data, and component is still mounted
      if (isMounted && user && (!user.first_name || !user.last_name)) {
        console.log('Profile data incomplete, attempting refresh...');
        setIsRefreshing(true);
        try {
          await fetchProfile();
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        } finally {
          if (isMounted) {
            setIsRefreshing(false);
          }
        }
      }
    };
    
    // Small delay to prevent immediate fetch if user data is still loading
    const timeout = setTimeout(tryRefreshProfile, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
        email: user.email || '',
        avatar_url: user.avatar_url || ''
      });
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'File size must be less than 5MB' }));
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      // Clear any previous errors
      if (errors.avatar) {
        setErrors(prev => ({ ...prev, avatar: '' }));
      }
    }
  };


  const validateProfileForm = () => {
    const newErrors = {};
    
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleRefreshProfile = async () => {
    setIsRefreshing(true);
    try {
      await fetchProfile();
      toast.success('Profile refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      toast.error('Failed to refresh profile data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setIsLoading(true);
    try {
      let avatar_url = formData.avatar_url;
      
      // If user uploaded a new avatar, upload it first
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);
        
        try {
          const uploadResponse = await authAPI.uploadAvatar(formDataUpload);
          // Construct full URL for avatar
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          avatar_url = `${API_BASE_URL}${uploadResponse.avatar_url}`;
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          toast.error('Failed to upload avatar');
          setIsLoading(false);
          return;
        }
      }
      
      await updateAuthProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        bio: formData.bio,
        avatar_url: avatar_url
      });
      
      setIsEditing(false);
      setAvatarFile(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };


  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading text="Refreshing profile data..." />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>
          {(!user.first_name || !user.last_name) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshProfile}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh Profile'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {user.first_name && user.last_name 
                        ? (user.first_name[0] + user.last_name[0]).toUpperCase()
                        : user.full_name
                        ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                        : user.email ? user.email.slice(0, 2).toUpperCase()
                        : 'U'}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : user.full_name 
                    ? user.full_name
                    : user.email ? user.email.split('@')[0] 
                    : 'User'}
                </h3>
                <p className="text-gray-600 mb-3">{user.email}</p>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role || 'Student'}
                </Badge>
                
                {user.bio && (
                  <p className="text-gray-600 text-sm mt-4 text-center">
                    {user.bio}
                  </p>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Member Since:</span>
                    <span className="text-gray-900">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                  {user.last_login_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Login:</span>
                      <span className="text-gray-900">
                        {formatDate(user.last_login_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Edit Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Profile Information
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar Upload */}
                {isEditing && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                            {formData.first_name && formData.last_name 
                              ? (formData.first_name[0] + formData.last_name[0]).toUpperCase()
                              : user.email ? user.email.slice(0, 2).toUpperCase()
                              : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG or GIF. Max file size 5MB.
                        </p>
                        {errors.avatar && (
                          <p className="text-xs text-red-600 mt-1">{errors.avatar}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="first_name"
                    label="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    error={errors.first_name}
                    required
                  />
                  <Input
                    name="last_name"
                    label="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    error={errors.last_name}
                    required
                  />
                </div>
                
                <Input
                  name="email"
                  type="email"
                  label="Email Address"
                  value={formData.email}
                  disabled={true}
                  help="Email cannot be changed"
                />
                
                <Textarea
                  name="bio"
                  label="Bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                />

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          first_name: user.first_name || '',
                          last_name: user.last_name || '',
                          bio: user.bio || '',
                          email: user.email || '',
                          avatar_url: user.avatar_url || ''
                        });
                        setAvatarFile(null);
                        setAvatarPreview(user.avatar_url || null);
                        setErrors({});
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Secure Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-green-900 mb-2">
                      Password-Free Security
                    </h4>
                    <p className="text-sm text-green-700 mb-3">
                      Your account uses our secure email verification system. No passwords to remember or manage!
                    </p>
                    <div className="space-y-2 text-sm text-green-600">
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Login with email verification codes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>Enhanced security with time-limited codes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>✓</span>
                        <span>No password resets or breaches to worry about</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
