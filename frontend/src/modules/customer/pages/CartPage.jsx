// src/modules/customer/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button.jsx';
import { ShoppingCartIcon, TrashIcon, BuildingStorefrontIcon, InformationCircleIcon, MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { customerApi } from '../../../api/customerApi.js'; // For fetching restaurant details

const CartPage = () => {
  const {
    cart, // cart is an object: { items: [], total_amount: ..., ... }
    removeCartItem, // Correct name from context
    updateCartItemQuantity, // Correct name from context
    clearCart,
    getCartTotalAmount, // Correct name from context
    getRestaurantIdFromCart,
    fetchCart, // Added to potentially re-fetch cart if needed
  } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  
  const cartRestaurantId = getRestaurantIdFromCart();

  useEffect(() => {
    const fetchRestaurantName = async () => {
      if (cartRestaurantId) {
        setIsLoadingRestaurant(true);
        try {
          const details = await customerApi.fetchRestaurantById(cartRestaurantId);
          setRestaurantDetails(details);
        } catch (error) {
          console.error("CartPage: Failed to fetch restaurant details for cart:", error);
          // Potentially show a notification to the user
        } finally {
          setIsLoadingRestaurant(false);
        }
      } else {
        setRestaurantDetails(null);
      }
    };

    fetchRestaurantName();
  }, [cartRestaurantId]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: { pathname: '/customer/checkout' } } });
    } else {
      navigate('/customer/checkout');
    }
  };

  // Main change here: check cart.items
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto py-8 text-center">
        <ShoppingCartIcon className="h-24 w-24 text-gray-300 dark:text-slate-600 mx-auto mb-6" />
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-3">Shporta juaj është bosh</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6">Shtoni artikuj nga restorantet për të vazhduar.</p>
        <Button onClick={() => navigate('/customer/restaurants')} variant="primary" size="lg" iconLeft={BuildingStorefrontIcon}>
          Shfleto Restorantet
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Cart Items Section */}
        <div className="lg:w-2/3">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-white">Shporta Juaj</h1>
            {/* Also here, check cart.items.length */}
            {cart.items && cart.items.length > 0 && (
              <Button onClick={clearCart} variant="outline" size="sm" iconLeft={TrashIcon} className="text-red-500 border-red-500 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-500/10">
                Pastro Shportën
              </Button>
            )}
          </div>

          {isLoadingRestaurant && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">Duke ngarkuar detajet e restorantit...</p>
            </div>
          )}

          {restaurantDetails && (
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-800/30 rounded-lg border border-primary-200 dark:border-primary-700">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom" />
                Ju po porosisni nga: <Link to={`/customer/restaurants/${restaurantDetails.id}`} className="font-semibold hover:underline">{restaurantDetails.name}</Link>.
                Për të porositur nga një restorant tjetër, ju lutem pastroni shportën aktuale.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* AND HERE: use cart.items.map */}
            {cart.items.map(item => (
              // item here is an object from cart.items array
              // It should have: id (of CartItem), quantity, menu_item (ID of MenuItem),
              // and menu_item_details (the full MenuItemSerializer object)
              <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img 
                  src={item.menu_item_details?.image || `https://placehold.co/100x100/eee/ccc?text=${item.menu_item_details?.name?.[0] || 'P'}`} 
                  alt={item.menu_item_details?.name || 'Artikull'} 
                  className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-grow">
                  <h3 className="text-md sm:text-lg font-medium text-gray-800 dark:text-slate-100">{item.menu_item_details?.name || 'Artikull i Panjohur'}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Çmimi: {parseFloat(item.menu_item_details?.price || 0).toFixed(2)} €</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 my-2 sm:my-0 flex-shrink-0">
                  <Button 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)} 
                    disabled={item.quantity <= 1}
                    variant="ghost" 
                    size="icon" 
                    aria-label="Redukto sasinë"
                    className="p-1.5"
                  >
                    <MinusCircleIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  </Button>
                  <span className="text-md font-medium text-gray-700 dark:text-slate-200 w-8 text-center">{item.quantity}</span>
                  <Button 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)} 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Shto sasinë"
                    className="p-1.5"
                  >
                    <PlusCircleIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  </Button>
                </div>
                <p className="text-md sm:text-lg font-semibold text-gray-800 dark:text-slate-100 w-full sm:w-auto text-right sm:text-left">
                  {/* Subtotal for this item is calculated from menu_item_details.price */}
                  {(parseFloat(item.menu_item_details?.price || 0) * item.quantity).toFixed(2)} €
                </p>
                <Button 
                  onClick={() => removeCartItem(item.id)} // Note: item.id here is the ID of CartItem
                  variant="ghost" 
                  size="icon" 
                  aria-label="Hiqe artikullin"
                  className="text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 p-1.5"
                >
                  <TrashIcon className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="lg:w-1/3">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-lg shadow-lg sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-3 dark:border-slate-700">Përmbledhja e Porosisë</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Nëntotali:</span>
                {/* Use getCartTotalAmount() directly */}
                <span>{getCartTotalAmount().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Tarifa e Dërgesës:</span>
                {/* This should come from restaurantDetails */}
                <span>{(restaurantDetails?.delivery_fee_placeholder || restaurantDetails?.delivery_fee || 0.00).toFixed(2)} €</span>
              </div>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white pt-3 border-t dark:border-slate-700">
              <span>Totali:</span>
              <span>{(getCartTotalAmount() + (restaurantDetails?.delivery_fee_placeholder || restaurantDetails?.delivery_fee || 0.00)).toFixed(2)} €</span>
            </div>
            <Button onClick={handleCheckout} fullWidth size="lg" className="mt-6" disabled={isLoadingRestaurant}>
              {isLoadingRestaurant ? 'Duke pritur detajet...' : 'Vazhdo te Pagesa'}
            </Button>
            <Link to="/customer/restaurants" className="block text-center mt-4 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Vazhdo Blerjen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;