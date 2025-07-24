// frontend/src/components/OrderStatus.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client'; // Import socket.io-client

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initial fetch of orders
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${API_BASE_URL}/api/order`);
        if (response.data.success) {
          setOrders(response.data.orders);
        } else {
          setError(response.data.message || "Failed to fetch orders.");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("An error occurred while fetching orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Set up Socket.IO connection
    // Connect to your backend's Socket.IO server
    const socket = io(API_BASE_URL); 

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Listen for order status updates
    socket.on('orderStatusUpdate', (updatedOrder) => {
      console.log('Received real-time update:', updatedOrder);
      setOrders(prevOrders => {
        // Find the updated order and replace it, or add if new
        const existingOrderIndex = prevOrders.findIndex(order => order.orderId === updatedOrder.orderId);
        if (existingOrderIndex > -1) {
          const newOrders = [...prevOrders];
          newOrders[existingOrderIndex] = updatedOrder;
          return newOrders;
        } else {
          // If the order is new (e.g., just placed), add it to the list
          return [...prevOrders, updatedOrder];
        }
      });
    });

    // Clean up socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Order Status</h2>

        {orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders found.</p>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.orderId} className="border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex-1 mb-4 sm:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">Order ID: {order.orderId}</h3>
                  <p className="text-gray-600">Table Number: {order.tableNumber}</p>
                  <p className="text-gray-600">Total Amount: ₹{order.totalAmount}</p>
                  <p className="text-gray-600">Items: {JSON.parse(order.items).map(item => item.name).join(', ')}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold 
                    ${order.cookStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                       order.cookStatus === 'Preparing' ? 'bg-blue-100 text-blue-800' :
                       order.cookStatus === 'Ready' ? 'bg-green-100 text-green-800' :
                       order.cookStatus === 'Served' ? 'bg-purple-100 text-purple-800' :
                       'bg-red-100 text-red-800'}`}>
                    {order.cookStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;
