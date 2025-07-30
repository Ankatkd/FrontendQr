// frontend/src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar"; // Assuming Navbar will be updated to use AuthContext
import Menu from "./components/Menu";
import CombinedOrdersView from './components/CombinedOrdersView';
import OrderStatus from "./components/OrderStatus"; // This might be redundant if CombinedOrdersView shows status
import Login from "./components/Login"; // Password-based login
import OrderSummary from "./components/OrderSummary";
import Payment from "./components/Payment";
import OrderConfirmation from "./components/OrderConfirmation";
import PhoneLogin from "./components/PhoneLogin"; // OTP-based login
import AuthChoicePage from "./components/AuthChoicePage"; // Page to choose login method
import Profile from './components/Profile';
import CookDashboard from './components/CookDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import Bill from './components/Bill';

// Import AuthProvider and useAuth from your context
import { AuthProvider, useAuth } from './context/AuthContext';

// --- ProtectedRoute Component ---
// This component ensures only authenticated users with specific roles can access certain routes.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading, logout } = useAuth(); // Get auth state from context

  // Show a loading spinner while authentication status is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading authentication...</p>
      </div>
    );
  }

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    // Also, if the token was invalid, logout cleans up localStorage
    logout(); // Ensure any stale token is cleared
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no user object (shouldn't happen with proper backend), redirect
  if (!user) {
    logout();
    return <Navigate to="/login" replace />;
  }

  // Check if the user's role is allowed for this route
  // If allowedRoles is not provided, any authenticated user can access.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`Access Denied: User with role "${user.role}" attempted to access a route restricted to roles: ${allowedRoles.join(', ')}`);
    // Redirect to a default authenticated route based on their actual role
    switch (user.role) {
      case 'customer': return <Navigate to="/menu" replace />;
      case 'chef': return <Navigate to="/cook-dashboard" replace />;
      case 'owner': return <Navigate to="/owner-dashboard" replace />;
      default: return <Navigate to="/" replace />; // Fallback to home/auth choice
    }
  }

  // If authenticated and authorized, render the children components
  return children;
};

// --- HomeRedirect Component ---
// This component determines where to redirect the user after initial load or login,
// based on their authentication status and role.
const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading application...</p>
      </div>
    );
  }

  // If authenticated, redirect to the appropriate dashboard/page based on role
  if (isAuthenticated) {
    switch (user?.role) {
      case 'customer':
        return <Navigate to="/menu" replace />; // Customers go to menu
      case 'chef':
        return <Navigate to="/cook-dashboard" replace />;
      case 'owner':
        return <Navigate to="/owner-dashboard" replace />; // Owners go to their dashboard
      default:
        return <Navigate to="/menu" replace />; // Fallback for unknown role, or a generic authenticated home
    }
  }
  // If not authenticated, redirect to the initial authentication choice page
  return <Navigate to="/auth-choice" replace />; // Use a specific path for auth choice
};


function App() {
  // Removed useAuth() call directly in App component, as Navbar will use it internally
  // and other components are wrapped by ProtectedRoute or are public.

  return (
    <Router>
      <AuthProvider> {/* Wrap the entire application with AuthProvider */}
        {/* Navbar should now be rendered inside AuthProvider to access context */}
        <Navbar /> 
        
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
          <Routes>
            {/* Public Routes - accessible to all, regardless of login status */}
            <Route path="/auth-choice" element={<AuthChoicePage />} /> {/* New explicit path for auth choice */}
            <Route path="/phone" element={<PhoneLogin />} />
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<Menu />} /> 
            <Route path="/ordersummary" element={<OrderSummary />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/orderconfirmation" element={<OrderConfirmation />} />
            <Route path="/bill" element={<Bill />} /> 
            <Route path="/cart" element={<Menu />} /> 
            {/* Note: OrderStatus, PaymentSuccess, PaymentFailure, FeedbackPage routes might need to be defined here if public,
                       or within ProtectedRoute if they require authentication. */}

            {/* Protected Routes - require authentication and specific roles */}
            <Route 
              path="/my-orders" 
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CombinedOrdersView />
                </ProtectedRoute>
              } 
            />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer', 'chef', 'owner', 'manager']}><Profile /></ProtectedRoute>} />

            <Route 
              path="/cook-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['chef']}>
                  <CookDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/owner-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Default/Catch-all route: Redirects based on authentication status and role */}
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
