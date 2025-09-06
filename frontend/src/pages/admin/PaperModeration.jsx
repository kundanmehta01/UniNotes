import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Loading,
  Pagination,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
  Textarea
} from '../../components';
import PreviewModal from '../../components/ui/PreviewModal';
import { papersAPI } from '../../lib/api';
import { formatDate, formatFileSize } from '../../lib/utils';
import toast from 'react-hot-toast';

const PaperModeration = () => {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [moderationModal, setModerationModal] = useState({
    isOpen: false,
    paper: null,
    action: null, // 'approve' or 'reject'
    notes: ''
  });
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    paper: null
  });
  const [isModerating, setIsModerating] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchPendingPapers();
  }, [currentPage]);

  const fetchPendingPapers = async () => {
    setIsLoading(true);
    try {
      const data = await papersAPI.getPendingPapers(currentPage, itemsPerPage);
      setPapers(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching pending papers:', error);
      toast.error('Failed to load pending papers');
      setPapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!moderationModal.paper || !moderationModal.action) return;

    setIsModerating(true);
    try {
      await papersAPI.moderatePaper(
        moderationModal.paper.id,
        moderationModal.action,
        moderationModal.notes.trim() || null
      );

      toast.success(`Paper ${moderationModal.action}d successfully!`);
      
      // Remove the paper from the pending list
      setPapers(prev => prev.filter(paper => paper.id !== moderationModal.paper.id));
      setTotalCount(prev => prev - 1);
      
      setModerationModal({ isOpen: false, paper: null, action: null, notes: '' });
    } catch (error) {
      console.error('Error moderating paper:', error);
      toast.error(`Failed to ${moderationModal.action} paper`);
    } finally {
      setIsModerating(false);
    }
  };

  const openModerationModal = (paper, action) => {
    setModerationModal({
      isOpen: true,
      paper,
      action,
      notes: ''
    });
  };

  const closeModerationModal = () => {
    setModerationModal({
      isOpen: false,
      paper: null,
      action: null,
      notes: ''
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUploaderName = (uploader) => {
    if (!uploader) return 'Anonymous';
    const name = `${uploader.first_name || ''} ${uploader.last_name || ''}`.trim();
    return name || uploader.email || 'Anonymous';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paper Moderation</h1>
        <p className="text-gray-600">
          {totalCount > 0
            ? `${totalCount} paper${totalCount === 1 ? '' : 's'} waiting for approval`
            : 'No papers pending approval'
          }
        </p>
      </div>

      {papers.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pending papers
          </h3>
          <p className="text-gray-600">
            All papers have been reviewed. Great job!
          </p>
        </div>
      ) : (
        <>
          {/* Papers Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {papers.map((paper) => (
              <Card key={paper.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Header with pending badge */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 flex-1">
                      {paper.title}
                    </h3>
                    <Badge className="bg-yellow-100 text-yellow-800 ml-3">
                      Pending
                    </Badge>
                  </div>

                  {paper.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {paper.description}
                    </p>
                  )}

                  {/* Paper Details */}
                  <div className="space-y-3 mb-4">
                    {/* Uploader */}
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs">👤</span>
                      </div>
                      <span>Uploaded by {getUploaderName(paper.uploader)}</span>
                    </div>

                    {/* Upload Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs">⏰</span>
                      </div>
                      <span>{formatDate(paper.created_at)}</span>
                    </div>

                    {/* File Size */}
                    {paper.file_size && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">📄</span>
                        </div>
                        <span>{formatFileSize(paper.file_size)}</span>
                      </div>
                    )}

                    {/* Exam Year */}
                    {paper.exam_year && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">📅</span>
                        </div>
                        <span>{paper.exam_year}</span>
                      </div>
                    )}
                  </div>

                  {/* Preview Button */}
                  <div className="mb-3">
                    <Button
                      onClick={() => setPreviewModal({ isOpen: true, paper })}
                      variant="outline"
                      className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                      size="sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Paper
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openModerationModal(paper, 'approve')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      onClick={() => openModerationModal(paper, 'reject')}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      ✗ Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

      {/* Moderation Modal */}
      <Modal isOpen={moderationModal.isOpen} onClose={closeModerationModal}>
        <ModalHeader>
          <ModalTitle>
            {moderationModal.action === 'approve' ? 'Approve Paper' : 'Reject Paper'}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          {moderationModal.paper && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{moderationModal.paper.title}</h4>
                <p className="text-sm text-gray-600">
                  by {getUploaderName(moderationModal.paper.uploader)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {moderationModal.action === 'approve' ? 'Approval' : 'Rejection'} Notes (Optional)
                </label>
                <Textarea
                  value={moderationModal.notes}
                  onChange={(e) => setModerationModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={`Add notes about why you ${moderationModal.action}d this paper...`}
                  rows={3}
                />
              </div>

              <div className="text-sm text-gray-600">
                Are you sure you want to <strong>{moderationModal.action}</strong> this paper?
                {moderationModal.action === 'approve' && ' It will be published and available for download.'}
                {moderationModal.action === 'reject' && ' It will be marked as rejected and not published.'}
              </div>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={closeModerationModal}
            disabled={isModerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleModerate}
            loading={isModerating}
            disabled={isModerating}
            className={
              moderationModal.action === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {moderationModal.action === 'approve' ? 'Approve Paper' : 'Reject Paper'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <PreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, paper: null })}
          item={previewModal.paper}
          itemType="paper"
          showDownloadButton={false}
          className="admin-preview-modal"
        />
      )}
    </div>
  );
};

export default PaperModeration;
