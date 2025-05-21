import React, { useEffect, useState, useContext } from 'react';
import './MyOrders.css'; // You'll need to create this CSS file
import { useAuth } from '../../UserContextProvider'; // If needed for auth check, though api instance handles it
import api from '../../api'; // Use your configured api instance

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const { user } = useAuth(); // Not strictly necessary if api instance handles auth

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await api.get('/orders/'); // Backend should filter by user
                setOrders(response.data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setError(err.response?.data?.detail || "Could not fetch orders.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []); // Empty dependency array means this runs once on mount

    if (loading) {
        return <div className='my-orders'><p>Loading your orders...</p></div>;
    }

    if (error) {
        return <div className='my-orders'><p style={{color: 'red'}}>{error}</p></div>;
    }

    return (
        <div className='my-orders'>
            <h2>My Orders</h2>
            {orders.length === 0 ? (
                <p>You have no orders yet.</p>
            ) : (
                <div className="orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <h3>Order ID: {order.id}</h3>
                            <p><strong>Restaurant:</strong> {order.restaurant_details?.name || 'N/A'}</p>
                            <p><strong>Status:</strong> {order.status}</p>
                            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> ${parseFloat(order.final_amount).toFixed(2)}</p>
                            <h4>Items:</h4>
                            <ul>
                                {order.items.map(item => (
                                    <li key={item.id}>
                                        {item.quantity} x {item.menu_item_details?.name || 'Unknown Item'}
                                        - ${parseFloat(item.price_at_purchase).toFixed(2)} each
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrders;