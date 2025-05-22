// src/modules/customer/pages/OrderConfirmationPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import HeroIcon from '../../../components/HeroIcon.jsx'; // Add this import


const OrderConfirmationPage = () => {
    const { orderId } = useParams(); // Get orderId from URL
    // const location = useLocation();
    // const orderDetails = location.state?.orderDetails; // If order details were passed via navigation state

    if (!orderId) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-lg mx-auto">
                     {/* Add an error icon */}
                    <h1 className="text-3xl font-bold text-red-600 mb-3">Order Error!</h1>
                    <p className="text-gray-600 mb-6">No order ID found. Something went wrong with your order placement.</p>
                    <Link to="/cart" className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        Back to Cart
                    </Link>
                </div>
            </div>
        );
    }

    // TODO: Optionally, fetch order details again using API call with orderId
    // For now, just display the ID and a generic message.

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl max-w-lg mx-auto text-center">
                <HeroIcon name="check-circle" className="w-16 h-16 text-green-500 mx-auto mb-6" /> {/* Replace here */}
                <h1 className="text-3xl font-bold text-gray-800 mb-3">Thank You for Your Order!</h1>
                <p className="text-gray-600 mb-2">Your order has been placed successfully.</p>
                <p className="text-lg text-gray-700 font-semibold mb-6">Order ID: <span className="text-indigo-600">{orderId}</span></p>
                <p className="text-sm text-gray-500 mb-6">You will receive an email confirmation shortly. Estimated delivery time is approximately 30-45 minutes.</p>
                <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
                    <Link 
                        to="/my-orders" // Link to My Orders page
                        className="w-full sm:w-auto block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        View My Orders
                    </Link>
                    <Link 
                        to="/" // Link to Home/Restaurant List
                        className="w-full sm:w-auto block px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default OrderConfirmationPage;