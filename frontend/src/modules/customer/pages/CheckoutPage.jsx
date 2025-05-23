// src/modules/customer/pages/CheckoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from "../../../context/CartContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { customerApi } from "../../../api/customerApi.js";
import { useNotification } from "../../../context/NotificationContext.jsx";
import Button from "../../../components/Button.jsx";
import { MapPinIcon, PlusCircleIcon, CreditCardIcon, InformationCircleIcon, ShoppingCartIcon, XMarkIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import AddressFormModal from '../components/AddressFormModal.jsx';

const CheckoutPage = () => {
  const { cart, clearCart, getCartTotal, getCartItemsCount } = useCart(); // Merr clearCart dhe refetchCartContext
  const { user, token } = useAuth(); // Merr token
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  // const [showAddressForm, setShowAddressForm] = useState(false); // Zëvendësohet
  const [showAddressFormModal, setShowAddressFormModal] = useState(false); // SHTO KËTË
  const [editingAddress, setEditingAddress] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true); // Ndryshuar emri
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState(''); // Për shënimet e dërgesës
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);


  const fetchAddresses = useCallback(async () => {
    if (!user?.id || !token) {
        setIsLoadingAddresses(false);
        return;
    }
    setIsLoadingAddresses(true);
    try {
      const userAddresses = await customerApi.fetchUserAddresses();
      setAddresses(userAddresses || []);
      const defaultAddress = userAddresses.find(addr => addr.is_default_shipping);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id.toString());
      } else if (userAddresses.length > 0) {
        setSelectedAddressId(userAddresses[0].id.toString());
      } else {
        setShowAddressFormModal(true); // Hap formularin nëse nuk ka adresa
      }
    } catch (error) {
      showError(error.message || "Nuk mund të ngarkoheshin adresat.");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [user?.id, token, showError]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setIsLoadingAddresses(false);
      // Consider redirecting to login or showing a message if user is not logged in
    }
  }, [user, fetchAddresses]);
  
  useEffect(() => {
    // Pre-select the default shipping address if available
    const defaultAddress = addresses.find(addr => addr.is_default_shipping);
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id.toString());
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id.toString()); // Select the first one if no default
    }
  }, [addresses]);


  const handleAddressSaveViaModal = async (addressDataFromForm, addressIdToUpdate = null) => {
    setIsLoadingAddresses(true); // Ose një state të veçantë për ruajtjen e adresës
    try {
        let savedAddress;
        if (addressIdToUpdate) {
            savedAddress = await customerApi.updateUserAddress(addressIdToUpdate, addressDataFromForm);
            showSuccess("Adresa u përditësua me sukses!");
        } else {
            savedAddress = await customerApi.createUserAddress(addressDataFromForm);
            showSuccess("Adresa u shtua me sukses!");
        }
        fetchAddresses(); // Rifresko listën e adresave
        setSelectedAddressId(savedAddress.id.toString()); // Zgjidh adresën e re/përditësuar
        setShowAddressFormModal(false); // Mbyll modalin
        setEditingAddress(null);
    } catch (error) {
        showError(error.message || "Gabim gjatë ruajtjes së adresës.");
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
        showSuccess("Adresa u fshi me sukses!");
        fetchAddresses(); // Refresh list
        if (selectedAddressId === addressId.toString()) {
          setSelectedAddressId(''); // Clear selection if deleted address was selected
        }
      } catch (error) {
        showError(error.message || "Gabim gjatë fshirjes së adresës.");
      } finally {
        setIsLoadingAddresses(false);
      }
    }
  };
  
  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
        showError("Shporta është bosh.");
        return;
    }
    if (!selectedAddressId) {
      showError("Ju lutem zgjidhni ose shtoni një adresë dërgese.");
      return;
    }
    
    const selectedAddressDetails = addresses.find(addr => addr.id.toString() === selectedAddressId);
    if (!selectedAddressDetails) {
        showError("Detajet e adresës së zgjedhur nuk u gjetën.");
        return;
    }

    // Supozojmë se të gjithë artikujt janë nga i njëjti restorant për thjeshtësi
    const restaurantId = cart.items[0]?.menu_item_details?.restaurant_id_placeholder || cart.items[0]?.menu_item_details?.restaurant; // Provo të marrësh ID e restorantit
    if (!restaurantId) {
        showError("Nuk mund të përcaktohej restoranti. Sigurohuni që artikujt e shportës kanë informacionin e restorantit.");
        return;
    }

    setIsPlacingOrder(true);
    setIsLoadingOrder(true); // Shto këtë linjë
    try {
      const orderPayload = {
        restaurant_id: parseInt(restaurantId), // Sigurohu që është integer
        delivery_address_id: parseInt(selectedAddressId),
        payment_method: paymentMethod,
        delivery_address_notes: deliveryNotes, // Shto shënimet
        items: cart.items.map(item => ({
          menu_item: item.menu_item, // ID e menu_item
          quantity: item.quantity
        })),
      };

      const newOrder = await customerApi.createOrder(orderPayload);
      showSuccess(`Porosia #${newOrder.id} u krijua me sukses!`);
      await customerApi.clearUserCartMock(); // Pastro shportën mock (ose thirr API reale nëse e ke)
      await refetchCartContext(); // Rifresko kontekstin e shportës
      navigate(`/customer/order-confirmation/${newOrder.id}`);
    } catch (error) {
      console.error("CheckoutPage: Failed to place order:", error);
      showError(error.response?.data?.detail || error.message || "Gabim gjatë krijimit të porosisë.");
      setIsPlacingOrder(false);
    }
    // Nuk ka finally këtu pasi navigimi ndodh në sukses
  };
  
  const deliveryFee = cart.items.length > 0 ? 2.00 : 0;
  const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.menu_item_details?.price || 0) * item.quantity, 0);
  const total = subtotal + deliveryFee;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <InformationCircleIcon className="h-12 w-12 text-primary-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Ju lutem identifikohuni</h1>
        <p className="text-gray-600 dark:text-slate-300 mb-6">Për të vazhduar me porosinë, ju duhet të identifikoheni ose të krijoni një llogari.</p>
        <Button onClick={() => navigate('/login', { state: { from: location }})} variant="primary" size="lg">
          Identifikohu
        </Button>
      </div>
    );
  }

  if (cart.length === 0 && !isLoadingOrder) {
    return (
      <div className="container mx-auto py-10 text-center">
        <ShoppingCartIcon className="h-20 w-20 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">Shporta juaj është bosh.</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">Ju lutem shtoni artikuj në shportë para se të vazhdoni me pagesën.</p>
        <Button onClick={() => navigate('/customer/restaurants')} variant="primary">
          Kthehu te Restorantet
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6 sm:mb-8 text-center">Përfundo Porosinë</h1>
      
      {isLoadingOrder && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl text-center">
            <ArrowPathIcon className="h-12 w-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 dark:text-slate-200">Duke procesuar porosinë...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Order Summary - Left Column (or Top on Mobile) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
              <MapPinIcon className="h-6 w-6 mr-2 text-primary-500" /> Adresa e Dërgesës
            </h2>
            {isLoadingAddresses && <ArrowPathIcon className="h-6 w-6 animate-spin text-primary-500 my-4" />}
            {!isLoadingAddresses && addresses.length === 0 && !showAddressFormModal && (
              <p className="text-gray-500 dark:text-slate-400">Nuk keni adresa të ruajtura.</p>
            )}
            {!isLoadingAddresses && addresses.length > 0 && (
              <div className="space-y-3 mb-4">
                {addresses.map((address) => (
                  <div 
                    key={address.id} 
                    className={`p-3 border rounded-lg cursor-pointer transition-all
                                ${selectedAddressId === address.id.toString() ? 'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-300 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'}`}
                    onClick={() => setSelectedAddressId(address.id.toString())}
                  >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-slate-100">{address.street}</p>
                            <p className="text-sm text-gray-600 dark:text-slate-300">{address.city}, {address.postal_code}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{address.country}</p>
                        </div>
                        <div className="flex-shrink-0 space-x-1">
                            <Button variant="icon" size="sm" onClick={(e) => { e.stopPropagation(); handleEditAddress(address);}} title="Modifiko">
                                <PencilIcon className="h-4 w-4 text-blue-500"/>
                            </Button>
                            <Button variant="icon" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteAddress(address.id);}} title="Fshij">
                                <TrashIcon className="h-4 w-4 text-red-500"/>
                            </Button>
                        </div>
                    </div>
                    {address.is_default_shipping && (
                      <span className="mt-1 inline-block text-xs bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded-full">Primare</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Button 
                variant={showAddressFormModal ? "danger" : "outline"} 
                size="md" 
                onClick={() => { setShowAddressFormModal(!showAddressFormModal); setEditingAddress(null); }} 
                className="mt-1 w-full sm:w-auto"
                iconLeft={showAddressFormModal ? <XMarkIcon className="h-5 w-5"/> : <PlusCircleIcon className="h-5 w-5"/>}
            >
              {showAddressFormModal ? (editingAddress ? 'Anulo Modifikimin' : 'Anulo Shto Adresë') : 'Shto Adresë të Re'}
            </Button>

            {/* Nuk ka më AddressForm direkt këtu, por AddressFormModal */}
            <AddressFormModal
                isOpen={showAddressFormModal}
                onClose={() => { setShowAddressFormModal(false); setEditingAddress(null); }}
                onSaveAddress={handleAddressSaveViaModal} // Ky thërret API-në
                existingAddress={editingAddress}
                // userId={user.id} // Nuk nevojitet pasi API call bëhet këtu
            />
          </div>

          {/* Payment Method Section */}
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
              <CreditCardIcon className="h-6 w-6 mr-2.5 text-primary-500 dark:text-primary-400" /> Metoda e Pagesës
            </h2>
            <div className="mt-4 space-y-3">
              <div onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'CASH_ON_DELIVERY' ? 'border-primary-500 ring-2 ring-primary-500/70 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500' : 'border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500/70'}`}>
                <div className="flex items-center">
                  <HeroIcon icon="CurrencyEuroIcon" className="h-5 w-5 mr-3 text-gray-500 dark:text-slate-400" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-100">Para në Dorë</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Paguani kur të merrni porosinë.</p>
                  </div>
                </div>
                   {paymentMethod === 'CASH_ON_DELIVERY' && <HeroIcon icon="CheckCircleIcon" className="h-6 w-6 text-primary-500" />}
              </div>
              <div className="p-3 sm:p-4 border rounded-lg cursor-not-allowed bg-gray-100 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600 opacity-60 flex items-center justify-between">
                 <div className="flex items-center">
                  <HeroIcon icon="CreditCardIcon" className="h-5 w-5 mr-3 text-gray-400 dark:text-slate-500" />
                  <div>
                    <p className="font-semibold text-sm text-gray-500 dark:text-slate-400">Pagesë Online me Kartë</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Së shpejti...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Details - Right Column (or Bottom on Mobile) */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl p-5 sm:p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center">
              <ShoppingCartIcon className="h-6 w-6 mr-2 text-primary-500" /> Përmbledhja e Shportës
            </h2>
            <div className="space-y-4">
              {cart.items.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-slate-400 py-4">Shporta juaj është bosh.</p>
              ) : (
                cart.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-slate-700">
                    <div className="flex items-center">
                      <img src={item.menu_item_details?.image_url} alt={item.menu_item_details?.name} className="w-16 h-16 object-cover rounded-md mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{item.menu_item_details?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.quantity}x - {parseFloat(item.menu_item_details?.price).toFixed(2)}€</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{(item.quantity * parseFloat(item.menu_item_details?.price)).toFixed(2)}€</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
                <span>Subtotal ({cart.items.length} artikuj)</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
                <span>Taksat dhe Tarifet</span>
                <span>0.00€</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
                <span>Tarifa e Dërgesës</span>
                <span>{deliveryFee.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-800 dark:text-slate-200 mt-2">
                <span>Total</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </div>
            <Button 
              onClick={handlePlaceOrder} 
              variant="primary" 
              size="lg" 
              className="mt-4 w-full"
              isLoading={isPlacingOrder}
              disabled={isPlacingOrder || !selectedAddressId || cart.items.length === 0 || isLoadingAddresses}
            >
              {isPlacingOrder ? 'Duke përfunduar...' : 'Përfundo Porosinë'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;