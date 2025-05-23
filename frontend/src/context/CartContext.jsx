// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { customerApi } from '../api/customerApi.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], total_amount: "0.00", id: null, restaurant: null, restaurant_details: null });
  const [isLoading, setIsLoading] = useState(true); // Default to true to show loading initially
  const [error, setError] = useState(null);
  const { isAuthenticated, token, user } = useAuth();

  const fetchCart = useCallback(async () => {
    // Ensure user object exists before checking its role
    if (!isAuthenticated || !token || !user || user.role !== 'CUSTOMER') {
        setCart({ items: [], total_amount: "0.00", id: null, restaurant: null, restaurant_details: null });
        setIsLoading(false);
        if (user && user.role !== 'CUSTOMER') {
            console.log("CartContext: User is not a customer. Cart fetch skipped and cart cleared.");
        } else if (!isAuthenticated || !token) {
            console.log("CartContext: User not authenticated. Cart fetch skipped and cart cleared.");
        }
        return;
    }

    console.log("CartContext: Attempting to fetch cart for CUSTOMER.");
    setIsLoading(true);
    setError(null);
    try {
      // Ensure this calls the correct endpoint, e.g., /cart/my-cart/ if that's what your backend expects
      const fetchedCart = await customerApi.fetchUserCart(); 
      if (fetchedCart) {
        setCart({
          id: fetchedCart.id,
          items: fetchedCart.items || [],
          total_amount: fetchedCart.total_amount || "0.00",
          restaurant: fetchedCart.restaurant, // assuming backend sends restaurant ID
          restaurant_details: fetchedCart.restaurant_details // assuming backend sends restaurant details
        });
      } else {
        // If backend returns null or undefined (e.g. 204 No Content for an empty/new cart)
        setCart({ items: [], total_amount: "0.00", id: null, restaurant: null, restaurant_details: null });
      }
    } catch (err) {
      console.error("CartContext: Failed to fetch cart", err);
      setError(err.message || "Failed to fetch cart.");
      // Potentially set cart to empty on error too, or keep stale data?
      // setCart({ items: [], total_amount: "0.00", id: null, restaurant: null, restaurant_details: null });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, user]); // user is a dependency

  useEffect(() => {
    console.log("CartContext - fetchCart effect triggered. isAuthenticated:", isAuthenticated, "User role:", user?.role, "Token present:", !!token); // ADDED LOG
    if (isAuthenticated && token && user && user.role === 'CUSTOMER') {
      console.log("CartContext: Auth state changed, user is customer, fetching cart.");
      fetchCart();
    } else if (!isAuthenticated || (user && user.role !== 'CUSTOMER')) {
      // Clear cart if user logs out or is not a customer
      console.log("CartContext: User logged out or not a customer, clearing local cart.");
      setCart({ items: [], total_amount: "0.00", id: null, restaurant: null, restaurant_details: null });
      setIsLoading(false); // Ensure loading is set to false
    }
  }, [isAuthenticated, token, user, fetchCart]); // fetchCart is a dependency

  const addItemToCart = async (menuItemId, quantity, restaurantId) => {
    if (!isAuthenticated) {
      setError("Ju lutem kyçuni për të shtuar në shportë."); // Ose ridrejto te login
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedCart = await customerApi.addItemToCart(menuItemId, quantity); 
      setCart(updatedCart); // API duhet të kthejë shportën e përditësuar
      console.log("CartContext: Item added to backend cart", menuItemId);
    } catch (err) {
      console.error("CartContext: Error adding item to backend cart:", err);
      setError(err.response?.data?.detail || err.message || "Failed to add item."); // Shfaq mesazhin nga backend
      // Mos e thirr fetchCart() këtu, pasi API duhet të kthejë gjendjen e re
      // Nëse API nuk kthen gjendjen e re, atëherë thirre fetchCart()
      // throw err; // Mund ta ri-hedhësh gabimin nëse komponenti UI e trajton
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItemQuantity = async (cartItemId, newQuantity) => {
    if (!isAuthenticated) { setError("Ju lutem kyçuni."); return; }
    setIsLoading(true);
    setError(null);
    try {
      // API duhet të pranojë ID të CartItem, jo MenuItem
      const updatedCart = await customerApi.updateCartItemQuantity(cartItemId, newQuantity);
      setCart(updatedCart);
      console.log("CartContext: Item quantity updated in backend cart", cartItemId);
    } catch (err) {
      console.error("CartContext: Error updating item quantity in backend:", err);
      setError(err.message || "Failed to update quantity.");
      // throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeCartItem = async (cartItemId) => {
    if (!isAuthenticated) { setError("Ju lutem kyçuni."); return; }
    setIsLoading(true);
    setError(null);
    try {
      // API duhet të pranojë ID të CartItem
      const updatedCart = await customerApi.removeCartItem(cartItemId);
      setCart(updatedCart);
      console.log("CartContext: Item removed from backend cart", cartItemId);
    } catch (err) {
      console.error("CartContext: Error removing item from backend cart:", err);
      setError(err.message || "Failed to remove item.");
      // throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCartContextAndApi = async () => { // Riemërtoje për qartësi
    if (!isAuthenticated) { setError("Ju lutem kyçuni."); return; }
    setIsLoading(true);
    setError(null);
    try {
        const updatedCart = await customerApi.clearUserCart(); // API duhet të kthejë shportën e zbrazur
        setCart(updatedCart || { items: [], total_amount: "0.00", id: cart.id, restaurant: null }); 
        console.log("CartContext: Cart cleared in backend.");
    } catch (err) {
        console.error("CartContext: Error clearing backend cart:", err);
        setError(err.message || "Failed to clear cart.");
        // throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const getCartItemCount = useCallback(() => {
    return cart?.items?.reduce((count, item) => count + (item.quantity || 0), 0) || 0;
  }, [cart?.items]);

  const getCartTotalAmount = useCallback(() => {
    return parseFloat(cart?.total_amount || 0);
  }, [cart?.total_amount]);

  // Funksion për të marrë ID e restorantit nga shporta
  // Kjo do të jetë e rëndësishme për të parandaluar shtimin e artikujve nga restorante të ndryshme
  const getRestaurantIdFromCart = useCallback(() => {
    return cart?.restaurant; // Ose cart?.restaurant_details?.id nëse API kthen objektin e plotë
  }, [cart?.restaurant]);


  return (
    <CartContext.Provider
      value={{
        cart,
        fetchCart, // Mund të thirret manualisht për rifreskim
        addItemToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart: clearCartContextAndApi, // Përdor funksionin e ri       
        getCartItemCount,
        getCartTotalAmount, // Shto këtë
        getRestaurantIdFromCart, // Shto këtë
        isLoading,
        error,
        setError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};