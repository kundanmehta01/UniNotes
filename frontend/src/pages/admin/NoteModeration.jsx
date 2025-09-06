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
import { notesAPI } from '../../lib/api';
import { formatDate, formatFileSize } from '../../lib/utils';
import toast from 'react-hot-toast';

const NoteModeration = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [moderationModal, setModerationModal] = useState({
    isOpen: false,
    note: null,
    action: null, // 'approve' or 'reject'
    notes: ''
  });
  const [isModerating, setIsModerating] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchPendingNotes();
  }, [currentPage]);

  const fetchPendingNotes = async () => {
    setIsLoading(true);
    try {
      const data = await notesAPI.getPendingNotes(currentPage, itemsPerPage);
      setNotes(data.notes || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching pending notes:', error);
      toast.error('Failed to load pending notes');
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async () => {
    if (!moderationModal.note || !moderationModal.action) return;

    setIsModerating(true);
    
    // Map frontend action to backend status
    const statusMap = {
      'approve': 'APPROVED',
      'reject': 'REJECTED'
    };
    
    const statusData = {
      status: statusMap[moderationModal.action] || moderationModal.action.toUpperCase(),
      moderation_notes: moderationModal.notes.trim() || null
    };
    console.log('Sending status update:', statusData);
    
    try {
      
      // Use the status update endpoint
      await notesAPI.updateNoteStatus(
        moderationModal.note.id,
        statusData
      );

      toast.success(`Note ${moderationModal.action}d successfully!`);
      
      // Remove the note from the pending list
      setNotes(prev => prev.filter(note => note.id !== moderationModal.note.id));
      setTotalCount(prev => prev - 1);
      
      setModerationModal({ isOpen: false, note: null, action: null, notes: '' });
    } catch (error) {
      console.error('Error moderating note:', error);
      console.error('Request data sent:', statusData);
      console.error('Full error response:', error.response);
      
      if (error.response?.data) {
        console.error('Error details:', error.response.data);
        
        // Show specific validation errors if available
        if (error.response.data.error?.details) {
          const details = error.response.data.error.details;
          console.error('Validation errors:', details);
          
          // Show detailed error message
          const errorMessages = details.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ');
          toast.error(`Validation Error: ${errorMessages}`);
        } else {
          toast.error(`Failed to ${moderationModal.action} note: ${error.response.data.error?.message || 'Unknown error'}`);
        }
      } else {
        toast.error(`Failed to ${moderationModal.action} note`);
      }
    } finally {
      setIsModerating(false);
    }
  };

  const openModerationModal = (note, action) => {
    setModerationModal({
      isOpen: true,
      note,
      action,
      notes: ''
    });
  };

  const closeModerationModal = () => {
    setModerationModal({
      isOpen: false,
      note: null,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Note Moderation</h1>
        <p className="text-gray-600">
          {totalCount > 0
            ? `${totalCount} note${totalCount === 1 ? '' : 's'} waiting for approval`
            : 'No notes pending approval'
          }
        </p>
      </div>

      {notes.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No pending notes
          </h3>
          <p className="text-gray-600">
            All notes have been reviewed. Great job!
          </p>
        </div>
      ) : (
        <>
          {/* Notes Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Header with pending badge */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 flex-1">
                      {note.title}
                    </h3>
                    <Badge className="bg-yellow-100 text-yellow-800 ml-3">
                      Pending
                    </Badge>
                  </div>

                  {note.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {note.description}
                    </p>
                  )}

                  {/* Note Details */}
                  <div className="space-y-3 mb-4">
                    {/* Uploader */}
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs">👤</span>
                      </div>
                      <span>Uploaded by {getUploaderName(note.uploader)}</span>
                    </div>

                    {/* Upload Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-xs">⏰</span>
                      </div>
                      <span>{formatDate(note.created_at)}</span>
                    </div>

                    {/* File Size */}
                    {note.file_size && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">📄</span>
                        </div>
                        <span>{formatFileSize(note.file_size)}</span>
                      </div>
                    )}

                    {/* Semester Year */}
                    {note.semester_year && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">📅</span>
                        </div>
                        <span>Semester: {note.semester_year}</span>
                      </div>
                    )}

                    {/* Subject */}
                    {note.subject && (
                      <div className="flex items-center text-sm text-gray-600">
                        <div className="w-5 h-5 rounded bg-gray-50 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-xs">📚</span>
                        </div>
                        <span>{note.subject.name}</span>
                      </div>
                    )}

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} className="text-xs bg-blue-100 text-blue-800">
                            {tag.name}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge className="text-xs bg-gray-100 text-gray-600">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-6">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={() => openModerationModal(note, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openModerationModal(note, 'reject')}
                    >
                      Reject
                    </Button>
                  </div>

                  {/* Preview Link */}
                  <div className="mt-3">
                    <Link
                      to={`/notes/${note.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 block text-center"
                    >
                      Preview Note →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
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
            {moderationModal.action === 'approve' ? 'Approve' : 'Reject'} Note
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          {moderationModal.note && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Note Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-1">{moderationModal.note.title}</h5>
                  {moderationModal.note.description && (
                    <p className="text-gray-600 text-sm mb-2">{moderationModal.note.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Uploaded by {getUploaderName(moderationModal.note.uploader)} on{' '}
                    {formatDate(moderationModal.note.created_at)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {moderationModal.action === 'approve' ? 'Approval' : 'Rejection'} Notes
                  <span className="text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <Textarea
                  value={moderationModal.notes}
                  onChange={(e) => setModerationModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={
                    moderationModal.action === 'approve'
                      ? 'Add any notes about the approval...'
                      : 'Please explain why this note is being rejected...'
                  }
                  rows={4}
                  className="w-full"
                />
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
            disabled={isModerating}
            className={
              moderationModal.action === 'approve'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {isModerating ? (
              <>
                <Loading className="w-4 h-4 mr-2" />
                {moderationModal.action === 'approve' ? 'Approving...' : 'Rejecting...'}
              </>
            ) : (
              moderationModal.action === 'approve' ? 'Approve Note' : 'Reject Note'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default NoteModeration;
