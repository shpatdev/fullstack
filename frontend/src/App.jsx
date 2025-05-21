import React, { useState } from 'react';
import Home from './pages/Home/Home';
import Footer from './components/Footer/Footer';
import Navbar from './components/Navbar/Navbar';
import { Route, Routes } from 'react-router-dom';
import Cart from './pages/Cart/Cart';
import LoginPopup from './components/LoginPopup/LoginPopup';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import MyOrders from './pages/MyOrders/MyOrders';
import Restaurants from './pages/Restaurants/Restaurants';

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState(localStorage.getItem("username") || null);

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} setUser={setUser} />}
      <div className='app'>
        <Navbar setShowLogin={setShowLogin} user={user} />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/myorder' element={<MyOrders />} />
          <Route path='/restaurants' element={<Restaurants />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
};

export default App;