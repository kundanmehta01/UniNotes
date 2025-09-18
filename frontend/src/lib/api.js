import axios from 'axios';
import toast from 'react-hot-toast';
import { dispatchActivityUpdate } from '../utils/activityEvents';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('API Base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Only show toast if not already on login page
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (response?.status === 404) {
      toast.error('Resource not found.');
    } else if (response?.status === 422) {
      // Validation errors
      const errors = response.data?.error?.details || [];
      if (errors.length > 0) {
        errors.forEach(error => {
          toast.error(`${error.loc?.join(' → ') || 'Field'}: ${error.msg}`);
        });
      } else {
        toast.error(response.data?.error?.message || 'Validation error');
      }
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !response) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error(response?.data?.error?.message || 'An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Send OTP to email (for both login and registration)
  sendOTP: async (email, isRegistration = false, userData = null) => {
    const payload = { email };
    
    // If it's for registration, include user data
    if (isRegistration && userData) {
      payload.first_name = userData.first_name;
      payload.last_name = userData.last_name;
      payload.is_registration = true;
    }
    
    const response = await api.post('/auth/send-otp', payload);
    return response.data;
  },
  
  // Check if user exists with given email
  checkUserExists: async (email) => {
    const response = await api.post('/auth/check-user', { email });
    return response.data;
  },
  
  // Verify OTP and authenticate user
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp
    });
    return response.data;
  },
  
  // Legacy endpoints for backward compatibility (if needed)
  register: async (userData) => {
    // This is now handled by sendOTP with isRegistration=true
    return await authAPI.sendOTP(userData.email, true, userData);
  },
  
  login: async (credentials) => {
    // This is now handled by sendOTP
    return await authAPI.sendOTP(credentials.email, false);
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  
  verifyEmail: async (token) => {
    const response = await api.post(`/auth/verify-email/${token}`);
    return response.data;
  },
  
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/me', profileData);
    return response.data;
  },
  
  uploadAvatar: async (formData) => {
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
  
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/auth/dashboard-stats');
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  // Get notes with search and filtering
  getNotes: async (params = {}) => {
    const response = await api.get('/notes', { params });
    return response.data;
  },
  
  // Get note by ID
  getNote: async (noteId) => {
    const response = await api.get(`/notes/${noteId}`);
    return response.data;
  },
  
  // Get current user's notes
  getMyNotes: async (params = {}) => {
    const response = await api.get('/notes/my/notes', { params });
    return response.data;
  },
  
  // Create new note
  createNote: async (noteData) => {
    const response = await api.post('/notes', noteData);
    return response.data;
  },
  
  // Update note
  updateNote: async (noteId, noteData) => {
    const response = await api.put(`/notes/${noteId}`, noteData);
    return response.data;
  },
  
  // Delete note
  deleteNote: async (noteId) => {
    const response = await api.delete(`/notes/${noteId}`);
    return response.data;
  },
  
  // Get download URL
  getDownloadUrl: async (noteId) => {
    const response = await api.post(`/notes/${noteId}/download`);
    return response.data;
  },
  
  // Bookmark note
  bookmarkNote: async (noteId) => {
    const response = await api.post('/notes/bookmarks', { note_id: noteId });
    return response.data;
  },
  
  // Remove bookmark
  removeBookmark: async (noteId) => {
    const response = await api.delete(`/notes/bookmarks/${noteId}`);
    return response.data;
  },
  
  // Get user note bookmarks
  getBookmarks: async (params = {}) => {
    const response = await api.get('/notes/bookmarks/my', { params });
    return response.data;
  },
  
  // Report note
  reportNote: async (noteId, reason, details) => {
    const response = await api.post('/notes/reports', { 
      note_id: noteId,
      reason, 
      details 
    });
    return response.data;
  },
  
  // Moderate note (admin only)
  moderateNote: async (noteId, action, notes) => {
    const response = await api.post(`/notes/${noteId}/moderate`, { action, notes });
    return response.data;
  },
  
  // Get pending notes for moderation (admin only)
  getPendingNotes: async (page = 1, pageSize = 12) => {
    const response = await api.get('/notes/pending/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },
  
  // Rating endpoints
  rateNote: async (noteId, rating) => {
    const response = await api.post('/notes/ratings', {
      note_id: noteId,
      rating: rating
    });
    return response.data;
  },
  
  updateRating: async (ratingId, rating) => {
    const response = await api.put(`/notes/ratings/${ratingId}`, {
      rating: rating
    });
    return response.data;
  },
  
  deleteRating: async (noteId) => {
    const response = await api.delete(`/notes/ratings/${noteId}`);
    return response.data;
  },
  
  getRatingStats: async (noteId) => {
    const response = await api.get(`/notes/${noteId}/rating-stats`);
    return response.data;
  },
  
  // Get filter options with counts
  getFilterOptions: async () => {
    const response = await api.get('/notes/filter-options');
    return response.data;
  },
  
  // Update note status (admin only)
  updateNoteStatus: async (noteId, statusData) => {
    const response = await api.put(`/notes/${noteId}/status`, statusData);
    return response.data;
  },
};

// Papers API
export const papersAPI = {
  // Get papers with search and filtering
  getPapers: async (params = {}) => {
    const response = await api.get('/papers', { params });
    return response.data;
  },
  
  // Get paper by ID
  getPaper: async (paperId) => {
    const response = await api.get(`/papers/${paperId}`);
    return response.data;
  },
  
  // Create new paper
  createPaper: async (paperData) => {
    const response = await api.post('/papers', paperData);
    return response.data;
  },
  
  // Update paper
  updatePaper: async (paperId, paperData) => {
    const response = await api.put(`/papers/${paperId}`, paperData);
    return response.data;
  },
  
  // Delete paper
  deletePaper: async (paperId) => {
    const response = await api.delete(`/papers/${paperId}`);
    return response.data;
  },
  
  // Get download URL
  getDownloadUrl: async (paperId) => {
    const response = await api.post(`/papers/${paperId}/download`);
    return response.data;
  },
  
  // Bookmark paper
  bookmarkPaper: async (paperId) => {
    const response = await api.post(`/papers/${paperId}/bookmark`);
    return response.data;
  },
  
  // Get user bookmarks
  getBookmarks: async (params = {}) => {
    const response = await api.get('/papers/bookmarks/', { params });
    return response.data;
  },
  
  // Report paper
  reportPaper: async (paperId, reason, details) => {
    const response = await api.post(`/papers/${paperId}/report`, { 
      reason, 
      details 
    });
    return response.data;
  },
  
  // Moderate paper (admin only)
  moderatePaper: async (paperId, action, notes) => {
    const response = await api.post(`/papers/${paperId}/moderate`, { action, notes });
    return response.data;
  },
  
  // Get pending papers for moderation (admin only)
  getPendingPapers: async (page = 1, pageSize = 12) => {
    const response = await api.get('/admin/papers/pending', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },
  
  // Rating endpoints
  ratePaper: async (paperId, rating) => {
    const response = await api.post(`/papers/${paperId}/rate`, {
      rating: rating
    });
    return response.data;
  },
  
  updateRating: async (ratingId, rating) => {
    const response = await api.put(`/papers/ratings/${ratingId}`, {
      rating: rating
    });
    return response.data;
  },
  
  deleteRating: async (ratingId) => {
    const response = await api.delete(`/papers/ratings/${ratingId}`);
    return response.data;
  },
  
  getRatingStats: async (paperId) => {
    const response = await api.get(`/papers/${paperId}/rating-stats`);
    return response.data;
  },
  
  // Get filter options with counts
  getFilterOptions: async () => {
    const response = await api.get('/papers/filter-options');
    return response.data;
  },
};

// Storage API
export const storageAPI = {
  // Get presigned upload URL
  getUploadUrl: async (fileName, fileType) => {
    const response = await api.post('/storage/presign-upload', {
      file_name: fileName,
      content_type: fileType,
    });
    return response.data;
  },
  
  // Get presigned download URL
  getDownloadUrl: async (storageKey) => {
    const response = await api.post('/storage/presign-download', {
      storage_key: storageKey,
    });
    return response.data;
  },
  
  // Upload file using development setup
  uploadFile: async (presignedData, file, onProgress) => {
    console.log('uploadFile: Starting file upload with data:', presignedData);
    const formData = new FormData();
    
    // Add fields from presigned data
    Object.entries(presignedData.fields || {}).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    // Add the file last
    formData.append('file', file);
    
    // Extract the path from the full URL
    let uploadPath;
    if (presignedData.url.includes('localhost:8000')) {
      uploadPath = presignedData.url.replace('http://localhost:8000', '');
    } else if (presignedData.url.includes('127.0.0.1:8000')) {
      uploadPath = presignedData.url.replace('http://127.0.0.1:8000', '');
    } else {
      uploadPath = presignedData.url.replace(API_BASE_URL, '');
    }
    
    console.log('uploadFile: Upload path:', uploadPath);
    console.log('uploadFile: API_BASE_URL:', API_BASE_URL);
    
    // For development setup, use the api instance to maintain auth headers
    const response = await api.post(uploadPath, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    
    console.log('uploadFile: Upload successful:', response);
    return response;
  },
  
  // Get file metadata
  getFileMetadata: async (storageKey) => {
    const response = await api.get(`/storage/metadata/${storageKey}`);
    return response.data;
  },
  
  // Delete file
  deleteFile: async (storageKey) => {
    const response = await api.delete(`/storage/${storageKey}`);
    return response.data;
  },
};

// Taxonomy API
export const taxonomyAPI = {
  // Get taxonomy tree
  getTaxonomyTree: async () => {
    const response = await api.get('/taxonomy/tree');
    return response.data;
  },
  
  // Universities
  getUniversities: async () => {
    console.log('taxonomyAPI.getUniversities: Starting request to', API_BASE_URL + '/taxonomy/universities');
    try {
      const response = await api.get('/taxonomy/universities');
      console.log('taxonomyAPI.getUniversities: Response received:', response);
      console.log('taxonomyAPI.getUniversities: Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('taxonomyAPI.getUniversities: Error occurred:', error);
      console.error('taxonomyAPI.getUniversities: Error response:', error.response);
      console.error('taxonomyAPI.getUniversities: Error message:', error.message);
      throw error;
    }
  },
  
  getUniversity: async (universityId) => {
    const response = await api.get(`/taxonomy/universities/${universityId}`);
    return response.data;
  },
  
  createUniversity: async (universityData) => {
    const response = await api.post('/taxonomy/universities', universityData);
    return response.data;
  },
  
  updateUniversity: async (universityId, universityData) => {
    const response = await api.put(`/taxonomy/universities/${universityId}`, universityData);
    return response.data;
  },
  
  deleteUniversity: async (universityId) => {
    const response = await api.delete(`/taxonomy/universities/${universityId}`);
    return response.data;
  },
  
  // Programs
  getPrograms: async (universityId) => {
    const params = universityId ? { university_id: universityId } : {};
    const response = await api.get('/taxonomy/programs', { params });
    return response.data;
  },
  
  getProgram: async (programId) => {
    const response = await api.get(`/taxonomy/programs/${programId}`);
    return response.data;
  },
  
  createProgram: async (universityId, programData) => {
    const response = await api.post(`/taxonomy/universities/${universityId}/programs`, programData);
    return response.data;
  },
  
  updateProgram: async (programId, programData) => {
    const response = await api.put(`/taxonomy/programs/${programId}`, programData);
    return response.data;
  },
  
  deleteProgram: async (programId) => {
    const response = await api.delete(`/taxonomy/programs/${programId}`);
    return response.data;
  },
  
  // Branches
  getBranches: async (programId) => {
    const params = programId ? { program_id: programId } : {};
    const response = await api.get('/taxonomy/branches', { params });
    return response.data;
  },
  
  getBranch: async (branchId) => {
    const response = await api.get(`/taxonomy/branches/${branchId}`);
    return response.data;
  },
  
  createBranch: async (programId, branchData) => {
    const response = await api.post(`/taxonomy/programs/${programId}/branches`, branchData);
    return response.data;
  },
  
  updateBranch: async (branchId, branchData) => {
    const response = await api.put(`/taxonomy/branches/${branchId}`, branchData);
    return response.data;
  },
  
  deleteBranch: async (branchId) => {
    const response = await api.delete(`/taxonomy/branches/${branchId}`);
    return response.data;
  },
  
  // Semesters
  getSemesters: async (branchId) => {
    const params = branchId ? { branch_id: branchId } : {};
    const response = await api.get('/taxonomy/semesters', { params });
    return response.data;
  },
  
  getSemester: async (semesterId) => {
    const response = await api.get(`/taxonomy/semesters/${semesterId}`);
    return response.data;
  },
  
  createSemester: async (branchId, semesterData) => {
    const response = await api.post(`/taxonomy/branches/${branchId}/semesters`, semesterData);
    return response.data;
  },
  
  updateSemester: async (semesterId, semesterData) => {
    const response = await api.put(`/taxonomy/semesters/${semesterId}`, semesterData);
    return response.data;
  },
  
  deleteSemester: async (semesterId) => {
    const response = await api.delete(`/taxonomy/semesters/${semesterId}`);
    return response.data;
  },
  
  // Subjects
  getSubjects: async (semesterId) => {
    const params = semesterId ? { semester_id: semesterId } : {};
    const response = await api.get('/taxonomy/subjects', { params });
    return response.data;
  },
  
  getSubject: async (subjectId) => {
    const response = await api.get(`/taxonomy/subjects/${subjectId}`);
    return response.data;
  },
  
  createSubject: async (semesterId, subjectData) => {
    const response = await api.post(`/taxonomy/semesters/${semesterId}/subjects`, subjectData);
    return response.data;
  },
  
  updateSubject: async (subjectId, subjectData) => {
    const response = await api.put(`/taxonomy/subjects/${subjectId}`, subjectData);
    return response.data;
  },
  
  deleteSubject: async (subjectId) => {
    const response = await api.delete(`/taxonomy/subjects/${subjectId}`);
    return response.data;
  },
  
  // Search subjects
  searchSubjects: async (query) => {
    const response = await api.get('/taxonomy/subjects/search', {
      params: { q: query },
    });
    return response.data;
  },
  
  // Bulk operations
  createBulk: async (taxonomyData) => {
    const response = await api.post('/taxonomy/bulk', taxonomyData);
    return response.data;
  },
  
  // Statistics
  getStats: async () => {
    const response = await api.get('/taxonomy/stats');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },
  
  // Users
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },
  
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },
  
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
  
  bulkUserAction: async (action, userIds, reason) => {
    const response = await api.post('/admin/users/bulk-action', {
      action,
      user_ids: userIds,
      reason,
    });
    return response.data;
  },
  
  // System
  getSystemConfig: async () => {
    const response = await api.get('/admin/config');
    return response.data;
  },
  
  updateSystemConfig: async (configData) => {
    const response = await api.put('/admin/config', configData);
    return response.data;
  },
  
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/logs/audit', { params });
    return response.data;
  },
  
  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },
  
  // Statistics
  getSystemStats: async () => {
    const response = await api.get('/admin/stats/system');
    return response.data;
  },
  
  getUserStats: async () => {
    const response = await api.get('/admin/stats/users');
    return response.data;
  },
  
  // Papers Management
  getPendingPapers: async (params = {}) => {
    const response = await api.get('/admin/papers/pending', { params });
    return response.data;
  },
  
  getAllPapers: async (params = {}) => {
    const response = await api.get('/admin/papers/all', { params });
    return response.data;
  },
  
  getPaperStats: async () => {
    const response = await api.get('/admin/papers/stats');
    return response.data;
  },
  
  moderatePaper: async (paperId, action, notes = '') => {
    const response = await api.post(`/admin/papers/${paperId}/moderate`, {
      action,
      notes
    });
    return response.data;
  },
  
  approvePaper: async (paperId, notes = '') => {
    const response = await api.post(`/admin/papers/${paperId}/approve`, null, {
      params: { notes }
    });
    return response.data;
  },
  
  rejectPaper: async (paperId, notes = '') => {
    const response = await api.post(`/admin/papers/${paperId}/reject`, null, {
      params: { notes }
    });
    return response.data;
  },
  
  // Export
  exportUsers: async (format = 'csv') => {
    const response = await api.get('/admin/export/users', {
      params: { format }
    });
    return response.data;
  },
  
  exportPapers: async (format = 'csv', includeContent = false) => {
    const response = await api.get('/admin/export/papers', {
      params: { format, include_content: includeContent }
    });
    return response.data;
  },
  
  // Maintenance
  cleanupTokens: async () => {
    const response = await api.post('/admin/maintenance/cleanup-tokens');
    return response.data;
  },
  
  backupDatabase: async () => {
    const response = await api.post('/admin/maintenance/backup-database');
    return response.data;
  },
  
  clearCache: async (cacheType = 'all') => {
    const response = await api.post('/admin/maintenance/clear-cache', null, {
      params: { cache_type: cacheType }
    });
    return response.data;
  },
  
  // User Activity
  getUserActivity: async (userId, params = {}) => {
    const response = await api.get(`/admin/users/${userId}/activity`, { params });
    return response.data;
  },
  
  // Reports Management
  getReports: async (params = {}) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },
  
  resolveReport: async (reportId, action, notes = '') => {
    const response = await api.post(`/admin/reports/${reportId}/resolve`, null, {
      params: { action, notes }
    });
    return response.data;
  },
  
  bulkResolveReports: async (reportIds, action, notes = '') => {
    const response = await api.post('/admin/reports/bulk-resolve', null, {
      params: { 
        report_ids: reportIds.join(','),
        action,
        notes
      }
    });
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  // Usage Statistics
  getUsageStats: async (days = 30) => {
    const response = await api.get('/analytics/usage-stats', {
      params: { days },
    });
    return response.data;
  },
  
  // Popular Papers
  getPopularPapers: async (limit = 10, days = 30) => {
    const response = await api.get('/analytics/popular-papers', {
      params: { limit, days },
    });
    return response.data;
  },
  
  // Popular Notes
  getPopularNotes: async (limit = 10, days = 30) => {
    const response = await api.get('/analytics/popular-notes', {
      params: { limit, days },
    });
    return response.data;
  },
  
  // User Engagement
  getUserEngagement: async (days = 30) => {
    const response = await api.get('/analytics/user-engagement', {
      params: { days },
    });
    return response.data;
  },
  
  // Download Statistics
  getDownloadStats: async (days = 30) => {
    const response = await api.get('/analytics/download-stats', {
      params: { days },
    });
    return response.data;
  },
  
  // Upload Trends
  getUploadTrends: async (days = 30) => {
    const response = await api.get('/analytics/upload-trends', {
      params: { days },
    });
    return response.data;
  },
  
  // Subject Popularity
  getSubjectPopularity: async (limit = 20) => {
    const response = await api.get('/analytics/subject-popularity', {
      params: { limit },
    });
    return response.data;
  },
  
  // System Metrics
  getSystemMetrics: async (days = 30) => {
    const response = await api.get('/analytics/system-metrics', {
      params: { days },
    });
    return response.data;
  },
  
  // Reports
  generateReport: async (reportType, customStart, customEnd) => {
    const params = {};
    if (customStart) params.custom_start = customStart;
    if (customEnd) params.custom_end = customEnd;
    
    const response = await api.get(`/analytics/reports/${reportType}`, { params });
    return response.data;
  },
  
  // Dashboard
  getDashboard: async (days = 30) => {
    const response = await api.get('/analytics/dashboard', {
      params: { days }
    });
    return response.data;
  },
  
  // Weekly Trends
  getWeeklyTrends: async (weeks = 4) => {
    const response = await api.get('/analytics/trends/weekly', {
      params: { weeks },
    });
    return response.data;
  },
  
  // Period Comparison
  getPeriodComparison: async (currentDays = 30, comparisonDays = 30) => {
    const response = await api.get('/analytics/comparisons/periods', {
      params: { 
        current_period_days: currentDays, 
        comparison_period_days: comparisonDays 
      },
    });
    return response.data;
  },
  
  // Export Analytics
  exportData: async (type, params = {}) => {
    const response = await api.post('/analytics/export', {
      export_type: type,
      params
    });
    return response.data;
  },
  
  exportCSV: async (reportType = 'weekly') => {
    const response = await api.get('/analytics/export/csv', {
      params: { report_type: reportType }
    });
    return response.data;
  },
  
  // Custom Report
  generateCustomReport: async (reportConfig) => {
    const response = await api.post('/analytics/custom-report', reportConfig);
    return response.data;
  },
};

// Activity API
export const activityAPI = {
  // Get user's activity history
  getUserActivities: async (params = {}) => {
    const response = await api.get('/api/v1/activities/me', { params });
    return response.data;
  },

  // Log a new activity (used internally by the app)
  logActivity: async (activityData) => {
    const response = await api.post('/api/v1/activities/', activityData);
    return response.data;
  },

  // Get activity statistics for dashboard
  getActivityStats: async (timeframe = '30d') => {
    const response = await api.get(`/api/v1/activities/stats`, {
      params: { timeframe }
    });
    return response.data;
  },

  // Clear activity history (optional feature)
  clearActivity: async (activityType = null) => {
    const params = activityType ? { type: activityType } : {};
    const response = await api.delete('/api/v1/activities/me', { params });
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  // Get user notifications
  getNotifications: async (unreadOnly = false, limit = 50, offset = 0) => {
    const response = await api.get('/notifications', {
      params: { unread_only: unreadOnly, limit, offset }
    });
    return response.data;
  },
  
  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  
  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  }
};

// Activity types constants
export const ACTIVITY_TYPES = {
  UPLOAD: 'upload',
  BOOKMARK: 'bookmark',
  DOWNLOAD: 'download',
  RATING: 'rating',
  VIEW: 'view',
  SEARCH: 'search'
};

// Helper function to log common activities for papers
export const logUserActivity = async (type, paperId, additionalData = {}) => {
  try {
    // Prepare activity data for backend - only include expected fields
    const activityPayload = {
      type,
      paper_id: paperId,
      // Convert additionalData to JSON string for metadata field if present
      metadata: Object.keys(additionalData).length > 0 ? JSON.stringify(additionalData) : null
    };
    
    // Log to backend
    const response = await activityAPI.logActivity(activityPayload);
    
    // Dispatch frontend activity update event
    if (response && response.paper_title) {
      dispatchActivityUpdate(type, {
        paperId,
        paperTitle: response.paper_title,
        action: additionalData.action || type.toLowerCase() + 'ed'
      });
    } else {
      // Fallback if no paper title in response
      dispatchActivityUpdate(type, {
        paperId,
        paperTitle: additionalData.paperTitle || 'Unknown Paper',
        action: additionalData.action || type.toLowerCase() + 'ed'
      });
    }
    
  } catch (error) {
    // Silently fail for activity logging to not disrupt user experience
    console.warn('Failed to log user activity:', error);
  }
};

// Helper function to log common activities for notes
export const logNoteActivity = async (type, noteId, additionalData = {}) => {
  try {
    // Prepare activity data for backend - only include expected fields
    const activityPayload = {
      type,
      note_id: noteId,
      // Convert additionalData to JSON string for metadata field if present
      metadata: Object.keys(additionalData).length > 0 ? JSON.stringify(additionalData) : null
    };
    
    // Log to backend
    const response = await activityAPI.logActivity(activityPayload);
    
    // Dispatch frontend activity update event
    if (response && response.note_title) {
      dispatchActivityUpdate(type, {
        noteId,
        noteTitle: response.note_title,
        action: additionalData.action || type.toLowerCase() + 'ed'
      });
    } else {
      // Fallback if no note title in response
      dispatchActivityUpdate(type, {
        noteId,
        noteTitle: additionalData.noteTitle || 'Unknown Note',
        action: additionalData.action || type.toLowerCase() + 'ed'
      });
    }
    
  } catch (error) {
    // Silently fail for activity logging to not disrupt user experience
    console.warn('Failed to log note activity:', error);
  }
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast.error('Failed to download file');
      throw error;
    }
  },
  
  // Validate file before upload
  validateFile: (file, maxSize = 50 * 1024 * 1024, allowedTypes = ['application/pdf']) => {
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    return true;
  },
  
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Format date
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
  
  // Format relative time
  formatRelativeTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  },
};

// Home API
export const homeAPI = {
  // Get homepage statistics
  getStats: async () => {
    const response = await api.get('/home/stats');
    return response.data;
  },
  
  // Get featured papers for homepage
  getFeaturedPapers: async (limit = 4) => {
    const response = await api.get('/home/featured-papers', {
      params: { limit }
    });
    return response.data;
  },
  
  // Get subject statistics for subject cards
  getSubjectStats: async (level = null) => {
    const params = level ? { level } : {};
    const response = await api.get('/home/subject-stats', { params });
    return response.data;
  },
  
  // Get trending topics
  getTrendingTopics: async () => {
    const response = await api.get('/home/trending-topics');
    return response.data;
  }
};

export default api;
