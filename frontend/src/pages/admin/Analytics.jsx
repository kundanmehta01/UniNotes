import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  FileText,
  Download,
  TrendingUp,
  Activity,
  Calendar,
  RefreshCw,
  Filter,
  Download as DownloadIcon,
  StickyNote
} from 'lucide-react';
import {
  Card,
  Button,
  Select,
  Loading,
  Badge
} from '../../components';
import useAnalyticsStore from '../../stores/analyticsStore';
import toast from 'react-hot-toast';

const Analytics = () => {
  const {
    dashboardData,
    popularPapers,
    popularNotes,
    downloadStats,
    userEngagement,
    uploadTrends,
    subjectPopularity,
    systemMetrics,
    usageStats,
    weeklyTrends,
    periodComparison,
    isLoadingDashboard,
    isLoadingPopularPapers,
    isLoadingPopularNotes,
    isLoadingDownloadStats,
    isLoadingUserEngagement,
    isLoadingUploadTrends,
    isLoadingSubjectPopularity,
    isLoadingSystemMetrics,
    isLoadingUsageStats,
    isLoadingWeeklyTrends,
    isLoadingPeriodComparison,
    fetchDashboardData,
    fetchUsageStats,
    fetchPopularPapers,
    fetchPopularNotes,
    fetchDownloadStats,
    fetchUserEngagement,
    fetchUploadTrends,
    fetchSubjectPopularity,
    fetchSystemMetrics,
    fetchWeeklyTrends,
    fetchPeriodComparison,
    refreshAllData,
    exportAnalyticsData,
    setDateRange,
    setLastWeek,
    setLastMonth,
    setLastQuarter,
    setLastYear
  } = useAnalyticsStore();

  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    document.title = 'Analytics - Admin - UniNotesHub';
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await refreshAllData(parseInt(selectedPeriod));
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    }
  };

  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    const days = parseInt(period);
    
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchUsageStats(days),
        fetchPopularPapers(10, days),
        fetchPopularNotes(10, days),
        fetchDownloadStats(days),
        fetchUserEngagement(days),
        fetchUploadTrends(days),
        fetchSystemMetrics(days),
        fetchWeeklyTrends(Math.ceil(days / 7)),
        fetchPeriodComparison(days, days)
      ]);
    } catch (error) {
      console.error('Failed to update analytics:', error);
      toast.error('Failed to update analytics');
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData(parseInt(selectedPeriod));
      toast.success('Analytics data refreshed!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = async (type) => {
    try {
      await exportAnalyticsData(type, {
        days: parseInt(selectedPeriod)
      });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} analytics exported!`);
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num) => {
    if (!num && num !== 0) return '0%';
    return `${num.toFixed(1)}%`;
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'engagement', name: 'Engagement', icon: Activity }
  ];

  const isLoading = isLoadingDashboard || isLoadingUsageStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Platform insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-32"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleExportData('overview')}
            className="flex items-center"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      )}

      {/* Overview Tab */}
      {!isLoading && activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(dashboardData?.total_users || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Total Users</p>
                  {dashboardData?.user_growth && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        +{formatNumber(dashboardData.user_growth)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(dashboardData?.total_papers || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Total Papers</p>
                  {dashboardData?.paper_growth && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        +{formatNumber(dashboardData.paper_growth)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <StickyNote className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(dashboardData?.total_notes || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Total Notes</p>
                  {dashboardData?.notes_growth && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        +{formatNumber(dashboardData.notes_growth)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(downloadStats?.total_downloads || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Total Downloads</p>
                  {downloadStats?.growth_rate && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        {formatPercentage(downloadStats.growth_rate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(userEngagement?.active_users || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Active Users</p>
                  {userEngagement?.engagement_rate && (
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-600">
                        {formatPercentage(userEngagement.engagement_rate)} engagement
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Papers */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Popular Papers</h3>
                {isLoadingPopularPapers && <Loading size="sm" />}
              </div>
              <div className="space-y-3">
                {popularPapers?.slice(0, 5).map((paper, index) => (
                  <div key={paper.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {paper.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {paper.subject} • {paper.university}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatNumber(paper.downloads || 0)}
                      </p>
                      <p className="text-xs text-gray-500">downloads</p>
                    </div>
                  </div>
                )) || []}
              </div>
            </Card>

            {/* Popular Notes */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Popular Notes</h3>
                {isLoadingPopularNotes && <Loading size="sm" />}
              </div>
              <div className="space-y-3">
                {popularNotes?.slice(0, 5).map((note, index) => (
                  <div key={note.id || index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {note.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {note.subject} • {note.university}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatNumber(note.downloads || 0)}
                      </p>
                      <p className="text-xs text-gray-500">downloads</p>
                    </div>
                  </div>
                )) || []}
              </div>
            </Card>

            {/* Subject Popularity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Subjects</h3>
                {isLoadingSubjectPopularity && <Loading size="sm" />}
              </div>
              <div className="space-y-3">
                {subjectPopularity?.slice(0, 5).map((subject, index) => (
                  <div key={subject.id || index} className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {subject.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(subject.paper_count || 0)} papers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatNumber(subject.downloads || 0)}
                      </p>
                      <p className="text-xs text-gray-500">downloads</p>
                    </div>
                  </div>
                )) || []}
              </div>
            </Card>
          </div>

          {/* System Metrics */}
          {systemMetrics && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {systemMetrics.avg_response_time || 0}ms
                  </p>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(systemMetrics.uptime || 0)}
                  </p>
                  <p className="text-sm text-gray-600">System Uptime</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatNumber(systemMetrics.error_rate || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Error Rate</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Users Tab */}
      {!isLoading && activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(userEngagement?.total_users || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Total Users</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(userEngagement?.active_users || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Active Users</p>
                  {userEngagement?.activity_growth && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        {formatPercentage(userEngagement.activity_growth)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(userEngagement?.new_users || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">New Users</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatPercentage(userEngagement?.retention_rate || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Retention Rate</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {!isLoading && activeTab === 'content' && (
        <div className="space-y-6">
          {/* Papers and Notes Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Papers Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Papers:</span>
                  <span className="font-semibold">{formatNumber(dashboardData?.total_papers || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved:</span>
                  <span className="font-semibold text-green-600">{formatNumber(dashboardData?.approved_papers || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">{formatNumber(dashboardData?.pending_papers || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected:</span>
                  <span className="font-semibold text-red-600">{formatNumber(dashboardData?.rejected_papers || 0)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Notes:</span>
                  <span className="font-semibold">{formatNumber(dashboardData?.total_notes || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved:</span>
                  <span className="font-semibold text-green-600">{formatNumber(dashboardData?.approved_notes || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="font-semibold text-yellow-600">{formatNumber(dashboardData?.pending_notes || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rejected:</span>
                  <span className="font-semibold text-red-600">{formatNumber(dashboardData?.rejected_notes || 0)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Upload and Download Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber((dashboardData?.total_papers || 0) + (dashboardData?.total_notes || 0))}
                  </h3>
                  <p className="text-sm text-gray-500">Total Content</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(uploadTrends?.recent_uploads || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Recent Uploads</p>
                  {uploadTrends?.upload_growth && (
                    <div className="flex items-center mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">
                        {formatPercentage(uploadTrends.upload_growth)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(downloadStats?.total_downloads || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Total Downloads</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {uploadTrends?.avg_per_day ? formatNumber(uploadTrends.avg_per_day) : '0'}
                  </h3>
                  <p className="text-sm text-gray-500">Avg. Daily Uploads</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Engagement Tab */}
      {!isLoading && activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatPercentage(userEngagement?.engagement_rate || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Engagement Rate</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatNumber(userEngagement?.daily_active_users || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Daily Active Users</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Download className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {userEngagement?.avg_session_duration ? 
                      `${Math.round(userEngagement.avg_session_duration / 60)}m` : '0m'
                    }
                  </h3>
                  <p className="text-sm text-gray-500">Avg. Session Duration</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {formatPercentage(userEngagement?.bounce_rate || 0)}
                  </h3>
                  <p className="text-sm text-gray-500">Bounce Rate</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
