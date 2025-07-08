# Cloud Custodian UI

A modern, full-stack web application for interacting with AWS resources and running Cloud Custodian policies through a user-friendly interface.

## Features

- **AWS Integration**: Connect to AWS services using your credentials (never stored permanently)
- **Enterprise SSO Authentication**: Support for Azure AD, Okta, and AWS SSO
- **Role-Based Access Control**: Control access based on user roles from SSO providers
- **Resource Management**: View, filter, and manage resources across multiple AWS services
- **Policy Execution**: Run and monitor Cloud Custodian policies through a clean UI
- **Resource Insights**: Identify unused resources, tag compliance issues, and more
- **Dashboard Views**: Interactive charts and tables for resource visualization
- **Cost Analysis**: View service usage costs for 1, 3, and 6-month periods
- **Session Token Support**: Full support for temporary credentials with session tokens

## Screenshots

*(Placeholder - screenshots would be added here after deployment)*

## Tech Stack

### Frontend
- React
- Tailwind CSS
- Chart.js for visualizations
- React Router for navigation
- Axios for API calls
- Context API for state management

### Backend
- FastAPI (Python)
- Boto3 for AWS interactions
- Cloud Custodian for policy execution
- YAML for policy definitions
- PyJWT for token-based authentication
- OAuth 2.0 for SSO integration

### Deployment
- Docker containers
- Docker Compose for orchestration

## Prerequisites

- Docker and Docker Compose
- AWS Account and credentials
- Cloud Custodian (installed in the backend container)

## Installation

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cloud-custodian-ui.git
cd cloud-custodian-ui
```

2. Start the application:
```bash
docker-compose up -d
```

3. Access the UI at http://localhost

### Manual Setup

#### Backend

1. Navigate to the backend directory:
```bash
cd cloud-custodian-ui/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Upgrade pip (recommended):
```bash
python -m pip install --upgrade pip
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. If you encounter issues with c7n installation, you can try:
```bash
pip install c7n==0.9.45  # Use the latest available version
```

6. Start the FastAPI server using the run script:
```bash
python run.py
```

   Alternatively, you can use uvicorn directly:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

1. Navigate to the frontend directory:
```bash
cd cloud-custodian-ui/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Access the UI at http://localhost:3000

## AWS Credentials

The application uses AWS credentials for accessing resources and running policies. These credentials are:
- Used only for the duration of your session
- Never stored permanently on the server
- Transmitted securely between the frontend and backend

You'll need an AWS access key and secret key with sufficient permissions for the services you want to monitor.

## SSO Authentication

The application supports Single Sign-On (SSO) with the following identity providers:
- Azure Active Directory
- Okta
- AWS SSO

### Configuring SSO

1. Set up your application in the identity provider of your choice and obtain:
   - Client ID
   - Client Secret
   - Domain/Tenant information

2. Configure the following environment variables in your backend:

```bash
# Enable/disable SSO
SSO_ENABLED=true

# Default SSO provider (azure, okta, or aws)
SSO_DEFAULT_PROVIDER=azure

# Allow both SSO and AWS credentials (true/false)
USE_LEGACY_AUTH=true

# Session timeout in seconds
SSO_SESSION_TIMEOUT=3600

# JWT secret for token signing
JWT_SECRET=your-secure-secret-key

# SSO redirect URI
SSO_REDIRECT_URI=http://localhost:3000/auth/callback

# Azure AD configuration
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# Okta configuration
OKTA_CLIENT_ID=your-okta-client-id
OKTA_CLIENT_SECRET=your-okta-client-secret
OKTA_DOMAIN=your-okta-domain

# AWS SSO configuration
AWS_SSO_CLIENT_ID=your-aws-sso-client-id
AWS_SSO_CLIENT_SECRET=your-aws-sso-client-secret
AWS_SSO_DOMAIN=your-aws-sso-domain
```

3. Restart the backend service to apply the changes

### Integrating with Custom Identity Providers

The SSO implementation can be extended to support additional identity providers beyond the default Azure AD, Okta, and AWS SSO options:

