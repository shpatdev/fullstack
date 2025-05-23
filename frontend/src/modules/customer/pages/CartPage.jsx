// src/modules/customer/pages/CartPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext.jsx';
import Button from '../../../components/Button.jsx';
import { ShoppingCartIcon, TrashIcon, PlusCircleIcon, BuildingStorefrontIcon, MinusCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { customerApi } from '../../../api/customerApi.js'; // For fetching restaurant details if needed
import { useAuth } from '../../../context/AuthContext.jsx';

const CartPage = () => {
  const { 
    cart, 
    removeItemFromCart, 
    updateItemQuantity, 
    clearCart, 
    getCartTotal, 
    getRestaurantIdFromCart 
  } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const cartRestaurantId = getRestaurantIdFromCart();

  useEffect(() => {
    if (cartRestaurantId) {
      customerApi.fetchRestaurantDetails(cartRestaurantId)
        .then(data => setRestaurantDetails(data))
        .catch(err => console.error("Failed to fetch restaurant details for cart:", err));
    } else {
      setRestaurantDetails(null);
    }
  }, [cartRestaurantId]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
        navigate('/login', { state: { from: { pathname: '/customer/checkout' } } });
    } else {
        navigate('/customer/checkout');
    }
  };

  if (cart.length === 0) {
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
            {cart.length > 0 && (
              <Button onClick={clearCart} variant="outline" size="sm" iconLeft={TrashIcon} className="text-red-500 border-red-500 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-500/10">
                Pastro Shportën
              </Button>
            )}
          </div>

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
            {cart.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img 
                  src={item.image_url || '/placeholder-food-item.jpg'} 
                  alt={item.name} 
                  className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="flex-grow">
                  <h3 className="text-md sm:text-lg font-medium text-gray-800 dark:text-slate-100">{item.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Çmimi: {parseFloat(item.price).toFixed(2)} €</p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 my-2 sm:my-0 flex-shrink-0">
                  <Button 
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)} 
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
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)} 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Shto sasinë"
                    className="p-1.5"
                  >
                    <PlusCircleIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" />
                  </Button>
                </div>
                <p className="text-md sm:text-lg font-semibold text-gray-800 dark:text-slate-100 w-full sm:w-auto text-right sm:text-left">
                  {(parseFloat(item.price) * item.quantity).toFixed(2)} €
                </p>
                <Button 
                  onClick={() => removeItemFromCart(item.id)} 
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
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-lg shadow-lg sticky top-24"> {/* sticky top to account for header */}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 border-b pb-3 dark:border-slate-700">Përmbledhja e Porosisë</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Nëntotali:</span>
                <span>{getCartTotal().toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Tarifa e Dërgesës:</span>
                <span>{(restaurantDetails?.delivery_fee || 0).toFixed(2)} €</span> {/* Placeholder, calculate properly */}
              </div>
              {/* Add discounts or other fees here if applicable */}
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white pt-3 border-t dark:border-slate-700">
              <span>Totali:</span>
              <span>{(getCartTotal() + (restaurantDetails?.delivery_fee || 0)).toFixed(2)} €</span>
            </div>
            <Button onClick={handleCheckout} fullWidth size="lg" className="mt-6">
              Vazhdo te Pagesa
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