import React, { createContext, useState, useContext, useEffect } from 'react';
import { getSSOConfig, getCurrentUser, getSSOLoginUrl } from '../services/api';
import { toast } from 'react-toastify';

// Create context
const SSOAuthContext = createContext();

export const SSOAuthProvider = ({ children }) => {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [ssoConfig, setSSOConfig] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load SSO configuration when the component mounts
  useEffect(() => {
    const loadSSOConfig = async () => {
      try {
        const config = await getSSOConfig();
        setSSOConfig(config);
        setIsConfigLoaded(true);
      } catch (error) {
        console.error('Error loading SSO configuration:', error);
        // Set default values if config fails to load
        setSSOConfig({
          enabled: false,
          use_legacy_auth: true,
          providers: []
        });
        setIsConfigLoaded(true);
      }
    };

    loadSSOConfig();
  }, []);

  // Check if the user is already authenticated (stored token)
  useEffect(() => {
    const checkAuth = async () => {
      if (!isConfigLoaded) return;

      // Check if we have a token in localStorage
      const token = localStorage.getItem('sso_token');
      const storedUser = localStorage.getItem('sso_user');
      
      if (token && storedUser) {
        try {
          // Verify the token and get current user
          const currentUser = await getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else {
            // Clear invalid data
            localStorage.removeItem('sso_token');
            localStorage.removeItem('sso_user');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error verifying authentication:', error);
          localStorage.removeItem('sso_token');
          localStorage.removeItem('sso_user');
          setIsAuthenticated(false);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isConfigLoaded]);

  // Login with SSO
  const loginWithSSO = (tokenResponse) => {
    // Save token and user info to localStorage
    localStorage.setItem('sso_token', tokenResponse.access_token);
    localStorage.setItem('sso_user', JSON.stringify(tokenResponse.user));
    
    setUser(tokenResponse.user);
    setIsAuthenticated(true);
    
    return tokenResponse.user;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('sso_token');
    localStorage.removeItem('sso_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Check user permissions
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    
    // Simple permission check based on role
    // In a real app, you would have a more sophisticated permission system
    switch(user.role) {
      case 'admin':
        return true; // Admin has all permissions
      case 'user':
        return ['read', 'run_policy'].includes(permission);
      case 'readonly':
        return permission === 'read';
      default:
        return false;
    }
  };

  // Initialize SSO login process
  const initiateSSOLogin = async (provider) => {
    try {
      setIsLoading(true);
      toast.info(`Attempting SSO login with provider: ${provider}`);
      
      // For demonstration/development without backend SSO endpoints
      // In a real app, this would be replaced with actual API calls
      const mockSSOLoginFlow = (providerId) => {
        // Create a mock token response
        const mockUser = {
          id: 'user-123',
          email: `user@example.com`,
          name: 'Demo User',
          role: 'admin', // You can change this to 'user' or 'readonly' to test different permissions
          provider: providerId
        };
        
        // Store mock token and user info
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJEZW1vIFVzZXIiLCJyb2xlIjoiYWRtaW4ifQ';
        localStorage.setItem('sso_token', mockToken);
        localStorage.setItem('sso_user', JSON.stringify(mockUser));
        
        // Update context state
        setUser(mockUser);
        setIsAuthenticated(true);
        
        // Simulate successful login
        toast.success(`Successfully logged in as ${mockUser.name} (${mockUser.role})`);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      };
      
      try {
        // Try to get the login URL from backend
        const response = await getSSOLoginUrl(provider);
        
        if (response && response.login_url) {
          // Real SSO flow - redirect to the identity provider's login page
          console.log('Redirecting to:', response.login_url);
          toast.info(`Redirecting to identity provider...`);
          window.location.href = response.login_url;
        } else {
          // Fallback to mock flow if login_url is missing
          toast.warning('Using demo SSO login (backend not configured)');
          mockSSOLoginFlow(provider);
        }
      } catch (apiError) {
        console.error('API Error during SSO login:', apiError);
        toast.warning('Backend not available - using demo login');
        
        // Use mock flow when API fails
        mockSSOLoginFlow(provider);
      }
    } catch (error) {
      console.error('Error in initiateSSOLogin:', error);
      toast.error(`SSO login process failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SSOAuthContext.Provider
      value={{
        isConfigLoaded,
        ssoConfig,
        isAuthenticated,
        user,
        isLoading,
        loginWithSSO,
        logout,
        hasPermission,
        initiateSSOLogin
      }}
    >
      {children}
    </SSOAuthContext.Provider>
  );
};

// Custom hook for using the context
export const useSSOAuth = () => {
  const context = useContext(SSOAuthContext);
  if (context === undefined) {
    throw new Error('useSSOAuth must be used within an SSOAuthProvider');
  }
  return context;
};

export default SSOAuthContext;
