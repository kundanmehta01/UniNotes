import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../lib/api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,

      // Actions
      // Send OTP for login
      sendLoginOTP: async (email) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.sendOTP(email, false);
          set({ isLoading: false });
          toast.success('OTP sent successfully! Please check your email.');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Send OTP for registration
      sendRegistrationOTP: async (userData) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.sendOTP(userData.email, true, userData);
          set({ isLoading: false });
          toast.success('OTP sent successfully! Please check your email to complete registration.');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Verify OTP and authenticate user
      verifyOTP: async (email, otp) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.verifyOTP(email, otp);
          
          // Store tokens and user data
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Update state
          set({
            user: response.user,
            isAuthenticated: true,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            isLoading: false,
          });
          
          // Fetch complete user profile data to ensure we have all fields
          try {
            const completeUserData = await authAPI.getProfile();
            set({ user: completeUserData });
            localStorage.setItem('user', JSON.stringify(completeUserData));
          } catch (profileError) {
            console.warn('Could not fetch complete profile after OTP verification:', profileError);
            // Continue with the user data from OTP response
          }
          
          // Show appropriate success message based on whether it's a new user
          if (response.is_new_user) {
            toast.success('Account created and logged in successfully!');
          } else {
            toast.success('Logged in successfully!');
          }
          
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Legacy methods for backward compatibility
      login: async (credentials) => {
        // Redirect to OTP-based flow
        return get().sendLoginOTP(credentials.email);
      },

      register: async (userData) => {
        // Redirect to OTP-based flow
        return get().sendRegistrationOTP(userData);
      },

      logout: async () => {
        console.log('AuthStore: Starting logout process...');
        set({ isLoading: true });
        
        try {
          console.log('AuthStore: Calling logout API...');
          await authAPI.logout();
          console.log('AuthStore: Logout API call successful');
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('AuthStore: Logout API error:', error);
        } finally {
          console.log('AuthStore: Clearing localStorage and state...');
          // Clear tokens from localStorage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // Reset state
          set({
            user: null,
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
          });
          
          console.log('AuthStore: Logout completed successfully');
          toast.success('Logged out successfully!');
          
          // Force navigation to home page
          console.log('AuthStore: Navigating to home page...');
          window.location.href = '/';
        }
      },

      refreshToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        try {
          const response = await authAPI.refreshToken(refreshToken);
          
          // Update tokens
          localStorage.setItem('access_token', response.access_token);
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          
          set({
            accessToken: response.access_token,
            refreshToken: response.refresh_token || refreshToken,
          });
          
          return response;
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      verifyEmail: async (token) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.verifyEmail(token);
          
          // If user is logged in, refresh their profile to get updated verification status
          const { isAuthenticated } = get();
          if (isAuthenticated) {
            try {
              const updatedUser = await authAPI.getProfile();
              set({ user: updatedUser });
            } catch (profileError) {
              console.error('Failed to refresh user profile after verification:', profileError);
            }
          }
          
          set({ isLoading: false });
          toast.success('Email verified successfully!');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      requestPasswordReset: async (email) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.requestPasswordReset(email);
          set({ isLoading: false });
          toast.success('Password reset email sent! Check your inbox.');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.resetPassword(token, password);
          set({ isLoading: false });
          toast.success('Password reset successfully!');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true });
        
        try {
          const response = await authAPI.updateProfile(profileData);
          set({ 
            user: response,
            isLoading: false,
          });
          toast.success('Profile updated successfully!');
          return response;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchProfile: async () => {
        const { isAuthenticated } = get();
        
        if (!isAuthenticated) {
          return null;
        }
        
        try {
          const user = await authAPI.getProfile();
          set({ user });
          localStorage.setItem('user', JSON.stringify(user));
          return user;
        } catch (error) {
          // If profile fetch fails, user might be logged out
          console.error('Profile fetch error:', error);
          return null;
        }
      },

      // Initialize auth state from localStorage
      initialize: () => {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userStr = localStorage.getItem('user');
        
        if (token && refreshToken) {
          let user = null;
          if (userStr) {
            try {
              user = JSON.parse(userStr);
            } catch (error) {
              console.error('Error parsing user from localStorage:', error);
            }
          }
          
          set({
            accessToken: token,
            refreshToken: refreshToken,
            user: user,
            isAuthenticated: true,
          });
          
          // Only fetch profile if user data is incomplete and we haven't tried recently
          const lastFetch = localStorage.getItem('last_profile_fetch');
          const now = Date.now();
          const FETCH_COOLDOWN = 30000; // 30 seconds
          
          if (user && (!user.first_name || !user.last_name) && 
              (!lastFetch || (now - parseInt(lastFetch)) > FETCH_COOLDOWN)) {
            localStorage.setItem('last_profile_fetch', now.toString());
            get().fetchProfile().catch(error => {
              console.warn('Initial profile fetch failed:', error);
            });
          }
        }
      },

      // Helper functions
      isAdmin: () => {
        const { user } = get();
        return user?.role?.toLowerCase() === 'admin';
      },

      isModerator: () => {
        const { user } = get();
        const role = user?.role?.toLowerCase();
        return role === 'moderator' || role === 'admin';
      },

      hasPermission: (permission) => {
        const { user } = get();
        
        if (!user) return false;
        
        const role = user.role?.toLowerCase();
        
        // Admin has all permissions
        if (role === 'admin') return true;
        
        // Define role-based permissions
        const rolePermissions = {
          admin: ['*'], // All permissions
          moderator: [
            'papers.moderate',
            'papers.view_all',
            'reports.view',
            'reports.resolve',
            'analytics.view',
            'admin.dashboard'
          ],
          student: [
            'papers.create',
            'papers.view_approved',
            'papers.download',
            'papers.bookmark',
            'papers.report',
          ],
        };
        
        const userPermissions = rolePermissions[role] || [];
        
        return userPermissions.includes('*') || userPermissions.includes(permission);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
