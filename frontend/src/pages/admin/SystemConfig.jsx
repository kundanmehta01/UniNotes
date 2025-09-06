import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Database,
  HardDrive,
  Activity,
  Shield,
  Mail,
  FileText,
  Users,
  Upload
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Loading,
  Badge,
  Toggle
} from '../../components';
import useAdminStore from '../../stores/adminStore';
import toast from 'react-hot-toast';

const SystemConfig = () => {
  const {
    systemConfig,
    systemHealth,
    isLoadingConfig,
    isLoadingHealth,
    fetchSystemConfig,
    updateSystemConfig,
    fetchSystemHealth,
    cleanupTokens,
    backupDatabase,
    clearCache
  } = useAdminStore();

  const [config, setConfig] = useState({
    site_name: 'UniNotesHub',
    site_description: 'University Notes Sharing Platform',
    max_file_size: 50, // MB
    allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
    require_email_verification: true,
    allow_anonymous_downloads: false,
    max_downloads_per_day: 100,
    enable_paper_moderation: true,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
    maintenance_mode: false,
    registration_enabled: true,
    auto_approve_papers: false,
    cache_duration: 3600,
    session_timeout: 86400
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    document.title = 'System Configuration - Admin - UniNotesHub';
    loadSystemData();
  }, []);

  useEffect(() => {
    if (systemConfig) {
      setConfig(prev => ({ ...prev, ...systemConfig }));
    }
  }, [systemConfig]);

  const loadSystemData = async () => {
    try {
      await Promise.all([
        fetchSystemConfig(),
        fetchSystemHealth()
      ]);
    } catch (error) {
      console.error('Failed to load system data:', error);
      toast.error('Failed to load system configuration');
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await updateSystemConfig(config);
      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceAction = async (action) => {
    try {
      let message = '';
      switch (action) {
        case 'cleanup':
          await cleanupTokens();
          message = 'Token cleanup completed';
          break;
        case 'backup':
          await backupDatabase();
          message = 'Database backup initiated';
          break;
        case 'cache':
          await clearCache();
          message = 'Cache cleared successfully';
          break;
        default:
          return;
      }
      toast.success(message);
      // Refresh health data after maintenance actions
      await fetchSystemHealth();
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
      toast.error(`Failed to perform ${action}`);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '0s';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getHealthStatus = () => {
    if (!systemHealth) return 'unknown';
    if (systemHealth.status === 'healthy') return 'healthy';
    if (systemHealth.status === 'degraded') return 'degraded';
    return 'unhealthy';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      healthy: { color: 'bg-green-100 text-green-800', text: 'Healthy' },
      degraded: { color: 'bg-yellow-100 text-yellow-800', text: 'Degraded' },
      unhealthy: { color: 'bg-red-100 text-red-800', text: 'Unhealthy' },
      unknown: { color: 'bg-gray-100 text-gray-800', text: 'Unknown' }
    };

    const config = statusConfig[status] || statusConfig.unknown;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'files', name: 'Files & Upload', icon: Upload },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'health', name: 'System Health', icon: Activity },
    { id: 'maintenance', name: 'Maintenance', icon: HardDrive }
  ];

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-600">Manage system settings and configuration</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={loadSystemData}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          {getStatusBadge(getHealthStatus())}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatUptime(systemHealth?.uptime || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Database</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemHealth?.database_status || 'Unknown'}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <HardDrive className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Storage</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatBytes(systemHealth?.storage_used || 0)}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Users className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemHealth?.active_users || 0}
            </p>
          </div>
        </div>
      </Card>

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

      {/* Tab Content */}
      <div className="space-y-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <Input
                  value={config.site_name}
                  onChange={(e) => handleConfigChange('site_name', e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <Input
                  value={config.site_description}
                  onChange={(e) => handleConfigChange('site_description', e.target.value)}
                  placeholder="Enter site description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Downloads per Day
                </label>
                <Input
                  type="number"
                  value={config.max_downloads_per_day}
                  onChange={(e) => handleConfigChange('max_downloads_per_day', parseInt(e.target.value))}
                  placeholder="Enter max downloads"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (seconds)
                </label>
                <Input
                  type="number"
                  value={config.session_timeout}
                  onChange={(e) => handleConfigChange('session_timeout', parseInt(e.target.value))}
                  placeholder="Enter session timeout"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                  <p className="text-sm text-gray-500">Enable to prevent user access during maintenance</p>
                </div>
                <Toggle
                  checked={config.maintenance_mode}
                  onChange={(checked) => handleConfigChange('maintenance_mode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Registration Enabled</h4>
                  <p className="text-sm text-gray-500">Allow new users to register</p>
                </div>
                <Toggle
                  checked={config.registration_enabled}
                  onChange={(checked) => handleConfigChange('registration_enabled', checked)}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Files & Upload Settings */}
        {activeTab === 'files' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Files & Upload Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max File Size (MB)
                </label>
                <Input
                  type="number"
                  value={config.max_file_size}
                  onChange={(e) => handleConfigChange('max_file_size', parseInt(e.target.value))}
                  placeholder="Enter max file size"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed File Types
                </label>
                <Input
                  value={config.allowed_file_types?.join(', ')}
                  onChange={(e) => handleConfigChange('allowed_file_types', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="pdf, doc, docx, txt"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Auto-Approve Papers</h4>
                  <p className="text-sm text-gray-500">Automatically approve uploaded papers</p>
                </div>
                <Toggle
                  checked={config.auto_approve_papers}
                  onChange={(checked) => handleConfigChange('auto_approve_papers', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Paper Moderation</h4>
                  <p className="text-sm text-gray-500">Require manual review of uploaded papers</p>
                </div>
                <Toggle
                  checked={config.enable_paper_moderation}
                  onChange={(checked) => handleConfigChange('enable_paper_moderation', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Anonymous Downloads</h4>
                  <p className="text-sm text-gray-500">Allow downloads without user authentication</p>
                </div>
                <Toggle
                  checked={config.allow_anonymous_downloads}
                  onChange={(checked) => handleConfigChange('allow_anonymous_downloads', checked)}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Email Settings */}
        {activeTab === 'email' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Email Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Host
                </label>
                <Input
                  value={config.smtp_host}
                  onChange={(e) => handleConfigChange('smtp_host', e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Port
                </label>
                <Input
                  type="number"
                  value={config.smtp_port}
                  onChange={(e) => handleConfigChange('smtp_port', parseInt(e.target.value))}
                  placeholder="587"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Username
                </label>
                <Input
                  value={config.smtp_username}
                  onChange={(e) => handleConfigChange('smtp_username', e.target.value)}
                  placeholder="Enter SMTP username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Password
                </label>
                <Input
                  type="password"
                  value={config.smtp_password}
                  onChange={(e) => handleConfigChange('smtp_password', e.target.value)}
                  placeholder="Enter SMTP password"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Use TLS</h4>
                  <p className="text-sm text-gray-500">Enable TLS encryption for SMTP</p>
                </div>
                <Toggle
                  checked={config.smtp_use_tls}
                  onChange={(checked) => handleConfigChange('smtp_use_tls', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Require Email Verification</h4>
                  <p className="text-sm text-gray-500">Require users to verify their email addresses</p>
                </div>
                <Toggle
                  checked={config.require_email_verification}
                  onChange={(checked) => handleConfigChange('require_email_verification', checked)}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache Duration (seconds)
                </label>
                <Input
                  type="number"
                  value={config.cache_duration}
                  onChange={(e) => handleConfigChange('cache_duration', parseInt(e.target.value))}
                  placeholder="3600"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Security Status</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">SSL Certificate Valid</span>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Database Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* System Health */}
        {activeTab === 'health' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
              <Button
                onClick={() => fetchSystemHealth()}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {systemHealth ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">CPU Usage</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {systemHealth.cpu_usage ? `${systemHealth.cpu_usage.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Memory Usage</p>
                    <p className="text-2xl font-bold text-green-600">
                      {systemHealth.memory_usage ? `${systemHealth.memory_usage.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Disk Usage</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {systemHealth.disk_usage ? `${systemHealth.disk_usage.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Service Status</h4>
                  <div className="space-y-2">
                    {systemHealth.services && Object.entries(systemHealth.services).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900 capitalize">{service}</span>
                        {getStatusBadge(status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No health data available
              </div>
            )}
          </Card>
        )}

        {/* Maintenance */}
        {activeTab === 'maintenance' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Maintenance Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Database Backup</h4>
                <p className="text-sm text-gray-500 mb-4">Create a backup of the database</p>
                <Button
                  onClick={() => handleMaintenanceAction('backup')}
                  className="w-full"
                >
                  Backup Database
                </Button>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <HardDrive className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Clear Cache</h4>
                <p className="text-sm text-gray-500 mb-4">Clear application cache</p>
                <Button
                  onClick={() => handleMaintenanceAction('cache')}
                  variant="outline"
                  className="w-full"
                >
                  Clear Cache
                </Button>
              </div>
              
              <div className="text-center p-6 border border-gray-200 rounded-lg">
                <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Cleanup Tokens</h4>
                <p className="text-sm text-gray-500 mb-4">Remove expired authentication tokens</p>
                <Button
                  onClick={() => handleMaintenanceAction('cleanup')}
                  variant="outline"
                  className="w-full"
                >
                  Cleanup Tokens
                </Button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Maintenance operations may temporarily affect system performance. 
                    It's recommended to perform these operations during low-traffic periods.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SystemConfig;
