import React, { useState, useEffect } from 'react';
import { getServiceCost } from '../services/api';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer
} from 'recharts';

// Removed unused imports: PieChart, Pie, Cell
// Removed unused constant: COLORS

const ServiceCostChart = ({ service, title }) => {
  const [costData, setCostData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [activePeriod, setActivePeriod] = useState('1m');
  const { credentials } = useAWSCredentials();
  
  useEffect(() => {
    const fetchCostData = async () => {
      if (!credentials) return;
      
      setIsLoading(true);
      try {
        const result = await getServiceCost(service, credentials, activePeriod);
        setCostData(result);
      } catch (error) {
        console.error("Error fetching cost data:", error);
        toast.error(`Failed to load cost data for ${service}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCostData();
  }, [service, credentials, activePeriod]);
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const renderBarChart = () => {
    if (!costData || !costData[activePeriod] || !costData[activePeriod].data_points) {
      return <div className="text-center text-gray-500">No cost data available</div>;
    }
    
    const data = costData[activePeriod].data_points.map(point => ({
      date: point.start_date,
      cost: parseFloat(point.cost)
    }));
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
          <YAxis tickFormatter={value => formatCurrency(value)} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="cost" name="Cost" fill="#0088FE" />
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title || service.toUpperCase()} Cost Analysis</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActivePeriod('1m')}
            className={`px-3 py-1 text-sm rounded ${
              activePeriod === '1m' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            1 Month
          </button>
          <button
            onClick={() => setActivePeriod('3m')}
            className={`px-3 py-1 text-sm rounded ${
              activePeriod === '3m' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => setActivePeriod('6m')}
            className={`px-3 py-1 text-sm rounded ${
              activePeriod === '6m' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            6 Months
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {costData[activePeriod] && (
            <div className="mb-4 text-right">
              <span className="text-gray-500">Total Cost: </span>
              <span className="text-xl font-semibold">
                {formatCurrency(costData[activePeriod].total_cost || 0)}
              </span>
            </div>
          )}
          {renderBarChart()}
        </div>
      )}
    </div>
  );
};

export default ServiceCostChart;
