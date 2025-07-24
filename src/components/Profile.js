// frontend/src/components/Profile.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const Profile = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phoneNumber: '', // This will be pre-filled from localStorage
    alternativeContact: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);

  // Static coupon for 100% completion
  const COMPLETION_COUPON = "WELCOME10"; // 10% off

  useEffect(() => {
    const fetchUserProfile = async () => {
      const phoneNumber = localStorage.getItem('phoneNumber');
      const token = localStorage.getItem('token'); 

      console.log("Profile: Checking localStorage for phoneNumber:", phoneNumber); // DEBUG
      console.log("Profile: Checking localStorage for token:", token); // DEBUG

      if (!phoneNumber) {
        setError('User not logged in. Please log in to view your profile.');
        setLoading(false);
        console.log("Profile: No phoneNumber found in localStorage, redirecting to login."); // DEBUG
        navigate('/login'); 
        return;
      }

      try {
        setLoading(true);
        setError('');
        console.log("Profile: Attempting to fetch profile for:", phoneNumber); // DEBUG
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          params: { phoneNumber }, 
          headers: {
            Authorization: token ? `Bearer ${token}` : '', 
          },
        });

        console.log("Profile: Backend response received:", response.data); // DEBUG

        if (response.data.success) {
          const fetchedData = response.data.user;
          setUserProfile({
            name: fetchedData.name || '',
            email: fetchedData.email || '',
            phoneNumber: fetchedData.phoneNumber || phoneNumber, 
            alternativeContact: fetchedData.alternativeContact || '',
            address: fetchedData.address || '',
          });
          console.log("Profile: User profile state updated:", fetchedData); // DEBUG
        } else {
          setError(response.data.message || 'Failed to fetch profile data.');
          console.error("Profile: Backend reported failure:", response.data.message); // DEBUG
        }
      } catch (err) {
        console.error("Profile: Error fetching profile:", err); // DEBUG
        setError(err.response?.data?.message || 'An error occurred while fetching profile.');
      } finally {
        setLoading(false);
        console.log("Profile: Loading set to false."); // DEBUG
      }
    };

    fetchUserProfile();
  }, [navigate]);

  useEffect(() => {
    const fields = [
      userProfile.name,
      userProfile.email,
      userProfile.alternativeContact,
      userProfile.address
    ];
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    const percentage = (completedFields / fields.length) * 100;
    setProfileCompletion(percentage);
    console.log("Profile: Completion percentage calculated:", percentage); // DEBUG

    if (percentage === 100 && !showCoupon) {
      setCouponCode(COMPLETION_COUPON);
      setShowCoupon(true);
      setError('Congratulations! Your profile is 100% complete. Here\'s a coupon for you!');
      console.log("Profile: 100% complete, showing coupon."); // DEBUG
    } else if (percentage < 100 && showCoupon) {
      setShowCoupon(false);
      setCouponCode('');
      setError('');
      console.log("Profile: Profile incomplete, hiding coupon."); // DEBUG
    }
  }, [userProfile, showCoupon]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prevProfile => ({
      ...prevProfile,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      console.log("Profile: Attempting to update profile with:", userProfile); // DEBUG
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, userProfile, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      console.log("Profile: Backend update response received:", response.data); // DEBUG

      if (response.data.success) {
        setEditMode(false);
        setError('Profile updated successfully!');
        // Re-calculate completion after update
        const fields = [
          response.data.user.name,
          response.data.user.email,
          response.data.user.alternativeContact,
          response.data.user.address
        ];
        const completedFields = fields.filter(field => field && field.trim() !== '').length;
        const percentage = (completedFields / fields.length) * 100;
        setProfileCompletion(percentage);

        if (percentage === 100 && !showCoupon) {
          setCouponCode(COMPLETION_COUPON);
          setShowCoupon(true);
          setError('Congratulations! Your profile is 100% complete. Here\'s a coupon for you!');
        }
      } else {
        setError(response.data.message || 'Failed to update profile.');
        console.error("Profile: Backend reported update failure:", response.data.message); // DEBUG
      }
    } catch (err) {
      console.error("Profile: Error updating profile:", err); // DEBUG
      setError(err.response?.data?.message || 'An error occurred while updating profile.');
    } finally {
      setLoading(false);
      console.log("Profile: Update loading set to false."); // DEBUG
    }
  };

  if (loading && !userProfile.phoneNumber) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">User Profile</h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-gray-700">Profile Completion: {profileCompletion.toFixed(0)}%</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
          </div>
          {showCoupon && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md border border-green-300">
              <p className="font-bold">🎉 Special Offer! 🎉</p>
              <p>Use coupon code: <span className="font-extrabold text-lg tracking-wider">{couponCode}</span> for 10% off your next order!</p>
            </div>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={userProfile.phoneNumber}
              disabled
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={userProfile.name}
              onChange={handleChange}
              disabled={!editMode || loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userProfile.email}
              onChange={handleChange}
              disabled={!editMode || loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="alternativeContact" className="block text-sm font-medium text-gray-700">Alternative Contact</label>
            <input
              type="text"
              id="alternativeContact"
              name="alternativeContact"
              value={userProfile.alternativeContact}
              onChange={handleChange}
              disabled={!editMode || loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              id="address"
              name="address"
              value={userProfile.address}
              onChange={handleChange}
              disabled={!editMode || loading}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            {!editMode ? (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setEditMode(false); setError(''); /* Optionally reset form to original data */ }}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
