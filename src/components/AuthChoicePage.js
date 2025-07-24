import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AuthChoicePage = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/phone');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div
      className="w-screen h-screen bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white font-serif drop-shadow-md">
            Welcome to BEST Restaurant
          </h1>
          <p className="text-yellow-300 italic mt-2 text-xl">
            "An Invitation to Exquisite Flavors"
          </p>
        </div>

        {/* Card Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl w-full px-4">
          {/* Register Card */}
          <motion.div
            onClick={handleRegisterClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white bg-opacity-95 rounded-lg shadow-2xl p-6 flex flex-col items-center cursor-pointer hover:shadow-yellow-600 transition"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/747/747545.png"
              alt="Register"
              className="w-24 h-24 mb-4"
            />
            <h2 className="text-2xl font-bold text-yellow-700 mb-2">Register with Phone</h2>
            <p className="text-gray-700 text-center">
              New here? Join us and explore our culinary world.
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            onClick={handleLoginClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white bg-opacity-95 rounded-lg shadow-2xl p-6 flex flex-col items-center cursor-pointer hover:shadow-yellow-600 transition"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
              alt="Login"
              className="w-24 h-24 mb-4"
            />
            <h2 className="text-2xl font-bold text-yellow-700 mb-2">Existing Customer Login</h2>
            <p className="text-gray-700 text-center">
              Already a customer? Access your account now.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthChoicePage;
