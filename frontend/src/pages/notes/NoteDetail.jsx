import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Loading,
  Alert,
  AlertDescription
} from '../../components';
import useNotesStore from '../../stores/notesStore';
import useAuthStore from '../../stores/authStore';
import { 
  Download, 
  Eye, 
  Star, 
  Calendar, 
  BookOpen, 
  User, 
  ArrowLeft, 
  Share2,
  Flag,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    currentNote,
    isLoading,
    fetchNote,
    downloadNote,
    bookmarkNote,
    rateNote,
    reportNote
  } = useNotesStore();

  const [userRating, setUserRating] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    if (id) {
      fetchNote(id).catch(error => {
        console.error('Failed to fetch note:', error);
        toast.error('Note not found');
        navigate('/notes');
      });
    }
  }, [id, fetchNote, navigate]);

  useEffect(() => {
    if (currentNote && user) {
      // Check if user has already rated this note
      const existingRating = currentNote.user_rating;
      setUserRating(existingRating || 0);
      
      // Check if user has bookmarked this note
      setIsBookmarked(currentNote.is_bookmarked || false);
    }
  }, [currentNote, user]);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to download notes');
      navigate('/auth');
      return;
    }

    try {
      await downloadNote(currentNote.id);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark notes');
      navigate('/auth');
      return;
    }

    try {
      await bookmarkNote(currentNote.id);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Bookmark failed:', error);
    }
  };

  const handleRating = async (rating) => {
    if (!isAuthenticated) {
      toast.error('Please login to rate notes');
      navigate('/auth');
      return;
    }

    try {
      await rateNote(currentNote.id, rating);
      setUserRating(rating);
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }

    try {
      await reportNote(currentNote.id, reportReason, reportDetails);
      setShowReportDialog(false);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      console.error('Report failed:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: currentNote.title,
        text: `Check out these notes: ${currentNote.title}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAcademicLevel = (programName) => {
    if (!programName) return 'Unknown';
    
    const name = programName.toLowerCase();
    
    // Graduate programs
    const graduateKeywords = ['m.tech', 'mtech', 'master', 'mba', 'msc', 'm.sc', 'ma', 'm.a', 'phd', 'doctorate'];
    if (graduateKeywords.some(keyword => name.includes(keyword))) {
      return 'Graduate';
    }
    
    // Undergraduate programs
    const undergraduateKeywords = ['b.tech', 'btech', 'bachelor', 'bsc', 'b.sc', 'ba', 'b.a', 'be', 'b.e'];
    if (undergraduateKeywords.some(keyword => name.includes(keyword))) {
      return 'Undergraduate';
    }
    
    return 'Other';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Note not found. It may have been removed or is not yet approved.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                      {currentNote.title}
                    </h1>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-blue-100 text-blue-800">
                        {getAcademicLevel(currentNote.program_name)}
                      </Badge>
                      <Badge variant="outline">
                        {currentNote.semester_year}
                      </Badge>
                      <Badge variant="outline">
                        Study Notes
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  {currentNote.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {currentNote.description}
                      </p>
                    </div>
                  )}

                  {/* Academic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Subject</h4>
                      <div className="flex items-center gap-2 text-gray-700">
                        <BookOpen className="h-4 w-4" />
                        <span>{currentNote.subject_name || 'Unknown Subject'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Academic Year</h4>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" />
                        <span>{currentNote.semester_year}</span>
                      </div>
                    </div>

                    {currentNote.university_name && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-2">Academic Details</h4>
                        <div className="text-gray-700">
                          <div>{currentNote.university_name}</div>
                          {currentNote.program_name && <div>{currentNote.program_name}</div>}
                          {currentNote.branch_name && <div>{currentNote.branch_name}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {currentNote.tags && currentNote.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentNote.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating Section */}
            {isAuthenticated && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate these Notes</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              star <= userRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {userRating > 0 && (
                      <span className="text-sm text-gray-600">
                        You rated this {userRating} star{userRating !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Notes</h3>
                
                <div className="space-y-4">
                  <Button
                    onClick={handleDownload}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center justify-between mb-1">
                      <span>File size:</span>
                      <span>
                        {currentNote.file_size 
                          ? `${(currentNote.file_size / (1024 * 1024)).toFixed(2)} MB`
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Format:</span>
                      <span>PDF</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Views</span>
                    </div>
                    <span className="font-semibold">{currentNote.view_count || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Downloads</span>
                    </div>
                    <span className="font-semibold">{currentNote.download_count || 0}</span>
                  </div>
                  
                  {currentNote.ratings_avg > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-gray-600">Rating</span>
                      </div>
                      <span className="font-semibold">
                        {currentNote.ratings_avg.toFixed(1)} ({currentNote.ratings_count || 0})
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                
                <div className="space-y-3">
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      onClick={handleBookmark}
                      className="w-full gap-2"
                    >
                      {isBookmarked ? (
                        <>
                          <BookmarkCheck className="h-4 w-4" />
                          Bookmarked
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4" />
                          Bookmark
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="w-full gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      onClick={() => setShowReportDialog(true)}
                      className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Flag className="h-4 w-4" />
                      Report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploader Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shared by</h3>
                
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {currentNote.uploader_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Uploaded {formatDate(currentNote.created_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Report Notes</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for reporting *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a reason</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="copyright">Copyright violation</option>
                    <option value="spam">Spam or misleading</option>
                    <option value="quality">Poor quality</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please provide additional context..."
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button onClick={handleReport} className="flex-1">
                    Submit Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReportDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NoteDetail;
