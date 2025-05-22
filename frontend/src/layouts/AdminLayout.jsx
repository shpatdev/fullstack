// src/layouts/AdminLayout.jsx
import React, { useContext } from 'react'; // Keep if useAuth implies useContext, else remove
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminHeader from '../modules/admin/components/AdminHeader.jsx';
import AdminSidebar from '../modules/admin/components/AdminSidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const AdminLayout = () => {
    const { logout } = useAuth(); // isAuthenticated and user checks are done by ProtectedRoute
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        // Navigate to a general login or specific admin login if you have one.
        // Since ProtectedRoute will kick unauth users from /admin/* to /login (or similar),
        // this might be optional or target a specific public page.
        navigate('/login');
    };

    const getCurrentView = (pathname) => {
        if (pathname.startsWith('/admin/users')) return 'users';
        if (pathname.startsWith('/admin/restaurants')) return 'restaurants';
        if (pathname.startsWith('/admin/orders')) return 'orders';
        if (pathname.startsWith('/admin/settings')) return 'settings';
        return 'overview';
    };
    const currentView = getCurrentView(location.pathname);

    // The if (!isAuthenticated || user?.role !== 'ADMIN') block with useEffect is REMOVED.
    // ProtectedRoute in AppRoutes.jsx handles this.

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <AdminHeader />
            <div className="flex flex-1">
                <AdminSidebar
                    currentView={currentView}
                    handleLogout={handleLogout}
                />
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
export default AdminLayout;