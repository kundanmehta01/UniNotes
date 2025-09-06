import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card,
  CardContent,
  Button, 
  Badge,
  Alert,
  AlertDescription,
  Loading,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter
} from '../../components';
import { papersAPI } from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import { Download, Calendar, BookOpen, Star, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const MyPapers = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, paper: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMyPapers();
  }, []);

  const fetchMyPapers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await papersAPI.getPapers({ 
        uploaded_by: 'me',
        per_page: 100 // Get more results for my papers page
      });
      
      const userPapers = response.items || response.papers || [];
      setPapers(userPapers);
      
      // Calculate stats from papers
      const calculatedStats = userPapers.reduce((acc, paper) => {
        acc.total++;
        acc[paper.status.toLowerCase()]++;
        return acc;
      }, { total: 0, pending: 0, approved: 0, rejected: 0 });
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching my papers:', error);
      toast.error('Failed to load your papers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!deleteModal.paper) return;
    
    setIsDeleting(true);
    try {
      await papersAPI.deletePaper(deleteModal.paper.id);
      toast.success('Paper deleted successfully');
      // Update local state
      setPapers(prev => prev.filter(paper => paper.id !== deleteModal.paper.id));
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        [deleteModal.paper.status.toLowerCase()]: prev[deleteModal.paper.status.toLowerCase()] - 1
      }));
      setDeleteModal({ isOpen: false, paper: null });
    } catch (error) {
      console.error('Error deleting paper:', error);
      toast.error('Failed to delete paper');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please log in to view your papers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Papers</h1>
          <p className="text-gray-600 mt-2">Manage your uploaded question papers and study materials</p>
        </div>
        <Link to="/upload">
          <Button>
            Upload New Paper
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Papers</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending Review</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-gray-600">Rejected</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      )}

      {/* Papers List */}
      {!isLoading && (
        <div className="space-y-4">
          {papers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Papers Yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't uploaded any papers yet. Share your question papers to help fellow students!
                </p>
                <Link to="/upload">
                  <Button>Upload Your First Paper</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            papers.map((paper) => (
              <Card key={paper.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{paper.title}</h3>
                        {getStatusBadge(paper.status)}
                      </div>
                      
                      {paper.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{paper.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Year: {paper.exam_year}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{paper.subject?.name || 'Unknown Subject'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{paper.view_count || 0} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{paper.download_count || 0} downloads</span>
                        </div>
                        {paper.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{paper.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>Uploaded: {formatDate(paper.created_at)}</span>
                        {paper.approved_at && (
                          <span>Approved: {formatDate(paper.approved_at)}</span>
                        )}
                      </div>
                      
                      {paper.status === 'rejected' && paper.moderation_notes && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <strong>Rejection Reason:</strong> {paper.moderation_notes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {paper.status === 'approved' && (
                        <Link to={`/papers/${paper.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Guidelines */}
      {!isLoading && papers.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Paper Status Guidelines</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                <span>Your papers are under review and will be available once approved.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                <span>Your papers have been approved and are now available to other students.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                <span>Your papers did not meet our guidelines. Please check the reason and try again.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, paper: null })}
      >
        <ModalHeader>
          <ModalTitle>Delete Paper</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p className="text-gray-600">
            Are you sure you want to delete <strong>"{deleteModal.paper?.title}"</strong>? 
            This action cannot be undone.
          </p>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ isOpen: false, paper: null })}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePaper}
            loading={isDeleting}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Paper
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default MyPapers;
