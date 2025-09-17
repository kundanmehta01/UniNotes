import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Upload, Bookmark, Download, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Loading } from '../components';
import useAuthStore from '../stores/authStore';
import { activityAPI, authAPI } from '../lib/api';
import DashboardSidebar from '../components/ui/DashboardSidebar';
import DashboardStats from '../components/ui/DashboardStats';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    downloads: 0,
    bookmarks: 0,
    uploads: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    if (!user) {
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      const response = await authAPI.getDashboardStats();
      setStats({
        downloads: response.downloads || 0,
        bookmarks: response.bookmarks || 0,
        uploads: response.uploads || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set default values on error
      setStats({
        downloads: 0,
        bookmarks: 0,
        uploads: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch dynamic recent activities
  const fetchRecentActivities = async () => {
    if (!user) {
      setActivitiesLoading(false);
      return;
    }

    try {
      setActivitiesLoading(true);
      const response = await activityAPI.getUserActivities({
        page: 1,
        limit: 5 // Show only 5 activities in dashboard
      });
      setRecentActivities(response.activities || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Format time relative to current time
  const formatTimeAgo = (timestamp) => {
    const now = currentTime;
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return activityTime.toLocaleDateString();
  };

  // Get activity description
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
        return `Bookmarked "${activity.paper_title}"`;
      case 'download':
        return `Downloaded "${activity.paper_title}"`;
      case 'rating':
        return `Rated "${activity.paper_title}" ${activity.rating}/5 stars`;
      default:
        return 'Unknown activity';
    }
  };

  // Get activity icon and color
  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return {
          icon: <Upload className="w-5 h-5" />,
          color: 'bg-green-100 text-green-600'
        };
      case 'bookmark':
        return {
          icon: <Bookmark className="w-5 h-5" />,
          color: 'bg-purple-100 text-purple-600'
        };
      case 'download':
        return {
          icon: <Download className="w-5 h-5" />,
          color: 'bg-blue-100 text-blue-600'
        };
      case 'rating':
        return {
          icon: <Star className="w-5 h-5" />,
          color: 'bg-yellow-100 text-yellow-600'
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'bg-gray-100 text-gray-600'
        };
    }
  };

  useEffect(() => {
    // Fetch recent activities and dashboard stats
    fetchRecentActivities();
    fetchDashboardStats();
  }, [user]);

  // Listen for activity updates and update time periodically
  useEffect(() => {
    const handleActivityUpdate = () => {
      console.log('🔄 Dashboard: Activity update detected, refreshing...');
      fetchRecentActivities();
    };

    // Update time every 30 seconds for dynamic timestamps
    const timeUpdateInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    // Listen for activity updates
    window.addEventListener('activityUpdated', handleActivityUpdate);
    
    return () => {
      clearInterval(timeUpdateInterval);
      window.removeEventListener('activityUpdated', handleActivityUpdate);
    };
  }, [user]);

  const quickActions = [
    {
      title: 'Upload Paper',
      description: 'Share your notes and papers with the community',
      href: '/upload',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Browse Papers',
      description: 'Discover papers from universities worldwide',
      href: '/papers',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'My Papers',
      description: 'View and manage your uploaded papers',
      href: '/my-papers',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
    {
      title: 'Bookmarks',
      description: 'Access your saved papers and favorites',
      href: '/bookmarks',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
        </svg>
      ),
      color: 'bg-yellow-500',
    },
  ];


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-30 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out lg:block`}>
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'User'}! 👋
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Here's your academic dashboard overview
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/upload">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-sm sm:text-base">
                  <svg className="w-4 h-4 mr-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="hidden sm:inline">Upload Paper</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards */}
          <DashboardStats stats={stats} isLoading={statsLoading} />

      {/* Quick Actions in Card Format */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href} className="group">
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto w-12 h-12 ${action.color} text-white rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{action.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
                  <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    Get Started
                    <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading size="sm" text="Loading activities..." />
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const { icon, color } = getActivityIcon(activity.type);
                    return (
                      <div key={`${activity.id}-${currentTime.getTime()}`} className="flex items-start p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className={`p-2 ${color} rounded-full mr-4 flex-shrink-0`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {getActivityDescription(activity)}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {activity.paper_subject && `${activity.paper_subject}`}
                            {activity.paper_university && ` • ${activity.paper_university}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-4">
                          {formatTimeAgo(activity.created_at)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Start exploring papers to see your activity here</p>
                  </div>
                )}
                
                {/* View All Activity Link */}
                {recentActivities.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <Link 
                      to="/activity" 
                      className="flex items-center justify-center w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View all activity
                      <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
