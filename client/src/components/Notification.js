import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  title, 
  message, 
  isVisible, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-down">
      <div className={`max-w-sm w-full rounded-2xl shadow-2xl border-2 p-6 ${getStyles()} relative overflow-hidden`}>
        {/* Background sparkles */}
        <div className="absolute top-2 right-2 opacity-20">
          <Sparkles className="h-4 w-4 text-purple-500 animate-bounce" />
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
        
        {/* Content */}
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 animate-pulse">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {title}
              </h3>
            )}
            {message && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse">
            <div 
              className="h-full bg-white opacity-30 transition-all duration-300 ease-linear"
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