1. **Add Provider Configuration**:
   - Open `backend/app/services/auth_service.py`
   - Add a new entry to the `SSO_PROVIDERS` dictionary with your custom provider's configuration

2. **Implement Token Exchange**:
   - Update the `exchange_token` method in `backend/app/routers/auth.py`
   - Add logic for your custom provider in the token exchange and user info retrieval sections

3. **Add Provider UI**:
   - The frontend automatically picks up new SSO providers from the backend configuration
   - Customize the provider name and any specific login button styling in the Login component

4. **Role Mapping**:
   - Define how your custom provider's user roles or groups map to the application roles
   - Update the role-based access control logic as needed

Example Custom Provider Configuration:

```python
"custom": SSOProvider(
    name="Custom IdP",
    auth_url="https://{domain}/oauth/authorize",
    token_url="https://{domain}/oauth/token",
    jwks_url="https://{domain}/.well-known/jwks.json",
    client_id=os.getenv("CUSTOM_CLIENT_ID", ""),
    client_secret=os.getenv("CUSTOM_CLIENT_SECRET", ""),
    domain=os.getenv("CUSTOM_DOMAIN", ""),
    scope="openid profile email",
    redirect_uri=os.getenv("SSO_REDIRECT_URI", "http://localhost:3000/auth/callback"),
),
```

### Advanced Authentication Scenarios

For more complex authentication scenarios, consider the following options:

1. **Multi-Factor Authentication**: Most identity providers support MFA out-of-the-box. No additional implementation is needed in the application as this is handled at the IdP level.

2. **Federation with Multiple Providers**: You can enable multiple SSO providers simultaneously, allowing users to choose their preferred authentication method.

3. **Custom Claims and Attributes**: Extend the token payload handling to capture additional user attributes from identity providers for more granular access control.

4. **JWT Token Verification**: For production, implement proper JWT verification using the provider's JWKS endpoint rather than simple decoding.

## SSO Implementation Summary

The SSO integration provides the following capabilities:

1. **Multiple Authentication Options**:
   - Traditional AWS credential-based authentication
   - Single Sign-On with enterprise identity providers
   - Configurable option to support both methods simultaneously

2. **Supported Identity Providers**:
   - Azure Active Directory
   - Okta
   - AWS SSO (IAM Identity Center)
   - Extensible framework for custom providers

3. **Security Features**:
   - JWT token-based session management
   - Role-based access control (RBAC)
   - Permission-based authorization for API endpoints
   - Configurable session timeout

4. **User Experience**:
   - Seamless login flow with identity provider of choice
   - Clear user context display showing authentication status
   - Intuitive UI that adapts based on authentication method

5. **Integration**:
   - Standard OAuth 2.0 authorization code flow
   - JWT token verification
   - Role mapping between identity providers and application permissions

This implementation ensures enterprise-grade security while maintaining the application's existing functionality, providing a flexible authentication system that can adapt to various organizational requirements.

### Role-Based Access Control

The application supports role-based access control with the following roles:
- `admin`: Full access to all features
- `user`: Can view resources and run policies, but cannot modify settings
- `readonly`: Can only view resources and dashboard information

Roles are determined based on the user's SSO identity and can be mapped to specific permissions within the application.

## Security and Access Control

### Authentication Methods

The application supports two authentication methods:

1. **AWS Credentials**: Users can authenticate with AWS access key, secret key, and optional session token.
   - These credentials are used only for the session duration
   - They are never stored in a database or persisted between sessions
   - They're securely transmitted between the frontend and backend using HTTPS

2. **Single Sign-On (SSO)**: Enterprise users can authenticate via their organization's identity provider.
   - Supports Azure Active Directory, Okta, and AWS SSO
   - Uses standard OAuth 2.0 protocols and JWT tokens
   - Provides seamless authentication within the organization's security framework

### Authorization Model

With SSO authentication enabled, the application uses role-based access control (RBAC):

| Role | Permissions |
|------|-------------|
| Admin | Full access to all features including modifying settings |
| User | Can view resources and run policies, but cannot modify system settings |
| ReadOnly | Can only view resources and dashboard information, cannot run policies |

When a user authenticates via SSO, their role is determined based on claims provided by the identity provider. This role then governs what actions they can perform within the application.

### Policy-Based Access Control

When integrating with Cloud Custodian policies, access control can be further refined:

1. **Resource-Level Access**: Limit which AWS resources specific roles can view or manage
2. **Policy-Level Access**: Control which Cloud Custodian policies specific roles can execute
3. **Action-Level Access**: Restrict what actions users can take on resources (view, tag, terminate, etc.)

These granular permissions enable organizations to implement least-privilege access models while still providing users with the capabilities they need to manage cloud resources effectively.

## Usage

1. **Authentication**:
   - **AWS Credentials**: Enter your AWS access key, secret key, and optional session token
   - **SSO Login**: Or click on your configured identity provider (Azure AD, Okta, AWS SSO)
2. **Dashboard**: View a summary of your AWS resources
3. **Resources**: Browse resources by service, filter by tags or other properties
4. **Policies**: View available Cloud Custodian policies
5. **Run Policy**: Select a policy to execute against your AWS account
6. **View Results**: See which resources matched the policy conditions

## Policies

The application comes with example policies for:
- Security compliance (e.g., finding public S3 buckets)
- Cost optimization (e.g., identifying unused resources)
- Tag compliance (e.g., enforcing tagging standards)
- Operational tasks (e.g., scheduling resource shutdowns)

You can extend these by adding more YAML files to the backend/app/policies directory.

## Development

### Adding New Policies

1. Create a new YAML file in `backend/app/policies/[category]/your-policy.yml`
2. Follow the Cloud Custodian policy format:
```yaml
policies:
  - name: your-policy-name
    resource: aws.resource-type
    description: Description of what your policy does
    filters:
      - type: filter-type
        key: some-key
        value: some-value
    actions:
      - type: action-type
```

### Adding New AWS Services

1. Extend the AWS service class in `backend/app/services/aws_service.py`
2. Add a new method to fetch resources for that service
3. Add the service to the UI in `frontend/src/pages/ResourcesPage.js`

## Security Considerations

- AWS credentials are transmitted but never stored permanently
- SSO sessions use secure JWT tokens with configurable expiration
- All API calls use HTTPS with proper TLS
- No sensitive data is logged
- Role-based access control prevents unauthorized actions

## License

MIT License

## Troubleshooting

### Common Installation Issues

1. **Cloud Custodian (c7n) Installation Errors**:
   - If you see `No matching distribution found for c7n==0.9.46`, try installing an earlier version:
     ```bash
     pip install c7n==0.9.45
     ```
   - Alternatively, you can install Cloud Custodian from source:
     ```bash
     git clone https://github.com/cloud-custodian/cloud-custodian.git
     cd cloud-custodian
     pip install -e .
     ```

2. **Boto3 Version Conflict with c7n**:
   - If you see dependency conflicts between boto3 and c7n, modify requirements.txt to use a compatible version range:
     ```
     boto3>=1.12.31,<2.0.0
     ```
   - Also remove any explicit PyYAML version as c7n has a specific requirement for PyYAML version.

3. **OpenSSL Issues**:
   - If you encounter errors related to OpenSSL or 'X509_V_FLAG_NOTIFY_POLICY' attribute, install pyOpenSSL:
     ```bash
     pip install pyOpenSSL --upgrade
     ```
   - This package is now included in the requirements.txt.

4. **'uvicorn' command not found**:
   - Use the Python module syntax instead:
     ```bash
     python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
     ```
   - Or use the provided run.py script:
     ```bash
     python run.py
     ```

3. **Frontend build issues**:
   - Make sure Node.js version is compatible (recommend v16 or higher)
   - Clear npm cache if needed:
     ```bash
     npm cache clean --force
     ```

### Docker Issues

1. **Docker container not starting**:
   - Check Docker logs:
     ```bash
     docker-compose logs
     ```
   - Ensure ports 80 and 8000 are not already in use

2. **Container can't connect to internet**:
   - Check your network settings and proxy configuration
   - Verify firewall settings allow Docker containers to connect

### Docker SSO Configuration

