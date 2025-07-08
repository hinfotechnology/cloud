import React from 'react';
import { useSSOAuth } from '../context/SSOAuthContext';

// Component that displays the current SSO authentication status
const SSOStatus = () => {
  const { isAuthenticated, user } = useSSOAuth();
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">SSO Authentication Active</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>Signed in as {user.name} ({user.email})</p>
            <p className="mt-1">Role: {user.role}</p>
            <p className="mt-1">Provider: {user.provider}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSOStatus;
