import React, { useState, useEffect } from 'react';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
import { getResourceSummary } from '../services/api';
import ServiceCostChart from '../components/ServiceCostChart';
import { toast } from 'react-toastify';

const ServiceCostsPage = () => {
  // State is set but currently not used directly in the component
  // It's here for future use when implementing additional features
  // eslint-disable-next-line no-unused-vars
  const [serviceSummary, setServiceSummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState(['ec2', 's3', 'rds']);
  const { credentials } = useAWSCredentials();
  
  useEffect(() => {
    const fetchServiceSummary = async () => {
      if (!credentials) return;
      
      setIsLoading(true);
      try {
        const result = await getResourceSummary(credentials);
        
        // Convert the object to an array of services
        const servicesArray = Object.entries(result).map(([key, value]) => ({
          id: key,
          name: key.toUpperCase(),
          count: value.count || 0
        }));
        
        setServiceSummary(servicesArray);
      } catch (error) {
        console.error("Error fetching service summary:", error);
        toast.error('Failed to load service summary');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceSummary();
  }, [credentials]);
  
  const handleServiceToggle = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };
  
  const serviceOptions = [
    { id: 'ec2', name: 'EC2 Instances' },
    { id: 's3', name: 'S3 Storage' },
    { id: 'rds', name: 'RDS Databases' },
    { id: 'lambda', name: 'Lambda Functions' },
    { id: 'ebs', name: 'EBS Volumes' },
    { id: 'cloudwatch', name: 'CloudWatch' },
    { id: 'dynamodb', name: 'DynamoDB' }
  ];
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Service Usage Costs</h1>
        <p className="text-gray-600">
          View and analyze your AWS service costs over different time periods
        </p>
      </div>
      
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <h2 className="text-lg font-medium mb-3">Select Services to View</h2>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map(service => (
            <button
              key={service.id}
              onClick={() => handleServiceToggle(service.id)}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedServices.includes(service.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedServices.map(serviceId => (
            <ServiceCostChart 
              key={serviceId}
              service={serviceId}
              title={serviceOptions.find(s => s.id === serviceId)?.name || serviceId.toUpperCase()}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceCostsPage;
