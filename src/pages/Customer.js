// frontend/src/pages/Customer.js
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import Menu from '../components/Menu';
import OrderStatus from '../components/OrderStatus';

const CustomerPage = ({ tableId }) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`/orders/${tableId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [tableId]);

  return (
    <div className="customer-view">
      <h1>Table {tableId} Menu</h1>
      <Menu tableId={tableId} />
      <OrderStatus orders={orders} />
    </div>
  );
};

export default CustomerPage;