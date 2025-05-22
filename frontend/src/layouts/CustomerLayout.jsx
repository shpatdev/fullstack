// filepath: frontend/src/layouts/CustomerLayout.jsx
import React from 'react'; // Removed useContext as useAuth/useCart are used
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Corrected to useAuth
import { useCart } from '../context/CartContext.jsx'; // Corrected to useCart
import HeroIcon from '../components/HeroIcon.jsx'; // Added import

// Inline icon definitions are removed as they are now in HeroIcon.jsx

const CustomerLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart } = useCart();
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
              <Link to="/" className="flex items-center">
                <HeroIcon name="food-dash-logo" className="w-10 h-10 text-indigo-600" />
                <span className="ml-3 text-2xl font-bold text-indigo-600">FoodDash</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-2 md:space-x-4">
              {isAuthenticated && user ? (
                <>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    Hi, {user.name || user.username || user.email?.split('@')[0]}!
                  </span>
                  <Link to="/profile" className="p-2 rounded-lg hover:bg-gray-100" aria-label="Profile">
                    <HeroIcon name="user-circle" className="w-6 h-6 text-gray-600" />
                  </Link>
                  <Link to="/cart" className="p-2 rounded-lg hover:bg-gray-100 relative" aria-label="Shopping Cart">
                    <HeroIcon name="shopping-cart" className="w-6 h-6 text-gray-600" />
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