import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import usePapersStore from '../../stores/papersStore';
import useAuthStore from '../../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Rating from '../../components/ui/Rating';
import ReportModal from '../../components/ui/ReportModal';
import { formatDate, formatFileSize } from '../../lib/utils';
import toast from 'react-hot-toast';

const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  const classes = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return <Badge className={classes[normalized] || classes.pending}>{normalized ? normalized[0].toUpperCase() + normalized.slice(1) : 'Pending'}</Badge>;
};

const PaperDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const {
    currentPaper,
    isLoading,
    fetchPaper,
    downloadPaper,
    bookmarkPaper,
    ratePaper,
    deleteRating,
  } = usePapersStore();

  useEffect(() => {
    if (id) {
      fetchPaper(id).catch(() => {
        toast.error('Failed to load paper');
      });
    }
  }, [id]);

  const canRate = useMemo(() => {
    if (!isAuthenticated || !currentPaper) return false;
    if (!user) return false;
    return currentPaper.uploader_id !== user.id;
  }, [isAuthenticated, currentPaper, user]);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to download papers');
      navigate('/auth');
      return;
    }
    try {
      await downloadPaper(currentPaper.id);
    } catch (e) {
      /* toast shown in store */
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark papers');
      navigate('/auth');
      return;
    }
    try {
      await bookmarkPaper(currentPaper.id);
    } catch (e) {
      /* toast shown in store */
    }
  };

  const handleRate = async (value) => {
    if (!canRate) return;
    try {
      if (currentPaper.user_rating && value === currentPaper.user_rating) {
        await deleteRating(currentPaper.user_rating_id, currentPaper.id);
      } else {
        await ratePaper(currentPaper.id, value);
      }
    } catch (e) {
      /* handled in store */
    }
  };

  const handleReport = async (data) => {
    // Delegate to PaperCard behavior via API
    try {
      // lazy import to avoid circulars
      const { papersAPI } = await import('../../lib/api');
      await papersAPI.reportPaper(currentPaper.id, data.reason, data.details);
      setShowReportModal(false);
      toast.success('Report submitted successfully. Thank you!');
    } catch (e) {
      toast.error('Failed to submit report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (!currentPaper) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Paper not found</h2>
            <p className="text-gray-600">The paper you are looking for might have been removed or is unavailable.</p>
            <Link to="/papers" className="inline-block mt-4 text-blue-600 hover:text-blue-800">Browse papers</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paper = currentPaper;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {paper.subject_name && <Badge className="bg-blue-100 text-blue-800">📚 {paper.subject_name}</Badge>}
            {paper.status && <StatusBadge status={paper.status} />}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{paper.title}</h1>
          <div className="mt-2 text-sm text-gray-600 flex flex-wrap items-center gap-2">
            <span>By {paper.uploader ? `${paper.uploader.first_name || ''} ${paper.uploader.last_name || ''}`.trim() || paper.uploader.email : 'Anonymous'}</span>
            {paper.created_at && <span>• Uploaded {formatDate(paper.created_at)}</span>}
            {paper.university_name && <span>• {paper.university_name}</span>}
            {paper.semester_name && paper.year && <span>• {paper.semester_name} {paper.year}</span>}
            {paper.file_size && <span>• {formatFileSize(paper.file_size)}</span>}
            {typeof paper.download_count === 'number' && <span>• {paper.download_count} downloads</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">Download</Button>
          <Button variant="outline" onClick={handleBookmark}>Bookmark</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Main details */}
        <div className="md:col-span-2 space-y-6">
          {paper.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{paper.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Paper Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {paper.subject_code && (
                  <div>
                    <p className="text-gray-500">Subject Code</p>
                    <p className="font-medium text-gray-900">{paper.subject_code}</p>
                  </div>
                )}
                {paper.branch_name && (
                  <div>
                    <p className="text-gray-500">Branch</p>
                    <p className="font-medium text-gray-900">{paper.branch_name}</p>
                  </div>
                )}
                {paper.program_name && (
                  <div>
                    <p className="text-gray-500">Program</p>
                    <p className="font-medium text-gray-900">{paper.program_name}</p>
                  </div>
                )}
                {paper.semester_name && (
                  <div>
                    <p className="text-gray-500">Semester</p>
                    <p className="font-medium text-gray-900">{paper.semester_name}</p>
                  </div>
                )}
                {paper.year && (
                  <div>
                    <p className="text-gray-500">Year</p>
                    <p className="font-medium text-gray-900">{paper.year}</p>
                  </div>
                )}
                {paper.language && (
                  <div>
                    <p className="text-gray-500">Language</p>
                    <p className="font-medium text-gray-900">{paper.language}</p>
                  </div>
                )}
                {paper.pages && (
                  <div>
                    <p className="text-gray-500">Pages</p>
                    <p className="font-medium text-gray-900">{paper.pages}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions and rating */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rate this paper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Rating value={paper.user_rating || 0} onChange={handleRate} readOnly={!canRate} />
                {!isAuthenticated && <span className="text-xs text-gray-500">Sign in to rate</span>}
                {isAuthenticated && !canRate && <span className="text-xs text-gray-500">You cannot rate your own paper</span>}
              </div>
              {typeof paper.average_rating === 'number' && (
                <p className="mt-2 text-xs text-gray-600">Average rating: {paper.average_rating.toFixed(1)} ({paper.total_ratings || 0} ratings)</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report an issue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Found something wrong with this paper? Let us know.</p>
              <Button variant="outline" onClick={() => setShowReportModal(true)}>Report Paper</Button>
              <ReportModal 
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReport}
                isSubmitting={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaperDetail;
