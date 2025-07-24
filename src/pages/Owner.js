import React, { useEffect, useState } from "react";
import axios from "axios";

const Owner = () => {
  const [pendingOrders, setPendingOrders] = useState([]);

  // ✅ Fetch orders not verified by manager
  const fetchPendingOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/order/pending-verification");
      setPendingOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // ✅ Verify a selected order
  const verifyOrder = async (orderId) => {
    try {
      await axios.post("http://localhost:5000/api/order/verify", { orderId });
      alert("✅ Order Verified!");
      fetchPendingOrders(); // Refresh the list
    } catch (err) {
      console.error("Error verifying order:", err);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manager Panel - Pending Orders</h2>
      {pendingOrders.length === 0 ? (
        <p>No pending orders to verify.</p>
      ) : (
        <ul className="space-y-4">
          {pendingOrders.map((order) => (
            <li key={order.id} className="border p-4 rounded shadow">
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>Table Number:</strong> {order.tableNumber}</p>
              <p><strong>Total:</strong> ₹{order.totalAmount}</p>
              <button
                className="mt-2 bg-green-600 text-white px-4 py-1 rounded"
                onClick={() => verifyOrder(order.id)}
              >
                ✅ Verify
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Owner;
