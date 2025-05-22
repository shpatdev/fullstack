// src/layouts/CustomerLayout.jsx
import React, { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom'; // Use real react-router-dom
import { AuthContext } from '../context/AuthContext.jsx';
import { CartContext } from '../context/CartContext.jsx';

// Icon Components (Ideally import from src/components/icons/ or use a library like lucide-react)
const FoodDashLogo = () => ( <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M5 6h14M5 10h14M5 14h14M5 18h14"></path> </svg> );
const ShoppingCartIcon = () => ( <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path> </svg> );
const UserCircleIcon = () => ( <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"> <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd"></path> </svg> );


const CustomerLayout = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext); 
  const cartItemCount = cart && cart.items ? cart.items.reduce((count, item) => count + item.quantity, 0) : 0;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center"> {/* Changed to Link */}
                <FoodDashLogo />
                <span className="ml-3 text-2xl font-bold text-indigo-600">FoodDash</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-2 md:space-x-4">
              {isAuthenticated && user ? (
                <>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    Hi, {user.name || user.email?.split('@')[0]}!
                  </span>
                  <Link to="/profile" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Profile">
                    <UserCircleIcon />
                  </Link>
                  <Link to="/cart" className="p-2 rounded-lg hover:bg-gray-100 relative" aria-label="Shopping Cart">
                    <ShoppingCartIcon />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                  <button onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                    Login
                  </Link>
                  <Link to="/register"
                    className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-grow bg-gray-50">
        <Outlet /> {/* Renders the matched child route component */}
      </main>
      <footer className="bg-gray-800 text-white py-8 text-center">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} FoodDash. All rights reserved.</p>
          <p className="text-sm text-gray-400 mt-1">Delicious food, delivered fast.</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;