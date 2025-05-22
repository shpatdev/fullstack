// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { customerApi } from '../api/customerApi.js'; // Assuming this path
import { AuthContext } from './AuthContext.jsx';   // Assuming this path

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ id: null, user: null, items: [], total_amount: "0.00" });
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const { isAuthenticated, token, user } = useContext(AuthContext);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setCart({ id: null, user: null, items: [], total_amount: "0.00" });
      setLoadingCart(false); // Ensure loading is set to false
      return;
    }
    setLoadingCart(true);
    setCartError(null);
    try {
      const cartData = await customerApi.fetchUserCart(); // Mock API call
      setCart(cartData || { id: user?.id || null, user: user?.id || null, items: [], total_amount: "0.00" }); // Ensure cart is an object
    } catch (error) {
      console.error("Error fetching cart in context:", error);
      setCartError(error.message || "Could not load cart.");
      setCart({ id: user?.id || null, user: user?.id || null, items: [], total_amount: "0.00" });
    } finally {
      setLoadingCart(false);
    }
  }, [isAuthenticated, token, user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItemToCart = async (menuItemId, quantity, menuItemDetails) => {
    if (!isAuthenticated) {
      // It's better to throw an error or use a notification system
      // than window.alert if possible.
      window.alert("Please login to add items to your cart.");
      // Consider navigating to login: navigate('/login');
      throw new Error("User not authenticated. Please login.");
    }
    setLoadingCart(true);
    try {
      // Simulate API call and then update based on its conceptual success
      // In a real scenario, the backend would return the updated cart or cart item
      const mockApiResponse = await customerApi.addItemToCart(menuItemId, quantity, menuItemDetails);
      
      // For mock, we re-fetch. A real API might return the updated cart directly.
      if (mockApiResponse.success) {
        await fetchCart(); 
        
        // Feedback (can be replaced with a global notification system)
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg text-sm z-[200]';
        feedbackEl.textContent = `${menuItemDetails?.name || 'Item'} added to cart!`;
        document.body.appendChild(feedbackEl);
        setTimeout(() => { feedbackEl.remove(); }, 2500);
      } else {
        throw new Error(mockApiResponse.message || "Failed to add item.");
      }

    } catch (error) {
      console.error("Error adding item to cart in context:", error);
      setCartError(error.message || "Could not add item to cart.");
      // Show notification to user here
      window.alert(error.message || "Could not add item to cart.");
      throw error;
    } finally {
      setLoadingCart(false);
    }
  };

  const updateItemQuantity = async (cartItemId, newQuantity) => {
    if (!isAuthenticated) throw new Error("User not authenticated.");
    setLoadingCart(true);
    try {
      if (newQuantity < 1) { // If quantity is less than 1, remove the item
        await customerApi.removeCartItem(cartItemId);
      } else {
        await customerApi.updateCartItemQuantity(cartItemId, newQuantity);
      }
      await fetchCart(); // Re-fetch for consistency
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      setCartError(error.message || "Could not update item quantity.");
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
      await fetchCart(); // Re-fetch for consistency
    } catch (error) {
      console.error("Error removing item from cart:", error);
      setCartError(error.message || "Could not remove item.");
      window.alert(error.message || "Could not remove item.");
      throw error;
    } finally {
      setLoadingCart(false);
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    console.log("CartContext: Clearing cart (simulated)");
    // For real API: await customerApi.clearUserCart(); 
    // For mock:
    setCart({ id: cart?.id, user: cart?.user, items: [], total_amount: "0.00" });
    localStorage.setItem('mockCartItems', JSON.stringify([])); // If you were using this for mock persistence
    // showNotification("Cart cleared!", "info"); // Use your notification system
  };

  const contextValue = { 
    cart, 
    loadingCart, 
    cartError, 
    addItemToCart, 
    fetchCart, 
    updateItemQuantity, 
    removeItemFromCart,
    clearCart 
  };

  return (
    <CartContext.Provider value={contextValue}>
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