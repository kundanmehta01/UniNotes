import { create } from 'zustand';
import { papersAPI, logUserActivity, ACTIVITY_TYPES } from '../lib/api';
import toast from 'react-hot-toast';

const usePapersStore = create((set, get) => ({
  // State
  papers: [],
  currentPaper: null,
  bookmarks: [],
  bookmarksLoading: false,
  bookmarksError: null,
  bookmarksHasMore: false,
  bookmarksPagination: null,
  searchResults: [],
  isLoading: false,
  isSearching: false,
  totalCount: 0,
  currentPage: 1,
  searchQuery: '',
  filters: {
    university: '',
    program: '',
    branch: '',
    semester: '',
    subject: '',
    year: '',
    status: 'approved',
  },

  // Actions
  fetchPapers: async (params = {}) => {
    set({ isLoading: true });
    
    try {
      const response = await papersAPI.getPapers(params);
      set({
        papers: response.items || response.papers || response,
        totalCount: response.total || response.length || 0,
        currentPage: params.page || 1,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  searchPapers: async (query, filters = {}) => {
    set({ isSearching: true, searchQuery: query });
    
    try {
      const params = {
        q: query,
        ...filters,
        ...get().filters,
      };
      
      // Log search activity
      if (query && query.trim()) {
        logUserActivity(ACTIVITY_TYPES.SEARCH, null, { query: query.trim() });
      }
      
      const response = await papersAPI.getPapers(params);
      set({
        searchResults: response.items || response.papers || response,
        totalCount: response.total || response.length || 0,
        isSearching: false,
      });
      return response;
    } catch (error) {
      set({ isSearching: false });
      throw error;
    }
  },

  fetchPaper: async (paperId) => {
    set({ isLoading: true });
    
    try {
      const paper = await papersAPI.getPaper(paperId);
      
      // Log view activity
      logUserActivity(ACTIVITY_TYPES.VIEW, paperId);
      
      set({
        currentPaper: paper,
        isLoading: false,
      });
      return paper;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createPaper: async (paperData) => {
    set({ isLoading: true });
    
    try {
      const paper = await papersAPI.createPaper(paperData);
      
      // Log upload activity
      logUserActivity(ACTIVITY_TYPES.UPLOAD, paper.id);
      
      // Add to papers list if it matches current filters
      const { papers } = get();
      const currentPapers = Array.isArray(papers) ? papers : [];
      set({
        papers: [paper, ...currentPapers],
        isLoading: false,
      });
      
      toast.success('Paper uploaded successfully! It will be reviewed by moderators.');
      return paper;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updatePaper: async (paperId, paperData) => {
    set({ isLoading: true });
    
    try {
      const updatedPaper = await papersAPI.updatePaper(paperId, paperData);
      
      // Update in papers list
      const { papers } = get();
      const updatedPapers = Array.isArray(papers) ? papers.map(paper => 
        paper.id === paperId ? updatedPaper : paper
      ) : [];
      
      set({
        papers: updatedPapers,
        currentPaper: updatedPaper,
        isLoading: false,
      });
      
      toast.success('Paper updated successfully!');
      return updatedPaper;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deletePaper: async (paperId) => {
    set({ isLoading: true });
    
    try {
      await papersAPI.deletePaper(paperId);
      
      // Remove from papers list
      const { papers } = get();
      const filteredPapers = Array.isArray(papers) ? papers.filter(paper => paper.id !== paperId) : [];
      
      set({
        papers: filteredPapers,
        currentPaper: null,
        isLoading: false,
      });
      
      toast.success('Paper deleted successfully!');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  downloadPaper: async (paperId) => {
    try {
      const response = await papersAPI.getDownloadUrl(paperId);
      
      // Find the paper title from current state
      const { papers } = get();
      const papersArray = Array.isArray(papers) ? papers : [];
      const paper = papersArray.find(p => p.id === paperId);
      const paperTitle = paper?.title || 'Unknown Paper';
      const fileName = paper?.original_filename || `${paperTitle}.pdf`;
      
      // Log download activity
      logUserActivity(ACTIVITY_TYPES.DOWNLOAD, paperId, {
        paperTitle: paperTitle
      });
      
      // Show loading toast
      const loadingToastId = toast.loading('Preparing download...');
      
      try {
        // Fetch the file with proper headers
        const fileResponse = await fetch(response.download_url, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf,*/*',
          },
        });
        
        if (!fileResponse.ok) {
          throw new Error(`Download failed: ${fileResponse.status} ${fileResponse.statusText}`);
        }
        
        // Get the blob
        const blob = await fileResponse.blob();
        
        // Create a blob URL and download
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        // Show success message
        toast.dismiss(loadingToastId);
        toast.success('Download completed!');
        
      } catch (downloadError) {
        toast.dismiss(loadingToastId);
        console.error('Download error:', downloadError);
        toast.error('Download failed. Please try again.');
        throw downloadError;
      }
      
      return response;
    } catch (error) {
      console.error('Download preparation error:', error);
      toast.error('Failed to prepare download.');
      throw error;
    }
  },

  bookmarkPaper: async (paperId) => {
    try {
      const response = await papersAPI.bookmarkPaper(paperId);
      
      // Get current state once
      const { papers, bookmarks } = get();
      
      // Determine the new bookmark status from backend response
      const isBookmarked = response.bookmarked === true;
      
      console.log('Bookmark response:', response, 'isBookmarked:', isBookmarked);
      
      // Find the paper title from current state
      const papersArray = Array.isArray(papers) ? papers : [];
      const paperTitle = papersArray.find(p => p.id === paperId)?.title || 'Unknown Paper';
      
      // Log activity (non-blocking - don't let this fail the bookmark operation)
      try {
        logUserActivity(ACTIVITY_TYPES.BOOKMARK, paperId, {
          action: isBookmarked ? 'bookmarked' : 'unbookmarked',
          paperTitle: paperTitle
        });
      } catch (activityError) {
        console.warn('Failed to log bookmark activity:', activityError);
        // Continue with bookmark operation even if activity logging fails
      }
      
      // Update papers list to reflect the actual bookmark status from backend
      const updatedPapers = Array.isArray(papers) ? papers.map(paper => 
        paper.id === paperId 
          ? { ...paper, is_bookmarked: isBookmarked }
          : paper
      ) : [];
      
      // Update bookmarks list - if bookmarked, add to list; if unbookmarked, remove from list
      let updatedBookmarks = Array.isArray(bookmarks) ? [...bookmarks] : [];
      
      if (isBookmarked) {
        // If bookmarked and not already in bookmarks list, add it
        const paperInBookmarks = updatedBookmarks.find(p => p.id === paperId);
        if (!paperInBookmarks) {
          const paperToAdd = papersArray.find(p => p.id === paperId);
          if (paperToAdd) {
            updatedBookmarks.unshift({ ...paperToAdd, is_bookmarked: true });
          }
        }
      } else {
        // If unbookmarked, remove from bookmarks list
        updatedBookmarks = updatedBookmarks.filter(paper => paper.id !== paperId);
      }
      
      set({ 
        papers: updatedPapers,
        bookmarks: updatedBookmarks
      });
      
      toast.success(isBookmarked ? 'Paper bookmarked!' : 'Bookmark removed!');
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  fetchBookmarks: async (params = {}) => {
    set({ bookmarksLoading: true, bookmarksError: null });
    
    try {
      const response = await papersAPI.getBookmarks(params);
      const bookmarksData = response.papers || response.items || response;
      const pagination = response.pagination || null;
      
      set({
        bookmarks: bookmarksData,
        bookmarksPagination: pagination,
        bookmarksHasMore: pagination ? pagination.page < pagination.total_pages : false,
        bookmarksLoading: false,
        bookmarksError: null,
      });
      return response;
    } catch (error) {
      set({ 
        bookmarksLoading: false, 
        bookmarksError: error.message || 'Failed to load bookmarks'
      });
      throw error;
    }
  },

  clearBookmarks: () => {
    set({
      bookmarks: [],
      bookmarksLoading: false,
      bookmarksError: null,
      bookmarksHasMore: false,
      bookmarksPagination: null,
    });
  },

  reportPaper: async (paperId, reason, details) => {
    try {
      const response = await papersAPI.reportPaper(paperId, reason, details);
      toast.success('Paper reported successfully. Thank you for helping keep our platform safe!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Rate a paper
  ratePaper: async (paperId, rating) => {
    try {
      console.log('Rating paper:', paperId, 'with rating:', rating);
      const response = await papersAPI.ratePaper(paperId, rating);
      console.log('Rating response:', response);
      
      // Find the paper title from current state
      const { papers } = get();
      const papersArray = Array.isArray(papers) ? papers : [];
      const paperTitle = papersArray.find(p => p.id === paperId)?.title || 'Unknown Paper';
      
      // Log rating activity
      try {
        logUserActivity(ACTIVITY_TYPES.RATING, paperId, {
          rating: rating,
          action: 'rated',
          paperTitle: paperTitle
        });
      } catch (activityError) {
        console.warn('Failed to log rating activity:', activityError);
      }
      
      // Update paper rating data in state
      const ratingData = {
        average_rating: response.average_rating,
        total_ratings: response.total_ratings,
        user_rating: rating,
        user_rating_id: response.rating_id
      };
      
      console.log('Updating paper rating data:', ratingData);
      get().updatePaperRating(paperId, ratingData);
      
      toast.success(`Paper rated ${rating} star${rating > 1 ? 's' : ''}!`);
      return response;
    } catch (error) {
      console.error('Rating error details:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to rate paper';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Update existing rating
  updateRating: async (ratingId, newRating, paperId) => {
    try {
      console.log('Updating rating:', ratingId, 'to:', newRating, 'for paper:', paperId);
      const response = await papersAPI.updateRating(ratingId, newRating);
      console.log('Update rating response:', response);
      
      // Find the paper title from current state
      const { papers } = get();
      const papersArray = Array.isArray(papers) ? papers : [];
      const paperTitle = papersArray.find(p => p.id === paperId)?.title || 'Unknown Paper';
      
      // Log rating update activity
      try {
        logUserActivity(ACTIVITY_TYPES.RATING, paperId, {
          rating: newRating,
          action: 'updated rating',
          paperTitle: paperTitle
        });
      } catch (activityError) {
        console.warn('Failed to log rating update activity:', activityError);
      }
      
      // Update paper rating data in state
      const ratingData = {
        average_rating: response.average_rating,
        total_ratings: response.total_ratings,
        user_rating: newRating,
        user_rating_id: ratingId
      };
      
      console.log('Updating rating data in state:', ratingData);
      get().updatePaperRating(paperId, ratingData);
      
      toast.success(`Rating updated to ${newRating} star${newRating > 1 ? 's' : ''}!`);
      return response;
    } catch (error) {
      console.error('Update rating error details:', error);
      console.error('Update rating error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to update rating';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Delete rating
  deleteRating: async (ratingId, paperId) => {
    try {
      console.log('Deleting rating:', ratingId, 'for paper:', paperId);
      const response = await papersAPI.deleteRating(ratingId);
      console.log('Delete rating response:', response);
      
      // Find the paper title from current state
      const { papers } = get();
      const papersArray = Array.isArray(papers) ? papers : [];
      const paperTitle = papersArray.find(p => p.id === paperId)?.title || 'Unknown Paper';
      
      // Log rating deletion activity
      try {
        logUserActivity(ACTIVITY_TYPES.RATING, paperId, {
          action: 'removed rating',
          paperTitle: paperTitle
        });
      } catch (activityError) {
        console.warn('Failed to log rating deletion activity:', activityError);
      }
      
      // Update paper rating data in state
      const ratingData = {
        average_rating: response.average_rating,
        total_ratings: response.total_ratings,
        user_rating: null,
        user_rating_id: null
      };
      
      console.log('Updating rating data after deletion:', ratingData);
      get().updatePaperRating(paperId, ratingData);
      
      toast.success('Rating removed!');
      return response;
    } catch (error) {
      console.error('Delete rating error details:', error);
      console.error('Delete rating error response:', error.response?.data);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to remove rating';
      toast.error(errorMessage);
      throw error;
    }
  },
  
  // Update just the rating data for a paper (internal helper)
  updatePaperRating: (paperId, ratingData) => {
    const { papers, bookmarks, currentPaper } = get();
    
    // Update papers list
    const updatedPapers = Array.isArray(papers) ? papers.map(paper => 
      paper.id === paperId 
        ? { ...paper, ...ratingData }
        : paper
    ) : [];
    
    // Update bookmarks list if the paper is bookmarked
    const updatedBookmarks = Array.isArray(bookmarks) ? bookmarks.map(paper => 
      paper.id === paperId 
        ? { ...paper, ...ratingData }
        : paper
    ) : [];
    
    // Update current paper if it matches
    const updatedCurrentPaper = currentPaper && currentPaper.id === paperId 
      ? { ...currentPaper, ...ratingData }
      : currentPaper;
    
    set({
      papers: updatedPapers,
      bookmarks: updatedBookmarks,
      currentPaper: updatedCurrentPaper
    });
  },

  moderatePaper: async (paperId, action, notes) => {
    set({ isLoading: true });
    
    try {
      const response = await papersAPI.moderatePaper(paperId, action, notes);
      
      // Update paper status in the list
      const { papers } = get();
      const updatedPapers = Array.isArray(papers) ? papers.map(paper => 
        paper.id === paperId 
          ? { ...paper, status: action === 'approve' ? 'approved' : 'rejected' }
          : paper
      ) : [];
      
      set({
        papers: updatedPapers,
        isLoading: false,
      });
      
      toast.success(`Paper ${action}d successfully!`);
      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Filter actions
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
  },

  clearFilters: () => {
    set({
      filters: {
        university: '',
        program: '',
        branch: '',
        semester: '',
        subject: '',
        year: '',
        status: 'approved',
      },
      searchQuery: '',
    });
  },

  // Pagination
  setCurrentPage: (page) => {
    set({ currentPage: page });
  },

  // Clear state
  clearSearchResults: () => {
    set({
      searchResults: [],
      searchQuery: '',
    });
  },

  clearCurrentPaper: () => {
    set({ currentPaper: null });
  },

  // Utility functions
  getPapersBySubject: (subjectId) => {
    const { papers } = get();
    return Array.isArray(papers) ? papers.filter(paper => paper.subject_id === subjectId) : [];
  },

  getPapersByUser: (userId) => {
    const { papers } = get();
    return Array.isArray(papers) ? papers.filter(paper => paper.uploader_id === userId) : [];
  },

  getPendingPapers: () => {
    const { papers } = get();
    return Array.isArray(papers) ? papers.filter(paper => paper.status === 'pending') : [];
  },
}));

export default usePapersStore;
