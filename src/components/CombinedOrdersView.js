// frontend/src/components/CombinedOrdersView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import moment from 'moment'; // Import moment for date formatting
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || "http://localhost:5000"; // Assuming Socket.IO server is on the same URL

const CombinedOrdersView = () => {
  const navigate = useNavigate();
  // Destructure authentication state and functions from AuthContext
  const { user, isAuthenticated, loading: authLoading, token, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [ongoingOrders, setOngoingOrders] = useState([]);
  const [groupedHistoryOrders, setGroupedHistoryOrders] = useState({}); // State to store history orders grouped by date
  const [loading, setLoading] = useState(true); // Component-specific loading state
  const [error, setError] = useState('');
  const [feedbackForms, setFeedbackForms] = useState({}); // State to manage feedback form data for each order

  // Helper function to categorize and group orders
  const categorizeAndGroupOrders = (allOrders) => {
    const ongoing = [];
    const history = [];
    const groupedHistory = {}; // Object to hold orders grouped by date

    allOrders.forEach(order => {
      // Ensure totalAmount and item prices/quantities are numbers
      const parsedOrder = {
        ...order,
        totalAmount: parseFloat(order.totalAmount),
        items: typeof order.items === 'string' ? JSON.parse(order.items).map(item => ({
            ...item,
            price: parseFloat(item.price),
            quantity: parseFloat(item.quantity)
        })) : order.items
      };

      if (['Pending', 'Preparing', 'Ready'].includes(parsedOrder.cookStatus)) {
        ongoing.push(parsedOrder);
      } else {
        history.push(parsedOrder);
      }
    });

    // Sort history orders by date descending (newest first)
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Group history orders by date
    history.forEach(order => {
      const orderDate = moment(order.createdAt).format('YYYY-MM-DD'); // Format date as YYYY-MM-DD
      if (!groupedHistory[orderDate]) {
        groupedHistory[orderDate] = [];
      }
      groupedHistory[orderDate].push(order);
    });

    setOngoingOrders(ongoing);
    setGroupedHistoryOrders(groupedHistory); // Set the grouped history orders
  };

  // Helper to check if feedback already exists for an order
  const checkFeedbackSubmitted = async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/feedback`, {
        params: { orderId: orderId } 
      });
      return response.data.feedback && response.data.feedback.length > 0;
    } catch (err) {
      console.error(`Error checking feedback status for order ${orderId}:`, err);
      return false; 
    }
  };


  useEffect(() => {
    // Wait until AuthContext has finished its loading check
    if (authLoading) {
      return; 
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated || !user?.phoneNumber) {
      setError('Please log in to view your orders.');
      setLoading(false); // Set component loading to false as we're redirecting
      navigate('/login');
      return;
    }

    // Use phone number from the authenticated user context
    const phoneNumberToFetch = user.phoneNumber;

    const fetchOrders = async () => {
      try {
        setLoading(true); // Start component-specific loading
        setError('');
        
        const response = await axios.get(`${API_BASE_URL}/api/order`, {
          params: { phoneNumber: phoneNumberToFetch },
          headers: {
            Authorization: `Bearer ${token}` // Use token from AuthContext
          }
        });
        
        if (response.data.success) {
          const fetchedOrders = response.data.orders;
          categorizeAndGroupOrders(fetchedOrders);

          const initialFeedbackFormsState = {};
          for (const order of fetchedOrders) {
            if (order.cookStatus === 'Served') {
              const submitted = await checkFeedbackSubmitted(order.orderId);
              initialFeedbackFormsState[order.orderId] = {
                submitted: submitted,
                serviceRating: 0, foodRating: 0, priceRating: 0, timeRating: 0, comment: ''
              };
            }
          }
          setFeedbackForms(initialFeedbackFormsState);

        } else {
          setError(response.data.message || "Failed to fetch orders.");
        }
      } catch (err) {
        console.error("Error fetching orders:", err.response?.data || err.message);
        // If the error is due to unauthorized access (e.g., expired token), force logout
        if (err.response?.status === 401) {
          logout(); // Call logout from AuthContext
        }
        setError(err.response?.data?.message || "An error occurred while fetching orders.");
      } finally {
        setLoading(false); // End component-specific loading
      }
    };

    fetchOrders();

    // Initialize Socket.IO connection with the token for authentication
    const socket = io(SOCKET_SERVER_URL, {
      auth: { token: token }
    }); 

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server from CombinedOrdersView');
    });
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server from CombinedOrdersView');
    });

    socket.on('orderUpdated', (updatedOrder) => { // Listen for 'orderUpdated' event
      // Ensure the update is for the current user's phone number
      if (updatedOrder.phoneNumber === phoneNumberToFetch) { 
        setOrders(prevOrders => { 
          const existingOrderIndex = prevOrders.findIndex(order => order.orderId === updatedOrder.orderId);
          let newAllOrders;
          if (existingOrderIndex > -1) {
            newAllOrders = [...prevOrders];
            newAllOrders[existingOrderIndex] = updatedOrder;
          } else {
            newAllOrders = [...prevOrders, updatedOrder];
          }
          categorizeAndGroupOrders(newAllOrders); // Re-categorize and group on update
          
          if (updatedOrder.cookStatus === 'Served') {
            checkFeedbackSubmitted(updatedOrder.orderId).then(submitted => {
              setFeedbackForms(prevForms => ({
                ...prevForms,
                [updatedOrder.orderId]: {
                  ...prevForms[updatedOrder.orderId],
                  submitted: submitted 
                }
              }));
            });
          }
          return newAllOrders;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [navigate, isAuthenticated, user, authLoading, token, logout]); // Add all relevant dependencies

  // Handle rating changes
  const handleRatingChange = (orderId, category, value) => {
    setFeedbackForms(prevForms => ({
      ...prevForms,
      [orderId]: {
        ...prevForms[orderId],
        [category]: value
      }
    }));
  };

  // Handle comment change
  const handleCommentChange = (orderId, comment) => {
    setFeedbackForms(prevForms => ({
      ...prevForms,
      [orderId]: {
        ...prevForms[orderId],
        comment: comment
      }
    }));
  };

  // Handle feedback submission
  const handleSubmitFeedback = async (orderId) => {
    // Use user.phoneNumber from context
    const feedbackData = feedbackForms[orderId];
    if (!feedbackData || !user?.phoneNumber) return; 

    // Validate ratings
    if (feedbackData.serviceRating === 0 || feedbackData.foodRating === 0 || 
        feedbackData.priceRating === 0 || feedbackData.timeRating === 0) {
        const messageBox = document.createElement('div');
        messageBox.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000;">
                <p>Please provide all ratings (1-5 stars).</p>
                <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 8px 16px; background-color: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
        `;
        document.body.appendChild(messageBox);
        return;
    }

    try {
      // Send feedback to backend with token
      const response = await axios.post(`${API_BASE_URL}/api/feedback`, {
        orderId,
        phoneNumber: user.phoneNumber, // Use phone number from context
        serviceRating: feedbackData.serviceRating,
        foodRating: feedbackData.foodRating,
        priceRating: feedbackData.priceRating,
        timeRating: feedbackData.timeRating,
        comment: feedbackData.comment,
      }, {
        headers: {
          Authorization: `Bearer ${token}` // Use token from AuthContext
        }
      });

      if (response.data.success) {
        setFeedbackForms(prevForms => ({
          ...prevForms,
          [orderId]: { ...prevForms[orderId], submitted: true }
        }));
        const messageBox = document.createElement('div');
        messageBox.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000;">
                <p>Thank you for your feedback!</p>
                <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 8px 16px; background-color: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
        `;
        document.body.appendChild(messageBox);
      } else {
        const messageBox = document.createElement('div');
        messageBox.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000;">
                <p>Failed to submit feedback: ${response.data.message || 'Unknown error'}</p>
                <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 8px 16px; background-color: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
        `;
        document.body.appendChild(messageBox);
      }
    } catch (err) {
      console.error("Error submitting feedback:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        logout(); 
      }
      const messageBox = document.createElement('div');
      messageBox.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 1000;">
                <p>An error occurred: ${err.response?.data?.message || err.message}.</p>
                <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 8px 16px; background-color: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
            </div>
        `;
      document.body.appendChild(messageBox);
    }
  };

  // Show loading state if either component or auth context is loading
  if (loading || authLoading) {
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

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const RatingInput = ({ category, value, onChange, disabled }) => (
    <div className="flex items-center space-x-2">
      <label className="text-gray-700 font-medium capitalize">{category.replace('Rating', ' Rating')}:</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map(star => (
          <label key={star} className="cursor-pointer">
            <input
              type="radio"
              name={category}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              disabled={disabled}
              className="hidden" // Hide default radio button
            />
            <span className={`text-2xl ${value >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-500 transition-colors duration-200`}>
              ★
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  // OrderStatusIndicator Component
  const OrderStatusIndicator = ({ currentStatus }) => {
    // Define the order of statuses for the linear indicator
    const statuses = ['Pending', 'Preparing', 'Ready', 'Served'];
    const statusLabels = {
      'Pending': 'Ordered',
      'Preparing': 'Preparing',
      'Ready': 'Ready',
      'Served': 'Served',
      'Cancelled': 'Cancelled'
    };

    // Determine the index of the current status in the defined sequence
    const currentStatusIndex = statuses.indexOf(currentStatus);

    if (currentStatus === 'Cancelled') {
      return (
        <div className="flex items-center text-red-600 font-semibold text-lg mt-2">
          <span className="mr-2 text-2xl">❌</span> Order Cancelled
        </div>
      );
    }

    return (
      <div className="flex flex-col items-start w-full mt-4 mb-2">
        <h4 className="text-md font-semibold text-gray-800 mb-2">Order Status:</h4>
        <div className="relative flex items-center justify-between w-full h-2"> {/* Added h-2 for the line height */}
          {/* The main progress line (background) */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300 transform -translate-y-1/2 rounded-full"></div>
          {/* Active progress line (foreground) */}
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-green-500 transform -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
          ></div>

          {statuses.map((status, index) => {
            const isCurrent = currentStatusIndex === index;
            const isCompleted = currentStatusIndex > index;
            // Calculate left position for each circle (0% for first, 100% for last, evenly spaced)
            const leftPosition = (index / (statuses.length - 1)) * 100; 

            return (
              <div 
                key={status} 
                className={`absolute flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-500 ease-in-out
                  ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 border-2 border-gray-400'}`}
                // Fixed size w-7 h-7, and absolute positioning with transform to center it on the line
                style={{ left: `${leftPosition}%`, transform: 'translate(-50%, -50%)', width: '28px', height: '28px', top: '50%' }} 
                title={statusLabels[status]}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  // Display a smaller circle for pending/current steps
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
        {/* Status labels below the circles */}
        <div className="flex justify-between w-full mt-5"> {/* Adjusted mt-5 for labels to give more space */}
          {statuses.map((status, index) => {
            const isCurrent = currentStatusIndex === index;
            const isCompleted = currentStatusIndex > index;
            return (
              <div key={status} className={`text-xs text-center flex-1 ${isCompleted ? 'text-green-700 font-semibold' : isCurrent ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}>
                {statusLabels[status]}
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // Get sorted dates for history orders
  const sortedHistoryDates = Object.keys(groupedHistoryOrders).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="min-h-screen bg-gray-100 p-6 pt-20">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Your Orders</h2>

        {/* Ongoing Orders Section */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Ongoing Orders</h3>
        {ongoingOrders.length === 0 ? (
          <p className="text-center text-gray-600 mb-8">No ongoing orders at the moment.</p>
        ) : (
          <div className="space-y-6 mb-10">
            {ongoingOrders.map(order => (
              <div key={order.orderId} className="border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div className="flex-1 mb-4 sm:mb-0">
                    <h3 className="text-xl font-semibold text-gray-800">Order ID: {order.orderId}</h3>
                    <p className="text-gray-600">Table Number: {order.tableNumber}</p>
                    <p className="text-gray-600">Total Amount: ₹{order.totalAmount.toFixed(2)}</p>
                    <p className="text-gray-600">Items: {order.items.map(item => item.name).join(', ')}</p>
                    <p className="text-gray-600 text-sm mt-1">Ordered On: {formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {/* Use the new OrderStatusIndicator for ongoing orders */}
                    <OrderStatusIndicator currentStatus={order.cookStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order History Section */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Order History</h3>
        {sortedHistoryDates.length === 0 ? (
          <p className="text-center text-gray-600">No past orders in history.</p>
        ) : (
          <div className="space-y-8"> {/* Increased space between date groups */}
            {sortedHistoryDates.map(date => (
              <div key={date}>
                <h4 className="text-xl font-bold text-gray-700 mb-4 bg-gray-200 p-3 rounded-md shadow-sm">
                  {moment(date).format('MMMM D, YYYY')} {/* Display human-readable date */}
                </h4>
                <div className="space-y-6">
                  {groupedHistoryOrders[date].map(order => (
                    <div key={order.orderId} className="border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between bg-gray-50">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <div className="flex-1 mb-4 sm:mb-0">
                              <h3 className="text-xl font-semibold text-gray-700">Order ID: {order.orderId}</h3>
                              <p className="text-gray-500">Table Number: {order.tableNumber}</p>
                              <p className="text-gray-500">Total Amount: ₹{order.totalAmount.toFixed(2)}</p>
                              <p className="text-gray-500">Items: {order.items.map(item => item.name).join(', ')}</p>
                              <p className="text-gray-500 text-sm mt-1">Ordered On: {formatDateTime(order.createdAt)}</p>
                          </div>
                          <div className="flex-shrink-0">
                              {/* Use the new OrderStatusIndicator for history orders */}
                              <OrderStatusIndicator currentStatus={order.cookStatus} />
                          </div>
                      </div>

                      {/* Feedback Section - Visible only if order is Served and feedback not yet submitted */}
                      {order.cookStatus === 'Served' && !feedbackForms[order.orderId]?.submitted ? (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="text-lg font-bold text-blue-800 mb-3">Rate your experience!</h4>
                          <div className="space-y-2">
                            <RatingInput 
                              category="serviceRating" 
                              value={feedbackForms[order.orderId]?.serviceRating || 0} 
                              onChange={(val) => handleRatingChange(order.orderId, 'serviceRating', val)} 
                            />
                            <RatingInput 
                              category="foodRating" 
                              value={feedbackForms[order.orderId]?.foodRating || 0} 
                              onChange={(val) => handleRatingChange(order.orderId, 'foodRating', val)} 
                            />
                            <RatingInput 
                              category="priceRating" 
                              value={feedbackForms[order.orderId]?.priceRating || 0} 
                              onChange={(val) => handleRatingChange(order.orderId, 'priceRating', val)} 
                            />
                            <RatingInput 
                              category="timeRating" 
                              value={feedbackForms[order.orderId]?.timeRating || 0} 
                              onChange={(val) => handleRatingChange(order.orderId, 'timeRating', val)} 
                            />
                          </div>
                          <textarea
                            placeholder="Add a comment (optional)"
                            value={feedbackForms[order.orderId]?.comment || ''}
                            onChange={(e) => handleCommentChange(order.orderId, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mt-3 focus:ring-blue-500 focus:border-blue-500"
                            rows="2"
                          ></textarea>
                          <button
                            onClick={() => handleSubmitFeedback(order.orderId)}
                            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-200 ease-in-out"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      ) : order.cookStatus === 'Served' && feedbackForms[order.orderId]?.submitted ? (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-center text-green-800 font-semibold">
                          ✅ Feedback Submitted! Thank you.
                        </div>
                      ) : null}
                      {/* Add View Bill Button for Served Orders */}
                      {order.cookStatus === 'Served' && (
                        <button
                          onClick={() => navigate('/bill', { state: { order: order } })}
                          className="mt-4 w-full bg-purple-600 text-white py-2 rounded-md font-semibold hover:bg-purple-700 transition duration-200 ease-in-out"
                        >
                          View Bill
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedOrdersView;
