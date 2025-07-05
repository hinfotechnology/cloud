import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create an Axios instance with base URL and default headers
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// AWS Service API calls
export const validateAWSCredentials = async (credentials) => {
  try {
    const response = await apiClient.post('/aws/validate-credentials', credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getResourceSummary = async (credentials) => {
  try {
    const response = await apiClient.post('/aws/resources/summary', credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getResources = async (service, credentials) => {
  try {
    const response = await apiClient.post(`/aws/resources/${service}`, credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getResourceTags = async (service, credentials) => {
  try {
    const response = await apiClient.post(`/aws/resources/${service}/tags`, credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getServiceCost = async (service, credentials) => {
  try {
    const response = await apiClient.post(`/aws/cost/${service}`, credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Policies API calls
export const getPolicies = async () => {
  try {
    const response = await apiClient.get('/policies');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPolicy = async (policyId) => {
  try {
    const response = await apiClient.get(`/policies/${policyId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPolicyCategories = async () => {
  try {
    const response = await apiClient.get('/policies/categories');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Custodian API calls
export const runPolicy = async (policyId, credentials) => {
  try {
    const response = await apiClient.post(`/custodian/run/${policyId}`, credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const dryRunPolicy = async (policyId, credentials) => {
  try {
    const response = await apiClient.post(`/custodian/dryrun/${policyId}`, credentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPolicyOutput = async (jobId) => {
  try {
    const response = await apiClient.get(`/custodian/outputs/${jobId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const serverError = error.response.data;
    return {
      message: serverError.detail || 'An error occurred with the API.',
      status: error.response.status,
      data: serverError
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      message: 'No response from server. Please check your network connection.',
      status: 0,
      data: null
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      message: error.message || 'An unexpected error occurred.',
      status: 0,
      data: null
    };
  }
};
