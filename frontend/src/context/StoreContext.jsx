import { createContext, useEffect, useState } from "react";
import api from "../api"; 

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const [cartItems, setCartItems] = useState({});
    const [food_list, setFoodList] = useState([]);
    const [menu_list, setMenuList] = useState([]);

    useEffect(() => {
        async function loadData() {
            try {
                const foodResponse = await api.get("/menu-items/");
                setFoodList(foodResponse.data);

                const menuResponse = await api.get("/menu-categories/"); 
                setMenuList(menuResponse.data);

            } catch (error) {
                console.error("Failed to load initial data:", error);
            }
        }
        loadData();
    }, []);

    const addToCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    };

    const removeFromCart = (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    };

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product.id === Number(item));
                if (itemInfo) { 
                    totalAmount += parseFloat(itemInfo.price) * cartItems[item];
                }
            }
        }
        return totalAmount;
    };

    const placeOrder = async (deliveryData, cartItemsData, couponCode = null) => {
        const orderItems = Object.entries(cartItemsData)
            .filter(([_, quantity]) => quantity > 0)
            .map(([itemId, quantity]) => {
                const menuItem = food_list.find(food => food.id === Number(itemId));
                return {
                    menu_item: Number(itemId), // Send PK
                    quantity: quantity,
                };
            });

        if (orderItems.length === 0) {
            console.error("Cart is empty. Cannot place order.");
            
            return { success: false, error: "Cart is empty." };
        }

        const orderPayload = {
            restaurant: orderItems.length > 0 ? food_list.find(f => f.id === orderItems[0].menu_item)?.menu_data?.restaurant_id : null, // This needs robust logic
            
            items: orderItems,
            delivery_info: deliveryData, 
             ...(couponCode && { coupon_code: couponCode })
        };
        
        
       
        const tempRestaurantId = 1; // <--- REPLACE WITH A VALID RESTAURANT ID FROM YOUR DB
        if (!orderPayload.restaurant && tempRestaurantId) {
             orderPayload.restaurant = tempRestaurantId;
        }
        if (!orderPayload.restaurant) {
            console.error("Restaurant ID is missing. Cannot place order.");
            return { success: false, error: "Restaurant ID is missing." };
        }


        console.log("Placing order with payload:", JSON.stringify(orderPayload, null, 2));

        try {
            const response = await api.post("/orders/", orderPayload);
            console.log("Order placed successfully:", response.data);
            setCartItems({}); 
            return { success: true, data: response.data };
        } catch (error) {
            console.error("Failed to place order:", error.response ? error.response.data : error.message);
            return { success: false, error: error.response ? error.response.data : error.message };
        }
    };


    const contextValue = {
        food_list,
        menu_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        placeOrder
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;