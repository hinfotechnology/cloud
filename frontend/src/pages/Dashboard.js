import React, { useState, useEffect } from 'react';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
// Removed unused import: useSSOAuth
import { getResourceSummary } from '../services/api';
import SSOStatus from '../components/SSOStatus';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { credentials } = useAWSCredentials();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!credentials) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getResourceSummary(credentials);
        setSummary(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch resource summary');
        toast.error(`Error fetching resource summary: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSummary();
  }, [credentials]);

  // Prepare chart data
  const chartData = {
    labels: Object.keys(summary).map(key => key.toUpperCase()),
    datasets: [
      {
        label: 'Resources Count',
        data: Object.values(summary).map(val => val.count || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'AWS Resources by Service',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'AWS Service'
        }
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">AWS Resources Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of your AWS resources across multiple services.
          </p>
        </div>
      </div>

      {/* SSO Authentication Status */}
      <div className="mt-4 px-4 sm:px-6 lg:px-8">
        <SSOStatus />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading resources</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resource chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Resource cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(summary).map(([service, data]) => (
                <div key={service} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {service.toUpperCase()}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {data.count || 0}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      {service === 'ec2' && (
                        <div className="flex justify-between">
                          <span className="text-green-600">{data.running || 0} running</span>
                          <span className="text-gray-500">{data.stopped || 0} stopped</span>
                        </div>
                      )}
                      {data.error && (
                        <span className="text-red-500 text-xs">{data.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
