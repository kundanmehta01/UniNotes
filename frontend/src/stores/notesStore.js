import { create } from 'zustand';
import { notesAPI, logNoteActivity, ACTIVITY_TYPES } from '../lib/api';
import toast from 'react-hot-toast';

const useNotesStore = create((set, get) => ({
  // State
  notes: [],
  currentNote: null,
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
  fetchNotes: async (params = {}) => {
    set({ isLoading: true });
    
    try {
      const response = await notesAPI.getNotes(params);
      const notes = response.items || response.notes || response;
      
      set({
        notes: notes,
        totalCount: response.total || response.length || 0,
        currentPage: params.page || 1,
        isLoading: false,
      });
      return response;
    } catch (error) {
      console.error('fetchNotes error:', error);
      console.error('fetchNotes error response:', error.response);
      set({ isLoading: false });
      throw error;
    }
  },

  searchNotes: async (query, filters = {}) => {
    set({ isSearching: true, searchQuery: query });
    
    try {
      const params = {
        q: query,
        ...filters,
        ...get().filters,
      };
      
      // Log search activity
      if (query && query.trim()) {
        logNoteActivity(ACTIVITY_TYPES.SEARCH, null, { query: query.trim() });
      }
      
      const response = await notesAPI.getNotes(params);
      set({
        searchResults: response.items || response.notes || response,
        totalCount: response.total || response.length || 0,
        isSearching: false,
      });
      return response;
    } catch (error) {
      set({ isSearching: false });
      throw error;
    }
  },

  fetchNote: async (noteId) => {
    set({ isLoading: true });
    
    try {
      const note = await notesAPI.getNote(noteId);
      
      // Log view activity
      logNoteActivity(ACTIVITY_TYPES.VIEW, noteId);
      
      set({
        currentNote: note,
        isLoading: false,
      });
      return note;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createNote: async (noteData) => {
    set({ isLoading: true });
    
    try {
      const note = await notesAPI.createNote(noteData);
      
      // Log upload activity
      logNoteActivity(ACTIVITY_TYPES.UPLOAD, note.id);
      
      // Add to notes list if it matches current filters
      const { notes } = get();
      const currentNotes = Array.isArray(notes) ? notes : [];
      set({
        notes: [note, ...currentNotes],
        isLoading: false,
      });
      
      toast.success('Notes uploaded successfully! They will be reviewed by moderators.');
      return note;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateNote: async (noteId, noteData) => {
    set({ isLoading: true });
    
    try {
      const updatedNote = await notesAPI.updateNote(noteId, noteData);
      
      // Update in notes list
      const { notes } = get();
      const updatedNotes = Array.isArray(notes) ? notes.map(note => 
        note.id === noteId ? updatedNote : note
      ) : [];
      
      set({
        notes: updatedNotes,
        currentNote: updatedNote,
        isLoading: false,
      });
      
      toast.success('Notes updated successfully!');
      return updatedNote;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteNote: async (noteId) => {
    set({ isLoading: true });
    
    try {
      await notesAPI.deleteNote(noteId);
      
      // Remove from notes list
      const { notes } = get();
      const filteredNotes = Array.isArray(notes) ? notes.filter(note => note.id !== noteId) : [];
      
      set({
        notes: filteredNotes,
        currentNote: null,
        isLoading: false,
      });
      
      toast.success('Notes deleted successfully!');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  downloadNote: async (noteId) => {
    try {
      const response = await notesAPI.getDownloadUrl(noteId);
      
      // Find the note title from current state
      const { notes } = get();
      const notesArray = Array.isArray(notes) ? notes : [];
      const note = notesArray.find(n => n.id === noteId);
      const noteTitle = note?.title || 'Unknown Note';
      const fileName = note?.original_filename || `${noteTitle}.pdf`;
      
      // Log download activity
      logNoteActivity(ACTIVITY_TYPES.DOWNLOAD, noteId, {
        noteTitle: noteTitle
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
        
        // Get the file as blob
        const blob = await fileResponse.blob();
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        window.URL.revokeObjectURL(downloadUrl);
        
        // Update UI
        toast.dismiss(loadingToastId);
        toast.success(`${noteTitle} downloaded successfully!`);
        
      } catch (downloadError) {
        toast.dismiss(loadingToastId);
        console.error('File download error:', downloadError);
        throw downloadError;
      }
      
    } catch (error) {
      console.error('Download note error:', error);
      toast.error('Failed to download notes. Please try again.');
      throw error;
    }
  },

  bookmarkNote: async (noteId) => {
    try {
      const { notes } = get();
      const notesArray = Array.isArray(notes) ? notes : [];
      const note = notesArray.find(n => n.id === noteId);
      
      await notesAPI.bookmarkNote(noteId);
      
      // Update the notes list to reflect the bookmark change
      const updatedNotes = notesArray.map(n => 
        n.id === noteId ? { ...n, is_bookmarked: true } : n
      );
      set({ notes: updatedNotes });
      
      // Log bookmark activity
      logNoteActivity(ACTIVITY_TYPES.BOOKMARK, noteId, {
        noteTitle: note?.title || 'Unknown Note'
      });
      
      toast.success('Notes bookmarked successfully!');
      
      // Refresh bookmarks if they're currently loaded
      const { bookmarks } = get();
      if (bookmarks && bookmarks.length > 0) {
        get().fetchBookmarks();
      }
      
    } catch (error) {
      console.error('Bookmark note error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        toast.error('Note already bookmarked');
      } else {
        toast.error('Failed to bookmark notes. Please try again.');
      }
      throw error;
    }
  },

  removeBookmark: async (noteId) => {
    try {
      const { notes } = get();
      const notesArray = Array.isArray(notes) ? notes : [];
      const note = notesArray.find(n => n.id === noteId);
      
      await notesAPI.removeBookmark(noteId);
      
      // Update the notes list to reflect the bookmark change
      const updatedNotes = notesArray.map(n => 
        n.id === noteId ? { ...n, is_bookmarked: false } : n
      );
      set({ notes: updatedNotes });
      
      // Log unbookmark activity
      logNoteActivity(ACTIVITY_TYPES.BOOKMARK, noteId, {
        noteTitle: note?.title || 'Unknown Note',
        action: 'unbookmarked'
      });
      
      toast.success('Bookmark removed successfully!');
      
      // Refresh bookmarks if they're currently loaded
      const { bookmarks } = get();
      if (bookmarks && bookmarks.length > 0) {
        get().fetchBookmarks();
      }
      
    } catch (error) {
      console.error('Remove bookmark error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        toast.error('Bookmark not found');
      } else {
        toast.error('Failed to remove bookmark. Please try again.');
      }
      throw error;
    }
  },

  // Get user's bookmarked notes
  fetchBookmarks: async (params = { page: 1, limit: 20 }) => {
    set({ bookmarksLoading: true, bookmarksError: null });
    
    try {
      const response = await notesAPI.getBookmarks(params);
      // Backend returns a direct array of NoteBookmarkResponse objects
      const newBookmarks = Array.isArray(response) ? response : response.items || response.bookmarks || response;
      
      // Handle pagination - append or replace based on page
      const isFirstPage = !params.page || params.page === 1;
      const existingBookmarks = isFirstPage ? [] : get().bookmarks;
      
      set({
        bookmarks: isFirstPage ? newBookmarks : [...existingBookmarks, ...newBookmarks],
        bookmarksLoading: false,
        bookmarksHasMore: false, // Backend doesn't implement pagination for bookmarks yet
        bookmarksPagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: newBookmarks.length,
          total_pages: 1
        }
      });
      
      return response;
    } catch (error) {
      set({ 
        bookmarksLoading: false, 
        bookmarksError: error.message || 'Failed to fetch bookmarks' 
      });
      console.error('Fetch bookmarks error:', error);
      throw error;
    }
  },

  // Load more bookmarks (for pagination)
  loadMoreBookmarks: async () => {
    const { bookmarksPagination, bookmarksHasMore, bookmarksLoading } = get();
    
    if (!bookmarksHasMore || bookmarksLoading) {
      return;
    }
    
    const nextPage = (bookmarksPagination?.page || 0) + 1;
    return get().fetchBookmarks({ 
      page: nextPage, 
      limit: bookmarksPagination?.limit || 20 
    });
  },

  // Clear bookmarks state
  clearBookmarks: () => {
    set({
      bookmarks: [],
      bookmarksLoading: false,
      bookmarksError: null,
      bookmarksHasMore: false,
      bookmarksPagination: null
    });
  },

  rateNote: async (noteId, rating) => {
    try {
      const response = await notesAPI.rateNote(noteId, rating);
      
      const { notes } = get();
      const notesArray = Array.isArray(notes) ? notes : [];
      const note = notesArray.find(n => n.id === noteId);
      
      // Log rating activity
      logNoteActivity(ACTIVITY_TYPES.RATING, noteId, {
        noteTitle: note?.title || 'Unknown Note',
        rating: rating
      });
      
      toast.success('Rating submitted successfully!');
      return response;
    } catch (error) {
      console.error('Rate note error:', error);
      toast.error('Failed to submit rating. Please try again.');
      throw error;
    }
  },

  deleteRating: async (ratingId, noteId) => {
    try {
      await notesAPI.deleteRating(noteId);
      
      const { notes } = get();
      const notesArray = Array.isArray(notes) ? notes : [];
      const note = notesArray.find(n => n.id === noteId);
      
      // Log rating removal activity
      logNoteActivity(ACTIVITY_TYPES.RATING, noteId, {
        noteTitle: note?.title || 'Unknown Note',
        action: 'removed rating'
      });
      
      toast.success('Rating removed successfully!');
    } catch (error) {
      console.error('Delete rating error:', error);
      toast.error('Failed to remove rating. Please try again.');
      throw error;
    }
  },

  reportNote: async (noteId, reason, details) => {
    try {
      const response = await notesAPI.reportNote(noteId, reason, details);
      toast.success('Note reported successfully. Thank you for helping keep our community safe!');
      return response;
    } catch (error) {
      console.error('Report note error:', error);
      toast.error('Failed to report note. Please try again.');
      throw error;
    }
  },

  // Clear all state
  clearState: () => {
    set({
      notes: [],
      currentNote: null,
      searchResults: [],
      bookmarks: [],
      isLoading: false,
      isSearching: false,
      bookmarksLoading: false,
      bookmarksError: null,
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
      }
    });
  },

  // Update filters
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  // Clear search
  clearSearch: () => {
    set({
      searchResults: [],
      searchQuery: '',
      isSearching: false
    });
  }
}));

export default useNotesStore;
