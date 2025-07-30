import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client'; // Import Socket.IO client
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import CustomAlertDialog from './CustomAlertDialog'; // Import the custom alert dialog

// Base URL for your API, typically from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
// Base URL for your Socket.IO server, typically the same as your API
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || "http://localhost:5000";

const CookDashboard = () => {
    // Destructure authentication state and functions from AuthContext
    const { user, isAuthenticated, loading: authLoading, token, logout } = useAuth();

    // State to hold orders relevant to the chef (Pending, Preparing, Ready)
    const [orders, setOrders] = useState([]);
    // State for component-specific loading indicators
    const [loading, setLoading] = useState(true);
    // State for error messages
    const [error, setError] = useState('');
    // State for custom alert dialog
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [alertDialogMessage, setAlertDialogMessage] = useState('');
    const [orderToCancel, setOrderToCancel] = useState(null); // Store order for cancellation confirmation

    // Initialize Socket.IO connection
    // This connection is persistent for the component's lifecycle
    // Pass token for backend authentication
    const socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'], // Prioritize websocket, fallback to polling
        auth: {
            token: token // Use token from AuthContext
        }
    });

    // Function to fetch orders from the backend
    // Using useCallback to memoize the function and prevent unnecessary re-renders/effect triggers
    const fetchOrders = useCallback(async () => {
        setLoading(true); // Set component-specific loading true when fetching starts
        setError(''); // Clear any previous errors
        
        // Ensure token is available before making the request
        if (!token) {
            setError('Authentication token not found. Please log in.');
            setLoading(false);
            logout(); // Force logout if token is missing
            return;
        }

        try {
            // Make GET request to fetch verified orders for the chef
            // This endpoint should return orders that are 'Pending', 'Preparing', or 'Ready'
            const response = await axios.get(`${API_BASE_URL}/api/order/verified`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Attach token for authorization
                },
            });
            if (response.data && response.data.success) { // Assuming a 'success' field in the response
                // Filter and sort orders to display only relevant ones (Pending, Preparing, Ready)
                // These status names must match the backend ENUM exactly.
                const relevantOrders = response.data.orders.filter(order => // Access .orders array
                    ['Pending', 'Preparing', 'Ready'].includes(order.cookStatus)
                );
                // Sort orders by creation date (newest first)
                relevantOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(relevantOrders); // Update the orders state
            } else {
                setError(response.data.message || 'Failed to fetch orders.'); // Set error if backend indicates failure
            }
        } catch (err) {
            console.error('Error fetching orders:', err); // Log the full error for debugging
            // If 401, token might be invalid, force logout
            if (err.response?.status === 401) {
                logout(); 
            }
            setError(err.response?.data?.message || 'An error occurred while fetching orders.'); // Set user-friendly error message
        } finally {
            setLoading(false); // Set component-specific loading false when fetching completes
        }
    }, [token, logout]); // Dependency array: re-run effect if token or logout changes

    // Effect hook for setting up Socket.IO listeners and initial data fetch
    useEffect(() => {
        // Wait until AuthContext has finished its loading check and user is authenticated
        if (authLoading || !isAuthenticated) {
            return;
        }

        fetchOrders(); // Fetch orders on component mount (after auth is ready)

        // Socket.IO 'connect' event listener
        socket.on('connect', () => {
            console.log('Connected to Socket.IO server as Chef!');
        });

        // Socket.IO 'newOrder' event listener
        // This handles new orders coming in real-time
        socket.on('newOrder', (newOrder) => {
            console.log('New order received:', newOrder);
            // Only add if the order is in a status relevant to the chef
            if (['Pending', 'Preparing', 'Ready'].includes(newOrder.cookStatus)) {
                setOrders(prevOrders => {
                    // Check if the order already exists to prevent duplicates
                    // Use orderId from backend for uniqueness check
                    const exists = prevOrders.some(order => order.orderId === newOrder.orderId);
                    if (!exists) {
                        // Show a toast notification for the new order
                        toast.info(`New Order! Order ID: ${newOrder.orderId}`, { autoClose: 3000 });
                        const updatedOrders = [newOrder, ...prevOrders]; // Add new order to the beginning
                        updatedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Re-sort
                        return updatedOrders;
                    }
                    return prevOrders; // Return previous state if order already exists
                });
            }
        });

        // Socket.IO 'orderUpdated' event listener
        // This handles status changes for existing orders in real-time
        socket.on('orderUpdated', (updatedOrder) => {
            console.log('Order updated:', updatedOrder);
            setOrders(prevOrders => {
                const updatedList = prevOrders.map(order =>
                    // If the updated order matches an existing one, replace it
                    order.orderId === updatedOrder.orderId ? updatedOrder : order
                ).filter(order =>
                    // Filter out orders that are no longer relevant to the chef's view
                    // (i.e., 'Served' or 'Cancelled' orders should be removed from the active list)
                    ['Pending', 'Preparing', 'Ready'].includes(order.cookStatus)
                );

                // Provide toast notifications based on status changes
                if (!['Pending', 'Preparing', 'Ready'].includes(updatedOrder.cookStatus) && prevOrders.some(order => order.orderId === updatedOrder.orderId)) {
                    // If an order moved out of the chef's view (e.g., completed or cancelled)
                    toast.success(`Order ${updatedOrder.orderId} is ${updatedOrder.cookStatus}. Removed from list.`, { autoClose: 3000 });
                } else if (prevOrders.some(order => order.orderId === updatedOrder.orderId) && ['Preparing', 'Ready'].includes(updatedOrder.cookStatus)) {
                    // If an order's status changed to preparing or ready
                    toast.info(`Order ${updatedOrder.orderId} is now ${updatedOrder.cookStatus}!`, { autoClose: 3000 });
                } else if (['Pending'].includes(updatedOrder.cookStatus) && !prevOrders.some(order => order.orderId === updatedOrder.orderId)) {
                    // If a new 'Pending' order arrives and wasn't there before
                    toast.info(`New pending order ${updatedOrder.orderId}.`, { autoClose: 3000 });
                    updatedList.push(updatedOrder); // Add it to the list
                }

                updatedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Re-sort the list
                return updatedList; // Return the updated list
            });
        });

        // Socket.IO 'disconnect' event listener
        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server.');
            toast.warn('Disconnected from real-time order updates. Please refresh if issues persist.', { autoClose: 5000 });
        });

        // Socket.IO 'error' event listener
        socket.on('error', (err) => {
            console.error('Socket.IO error:', err);
            toast.error('Real-time update error. Check console for details.', { autoClose: 5000 });
        });

        // Cleanup function: disconnect socket when component unmounts
        return () => {
            socket.disconnect();
        };
    }, [fetchOrders, isAuthenticated, authLoading]); // Dependency array: re-run effect if fetchOrders, isAuthenticated, or authLoading changes

    // Function to update an order's status via API call
    const updateStatus = async (orderId, newStatus) => {
        setLoading(true); // Indicate component-specific loading state
        setError(''); // Clear errors
        
        if (!token) {
            setError('Authentication token not found. Please log in.');
            setLoading(false);
            logout();
            return;
        }

        try {
            // Make PUT request to update order status
            // Use the orderId from the backend for the URL parameter
            const response = await axios.put(`${API_BASE_URL}/api/order/${orderId}/status`,
                { cookStatus: newStatus }, // Send new status
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Attach token for authorization
                    },
                }
            );

            if (response.data.success) {
                // Success message using toast
                toast.success(`Order ${orderId} status updated to ${newStatus}!`, { autoClose: 2000 });
                // The state will be updated by the Socket.IO 'orderUpdated' listener,
                // so no direct state manipulation here to ensure consistency.
            } else {
                // Error message from backend
                setError(response.data.message || 'Failed to update order status.');
                toast.error(response.data.message || 'Failed to update order status.');
            }
        } catch (err) {
            console.error('Error updating status:', err); // Log full error
            if (err.response?.status === 401) {
                logout(); 
            }
            setError(err.response?.data?.message || 'An error occurred while updating status.'); // Set user-friendly error
            toast.error(err.response?.data?.message || 'An error occurred while updating status.');
        } finally {
            setLoading(false); // End component-specific loading state
        }
    };

    // Function to handle print for an individual order
    const handlePrintOrder = (order) => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Order Details</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { text-align: center; color: #4CAF50; margin-bottom: 20px; }
            h2 { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px; color: #555; }
            p { margin-bottom: 5px; }
            .item-list { list-style: none; padding: 0; }
            .item-list li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #eee; }
            .item-list li:last-child { border-bottom: none; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #777; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="container">');
        printWindow.document.write('<h1>QR Menu Order Receipt</h1>');
        printWindow.document.write(`<p><strong>Order ID:</strong> ${order.orderId}</p>`);
        printWindow.document.write(`<p><strong>Table No:</strong> ${order.tableNumber || 'N/A'}</p>`);
        printWindow.document.write(`<p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>`);
        printWindow.document.write('<h2>Ordered Items</h2>');
        printWindow.document.write('<ul class="item-list">');
        order.items.forEach(item => {
            printWindow.document.write(`<li><span>${item.name}</span><span>x ${item.quantity}</span></li>`);
        });
        printWindow.document.write('</ul>');
        printWindow.document.write('<div class="footer">Thank you for your order!</div>');
        printWindow.document.write('</div></body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    // Helper function to determine status badge color and animation based on status
    const getStatusProps = (status) => {
        switch (status) {
            case 'Pending': return {
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                animation: 'animate-pulse' // Subtle pulse for new orders
            };
            case 'Preparing': return {
                color: 'bg-blue-100 text-blue-800 border-blue-300',
                animation: ''
            };
            case 'Ready': return {
                color: 'bg-green-100 text-green-800 border-green-300',
                animation: 'animate-bounce-once' // A small bounce for "Ready"
            };
            case 'Served': return {
                color: 'bg-purple-100 text-purple-800 border-purple-300',
                animation: ''
            };
            case 'Cancelled': return {
                color: 'bg-red-100 text-red-800 border-red-300',
                animation: ''
            };
            default: return {
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                animation: ''
            };
        }
    };

    // Handle cancel button click (opens confirmation dialog)
    const handleCancelClick = (order) => {
        setOrderToCancel(order);
        setAlertDialogMessage(`Are you sure you want to cancel Order #${order.orderId}? This action cannot be undone.`);
        setIsAlertDialogOpen(true);
    };

    // Confirm cancellation and proceed
    const confirmCancellation = () => {
        if (orderToCancel) {
            updateStatus(orderToCancel.orderId, "Cancelled");
            setOrderToCancel(null); // Clear the order
        }
        setIsAlertDialogOpen(false); // Close the dialog
    };

    // Cancel cancellation (close dialog without action)
    const cancelCancellation = () => {
        setOrderToCancel(null);
        setIsAlertDialogOpen(false);
    };

    // Loading spinner display: Show loading if either component is loading or auth is loading
    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
                <div className="flex items-center space-x-2 text-gray-700">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.062 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xl font-semibold">Loading Orders...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6 sm:p-8 lg:p-12 font-sans">
            {/* ToastContainer for notifications */}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
            
            {/* Custom Alert Dialog for cancellation confirmation */}
            <CustomAlertDialog
                message={alertDialogMessage}
                isOpen={isAlertDialogOpen}
                onClose={cancelCancellation} // Default close action
                onConfirm={confirmCancellation} // New prop for confirmation
                showConfirmButton={true} // Indicate that a confirm button should be shown
            />

            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto border border-gray-200">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                        Chef's Dashboard
                    </h1>
                    {/* Refresh Orders button */}
                    <button
                        onClick={fetchOrders}
                        className="flex items-center px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.121a3 3 0 01.707 2.122L5 10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1h1zm7 0a1 1 0 011 1v2.121a3 3 0 01.707 2.122L12 10a1 1 0 01-1 1h-1a1 1 0 01-1-1V3a1 1 0 011-1h1zm4 0a1 1 0 011 1v2.121a3 3 0 01.707 2.122L16 10a1 1 0 01-1 1h-1a1 1 0 01-1-1V3a1 1 0 011-1h1zm-8 7a1 1 0 011 1v2.121a3 3 0 01.707 2.122L8 17a1 1 0 01-1 1H6a1 1 0 01-1-1v-6a1 1 0 011-1h1zm4 0a1 1 0 011 1v2.121a3 3 0 01.707 2.122L12 17a1 1 0 01-1 1h-1a1 1 0 01-1-1v-6a1 1 0 011-1h1zm4 0a1 1 0 011 1v2.121a3 3 0 01.707 2.122L16 17a1 1 0 01-1 1h-1a1 1 0 01-1-1v-6a1 1 0 011-1h1z" clipRule="evenodd" />
                        </svg>
                        Refresh Orders
                    </button>
                </div>

                {/* Error message display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
                        <strong className="font-bold">Error! </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* Conditional rendering for no orders */}
                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H3a2 2 0 01-2-2zM12 22h4a2 2 0 002-2v-4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-xl font-semibold text-gray-900">No Orders in Kitchen</h3>
                        <p className="mt-1 text-md text-gray-500">All orders are served or there are no new orders at the moment.</p>
                    </div>
                ) : (
                    // Grid layout for displaying orders
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {orders.map((order) => {
                            const statusProps = getStatusProps(order.cookStatus);
                            return (
                                <div key={order.orderId} className="bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 flex flex-col">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                {/* Display Order ID and Table Number */}
                                                <h3 className="text-xl font-bold text-gray-800">Order #{order.orderId}</h3>
                                                <p className="text-md text-gray-600 mt-1">Table No: {order.tableNumber || 'N/A'}</p>
                                                {/* Updated Status badge with animation */}
                                                <p className="text-sm text-gray-500 mt-1">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase border ${statusProps.color} ${statusProps.animation}`}>
                                                        {order.cookStatus || 'Unknown'}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center space-x-2"> {/* Added flex and space-x for icons */}
                                                {/* Print Icon */}
                                                <button
                                                    onClick={() => handlePrintOrder(order)}
                                                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition duration-200"
                                                    title="Print Order"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5 4V2a2 2 0 012-2h6a2 2 0 012 2v2h2a2 2 0 012 2v5a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h2zm0 10v-4a1 1 0 011-1h8a1 1 0 011 1v4a1 1 0 01-1 1H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                                        <path d="M10 12a1 1 0 100-2 1 1 0 000 2z" />
                                                    </svg>
                                                </button>
                                                {/* Delete/Cancel Icon */}
                                                {['Pending', 'Preparing', 'Ready'].includes(order.cookStatus) && (
                                                    <button
                                                        onClick={() => handleCancelClick(order)}
                                                        disabled={loading}
                                                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Cancel Order"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* List of ordered items */}
                                        <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {order.items && order.items.length > 0 ? (
                                                order.items.map((item, index) => (
                                                    <li key={index} className="flex justify-between text-gray-700 border-b border-gray-200 pb-1 last:border-b-0 last:pb-0">
                                                        <span className="font-medium">{item.name}</span>
                                                        {/* Increased quantity text size */}
                                                        <span className="text-base font-semibold">x {item.quantity}</span> 
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-gray-500 text-sm">No items listed.</li>
                                            )}
                                        </ul>

                                        {/* Action buttons for status updates */}
                                        <div className="flex flex-col space-y-3 mt-4"> {/* Increased top margin for buttons */}
                                            {/* "Mark as Preparing" button (Order Received) */}
                                            {order.cookStatus === 'Pending' && (
                                                <button
                                                    onClick={() => updateStatus(order.orderId, "Preparing")}
                                                    disabled={loading}
                                                    className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold text-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                                                >
                                                    Mark as Preparing (Order Received)
                                                </button>
                                            )}

                                            {/* "Mark as Ready" button (Ready to Serve) */}
                                            {order.cookStatus === 'Preparing' && (
                                                <button
                                                    onClick={() => updateStatus(order.orderId, "Ready")}
                                                    disabled={loading}
                                                    className="w-full bg-green-600 text-white py-2 rounded-md font-semibold text-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                                                >
                                                    Mark as Ready (Ready to Serve)
                                                </button>
                                            )}

                                            {/* "Mark as Served" button (Optional, if chef serves) */}
                                            {order.cookStatus === 'Ready' && (
                                                <button
                                                    onClick={() => updateStatus(order.orderId, "Served")}
                                                    disabled={loading}
                                                    className="w-full bg-purple-600 text-white py-2 rounded-md font-semibold text-lg hover:bg-purple-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                                                >
                                                    Mark as Served
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CookDashboard;
