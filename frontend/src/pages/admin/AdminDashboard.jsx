import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Building, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  Database,
  HardDrive,
  RefreshCw,
  Download,
  BookOpen,
  StickyNote
} from 'lucide-react';
import { Card, Button, Loading, Badge } from '../../components';
import { adminAPI, taxonomyAPI } from '../../lib/api';
import useAuthStore from '../../stores/authStore';
import useAdminStore from '../../stores/adminStore';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch dashboard data from admin API
        const [dashboardData, taxonomyStats] = await Promise.allSettled([
          adminAPI.getDashboard(),
          taxonomyAPI.getStats()
        ]);

        // Extract data from Promise.allSettled results
        const dashboard = dashboardData.status === 'fulfilled' ? dashboardData.value : null;
        const taxonomy = taxonomyStats.status === 'fulfilled' ? taxonomyStats.value : null;

        // Combine the stats
        const combinedStats = {
          users: dashboard?.user_stats || {
            total: 0,
            verified: 0,
            admins: 0,
            students: 0
          },
          papers: dashboard?.system_stats?.papers || {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
          },
          notes: dashboard?.system_stats?.notes || {
            total: dashboard?.dashboard_cards?.total_notes || 0,
            pending: 0,
            approved: 0,
            rejected: 0
          },
          universities: taxonomy || {
            total: 0,
            programs: 0,
            branches: 0,
            subjects: 0
          },
          activity: {
            todayUploads: dashboard?.system_stats?.recent_uploads || 0,
            todayDownloads: dashboard?.system_stats?.recent_downloads || 0,
            recentReports: dashboard?.system_stats?.recent_reports || 0
          }
        };

        setStats(combinedStats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
        
        // Set fallback stats on error
        setStats({
          users: { total: 0, verified: 0, admins: 0, students: 0 },
          papers: { total: 0, pending: 0, approved: 0, rejected: 0 },
          notes: { total: 0, pending: 0, approved: 0, rejected: 0 },
          universities: { total: 0, programs: 0, branches: 0, subjects: 0 },
          activity: { todayUploads: 0, todayDownloads: 0, recentReports: 0 }
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const adminFeatures = [
    {
      title: 'University Management',
      description: 'Manage universities, programs, branches, semesters, and subjects',
      icon: Building,
      link: '/admin/taxonomy',
      color: 'bg-blue-500',
      stats: stats?.universities
    },
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      link: '/admin/users',
      color: 'bg-green-500',
      stats: stats?.users
    },
    {
      title: 'Paper Moderation',
      description: 'Review and moderate uploaded papers',
      icon: FileText,
      link: '/admin/papers',
      color: 'bg-orange-500',
      stats: stats?.papers
    },
    {
      title: 'Note Moderation',
      description: 'Review and moderate uploaded study notes',
      icon: BookOpen,
      link: '/admin/notes',
      color: 'bg-teal-500',
      stats: stats?.notes
    },
    {
      title: 'Analytics',
      description: 'View platform analytics and insights',
      icon: BarChart3,
      link: '/admin/analytics',
      color: 'bg-purple-500',
      stats: stats?.activity
    },
    {
      title: 'Reports Management',
      description: 'Handle user reports and content moderation',
      icon: AlertTriangle,
      link: '/admin/reports',
      color: 'bg-red-500',
      stats: { pending: stats?.activity?.recentReports || 0 }
    }
  ];

  const quickActions = [
    {
      title: 'Add University',
      description: 'Quickly add a new university',
      icon: Plus,
      action: () => window.location.href = '/admin/taxonomy'
    },
    {
      title: 'Review Papers',
      description: 'Review pending papers',
      icon: Eye,
      action: () => window.location.href = '/admin/papers'
    },
    {
      title: 'Review Notes',
      description: 'Review pending notes',
      icon: BookOpen,
      action: () => window.location.href = '/admin/notes'
    },
    {
      title: 'View Reports',
      description: 'Check recent reports',
      icon: AlertTriangle,
      action: () => window.location.href = '/admin/reports'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name || 'Administrator'}!</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Admin Access
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats?.users?.total || 0}</h3>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats?.papers?.total || 0}</h3>
              <p className="text-sm text-gray-500">Total Papers</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <StickyNote className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats?.notes?.total || 0}</h3>
              <p className="text-sm text-gray-500">Total Notes</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats?.universities?.total || 0}</h3>
              <p className="text-sm text-gray-500">Universities</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{stats?.papers?.pending || 0}</h3>
              <p className="text-sm text-gray-500">Pending Reviews</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Features */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link key={index} to={feature.link}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 ${feature.color} rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                      
                      {/* Feature-specific stats */}
                      {feature.stats && (
                        <div className="flex space-x-4 mt-3 text-xs text-gray-600">
                          {feature.title === 'University Management' && (
                            <>
                              <span>Universities: {feature.stats.total}</span>
                              <span>Programs: {feature.stats.programs}</span>
                              <span>Subjects: {feature.stats.subjects}</span>
                            </>
                          )}
                          {feature.title === 'User Management' && (
                            <>
                              <span>Total: {feature.stats.total}</span>
                              <span>Verified: {feature.stats.verified}</span>
                              <span>Admins: {feature.stats.admins}</span>
                            </>
                          )}
                          {feature.title === 'Paper Moderation' && (
                            <>
                              <span>Pending: {feature.stats.pending}</span>
                              <span>Approved: {feature.stats.approved}</span>
                              <span>Rejected: {feature.stats.rejected}</span>
                            </>
                          )}
                          {feature.title === 'Note Moderation' && (
                            <>
                              <span>Pending: {feature.stats.pending}</span>
                              <span>Approved: {feature.stats.approved}</span>
                              <span>Rejected: {feature.stats.rejected}</span>
                            </>
                          )}
                          {feature.title === 'Analytics' && (
                            <>
                              <span>Today Uploads: {feature.stats.todayUploads}</span>
                              <span>Today Downloads: {feature.stats.todayDownloads}</span>
                            </>
                          )}
                          {feature.title === 'Reports Management' && (
                            <span>Pending Reports: {feature.stats.pending}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <button
                  onClick={action.action}
                  className="w-full text-left flex items-center space-x-3 group"
                >
                  <Icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
