// API Configuration and Exports
import axios from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Activity types for logging
export const ACTIVITY_TYPES = {
  VIEW: 'VIEW',
  DOWNLOAD: 'DOWNLOAD',
  SEARCH: 'SEARCH',
  BOOKMARK: 'BOOKMARK',
  RATING: 'RATING',
  UPLOAD: 'UPLOAD',
};

// Activity logging function
export const logNoteActivity = async (activityType, noteId, metadata = {}) => {
  try {
    // Optional activity logging - don't throw errors if this fails
    await apiClient.post('/activity/log', {
      activity_type: activityType,
      note_id: noteId,
      metadata: JSON.stringify(metadata)
    });
  } catch (error) {
    console.debug('Activity logging failed:', error);
    // Don't throw - this is not critical
  }
};

// Notes API
export const notesAPI = {
  // Get notes with filtering and pagination
  getNotes: async (params = {}) => {
    const response = await apiClient.get('/notes/', { params });
    return response.data;
  },

  // Get a single note by ID
  getNote: async (noteId) => {
    const response = await apiClient.get(`/notes/${noteId}`);
    return response.data;
  },

  // Create a new note
  createNote: async (noteData) => {
    const response = await apiClient.post('/notes/', noteData);
    return response.data;
  },

  // Update a note
  updateNote: async (noteId, noteData) => {
    const response = await apiClient.put(`/notes/${noteId}`, noteData);
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId) => {
    const response = await apiClient.delete(`/notes/${noteId}`);
    return response.data;
  },

  // Get pending notes for admin moderation
  getPendingNotes: async (page = 1, pageSize = 12) => {
    const response = await apiClient.get('/notes/pending/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  // Update note status (admin only)
  updateNoteStatus: async (noteId, statusData) => {
    const response = await apiClient.put(`/notes/${noteId}/status`, statusData);
    return response.data;
  },

  // Get download URL for a note
  getDownloadUrl: async (noteId) => {
    const response = await apiClient.post(`/notes/${noteId}/download`);
    return response.data;
  },

  // Bookmark a note
  bookmarkNote: async (noteId) => {
    const response = await apiClient.post('/notes/bookmarks', { note_id: noteId });
    return response.data;
  },

  // Remove bookmark
  removeBookmark: async (noteId) => {
    const response = await apiClient.delete(`/notes/bookmarks/${noteId}`);
    return response.data;
  },

  // Get user's bookmarks
  getBookmarks: async (params = {}) => {
    const response = await apiClient.get('/notes/bookmarks/my', { params });
    return response.data;
  },

  // Rate a note
  rateNote: async (noteId, rating) => {
    const response = await apiClient.post('/notes/ratings', { note_id: noteId, rating });
    return response.data;
  },

  // Remove rating
  removeRating: async (noteId) => {
    const response = await apiClient.delete(`/notes/ratings/${noteId}`);
    return response.data;
  },

  // Report a note
  reportNote: async (noteId, reason, details = null) => {
    const response = await apiClient.post('/notes/reports', { 
      note_id: noteId, 
      reason, 
      details 
    });
    return response.data;
  },

  // Get filter options for notes
  getFilterOptions: async () => {
    const response = await apiClient.get('/notes/filter-options');
    return response.data;
  }
};

// Papers API (similar structure)
export const papersAPI = {
  // Get papers with filtering
  getPapers: async (params = {}) => {
    const response = await apiClient.get('/papers/', { params });
    return response.data;
  },

  // Get a single paper by ID  
  getPaper: async (paperId) => {
    const response = await apiClient.get(`/papers/${paperId}`);
    return response.data;
  },

  // Create a new paper
  createPaper: async (paperData) => {
    const response = await apiClient.post('/papers/', paperData);
    return response.data;
  },

  // Get pending papers for admin moderation
  getPendingPapers: async (page = 1, pageSize = 12) => {
    const response = await apiClient.get('/papers/pending/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  // Update paper status (admin only)
  updatePaperStatus: async (paperId, statusData) => {
    const response = await apiClient.put(`/papers/${paperId}/status`, statusData);
    return response.data;
  },

  // Get filter options for papers
  getFilterOptions: async () => {
    const response = await apiClient.get('/papers/filter-options');
    return response.data;
  }
};

// Taxonomy API (for university, program, branch, etc.)
export const taxonomyAPI = {
  getUniversities: async () => {
    const response = await apiClient.get('/taxonomy/universities/');
    return response.data;
  },

  getPrograms: async (universityId) => {
    const response = await apiClient.get(`/taxonomy/universities/${universityId}/programs/`);
    return response.data;
  },

  getBranches: async (programId) => {
    const response = await apiClient.get(`/taxonomy/programs/${programId}/branches/`);
    return response.data;
  },

  getSemesters: async (branchId) => {
    const response = await apiClient.get(`/taxonomy/branches/${branchId}/semesters/`);
    return response.data;
  },

  getSubjects: async (semesterId) => {
    const response = await apiClient.get(`/taxonomy/semesters/${semesterId}/subjects/`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/taxonomy/stats/');
    return response.data;
  }
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard/');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await apiClient.get('/admin/users/', { params });
    return response.data;
  },

  updateUserStatus: async (userId, statusData) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, statusData);
    return response.data;
  }
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put('/auth/me', profileData);
    return response.data;
  }
};

// Home API (for general statistics and suggestions)
export const homeAPI = {
  getSubjectStats: async () => {
    const response = await apiClient.get('/home/subject-stats');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await apiClient.get('/home/dashboard');
    return response.data;
  }
};

// Export the axios client for direct use if needed
export { apiClient };
export default apiClient;
