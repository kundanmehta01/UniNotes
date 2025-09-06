import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaperCard, Loading, Pagination, Button, Input, Select, Breadcrumb } from '../components';
import usePapersStore from '../stores/papersStore';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const Bookmarks = () => {
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    university: '',
    semester: '',
    year: '',
    sort: 'newest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    bookmarks, 
    bookmarksLoading, 
    bookmarksError,
    bookmarksHasMore,
    bookmarksPagination,
    fetchBookmarks,
    clearBookmarks
  } = usePapersStore();
  
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Set document title
  useEffect(() => {
    document.title = 'Bookmarks - UniNotesHub';
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to view your bookmarks');
      navigate('/auth/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Fetch bookmarks on component mount and when filters change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      try {
        await fetchBookmarks({
          page: currentPage,
          ...filters
        });
      } catch (error) {
        toast.error('Failed to load bookmarks');
      }
    };

    fetchData();
  }, [isAuthenticated, currentPage, filters, fetchBookmarks]);

  // Clean up bookmarks when component unmounts
  useEffect(() => {
    return () => {
      clearBookmarks();
    };
  }, [clearBookmarks]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (bookmarksError) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
              <p className="text-gray-600 mt-2">Your saved papers and notes</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load bookmarks</h3>
            <p className="text-gray-600 mb-4">{bookmarksError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-4">
            <Breadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Bookmarks', href: '/bookmarks' }
              ]} 
            />
          </div>
          
          {/* Page Header */}
          <div className="pb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Bookmarks</h1>
            <p className="text-gray-600 mt-2">Your saved papers and notes</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search your bookmarked papers..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange({ ...filters, sort: e.target.value })}
                  className="min-w-[120px]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A-Z</option>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {bookmarksLoading && bookmarks.length === 0 && (
          <div className="flex justify-center py-12">
            <Loading text="Loading your bookmarks..." />
          </div>
        )}

        {/* Empty State */}
        {!bookmarksLoading && bookmarks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
            <p className="text-gray-600 mb-6">Start bookmarking papers you find useful and they'll appear here.</p>
            <Link to="/papers">
              <Button>Browse Papers</Button>
            </Link>
          </div>
        )}

        {/* Bookmarks Grid */}
        {bookmarks.length > 0 && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {bookmarksPagination?.total_results 
                    ? `${bookmarksPagination.total_results} bookmark${bookmarksPagination.total_results !== 1 ? 's' : ''} found`
                    : `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}`
                  }
                </p>
                
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange({ ...filters, search: '' })}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {bookmarks.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  showActions={true}
                  showBookmark={true}
                  className="h-full"
                />
              ))}
            </div>

            {/* Pagination */}
            {bookmarksPagination && bookmarksPagination.total_pages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={bookmarksPagination.total_pages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}

        {/* Loading More State */}
        {bookmarksLoading && bookmarks.length > 0 && (
          <div className="flex justify-center py-8">
            <Loading size="sm" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
