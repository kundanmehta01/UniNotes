import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button, 
  Badge,
  Alert,
  AlertDescription,
  Loading,
  PaperCard,
  Pagination
} from '../../components';
import { papersAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchBookmarks();
  }, [currentPage]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const data = await papersAPI.getBookmarks({
        page: currentPage,
        limit: itemsPerPage
      });
      
      setBookmarks(data.items || data.papers || data);
      setTotalPages(data.total_pages || Math.ceil((data.total || data.length) / itemsPerPage));
      setTotalCount(data.total || data.length || 0);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (paperId) => {
    try {
      // The bookmark API is a toggle - calling it on a bookmarked paper will remove the bookmark
      const result = await papersAPI.bookmarkPaper(paperId);
      
      if (!result.bookmarked) {
        toast.success('Bookmark removed');
        // Update local state
        setBookmarks(prev => prev.filter(paper => paper.id !== paperId));
        setTotalCount(prev => prev - 1);
      } else {
        toast.error('Failed to remove bookmark');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookmarks</h1>
        <p className="text-gray-600">
          {totalCount > 0 
            ? `You have ${totalCount} bookmarked ${totalCount === 1 ? 'paper' : 'papers'}`
            : 'You haven\'t bookmarked any papers yet'
          }
        </p>
      </div>

      {bookmarks.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
          <p className="text-gray-600 mb-6">
            Start exploring papers and bookmark the ones you want to save for later.
          </p>
          <Link to="/papers">
            <Button>
              Browse Papers
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Bookmarks Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {bookmarks.map((paper) => (
              <div key={paper.id} className="relative">
                <PaperCard 
                  paper={paper}
                  showBookmark={false}
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveBookmark(paper.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove Bookmark
                    </Button>
                  }
                />
              </div>
            ))}
          </div>

          {/* Loading overlay for pagination */}
          {isLoading && currentPage > 1 && (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showInfo={true}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Bookmarks;
