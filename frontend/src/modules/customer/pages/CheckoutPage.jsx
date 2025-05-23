// src/modules/customer/pages/CheckoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useCart } from "../../../context/CartContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { customerApi } from "../../../api/customerApi.js";
import { useNotification } from "../../../context/NotificationContext.jsx";
import Button from "../../../components/Button.jsx";
import AddressCard from '../components/AddressCard.jsx'; 
import AddressFormModal from '../components/AddressFormModal.jsx';
import { PlusCircleIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import OrderSummaryCard from '../components/OrderSummaryCard.jsx'; // SHTO KETE

const CheckoutPage = () => {
  const { cart, fetchCart, getCartTotalAmount, getCartItemCount } = useCart();
  const { user, token: userToken, isAuthenticated } = useAuth(); // Assuming user object contains id
  const userId = user?.id;
  const { showNotification } = useNotification(); // Assuming useNotification provides a stable showNotification
  const navigate = useNavigate();
  const location = useLocation();

  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressFormModal, setShowAddressFormModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');

  const restaurantDataForCart = cart.restaurant_details;
  const deliveryFee = parseFloat(restaurantDataForCart?.delivery_fee_placeholder || 2.00);
  const subtotal = getCartTotalAmount();
  const total = subtotal + deliveryFee;

  // Add this log to see when fetchAddressesCallback is re-created
  // console.log("CheckoutPage: Defining fetchAddressesCallback function object");

  const fetchAddressesCallback = useCallback(async () => {
    // console.log("CheckoutPage: fetchAddressesCallback RECREATED or CALLED. UserID:", userId, "Token:", userToken); // More detailed log
    if (!userId || !userToken) {
        setIsLoadingAddresses(false);
        return;
    }
    setIsLoadingAddresses(true);
    try {
      console.log("CheckoutPage: Attempting to fetch addresses with customerApi.fetchUserAddresses");
      const userAddresses = await customerApi.fetchUserAddresses();
      setAddresses(userAddresses || []);
      const defaultAddress = (userAddresses || []).find(addr => addr.is_default_shipping);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id.toString());
      } else if (userAddresses?.length > 0) {
        setSelectedAddressId(userAddresses[0].id.toString());
      } else {
        // setShowAddressFormModal(true); // Consider if this should always happen or only if no addresses and cart not empty
      }
    } catch (error) {
      showNotification(error.message || "Nuk mund të ngarkoheshin adresat.", "error");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [userId, userToken, showNotification, setIsLoadingAddresses]); // Added setIsLoadingAddresses if it's a setState from this component

  useEffect(() => {
    console.log("CheckoutPage Addresses useEffect - MOUNTING/UPDATING. IsAuthenticated:", isAuthenticated, "UserID:", userId, "UserToken:", userToken);
    if (isAuthenticated && userId && userToken) {
        fetchAddressesCallback();
    }
    return () => {
        console.log("CheckoutPage Addresses useEffect - UNMOUNTING/CLEANUP");
    };
  }, [isAuthenticated, userId, userToken, fetchAddressesCallback]);
  
  const handleAddressSaveViaModal = async (addressDataFromForm, addressIdToUpdate = null) => {
    setIsLoadingAddresses(true); 
    try {
        let savedAddress;
        if (addressIdToUpdate) {
            savedAddress = await customerApi.updateUserAddress(addressIdToUpdate, addressDataFromForm);
            showNotification("Adresa u përditësua me sukses!", "success"); // PERDORE showNotification
        } else {
            savedAddress = await customerApi.createUserAddress(addressDataFromForm);
            showNotification("Adresa u shtua me sukses!", "success"); // PERDORE showNotification
        }
        await fetchAddressesCallback(); 
        setSelectedAddressId(savedAddress.id.toString());
        setShowAddressFormModal(false);
        setEditingAddress(null);
    } catch (error) {
        showNotification(error.message || "Gabim gjatë ruajtjes së adresës.", "error"); // PERDORE showNotification
    } finally {
        setIsLoadingAddresses(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressFormModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Jeni i sigurt që dëshironi të fshini këtë adresë?")) {
      setIsLoadingAddresses(true);
      try {
        await customerApi.deleteUserAddress(addressId);
        showNotification("Adresa u fshi me sukses!", "success"); // PERDORE showNotification
        await fetchAddressesCallback(); 
        if (selectedAddressId === addressId.toString()) {
          setSelectedAddressId(''); 
        }
      } catch (error) {
        showNotification(error.message || "Gabim gjatë fshirjes së adresës.", "error"); // PERDORE showNotification
      } finally {
        setIsLoadingAddresses(false);
      }
    }
  };
  
  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
        showNotification("Shporta është bosh.", "error");
        return;
    }
    if (!selectedAddressId) {
      showNotification("Ju lutem zgjidhni ose shtoni një adresë dërgese.", "error");
      return;
    }
    
    const restaurantIdForOrder = cart.restaurant; 
    if (!restaurantIdForOrder) {
        showNotification("Nuk mund të përcaktohej restoranti për porosinë. Provoni të rifreskoni shportën.", "error");
        return;
    }

    setIsPlacingOrder(true);
    try {
      const orderPayload = {
        restaurant_id: parseInt(restaurantIdForOrder),
        delivery_address_id: parseInt(selectedAddressId),
        payment_method: paymentMethod,
        delivery_address_notes: deliveryNotes,
      };

      const newOrder = await customerApi.createOrder(orderPayload);
      showNotification(`Porosia #${newOrder.id} u krijua me sukses!`, "success");
      await fetchCart(); 
      navigate(`/customer/order-confirmation/${newOrder.id}`, { state: { orderDetails: newOrder } });
    } catch (error) {
      console.error("CheckoutPage: Failed to place order:", error);
      showNotification(error.response?.data?.detail || error.message || "Gabim gjatë krijimit të porosisë.", "error");
    } finally {
      setIsPlacingOrder(false); 
    }
  };
  
  if (!isAuthenticated && !isLoadingAddresses && !cart?.items?.length) { 
      // If not authenticated, not loading addresses, and cart is empty, redirect to home or login.
      // This check is to prevent rendering checkout page if user lands here unauthenticated without items.
      return <Navigate to="/login" state={{ from: location }} replace />;
  }


  if (isLoadingAddresses && addresses.length === 0) { // Show loader only if addresses are truly being fetched for the first time or empty
    return (
      <div className="container mx-auto py-10 text-center">
        <svg className="animate-spin h-10 w-10 mx-auto mb-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
        </svg>
        <p className="text-lg font-semibold text-gray-700 dark:text-slate-200">Duke ngarkuar adresat...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6 sm:mb-8 text-center">Përfundo Porosinë</h1>
      
      {isPlacingOrder && ( 
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl text-center">
            <svg className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
            </svg>
            <p className="text-lg font-semibold text-gray-700 dark:text-slate-200">Duke procesuar porosinë...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
              <svg className="h-6 w-6 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 10v11M15 10v11" />
              </svg>
              Adresa e Dërgesës
            </h2>
            {isLoadingAddresses && <svg className="h-6 w-6 animate-spin text-primary-500 my-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
            </svg>}
            {!isLoadingAddresses && addresses.length === 0 && !showAddressFormModal && (
              <p className="text-gray-500 dark:text-slate-400">Nuk keni adresa të ruajtura.</p>
            )}
            {!isLoadingAddresses && addresses.length > 0 && (
              <div className="space-y-3 mb-4">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isSelected={selectedAddressId === address.id.toString()}
                    onSelect={() => setSelectedAddressId(address.id.toString())}
                    onEdit={handleEditAddress}
                    onDelete={handleDeleteAddress}
                  />
                ))}
              </div>
            )}
            <Button 
                variant={showAddressFormModal ? "danger" : "outline"} 
                size="md" 
                onClick={() => { setShowAddressFormModal(!showAddressFormModal); setEditingAddress(null); }} 
                className="mt-1 w-full sm:w-auto"
                iconLeft={showAddressFormModal ? XMarkIcon : PlusCircleIcon}
                iconLeftClassName="h-5 w-5"
            >
              {showAddressFormModal ? (editingAddress ? 'Anulo Modifikimin' : 'Anulo Shto Adresë') : 'Shto Adresë të Re'}
            </Button>
            <AddressFormModal
                isOpen={showAddressFormModal}
                onClose={() => { setShowAddressFormModal(false); setEditingAddress(null); }}
                onSaveAddress={handleAddressSaveViaModal} 
                existingAddress={editingAddress}
            />
          </div>

          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
                <svg className="h-6 w-6 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8" />
                </svg>
                Metoda e Pagesës
            </h2>
             <div className="mt-4 space-y-3">
              <div onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'CASH_ON_DELIVERY' ? 'border-primary-500 ring-2 ring-primary-500/70 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500' : 'border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500/70'}`}>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-3 text-gray-500 dark:text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 10v11M15 10v11" />
                  </svg>
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-100">Para në Dorë</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Paguani kur të merrni porosinë.</p>
                  </div>
                </div>
                   {paymentMethod === 'CASH_ON_DELIVERY' && <svg className="h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4 -4" />
                    </svg>}
              </div>
            </div>
          </div>
          
           <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
                <svg className="h-6 w-6 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Shënime për Dërgesën (Opsionale)
            </h2>
            <textarea 
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows="3"
                className="input-form w-full"
                placeholder="P.sh. Lëreni te dera, mos bini ziles, etj."
            />
          </div>

        </div>

        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
              <svg className="h-6 w-6 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M9 10v11M15 10v11" />
              </svg>
              Përmbledhja e Shportës
            </h2>
            {/* === NDRYSHO KETU === */}
            <OrderSummaryCard 
                cart={cart} 
                deliveryFee={deliveryFee} 
                // getCartItemCount={getCartItemCount} // Pass if needed by OrderSummaryCard
                // getCartTotalAmount={getCartTotalAmount} // Pass if needed by OrderSummaryCard
            />
            <Button 
              onClick={handlePlaceOrder} 
              variant="primary" 
              size="lg" 
              className="mt-6 w-full"
              isLoading={isPlacingOrder || isLoadingAddresses}
              disabled={isPlacingOrder || !selectedAddressId || !cart || cart.items.length === 0 || isLoadingAddresses}
            >
              {isPlacingOrder ? 'Duke Përfunduar...' : `Përfundo Porosinë (${total.toFixed(2)}€)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;