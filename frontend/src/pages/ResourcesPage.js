import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
import { getResources, getResourceTags } from '../services/api';
import { toast } from 'react-toastify';

const services = [
  { id: 'ec2', name: 'EC2 Instances' },
  { id: 's3', name: 'S3 Buckets' },
  { id: 'rds', name: 'RDS Instances' },
  { id: 'lambda', name: 'Lambda Functions' }
];

const ResourcesPage = () => {
  const { credentials } = useAWSCredentials();
  const [selectedService, setSelectedService] = useState('ec2');
  const [resources, setResources] = useState([]);
  const [tags, setTags] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState({});
  
  useEffect(() => {
    const fetchResources = async () => {
      if (!credentials) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [resourcesData, tagsData] = await Promise.all([
          getResources(selectedService, credentials),
          getResourceTags(selectedService, credentials)
        ]);
        
        // Handle different resource structures based on service
        switch (selectedService) {
          case 'ec2':
            setResources(resourcesData.instances || []);
            break;
          case 's3':
            setResources(resourcesData.buckets || []);
            break;
          case 'rds':
            setResources(resourcesData.instances || []);
            break;
          case 'lambda':
            setResources(resourcesData.functions || []);
            break;
          default:
            setResources([]);
        }
        
        setTags(tagsData || {});
      } catch (err) {
        setError(err.message || 'Failed to fetch resources');
        toast.error(`Error fetching ${selectedService} resources: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResources();
  }, [credentials, selectedService]);
  
  // Filter resources based on search query and selected tags
  const filteredResources = resources.filter(resource => {
    // Search query filter
    const resourceString = JSON.stringify(resource).toLowerCase();
    const matchesSearch = searchQuery === '' || resourceString.includes(searchQuery.toLowerCase());
    
    // Tags filter
    let matchesTags = true;
    if (Object.keys(selectedTags).length > 0) {
      // Logic depends on the service
      if (selectedService === 'ec2' && resource.tags) {
        for (const [key, value] of Object.entries(selectedTags)) {
          if (!resource.tags[key] || resource.tags[key] !== value) {
            matchesTags = false;
            break;
          }
        }
      }
      // Add tag filtering for other services as needed
    }
    
    return matchesSearch && matchesTags;
  });
  
  // Handle tag selection
  const handleTagSelect = (key, value) => {
    setSelectedTags(prev => {
      const newTags = { ...prev };
      
      // If already selected, remove it
      if (newTags[key] === value) {
        delete newTags[key];
      } else {
        newTags[key] = value;
      }
      
      return newTags;
    });
  };
  
  // Render resource list based on service
  const renderResourceList = () => {
    switch (selectedService) {
      case 'ec2':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instance ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Launch Time
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((instance) => (
                  <tr key={instance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {instance.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instance.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        instance.state === 'running' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instance.public_ip || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(instance.launch_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/resources/ec2/${instance.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 's3':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bucket Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creation Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((bucket) => (
                  <tr key={bucket.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bucket.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bucket.creation_date ? new Date(bucket.creation_date).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/resources/s3/${bucket.name}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'rds':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identifier
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engine
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((instance) => (
                  <tr key={instance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {instance.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instance.engine}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        instance.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instance.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {instance.storage} GB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/resources/rds/${instance.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'lambda':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Function Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Runtime
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memory
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeout
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResources.map((func) => (
                  <tr key={func.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {func.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.runtime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.memory} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.timeout} sec
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {func.last_modified}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/resources/lambda/${func.name}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a service to view resources</p>
          </div>
        );
    }
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">AWS Resources</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your AWS resources across services.
          </p>
        </div>
      </div>
      
      {/* Service tabs */}
      <div className="mt-6 border-b border-gray-200">
        <div className="flex">
          {services.map((service) => (
            <button
              key={service.id}
              className={`py-3 px-6 font-medium text-sm border-b-2 ${
                selectedService === service.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setSelectedService(service.id)}
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filters */}
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <div className="md:w-1/2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedService} resources...`}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        {/* Tag filters - only show for services with tag support */}
        {selectedService === 'ec2' && Object.keys(tags).length > 0 && (
          <div className="md:w-1/2">
            <label className="block text-sm font-medium text-gray-700">
              Filter by Tags
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(tags).map(([key, values]) => (
                values.map(value => (
                  <button
                    key={`${key}:${value}`}
                    onClick={() => handleTagSelect(key, value)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedTags[key] === value
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {key}: {value}
                  </button>
                ))
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Resource list */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4">
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
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || Object.keys(selectedTags).length > 0 
                ? 'No resources match your current filters.' 
                : `No ${selectedService} resources in this account/region.`}
            </p>
          </div>
        ) : (
          renderResourceList()
        )}
      </div>
      
      {/* Result count */}
      {!isLoading && !error && filteredResources.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredResources.length} {selectedService} resources
        </div>
      )}
    </div>
  );
};

export default ResourcesPage;
