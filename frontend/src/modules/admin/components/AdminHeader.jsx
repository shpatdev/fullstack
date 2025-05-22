// src/modules/admin/components/AdminHeader.jsx
import React from 'react';

const AdminHeader = () => { 
    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 6h14M5 10h14M5 14h14M5 18h14"></path>
                        </svg>
                        <span className="ml-3 text-2xl font-bold text-blue-600">FoodDash</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-gray-700">System Admin Dashboard</div>
                        {/* Potentially admin user profile icon/logout here from AuthContext */}
                    </div>
                </div>
            </div>
        </header>
    );
};
export default AdminHeader;