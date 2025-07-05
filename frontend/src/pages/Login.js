import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { validateAWSCredentials } from '../services/api';
import { useAWSCredentials } from '../context/AWSCredentialsContext';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAWSCredentials } = useAWSCredentials();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      access_key: '',
      secret_key: '',
      region: 'us-east-1'
    }
  });
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await validateAWSCredentials(data);
      
      if (result.valid) {
        toast.success('AWS credentials validated successfully!');
        setAWSCredentials(data);
        navigate('/dashboard');
      } else {
        toast.error('Invalid AWS credentials. Please check and try again.');
      }
    } catch (error) {
      toast.error(`Authentication failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Cloud Custodian UI
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your AWS credentials to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="access_key" className="block text-sm font-medium text-gray-700">
                AWS Access Key
              </label>
              <div className="mt-1">
                <input
                  id="access_key"
                  type="text"
                  autoComplete="off"
                  {...register('access_key', { required: 'Access Key is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.access_key && (
                  <p className="mt-2 text-sm text-red-600">{errors.access_key.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="secret_key" className="block text-sm font-medium text-gray-700">
                AWS Secret Key
              </label>
              <div className="mt-1">
                <input
                  id="secret_key"
                  type="password"
                  autoComplete="off"
                  {...register('secret_key', { required: 'Secret Key is required' })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.secret_key && (
                  <p className="mt-2 text-sm text-red-600">{errors.secret_key.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                AWS Region
              </label>
              <div className="mt-1">
                <select
                  id="region"
                  {...register('region')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-east-2">US East (Ohio)</option>
                  <option value="us-west-1">US West (N. California)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="eu-central-1">EU (Frankfurt)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Validating...' : 'Connect to AWS'}
              </button>
            </div>
            
            <div className="text-sm text-center text-gray-500">
              <p>
                Credentials are used temporarily and never stored permanently.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
