import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';

const ErrorAlert = ({ 
  message, 
  onClose, 
  autoCloseDelay = 5000, // Auto close after 5 seconds by default
  variant = 'default' // Can be 'default' or 'toast'
}) => {
  useEffect(() => {
    if (autoCloseDelay) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  // Handle keyboard events for accessibility
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const baseStyles = "flex items-center justify-between rounded-lg p-4 transition-all";
  const variantStyles = {
    default: "bg-red-900/50 border border-red-500 text-red-200",
    toast: "bg-red-500 text-white shadow-lg"
  };

  return (
    <div 
      role="alert"
      aria-live="assertive"
      className={`${baseStyles} ${variantStyles[variant]}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex items-center space-x-3">
        <XCircle className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">
          {message}
        </span>
      </div>
      
      <button
        onClick={onClose}
        className={`ml-4 rounded-lg p-1 transition-colors ${
          variant === 'default' 
            ? 'hover:bg-red-800/50 text-red-200 hover:text-red-100' 
            : 'hover:bg-red-600 text-white'
        }`}
        aria-label="Close error message"
      >
        <XCircle className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ErrorAlert;