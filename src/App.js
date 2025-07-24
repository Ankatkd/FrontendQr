// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Menu from "./components/Menu";
import CombinedOrdersView from './components/CombinedOrdersView';
import OrderStatus from "./components/OrderStatus";
import Login from "./components/Login";
import OrderSummary from "./components/OrderSummary";
import Payment from "./components/Payment";
import OrderConfirmation from "./components/OrderConfirmation";
import PhoneLogin from "./components/PhoneLogin";
import AuthChoicePage from "./components/AuthChoicePage";
import Profile from './components/Profile';
import CookDashboard from './components/cookDashboard';

// Import Owner-specific components
import MonthlySalesReport from './components/MonthlySalesReport';
import DailySalesReport from './components/DailySalesReport';
import PopularItemsReport from './components/PopularItemsReport';
import TransactionsReport from "./components/TransactionsReport";
import UserFeedback from './components/Feedback';


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // State to store user's role

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole');
    if (token) {
      setLoggedIn(true);
      setUserRole(storedRole);
    }
  }, []);

  const handleLoginSuccess = (role) => {
    setLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('phoneNumber');
    setLoggedIn(false);
    setUserRole(null);
    window.location.href = '/'; // Full refresh to clear all state and go to AuthChoicePage
  };

  const AppRoutes = () => {
    const navigate = useNavigate();

    useEffect(() => {
      // This useEffect primarily handles redirection if a logged-in user
      // somehow lands on an unauthorized path or needs to be steered to their default dashboard.
      if (loggedIn && userRole) {
        if (userRole === 'chef') {
          // If a chef is not on their dashboard, redirect them
          if (!window.location.pathname.startsWith('/cook-dashboard')) {
            navigate('/cook-dashboard', { replace: true });
          }
        } else if (userRole === 'owner') {
           // ✅ FIX: Ensure owner always goes to daily-sales if not already on an owner report page
           if (!window.location.pathname.startsWith('/owner/')) {
             navigate('/owner/daily-sales', { replace: true }); // Default owner landing page
           }
        }
        else if (userRole === 'customer') {
          // If a customer is on restricted pages, redirect to Menu
          if (window.location.pathname.startsWith('/cook-dashboard') || window.location.pathname.startsWith('/owner/')) {
            navigate('/Menu', { replace: true });
          }
        }
      } else if (!loggedIn && window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/phone') {
        // If not logged in and not on a public auth page, redirect to auth choice
        navigate('/', { replace: true });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loggedIn, userRole, navigate]);


    return (
      <Routes>
        {/* Public Routes / Initial choice */}
        <Route path="/" element={<AuthChoicePage />} />
        <Route path="/phone" element={<PhoneLogin onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

        {/* All application routes are defined here. */}
        <Route path="/Menu" element={<Menu />} /> 
        <Route path="/orders" element={<CombinedOrdersView />} /> 
        <Route path="/status" element={<OrderStatus />} />
        <Route path="/ordersummary" element={<OrderSummary />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/orderconfirmation" element={<OrderConfirmation />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cook-dashboard" element={<CookDashboard />} /> 
        
        {/* Owner-specific Routes */}
        <Route path="/owner/monthly-sales" element={<MonthlySalesReport />} />
        <Route path="/owner/daily-sales" element={<DailySalesReport />} />
        <Route path="/owner/popular-items" element={<PopularItemsReport />} />
        <Route path="/owner/transactions" element={<TransactionsReport />} />
        <Route path="/owner/feedback" element={<UserFeedback />} />

        {/* Fallback route for any unmatched paths (e.g., 404 or unauthorized access attempt) */}
        <Route path="*" element={
          loggedIn ? (
            userRole === 'customer' ? <Menu /> :
            (userRole === 'chef' ? <CookDashboard /> :
            (userRole === 'owner' ? <DailySalesReport /> : <AuthChoicePage />)) 
          ) : <AuthChoicePage />
        } />
      </Routes>
    );
  };

  return (
    <Router>
      {loggedIn && <Navbar loggedIn={loggedIn} onLogout={handleLogout} userRole={userRole} />} 
      
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
