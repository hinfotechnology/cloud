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

// Add JWT token to requests if available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('sso_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AWS Service API calls
export const validateAWSCredentials = async (credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post('/aws/validate-credentials', formattedCredentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getResourceSummary = async (credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post('/aws/resources/summary', formattedCredentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getResources = async (service, credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post(`/aws/resources/${service}`, formattedCredentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getResourceTags = async (service, credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post(`/aws/resources/${service}/tags`, formattedCredentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getServiceCost = async (service, credentials, period = null) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    if (period) {
      const response = await apiClient.post(`/aws/cost/${service}/${period}`, formattedCredentials);
      return response.data;
    } else {
      const response = await apiClient.post(`/aws/cost/${service}`, formattedCredentials);
      return response.data;
    }
  } catch (error) {
    throw handleApiError(error);
  }
};

// Enhanced AWS feature details
export const getAwsFeatureDetails = async (service, credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post(`/aws/resources/${service}/details`, formattedCredentials);
    return response.data;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error(`Error fetching ${service} details:`, error);
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

// Get all available Cloud Custodian policies with details
export const getAllPoliciesWithDetails = async () => {
  try {
    const response = await apiClient.get('/policies/with-details');
    return response.data;
  } catch (error) {
    console.error('Error fetching policies with details:', error);
    throw handleApiError(error);
  }
};

// Custodian API calls
export const runPolicy = async (policyId, credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post(`/custodian/run/${policyId}`, formattedCredentials);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const dryRunPolicy = async (policyId, credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post(`/custodian/dryrun/${policyId}`, formattedCredentials);
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

// Get AWS service-specific resources with pagination
export const getPaginatedResources = async (service, credentials, nextToken = null, limit = 20) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const params = { limit };
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    const response = await apiClient.post(`/aws/resources/${service}/paginated`, formattedCredentials, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching paginated ${service} resources:`, error);
    throw handleApiError(error);
  }
};

// Get available AWS services
export const getAvailableAWSServices = async (credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post('/aws/services', formattedCredentials);
    return response.data;
  } catch (error) {
    console.error('Error fetching available AWS services:', error);
    throw handleApiError(error);
  }
};

// Get policy compliance status
export const getPolicyCompliance = async (policyId, credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post(`/custodian/compliance/${policyId}`, formattedCredentials);
    return response.data;
  } catch (error) {
    console.error(`Error fetching compliance for policy ${policyId}:`, error);
    throw handleApiError(error);
  }
};

// Get all policy compliance status
export const getAllPoliciesCompliance = async (credentials) => {
  try {
    // Make sure credentials match the backend schema
    const formattedCredentials = {
      access_key: credentials.access_key || credentials.accessKey,
      secret_key: credentials.secret_key || credentials.secretKey,
      region: credentials.region || 'us-east-1',
      session_token: credentials.session_token || credentials.sessionToken
    };
    
    const response = await apiClient.post('/custodian/compliance', formattedCredentials);
    return response.data;
  } catch (error) {
    console.error('Error fetching compliance for all policies:', error);
    throw handleApiError(error);
  }
};

// Create a custom policy
export const createPolicy = async (policyData) => {
  try {
    const response = await apiClient.post('/policies', policyData);
    return response.data;
  } catch (error) {
    console.error('Error creating policy:', error);
    throw handleApiError(error);
  }
};

// Update an existing policy
export const updatePolicy = async (policyId, policyData) => {
  try {
    const response = await apiClient.put(`/policies/${policyId}`, policyData);
    return response.data;
  } catch (error) {
    console.error(`Error updating policy ${policyId}:`, error);
    throw handleApiError(error);
  }
};

// Delete a policy
export const deletePolicy = async (policyId) => {
  try {
    const response = await apiClient.delete(`/policies/${policyId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting policy ${policyId}:`, error);
    throw handleApiError(error);
  }
};

// Get resource schemas for policy creation
export const getResourceSchemas = async () => {
  try {
    const response = await apiClient.get('/custodian/schemas/resources');
    return response.data;
  } catch (error) {
    console.error('Error fetching resource schemas:', error);
    throw handleApiError(error);
  }
};

// Get filter schemas for policy creation
export const getFilterSchemas = async () => {
  try {
    const response = await apiClient.get('/custodian/schemas/filters');
    return response.data;
  } catch (error) {
    console.error('Error fetching filter schemas:', error);
    throw handleApiError(error);
  }
};

// Get action schemas for policy creation
export const getActionSchemas = async () => {
  try {
    const response = await apiClient.get('/custodian/schemas/actions');
    return response.data;
  } catch (error) {
    console.error('Error fetching action schemas:', error);
    throw handleApiError(error);
  }
};

// Helper function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const serverError = error.response.data;
    console.error('Server Error:', serverError);
    
    let errorMessage = serverError.detail || 'An error occurred with the API.';
    
    // For AWS specific errors, provide more context
    if (errorMessage.includes('AccessDenied') || errorMessage.includes('InvalidClientTokenId')) {
      errorMessage = 'AWS access denied. Please check your credentials and permissions.';
    } else if (errorMessage.includes('UnauthorizedOperation')) {
      errorMessage = 'Your AWS credentials do not have permission to access this resource.';
    } else if (errorMessage.includes('ResourceNotFoundException')) {
      errorMessage = 'The requested AWS resource was not found.';
    }
    
    return {
      message: errorMessage,
      status: error.response.status,
      data: serverError,
      awsError: true
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network Error - No Response:', error.request);
    return {
      message: 'No response from server. Please check your network connection.',
      status: 0,
      data: null,
      networkError: true
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request Setup Error:', error.message);
    return {
      message: error.message || 'An unexpected error occurred.',
      status: 0,
      data: null,
      clientError: true
    };
  }
};

// SSO Authentication API calls
export const getSSOConfig = async () => {
  try {
    const response = await apiClient.get('/auth/sso/config');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getSSOLoginUrl = async (provider) => {
  try {
    const response = await apiClient.post('/auth/sso/login', { provider });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const exchangeSSOToken = async (code, provider) => {
  try {
    const response = await apiClient.post('/auth/sso/token', { code, provider });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('sso_token');
    if (!token) {
      return null;
    }
    
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('sso_token');
      localStorage.removeItem('sso_user');
      return null;
    }
    throw handleApiError(error);
  }
};

// End of API functions
