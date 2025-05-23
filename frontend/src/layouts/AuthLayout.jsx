// src/layouts/AuthLayout.jsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline'; // Shembull për logo

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100 dark:from-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md"> {/* Kufizon gjerësinë e përmbajtjes së autentikimit */}
        <div className="mx-auto flex flex-col items-center justify-center mb-6 sm:mb-8">
          <Link to="/" className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:opacity-80 transition-opacity">
            <SparklesIcon className="h-10 w-auto sm:h-12" /> 
            <span className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">FoodDash</span>
          </Link>
          {/* Mund të shtosh një tagline këtu nëse dëshiron */}
        </div>
        
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 md:p-10">
          <Outlet /> {/* LoginPage, RegisterPage, etj., do të renderizohen këtu */}
        </div>

        <p className="mt-8 text-center text-xs text-gray-500 dark:text-slate-400">
          © {new Date().getFullYear()} FoodDash. Të gjitha të drejtat e rezervuara.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;