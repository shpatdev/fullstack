// src/modules/admin/pages/AdminOverviewPage.jsx
import React from 'react';

const AdminOverviewPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard Overview</h1>
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <p className="text-gray-700">Welcome to the Admin Panel.</p>
        <p className="mt-2 text-gray-600">
          This is a placeholder for the admin overview content.
          You can add summary statistics, quick links, or other relevant information here.
        </p>
        {/* Example Stats Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-blue-700">Total Users</h2>
            <p className="text-2xl font-bold text-blue-900">0</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-green-700">Total Restaurants</h2>
            <p className="text-2xl font-bold text-green-900">0</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-yellow-700">Pending Approvals</h2>
            <p className="text-2xl font-bold text-yellow-900">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;