import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  EnhancedSearch,
  FilterPanel,
  SortAndView,
  Breadcrumb,
  PaperCard,
  Loading,
  Pagination
} from '../../components';
import usePapersStore from '../../stores/papersStore';
import { homeAPI, papersAPI } from '../../lib/api';

const Papers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { papers, isLoading, totalCount, fetchPapers } = usePapersStore();
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
        // Use fallback suggestions
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

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setFilterOptionsLoading(true);
        const options = await papersAPI.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
        // Keep filterOptions as null to show loading state
      } finally {
        setFilterOptionsLoading(false);
      }
    };
    
    loadFilterOptions();
  }, []);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Browse Papers', href: '/papers' }
  ];

  // Load papers when component mounts or when filters/search/pagination changes
  useEffect(() => {
    const loadPapers = async () => {
      try {
        setError(null);
        const params = {
          page: currentPage,
          page_size: pageSize,
          sort: sortBy,
          order: sortOrder,
          status: 'APPROVED', // Only show approved papers
          ...filters
        };
        
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        
        console.log('Papers page - Loading papers with params:', params);
        await fetchPapers(params);
        console.log('Papers page - After fetchPapers, displayPapers length:', papers?.length || 0);
      } catch (error) {
        console.error('Failed to fetch papers:', error);
        setError('Failed to load papers. Please try again.');
      }
    };
    
    loadPapers();
  }, [currentPage, sortBy, sortOrder, filters, searchQuery, fetchPapers]);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Use papers from store
  const displayPapers = papers || [];

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSearchParams(query ? { q: query } : {});
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (newSort) => {
    // Handle sort options from SortAndView component
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
    setCurrentPage(1); // Reset to first page when sort changes
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
                  Browse Academic Papers
                </h1>
                <p className="text-gray-600 mt-2">
                  Discover and download academic resources from top universities
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
              placeholder="Search for papers, notes, and academic resources..."
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
                contentType="papers"
              />
            </div>
          </div>

          {/* Papers Content */}
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
              resultsCount={totalCount}
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
            
            {/* Papers Grid/List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loading text="Loading papers..." />
              </div>
            ) : displayPapers.length > 0 ? (
              <>
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
                    : "space-y-4"
                }>
                  {displayPapers.map((paper) => (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
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
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
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
                  {searchQuery || Object.keys(filters).length > 0 ? 'No papers found' : 'No papers available'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || Object.keys(filters).length > 0 
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Be the first to upload a paper to get started!'}
                </p>
                {(searchQuery || Object.keys(filters).length > 0) && (
                  <div className="flex gap-3 justify-center">
                    {searchQuery && (
                      <button
                        onClick={handleClearSearch}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Clear search
                      </button>
                    )}
                    {Object.keys(filters).length > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
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

export default Papers;
