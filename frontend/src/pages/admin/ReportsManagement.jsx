import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAdminStore from '../../stores/adminStore';
import useAuthStore from '../../stores/authStore';
import { formatDate, formatRelativeTime } from '../../lib/utils';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const ReportsManagement = () => {
  const [selectedReports, setSelectedReports] = useState([]);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveAction, setResolveAction] = useState('dismiss');
  const [resolveNotes, setResolveNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [isResolving, setIsResolving] = useState(false);
  
  const {
    reports,
    totalReports,
    reportsPage,
    isLoadingReports,
    fetchReports,
    resolveReport,
    bulkResolveReports
  } = useAdminStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports({ page: 1, status: statusFilter });
    }
  }, [user, statusFilter]);
  
  const handleResolveReport = async (reportId, action = 'dismiss', notes = '') => {
    setIsResolving(true);
    try {
      const response = await resolveReport(reportId, action, notes);
      setSelectedReports(prev => prev.filter(id => id !== reportId));
      
      // Show detailed success message based on action taken
      if (response.paper_action_taken === 'paper_rejected') {
        toast.success('Report resolved and paper was rejected!', { duration: 4000 });
      } else if (response.paper_action_taken === 'paper_removed') {
        toast.success('Report resolved and paper was removed!', { duration: 4000 });
      } else if (action === 'warn_user') {
        toast.success('Report resolved and user warning issued!', { duration: 4000 });
      } else if (action === 'dismiss') {
        toast.success('Report dismissed - no violation found', { duration: 3000 });
      } else {
        toast.success('Report resolved successfully!', { duration: 3000 });
      }
    } catch (error) {
      toast.error('Failed to resolve report');
    } finally {
      setIsResolving(false);
    }
  };
  
  const handleBulkResolve = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select reports to resolve');
      return;
    }
    
    setIsResolving(true);
    try {
      const response = await bulkResolveReports(selectedReports, resolveAction, resolveNotes);
      setSelectedReports([]);
      setShowResolveModal(false);
      setResolveNotes('');
      
      // Show detailed success message based on action taken
      const count = response.resolved_count || selectedReports.length;
      if (resolveAction === 'remove_paper') {
        toast.success(`${count} reports resolved and papers were removed!`, { duration: 5000 });
      } else if (resolveAction === 'warn_user') {
        toast.success(`${count} reports resolved and warnings issued!`, { duration: 4000 });
      } else if (resolveAction === 'dismiss') {
        toast.success(`${count} reports dismissed - no violations found`, { duration: 3000 });
      } else {
        toast.success(`${count} reports resolved successfully!`, { duration: 3000 });
      }
    } catch (error) {
      toast.error('Failed to resolve reports');
    } finally {
      setIsResolving(false);
    }
  };
  
  const getStatusBadge = (status) => {
    const classes = {
      open: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status] || classes.open}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  const getReasonBadge = (reason) => {
    const colorMap = {
      'Inappropriate Content': 'bg-red-100 text-red-800',
      'Copyright Violation': 'bg-purple-100 text-purple-800',
      'Spam or Duplicate': 'bg-orange-100 text-orange-800',
      'Incorrect Information': 'bg-blue-100 text-blue-800',
      'Poor Quality': 'bg-gray-100 text-gray-800',
      'Wrong Categorization': 'bg-indigo-100 text-indigo-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorMap[reason] || colorMap['Other']}`}>
        {reason}
      </span>
    );
  };
  
  const handleSelectAll = (checked) => {
    if (checked) {
      const openReports = reports.filter(r => r.status === 'open').map(r => r.id);
      setSelectedReports(openReports);
    } else {
      setSelectedReports([]);
    }
  };
  
  const handleSelectReport = (reportId, checked) => {
    if (checked) {
      setSelectedReports(prev => [...prev, reportId]);
    } else {
      setSelectedReports(prev => prev.filter(id => id !== reportId));
    }
  };
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  const openReports = reports.filter(r => r.status === 'open');
  const selectedCount = selectedReports.length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600 mt-1">
            Manage user reports and take appropriate actions
          </p>
          
          {/* Action Guide */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">📋 Admin Actions Guide:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
              <div><strong>Dismiss:</strong> Report is invalid/no violation</div>
              <div><strong>Take Action:</strong> Review and moderate if needed</div>
              <div><strong>Warning:</strong> Issue warning to uploader</div>
              <div><strong>Remove Paper:</strong> Immediately reject the paper</div>
            </div>
          </div>
        </div>
        
        {selectedCount > 0 && (
          <Button
            onClick={() => setShowResolveModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Resolve {selectedCount} Report{selectedCount !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Reports</p>
                <p className="text-2xl font-bold text-gray-900">{openReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Need Action</p>
                <p className="text-2xl font-bold text-gray-900">{openReports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="open">Open Reports</option>
            <option value="closed">Resolved Reports</option>
            <option value="">All Reports</option>
          </select>
        </div>
      </div>
      
      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reports</CardTitle>
            {openReports.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedReports.length === openReports.length && openReports.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                  Select All Open
                </label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingReports ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No reports found</h3>
              <p className="text-gray-600">
                {statusFilter === 'open' ? 'No open reports at this time.' : 'No reports match your current filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-8 px-6 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className={selectedReports.includes(report.id) ? 'bg-blue-50' : ''}>
                      <td className="px-6 py-4">
                        {report.status === 'open' && (
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={(e) => handleSelectReport(report.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {/* Show content type and subject */}
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {report.details || `${report.content_type || 'Paper'} - Unknown Subject`}
                          </p>
                          
                          {/* Show title with appropriate link */}
                          <Link
                            to={report.content_type === 'note' ? `/notes/${report.note_id || report.content_id}` : `/papers/${report.paper_id || report.content_id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 line-clamp-2"
                          >
                            {report.content_title || report.paper_title || report.note_title || 'Untitled'}
                          </Link>
                          
                          {/* Show status */}
                          <p className="text-xs text-gray-500 mt-1">
                            Status: {report.content_status || report.paper_status || report.note_status || 'Unknown'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{report.reporter_name}</p>
                          <p className="text-xs text-gray-500">{report.reporter_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {getReasonBadge(report.reason)}
                          {(report.report_details || report.details) && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 max-w-xs">
                              {report.report_details || (report.content_type ? '' : report.details)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(report.status)}
                        {report.status === 'closed' && (
                          <div className="mt-1">
                            {report.resolved_by_name && (
                              <p className="text-xs text-gray-500">
                                by {report.resolved_by_name}
                              </p>
                            )}
                            {report.admin_notes && (
                              <p className="text-xs text-gray-600 mt-1 font-medium">
                                📝 {report.admin_notes.length > 50 ? `${report.admin_notes.substring(0, 50)}...` : report.admin_notes}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{formatDate(report.created_at)}</p>
                          <p className="text-xs text-gray-500">{formatRelativeTime(report.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {report.status === 'open' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResolveReport(report.id, 'dismiss', 'Dismissed by admin')}
                              disabled={isResolving}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReports([report.id]);
                                setResolveAction('take_action');
                                setShowResolveModal(true);
                              }}
                              disabled={isResolving}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Take Action
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {report.resolved_at ? `Resolved ${formatRelativeTime(report.resolved_at)}` : 'Resolved'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Bulk Resolve Modal */}
      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} className="max-w-md">
        <ModalHeader>
          <ModalTitle>Resolve Reports</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to resolve {selectedCount} report{selectedCount !== 1 ? 's' : ''}.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={resolveAction}
                onChange={(e) => setResolveAction(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="dismiss">Dismiss - Report is invalid or doesn't violate guidelines</option>
                <option value="take_action">Take Action - Moderate the reported paper</option>
                <option value="warn_user">Warning - Contact user about the issue</option>
                <option value="remove_paper">Remove Paper - Delete the reported content</option>
              </select>
            </div>
            
            {resolveAction === 'take_action' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">Take Action will:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Mark the report as resolved</li>
                  <li>• If notes mention "reject" or "remove", the paper will be rejected</li>
                  <li>• Record admin action in audit logs</li>
                  <li>• Notify the paper uploader (if configured)</li>
                </ul>
              </div>
            )}
            
            {resolveAction === 'remove_paper' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium mb-2">⚠️ Remove Paper will:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Immediately reject the reported paper</li>
                  <li>• Make it unavailable for download</li>
                  <li>• Record the action in audit logs</li>
                  <li>• This action cannot be easily undone</li>
                </ul>
              </div>
            )}
            
            {resolveAction === 'warn_user' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium mb-2">Warning will:</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Keep the paper active</li>
                  <li>• Record a warning in the user's account</li>
                  <li>• Send notification to paper uploader</li>
                  <li>• Mark report as resolved with warning</li>
                </ul>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
              <textarea
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Add notes about the resolution..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowResolveModal(false)}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkResolve}
            disabled={isResolving}
            loading={isResolving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Resolve Reports
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ReportsManagement;
