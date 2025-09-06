import React, { useState, useEffect } from 'react';
import {
  FileText,
  Filter,
  Search,
  RefreshCw,
  Download,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Loading,
  Badge,
  Pagination
} from '../../components';
import useAdminStore from '../../stores/adminStore';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const {
    auditLogs,
    totalAuditLogs,
    isLoadingAuditLogs,
    auditLogsPage,
    fetchAuditLogs,
    exportUsers // We can reuse this for audit log exports
  } = useAdminStore();

  const [filters, setFilters] = useState({
    search: '',
    action_type: '',
    user_id: '',
    date_from: '',
    date_to: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    document.title = 'Audit Logs - Admin - UniNotesHub';
  }, []);

  useEffect(() => {
    const params = {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      ...filters
    };
    fetchAuditLogs(params);
  }, [currentPage, filters, fetchAuditLogs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    const params = {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      ...filters
    };
    fetchAuditLogs(params);
    toast.success('Audit logs refreshed');
  };

  const handleExport = async () => {
    try {
      // This would need to be implemented in the admin store
      toast.success('Audit logs export initiated');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  const handleSelectLog = (logId) => {
    setSelectedLogs(prev => {
      if (prev.includes(logId)) {
        return prev.filter(id => id !== logId);
      }
      return [...prev, logId];
    });
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === auditLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(auditLogs.map(log => log.id));
    }
  };

  const getActionBadge = (action) => {
    const actionConfig = {
      'create': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'update': { color: 'bg-blue-100 text-blue-800', icon: Activity },
      'delete': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'login': { color: 'bg-purple-100 text-purple-800', icon: User },
      'logout': { color: 'bg-gray-100 text-gray-800', icon: User },
      'access': { color: 'bg-orange-100 text-orange-800', icon: Eye },
      'error': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'warning': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    };

    const config = actionConfig[action.toLowerCase()] || actionConfig['access'];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {action}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={severityConfig[severity.toLowerCase()] || severityConfig['low']}>
        {severity}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'access', label: 'Access' },
    { value: 'error', label: 'Error' },
    { value: 'warning', label: 'Warning' }
  ];

  const totalPages = Math.ceil(totalAuditLogs / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">View and monitor system activity logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalAuditLogs}</h3>
              <p className="text-sm text-gray-500">Total Logs</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {auditLogs.filter(log => log.action_type === 'create').length}
              </h3>
              <p className="text-sm text-gray-500">Create Actions</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {auditLogs.filter(log => log.action_type === 'update').length}
              </h3>
              <p className="text-sm text-gray-500">Update Actions</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {auditLogs.filter(log => ['error', 'warning'].includes(log.action_type)).length}
              </h3>
              <p className="text-sm text-gray-500">Issues</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Logs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <Select
                value={filters.action_type}
                onChange={(e) => handleFilterChange('action_type', e.target.value)}
              >
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <Select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              >
                <option value="created_at">Date</option>
                <option value="action_type">Action</option>
                <option value="user_email">User</option>
                <option value="resource_type">Resource</option>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedLogs.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedLogs.length} log{selectedLogs.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
              >
                Export Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLogs.length === auditLogs.length && auditLogs.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingAuditLogs ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <Loading />
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const timestamp = formatTimestamp(log.created_at);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={() => handleSelectLog(log.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{timestamp.date}</div>
                        <div className="text-sm text-gray-500">{timestamp.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {log.user_email ? log.user_email.charAt(0).toUpperCase() : 'S'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {log.user_email || 'System'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {log.user_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.resource_type || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {log.resource_id ? `ID: ${log.resource_id}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getSeverityBadge(log.severity || 'low')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.details || log.description || 'No details'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
