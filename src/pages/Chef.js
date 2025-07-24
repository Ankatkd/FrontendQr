import React, { useEffect, useState } from "react";
import axios from "axios";

const Chef = () => {
  const [orders, setOrders] = useState([]);

  const fetchVerifiedOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/order/verified");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching verified orders:", err);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await axios.post("http://localhost:5000/api/order/update-status", {
        orderId,
        cookStatus: status,
      });
      alert(`Status updated to: ${status}`);
      fetchVerifiedOrders(); // Refresh list
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  useEffect(() => {
    fetchVerifiedOrders();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Chef Panel - Verified Orders</h2>
      {orders.length === 0 ? (
        <p>No orders in kitchen</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border p-4 rounded shadow">
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>Table No:</strong> {order.tableNumber}</p>
              <p><strong>Status:</strong> {order.cookStatus}</p>
              <div className="space-x-2 mt-2">
                <button
                  onClick={() => updateStatus(order.id, "Order Received")}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Order Received
                </button>
                <button
                  onClick={() => updateStatus(order.id, "Preparing")}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Preparing
                </button>
                <button
                  onClick={() => updateStatus(order.id, "Ready to Serve")}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Ready to Serve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Chef;
