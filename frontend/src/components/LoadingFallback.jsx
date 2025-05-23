// src/components/LoadingFallback.jsx
import React from 'react';

const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary-500"></div>
    <p className="ml-4 text-lg text-gray-700 dark:text-gray-300">Duke ngarkuar...</p>
  </div>
);

export default LoadingFallback;