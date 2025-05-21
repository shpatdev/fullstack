import React, { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets'; // Keep if used for payment icons
import { useNavigate } from 'react-router-dom';

const PlaceOrder = () => {
    const { getTotalCartAmount, placeOrder, food_list, cartItems, setCartItems } = useContext(StoreContext); // Added food_list, cartItems, setCartItems
    const navigate = useNavigate();

    const [data, setData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
        country: "",
        phone: ""
    });
    const [couponCode, setCouponCode] = useState(""); // State for coupon code
    const [orderStatus, setOrderStatus] = useState({ loading: false, error: null, success: null });


    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleCouponChange = (event) => {
        setCouponCode(event.target.value);
    };

    useEffect(() => {
        if (getTotalCartAmount() === 0 && Object.keys(cartItems).length > 0) { // Check if cart had items but now total is 0 (e.g. after order)
            
        } else if (Object.keys(cartItems).filter(key => cartItems[key] > 0).length === 0) {
            navigate('/cart'); // Redirect to cart if it's truly empty
        }
    }, [getTotalCartAmount, cartItems, navigate]);

    const handlePlaceOrder = async (event) => {
        event.preventDefault();
        setOrderStatus({ loading: true, error: null, success: null });

        // Construct delivery_info from form data
        const deliveryInfo = {
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email, // May not be needed if user is logged in and email is tied to user
            street: data.street,
            city: data.city,
            state: data.state,
            zip_code: data.zipcode,
            country: data.country,
            phone: data.phone
        };

        // Pass cartItems directly from context
        const result = await placeOrder(deliveryInfo, cartItems, couponCode || null);

        if (result.success) {
            setOrderStatus({ loading: false, error: null, success: "Order placed successfully! ID: " + result.data.id });
            // setCartItems({}); // Already done in StoreContext
            setTimeout(() => {
                navigate('/myorder'); // Navigate to my orders page
            }, 2000);
        } else {
            setOrderStatus({ loading: false, error: result.error || "Failed to place order.", success: null });
        }
    };

    return (
        <form onSubmit={handlePlaceOrder} className='place-order'>
            <div className="place-order-left">
                <p className='title'>Delivery Information</p>
                <div className="multi-field">
                    <input type="text" name='firstName' onChange={onChangeHandler} value={data.firstName} placeholder='First name' required />
                    <input type="text" name='lastName' onChange={onChangeHandler} value={data.lastName} placeholder='Last name' required />
                </div>
                <input type="email" name='email' onChange={onChangeHandler} value={data.email} placeholder='Email address' required />
                <input type="text" name='street' onChange={onChangeHandler} value={data.street} placeholder='Street' required />
                <div className="multi-field">
                    <input type="text" name='city' onChange={onChangeHandler} value={data.city} placeholder='City' required />
                    <input type="text" name='state' onChange={onChangeHandler} value={data.state} placeholder='State' required />
                </div>
                <div className="multi-field">
                    <input type="text" name='zipcode' onChange={onChangeHandler} value={data.zipcode} placeholder='Zip code' required />
                    <input type="text" name='country' onChange={onChangeHandler} value={data.country} placeholder='Country' required />
                </div>
                <input type="text" name='phone' onChange={onChangeHandler} value={data.phone} placeholder='Phone' required />
            </div>
            <div className="place-order-right">
                <div className="cart-total">
                    <h2>Cart Totals</h2>
                    <div>
                        <div className="cart-total-details"><p>Subtotal</p><p>${getTotalCartAmount().toFixed(2)}</p></div>
                        <hr />
                        <div className="cart-total-details"><p>Delivery Fee</p><p>${getTotalCartAmount() === 0 ? 0 : 5.00.toFixed(2)}</p></div>
                        <hr />
                        <div className="cart-total-details"><b>Total</b><b>${(getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 5).toFixed(2)}</b></div>
                    </div>
                </div>
                {}
                <div className="cart-promocode" style={{marginTop: '20px'}}>
                  <div>
                    <p>If you have a promo code, Enter it here</p>
                    <div className='cart-promocode-input'>
                      <input type="text" value={couponCode} onChange={handleCouponChange} placeholder='promo code'/>
                      {}
                    </div>
                  </div>
                </div>
                <div className="payment-options">
                    <h2>Select Payment Method</h2>
                    <div className="payment-option">
                        <img src={assets.selector_icon} alt="" />
                        <p>COD ( Cash On Delivery )</p>
                    </div>
                    {orderStatus.error && <p style={{color: 'red', marginTop: '10px'}}>{typeof orderStatus.error === 'string' ? orderStatus.error : JSON.stringify(orderStatus.error)}</p>}
                    {orderStatus.success && <p style={{color: 'green', marginTop: '10px'}}>{orderStatus.success}</p>}

                    <button type="submit" disabled={orderStatus.loading}>
                        {orderStatus.loading ? "Placing Order..." : "PLACE ORDER"}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PlaceOrder;