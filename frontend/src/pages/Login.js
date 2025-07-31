import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAWSCredentials } from '../context/AWSCredentialsContext';
import { useSSOAuth } from '../context/SSOAuthContext';
import { validateAWSCredentials } from '../services/api';
import { toast } from 'react-toastify';

const Login = () => {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAWSCredentials } = useAWSCredentials();
  const { ssoConfig, initiateSSOLogin, isAuthenticated } = useSSOAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!accessKey || !secretKey) {
        throw new Error('Access Key and Secret Key are required');
      }

      const awsCredentials = {
        access_key: accessKey, // Changed to match backend schema
        secret_key: secretKey, // Changed to match backend schema
        region: 'us-east-1', // Default region
        session_token: sessionToken || undefined
      };

      try {
        // Validate the credentials with the backend
        await validateAWSCredentials(awsCredentials);
        
        // Set credentials in context (keep original format for frontend context)
        setAWSCredentials({
          accessKey,
          secretKey,
          region: awsCredentials.region,
          sessionToken: sessionToken || undefined
        });
        
        toast.success('AWS credentials validated successfully');
        navigate('/dashboard');
      } catch (apiError) {
        console.error('AWS validation error:', apiError);
        toast.error(`AWS validation failed: ${apiError.message || 'Invalid credentials'}`);
        throw new Error('Invalid AWS credentials');
      }
    } catch (error) {
      toast.error(`Login failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = (provider) => {
    initiateSSOLogin(provider);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Cloud Custodian UI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage and monitor your AWS resources
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* AWS Credentials Login Form */}
          {(!ssoConfig || ssoConfig.use_legacy_auth) && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Login with AWS Credentials
              </h3>
              <form onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="accessKey" className="block text-sm font-medium text-gray-700">
                    Access Key
                  </label>
                  <div className="mt-1">
                    <input
                      id="accessKey"
                      name="accessKey"
                      type="text"
                      required
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700">
                    Secret Key
                  </label>
                  <div className="mt-1">
                    <input
                      id="secretKey"
                      name="secretKey"
                      type="password"
                      required
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="sessionToken" className="block text-sm font-medium text-gray-700">
                    Session Token (optional)
                  </label>
                  <div className="mt-1">
                    <input
                      id="sessionToken"
                      name="sessionToken"
                      type="password"
                      value={sessionToken}
                      onChange={(e) => setSessionToken(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isLoading ? 'Validating...' : 'Login'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* SSO Login Options */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Login with Single Sign-On
            </h3>
            <div className="space-y-3">
              {/* Show status of SSO config for debugging */}
              <div className="text-sm text-gray-500 mb-4">
                SSO Config Status: {ssoConfig ? 'Loaded' : 'Not Loaded'}
                {ssoConfig && (
                  <>
                    <br />
                    SSO Enabled: {ssoConfig.enabled ? 'Yes' : 'No'}
                    <br />
                    Providers: {ssoConfig.providers ? ssoConfig.providers.length : '0'} 
                  </>
                )}
              </div>
              
              {/* Fallback buttons if config isn't working properly */}
              <button
                onClick={() => handleSSOLogin('azure')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Azure AD
              </button>
              <button
                onClick={() => handleSSOLogin('okta')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Okta
              </button>
              <button
                onClick={() => handleSSOLogin('aws')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                AWS SSO
              </button>
              
              {/* Dynamic providers if config loaded properly */}
              {ssoConfig && ssoConfig.enabled && ssoConfig.providers && ssoConfig.providers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Configured Providers:</h4>
                  {ssoConfig.providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleSSOLogin(provider.id)}
                      className="w-full flex justify-center py-2 px-4 mt-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
