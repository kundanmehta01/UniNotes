import React from 'react';
import useAuthStore from '../../stores/authStore';

const AuthDebug = () => {
  const { 
    user, 
    isAuthenticated, 
    accessToken, 
    isAdmin, 
    isModerator, 
    hasPermission 
  } = useAuthStore();

  const checkPermissions = [
    'papers.moderate',
    'analytics.view',
    'admin.dashboard',
    'system.config',
    'audit.logs'
  ];

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="text-lg font-semibold mb-3">Auth Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Has Token:</strong> {accessToken ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>User Role:</strong> {user?.role || 'None'}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || 'None'}
        </div>
        
        <div>
          <strong>User Email:</strong> {user?.email || 'None'}
        </div>
        
        <div>
          <strong>Is Admin:</strong> {isAdmin() ? '✅ Yes' : '❌ No'}
        </div>
        
        <div>
          <strong>Is Moderator:</strong> {isModerator() ? '✅ Yes' : '❌ No'}
        </div>
        
        <div className="pt-2 border-t">
          <strong>Permissions:</strong>
          <div className="pl-2">
            {checkPermissions.map(permission => (
              <div key={permission} className="text-xs">
                {permission}: {hasPermission(permission) ? '✅' : '❌'}
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <strong>Local Storage:</strong>
          <div className="pl-2 text-xs">
            <div>access_token: {localStorage.getItem('access_token') ? 'Present' : 'Missing'}</div>
            <div>refresh_token: {localStorage.getItem('refresh_token') ? 'Present' : 'Missing'}</div>
            <div>user: {localStorage.getItem('user') ? 'Present' : 'Missing'}</div>
          </div>
        </div>
        
        {user && (
          <div className="pt-2 border-t">
            <strong>Full User Object:</strong>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
