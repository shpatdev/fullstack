// src/modules/customer/pages/CheckoutPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { customerApi } from '../../../api/customerApi.js';
import { useNotification } from '../../../context/NotificationContext.jsx';
import Button from '../../../components/Button.jsx';
import HeroIcon from '../../../components/HeroIcon.jsx';
import AddressForm from '../components/AddressForm.jsx';
import OrderSummaryCard from '../components/OrderSummaryCard.jsx';

const CheckoutPage = () => {
  const { cart, clearCart, fetchCart: refetchCartContext } = useCart(); // Merr clearCart dhe refetchCartContext
  const { user, token } = useAuth(); // Merr token
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true); // Ndryshuar emri
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState(''); // Për shënimet e dërgesës

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
        setShowAddressForm(true); // Hap formularin nëse nuk ka adresa
      }
    } catch (error) {
      showError(error.message || "Nuk mund të ngarkoheshin adresat.");
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [user?.id, token, showError]);

  useEffect(() => {
    if (cart.items.length === 0 && !isPlacingOrder) {
      showError("Shporta është bosh. Shtoni artikuj.");
      navigate('/customer/cart');
    } else {
        fetchAddresses();
    }
  }, [cart.items.length, navigate, showError, fetchAddresses, isPlacingOrder]);

  const handleAddressSave = (savedAddress) => {
    fetchAddresses();
    setSelectedAddressId(savedAddress.id.toString());
    setShowAddressForm(false);
    setEditingAddress(null);
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
    if (!paymentMethod) {
      showError("Ju lutem zgjidhni një metodë pagese.");
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

  return (
    <div className="container mx-auto px-2 sm:px-0 py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6 md:mb-8">Pagesa</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center">
              <HeroIcon icon="MapPinIcon" className="h-6 w-6 mr-2.5 text-primary-500" /> Adresa e Dërgesës
            </h2>
            {isLoadingAddresses && <div className="py-4 text-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-400 mx-auto"></div></div>}
            {!isLoadingAddresses && addresses.length > 0 && !showAddressForm && (
              <div className="space-y-3 mt-4 max-h-72 overflow-y-auto custom-scrollbar-thin pr-2">
                {addresses.map(addr => (
                  <div key={addr.id} 
                       className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all
                                   ${selectedAddressId === addr.id.toString() ? 'border-primary-500 ring-2 ring-primary-500/70 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500' : 'border-gray-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500/70'}`}
                       onClick={() => setSelectedAddressId(addr.id.toString())}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-slate-100">{addr.street}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300">{addr.city}, {addr.postal_code}, {addr.country}</p>
                        </div>
                        {addr.is_default_shipping && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-600/30 dark:text-green-200 px-2 py-0.5 rounded-full font-medium">Primare</span>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setEditingAddress(addr); setShowAddressForm(true);}} className="text-xs text-primary-600 hover:underline dark:text-primary-400 mt-1.5">Modifiko</button>
                  </div>
                ))}
              </div>
            )}
            {(!isLoadingAddresses && addresses.length === 0 && !showAddressForm) && <p className="text-sm text-gray-500 dark:text-slate-400 mt-4 py-4 text-center">Nuk keni adresa të ruajtura.</p>}
            
            <Button variant={showAddressForm ? "danger" : "outline"} size="md" onClick={() => { setShowAddressForm(!showAddressForm); setEditingAddress(null); }} className="mt-5 w-full sm:w-auto"
                iconLeft={showAddressForm ? <HeroIcon icon="XMarkIcon" className="h-5 w-5"/> : <HeroIcon icon="PlusCircleIcon" className="h-5 w-5"/>}>
              {showAddressForm ? (editingAddress ? 'Anulo Modifikimin' : 'Anulo Shto Adresë') : 'Shto Adresë të Re'}
            </Button>

            {showAddressForm && (
              <div className="mt-5 border-t border-gray-200 dark:border-slate-700 pt-5">
                <h3 className="text-md font-medium text-gray-700 dark:text-slate-300 mb-3">{editingAddress ? 'Modifiko Adresën' : 'Shto Adresë të Re'}</h3>
                <AddressForm existingAddress={editingAddress} onSave={handleAddressSave} onCancel={() => { setShowAddressForm(false); setEditingAddress(null);}} userId={user.id} />
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8">
             <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center">
                <HeroIcon icon="QuestionMarkCircleIcon" className="h-6 w-6 mr-2.5 text-primary-500" /> Shënime për Dërgesën (Opsionale)
            </h2>
            <div className="mt-4">
                <textarea id="deliveryNotes" name="deliveryNotes" rows="3" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)}
                          className="input-form w-full" placeholder="P.sh. Lëreni te dera, mos bini ziles, etj."></textarea>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-1 flex items-center">
              <HeroIcon icon="CreditCardIcon" className="h-6 w-6 mr-2.5 text-primary-500" /> Metoda e Pagesës
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
          </section>
        </div>

        <div className="lg:col-span-1">
          <OrderSummaryCard
            subtotal={subtotal} deliveryFee={deliveryFee} total={total} itemCount={cart.items.length}
            buttonText="Përfundo Porosinë" onButtonClick={handlePlaceOrder}
            isLoading={isPlacingOrder} disabled={isPlacingOrder || !selectedAddressId || cart.items.length === 0 || isLoadingAddresses}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;