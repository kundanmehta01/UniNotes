import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { 
  Card, 
  Button, 
  Input, 
  Select, 
  Loading, 
  Pagination,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter
} from '../../components';
import useAdminStore from '../../stores/adminStore';
import { adminAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const {
    users,
    totalUsers,
    isLoadingUsers,
    usersPage,
    fetchUsers,
    deleteUser,
    updateUser
  } = useAdminStore();

  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    document.title = 'User Management - Admin - UniNotesHub';
  }, []);

  useEffect(() => {
    const params = {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage
    };
    
    // Only include filters that have valid values
    if (filters.search && filters.search.length >= 2) {
      params.search = filters.search;
    }
    
    if (filters.role && filters.role !== '') {
      params.role = filters.role;
    }
    
    if (filters.is_active && filters.is_active !== '') {
      params.is_active = filters.is_active === 'true';
    }
    
    if (filters.sort_by) {
      params.sort_by = filters.sort_by;
    }
    
    if (filters.sort_order) {
      params.sort_order = filters.sort_order;
    }
    
    fetchUsers(params);
  }, [currentPage, filters, fetchUsers]);

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      setShowDeleteModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      await updateUser(editingUser.id, userData);
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.error('Please select users first');
      return;
    }

    try {
      await adminAPI.bulkUserAction(action, selectedUsers, '');
      setSelectedUsers([]);
      setShowBulkActions(false);
      // Refresh user list
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage
      };
      
      // Only include filters that have valid values
      if (filters.search && filters.search.length >= 2) {
        params.search = filters.search;
      }
      
      if (filters.role && filters.role !== '') {
        params.role = filters.role;
      }
      
      if (filters.is_active && filters.is_active !== '') {
        params.is_active = filters.is_active === 'true';
      }
      
      if (filters.sort_by) {
        params.sort_by = filters.sort_by;
      }
      
      if (filters.sort_order) {
        params.sort_order = filters.sort_order;
      }
      
      fetchUsers(params);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleExportUsers = async () => {
    try {
      const result = await adminAPI.exportUsers('csv');
      toast.success('User export initiated!');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getUserStatusBadge = (user) => {
    if (!user.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <UserX className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
    if (!user.is_verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Unverified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-800',
      moderator: 'bg-blue-100 text-blue-800',
      student: 'bg-gray-100 text-gray-800'
    };

    const roleIcons = {
      admin: Shield,
      moderator: ShieldCheck,
      student: Users
    };

    const Icon = roleIcons[role] || Users;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColors[role] || roleColors.student}`}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleExportUsers}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{totalUsers}</h3>
              <p className="text-sm text-gray-500">Total Users</p>
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
                {users.filter(u => u.is_active && u.is_verified).length}
              </h3>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.role === 'admin' || u.role === 'moderator').length}
              </h3>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {users.filter(u => !u.is_verified).length}
              </h3>
              <p className="text-sm text-gray-500">Unverified</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or username..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="student">Student</option>
            </Select>
            <Select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            >
              <option value="created_at">Created Date</option>
              <option value="username">Username</option>
              <option value="email">Email</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('activate')}
              >
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleBulkAction('delete')}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loading />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.first_name || user.email}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalHeader onClose={() => setShowDeleteModal(false)}>
          <ModalTitle>Delete User</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <p>Are you sure you want to delete this user? This action cannot be undone.</p>
          {editingUser && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="font-medium">{editingUser.full_name || editingUser.username}</div>
              <div className="text-sm text-gray-500">{editingUser.email}</div>
            </div>
          )}
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteUser(editingUser?.id)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete User
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={() => {
        setShowEditModal(false);
        setEditingUser(null);
      }}>
        <ModalHeader onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}>
          <ModalTitle>Edit User</ModalTitle>
        </ModalHeader>
        <ModalContent>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setShowEditModal(false);
                setEditingUser(null);
              }}
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

// Edit User Form Component
const EditUserForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    is_active: user.is_active || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">User Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <span className="ml-2 text-gray-600">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}` 
                : user.email
              }
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-600">{user.email}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Role:</span>
            <span className="ml-2 text-gray-600 capitalize">{user.role}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Joined:</span>
            <span className="ml-2 text-gray-600">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Account Status Control */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <div className="flex-1">
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 cursor-pointer">
                Active Account
              </label>
              <p className="text-sm text-gray-500 mt-1">
                {formData.is_active 
                  ? "User can log in and access the system"
                  : "User account is disabled and cannot log in"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Status Warning */}
        <div className={`p-3 rounded-md ${
          formData.is_active 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {formData.is_active ? (
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
            )}
            <p className={`text-sm ${
              formData.is_active ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {formData.is_active 
                ? "This user will be able to log in and use all system features."
                : "This user will be locked out and unable to log in until reactivated."
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className={formData.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
        >
          {isSubmitting 
            ? 'Updating...' 
            : (formData.is_active ? 'Activate Account' : 'Deactivate Account')
          }
        </Button>
      </div>
    </form>
  );
};

export default UserManagement;
