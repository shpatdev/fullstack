// filepath: frontend/src/modules/customer/pages/CheckoutPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../../context/CartContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { customerApi } from '../../../api/customerApi.js';
import AddressForm from '../components/AddressForm.jsx';
import OrderSummaryCard from '../components/OrderSummaryCard.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx'; // Added import

// Removed inline PlusIcon definition as it's now in HeroIcon.jsx

const CheckoutPage = () => {
    const { cart, loadingCart, cartError, clearCart } = useCart();
    const { user, token, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderError, setOrderError] = useState('');

    useEffect(() => {
        if (!isAuthenticated && !loadingCart) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }
        const loadAddresses = async () => {
            if(!isAuthenticated || !token) return;

            setLoadingAddresses(true);
            try {
                const data = await customerApi.fetchUserAddresses();
                setAddresses(data);
                const defaultAddress = data.find(addr => addr.is_default_shipping);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress.id);
                } else if (data.length > 0) {
                    setSelectedAddressId(data[0].id);
                } else {
                    setShowAddressForm(true);
                }
            } catch (err) {
                console.error("Failed to fetch addresses:", err);
                setOrderError("Could not load your addresses. " + err.message);
            } finally {
                setLoadingAddresses(false);
            }
        };
        if (isAuthenticated) {
            loadAddresses();
        } else if (!isAuthenticated && !loadingCart){
             setLoadingAddresses(false);
        }
    }, [isAuthenticated, token, navigate, loadingCart]);

    const handleAddressSubmit = async (addressData) => {
        setPlacingOrder(true); // Consider separate loading state for address form
        try {
            const newAddress = await customerApi.createUserAddress(addressData);
            setAddresses(prev => {
                const isEditing = prev.some(a => a.id === newAddress.id);
                let updatedAddresses;
                if (isEditing) {
                    updatedAddresses = prev.map(a => a.id === newAddress.id ? newAddress : a);
                } else {
                    updatedAddresses = [...prev, newAddress];
                }
                if (newAddress.is_default_shipping) {
                    updatedAddresses = updatedAddresses.map(a => 
                        a.id === newAddress.id ? a : {...a, is_default_shipping: false}
                    );
                }
                return updatedAddresses;
            });
            setSelectedAddressId(newAddress.id);
            setShowAddressForm(false);
            setEditingAddress(null);
            // Use NotificationContext for "Address saved successfully!"
        } catch (err) {
            console.error("Failed to save address:", err);
            setOrderError(err.message || "Failed to save address.");
        } finally {
            setPlacingOrder(false);
        }
    };
    
    const handlePlaceOrder = async () => {
        // ...(previous robust logic for handlePlaceOrder)...
        if (!selectedAddressId) { setOrderError("Please select or add a delivery address."); return; }
        if (!cart || !cart.items || cart.items.length === 0) { setOrderError("Your cart is empty."); return; }
        
        let restaurantIdForOrder = null;
        if (cart.items.length > 0) {
            const firstItem = cart.items[0];
            restaurantIdForOrder = firstItem.menu_item_details?.restaurant_id_placeholder || 
                                   firstItem.restaurantId || 
                                   firstItem.menu_item_details?.menu?.restaurant || 
                                   firstItem.menu_item_details?.category?.restaurant;

            if (!restaurantIdForOrder && firstItem.menu_item_details?.menu) {
                 // Fallback or error, ideally menu_item_details should contain restaurant info directly or via one level of nesting
                 console.warn("Restaurant ID might be missing, direct relation for restaurantId is preferred on menu_item_details.");
            }

            if (!restaurantIdForOrder) {
                console.error("Could not determine restaurant ID for order from cart items:", firstItem.menu_item_details);
                setOrderError("Could not determine restaurant for the order. Cart item data might be incomplete or restaurant ID missing.");
                return;
            }
        } else {
            setOrderError("Cart is empty.");
            return;
        }

        setPlacingOrder(true); setOrderError('');
        try {
            const selectedAddr = addresses.find(a => a.id === selectedAddressId);
            if (!selectedAddr) {
                setOrderError("Selected address not found. Please re-select or add an address.");
                setPlacingOrder(false);
                return;
            }
            const orderData = {
                restaurant: restaurantIdForOrder, 
                delivery_address_street: selectedAddr.street,
                delivery_address_city: selectedAddr.city,
                delivery_address_zip_code: selectedAddr.zip_code,
                delivery_address_country: selectedAddr.country,
                items: cart.items.map(item => ({ 
                    menu_item: item.menu_item || item.menu_item_details?.id,
                    quantity: item.quantity,
                }))
            };
            const createdOrder = await customerApi.createOrder(orderData);
            await clearCart(); 
            navigate(`/order-confirmation/${createdOrder.id}`);
        } catch (err) {
            console.error("Failed to place order:", err);
            setOrderError(err.message || "Could not place your order. Please try again.");
        } finally {
            setPlacingOrder(false);
        }
    };

    if (loadingAddresses && !cartError && isAuthenticated) return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div><p className="ml-4 text-lg text-gray-700">Loading Checkout...</p></div>;
    if (cartError && (!cart || cart.items.length === 0)) return <div className="text-center p-10"><p className="text-red-500">{cartError}</p><Link to="/" className="text-indigo-600 hover:underline">Go Shopping</Link></div>;
    if ((!cart || cart.items.length === 0) && !loadingCart && !loadingAddresses && isAuthenticated) return <div className="text-center p-10"><p>Your cart is empty. Add items to proceed.</p><Link to="/" className="text-indigo-600 hover:underline">Shop Now</Link></div>;
    if (!isAuthenticated && !loadingCart && !loadingAddresses) return <div className="text-center p-10"><p>Please login to proceed to checkout.</p><Link to="/login" className="text-indigo-600 hover:underline">Login</Link></div>;


    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Address</h2>
                        {addresses.length > 0 && !showAddressForm && (
                            <div className="space-y-3 mb-4">
                                {addresses.map(addr => (
                                    <label key={addr.id} className={`flex items-center p-3 border rounded-lg cursor-pointer hover:border-indigo-500 transition-all ${selectedAddressId === addr.id ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-gray-300'}`}>
                                        <input type="radio" name="address" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => {setSelectedAddressId(addr.id); setOrderError('');}} className="form-radio h-5 w-5 text-indigo-600 focus:ring-indigo-500"/>
                                        <div className="ml-3 text-sm">
                                            <p className="font-medium text-gray-900">{addr.street}</p>
                                            <p className="text-gray-600">{addr.city}, {addr.zip_code}, {addr.country}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                         <button onClick={() => { setShowAddressForm(prev => !prev); setEditingAddress(null); }} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
                           <HeroIcon name="plus" className="w-4 h-4 mr-1" /> 
                           {showAddressForm ? 'Cancel Adding Address' : (addresses.length > 0 ? 'Add New Address' : 'Add Delivery Address')}
                        </button>
                        {showAddressForm && (
                            <div className="mt-4">
                                <AddressForm 
                                    onSubmit={handleAddressSubmit} 
                                    onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }} 
                                    initialData={editingAddress || {is_default_shipping: addresses.length === 0}}
                                    isLoading={placingOrder}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
                        <div className="p-4 border border-blue-200 bg-blue-50 rounded-md">
                            <p className="text-gray-700">Currently supporting <span className="font-semibold text-blue-600">Cash on Delivery</span> only.</p>
                            <p className="text-xs text-gray-500 mt-1">More payment options coming soon!</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white p-6 rounded-lg shadow-md">
                        <OrderSummaryCard cart={cart} />
                        {orderError && <p className="text-red-500 text-sm mt-4 text-center bg-red-50 p-2 rounded">{orderError}</p>}
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={placingOrder || !selectedAddressId || !cart || cart.items.length === 0}
                            className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {placingOrder ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;