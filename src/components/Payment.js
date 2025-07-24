// frontend/src/components/Payment.js
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomAlertDialog from './CustomAlertDialog'; // Import the CustomAlertDialog component

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Ensure all necessary state is safely extracted
  const { totalAmount, tableNumber, selectedItems, note } = location.state || {};

  const [customOrderId, setCustomOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ⭐ NEW STATE FOR ALERT DIALOG
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ⭐ NEW STATE: Flag to prevent multiple Razorpay invocations
  const [isPaymentInitiated, setIsPaymentInitiated] = useState(false);

  // ⭐ Custom alert function using the new component
  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setIsAlertDialogOpen(true);
  };

  const handleCloseAlertDialog = () => {
    setIsAlertDialogOpen(false);
    setAlertMessage('');
  };

  // Redirect if critical data is missing
  useEffect(() => {
    // Console log to trace this effect's execution
    console.log("Payment.js - useEffect [totalAmount, ...] triggered.");
    if (!totalAmount || !tableNumber || !selectedItems || selectedItems.length === 0) {
      console.warn("Payment.js - Missing order details, redirecting.");
      showCustomAlert("Missing order details! Redirecting to Order Summary.");
      // Use a timeout to allow the alert to be seen before navigating
      setTimeout(() => navigate("/order-summary"), 1500);
    }
  }, [totalAmount, tableNumber, selectedItems, navigate]);

  // Load Razorpay SDK
  useEffect(() => {
    console.log("Payment.js - useEffect [loadRazorpay] triggered.");
    const loadRazorpay = () => {
      // Prevent multiple script injections if this effect somehow re-runs
      if (document.getElementById('razorpay-sdk-script')) {
        console.log("Razorpay SDK script already exists.");
        return;
      }

      const script = document.createElement("script");
      script.id = 'razorpay-sdk-script'; // Add an ID to easily check its presence
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => console.log("✅ Razorpay SDK Loaded");
      script.onerror = () => {
        setError("Failed to load Razorpay SDK. Please check your internet connection.");
        showCustomAlert("Failed to load Razorpay SDK. Try again later.");
      };
      document.body.appendChild(script);
    };

    // Only load if not already loaded and not being navigated away
    if (!isAlertDialogOpen && (totalAmount && tableNumber && selectedItems && selectedItems.length > 0)) {
        loadRazorpay();
    }

    // Cleanup function: important to remove dynamically added scripts if component unmounts
    return () => {
        const script = document.getElementById('razorpay-sdk-script');
        if (script && script.parentNode) {
            script.parentNode.removeChild(script);
        }
    };
  }, [isAlertDialogOpen, totalAmount, tableNumber, selectedItems]); // Add dependencies to ensure correct re-evaluation

  const handlePayment = async () => {
    console.log("handlePayment called.");

    // ⭐ PREVENT DOUBLE PAYMENT INITIATION
    if (isPaymentInitiated) {
      console.log("Payment already initiated, blocking.");
      return;
    }

    if (!window.Razorpay) {
      setError("Razorpay SDK not available. Try again later.");
      showCustomAlert("Razorpay SDK failed to load. Try again later.");
      return;
    }

    if (!totalAmount || totalAmount <= 0) { // Check totalAmount specifically
      setError("Total amount must be greater than zero to proceed with payment.");
      showCustomAlert("Total amount must be greater than zero to proceed with payment.");
      return;
    }

    const phoneNumber = localStorage.getItem('phoneNumber');
    if (!phoneNumber) {
      setError('Phone number not found. Please log in again.');
      showCustomAlert("Phone number not found. Please log in again to proceed with payment.");
      setLoading(false);
      // Give time for the alert to show, then navigate
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setLoading(true);
    setError(null);
    setIsPaymentInitiated(true); // ⭐ Set flag to true immediately

    try {
      console.log("Calling backend to create Razorpay order...");
      const response = await axios.post(`${API_BASE_URL}/api/payment/create-order`, {
        phoneNumber: phoneNumber,
        amount: totalAmount,
        tableNumber: tableNumber,
        selectedItems: selectedItems,
        note: note,
      });

      if (!response.data.success) {
        setError(response.data.error || "Order creation failed!");
        showCustomAlert(`Order creation failed: ${response.data.error || "Unknown error"}`);
        setLoading(false);
        setIsPaymentInitiated(false); // Reset flag on failure
        return;
      }

      const razorpayOrderId = response.data.orderId;
      const customFormattedOrderId = response.data.customOrderId;

      setCustomOrderId(customFormattedOrderId);
      console.log("✅ Razorpay Order ID:", razorpayOrderId);
      console.log("✅ Custom Formatted Order ID:", customFormattedOrderId);

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: totalAmount * 100, // Amount in paisa
        currency: "INR",
        name: "QR Menu Payment",
        description: `Order for Table No: ${tableNumber} (Order ID: ${customFormattedOrderId})`, // Include custom order ID
        order_id: razorpayOrderId,
        handler: async function (res) {
          console.log("✅ Razorpay Payment Successful Callback:", res);
          // Important: Razorpay handler might be called even if the component unmounts quickly.
          // Ensure your backend verification is robust.

          try {
            console.log("Calling backend to verify payment signature...");
            const verificationResponse = await axios.post(`${API_BASE_URL}/api/payment/verify-payment`, {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              customOrderId: customFormattedOrderId,
            });

            if (verificationResponse.data.success) {
              console.log("✅ Payment successful and verified!");
              showCustomAlert(`Payment successful and verified! Payment ID: ${res.razorpay_payment_id}`);

              // Navigate after a short delay to allow alert to be seen
              setTimeout(() => {
                navigate("/orderConfirmation", {
                  state: {
                    orderId: customFormattedOrderId,
                    selectedItems,
                    totalAmount,
                    tableNo: tableNumber,
                    note: note
                  },
                });
              }, 1000); // 1 second delay
            } else {
              console.error("❌ Payment verification failed on backend:", verificationResponse.data.error);
              setError(verificationResponse.data.error || "Payment verification failed!");
              showCustomAlert(`Payment verification failed! Please contact support. Error: ${verificationResponse.data.error || "Unknown"}`);
            }
          } catch (verificationError) {
            console.error("❌ Payment verification API error:", verificationError.response?.data || verificationError);
            setError("Payment verification failed on server. Please contact support.");
            showCustomAlert("Payment verification failed. Please contact support.");
          } finally {
            setLoading(false);
            setIsPaymentInitiated(false); // Reset flag
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: phoneNumber,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error("❌ Razorpay Payment Failed:", response.error.code, response.error.description);
        setError(`Payment failed: ${response.error.description || "Unknown error"}`);
        showCustomAlert(`Payment failed: ${response.error.description || "Please try again."}`);
        setLoading(false);
        setIsPaymentInitiated(false); // Reset flag on failure
      });
      rzp.on('payment.modal.closed', function () {
        console.log("Razorpay modal closed without completing payment.");
        setLoading(false);
        setIsPaymentInitiated(false); // Reset flag if modal is closed
      });

      rzp.open();
      // Razorpay's own popup will handle closing/errors, so no need to setLoading(false) here yet.

    } catch (apiError) {
      console.error("❌ Payment initiation API error:", apiError.response?.data || apiError);
      setError(apiError.response?.data?.error || "Payment processing error. Try again.");
      showCustomAlert(`Payment processing error: ${apiError.response?.data?.error || "Unknown error"}. Try again.`);
    } finally {
      setLoading(false); // This ensures loading is false if an error occurs before Razorpay opens
      // setIsPaymentInitiated is handled in specific success/failure paths or in rzp.on('payment.modal.closed')
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">💳 Payment</h2>
      <p className="text-lg text-gray-600 mb-2">Total Amount: ₹{totalAmount?.toFixed(2)}</p>
      {customOrderId && (
        <p className="text-md text-gray-500 mb-4">Your Order ID: {customOrderId}</p>
      )}
      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}
      <button
        onClick={handlePayment}
        disabled={loading || isPaymentInitiated || !window.Razorpay || !totalAmount || totalAmount <= 0}
        className="bg-green-600 text-white px-6 py-2 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing Payment..." : (isPaymentInitiated ? "Opening Payment..." : "Proceed to Pay")}
      </button>

      {/* Render the CustomAlertDialog component */}
      <CustomAlertDialog
        message={alertMessage}
        isOpen={isAlertDialogOpen}
        onClose={handleCloseAlertDialog}
      />
    </div>
  );
};

export default Payment;
