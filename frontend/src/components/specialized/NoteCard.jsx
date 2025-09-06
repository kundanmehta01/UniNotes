import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import Rating from '../ui/Rating';
import ReportModal from '../ui/ReportModal';
import PreviewModal from '../ui/PreviewModal';
import useNotesStore from '../../stores/notesStore';
import useAuthStore from '../../stores/authStore';
import { formatDate, formatFileSize, truncateText, getAcademicLevel } from '../../lib/utils';
import { notesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const NoteCard = ({ note, showActions = true, showBookmark = true, showStatus = false, actions = null, className }) => {
  // Safety check for malformed note data
  if (!note || typeof note !== 'object') {
    console.error('NoteCard received invalid note object:', note);
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50">
        <p className="text-red-600 text-sm">Error: Invalid note data</p>
      </div>
    );
  }
  
  // Ensure required properties exist
  if (!note.id || !note.title) {
    console.error('NoteCard received note missing required fields:', {
      id: note.id,
      title: note.title,
      fullNote: note
    });
    return (
      <div className="p-4 border border-yellow-200 rounded-md bg-yellow-50">
        <p className="text-yellow-600 text-sm">Error: Note missing required data</p>
      </div>
    );
  }

  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [userRating, setUserRating] = useState(note.user_rating || 0);
  const [isBookmarked, setIsBookmarked] = useState(note.is_bookmarked || false);
  const { bookmarkNote, removeBookmark, downloadNote, rateNote, deleteRating } = useNotesStore();
  const { isAuthenticated, user } = useAuthStore();
  
  // Note: Debug logging removed for cleaner console output
  // useEffect(() => {
  //   console.log('NoteCard received note object:', {
  //     id: note.id,
  //     title: note.title,
  //     user_rating: note.user_rating,
  //     user_rating_id: note.user_rating_id,
  //     uploader_id: note.uploader_id,
  //     fullNote: note
  //   });
  // }, [note]);
  
  // Sync userRating and bookmark state with note data when it changes
  useEffect(() => {
    setUserRating(note.user_rating || 0);
    setIsBookmarked(note.is_bookmarked || false);
  }, [note.user_rating, note.is_bookmarked]);
  
  // Force showBookmark to true for debugging
  const forceShowBookmark = true;

  // Determine academic level dynamically from program name
  const academicLevel = getAcademicLevel(note.program?.name);
  
  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark notes');
      return;
    }

    // Debug logging
    console.log('handleBookmark called:', {
      noteId: note.id,
      noteTitle: note.title,
      isBookmarked: note.is_bookmarked,
      localIsBookmarked: isBookmarked
    });

    setIsBookmarking(true);
    try {
      if (note.is_bookmarked) {
        // Note is already bookmarked, remove it
        console.log('Attempting to remove bookmark for note:', note.id);
        await removeBookmark(note.id);
        setIsBookmarked(false);
      } else {
        // Note is not bookmarked, add it
        console.log('Attempting to add bookmark for note:', note.id);
        await bookmarkNote(note.id);
        setIsBookmarked(true);
      }
    } catch (error) {
      // Error handling is done in the store methods
      console.error('Bookmark error:', error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to download notes');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadNote(note.id);
    } catch (error) {
      toast.error('Failed to download note');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to rate notes');
      return;
    }

    // Users can't rate their own notes
    if (user && note.uploader_id === user.id) {
      toast.error('You cannot rate your own note');
      return;
    }

    // Debug logging
    console.log('handleRating called with:', {
      rating,
      noteId: note.id,
      userRatingId: note.user_rating_id,
      currentUserRating: note.user_rating
    });

    setIsRating(true);
    try {
      if (note.user_rating && rating === note.user_rating) {
        // Same rating clicked, delete the rating
        // Validate that user_rating_id exists and is a valid UUID pattern
        if (!note.user_rating_id) {
          toast.error('Invalid rating data. Please refresh the page.');
          return;
        }
        
        // Basic UUID format validation
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(note.user_rating_id)) {
          console.error('Invalid user_rating_id format:', note.user_rating_id);
          toast.error('Invalid rating ID. Please refresh the page.');
          return;
        }
        
        await deleteRating(note.user_rating_id, note.id);
        setUserRating(0);
      } else {
        // New rating or different rating - rateNote handles both create and update
        await rateNote(note.id, rating);
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
      await notesAPI.reportNote(note.id, reportData.reason, reportData.details);
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
              {note.subject && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  📝 {note.subject.name}
                </span>
              )}
              {academicLevel && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${academicLevel === 'undergraduate' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                  {academicLevel === 'undergraduate' ? 'Undergraduate' : 'Graduate'}
                </span>
              )}
            </div>
            <Link 
              to={`/notes/${note.id}`}
              className="block group"
            >
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 mb-2">
                {note.title}
              </h3>
            </Link>
          </div>
          
          {note.status && (
            <div className="ml-3">
              {getStatusBadge(note.status)}
            </div>
          )}
        </div>

        {note.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {truncateText(note.description, 150)}
          </p>
        )}

        {/* Metadata Grid */}
        <div className="space-y-3">
          {/* University and Level */}
          {note.university && (
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-xs">🏛️</span>
              </div>
              <span className="font-medium">{note.university.name}</span>
              {note.semester && note.semester_year && (
                <span className="ml-2 text-gray-500">• {note.semester.name} {note.semester_year}</span>
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
                {note.uploader 
                  ? `${note.uploader.first_name || ''} ${note.uploader.last_name || ''}`.trim() || note.uploader.email || 'Anonymous'
                  : 'Anonymous'
                }
              </span>
            </div>
            
            <div className="flex items-center text-gray-500">
              <span className="text-xs mr-1">📄</span>
              <span className="text-xs">
                {note.file_size ? formatFileSize(note.file_size) : 'PDF'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-xs mr-1">📥</span>
                <span>{note.download_count || 0} downloads</span>
              </div>
            </div>
            <div className="text-xs">
              {formatDate(note.created_at)}
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {note.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
                >
                  #{tag.name || tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-500">
                  +{note.tags.length - 3} more
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
              {note.average_rating && (
                <span className="text-sm text-gray-500">
                  ({note.average_rating.toFixed(1)})
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
                  className={`p-2 transition-colors ${note.is_bookmarked ? 'text-yellow-600 hover:text-yellow-700' : 'text-gray-500 hover:text-yellow-600'}`}
                  title={note.is_bookmarked ? 'Remove bookmark' : 'Bookmark this note'}
                >
                  {isBookmarking ? (
                    <span className="text-sm animate-pulse">⏳</span>
                  ) : (
                    <svg 
                      className="w-4 h-4" 
                      fill={note.is_bookmarked ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={note.is_bookmarked ? 0 : 2} 
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  )}
                </Button>
              )}

              {/* Preview Button - Available to all users for approved notes */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreviewModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                title="Preview note"
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
              {isAuthenticated && user && note.uploader_id !== user.id && (
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
                    title="Report this note"
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
                      contentType="note"
                      contentTitle={note.title}
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
                        action.onClick(note);
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
          item={note}
          itemType="note"
          onDownload={handleDownload}
          showDownloadButton={true}
        />
      )}
    </Card>
  );
};

export default NoteCard;
