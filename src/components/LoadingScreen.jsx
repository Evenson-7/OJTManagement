import React from 'react';

// Re-using the header icon from Auth.jsx for consistency
const InternHeaderIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center ">
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl ">
        {/* Header Icon */}
        
        {/* Spinner */}
        <div 
          className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
        
        {/* Text */}
        <p className="text-gray-700 text-lg font-medium mt-4">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;