import React from 'react';
import { Switch } from '@headlessui/react';

const Toggle = ({ 
  checked = false, 
  onChange, 
  disabled = false, 
  size = 'medium',
  label,
  description,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-4 w-7',
    medium: 'h-5 w-9',
    large: 'h-6 w-11'
  };

  const thumbSizeClasses = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4', 
    large: 'h-5 w-5'
  };

  const translateClasses = {
    small: checked ? 'translate-x-3' : 'translate-x-0.5',
    medium: checked ? 'translate-x-4' : 'translate-x-0.5',
    large: checked ? 'translate-x-5' : 'translate-x-0.5'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {label && (
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{label}</div>
          {description && (
            <div className="text-sm text-gray-500">{description}</div>
          )}
        </div>
      )}
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
      >
        <span className="sr-only">Toggle setting</span>
        <span
          className={`
            ${thumbSizeClasses[size]}
            ${translateClasses[size]}
            bg-white rounded-full shadow-lg transform transition-transform duration-200 ease-in-out
          `}
        />
      </Switch>
    </div>
  );
};

export default Toggle;
