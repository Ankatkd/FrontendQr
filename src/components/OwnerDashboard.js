import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('daily-sales'); // Default tab
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState({
    monthlySales: null,
    dailySales: null,
    popularItems: null,
    transactions: null,
    feedback: null,
  });
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD')); // For daily sales filter

  // Function to fetch data for a specific report type
  const fetchData = async (reportType, date = null) => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    let url = '';
    let params = {};

    switch (reportType) {
      case 'monthly-sales':
        url = `${API_BASE_URL}/api/reports/monthly-sales`;
        break;
      case 'daily-sales':
        url = `${API_BASE_URL}/api/reports/daily-sales`;
        params = { date: date || moment().format('YYYY-MM-DD') };
        break;
      case 'transactions':
        url = `${API_BASE_URL}/api/reports/transactions`;
        // The backend's getTodaysTransactions already filters by today,
        // but if you want to filter by selectedDate, you'd add params here.
        // For now, it will fetch transactions for the current day.
        params = { date: date || moment().format('YYYY-MM-DD') };
        break;
      case 'feedback':
        url = `${API_BASE_URL}/api/feedback`;
        break;
      default:
        setError('Invalid report type selected.');
        setLoading(false);
        return;
    }

    try {
      const response = await axios.get(url, {
        params: params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setReportData(prevData => ({
          ...prevData,
          [reportType]: response.data.report || response.data.transactions || response.data.feedback,
        }));
        toast.success(`${reportType.replace('-', ' ')} report loaded!`, { autoClose: 1500 });
      } else {
        setError(response.data.message || `Failed to fetch ${reportType} report.`);
        toast.error(response.data.message || `Failed to fetch ${reportType} report.`);
      }
    } catch (err) {
      console.error(`Error fetching ${reportType} report:`, err);
      setError(err.response?.data?.message || `An error occurred while fetching ${reportType} report.`);
      toast.error(err.response?.data?.message || `An error occurred while fetching ${reportType} report.`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the active tab changes or selectedDate changes for daily reports
  useEffect(() => {
    if (activeTab === 'daily-sales' || activeTab === 'transactions') {
      fetchData(activeTab, selectedDate);
    } else {
      fetchData(activeTab);
    }
  }, [activeTab, selectedDate]); // Added selectedDate as a dependency

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Helper to determine status badge color for feedback
  const getFeedbackStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Reviewed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleUpdateFeedbackRemedy = async (feedbackId, currentRemedy, currentStatus) => {
    const newRemedy = prompt("Enter remedy for this feedback:", currentRemedy || "");
    if (newRemedy !== null) { // If user didn't cancel
      const newStatus = prompt("Enter new status (New, Reviewed, Resolved):", currentStatus || "Reviewed");
      if (newStatus !== null && ['New', 'Reviewed', 'Resolved'].includes(newStatus)) {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.put(`${API_BASE_URL}/api/feedback/${feedbackId}/remedy`,
            { remedy: newRemedy, status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.success) {
            toast.success("Feedback updated successfully!");
            fetchData('feedback'); // Refresh feedback list
          } else {
            toast.error(response.data.message || "Failed to update feedback.");
          }
        } catch (err) {
          console.error("Error updating feedback:", err);
          toast.error(err.response?.data?.message || "An error occurred while updating feedback.");
        } finally {
          setLoading(false);
        }
      } else if (newStatus !== null) {
        toast.error("Invalid status entered. Please use New, Reviewed, or Resolved.");
      }
    }
  };

  const handleGenerateAiRemedy = async (feedbackId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/feedback/${feedbackId}/ai-remedy`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.info("AI remedy generated. Please review and save.", { autoClose: 5000 });
        // Update the specific feedback item in the state with the AI remedy
        setReportData(prevData => ({
          ...prevData,
          feedback: prevData.feedback.map(f =>
            f.id === feedbackId ? { ...f, remedy: response.data.remedy, status: 'Reviewed' } : f
          )
        }));
      } else {
        toast.error(response.data.message || "Failed to generate AI remedy.");
      }
    } catch (err) {
      console.error("Error generating AI remedy:", err);
      toast.error(err.response?.data?.message || "An error occurred while generating AI remedy.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData[activeTab]) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="flex items-center space-x-2 text-gray-700">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.062 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xl font-semibold">Loading Report...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6 sm:p-8 lg:p-12 font-sans">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto border border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 leading-tight text-center mb-8">
          Owner's Dashboard
        </h1>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('daily-sales')}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${activeTab === 'daily-sales' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Daily Sales
          </button>
          <button
            onClick={() => setActiveTab('monthly-sales')}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${activeTab === 'monthly-sales' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Monthly Sales
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${activeTab === 'transactions' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all ${activeTab === 'feedback' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            User Feedback
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading data...</p>
          </div>
        )}

        {/* Report Content */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[400px]">
          {activeTab === 'daily-sales' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Daily Sales Report</h2>
              <div className="mb-4">
                <label htmlFor="reportDate" className="block text-sm font-medium text-gray-700">Select Date:</label>
                <input
                  type="date"
                  id="reportDate"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="mt-1 block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {reportData.dailySales ? (
                <div className="space-y-4">
                  <p className="text-lg"><strong>Date:</strong> {reportData.dailySales.date}</p>
                  <p className="text-lg"><strong>Total Sales Today:</strong> ₹{reportData.dailySales.totalSalesToday}</p>
                  <p className="text-lg"><strong>Number of Transactions Today:</strong> {reportData.dailySales.numberOfTransactionsToday}</p>
                  <p className="text-lg"><strong>Total GST Paid:</strong> ₹{reportData.dailySales.totalGstPaid}</p>

                  <h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Popular Items:</h3>
                  {reportData.dailySales.popularItems && reportData.dailySales.popularItems.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {reportData.dailySales.popularItems.map((item, index) => (
                        <li key={index} className="text-gray-700">{item.name}: {item.quantitySold} units sold</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No popular items data for this date.</p>
                  )}

                  <h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Daily Transactions:</h3>
                  {reportData.dailySales.dailyTransactions && reportData.dailySales.dailyTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.dailySales.dailyTransactions.map((transaction) => (
                            <tr key={transaction.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.customOrderId}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{transaction.totalAmount}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{transaction.gstAmount}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.status}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{moment(transaction.createdAt).format('HH:mm:ss')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No transaction data for this date.</p>
                  )}

                </div>
              ) : (
                <p className="text-gray-600">Select a date to view daily sales report.</p>
              )}
            </div>
          )}

          {activeTab === 'monthly-sales' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Monthly Sales Report</h2>
              {reportData.monthlySales ? (
                <div className="space-y-4">
                  <p className="text-lg"><strong>Month:</strong> {reportData.monthlySales.month}</p>
                  <p className="text-lg"><strong>Total Sales:</strong> ₹{reportData.monthlySales.totalSales}</p>
                  <p className="text-lg"><strong>Number of Transactions:</strong> {reportData.monthlySales.numberOfTransactions}</p>
                  <p className="text-lg"><strong>Total GST Paid:</strong> ₹{reportData.monthlySales.totalGstPaid}</p>

                  <h3 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Daily Breakdown:</h3>
                  {reportData.monthlySales.dailyBreakdown && reportData.monthlySales.dailyBreakdown.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.monthlySales.dailyBreakdown.map((day) => (
                            <tr key={day.date}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{day.date}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{day.dailySales}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{day.dailyTransactionsCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-600">No daily breakdown data for this month.</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Loading monthly sales report...</p>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">All Transactions</h2>
              {reportData.transactions && reportData.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.customOrderId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.phoneNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{transaction.totalAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{transaction.gstAmount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.tableNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{transaction.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{moment(transaction.createdAt).format('YYYY-MM-DD HH:mm:ss')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No transaction data available.</p>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">User Feedback</h2>
              {reportData.feedback && reportData.feedback.length > 0 ? (
                <div className="space-y-6">
                  {reportData.feedback.map((f) => (
                    <div key={f.id} className="bg-white p-5 rounded-lg shadow border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-semibold text-gray-800">Order ID: {f.orderId}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFeedbackStatusColor(f.status)}`}>
                          {f.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2"><strong>Phone:</strong> {f.phoneNumber}</p>
                      <div className="grid grid-cols-2 gap-2 text-gray-600 text-sm mb-3">
                        <p><strong>Service:</strong> {f.serviceRating}/5</p>
                        <p><strong>Food:</strong> {f.foodRating}/5</p>
                        <p><strong>Price:</strong> {f.priceRating}/5</p>
                        <p><strong>Time:</strong> {f.timeRating}/5</p>
                      </div>
                      {f.comment && (
                        <p className="text-gray-700 italic mb-3">"{f.comment}"</p>
                      )}
                      {f.remedy && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-3">
                          <p className="text-blue-800 font-semibold">Remedy/Response:</p>
                          <p className="text-blue-700 text-sm">{f.remedy}</p>
                        </div>
                      )}
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleUpdateFeedbackRemedy(f.id, f.remedy, f.status)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                          disabled={loading}
                        >
                          Update Feedback
                        </button>
                        <button
                          onClick={() => handleGenerateAiRemedy(f.id)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                          disabled={loading}
                        >
                          Generate AI Remedy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No user feedback available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;