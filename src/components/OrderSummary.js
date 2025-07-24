// frontend/src/components/OrderSummary.js
import React, { useState, useEffect, useCallback, useRef } from "react"; // Added useCallback and useRef
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from 'axios';
import CustomAlertDialog from './CustomAlertDialog';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const OrderSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedItems: initialSelectedItems } = location.state || {};

  const [selectedItems, setSelectedItems] = useState(initialSelectedItems || []);
  const [tableNumber, setTableNumber] = useState('');
  const [note, setNote] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const GST_RATE = 0.18;

  const [couponCode, setCouponCode] = useState('');
  const [discountedAmount, setDiscountedAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponAppliedSuccessfully, setCouponAppliedSuccessfully] = useState(false);

  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // ⭐ Removed isNavigating state, using debounce/throttle directly instead.
  // We will now rely on the debounce mechanism.
  const navigationTimeoutRef = useRef(null); // Ref to hold the timeout ID

  useEffect(() => {
    const calculatedSubtotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setSubtotal(calculatedSubtotal);

    const calculatedGstAmount = calculatedSubtotal * GST_RATE;
    setGstAmount(calculatedGstAmount);

    const initialCalculatedTotal = calculatedSubtotal + calculatedGstAmount;
    setTotal(initialCalculatedTotal);
    setDiscountedAmount(initialCalculatedTotal);
    setCouponAppliedSuccessfully(false);
    setCouponMessage('');
  }, [selectedItems]);

  // Clean up the timeout if the component unmounts
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setIsAlertDialogOpen(true);
  };

  const handleCloseAlertDialog = () => {
    setIsAlertDialogOpen(false);
    setAlertMessage('');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage('⚠️ Please enter a coupon code!');
      setCouponAppliedSuccessfully(false);
      return;
    }

    setIsApplyingCoupon(true);
    setCouponMessage('');
    setCouponAppliedSuccessfully(false);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/coupons/apply`, {
        couponCode: couponCode.trim(),
        originalAmount: total,
      });

      if (response.data.success) {
        setDiscountedAmount(response.data.finalAmount);
        setCouponMessage(`✅ Coupon Applied! You saved ₹${(total - response.data.finalAmount).toFixed(2)}.`);
        setCouponAppliedSuccessfully(true);
      } else {
        setDiscountedAmount(total);
        setCouponMessage(response.data.message || '❌ Failed to apply coupon.');
        setCouponAppliedSuccessfully(false);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      setDiscountedAmount(total);
      setCouponMessage(error.response?.data?.message || '❌ An error occurred while applying coupon. Try again.');
      setCouponAppliedSuccessfully(false);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // ⭐ Debounced navigation function
  const debouncedProceedToPayment = useCallback(() => {
    console.log("debouncedProceedToPayment called.");

    if (navigationTimeoutRef.current) {
      console.log("Navigation already pending, blocking new call.");
      return;
    }

    if (selectedItems.length === 0) {
      showCustomAlert("⚠️ Please select at least one item before proceeding!");
      return;
    }
    if (!tableNumber) {
      showCustomAlert("⚠️ Please select a table number before proceeding!");
      return;
    }
    if (discountedAmount <= 0) {
      showCustomAlert("⚠️ Total amount must be greater than zero to proceed with payment.");
      return;
    }

    console.log("Initiating navigation after debounce...");
    navigationTimeoutRef.current = setTimeout(() => { // Set a very short timeout for debounce, not for delay
      navigate("/payment", {
        state: {
          selectedItems,
          totalAmount: discountedAmount,
          tableNumber,
          note: note.trim(),
        },
      });
      console.log("Navigation to /payment triggered.");
      navigationTimeoutRef.current = null; // Clear the timeout ref after navigation
    }, 50); // A very short debounce time (e.g., 50ms)
  }, [selectedItems, tableNumber, discountedAmount, note, navigate]);


  if (selectedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800">No items selected! 😕</h2>
        <motion.button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          onClick={() => navigate("/Menu")}
          whileHover={{ scale: 1.05 }}
        >
          Go Back to Menu 🍽️
        </motion.button>
        <CustomAlertDialog
          message={alertMessage}
          isOpen={isAlertDialogOpen}
          onClose={handleCloseAlertDialog}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 bg-white rounded-lg shadow-lg max-w-2xl mt-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">Order Summary</h2>

      <div className="mb-6">
        <label htmlFor="tableNo" className="block text-xl font-semibold text-gray-800 mb-2">
          Select Table No :
        </label>
        <select
          id="tableNo"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-lg"
        >
          <option value="">-- Select Table --</option>
          {[...Array(20)].map((_, i) => (
            <option key={i + 1} value={`Table ${i + 1}`}>
              Table {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="note" className="block text-xl font-semibold text-gray-800 mb-2">
          Special Request :
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows="3"
          placeholder="Enter any special instructions for the chef ..."
          className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-lg"
        ></textarea>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mt-4 mb-6 border border-blue-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Apply Coupon Code:</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Enter coupon code (e.g., WELCOME10, TODAY20)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={isApplyingCoupon || couponAppliedSuccessfully}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={handleApplyCoupon}
            disabled={isApplyingCoupon || couponAppliedSuccessfully}
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplyingCoupon ? 'Applying...' : 'Apply Coupon'}
          </button>
        </div>
        {couponMessage && (
          <p className={`mt-2 text-sm ${couponMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {couponMessage}
          </p>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mt-4 max-h-64 overflow-y-auto custom-scrollbar">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Order:</h3>
        {selectedItems.length === 0 ? (
          <p className="text-gray-600 italic">No items selected.</p>
        ) : (
          selectedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
              <div className="flex items-center space-x-4">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-16 h-16 rounded-md object-cover border border-gray-300"
                />
                <div>
                  <p className="text-lg font-semibold text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{item.price.toFixed(2)} x {item.quantity}</p>
                </div>
              </div>
              <p className="text-gray-700 text-right font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200">
        <div className="flex justify-between py-1">
          <p className="text-lg text-gray-700">Subtotal :</p>
          <p className="text-lg font-semibold text-gray-800">₹{subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between py-1">
          <p className="text-lg text-gray-700">GST ({GST_RATE * 100}%) :</p>
          <p className="text-lg font-semibold text-gray-800">₹{gstAmount.toFixed(2)}</p>
        </div>
        {couponAppliedSuccessfully && discountedAmount < total && (
          <div className="flex justify-between py-1 text-red-600">
            <p className="text-lg">Discount Applied:</p>
            <p className="text-lg font-semibold">-₹{(total - discountedAmount).toFixed(2)}</p>
          </div>
        )}
        <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between">
          <p className="text-2xl font-bold text-green-700">Total :</p>
          {couponAppliedSuccessfully && discountedAmount < total ? (
            <div className="flex flex-col items-end">
              <span className="line-through text-gray-500 text-lg">₹{total.toFixed(2)}</span>
              <span className="text-green-600">₹{discountedAmount.toFixed(2)}</span>
            </div>
          ) : (
            <span>₹{total.toFixed(2)}</span>
          )}
        </div>
      </div>

      <motion.button
        onClick={debouncedProceedToPayment} // ⭐ Use the debounced function here
        className="mt-6 w-full bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-all hover:bg-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.05 }}
        disabled={selectedItems.length === 0 || !tableNumber || discountedAmount <= 0} // Removed isNavigating
      >
        {'Pay to Confirm 💳'}
      </motion.button>

      <CustomAlertDialog
        message={alertMessage}
        isOpen={isAlertDialogOpen}
        onClose={handleCloseAlertDialog}
      />
    </motion.div>
  );
};

export default OrderSummary;
