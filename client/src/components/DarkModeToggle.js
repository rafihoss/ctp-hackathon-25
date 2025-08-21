import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

const DarkModeToggle = ({ isDark, onToggle }) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
      <button
        onClick={onToggle}
        className="relative group bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transform hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="relative">
          {isDark ? (
            <Moon className="h-6 w-6 text-yellow-500 animate-pulse" />
          ) : (
            <Sun className="h-6 w-6 text-orange-500 animate-pulse" />
          )}
          <Sparkles className="h-3 w-3 text-purple-500 absolute -top-1 -right-1 animate-bounce" />
        </div>
        
        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-active:opacity-30 transition-opacity duration-150"></div>
      </button>
    </div>
  );
};

export default DarkModeToggle;
