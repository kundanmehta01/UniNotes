import React, { useState } from 'react';
import { cn, getInitials } from '../../lib/utils';

const Avatar = ({ 
  user, 
  size = 'md', 
  className = '', 
  showBorder = false,
  fallbackClassName = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-8 h-8',
      text: 'text-sm',
      border: 'border'
    },
    md: {
      container: 'w-12 h-12',
      text: 'text-lg',
      border: 'border-2'
    },
    lg: {
      container: 'w-16 h-16',
      text: 'text-xl',
      border: 'border-2'
    },
    xl: {
      container: 'w-20 h-20',
      text: 'text-2xl',
      border: 'border-2'
    }
  };
  
  const config = sizeConfig[size] || sizeConfig.md;
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Show avatar image if available and no error
  const showImage = user?.avatar_url && !imageError;
  
  // Get user's display name
  const displayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.full_name || user?.email || 'User';
    
  // For initials, prefer email if no names are available
  const initialsSource = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.full_name 
    ? user.full_name
    : user?.email 
    ? user.email.split('@')[0] // Use email username part
    : 'User';
  
  return (
    <div className={cn("relative", className)}>
      {showImage ? (
        <img
          src={user.avatar_url}
          alt={`${displayName} avatar`}
          className={cn(
            config.container,
            "rounded-full object-cover",
            showBorder ? `${config.border} border-gray-200` : ''
          )}
          onError={handleImageError}
        />
      ) : (
        <div 
          className={cn(
            config.container,
            config.text,
            "bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold",
            showBorder ? `${config.border} border-gray-200` : '',
            fallbackClassName
          )}
        >
          {getInitials(initialsSource)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
