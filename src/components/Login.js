import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from AuthContext

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        phoneNumber,
        password,
      });

      if (response.data.success) {
        // Use the login function from AuthContext to set global state and localStorage
        login(response.data.user, response.data.token);

        // Explicitly navigate based on the user's role
        const userRole = response.data.user.role;
        switch (userRole) {
          case 'customer':
            navigate('/menu', { replace: true }); // Redirect customer to Menu
            break;
          case 'chef':
            navigate('/cook-dashboard', { replace: true }); // Redirect chef to Cook Dashboard
            break;
          case 'owner':
            navigate('/owner-dashboard', { replace: true }); // Redirect owner to Owner Dashboard
            break;
          default:
            navigate('/', { replace: true }); // Fallback to home/auth choice
        }
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex items-center justify-center relative brightness-110"
      style={{
        backgroundImage: "url('/LoginBack.avif')",
      }}
    >
      {/* Optional: Light overlay */}
      <div className="absolute inset-0 bg-black opacity-10 z-0"></div>

      {/* Login Card */}
      <div className="relative z-10 bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
          Customer Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 9999999999"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 ease-in-out transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <button
            onClick={() => navigate('/phone')}
            className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
          >
            Forgot Password?
          </button>
        </p>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/phone')}
            className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
