// frontend/src/components/Logo.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline'; // Ose cilado ikonë që dëshiron

const Logo = ({ className = '', textClassName = '', iconClassName = '' }) => {
  return (
    <Link 
      to="/" // Ose path-i kryesor për rolin përkatës
      className={`flex-shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity ${className}`}
    >
      <SparklesIcon className={`h-8 w-auto text-yellow-300 ${iconClassName}`} /> {/* Përshtat madhësinë dhe ngjyrën */}
      <span className={`text-2xl font-bold text-white ${textClassName}`}> {/* Përshtat ngjyrën e tekstit */}
        Food<span className="text-yellow-300">Dash</span>
      </span>
    </Link>
  );
};

export default Logo;