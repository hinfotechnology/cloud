import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
import { getPolicy, runPolicy, dryRunPolicy } from '../services/api';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('yaml', yaml);

const PolicyRunPage = () => {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const { credentials } = useAWSCredentials();
  
  const [policy, setPolicy] = useState(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPolicy = async () => {
      setIsLoadingPolicy(true);
      setError(null);
      
      try {
        const policyData = await getPolicy(policyId);
        setPolicy(policyData);
      } catch (err) {
        setError(err.message || 'Failed to fetch policy');
        toast.error(`Error fetching policy: ${err.message}`);
      } finally {
        setIsLoadingPolicy(false);
      }
    };
    
    fetchPolicy();
  }, [policyId]);
  
  const handleRunPolicy = async (dryrun = false) => {
    if (!credentials) {
      toast.error('No AWS credentials available. Please log in again.');
      navigate('/');
      return;
    }
    
    if (dryrun) {
      setIsDryRunning(true);
    } else {
      setIsRunning(true);
    }
    
    setError(null);
    setResult(null);
    
    try {
      const result = dryrun 
        ? await dryRunPolicy(policyId, credentials)
        : await runPolicy(policyId, credentials);
      
      setResult(result);
      
      if (result.success) {
        toast.success(`Policy ${dryrun ? 'dry run' : 'execution'} completed successfully!`);
      } else {
        toast.error(`Policy ${dryrun ? 'dry run' : 'execution'} failed: ${result.message}`);
      }
    } catch (err) {
      setError(err.message || `Failed to ${dryrun ? 'dry run' : 'run'} policy`);
      toast.error(`Error ${dryrun ? 'dry running' : 'running'} policy: ${err.message}`);
    } finally {
      if (dryrun) {
        setIsDryRunning(false);
      } else {
        setIsRunning(false);
      }
    }
  };
  
  if (isLoadingPolicy) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error && !policy) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading policy</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Policy Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{policy?.name}</h1>
          <p className="mt-2 text-sm text-gray-700">
            {policy?.description}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
          <button
            onClick={() => handleRunPolicy(true)}
            disabled={isDryRunning || isRunning}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isDryRunning ? 'Dry Running...' : 'Dry Run'}
          </button>
          <button
            onClick={() => handleRunPolicy(false)}
            disabled={isDryRunning || isRunning}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Policy'}
          </button>
        </div>
      </div>
      
      {/* Policy metadata */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Policy Details
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {policy?.id}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Resource Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {policy?.resource_type}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Category
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                {policy?.category}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Policy YAML */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Policy Definition</h3>
        <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-lg">
          <SyntaxHighlighter language="yaml" style={docco} showLineNumbers={true} wrapLines={true} customStyle={{ padding: '1rem' }}>
            {policy?.content || ''}
          </SyntaxHighlighter>
        </div>
      </div>
      
      {/* Policy Execution Results */}
      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900">
            Execution Results
            {result.success && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                Success
              </span>
            )}
            {!result.success && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                Failed
              </span>
            )}
          </h3>
          
          <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <p className="text-sm text-gray-500">
                {result.message}
              </p>
              
              {result.resources_count !== undefined && (
                <p className="mt-2 text-sm text-gray-700">
                  Found {result.resources_count} matching resources
                </p>
              )}
            </div>
            
            {result.resources && result.resources.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                  Matching Resources ({Math.min(result.resources.length, 100)} of {result.resources_count} shown)
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(result.resources[0]).slice(0, 5).map((key) => (
                          <th 
                            key={key}
                            scope="col" 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.resources.map((resource, index) => (
                        <tr key={index}>
                          {Object.entries(resource).slice(0, 5).map(([key, value]) => (
                            <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {typeof value === 'object' 
                                ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
                                : String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.resources_count > 100 && (
                  <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500">
                    Showing first 100 resources. {result.resources_count - 100} more not shown.
                  </div>
                )}
              </div>
            )}
            
            {result.errors && result.errors.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-3 bg-gray-50 text-sm font-medium text-gray-500">
                  Errors
                </div>
                <div className="px-4 py-5 sm:px-6">
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyRunPage;
