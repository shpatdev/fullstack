// src/context/CartContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { customerApi } from '../api/customerApi.js';
import { useAuth } from './AuthContext.jsx';   // Changed import

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ id: null, user: null, items: [], total_amount: "0.00" });
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const { isAuthenticated, token, user } = useAuth(); // Changed usage

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
    // Fetch cart only if authenticated and user data is available
    if (isAuthenticated && user) {
      fetchCart();
    } else if (!isAuthenticated) {
      // Clear cart if user logs out or is not authenticated initially
      setCart({ id: null, user: null, items: [], total_amount: "0.00" });
      setLoadingCart(false);
    }
  }, [isAuthenticated, user, fetchCart]); // Add user to dependencies

  const addItemToCart = async (menuItemId, quantity, menuItemDetails) => {
    if (!isAuthenticated) {
      // It's better to throw an error or use a notification system
      window.alert("Please login to add items to your cart.");
      throw new Error("User not authenticated. Please login.");
    }
    setLoadingCart(true);
    try {
      const mockApiResponse = await customerApi.addItemToCart(menuItemId, quantity, menuItemDetails);
      
      if (mockApiResponse.success) {
        await fetchCart(); 
        
        // Consider using your global NotificationContext here
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
      if (newQuantity < 1) {
        await customerApi.removeCartItem(cartItemId);
      } else {
        await customerApi.updateCartItemQuantity(cartItemId, newQuantity);
      }
      await fetchCart();
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
      await fetchCart();
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
    // This clearCart is mostly for frontend state.
    // A real API call to clear backend cart might be needed too.
    if (!isAuthenticated) {
      setCart({ id: null, user: null, items: [], total_amount: "0.00" });
      return;
    };
    
    console.log("CartContext: Clearing cart for user:", user?.id);
    
    // For real API: if your backend has an endpoint to clear the cart for a user
    // try {
    //   await customerApi.clearUserCartOnBackend(); // Fictional API call
    // } catch (error) {
    //   console.error("Failed to clear cart on backend", error);
    //   // Handle error appropriately, maybe don't clear frontend cart or notify user
    // }

    // For mock behavior / frontend state update:
    const currentCartUser = cart?.user; // Preserve user if needed for specific backend logic
    setCart({ id: cart?.id, user: currentCartUser, items: [], total_amount: "0.00" });
    
    // If your customerApi.fetchUserCart() relies on localStorage for mock, clear that too.
    // This was used in the previous mock version of customerApi.js for addItemToCart etc.
    if (user?.id) {
        localStorage.removeItem(`mockCustomerCartItems_${user.id}`);
    } else {
        localStorage.removeItem('mockCustomerCartItems_GUEST'); // Or however guest cart was stored
    }
    // showNotification("Cart cleared!", "info"); // Use your global NotificationContext
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
    if (context === undefined) { // Added parentheses around the condition
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};