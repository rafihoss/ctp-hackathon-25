import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8", 
    large: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in-up">
      <div className="relative">
        {/* Main spinning brain */}
        <div className={`${sizeClasses[size]} animate-spin`}>
          <Brain className="h-full w-full text-purple-600" />
        </div>
        
        {/* Floating sparkles */}
        <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
        <Sparkles className="h-3 w-3 text-blue-500 absolute -bottom-1 -left-1 animate-bounce" style={{animationDelay: '0.5s'}} />
        <Sparkles className="h-2 w-2 text-green-500 absolute top-1/2 -right-2 animate-bounce" style={{animationDelay: '1s'}} />
      </div>
      
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium animate-pulse">
          {message}
        </p>
      )}
      
      {/* Animated dots */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
