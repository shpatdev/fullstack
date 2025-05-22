// src/modules/customer/pages/ProfilePage.jsx
import React from 'react';
import { useAuth } from '../../../context/AuthContext.jsx'; // Changed import

const ProfilePage = () => {
    const { user, loadingAuth } = useAuth(); // Changed usage

    if (loadingAuth) return <div className="text-center p-10">Loading profile...</div>;
    if (!user) return <div className="text-center p-10">User not found. Please login.</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Profile</h2>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Username</p>
                    <p className="text-lg text-gray-900">{user.username}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="text-lg text-gray-900">{user.name || 'Not provided'}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-lg text-gray-900">{user.email}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Role</p>
                    <p className="text-lg text-gray-900">{user.role}</p>
                </div>
                {/* TODO: Add address management, order history links, etc. */}
                <button className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Edit Profile (Not Implemented)
                </button>
            </div>
        </div>
    );
};
export default ProfilePage;