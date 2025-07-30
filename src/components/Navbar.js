// frontend/src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

const Navbar = () => { // Removed props: loggedIn, onLogout, userRole
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth(); // Get auth state and logout function from context

  const handleLogoutClick = () => {
    logout(); // Call logout function from AuthContext
    // AuthContext will handle clearing localStorage and App.js's HomeRedirect will navigate
  };

  // Do not render Navbar if not authenticated, or if user is still loading.
  // This helps prevent flickering or incorrect links before auth state is known.
  if (!isAuthenticated || !user) {
    return null; 
  }

  // Get the user's role from the context
  const userRole = user.role;

  return (
    <nav className="fixed top-0 left-0 w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg p-4 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-wide flex items-center">
          <span role="img" aria-label="QR Menu" className="mr-2 text-3xl">🍽️</span> QR Menu
        </Link>
        <div className="flex space-x-6">
          {/* Conditionally render links based on user role */}
          {userRole === 'customer' && (
            <>
              <Link to="/Menu" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Menu</Link>
              <Link to="/my-orders" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Orders</Link>
              <Link to="/profile" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Profile</Link>
            </>
          )}

          {userRole === 'chef' && (
            <>
              <Link to="/cook-dashboard" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Cook Dashboard</Link>
              <Link to="/profile" className="hover:text-purple-200 transition duration-300 ease-in-out font-medium text-lg">Profile</Link>
            </>
          )}

          {userRole === 'owner' && (
            <>
              <Link to="/owner-dashboard" className="hover:text-purple-220 transition duration-300 ease-in-out font-medium text-lg">Owner Dashboard</Link>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
