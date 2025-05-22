// src/layouts/AuthLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* You can add a logo here if you want */}
      {/* <FoodDashLogo /> */}
      <Outlet />
    </div>
  );
};

export default AuthLayout;