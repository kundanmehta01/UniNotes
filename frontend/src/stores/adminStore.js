import { create } from 'zustand';
import { adminAPI } from '../lib/api';
import toast from 'react-hot-toast';

const useAdminStore = create((set, get) => ({
  // State
  users: [],
  pendingPapers: [],
  allPapers: [],
  reports: [],
  systemStats: null,
  systemConfig: null,
  systemHealth: null,
  auditLogs: [],
  
  // Loading states
  isLoadingUsers: false,
  isLoadingPendingPapers: false,
  isLoadingAllPapers: false,
  isLoadingReports: false,
  isLoadingStats: false,
  isLoadingConfig: false,
  isLoadingHealth: false,
  isLoadingAuditLogs: false,
  
  // Pagination
  usersPage: 1,
  pendingPapersPage: 1,
  allPapersPage: 1,
  reportsPage: 1,
  auditLogsPage: 1,
  
  totalUsers: 0,
  totalPendingPapers: 0,
  totalAllPapers: 0,
  totalReports: 0,
  totalAuditLogs: 0,

  // Actions - Users Management
  fetchUsers: async (params = {}) => {
    set({ isLoadingUsers: true });
    
    try {
      const response = await adminAPI.getUsers(params);
      set({
        users: response.users || response,
        totalUsers: response.total || response.length || 0,
        usersPage: params.page || 1,
        isLoadingUsers: false,
      });
      return response;
    } catch (error) {
      set({ isLoadingUsers: false });
      throw error;
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const updatedUser = await adminAPI.updateUserRole(userId, role);
      
      // Update user in the list
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? updatedUser : user
      );
      
      set({ users: updatedUsers });
      toast.success(`User role updated to ${role}!`);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    try {
      const updatedUser = await adminAPI.updateUserStatus(userId, isActive);
      
      // Update user in the list
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? updatedUser : user
      );
      
      set({ users: updatedUsers });
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const updatedUser = await adminAPI.updateUser(userId, userData);
      
      // Update user in the list
      const { users } = get();
      const updatedUsers = users.map(user => 
        user.id === userId ? updatedUser : user
      );
      
      set({ users: updatedUsers });
      toast.success('User updated successfully!');
      return updatedUser;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      
      // Remove user from the list
      const { users } = get();
      const filteredUsers = users.filter(user => user.id !== userId);
      
      set({ users: filteredUsers });
      toast.success('User deleted successfully!');
    } catch (error) {
      throw error;
    }
  },

  // Actions - Papers Moderation
  fetchPendingPapers: async (params = {}) => {
    set({ isLoadingPendingPapers: true });
    
    try {
      const response = await adminAPI.getPendingPapers(params);
      set({
        pendingPapers: response.papers || response,
        totalPendingPapers: response.total || response.length || 0,
        pendingPapersPage: params.page || 1,
        isLoadingPendingPapers: false,
      });
      return response;
    } catch (error) {
      set({ isLoadingPendingPapers: false });
      throw error;
    }
  },

  moderatePaper: async (paperId, action, notes = '') => {
    try {
      const response = await adminAPI.moderatePaper(paperId, action, notes);
      
      // Remove paper from pending list if moderated
      const { pendingPapers } = get();
      const filteredPapers = pendingPapers.filter(paper => paper.id !== paperId);
      
      set({ pendingPapers: filteredPapers });
      toast.success(`Paper ${action}d successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - Reports Management
  fetchReports: async (params = {}) => {
    set({ isLoadingReports: true });
    
    try {
      const response = await adminAPI.getReports(params);
      set({
        reports: response.reports || response,
        totalReports: response.total || response.length || 0,
        reportsPage: params.page || 1,
        isLoadingReports: false,
      });
      return response;
    } catch (error) {
      set({ isLoadingReports: false });
      throw error;
    }
  },

  resolveReport: async (reportId, action, notes = '') => {
    try {
      const response = await adminAPI.resolveReport(reportId, action, notes);
      
      // Update report status in the list
      const { reports } = get();
      const updatedReports = reports.map(report => 
        report.id === reportId 
          ? { ...report, status: 'resolved', resolution: action, resolution_notes: notes }
          : report
      );
      
      set({ reports: updatedReports });
      toast.success('Report resolved successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - System Statistics
  fetchSystemStats: async () => {
    set({ isLoadingStats: true });
    
    try {
      const [systemStats, userStats, paperStats] = await Promise.allSettled([
        adminAPI.getSystemStats(),
        adminAPI.getUserStats(),
        adminAPI.getPaperStats()
      ]);
      
      const combinedStats = {
        system: systemStats.status === 'fulfilled' ? systemStats.value : null,
        users: userStats.status === 'fulfilled' ? userStats.value : null,
        papers: paperStats.status === 'fulfilled' ? paperStats.value : null
      };
      
      set({
        systemStats: combinedStats,
        isLoadingStats: false,
      });
      return combinedStats;
    } catch (error) {
      set({ isLoadingStats: false });
      throw error;
    }
  },
  
  fetchDashboardData: async () => {
    set({ isLoadingStats: true });
    
    try {
      const dashboard = await adminAPI.getDashboard();
      set({
        systemStats: dashboard,
        isLoadingStats: false,
      });
      return dashboard;
    } catch (error) {
      set({ isLoadingStats: false });
      throw error;
    }
  },

  // Actions - All Papers Management
  fetchAllPapers: async (params = {}) => {
    set({ isLoadingAllPapers: true });
    
    try {
      const response = await adminAPI.getAllPapers(params);
      set({
        allPapers: response.papers || response,
        totalAllPapers: response.total || response.length || 0,
        allPapersPage: params.page || 1,
        isLoadingAllPapers: false,
      });
      return response;
    } catch (error) {
      set({ isLoadingAllPapers: false });
      throw error;
    }
  },

  approvePaper: async (paperId, notes = '') => {
    try {
      const response = await adminAPI.approvePaper(paperId, notes);
      
      // Remove paper from pending list and update all papers if loaded
      const { pendingPapers, allPapers } = get();
      const filteredPendingPapers = pendingPapers.filter(paper => paper.id !== paperId);
      const updatedAllPapers = allPapers.map(paper => 
        paper.id === paperId 
          ? { ...paper, status: 'approved', admin_notes: notes }
          : paper
      );
      
      set({ 
        pendingPapers: filteredPendingPapers,
        allPapers: updatedAllPapers
      });
      toast.success('Paper approved successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  rejectPaper: async (paperId, notes = '') => {
    try {
      const response = await adminAPI.rejectPaper(paperId, notes);
      
      // Remove paper from pending list and update all papers if loaded
      const { pendingPapers, allPapers } = get();
      const filteredPendingPapers = pendingPapers.filter(paper => paper.id !== paperId);
      const updatedAllPapers = allPapers.map(paper => 
        paper.id === paperId 
          ? { ...paper, status: 'rejected', admin_notes: notes }
          : paper
      );
      
      set({ 
        pendingPapers: filteredPendingPapers,
        allPapers: updatedAllPapers
      });
      toast.success('Paper rejected successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - System Configuration
  fetchSystemConfig: async () => {
    set({ isLoadingConfig: true });
    
    try {
      const config = await adminAPI.getSystemConfig();
      set({
        systemConfig: config,
        isLoadingConfig: false,
      });
      return config;
    } catch (error) {
      set({ isLoadingConfig: false });
      throw error;
    }
  },

  updateSystemConfig: async (configData) => {
    try {
      const updatedConfig = await adminAPI.updateSystemConfig(configData);
      set({ systemConfig: updatedConfig });
      toast.success('System configuration updated successfully!');
      return updatedConfig;
    } catch (error) {
      throw error;
    }
  },

  // Actions - System Health
  fetchSystemHealth: async () => {
    set({ isLoadingHealth: true });
    
    try {
      const health = await adminAPI.getSystemHealth();
      set({
        systemHealth: health,
        isLoadingHealth: false,
      });
      return health;
    } catch (error) {
      set({ isLoadingHealth: false });
      throw error;
    }
  },

  // Actions - Audit Logs
  fetchAuditLogs: async (params = {}) => {
    set({ isLoadingAuditLogs: true });
    
    try {
      const response = await adminAPI.getAuditLogs(params);
      set({
        auditLogs: response.logs || response,
        totalAuditLogs: response.total || response.length || 0,
        auditLogsPage: params.page || 1,
        isLoadingAuditLogs: false,
      });
      return response;
    } catch (error) {
      set({ isLoadingAuditLogs: false });
      throw error;
    }
  },

  // Actions - Bulk Operations
  bulkUserAction: async (action, userIds, reason = '') => {
    try {
      const response = await adminAPI.bulkUserAction(action, userIds, reason);
      
      // Update users based on action
      const { users } = get();
      let updatedUsers = users;
      
      if (action === 'delete') {
        updatedUsers = users.filter(user => !userIds.includes(user.id));
      } else if (action === 'deactivate') {
        updatedUsers = users.map(user => 
          userIds.includes(user.id) ? { ...user, is_active: false } : user
        );
      } else if (action === 'activate') {
        updatedUsers = users.map(user => 
          userIds.includes(user.id) ? { ...user, is_active: true } : user
        );
      }
      
      set({ users: updatedUsers });
      toast.success(`${userIds.length} users ${action}d successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Legacy bulk operations for backward compatibility
  bulkDeleteUsers: async (userIds, reason = '') => {
    return get().bulkUserAction('delete', userIds, reason);
  },

  bulkModeratePapers: async (paperIds, action, notes = '') => {
    try {
      const response = await adminAPI.bulkModeratePapers(paperIds, action, notes);
      
      // Remove papers from pending list
      const { pendingPapers } = get();
      const filteredPapers = pendingPapers.filter(paper => !paperIds.includes(paper.id));
      
      set({ pendingPapers: filteredPapers });
      toast.success(`${paperIds.length} papers ${action}d successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  bulkResolveReports: async (reportIds, action, notes = '') => {
    try {
      const response = await adminAPI.bulkResolveReports(reportIds, action, notes);
      
      // Update reports status in the list
      const { reports } = get();
      const updatedReports = reports.map(report => 
        reportIds.includes(report.id)
          ? { ...report, status: 'resolved', resolution: action, resolution_notes: notes }
          : report
      );
      
      set({ reports: updatedReports });
      toast.success(`${reportIds.length} reports resolved successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - Export Data
  exportUsers: async (format = 'csv') => {
    try {
      const response = await adminAPI.exportUsers(format);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Users exported as ${format.toUpperCase()} successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  exportPapers: async (format = 'csv', includeContent = false) => {
    try {
      const response = await adminAPI.exportPapers(format, includeContent);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `papers_export_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Papers exported as ${format.toUpperCase()} successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - Maintenance
  cleanupTokens: async () => {
    try {
      const response = await adminAPI.cleanupTokens();
      toast.success('Expired tokens cleaned up successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  backupDatabase: async () => {
    try {
      const response = await adminAPI.backupDatabase();
      toast.success('Database backup initiated successfully!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  clearCache: async (cacheType = 'all') => {
    try {
      const response = await adminAPI.clearCache(cacheType);
      toast.success(`Cache ${cacheType === 'all' ? '' : `(${cacheType}) `}cleared successfully!`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Actions - User Activity
  getUserActivity: async (userId, params = {}) => {
    try {
      const response = await adminAPI.getUserActivity(userId, params);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Pagination actions
  setUsersPage: (page) => {
    set({ usersPage: page });
  },

  setPendingPapersPage: (page) => {
    set({ pendingPapersPage: page });
  },

  setReportsPage: (page) => {
    set({ reportsPage: page });
  },

  setAuditLogsPage: (page) => {
    set({ auditLogsPage: page });
  },

  setAllPapersPage: (page) => {
    set({ allPapersPage: page });
  },

  // Utility functions
  getUserById: (userId) => {
    const { users } = get();
    return users.find(user => user.id === userId);
  },

  getPendingPaperById: (paperId) => {
    const { pendingPapers } = get();
    return pendingPapers.find(paper => paper.id === paperId);
  },

  getReportById: (reportId) => {
    const { reports } = get();
    return reports.find(report => report.id === reportId);
  },

  // Filter functions
  getUsersByRole: (role) => {
    const { users } = get();
    return users.filter(user => user.role === role);
  },

  getActiveUsers: () => {
    const { users } = get();
    return users.filter(user => user.is_active);
  },

  getInactiveUsers: () => {
    const { users } = get();
    return users.filter(user => !user.is_active);
  },

  getPendingReports: () => {
    const { reports } = get();
    return reports.filter(report => report.status === 'pending');
  },

  getResolvedReports: () => {
    const { reports } = get();
    return reports.filter(report => report.status === 'resolved');
  },

  // Clear functions
  clearUsers: () => {
    set({ users: [], totalUsers: 0, usersPage: 1 });
  },

  clearPendingPapers: () => {
    set({ pendingPapers: [], totalPendingPapers: 0, pendingPapersPage: 1 });
  },

  clearReports: () => {
    set({ reports: [], totalReports: 0, reportsPage: 1 });
  },

  clearAuditLogs: () => {
    set({ auditLogs: [], totalAuditLogs: 0, auditLogsPage: 1 });
  },

  clearSystemStats: () => {
    set({ systemStats: null });
  },

  // Reset all admin state
  resetAdminState: () => {
    set({
      users: [],
      pendingPapers: [],
      allPapers: [],
      reports: [],
      systemStats: null,
      systemConfig: null,
      systemHealth: null,
      auditLogs: [],
      
      isLoadingUsers: false,
      isLoadingPendingPapers: false,
      isLoadingAllPapers: false,
      isLoadingReports: false,
      isLoadingStats: false,
      isLoadingConfig: false,
      isLoadingHealth: false,
      isLoadingAuditLogs: false,
      
      usersPage: 1,
      pendingPapersPage: 1,
      allPapersPage: 1,
      reportsPage: 1,
      auditLogsPage: 1,
      
      totalUsers: 0,
      totalPendingPapers: 0,
      totalAllPapers: 0,
      totalReports: 0,
      totalAuditLogs: 0,
    });
  },
}));

export default useAdminStore;
