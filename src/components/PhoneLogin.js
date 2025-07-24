import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/PhoneLogin.css";

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

  const sendOtp = async () => {
    setErrorMessage("");
    setLoading(true);
    if (phone.length !== 10) {
      setErrorMessage("Enter a valid 10-digit phone number!");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/auth/request-otp", {
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
      const response = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        phoneNumber: phone,
        otp: otp,
      });

      if (response.data.success) {
        const checkUserResponse = await axios.post("http://localhost:5000/api/auth/check-user", {
          phoneNumber: phone,
        });

        if (checkUserResponse.data.exists && checkUserResponse.data.user) {
          localStorage.setItem("phoneNumber", phone);
          localStorage.setItem("userRole", checkUserResponse.data.user.role);

          if (checkUserResponse.data.user.role === "chef") {
            navigate("/cook-dashboard");
          } else if (checkUserResponse.data.user.role === "owner") {
            navigate("/owner/daily-sales");
          } else {
            navigate("/Menu");
          }
        } else {
          setShowPasswordFields(true);
          setErrorMessage("OTP verified. Please set/reset your password.");
        }
      } else {
        setErrorMessage(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "An error occurred while verifying OTP.");
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
      const response = await axios.post("http://localhost:5000/api/auth/register-or-update", {
        phoneNumber: phone,
        password: password,
      });

      if (response.data.success) {
        localStorage.setItem("phoneNumber", phone);
        localStorage.setItem("userRole", response.data.user.role);
        localStorage.setItem("token", response.data.token);

        setErrorMessage("Account created/updated successfully! Redirecting...");
        if (response.data.user.role === "chef") {
          navigate("/cook-dashboard");
        } else if (response.data.user.role === "owner") {
          navigate("/owner/daily-sales");
        } else {
          navigate("/Menu");
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
