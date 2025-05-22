// src/layouts/AdminLayout.jsx
import React, { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminHeader from '../modules/admin/components/AdminHeader.jsx'; // Assuming path
import AdminSidebar from '../modules/admin/components/AdminSidebar.jsx'; // Assuming path
import { useAuth } from '../context/AuthContext.jsx'; // Changed to useAuth, path might vary

const AdminLayout = () => {
    // This state would now be managed by the router by matching paths
    // const [currentView, setCurrentView] = useState('overview'); 
    const { isAuthenticated, user, logout } = useAuth(); // Use global AuthContext
    const navigate = useNavigate();
    const location = useLocation();


    const handleLogout = () => {
        logout();
        navigate('/admin/login'); // Or general login
    };

    // Determine currentView based on location.pathname for Sidebar highlighting
    const getCurrentView = (pathname) => {
        if (pathname.startsWith('/admin/users')) return 'users';
        if (pathname.startsWith('/admin/restaurants')) return 'restaurants';
        if (pathname.startsWith('/admin/orders')) return 'orders';
        if (pathname.startsWith('/admin/settings')) return 'settings';
        return 'overview'; // Default
    };
    const currentView = getCurrentView(location.pathname);


    // Protected Route logic should ideally be in AppRoutes for <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
    // For simplicity here, if AuthContext indicates not an admin, redirect.
    if (!isAuthenticated || user?.role !== 'ADMIN') {
        // Redirect to login or an unauthorized page
        useEffect(() => {
            navigate('/login', {replace: true}); // Or an admin specific login
        }, [navigate]);
        return null; // Or loading
    }


    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <AdminHeader />
            <div className="flex flex-1">
                <AdminSidebar 
                    currentView={currentView} 
                    // setCurrentView will be handled by <Link> or navigate in Sidebar
                    handleLogout={handleLogout} 
                />
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <Outlet /> {/* Child routes will render here */}
                </main>
            </div>
        </div>
    );
};
export default AdminLayout;