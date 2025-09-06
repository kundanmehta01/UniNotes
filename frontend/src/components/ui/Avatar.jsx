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
  
  return (
    <div className={cn("relative", className)}>
      {showImage ? (
        <img
          src={user.avatar_url}
          alt={user?.full_name || user?.email || 'User avatar'}
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
          {getInitials(user?.full_name || user?.email)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
