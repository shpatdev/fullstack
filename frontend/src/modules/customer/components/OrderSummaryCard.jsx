// src/modules/customer/components/OrderSummaryCard.jsx
import React from 'react';

const OrderSummaryCard = ({ cart }) => {
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Order Summary</h3>
                <p className="text-gray-500">Your cart is empty.</p>
            </div>
        );
    }

    // Ensure item.menu_item_details and item.menu_item_details.price exist and are numbers
    const subtotal = cart.items.reduce((sum, item) => {
        const price = parseFloat(item.menu_item_details?.price || 0);
        const quantity = item.quantity || 0;
        return sum + price * quantity;
    }, 0);
    
    // Example delivery fee - this should ideally come from backend or be calculated based on rules
    const deliveryFee = 5.00; 
    const total = subtotal + deliveryFee;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto"> {/* Added max-height and overflow */}
                {cart.items.map(item => (
                    <div key={item.id || item.menu_item} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate pr-2 flex-1">
                            {item.menu_item_details?.name || 'Unknown Item'} x {item.quantity || 0}
                        </span>
                        <span className="text-gray-800 whitespace-nowrap">
                            €{(parseFloat(item.menu_item_details?.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
            <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800 font-medium">€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Est. Delivery Fee</span>
                    <span className="text-gray-800 font-medium">€{deliveryFee.toFixed(2)}</span>
                </div>
                {/* You can add taxes or other fees here */}
                <div className="flex justify-between text-lg font-semibold mt-3 pt-3 border-t">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">€{total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};
export default OrderSummaryCard;