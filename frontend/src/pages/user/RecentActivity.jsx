import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Upload, Bookmark, Download, Star } from 'lucide-react';
import { activityAPI } from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import { Loading } from '../../components/ui/Loading';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [forceRefresh, setForceRefresh] = useState(0); // Force refresh counter
  const { user } = useAuthStore();

  const activityTypes = {
    all: 'All Activities',
    upload: 'Uploads',
    bookmark: 'Bookmarks',
    download: 'Downloads',
    rating: 'Ratings'
  };

  const activityIcons = {
    upload: Upload,
    bookmark: Bookmark,
    download: Download,
    rating: Star
  };

  useEffect(() => {
    fetchActivities();
  }, [filter, page]);

  // Listen for activity updates (real-time refresh)
  useEffect(() => {
    const handleActivityUpdate = async () => {
      console.log('🔄 Activity update detected, refreshing activities...');
      // Clear current activities and force refresh
      setActivities([]);
      setError(null);
      setPage(1);
      
      // Force immediate fetch with page 1
      if (user && user.is_email_verified) {
        try {
          setLoading(true);
          const response = await activityAPI.getUserActivities({
            type: filter === 'all' ? undefined : filter,
            page: 1,
            limit: 20
          });
          setActivities(response.activities);
          setHasMore(response.has_more);
        } catch (err) {
          console.error('Failed to refresh activities:', err);
          setError('Failed to load recent activities');
        } finally {
          setLoading(false);
        }
      }
    };

    // Listen for custom activity update events
    window.addEventListener('activityUpdated', handleActivityUpdate);
    
    return () => {
      window.removeEventListener('activityUpdated', handleActivityUpdate);
    };
  }, [user, filter]); // Add dependencies to ensure fresh values

  // Update time every minute for dynamic "time ago" display
  useEffect(() => {
    const timeUpdateInterval = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
      setForceRefresh(prev => {
        console.log('⏰ Time updated for dynamic timestamps:', newTime.toLocaleTimeString(), 'Force refresh:', prev + 1);
        return prev + 1;
      });
    }, 10000); // Update every 10 seconds for testing

    return () => clearInterval(timeUpdateInterval);
  }, []); // Empty dependency array to avoid infinite loop

  const fetchActivities = async () => {
    if (!user || !user.is_email_verified) {
      setLoading(false);
      setError('Please log in to view your activity');
      return;
    }

    try {
      setLoading(page === 1);
      setError(null); // Clear any previous errors
      
      const response = await activityAPI.getUserActivities({
        type: filter === 'all' ? undefined : filter,
        page,
        limit: 20
      });
      
      if (page === 1) {
        setActivities(response.activities);
      } else {
        setActivities(prev => [...prev, ...response.activities]);
      }
      
      setHasMore(response.has_more);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      if (err.response?.status === 403) {
        setError('You do not have permission to view activities. Please ensure you are logged in.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load recent activities. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setHasMore(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Non-memoized formatTimeAgo function that forces re-calculation
  const formatTimeAgo = (timestamp) => {
    const now = currentTime; // Use the dynamically updating currentTime
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    const result = diffInMinutes < 1 
      ? 'Just now'
      : diffInMinutes < 60 
      ? `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
      : diffInHours < 24 
      ? `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
      : diffInDays < 7 
      ? `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
      : activityTime.toLocaleDateString();
    
    console.log(`🕒 TIMESTAMP CALC: Activity at ${activityTime.toLocaleTimeString()} -> "${result}" | CurrentTime: ${now.toLocaleTimeString()} | ForceRefresh: ${forceRefresh} | Diff: ${diffInMinutes}min`);
    return result;
  };
  
  // Debug: Log when component re-renders
  console.log(`🔄 RecentActivity RENDER: currentTime=${currentTime.toLocaleTimeString()}, forceRefresh=${forceRefresh}, activities=${activities.length}`);
  
  // Create a test timestamp that should update every render
  const currentTimeString = `Current: ${currentTime.toLocaleTimeString()} (${forceRefresh})`;
  console.log(`🕰️ TIME STRING: ${currentTimeString}`);

  const getActivityDescription = (activity) => {
    switch (activity.type) {
      case 'upload':
        return `Uploaded "${activity.paper_title}"`;
      case 'bookmark':
        try {
          const metadata = JSON.parse(activity.metadata || '{}');
          if (metadata.action === 'unbookmarked') {
            return `Removed bookmark from "${activity.paper_title}"`;
          }
        } catch {}
        return `Bookmarked "${activity.paper_title}"`
      case 'download':
        return `Downloaded "${activity.paper_title}"`;
      case 'rating':
        // Try to get rating from different possible fields
        const ratingValue = activity.rating || 
                           (activity.metadata && JSON.parse(activity.metadata).rating_value) || 
                           (activity.metadata && JSON.parse(activity.metadata).rating) || 
                           'N/A';
        return `Rated "${activity.paper_title}" ${ratingValue}/5 stars`;
      default:
        return 'Unknown activity';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recent Activity</h1>
          <p className="text-gray-600">
            Track your interactions with papers and documents
          </p>
          {/* Debug indicator */}
          <div className="mt-2 text-xs text-gray-400 font-mono">
            Debug: {currentTimeString} | Refresh: {forceRefresh}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Activity filters">
              {Object.entries(activityTypes).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleFilterChange(key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg shadow-sm">
          {error ? (
            <div className="p-6 text-center text-red-600">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Try again
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No recent activity</p>
              <p>Start exploring papers to see your activity here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map((activity, index) => {
                const IconComponent = activityIcons[activity.type] || Clock;
                return (
                  <div key={`${activity.id}-${index}-${currentTime.getTime()}`} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {getActivityDescription(activity)}
                          </p>
                          <p key={`timestamp-${activity.id}-${forceRefresh}`} className="text-sm text-gray-500">
                            {(() => {
                              const now = currentTime;
                              const activityTime = new Date(activity.created_at);
                              const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
                              const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
                              const diffInDays = Math.floor(diffInHours / 24);
                              
                              const result = diffInMinutes < 1 
                                ? 'Just now'
                                : diffInMinutes < 60 
                                ? `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
                                : diffInHours < 24 
                                ? `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
                                : diffInDays < 7 
                                ? `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
                                : activityTime.toLocaleDateString();
                              
                              console.log(`🕒 INLINE CALC: Activity ${activity.id} at ${activityTime.toLocaleTimeString()} -> "${result}" | CurrentTime: ${now.toLocaleTimeString()} | ForceRefresh: ${forceRefresh}`);
                              return result;
                            })()} [R:{forceRefresh}]
                          </p>
                        </div>
                        {activity.paper_subject && (
                          <p className="mt-1 text-sm text-gray-500">
                            {activity.paper_subject}
                          </p>
                        )}
                        {activity.paper_university && (
                          <p className="mt-1 text-xs text-gray-400">
                            {activity.paper_university}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && activities.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
