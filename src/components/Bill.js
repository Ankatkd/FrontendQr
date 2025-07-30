import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Bill = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract order details from location.state
  // These details should ideally come from the CombinedOrdersView or similar history page
  const {
    orderId,
    tableNumber,
    items, // This should be an array of item objects
    totalAmount, // This is the final amount including GST and any discounts
    createdAt,
    note,
    paymentStatus,
    cookStatus
  } = location.state?.order || {}; // Access the 'order' property from state

  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const GST_RATE = 0.18; // 18% GST

  useEffect(() => {
    if (items && Array.isArray(items)) {
      const calculatedSubtotal = items.reduce((sum, item) => {
        // Ensure item.price and item.quantity are numbers
        const price = parseFloat(item.price);
        const quantity = parseFloat(item.quantity);
        return sum + (isNaN(price) || isNaN(quantity) ? 0 : price * quantity);
      }, 0);
      setSubtotal(calculatedSubtotal);

      // Calculate GST based on the subtotal.
      // Note: If totalAmount already includes GST, then GST_RATE is applied differently.
      // Assuming totalAmount is the final amount and we need to back-calculate GST.
      const calculatedGst = totalAmount / (1 + GST_RATE) * GST_RATE;
      setGstAmount(calculatedGst);
    } else {
      setSubtotal(0);
      setGstAmount(0);
    }
  }, [items, totalAmount]);

  // Handle cases where order data is missing
  if (!orderId || !items || !totalAmount) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Order Details Not Found!</h2>
        <p className="text-gray-700 mb-6">It seems like there was an issue loading the order information.</p>
        <button
          onClick={() => navigate('/orders')}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-all shadow-md"
        >
          Go to Order History
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto p-6 bg-white rounded-lg shadow-xl max-w-2xl mt-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-6">Your Bill</h2>

      {/* Order Summary Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg font-semibold text-gray-800">Order ID:</p>
          <span className="text-xl font-bold text-indigo-600">{orderId}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-lg font-semibold text-gray-800">Table Number:</p>
          <span className="text-xl font-bold text-red-600">{tableNumber || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-gray-700 text-sm">
          <p>Ordered On:</p>
          <span>{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-gray-700 text-sm">
          <p>Payment Status:</p>
          <span className={`font-semibold ${paymentStatus === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>{paymentStatus || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-gray-700 text-sm">
          <p>Cook Status:</p>
          <span className={`font-semibold ${cookStatus === 'Served' ? 'text-purple-600' : 'text-blue-600'}`}>{cookStatus || 'N/A'}</span>
        </div>
        {note && (
          <div className="mt-4 p-3 bg-yellow-100 rounded-md border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-800">Special Request:</p>
            <p className="text-sm text-yellow-700 italic">{note}</p>
          </div>
        )}
      </div>

      {/* Items List */}
      <div className="bg-gray-100 p-6 rounded-lg mb-6 max-h-80 overflow-y-auto custom-scrollbar">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Items Ordered:</h3>
        {items.length === 0 ? (
          <p className="text-gray-600 italic">No items found for this order.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between items-center border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.img || `https://placehold.co/60x60/E0E0E0/333333?text=${item.name.charAt(0)}`}
                    alt={item.name}
                    className="w-16 h-16 rounded-md object-cover shadow-sm"
                  />
                  <div>
                    <p className="text-lg font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">₹{parseFloat(item.price).toFixed(2)} x {parseFloat(item.quantity)}</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-700">₹{(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Total Calculation */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center py-1">
          <p className="text-lg text-gray-700">Subtotal:</p>
          <p className="text-lg font-semibold text-gray-800">₹{subtotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between items-center py-1">
          <p className="text-lg text-gray-700">GST ({GST_RATE * 100}%):</p>
          <p className="text-lg font-semibold text-gray-800">₹{gstAmount.toFixed(2)}</p>
        </div>
        <div className="border-t border-gray-300 mt-4 pt-4 flex justify-between items-center">
          <p className="text-2xl font-bold text-green-700">Grand Total:</p>
          <p className="text-2xl font-extrabold text-green-700">₹{parseFloat(totalAmount).toFixed(2)}</p>
        </div>
      </div>

      {/* Quote/Thank You Message */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center border border-blue-200">
        <p className="text-xl font-semibold text-blue-800 mb-3">
          "Thank you for choosing us! We hope you enjoyed your meal."
        </p>
        <p className="text-md text-blue-700 italic">
          Your satisfaction is our priority. Visit us again soon!
        </p>
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/orders')}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-all shadow-md"
        >
          Back to Order History
        </button>
      </div>
    </motion.div>
  );
};

export default Bill;
