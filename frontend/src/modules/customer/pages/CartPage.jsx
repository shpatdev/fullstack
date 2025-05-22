// src/modules/customer/pages/CartPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import Button from '../../../components/Button.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import OrderSummaryCard from '../components/OrderSummaryCard.jsx';
import { useNotification } from '../../../context/NotificationContext.jsx';

const CartPage = () => {
  const { cart, updateCartItemQuantity, removeCartItem, isLoading, error: cartError, clearCart } = useCart(); // Added clearCart
  const { isAuthenticated } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  const handleQuantityChange = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      // Optionally, confirm before removing
      await removeCartItem(itemId);
    } else {
      await updateCartItemQuantity(itemId, newQuantity);
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.items.length === 0) {
        showError("Shporta juaj është bosh. Ju lutem shtoni artikuj.");
        return;
    }
    if (!isAuthenticated) {
      showError("Ju lutem kyçuni ose regjistrohuni për të vazhduar.");
      navigate('/auth/login', { state: { from: { pathname: '/customer/checkout' }, message: "Ju duhet të kyçeni për të vazhduar." } });
    } else {
      navigate('/customer/checkout');
    }
  };

  // Ensure cart and cart.items exist before trying to access length or reduce
  const safeCartItems = cart?.items || [];

  if (isLoading && safeCartItems.length === 0) { // Check safeCartItems
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-300px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-500 mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Duke ngarkuar shportën...</p>
      </div>
    );
  }

  if (cartError) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg shadow-md">
                <HeroIcon icon="ExclamationTriangleIcon" className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Gabim në Shportë</h2>
                <p className="text-red-600 dark:text-red-300">{cartError}</p>
                <Button onClick={() => window.location.reload()} variant="danger" className="mt-6">
                    Provo Rifreskimin e Faqes
                </Button>
            </div>
        </div>
    );
  }
  
  const deliveryFee = safeCartItems.length > 0 ? 2.00 : 0;
  const subtotal = safeCartItems.reduce((sum, item) => {
    const price = parseFloat(item.menu_item_details?.price || 0);
    return sum + price * item.quantity;
  }, 0);
  const total = subtotal + deliveryFee;

  return (
    <div className="container mx-auto px-2 sm:px-0 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Shporta Juaj</h1>
        {safeCartItems.length > 0 && (
            <Button 
                variant="link" 
                onClick={async () => { 
                    // Optionally add confirmation before clearing cart
                    await clearCart(); 
                }} 
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mt-2 sm:mt-0"
                disabled={isLoading}
                iconLeft={<HeroIcon icon="TrashIcon" className="h-4 w-4"/>}
            >
                Pastro Shportën
            </Button>
        )}
      </div>


      {safeCartItems.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg min-h-[350px] flex flex-col justify-center items-center px-4">
          <HeroIcon icon="ShoppingCartIcon" className="h-20 w-20 text-gray-300 dark:text-slate-600 mx-auto mb-6" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-3">Shporta juaj është bosh!</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-md mx-auto">Duket se nuk keni shtuar ende asgjë. Filloni të eksploroni menutë tona të shijshme!</p>
          <Button as={Link} to="/customer/restaurants" variant="primary" size="lg" iconLeft={<HeroIcon icon="BuildingStorefrontIcon" className="h-5 w-5"/>}>
            Shfleto Restorantet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl rounded-xl p-4 sm:p-6 md:p-8">
            <div className="flex justify-between items-center mb-4 sm:mb-5 border-b border-gray-200 dark:border-slate-700 pb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-slate-200">
                Artikujt ({safeCartItems.length})
                </h2>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-slate-700">
              {safeCartItems.map((cartItem) => {
                const itemDetails = cartItem.menu_item_details || {};
                const itemPrice = parseFloat(itemDetails.price || 0);
                return (
                    <li key={cartItem.id} className="py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0">
                    <img 
                        src={itemDetails.image || 'https://placehold.co/120x120/FDE68A/78350F?text=Ushqim'} 
                        alt={itemDetails.name || 'Artikull'} 
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover shadow-sm sm:mr-4 flex-shrink-0 border border-gray-200 dark:border-slate-700"
                    />
                    <div className="flex-grow min-w-0">
                        <h3 className="text-md sm:text-lg font-medium text-gray-800 dark:text-white truncate" title={itemDetails.name}>{itemDetails.name || 'Artikull i Panjohur'}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                            Çmimi: {itemPrice.toFixed(2)} €
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            Nga: {itemDetails.restaurant_name || 'Restorant'} {/* Shtuar emri i restorantit nëse disponohet */}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 sm:ml-4 mt-2 sm:mt-0 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity, -1)} disabled={isLoading} className="p-1.5 sm:p-2 rounded-md" aria-label="Ul sasinë">
                            <HeroIcon icon="MinusIcon" className="h-4 w-4"/>
                        </Button>
                        <span className="text-sm sm:text-md font-medium text-gray-700 dark:text-slate-200 w-8 text-center tabular-nums">{cartItem.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(cartItem.id, cartItem.quantity, 1)} disabled={isLoading} className="p-1.5 sm:p-2 rounded-md" aria-label="Rrit sasinë">
                            <HeroIcon icon="PlusIcon" className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="w-full sm:w-auto text-left sm:text-right mt-3 sm:mt-0 sm:ml-4 flex-shrink-0">
                        <p className="text-sm sm:text-md font-semibold text-gray-800 dark:text-white">
                            {(itemPrice * cartItem.quantity).toFixed(2)} €
                        </p>
                        <Button variant="link" size="sm" onClick={() => removeCartItem(cartItem.id)} disabled={isLoading}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-0 mt-1 text-xs sm:text-sm hover:underline">
                            Largo
                        </Button>
                    </div>
                    </li>
                );
              })}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <OrderSummaryCard
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
              itemCount={safeCartItems.length}
              buttonText={isAuthenticated ? "Vazhdo te Pagesa" : "Kyçu për të Vazhduar"}
              onButtonClick={handleProceedToCheckout}
              isLoading={isLoading} // Mund të përdorësh një isLoading specifik për butonin e pagesës
              showPromoCode={true}
              disabled={safeCartItems.length === 0} // Disable if cart is empty
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;