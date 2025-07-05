import React, { createContext, useContext, useState } from 'react';

// Create the context
const AWSCredentialsContext = createContext();

// Create a hook to use the context
export const useAWSCredentials = () => {
  const context = useContext(AWSCredentialsContext);
  if (!context) {
    throw new Error('useAWSCredentials must be used within an AWSCredentialsProvider');
  }
  return context;
};

// Create the provider component
export const AWSCredentialsProvider = ({ children }) => {
  // State to hold AWS credentials
  const [credentials, setCredentials] = useState(null);
  
  // Function to set credentials
  const setAWSCredentials = (creds) => {
    setCredentials(creds);
  };
  
  // Function to clear credentials
  const clearAWSCredentials = () => {
    setCredentials(null);
  };
  
  // Value object to be provided to consumers
  const value = {
    credentials,
    setAWSCredentials,
    clearAWSCredentials
  };
  
  return (
    <AWSCredentialsContext.Provider value={value}>
      {children}
    </AWSCredentialsContext.Provider>
  );
};
