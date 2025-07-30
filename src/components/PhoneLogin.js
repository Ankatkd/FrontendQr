import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../context/AuthContext'; // Import useAuth
import "../styles/PhoneLogin.css"; // Assuming this CSS file is still needed

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const PhoneLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from AuthContext

  const sendOtp = async () => {
    setErrorMessage("");
    setLoading(true);
    if (phone.length !== 10) {
      setErrorMessage("Enter a valid 10-digit phone number!");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-otp`, {
        phoneNumber: phone,
      });

      if (response.data.success) {
        setIsOtpSent(true);
        setErrorMessage("OTP has been sent to your phone number. Please check your SMS.");
      } else {
        setErrorMessage(response.data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "An error occurred while requesting OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setErrorMessage("");
    setLoading(true);

    if (!otp) {
      setErrorMessage("Please enter the OTP.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        phoneNumber: phone,
        otp: otp,
      });

      if (response.data.success) {
        // OTP is verified. Now use the token and user data from the response.
        // The backend's verify-otp endpoint now returns token and user data.
        login(response.data.user, response.data.token); // Use AuthContext's login

        // Explicitly navigate based on the user's role
        const userRole = response.data.user.role;
        setErrorMessage("OTP verified successfully! Redirecting..."); // Keep message for a moment
        switch (userRole) {
          case 'customer':
            navigate('/Menu', { replace: true });
            break;
          case 'chef':
            navigate('/cook-dashboard', { replace: true });
            break;
          case 'owner':
            navigate('/owner-dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } else {
        // If OTP verification failed, check if it's because the user needs to set a password
        // This logic might need refinement based on your backend's exact `verify-otp` response for existing users without passwords.
        // For now, if OTP is invalid, it's just invalid.
        setErrorMessage(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      // If the backend indicates a user doesn't have a password and needs to set one
      if (error.response?.status === 400 && error.response?.data?.message === "User needs to set password") { // Example custom message from backend
        setShowPasswordFields(true);
        setErrorMessage("OTP verified. Please set your password.");
      } else {
        setErrorMessage(error.response?.data?.message || "An error occurred while verifying OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmission = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // This endpoint now handles both registration and password updates
      const response = await axios.post(`${API_BASE_URL}/api/auth/register-or-update`, {
        phoneNumber: phone,
        password: password,
      });

      if (response.data.success) {
        // Use AuthContext's login function
        login(response.data.user, response.data.token);

        // Explicitly navigate based on the user's role
        const userRole = response.data.user.role;
        setErrorMessage("Account created/updated successfully! Redirecting..."); // Keep message for a moment
        switch (userRole) {
          case 'customer':
            navigate('/Menu', { replace: true });
            break;
          case 'chef':
            navigate('/cook-dashboard', { replace: true });
            break;
          case 'owner':
            navigate('/owner-dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } else {
        setErrorMessage(response.data.message || "Failed to save user details.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "An error occurred while setting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        backgroundImage: `url("https://png.pngtree.com/thumb_back/fh260/background/20240425/pngtree-top-desk-with-blur-restaurant-background-wooden-table-image_15665383.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: "brightness(1.1)",
      }}
    >
      <div className="relative z-10 bg-white bg-opacity-90 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-4">Phone Login / Registration</h2>

        {errorMessage && <p className="text-red-500 mb-2 text-sm">{errorMessage}</p>}

        {!isOtpSent ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md shadow-sm"
            />
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        ) : showPasswordFields ? (
          <form onSubmit={handlePasswordSubmission} className="space-y-4">
            <input
              type="password"
              placeholder="Set your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md shadow-sm"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Set Password"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border rounded-md shadow-sm"
            />
            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-indigo-600 hover:underline font-medium"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default PhoneLogin;
