// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Accept userRole as a prop from App.js
const Navbar = ({ loggedIn, onLogout, userRole }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    // Logout handled by App.js, which redirects to '/'
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg p-4 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wide flex items-center">
          <span role="img" aria-label="QR Menu" className="mr-2 text-3xl">🍽️</span> QR Menu
        </Link>
        <div className="flex space-x-6">
          {loggedIn ? (
            <>
              {/* Customer-specific links */}
              {userRole === 'customer' && (
                <>
                  <Link to="/Menu" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Menu</Link>
                  <Link to="/orders" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Orders</Link>
                  <Link to="/scan" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Scan QR</Link>
                  <Link to="/profile" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Profile</Link>
                </>
              )}

              {/* Chef-specific links */}
              {userRole === 'chef' && (
                <>
                  <Link to="/cook-dashboard" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Cook Dashboard</Link>
                  <Link to="/profile" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Profile</Link>
                </>
              )}

              {/* Owner-specific links */}
              {userRole === 'owner' && (
                <>
                  <Link to="/owner/monthly-sales" className="hover:text-purple-220 transition duration-300 ease-in-out font-medium text-lg">Monthly Sales</Link>
                  <Link to="/owner/daily-sales" className="hover:text-purple-220 transition duration-300 ease-in-out font-medium text-lg">Daily Sales</Link>
                  <Link to="/owner/transactions" className="hover:text-purple-220 transition duration-300 ease-in-out font-medium text-lg">Transactions</Link>
                  <Link to="/owner/feedback" className="hover:text-purple-220 transition duration-300 ease-in-out font-medium text-lg">User Feedback</Link>
                  <Link to="/profile" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Profile</Link>
                </>
              )}

              {/* Logout link (visible for all logged-in roles) */}
              <button
                onClick={handleLogoutClick}
                className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg bg-transparent border-none cursor-pointer text-white"
              >
                Logout
              </button>
            </>
          ) : (
            // If not logged in, no navigation links are shown here.
            // Users will be at '/' handled by AuthChoicePage
            null
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
