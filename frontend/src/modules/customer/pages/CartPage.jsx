// src/modules/customer/pages/CartPage.jsx
import React, { useContext } from 'react';
import { Link } from 'react-router-dom'; // For "Proceed to Checkout"
import { CartContext } from '../../../context/CartContext.jsx'; // Adjust path
import { AuthContext } from '../../../context/AuthContext.jsx'; // For checking auth

const CartPage = () => {
    const { cart, loadingCart, cartError, removeItemFromCart, updateItemQuantity } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);

    if (!isAuthenticated) {
        return <div className="text-center p-10"><p>Please <Link to="/login" className="text-indigo-600 hover:underline">login</Link> to view your cart.</p></div>;
    }
    if (loadingCart) return <div className="text-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div><p className="mt-3">Loading your cart...</p></div>;
    if (cartError) return <div className="text-center p-10 text-red-600">Error loading cart: {cartError}</div>;
    if (!cart || !cart.items) return <div className="text-center p-10">Cart not available.</div>;
    
    const total = cart.items.reduce((sum, item) => sum + parseFloat(item.menu_item_details.price) * item.quantity, 0);

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-xl rounded-lg mt-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6">Your Shopping Cart</h2>
            {cart.items.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-600 text-lg mb-4">Your cart is empty.</p>
                    <Link to="/" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {cart.items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-4 mb-4">
                            <div className="flex items-center mb-3 sm:mb-0 flex-grow">
                                {item.menu_item_details.image && 
                                    <img src={item.menu_item_details.image} alt={item.menu_item_details.name} className="w-20 h-20 object-cover rounded-md mr-4"/>
                                }
                                <div className="flex-grow">
                                    <h3 className="text-lg font-medium text-gray-900">{item.menu_item_details.name}</h3>
                                    <p className="text-sm text-gray-500">€{parseFloat(item.menu_item_details.price).toFixed(2)} each</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:ml-4 self-start sm:self-center">
                                <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="px-2 py-1 border rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">-</button>
                                <span className="px-3 py-1 border-t border-b text-sm w-10 text-center">{item.quantity}</span>
                                <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className="px-2 py-1 border rounded-md text-sm hover:bg-gray-100">+</button>
                                <button onClick={() => removeItemFromCart(item.id)} className="text-red-500 hover:text-red-700 text-sm ml-2 px-2 py-1 rounded-md hover:bg-red-50">Remove</button>
                            </div>
                            <p className="text-lg font-semibold text-gray-800 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto text-right sm:text-left">
                                €{(parseFloat(item.menu_item_details.price) * item.quantity).toFixed(2)}
                            </p>
                        </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900">Subtotal:</h3>
                        <p className="text-xl font-semibold text-gray-900">€{total.toFixed(2)}</p>
                    </div>
                    <Link 
                        to="/checkout" // TODO: Create CheckoutPage
                        className="mt-6 w-full block text-center bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        Proceed to Checkout
                    </Link>
                </div>
            )}
        </div>
    );
};
export default CartPage;