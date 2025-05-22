// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { customerApi } from '../api/customerApi.js'; // Import your customerApi
import { AuthContext } from './AuthContext.jsx';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null); // Will hold { id, user, items: [], ... } from API
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const { isAuthenticated, token } = useContext(AuthContext); // Use real token

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setCart(null); // Clear cart if not authenticated
      return;
    }
    setLoadingCart(true);
    setCartError(null);
    try {
      const cartData = await customerApi.fetchUserCart(); // Token is now handled by apiService via customerApi
      setCart(cartData || { id: null, user: null, items: [] }); // Handle case where API might return null/undefined for empty cart
    } catch (error) {
      console.error("Error fetching cart in context:", error);
      setCartError(error.message || "Could not load cart.");
      setCart(null);
    } finally {
      setLoadingCart(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItemToCart = async (menuItemId, quantity, menuItemDetails) => {
    if (!isAuthenticated) throw new Error("User not authenticated. Please login.");
    setLoadingCart(true);
    try {
      await customerApi.addItemToCart(menuItemId, quantity); // Token handled by apiService
      await fetchCart(); // Re-fetch cart to ensure it's up-to-date
      
      // Feedback (can be replaced with a global notification system)
      const feedbackEl = document.createElement('div');
      feedbackEl.className = 'fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg text-sm z-[200]';
      feedbackEl.textContent = `${menuItemDetails?.name || 'Item'} added to cart!`;
      document.body.appendChild(feedbackEl);
      setTimeout(() => { feedbackEl.remove(); }, 2500);

    } catch (error) {
      console.error("Error adding item to cart in context:", error);
      // Using window.alert for simplicity, replace with a proper notification system
      window.alert(error.message || "Could not add item to cart.");
      throw error;
    } finally {
      setLoadingCart(false);
    }
  };

  const updateItemQuantity = async (cartItemId, newQuantity) => {
    if (!isAuthenticated) throw new Error("User not authenticated.");
    if (newQuantity < 1) {
        await removeItemFromCart(cartItemId); // If quantity is less than 1, remove
        return;
    }
    setLoadingCart(true);
    try {
        await customerApi.updateCartItemQuantity(cartItemId, newQuantity);
        await fetchCart();
    } catch (error) {
        console.error("Error updating cart item quantity:", error);
        window.alert(error.message || "Could not update item quantity.");
        throw error;
    } finally {
        setLoadingCart(false);
    }
  };

  const removeItemFromCart = async (cartItemId) => {
    if (!isAuthenticated) throw new Error("User not authenticated.");
    setLoadingCart(true);
    try {
        await customerApi.removeCartItem(cartItemId);
        await fetchCart();
    } catch (error) {
        console.error("Error removing item from cart:", error);
        window.alert(error.message || "Could not remove item.");
        throw error;
    } finally {
        setLoadingCart(false);
    }
  };

  // Value also includes loading and error states for consumers to use
  const contextValue = { 
    cart, 
    loadingCart, 
    cartError, 
    addItemToCart, 
    fetchCart, 
    updateItemQuantity, 
    removeItemFromCart 
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);