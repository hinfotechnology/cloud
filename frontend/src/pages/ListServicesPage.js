import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAWSCredentials } from '../context/AWSCredentialsContext';

const ListServicesPage = () => {
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { credentials } = useAWSCredentials();

  useEffect(() => {
    if (!credentials) {
      setError('No AWS credentials found.');
      setLoading(false);
      return;
    }
    if (!credentials.region) {
      setError('AWS region is missing in credentials.');
      setLoading(false);
      return;
    }
    axios({
      method: 'post',
      url: 'http://localhost:8000/api/aws/terraform/resources',
      data: {
        region: credentials.region,
        access_key: credentials.accessKey,
        secret_key: credentials.secretKey
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('Terraform response:', res.data);
        setResources(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Terraform error:', err);
        setError(err.message + (err.response?.data ? ` | ${JSON.stringify(err.response.data)}` : ''));
        setLoading(false);
      });
  }, [credentials]);

  if (loading) return <div>Loading AWS services/resources from Terraform...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>AWS Services/Resources (via Terraform)</h1>
      <pre>{JSON.stringify(resources, null, 2)}</pre>
    </div>
  );
};

export default ListServicesPage;
