import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Rating from '../ui/Rating';
import ReportModal from '../ui/ReportModal';
import PreviewModal from '../ui/PreviewModal';
import usePapersStore from '../../stores/papersStore';
import useAuthStore from '../../stores/authStore';
import { formatDate, formatFileSize, truncateText, getAcademicLevel } from '../../lib/utils';
import { papersAPI } from '../../lib/api';
import { ACTIVITY_TYPES } from '../../utils/activityEvents';
import toast from 'react-hot-toast';

const PaperCard = ({ paper, showActions = true, showBookmark = true, showStatus = false, actions = null, className }) => {
  // Safety check for malformed paper data
  if (!paper || typeof paper !== 'object') {
    console.error('PaperCard received invalid paper object:', paper);
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-600 text-sm">Error: Invalid paper data</p>
      </div>
    );
  }
  
  // Ensure required properties exist
  if (!paper.id || !paper.title) {
    console.error('PaperCard received paper missing required fields:', {
      id: paper.id,
      title: paper.title,
      fullPaper: paper
    });
    return (
      <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
        <p className="text-yellow-600 text-sm">Error: Paper missing required data</p>
      </div>
    );
  }
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [userRating, setUserRating] = useState(paper.user_rating || 0);
  const [isBookmarked, setIsBookmarked] = useState(paper.is_bookmarked || false);
  const { bookmarkPaper, downloadPaper, ratePaper, deleteRating } = usePapersStore();
  const { isAuthenticated, user } = useAuthStore();
  
  // Sync userRating and bookmark state with paper data when it changes
  useEffect(() => {
    setUserRating(paper.user_rating || 0);
    setIsBookmarked(paper.is_bookmarked || false);
  }, [paper.user_rating, paper.is_bookmarked]);
  
  // Force showBookmark to true for debugging
  const forceShowBookmark = true;

  // Determine academic level dynamically from program name
  const academicLevel = getAcademicLevel(paper.program_name);
  
  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark papers');
      return;
    }

    // Debug logging
    console.log('handleBookmark called:', {
      paperId: paper.id,
      paperTitle: paper.title,
      isBookmarked: paper.is_bookmarked,
      localIsBookmarked: isBookmarked
    });

    setIsBookmarking(true);
    try {
      // The bookmarkPaper function toggles the bookmark state automatically
      console.log('Toggling bookmark for paper:', paper.id, 'current state:', isBookmarked);
      const response = await bookmarkPaper(paper.id);
      
      // Update local state based on the response
      if (response && typeof response.bookmarked === 'boolean') {
        setIsBookmarked(response.bookmarked);
        console.log('Bookmark toggled successfully, new state:', response.bookmarked);
      } else {
        // Fallback: toggle the local state
        setIsBookmarked(!isBookmarked);
        console.log('Bookmark toggled (fallback), new state:', !isBookmarked);
      }
    } catch (error) {
      // Error handling is done in the store methods
      console.error('Bookmark error:', error);
      // Revert local state on error
      setIsBookmarked(paper.is_bookmarked || false);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to download papers');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadPaper(paper.id);
    } catch (error) {
      toast.error('Failed to download paper');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to rate papers');
      return;
    }

    // Users can't rate their own papers
    if (user && paper.uploader_id === user.id) {
      toast.error('You cannot rate your own paper');
      return;
    }

    setIsRating(true);
    try {
      if (paper.user_rating && rating === paper.user_rating) {
        // Same rating clicked, delete the rating
        await deleteRating(paper.user_rating_id, paper.id);
        setUserRating(0);
      } else {
        // New rating or different rating - ratePaper handles both create and update
        await ratePaper(paper.id, rating);
        setUserRating(rating);
      }
    } catch (error) {
      console.error('Rating error:', error);
      // Error handling is done in the store methods
    } finally {
      setIsRating(false);
    }
  };

  const handleReport = async (reportData) => {
    setIsReporting(true);
    try {
      await papersAPI.reportPaper(paper.id, reportData.reason, reportData.details);
      setShowReportModal(false);
      toast.success('Report submitted successfully. Thank you for helping keep our platform safe!');
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase();
    const badges = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[normalizedStatus] || badges.pending}`}>
        {normalizedStatus ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1) : 'Pending'}
      </span>
    );
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm ${className}`}>
      <CardContent className="p-6">
        {/* Header with status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {paper.subject_name && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📝 {paper.subject_name}
                </span>
              )}
              {academicLevel && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${academicLevel === 'undergraduate' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                  {academicLevel === 'undergraduate' ? 'Undergraduate' : 'Graduate'}
                </span>
              )}
            </div>
            <Link 
              to={`/papers/${paper.id}`}
              className="block group"
            >
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 mb-2">
                {paper.title}
              </h3>
            </Link>
          </div>
          
          {paper.status && (
            <div className="ml-3">
              {getStatusBadge(paper.status)}
            </div>
          )}
        </div>

        {paper.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {truncateText(paper.description, 150)}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="space-y-3">
          {/* University and Level */}
          {paper.university_name && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs">🏛️</span>
              </div>
              <span className="font-medium">{paper.university_name}</span>
              {paper.semester_name && paper.year && (
                <span className="ml-2 text-gray-500">• {paper.semester_name} {paper.year}</span>
              )}
            </div>
          )}

          {/* Author and File Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs">👤</span>
              </div>
              <span>
                {paper.uploader 
                  ? `${paper.uploader.first_name || ''} ${paper.uploader.last_name || ''}`.trim() || paper.uploader.email || 'Anonymous'
                  : 'Anonymous'
                }
              </span>
            </div>
            
            <div className="flex items-center text-gray-500">
              <span className="text-xs mr-1">📄</span>
              <span className="text-xs">
                {paper.file_size ? formatFileSize(paper.file_size) : 'PDF'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-xs mr-1">📥</span>
                <span>{paper.download_count || 0} downloads</span>
              </div>
            </div>
            <div className="text-xs">
              {formatDate(paper.created_at)}
            </div>
          </div>

          {/* Tags - if papers have tags */}
          {paper.tags && paper.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {paper.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
                >
                  #{tag.name || tag}
                </span>
              ))}
              {paper.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-500">
                  +{paper.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Actions Footer */}
      {showActions && (
        <CardFooter className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between w-full">
            {/* Rating */}
            <div className="flex items-center space-x-2">
              <Rating
                value={userRating}
                onChange={handleRating}
                readonly={isRating || (!isAuthenticated)}
                size="small"
                showValue={false}
              />
              {paper.average_rating && (
                <span className="text-sm text-gray-500">
                  ({paper.average_rating.toFixed(1)})
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Bookmark Button */}
              {(showBookmark || forceShowBookmark) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  className={`p-2 transition-colors ${isBookmarked ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-500 hover:text-yellow-600'}`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark this paper'}
                >
                  {isBookmarking ? (
                    <span className="text-sm animate-pulse">⏳</span>
                  ) : (
                    <svg 
                      className="w-4 h-4" 
                      fill={isBookmarked ? 'currentColor' : 'none'}
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={isBookmarked ? 0 : 2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  )}
                </Button>
              )}

              {/* Preview Button - Available to all users for approved papers */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreviewModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                title="Preview paper"
              >
                <span className="flex items-center">
                  <svg 
                    className="w-3 h-3 mr-1" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                    />
                  </svg>
                  <span className="text-xs">Preview</span>
                </span>
              </Button>

              {/* Download Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                {isDownloading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-1">⚪</span>
                    <span className="text-xs">Downloading...</span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="text-sm mr-1">📥</span>
                    <span className="text-xs">Download</span>
                  </span>
                )}
              </Button>

              {/* Report Button */}
              {isAuthenticated && user && paper.uploader_id !== user.id && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowReportModal(true);
                    }}
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Report this paper"
                  >
                    <span className="flex items-center">
                      <svg 
                        className="w-3 h-3 mr-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                        />
                      </svg>
                      <span className="text-xs">Report</span>
                    </span>
                  </Button>
                  
                  {showReportModal && (
                    <ReportModal
                      isOpen={showReportModal}
                      onClose={() => setShowReportModal(false)}
                      onSubmit={handleReport}
                      isSubmitting={isReporting}
                      contentType="paper"
                      contentTitle={paper.title}
                    />
                  )}
                </>
              )}

              {/* Custom Actions */}
              {actions && actions.length > 0 && (
                <div className="flex space-x-1">
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'ghost'}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        action.onClick(paper);
                      }}
                      className={action.className}
                      disabled={action.disabled}
                    >
                      {action.icon && <span className="mr-1">{action.icon}</span>}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          item={paper}
          itemType="paper"
          onDownload={handleDownload}
          showDownloadButton={true}
        />
      )}
    </Card>
  );
};

export default PaperCard;
