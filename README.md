# Cloud Custodian UI

A modern, full-stack web application for interacting with AWS resources and running Cloud Custodian policies through a user-friendly interface.

## Features

- **AWS Integration**: Connect to AWS services using your credentials (never stored permanently)
- **Resource Management**: View, filter, and manage resources across multiple AWS services
- **Policy Execution**: Run and monitor Cloud Custodian policies through a clean UI
- **Resource Insights**: Identify unused resources, tag compliance issues, and more
- **Dashboard Views**: Interactive charts and tables for resource visualization

## Screenshots

*(Placeholder - screenshots would be added here after deployment)*

## Tech Stack

### Frontend
- React
- Tailwind CSS
- Chart.js for visualizations
- React Router for navigation
- Axios for API calls

### Backend
- FastAPI (Python)
- Boto3 for AWS interactions
- Cloud Custodian for policy execution
- YAML for policy definitions

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

## Usage

1. **Login**: Enter your AWS credentials on the login screen
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
- All API calls use HTTPS
- No sensitive data is logged

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

## Acknowledgements

- [Cloud Custodian](https://cloudcustodian.io/) for the policy engine
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
