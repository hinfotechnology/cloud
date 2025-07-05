import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPolicies, getPolicyCategories } from '../services/api';
import { toast } from 'react-toastify';
import { 
  ShieldCheckIcon, 
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

const PoliciesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [policies, setPolicies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [policiesData, categoriesData] = await Promise.all([
          getPolicies(),
          getPolicyCategories()
        ]);
        
        setPolicies(policiesData.policies || []);
        setCategories(categoriesData || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch policies');
        toast.error(`Error fetching policies: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPolicies();
  }, []);
  
  // Filter policies based on selected category and search query
  const filteredPolicies = policies.filter(policy => {
    const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory;
    const matchesSearch = policy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         policy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         policy.resource_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  // Group policies by category for display
  const policiesByCategory = filteredPolicies.reduce((acc, policy) => {
    if (!acc[policy.category]) {
      acc[policy.category] = [];
    }
    acc[policy.category].push(policy);
    return acc;
  }, {});
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Cloud Custodian Policies</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse and run policies to manage your AWS resources.
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div className="md:w-2/3">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by name, description, or resource type"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>
      
      {/* Policy List */}
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
                <h3 className="text-sm font-medium text-red-800">Error loading policies</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No policies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No policies match your current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(policiesByCategory).map(([category, categoryPolicies]) => (
              <div key={category} className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">
                    {category}
                  </h3>
                </div>
                <ul className="divide-y divide-gray-200">
                  {categoryPolicies.map((policy) => (
                    <li key={policy.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <p className="ml-3 text-sm font-medium text-blue-600 truncate">
                              {policy.name}
                            </p>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <Link
                              to={`/policies/${policy.id}/run`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Run Policy
                              <ArrowTopRightOnSquareIcon className="ml-1.5 h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              Resource: {policy.resource_type}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {policy.description}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliciesPage;
