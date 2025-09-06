import React, { Fragment } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal Content */}
      <div className={cn(
        'relative w-full max-w-lg mx-auto p-4',
        className
      )}>
        <div className="relative bg-white rounded-lg shadow-lg">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const ModalHeader = ({ children, className, onClose, showCloseButton = true }) => (
  <div className={cn('flex items-center justify-between p-6 pb-4 border-b border-gray-200', className)}>
    <div className="flex-1">
      {children}
    </div>
    {showCloseButton && (
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    )}
  </div>
);

const ModalTitle = ({ children, className }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
    {children}
  </h3>
);

const ModalContent = ({ children, className }) => (
  <div className={cn('p-6', className)}>
    {children}
  </div>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn('flex items-center justify-end space-x-3 p-6 pt-4 border-t border-gray-200', className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter };
