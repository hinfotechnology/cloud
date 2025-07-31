import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SSOCallback from './pages/SSOCallback';
import Layout from './components/Layout';
import ResourcesPage from './pages/ResourcesPage';
import PoliciesPage from './pages/PoliciesPage';
import PolicyRunPage from './pages/PolicyRunPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ServiceCostsPage from './pages/ServiceCostsPage';
import { useAWSCredentials } from './context/AWSCredentialsContext';
import { useSSOAuth } from './context/SSOAuthContext';
import ListServicesPage from './pages/ListServicesPage';

function App() {
  const { credentials } = useAWSCredentials();
  const { isAuthenticated } = useSSOAuth();
  
  // Route protection based on AWS credentials or SSO authentication
  const ProtectedRoute = ({ children }) => {
    return credentials || isAuthenticated ? children : <Navigate to="/" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/auth/callback" element={<SSOCallback />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/resources" element={
        <ProtectedRoute>
          <Layout>
            <ResourcesPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/resources/:service/:id" element={
        <ProtectedRoute>
          <Layout>
            <ResourceDetailPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/policies" element={
        <ProtectedRoute>
          <Layout>
            <PoliciesPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/policies/:policyId/run" element={
        <ProtectedRoute>
          <Layout>
            <PolicyRunPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/service-costs" element={
        <ProtectedRoute>
          <Layout>
            <ServiceCostsPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/listservices" element={
        <ProtectedRoute>
          <Layout>
            <ListServicesPage />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
