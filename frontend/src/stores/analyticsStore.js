import { create } from 'zustand';
import { analyticsAPI } from '../lib/api';

const useAnalyticsStore = create((set, get) => ({
  // State
  dashboardData: null,
  popularPapers: [],
  popularNotes: [],
  downloadStats: null,
  userEngagement: null,
  uploadTrends: null,
  subjectPopularity: [],
  systemMetrics: null,
  usageStats: null,
  weeklyTrends: null,
  periodComparison: null,
  
  // Loading states
  isLoadingDashboard: false,
  isLoadingPopularPapers: false,
  isLoadingPopularNotes: false,
  isLoadingDownloadStats: false,
  isLoadingUserEngagement: false,
  isLoadingUploadTrends: false,
  isLoadingSubjectPopularity: false,
  isLoadingSystemMetrics: false,
  isLoadingUsageStats: false,
  isLoadingWeeklyTrends: false,
  isLoadingPeriodComparison: false,
  
  // Date range for analytics
  dateRange: {
    start: null,
    end: null,
  },

  // Actions - Dashboard Overview
  fetchDashboardData: async (dateRange = null) => {
    set({ isLoadingDashboard: true });
    
    try {
      const data = await analyticsAPI.getDashboard(dateRange);
      set({
        dashboardData: data,
        isLoadingDashboard: false,
      });
      return data;
    } catch (error) {
      set({ isLoadingDashboard: false });
      throw error;
    }
  },

  // Actions - Popular Papers
  fetchPopularPapers: async (params = {}) => {
    set({ isLoadingPopularPapers: true });
    
    try {
      const papers = await analyticsAPI.getPopularPapers(params);
      set({
        popularPapers: papers,
        isLoadingPopularPapers: false,
      });
      return papers;
    } catch (error) {
      set({ isLoadingPopularPapers: false });
      throw error;
    }
  },

  // Actions - Popular Notes
  fetchPopularNotes: async (params = {}) => {
    set({ isLoadingPopularNotes: true });
    
    try {
      const notes = await analyticsAPI.getPopularNotes(params);
      set({
        popularNotes: notes,
        isLoadingPopularNotes: false,
      });
      return notes;
    } catch (error) {
      set({ isLoadingPopularNotes: false });
      throw error;
    }
  },

  // Actions - Download Statistics
  fetchDownloadStats: async (params = {}) => {
    set({ isLoadingDownloadStats: true });
    
    try {
      const stats = await analyticsAPI.getDownloadStats(params);
      set({
        downloadStats: stats,
        isLoadingDownloadStats: false,
      });
      return stats;
    } catch (error) {
      set({ isLoadingDownloadStats: false });
      throw error;
    }
  },

  // Actions - User Engagement
  fetchUserEngagement: async (params = {}) => {
    set({ isLoadingUserEngagement: true });
    
    try {
      const engagement = await analyticsAPI.getUserEngagement(params);
      set({
        userEngagement: engagement,
        isLoadingUserEngagement: false,
      });
      return engagement;
    } catch (error) {
      set({ isLoadingUserEngagement: false });
      throw error;
    }
  },

  // Actions - Content Metrics
  fetchContentMetrics: async (params = {}) => {
    set({ isLoadingContentMetrics: true });
    
    try {
      const metrics = await analyticsAPI.getContentMetrics(params);
      set({
        contentMetrics: metrics,
        isLoadingContentMetrics: false,
      });
      return metrics;
    } catch (error) {
      set({ isLoadingContentMetrics: false });
      throw error;
    }
  },

  // Actions - Usage Statistics
  fetchUsageStats: async (days = 30) => {
    set({ isLoadingUsageStats: true });
    
    try {
      const stats = await analyticsAPI.getUsageStats(days);
      set({
        usageStats: stats,
        isLoadingUsageStats: false,
      });
      return stats;
    } catch (error) {
      set({ isLoadingUsageStats: false });
      throw error;
    }
  },

  // Actions - Upload Trends
  fetchUploadTrends: async (days = 30) => {
    set({ isLoadingUploadTrends: true });
    
    try {
      const trends = await analyticsAPI.getUploadTrends(days);
      set({
        uploadTrends: trends,
        isLoadingUploadTrends: false,
      });
      return trends;
    } catch (error) {
      set({ isLoadingUploadTrends: false });
      throw error;
    }
  },

  // Actions - Subject Popularity
  fetchSubjectPopularity: async (limit = 20) => {
    set({ isLoadingSubjectPopularity: true });
    
    try {
      const popularity = await analyticsAPI.getSubjectPopularity(limit);
      set({
        subjectPopularity: popularity,
        isLoadingSubjectPopularity: false,
      });
      return popularity;
    } catch (error) {
      set({ isLoadingSubjectPopularity: false });
      throw error;
    }
  },

  // Actions - System Metrics
  fetchSystemMetrics: async (days = 30) => {
    set({ isLoadingSystemMetrics: true });
    
    try {
      const metrics = await analyticsAPI.getSystemMetrics(days);
      set({
        systemMetrics: metrics,
        isLoadingSystemMetrics: false,
      });
      return metrics;
    } catch (error) {
      set({ isLoadingSystemMetrics: false });
      throw error;
    }
  },

  // Actions - Weekly Trends
  fetchWeeklyTrends: async (weeks = 4) => {
    set({ isLoadingWeeklyTrends: true });
    
    try {
      const trends = await analyticsAPI.getWeeklyTrends(weeks);
      set({
        weeklyTrends: trends,
        isLoadingWeeklyTrends: false,
      });
      return trends;
    } catch (error) {
      set({ isLoadingWeeklyTrends: false });
      throw error;
    }
  },

  // Actions - Period Comparison
  fetchPeriodComparison: async (currentDays = 30, comparisonDays = 30) => {
    set({ isLoadingPeriodComparison: true });
    
    try {
      const comparison = await analyticsAPI.getPeriodComparison(currentDays, comparisonDays);
      set({
        periodComparison: comparison,
        isLoadingPeriodComparison: false,
      });
      return comparison;
    } catch (error) {
      set({ isLoadingPeriodComparison: false });
      throw error;
    }
  },

  // Actions - Export Data
  exportAnalyticsData: async (type, params = {}) => {
    try {
      const response = await analyticsAPI.exportData(type, params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - Custom Reports
  generateCustomReport: async (reportConfig) => {
    try {
      const report = await analyticsAPI.generateCustomReport(reportConfig);
      return report;
    } catch (error) {
      throw error;
    }
  },

  // Date range actions
  setDateRange: (startDate, endDate) => {
    set({
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  },

  clearDateRange: () => {
    set({
      dateRange: {
        start: null,
        end: null,
      },
    });
  },

  // Refresh all analytics data
  refreshAllData: async (days = 30) => {
    try {
      await Promise.all([
        get().fetchDashboardData(),
        get().fetchUsageStats(days),
        get().fetchPopularPapers(10, days),
        get().fetchPopularNotes(10, days),
        get().fetchDownloadStats(days),
        get().fetchUserEngagement(days),
        get().fetchUploadTrends(days),
        get().fetchSubjectPopularity(20),
        get().fetchSystemMetrics(days),
        get().fetchWeeklyTrends(4),
        get().fetchPeriodComparison(days, days),
      ]);
    } catch (error) {
      console.error('Error refreshing analytics data:', error);
      throw error;
    }
  },

  // Utility functions
  getTotalDownloads: () => {
    const { downloadStats } = get();
    return downloadStats?.total_downloads || 0;
  },

  getTotalUsers: () => {
    const { dashboardData } = get();
    return dashboardData?.total_users || 0;
  },

  getTotalPapers: () => {
    const { dashboardData } = get();
    return dashboardData?.total_papers || 0;
  },

  getActiveUsers: () => {
    const { userEngagement } = get();
    return userEngagement?.active_users || 0;
  },

  getTopUniversity: () => {
    const { contentMetrics } = get();
    return contentMetrics?.universities?.[0] || null;
  },

  getTopSubject: () => {
    const { contentMetrics } = get();
    return contentMetrics?.subjects?.[0] || null;
  },

  // Growth rate calculations
  getUserGrowthRate: () => {
    const { platformGrowth } = get();
    if (!platformGrowth?.user_growth) return 0;
    
    const growth = platformGrowth.user_growth;
    const current = growth[growth.length - 1]?.value || 0;
    const previous = growth[growth.length - 2]?.value || 0;
    
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  },

  getPaperGrowthRate: () => {
    const { platformGrowth } = get();
    if (!platformGrowth?.paper_growth) return 0;
    
    const growth = platformGrowth.paper_growth;
    const current = growth[growth.length - 1]?.value || 0;
    const previous = growth[growth.length - 2]?.value || 0;
    
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  },

  getDownloadGrowthRate: () => {
    const { platformGrowth } = get();
    if (!platformGrowth?.download_growth) return 0;
    
    const growth = platformGrowth.download_growth;
    const current = growth[growth.length - 1]?.value || 0;
    const previous = growth[growth.length - 2]?.value || 0;
    
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  },

  // Filter popular papers
  getPopularPapersBySubject: (subjectId) => {
    const { popularPapers } = get();
    return popularPapers.filter(paper => paper.subject_id === subjectId);
  },

  getPopularPapersByUniversity: (universityId) => {
    const { popularPapers } = get();
    return popularPapers.filter(paper => paper.university_id === universityId);
  },

  // Clear functions
  clearDashboardData: () => {
    set({ dashboardData: null });
  },

  clearPopularPapers: () => {
    set({ popularPapers: [] });
  },

  clearPopularNotes: () => {
    set({ popularNotes: [] });
  },

  clearDownloadStats: () => {
    set({ downloadStats: null });
  },

  clearUserEngagement: () => {
    set({ userEngagement: null });
  },

  clearContentMetrics: () => {
    set({ contentMetrics: null });
  },

  clearPlatformGrowth: () => {
    set({ platformGrowth: null });
  },

  // Reset all analytics state
  resetAnalyticsState: () => {
    set({
      dashboardData: null,
      popularPapers: [],
      popularNotes: [],
      downloadStats: null,
      userEngagement: null,
      contentMetrics: null,
      platformGrowth: null,
      
      isLoadingDashboard: false,
      isLoadingPopularPapers: false,
      isLoadingPopularNotes: false,
      isLoadingDownloadStats: false,
      isLoadingUserEngagement: false,
      isLoadingContentMetrics: false,
      isLoadingPlatformGrowth: false,
      
      dateRange: {
        start: null,
        end: null,
      },
    });
  },

  // Predefined date ranges
  setLastWeek: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    get().setDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  },

  setLastMonth: () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 1);
    
    get().setDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  },

  setLastQuarter: () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 3);
    
    get().setDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  },

  setLastYear: () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    
    get().setDateRange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  },
}));

export default useAnalyticsStore;
