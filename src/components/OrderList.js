// frontend/src/components/OrderList.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';

const OrderList = () => {
  const [orders, setOrders] = useState([]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`/orders/${orderId}`, { status: newStatus });
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await axios.get('/orders');
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchAllOrders();
  }, []);

  return (
    <div className="order-dashboard">
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <h3>Table {order.tableId}</h3>
          <div className="order-status">
            Status: {order.status}
            <button 
              onClick={() => updateOrderStatus(order.id, 'preparing')}
              disabled={order.status !== 'pending'}
            >
              Start Preparing
            </button>
            <button
              onClick={() => updateOrderStatus(order.id, 'ready')}
              disabled={order.status !== 'preparing'}
            >
              Mark as Ready
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderList;