import boto3
import logging
import asyncio
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
        """Get summary of AWS resources across multiple services and regions concurrently."""
        session = self._get_session()
        
        try:
            ec2_main_client = session.client('ec2')
            all_regions = [region['RegionName'] for region in ec2_main_client.describe_regions()['Regions']]
        except Exception as e:
            logger.error(f"Failed to describe regions: {e}")
            all_regions = [session.region_name]

        def _get_ec2_summary_sync(region):
            try:
                regional_ec2 = boto3.resource('ec2', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                instances = list(regional_ec2.instances.all())
                return {'count': len(instances), 'running': len([i for i in instances if i.state['Name'] == 'running']), 'stopped': len([i for i in instances if i.state['Name'] == 'stopped']), 'error': None}
            except Exception as e:
                if 'UnauthorizedOperation' not in str(e) and 'AccessDenied' not in str(e):
                    return {'count': 0, 'running': 0, 'stopped': 0, 'error': f"{region}: Access denied or region not enabled."}
                return {'count': 0, 'running': 0, 'stopped': 0, 'error': None}

        def _get_rds_summary_sync(region):
            count = 0
            try:
                regional_rds = boto3.client('rds', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                paginator = regional_rds.get_paginator('describe_db_instances')
                for page in paginator.paginate():
                    count += len(page.get('DBInstances', []))
                return {'count': count, 'error': None}
            except Exception as e:
                if 'UnauthorizedOperation' not in str(e) and 'AccessDenied' not in str(e):
                    return {'count': 0, 'error': f"{region}: Access denied or region not enabled."}
                return {'count': 0, 'error': None}

        def _get_lambda_summary_sync(region):
            count = 0
            try:
                regional_lambda = boto3.client('lambda', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                paginator = regional_lambda.get_paginator('list_functions')
                for page in paginator.paginate():
                    count += len(page.get('Functions', []))
                return {'count': count, 'error': None}
            except Exception as e:
                if 'UnauthorizedOperation' not in str(e) and 'AccessDenied' not in str(e):
                    return {'count': 0, 'error': f"{region}: Access denied or region not enabled."}
                return {'count': 0, 'error': None}

        # Run blocking boto3 calls in separate threads
        ec2_tasks = [asyncio.to_thread(_get_ec2_summary_sync, r) for r in all_regions]
        rds_tasks = [asyncio.to_thread(_get_rds_summary_sync, r) for r in all_regions]
        lambda_tasks = [asyncio.to_thread(_get_lambda_summary_sync, r) for r in all_regions]

        ec2_results, rds_results, lambda_results = await asyncio.gather(
            asyncio.gather(*ec2_tasks),
            asyncio.gather(*rds_tasks),
            asyncio.gather(*lambda_tasks)
        )

        # Aggregate results
        summary_ec2 = {'count': sum(r['count'] for r in ec2_results), 'running': sum(r['running'] for r in ec2_results), 'stopped': sum(r['stopped'] for r in ec2_results)}
        ec2_errors = [r['error'] for r in ec2_results if r['error']]
        if ec2_errors: summary_ec2['error'] = "; ".join(ec2_errors)

        summary_rds = {'count': sum(r['count'] for r in rds_results)}
        rds_errors = [r['error'] for r in rds_results if r['error']]
        if rds_errors: summary_rds['error'] = "; ".join(rds_errors)

        summary_lambda = {'count': sum(r['count'] for r in lambda_results)}
        lambda_errors = [r['error'] for r in lambda_results if r['error']]
        if lambda_errors: summary_lambda['error'] = "; ".join(lambda_errors)

        try:
            s3 = session.resource('s3')
            summary_s3 = {'count': len(list(s3.buckets.all()))}
        except Exception as e:
            logger.error(f"Error getting S3 summary: {str(e)}")
            summary_s3 = {'error': str(e)}

        return {'ec2': summary_ec2, 'rds': summary_rds, 'lambda': summary_lambda, 's3': summary_s3}
        
    async def get_resources(self, service: str) -> Dict[str, Any]:
        """Get detailed resources for a specific AWS service across all regions concurrently."""
        session = self._get_session()
        
        try:
            ec2_main_client = session.client('ec2')
            all_regions = [region['RegionName'] for region in ec2_main_client.describe_regions()['Regions']]
        except Exception as e:
            logger.error(f"Failed to describe regions: {e}")
            all_regions = [session.region_name]

        def _get_regional_resources_sync(region):
            try:
                if service == 'ec2':
                    regional_ec2 = boto3.resource('ec2', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                    return [{'id': i.id, 'type': i.instance_type, 'state': i.state['Name'], 'public_ip': i.public_ip_address, 'private_ip': i.private_ip_address, 'launch_time': i.launch_time.isoformat() if hasattr(i, 'launch_time') else None, 'tags': {t['Key']: t['Value'] for t in i.tags or []}, 'region': region} for i in regional_ec2.instances.all()]
                elif service == 'rds':
                    regional_rds = boto3.client('rds', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                    paginator = regional_rds.get_paginator('describe_db_instances')
                    instances = []
                    for page in paginator.paginate():
                        instances.extend([{'id': i['DBInstanceIdentifier'], 'engine': i['Engine'], 'status': i['DBInstanceStatus'], 'size': i['DBInstanceClass'], 'storage': i['AllocatedStorage'], 'endpoint': i.get('Endpoint', {}).get('Address') if 'Endpoint' in i else None, 'region': region} for i in page.get('DBInstances', [])])
                    return instances
                elif service == 'lambda':
                    regional_lambda = boto3.client('lambda', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                    paginator = regional_lambda.get_paginator('list_functions')
                    functions = []
                    for page in paginator.paginate():
                        functions.extend([{'name': f['FunctionName'], 'runtime': f['Runtime'], 'memory': f['MemorySize'], 'timeout': f['Timeout'], 'last_modified': f['LastModified'], 'region': region} for f in page.get('Functions', [])])
                    return functions
            except Exception as e:
                if 'UnauthorizedOperation' not in str(e) and 'AccessDenied' not in str(e):
                    logger.warning(f"Could not get {service} resources in {region}: {str(e)}")
            return []

        if service == 's3':
            s3 = session.resource('s3')
            return {'buckets': [{'name': b.name, 'creation_date': b.creation_date.isoformat() if hasattr(b, 'creation_date') else None} for b in s3.buckets.all()]}

        if service in ['ec2', 'rds', 'lambda']:
            tasks = [asyncio.to_thread(_get_regional_resources_sync, r) for r in all_regions]
            results = await asyncio.gather(*tasks)
            flat_list = [item for sublist in results for item in sublist]
            return {'instances' if service in ['ec2', 'rds'] else 'functions': flat_list}

        return {"error": f"Service {service} not supported"}
        
    async def get_resource_tags(self, service: str) -> Dict[str, List[str]]:
        """Get all tags used in a specific service across all regions concurrently."""
        session = self._get_session()
        if service != 'ec2':
            return {}

        try:
            ec2_main_client = session.client('ec2')
            all_regions = [region['RegionName'] for region in ec2_main_client.describe_regions()['Regions']]
        except Exception as e:
            logger.error(f"Failed to describe regions for tag collection: {e}")
            all_regions = [session.region_name]

        def _get_tags_for_region_sync(region):
            tags = {}
            try:
                regional_ec2 = boto3.resource('ec2', aws_access_key_id=self.credentials.access_key, aws_secret_access_key=self.credentials.secret_key, region_name=region, aws_session_token=self.credentials.session_token)
                for instance in regional_ec2.instances.all():
                    if instance.tags:
                        for tag in instance.tags:
                            key, value = tag['Key'], tag['Value']
                            if key not in tags:
                                tags[key] = set()
                            tags[key].add(value)
            except Exception as e:
                if 'UnauthorizedOperation' not in str(e) and 'AccessDenied' not in str(e):
                    logger.warning(f"Could not get EC2 tags in {region}: {str(e)}")
            return tags

        tasks = [asyncio.to_thread(_get_tags_for_region_sync, r) for r in all_regions]
        results = await asyncio.gather(*tasks)
        
        # Aggregate tags
        final_tags = {}
        for regional_tags in results:
            for key, value_set in regional_tags.items():
                if key not in final_tags:
                    final_tags[key] = set()
                final_tags[key].update(value_set)
        
        return {key: list(value_set) for key, value_set in final_tags.items()}
        
    async def get_service_cost(self, service: str, period: str = None) -> Dict[str, Any]:
        """Get cost data for a specific service for different time periods
        
        Args:
            service: The AWS service name
            period: Time period for cost data ('1m', '3m', '6m', or None for all periods)
        """
        session = self._get_session()
        
        try:
            cost_explorer = session.client('ce')
            
            # Map service name to Cost Explorer service key
            service_map = {
                'ec2': 'Amazon Elastic Compute Cloud - Compute',
                's3': 'Amazon Simple Storage Service',
                'rds': 'Amazon Relational Database Service',
                'lambda': 'AWS Lambda',
                'ebs': 'Amazon Elastic Block Store',
                'cloudwatch': 'AmazonCloudWatch',
                'dynamodb': 'Amazon DynamoDB'
                # Add more services as needed
            }
            
            if service not in service_map:
                return {"error": f"Service {service} not supported for cost analysis"}
                
            service_name = service_map[service]
            
            # Get cost data for different time periods
            import datetime
            end = datetime.datetime.utcnow()
            
            # Define periods
            periods = {
                '1m': {'days': 30, 'name': 'Last Month', 'granularity': 'DAILY'},
                '3m': {'days': 90, 'name': 'Last 3 Months', 'granularity': 'MONTHLY'},
                '6m': {'days': 180, 'name': 'Last 6 Months', 'granularity': 'MONTHLY'}
            }
            
            results = {}
            
            # Determine which periods to process
            if period and period in periods:
                period_keys = [period]
            else:
                period_keys = list(periods.keys())
                
            for period_key in period_keys:
                period_info = periods[period_key]
                start = end - datetime.timedelta(days=period_info['days'])
                
                response = cost_explorer.get_cost_and_usage(
                    TimePeriod={
                        'Start': start.strftime('%Y-%m-%d'),
                        'End': end.strftime('%Y-%m-%d')
                    },
                    Granularity=period_info['granularity'],
                    Metrics=['UnblendedCost', 'UsageQuantity'],
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
                
                # Process the response to extract useful information
                time_periods = response.get('ResultsByTime', [])
                
                processed_data = {
                    'period': period_info['name'],
                    'start_date': start.strftime('%Y-%m-%d'),
                    'end_date': end.strftime('%Y-%m-%d'),
                    'data_points': []
                }
                
                total_cost = 0
                
                for time_period in time_periods:
                    period_start = time_period.get('TimePeriod', {}).get('Start')
                    period_end = time_period.get('TimePeriod', {}).get('End')
                    
                    groups = time_period.get('Groups', [])
                    
                    if groups:
                        for group in groups:
                            metrics = group.get('Metrics', {})
                            cost = float(metrics.get('UnblendedCost', {}).get('Amount', 0))
                            total_cost += cost
                            
                            data_point = {
                                'start_date': period_start,
                                'end_date': period_end,
                                'cost': cost,
                                'unit': metrics.get('UnblendedCost', {}).get('Unit', 'USD')
                            }
                            
                            processed_data['data_points'].append(data_point)
                    
                processed_data['total_cost'] = total_cost
                results[period_key] = processed_data
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting cost data: {str(e)}")
            return {"error": f"Error retrieving cost data: {str(e)}"}
        
    async def get_resource_details(self, service: str) -> Dict[str, Any]:
        """Get detailed features and information for a specific AWS service"""
        session = self._get_session()
        details = {}
        
        try:
            if service == 'ec2':
                # EC2 detailed info
                ec2 = session.resource('ec2')
                client = session.client('ec2')
                
                # Get instance details
                instances = list(ec2.instances.all())
                instance_details = []
                
                for instance in instances:
                    try:
                        instance_info = {
                            'id': instance.id,
                            'instance_type': instance.instance_type,
                            'state': instance.state['Name'],
                            'launch_time': instance.launch_time.isoformat() if hasattr(instance, 'launch_time') else None,
                            'public_ip': instance.public_ip_address,
                            'private_ip': instance.private_ip_address,
                            'vpc_id': instance.vpc_id,
                            'subnet_id': instance.subnet_id,
                            'tags': {t['Key']: t['Value'] for t in instance.tags} if instance.tags else {},
                            'security_groups': [sg['GroupName'] for sg in instance.security_groups] if hasattr(instance, 'security_groups') else [],
                            'iam_profile': instance.iam_instance_profile['Arn'] if instance.iam_instance_profile else None,
                            'platform': instance.platform,
                            'architecture': instance.architecture,
                            'root_device_name': instance.root_device_name,
                            'root_device_type': instance.root_device_type
                        }
                        instance_details.append(instance_info)
                    except Exception as e:
                        logger.error(f"Error getting details for instance {instance.id}: {str(e)}")
                        instance_details.append({'id': instance.id, 'error': str(e)})
                
                # Get VPC details
                vpcs = list(ec2.vpcs.all())
                vpc_details = []
                
                for vpc in vpcs:
                    try:
                        vpc_info = {
                            'id': vpc.id,
                            'cidr_block': vpc.cidr_block,
                            'is_default': vpc.is_default,
                            'tags': {t['Key']: t['Value'] for t in vpc.tags} if vpc.tags else {}
                        }
                        vpc_details.append(vpc_info)
                    except Exception as e:
                        logger.error(f"Error getting details for VPC {vpc.id}: {str(e)}")
                        vpc_details.append({'id': vpc.id, 'error': str(e)})
                
                # Get Security Group details
                security_groups = list(ec2.security_groups.all())
                sg_details = []
                
                for sg in security_groups:
                    try:
                        sg_info = {
                            'id': sg.id,
                            'name': sg.group_name,
                            'description': sg.description,
                            'vpc_id': sg.vpc_id,
                            'inbound_rules': [
                                {
                                    'protocol': rule.get('IpProtocol'),
                                    'from_port': rule.get('FromPort'),
                                    'to_port': rule.get('ToPort'),
                                    'ip_ranges': [r.get('CidrIp') for r in rule.get('IpRanges', [])]
                                }
                                for rule in sg.ip_permissions
                            ],
                            'tags': {t['Key']: t['Value'] for t in sg.tags} if sg.tags else {}
                        }
                        sg_details.append(sg_info)
                    except Exception as e:
                        logger.error(f"Error getting details for Security Group {sg.id}: {str(e)}")
                        sg_details.append({'id': sg.id, 'error': str(e)})
                
                details = {
                    'instances': instance_details,
                    'vpcs': vpc_details,
                    'security_groups': sg_details
                }
                
            elif service == 's3':
                # S3 detailed info
                s3 = session.resource('s3')
                client = session.client('s3')
                
                buckets = list(s3.buckets.all())
                bucket_details = []
                
                for bucket in buckets:
                    try:
                        # Get bucket info
                        location = client.get_bucket_location(Bucket=bucket.name)
                        region = location['LocationConstraint'] or 'us-east-1'
                        
                        # Get bucket policy status
                        policy_status = {'public': False}
                        try:
                            policy_status = client.get_bucket_policy_status(Bucket=bucket.name).get('PolicyStatus', {'public': False})
                        except Exception:
                            pass
                        
                        # Get encryption
                        encryption = {'enabled': False}
                        try:
                            encryption_config = client.get_bucket_encryption(Bucket=bucket.name)
                            encryption = {
                                'enabled': True, 
                                'type': encryption_config.get('ServerSideEncryptionConfiguration', {}).get('Rules', [{}])[0].get('ServerSideEncryptionByDefault', {}).get('SSEAlgorithm')
                            }
                        except Exception:
                            pass
                            
                        bucket_info = {
                            'name': bucket.name,
                            'creation_date': bucket.creation_date.isoformat() if hasattr(bucket, 'creation_date') else None,
                            'region': region,
                            'public': policy_status.get('IsPublic', False),
                            'encryption': encryption,
                            'versioning': bucket.Versioning().status if hasattr(bucket, 'Versioning') else 'Disabled',
                        }
                        bucket_details.append(bucket_info)
                    except Exception as e:
                        logger.error(f"Error getting details for bucket {bucket.name}: {str(e)}")
                        bucket_details.append({'name': bucket.name, 'error': str(e)})
                
                details = {
                    'buckets': bucket_details
                }
                
            elif service == 'rds':
                # RDS detailed info
                client = session.client('rds')
                
                instances = client.describe_db_instances()
                instance_details = []
                
                for instance in instances.get('DBInstances', []):
                    try:
                        instance_info = {
                            'id': instance['DBInstanceIdentifier'],
                            'engine': instance['Engine'],
                            'engine_version': instance['EngineVersion'],
                            'status': instance['DBInstanceStatus'],
                            'endpoint': instance.get('Endpoint', {}).get('Address'),
                            'port': instance.get('Endpoint', {}).get('Port'),
                            'storage': {
                                'type': instance.get('StorageType'),
                                'size': instance.get('AllocatedStorage'),
                                'encrypted': instance.get('StorageEncrypted', False)
                            },
                            'instance_type': instance.get('DBInstanceClass'),
                            'multi_az': instance.get('MultiAZ', False),
                            'publicly_accessible': instance.get('PubliclyAccessible', False),
                            'vpc_id': instance.get('DBSubnetGroup', {}).get('VpcId')
                        }
                        instance_details.append(instance_info)
                    except Exception as e:
                        logger.error(f"Error getting details for RDS instance {instance.get('DBInstanceIdentifier')}: {str(e)}")
                        instance_details.append({'id': instance.get('DBInstanceIdentifier'), 'error': str(e)})
                
                details = {
                    'instances': instance_details
                }
                
            elif service == 'lambda':
                # Lambda detailed info
                client = session.client('lambda')
                
                response = client.list_functions()
                function_details = []
                
                for func in response.get('Functions', []):
                    try:
                        function_info = {
                            'name': func['FunctionName'],
                            'runtime': func['Runtime'],
                            'memory': func['MemorySize'],
                            'timeout': func['Timeout'],
                            'last_modified': func['LastModified'],
                            'handler': func['Handler'],
                            'version': func['Version'],
                            'role': func['Role'],
                            'code_size': func['CodeSize'],
                            'description': func.get('Description', '')
                        }
                        function_details.append(function_info)
                    except Exception as e:
                        logger.error(f"Error getting details for Lambda function {func.get('FunctionName')}: {str(e)}")
                        function_details.append({'name': func.get('FunctionName'), 'error': str(e)})
                
                details = {
                    'functions': function_details
                }
            
            elif service == 'iam':
                # IAM detailed info
                client = session.client('iam')
                
                # Get users
                users_response = client.list_users()
                user_details = []
                
                for user in users_response.get('Users', []):
                    try:
                        # Get user groups
                        groups_response = client.list_groups_for_user(UserName=user['UserName'])
                        groups = [g['GroupName'] for g in groups_response.get('Groups', [])]
                        
                        # Get user policies
                        policies_response = client.list_attached_user_policies(UserName=user['UserName'])
                        policies = [p['PolicyName'] for p in policies_response.get('AttachedPolicies', [])]
                        
                        user_info = {
                            'name': user['UserName'],
                            'id': user['UserId'],
                            'arn': user['Arn'],
                            'created': user['CreateDate'].isoformat(),
                            'password_last_used': user.get('PasswordLastUsed', '').isoformat() if user.get('PasswordLastUsed') else None,
                            'groups': groups,
                            'policies': policies
                        }
                        user_details.append(user_info)
                    except Exception as e:
                        logger.error(f"Error getting details for IAM user {user.get('UserName')}: {str(e)}")
                        user_details.append({'name': user.get('UserName'), 'error': str(e)})
                
                # Get roles
                roles_response = client.list_roles()
                role_details = []
                
                for role in roles_response.get('Roles', []):
                    try:
                        role_info = {
                            'name': role['RoleName'],
                            'id': role['RoleId'],
                            'arn': role['Arn'],
                            'created': role['CreateDate'].isoformat(),
                            'description': role.get('Description', ''),
                            'trust_policy': role.get('AssumeRolePolicyDocument', {})
                        }
                        role_details.append(role_info)
                    except Exception as e:
                        logger.error(f"Error getting details for IAM role {role.get('RoleName')}: {str(e)}")
                        role_details.append({'name': role.get('RoleName'), 'error': str(e)})
                
                details = {
                    'users': user_details,
                    'roles': role_details
                }
                
            else:
                return {'error': f'Detailed features for {service} not implemented'}
        
        except Exception as e:
            logger.error(f"Error getting detailed features for {service}: {str(e)}")
            return {'error': str(e)}
            
        return details
