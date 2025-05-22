// src/modules/restaurant/pages/Overview.jsx
import React, { useState, useEffect } from 'react'; // useContext removed
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx'; // AuthContext import removed, useAuth is correct
import { restaurantApi } from '../../../api/restaurantApi.js';

const Overview = () => {
    const { currentRestaurant, token } = useAuth();
    const [data, setData] = useState({ orders: 0, revenue: 0, pending: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentRestaurant?.id || !token) { 
                setLoading(false); 
                // setData({ orders: 0, revenue: 0, pending: 0 }); // Reset data if no restaurant/token
                return; 
            }
            setLoading(true);
            try {
                const orders = await restaurantApi.fetchRestaurantOrders(currentRestaurant.id, token);
                const todaysOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
                const pendingOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status.toUpperCase()));
                const todaysRevenue = todaysOrders.filter(o => o.status.toUpperCase() === 'DELIVERED').reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
                setData({ orders: todaysOrders.length, revenue: todaysRevenue, pending: pendingOrders.length });
            } catch (error) { 
                console.error("Failed to fetch overview data:", error); 
                setData({ orders: 0, revenue: 0, pending: 0 }); // Reset on error
            } 
            finally { setLoading(false); }
        };
        fetchData();
    }, [currentRestaurant, token]);

    if (loading) return <div className="p-6 flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    
    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview: {currentRestaurant?.name || ''}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg"><h4 className="text-sm font-medium text-gray-500">Today's Orders</h4><p className="text-3xl font-bold text-gray-800">{data.orders}</p></div>
                <div className="bg-white p-6 rounded-xl shadow-lg"><h4 className="text-sm font-medium text-gray-500">Today's Revenue</h4><p className="text-3xl font-bold text-gray-800">€{data.revenue.toFixed(2)}</p></div>
                <div className="bg-white p-6 rounded-xl shadow-lg"><h4 className="text-sm font-medium text-gray-500">Pending Orders</h4><p className="text-3xl font-bold text-orange-500">{data.pending}</p></div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg"> 
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Sales Trend (Last 7 Days)</h3> 
                <img src="https://placehold.co/800x300/007bff/e7f3ff?text=Sales+Chart+Placeholder" alt="Sales Chart" className="w-full rounded-md" /> 
            </div>
        </div>
    );
};
export default Overview;