To enable SSO in the Docker Compose environment:

1. Create a `.env` file in the project root with your SSO configuration:

```env
# SSO Configuration
SSO_ENABLED=true
SSO_DEFAULT_PROVIDER=azure
USE_LEGACY_AUTH=true
SSO_SESSION_TIMEOUT=3600
JWT_SECRET=your-secure-secret-key
SSO_REDIRECT_URI=http://localhost/auth/callback

# Azure AD SSO
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id

# Okta SSO
OKTA_CLIENT_ID=your-client-id
OKTA_CLIENT_SECRET=your-client-secret
OKTA_DOMAIN=your-okta-domain

# AWS SSO
AWS_SSO_CLIENT_ID=your-client-id
AWS_SSO_CLIENT_SECRET=your-client-secret
AWS_SSO_DOMAIN=your-sso-domain
```

2. Uncomment and update the SSO environment variables in `docker-compose.yml`:

```yaml
environment:
  - PORT=8000
  - HOST=0.0.0.0
  - RELOAD=False
  # SSO Configuration
  - SSO_ENABLED=${SSO_ENABLED}
  - SSO_DEFAULT_PROVIDER=${SSO_DEFAULT_PROVIDER}
  - USE_LEGACY_AUTH=${USE_LEGACY_AUTH}
  - SSO_SESSION_TIMEOUT=${SSO_SESSION_TIMEOUT}
  - JWT_SECRET=${JWT_SECRET}
  - SSO_REDIRECT_URI=${SSO_REDIRECT_URI}
  # Identity Provider Configuration
  - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
  - AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}
  - AZURE_TENANT_ID=${AZURE_TENANT_ID}
  # Add other provider variables as needed
```

3. Restart the Docker containers:

```bash
docker-compose down
docker-compose up -d
```

4. SSO login should now be available in the UI

### Testing SSO Integration

To test the SSO integration:

1. **Setup a Development Identity Provider**:
   - For Azure AD: Use Azure AD B2C or create a free developer account
   - For Okta: Create a free developer account at https://developer.okta.com/
   - For AWS SSO: Use AWS IAM Identity Center in a test AWS account

2. **Register an Application**:
   - Configure a new application in your chosen IdP
   - Set the redirect URI to `http://localhost:3000/auth/callback` (or your custom URL)
   - Note the client ID, client secret, and other required configuration values

3. **Set Environment Variables**:
   - Configure the necessary environment variables as described in the SSO Configuration section
   - Ensure `SSO_ENABLED=true` and `USE_LEGACY_AUTH=true` during testing

4. **Start the Application**:
   - Start both backend and frontend services
   - Navigate to the login page

5. **Verify SSO Flow**:
   - Click on an SSO provider button
   - Complete the authentication flow with your IdP
   - Confirm successful redirection back to the dashboard
   - Verify that user information is displayed correctly

6. **Test Role-Based Access**:
   - Configure different user roles in your IdP
   - Test access to different features based on role assignments
   - Verify that permission restrictions are enforced correctly

For troubleshooting:
- Check the browser's developer console for frontend errors
- Review backend logs for authentication and token exchange issues
- Verify that redirect URIs match exactly between your app configuration and IdP settings

## Future SSO Enhancements

Potential future improvements to the SSO implementation:

1. **Advanced JWT Verification**:
   - Implement JWKS-based signature validation
   - Add support for token revocation and refresh flows
   - Enhance security with additional claims validation

2. **Advanced Role Management**:
   - Create a UI for mapping IdP groups/roles to application roles
   - Support for custom role definitions
   - Fine-grained permission management

3. **Multi-Account Support**:
   - Map SSO users to specific AWS accounts/roles
   - Support for AWS account federation via SAML
   - Role-based access to multiple AWS accounts

4. **Audit and Compliance**:
   - Enhanced logging of authentication events
   - Authentication activity dashboard
   - Compliance reporting for access control

5. **User Management**:
   - Add user profile management
   - Support for user preferences and settings
   - Enhanced session management

## Acknowledgements

- [Cloud Custodian](https://cloudcustodian.io/) for the policy engine
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
