import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card,
  CardContent,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Loading
} from '../../components';
import { notesAPI } from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import { Download, Calendar, BookOpen, Star, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const MyNotes = () => {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchMyNotes();
  }, []);

  const fetchMyNotes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Use the correct /my/notes endpoint
      const response = await notesAPI.getMyNotes({ 
        per_page: 100 // Get more results for my notes page
      });
      
      const userNotes = response.notes || [];
      setNotes(userNotes);
      
      // Use stats from API response or calculate fallback
      if (response.total_approved !== undefined) {
        setStats({
          total: response.total,
          pending: response.total_pending,
          approved: response.total_approved,
          rejected: response.total_rejected
        });
      } else {
        // Fallback calculation if API doesn't provide stats
        const calculatedStats = userNotes.reduce((acc, note) => {
          acc.total++;
          acc[note.status.toLowerCase()]++;
          return acc;
        }, { total: 0, pending: 0, approved: 0, rejected: 0 });
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error('Error fetching my notes:', error);
      toast.error('Failed to load your notes');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'default', color: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', color: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
            Please log in to view your notes.
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
          <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
          <p className="text-gray-600 mt-2">Manage your uploaded study materials and notes</p>
        </div>
        <Link to="/upload?type=note">
          <Button>
            Upload New Notes
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
                <div className="text-sm text-gray-600">Total Notes</div>
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

      {/* Notes List */}
      {!isLoading && (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't uploaded any notes yet. Share your study materials to help fellow students!
                </p>
                <Link to="/upload?type=note">
                  <Button>Upload Your First Notes</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            notes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                        {getStatusBadge(note.status)}
                      </div>
                      
                      {note.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{note.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Year: {note.semester_year}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{note.subject?.name || 'Unknown Subject'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{note.view_count} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          <span>{note.download_count} downloads</span>
                        </div>
                        {note.ratings_avg && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{note.ratings_avg.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>Uploaded: {formatDate(note.created_at)}</span>
                        {note.approved_at && (
                          <span>Approved: {formatDate(note.approved_at)}</span>
                        )}
                      </div>
                      
                      {note.status === 'rejected' && note.moderation_notes && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            <strong>Rejection Reason:</strong> {note.moderation_notes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {note.status === 'approved' && (
                        <Link to={`/notes/${note.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      )}
                      
                      {/* Add more actions like edit, delete if needed */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Guidelines */}
      {!isLoading && notes.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Note Status Guidelines</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                <span>Your notes are under review and will be available once approved.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                <span>Your notes have been approved and are now available to other students.</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                <span>Your notes did not meet our guidelines. Please check the reason and try again.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyNotes;
