// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { customerApi } from '../api/customerApi.js'; // Sigurohu që path është i saktë
import { useAuth } from './AuthContext.jsx'; // Sigurohu që path është i saktë

const CartContext = createContext(null); // Jep një vlerë fillestare null ose një objekt default

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total_amount: "0.00", id: null });
  const [isLoading, setIsLoading] = useState(false); // Mund ta bësh true fillimisht nëse fetchCart() thirret menjëherë
  const [error, setError] = useState(null);

  const getUserIdForCart = useCallback(() => {
    // Kjo ndihmon për të pasur një ID konsistente për shportën, qoftë user.id ose 'GUEST'
    // Mock API-ja jote përdor localStorage.getItem('mockUserId')
    // Në një API real, backend-i do ta menaxhonte këtë bazuar në token ose sesion
    return user?.id?.toString() || localStorage.getItem('mockUserId') || 'GUEST_CART';
  }, [user]);


  const fetchCart = useCallback(async () => {
    // Nuk ka nevojë për kontrollin !isAuthenticated këtu, pasi customerApi.fetchUserCart()
    // në versionin mock e menaxhon vetë ID-në e përdoruesit ose mysafirit nga localStorage.
    // Për API reale, kjo do të kërkonte token.
    setIsLoading(true);
    setError(null);
    try {
      const fetchedCart = await customerApi.fetchUserCart(); // Kjo përdor mockUserId nga localStorage te mock API
      setCart(fetchedCart || { items: [], total_amount: "0.00", id: null });
      console.log("CartContext: Cart fetched/re-synced", fetchedCart);
    } catch (err) {
      console.error("CartContext: Error fetching cart:", err);
      setError(err.message || "Failed to fetch cart.");
    } finally {
      setIsLoading(false);
    }
  }, []); // Hiq isAuthenticated si dependencë, pasi fetchCart do të thirret kur user ndryshon

  useEffect(() => {
    // Thirre fetchCart kur komponenti montohet ose kur user ndryshon (login/logout)
    fetchCart();
  }, [fetchCart, user]); // user si dependencë që të rifreskohet shporta kur ndryshon përdoruesi

  const addItemToCart = async (menuItem, quantity = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      // Mock API-ja customerApi.addItemToCart përdor localStorage dhe mockUserId
      await customerApi.addItemToCart(menuItem.id, quantity, menuItem); 
      await fetchCart(); // Rifresko shportën nga burimi (localStorage për mock)
      console.log("CartContext: Item added", menuItem.name);
    } catch (err) {
      console.error("CartContext: Error adding item to cart:", err);
      setError(err.message || "Failed to add item.");
      throw err; 
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    setIsLoading(true);
    setError(null);
    try {
      await customerApi.updateCartItemQuantity(cartItemId, newQuantity);
      await fetchCart(); 
      console.log("CartContext: Item quantity updated", cartItemId);
    } catch (err) {
      console.error("CartContext: Error updating item quantity:", err);
      setError(err.message || "Failed to update quantity.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeCartItem = async (cartItemId) => {
    setIsLoading(true);
    setError(null);
    try {
      await customerApi.removeCartItem(cartItemId);
      await fetchCart();
      console.log("CartContext: Item removed", cartItemId);
    } catch (err) {
      console.error("CartContext: Error removing item from cart:", err);
      setError(err.message || "Failed to remove item.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const cartKey = `mockCustomerCartItems_${getUserIdForCart()}`;
        localStorage.removeItem(cartKey); // Logjika e mock API-së
        setCart({ items: [], total_amount: "0.00", id: cart.id }); // Reset state-in, mbaj ID-në e shportës nëse ka
        // Në API reale: await customerApi.clearUserCart();
        console.log("CartContext: Cart cleared.");
    } catch (err) {
        console.error("CartContext: Error clearing cart:", err);
        setError(err.message || "Failed to clear cart.");
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const getCartItemCount = useCallback(() => {
    // Sigurohu që cart dhe cart.items ekzistojnë para se të bësh reduce
    return cart?.items?.reduce((count, item) => count + (item.quantity || 0), 0) || 0;
  }, [cart?.items]); // Shto cart.items si dependencë për useCallback

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart, // Mund të jetë e nevojshme për teste ose raste specifike
        fetchCart,
        addItemToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,       // Sigurohu që clearCart është këtu
        getCartItemCount, // <-- SIGUROHU QË ËSHTË KËTU
        isLoading,
        error,
        setError, // Mund ta ekspozosh nëse duhet ta pastrosh nga jashtë
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};