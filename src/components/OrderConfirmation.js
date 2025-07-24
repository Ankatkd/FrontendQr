// src/components/OrderConfirmation.js

import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Safely extract state, providing default values
  const {
    selectedItems = [],
    orderId = "N/A",      // This is your custom YYMMDDXXX ID
    totalAmount = 0,      // Added for display
    note = "No special requests", // Note from OrderSummary
    tableNo = "N/A"       // Table number from OrderSummary
  } = location.state || {};

  return (
    <motion.div
      className="container mx-auto p-6 bg-white rounded-lg shadow-lg text-center max-w-2xl mt-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-4xl font-extrabold text-green-700 mb-4">🎉 Order Confirmed!</h2>
      <p className="text-xl text-gray-700 mb-6">Your delicious food is being prepared! 🍽️</p>

      {/* Order Details */}
      <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
        <div className="mt-2 text-xl font-semibold text-gray-800 flex justify-between items-center">
          Order ID: <span className="text-blue-600 font-bold">{orderId}</span>
        </div>
        <div className="mt-2 text-xl font-semibold text-gray-800 flex justify-between items-center">
          Table No: <span className="text-red-600 font-bold">{tableNo}</span>
        </div>
        <div className="mt-2 text-xl font-semibold text-gray-800 flex justify-between items-center">
          Total Paid: <span className="text-green-600 font-bold">₹{totalAmount.toFixed(2)}</span>
        </div>
      </div>


      {/* Selected Items */}
      <div className="bg-gray-100 p-4 rounded-lg mt-4 max-h-64 overflow-y-auto custom-scrollbar">
        {selectedItems.length === 0 ? (
          <p className="text-gray-600 italic">No items selected for this order.</p>
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

      {/* Note to Chef */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-lg font-semibold text-gray-800 mb-2">📝 Note to Chef:</p>
        <p className="text-gray-700 italic">{note || "No special requests"}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
        <motion.button
          onClick={() => navigate("/Menu")} // Assuming your main menu route is /Menu
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all hover:bg-blue-700 shadow-md"
          whileHover={{ scale: 1.05, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Menu 🔄
        </motion.button>

        <motion.button
          onClick={() => navigate(`/order-status/${orderId}`, { state: { orderId, tableNo } })} // Pass orderId and tableNo to status page
          className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all hover:bg-green-700 shadow-md"
          whileHover={{ scale: 1.05, boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.2)" }}
          whileTap={{ scale: 0.95 }}
        >
          Track Order 🚚
        </motion.button>
      </div>
    </motion.div>
  );
};

export default OrderConfirmation;