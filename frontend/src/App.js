import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Layout from './components/Layout';
import ResourcesPage from './pages/ResourcesPage';
import PoliciesPage from './pages/PoliciesPage';
import PolicyRunPage from './pages/PolicyRunPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import { useAWSCredentials } from './context/AWSCredentialsContext';

function App() {
  const { credentials } = useAWSCredentials();
  
  // Simple route protection based on credentials
  const ProtectedRoute = ({ children }) => {
    return credentials ? children : <Navigate to="/" replace />;
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
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
    </Routes>
  );
}

export default App;
