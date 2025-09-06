import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  EnhancedSearch,
  FilterPanel,
  SortAndView,
  Breadcrumb,
  Loading,
  Pagination,
  Button,
  Card,
  CardContent
} from '../../components';
import NoteCard from '../../components/specialized/NoteCard';
import useNotesStore from '../../stores/notesStore';
import { homeAPI, notesAPI } from '../../lib/api';

// Helper function to generate dynamic filter options from notes data
const generateDynamicFilterOptions = (notes) => {
  // Count occurrences for each filter category
  const universityCounts = {};
  const subjectCounts = {};
  const programCounts = {};
  const yearCounts = {};
  const levelCounts = { undergraduate: 0, graduate: 0, postgraduate: 0 };
  
  notes.forEach(note => {
    // Count universities
    if (note.university?.name) {
      const univKey = note.university.name.toLowerCase().replace(/\s+/g, '-');
      universityCounts[univKey] = universityCounts[univKey] || { name: note.university.name, count: 0 };
      universityCounts[univKey].count++;
    }
    
    // Count subjects
    if (note.subject?.name) {
      const subjectKey = note.subject.name.toLowerCase().replace(/\s+/g, '-');
      subjectCounts[subjectKey] = subjectCounts[subjectKey] || { name: note.subject.name, count: 0 };
      subjectCounts[subjectKey].count++;
    }
    
    // Count programs/academic levels
    if (note.program?.name) {
      const programName = note.program.name.toLowerCase();
      if (programName.includes('bachelor') || programName.includes('b.')) {
        levelCounts.undergraduate++;
      } else if (programName.includes('master') || programName.includes('m.')) {
        levelCounts.graduate++;
      } else if (programName.includes('phd') || programName.includes('doctorate')) {
        levelCounts.postgraduate++;
      }
    }
    
    // Count years
    if (note.semester_year) {
      const year = note.semester_year.toString();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });
  
  // Convert to filter option format and sort by count
  const universities = Object.entries(universityCounts)
    .map(([key, data]) => ({ value: key, label: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10
  
  const subjects = Object.entries(subjectCounts)
    .map(([key, data]) => ({ value: key, label: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15
  
  const academic_levels = [
    { value: 'undergraduate', label: 'Undergraduate', count: levelCounts.undergraduate },
    { value: 'graduate', label: 'Graduate', count: levelCounts.graduate },
    { value: 'postgraduate', label: 'Postgraduate', count: levelCounts.postgraduate }
  ].filter(level => level.count > 0);
  
  const exam_years = Object.entries(yearCounts)
    .map(([year, count]) => ({ value: year, label: year, count }))
    .sort((a, b) => parseInt(b.value) - parseInt(a.value))
    .slice(0, 8); // Last 8 years
  
  // Generate upload date ranges (these are always the same)
  const upload_date_ranges = [
    { value: 'last-7-days', label: 'Last 7 days', count: 0 },
    { value: 'last-30-days', label: 'Last 30 days', count: 0 },
    { value: 'last-3-months', label: 'Last 3 months', count: 0 },
    { value: 'last-6-months', label: 'Last 6 months', count: 0 },
    { value: 'last-year', label: 'Last year', count: 0 }
  ];
  
  return {
    academic_levels,
    universities,
    subjects,
    upload_date_ranges,
    exam_years
  };
};

const Notes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notes, isLoading, totalCount, fetchNotes } = useNotesStore();
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(true);
  const pageSize = 12;
  
  // Debug auth state (logging disabled for cleaner console)
  // useEffect(() => {
  //   const token = localStorage.getItem('access_token');
  //   const user = localStorage.getItem('user');
  //   console.log('Notes page - Auth debug:', {
  //     hasToken: !!token,
  //     tokenLength: token?.length,
  //     hasUser: !!user,
  //     user: user ? JSON.parse(user) : null
  //   });
  // }, []);

  // Load suggestions for search
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const subjectStats = await homeAPI.getSubjectStats();
        const topSubjects = Object.keys(subjectStats).slice(0, 8);
        const suggestionList = topSubjects.map(subject => ({
          title: subject.charAt(0).toUpperCase() + subject.slice(1).replace(/-/g, ' '),
          subject: subject
        }));
        setSuggestions(suggestionList);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        setSuggestions([
          { title: 'Computer Science', subject: 'computer-science' },
          { title: 'Mathematics', subject: 'mathematics' },
          { title: 'Physics', subject: 'physics' },
          { title: 'Engineering', subject: 'engineering' },
          { title: 'Business', subject: 'business' }
        ]);
      }
    };
    
    loadSuggestions();
  }, []);

  // Load filter options - generate dynamically from notes data like papers page
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setFilterOptionsLoading(true);
        console.log('Loading dynamic filter options from notes data...');
        
        // First try to get filter options from API
        try {
          const apiOptions = await notesAPI.getFilterOptions();
          console.log('✅ API filter options loaded successfully:', apiOptions);
          setFilterOptions(apiOptions);
          return;
        } catch (apiError) {
          console.log('⚠️ API filter options failed, generating from notes data...');
        }
        
        // Fallback: Generate filter options from current notes data
        const notesResponse = await notesAPI.getNotes({ per_page: 100, status: 'APPROVED' });
        const allNotes = notesResponse.items || notesResponse.notes || [];
        
        console.log('📊 Generating filter options from', allNotes.length, 'notes');
        
        // Generate dynamic filter options
        const dynamicOptions = generateDynamicFilterOptions(allNotes);
        setFilterOptions(dynamicOptions);
        
      } catch (error) {
        console.error('❌ Failed to load any filter options:', error);
        // Set minimal fallback options
        setFilterOptions({
          academic_levels: [],
          universities: [],
          subjects: [],
          upload_date_ranges: [
            { value: 'last-7-days', label: 'Last 7 days', count: 0 },
            { value: 'last-30-days', label: 'Last 30 days', count: 0 },
            { value: 'last-3-months', label: 'Last 3 months', count: 0 },
          ],
          exam_years: []
        });
      } finally {
        setFilterOptionsLoading(false);
      }
    };
    
    loadFilterOptions();
  }, []);
  
  // Original filter options loading code (commented out):
  // useEffect(() => {
  //   const loadFilterOptions = async () => {
  //     try {
  //       setFilterOptionsLoading(true);
  //       console.log('Attempting to load filter options...');
  //       const options = await notesAPI.getFilterOptions();
  //       console.log('Filter options loaded successfully:', options);
  //       setFilterOptions(options);
  //     } catch (error) {
  //       console.error('Failed to load filter options - Full error:', error);
  //       console.error('Error response:', error.response);
  //       console.error('Error response data:', error.response?.data);
  //       console.error('Error response data error:', error.response?.data?.error);
  //       console.error('Error response data error details:', error.response?.data?.error?.details);
  //       console.error('Error status:', error.response?.status);
  //       
  //       // Set empty filter options to prevent loading state forever
  //       setFilterOptions({});
  //     } finally {
  //       setFilterOptionsLoading(false);
  //     }
  //   };
  //   
  //   loadFilterOptions();
  // }, []);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Browse Notes', href: '/notes' }
  ];

  // Load notes when component mounts or when filters/search/pagination changes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage,
          per_page: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          status: 'APPROVED',
          ...filters
        };
        
        if (searchQuery.trim()) {
          params.q = searchQuery.trim();
        }
        
        console.log('🔍 Loading notes with filters:', {
          filters,
          params,
          hasActiveFilters: Object.keys(filters).length > 0
        });
        
        await fetchNotes(params);
        
        console.log('📄 Notes loaded:', {
          totalCount,
          notesLength: notes?.length || 0,
          appliedFilters: Object.keys(filters)
        });
      } catch (error) {
        console.error('Failed to fetch notes:', error);
        setError('Failed to load notes. Please try again.');
      }
    };
    
    loadNotes();
  }, [currentPage, sortBy, sortOrder, filters, searchQuery, fetchNotes]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Apply client-side filtering if backend doesn't handle it properly
  const displayNotes = (() => {
    let filteredNotes = notes || [];
    
    // Only apply client-side filtering if we have active filters
    if (Object.keys(filters).length > 0) {
      console.log('🔧 Applying client-side filtering:', filters);
      
      filteredNotes = filteredNotes.filter(note => {
        // Academic level filter
        if (filters.academic_level) {
          const programName = note.program?.name?.toLowerCase() || '';
          const filterLevel = filters.academic_level;
          
          if (filterLevel === 'undergraduate' && !(programName.includes('bachelor') || programName.includes('b.'))) {
            return false;
          }
          if (filterLevel === 'graduate' && !(programName.includes('master') || programName.includes('m.'))) {
            return false;
          }
          if (filterLevel === 'postgraduate' && !(programName.includes('phd') || programName.includes('doctorate'))) {
            return false;
          }
        }
        
        // University filter
        if (filters.university) {
          const noteUnivKey = note.university?.name?.toLowerCase().replace(/\s+/g, '-') || '';
          if (noteUnivKey !== filters.university) {
            return false;
          }
        }
        
        // Subject filter
        if (filters.subject) {
          const noteSubjectKey = note.subject?.name?.toLowerCase().replace(/\s+/g, '-') || '';
          if (noteSubjectKey !== filters.subject) {
            return false;
          }
        }
        
        // Exam year filter
        if (filters.exam_year) {
          const noteYear = note.semester_year?.toString() || '';
          if (noteYear !== filters.exam_year) {
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`📊 Filtered ${notes?.length || 0} notes down to ${filteredNotes.length} notes`);
    }
    
    return filteredNotes;
  })();
  
  // Recalculate total pages based on filtered results if using client-side filtering
  const effectiveTotalCount = Object.keys(filters).length > 0 ? displayNotes.length : totalCount;
  const effectiveTotalPages = Math.ceil(effectiveTotalCount / pageSize);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSearchParams(query ? { q: query } : {});
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort) => {
    switch (newSort) {
      case 'newest':
        setSortBy('created_at');
        setSortOrder('desc');
        break;
      case 'oldest':
        setSortBy('created_at');
        setSortOrder('asc');
        break;
      case 'popular':
      case 'downloads':
        setSortBy('download_count');
        setSortOrder('desc');
        break;
      case 'title_asc':
        setSortBy('title');
        setSortOrder('asc');
        break;
      case 'title_desc':
        setSortBy('title');
        setSortOrder('desc');
        break;
      case 'rating':
        setSortBy('rating');
        setSortOrder('desc');
        break;
      default:
        setSortBy('created_at');
        setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
    setCurrentPage(1);
  };
  
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          
          {/* Page Header */}
          <div className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Browse Study Notes
                </h1>
                <p className="text-gray-600 mt-2">
                  Discover and download study notes and materials from students
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Search */}
          <div className="pb-8">
            <EnhancedSearch
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              suggestions={suggestions}
              filters={filters}
              placeholder="Search for study notes, lecture materials, and academic resources..."
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-8">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                filterOptions={filterOptions}
                contentType="notes"
              />
            </div>
          </div>

          {/* Notes Content */}
          <div className="flex-1 min-w-0">
            {/* Sort and View Controls */}
            <SortAndView
              currentSort={sortBy === 'created_at' && sortOrder === 'desc' ? 'newest' : 
                         sortBy === 'created_at' && sortOrder === 'asc' ? 'oldest' :
                         sortBy === 'download_count' ? 'downloads' :
                         sortBy === 'title' && sortOrder === 'asc' ? 'title_asc' :
                         sortBy === 'title' && sortOrder === 'desc' ? 'title_desc' :
                         sortBy === 'rating' ? 'rating' : 'newest'}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              resultsCount={effectiveTotalCount}
              contentType="notes"
            />

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notes Grid/List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loading text="Loading notes..." />
              </div>
            ) : displayNotes.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
                    : "space-y-4"
                }>
                  {displayNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      showActions={true}
                      showBookmark={true}
                      className={
                        viewMode === 'list'
                          ? "flex-row items-center"
                          : ""
                      }
                    />
                  ))}
                </div>

                {/* Pagination */}
                {effectiveTotalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={effectiveTotalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || Object.keys(filters).length > 0 ? 'No notes found' : 'No notes available'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || Object.keys(filters).length > 0 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Be the first to upload study notes to get started!'}
                </p>
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <div className="flex gap-3 justify-center">
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        Clear search
                      </button>
                    )}
                    {Object.keys(filters).length > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notes;
