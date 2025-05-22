// src/modules/customer/pages/MyOrdersPage.jsx
import React, { useState, useEffect } from 'react'; // useContext removed
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx'; // Changed import
import { customerApi } from '../../../api/customerApi.js';
import OrderHistoryItem from '../components/OrderHistoryItem.jsx';

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState(null);
    const { isAuthenticated, token } = useAuth(); // Changed usage

    useEffect(() => {
        const loadOrders = async () => {
            if (!isAuthenticated || !token) {
                 setLoadingOrders(false); 
                 setOrdersError("Please login to view your orders.");
                 setOrders([]); // Clear any previous orders
                 return;
            }
            setLoadingOrders(true); setOrdersError(null);
            try {
                const data = await customerApi.fetchUserOrders(); // API call already uses token via apiService
                setOrders(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))); // Sort newest first
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setOrdersError(err.message || "Could not load your orders.");
            } finally {
                setLoadingOrders(false);
            }
        };
        loadOrders();
    }, [isAuthenticated, token]); // Re-fetch if auth state or token changes

    if (loadingOrders) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div><p className="ml-4 text-lg text-gray-700">Loading Your Orders...</p></div>;
    if (ordersError) return <div className="text-center p-10"><p className="text-red-500">{ordersError}</p>{!isAuthenticated && <Link to="/login" className="mt-4 text-indigo-600 hover:underline">Login here</Link>}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>
            {orders.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-gray-600 text-xl mb-4">You haven't placed any orders yet.</p>
                    <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <OrderHistoryItem key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
};
export default MyOrdersPage;