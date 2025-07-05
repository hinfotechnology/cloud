import boto3
import logging
from typing import Dict, List, Any
from app.schemas.aws import AWSCredentials, ResourceSummary

logger = logging.getLogger(__name__)

class AWSService:
    """Service for interacting with AWS resources"""
    
    def __init__(self, credentials: AWSCredentials):
        """Initialize with AWS credentials"""
        self.credentials = credentials
        self.session = None
        
    def _get_session(self):
        """Create boto3 session with credentials"""
        if not self.session:
            self.session = boto3.Session(
                aws_access_key_id=self.credentials.access_key,
                aws_secret_access_key=self.credentials.secret_key,
                region_name=self.credentials.region,
                aws_session_token=self.credentials.session_token
            )
        return self.session
        
    async def validate_credentials(self) -> bool:
        """Validate AWS credentials by making a simple STS call"""
        try:
            session = self._get_session()
            sts = session.client('sts')
            response = sts.get_caller_identity()
            return True
        except Exception as e:
            logger.error(f"Error validating credentials: {str(e)}")
            return False
            
    async def get_resource_summary(self) -> Dict[str, Any]:
        """Get summary of AWS resources across multiple services"""
        session = self._get_session()
        summary = {}
        
        # Get EC2 instances
        try:
            ec2 = session.resource('ec2')
            instances = list(ec2.instances.all())
            summary['ec2'] = {
                'count': len(instances),
                'running': len([i for i in instances if i.state['Name'] == 'running']),
                'stopped': len([i for i in instances if i.state['Name'] == 'stopped'])
            }
        except Exception as e:
            logger.error(f"Error getting EC2 summary: {str(e)}")
            summary['ec2'] = {'error': str(e)}
            
        # Get S3 buckets
        try:
            s3 = session.resource('s3')
            buckets = list(s3.buckets.all())
            summary['s3'] = {
                'count': len(buckets)
            }
        except Exception as e:
            logger.error(f"Error getting S3 summary: {str(e)}")
            summary['s3'] = {'error': str(e)}
            
        # Get RDS instances
        try:
            rds = session.client('rds')
            instances = rds.describe_db_instances()
            summary['rds'] = {
                'count': len(instances.get('DBInstances', []))
            }
        except Exception as e:
            logger.error(f"Error getting RDS summary: {str(e)}")
            summary['rds'] = {'error': str(e)}
            
        # Get Lambda functions
        try:
            lambda_client = session.client('lambda')
            functions = lambda_client.list_functions()
            summary['lambda'] = {
                'count': len(functions.get('Functions', []))
            }
        except Exception as e:
            logger.error(f"Error getting Lambda summary: {str(e)}")
            summary['lambda'] = {'error': str(e)}
            
        # Add more services as needed
        
        return summary
        
    async def get_resources(self, service: str) -> Dict[str, Any]:
        """Get detailed resources for a specific AWS service"""
        session = self._get_session()
        
        if service == 'ec2':
            ec2 = session.resource('ec2')
            instances = list(ec2.instances.all())
            return {
                'instances': [
                    {
                        'id': i.id,
                        'type': i.instance_type,
                        'state': i.state['Name'],
                        'public_ip': i.public_ip_address,
                        'private_ip': i.private_ip_address,
                        'launch_time': i.launch_time.isoformat() if hasattr(i, 'launch_time') else None,
                        'tags': {t['Key']: t['Value'] for t in i.tags or []}
                    }
                    for i in instances
                ]
            }
            
        elif service == 's3':
            s3 = session.resource('s3')
            return {
                'buckets': [
                    {
                        'name': b.name,
                        'creation_date': b.creation_date.isoformat() if hasattr(b, 'creation_date') else None
                    }
                    for b in s3.buckets.all()
                ]
            }
            
        elif service == 'rds':
            rds = session.client('rds')
            instances = rds.describe_db_instances()
            return {
                'instances': [
                    {
                        'id': i['DBInstanceIdentifier'],
                        'engine': i['Engine'],
                        'status': i['DBInstanceStatus'],
                        'size': i['DBInstanceClass'],
                        'storage': i['AllocatedStorage'],
                        'endpoint': i.get('Endpoint', {}).get('Address') if 'Endpoint' in i else None
                    }
                    for i in instances.get('DBInstances', [])
                ]
            }
            
        elif service == 'lambda':
            lambda_client = session.client('lambda')
            functions = lambda_client.list_functions()
            return {
                'functions': [
                    {
                        'name': f['FunctionName'],
                        'runtime': f['Runtime'],
                        'memory': f['MemorySize'],
                        'timeout': f['Timeout'],
                        'last_modified': f['LastModified']
                    }
                    for f in functions.get('Functions', [])
                ]
            }
        
        # Add more services as needed
        
        return {"error": f"Service {service} not supported"}
        
    async def get_resource_tags(self, service: str) -> Dict[str, List[str]]:
        """Get all tags used in a specific service"""
        session = self._get_session()
        tag_dict = {}
        
        if service == 'ec2':
            ec2 = session.resource('ec2')
            instances = list(ec2.instances.all())
            
            for instance in instances:
                if instance.tags:
                    for tag in instance.tags:
                        key = tag['Key']
                        value = tag['Value']
                        if key not in tag_dict:
                            tag_dict[key] = []
                        if value not in tag_dict[key]:
                            tag_dict[key].append(value)
        
        # Add more services as needed
                            
        return tag_dict
        
    async def get_service_cost(self, service: str) -> Dict[str, Any]:
        """Get cost data for a specific service"""
        session = self._get_session()
        
        try:
            cost_explorer = session.client('ce')
            
            # Map service name to Cost Explorer service key
            service_map = {
                'ec2': 'Amazon Elastic Compute Cloud - Compute',
                's3': 'Amazon Simple Storage Service',
                'rds': 'Amazon Relational Database Service',
                'lambda': 'AWS Lambda'
            }
            
            if service not in service_map:
                return {"error": f"Service {service} not supported for cost analysis"}
                
            service_name = service_map[service]
            
            # Get cost data for the last 30 days
            import datetime
            end = datetime.datetime.utcnow()
            start = end - datetime.timedelta(days=30)
            
            response = cost_explorer.get_cost_and_usage(
                TimePeriod={
                    'Start': start.strftime('%Y-%m-%d'),
                    'End': end.strftime('%Y-%m-%d')
                },
                Granularity='DAILY',
                Metrics=['UnblendedCost'],
                GroupBy=[
                    {
                        'Type': 'DIMENSION',
                        'Key': 'SERVICE'
                    }
                ],
                Filter={
                    'Dimensions': {
                        'Key': 'SERVICE',
                        'Values': [service_name]
                    }
                }
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting cost data: {str(e)}")
            return {"error": f"Error retrieving cost data: {str(e)}"}
